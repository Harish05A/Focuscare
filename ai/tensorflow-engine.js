/**
 * FocusCare 2.0 AI Engine
 * Revolutionary on-device machine learning for cognitive optimization
 */

class FocusCareAIEngine {
    constructor() {
        this.isInitialized = false;
        this.models = {
            cognitiveLoad: null,
            emotionalState: null,
            focusPattern: null
        };
        this.realTimeData = {
            keystrokePatterns: [],
            mouseMovements: [],
            cognitiveLoad: 0,
            emotionalState: 'neutral'
        };
    }

    async initialize() {
        try {
            console.log('🧠 Initializing FocusCare AI Engine...');
            
            // Load TensorFlow.js
            if (typeof tf === 'undefined') {
                await this.loadTensorFlow();
            }

            // Initialize cognitive load detection model
            await this.initializeCognitiveModel();
            
            // Set up real-time monitoring
            this.startRealTimeMonitoring();
            
            this.isInitialized = true;
            console.log('✅ AI Engine initialized successfully!');
            
        } catch (error) {
            console.error('❌ AI Engine initialization failed:', error);
            // Graceful fallback to non-AI features
            this.initializeFallbackMode();
        }
    }

    async loadTensorFlow() {
        return new Promise((resolve, reject) => {
            if (window.tf) {
                resolve();
                return;
            }

            const script = document.createElement('script');
            script.src = chrome.runtime.getURL('libs/tensorflow.min.js');
            script.onload = resolve;
            script.onerror = reject;
            document.head.appendChild(script);
        });
    }

    async initializeCognitiveModel() {
        try {
            // Create a simple cognitive load model (will be enhanced as we progress)
            this.models.cognitiveLoad = tf.sequential({
                layers: [
                    tf.layers.dense({ inputShape: [10], units: 64, activation: 'relu' }),
                    tf.layers.dropout({ rate: 0.2 }),
                    tf.layers.dense({ units: 32, activation: 'relu' }),
                    tf.layers.dense({ units: 1, activation: 'sigmoid' })
                ]
            });

            console.log('🎯 Cognitive load model initialized');

        } catch (error) {
            console.error('Failed to initialize cognitive model:', error);
        }
    }

    startRealTimeMonitoring() {
        // Monitor cognitive indicators every 5 seconds
        setInterval(() => {
            this.analyzeCognitiveState();
        }, 5000);

        // Monitor keystroke patterns
        this.setupKeystrokeMonitoring();
        
        // Monitor mouse movement patterns  
        this.setupMouseMonitoring();
    }

    setupKeystrokeMonitoring() {
        let keystrokes = [];
        let lastKeyTime = 0;

        document.addEventListener('keydown', (event) => {
            const currentTime = Date.now();
            const timeDiff = currentTime - lastKeyTime;
            
            keystrokes.push({
                key: event.key,
                timestamp: currentTime,
                timeDiff: timeDiff,
                keyCode: event.keyCode
            });

            // Keep only last 50 keystrokes for analysis
            if (keystrokes.length > 50) {
                keystrokes.shift();
            }

            this.realTimeData.keystrokePatterns = keystrokes;
            lastKeyTime = currentTime;
        });
    }

    setupMouseMonitoring() {
        let mouseData = [];
        let lastMouseTime = 0;

        document.addEventListener('mousemove', (event) => {
            const currentTime = Date.now();
            
            // Sample every 100ms to avoid overwhelming data
            if (currentTime - lastMouseTime > 100) {
                mouseData.push({
                    x: event.clientX,
                    y: event.clientY,
                    timestamp: currentTime,
                    velocity: this.calculateMouseVelocity(event, lastMouseTime)
                });

                // Keep only last 100 mouse movements
                if (mouseData.length > 100) {
                    mouseData.shift();
                }

                this.realTimeData.mouseMovements = mouseData;
                lastMouseTime = currentTime;
            }
        });
    }

    calculateMouseVelocity(event, lastTime) {
        if (this.realTimeData.mouseMovements.length === 0) return 0;
        
        const last = this.realTimeData.mouseMovements[this.realTimeData.mouseMovements.length - 1];
        const distance = Math.sqrt(
            Math.pow(event.clientX - last.x, 2) + 
            Math.pow(event.clientY - last.y, 2)
        );
        const timeDiff = Date.now() - lastTime;
        
        return timeDiff > 0 ? distance / timeDiff : 0;
    }

