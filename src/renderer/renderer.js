'use strict';

// ─── Environment detection ────────────────────────────────────────────────────
const IS_ELECTRON = typeof window !== 'undefined' && !!window.electronAPI;

// ─── Storage abstraction (Electron IPC  OR  localStorage) ────────────────────
const Storage = (() => {
  const LS_KEY = 'austria_bot_v1';

  function lsGet() {
    try { return JSON.parse(localStorage.getItem(LS_KEY) || '{}'); }
    catch { return {}; }
  }

  function lsSet(patch) {
    const current = lsGet();
    Object.entries(patch).forEach(([k, v]) => { current[k] = v; });
    localStorage.setItem(LS_KEY, JSON.stringify(current));
  }

  return {
    async get() {
      if (IS_ELECTRON) return window.electronAPI.getSettings();
      return lsGet();
    },
    async save(patch) {
      if (IS_ELECTRON) return window.electronAPI.saveSettings(patch);
      lsSet(patch);
      return { success: true };
    }
  };
})();

// ─── Bot state ────────────────────────────────────────────────────────────────
let botRunning  = false;
let TARGET_URL  = 'https://appointment.bmeia.gv.at/';

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

  if (IS_ELECTRON) {
    window.electronAPI.onBotLog(({ type, message }) => {
      const clean = message.replace(/\[AustriaBot\]\s*(ERROR:\s*)?/, '');
      // Route to activity feed AND logs tab
      routeBotMessage(clean);
      addLog(message.includes('ERROR') ? 'error' : 'info', clean);
    });
    window.electronAPI.onBotStopped(() => {
      setBotState(false);
      addActivity('error', '⛔', 'نافذة البوت أُغلقت');
      addLog('warn', 'نافذة البوت أُغلقت');
    });
  }
});

// ─── Load saved data ──────────────────────────────────────────────────────────
async function loadAll() {
  try {
    const stored = await Storage.get();
    const p = stored.person   || {};
    const s = stored.settings || {};

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

    setField('s-openai-key',       s.openaiApiKey);
    setField('s-office',           s.office);
    setField('s-reservation-type', s.reservationType);
    setField('s-refresh-interval', s.refreshIntervalSec);
    setField('s-nav-delay',        s.navigationDelayMs);
    setField('s-target-url',       s.targetUrl);

    // Restore custom sound from store into memory
    if (s.customSoundB64)     _customSoundB64      = s.customSoundB64;
    if (s.customSoundFileName) _customSoundFileName = s.customSoundFileName;

    // Load sound setting
    const sndVal = s.notificationSound || 'beep';
    const sndRadio = document.querySelector(`input[name="s-sound"][value="${sndVal}"]`);
    if (sndRadio) sndRadio.checked = true;
    if (sndVal === 'custom') {
      document.getElementById('custom-file-row').style.display = '';
      if (s.customSoundB64) {
        document.getElementById('custom-preview-btn').style.display = '';
        const nameEl = document.getElementById('custom-sound-name');
        if (nameEl) nameEl.textContent = s.customSoundFileName || 'ملف مخصص محمّل';
      }
    }
    // Toggle custom file row on radio change
    document.querySelectorAll('input[name="s-sound"]').forEach(r => {
      r.addEventListener('change', () => {
        const row = document.getElementById('custom-file-row');
        row.style.display = r.value === 'custom' ? '' : 'none';
      });
    });

    if (s.targetUrl) TARGET_URL = s.targetUrl;

    updateInfoCards(stored);
    addLog('info', IS_ELECTRON ? 'وضع Electron' : 'وضع المتصفح (localStorage)');
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
    lastname:          getField('p-lastname'),
    firstname:         getField('p-firstname'),
    dateOfBirth:       getField('p-dob'),
    sex:               getField('p-sex'),
    lastnameAtBirth:   getField('p-lastname-birth') || getField('p-lastname'),
    placeOfBirth:      getField('p-place-birth'),
    street:            getField('p-street'),
    postcode:          getField('p-postcode'),
    city:              getField('p-city'),
    countryCode:       parseInt(getField('p-country-code'))     || 65,
    country:           getField('p-country'),
    telephone:         getField('p-telephone'),
    email:             getField('p-email'),
    passportNumber:    getField('p-passport-num'),
    nationalityCode:   parseInt(getField('p-nationality-code')) || 71,
    nationality:       getField('p-nationality'),
    passportIssueDate: getField('p-passport-issue'),
    passportExpiry:    getField('p-passport-expiry')
  };

  try {
    await Storage.save({ person });
    showSaved('person-saved', '✓ تم الحفظ');
    const stored = await Storage.get();
    updateInfoCards(stored);
    addLog('success', 'تم حفظ بيانات الشخص: ' + person.firstname + ' ' + person.lastname);
  } catch (e) {
    addLog('error', 'خطأ في الحفظ: ' + e.message);
  }
}

