const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const Store = require('electron-store');

const store = new Store();

let mainWindow = null;
let botWindow  = null;

// ─── Main window ───────────────────────────────────────────────────────────
function createMainWindow() {
  mainWindow = new BrowserWindow({
    width: 920, height: 720,
    minWidth: 800, minHeight: 600,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    },
    title: 'Austria Appointment Bot',
    backgroundColor: '#0f0f1a'
  });

  mainWindow.loadFile(path.join(__dirname, 'renderer', 'index.html'));

  if (process.argv.includes('--dev')) {
    mainWindow.webContents.openDevTools();
  }

  mainWindow.on('closed', () => { mainWindow = null; });
}

// ─── IPC handlers ──────────────────────────────────────────────────────────
ipcMain.handle('get-settings', () => store.store);

ipcMain.handle('save-settings', (_, data) => {
  Object.entries(data).forEach(([k, v]) => store.set(k, v));
  return { success: true };
});

ipcMain.handle('bot-status', () => ({ running: botWindow !== null }));

ipcMain.handle('stop-bot', () => {
  if (botWindow) { botWindow.close(); botWindow = null; }
  return { success: true };
});

ipcMain.handle('start-bot', async (_, config) => {
  if (botWindow) { botWindow.focus(); return { success: false, message: 'Bot already running' }; }

  botWindow = new BrowserWindow({
    width: 1200, height: 850,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: false,   // lets injected scripts run freely
      webSecurity: true
    },
    title: 'Bot — Austria Appointment'
  });

  // Forward bot console.log lines that start with [AustriaBot] to the UI
  botWindow.webContents.on('console-message', (_, level, message) => {
    if (!message.startsWith('[AustriaBot]')) return;
    if (!mainWindow || mainWindow.isDestroyed()) return;
    const type = level >= 3 ? 'error' : level === 2 ? 'warn' : 'success';
    mainWindow.webContents.send('bot-log', { type, message });
  });

  // Inject state-machine script on every fresh page load
  botWindow.webContents.on('dom-ready', () => {
    const url = botWindow.webContents.getURL();
    if (!url.includes('appointment.bmeia.gv.at')) return;
    botWindow.webContents.executeJavaScript(buildScript(config)).catch(e => {
      console.error('[main] inject error:', e.message);
    });
  });

  botWindow.loadURL(config.targetUrl || 'https://appointment.bmeia.gv.at/');

  botWindow.on('closed', () => {
    botWindow = null;
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('bot-stopped');
    }
  });

  return { success: true };
});

