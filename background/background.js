class FocusCareBackground {
    constructor() {
        this.breakReminderInterval = 30; // minutes
        this.isBreakReminderActive = false;
        this.init();
    }
    
    init() {
        this.setupEventListeners();
        this.setupBreakReminders();
    }
    
    setupEventListeners() {
        // Listen for messages from popup
        chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
            switch (message.action) {
                case 'startBreakReminders':
                    this.startBreakReminders();
                    break;
                case 'stopBreakReminders':
                    this.stopBreakReminders();
                    break;
                case 'snoozeBreak':
                    this.snoozeBreakReminder();
                    break;
                default:
                    break;
            }
        });
        
        // Handle alarms
        chrome.alarms.onAlarm.addListener((alarm) => {
            this.handleAlarm(alarm);
        });
        
        // Handle notification clicks
        chrome.notifications.onClicked.addListener((notificationId) => {
            this.handleNotificationClick(notificationId);
        });
        
        chrome.notifications.onButtonClicked.addListener((notificationId, buttonIndex) => {
            this.handleNotificationButton(notificationId, buttonIndex);
        });
    }
    
    setupBreakReminders() {
        // Load break reminder settings
        chrome.storage.local.get(['breakRemindersEnabled'], (data) => {
            if (data.breakRemindersEnabled !== false) { // Default to enabled
                this.startBreakReminders();
            }
        });
    }
    
    startBreakReminders() {
        this.isBreakReminderActive = true;
        
        // Create recurring alarm for break reminders
        chrome.alarms.create('breakReminder', {
            delayInMinutes: this.breakReminderInterval,
            periodInMinutes: this.breakReminderInterval
        });
        
        console.log('Break reminders started - every', this.breakReminderInterval, 'minutes');
    }
    
    stopBreakReminders() {
        this.isBreakReminderActive = false;
        chrome.alarms.clear('breakReminder');
        console.log('Break reminders stopped');
    }
    
    snoozeBreakReminder() {
        // Snooze for 10 minutes
        chrome.alarms.clear('breakReminder');
        chrome.alarms.create('breakReminder', {
            delayInMinutes: 10,
            periodInMinutes: this.breakReminderInterval
        });
        console.log('Break reminder snoozed for 10 minutes');
    }
    
    handleAlarm(alarm) {
        switch (alarm.name) {
            case 'breakReminder':
                this.showBreakReminder();
                break;
            case 'focusSessionEnd':
                this.showSessionCompleteNotification();
                break;
        }
    }
    
    showBreakReminder() {
        if (!this.isBreakReminderActive) return;
        
        chrome.notifications.create('breakReminder', {
            type: 'basic',
            iconUrl: '/assets/icons/icon48.png',
            title: 'FocusCare - Time for a Break! 🧘',
            message: 'You\'ve been working for 30 minutes. Take a 2-5 minute break to refresh your mind.',
            buttons: [
                { title: 'Take Break Now' },
                { title: 'Snooze 10 min' }
            ],
            requireInteraction: true
        });
        
        // Log break reminder
        this.logBreakReminder();
    }
    
    showSessionCompleteNotification() {
        chrome.notifications.create('sessionComplete', {
            type: 'basic',
            iconUrl: '/assets/icons/icon48.png',
            title: 'FocusCare - Focus Session Complete! 🎉',
            message: 'Great job! You completed a 25-minute focus session. Time for a well-deserved break.',
            buttons: [
                { title: 'Start Break' },
                { title: 'Continue Working' }
            ]
        });
    }
    
    handleNotificationClick(notificationId) {
        if (notificationId === 'breakReminder') {
            // Open break activity page
            chrome.tabs.create({ url: chrome.runtime.getURL('break/break.html') });
        }
        
        // Clear notification
        chrome.notifications.clear(notificationId);
    }
    
    handleNotificationButton(notificationId, buttonIndex) {
        if (notificationId === 'breakReminder') {
            if (buttonIndex === 0) {
                // Take break now
                chrome.tabs.create({ url: chrome.runtime.getURL('break/break.html') });
            } else if (buttonIndex === 1) {
                // Snooze
                this.snoozeBreakReminder();
            }
        } else if (notificationId === 'sessionComplete') {
            if (buttonIndex === 0) {
                // Start break
                chrome.tabs.create({ url: chrome.runtime.getURL('break/break.html') });
            }
            // For "Continue Working", just dismiss the notification
        }
        
        // Clear notification
        chrome.notifications.clear(notificationId);
    }
    
    async logBreakReminder() {
        try {
            const today = new Date().toDateString();
            const data = await chrome.storage.local.get('breakReminders');
            const reminders = data.breakReminders || {};
            
            if (!reminders[today]) reminders[today] = 0;
            reminders[today]++;
            
            await chrome.storage.local.set({ breakReminders: reminders });
            
        } catch (error) {
            console.error('Error logging break reminder:', error);
        }
    }
}

// Initialize background service
new FocusCareBackground();
