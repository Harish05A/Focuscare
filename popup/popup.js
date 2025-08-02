class FocusCare {
    constructor() {
        this.minutes = 25;
        this.seconds = 0;
        this.isRunning = false;
        this.timer = null;
        this.siteBlockingEnabled = false;
        
        this.init();
    }
    
    async init() {
        this.setupEventListeners();
        this.updateDisplay();
        await this.loadSettings();
    }
    
    setupEventListeners() {
        // Timer buttons
        document.getElementById('open-settings').addEventListener('click', () => {
    chrome.tabs.create({ url: chrome.runtime.getURL('settings/settings.html') });
});
        document.getElementById('start-btn').addEventListener('click', () => this.startTimer());
        document.getElementById('pause-btn').addEventListener('click', () => this.pauseTimer());
        document.getElementById('reset-btn').addEventListener('click', () => this.resetTimer());
        
        // Site blocking toggle
        document.getElementById('blocking-toggle').addEventListener('change', (e) => {
            this.toggleSiteBlocking(e.target.checked);
        });
        
        // Mood buttons
    document.querySelectorAll('.mood-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const mood = e.target.dataset.mood;
                if (mood) {
                    this.recordMood(mood);
                }
            });
    });
    // Analytics button
    document.getElementById('view-analytics').addEventListener('click', () => {
        chrome.tabs.create({ url: chrome.runtime.getURL('analytics/analytics.html') });
    });
        document.getElementById('reminder-toggle').addEventListener('change', (e) => {
    this.toggleBreakReminders(e.target.checked);
});
    }
    
    async loadSettings() {
        try {
            const data = await chrome.storage.local.get(['siteBlockingEnabled']);
            this.siteBlockingEnabled = data.siteBlockingEnabled || false;
            
            document.getElementById('blocking-toggle').checked = this.siteBlockingEnabled;
            this.updateBlockingStatus();
            
        } catch (error) {
            console.error('Error loading settings:', error);
        }
    }
    
    async toggleSiteBlocking(enabled) {
        try {
            this.siteBlockingEnabled = enabled;
            await chrome.storage.local.set({ siteBlockingEnabled: enabled });
            this.updateBlockingStatus();
            
            // Show feedback message
            const message = enabled ? 
                'Site blocking enabled! Distracting sites will be blocked.' :
                'Site blocking disabled.';
            
            document.getElementById('daily-message').textContent = message;
            
        } catch (error) {
            console.error('Error toggling site blocking:', error);
        }
    }
    
    updateBlockingStatus() {
        const statusElement = document.getElementById('blocking-status');
        
        if (this.siteBlockingEnabled) {
            statusElement.textContent = 'Blocking distracting sites';
            statusElement.classList.add('active');
        } else {
            statusElement.textContent = 'Click to block distracting sites';
            statusElement.classList.remove('active');
        }
    }
    
    startTimer() {
        if (!this.isRunning) {
            this.isRunning = true;
            this.timer = setInterval(() => this.tick(), 1000);
            
            document.getElementById('start-btn').disabled = true;
            document.getElementById('pause-btn').disabled = false;
            document.getElementById('session-status').textContent = 'Focus session active';
            
            // Auto-enable site blocking during focus session
            if (!this.siteBlockingEnabled) {
                document.getElementById('blocking-toggle').checked = true;
                this.toggleSiteBlocking(true);
            }
        }
    }
    
    pauseTimer() {
        if (this.isRunning) {
            this.isRunning = false;
            clearInterval(this.timer);
            
            document.getElementById('start-btn').disabled = false;
            document.getElementById('pause-btn').disabled = true;
            document.getElementById('session-status').textContent = 'Session paused';
        }
    }
    
    resetTimer() {
        this.isRunning = false;
        clearInterval(this.timer);
        this.minutes = 25;
        this.seconds = 0;
        this.updateDisplay();
        
        document.getElementById('start-btn').disabled = false;
        document.getElementById('pause-btn').disabled = true;
        document.getElementById('session-status').textContent = 'Ready to focus';
    }
    
    tick() {
        if (this.seconds > 0) {
            this.seconds--;
        } else if (this.minutes > 0) {
            this.minutes--;
            this.seconds = 59;
        } else {
            // Timer finished!
            this.completeSession();
            return;
        }
        
        this.updateDisplay();
    }
    
    completeSession() {
    this.isRunning = false;
    clearInterval(this.timer);
    
    // Log completed session
    this.logCompletedSession();
    
    // Show completion message
    document.getElementById('daily-message').textContent = 
        '🎉 Focus session complete! Great job! Time for a break.';
    
    // Auto-disable site blocking after session
    document.getElementById('blocking-toggle').checked = false;
    this.toggleSiteBlocking(false);
    
    this.resetTimer();
    
    // Create notification
    chrome.notifications.create({
        type: 'basic',
        iconUrl: '/assets/icons/icon48.png',
        title: 'FocusCare - Session Complete!',
        message: 'Great job! You completed a 25-minute focus session. 🎉'
    });
}
async toggleBreakReminders(enabled) {
    try {
        await chrome.storage.local.set({ breakRemindersEnabled: enabled });
        
        // Send message to background script
        chrome.runtime.sendMessage({
            action: enabled ? 'startBreakReminders' : 'stopBreakReminders'
        });
        
        const statusElement = document.getElementById('reminder-status');
        statusElement.textContent = enabled ? 
            'Reminders every 30 minutes' : 
            'Break reminders disabled';
        
        document.getElementById('daily-message').textContent = enabled ?
            'Break reminders enabled! Take care of yourself. 💙' :
            'Break reminders disabled.';
            
    } catch (error) {
        console.error('Error toggling break reminders:', error);
    }
}