// ─── Injection script builder ──────────────────────────────────────────────
function buildScript(config) {
  const p  = config.person   || {};
  const s  = config.settings || {};

  // Embed all config values directly so the script is self-contained
  const CFG = {
    office:             s.office             || 'KAIRO',
    reservationType:    s.reservationType    || 'Bachelor',
    refreshIntervalSec: s.refreshIntervalSec || 30,
    openaiApiKey:       s.openaiApiKey       || '',
    rootUrl:            config.targetUrl     || 'https://appointment.bmeia.gv.at/'
  };

  return `(function () {
  'use strict';

  // ── Config (embedded at build time) ──────────────────────────────────────
  const CFG = ${JSON.stringify(CFG)};
  const P   = ${JSON.stringify(p)};

  // ── Utilities ─────────────────────────────────────────────────────────────
  const wait   = ms => new Promise(r => setTimeout(r, ms));
  const log    = msg => console.log('[AustriaBot] ' + msg);
  const logErr = msg => console.error('[AustriaBot] ERROR: ' + msg);

  // ── Audio alarm (Web Audio API — no external deps) ────────────────────────
  let alarmTimer = null;

  function playBeep() {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      [[880, 0], [1100, 0.22], [880, 0.44]].forEach(([freq, t]) => {
        const osc  = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.frequency.value = freq;
        osc.type = 'sine';
        gain.gain.setValueAtTime(0.55, ctx.currentTime + t);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + t + 0.18);
        osc.start(ctx.currentTime + t);
        osc.stop(ctx.currentTime + t + 0.22);
      });
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
    const path   = location.pathname;
    const search = location.search;

    // 1. Scheduler (appointment slot calendar)
    if (/\\/HomeWeb\\/Scheduler/i.test(path)) return 'scheduler';

    // 2. Info / instructions page (comes before the slot calendar)
    if (/fromspecificinfo=true/i.test(search)) return 'info';

    // 3. Personal data form (has Lastname input)
    if (document.getElementById('Lastname')) return 'form';

    // 4. Calendar / service type selection (CalendarId is a visible SELECT)
    const calEl = document.getElementById('CalendarId');
    if (calEl && calEl.tagName === 'SELECT') return 'calendar';

    // 5. Number of persons page (PersonCount select; CalendarId is now hidden)
    if (document.getElementById('PersonCount')) return 'persons';

    // 6. Office / representation selection (Office is a visible SELECT)
    const offEl = document.getElementById('Office');
    if (offEl && offEl.tagName === 'SELECT') return 'office';

    return 'unknown';
  }

  // ── Submit helpers ────────────────────────────────────────────────────────
  function submitNext(delayMs) {
    setTimeout(() => {
      // Look specifically for input[type=submit] with value "Next"
      const btn = Array.from(document.querySelectorAll('input[type="submit"]'))
                       .find(b => /^next$/i.test((b.value || '').trim()));
      if (!btn) { logErr('Next button not found'); return; }
      const form = btn.form || document.querySelector('form');
      if (form && form.requestSubmit) form.requestSubmit(btn);
      else btn.click();
    }, delayMs || 800);
  }

  function pickByText(selectEl, keyword) {
    if (!selectEl || selectEl.tagName !== 'SELECT') return false;
    const kw  = keyword.trim().toUpperCase();
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
      submitNext(700);
    } else {
      logErr('Office "' + CFG.office + '" not found in dropdown');
    }
  }

  // ── State: Calendar / service type selection ──────────────────────────────
  function handleCalendar() {
    const sel    = document.getElementById('CalendarId');
    const chosen = pickByText(sel, CFG.reservationType);
    if (chosen) {
      log('Reservation type selected → ' + chosen);
      submitNext(700);
    } else {
      logErr('Reservation type "' + CFG.reservationType + '" not found. Available: ' +
        Array.from(sel.options).slice(1).map(o => o.text.trim()).join(' | '));
    }
  }

  // ── State: Number of persons ──────────────────────────────────────────────
  function handlePersons() {
    const sel = document.getElementById('PersonCount');
    if (!sel) { logErr('PersonCount not found'); return; }
    sel.value = '1';
    sel.dispatchEvent(new Event('change', { bubbles: true }));
    log('PersonCount → 1');
    submitNext(700);
  }

  // ── State: Information / instructions page ────────────────────────────────
  function handleInfo() {
    log('Info page — clicking Next');
    submitNext(800);
  }

  // ── State: Appointment slot calendar ─────────────────────────────────────
  function handleScheduler() {
    const slots = Array.from(document.querySelectorAll('input[type="radio"][name="Start"]'));

    if (slots.length === 0) {
      const wait_s = Math.max(10, CFG.refreshIntervalSec);
      log('NO_APPOINTMENTS:' + wait_s);
      startAlarm();

      // Emit countdown every second so the UI can show it
      let remaining = wait_s;
      const tick = setInterval(() => {
        remaining--;
        if (remaining > 0) {
          log('COUNTDOWN:' + remaining);
        } else {
          clearInterval(tick);
        }
      }, 1000);

      setTimeout(() => {
        clearInterval(tick);
        stopAlarm();
        location.reload();           // stay on scheduler page, just refresh
      }, wait_s * 1000);
      return;
    }

    // Pick a random available slot
    const slot = slots[Math.floor(Math.random() * slots.length)];
    slot.checked = true;
    slot.dispatchEvent(new Event('change', { bubbles: true }));
    log('Appointment slot selected → ' + slot.value);
    submitNext(400);
  }

  // ── State: Personal data form ─────────────────────────────────────────────
  async function handleForm() {

    // Find field by id, then by name, then by ASP.NET postback name (ends with $Id)
    const findEl = (id) =>
      document.getElementById(id) ||
      document.querySelector('[name="' + id + '"]') ||
      document.querySelector('[name$="$' + id + '"]');

    const setVal = (id, val) => {
      if (!val) return;
      const el = findEl(id);
      if (!el) { log('Field not found: ' + id); return; }
      el.value = val;
      el.dispatchEvent(new Event('input',  { bubbles: true }));
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

    // Sex: map stored "Male"/"Female" → site text "Male"/"Female"
    const sexLabel = (P.sex || 'Male').charAt(0).toUpperCase() + (P.sex || 'Male').slice(1).toLowerCase();
    const sexCode  = (P.sex || '').toLowerCase() === 'female' ? 2 : 1;

    setVal('Lastname',                  P.lastname);
    setVal('Firstname',                 P.firstname);
    setVal('DateOfBirth',               P.dateOfBirth);
    setVal('TraveldocumentNumber',      P.passportNumber);
    pickOpt('Sex',                      sexLabel, sexCode);
    setVal('Street',                    P.street);
    setVal('Postcode',                  P.postcode);
    setVal('City',                      P.city);
    pickOpt('Country',                  P.country,    P.countryCode);
    setVal('Telephone',                 P.telephone);
    setVal('Email',                     P.email);
    setVal('LastnameAtBirth',           P.lastnameAtBirth || P.lastname);
    pickOpt('NationalityAtBirth',       P.nationality, P.nationalityCode);
    pickOpt('CountryOfBirth',           P.nationality, P.nationalityCode);
    setVal('PlaceOfBirth',              P.placeOfBirth);
    pickOpt('NationalityForApplication',P.nationality, P.nationalityCode);
    setVal('TraveldocumentDateOfIssue', P.passportIssueDate);
    setVal('TraveldocumentValidUntil',  P.passportExpiry);
    pickOpt('TraveldocumentIssuingAuthority', P.nationality, P.nationalityCode);

    // GDPR consent checkbox
    const gdpr = findEl('DSGVOAccepted');
    if (gdpr && !gdpr.checked) gdpr.click();

    log('Form filled — solving CAPTCHA…');
    await solveCaptcha();
  }

  // ── CAPTCHA solver (GPT-4o vision) ────────────────────────────────────────
  async function solveCaptcha() {
    const input = document.getElementById('CaptchaText') ||
                  document.querySelector('input[name="CaptchaText"]');
    if (!input) {
      log('No CAPTCHA field — submitting form');
      submitNext(400);
      return;
    }

    if (!CFG.openaiApiKey) {
      input.focus();
      log('No OpenAI key — manual CAPTCHA required');
      return;
    }

    await wait(1200);

    // Find captcha image
    const img = document.querySelector('#Captcha_CaptchaImage') ||
                document.querySelector('img[src*="BotDetectCaptcha"]') ||
                document.querySelector('img[src*="captcha" i]') ||
                document.querySelector('img[alt*="captcha" i]');

    if (!img) {
      input.focus();
      logErr('CAPTCHA image not found — manual entry required');
      return;
    }

    // Convert to base64 via canvas
    const base64 = await new Promise(resolve => {
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

    if (!base64) {
      input.focus();
      logErr('Could not read CAPTCHA image — manual entry required');
      return;
    }

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

      const raw     = data.choices?.[0]?.message?.content || '';
      const cleaned = raw.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();

      if (!cleaned) throw new Error('Empty GPT response');

      // Fill the CAPTCHA input
      input.value = cleaned;
      input.dispatchEvent(new Event('input',  { bubbles: true }));
      input.dispatchEvent(new Event('change', { bubbles: true }));
      log('CAPTCHA solved → ' + cleaned);

      await wait(400);
      submitNext(300);

    } catch (e) {
      input.focus();
      logErr('CAPTCHA solve failed: ' + e.message + ' — manual entry required');
    }
  }

  // ── State: Unknown / confirmation ─────────────────────────────────────────
  function handleUnknown() {
    const text = (document.getElementById('main') || document.body).innerText || '';
    if (/confirmation|bestätigung|erfolgreich|successfully|booked|reserved/i.test(text)) {
      log('BOOKING CONFIRMED! Alarm started.');
      startAlarm();
      setTimeout(stopAlarm, 30000);
    }
  }

  // ── Main router ───────────────────────────────────────────────────────────
  async function run() {
    await wait(900);
    const page = detectPage();
    log('Page detected: ' + page + ' | ' + location.href);

    if      (page === 'office')    handleOffice();
    else if (page === 'calendar')  handleCalendar();
    else if (page === 'persons')   handlePersons();
    else if (page === 'info')      handleInfo();
    else if (page === 'scheduler') handleScheduler();
    else if (page === 'form')      handleForm();
    else                           handleUnknown();
  }

  run();

})();`;
}

// ─── Electron lifecycle ────────────────────────────────────────────────────
app.whenReady().then(() => {
  createMainWindow();
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createMainWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
