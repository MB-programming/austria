const { app, BrowserWindow, ipcMain, session } = require('electron');
const path = require('path');
const Store = require('electron-store');

const store = new Store();

let mainWindow = null;
let botWindow = null;

function createMainWindow() {
  mainWindow = new BrowserWindow({
    width: 900,
    height: 700,
    minWidth: 800,
    minHeight: 600,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    },
    title: 'Austria Appointment Bot',
    backgroundColor: '#1a1a2e'
  });

  mainWindow.loadFile(path.join(__dirname, 'renderer', 'index.html'));

  if (process.argv.includes('--dev')) {
    mainWindow.webContents.openDevTools();
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// IPC: Load settings
ipcMain.handle('get-settings', () => {
  return store.store;
});

// IPC: Save settings
ipcMain.handle('save-settings', (event, settings) => {
  Object.entries(settings).forEach(([key, val]) => store.set(key, val));
  return { success: true };
});

// IPC: Start the bot
ipcMain.handle('start-bot', async (event, config) => {
  if (botWindow) {
    botWindow.focus();
    return { success: false, message: 'Bot already running' };
  }

  const targetUrl = config.targetUrl || 'https://appointment.bmeia.gv.at/';

  botWindow = new BrowserWindow({
    width: 1100,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: false, // needed for userscript injection
      webSecurity: true,
      allowRunningInsecureContent: false,
      preload: path.join(__dirname, 'bot-preload.js')
    },
    title: 'Bot - Austria Appointment'
  });

  // Pass config to bot window via session storage simulation
  botWindow.webContents.on('did-finish-load', () => {
    botWindow.webContents.executeJavaScript(`
      window.__BOT_CONFIG__ = ${JSON.stringify(config)};
    `).catch(() => {});
  });

  // Inject automation scripts on each page load
  botWindow.webContents.on('did-navigate', (event, url) => {
    injectAutomationScripts(botWindow, config, url);
  });

  botWindow.webContents.on('did-navigate-in-page', (event, url) => {
    injectAutomationScripts(botWindow, config, url);
  });

  // Also inject on DOM ready
  botWindow.webContents.on('dom-ready', () => {
    const url = botWindow.webContents.getURL();
    injectAutomationScripts(botWindow, config, url);
  });

  botWindow.loadURL(targetUrl);

  botWindow.on('closed', () => {
    botWindow = null;
    if (mainWindow) {
      mainWindow.webContents.send('bot-stopped');
    }
  });

  return { success: true };
});

// IPC: Stop the bot
ipcMain.handle('stop-bot', () => {
  if (botWindow) {
    botWindow.close();
    botWindow = null;
  }
  return { success: true };
});

// IPC: Bot status
ipcMain.handle('bot-status', () => {
  return { running: botWindow !== null };
});

function injectAutomationScripts(win, config, url) {
  if (!win || win.isDestroyed()) return;

  const isBmeia = url && url.includes('appointment.bmeia.gv.at');

  if (isBmeia) {
    // Inject all automation scripts
    win.webContents.executeJavaScript(buildInjectionScript(config)).catch(err => {
      console.error('Script injection error:', err.message);
    });
  }
}

