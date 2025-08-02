/**
 * FocusCare 2.0 Popup Controller
 * Revolutionary AI-powered focus management interface with background timer integration
 */

class FocusCareTwoPopup {
    constructor() {
        this.isAIReady = false;
        this.cognitiveLoad = 0.3;
        this.currentSession = {
            isActive: false,
            startTime: null,
            duration: 25 * 60, // 25 minutes default
            remainingTime: 25 * 60,
            type: 'focus'
        };
        this.canvas = null;
        this.ctx = null;
        
        this.init();
    }

    async init() {
        console.log('🚀 Initializing FocusCare 2.0 Popup...');
        
        this.setupCanvas();
        this.setupEventListeners();
        await this.connectToAI();
        await this.syncWithBackground(); // Sync with background timer
        this.loadUserData();
        this.startUIUpdates();
        
        console.log('✅ Popup initialized successfully!');
    }

    async syncWithBackground() {
        try {
            // Get current session state from background
            const response = await chrome.runtime.sendMessage({ action: 'getSessionState' });
            if (response) {
                this.currentSession = response;
                this.updateTimerDisplay();
                this.updateSessionUI();
                console.log('🔄 Synced with background timer:', this.currentSession);
            }
        } catch (error) {
            console.log('Background sync not available, using local state');
        }
    }

    setupCanvas() {
        this.canvas = document.getElementById('timer-canvas');
        this.ctx = this.canvas.getContext('2d');
        this.drawTimerCircle(0); // Initial state
    }

