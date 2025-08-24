// Free local storage management
class FocusCareStorage {
  constructor() {
    this.keys = {
      settings: 'focuscare_settings',
      analytics: 'focuscare_analytics',
      blocklist: 'focuscare_blocklist',
      sessions: 'focuscare_sessions'
    };
  }

  // Initialize default data
  async initialize() {
    const settings = await this.getSettings();
    if (!settings) {
      await this.setSettings({
        focusMode: false,
        blockingEnabled: true,
        strictMode: false,
        workingHours: { start: 9, end: 17 },
        breakInterval: 25, // minutes
        theme: 'dark'
      });
    }

    const analytics = await this.getAnalytics();
    if (!analytics) {
      await this.setAnalytics({
        totalFocusTime: 0,
        sessionsCompleted: 0,
        sitesBlocked: 0,
        dailyStats: {},
        weeklyTrend: []
      });
    }
  }

  // Settings management
  async getSettings() {
    const result = await chrome.storage.local.get([this.keys.settings]);
    return result[this.keys.settings];
  }

  async setSettings(settings) {
    return chrome.storage.local.set({ [this.keys.settings]: settings });
  }

  // Analytics management
  async getAnalytics() {
    const result = await chrome.storage.local.get([this.keys.analytics]);
    return result[this.keys.analytics];
  }

  async setAnalytics(analytics) {
    return chrome.storage.local.set({ [this.keys.analytics]: analytics });
  }

  // Track daily activity
  async trackActivity(type, data) {
    const analytics = await this.getAnalytics();
    const today = new Date().toDateString();
    
    if (!analytics.dailyStats[today]) {
      analytics.dailyStats[today] = {
        focusTime: 0,
        blockedSites: 0,
        sessions: 0,
        distractions: 0
      };
    }

    switch(type) {
      case 'focus_time':
        analytics.dailyStats[today].focusTime += data.minutes;
        analytics.totalFocusTime += data.minutes;
        break;
      case 'site_blocked':
        analytics.dailyStats[today].blockedSites++;
        analytics.sitesBlocked++;
        break;
      case 'session_completed':
        analytics.dailyStats[today].sessions++;
        analytics.sessionsCompleted++;
        break;
    }

    await this.setAnalytics(analytics);
  }

  // Get blocklist
  async getBlocklist() {
    const result = await chrome.storage.local.get([this.keys.blocklist]);
    return result[this.keys.blocklist] || this.getDefaultBlocklist();
  }

  getDefaultBlocklist() {
    return {
      social: ['facebook.com', 'instagram.com', 'twitter.com', 'tiktok.com', 'snapchat.com'],
      entertainment: ['youtube.com', 'netflix.com', 'hulu.com', 'twitch.tv', 'reddit.com'],
      shopping: ['amazon.com', 'ebay.com', 'alibaba.com', 'etsy.com'],
      news: ['cnn.com', 'bbc.com', 'buzzfeed.com', 'dailymail.co.uk'],
      games: ['steam.com', 'epicgames.com', 'roblox.com', 'minecraft.net']
    };
  }
}

// Global storage instance
window.FocusCareStorage = FocusCareStorage;
