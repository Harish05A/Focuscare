// Enhanced Content script for FocusCare 2.0
class FocusCareContent {
  constructor() {
    this.pageStartTime = Date.now();
    this.isProductiveSite = false;
    this.lastActivityTime = Date.now();
    this.settings = null;
    this.init();
  }

  async init() {
    await this.loadSettings();
    this.analyzePage();
    this.setupPageTracking();
    this.setupActivityTracking();
  }

  async loadSettings() {
    try {
      const result = await chrome.storage.local.get(['focuscare_settings']);
      this.settings = result.focuscare_settings || {};
    } catch (error) {
      console.error('Failed to load settings:', error);
      this.settings = {};
    }
  }

  analyzePage() {
    const url = window.location.href;
    const title = document.title;
    
    const productiveIndicators = [
      'github', 'stackoverflow', 'docs', 'documentation', 'tutorial',
      'coursera', 'udemy', 'khan', 'wikipedia', 'scholar', 'learning',
      'education', 'study', 'research', 'code', 'programming'
    ];
    
    const distractingIndicators = [
      'facebook', 'instagram', 'twitter', 'tiktok', 'youtube',
      'reddit', 'netflix', 'amazon', 'shopping', 'game', 'entertainment'
    ];

    const urlLower = url.toLowerCase();
    const titleLower = title.toLowerCase();
    
    // Calculate productivity score
    let productivityScore = 0.5; // neutral
    
    productiveIndicators.forEach(indicator => {
      if (urlLower.includes(indicator) || titleLower.includes(indicator)) {
        productivityScore += 0.1;
      }
    });
    
    distractingIndicators.forEach(indicator => {
      if (urlLower.includes(indicator) || titleLower.includes(indicator)) {
        productivityScore -= 0.15;
      }
    });

    this.isProductiveSite = productivityScore > 0.6;
    this.productivityScore = Math.max(0, Math.min(1, productivityScore));

    this.trackPageVisit(url, title, this.productivityScore);
  }

  setupPageTracking() {
    // Track time spent on page
    window.addEventListener('beforeunload', () => {
      const timeSpent = Math.round((Date.now() - this.pageStartTime) / 1000 / 60);
      
      if (timeSpent > 0) {
        this.trackTimeSpent(timeSpent);
      }
    });

    // Track visibility changes
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        this.handlePageHidden();
      } else {
        this.handlePageVisible();
      }
    });

    // Track scroll activity (engagement)
    let scrollTimeout;
    window.addEventListener('scroll', () => {
      this.lastActivityTime = Date.now();
      
      clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(() => {
        this.trackActivity('scroll');
      }, 1000);
    });
  }

  setupActivityTracking() {
    // Track mouse and keyboard activity
    ['mousedown', 'mousemove', 'keydown', 'click'].forEach(event => {
      document.addEventListener(event, () => {
        this.lastActivityTime = Date.now();
      }, { passive: true });
    });

    // Check for inactivity
    setInterval(() => {
      const inactiveTime = Date.now() - this.lastActivityTime;
      if (inactiveTime > 30000) { // 30 seconds
        this.trackActivity('inactive');
      }
    }, 10000);
  }

  trackPageVisit(url, title, productivityScore) {
    chrome.runtime.sendMessage({
      action: 'trackPageVisit',
      data: {
        url: url,
        title: title,
        productivityScore: productivityScore,
        timestamp: Date.now()
      }
    }).catch(error => {
      console.log('Failed to track page visit:', error);
    });
  }

  trackTimeSpent(minutes) {
    chrome.runtime.sendMessage({
      action: 'trackTime',
      data: {
        url: window.location.href,
        timeSpent: minutes,
        productive: this.isProductiveSite,
        productivityScore: this.productivityScore
      }
    }).catch(error => {
      console.log('Failed to track time:', error);
    });
  }

  trackActivity(type) {
    chrome.runtime.sendMessage({
      action: 'trackActivity',
      data: {
        type: type,
        url: window.location.href,
        timestamp: Date.now()
      }
    }).catch(error => {
      console.log('Failed to track activity:', error);
    });
  }

  handlePageHidden() {
    this.trackActivity('page_hidden');
  }

  handlePageVisible() {
    this.lastActivityTime = Date.now();
    this.trackActivity('page_visible');
  }
}

// Initialize content script
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    new FocusCareContent();
  });
} else {
  new FocusCareContent();
}
