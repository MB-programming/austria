/**
 * sync-www.js
 * Copies renderer files from ../src/renderer/ into www/,
 * then appends mobile-responsive CSS overrides.
 */
const fs   = require('fs');
const path = require('path');

const SRC = path.resolve(__dirname, '../src/renderer');
const DST = path.resolve(__dirname, 'www');

if (!fs.existsSync(DST)) fs.mkdirSync(DST, { recursive: true });

// Copy HTML, JS, CSS
['index.html', 'renderer.js', 'style.css'].forEach(f => {
  fs.copyFileSync(path.join(SRC, f), path.join(DST, f));
  console.log(`Copied ${f}`);
});

// Append mobile responsive overrides to style.css
const mobileCss = `
/* ===========================
   MOBILE / CAPACITOR ANDROID
   =========================== */
@media (max-width: 768px) {
  /* Turn sidebar into bottom tab bar */
  .app {
    flex-direction: column-reverse;
    overflow: hidden;
  }

  .sidebar {
    width: 100%;
    height: auto;
    border-right: none;
    border-top: 1px solid var(--border);
    padding: 0;
    flex-shrink: 0;
  }

  .logo,
  .sidebar-footer {
    display: none;
  }

  .nav {
    flex-direction: row;
    justify-content: space-around;
    padding: 6px 0;
    gap: 0;
    overflow-x: auto;
  }

  .nav-btn {
    flex-direction: column;
    gap: 3px;
    padding: 6px 10px;
    font-size: 10px;
    border-radius: 8px;
    min-width: 52px;
  }

  .nav-icon {
    width: 20px;
    height: 20px;
  }

  .content {
    flex: 1;
    overflow-y: auto;
    overflow-x: hidden;
  }

  .tab {
    padding: 16px 14px 80px;
  }

  .tab-header h1 {
    font-size: 20px;
  }

  /* Bot card stacked */
  .bot-card {
    flex-direction: column;
    align-items: center;
    gap: 16px;
    padding: 20px 14px;
  }

  .bot-actions {
    flex-direction: row;
    gap: 10px;
    width: 100%;
  }

  .btn-start,
  .btn-stop {
    flex: 1;
    padding: 12px 8px;
    font-size: 14px;
  }

  /* Info cards 2-col grid */
  .info-cards {
    grid-template-columns: 1fr 1fr;
  }

  /* Form: single column */
  .form-row {
    flex-direction: column;
    gap: 0;
  }

  /* Sound grid 2-col */
  .sound-grid {
    grid-template-columns: 1fr 1fr;
  }

  /* Activity panel */
  .activity-feed {
    max-height: 220px;
  }
}

/* Safe area for phones with notch/home bar */
body {
  padding-bottom: env(safe-area-inset-bottom, 0px);
}
`;

fs.appendFileSync(path.join(DST, 'style.css'), mobileCss);
console.log('Appended mobile CSS to style.css');
console.log('www/ ready.');
