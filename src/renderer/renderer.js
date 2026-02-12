'use strict';

// ===========================
// STATE
// ===========================
let botRunning = false;
let statusInterval = null;

// ===========================
// TAB NAVIGATION
// ===========================
document.querySelectorAll('.nav-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    const tabId = btn.dataset.tab;
    document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    btn.classList.add('active');
    document.getElementById('tab-' + tabId).classList.add('active');
  });
});

// ===========================
// INIT: Load saved data
// ===========================
window.addEventListener('DOMContentLoaded', async () => {
  await loadAll();
  startStatusPolling();
});

async function loadAll() {
  try {
    const settings = await window.electronAPI.getSettings();
    if (!settings) return;

    // Person fields
    const p = settings.person || {};
    setField('p-lastname',       p.lastname);
    setField('p-firstname',      p.firstname);
    setField('p-dob',            p.dateOfBirth);
    setField('p-sex',            p.sex);
    setField('p-lastname-birth', p.lastnameAtBirth);
    setField('p-place-birth',    p.placeOfBirth);
    setField('p-street',         p.street);
    setField('p-postcode',       p.postcode);
    setField('p-city',           p.city);
    setField('p-country-code',   p.countryCode);
    setField('p-country',        p.country);
    setField('p-telephone',      p.telephone);
    setField('p-email',          p.email);
    setField('p-passport-num',   p.passportNumber);
    setField('p-nationality-code', p.nationalityCode);
    setField('p-nationality',    p.nationality);
    setField('p-passport-issue', p.passportIssueDate);
    setField('p-passport-expiry',p.passportExpiry);

    // Settings fields
    const s = settings.settings || {};
    setField('s-openai-key',   s.openaiApiKey);
    setField('s-target-url',   s.targetUrl);
    setField('s-step-delay',   s.stepDelay);
    setField('s-stall-ms',     s.stallMs);
    setField('s-retry-limit',  s.retryLimit);

    updateInfoCards(settings);

  } catch(e) {
    addLog('error', 'خطأ في تحميل الإعدادات: ' + e.message);
  }
}

function setField(id, val) {
  const el = document.getElementById(id);
  if (!el || val === undefined || val === null || val === '') return;
  el.value = val;
}

// ===========================
// SAVE PERSON
// ===========================
async function savePerson() {
  const person = {
    lastname:        getField('p-lastname'),
    firstname:       getField('p-firstname'),
    dateOfBirth:     getField('p-dob'),
    sex:             getField('p-sex'),
    lastnameAtBirth: getField('p-lastname-birth') || getField('p-lastname'),
    placeOfBirth:    getField('p-place-birth'),
    street:          getField('p-street'),
    postcode:        getField('p-postcode'),
    city:            getField('p-city'),
    countryCode:     parseInt(getField('p-country-code')) || 65,
    country:         getField('p-country'),
    telephone:       getField('p-telephone'),
    email:           getField('p-email'),
    passportNumber:  getField('p-passport-num'),
    nationalityCode: parseInt(getField('p-nationality-code')) || 71,
    nationality:     getField('p-nationality'),
    passportIssueDate: getField('p-passport-issue'),
    passportExpiry:  getField('p-passport-expiry')
  };

  try {
    await window.electronAPI.saveSettings({ person });
    showSaved('person-saved', '✓ تم الحفظ');
    updateInfoCards({ person, settings: await getStoredSettings() });
    addLog('success', 'تم حفظ بيانات الشخص: ' + person.firstname + ' ' + person.lastname);
  } catch(e) {
    addLog('error', 'خطأ في الحفظ: ' + e.message);
  }
}

// ===========================
// SAVE SETTINGS
// ===========================
async function saveSettings() {
  const s = {
    openaiApiKey: getField('s-openai-key'),
    targetUrl:    getField('s-target-url') || 'https://appointment.bmeia.gv.at/',
    stepDelay:    parseInt(getField('s-step-delay')) || 1000,
    stallMs:      parseInt(getField('s-stall-ms'))   || 2000,
    retryLimit:   parseInt(getField('s-retry-limit'))|| 10
  };

  try {
    await window.electronAPI.saveSettings({ settings: s });
    showSaved('settings-saved', '✓ تم الحفظ');
    const stored = await window.electronAPI.getSettings();
    updateInfoCards(stored);
    addLog('success', 'تم حفظ الإعدادات');
  } catch(e) {
    addLog('error', 'خطأ في الحفظ: ' + e.message);
  }
}

