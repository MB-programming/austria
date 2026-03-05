const { app, BrowserWindow, ipcMain, shell } = require('electron');
const path  = require('path');
const https = require('https');
const Store = require('electron-store');

const store = new Store();

let mainWindow    = null;
let botWindow     = null;
let authWindow    = null;
let monitorWindow = null;
const sessionWindows = new Map(); // sessionId -> BrowserWindow
const terminalWindows = new Map(); // sessionId -> Terminal BrowserWindow

// ─── Auth window ────────────────────────────────────────────────────────────
function createAuthWindow() {
  authWindow = new BrowserWindow({
    width: 420, height: 560,
    resizable: false,
    frame: false,
    transparent: false,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload-auth.js')
    },
    title: 'تفعيل البوت',
    backgroundColor: '#0f0f1a'
  });

  authWindow.loadFile(path.join(__dirname, 'renderer', 'auth.html'));
  authWindow.on('closed', () => { authWindow = null; });
}

// ─── Key validation via HTTPS ────────────────────────────────────────────────
function fetchKeys(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(data));
    }).on('error', reject);
  });
}

ipcMain.handle('auth-validate', async (_, key) => {
  try {
    // Check if key was already used for a booking
    const usedKeys = store.get('usedKeys') || [];
    if (usedKeys.includes(key.trim())) {
      return { valid: false, message: 'هذا الرقم السري تم استخدامه — اطلب رقماً جديداً' };
    }

    const raw   = await fetchKeys('https://minaboules.com/valid-li/key.txt');
    const valid = raw.split('\n')
                     .map(l => l.trim())
                     .filter(Boolean)
                     .includes(key.trim());

    if (valid) {
      store.set('mode', 'full');
      store.set('currentKey', key.trim()); // save for later invalidation on booking success
      if (authWindow && !authWindow.isDestroyed()) authWindow.close();
      createMainWindow();
      return { valid: true };
    }

    return { valid: false, message: 'الرقم السري غير صحيح' };
  } catch (e) {
    return { valid: false, message: 'تعذّر التحقق — تحقق من الإنترنت' };
  }
});

ipcMain.handle('auth-trial', () => {
  store.set('mode', 'trial');
  if (authWindow && !authWindow.isDestroyed()) authWindow.close();
  createMainWindow();
  return { success: true };
});

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
    title: 'Orbtasoft',
    backgroundColor: '#0f0f1a'
  });

  mainWindow.loadFile(path.join(__dirname, 'renderer', 'index.html'));

  if (process.argv.includes('--dev')) {
    mainWindow.webContents.openDevTools();
  }

  mainWindow.on('closed', () => { mainWindow = null; });
}

