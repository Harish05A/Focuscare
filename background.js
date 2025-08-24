// Fixed Background service worker for FocusCare 2.0
class FocusCareStorage {
  constructor() {
    this.keys = {
      settings: 'focuscare_settings',
      analytics: 'focuscare_analytics',
      blocklist: 'focuscare_blocklist',
      sessions: 'focuscare_sessions'
    };
  }

  // Add the missing initialize method
  async initialize() {
    console.log('Initializing storage...');
    
    const settings = await this.getSettings();
    if (!settings || Object.keys(settings).length === 0) {
      console.log('Setting default settings');
      await this.setSettings(this.getDefaults());
    }

    const analytics = await this.getAnalytics();
    if (!analytics || Object.keys(analytics).length === 0) {
      console.log('Setting default analytics');
      await this.setAnalytics({
        totalFocusTime: 0,
        sessionsCompleted: 0,
        sitesBlocked: 0,
        dailyStats: {},
        weeklyTrend: []
      });
    }

    console.log('Storage initialized successfully');
  }

  getDefaults() {
    return {
      focusMode: false,
      blockingEnabled: true,
      strictMode: false,
      workingHours: { start: 9, end: 17 },
      breakInterval: 25,
      theme: 'dark'
    };
  }

  async getSettings() {
    try {
      const result = await chrome.storage.local.get([this.keys.settings]);
      return result[this.keys.settings] || this.getDefaults();
    } catch (error) {
      console.error('Error getting settings:', error);
      return this.getDefaults();
    }
  }

  async setSettings(settings) {
    try {
      return await chrome.storage.local.set({ [this.keys.settings]: settings });
    } catch (error) {
      console.error('Error setting settings:', error);
    }
  }

  async getAnalytics() {
    try {
      const result = await chrome.storage.local.get([this.keys.analytics]);
      return result[this.keys.analytics] || {
        totalFocusTime: 0,
        sessionsCompleted: 0,
        sitesBlocked: 0,
        dailyStats: {},
        weeklyTrend: []
      };
    } catch (error) {
      console.error('Error getting analytics:', error);
      return {
        totalFocusTime: 0,
        sessionsCompleted: 0,
        sitesBlocked: 0,
        dailyStats: {},
        weeklyTrend: []
      };
    }
  }

  async setAnalytics(analytics) {
    try {
      return await chrome.storage.local.set({ [this.keys.analytics]: analytics });
    } catch (error) {
      console.error('Error setting analytics:', error);
    }
  }

  async trackActivity(type, data) {
    try {
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
    } catch (error) {
      console.error('Error tracking activity:', error);
    }
  }
}

class FocusCareBackground {
  constructor() {
    this.storage = new FocusCareStorage();
    this.focusSession = null;
    this.init();
  }

  async init() {
    try {
      console.log('Initializing FocusCare background...');
      await this.storage.initialize();
      this.setupListeners();
      console.log('FocusCare background initialized successfully');
    } catch (error) {
      console.error('Failed to initialize background:', error);
    }
  }

  setupListeners() {
    // Message listener with proper async handling
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      console.log('Background received message:', message);
      
      // Handle the message asynchronously
      this.handleMessage(message, sender)
        .then(result => {
          console.log('Sending response:', result);
          sendResponse(result);
        })
        .catch(error => {
          console.error('Error handling message:', error);
          sendResponse({ error: error.message });
        });
      
      // Return true to indicate we'll send response asynchronously
      return true;
    });

    // Alarm listener
    chrome.alarms.onAlarm.addListener((alarm) => {
      console.log('Alarm triggered:', alarm.name);
      this.handleAlarm(alarm);
    });
  }

  async handleMessage(message, sender) {
  switch(message.action) {
    case 'startFocusSession':
      return await this.startFocusSession(message.duration, message.strictMode);
      
    case 'endFocusSession':
      return await this.endFocusSession();
      
    case 'getStats':
      return await this.getStats();
      
    case 'toggleBlocking':
      return await this.toggleBlocking();
      
    case 'quickBreak':
      return await this.startQuickBreak(message.duration);

    case 'trackPageVisit':
      // Silently handle page visits
      try {
        const analytics = await this.storage.getAnalytics();
        // Simple tracking without cluttering console
        return { success: true };
      } catch {
        return { success: false };
      }
      
    case 'trackActivity':
      // Silently handle activities
      try {
        const analytics = await this.storage.getAnalytics();
        return { success: true };
      } catch {
        return { success: false };
      }
      
    case 'trackTime':
      // Track productive time
      try {
        if (message.data.productive && message.data.timeSpent > 0) {
          await this.storage.trackActivity('focus_time', { 
            minutes: message.data.timeSpent 
          });
        }
        return { success: true };
      } catch {
        return { success: false };
      }
      
    default:
      // Don't throw errors for unknown actions - just log them
      console.log(`Unhandled action: ${message.action}`);
      return { success: false, message: `Unknown action: ${message.action}` };
  }
}