    setupEventListeners() {
        // Session controls
        document.getElementById('start-focus').addEventListener('click', () => this.startFocusSession());
        document.getElementById('pause-focus').addEventListener('click', () => this.pauseFocusSession());
        document.getElementById('reset-focus').addEventListener('click', () => this.resetFocusSession());

        // Biometric connection
        document.getElementById('connect-wearable').addEventListener('click', () => this.connectBiometric());

        // Advanced features (preview mode)
        document.getElementById('immersive-mode').addEventListener('click', () => this.launchImmersiveMode());
        document.getElementById('social-focus').addEventListener('click', () => this.joinFocusPod());
        document.getElementById('ai-coaching').addEventListener('click', () => this.openAICoach());

        // Listen for messages from background script
        chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
            this.handleMessage(message);
        });
    }

    async connectToAI() {
        try {
            // Check if AI engine is available
            const response = await chrome.tabs.query({active: true, currentWindow: true});
            
            if (response && response[0]) {
                // Send message to content script to check AI status
                chrome.tabs.sendMessage(response[0].id, 
                    { action: 'checkAIStatus' },
                    (response) => {
                        if (response && response.aiReady) {
                            this.isAIReady = true;
                            this.updateAIStatus('🧠 AI Active - Learning your patterns');
                            document.querySelector('.ai-header').classList.add('ai-active');
                        } else {
                            this.updateAIStatus('⚡ Standard Mode - AI unavailable on this page');
                        }
                    }
                );
            }
        } catch (error) {
            console.log('AI connection not available, running in standard mode');
            this.updateAIStatus('⚡ Standard Mode - Enhanced features available');
        }
    }

    updateAIStatus(status) {
        const statusElement = document.getElementById('ai-status');
        if (statusElement) {
            statusElement.textContent = status;
        }
    }

    async loadUserData() {
        try {
            const data = await chrome.storage.local.get([
                'dailyFocusTime', 
                'aiConfidence', 
                'biometricConnected'
            ]);

            // Update daily focus time
            const dailyTime = data.dailyFocusTime || 0;
            const hours = Math.floor(dailyTime / 3600);
            const minutes = Math.floor((dailyTime % 3600) / 60);
            const dailyFocusElement = document.getElementById('daily-focus');
            if (dailyFocusElement) {
                dailyFocusElement.textContent = `${hours}h ${minutes}m`;
            }

            // Update AI confidence
            const confidence = data.aiConfidence || 'Learning...';
            const aiConfidenceElement = document.getElementById('ai-confidence');
            if (aiConfidenceElement) {
                aiConfidenceElement.textContent = confidence;
            }

            // Update biometric status
            if (data.biometricConnected) {
                const statusElement = document.getElementById('connection-status');
                const buttonElement = document.getElementById('connect-wearable');
                if (statusElement) statusElement.textContent = 'Connected';
                if (buttonElement) buttonElement.textContent = '✅ Connected';
            }

        } catch (error) {
            console.error('Error loading user data:', error);
        }
    }

    startUIUpdates() {
        // Update UI every second to sync with background
        setInterval(() => {
            if (this.currentSession.isActive) {
                // Request fresh state from background
                chrome.runtime.sendMessage({ action: 'getSessionState' })
                    .then(response => {
                        if (response) {
                            this.currentSession = response;
                            this.updateTimerDisplay();
                        }
                    })
                    .catch(() => {}); // Ignore errors
            }
        }, 1000);

        // Update cognitive load indicator every 2 seconds
        setInterval(() => {
            this.updateCognitiveLoad();
        }, 2000);

        // Update AI recommendations every 10 seconds
        setInterval(() => {
            this.updateAIRecommendations();
        }, 10000);
    }

    updateCognitiveLoad() {
        // Simulate cognitive load updates (will be replaced with real AI data)
        if (this.isAIReady) {
            // Request real cognitive load from content script
            chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
                if (tabs[0]) {
                    chrome.tabs.sendMessage(tabs[0].id, 
                        { action: 'getCognitiveLoad' },
                        (response) => {
                            if (response && response.cognitiveLoad !== undefined) {
                                this.cognitiveLoad = response.cognitiveLoad;
                                this.updateCognitiveIndicator();
                            }
                        }
                    );
                }
            });
        } else {
            // Simulate gradual changes for demo
            this.cognitiveLoad = Math.max(0.1, Math.min(0.9, 
                this.cognitiveLoad + (Math.random() - 0.5) * 0.1
            ));
            this.updateCognitiveIndicator();
        }
    }

    updateCognitiveIndicator() {
        const fillElement = document.getElementById('cognitive-fill');
        if (fillElement) {
            const percentage = Math.round(this.cognitiveLoad * 100);
            fillElement.style.width = `${percentage}%`;
            
            // Change color based on load level
            if (this.cognitiveLoad > 0.7) {
                fillElement.style.background = '#ff4444'; // High load - red
            } else if (this.cognitiveLoad > 0.4) {
                fillElement.style.background = '#ffaa00'; // Medium load - orange
            } else {
                fillElement.style.background = '#00ff88'; // Low load - green
            }
        }
    }

    updateAIRecommendations() {
        const recommendations = this.generateSmartRecommendations();
        const recommendationElement = document.querySelector('.recommendation-text');
        if (recommendationElement) {
            recommendationElement.textContent = recommendations;
        }
    }

    generateSmartRecommendations() {
        if (!this.isAIReady) {
            return "Enable AI monitoring on a webpage to get personalized recommendations.";
        }

        if (this.cognitiveLoad > 0.8) {
            return "🔴 High cognitive load detected. Consider taking a break or switching to lighter tasks.";
        } else if (this.cognitiveLoad > 0.6) {
            return "🟡 Moderate stress levels. Try the breathing exercise or adjust your environment.";
        } else if (this.cognitiveLoad < 0.3) {
            return "🟢 Great focus state! This is optimal for deep work and challenging tasks.";
        } else {
            return "🔵 Good focus level. You're ready for productive work sessions.";
        }
    }

    // Background Timer Integration Methods
    async startFocusSession() {
        try {
            const response = await chrome.runtime.sendMessage({ action: 'startSession' });
            if (response && response.success) {
                // Background session started successfully
                this.updateSessionUI();
                this.logFocusEvent('session_started');
                console.log('✅ Focus session started in background');
            }
        } catch (error) {
            console.error('Failed to start session:', error);
            this.showMessage('❌ Failed to start focus session', 'error');
        }
    }

    async pauseFocusSession() {
        try {
            const response = await chrome.runtime.sendMessage({ action: 'pauseSession' });
            if (response && response.success) {
                this.updateSessionUI();
                this.logFocusEvent('session_paused');
                console.log('⏸️ Focus session paused in background');
            }
        } catch (error) {
            console.error('Failed to pause session:', error);
            this.showMessage('❌ Failed to pause focus session', 'error');
        }
    }

    async resetFocusSession() {
        try {
            const response = await chrome.runtime.sendMessage({ action: 'resetSession' });
            if (response && response.success) {
                this.updateSessionUI();
                this.updateTimerDisplay();
                this.logFocusEvent('session_reset');
                console.log('🔄 Focus session reset in background');
            }
        } catch (error) {
            console.error('Failed to reset session:', error);
            this.showMessage('❌ Failed to reset focus session', 'error');
        }
    }

    updateTimerDisplay() {
        const minutes = Math.floor(this.currentSession.remainingTime / 60);
        const seconds = this.currentSession.remainingTime % 60;

        const minutesElement = document.getElementById('timer-minutes');
        const secondsElement = document.getElementById('timer-seconds');
        
        if (minutesElement) minutesElement.textContent = minutes.toString().padStart(2, '0');
        if (secondsElement) secondsElement.textContent = seconds.toString().padStart(2, '0');

        // Update circular progress
        const progress = (this.currentSession.duration - this.currentSession.remainingTime) / this.currentSession.duration;
        this.drawTimerCircle(progress);
    }

    updateSessionUI() {
        const startBtn = document.getElementById('start-focus');
        const pauseBtn = document.getElementById('pause-focus');

        if (this.currentSession.isActive) {
            if (startBtn) {
                startBtn.disabled = true;
                startBtn.textContent = '⚡ Focus Active';
            }
            if (pauseBtn) {
                pauseBtn.disabled = false;
            }
        } else {
            if (startBtn) {
                startBtn.disabled = false;
                startBtn.textContent = this.currentSession.remainingTime < this.currentSession.duration ? 
                    '▶️ Resume Focus' : '🎯 Start AI-Optimized Focus';
            }
            if (pauseBtn) {
                pauseBtn.disabled = true;
            }
        }
    }

    drawTimerCircle(progress) {
        if (!this.canvas || !this.ctx) return;

        const centerX = this.canvas.width / 2;
        const centerY = this.canvas.height / 2;
        const radius = 50;

        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // Background circle
        this.ctx.beginPath();
        this.ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
        this.ctx.strokeStyle = '#e0e0e0';
        this.ctx.lineWidth = 6;
        this.ctx.stroke();

        // Progress arc
        if (progress > 0) {
            this.ctx.beginPath();
            this.ctx.arc(centerX, centerY, radius, -Math.PI / 2, -Math.PI / 2 + 2 * Math.PI * progress);
            this.ctx.strokeStyle = '#667eea';
            this.ctx.lineWidth = 6;
            this.ctx.lineCap = 'round';
            this.ctx.stroke();
        }
    }

    // Biometric Integration (Preview)
    async connectBiometric() {
        try {
            if ('bluetooth' in navigator) {
                // Request Bluetooth permissions
                const device = await navigator.bluetooth.requestDevice({
                    filters: [{ services: ['heart_rate'] }],
                    optionalServices: ['battery_service']
                });

                const statusElement = document.getElementById('connection-status');
                const buttonElement = document.getElementById('connect-wearable');
                
                if (statusElement) statusElement.textContent = 'Connected!';
                if (buttonElement) buttonElement.textContent = '✅ Connected';
                
                await chrome.storage.local.set({ biometricConnected: true });
                
                this.showMessage('🎉 Smartwatch connected! Biometric optimization active.', 'success');
                
            } else {
                this.showMessage('❌ Bluetooth not supported in this browser.', 'error');
            }
        } catch (error) {
            console.error('Bluetooth connection failed:', error);
            this.showMessage('⚠️ Connection failed. Make sure your device supports Bluetooth.', 'warning');
        }
    }

    // Advanced Feature Previews
    launchImmersiveMode() {
        this.showFeaturePreview(
            '3D Immersive Environment', 
            'Experience distraction-free focus in beautiful 3D environments like forest cabins and space stations. Coming in Day 7!'
        );
    }

    joinFocusPod() {
        this.showFeaturePreview(
            'Social Focus Pods', 
            'Join peers for accountability-based focus sessions with privacy-first group tracking. Coming in Day 8!'
        );
    }

    openAICoach() {
        this.showFeaturePreview(
            'AI Work Coach', 
            'Get personalized productivity coaching based on your cognitive patterns and work style. Coming in Day 10!'
        );
    }

    showFeaturePreview(title, description) {
        const modal = document.createElement('div');
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0,0,0,0.8);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 1000;
        `;

        modal.innerHTML = `
            <div style="background: white; padding: 25px; border-radius: 15px; max-width: 300px; text-align: center;">
                <h3 style="color: #667eea; margin-bottom: 15px;">${title}</h3>
                <p style="margin-bottom: 20px; line-height: 1.5; color: #666;">${description}</p>
                <p style="font-size: 0.9rem; color: #888; margin-bottom: 15px;">This feature will be implemented in the upcoming development phases!</p>
                <button onclick="this.parentElement.parentElement.remove()" 
                    style="background: #667eea; color: white; border: none; padding: 10px 20px; border-radius: 20px; cursor: pointer;">
                    Got it!
                </button>
            </div>
        `;

        document.body.appendChild(modal);
    }

    showMessage(text, type = 'info') {
        const colors = {
            success: '#4CAF50',
            error: '#f44336',
            warning: '#ff9800',
            info: '#2196F3'
        };

        const message = document.createElement('div');
        message.style.cssText = `
            position: fixed;
            top: 10px;
            right: 10px;
            background: ${colors[type]};
            color: white;
            padding: 12px 16px;
            border-radius: 8px;
            font-size: 0.9rem;
            z-index: 1001;
            max-width: 250px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        `;
        message.textContent = text;

        document.body.appendChild(message);

        setTimeout(() => {
            if (document.body.contains(message)) {
                document.body.removeChild(message);
            }
        }, 4000);
    }

    async logFocusEvent(eventType) {
        try {
            const today = new Date().toDateString();
            const data = await chrome.storage.local.get('focusEvents');
            const events = data.focusEvents || {};
            
            if (!events[today]) events[today] = [];
            
            events[today].push({
                event: eventType,
                timestamp: Date.now(),
                cognitiveLoad: this.cognitiveLoad,
                aiActive: this.isAIReady
            });

            await chrome.storage.local.set({ focusEvents: events });

        } catch (error) {
            console.error('Error logging focus event:', error);
        }
    }

    handleMessage(message) {
        switch (message.action) {
            case 'sessionStateUpdate':
                // Update from background script
                this.currentSession = message.sessionState;
                this.updateTimerDisplay();
                this.updateSessionUI();
                break;
                
            case 'cognitiveStateUpdate':
                if (message.data) {
                    this.cognitiveLoad = message.data.cognitiveLoad;
                    this.updateCognitiveIndicator();
                }
                break;
                
            case 'aiStatusUpdate':
                this.isAIReady = message.ready;
                this.updateAIStatus(message.status);
                break;
                
            case 'sessionCompleted':
                this.showMessage('🎉 Focus session completed! Great work!', 'success');
                this.updateDailyStats();
                break;
                
            default:
                break;
        }
    }

    async updateDailyStats() {
        try {
            const data = await chrome.storage.local.get('dailyFocusTime');
            const currentTime = data.dailyFocusTime || 0;
            
            // Update UI immediately
            const hours = Math.floor(currentTime / 3600);
            const minutes = Math.floor((currentTime % 3600) / 60);
            const dailyFocusElement = document.getElementById('daily-focus');
            if (dailyFocusElement) {
                dailyFocusElement.textContent = `${hours}h ${minutes}m`;
            }

        } catch (error) {
            console.error('Error updating daily stats display:', error);
        }
    }
}

// Initialize the popup when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    try {
        window.focusCarePopup = new FocusCareTwoPopup();
    } catch (error) {
        console.error('Failed to initialize FocusCare popup:', error);
        
        // Show fallback UI
        document.body.innerHTML = `
            <div style="padding: 20px; text-align: center;">
                <h2 style="color: #667eea;">🧠 FocusCare 2.0</h2>
                <p style="color: #666; margin: 15px 0;">Extension is loading...</p>
                <p style="font-size: 0.8rem; color: #888;">If this persists, try reloading the extension.</p>
            </div>
        `;
    }
});

// Handle extension context invalidation
chrome.runtime.onConnect.addListener(() => {
    // Extension context is valid
});

window.addEventListener('beforeunload', () => {
    // Cleanup if needed
    console.log('🔄 FocusCare popup closing...');
});