// ─── IPC handlers ──────────────────────────────────────────────────────────
ipcMain.handle('open-external', (_, url) => shell.openExternal(url));

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
    title: 'Orbtasoft — Bot'
  });

  // Forward bot console.log lines that start with [AustriaBot] to the UI
  botWindow.webContents.on('console-message', (_, level, message) => {
    if (!message.startsWith('[AustriaBot]')) return;
    if (!mainWindow || mainWindow.isDestroyed()) return;
    const type = level >= 3 ? 'error' : level === 2 ? 'warn' : 'success';
    mainWindow.webContents.send('bot-log', { type, message });

    // Detect booking confirmed → invalidate key, notify renderer
    if (message.toLowerCase().includes('booking confirmed')) {
      const currentKey = store.get('currentKey');
      if (currentKey) {
        const usedKeys = store.get('usedKeys') || [];
        if (!usedKeys.includes(currentKey)) {
          store.set('usedKeys', [...usedKeys, currentKey]);
        }
        store.delete('currentKey');
      }
      store.set('mode', null); // require new key next launch
      // Notify renderer immediately so celebration shows
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send('booking-complete');
      }
      // Quit the entire app after 2 minutes
      setTimeout(() => {
        app.quit();
      }, 120000);
    }
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

// ─── Monitor IPC handlers ──────────────────────────────────────────────────
ipcMain.handle('monitor-status', () => ({ running: monitorWindow !== null }));

ipcMain.handle('stop-monitor', () => {
  if (monitorWindow) { monitorWindow.close(); monitorWindow = null; }
  return { success: true };
});

ipcMain.handle('start-monitor', async (_, config) => {
  if (monitorWindow) { monitorWindow.focus(); return { success: false, message: 'Monitor already running' }; }

  monitorWindow = new BrowserWindow({
    width: 1200, height: 850,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: false,
      webSecurity: true
    },
    title: 'Orbtasoft — Monitor'
  });

  monitorWindow.webContents.on('console-message', (_, level, message) => {
    if (!message.startsWith('[AustriaMonitor]')) return;
    if (!mainWindow || mainWindow.isDestroyed()) return;
    const type = level >= 3 ? 'error' : level === 2 ? 'warn' : 'success';
    mainWindow.webContents.send('monitor-log', { type, message });
  });

  monitorWindow.webContents.on('dom-ready', () => {
    const url = monitorWindow.webContents.getURL();
    if (!url.includes('appointment.bmeia.gv.at')) return;
    monitorWindow.webContents.executeJavaScript(buildMonitorScript(config)).catch(e => {
      console.error('[main] monitor inject error:', e.message);
    });
  });

  monitorWindow.loadURL(config.targetUrl || 'https://appointment.bmeia.gv.at/');

  monitorWindow.on('closed', () => {
    monitorWindow = null;
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('monitor-stopped');
    }
  });

  return { success: true };
});

// ─── Multi-session IPC handlers ────────────────────────────────────────────
ipcMain.handle('get-sessions', () => store.get('sessions') || []);

ipcMain.handle('save-sessions', (_, sessions) => {
  store.set('sessions', sessions);
  return { success: true };
});

ipcMain.handle('session-status', (_, id) => {
  const win = sessionWindows.get(id);
  return { running: !!(win && !win.isDestroyed()) };
});

ipcMain.handle('stop-session', (_, id) => {
  const win = sessionWindows.get(id);
  if (win && !win.isDestroyed()) win.close();
  sessionWindows.delete(id);

  // Also close terminal window
  const termWin = terminalWindows.get(id);
  if (termWin && !termWin.isDestroyed()) termWin.close();
  terminalWindows.delete(id);

  return { success: true };
});

ipcMain.handle('start-session', async (_, id, config) => {
  const existing = sessionWindows.get(id);
  if (existing && !existing.isDestroyed()) {
    return { success: false, message: 'Session already running' };
  }

  const isStealth = config.type === 'stealth';

  // Create terminal window for this session
  const termWin = new BrowserWindow({
    width: 800, height: 600,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload-terminal.js')
    },
    title: `Terminal — Session ${id}`,
    backgroundColor: '#0a0a0f'
  });

  termWin.loadFile(path.join(__dirname, 'renderer', 'session-terminal.html'), {
    query: { id: id }
  });

  terminalWindows.set(id, termWin);

  // Create session window
  const win = new BrowserWindow({
    width: 1200, height: 850,
    show: !isStealth,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: false,
      webSecurity: true
    },
    title: `Orbtasoft — Session ${id}${isStealth ? ' (Stealth)' : ''}`
  });

  sessionWindows.set(id, win);

  win.webContents.on('console-message', (_, level, message) => {
    if (!message.startsWith('[AustriaBot]')) return;

    // Send logs to terminal window instead of main window
    const termWin = terminalWindows.get(id);
    if (!termWin || termWin.isDestroyed()) return;

    const type = level >= 3 ? 'error' : level === 2 ? 'warn' : 'success';
    const cleanMessage = message.replace('[AustriaBot] ', '');
    termWin.webContents.send('terminal-log', type, cleanMessage);

    // Send also to main window for booking confirmation
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('session-log', { id, type, message });
    }

    if (message.toLowerCase().includes('booking confirmed')) {
      const currentKey = store.get('currentKey');
      if (currentKey) {
        const usedKeys = store.get('usedKeys') || [];
        if (!usedKeys.includes(currentKey)) store.set('usedKeys', [...usedKeys, currentKey]);
        store.delete('currentKey');
      }
      store.set('mode', null);
      if (mainWindow && !mainWindow.isDestroyed()) mainWindow.webContents.send('booking-complete');
      setTimeout(() => { app.quit(); }, 120000);
    }
  });

  win.webContents.on('dom-ready', () => {
    const url = win.webContents.getURL();
    if (!url.includes('appointment.bmeia.gv.at')) return;
    win.webContents.executeJavaScript(buildScript(config)).catch(e => {
      console.error(`[main] session ${id} inject error:`, e.message);
    });
  });

  win.loadURL(config.targetUrl || 'https://appointment.bmeia.gv.at/');

  win.on('closed', () => {
    sessionWindows.delete(id);

    // Also close terminal window
    const termWin = terminalWindows.get(id);
    if (termWin && !termWin.isDestroyed()) termWin.close();
    terminalWindows.delete(id);

    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('session-stopped', { id });
    }
  });

  // Also handle terminal window close
  termWin.on('closed', () => {
    terminalWindows.delete(id);
  });

  return { success: true };
});

