// FocusCare 2.0 Options Page Logic
class FocusCareOptions {
  constructor() {
    this.storage = null;
    this.currentTab = 'general';
    this.settings = {};
    this.analytics = {};
    this.blocklist = {};
    this.currentCategory = 'social';
    this.init();
  }

  async init() {
    console.log('Initializing options page');
    await this.initStorage();
    await this.loadAllData();
    this.setupEventListeners();
    this.updateUI();
    this.loadAnalytics();
  }

  async initStorage() {
    // Initialize storage helper
    this.storage = {
      async getSettings() {
        const result = await chrome.storage.local.get(['focuscare_settings']);
        return result.focuscare_settings || this.getDefaults();
      },

      async setSettings(settings) {
        return chrome.storage.local.set({ 'focuscare_settings': settings });
      },

      async getAnalytics() {
        const result = await chrome.storage.local.get(['focuscare_analytics']);
        return result.focuscare_analytics || {
          totalFocusTime: 0,
          sessionsCompleted: 0,
          sitesBlocked: 0,
          dailyStats: {},
          weeklyTrend: []
        };
      },

      async getBlocklist() {
        const result = await chrome.storage.local.get(['focuscare_blocklist']);
        return result.focuscare_blocklist || this.getDefaultBlocklist();
      },

      async setBlocklist(blocklist) {
        return chrome.storage.local.set({ 'focuscare_blocklist': blocklist });
      },

      getDefaults() {
        return {
          theme: 'dark',
          notificationsEnabled: true,
          sessionReminders: true,
          dailySummary: true,
          workingHoursEnabled: false,
          workStartTime: '09:00',
          workEndTime: '17:00',
          blockingEnabled: true,
          strictModeGlobal: false,
          defaultDuration: 25,
          breakInterval: 15,
          autoStartWork: false,
          continueSessions: false,
          focusSounds: false,
          soundType: 'none',
          lowMemoryMode: false,
          dataRetention: 90,
          anonymousAnalytics: true,
          localOnly: true
        };
      },

      getDefaultBlocklist() {
        return {
          social: [
            'facebook.com', 'instagram.com', 'twitter.com', 'tiktok.com', 
            'snapchat.com', 'linkedin.com', 'pinterest.com'
          ],
          entertainment: [
            'youtube.com', 'netflix.com', 'hulu.com', 'twitch.tv', 
            'reddit.com', 'imgur.com', ' 9gag.com'
          ],
          shopping: [
            'amazon.com', 'ebay.com', 'alibaba.com', 'etsy.com', 
            'walmart.com', 'target.com'
          ],
          news: [
            'cnn.com', 'bbc.com', 'buzzfeed.com', 'dailymail.co.uk', 
            'huffpost.com', 'fox.com'
          ],
          custom: []
        };
      }
    };
  }

  async loadAllData() {
    try {
      this.settings = await this.storage.getSettings();
      this.analytics = await this.storage.getAnalytics();
      this.blocklist = await this.storage.getBlocklist();
      console.log('Data loaded:', { settings: this.settings, analytics: this.analytics });
    } catch (error) {
      console.error('Failed to load data:', error);
      this.settings = this.storage.getDefaults();
      this.blocklist = this.storage.getDefaultBlocklist();
    }
  }

