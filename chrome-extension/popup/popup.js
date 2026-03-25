/**
 * Austria Appointment Bot - Popup Script
 */

// Elements
const saveBtn = document.getElementById('saveBtn');
const toggleBtn = document.getElementById('toggleBtn');
const message = document.getElementById('message');
const statusIndicator = document.getElementById('statusIndicator');
const statusText = document.getElementById('statusText');

// Tab switching
document.querySelectorAll('.tab').forEach(tab => {
  tab.addEventListener('click', () => {
    const targetTab = tab.dataset.tab;

    // Update active tab
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    tab.classList.add('active');

    // Update active content
    document.querySelectorAll('.tab-content').forEach(content => {
      content.classList.remove('active');
    });
    document.getElementById(targetTab).classList.add('active');
  });
});

// Load settings on popup open
loadSettings();

// Save settings
saveBtn.addEventListener('click', saveSettings);

// Toggle bot
toggleBtn.addEventListener('click', toggleBot);

/**
 * Load settings from Chrome storage
 */
function loadSettings() {
  chrome.storage.local.get(['botSettings', 'personData', 'botEnabled'], (data) => {
    // Load bot settings
    if (data.botSettings) {
      const settings = data.botSettings;
      document.getElementById('office').value = settings.office || 'KAIRO';
      document.getElementById('reservationType').value = settings.reservationType || 'Bachelor';
      document.getElementById('refreshInterval').value = settings.refreshIntervalSec || 30;
      document.getElementById('navDelay').value = settings.navDelay || 800;
      document.getElementById('slotPreference').value = (settings.slotPreferences && settings.slotPreferences[0]) || 'random';
      document.getElementById('notificationSound').value = settings.notificationSound || 'beep';
      document.getElementById('activationCode').value = settings.activationCode || '';
      document.getElementById('openaiApiKey').value = settings.openaiApiKey || '';
    }

    // Load personal data
    if (data.personData) {
      const person = data.personData;
      document.getElementById('firstname').value = person.firstname || '';
      document.getElementById('lastname').value = person.lastname || '';
      // Convert date from M/D/YYYY to YYYY-MM-DD for date picker
      document.getElementById('dateOfBirth').value = convertToDatePickerFormat(person.dateOfBirth) || '';
      document.getElementById('passportNumber').value = person.passportNumber || '';
      document.getElementById('sex').value = person.sex || 'male';
      document.getElementById('street').value = person.street || '';
      document.getElementById('postcode').value = person.postcode || '';
      document.getElementById('city').value = person.city || '';
      document.getElementById('country').value = person.country || '';
      document.getElementById('nationality').value = person.nationality || '';
      document.getElementById('nationalityAtBirth').value = person.nationalityAtBirth || '';
      document.getElementById('actualNationality').value = person.actualNationality || '';
      document.getElementById('countryOfBirth').value = person.countryOfBirth || '';
      document.getElementById('telephone').value = person.telephone || '';
      document.getElementById('email').value = person.email || '';
      document.getElementById('placeOfBirth').value = person.placeOfBirth || '';
      document.getElementById('passportIssueDate').value = convertToDatePickerFormat(person.passportIssueDate) || '';
      document.getElementById('passportExpiry').value = convertToDatePickerFormat(person.passportExpiry) || '';
    }

    // Update status
    updateStatus(data.botEnabled || false);
  });
}

/**
 * Save settings to Chrome storage
 */