// ─── Monitor script builder ────────────────────────────────────────────────
function buildMonitorScript(config) {
  const s = config.settings || {};

  const CFG = {
    office:             s.office             || 'KAIRO',
    reservationType:    s.reservationType    || 'Bachelor',
    refreshIntervalSec: s.refreshIntervalSec || 30,
    navDelay:           s.navigationDelayMs  || 800,
    rootUrl:            config.targetUrl     || 'https://appointment.bmeia.gv.at/',
    notificationSound:  s.notificationSound  || 'beep',
    customSoundB64:     s.customSoundB64     || ''
  };

  return `(function () {
  'use strict';

  const CFG = ${JSON.stringify(CFG)};

  const wait   = ms => new Promise(r => setTimeout(r, ms));
  const log    = msg => console.log('[AustriaMonitor] ' + msg);
  const logErr = msg => console.error('[AustriaMonitor] ERROR: ' + msg);

  // ── Audio alarm ───────────────────────────────────────────────────────────
  let alarmTimer = null;

  function playBeep() {
    try {
      if (CFG.notificationSound === 'custom' && CFG.customSoundB64) {
        const audio = new Audio(CFG.customSoundB64);
        audio.volume = 1;
        audio.play().catch(() => {});
        return;
      }
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const now = ctx.currentTime;
      function tone(freq, start, dur, vol, type) {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain); gain.connect(ctx.destination);
        osc.frequency.value = freq;
        osc.type = type || 'sine';
        gain.gain.setValueAtTime(vol, now + start);
        gain.gain.exponentialRampToValueAtTime(0.001, now + start + dur);
        osc.start(now + start);
        osc.stop(now + start + dur + 0.01);
      }
      const snd = CFG.notificationSound || 'beep';
      if (snd === 'beep')  { tone(880, 0, 0.18, 0.55); tone(1100, 0.22, 0.18, 0.55); tone(880, 0.44, 0.18, 0.55); }
      else if (snd === 'chime')  { tone(523, 0, 0.35, 0.5); tone(659, 0.18, 0.35, 0.5); tone(784, 0.36, 0.45, 0.5); }
      else if (snd === 'alert')  { [0, 0.12, 0.24, 0.36, 0.48].forEach(t => tone(1400, t, 0.09, 0.6, 'square')); }
      else if (snd === 'ding')   { tone(1047, 0, 0.6, 0.7); tone(1319, 0, 0.3, 0.3); }
    } catch (_) {}
  }

  function startAlarm() {
    playBeep();
    if (alarmTimer) clearInterval(alarmTimer);
    alarmTimer = setInterval(playBeep, 2500);
  }

  // ── Page detection ────────────────────────────────────────────────────────
  function detectPage() {
    const path   = location.pathname;
    const search = location.search;
    const text   = (document.getElementById('main') || document.body).innerText || '';

    if (
      document.getElementById('Lastname') ||
      document.querySelector('[name$="$Lastname"]') ||
      document.querySelector('[name*="Lastname"]') ||
      document.getElementById('TraveldocumentNumber') ||
      document.querySelector('[name$="$TraveldocumentNumber"]') ||
      document.getElementById('DSGVOAccepted')
    ) return 'form';

    if (
      document.querySelector('input[type="radio"][name="Start"]') ||
      /\\/HomeWeb\\/Scheduler/i.test(path) ||
      /\\/Scheduler/i.test(path) ||
      /no appointments available/i.test(text) ||
      /keine termine/i.test(text) ||
      /unfortunately no appointment/i.test(text) ||
      (document.querySelector('input[type="radio"]') && /Start/i.test(path))
    ) return 'scheduler';

    if (/fromspecificinfo=true/i.test(search)) return 'info';
    if (
      /\\/Info/i.test(path) ||
      /\\/Instructions/i.test(path) ||
      (/information|instructions|hinweise/i.test(text) && document.querySelector('input[type="submit"]'))
    ) return 'info';

    const calEl = document.getElementById('CalendarId');
    if (calEl && calEl.tagName === 'SELECT') return 'calendar';

    if (document.getElementById('PersonCount')) return 'persons';

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

  // ── Navigation handlers (same as bot) ────────────────────────────────────
  function handleOffice() {
    const sel = document.getElementById('Office');
    const chosen = pickByText(sel, CFG.office);
    if (chosen) { log('Office → ' + chosen); submitNext(CFG.navDelay); }
    else logErr('Office "' + CFG.office + '" not found');
  }

  function handleCalendar() {
    const sel = document.getElementById('CalendarId');
    const chosen = pickByText(sel, CFG.reservationType);
    if (chosen) { log('Type → ' + chosen); submitNext(CFG.navDelay); }
    else logErr('Type "' + CFG.reservationType + '" not found');
  }

  function handlePersons() {
    const sel = document.getElementById('PersonCount');
    if (!sel) { logErr('PersonCount not found'); return; }
    sel.value = '1';
    sel.dispatchEvent(new Event('change', { bubbles: true }));
    submitNext(CFG.navDelay);
  }

  function handleInfo() { submitNext(CFG.navDelay); }

  // ── Monitor: check scheduler page — no booking ───────────────────────────
  function handleScheduler() {
    const slots = Array.from(document.querySelectorAll('input[type="radio"][name="Start"]'));

    if (slots.length === 0) {
      const wait_s = Math.max(5, CFG.refreshIntervalSec);
      log('MONITOR_NO_APPTS:' + wait_s);

      let remaining = wait_s;
      const tick = setInterval(() => {
        remaining--;
        if (remaining > 0) log('MONITOR_COUNTDOWN:' + remaining);
        else clearInterval(tick);
      }, 1000);

      setTimeout(() => { clearInterval(tick); location.reload(); }, wait_s * 1000);
      return;
    }

    // Appointments available — alarm!
    log('MONITOR_FOUND:' + slots.length);
    startAlarm();

    // Keep refreshing so the user stays notified
    const wait_s = Math.max(5, CFG.refreshIntervalSec);
    setTimeout(() => { location.reload(); }, wait_s * 1000);
  }

  // ── Router ────────────────────────────────────────────────────────────────
  async function run() {
    await wait(900);
    const page = detectPage();
    log('PAGE:' + page);
    if      (page === 'office')    handleOffice();
    else if (page === 'calendar')  handleCalendar();
    else if (page === 'persons')   handlePersons();
    else if (page === 'info')      handleInfo();
    else if (page === 'scheduler') handleScheduler();
    else if (page === 'form')      log('MONITOR_FORM_PAGE'); // shouldn't happen
  }

  run();
})();`;
}

