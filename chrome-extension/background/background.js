/**
 * Austria Appointment Bot - Background Service Worker
 */

console.log('[AustriaBot] Background service worker started');

// Listen for extension installation
chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install') {
    console.log('[AustriaBot] Extension installed!');

    // Set default settings
    chrome.storage.local.set({
      botEnabled: false,
      botSettings: {
        office: 'KAIRO',
        reservationType: 'Bachelor',
        refreshIntervalSec: 30,
        navDelay: 800,
        slotPreferences: ['random'],
        notificationSound: 'beep',
        navRetryIntervalSec: 5
      }
    });

    // Open welcome page
    chrome.tabs.create({
      url: chrome.runtime.getURL('popup/popup.html')
    });
  } else if (details.reason === 'update') {
    console.log('[AustriaBot] Extension updated to version', chrome.runtime.getManifest().version);
  }
});

// Listen for messages from content script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === 'APPOINTMENT_FOUND') {
    console.log('[AustriaBot] Appointment found!', request.data);

    // Show notification
    chrome.notifications.create({
      type: 'basic',
      iconUrl: 'icons/icon128.png',
      title: '🎉 Appointment Found!',
      message: `موعد متاح! ${request.data.slots} slot(s) found`,
      priority: 2
    });

    sendResponse({ success: true });
  }

  if (request.type === 'BOOKING_COMPLETE') {
    console.log('[AustriaBot] Booking complete!');

    // Show notification
    chrome.notifications.create({
      type: 'basic',
      iconUrl: 'icons/icon128.png',
      title: '✅ Booking Complete!',
      message: 'تم الحجز بنجاح!',
      priority: 2
    });

    // Auto-disable bot
    chrome.storage.local.set({ botEnabled: false });

    sendResponse({ success: true });
  }

  return true; // Keep message channel open for async response
});

// Monitor tab updates
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url && tab.url.includes('appointment.bmeia.gv.at')) {
    chrome.storage.local.get(['botEnabled'], (data) => {
      if (data.botEnabled) {
        console.log('[AustriaBot] Injecting bot into tab:', tabId);
      }
    });
  }
});