// ─── Sound helpers ────────────────────────────────────────────────────────────
let _customSoundB64 = '';
let _customSoundFileName = '';

function loadCustomSound(input) {
  const file = input.files[0];
  if (!file) return;
  if (file.size > 8 * 1024 * 1024) {
    alert('حجم الملف أكبر من 8 ميجا — اختر ملفاً أصغر');
    input.value = '';
    return;
  }
  const reader = new FileReader();
  reader.onload = e => {
    _customSoundB64 = e.target.result;
    _customSoundFileName = file.name;
    document.getElementById('custom-preview-btn').style.display = '';
    const nameEl = document.getElementById('custom-sound-name');
    if (nameEl) nameEl.textContent = file.name;
    // Auto-select custom radio
    const r = document.getElementById('sound-custom-radio');
    if (r) r.checked = true;
  };
  reader.readAsDataURL(file);
}

function previewSound(type) {
  try {
    if (type === 'custom') {
      if (!_customSoundB64) return;
      new Audio(_customSoundB64).play();
      return;
    }
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const now = ctx.currentTime;
    function tone(freq, start, dur, vol, waveType) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain); gain.connect(ctx.destination);
      osc.frequency.value = freq;
      osc.type = waveType || 'sine';
      gain.gain.setValueAtTime(vol, now + start);
      gain.gain.exponentialRampToValueAtTime(0.001, now + start + dur);
      osc.start(now + start);
      osc.stop(now + start + dur + 0.01);
    }
    if (type === 'beep') {
      tone(880, 0, 0.18, 0.55); tone(1100, 0.22, 0.18, 0.55); tone(880, 0.44, 0.18, 0.55);
    } else if (type === 'chime') {
      tone(523, 0, 0.35, 0.5); tone(659, 0.18, 0.35, 0.5); tone(784, 0.36, 0.45, 0.5);
    } else if (type === 'alert') {
      [0, 0.12, 0.24, 0.36, 0.48].forEach(t => tone(1400, t, 0.09, 0.6, 'square'));
    } else if (type === 'ding') {
      tone(1047, 0, 0.6, 0.7); tone(1319, 0, 0.3, 0.3);
    }
  } catch (_) {}
}

function openSupport() {
  const url = 'https://orbtasoft.com';
  if (IS_ELECTRON && window.electronAPI.openExternal) {
    window.electronAPI.openExternal(url);
  } else {
    window.open(url, '_blank');
  }
}

// ─── Save settings ────────────────────────────────────────────────────────────
async function saveSettings() {
  const s = {
    openaiApiKey:       getField('s-openai-key'),
    office:             getField('s-office')            || 'KAIRO',
    reservationType:    getField('s-reservation-type')  || 'Bachelor',
    refreshIntervalSec: parseFloat(getField('s-refresh-interval')) || 30,
    navigationDelayMs:  parseInt(getField('s-nav-delay'))        || 800,
    targetUrl:          getField('s-target-url')        || 'https://appointment.bmeia.gv.at/',
    notificationSound:  (document.querySelector('input[name="s-sound"]:checked') || {}).value || 'beep',
    customSoundB64:     _customSoundB64  || '',
    customSoundFileName: _customSoundFileName || ''
  };

  if (s.targetUrl) TARGET_URL = s.targetUrl;

  try {
    await Storage.save({ settings: s });
    showSaved('settings-saved', '✓ تم الحفظ');
    const stored = await Storage.get();
    updateInfoCards(stored);
    addLog('success', 'تم حفظ الإعدادات');
  } catch (e) {
    addLog('error', 'خطأ في الحفظ: ' + e.message);
  }
}

