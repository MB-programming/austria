const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('gridWindowAPI', {
  onInitGrid: (callback) => {
    ipcRenderer.on('init-grid', (_, config) => {
      callback(config);
    });
  },
  onCellLog: (callback) => {
    ipcRenderer.on('cell-log', (_, cellId, type, message) => {
      callback(cellId, type, message);
    });
  },
  injectScript: (cellId, settings) => {
    ipcRenderer.send('inject-cell-script', cellId, settings);
  },
  sendLog: (cellId, type, message) => {
    ipcRenderer.send('grid-cell-log', cellId, type, message);
  },
  openTerminal: () => {
    ipcRenderer.send('open-grid-terminal');
  },
  stopAll: () => {
    ipcRenderer.send('stop-grid');
  }
});