function buildInjectionScript(config) {
  const p = config.person || {};
  const settings = config.settings || {};
  const openaiKey = settings.openaiApiKey || '';

  return `
(function() {
  if (window.__AUSTRIA_BOT_INJECTED__) return;
  window.__AUSTRIA_BOT_INJECTED__ = true;

  // =====================
  // UTILITIES
  // =====================
  const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

  const setVal = (id, val) => {
    const el = document.getElementById(id);
    if (!el) return;
    el.value = val;
    el.dispatchEvent(new Event("input", { bubbles: true }));
    el.dispatchEvent(new Event("change", { bubbles: true }));
  };

  const pick = (id, value, labelText) => {
    const sel = document.getElementById(id);
    if (!sel) return;
    if ([...sel.options].some(o => String(o.value) === String(value))) {
      sel.value = String(value);
    } else if (labelText) {
      const opt = [...sel.options].find(
        o => o.text.trim().toUpperCase() === labelText.trim().toUpperCase()
      );
      if (opt) sel.value = opt.value;
    }
    sel.dispatchEvent(new Event("change", { bubbles: true }));
  };

  // =====================
  // FORM FILLER
  // =====================
  const fillForm = () => {
    const p = ${JSON.stringify(p)};

    setVal("Lastname", p.lastname || "");
    setVal("Firstname", p.firstname || "");
    setVal("DateOfBirth", p.dateOfBirth || "");
    setVal("TraveldocumentNumber", p.passportNumber || "");

    const sexVal = p.sex === "Male" ? 1 : 2;
    pick("Sex", sexVal, p.sex || "Male");

    setVal("Street", p.street || "");
    setVal("Postcode", p.postcode || "");
    setVal("City", p.city || "");

    pick("Country", p.countryCode || 65, p.country || "EGYPT");

    setVal("Telephone", p.telephone || "");
    setVal("Email", p.email || "");
    setVal("LastnameAtBirth", p.lastnameAtBirth || p.lastname || "");

    const natCode = p.nationalityCode || 71;
    const natLabel = p.nationality || "EGYPT";
    pick("NationalityAtBirth", natCode, natLabel);
    pick("CountryOfBirth", natCode, natLabel);
    setVal("PlaceOfBirth", p.placeOfBirth || "");
    pick("NationalityForApplication", natCode, natLabel);

    setVal("TraveldocumentDateOfIssue", p.passportIssueDate || "");
    setVal("TraveldocumentValidUntil", p.passportExpiry || "");
    pick("TraveldocumentIssuingAuthority", natCode, natLabel);

    const gdpr = document.getElementById("DSGVOAccepted");
    if (gdpr && !gdpr.checked) gdpr.click();

    document.getElementById("CaptchaText")?.focus();
    console.log("[AustriaBot] Form filled.");
  };

  // =====================
  // APPOINTMENT SELECTOR
  // =====================
  const selectFirstAppointment = () => {
    const firstSlot = document.querySelector('input[type="radio"][name="Start"]');
    if (!firstSlot) return;
    firstSlot.checked = true;
    firstSlot.dispatchEvent(new Event('change', { bubbles: true }));
    const nextBtn = [...document.querySelectorAll('input[type="submit"]')]
      .find(btn => btn.value === "Next");
    if (nextBtn) nextBtn.click();
  };

  // =====================
  // CAPTCHA SOLVER
  // =====================
  const OPENAI_KEY = ${JSON.stringify(openaiKey)};

  const getCaptchaBase64 = () => {
    const captchaImg = document.querySelector('#Captcha_CaptchaImage') ||
                      document.querySelector('img[src*="BotDetectCaptcha.ashx"]') ||
                      document.querySelector('img[src*="captcha"]') ||
                      document.querySelector('.BDC_CaptchaImage') ||
                      document.querySelector('img[alt*="captcha" i]');
    if (!captchaImg) return null;

    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const process = () => {
        try {
          canvas.width = captchaImg.naturalWidth || captchaImg.width || 250;
          canvas.height = captchaImg.naturalHeight || captchaImg.height || 50;
          ctx.drawImage(captchaImg, 0, 0);
          resolve(canvas.toDataURL('image/png').split(',')[1]);
        } catch(e) { resolve(null); }
      };
      if (!captchaImg.complete) { captchaImg.onload = process; captchaImg.onerror = () => resolve(null); }
      else process();
    });
  };

  const solveCaptchaWithOpenAI = async (base64Image) => {
    if (!OPENAI_KEY) throw new Error('No OpenAI API key configured');
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + OPENAI_KEY
      },
      body: JSON.stringify({
        model: "gpt-4o",
        messages: [{
          role: "user",
          content: [
            { type: "text", text: "This is a CAPTCHA image. Look carefully and tell me ONLY the characters you see. No explanation, just the characters." },
            { type: "image_url", image_url: { url: "data:image/png;base64," + base64Image } }
          ]
        }],
        max_tokens: 50,
        temperature: 0.1
      })
    });
    const data = await res.json();
    if (data.error) throw new Error(data.error.message);
    const text = data.choices?.[0]?.message?.content?.trim() || '';
    return text.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
  };

  const simulateTyping = async (element, text) => {
    if (!element || !text) return;
    element.focus();
    await wait(100);
    element.value = '';
    element.dispatchEvent(new Event('input', { bubbles: true }));
    for (const char of text) {
      element.value += char;
      element.dispatchEvent(new Event('input', { bubbles: true }));
      await wait(40);
    }
    element.dispatchEvent(new Event('change', { bubbles: true }));
  };

  const handleCaptcha = async () => {
    const captchaInput = document.querySelector('#CaptchaText') ||
                        document.querySelector('input[name="CaptchaText"]');
    if (!captchaInput) return;

    try {
      await wait(1000);
      const base64 = await getCaptchaBase64();
      if (!base64) return;
      const solved = await solveCaptchaWithOpenAI(base64);
      if (solved) {
        await simulateTyping(captchaInput, solved);
        console.log('[AustriaBot] CAPTCHA solved:', solved);
      }
    } catch(e) {
      console.error('[AustriaBot] CAPTCHA error:', e.message);
      const captchaInput = document.querySelector('#CaptchaText');
      if (captchaInput) captchaInput.focus();
    }
  };

  // =====================
  // NAVIGATION BOT
  // =====================
  const STEP_DELAY_MS = 1000;
  const SCHEDULER_RE = /\\/HomeWeb\\/Scheduler|\\/Home\\/Calendar/i;
  const RE_KAIRO  = /KAIRO|CAIRO/i;
  const RE_BACHELOR = /Aufenthaltsbewilligung\\s+Student\\s+\\(nur Bachelor\\)/i;
  const RE_PERSONS = /number\\s*of\\s*persons/i;
  const NEXT_RE = [/^\\s*next\\s*$/i, /weiter/i];

  const isVisible = el => {
    if (!el) return false;
    const cs = getComputedStyle(el), r = el.getBoundingClientRect();
    return cs.display !== 'none' && cs.visibility !== 'hidden' && r.width > 0 && r.height > 0;
  };

  const looksLikeNext = el => {
    if (!el || !isVisible(el) || el.disabled) return false;
    const tag = el.tagName.toLowerCase();
    const val = (el.value || '').trim();
    const txt = (el.textContent || '').trim();
    if (tag === 'input') return NEXT_RE.some(r => r.test(val));
    if (tag === 'button' || tag === 'a') return NEXT_RE.some(r => r.test(txt));
    return false;
  };

  const findNext = (root = document) =>
    Array.from(root.querySelectorAll('input,button,a')).find(looksLikeNext) || null;

  const selectByText = (sel, re) => {
    const opt = Array.from(sel.options || []).find(o => re.test(o.text));
    if (!opt) return false;
    sel.value = opt.value;
    sel.dispatchEvent(new Event('change', { bubbles: true }));
    return true;
  };

  const clickNext = (btn, delay = STEP_DELAY_MS) => {
    const form = btn?.form || document.querySelector('form');
    setTimeout(() => {
      if (btn && form?.requestSubmit) form.requestSubmit(btn);
      else if (btn) btn.click();
      else if (form?.requestSubmit) form.requestSubmit();
      else form?.submit();
    }, delay);
  };

  const isInfoURL = () =>
    location.pathname === '/' && /fromspecificinfo=true/i.test(location.search || '');

  function stepKairo() {
    const sel = Array.from(document.querySelectorAll('select'))
      .find(s => Array.from(s.options || []).some(o => RE_KAIRO.test(o.text)));
    if (sel && !document.getElementById('CalendarId')) {
      selectByText(sel, RE_KAIRO);
      const next = findNext(sel.closest('form') || document);
      if (next) clickNext(next);
      return true;
    }
    return false;
  }

  function stepBachelor() {
    const cal = document.getElementById('CalendarId');
    if (!cal) return false;
    if (cal.tagName?.toLowerCase() === 'select') {
      selectByText(cal, RE_BACHELOR);
    }
    const next = findNext(cal.closest('form') || document);
    if (next) clickNext(next);
    return true;
  }

  function stepPersons() {
    const sel = Array.from(document.querySelectorAll('select')).find(s => {
      const around = (s.closest('label')?.textContent || '') + ' ' + (s.parentElement?.textContent || '');
      return RE_PERSONS.test(around);
    });
    if (!sel) return false;
    const opt1 = Array.from(sel.options || []).find(o => String(o.value).trim() === '1' || o.text.trim() === '1');
    if (opt1) { sel.value = opt1.value; sel.dispatchEvent(new Event('change', { bubbles: true })); }
    const next = findNext(sel.closest('form') || document);
    if (next) clickNext(next);
    return true;
  }

  function stepInfo() {
    const form = document.querySelector('form[action*="fromSpecificInfo=true" i]');
    if (!form) return false;
    const next = findNext(form);
    if (next) clickNext(next);
    return true;
  }

  function runNavBot() {
    if (SCHEDULER_RE.test(location.pathname)) return;
    if (stepKairo())    return;
    if (stepBachelor()) return;
    if (stepPersons())  return;
    if (stepInfo())     return;
  }

  // =====================
  // MAIN RUNNER
  // =====================
  const run = async () => {
    await wait(1500);
    fillForm();
    selectFirstAppointment();
    runNavBot();
    await handleCaptcha();
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', run);
  } else {
    run();
  }

  // Re-run on DOM mutations (SPA navigation)
  const mo = new MutationObserver(() => {
    if (!window.__AUSTRIA_BOT_RAN_THIS_CYCLE__) {
      window.__AUSTRIA_BOT_RAN_THIS_CYCLE__ = true;
      setTimeout(() => { window.__AUSTRIA_BOT_RAN_THIS_CYCLE__ = false; }, 2000);
      run();
    }
  });
  mo.observe(document.documentElement, { childList: true, subtree: true });
  setTimeout(() => mo.disconnect(), 120000);

  console.log('[AustriaBot] Automation scripts loaded.');
})();
  `;
}

app.whenReady().then(() => {
  createMainWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createMainWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
