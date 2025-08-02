class BreakTimer {
    constructor() {
        this.minutes = 5;
        this.seconds = 0;
        this.isRunning = false;
        this.timer = null;
        this.breakTips = [
            "💧 Drink a glass of water to stay hydrated",
            "🌱 Look at something green or natural outside",
            "🤸 Do some simple desk stretches",
            "👀 Follow the 20-20-20 rule: look 20 feet away for 20 seconds",
            "🧘 Take 5 deep breaths to reduce stress",
            "🚶 Take a short walk around your space",
            "💪 Do some simple exercises like shoulder rolls",
            "📱 Step away from all screens for a few minutes"
        ];
        
        this.init();
    }
    
    init() {
        this.setupEventListeners();
        this.updateDisplay();
        this.loadBreakTips();
        this.addPageAnimations();
    }
    
    setupEventListeners() {
        // Timer controls
        document.getElementById('start-break').addEventListener('click', () => this.startBreakTimer());
        document.getElementById('skip-break').addEventListener('click', () => this.skipBreak());
        document.getElementById('return-to-work').addEventListener('click', () => this.returnToWork());
        
        // Activity cards
        document.querySelectorAll('.activity-card').forEach(card => {
            card.addEventListener('click', (e) => {
                const activity = e.currentTarget.dataset.activity;
                this.startActivity(activity);
            });
        });
        
        // Modal controls
        document.querySelector('.close').addEventListener('click', () => this.closeModal());
        window.addEventListener('click', (e) => {
            const modal = document.getElementById('activity-modal');
            if (e.target === modal) {
                this.closeModal();
            }
        });
    }
    
    startBreakTimer() {
        if (!this.isRunning) {
            this.isRunning = true;
            this.timer = setInterval(() => this.tick(), 1000);
            
            document.getElementById('start-break').textContent = 'Break in Progress...';
            document.getElementById('start-break').disabled = true;
            
            // Add pulse animation to timer
            document.querySelector('.timer-circle').classList.add('pulse');
        }
    }
    
    tick() {
        if (this.seconds > 0) {
            this.seconds--;
        } else if (this.minutes > 0) {
            this.minutes--;
            this.seconds = 59;
        } else {
            // Break timer finished
            this.completeBreak();
            return;
        }
        
        this.updateDisplay();
    }
    
    completeBreak() {
        this.isRunning = false;
        clearInterval(this.timer);
        
        // Show completion message
        this.showBreakComplete();
        
        // Reset timer
        this.minutes = 5;
        this.seconds = 0;
        this.updateDisplay();
        
        document.getElementById('start-break').textContent = 'Start Another Break';
        document.getElementById('start-break').disabled = false;
        document.querySelector('.timer-circle').classList.remove('pulse');
    }
    
    showBreakComplete() {
        const modal = document.getElementById('activity-modal');
        const modalBody = document.getElementById('modal-body');
        
        modalBody.innerHTML = `
            <div style="text-align: center; padding: 20px;">
                <div style="font-size: 4rem; margin-bottom: 20px;">🎉</div>
                <h2 style="color: #4facfe; margin-bottom: 15px;">Break Complete!</h2>
                <p style="font-size: 1.1rem; color: #666; margin-bottom: 25px;">
                    Great job taking care of yourself! You're ready to focus again.
                </p>
                <button onclick="window.close()" style="
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    color: white;
                    border: none;
                    padding: 12px 24px;
                    border-radius: 25px;
                    font-size: 1rem;
                    cursor: pointer;
                ">Return to Work 🎯</button>
            </div>
        `;
        
        modal.style.display = 'block';
    }
    
    skipBreak() {
        if (confirm('Are you sure you want to skip your break? Taking breaks is important for your well-being.')) {
            this.returnToWork();
        }
    }
    
    returnToWork() {
        // Close the break tab
        window.close();
    }
    
    updateDisplay() {
        document.getElementById('break-minutes').textContent = 
            this.minutes.toString().padStart(2, '0');
        document.getElementById('break-seconds').textContent = 
            this.seconds.toString().padStart(2, '0');
    }
    
    loadBreakTips() {
        const container = document.getElementById('break-tips');
        
        // Show 3 random tips
        const randomTips = this.getRandomTips(3);
        
        randomTips.forEach(tip => {
            const tipElement = document.createElement('div');
            tipElement.className = 'tip-item fade-in';
            tipElement.innerHTML = `<p>${tip}</p>`;
            container.appendChild(tipElement);
        });
    }
    
    getRandomTips(count) {
        const shuffled = [...this.breakTips].sort(() => 0.5 - Math.random());
        return shuffled.slice(0, count);
    }
    
    startActivity(activity) {
        const modal = document.getElementById('activity-modal');
        const modalBody = document.getElementById('modal-body');
        
        let content = '';
        
        switch (activity) {
            case 'breathing':
                content = this.getBreathingActivity();
                break;
            case 'stretch':
                content = this.getStretchActivity();
                break;
            case 'eyes':
                content = this.getEyeRestActivity();
                break;
            case 'hydrate':
                content = this.getHydrationActivity();
                break;
        }
        
        modalBody.innerHTML = content;
        modal.style.display = 'block';
    }
    
    getBreathingActivity() {
        return `
            <div class="activity-content">
                <h2>🫁 Deep Breathing Exercise</h2>
                <div class="breathing-guide">
                    <div class="breathing-circle" id="breathing-circle"></div>
                    <p id="breathing-instruction">Click "Start" to begin</p>
                    <button id="start-breathing" onclick="this.startBreathing()" 
                        style="margin: 20px auto; display: block; padding: 10px 20px; background: #4facfe; color: white; border: none; border-radius: 20px; cursor: pointer;">
                        Start Breathing Exercise
                    </button>
                </div>
                <div class="instructions">
                    <h3>Instructions:</h3>
                    <ul>
                        <li>Breathe in slowly through your nose for 4 counts</li>
                        <li>Hold your breath for 4 counts</li>
                        <li>Exhale slowly through your mouth for 6 counts</li>
                        <li>Repeat this cycle 5 times</li>
                    </ul>
                </div>
            </div>
        `;
    }
    
    getStretchActivity() {
        return `
            <div class="activity-content">
                <h2>🤸 Quick Desk Stretches</h2>
                <div class="stretch-guide">
                    <div class="stretch-item">
                        <h4>1. Neck Rolls</h4>
                        <p>Slowly roll your head in a circle, 5 times each direction</p>
                    </div>
                    <div class="stretch-item">
                        <h4>2. Shoulder Shrugs</h4>
                        <p>Lift your shoulders up to your ears, hold for 3 seconds, release. Repeat 5 times</p>
                    </div>
                    <div class="stretch-item">
                        <h4>3. Wrist Stretches</h4>
                        <p>Extend your arm, pull back your fingers gently. Hold for 15 seconds each hand</p>
                    </div>
                    <div class="stretch-item">
                        <h4>4. Seated Spinal Twist</h4>
                        <p>Sit up straight, place right hand behind you, twist gently. Hold 15 seconds each side</p>
                    </div>
                </div>
            </div>
        `;
    }
    
    getEyeRestActivity() {
        return `
            <div class="activity-content">
                <h2>👀 Eye Rest Exercise</h2>
                <div class="eye-rest-guide">
                    <div class="rule-explanation">
                        <h3>20-20-20 Rule</h3>
                        <p>Every 20 minutes, look at something 20 feet away for 20 seconds</p>
                    </div>
                    <div class="eye-exercises">
                        <h4>Additional Eye Exercises:</h4>
                        <ul>
                            <li><strong>Blinking:</strong> Blink slowly and deliberately 10 times</li>
                            <li><strong>Focus Shifting:</strong> Look at something close, then far away</li>
                            <li><strong>Eye Circles:</strong> Look up, right, down, left in a circle</li>
                            <li><strong>Palming:</strong> Cup your palms over closed eyes for 30 seconds</li>
                        </ul>
                    </div>
                </div>
            </div>
        `;
    }
    
    getHydrationActivity() {
        return `
            <div class="activity-content">
                <h2>💧 Stay Hydrated</h2>
                <div class="hydration-guide">
                    <div class="hydration-reminder">
                        <p style="font-size: 1.2rem; text-align: center; margin-bottom: 20px;">
                            Time to drink some water! 💦
                        </p>
                        <div class="hydration-benefits">
                            <h4>Benefits of staying hydrated:</h4>
                            <ul>
                                <li>Improves concentration and alertness</li>
                                <li>Reduces headaches and fatigue</li>
                                <li>Supports overall brain function</li>
                                <li>Helps maintain energy levels</li>
                            </ul>
                        </div>
                        <div style="text-align: center; margin-top: 20px;">
                            <button onclick="this.logHydration()" 
                                style="padding: 10px 20px; background: #4facfe; color: white; border: none; border-radius: 20px; cursor: pointer;">
                                ✅ I drank water!
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }
    
    closeModal() {
        document.getElementById('activity-modal').style.display = 'none';
    }
    
    addPageAnimations() {
        // Add fade-in animation to sections
        const sections = document.querySelectorAll('section');
        sections.forEach((section, index) => {
            setTimeout(() => {
                section.classList.add('fade-in');
            }, index * 200);
        });
    }
    
    logHydration() {
        // Log hydration event
        const today = new Date().toDateString();
        chrome.storage.local.get('hydrationLog', (data) => {
            const log = data.hydrationLog || {};
            if (!log[today]) log[today] = 0;
            log[today]++;
            
            chrome.storage.local.set({ hydrationLog: log });
        });
        
        // Show confirmation
        alert('Great! Hydration logged. Keep it up! 💪');
        this.closeModal();
    }
}

// Initialize break timer
document.addEventListener('DOMContentLoaded', () => {
    new BreakTimer();
});
