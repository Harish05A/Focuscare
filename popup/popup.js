// Combined FocusCare 2.0 Popup Logic - Final Version

class FocusCarePopup {
  constructor() {
    this.currentSession = null;
    this.selectedDuration = 25;
    this.timerInterval = null;
    this.stats = null;
    this.init();
  }

  async init() {
    console.log('Initializing popup'); // Debug log
    // Add a small delay to ensure background script is ready
    setTimeout(async () => {
      await this.loadStats();
      this.setupEventListeners();
      this.updateUI();
    }, 100);
  }

  setupEventListeners() {
    // Main action buttons
    const startBtn = document.getElementById('start-focus-btn');
    if (startBtn) {
      startBtn.addEventListener('click', () => {
        console.log('Start focus button clicked'); // Debug log
        this.showFocusModal();
      });
    }

    const toggleBtn = document.getElementById('toggle-blocking-btn');
    if (toggleBtn) {
      toggleBtn.addEventListener('click', () => {
        this.toggleBlocking();
      });
    }

    const breakBtn = document.getElementById('quick-break-btn');
    if (breakBtn) {
      breakBtn.addEventListener('click', () => {
        this.takeQuickBreak();
      });
    }

    // Modal controls
    const closeBtn = document.getElementById('close-modal');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => {
        this.hideFocusModal();
      });
    }

    const cancelBtn = document.getElementById('cancel-session');
    if (cancelBtn) {
      cancelBtn.addEventListener('click', () => {
        this.hideFocusModal();
      });
    }

    const confirmBtn = document.getElementById('confirm-start');
    if (confirmBtn) {
      confirmBtn.addEventListener('click', () => {
        console.log('Confirm start clicked'); // Debug log
        this.startFocusSession();
      });
    }

    // Duration selection
    document.querySelectorAll('.duration-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        this.selectDuration(parseInt(e.target.dataset.duration));
      });
    });

    // Footer buttons
    const settingsBtn = document.getElementById('settings-btn');
    if (settingsBtn) {
      settingsBtn.addEventListener('click', () => {
        chrome.runtime.openOptionsPage();
      });
    }

    // Modal backdrop click
    const modal = document.getElementById('focus-modal');
    if (modal) {
      modal.addEventListener('click', (e) => {
        if (e.target.id === 'focus-modal') {
          this.hideFocusModal();
        }
      });
    }
  }

  async loadStats() {
    try {
      console.log('Loading stats...'); // Debug log
      const response = await new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('Timeout waiting for background script'));
        }, 5000); // 5 second timeout

        chrome.runtime.sendMessage({ action: 'getStats' }, (response) => {
          clearTimeout(timeout);

          if (chrome.runtime.lastError) {
            console.error('Runtime error:', chrome.runtime.lastError);
            reject(chrome.runtime.lastError);
          } else if (!response) {
            reject(new Error('No response from background script'));
          } else if (response.error) {
            reject(new Error(response.error));
          } else {
            resolve(response);
          }
        });
      });

      console.log('Stats loaded successfully:', response); // Debug log
      this.stats = response;
      this.updateStatsDisplay();
      this.updateStatusIndicator();

    } catch (error) {
      console.error('Failed to load stats:', error);
      // Show user-friendly error and use defaults
      this.showNotification('Failed to connect to background service. Using defaults.', 'warning');

      this.stats = {
        focusMode: false,
        blockingEnabled: true,
        todayFocusTime: 0,
        todayBlocked: 0,
        totalSessions: 0,
        currentSession: null
      };

      this.updateStatsDisplay();
      this.updateStatusIndicator();
    }
  }

  updateStatsDisplay() {
    if (!this.stats) return;

    // Update today's stats with null checks
    const focusTimeEl = document.getElementById('focus-time');
    if (focusTimeEl) {
      focusTimeEl.textContent = this.formatTime(this.stats.todayFocusTime || 0);
    }

    const blockedCountEl = document.getElementById('blocked-count');
    if (blockedCountEl) {
      blockedCountEl.textContent = this.stats.todayBlocked || 0;
    }

    const sessionsEl = document.getElementById('sessions-completed');
    if (sessionsEl) {
      sessionsEl.textContent = this.stats.totalSessions || 0;
    }

    // Update productivity score
    const score = this.calculateProductivityScore();
    const scoreEl = document.getElementById('productivity-score');
    if (scoreEl) {
      scoreEl.textContent = score;
      this.updateScoreCircle(score);
    }
  }

  updateStatusIndicator() {
    const statusDot = document.getElementById('status-dot');
    const statusTitle = document.getElementById('status-title');
    const statusSubtitle = document.getElementById('status-subtitle');
    const focusIcon = document.getElementById('focus-icon');

    if (!this.stats) return;

    if (this.stats.focusMode) {
      if (statusDot) statusDot.style.background = '#00c851';
      if (statusTitle) statusTitle.textContent = 'Focus Mode Active';
      if (statusSubtitle) statusSubtitle.textContent = 'Blocking distracting websites';
      if (focusIcon) focusIcon.textContent = '🎯';
    } else if (this.stats.blockingEnabled) {
      if (statusDot) statusDot.style.background = '#4c9aff';
      if (statusTitle) statusTitle.textContent = 'Protection Active';
      if (statusSubtitle) statusSubtitle.textContent = 'Smart blocking enabled';
      if (focusIcon) focusIcon.textContent = '🛡️';
    } else {
      if (statusDot) statusDot.style.background = '#ff8800';
      if (statusTitle) statusTitle.textContent = 'Protection Disabled';
      if (statusSubtitle) statusSubtitle.textContent = 'Click to enable blocking';
      if (focusIcon) focusIcon.textContent = '⚠️';
    }
  }

  calculateProductivityScore() {
    if (!this.stats) return 0;

    const focusTime = this.stats.todayFocusTime || 0;
    const blocked = this.stats.todayBlocked || 0;
    const sessions = this.stats.totalSessions || 0;

    const baseScore = Math.min(90, focusTime * 2);
    const sessionBonus = sessions * 5;
    const blockingPenalty = blocked * 0.5;

    const finalScore = Math.max(0, Math.min(100,
      baseScore + sessionBonus - blockingPenalty
    ));

    return Math.round(finalScore);
  }

  updateScoreCircle(score) {
    const circle = document.querySelector('.score-circle');
    if (circle) {
      const degrees = (score / 100) * 360;
      circle.style.background =
        `conic-gradient(var(--accent-primary) 0deg ${degrees}deg, var(--bg-primary) ${degrees}deg 360deg)`;
    }
  }

  formatTime(minutes) {
    if (minutes < 60) {
      return `${minutes}m`;
    }
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return `${hours}h ${remainingMinutes}m`;
  }

  showFocusModal() {
    console.log('Showing focus modal'); // Debug log
    const modal = document.getElementById('focus-modal');
    if (modal) {
      modal.classList.remove('hidden');
      document.body.style.overflow = 'hidden';
    }
  }

  hideFocusModal() {
    const modal = document.getElementById('focus-modal');
    if (modal) {
      modal.classList.add('hidden');
      document.body.style.overflow = 'auto';
    }
  }

  selectDuration(duration) {
    console.log('Selected duration:', duration); // Debug log
    this.selectedDuration = duration;

    document.querySelectorAll('.duration-btn').forEach(btn => {
      btn.classList.remove('active');
    });

    const selectedBtn = document.querySelector(`[data-duration="${duration}"]`);
    if (selectedBtn) {
      selectedBtn.classList.add('active');
    }
  }

  async startFocusSession() {
    console.log('Starting focus session with duration:', this.selectedDuration); // Debug log

    const strictMode = document.getElementById('strict-mode')?.checked || false;
    const notifications = document.getElementById('notifications')?.checked || true;

    try {
      this.showNotification('Starting focus session...', 'info', 1000);

      const response = await new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('Timeout starting session'));
        }, 10000); // 10 second timeout

        chrome.runtime.sendMessage({
          action: 'startFocusSession',
          duration: this.selectedDuration,
          strictMode: strictMode,
          notifications: notifications
        }, (response) => {
          clearTimeout(timeout);

          if (chrome.runtime.lastError) {
            reject(chrome.runtime.lastError);
          } else if (!response) {
            reject(new Error('No response from background script'));
          } else if (response.error) {
            reject(new Error(response.error));
          } else {
            resolve(response);
          }
        });
      });

      console.log('Session start response:', response); // Debug log

      if (response.success) {
        this.hideFocusModal();
        this.showTimerSection();
        this.startTimer(this.selectedDuration * 60);
        this.showNotification('Focus session started! 🎯', 'success');
      } else {
        throw new Error('Session start failed');
      }

    } catch (error) {
      console.error('Failed to start focus session:', error);
      this.showNotification(`Failed to start session: ${error.message}`, 'error');
    }
  }

  showTimerSection() {
    const timerSection = document.getElementById('timer-section');
    const quickActions = document.querySelector('.quick-actions');
    const statsSection = document.querySelector('.stats-section');

    if (timerSection) timerSection.classList.remove('hidden');
    if (quickActions) quickActions.classList.add('hidden');
    if (statsSection) statsSection.classList.add('hidden');
  }

  hideTimerSection() {
    const timerSection = document.getElementById('timer-section');
    const quickActions = document.querySelector('.quick-actions');
    const statsSection = document.querySelector('.stats-section');

    if (timerSection) timerSection.classList.add('hidden');
    if (quickActions) quickActions.classList.remove('hidden');
    if (statsSection) statsSection.classList.remove('hidden');
  }

  startTimer(seconds) {
    console.log('Starting timer for', seconds, 'seconds'); // Debug log

    let remainingTime = seconds;

    this.updateTimerDisplay(remainingTime);

    this.timerInterval = setInterval(() => {
      remainingTime--;
      this.updateTimerDisplay(remainingTime);
      this.updateTimerCircle(remainingTime, seconds);

      if (remainingTime <= 0) {
        this.completeSession();
      }
    }, 1000);

    // Setup timer controls
    this.setupTimerControls();
  }

  setupTimerControls() {
    const pauseBtn = document.getElementById('pause-btn');
    const stopBtn = document.getElementById('stop-btn');

    if (pauseBtn) {
      pauseBtn.onclick = () => this.pauseSession();
    }

    if (stopBtn) {
      stopBtn.onclick = () => this.stopSession();
    }
  }

  updateTimerDisplay(seconds) {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    const display = `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;

    const timerEl = document.getElementById('timer-time');
    if (timerEl) {
      timerEl.textContent = display;
    }
  }

  updateTimerCircle(remaining, total) {
    const circle = document.querySelector('.timer-circle');
    if (circle) {
      const progress = ((total - remaining) / total) * 360;
      circle.style.background =
        `conic-gradient(var(--accent-primary) 0deg ${progress}deg, var(--bg-primary) ${progress}deg 360deg)`;
    }
  }

  pauseSession() {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
      const pauseBtn = document.getElementById('pause-btn');
      if (pauseBtn) pauseBtn.textContent = '▶️';
    }
  }

  async stopSession() {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }

    try {
      await new Promise((resolve, reject) => {
        chrome.runtime.sendMessage({ action: 'endFocusSession' }, (response) => {
          if (chrome.runtime.lastError) {
            reject(chrome.runtime.lastError);
          } else {
            resolve(response);
          }
        });
      });
    } catch (error) {
      console.error('Error stopping session:', error);
      this.showNotification('Failed to end session.', 'error');
    }

    this.hideTimerSection();
    await this.loadStats();
  }

  completeSession() {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }

    this.hideTimerSection();
    this.showCompletionMessage();
    this.loadStats();
  }

  showCompletionMessage() {
    this.showNotification('🎉 Session Complete! Great job staying focused!', 'success', 3000);
  }

  async toggleBlocking() {
    try {
      const response = await new Promise((resolve, reject) => {
        chrome.runtime.sendMessage({ action: 'toggleBlocking' }, (response) => {
          if (chrome.runtime.lastError) {
            reject(chrome.runtime.lastError);
          } else {
            resolve(response);
          }
        });
      });

      if (response.success) {
        await this.loadStats();
        this.showNotification(`Blocking ${response.blockingEnabled ? 'enabled' : 'disabled'}`, 'success');
      }
    } catch (error) {
      console.error('Failed to toggle blocking:', error);
      this.showNotification('Failed to toggle blocking', 'error');
    }
  }

  async takeQuickBreak() {
    try {
      await new Promise((resolve, reject) => {
        chrome.runtime.sendMessage({
          action: 'quickBreak',
          duration: 5
        }, (response) => {
          if (chrome.runtime.lastError) {
            reject(chrome.runtime.lastError);
          } else {
            resolve(response);
          }
        });
      });

      this.showNotification('☕ 5-minute break started!', 'success');
    } catch (error) {
      console.error('Failed to start break:', error);
    }
  }

  showNotification(message, type = 'info', duration = 2000) {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;

    notification.style.cssText = `
      position: fixed;
      top: 20px;
      left: 50%;
      transform: translateX(-50%);
      background: ${type === 'success' ? '#00c851' : type === 'error' ? '#ff4444' : '#4c9aff'};
      color: white;
      padding: 12px 20px;
      border-radius: 25px;
      z-index: 2000;
      animation: slideDown 0.3s ease-out;
      font-size: 14px;
      font-weight: 600;
      box-shadow: 0 4px 20px rgba(0,0,0,0.3);
    `;

    document.body.appendChild(notification);

    setTimeout(() => {
      notification.style.animation = 'slideUp 0.3s ease-out forwards';
      setTimeout(() => notification.remove(), 300);
    }, duration);
  }

  updateUI() {
    document.body.classList.add('fade-in');
  }
}

// Add CSS animations for notifications
const style = document.createElement('style');
style.textContent = `
  @keyframes slideDown {
    from {
      opacity: 0;
      transform: translateX(-50%) translateY(-20px);
    }
    to {
      opacity: 1;
      transform: translateX(-50%) translateY(0);
    }
  }

  @keyframes slideUp {
    from {
      opacity: 1;
      transform: translateX(-50%) translateY(0);
    }
    to {
      opacity: 0;
      transform: translateX(-50%) translateY(-20px);
    }
  }
`;
document.head.appendChild(style);

// Initialize popup when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  console.log('DOM loaded, initializing popup');
  window.focusCarePopup = new FocusCarePopup();
});