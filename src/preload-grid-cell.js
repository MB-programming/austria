// Grid cell bot injection script
// This runs in each webview to start the bot

const { ipcRenderer } = require('electron');

// Wait for bot script from main process
ipcRenderer.on('inject-bot-script', (_, script) => {
  try {
    // Execute the bot script
    eval(script);
    console.log('[GridCell] Bot script injected successfully');
  } catch (err) {
    console.error('[GridCell] Failed to execute bot script:', err);
  }
});

// Send ready signal
ipcRenderer.send('grid-cell-ready', window.location.href);
