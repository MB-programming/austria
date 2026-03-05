const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('terminalAPI', {
  onLog: (callback) => {
    ipcRenderer.on('terminal-log', (_, type, message) => {
      callback(type, message);
    });
  },
  onSetSessionId: (callback) => {
    ipcRenderer.on('set-session-id', (_, id) => {
      callback(id);
    });
  }
});