    analyzeCognitiveState() {
        if (!this.isInitialized) return;

        try {
            // Analyze keystroke patterns for cognitive load
            const keystrokeLoad = this.analyzeKeystrokePatterns();
            
            // Analyze mouse movement for stress indicators
            const mouseStress = this.analyzeMouseStress();
            
            // Combine indicators for overall cognitive load
            const overallLoad = (keystrokeLoad + mouseStress) / 2;
            
            this.realTimeData.cognitiveLoad = overallLoad;
            
            // Send update to popup/background
            this.broadcastCognitiveState();

        } catch (error) {
            console.error('Error analyzing cognitive state:', error);
        }
    }

    analyzeKeystrokePatterns() {
        const keystrokes = this.realTimeData.keystrokePatterns;
        if (keystrokes.length < 10) return 0.3; // Default moderate load

        // Analyze typing rhythm and patterns
        const avgTimeBetweenKeys = keystrokes.slice(1).reduce((sum, stroke, index) => {
            return sum + stroke.timeDiff;
        }, 0) / (keystrokes.length - 1);

        const keyVariance = this.calculateVariance(
            keystrokes.slice(1).map(stroke => stroke.timeDiff)
        );

        // Higher variance and irregular timing = higher cognitive load
        const irregularityScore = Math.min(keyVariance / 1000, 1);
        const speedScore = Math.min(avgTimeBetweenKeys / 300, 1);
        
        return (irregularityScore + speedScore) / 2;
    }

    analyzeMouseStress() {
        const movements = this.realTimeData.mouseMovements;
        if (movements.length < 20) return 0.3;

        // Analyze mouse movement smoothness and velocity
        const avgVelocity = movements.reduce((sum, move) => sum + move.velocity, 0) / movements.length;
        const velocityVariance = this.calculateVariance(movements.map(move => move.velocity));

        // Jerky, fast movements = higher stress
        const velocityScore = Math.min(avgVelocity / 10, 1);
        const smoothnessScore = Math.min(velocityVariance / 100, 1);
        
        return (velocityScore + smoothnessScore) / 2;
    }

    calculateVariance(numbers) {
        if (numbers.length === 0) return 0;
        
        const avg = numbers.reduce((sum, num) => sum + num, 0) / numbers.length;
        const squareDiffs = numbers.map(num => Math.pow(num - avg, 2));
        return squareDiffs.reduce((sum, diff) => sum + diff, 0) / numbers.length;
    }

    broadcastCognitiveState() {
        const state = {
            cognitiveLoad: this.realTimeData.cognitiveLoad,
            timestamp: Date.now(),
            keystrokeCount: this.realTimeData.keystrokePatterns.length,
            mouseActivity: this.realTimeData.mouseMovements.length
        };

        // Send to background script
        if (chrome.runtime) {
            chrome.runtime.sendMessage({
                action: 'cognitiveStateUpdate',
                data: state
            }).catch(() => {}); // Ignore errors if popup is closed
        }
    }

    // Public API methods
    getCognitiveLoad() {
        return this.realTimeData.cognitiveLoad;
    }

    getRecommendedBreakTime() {
        const load = this.realTimeData.cognitiveLoad;
        
        if (load > 0.8) return { minutes: 10, type: 'active_recovery' };
        if (load > 0.6) return { minutes: 5, type: 'mindful_breathing' };
        if (load > 0.4) return { minutes: 3, type: 'eye_rest' };
        
        return { minutes: 2, type: 'micro_break' };
    }

    initializeFallbackMode() {
        console.log('🔄 Running in fallback mode without AI features');
        this.isInitialized = false;
        
        // Provide basic functionality without AI
        setInterval(() => {
            this.realTimeData.cognitiveLoad = 0.5; // Default moderate load
            this.broadcastCognitiveState();
        }, 10000);
    }
}

// Initialize the AI engine when the script loads
window.focusCareAI = new FocusCareAIEngine();
window.focusCareAI.initialize();