// ADD THESE NEW METHODS to FocusCareBackground class:

async trackPageVisit(data) {
  try {
    console.log('Tracking page visit:', data.url);
    
    // Store page visit data
    const analytics = await this.storage.getAnalytics();
    const today = new Date().toDateString();
    
    if (!analytics.dailyStats[today]) {
      analytics.dailyStats[today] = {
        focusTime: 0,
        blockedSites: 0,
        sessions: 0,
        distractions: 0,
        pageVisits: []
      };
    }
    
    analytics.dailyStats[today].pageVisits = analytics.dailyStats[today].pageVisits || [];
    analytics.dailyStats[today].pageVisits.push({
      url: data.url,
      title: data.title,
      productivityScore: data.productivityScore,
      timestamp: data.timestamp
    });
    
    // Keep only last 50 visits per day to save storage
    if (analytics.dailyStats[today].pageVisits.length > 50) {
      analytics.dailyStats[today].pageVisits = analytics.dailyStats[today].pageVisits.slice(-50);
    }
    
    await this.storage.setAnalytics(analytics);
    return { success: true };
    
  } catch (error) {
    console.error('Error tracking page visit:', error);
    return { success: false, error: error.message };
  }
}

async trackActivity(data) {
  try {
    console.log('Tracking activity:', data.type);
    
    // Store activity data
    const analytics = await this.storage.getAnalytics();
    const today = new Date().toDateString();
    
    if (!analytics.dailyStats[today]) {
      analytics.dailyStats[today] = {
        focusTime: 0,
        blockedSites: 0,
        sessions: 0,
        distractions: 0,
        activities: []
      };
    }
    
    analytics.dailyStats[today].activities = analytics.dailyStats[today].activities || [];
    analytics.dailyStats[today].activities.push({
      type: data.type,
      url: data.url,
      timestamp: data.timestamp || Date.now()
    });
    
    // Keep only last 100 activities per day
    if (analytics.dailyStats[today].activities.length > 100) {
      analytics.dailyStats[today].activities = analytics.dailyStats[today].activities.slice(-100);
    }
    
    await this.storage.setAnalytics(analytics);
    return { success: true };
    
  } catch (error) {
    console.error('Error tracking activity:', error);
    return { success: false, error: error.message };
  }
}

