'use strict';

let botRunning = false;

// ─── Tab navigation ──────────────────────────────────────────────────────────
document.querySelectorAll('.nav-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    const tabId = btn.dataset.tab;
    document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    btn.classList.add('active');
    document.getElementById('tab-' + tabId).classList.add('active');
  });
});

// ─── Init ─────────────────────────────────────────────────────────────────────
window.addEventListener('DOMContentLoaded', async () => {
  await loadAll();
  startStatusPolling();

  // Receive log lines forwarded from the bot window
  window.electronAPI.onBotLog(({ type, message }) => {
    const clean = message.replace('[AustriaBot] ', '').replace('[AustriaBot] ERROR: ', '');
    const logType = message.includes('ERROR') ? 'error' : type || 'success';
    addLog(logType, clean);

    // Auto-switch to logs tab for important events
    if (logType === 'error' || message.includes('CONFIRMED')) {
      document.querySelector('[data-tab="logs"]').click();
    }
  });
});

// ─── Load saved data ──────────────────────────────────────────────────────────
async function loadAll() {
  try {
    const stored = await window.electronAPI.getSettings();
    if (!stored) return;

    const p = stored.person   || {};
    const s = stored.settings || {};

    // Person
    setField('p-lastname',         p.lastname);
    setField('p-firstname',        p.firstname);
    setField('p-dob',              p.dateOfBirth);
    setField('p-sex',              p.sex);
    setField('p-lastname-birth',   p.lastnameAtBirth);
    setField('p-place-birth',      p.placeOfBirth);
    setField('p-street',           p.street);
    setField('p-postcode',         p.postcode);
    setField('p-city',             p.city);
    setField('p-country-code',     p.countryCode);
    setField('p-country',          p.country);
    setField('p-telephone',        p.telephone);
    setField('p-email',            p.email);
    setField('p-passport-num',     p.passportNumber);
    setField('p-nationality-code', p.nationalityCode);
    setField('p-nationality',      p.nationality);
    setField('p-passport-issue',   p.passportIssueDate);
    setField('p-passport-expiry',  p.passportExpiry);

    // Settings
    setField('s-openai-key',       s.openaiApiKey);
    setField('s-office',           s.office);
    setField('s-reservation-type', s.reservationType);
    setField('s-refresh-interval', s.refreshIntervalSec);
    setField('s-target-url',       s.targetUrl);

    updateInfoCards(stored);
  } catch (e) {
    addLog('error', 'خطأ في تحميل الإعدادات: ' + e.message);
  }
}

function setField(id, val) {
  const el = document.getElementById(id);
  if (!el || val === undefined || val === null || val === '') return;
  el.value = val;
}

// ─── Save person ──────────────────────────────────────────────────────────────
async function savePerson() {
  const person = {
    lastname:         getField('p-lastname'),
    firstname:        getField('p-firstname'),
    dateOfBirth:      getField('p-dob'),
    sex:              getField('p-sex'),
    lastnameAtBirth:  getField('p-lastname-birth') || getField('p-lastname'),
    placeOfBirth:     getField('p-place-birth'),
    street:           getField('p-street'),
    postcode:         getField('p-postcode'),
    city:             getField('p-city'),
    countryCode:      parseInt(getField('p-country-code'))     || 65,
    country:          getField('p-country'),
    telephone:        getField('p-telephone'),
    email:            getField('p-email'),
    passportNumber:   getField('p-passport-num'),
    nationalityCode:  parseInt(getField('p-nationality-code')) || 71,
    nationality:      getField('p-nationality'),
    passportIssueDate:getField('p-passport-issue'),
    passportExpiry:   getField('p-passport-expiry')
  };

  try {
    await window.electronAPI.saveSettings({ person });
    showSaved('person-saved', '✓ تم الحفظ');
    const stored = await window.electronAPI.getSettings();
    updateInfoCards(stored);
    addLog('success', 'تم حفظ بيانات الشخص: ' + person.firstname + ' ' + person.lastname);
  } catch (e) {
    addLog('error', 'خطأ في الحفظ: ' + e.message);
  }
}

// ─── Save settings ────────────────────────────────────────────────────────────
async function saveSettings() {
  const s = {
    openaiApiKey:       getField('s-openai-key'),
    office:             getField('s-office')           || 'KAIRO',
    reservationType:    getField('s-reservation-type') || 'Bachelor',
    refreshIntervalSec: parseInt(getField('s-refresh-interval')) || 30,
    targetUrl:          getField('s-target-url')       || 'https://appointment.bmeia.gv.at/'
  };

  try {
    await window.electronAPI.saveSettings({ settings: s });
    showSaved('settings-saved', '✓ تم الحفظ');
    const stored = await window.electronAPI.getSettings();
    updateInfoCards(stored);
    addLog('success', 'تم حفظ الإعدادات');
  } catch (e) {
    addLog('error', 'خطأ في الحفظ: ' + e.message);
  }
}

