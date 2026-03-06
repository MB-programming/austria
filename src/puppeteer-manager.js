const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const { app } = require('electron');
const path = require('path');

// Add stealth plugin to avoid detection
puppeteer.use(StealthPlugin());

class PuppeteerSessionManager {
  constructor() {
    this.sessions = new Map(); // sessionId -> { browser, page, terminal }
  }

  /**
   * Launch a new Puppeteer session
   * @param {string} sessionId - Unique session identifier
   * @param {object} config - Session configuration
   * @param {object} terminalWindow - Electron terminal window for logging
   * @returns {Promise<object>} Session info
   */
  async launchSession(sessionId, config, terminalWindow) {
    if (this.sessions.has(sessionId)) {
      throw new Error(`Session ${sessionId} already exists`);
    }

    this.log(terminalWindow, 'info', `[Puppeteer] Launching session ${sessionId}...`);

    try {
      // Launch options
      const launchOptions = {
        headless: config.headless !== false, // Default to headless
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--no-first-run',
          '--no-zygote',
          '--disable-gpu',
          '--lang=en-US,en',
          '--window-size=1920,1080'
        ],
        defaultViewport: {
          width: 1920,
          height: 1080
        }
      };

      // Use system Chrome if available
      const chromePaths = [
        '/usr/bin/google-chrome',
        '/usr/bin/chromium-browser',
        '/usr/bin/chromium',
        'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
        'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
        '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
      ];

      for (const chromePath of chromePaths) {
        const fs = require('fs');
        if (fs.existsSync(chromePath)) {
          launchOptions.executablePath = chromePath;
          this.log(terminalWindow, 'success', `[Puppeteer] Using Chrome: ${chromePath}`);
          break;
        }
      }

      // Launch browser
      const browser = await puppeteer.launch(launchOptions);
      this.log(terminalWindow, 'success', '[Puppeteer] Browser launched successfully');

      // Create new page
      const page = await browser.newPage();

      // Set user agent to avoid detection
      await page.setUserAgent(
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      );

      // Set extra headers
      await page.setExtraHTTPHeaders({
        'Accept-Language': 'en-US,en;q=0.9'
      });

      // Enable console logging
      page.on('console', msg => {
        const text = msg.text();
        if (text.startsWith('[AustriaBot]')) {
          const cleanText = text.replace('[AustriaBot] ', '');
          const type = msg.type() === 'error' ? 'error' :
                       msg.type() === 'warning' ? 'warn' : 'success';
          this.log(terminalWindow, type, cleanText);
        }
      });

      // Handle page errors
      page.on('pageerror', error => {
        this.log(terminalWindow, 'error', `[Page Error] ${error.message}`);
      });

      // Store session
      this.sessions.set(sessionId, {
        browser,
        page,
        terminal: terminalWindow,
        config
      });

      this.log(terminalWindow, 'success', `[Puppeteer] Session ${sessionId} ready`);

      return {
        success: true,
        sessionId,
        headless: launchOptions.headless
      };

    } catch (error) {
      this.log(terminalWindow, 'error', `[Puppeteer] Failed to launch: ${error.message}`);
      throw error;
    }
  }

  /**
   * Navigate to URL and inject automation script
   * @param {string} sessionId - Session identifier
   * @param {string} url - Target URL
   * @param {object} settings - Bot settings
   */
  async navigateAndAutomate(sessionId, url, settings) {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error(`Session ${sessionId} not found`);
    }

    const { page, terminal } = session;

    try {
      this.log(terminal, 'info', `[Puppeteer] Navigating to ${url}...`);

      // Navigate to page with longer timeout and faster wait strategy
      await page.goto(url, {
        waitUntil: 'domcontentloaded', // Faster than networkidle2
        timeout: 120000 // 2 minutes
      });

      this.log(terminal, 'success', '[Puppeteer] Page loaded (DOM ready)');

      // Wait a bit for dynamic content
      await page.waitForTimeout(2000);

      this.log(terminal, 'info', '[Puppeteer] Waiting for page stability...');

      // Wait for body to be ready
      await page.waitForSelector('body', { timeout: 10000 });

      this.log(terminal, 'success', '[Puppeteer] Page fully loaded');

      // Inject automation script
      await this.injectAutomationScript(sessionId, settings);

    } catch (error) {
      this.log(terminal, 'error', `[Puppeteer] Navigation failed: ${error.message}`);
      this.log(terminal, 'info', '[Puppeteer] Retrying with minimal wait...');

      // Retry with even more minimal wait
      try {
        await page.goto(url, {
          waitUntil: 'load',
          timeout: 120000
        });
        await page.waitForTimeout(3000);
        await this.injectAutomationScript(sessionId, settings);
        this.log(terminal, 'success', '[Puppeteer] Recovered successfully!');
      } catch (retryError) {
        this.log(terminal, 'error', `[Puppeteer] Retry failed: ${retryError.message}`);
        throw retryError;
      }
    }
  }

  /**
   * Inject Austrian appointment automation script
   * @param {string} sessionId - Session identifier
   * @param {object} config - Full config with person and settings
   */
  async injectAutomationScript(sessionId, config) {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error(`Session ${sessionId} not found`);
    }

    const { page, terminal } = session;

    try {
      this.log(terminal, 'info', '[Puppeteer] Injecting automation script...');

      // Build the bot script using the same function as Electron sessions
      const buildScript = require('./build-script');
      const botScript = buildScript(config);

      // Inject script
      await page.evaluate(botScript);

      this.log(terminal, 'success', '[Puppeteer] Automation script injected successfully');

    } catch (error) {
      this.log(terminal, 'error', `[Puppeteer] Script injection failed: ${error.message}`);
      this.log(terminal, 'error', `[Puppeteer] Error details: ${error.stack || error}`);
      throw error;
    }
  }

  /**
   * Stop a Puppeteer session
   * @param {string} sessionId - Session identifier
   */
  async stopSession(sessionId) {
    const session = this.sessions.get(sessionId);
    if (!session) {
      return { success: false, message: 'Session not found' };
    }

    try {
      const { browser, terminal } = session;
      this.log(terminal, 'info', `[Puppeteer] Stopping session ${sessionId}...`);

      await browser.close();
      this.sessions.delete(sessionId);

      this.log(terminal, 'success', `[Puppeteer] Session ${sessionId} stopped`);

      return { success: true };
    } catch (error) {
      return { success: false, message: error.message };
    }
  }

  /**
   * Stop all sessions
   */
  async stopAllSessions() {
    const sessionIds = Array.from(this.sessions.keys());
    for (const sessionId of sessionIds) {
      await this.stopSession(sessionId);
    }
  }

  /**
   * Get session status
   * @param {string} sessionId - Session identifier
   */
  getSessionStatus(sessionId) {
    const session = this.sessions.get(sessionId);
    if (!session) {
      return { running: false };
    }

    return {
      running: true,
      headless: session.config.headless !== false,
      url: session.page.url()
    };
  }

  /**
   * Log message to terminal
   * @param {object} terminalWindow - Electron terminal window
   * @param {string} type - Log type (success, error, warn, info)
   * @param {string} message - Log message
   */
  log(terminalWindow, type, message) {
    if (!terminalWindow || terminalWindow.isDestroyed()) {
      console.log(`[${type}] ${message}`);
      return;
    }

    terminalWindow.webContents.send('terminal-log', type, message);
  }
}

module.exports = new PuppeteerSessionManager();