// ===========================
// BOT CONTROL
// ===========================
async function startBot() {
  const stored = await window.electronAPI.getSettings();
  const person   = stored.person   || {};
  const settings = stored.settings || {};

  if (!settings.openaiApiKey) {
    addLog('warn', 'تحذير: لم يتم ضبط OpenAI API Key — الكابتشا لن يُحل تلقائيًا');
  }
  if (!person.lastname) {
    addLog('warn', 'تحذير: لم يتم إدخال بيانات الشخص');
  }

  const config = { person, settings, targetUrl: settings.targetUrl || 'https://appointment.bmeia.gv.at/' };

  try {
    const res = await window.electronAPI.startBot(config);
    if (res.success) {
      setBotState(true);
      addLog('info', 'تم تشغيل البوت → ' + config.targetUrl);
    } else {
      addLog('warn', res.message || 'البوت يعمل بالفعل');
    }
  } catch(e) {
    addLog('error', 'خطأ في التشغيل: ' + e.message);
  }
}

async function stopBot() {
  try {
    await window.electronAPI.stopBot();
    setBotState(false);
    addLog('warn', 'تم إيقاف البوت');
  } catch(e) {
    addLog('error', 'خطأ في الإيقاف: ' + e.message);
  }
}

// ===========================
// STATUS POLLING
// ===========================
function startStatusPolling() {
  statusInterval = setInterval(async () => {
    try {
      const { running } = await window.electronAPI.getBotStatus();
      if (running !== botRunning) setBotState(running);
    } catch {}
  }, 2000);

  window.electronAPI.onBotStopped(() => {
    setBotState(false);
    addLog('warn', 'نافذة البوت أُغلقت');
  });
}

function setBotState(running) {
  botRunning = running;

  const startBtn = document.getElementById('start-btn');
  const stopBtn  = document.getElementById('stop-btn');
  const label    = document.getElementById('bot-state-label');
  const desc     = document.getElementById('bot-state-desc');
  const visual   = document.getElementById('bot-animation');
  const dot      = document.querySelector('.status-dot');
  const statusTxt= document.getElementById('status-text');

  if (running) {
    startBtn.disabled = true;
    stopBtn.disabled  = false;
    label.textContent = 'البوت يعمل الآن';
    desc.textContent  = 'الحجز التلقائي قيد التنفيذ...';
    visual.classList.add('running');
    dot.className = 'status-dot running';
    statusTxt.textContent = 'يعمل';
  } else {
    startBtn.disabled = false;
    stopBtn.disabled  = true;
    label.textContent = 'البوت متوقف';
    desc.textContent  = 'اضغط "تشغيل" لبدء الحجز التلقائي';
    visual.classList.remove('running');
    dot.className = 'status-dot stopped';
    statusTxt.textContent = 'متوقف';
  }
}

// ===========================
// LOGS
// ===========================
function addLog(type, msg) {
  const container = document.getElementById('logs-container');
  const empty = container.querySelector('.log-empty');
  if (empty) empty.remove();

  const now = new Date();
  const time = now.toLocaleTimeString('ar-EG', { hour12: false });

  const line = document.createElement('div');
  line.className = 'log-line ' + (type || 'info');
  line.innerHTML = `<span class="log-time">${time}</span><span class="log-msg">${escapeHtml(msg)}</span>`;
  container.appendChild(line);
  container.scrollTop = container.scrollHeight;
}

function clearLogs() {
  const container = document.getElementById('logs-container');
  container.innerHTML = '<div class="log-empty">تم مسح السجل.</div>';
}

// ===========================
// UI HELPERS
// ===========================
function getField(id) {
  const el = document.getElementById(id);
  return el ? el.value.trim() : '';
}

function showSaved(id, text) {
  const el = document.getElementById(id);
  if (!el) return;
  el.textContent = text;
  setTimeout(() => { el.textContent = ''; }, 3000);
}

function toggleApiVisibility() {
  const input = document.getElementById('s-openai-key');
  input.type = input.type === 'password' ? 'text' : 'password';
}

function escapeHtml(str) {
  return String(str).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}

async function getStoredSettings() {
  try {
    const s = await window.electronAPI.getSettings();
    return s.settings || {};
  } catch { return {}; }
}

function updateInfoCards(stored) {
  if (!stored) return;
  const p = stored.person   || {};
  const s = stored.settings || {};

  const nameEl = document.getElementById('display-name');
  const apiEl  = document.getElementById('display-api');
  const urlEl  = document.getElementById('display-url');

  if (nameEl) nameEl.textContent = (p.firstname || '') + ' ' + (p.lastname || '') || '—';
  if (apiEl)  apiEl.textContent  = s.openaiApiKey ? 'مضبوط ✓' : 'غير مضبوط';
  if (urlEl) {
    try { urlEl.textContent = new URL(s.targetUrl || 'https://appointment.bmeia.gv.at/').hostname; }
    catch { urlEl.textContent = 'appointment.bmeia.gv.at'; }
  }
}