// ─── Bot control ──────────────────────────────────────────────────────────────
async function startBot() {
  const stored = await window.electronAPI.getSettings();
  const person   = stored.person   || {};
  const settings = stored.settings || {};

  if (!person.lastname)       addLog('warn', 'تحذير: بيانات الشخص غير مكتملة');
  if (!settings.openaiApiKey) addLog('warn', 'تحذير: OpenAI API Key غير مضبوط — ستحتاج لإدخال الكابتشا يدويًا');

  const config = {
    person,
    settings,
    targetUrl: settings.targetUrl || 'https://appointment.bmeia.gv.at/'
  };

  try {
    const res = await window.electronAPI.startBot(config);
    if (res.success) {
      setBotState(true);
      addLog('info', 'تم تشغيل البوت ← ' + config.targetUrl);
      addLog('info', 'السفارة: ' + (settings.office || 'KAIRO') + ' | النوع: ' + (settings.reservationType || 'Bachelor'));
    } else {
      addLog('warn', res.message || 'البوت يعمل بالفعل');
    }
  } catch (e) {
    addLog('error', 'خطأ في التشغيل: ' + e.message);
  }
}

async function stopBot() {
  try {
    await window.electronAPI.stopBot();
    setBotState(false);
    addLog('warn', 'تم إيقاف البوت');
  } catch (e) {
    addLog('error', 'خطأ في الإيقاف: ' + e.message);
  }
}

// ─── Status polling ───────────────────────────────────────────────────────────
function startStatusPolling() {
  setInterval(async () => {
    try {
      const { running } = await window.electronAPI.getBotStatus();
      if (running !== botRunning) setBotState(running);
    } catch (_) {}
  }, 2000);

  window.electronAPI.onBotStopped(() => {
    setBotState(false);
    addLog('warn', 'نافذة البوت أُغلقت');
  });
}

function setBotState(running) {
  botRunning = running;

  const startBtn  = document.getElementById('start-btn');
  const stopBtn   = document.getElementById('stop-btn');
  const label     = document.getElementById('bot-state-label');
  const desc      = document.getElementById('bot-state-desc');
  const visual    = document.getElementById('bot-animation');
  const dot       = document.querySelector('.status-dot');
  const statusTxt = document.getElementById('status-text');

  if (running) {
    startBtn.disabled = true;
    stopBtn.disabled  = false;
    label.textContent = 'البوت يعمل الآن';
    desc.textContent  = 'جاري البحث عن موعد وإتمام الحجز…';
    visual.classList.add('running');
    dot.className     = 'status-dot running';
    statusTxt.textContent = 'يعمل';
  } else {
    startBtn.disabled = false;
    stopBtn.disabled  = true;
    label.textContent = 'البوت متوقف';
    desc.textContent  = 'اضغط "تشغيل" لبدء الحجز التلقائي';
    visual.classList.remove('running');
    dot.className     = 'status-dot stopped';
    statusTxt.textContent = 'متوقف';
  }
}

// ─── Logs ─────────────────────────────────────────────────────────────────────
function addLog(type, msg) {
  const container = document.getElementById('logs-container');
  const empty = container.querySelector('.log-empty');
  if (empty) empty.remove();

  const time = new Date().toLocaleTimeString('ar-EG', { hour12: false });

  const line = document.createElement('div');
  line.className = 'log-line ' + (type || 'info');
  line.innerHTML = `<span class="log-time">${time}</span><span class="log-msg">${escapeHtml(msg)}</span>`;
  container.appendChild(line);
  container.scrollTop = container.scrollHeight;
}

function clearLogs() {
  document.getElementById('logs-container').innerHTML =
    '<div class="log-empty">تم مسح السجل.</div>';
}

// ─── UI helpers ───────────────────────────────────────────────────────────────
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
  return String(str).replace(/[&<>"']/g,
    c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

function updateInfoCards(stored) {
  if (!stored) return;
  const p = stored.person   || {};
  const s = stored.settings || {};

  const el = id => document.getElementById(id);

  const name = ((p.firstname || '') + ' ' + (p.lastname || '')).trim();
  if (el('display-name'))    el('display-name').textContent    = name || '—';
  if (el('display-api'))     el('display-api').textContent     = s.openaiApiKey ? 'مضبوط ✓' : 'غير مضبوط';
  if (el('display-office'))  el('display-office').textContent  = s.office || 'KAIRO';
  if (el('display-type'))    el('display-type').textContent    = s.reservationType || 'Bachelor';
  if (el('display-refresh')) el('display-refresh').textContent = (s.refreshIntervalSec || 30) + 's';
}