// ─── Injection script builder ──────────────────────────────────────────────
function buildScript(config) {
  const p  = config.person   || {};
  const s  = config.settings || {};

  // Embed all config values directly so the script is self-contained
  const CFG = {
    office:             s.office             || 'KAIRO',
    reservationType:    s.reservationType    || 'Bachelor',
    refreshIntervalSec: s.refreshIntervalSec || 30,
    navDelay:           s.navigationDelayMs  || 800,
    openaiApiKey:       s.openaiApiKey       || '',
    rootUrl:            config.targetUrl     || 'https://appointment.bmeia.gv.at/',
    notificationSound:  s.notificationSound  || 'beep',
    customSoundB64:     s.customSoundB64     || '',
    slotPreferences:      s.slotPreferences      || ['random'],
    navRetryIntervalSec:  s.navRetryIntervalSec  || 5
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
  let _slotTaken = false;  // flag: if true, ignore slot preferences and pick first available

  function playBeep() {
    try {
      // Custom audio file
      if (CFG.notificationSound === 'custom' && CFG.customSoundB64) {
        const audio = new Audio(CFG.customSoundB64);
        audio.volume = 1;
        audio.play().catch(() => {});
        return;
      }

      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const now = ctx.currentTime;

      function tone(freq, start, dur, vol, type) {
        const osc  = ctx.createOscillator();
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
        // Triple beep — original
        tone(880,  0,    0.18, 0.55);
        tone(1100, 0.22, 0.18, 0.55);
        tone(880,  0.44, 0.18, 0.55);

      } else if (snd === 'chime') {
        // Ascending major chord C-E-G
        tone(523, 0,    0.35, 0.5);
        tone(659, 0.18, 0.35, 0.5);
        tone(784, 0.36, 0.45, 0.5);

      } else if (snd === 'alert') {
        // Rapid high-pitched pulses
        [0, 0.12, 0.24, 0.36, 0.48].forEach(t => tone(1400, t, 0.09, 0.6, 'square'));

      } else if (snd === 'ding') {
        // Single warm bell
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
    const path   = location.pathname;
    const search = location.search;
    const text   = (document.getElementById('main') || document.body).innerText || '';

    // ── 1. Personal data form — most specific, check first ────────────────────
    // Detect by passport/travel document field OR Lastname-like input
    if (
      document.getElementById('Lastname') ||
      document.querySelector('[name$="$Lastname"]') ||
      document.querySelector('[name*="Lastname"]') ||
      document.getElementById('TraveldocumentNumber') ||
      document.querySelector('[name$="$TraveldocumentNumber"]') ||
      document.getElementById('DSGVOAccepted')
    ) return 'form';

    // ── 2. Scheduler (appointment slot calendar) ──────────────────────────────
    // Detect by slot radio buttons, URL, or "no appointments" message
    if (
      document.querySelector('input[type="radio"][name="Start"]') ||
      /\/HomeWeb\/Scheduler/i.test(path) ||
      /\/Scheduler/i.test(path) ||
      /no appointments available/i.test(text) ||
      /keine termine/i.test(text) ||
      /unfortunately no appointment/i.test(text) ||
      (document.querySelector('input[type="radio"]') && /Start/i.test(path))
    ) return 'scheduler';

    // ── 3. Info / instructions page ───────────────────────────────────────────
    if (/fromspecificinfo=true/i.test(search)) return 'info';
    // Also detect by a Next button with no other specific form elements
    if (
      /\/Info/i.test(path) ||
      /\/Instructions/i.test(path) ||
      (/information|instructions|hinweise/i.test(text) &&
       document.querySelector('input[type="submit"]'))
    ) return 'info';

    // ── 4. Calendar / service type selection ──────────────────────────────────
    const calEl = document.getElementById('CalendarId');
    if (calEl && calEl.tagName === 'SELECT') return 'calendar';

    // ── 5. Number of persons ──────────────────────────────────────────────────
    if (document.getElementById('PersonCount')) return 'persons';

    // ── 6. Office / representation selection ─────────────────────────────────
    const offEl = document.getElementById('Office');
    if (offEl && offEl.tagName === 'SELECT') return 'office';

    return 'unknown';
  }

  // ── Submit helpers ────────────────────────────────────────────────────────
  function submitNext(delayMs) {
    setTimeout(() => {
      // Try: input[type=submit] with "Next" or "Weiter", then any submit button
      const allSubmits = [
        ...Array.from(document.querySelectorAll('input[type="submit"]')),
        ...Array.from(document.querySelectorAll('button[type="submit"]')),
        ...Array.from(document.querySelectorAll('button')),
      ];
      const btn =
        allSubmits.find(b => /^next$/i.test((b.value || b.textContent || '').trim())) ||
        allSubmits.find(b => /next|weiter|continue|إرسال|submit/i.test(b.value || b.textContent || '')) ||
        allSubmits[0]; // fallback: first submit button on page

      if (!btn) { logErr('Next button not found'); return; }
      log('Clicking next: "' + (btn.value || btn.textContent || '').trim() + '"');
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
      submitNext(CFG.navDelay);
    } else {
      const retryS = Math.max(1, CFG.navRetryIntervalSec);
      log('NAV_RETRY:office:' + retryS);
      setTimeout(() => location.reload(), retryS * 1000);
    }
  }

  // ── State: Calendar / service type selection ──────────────────────────────
  function handleCalendar() {
    const sel    = document.getElementById('CalendarId');
    const chosen = pickByText(sel, CFG.reservationType);
    if (chosen) {
      log('Reservation type selected → ' + chosen);
      submitNext(CFG.navDelay);
    } else {
      const retryS = Math.max(1, CFG.navRetryIntervalSec);
      log('NAV_RETRY:calendar:' + retryS);
      setTimeout(() => location.reload(), retryS * 1000);
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
      const wait_s = Math.max(0.25, CFG.refreshIntervalSec);
      log('NO_APPOINTMENTS:' + wait_s);
      // No alarm here — alarm fires only when a slot IS found

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
        location.reload();           // stay on scheduler page, just refresh
      }, wait_s * 1000);
      return;
    }

    // Slot found — play alarm to alert the user
    startAlarm();

    // Pick slot: if previous slot was taken, always pick first available (ignore preferences)
    let slot = null;
    if (_slotTaken) {
      slot = slots[0];
      _slotTaken = false;  // reset flag
      log('RETRY_AFTER_SLOT_TAKEN — selecting first available slot');
    } else {
      // Normal preference-based selection
      const prefs = CFG.slotPreferences || ['random'];
      for (const pref of prefs) {
        if (!pref || pref === 'none') continue;
        if (pref === 'random') { slot = slots[Math.floor(Math.random() * slots.length)]; break; }
        if (pref === 'any')    { slot = slots[0]; break; }
        const idx = parseInt(pref) - 1;
        if (!isNaN(idx) && idx >= 0 && idx < slots.length) { slot = slots[idx]; break; }
      }
      if (!slot) slot = slots[0]; // ultimate fallback
    }

    slot.checked = true;
    slot.dispatchEvent(new Event('change', { bubbles: true }));
    log('Appointment slot selected → ' + slot.value);
    submitNext(CFG.navDelay);
  }

  // ── State: Personal data form ─────────────────────────────────────────────
  async function handleForm() {

    stopAlarm(); // slot was found on previous page — silence the alert

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

  // ── CAPTCHA solver (GPT-4o vision) — with auto-retry ─────────────────────
  async function solveCaptcha() {
    const findInput = () =>
      document.getElementById('CaptchaText') ||
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
        const inp = findInput(); if (inp) inp.focus();
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
          const inp = findInput(); if (inp) inp.focus();
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
        inp.value += ch;
        inp.dispatchEvent(new KeyboardEvent('keydown',  { key: ch, bubbles: true }));
        inp.dispatchEvent(new Event('input',            { bubbles: true }));
        inp.dispatchEvent(new KeyboardEvent('keyup',    { key: ch, bubbles: true }));
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
    const inp = findInput(); if (inp) inp.focus();
    logErr('CAPTCHA failed ' + MAX_ATTEMPTS + ' times — manual entry required');
  }

  // Re-fill form fields only (no captcha call) — used on retry
  async function refillFormFields() {
    const findEl = (id) =>
      document.getElementById(id) ||
      document.querySelector('[name="' + id + '"]') ||
      document.querySelector('[name$="$' + id + '"]');
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
  createAuthWindow();
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createAuthWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