  setupEventListeners() {
    // Tab navigation
    document.querySelectorAll('.tab-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        this.switchTab(e.target.dataset.tab);
      });
    });

    // Save settings button
    document.getElementById('save-settings').addEventListener('click', () => {
      this.saveSettings();
    });

    // Export data
    document.getElementById('export-data').addEventListener('click', () => {
      this.exportData();
    });

    // Category buttons for blocking
    document.querySelectorAll('.category-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        this.switchCategory(e.target.dataset.category);
      });
    });

    // Add site button
    document.getElementById('add-site-btn').addEventListener('click', () => {
      this.addCustomSite();
    });

    // Enter key for add site
    document.getElementById('new-site-input').addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        this.addCustomSite();
      }
    });

    // Data management buttons
    document.getElementById('backup-data').addEventListener('click', () => {
      this.backupData();
    });

    document.getElementById('restore-data').addEventListener('click', () => {
      this.restoreData();
    });

    document.getElementById('reset-data').addEventListener('click', () => {
      this.resetAllData();
    });

    // File input for restore
    document.getElementById('restore-file-input').addEventListener('change', (e) => {
      this.handleRestoreFile(e.target.files[0]);
    });

    // Form change listeners
    this.setupFormListeners();
  }

  setupFormListeners() {
    // Get all form inputs
    const inputs = document.querySelectorAll('input, select');
    
    inputs.forEach(input => {
      const eventType = input.type === 'checkbox' ? 'change' : 'input';
      input.addEventListener(eventType, () => {
        this.updateSettingsFromForm();
      });
    });
  }

  switchTab(tabName) {
    console.log('Switching to tab:', tabName);
    this.currentTab = tabName;

    // Update tab buttons
    document.querySelectorAll('.tab-btn').forEach(btn => {
      btn.classList.remove('active');
    });
    document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');

    // Update tab panels
    document.querySelectorAll('.tab-panel').forEach(panel => {
      panel.classList.remove('active');
    });
    document.getElementById(`${tabName}-panel`).classList.add('active');
  }

  switchCategory(category) {
    this.currentCategory = category;

    // Update category buttons
    document.querySelectorAll('.category-btn').forEach(btn => {
      btn.classList.remove('active');
    });
    document.querySelector(`[data-category="${category}"]`).classList.add('active');

    // Update sites list
    this.updateSitesList();
  }

  updateUI() {
    this.populateFormFromSettings();
    this.updateSitesList();
    this.updateAnalyticsDisplay();
    this.updateDataInfo();
  }

  populateFormFromSettings() {
    // General settings
    document.getElementById('theme-select').value = this.settings.theme || 'dark';
    document.getElementById('notifications-enabled').checked = this.settings.notificationsEnabled !== false;
    document.getElementById('session-reminders').checked = this.settings.sessionReminders !== false;
    document.getElementById('daily-summary').checked = this.settings.dailySummary !== false;
    
    // Working hours
    document.getElementById('working-hours-enabled').checked = this.settings.workingHoursEnabled || false;
    document.getElementById('work-start-time').value = this.settings.workStartTime || '09:00';
    document.getElementById('work-end-time').value = this.settings.workEndTime || '17:00';

    // Blocking settings
    document.getElementById('blocking-enabled').checked = this.settings.blockingEnabled !== false;
    document.getElementById('strict-mode-global').checked = this.settings.strictModeGlobal || false;

    // Focus sessions
    document.getElementById('default-duration').value = this.settings.defaultDuration || 25;
    document.getElementById('break-interval').value = this.settings.breakInterval || 15;
    document.getElementById('auto-start-work').checked = this.settings.autoStartWork || false;
    document.getElementById('continue-sessions').checked = this.settings.continueSessions || false;
    document.getElementById('focus-sounds').checked = this.settings.focusSounds || false;
    document.getElementById('sound-type').value = this.settings.soundType || 'none';

    // Advanced settings
    document.getElementById('low-memory-mode').checked = this.settings.lowMemoryMode || false;
    document.getElementById('data-retention').value = this.settings.dataRetention || 90;
    document.getElementById('anonymous-analytics').checked = this.settings.anonymousAnalytics !== false;
    document.getElementById('local-only').checked = true; // Always true for free version
  }

  updateSettingsFromForm() {
    // General settings
    this.settings.theme = document.getElementById('theme-select').value;
    this.settings.notificationsEnabled = document.getElementById('notifications-enabled').checked;
    this.settings.sessionReminders = document.getElementById('session-reminders').checked;
    this.settings.dailySummary = document.getElementById('daily-summary').checked;

    // Working hours
    this.settings.workingHoursEnabled = document.getElementById('working-hours-enabled').checked;
    this.settings.workStartTime = document.getElementById('work-start-time').value;
    this.settings.workEndTime = document.getElementById('work-end-time').value;

    // Blocking
    this.settings.blockingEnabled = document.getElementById('blocking-enabled').checked;
    this.settings.strictModeGlobal = document.getElementById('strict-mode-global').checked;

    // Focus sessions
    this.settings.defaultDuration = parseInt(document.getElementById('default-duration').value);
    this.settings.breakInterval = parseInt(document.getElementById('break-interval').value);
    this.settings.autoStartWork = document.getElementById('auto-start-work').checked;
    this.settings.continueSessions = document.getElementById('continue-sessions').checked;
    this.settings.focusSounds = document.getElementById('focus-sounds').checked;
    this.settings.soundType = document.getElementById('sound-type').value;

    // Advanced
    this.settings.lowMemoryMode = document.getElementById('low-memory-mode').checked;
    this.settings.dataRetention = parseInt(document.getElementById('data-retention').value);
    this.settings.anonymousAnalytics = document.getElementById('anonymous-analytics').checked;
  }

  updateSitesList() {
    const sitesContainer = document.getElementById('sites-list');
    const sites = this.blocklist[this.currentCategory] || [];

    sitesContainer.innerHTML = '';

    sites.forEach((site, index) => {
      const siteItem = this.createSiteItem(site, index);
      sitesContainer.appendChild(siteItem);
    });

    // Show/hide add form based on category
    const addForm = document.getElementById('add-site-form');
    addForm.style.display = this.currentCategory === 'custom' ? 'flex' : 'none';
  }

  createSiteItem(site, index) {
    const item = document.createElement('div');
    item.className = 'site-item';

    const categoryIcons = {
      social: '📱',
      entertainment: '🎬',
      shopping: '🛒',
      news: '📰',
      custom: '🌐'
    };

    item.innerHTML = `
      <div class="site-info">
        <div class="site-icon">${categoryIcons[this.currentCategory]}</div>
        <div class="site-name">${site}</div>
      </div>
      <div class="site-actions">
        ${this.currentCategory === 'custom' ? `
          <button class="remove-site-btn" onclick="focusCareOptions.removeSite(${index})">
            🗑️
          </button>
        ` : ''}
      </div>
    `;

    return item;
  }

  addCustomSite() {
    const input = document.getElementById('new-site-input');
    const site = input.value.trim();

    if (!site) {
      this.showToast('Please enter a website URL', 'error');
      return;
    }

    // Clean up the URL
    const cleanSite = site.replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0];

    if (!this.blocklist.custom.includes(cleanSite)) {
      this.blocklist.custom.push(cleanSite);
      this.updateSitesList();
      input.value = '';
      this.showToast(`Added ${cleanSite} to custom blocklist`, 'success');
    } else {
      this.showToast('Site already in blocklist', 'warning');
    }
  }

  removeSite(index) {
    const site = this.blocklist[this.currentCategory][index];
    this.blocklist[this.currentCategory].splice(index, 1);
    this.updateSitesList();
    this.showToast(`Removed ${site} from blocklist`, 'success');
  }

  async saveSettings() {
    try {
      this.updateSettingsFromForm();
      
      await this.storage.setSettings(this.settings);
      await this.storage.setBlocklist(this.blocklist);
      
      // Notify background script of settings change
      chrome.runtime.sendMessage({ action: 'settingsUpdated', settings: this.settings });
      
      this.showToast('Settings saved successfully!', 'success');
      console.log('Settings saved:', this.settings);
    } catch (error) {
      console.error('Failed to save settings:', error);
      this.showToast('Failed to save settings', 'error');
    }
  }

  loadAnalytics() {
    this.updateAnalyticsDisplay();
    this.generateWeeklyChart();
    this.updateBlockedSitesList();
    this.generateInsights();
  }

  updateAnalyticsDisplay() {
    // Update summary cards
    document.getElementById('total-focus-time').textContent = 
      this.formatTime(this.analytics.totalFocusTime || 0);
    document.getElementById('total-sessions').textContent = 
      this.analytics.sessionsCompleted || 0;
    document.getElementById('total-blocked').textContent = 
      this.analytics.sitesBlocked || 0;
    
    // Calculate streak
    const streak = this.calculateStreak();
    document.getElementById('productivity-streak').textContent = streak;
  }

  formatTime(minutes) {
    if (minutes < 60) {
      return `${minutes}m`;
    }
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return `${hours}h ${remainingMinutes}m`;
  }

  calculateStreak() {
    const dailyStats = this.analytics.dailyStats || {};
    let streak = 0;
    const today = new Date();

    for (let i = 0; i < 30; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toDateString();

      if (dailyStats[dateStr] && dailyStats[dateStr].focusTime > 0) {
        streak++;
      } else {
        break;
      }
    }

    return streak;
  }

  generateWeeklyChart() {
    const chartBars = document.getElementById('weekly-bars');
    const dailyStats = this.analytics.dailyStats || {};
    
    chartBars.innerHTML = '';
    
    // Get last 7 days
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      days.push(date);
    }

    const maxTime = Math.max(...days.map(day => {
      const stats = dailyStats[day.toDateString()];
      return stats ? stats.focusTime : 0;
    }));

    days.forEach(day => {
      const stats = dailyStats[day.toDateString()];
      const focusTime = stats ? stats.focusTime : 0;
      const height = maxTime > 0 ? (focusTime / maxTime) * 100 : 0;

      const bar = document.createElement('div');
      bar.className = 'chart-bar';
      bar.style.height = `${height}%`;
      bar.title = `${day.toLocaleDateString()}: ${focusTime} minutes`;
      
      chartBars.appendChild(bar);
    });
  }

  updateBlockedSitesList() {
    const container = document.getElementById('blocked-sites-list');
    
    // This would be populated from actual blocking data
    // For now, show sample data
    const blockedSites = [
      { name: 'facebook.com', count: 15 },
      { name: 'youtube.com', count: 12 },
      { name: 'reddit.com', count: 8 },
      { name: 'twitter.com', count: 6 },
      { name: 'instagram.com', count: 4 }
    ];

    container.innerHTML = '';

    blockedSites.slice(0, 5).forEach(site => {
      const item = document.createElement('div');
      item.className = 'blocked-site-item';
      item.innerHTML = `
        <div class="blocked-site-name">${site.name}</div>
        <div class="blocked-site-count">${site.count}</div>
      `;
      container.appendChild(item);
    });
  }

  generateInsights() {
    const container = document.getElementById('insights-list');
    const insights = this.calculateInsights();

    container.innerHTML = '';

    insights.forEach(insight => {
      const item = document.createElement('div');
      item.className = 'insight-item';
      item.innerHTML = `
        <div class="insight-icon">${insight.icon}</div>
        <div class="insight-text">${insight.text}</div>
      `;
      container.appendChild(item);
    });
  }

  calculateInsights() {
    const insights = [];
    const totalFocus = this.analytics.totalFocusTime || 0;
    const totalSessions = this.analytics.sessionsCompleted || 0;
    const avgSession = totalSessions > 0 ? Math.round(totalFocus / totalSessions) : 0;

    if (avgSession > 25) {
      insights.push({
        icon: '🎯',
        text: `Great focus! Your average session is ${avgSession} minutes.`
      });
    }

    if (this.calculateStreak() >= 7) {
      insights.push({
        icon: '🔥',
        text: `Amazing! You're on a ${this.calculateStreak()}-day focus streak!`
      });
    }

    if (totalFocus > 300) {
      insights.push({
        icon: '⭐',
        text: `You've focused for over ${Math.round(totalFocus / 60)} hours total!`
      });
    }

    if (insights.length === 0) {
      insights.push({
        icon: '💪',
        text: 'Start your first focus session to see personalized insights!'
      });
    }

    return insights;
  }

  updateDataInfo() {
    // Calculate approximate data size
    const dataSize = this.calculateDataSize();
    document.getElementById('data-size').textContent = dataSize;

    // Last backup info (would be stored separately)
    const lastBackup = localStorage.getItem('focuscare_last_backup');
    document.getElementById('last-backup').textContent = 
      lastBackup ? new Date(lastBackup).toLocaleDateString() : 'Never';
  }

  calculateDataSize() {
    try {
      const data = JSON.stringify({
        settings: this.settings,
        analytics: this.analytics,
        blocklist: this.blocklist
      });
      const bytes = new Blob([data]).size;
      return bytes < 1024 ? `${bytes} bytes` : `${Math.round(bytes / 1024)} KB`;
    } catch {
      return 'Unknown';
    }
  }

  async exportData() {
    try {
      const data = {
        settings: this.settings,
        analytics: this.analytics,
        blocklist: this.blocklist,
        exportDate: new Date().toISOString(),
        version: '2.0.0'
      };

      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.href = url;
      a.download = `focuscare-backup-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      this.showToast('Data exported successfully!', 'success');
    } catch (error) {
      console.error('Export failed:', error);
      this.showToast('Failed to export data', 'error');
    }
  }

  backupData() {
    this.exportData();
    localStorage.setItem('focuscare_last_backup', Date.now().toString());
    this.updateDataInfo();
  }

  restoreData() {
    document.getElementById('restore-file-input').click();
  }

  async handleRestoreFile(file) {
    if (!file) return;

    try {
      const text = await file.text();
      const data = JSON.parse(text);

      if (!data.settings || !data.analytics || !data.blocklist) {
        throw new Error('Invalid backup file format');
      }

      this.settings = data.settings;
      this.analytics = data.analytics;
      this.blocklist = data.blocklist;

      await this.saveSettings();
      this.updateUI();
      this.loadAnalytics();

      this.showToast('Data restored successfully!', 'success');
    } catch (error) {
      console.error('Restore failed:', error);
      this.showToast('Failed to restore data. Please check the file format.', 'error');
    }
  }

  async resetAllData() {
    if (!confirm('Are you sure you want to reset all data? This cannot be undone.')) {
      return;
    }

    try {
      // Reset to defaults
      this.settings = this.storage.getDefaults();
      this.analytics = {
        totalFocusTime: 0,
        sessionsCompleted: 0,
        sitesBlocked: 0,
        dailyStats: {},
        weeklyTrend: []
      };
      this.blocklist = this.storage.getDefaultBlocklist();

      // Clear storage
      await chrome.storage.local.clear();
      
      // Save defaults
      await this.saveSettings();
      
      this.updateUI();
      this.loadAnalytics();

      this.showToast('All data has been reset to defaults', 'success');
    } catch (error) {
      console.error('Reset failed:', error);
      this.showToast('Failed to reset data', 'error');
    }
  }

  showToast(message, type = 'success') {
    const toast = document.getElementById('save-toast');
    const messageEl = toast.querySelector('.toast-message');
    const iconEl = toast.querySelector('.toast-icon');

    messageEl.textContent = message;
    
    // Update icon and color based on type
    switch (type) {
      case 'success':
        iconEl.textContent = '✅';
        toast.style.background = 'var(--accent-secondary)';
        break;
      case 'error':
        iconEl.textContent = '❌';
        toast.style.background = 'var(--accent-danger)';
        break;
      case 'warning':
        iconEl.textContent = '⚠️';
        toast.style.background = 'var(--accent-warning)';
        break;
    }

    toast.classList.remove('hidden');

    setTimeout(() => {
      toast.classList.add('hidden');
    }, 3000);
  }
}

// Initialize when DOM loads
document.addEventListener('DOMContentLoaded', () => {
  window.focusCareOptions = new FocusCareOptions();
});