function saveSettings() {
  const botSettings = {
    office: document.getElementById('office').value.trim() || 'KAIRO',
    reservationType: document.getElementById('reservationType').value.trim() || 'Bachelor',
    refreshIntervalSec: parseInt(document.getElementById('refreshInterval').value) || 30,
    navDelay: parseInt(document.getElementById('navDelay').value) || 800,
    slotPreferences: [document.getElementById('slotPreference').value || 'random'],
    notificationSound: document.getElementById('notificationSound').value || 'beep',
    navRetryIntervalSec: 5,
    activationCode: document.getElementById('activationCode').value.trim() || '',
    openaiApiKey: document.getElementById('openaiApiKey').value.trim() || ''
  };

  // Convert dates from YYYY-MM-DD (date picker) to M/D/YYYY (form format)
  const dobValue = document.getElementById('dateOfBirth').value.trim();
  const issueValue = document.getElementById('passportIssueDate').value.trim();
  const expiryValue = document.getElementById('passportExpiry').value.trim();

  const personData = {
    firstname: document.getElementById('firstname').value.trim(),
    lastname: document.getElementById('lastname').value.trim(),
    dateOfBirth: convertToFormFormat(dobValue),
    passportNumber: document.getElementById('passportNumber').value.trim(),
    sex: document.getElementById('sex').value,
    street: document.getElementById('street').value.trim(),
    postcode: document.getElementById('postcode').value.trim(),
    city: document.getElementById('city').value.trim(),
    country: document.getElementById('country').value.trim(),
    nationality: document.getElementById('nationality').value.trim(),
    nationalityAtBirth: document.getElementById('nationalityAtBirth').value.trim() || document.getElementById('nationality').value.trim(),
    actualNationality: document.getElementById('actualNationality').value.trim() || document.getElementById('nationality').value.trim(),
    countryOfBirth: document.getElementById('countryOfBirth').value.trim() || document.getElementById('country').value.trim(),
    telephone: document.getElementById('telephone').value.trim(),
    email: document.getElementById('email').value.trim(),
    placeOfBirth: document.getElementById('placeOfBirth').value.trim(),
    passportIssueDate: convertToFormFormat(issueValue),
    passportExpiry: convertToFormFormat(expiryValue),
    lastnameAtBirth: document.getElementById('lastname').value.trim() // Same as lastname
  };

  // Validate
  if (!personData.firstname || !personData.lastname) {
    showMessage('⚠️ الرجاء إدخال الاسم الأول واسم العائلة', 'error');
    return;
  }

  if (!personData.passportNumber) {
    showMessage('⚠️ الرجاء إدخال رقم الجواز', 'error');
    return;
  }

  // Save to storage
  chrome.storage.local.set({ botSettings, personData }, () => {
    showMessage('✅ تم حفظ الإعدادات بنجاح!', 'success');
    console.log('Settings saved:', { botSettings, personData });
  });
}

/**
 * Toggle bot on/off
 */
function toggleBot() {
  chrome.storage.local.get(['botEnabled', 'botSettings', 'personData'], (data) => {
    const currentStatus = data.botEnabled || false;

    // Check if settings are configured
    if (!currentStatus && (!data.botSettings || !data.personData)) {
      showMessage('⚠️ الرجاء حفظ الإعدادات أولاً', 'error');
      return;
    }

    // Toggle status
    const newStatus = !currentStatus;
    chrome.storage.local.set({ botEnabled: newStatus }, () => {
      updateStatus(newStatus);

      if (newStatus) {
        showMessage('✅ تم تفعيل البوت! افتح موقع السفارة الآن', 'success');
      } else {
        showMessage('⏸️ تم إيقاف البوت', 'error');
      }

      // Reload all tabs with the appointment site
      chrome.tabs.query({ url: 'https://appointment.bmeia.gv.at/*' }, (tabs) => {
        tabs.forEach(tab => {
          chrome.tabs.reload(tab.id);
        });
      });
    });
  });
}

/**
 * Update status indicator
 */
function updateStatus(enabled) {
  if (enabled) {
    statusIndicator.classList.add('active');
    statusText.textContent = 'مفعّل';
    toggleBtn.textContent = '⏸️ إيقاف البوت';
    toggleBtn.classList.add('active');
  } else {
    statusIndicator.classList.remove('active');
    statusText.textContent = 'معطّل';
    toggleBtn.textContent = '▶ تفعيل البوت';
    toggleBtn.classList.remove('active');
  }
}

/**
 * Show message
 */
function showMessage(text, type) {
  message.textContent = text;
  message.className = 'message show ' + type;

  setTimeout(() => {
    message.classList.remove('show');
  }, 3000);
}

/**
 * Convert date from YYYY-MM-DD (date picker format) to M/D/YYYY (form format)
 * Example: "2016-03-15" → "3/15/2016"
 */
function convertToFormFormat(dateStr) {
  if (!dateStr) return '';

  // If already in M/D/YYYY format, return as is
  if (dateStr.includes('/')) return dateStr;

  // Convert from YYYY-MM-DD
  const parts = dateStr.split('-');
  if (parts.length !== 3) return dateStr;

  const [year, month, day] = parts;
  // Remove leading zeros and format as M/D/YYYY
  return `${parseInt(month)}/${parseInt(day)}/${year}`;
}

/**
 * Convert date from M/D/YYYY (form format) to YYYY-MM-DD (date picker format)
 * Example: "3/15/2016" → "2016-03-15"
 */
function convertToDatePickerFormat(dateStr) {
  if (!dateStr) return '';

  // If already in YYYY-MM-DD format, return as is
  if (dateStr.includes('-') && dateStr.length === 10) return dateStr;

  // Convert from M/D/YYYY or MM/DD/YYYY
  const parts = dateStr.split('/');
  if (parts.length !== 3) return dateStr;

  const [month, day, year] = parts;
  // Pad with zeros and format as YYYY-MM-DD
  return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
}
