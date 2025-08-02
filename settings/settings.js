class FocusCareSettings {
    constructor() {
        this.settings = {};
        this.defaultSettings = {
            focusDuration: 25,
            shortBreak: 5,
            longBreak: 15,
            autoStartBreaks: false,
            completionSound: true,
            autoBlock: true,
            customBlockedSites: [],
            strictMode: false,
            showMessages: true,
            reminderInterval: 30,
            breakReminders: true,
            moodReminders: true,
            persistentNotifications: false,
            notificationSound: 'none',
            anonymousAnalytics: false,
            autoBackup: true
        };
        
        this.defaultBlockedSites = [
            'facebook.com',
            'instagram.com', 
            'twitter.com',
            'youtube.com',
            'reddit.com',
            'tiktok.com',
            'netflix.com',
            'twitch.tv'
        ];
        
        this.init();
    }
    
    async init() {
        await this.loadSettings();
        this.setupEventListeners();
        this.populateUI();
        this.showDataStats();
    }
    
    setupEventListeners() {
        // Navigation
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.switchSection(e.target.dataset.section));
        });
        
        // Range inputs with live updates
        document.querySelectorAll('input[type="range"]').forEach(input => {
            input.addEventListener('input', (e) => this.updateRangeValue(e.target));
        });
        
        // Save, cancel, restore buttons
        document.getElementById('save-settings').addEventListener('click', () => this.saveAllSettings());
        document.getElementById('cancel-settings').addEventListener('click', () => this.cancelChanges());
        document.getElementById('restore-defaults').addEventListener('click', () => this.restoreDefaults());
        
        // Data management buttons
        document.getElementById('export-data').addEventListener('click', () => this.exportData());
        document.getElementById('import-data').addEventListener('click', () => this.importData());
        document.getElementById('reset-data').addEventListener('click', () => this.resetAllData());
        document.getElementById('reset-settings').addEventListener('click', () => this.resetSettingsOnly());
        document.getElementById('reset-analytics').addEventListener('click', () => this.resetAnalyticsOnly());
        
        // File input for import
        document.getElementById('import-file').addEventListener('change', (e) => this.handleFileImport(e));
        
        // Add current site button
        document.getElementById('add-current-site').addEventListener('click', () => this.addCurrentSite());
        
        // Custom sites textarea
        document.getElementById('custom-sites').addEventListener('blur', () => this.updateCustomSites());
    }
    
    async loadSettings() {
        try {
            const data = await chrome.storage.local.get();
            this.settings = { ...this.defaultSettings, ...data.settings };
            
            // Load custom blocked sites separately
            this.settings.customBlockedSites = data.customBlockedSites || [];
            
        } catch (error) {
            console.error('Error loading settings:', error);
            this.settings = { ...this.defaultSettings };
        }
    }
    
    populateUI() {
        // Timer settings
        document.getElementById('focus-duration').value = this.settings.focusDuration;
        document.getElementById('short-break').value = this.settings.shortBreak;
        document.getElementById('long-break').value = this.settings.longBreak;
        
        // Update range value displays
        document.querySelectorAll('input[type="range"]').forEach(input => {
            this.updateRangeValue(input);
        });
        
        // Checkboxes
        document.getElementById('auto-start-breaks').checked = this.settings.autoStartBreaks;
        document.getElementById('completion-sound').checked = this.settings.completionSound;
        document.getElementById('auto-block').checked = this.settings.autoBlock;
        document.getElementById('strict-mode').checked = this.settings.strictMode;
        document.getElementById('show-messages').checked = this.settings.showMessages;
        document.getElementById('break-reminders').checked = this.settings.breakReminders;
        document.getElementById('mood-reminders').checked = this.settings.moodReminders;
        document.getElementById('persistent-notifications').checked = this.settings.persistentNotifications;
        document.getElementById('anonymous-analytics').checked = this.settings.anonymousAnalytics;
        document.getElementById('auto-backup').checked = this.settings.autoBackup;
        
        // Select dropdowns
        document.getElementById('reminder-interval').value = this.settings.reminderInterval;
        document.getElementById('notification-sound').value = this.settings.notificationSound;
        
        // Populate blocked sites
        this.populateBlockedSites();
        this.populateCustomSites();
    }
    
    populateBlockedSites() {
        const container = document.getElementById('default-sites');
        container.innerHTML = '';
        
        this.defaultBlockedSites.forEach(site => {
            const siteElement = document.createElement('div');
            siteElement.className = 'blocked-site-item';
            siteElement.innerHTML = `
                <span class="site-name">${site}</span>
                <button class="remove-site" data-site="${site}" title="Remove site">×</button>
            `;
            
            siteElement.querySelector('.remove-site').addEventListener('click', (e) => {
                this.removeDefaultSite(e.target.dataset.site);
            });
            
            container.appendChild(siteElement);
        });
    }
    
    populateCustomSites() {
        const textarea = document.getElementById('custom-sites');
        textarea.value = this.settings.customBlockedSites.join('\n');
    }
    
    updateRangeValue(input) {
        const valueElement = document.getElementById(input.id.replace('-', '-') + '-value');
        if (valueElement) {
            valueElement.textContent = input.value;
        }
    }
    
    switchSection(sectionName) {
        // Update navigation
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-section="${sectionName}"]`).classList.add('active');
        
        // Update sections
        document.querySelectorAll('.settings-section').forEach(section => {
            section.classList.remove('active');
        });
        document.getElementById(`${sectionName}-settings`).classList.add('active');
    }
    
    async addCurrentSite() {
        try {
            const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
            if (tabs[0]) {
                const url = new URL(tabs[0].url);
                const domain = url.hostname.replace('www.', '');
                
                if (!this.settings.customBlockedSites.includes(domain)) {
                    this.settings.customBlockedSites.push(domain);
                    this.populateCustomSites();
                    this.showMessage('Current site added to blocked list!', 'success');
                } else {
                    this.showMessage('Site is already in the blocked list.', 'error');
                }
            }
        } catch (error) {
            console.error('Error adding current site:', error);
            this.showMessage('Error adding current site.', 'error');
        }
    }
    
    updateCustomSites() {
        const textarea = document.getElementById('custom-sites');
        const sites = textarea.value
            .split('\n')
            .map(site => site.trim())
            .filter(site => site.length > 0);
        
        this.settings.customBlockedSites = sites;
    }
    
    removeDefaultSite(site) {
        const index = this.defaultBlockedSites.indexOf(site);
        if (index > -1) {
            this.defaultBlockedSites.splice(index, 1);
            this.populateBlockedSites();
        }
    }
    
    async saveAllSettings() {
        try {
            this.showLoading(true);
            
            // Gather all settings from UI
            const newSettings = {
                focusDuration: parseInt(document.getElementById('focus-duration').value),
                shortBreak: parseInt(document.getElementById('short-break').value),
                longBreak: parseInt(document.getElementById('long-break').value),
                autoStartBreaks: document.getElementById('auto-start-breaks').checked,
                completionSound: document.getElementById('completion-sound').checked,
                autoBlock: document.getElementById('auto-block').checked,
                strictMode: document.getElementById('strict-mode').checked,
                showMessages: document.getElementById('show-messages').checked,
                reminderInterval: parseInt(document.getElementById('reminder-interval').value),
                breakReminders: document.getElementById('break-reminders').checked,
                moodReminders: document.getElementById('mood-reminders').checked,
                persistentNotifications: document.getElementById('persistent-notifications').checked,
                notificationSound: document.getElementById('notification-sound').value,
                anonymousAnalytics: document.getElementById('anonymous-analytics').checked,
                autoBackup: document.getElementById('auto-backup').checked
            };
            
            // Update custom blocked sites
            this.updateCustomSites();
            
            // Save to storage
            await chrome.storage.local.set({
                settings: newSettings,
                customBlockedSites: this.settings.customBlockedSites,
                defaultBlockedSites: this.defaultBlockedSites
            });
            
            this.settings = newSettings;
            
            // Update background script with new settings
            chrome.runtime.sendMessage({
                action: 'updateSettings',
                settings: newSettings
            });
            
            this.showMessage('All settings saved successfully!', 'success');
            
        } catch (error) {
            console.error('Error saving settings:', error);
            this.showMessage('Error saving settings. Please try again.', 'error');
        } finally {
            this.showLoading(false);
        }
    }
    
    async cancelChanges() {
        await this.loadSettings();
        this.populateUI();
        this.showMessage('Changes cancelled. Settings restored to last saved state.', 'success');
    }
    
    async restoreDefaults() {
        if (confirm('Are you sure you want to restore all settings to their default values?')) {
            this.settings = { ...this.defaultSettings };
            this.defaultBlockedSites = [
                'facebook.com', 'instagram.com', 'twitter.com', 'youtube.com',
                'reddit.com', 'tiktok.com', 'netflix.com', 'twitch.tv'
            ];
            
            this.populateUI();
            this.showMessage('Settings restored to defaults. Click "Save All Settings" to apply.', 'success');
        }
    }
    
    async showDataStats() {
        try {
            const data = await chrome.storage.local.get();
            
            // Calculate stats
            const totalSessions = Object.values(data.sessions || {}).reduce((total, dayData) => {
                return total + (Array.isArray(dayData) ? dayData.length : 0);
            }, 0);
            
            const totalMoods = Object.values(data.moods || {}).reduce((total, dayData) => {
                return total + (Array.isArray(dayData) ? dayData.length : 0);
            }, 0);
            
            const totalBlocked = Object.values(data.blockedAttempts || {}).reduce((total, count) => total + count, 0);
            
            const dataSize = JSON.stringify(data).length;
            const dataSizeKB = Math.round(dataSize / 1024 * 100) / 100;
            
            // Update UI
            const statsContainer = document.getElementById('data-stats');
            statsContainer.innerHTML = `
                <div class="stat-row">
                    <span class="stat-label">Focus Sessions Completed:</span>
                    <span class="stat-value">${totalSessions}</span>
                </div>
                <div class="stat-row">
                    <span class="stat-label">Mood Entries:</span>
                    <span class="stat-value">${totalMoods}</span>
                </div>
                <div class="stat-row">
                    <span class="stat-label">Sites Blocked:</span>
                    <span class="stat-value">${totalBlocked}</span>
                </div>
                <div class="stat-row">
                    <span class="stat-label">Data Size:</span>
                    <span class="stat-value">${dataSizeKB} KB</span>
                </div>
            `;
            
        } catch (error) {
            console.error('Error calculating data stats:', error);
        }
    }
    
    async exportData() {
        try {
            this.showLoading(true);
            
            const data = await chrome.storage.local.get();
            const exportData = {
                exportDate: new Date().toISOString(),
                version: '1.0.0',
                settings: this.settings,
                data: data
            };
            
            const dataStr = JSON.stringify(exportData, null, 2);
            const dataBlob = new Blob([dataStr], { type: 'application/json' });
            const url = URL.createObjectURL(dataBlob);
            
            const a = document.createElement('a');
            a.href = url;
            a.download = `focuscare-backup-${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            
            this.showMessage('Data exported successfully!', 'success');
            
        } catch (error) {
            console.error('Error exporting data:', error);
            this.showMessage('Error exporting data.', 'error');
        } finally {
            this.showLoading(false);
        }
    }
    
    importData() {
        document.getElementById('import-file').click();
    }
    
    async handleFileImport(event) {
        const file = event.target.files[0];
        if (!file) return;
        
        try {
            this.showLoading(true);
            
            const text = await file.text();
            const importData = JSON.parse(text);
            
            if (importData.data && importData.settings) {
                if (confirm('This will replace all your current data. Are you sure you want to continue?')) {
                    await chrome.storage.local.clear();
                    await chrome.storage.local.set(importData.data);
                    
                    this.settings = importData.settings;
                    this.populateUI();
                    this.showDataStats();
                    
                    this.showMessage('Data imported successfully!', 'success');
                }
            } else {
                this.showMessage('Invalid backup file format.', 'error');
            }
            
        } catch (error) {
            console.error('Error importing data:', error);
            this.showMessage('Error importing data. Please check the file format.', 'error');
        } finally {
            this.showLoading(false);
            event.target.value = '';
        }
    }
    
    async resetAllData() {
        if (confirm('Are you sure you want to delete ALL your FocusCare data? This cannot be undone.')) {
            if (confirm('This will permanently delete all your focus sessions, mood data, and analytics. Are you absolutely sure?')) {
                try {
                    this.showLoading(true);
                    await chrome.storage.local.clear();
                    this.showDataStats();
                    this.showMessage('All data has been reset successfully!', 'success');
                } catch (error) {
                    console.error('Error resetting data:', error);
                    this.showMessage('Error resetting data.', 'error');
                } finally {
                    this.showLoading(false);
                }
            }
        }
    }
    
    async resetSettingsOnly() {
        if (confirm('Reset only your settings to defaults, keeping all your focus and mood data?')) {
            try {
                await chrome.storage.local.set({ settings: this.defaultSettings });
                this.settings = { ...this.defaultSettings };
                this.populateUI();
                this.showMessage('Settings reset to defaults successfully!', 'success');
            } catch (error) {
                console.error('Error resetting settings:', error);
                this.showMessage('Error resetting settings.', 'error');
            }
        }
    }
    
    async resetAnalyticsOnly() {
        if (confirm('Delete only your analytics data (focus sessions, mood data, blocked attempts)?')) {
            try {
                this.showLoading(true);
                const data = await chrome.storage.local.get();
                
                // Keep settings, remove analytics data
                const keysToRemove = ['sessions', 'moods', 'blockedAttempts', 'breakReminders', 'hydrationLog'];
                
                for (const key of keysToRemove) {
                    delete data[key];
                }
                
                await chrome.storage.local.clear();
                await chrome.storage.local.set(data);
                
                this.showDataStats();
                this.showMessage('Analytics data reset successfully!', 'success');
            } catch (error) {
                console.error('Error resetting analytics:', error);
                this.showMessage('Error resetting analytics data.', 'error');
            } finally {
                this.showLoading(false);
            }
        }
    }
    
    showLoading(show) {
        const container = document.querySelector('.settings-container');
        if (show) {
            container.classList.add('loading');
        } else {
            container.classList.remove('loading');
        }
    }
    
    showMessage(text, type = 'success') {
        // Remove existing messages
        document.querySelectorAll('.success-message, .error-message').forEach(msg => {
            msg.remove();
        });
        
        const message = document.createElement('div');
        message.className = `${type}-message fade-in`;
        message.textContent = text;
        
        const firstSection = document.querySelector('.settings-section.active');
        firstSection.insertBefore(message, firstSection.firstChild);
        
        // Auto-remove after 5 seconds
        setTimeout(() => {
            if (document.body.contains(message)) {
                message.remove();
            }
        }, 5000);
    }
}

// Initialize settings page
document.addEventListener('DOMContentLoaded', () => {
    new FocusCareSettings();
});
