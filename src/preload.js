const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  getSettings:      ()       => ipcRenderer.invoke('get-settings'),
  saveSettings:     (data)   => ipcRenderer.invoke('save-settings', data),
  startBot:         (config) => ipcRenderer.invoke('start-bot', config),
  stopBot:          ()       => ipcRenderer.invoke('stop-bot'),
  getBotStatus:     ()       => ipcRenderer.invoke('bot-status'),
  onBotStopped:     (cb)     => ipcRenderer.on('bot-stopped', cb),
  onBotLog:         (cb)     => ipcRenderer.on('bot-log', (_, data) => cb(data)),
  openExternal:     (url)    => ipcRenderer.invoke('open-external', url),
  startMonitor:     (config) => ipcRenderer.invoke('start-monitor', config),
  stopMonitor:      ()       => ipcRenderer.invoke('stop-monitor'),
  getMonitorStatus: ()       => ipcRenderer.invoke('monitor-status'),
  onMonitorStopped: (cb)     => ipcRenderer.on('monitor-stopped', cb),
  onMonitorLog:     (cb)     => ipcRenderer.on('monitor-log', (_, data) => cb(data)),
  onBookingComplete:(cb)     => ipcRenderer.on('booking-complete', cb),
  // Multi-session
  getSessions:      ()           => ipcRenderer.invoke('get-sessions'),
  saveSessions:     (sessions)   => ipcRenderer.invoke('save-sessions', sessions),
  startSession:     (id, config) => ipcRenderer.invoke('start-session', id, config),
  stopSession:      (id)         => ipcRenderer.invoke('stop-session', id),
  getSessionStatus: (id)         => ipcRenderer.invoke('session-status', id),
  onSessionLog:     (cb)         => ipcRenderer.on('session-log',     (_, data) => cb(data)),
  onSessionStopped: (cb)         => ipcRenderer.on('session-stopped', (_, data) => cb(data)),
  // Puppeteer sessions
  startPuppeteerSession:  (id, config) => ipcRenderer.invoke('start-puppeteer-session', id, config),
  stopPuppeteerSession:   (id)         => ipcRenderer.invoke('stop-puppeteer-session', id),
  getPuppeteerStatus:     (id)         => ipcRenderer.invoke('puppeteer-session-status', id),
  // Grid session
  openGridSettings: ()           => ipcRenderer.invoke('open-grid-settings')
});
