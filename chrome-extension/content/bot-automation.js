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
          allSubmits.find(b => /next|weiter|continue|submit/i.test(b.value || b.textContent || '')) ||
          allSubmits[0];

        if (!btn) { logErr('Next button not found'); return; }
        log('Clicking next: "' + (btn.value || btn.textContent || '').trim() + '"');

        // Use realistic mouse click simulation
        simulateMouseClick(btn);

        // Backup: also try form.requestSubmit
        const form = btn.form || document.querySelector('form');
        if (form && form.requestSubmit) {
          setTimeout(() => form.requestSubmit(btn), 100);
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

      const findEl = (id) =>
        document.getElementById(id) ||
        document.querySelector('[name="' + id + '"]') ||
        document.querySelector('[name$="$' + id + '"]');

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

      log('Form filled successfully!');

      // Try to solve CAPTCHA with GPT-4 Vision if API key is available
      const captchaInput = findEl('CaptchaText');
      if (captchaInput) {
        if (CFG.openaiApiKey) {
          log('🤖 Attempting to solve CAPTCHA with GPT-4 Vision...');
          await solveCaptchaWithGPT4(captchaInput);
        } else {
          log('⚠️ CAPTCHA detected - Please solve manually and submit!');
          captchaInput.focus();
          captchaInput.style.border = '3px solid #00ff88';
          captchaInput.style.boxShadow = '0 0 10px #00ff88';
        }
      }
    }

    // ── CAPTCHA Solver with GPT-4 Vision ──────────────────────────────────────
    async function solveCaptchaWithGPT4(captchaInput) {
      try {
        log('🔍 Step 1: Finding CAPTCHA image...');

        // Find CAPTCHA image
        const captchaImg = document.querySelector('#Captcha_CaptchaImage') ||
                          document.querySelector('img[src*="BotDetectCaptcha"]') ||
                          document.querySelector('img[src*="captcha" i]');

        if (!captchaImg) {
          logErr('❌ CAPTCHA image not found');
          log('⚠️ Available images: ' + document.querySelectorAll('img').length);
          return;
        }

        log('✅ CAPTCHA image found: ' + captchaImg.src.substring(0, 50) + '...');

        // Wait for image to load
        if (!captchaImg.complete) {
          log('⏳ Waiting for image to load...');
          await new Promise((resolve, reject) => {
            captchaImg.onload = resolve;
            captchaImg.onerror = reject;
            setTimeout(reject, 5000); // 5s timeout
          });
        }

        log('🎨 Step 2: Converting image to base64...');

        // Convert image to base64
        const canvas = document.createElement('canvas');
        canvas.width = captchaImg.naturalWidth || captchaImg.width || 250;
        canvas.height = captchaImg.naturalHeight || captchaImg.height || 60;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(captchaImg, 0, 0);
        const base64Image = canvas.toDataURL('image/png').split(',')[1];

        log('✅ Image captured (' + canvas.width + 'x' + canvas.height + ')');
        log('📡 Step 3: Calling GPT-4 Vision API...');

        // Call OpenAI GPT-4 Vision API
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${CFG.openaiApiKey}`
          },
          body: JSON.stringify({
            model: 'gpt-4o',
            messages: [
              {
                role: 'user',
                content: [
                  {
                    type: 'text',
                    text: 'This is a CAPTCHA image. Please read the text/numbers in the image and return ONLY the CAPTCHA text, nothing else. No explanations, no formatting, just the raw text.'
                  },
                  {
                    type: 'image_url',
                    image_url: {
                      url: `data:image/png;base64,${base64Image}`
                    }
                  }
                ]
              }
            ],
            max_tokens: 50
          })
        });

        log('📥 API Response: ' + response.status + ' ' + response.statusText);

        if (!response.ok) {
          const errorBody = await response.text();
          logErr('API Error Body: ' + errorBody.substring(0, 200));
          throw new Error(`OpenAI API error: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        log('📦 API Response received');

        if (!data.choices || !data.choices[0] || !data.choices[0].message) {
          logErr('Invalid API response structure');
          log('Response: ' + JSON.stringify(data).substring(0, 200));
          throw new Error('Invalid API response');
        }

        const captchaText = data.choices[0].message.content.trim();

        log(`✅ CAPTCHA solved: "${captchaText}"`);
        log('✍️ Step 4: Filling CAPTCHA input (typing simulation)...');

        // Clear input first
        captchaInput.value = '';
        captchaInput.focus();

        // Type each character with human-like delay
        for (let i = 0; i < captchaText.length; i++) {
          const char = captchaText[i];

          // Simulate real keyboard events with key codes
          const keyCode = char.charCodeAt(0);

          // KeyDown event
          const keydownEvent = new KeyboardEvent('keydown', {
            key: char,
            code: 'Key' + char.toUpperCase(),
            keyCode: keyCode,
            which: keyCode,
            bubbles: true,
            cancelable: true
          });
          captchaInput.dispatchEvent(keydownEvent);

          // KeyPress event
          const keypressEvent = new KeyboardEvent('keypress', {
            key: char,
            keyCode: keyCode,
            which: keyCode,
            bubbles: true,
            cancelable: true
          });
          captchaInput.dispatchEvent(keypressEvent);

          // Add character
          captchaInput.value += char;

          // Input event
          captchaInput.dispatchEvent(new Event('input', { bubbles: true }));

          // KeyUp event
          const keyupEvent = new KeyboardEvent('keyup', {
            key: char,
            code: 'Key' + char.toUpperCase(),
            keyCode: keyCode,
            which: keyCode,
            bubbles: true,
            cancelable: true
          });
          captchaInput.dispatchEvent(keyupEvent);

          // Random human-like delay between 100-200ms (slower is more human)
          const delay = 100 + Math.random() * 100;
          await wait(delay);

          log(`  → Typed: "${captchaInput.value}" (${i + 1}/${captchaText.length})`);
        }

        // Final events after typing complete
        captchaInput.dispatchEvent(new Event('change', { bubbles: true }));
        captchaInput.dispatchEvent(new Event('blur', { bubbles: true }));

        log('  → Typing complete!');

        // Verify value was set
        await wait(300);
        const currentValue = captchaInput.value;
        log(`  → Final value: "${currentValue}"`);

        if (currentValue !== captchaText) {
          logErr('❌ Value mismatch! Expected: "' + captchaText + '", Got: "' + currentValue + '"');
        } else {
          log('  → ✅ Value verified correctly!');
        }

        log('📤 Step 5: Finding and clicking submit button...');

        // Find submit button - try multiple selectors
        const submitSelectors = [
          'input[type="submit"]',
          'button[type="submit"]',
          'input[type="submit"][value*="Next"]',
          'input[type="submit"][value*="Weiter"]',
          'button:contains("Next")',
          'button:contains("Submit")',
          '.btn-submit',
          '#submitButton'
        ];

        let submitBtn = null;
        for (const selector of submitSelectors) {
          submitBtn = document.querySelector(selector);
          if (submitBtn) {
            log(`  → Found button: ${selector}`);
            break;
          }
        }

        if (!submitBtn) {
          // Try finding by text content
          const allButtons = Array.from(document.querySelectorAll('button, input[type="submit"], input[type="button"]'));
          submitBtn = allButtons.find(btn => {
            const text = (btn.value || btn.textContent || '').toLowerCase();
            return text.includes('next') || text.includes('submit') || text.includes('weiter') || text.includes('send');
          });

          if (submitBtn) {
            log(`  → Found button by text: "${submitBtn.value || submitBtn.textContent}"`);
          }
        }

        if (!submitBtn) {
          logErr('❌ Submit button not found!');
          log('Available buttons: ' + document.querySelectorAll('button, input[type="submit"]').length);
          log('⚠️ Please click Submit manually');
          captchaInput.style.border = '3px solid #ffaa00';
          captchaInput.style.boxShadow = '0 0 10px #ffaa00';
          return;
        }

        log(`  → Submit button found: ${submitBtn.tagName} "${submitBtn.value || submitBtn.textContent || ''}"`);

        // Wait before submitting
        await wait(1000);

        log('🚀 Clicking submit button with mouse simulation...');

        // Primary method: Realistic mouse click simulation
        const mouseClicked = simulateMouseClick(submitBtn);
        if (mouseClicked) {
          log('  → ✅ Simulated realistic mouse click (mousedown → mouseup → click)');
        }

        // Backup method: Standard .click()
        await wait(300);
        try {
          submitBtn.click();
          log('  → ✅ Also called .click() as backup');
        } catch (e) {
          log('  → .click() failed: ' + e.message);
        }

        // Also try form.requestSubmit() if button has a form
        const form = submitBtn.form || document.querySelector('form');
        if (form) {
          await wait(500);
          log('  → Also found form, trying form.requestSubmit()');
          try {
            if (form.requestSubmit) {
              form.requestSubmit(submitBtn);
              log('  → ✅ Used form.requestSubmit()');
            } else {
              form.submit();
              log('  → ✅ Used form.submit()');
            }
          } catch (e) {
            log('  → Form submit failed: ' + e.message);
          }
        }

        log('✅ Form submission attempted!');
        log('⏳ Waiting for navigation...');

        // Wait and check for confirmation page
        await wait(3000);

        // Check if we're on a confirmation page that needs another Next click
        log('🔍 Checking for confirmation page...');

        const confirmationSelectors = [
          'input[type="submit"]',
          'button[type="submit"]',
          'input[value*="Next"]',
          'input[value*="Weiter"]',
          'button:contains("Next")'
        ];

        let confirmBtn = null;
        for (const selector of confirmationSelectors) {
          confirmBtn = document.querySelector(selector);
          if (confirmBtn) {
            const btnText = (confirmBtn.value || confirmBtn.textContent || '').trim();
            // Make sure it's not a "Back" button
            if (!btnText.toLowerCase().includes('back') &&
                !btnText.toLowerCase().includes('zurück')) {
              log(`  → Found confirmation button: "${btnText}"`);
              break;
            }
            confirmBtn = null;
          }
        }

        if (confirmBtn) {
          log('📄 Confirmation page detected!');
          log('🚀 Clicking final Next button with mouse simulation...');

          await wait(1000);

          // Primary method: Realistic mouse click
          const mouseClicked = simulateMouseClick(confirmBtn);
          if (mouseClicked) {
            log('  → ✅ Simulated realistic mouse click on confirmation button');
          }

          // Backup method: Standard .click()
          await wait(300);
          try {
            confirmBtn.click();
            log('  → ✅ Also called .click() on confirmation');
          } catch (e) {
            log('  → .click() failed: ' + e.message);
          }

          // Try form submit too
          const confirmForm = confirmBtn.form || document.querySelector('form');
          if (confirmForm) {
            await wait(500);
            try {
              if (confirmForm.requestSubmit) {
                confirmForm.requestSubmit(confirmBtn);
                log('  → ✅ Used form.requestSubmit() on confirmation');
              } else {
                confirmForm.submit();
                log('  → ✅ Used form.submit() on confirmation');
              }
            } catch (e) {
              log('  → Confirmation form submit: ' + e.message);
            }
          }

          log('✅ Confirmation submitted!');
          log('🎉 Booking should be complete now!');
        } else {
          log('  → No confirmation page detected');
          log('✅ Booking process complete!');
        }

      } catch (error) {
        logErr('❌ CAPTCHA solver failed: ' + error.message);
        log('Stack trace: ' + (error.stack || 'none'));
        log('⚠️ Please solve CAPTCHA manually');
        captchaInput.focus();
        captchaInput.style.border = '3px solid #ff4444';
        captchaInput.style.boxShadow = '0 0 10px #ff4444';
      }
    }

    // ── State: Unknown page ───────────────────────────────────────────────────
    function handleUnknown() {
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