// Update loadSettings method to include break reminders:
async loadSettings() {
    try {
        const data = await chrome.storage.local.get(['siteBlockingEnabled', 'breakRemindersEnabled']);
        
        this.siteBlockingEnabled = data.siteBlockingEnabled || false;
        document.getElementById('blocking-toggle').checked = this.siteBlockingEnabled;
        this.updateBlockingStatus();
        
        // Load break reminder setting
        const breakRemindersEnabled = data.breakRemindersEnabled !== false; // Default to enabled
        document.getElementById('reminder-toggle').checked = breakRemindersEnabled;
        
    } catch (error) {
        console.error('Error loading settings:', error);
    }
}
async logCompletedSession() {
    try {
        const today = new Date().toDateString();
        const data = await chrome.storage.local.get('sessions');
        const sessions = data.sessions || {};
        
        if (!sessions[today]) sessions[today] = [];
        
        sessions[today].push({
            duration: 25, // minutes
            completedAt: new Date().getTime()
        });
        
        await chrome.storage.local.set({ sessions: sessions });
        
    } catch (error) {
        console.error('Error logging session:', error);
    }
}
    
    updateDisplay() {
        document.getElementById('minutes').textContent = 
            this.minutes.toString().padStart(2, '0');
        document.getElementById('seconds').textContent = 
            this.seconds.toString().padStart(2, '0');
    }
    
    
    recordMood(mood) {
        // Save mood to storage
        const today = new Date().toDateString();
        
        chrome.storage.local.get('moods', (data) => {
            const moods = data.moods || {};
            if (!moods[today]) moods[today] = [];
            
            moods[today].push({
                mood: mood,
                time: new Date().getTime()
            });
            
            chrome.storage.local.set({ moods: moods });
        });
        
        // Visual feedback
        document.querySelectorAll('.mood-btn').forEach(btn => {
            btn.style.backgroundColor = '';
        });
        document.querySelector(`[data-mood="${mood}"]`).style.backgroundColor = '#667eea';
        
        // Show message
        document.getElementById('daily-message').textContent = 
            'Thanks for sharing your mood! 💙';
    }
}

// Start the extension when popup opens
document.addEventListener('DOMContentLoaded', () => {
    new FocusCare();
});