async trackTime(data) {
  try {
    console.log('Tracking time:', data.timeSpent, 'minutes on', data.url);
    
    if (data.timeSpent > 0) {
      if (data.productive) {
        await this.storage.trackActivity('focus_time', { minutes: data.timeSpent });
      }
      
      // Store detailed time tracking
      const analytics = await this.storage.getAnalytics();
      const today = new Date().toDateString();
      
      if (!analytics.dailyStats[today]) {
        analytics.dailyStats[today] = {
          focusTime: 0,
          blockedSites: 0,
          sessions: 0,
          distractions: 0,
          timeTracking: []
        };
      }
      
      analytics.dailyStats[today].timeTracking = analytics.dailyStats[today].timeTracking || [];
      analytics.dailyStats[today].timeTracking.push({
        url: data.url,
        timeSpent: data.timeSpent,
        productive: data.productive,
        productivityScore: data.productivityScore,
        timestamp: Date.now()
      });
      
      // Keep only last 50 time entries per day
      if (analytics.dailyStats[today].timeTracking.length > 50) {
        analytics.dailyStats[today].timeTracking = analytics.dailyStats[today].timeTracking.slice(-50);
      }
      
      await this.storage.setAnalytics(analytics);
    }
    
    return { success: true };
    
  } catch (error) {
    console.error('Error tracking time:', error);
    return { success: false, error: error.message };
  }
}

  async startFocusSession(duration = 25, strictMode = false) {
    try {
      console.log(`Starting focus session: ${duration} minutes, strict: ${strictMode}`);
      
      const settings = await this.storage.getSettings();
      settings.focusMode = true;
      settings.strictMode = strictMode;
      await this.storage.setSettings(settings);

      this.focusSession = {
        startTime: Date.now(),
        duration: duration * 60 * 1000,
        completed: false,
        strictMode: strictMode
      };

      // Set alarm for session end
      chrome.alarms.create('focusSessionEnd', {
        when: Date.now() + this.focusSession.duration
      });

      // Show notification
      try {
        await chrome.notifications.create('focusStart', {
          type: 'basic',
          iconUrl: 'icons/icon48.png',
          title: 'FocusCare 2.0',
          message: `${duration} minute focus session started! 🎯`
        });
      } catch (notifError) {
        console.log('Notification failed (probably not granted):', notifError);
      }

      console.log('Focus session started successfully');
      return { success: true, session: this.focusSession };
      
    } catch (error) {
      console.error('Error starting focus session:', error);
      throw new Error('Failed to start focus session');
    }
  }

  async endFocusSession(completed = false) {
    try {
      console.log('Ending focus session, completed:', completed);
      
      if (!this.focusSession) {
        return { success: true, message: 'No active session' };
      }

      const settings = await this.storage.getSettings();
      settings.focusMode = false;
      await this.storage.setSettings(settings);

      const sessionTime = Math.round((Date.now() - this.focusSession.startTime) / 1000 / 60);
      
      await this.storage.trackActivity('focus_time', { minutes: sessionTime });
      
      if (completed) {
        await this.storage.trackActivity('session_completed', {});
        
        try {
          await chrome.notifications.create('focusComplete', {
            type: 'basic',
            iconUrl: 'icons/icon48.png',
            title: 'Session Complete! 🎉',
            message: `Great job! You focused for ${sessionTime} minutes.`
          });
        } catch (notifError) {
          console.log('Notification failed:', notifError);
        }
      }

      this.focusSession = null;
      chrome.alarms.clear('focusSessionEnd');
      
      return { success: true, sessionTime: sessionTime };
      
    } catch (error) {
      console.error('Error ending focus session:', error);
      throw new Error('Failed to end focus session');
    }
  }

  async handleAlarm(alarm) {
    if (alarm.name === 'focusSessionEnd') {
      await this.endFocusSession(true);
    }
  }

  async toggleBlocking() {
    try {
      const settings = await this.storage.getSettings();
      settings.blockingEnabled = !settings.blockingEnabled;
      await this.storage.setSettings(settings);

      try {
        await chrome.notifications.create('blockingToggle', {
          type: 'basic',
          iconUrl: 'icons/icon48.png',
          title: 'FocusCare 2.0',
          message: `Website blocking ${settings.blockingEnabled ? 'enabled' : 'disabled'}`
        });
      } catch (notifError) {
        console.log('Notification failed:', notifError);
      }

      return { success: true, blockingEnabled: settings.blockingEnabled };
      
    } catch (error) {
      console.error('Error toggling blocking:', error);
      throw new Error('Failed to toggle blocking');
    }
  }

  async startQuickBreak(duration = 5) {
    try {
      const settings = await this.storage.getSettings();
      const originalFocusMode = settings.focusMode;
      settings.focusMode = false;
      await this.storage.setSettings(settings);

      chrome.alarms.create('breakEnd', {
        when: Date.now() + (duration * 60 * 1000)
      });

      try {
        await chrome.notifications.create('breakStart', {
          type: 'basic',
          iconUrl: 'icons/icon48.png',
          title: 'Break Time! ☕',
          message: `Enjoy your ${duration} minute break.`
        });
      } catch (notifError) {
        console.log('Notification failed:', notifError);
      }

      return { success: true, duration: duration };
      
    } catch (error) {
      console.error('Error starting quick break:', error);
      throw new Error('Failed to start quick break');
    }
  }

  async getStats() {
    try {
      const analytics = await this.storage.getAnalytics();
      const settings = await this.storage.getSettings();
      const today = new Date().toDateString();
      const todayStats = analytics.dailyStats[today] || {};

      const stats = {
        focusMode: settings.focusMode || false,
        blockingEnabled: settings.blockingEnabled !== false,
        todayFocusTime: todayStats.focusTime || 0,
        todayBlocked: todayStats.blockedSites || 0,
        totalSessions: analytics.sessionsCompleted || 0,
        currentSession: this.focusSession
      };

      console.log('Returning stats:', stats);
      return stats;
      
    } catch (error) {
      console.error('Error getting stats:', error);
      // Return default stats on error
      return {
        focusMode: false,
        blockingEnabled: true,
        todayFocusTime: 0,
        todayBlocked: 0,
        totalSessions: 0,
        currentSession: null
      };
    }
  }
}

// Add to background.js - Memory optimization
class PerformanceOptimizer {
  static async cleanupOldData() {
    const analytics = await storage.getAnalytics();
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - 90); // Keep 90 days
    
    // Clean old daily stats
    Object.keys(analytics.dailyStats).forEach(date => {
      if (new Date(date) < cutoffDate) {
        delete analytics.dailyStats[date];
      }
    });
    
    await storage.setAnalytics(analytics);
  }
  
  static async optimizeStorage() {
    // Run weekly cleanup
    chrome.alarms.create('weeklyCleanup', {
      periodInMinutes: 7 * 24 * 60 // Weekly
    });
  }
}

// Initialize background service
console.log('Initializing FocusCare 2.0 background script');
const focusCareBackground = new FocusCareBackground();