// ─── Bot control ──────────────────────────────────────────────────────────────
async function startBot() {
  const stored   = await Storage.get();
  const person   = stored.person   || {};
  const settings = stored.settings || {};

  // Block start if critical person fields are missing
  const missing = ['lastname','firstname','dateOfBirth','passportNumber',
                   'street','city','country','telephone','email',
                   'nationality','passportIssueDate','passportExpiry']
    .filter(f => !person[f]);
  if (missing.length) {
    addLog('error', '✕ بيانات مطلوبة ناقصة: ' + missing.join(', '));
    addLog('warn',  'اذهب لتبويب "البيانات الشخصية" واملأ جميع الحقول ثم اضغط حفظ');
    return;
  }
  if (!settings.openaiApiKey) addLog('warn', 'تحذير: مفتاح التفعيل غير مضبوط — الكابتشا يدوي');

  TARGET_URL = settings.targetUrl || 'https://appointment.bmeia.gv.at/';

  clearActivity();

  if (IS_ELECTRON) {
    const config = { person, settings, targetUrl: TARGET_URL };
    try {
      const res = await window.electronAPI.startBot(config);
      if (res.success) {
        setBotState(true);
        addActivity('step', '▶', 'البوت انطلق — جاري تحميل الموقع…');
        addLog('info', 'تم تشغيل البوت ← ' + TARGET_URL);
      } else {
        addActivity('error', '⚠', res.message || 'البوت يعمل بالفعل');
        addLog('warn', res.message);
      }
    } catch (e) {
      addActivity('error', '✕', 'خطأ في التشغيل: ' + e.message);
      addLog('error', e.message);
    }
  } else {
    setBotState(true);
    addActivity('wait', 'ℹ', 'وضع المتصفح — الأتمتة الكاملة تحتاج تطبيق Desktop');
    addActivity('step', '⊕', 'افتح الموقع يدوياً: ' + TARGET_URL);
    addLog('warn', 'وضع المتصفح: الأتمتة غير متاحة');
  }
}

async function stopBot() {
  if (IS_ELECTRON) {
    try { await window.electronAPI.stopBot(); }
    catch (e) { addLog('error', 'خطأ في الإيقاف: ' + e.message); }
  }
  setBotState(false);
  addActivity('error', '◼', 'تم إيقاف البوت');
  addLog('warn', 'تم إيقاف البوت');
}

// ─── Activity feed ────────────────────────────────────────────────────────────
// type: 'step' | 'success' | 'wait' | 'found' | 'error' | 'confirm'
function addActivity(type, icon, text) {
  const feed = document.getElementById('activity-feed');
  if (!feed) return;

  // Remove idle placeholder
  const idle = feed.querySelector('.activity-idle');
  if (idle) idle.remove();

  const time = new Date().toLocaleTimeString('ar-EG', { hour12: false });
  const el = document.createElement('div');
  el.className = 'activity-msg ' + (type || 'step');
  el.innerHTML =
    `<span class="a-icon">${icon}</span>` +
    `<span class="a-body">` +
    `<span class="a-text">${escapeHtml(text)}</span>` +
    `<span class="a-time">${time}</span>` +
    `</span>`;
  feed.appendChild(el);
  feed.scrollTop = feed.scrollHeight;
}

function clearActivity() {
  const feed = document.getElementById('activity-feed');
  if (!feed) return;
  feed.innerHTML = '<div class="activity-idle"><span class="idle-icon"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="6" y="4" width="4" height="16" rx="1"/><rect x="14" y="4" width="4" height="16" rx="1"/></svg></span><span>البوت متوقف — اضغط "تشغيل" لبدء الحجز</span></div>';
}

// ─── Countdown card management ────────────────────────────────────────────────
let _countdownCardEl = null;
let _noApptCardEl    = null;

