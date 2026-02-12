const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  getSettings:  ()         => ipcRenderer.invoke('get-settings'),
  saveSettings: (data)     => ipcRenderer.invoke('save-settings', data),
  startBot:     (config)   => ipcRenderer.invoke('start-bot', config),
  stopBot:      ()         => ipcRenderer.invoke('stop-bot'),
  getBotStatus: ()         => ipcRenderer.invoke('bot-status'),
  onBotStopped: (cb)       => ipcRenderer.on('bot-stopped', cb),
  onBotLog:     (cb)       => ipcRenderer.on('bot-log', (_, data) => cb(data))
});
