// Grid cell bot injection script
// This runs in each webview to start the bot

const { ipcRenderer } = require('electron');

// Wait for bot script from main process
ipcRenderer.on('inject-bot-script', (_, script) => {
  try {
    console.log('[GridCell] Executing bot script...');
    // Execute the bot script
    eval(script);
    console.log('[GridCell] ✓ Bot script injected successfully');
  } catch (err) {
    console.error('[GridCell] ✗ Failed to execute bot script:', err);
  }
});

// Signal ready after DOM is loaded
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    console.log('[GridCell] ✓ Ready');
  });
} else {
  console.log('[GridCell] ✓ Ready');
}
