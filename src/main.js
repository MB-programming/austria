const { app, BrowserWindow, ipcMain, shell } = require('electron');
const path  = require('path');
const https = require('https');
const Store = require('electron-store');
const puppeteerManager = require('./puppeteer-manager');
const buildScript = require('./build-script');

const store = new Store();

let mainWindow    = null;
let botWindow     = null;
let authWindow    = null;
let monitorWindow = null;
const sessionWindows = new Map(); // sessionId -> BrowserWindow
const terminalWindows = new Map(); // sessionId -> Terminal BrowserWindow
let gridWindow = null;
let gridTerminal = null;
let gridSettings = null;

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

  const terminalPath = path.join(__dirname, 'renderer', 'session-terminal.html');
  termWin.loadFile(terminalPath);

  // Send session ID after page loads
  termWin.webContents.on('did-finish-load', () => {
    termWin.webContents.send('set-session-id', id);
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

      // Stop ONLY this session after booking, not the entire app
      setTimeout(() => {
        const sessionWin = sessionWindows.get(id);
        if (sessionWin && !sessionWin.isDestroyed()) {
          sessionWin.close();
        }
        const termWin = terminalWindows.get(id);
        if (termWin && !termWin.isDestroyed()) {
          termWin.close();
        }
      }, 5000); // 5 seconds to see the confirmation
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

// ─── Grid Session IPC handlers ─────────────────────────────────────────────
ipcMain.handle('open-grid-settings', () => {
  if (gridSettings && !gridSettings.isDestroyed()) {
    gridSettings.focus();
    return { success: true };
  }

  gridSettings = new BrowserWindow({
    width: 1000,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload-grid.js')
    },
    title: 'Grid Session Settings',
    backgroundColor: '#0f0f1a'
  });

  gridSettings.loadFile(path.join(__dirname, 'renderer', 'grid-settings.html'));

  gridSettings.on('closed', () => {
    gridSettings = null;
  });

  return { success: true };
});

ipcMain.handle('start-grid', async (_, config) => {
  if (gridWindow && !gridWindow.isDestroyed()) {
    gridWindow.focus();
    return { success: false, message: 'Grid already running' };
  }

  // Create grid window
  gridWindow = new BrowserWindow({
    width: 1600,
    height: 900,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload-grid-window.js'),
      webviewTag: true  // Enable <webview> tags
    },
    title: 'Orbtasoft Grid Session',
    backgroundColor: '#0a0a0f'
  });

  gridWindow.loadFile(path.join(__dirname, 'renderer', 'grid-window.html'));

  // Send grid config after window loads
  gridWindow.webContents.on('did-finish-load', () => {
    // Add preload path to config - use file:// URL for webview
    const preloadFullPath = path.join(__dirname, 'preload-grid-cell.js');
    const configWithPreload = {
      ...config,
      preloadPath: `file://${preloadFullPath.replace(/\\/g, '/')}`
    };
    gridWindow.webContents.send('init-grid', configWithPreload);
  });

  // Create grid terminal
  gridTerminal = new BrowserWindow({
    width: 900,
    height: 700,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload-terminal.js')
    },
    title: 'Grid Terminal',
    backgroundColor: '#0a0a0f'
  });

  gridTerminal.loadFile(path.join(__dirname, 'renderer', 'session-terminal.html'));

  gridTerminal.webContents.on('did-finish-load', () => {
    gridTerminal.webContents.send('set-session-id', 'Grid');
  });

  gridWindow.on('closed', () => {
    gridWindow = null;
    if (gridTerminal && !gridTerminal.isDestroyed()) {
      gridTerminal.close();
    }
  });

  gridTerminal.on('closed', () => {
    gridTerminal = null;
  });

  return { success: true };
});

ipcMain.on('grid-cell-log', (_, cellId, type, message) => {
  if (!gridTerminal || gridTerminal.isDestroyed()) return;
  const prefixedMessage = `[Cell #${cellId}] ${message}`;
  gridTerminal.webContents.send('terminal-log', type, prefixedMessage);
});

ipcMain.on('open-grid-terminal', () => {
  if (gridTerminal && !gridTerminal.isDestroyed()) {
    gridTerminal.focus();
  }
});

ipcMain.on('stop-grid', () => {
  if (gridWindow && !gridWindow.isDestroyed()) {
    gridWindow.close();
  }
  if (gridTerminal && !gridTerminal.isDestroyed()) {
    gridTerminal.close();
  }
});

ipcMain.handle('get-bot-script', async (_, settings) => {
  // Build bot script with cell-specific settings
  return buildScript({ settings });
});

// ─── Puppeteer Session IPC handlers ────────────────────────────────────────
ipcMain.handle('start-puppeteer-session', async (_, id, config) => {
  try {
    // Create terminal window for this Puppeteer session
    const termWin = new BrowserWindow({
      width: 800, height: 600,
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        preload: path.join(__dirname, 'preload-terminal.js')
      },
      title: `Puppeteer Terminal — Session ${id}`,
      backgroundColor: '#0a0a0f'
    });

    const terminalPath = path.join(__dirname, 'renderer', 'session-terminal.html');
    termWin.loadFile(terminalPath);

    // Send session ID after page loads
    termWin.webContents.on('did-finish-load', () => {
      termWin.webContents.send('set-session-id', id);
    });

    terminalWindows.set(id, termWin);

    // Launch Puppeteer session
    const result = await puppeteerManager.launchSession(id, config, termWin);

    // URL for navigation
    const url = config.targetUrl || 'https://appointment.bmeia.gv.at/?AspxAutoDetectCookieSupport=1';

    // Navigate and start automation with full config
    await puppeteerManager.navigateAndAutomate(id, url, config);

    return { success: true, ...result };

  } catch (error) {
    return { success: false, message: error.message };
  }
});

ipcMain.handle('stop-puppeteer-session', async (_, id) => {
  const result = await puppeteerManager.stopSession(id);

  // Close terminal window
  const termWin = terminalWindows.get(id);
  if (termWin && !termWin.isDestroyed()) {
    termWin.close();
  }
  terminalWindows.delete(id);

  return result;
});

ipcMain.handle('puppeteer-session-status', (_, id) => {
  return puppeteerManager.getSessionStatus(id);
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

      // Ensure minimum 1 second for countdown
      const countdown_s = Math.max(1, Math.floor(wait_s));
      let remaining = countdown_s;
      const tick = setInterval(() => {
        remaining--;
        log('MONITOR_COUNTDOWN:' + remaining);
        if (remaining <= 0) clearInterval(tick);
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

app.on('before-quit', async (event) => {
  // Stop all Puppeteer sessions before quitting
  event.preventDefault();
  await puppeteerManager.stopAllSessions();
  app.exit(0);
});
