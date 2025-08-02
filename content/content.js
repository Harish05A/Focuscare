class SiteBlocker {
    constructor() {
        this.isBlocked = false;
        this.init();
    }
    
    async init() {
        // Check if current site should be blocked
        await this.checkIfBlocked();
    }
    
    async checkIfBlocked() {
        try {
            const data = await chrome.storage.local.get(['siteBlockingEnabled', 'blockedSites']);
            
            if (!data.siteBlockingEnabled) return;
            
            const currentDomain = window.location.hostname.replace('www.', '');
            const blockedSites = data.blockedSites || this.getDefaultBlockedSites();
            
            const isBlocked = blockedSites.some(site => currentDomain.includes(site));
            
            if (isBlocked) {
                this.blockCurrentSite();
            }
            
        } catch (error) {
            console.error('Error checking site blocking:', error);
        }
    }
    
    getDefaultBlockedSites() {
        return [
            'facebook.com',
            'instagram.com',
            'twitter.com',
            'youtube.com',
            'reddit.com',
            'tiktok.com',
            'netflix.com'
        ];
    }
    
    blockCurrentSite() {
        // Create blocking overlay
        const overlay = document.createElement('div');
        overlay.id = 'focuscare-block-overlay';
        overlay.innerHTML = `
            <div class="block-content">
                <div class="block-icon">🧠</div>
                <h2>FocusCare is Active</h2>
                <p>This site is blocked during your focus session.</p>
                <p class="block-message">Take a deep breath and return to your important work.</p>
                <div class="block-actions">
                    <button id="close-tab-btn">Close Tab</button>
                    <button id="disable-blocking-btn">Disable Blocking</button>
                </div>
            </div>
        `;
        
        // Add styles
        overlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 999999;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        `;
        
        const style = document.createElement('style');
        style.textContent = `
            .block-content {
                text-align: center;
                max-width: 400px;
                padding: 3rem;
                background: rgba(255, 255, 255, 0.1);
                border-radius: 20px;
                backdrop-filter: blur(10px);
            }
            
            .block-icon {
                font-size: 4rem;
                margin-bottom: 1rem;
            }
            
            .block-content h2 {
                font-size: 2rem;
                margin-bottom: 1rem;
                font-weight: 300;
            }
            
            .block-content p {
                font-size: 1.1rem;
                margin-bottom: 1rem;
                opacity: 0.9;
            }
            
            .block-message {
                font-style: italic;
                margin-bottom: 2rem !important;
            }
            
            .block-actions {
                display: flex;
                gap: 1rem;
                justify-content: center;
            }
            
            .block-actions button {
                padding: 0.75rem 1.5rem;
                border: 2px solid white;
                background: transparent;
                color: white;
                border-radius: 25px;
                cursor: pointer;
                font-size: 0.9rem;
                transition: all 0.3s ease;
            }
            
            .block-actions button:hover {
                background: white;
                color: #667eea;
            }
        `;
        
        document.head.appendChild(style);
        document.body.appendChild(overlay);
        
        // Add event listeners
        document.getElementById('close-tab-btn').addEventListener('click', () => {
            window.close();
        });
        
        document.getElementById('disable-blocking-btn').addEventListener('click', async () => {
            await chrome.storage.local.set({ siteBlockingEnabled: false });
            document.body.removeChild(overlay);
            document.head.removeChild(style);
        });
        
        // Log blocked attempt
        this.logBlockedAttempt();
    }
    
    async logBlockedAttempt() {
        try {
            const today = new Date().toDateString();
            const data = await chrome.storage.local.get('blockedAttempts');
            const attempts = data.blockedAttempts || {};
            
            if (!attempts[today]) attempts[today] = 0;
            attempts[today]++;
            
            await chrome.storage.local.set({ blockedAttempts: attempts });
            
        } catch (error) {
            console.error('Error logging blocked attempt:', error);
        }
    }
}

// Initialize site blocker when page loads
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => new SiteBlocker());
} else {
    new SiteBlocker();
}
