// Intelligent website blocker
class FocusCareBlocker {
  constructor() {
    this.storage = new FocusCareStorage();
    this.isBlocking = false;
  }

  // Analyze if site should be blocked
  async shouldBlockSite(url) {
    const settings = await this.storage.getSettings();
    if (!settings.blockingEnabled) return false;

    const blocklist = await this.storage.getBlocklist();
    const domain = this.extractDomain(url);
    
    // Check if site is in blocklist
    for (const category of Object.values(blocklist)) {
      if (category.some(site => domain.includes(site))) {
        return await this.evaluateBlockingContext(url, settings);
      }
    }
    
    return false;
  }

  // Smart context evaluation
  async evaluateBlockingContext(url, settings) {
    const currentHour = new Date().getHours();
    
    // Working hours check
    if (settings.workingHours) {
      const isWorkingHours = currentHour >= settings.workingHours.start && 
                           currentHour <= settings.workingHours.end;
      if (!isWorkingHours && !settings.strictMode) return false;
    }

    // Focus mode check
    if (settings.focusMode) return true;

    // Check recent productivity
    const recentActivity = await this.getRecentActivity();
    if (recentActivity.productivityScore < 0.3) return true;

    return settings.strictMode;
  }

  // Extract domain from URL
  extractDomain(url) {
    try {
      return new URL(url).hostname.replace('www.', '');
    } catch {
      return '';
    }
  }

  // Get recent user activity
  async getRecentActivity() {
    const analytics = await this.storage.getAnalytics();
    const today = new Date().toDateString();
    const todayStats = analytics.dailyStats[today] || {};
    
    return {
      productivityScore: this.calculateProductivityScore(todayStats),
      focusTime: todayStats.focusTime || 0,
      distractions: todayStats.blockedSites || 0
    };
  }

  // Calculate productivity score (0-1)
  calculateProductivityScore(stats) {
    const focusTime = stats.focusTime || 0;
    const distractions = stats.blockedSites || 0;
    
    if (focusTime === 0) return 0.5;
    
    const score = Math.min(1, focusTime / (focusTime + distractions * 10));
    return score;
  }

  // Block page with custom message
  async blockPage(url) {
    await this.storage.trackActivity('site_blocked', { url });
    
    return `
      <html>
        <head>
          <title>FocusCare 2.0 - Stay Focused</title>
          <style>
            body { 
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              color: white;
              display: flex;
              justify-content: center;
              align-items: center;
              min-height: 100vh;
              margin: 0;
            }
            .block-message {
              text-align: center;
              background: rgba(255,255,255,0.1);
              padding: 3rem;
              border-radius: 20px;
              backdrop-filter: blur(10px);
              box-shadow: 0 8px 32px rgba(0,0,0,0.3);
              max-width: 500px;
            }
            h1 { font-size: 2.5rem; margin-bottom: 1rem; }
            p { font-size: 1.2rem; opacity: 0.9; margin-bottom: 2rem; }
            .stats { 
              background: rgba(255,255,255,0.2);
              padding: 1rem;
              border-radius: 10px;
              margin: 1rem 0;
            }
            .back-btn {
              background: white;
              color: #667eea;
              border: none;
              padding: 12px 24px;
              border-radius: 25px;
              font-weight: bold;
              cursor: pointer;
              transition: transform 0.2s;
            }
            .back-btn:hover { transform: scale(1.05); }
          </style>
        </head>
        <body>
          <div class="block-message">
            <h1>🎯 Stay Focused!</h1>
            <p>This site is blocked to help you maintain productivity.</p>
            <div class="stats">
              <div>Focus time today: <span id="focus-time">Loading...</span></div>
              <div>Sites blocked: <span id="blocked-count">Loading...</span></div>
            </div>
            <button class="back-btn" onclick="history.back()">Go Back</button>
            <button class="back-btn" onclick="chrome.runtime.sendMessage({action: 'openOptions'})">
              Settings
            </button>
          </div>
          
          <script>
            // Load and display stats
            chrome.storage.local.get(['focuscare_analytics'], (result) => {
              const analytics = result.focuscare_analytics || {};
              const today = new Date().toDateString();
              const todayStats = analytics.dailyStats[today] || {};
              
              document.getElementById('focus-time').textContent = 
                Math.round(todayStats.focusTime || 0) + ' minutes';
              document.getElementById('blocked-count').textContent = 
                todayStats.blockedSites || 0;
            });
          </script>
        </body>
      </html>
    `;
  }
}

window.FocusCareBlocker = FocusCareBlocker;
