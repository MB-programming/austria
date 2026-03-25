/**
 * Austria Appointment Bot - Content Script
 * Automatically fills Austrian embassy appointment forms
 */

(async function () {
  'use strict';

  console.log('[AustriaBot] Extension loaded');

  // Wait for settings from popup
  chrome.storage.local.get(['botSettings', 'botEnabled', 'personData'], async function(data) {
    if (!data.botEnabled) {
      console.log('[AustriaBot] Bot is disabled');
      return;
    }

    if (!data.botSettings || !data.personData) {
      console.log('[AustriaBot] Settings not configured yet');
      return;
    }

    const CFG = data.botSettings;
    const P = data.personData;

    // Add rootUrl for navigation
    CFG.rootUrl = 'https://appointment.bmeia.gv.at/';

    console.log('[AustriaBot] Starting automation with settings:', CFG);

    // ── Infinite Reload Protection ────────────────────────────────────────────
    const RELOAD_LIMIT = 5; // Max consecutive reloads before full refresh
    const RELOAD_TIMEOUT = 60000; // Reset counter after 60s

    function incrementReloadCounter() {
      const now = Date.now();
      const data = sessionStorage.getItem('austriaBot_reloads');
      let reloadData = data ? JSON.parse(data) : { count: 0, lastReload: now };

      // Reset if last reload was more than 60s ago
      if (now - reloadData.lastReload > RELOAD_TIMEOUT) {
        reloadData = { count: 0, lastReload: now };
      }

      reloadData.count++;
      reloadData.lastReload = now;
      sessionStorage.setItem('austriaBot_reloads', JSON.stringify(reloadData));

      return reloadData.count;
    }

    function resetReloadCounter() {
      sessionStorage.removeItem('austriaBot_reloads');
    }

    function safeReload() {
      const count = incrementReloadCounter();

      if (count >= RELOAD_LIMIT) {
        logErr(`⚠️ Infinite reload detected! (${count} reloads in ${RELOAD_TIMEOUT/1000}s)`);
        log('Performing full page refresh to break the loop...');
        resetReloadCounter();
        // Full page refresh (clears all state)
        window.location.href = window.location.href;
      } else {
        log(`Reloading... (${count}/${RELOAD_LIMIT})`);
        location.reload();
      }
    }

    // ── Utilities ─────────────────────────────────────────────────────────────
    const wait = ms => new Promise(r => setTimeout(r, ms));
    const log = msg => console.log('[AustriaBot] ' + msg);
    const logErr = msg => console.error('[AustriaBot] ERROR: ' + msg);

    // Find field by id, then by name, then by ASP.NET postback name (ends with $Id)
    const findEl = (id) =>
      document.getElementById(id) ||
      document.querySelector('[name="' + id + '"]') ||
      document.querySelector('[name$="$' + id + '"]');

    /**
     * Simulate a realistic mouse click on an element
     * @param {HTMLElement} element - The element to click
     */
    function simulateMouseClick(element) {
      if (!element) return false;

      // Get element position for realistic coordinates
      const rect = element.getBoundingClientRect();
      const x = rect.left + rect.width / 2;
      const y = rect.top + rect.height / 2;

      // Create realistic mouse event properties
      const mouseEventInit = {
        bubbles: true,
        cancelable: true,
        view: window,
        detail: 1,
        screenX: window.screenX + x,
        screenY: window.screenY + y,
        clientX: x,
        clientY: y,
        ctrlKey: false,
        altKey: false,
        shiftKey: false,
        metaKey: false,
        button: 0, // Left mouse button
        buttons: 1,
        relatedTarget: null
      };

      // Dispatch full mouse event sequence (mousedown → mouseup → click)
      element.dispatchEvent(new MouseEvent('mousedown', mouseEventInit));
      element.dispatchEvent(new MouseEvent('mouseup', mouseEventInit));
      element.dispatchEvent(new MouseEvent('click', mouseEventInit));

      return true;
    }

    // ── Audio alarm (Web Audio API — no external deps) ────────────────────────
    let alarmTimer = null;
    let _slotTaken = false;

    function playBeep() {
      try {
        const ctx = new (window.AudioContext || window.webkitAudioContext)();
        const now = ctx.currentTime;

        function tone(freq, start, dur, vol, type) {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.frequency.value = freq;
          osc.type = type || 'sine';
          gain.gain.setValueAtTime(vol, now + start);
          gain.gain.exponentialRampToValueAtTime(0.001, now + start + dur);
          osc.start(now + start);
          osc.stop(now + start + dur + 0.01);
        }

        const snd = CFG.notificationSound || 'beep';

        if (snd === 'beep') {
          tone(880, 0, 0.18, 0.55);
          tone(1100, 0.22, 0.18, 0.55);
          tone(880, 0.44, 0.18, 0.55);
        } else if (snd === 'chime') {
          tone(523, 0, 0.35, 0.5);
          tone(659, 0.18, 0.35, 0.5);
          tone(784, 0.36, 0.45, 0.5);
        } else if (snd === 'alert') {
          [0, 0.12, 0.24, 0.36, 0.48].forEach(t => tone(1400, t, 0.09, 0.6, 'square'));
        } else if (snd === 'ding') {
          tone(1047, 0, 0.6, 0.7);
          tone(1319, 0, 0.3, 0.3);
        }
      } catch (_) {}
    }

    function startAlarm() {
      playBeep();
      if (alarmTimer) clearInterval(alarmTimer);
      alarmTimer = setInterval(playBeep, 2500);
    }

    function stopAlarm() {
      clearInterval(alarmTimer);
      alarmTimer = null;
    }

    // ── Page detection ────────────────────────────────────────────────────────
    function detectPage() {
      const path = location.pathname;
      const search = location.search;
      const text = (document.getElementById('main') || document.body).innerText || '';

      // Personal data form
      if (
        document.getElementById('Lastname') ||
        document.querySelector('[name$="$Lastname"]') ||
        document.querySelector('[name*="Lastname"]') ||
        document.getElementById('TraveldocumentNumber') ||
        document.querySelector('[name$="$TraveldocumentNumber"]') ||
        document.getElementById('DSGVOAccepted')
      ) return 'form';

      // Scheduler
      if (
        document.querySelector('input[type="radio"][name="Start"]') ||
        /\/HomeWeb\/Scheduler/i.test(path) ||
        /\/Scheduler/i.test(path) ||
        /no appointments available/i.test(text) ||
        /keine termine/i.test(text) ||
        /unfortunately no appointment/i.test(text)
      ) return 'scheduler';

      // Info page
      if (/fromspecificinfo=true/i.test(search)) return 'info';
      if (
        /\/Info/i.test(path) ||
        /\/Instructions/i.test(path) ||
        (/information|instructions|hinweise/i.test(text) &&
          document.querySelector('input[type="submit"]'))
      ) return 'info';

      // Calendar
      const calEl = document.getElementById('CalendarId');
      if (calEl && calEl.tagName === 'SELECT') return 'calendar';

      // Number of persons
      if (document.getElementById('PersonCount')) return 'persons';

      // Office
      const offEl = document.getElementById('Office');
      if (offEl && offEl.tagName === 'SELECT') return 'office';

      return 'unknown';
    }

    // ── Submit helpers ────────────────────────────────────────────────────────
    function submitNext(delayMs) {
      setTimeout(() => {
        const allSubmits = [
          ...Array.from(document.querySelectorAll('input[type="submit"]')),
          ...Array.from(document.querySelectorAll('button[type="submit"]')),
          ...Array.from(document.querySelectorAll('button')),
        ];
        const btn =
          allSubmits.find(b => /^next$/i.test((b.value || b.textContent || '').trim())) ||
          allSubmits.find(b => /next|weiter|continue|إرسال|submit/i.test(b.value || b.textContent || '')) ||
          allSubmits[0];

        if (!btn) { logErr('Next button not found'); return; }
        log('Clicking next: "' + (btn.value || btn.textContent || '').trim() + '"');

        // Primary method: form.requestSubmit (matches desktop behavior)
        const form = btn.form || document.querySelector('form');
        if (form && form.requestSubmit) {
          form.requestSubmit(btn);
        } else {
          // Fallback: direct click
          btn.click();
        }
      }, delayMs || 800);
    }

    function pickByText(selectEl, keyword) {
      if (!selectEl || selectEl.tagName !== 'SELECT') return false;
      const kw = keyword.trim().toUpperCase();
      const opt = Array.from(selectEl.options).find(
        o => o.value !== '0' && o.text.trim().toUpperCase().includes(kw)
      );
      if (!opt) return false;
      selectEl.value = opt.value;
      selectEl.dispatchEvent(new Event('change', { bubbles: true }));
      return opt.text.trim();
    }

    // ── State: Office selection ───────────────────────────────────────────────
    function handleOffice() {
      const sel = document.getElementById('Office');
      const chosen = pickByText(sel, CFG.office);
      if (chosen) {
        log('Office selected → ' + chosen);
        submitNext(CFG.navDelay);
      } else {
        const retryS = Math.max(1, CFG.navRetryIntervalSec || 5);
        log('NAV_RETRY:office:' + retryS);
        setTimeout(() => safeReload(), retryS * 1000);
      }
    }

    // ── State: Calendar / service type selection ──────────────────────────────
    function handleCalendar() {
      const sel = document.getElementById('CalendarId');
      const chosen = pickByText(sel, CFG.reservationType);
      if (chosen) {
        log('Reservation type selected → ' + chosen);
        submitNext(CFG.navDelay);
      } else {
        const retryS = Math.max(1, CFG.navRetryIntervalSec || 5);
        log('NAV_RETRY:calendar:' + retryS);
        setTimeout(() => safeReload(), retryS * 1000);
      }
    }

    // ── State: Number of persons ──────────────────────────────────────────────
    function handlePersons() {
      const sel = document.getElementById('PersonCount');
      if (!sel) { logErr('PersonCount not found'); return; }
      sel.value = '1';
      sel.dispatchEvent(new Event('change', { bubbles: true }));
      log('PersonCount → 1');
      submitNext(CFG.navDelay);
    }

    // ── State: Information / instructions page ────────────────────────────────
    function handleInfo() {
      log('Info page — clicking Next');
      submitNext(CFG.navDelay);
    }

    // ── State: Appointment slot calendar ─────────────────────────────────────
    function handleScheduler() {
      const slots = Array.from(document.querySelectorAll('input[type="radio"][name="Start"]'));

      if (slots.length === 0) {
        const wait_s = Math.max(1, CFG.refreshIntervalSec || 30);
        log('NO_APPOINTMENTS — Reloading in ' + wait_s + 's');

        let remaining = Math.floor(wait_s);
        const tick = setInterval(() => {
          remaining--;
          if (remaining > 0) {
            log('COUNTDOWN:' + remaining);
          } else {
            log('COUNTDOWN:0 — Reloading...');
            clearInterval(tick);
            safeReload();
          }
        }, 1000);
        return;
      }

      // Slot found!
      startAlarm();
      log('🎉 APPOINTMENT SLOTS FOUND! Total: ' + slots.length);

      // Pick slot based on preference
      let slot = null;
      if (_slotTaken) {
        slot = slots[0];
        _slotTaken = false;
        log('RETRY_AFTER_SLOT_TAKEN — selecting first available slot');
      } else {
        const prefs = CFG.slotPreferences || ['random'];
        for (const pref of prefs) {
          if (!pref || pref === 'none') continue;
          if (pref === 'random') { slot = slots[Math.floor(Math.random() * slots.length)]; break; }
          if (pref === 'any') { slot = slots[0]; break; }
          const idx = parseInt(pref) - 1;
          if (!isNaN(idx) && idx >= 0 && idx < slots.length) { slot = slots[idx]; break; }
        }
        if (!slot) slot = slots[0];
      }

      slot.checked = true;
      slot.dispatchEvent(new Event('change', { bubbles: true }));
      log('Appointment slot selected → ' + slot.value);
      submitNext(CFG.navDelay);
    }

    // ── State: Personal data form ─────────────────────────────────────────────
    async function handleForm() {
      stopAlarm();

      const setVal = (id, val) => {
        if (!val) return;
        const el = findEl(id);
        if (!el) { log('Field not found: ' + id); return; }
        el.value = val;
        el.dispatchEvent(new Event('input', { bubbles: true }));
        el.dispatchEvent(new Event('change', { bubbles: true }));
      };

      const pickOpt = (id, labelText, fallbackCode) => {
        const sel = findEl(id);
        if (!sel) { log('Select not found: ' + id); return; }
        const label = (labelText || '').trim().toUpperCase();
        const opt =
          Array.from(sel.options).find(o => o.text.trim().toUpperCase() === label) ||
          Array.from(sel.options).find(o => o.text.trim().toUpperCase().includes(label)) ||
          Array.from(sel.options).find(o => String(o.value) === String(fallbackCode));
        if (opt) sel.value = opt.value;
        sel.dispatchEvent(new Event('change', { bubbles: true }));
      };

      const sexLabel = (P.sex || 'Male').charAt(0).toUpperCase() + (P.sex || 'Male').slice(1).toLowerCase();
      const sexCode = (P.sex || '').toLowerCase() === 'female' ? 2 : 1;

      setVal('Lastname', P.lastname);
      setVal('Firstname', P.firstname);
      setVal('DateOfBirth', P.dateOfBirth);
      setVal('TraveldocumentNumber', P.passportNumber);
      pickOpt('Sex', sexLabel, sexCode);
      setVal('Street', P.street);
      setVal('Postcode', P.postcode);
      setVal('City', P.city);
      pickOpt('Country', P.country, P.countryCode);
      setVal('Telephone', P.telephone);
      setVal('Email', P.email);
      setVal('LastnameAtBirth', P.lastnameAtBirth || P.lastname);
      pickOpt('NationalityAtBirth', P.nationality, P.nationalityCode);
      pickOpt('CountryOfBirth', P.nationality, P.nationalityCode);
      setVal('PlaceOfBirth', P.placeOfBirth);
      pickOpt('NationalityForApplication', P.nationality, P.nationalityCode);
      setVal('TraveldocumentDateOfIssue', P.passportIssueDate);
      setVal('TraveldocumentValidUntil', P.passportExpiry);

      // Passport issuing authority - try multiple approaches
      const authorityField = findEl('TraveldocumentIssuingAuthority');
      if (authorityField && authorityField.tagName === 'SELECT') {
        log('Setting passport issuing authority...');
        pickOpt('TraveldocumentIssuingAuthority', P.nationality, P.nationalityCode);
        // Verify it was selected
        const selectedAuthority = authorityField.options[authorityField.selectedIndex]?.text;
        log('  → Authority selected: ' + (selectedAuthority || 'none'));
      }

      // GDPR consent
      const gdpr = findEl('DSGVOAccepted');
      if (gdpr && !gdpr.checked) gdpr.click();

      log('Form filled — solving CAPTCHA…');
      await solveCaptcha();
    }

    // ── CAPTCHA solver (GPT-4o vision) — with auto-retry ─────────────────────
    async function solveCaptcha() {
      const findInput = () =>
        findEl('CaptchaText') ||
        document.querySelector('input[name="CaptchaText"]') ||
        document.querySelector('input[name$="$CaptchaText"]');

      if (!findInput()) {
        log('No CAPTCHA field — submitting form');
        submitNext(CFG.navDelay);
        // After main submit, wait and look for a confirmation Next (second Next)
        setTimeout(async () => {
          if (document.querySelector('input[type="submit"], button[type="submit"]')) {
            log('Confirmation page — clicking Next again');
            submitNext(CFG.navDelay);
          }
        }, CFG.navDelay + 1500);
        return;
      }

      if (!CFG.openaiApiKey) {
        findInput().focus();
        log('No OpenAI key — manual CAPTCHA required');
        findInput().style.border = '3px solid #00ff88';
        findInput().style.boxShadow = '0 0 10px #00ff88';
        return;
      }

      // Helper: read captcha image as base64
      const readCaptchaBase64 = async () => {
        const img = document.querySelector('#Captcha_CaptchaImage') ||
                    document.querySelector('img[src*="BotDetectCaptcha"]') ||
                    document.querySelector('img[src*="captcha" i]') ||
                    document.querySelector('img[alt*="captcha" i]');
        if (!img) return null;
        return new Promise(resolve => {
          const draw = () => {
            try {
              const c = document.createElement('canvas');
              c.width  = img.naturalWidth  || img.width  || 250;
              c.height = img.naturalHeight || img.height || 60;
              c.getContext('2d').drawImage(img, 0, 0);
              resolve(c.toDataURL('image/png').split(',')[1]);
            } catch (_) { resolve(null); }
          };
          img.complete ? draw() : (img.onload = draw, img.onerror = () => resolve(null));
        });
      };

      const MAX_ATTEMPTS = 4;
      for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
        log('CAPTCHA attempt ' + attempt + '/' + MAX_ATTEMPTS + '…');
        await wait(1200);

        const base64 = await readCaptchaBase64();
        if (!base64) {
          logErr('CAPTCHA image not found — manual entry required');
          const inp = findInput();
          if (inp) {
            inp.focus();
            inp.style.border = '3px solid #ff4444';
            inp.style.boxShadow = '0 0 10px #ff4444';
          }
          return;
        }

        let cleaned = '';
        try {
          const res = await fetch('https://api.openai.com/v1/chat/completions', {
            method:  'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + CFG.openaiApiKey },
            body: JSON.stringify({
              model: 'gpt-4o',
              messages: [{ role: 'user', content: [
                { type: 'text',      text: 'This is a CAPTCHA image. Reply with ONLY the characters visible. No spaces, no explanation.' },
                { type: 'image_url', image_url: { url: 'data:image/png;base64,' + base64 } }
              ]}],
              max_tokens: 20,
              temperature: 0.1
            })
          });
          const data = await res.json();
          if (data.error) throw new Error(data.error.message);
          const raw = data.choices?.[0]?.message?.content || '';
          cleaned = raw.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
          if (!cleaned) throw new Error('Empty GPT response');
        } catch (e) {
          logErr('CAPTCHA API error: ' + e.message);
          if (attempt === MAX_ATTEMPTS) {
            const inp = findInput();
            if (inp) {
              inp.focus();
              inp.style.border = '3px solid #ff4444';
              inp.style.boxShadow = '0 0 10px #ff4444';
            }
            logErr('All attempts failed — manual entry required');
          }
          continue;
        }

        // Type CAPTCHA character by character (simulate human typing)
        const inp = findInput();
        if (!inp) return;
        inp.focus();
        inp.value = '';
        inp.dispatchEvent(new Event('input', { bubbles: true }));

        for (const ch of cleaned) {
          const keyCode = ch.charCodeAt(0);

          inp.dispatchEvent(new KeyboardEvent('keydown', {
            key: ch,
            code: 'Key' + ch.toUpperCase(),
            keyCode: keyCode,
            which: keyCode,
            bubbles: true
          }));

          inp.value += ch;
          inp.dispatchEvent(new Event('input', { bubbles: true }));

          inp.dispatchEvent(new KeyboardEvent('keyup', {
            key: ch,
            code: 'Key' + ch.toUpperCase(),
            keyCode: keyCode,
            which: keyCode,
            bubbles: true
          }));

          await wait(80 + Math.random() * 80);   // 80–160ms per character
        }
        inp.dispatchEvent(new Event('change', { bubbles: true }));
        log('CAPTCHA typed → ' + cleaned);

        // Submit the form
        await wait(500);
        submitNext(CFG.navDelay);

        // Wait for page response, then check if captcha was rejected
        await wait(CFG.navDelay + 2000);

        const pageText = (document.getElementById('main') || document.body).innerText || '';
        const stillHasCaptcha = !!findInput();
        const captchaError = /incorrect|wrong|invalid|ungültig|fehler|error/i.test(pageText);

        if (!stillHasCaptcha) {
          // Navigated away — captcha accepted
          log('CAPTCHA accepted — proceeding…');
          // Check for a second confirmation Next button
          await wait(800);
          if (document.querySelector('input[type="submit"], button[type="submit"]')) {
            log('Confirmation page — clicking Next again');
            submitNext(CFG.navDelay);
          }
          return;
        }

        if (stillHasCaptcha && attempt < MAX_ATTEMPTS) {
          log('CAPTCHA:RETRY:' + attempt + ' — re-filling form and retrying…');
          // Re-fill all form fields before the next attempt
          await refillFormFields();
          continue;
        }
      }

      // All attempts exhausted
      const inp = findInput();
      if (inp) {
        inp.focus();
        inp.style.border = '3px solid #ff4444';
        inp.style.boxShadow = '0 0 10px #ff4444';
      }
      logErr('CAPTCHA failed ' + MAX_ATTEMPTS + ' times — manual entry required');
    }

    // Re-fill form fields only (no captcha call) — used on retry
    async function refillFormFields() {
      const setVal = (id, val) => {
        if (!val) return;
        const el = findEl(id);
        if (!el) return;
        el.value = val;
        el.dispatchEvent(new Event('input',  { bubbles: true }));
        el.dispatchEvent(new Event('change', { bubbles: true }));
      };
      const pickOpt = (id, labelText, fallbackCode) => {
        const sel = findEl(id);
        if (!sel) return;
        const label = (labelText || '').trim().toUpperCase();
        const opt =
          Array.from(sel.options).find(o => o.text.trim().toUpperCase() === label) ||
          Array.from(sel.options).find(o => o.text.trim().toUpperCase().includes(label)) ||
          Array.from(sel.options).find(o => String(o.value) === String(fallbackCode));
        if (opt) sel.value = opt.value;
        sel.dispatchEvent(new Event('change', { bubbles: true }));
      };
      const sexLabel = (P.sex || 'Male').charAt(0).toUpperCase() + (P.sex || 'Male').slice(1).toLowerCase();
      const sexCode  = (P.sex || '').toLowerCase() === 'female' ? 2 : 1;
      setVal('Lastname', P.lastname);           setVal('Firstname', P.firstname);
      setVal('DateOfBirth', P.dateOfBirth);     setVal('TraveldocumentNumber', P.passportNumber);
      pickOpt('Sex', sexLabel, sexCode);
      setVal('Street', P.street);               setVal('Postcode', P.postcode);
      setVal('City', P.city);                   pickOpt('Country', P.country, P.countryCode);
      setVal('Telephone', P.telephone);         setVal('Email', P.email);
      setVal('LastnameAtBirth', P.lastnameAtBirth || P.lastname);
      pickOpt('NationalityAtBirth', P.nationality, P.nationalityCode);
      pickOpt('CountryOfBirth',     P.nationality, P.nationalityCode);
      setVal('PlaceOfBirth', P.placeOfBirth);
      pickOpt('NationalityForApplication', P.nationality, P.nationalityCode);
      setVal('TraveldocumentDateOfIssue', P.passportIssueDate);
      setVal('TraveldocumentValidUntil',  P.passportExpiry);
      pickOpt('TraveldocumentIssuingAuthority', P.nationality, P.nationalityCode);
      const gdpr = findEl('DSGVOAccepted');
      if (gdpr && !gdpr.checked) gdpr.click();
      log('Form re-filled for retry');
    }

    // ── State: Unknown / confirmation ─────────────────────────────────────────
    function handleUnknown() {
      const text = (document.getElementById('main') || document.body).innerText || '';

      // Check for successful booking confirmation
      if (/confirmation|bestätigung|erfolgreich|successfully|booked|reserved/i.test(text)) {
        log('BOOKING CONFIRMED! Alarm started.');
        startAlarm();
        setTimeout(stopAlarm, 30000);
        return;
      }

      // Check for "slot already taken / no longer available" errors
      if (/already.*(booked|taken|reserved)|no longer available|nicht mehr verfügbar|bereits gebucht|slot.*taken|not.*available|محجوز بالفعل|غير متاح/i.test(text)) {
        log('SLOT_ALREADY_TAKEN — returning to scheduler to select next available slot');
        _slotTaken = true;  // flag: next scheduler page will pick first available slot
        stopAlarm();
        setTimeout(() => {
          location.href = CFG.rootUrl;  // navigate back to start
        }, 800);
        return;
      }

      log('Unknown page — waiting...');
    }

    // ── Main loop ─────────────────────────────────────────────────────────────
    async function run() {
      await wait(500);
      const page = detectPage();
      log('Page detected: ' + page);

      if (page === 'office') handleOffice();
      else if (page === 'calendar') handleCalendar();
      else if (page === 'persons') handlePersons();
      else if (page === 'info') handleInfo();
      else if (page === 'scheduler') handleScheduler();
      else if (page === 'form') handleForm();
      else handleUnknown();
    }

    // Start the bot!
    run();
  });

})();
