const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('gridAPI', {
  startGrid: (config) => ipcRenderer.invoke('start-grid', config)
});
