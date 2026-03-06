// Grid cell bot injection script
// This runs in each webview to start the bot

console.log('[GridCell] Preload script loaded!');

const { ipcRenderer } = require('electron');

console.log('[GridCell] ipcRenderer available:', !!ipcRenderer);

// Wait for bot script from main process
ipcRenderer.on('inject-bot-script', (_, script) => {
  try {
    console.log('[GridCell] Received bot script, length:', script.length);
    console.log('[GridCell] Executing bot script...');

    // Execute the bot script
    eval(script);

    console.log('[GridCell] ✓ Bot script executed successfully');
  } catch (err) {
    console.error('[GridCell] ✗ Failed to execute bot script:', err);
    console.error('[GridCell] Error stack:', err.stack);
  }
});

// Signal ready after DOM is loaded
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    console.log('[GridCell] ✓ DOM Ready, URL:', window.location.href);
  });
} else {
  console.log('[GridCell] ✓ Already Ready, URL:', window.location.href);
}

console.log('[GridCell] Preload script setup complete');
