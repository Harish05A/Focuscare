/**
 * FocusCare 2.0 Background Service Worker
 * Handles persistent timer and session management
 */

class FocusCareBackground {
    constructor() {
        this.currentSession = {
            isActive: false,
            startTime: null,
            duration: 25 * 60, // 25 minutes in seconds
            type: 'focus',
            remainingTime: 25 * 60
        };
        
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.loadSessionState();
        this.startBackgroundTimer();
    }

    setupEventListeners() {
        // Listen for messages from popup
        chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
            switch (message.action) {
                case 'getSessionState':
                    sendResponse(this.currentSession);
                    break;
                    
                case 'startSession':
                    this.startSession();
                    sendResponse({ success: true });
                    break;
                    
                case 'pauseSession':
                    this.pauseSession();
                    sendResponse({ success: true });
                    break;
                    
                case 'resetSession':
                    this.resetSession();
                    sendResponse({ success: true });
                    break;
            }
            return true; // Keep message channel open for async response
        });

        // Handle extension install/startup
        chrome.runtime.onInstalled.addListener(() => {
            this.resetSession();
        });
    }

    async loadSessionState() {
        try {
            const data = await chrome.storage.local.get('currentSession');
            if (data.currentSession) {
                this.currentSession = { ...this.currentSession, ...data.currentSession };
                
                // If session was active, calculate remaining time
                if (this.currentSession.isActive && this.currentSession.startTime) {
                    const elapsed = Math.floor((Date.now() - this.currentSession.startTime) / 1000);
                    this.currentSession.remainingTime = Math.max(0, this.currentSession.duration - elapsed);
                    
                    // If time expired while extension was closed
                    if (this.currentSession.remainingTime <= 0) {
                        this.completeSession();
                    }
                }
            }
        } catch (error) {
            console.error('Error loading session state:', error);
        }
    }

    async saveSessionState() {
        try {
            await chrome.storage.local.set({ currentSession: this.currentSession });
        } catch (error) {
            console.error('Error saving session state:', error);
        }
    }

    startBackgroundTimer() {
        // Update session state every second
        setInterval(() => {
            if (this.currentSession.isActive) {
                this.updateSessionProgress();
            }
        }, 1000);
    }

    updateSessionProgress() {
        if (!this.currentSession.isActive || !this.currentSession.startTime) return;

        const elapsed = Math.floor((Date.now() - this.currentSession.startTime) / 1000);
        this.currentSession.remainingTime = Math.max(0, this.currentSession.duration - elapsed);

        // Session completed
        if (this.currentSession.remainingTime <= 0) {
            this.completeSession();
            return;
        }

        // Save state periodically
        if (elapsed % 10 === 0) { // Every 10 seconds
            this.saveSessionState();
        }

        // Notify popup if it's open
        this.notifyPopupUpdate();
    }

    startSession() {
        this.currentSession.isActive = true;
        this.currentSession.startTime = Date.now();
        this.currentSession.remainingTime = this.currentSession.duration;
        
        this.saveSessionState();
        this.notifyPopupUpdate();
        
        console.log('🎯 Focus session started in background');
    }

    pauseSession() {
        if (this.currentSession.isActive) {
            // Calculate remaining time when paused
            const elapsed = Math.floor((Date.now() - this.currentSession.startTime) / 1000);
            this.currentSession.remainingTime = Math.max(0, this.currentSession.duration - elapsed);
            
            this.currentSession.isActive = false;
            this.currentSession.startTime = null;
            
            this.saveSessionState();
            this.notifyPopupUpdate();
            
            console.log('⏸️ Focus session paused in background');
        }
    }

    resetSession() {
        this.currentSession = {
            isActive: false,
            startTime: null,
            duration: 25 * 60,
            type: 'focus',
            remainingTime: 25 * 60
        };
        
        this.saveSessionState();
        this.notifyPopupUpdate();
        
        console.log('🔄 Focus session reset in background');
    }

    completeSession() {
        this.currentSession.isActive = false;
        this.currentSession.startTime = null;
        this.currentSession.remainingTime = 0;

        // Show completion notification
        chrome.notifications.create({
            type: 'basic',
            iconUrl: '/assets/icons/icon48.png',
            title: 'FocusCare 2.0 - Session Complete! 🎉',
            message: 'Great job! You completed a focus session. Time for a smart break.'
        });

        // Update daily stats
        this.updateDailyStats();

        // Auto reset for next session after 3 seconds
        setTimeout(() => {
            this.resetSession();
        }, 3000);

        console.log('✅ Focus session completed in background');
    }

    async updateDailyStats() {
        try {
            const data = await chrome.storage.local.get('dailyFocusTime');
            const currentTime = data.dailyFocusTime || 0;
            const newTime = currentTime + this.currentSession.duration;
            
            await chrome.storage.local.set({ dailyFocusTime: newTime });
            
        } catch (error) {
            console.error('Error updating daily stats:', error);
        }
    }

    notifyPopupUpdate() {
        // Try to send update to popup (will fail silently if popup is closed)
        chrome.runtime.sendMessage({
            action: 'sessionStateUpdate',
            sessionState: this.currentSession
        }).catch(() => {
            // Popup is closed, which is fine
        });
    }
}

// Initialize background service
const focusCareBackground = new FocusCareBackground();
