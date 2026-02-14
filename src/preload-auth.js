const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('authAPI', {
  validate:     (key) => ipcRenderer.invoke('auth-validate', key),
  trial:        ()    => ipcRenderer.invoke('auth-trial'),
  openExternal: (url) => ipcRenderer.invoke('open-external', url)
});
