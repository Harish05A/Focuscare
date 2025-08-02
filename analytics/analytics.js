class AnalyticsDashboard {
    constructor() {
        this.data = {
            sessions: {},
            moods: {},
            blockedAttempts: {}
        };
        this.init();
    }
    
    async init() {
        await this.loadData();
        this.renderDashboard();
        this.setupEventListeners();
    }
    
    async loadData() {
        try {
            const result = await chrome.storage.local.get(['sessions', 'moods', 'blockedAttempts']);
            
            this.data.sessions = result.sessions || {};
            this.data.moods = result.moods || {};
            this.data.blockedAttempts = result.blockedAttempts || {};
            
        } catch (error) {
            console.error('Error loading analytics data:', error);
        }
    }
    
    renderDashboard() {
        this.renderSummaryCards();
        this.renderActivityChart();
        this.renderMoodTrends();
    }
    
    renderSummaryCards() {
        // Calculate total sessions
        const totalSessions = Object.values(this.data.sessions).reduce((total, dayData) => {
            return total + (Array.isArray(dayData) ? dayData.length : 0);
        }, 0);
        
        // Calculate total focus time (assuming 25 minutes per session)
        const totalMinutes = totalSessions * 25;
        const totalHours = Math.floor(totalMinutes / 60);
        const remainingMinutes = totalMinutes % 60;
        const timeDisplay = totalHours > 0 ? `${totalHours}h ${remainingMinutes}m` : `${totalMinutes}m`;
        
        // Calculate total blocked attempts
        const totalBlocked = Object.values(this.data.blockedAttempts).reduce((total, count) => total + count, 0);
        
        // Calculate average mood
        const avgMood = this.calculateAverageMood();
        
        // Update DOM
        document.getElementById('total-sessions').textContent = totalSessions;
        document.getElementById('total-time').textContent = timeDisplay;
        document.getElementById('blocked-sites').textContent = totalBlocked;
        document.getElementById('avg-mood').textContent = avgMood;
    }
    
    renderActivityChart() {
        const container = document.getElementById('days-chart');
        container.innerHTML = '';
        
        const last7Days = this.getLast7Days();
        const maxSessions = Math.max(...last7Days.map(day => day.sessions), 1);
        
        if (maxSessions === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-icon">📊</div>
                    <h3>No focus sessions yet</h3>
                    <p>Start your first focus session to see your progress here!</p>
                </div>
            `;
            return;
        }
        
        last7Days.forEach(day => {
            const barHeight = (day.sessions / maxSessions) * 100;
            
            const dayElement = document.createElement('div');
            dayElement.className = 'day-column';
            dayElement.innerHTML = `
                <div class="day-bar" style="height: ${Math.max(barHeight, 10)}%" title="${day.sessions} sessions on ${day.date}">
                    ${day.sessions > 0 ? day.sessions : ''}
                </div>
                <div class="day-label">${day.dayName}</div>
            `;
            
            container.appendChild(dayElement);
        });
    }
    
    renderMoodTrends() {
        const container = document.getElementById('mood-grid');
        container.innerHTML = '';
        
        const moodCounts = this.calculateMoodCounts();
        const moodLabels = {
            '😊': 'Happy',
            '😐': 'Neutral', 
            '😔': 'Sad',
            '😤': 'Stressed'
        };
        
        if (Object.values(moodCounts).every(count => count === 0)) {
            container.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-icon">😊</div>
                    <h3>No mood data yet</h3>
                    <p>Track your mood to see patterns and trends!</p>
                </div>
            `;
            return;
        }
        
        Object.entries(moodLabels).forEach(([emoji, label]) => {
            const count = moodCounts[emoji] || 0;
            
            const moodElement = document.createElement('div');
            moodElement.className = 'mood-item';
            moodElement.innerHTML = `
                <div class="mood-emoji">${emoji}</div>
                <div class="mood-count">${count}</div>
                <div class="mood-label">${label}</div>
            `;
            
            container.appendChild(moodElement);
        });
    }
    
    getLast7Days() {
        const days = [];
        const today = new Date();
        
        for (let i = 6; i >= 0; i--) {
            const date = new Date(today);
            date.setDate(date.getDate() - i);
            
            const dateString = date.toDateString();
            const dayName = date.toLocaleDateString('en', { weekday: 'short' });
            
            const sessions = this.data.sessions[dateString] ? this.data.sessions[dateString].length : 0;
            
            days.push({
                date: dateString,
                dayName: dayName,
                sessions: sessions
            });
        }
        
        return days;
    }
    
    calculateMoodCounts() {
        const counts = { '😊': 0, '😐': 0, '😔': 0, '😤': 0 };
        
        Object.values(this.data.moods).forEach(dayMoods => {
            if (Array.isArray(dayMoods)) {
                dayMoods.forEach(moodEntry => {
                    if (counts.hasOwnProperty(moodEntry.mood)) {
                        counts[moodEntry.mood]++;
                    }
                });
            }
        });
        
        return counts;
    }
    
    calculateAverageMood() {
        const moodCounts = this.calculateMoodCounts();
        const total = Object.values(moodCounts).reduce((sum, count) => sum + count, 0);
        
        if (total === 0) return '😐';
        
        // Simple average calculation (could be more sophisticated)
        const moodScores = { '😊': 4, '😐': 3, '😔': 2, '😤': 1 };
        let totalScore = 0;
        
        Object.entries(moodCounts).forEach(([mood, count]) => {
            totalScore += moodScores[mood] * count;
        });
        
        const avgScore = totalScore / total;
        
        if (avgScore >= 3.5) return '😊';
        if (avgScore >= 2.5) return '😐';
        if (avgScore >= 1.5) return '😔';
        return '😤';
    }
    
    setupEventListeners() {
        document.getElementById('clear-data').addEventListener('click', () => {
            this.clearAllData();
        });
        
        document.getElementById('back-to-focus').addEventListener('click', () => {
            window.close();
        });
    }
    
    async clearAllData() {
        const confirmed = confirm('Are you sure you want to clear all your focus data? This cannot be undone.');
        
        if (confirmed) {
            try {
                await chrome.storage.local.clear();
                
                // Reset data
                this.data = {
                    sessions: {},
                    moods: {},
                    blockedAttempts: {}
                };
                
                // Re-render dashboard
                this.renderDashboard();
                
                alert('All data cleared successfully!');
                
            } catch (error) {
                console.error('Error clearing data:', error);
                alert('Error clearing data. Please try again.');
            }
        }
    }
}

// Initialize analytics dashboard
document.addEventListener('DOMContentLoaded', () => {
    new AnalyticsDashboard();
});