function routeBotMessage(msg) {
  const m = msg.toLowerCase();

  // ── Navigation steps ──
  if (m.includes('page detected: office')) {
    _noApptCardEl = null; _countdownCardEl = null;
    return addActivity('step', '◈', 'الصفحة: اختيار المنظمة / الجهة…');
  }
  if (m.includes('office selected'))
    return addActivity('success', '✓', msg);

  if (m.includes('page detected: calendar')) {
    return addActivity('step', '≡', 'الصفحة: اختيار نوع الحجز…');
  }
  if (m.includes('reservation type selected'))
    return addActivity('success', '✓', msg);

  if (m.includes('page detected: persons'))
    return addActivity('step', '◉', 'الصفحة: عدد الأشخاص…');
  if (m.includes('personcount'))
    return addActivity('success', '✅', 'تم اختيار عدد الأشخاص: 1');

  if (m.includes('page detected: info'))
    return addActivity('step', '◻', 'الصفحة: معلومات — جاري التجاوز…');

  if (m.includes('page detected: scheduler')) {
    _noApptCardEl = null; _countdownCardEl = null;
    return addActivity('step', '◷', 'الصفحة: البحث عن مواعيد متاحة…');
  }

  // ── No appointments + countdown ──
  if (m.startsWith('no_appointments:')) {
    const secs = parseInt(msg.split(':')[1]) || 30;
    _noApptCardEl = addActivityCard('wait', '✕', 'لا توجد مواعيد متاحة حالياً');
    _countdownCardEl = addActivityCard('wait', '◌', 'إعادة البحث خلال ' + secs + ' ثانية…');
    return;
  }
  if (m.startsWith('countdown:')) {
    const secs = parseInt(msg.split(':')[1]) || 0;
    if (_countdownCardEl) {
      _countdownCardEl.querySelector('.a-text').textContent =
        'إعادة البحث خلال ' + secs + ' ثانية…';
    }
    return;
  }

  // ── Appointment found ──
  if (m.includes('appointment slot selected')) {
    _noApptCardEl = null; _countdownCardEl = null;
    const slotTime = msg.split('→')[1]?.trim() || '';
    return addActivity('found', '◆', 'تم العثور على موعد! ' + slotTime);
  }

  // ── Form ──
  if (m.includes('page detected: form'))
    return addActivity('step', '✎', 'الصفحة: ملء البيانات الشخصية…');
  if (m.includes('form filled'))
    return addActivity('success', '✅', 'تم ملء جميع البيانات');
  if (m.includes('captcha solved'))
    return addActivity('success', '✓', 'تم حل الكابتشا: ' + msg.split('→')[1]?.trim());
  if (m.includes('no openai key') || m.includes('manual captcha'))
    return addActivity('wait', '⌨', 'أدخل الكابتشا يدوياً في نافذة البوت');

  // ── Confirmation ──
  if (m.includes('booking confirmed'))
    return addActivity('confirm', '★', 'تم الحجز بنجاح!');

  // ── Errors ──
  if (m.includes('error') || m.includes('not found'))
    return addActivity('error', '✕', msg);
}

// addActivityCard returns the DOM element (for updating)
function addActivityCard(type, icon, text) {
  const feed = document.getElementById('activity-feed');
  if (!feed) return null;
  const idle = feed.querySelector('.activity-idle');
  if (idle) idle.remove();

  const time = new Date().toLocaleTimeString('ar-EG', { hour12: false });
  const el = document.createElement('div');
  el.className = 'activity-msg ' + (type || 'step');
  el.innerHTML =
    `<span class="a-icon">${icon}</span>` +
    `<span class="a-body">` +
    `<span class="a-text">${escapeHtml(text)}</span>` +
    `<span class="a-time">${time}</span>` +
    `</span>`;
  feed.appendChild(el);
  feed.scrollTop = feed.scrollHeight;
  return el;
}

// ─── Status polling ───────────────────────────────────────────────────────────
function startStatusPolling() {
  if (!IS_ELECTRON) return;
  setInterval(async () => {
    try {
      const { running } = await window.electronAPI.getBotStatus();
      if (running !== botRunning) setBotState(running);
    } catch (_) {}
  }, 2000);
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
    desc.textContent  = 'اضغط "تشغيل" لبدء الحجز';
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
  line.innerHTML =
    `<span class="log-time">${time}</span><span class="log-msg">${escapeHtml(msg)}</span>`;
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

function setField(id, val) {
  const el = document.getElementById(id);
  if (!el || val === undefined || val === null || val === '') return;
  el.value = val;
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
