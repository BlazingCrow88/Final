/* ===================================
   ANALYTICS DASHBOARD SYSTEM
   File: admin/analytics-dashboard/analytics-dashboard.js
   =================================== */

class AnalyticsDashboard {
    constructor() {
        this.charts = {};
        this.realTimeData = {};
        this.currentDateRange = '7d';
        this.refreshInterval = null;
        this.isRealTimeEnabled = false;
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.loadDashboardData();
        this.initializeCharts();
        this.startRealTimeUpdates();
    }

    setupEventListeners() {
        // Date range selector
        document.getElementById('date-range-select')?.addEventListener('change', (e) => {
            this.currentDateRange = e.target.value;
            this.loadDashboardData();
        });

        // Real-time toggle
        document.getElementById('realtime-toggle')?.addEventListener('change', (e) => {
            this.isRealTimeEnabled = e.target.checked;
            if (this.isRealTimeEnabled) {
                this.startRealTimeUpdates();
            } else {
                this.stopRealTimeUpdates();
            }
        });

        // Export buttons
        document.getElementById('export-pdf')?.addEventListener('click', () => this.exportToPDF());
        document.getElementById('export-csv')?.addEventListener('click', () => this.exportToCSV());
        document.getElementById('export-json')?.addEventListener('click', () => this.exportToJSON());

        // Dashboard filters
        document.getElementById('traffic-source-filter')?.addEventListener('change', (e) => {
            this.filterTrafficSource(e.target.value);
        });

        document.getElementById('content-type-filter')?.addEventListener('change', (e) => {
            this.filterContentType(e.target.value);
        });

        // Refresh button
        document.getElementById('refresh-dashboard')?.addEventListener('click', () => {
            this.loadDashboardData();
        });
    }

    async loadDashboardData() {
        const loadingSpinner = document.getElementById('dashboard-loading');
        
        try {
            loadingSpinner.style.display = 'block';
            
            const [overviewData, trafficData, contentData, userBehaviorData] = await Promise.all([
                this.fetchOverviewData(),
                this.fetchTrafficData(),
                this.fetchContentData(),
                this.fetchUserBehaviorData()
            ]);

            this.updateOverviewCards(overviewData);
            this.updateTrafficChart(trafficData);
            this.updateContentPerformance(contentData);
            this.updateUserBehaviorChart(userBehaviorData);
            
            // Update last refreshed time
            document.getElementById('last-updated').textContent = new Date().toLocaleString();
            
        } catch (error) {
            console.error('Error loading dashboard data:', error);
            this.showError('Failed to load dashboard data');
        } finally {
            loadingSpinner.style.display = 'none';
        }
    }

    async fetchOverviewData() {
        const response = await fetch(`/api/admin/analytics/overview?range=${this.currentDateRange}`);
        if (!response.ok) throw new Error('Failed to fetch overview data');
        return response.json();
    }

    async fetchTrafficData() {
        const response = await fetch(`/api/admin/analytics/traffic?range=${this.currentDateRange}`);
        if (!response.ok) throw new Error('Failed to fetch traffic data');
        return response.json();
    }

    async fetchContentData() {
        const response = await fetch(`/api/admin/analytics/content?range=${this.currentDateRange}`);
        if (!response.ok) throw new Error('Failed to fetch content data');
        return response.json();
    }

    async fetchUserBehaviorData() {
        const response = await fetch(`/api/admin/analytics/user-behavior?range=${this.currentDateRange}`);
        if (!response.ok) throw new Error('Failed to fetch user behavior data');
        return response.json();
    }

    updateOverviewCards(data) {
        // Update key metrics cards
        this.updateMetricCard('total-visitors', data.totalVisitors, data.visitorsChange);
        this.updateMetricCard('page-views', data.pageViews, data.pageViewsChange);
        this.updateMetricCard('bounce-rate', data.bounceRate, data.bounceRateChange, '%');
        this.updateMetricCard('avg-session', data.averageSession, data.sessionChange, 'min');
        this.updateMetricCard('conversion-rate', data.conversionRate, data.conversionChange, '%');
        this.updateMetricCard('book-sales', data.bookSales, data.salesChange);
        this.updateMetricCard('newsletter-subs', data.newsletterSubs, data.subsChange);
        this.updateMetricCard('revenue', data.revenue, data.revenueChange, '$');
    }

    updateMetricCard(cardId, value, change, suffix = '') {
        const card = document.getElementById(cardId);
        if (!card) return;

        const valueElement = card.querySelector('.metric-value');
        const changeElement = card.querySelector('.metric-change');
        
        if (valueElement) {
            valueElement.textContent = this.formatValue(value, suffix);
        }
        
        if (changeElement && change !== undefined) {
            changeElement.textContent = `${change > 0 ? '+' : ''}${change.toFixed(1)}%`;
            changeElement.className = `metric-change ${change > 0 ? 'positive' : change < 0 ? 'negative' : 'neutral'}`;
        }
    }

    formatValue(value, suffix = '') {
        if (typeof value !== 'number') return value;
        
        if (suffix === '$') {
            return new Intl.NumberFormat('en-US', {
                style: 'currency',
                currency: 'USD',
                minimumFractionDigits: 0
            }).format(value);
        }
        
        if (value >= 1000000) {
            return (value / 1000000).toFixed(1) + 'M' + suffix;
        }
        
        if (value >= 1000) {
            return (value / 1000).toFixed(1) + 'K' + suffix;
        }
        
        return value.toLocaleString() + suffix;
    }

    initializeCharts() {
        this.initTrafficChart();
        this.initContentChart();
        this.initUserBehaviorChart();
        this.initGeographicChart();
        this.initDeviceChart();
    }

    initTrafficChart() {
        const ctx = document.getElementById('traffic-chart')?.getContext('2d');
        if (!ctx) return;

        this.charts.traffic = new Chart(ctx, {
            type: 'line',
            data: {
                labels: [],
                datasets: [{
                    label: 'Visitors',
                    data: [],
                    borderColor: '#007bff',
                    backgroundColor: 'rgba(0, 123, 255, 0.1)',
                    fill: true
                }, {
                    label: 'Page Views',
                    data: [],
                    borderColor: '#28a745',
                    backgroundColor: 'rgba(40, 167, 69, 0.1)',
                    fill: true
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback: function(value) {
                                return value.toLocaleString();
                            }
                        }
                    }
                },
                plugins: {
                    legend: {
                        display: true,
                        position: 'top'
                    },
                    tooltip: {
                        mode: 'index',
                        intersect: false
                    }
                }
            }
        });
    }

    initContentChart() {
        const ctx = document.getElementById('content-chart')?.getContext('2d');
        if (!ctx) return;

        this.charts.content = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: [],
                datasets: [{
                    label: 'Page Views',
                    data: [],
                    backgroundColor: [
                        '#007bff',
                        '#28a745',
                        '#ffc107',
                        '#dc3545',
                        '#6c757d',
                        '#17a2b8',
                        '#fd7e14',
                        '#e83e8c',
                        '#6f42c1',
                        '#20c997'
                    ]
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true
                    }
                },
                plugins: {
                    legend: {
                        display: false
                    }
                }
            }
        });
    }

    initUserBehaviorChart() {
        const ctx = document.getElementById('user-behavior-chart')?.getContext('2d');
        if (!ctx) return;

        this.charts.userBehavior = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['New Users', 'Returning Users'],
                datasets: [{
                    data: [],
                    backgroundColor: ['#007bff', '#28a745']
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom'
                    }
                }
            }
        });
    }

    initGeographicChart() {
        const ctx = document.getElementById('geographic-chart')?.getContext('2d');
        if (!ctx) return;

        this.charts.geographic = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: [],
                datasets: [{
                    label: 'Visitors by Country',
                    data: [],
                    backgroundColor: '#007bff'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                indexAxis: 'y',
                scales: {
                    x: {
                        beginAtZero: true
                    }
                },
                plugins: {
                    legend: {
                        display: false
                    }
                }
            }
        });
    }

    initDeviceChart() {
        const ctx = document.getElementById('device-chart')?.getContext('2d');
        if (!ctx) return;

        this.charts.device = new Chart(ctx, {
            type: 'pie',
            data: {
                labels: ['Desktop', 'Mobile', 'Tablet'],
                datasets: [{
                    data: [],
                    backgroundColor: ['#007bff', '#28a745', '#ffc107']
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom'
                    }
                }
            }
        });
    }

    updateTrafficChart(data) {
        if (!this.charts.traffic) return;

        const chart = this.charts.traffic;
        chart.data.labels = data.labels;
        chart.data.datasets[0].data = data.visitors;
        chart.data.datasets[1].data = data.pageViews;
        chart.update();
    }

    updateContentPerformance(data) {
        if (!this.charts.content) return;

        const chart = this.charts.content;
        chart.data.labels = data.pages.map(page => page.title);
        chart.data.datasets[0].data = data.pages.map(page => page.views);
        chart.update();

        // Update content table
        this.updateContentTable(data.pages);
    }

    updateContentTable(pages) {
        const tableBody = document.getElementById('content-table-body');
        if (!tableBody) return;

        tableBody.innerHTML = '';
        
        pages.forEach((page, index) => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${index + 1}</td>
                <td>
                    <a href="${page.url}" target="_blank">${page.title}</a>
                    <small class="text-muted d-block">${page.url}</small>
                </td>
                <td>${page.views.toLocaleString()}</td>
                <td>${page.uniqueViews.toLocaleString()}</td>
                <td>${page.averageTime}</td>
                <td>${page.bounceRate}%</td>
                <td>
                    <span class="badge ${page.trend > 0 ? 'bg-success' : page.trend < 0 ? 'bg-danger' : 'bg-secondary'}">
                        ${page.trend > 0 ? '+' : ''}${page.trend}%
                    </span>
                </td>
            `;
            tableBody.appendChild(row);
        });
    }

    updateUserBehaviorChart(data) {
        if (!this.charts.userBehavior) return;

        const chart = this.charts.userBehavior;
        chart.data.datasets[0].data = [data.newUsers, data.returningUsers];
        chart.update();

        // Update geographic chart
        if (this.charts.geographic && data.countries) {
            this.charts.geographic.data.labels = data.countries.map(c => c.name);
            this.charts.geographic.data.datasets[0].data = data.countries.map(c => c.visitors);
            this.charts.geographic.update();
        }

        // Update device chart
        if (this.charts.device && data.devices) {
            this.charts.device.data.datasets[0].data = [
                data.devices.desktop,
                data.devices.mobile,
                data.devices.tablet
            ];
            this.charts.device.update();
        }
    }

    startRealTimeUpdates() {
        if (this.refreshInterval) {
            clearInterval(this.refreshInterval);
        }

        this.refreshInterval = setInterval(() => {
            if (this.isRealTimeEnabled) {
                this.loadRealTimeData();
            }
        }, 30000); // Update every 30 seconds
    }

    stopRealTimeUpdates() {
        if (this.refreshInterval) {
            clearInterval(this.refreshInterval);
            this.refreshInterval = null;
        }
    }

    async loadRealTimeData() {
        try {
            const response = await fetch('/api/admin/analytics/realtime');
            if (!response.ok) throw new Error('Failed to fetch real-time data');
            
            const data = await response.json();
            this.updateRealTimeMetrics(data);
            
        } catch (error) {
            console.error('Error loading real-time data:', error);
        }
    }

    updateRealTimeMetrics(data) {
        // Update active users
        document.getElementById('active-users').textContent = data.activeUsers;
        
        // Update real-time activity feed
        this.updateActivityFeed(data.recentActivity);
        
        // Update live page views
        this.updateLivePageViews(data.livePageViews);
    }

    updateActivityFeed(activities) {
        const feedContainer = document.getElementById('activity-feed');
        if (!feedContainer) return;

        feedContainer.innerHTML = '';
        
        activities.forEach(activity => {
            const item = document.createElement('div');
            item.className = 'activity-item';
            item.innerHTML = `
                <div class="activity-icon">
                    <i class="fas fa-${this.getActivityIcon(activity.type)}"></i>
                </div>
                <div class="activity-content">
                    <div class="activity-text">${activity.description}</div>
                    <div class="activity-time">${this.formatRelativeTime(activity.timestamp)}</div>
                </div>
            `;
            feedContainer.appendChild(item);
        });
    }

    getActivityIcon(type) {
        const icons = {
            'page_view': 'eye',
            'download': 'download',
            'newsletter_signup': 'envelope',
            'purchase': 'shopping-cart',
            'review': 'star',
            'contact': 'message'
        };
        return icons[type] || 'circle';
    }

    formatRelativeTime(timestamp) {
        const now = new Date();
        const time = new Date(timestamp);
        const diffInSeconds = Math.floor((now - time) / 1000);
        
        if (diffInSeconds < 60) return 'Just now';
        if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
        if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
        return `${Math.floor(diffInSeconds / 86400)}d ago`;
    }

    updateLivePageViews(pageViews) {
        const container = document.getElementById('live-page-views');
        if (!container) return;

        container.innerHTML = '';
        
        pageViews.forEach(page => {
            const item = document.createElement('div');
            item.className = 'live-page-item';
            item.innerHTML = `
                <div class="page-title">${page.title}</div>
                <div class="page-views">${page.views} views</div>
            `;
            container.appendChild(item);
        });
    }

    filterTrafficSource(source) {
        // Filter traffic data by source
        this.currentTrafficSource = source;
        this.loadDashboardData();
    }

    filterContentType(type) {
        // Filter content data by type
        this.currentContentType = type;
        this.loadDashboardData();
    }

    async exportToPDF() {
        try {
            const response = await fetch('/api/admin/analytics/export/pdf', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    range: this.currentDateRange,
                    filters: {
                        trafficSource: this.currentTrafficSource,
                        contentType: this.currentContentType
                    }
                })
            });

            if (response.ok) {
                const blob = await response.blob();
                this.downloadFile(blob, 'analytics-report.pdf');
            } else {
                throw new Error('Failed to export PDF');
            }
        } catch (error) {
            console.error('Error exporting to PDF:', error);
            this.showError('Failed to export PDF report');
        }
    }

    async exportToCSV() {
        try {
            const response = await fetch('/api/admin/analytics/export/csv', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    range: this.currentDateRange,
                    filters: {
                        trafficSource: this.currentTrafficSource,
                        contentType: this.currentContentType
                    }
                })
            });

            if (response.ok) {
                const blob = await response.blob();
                this.downloadFile(blob, 'analytics-data.csv');
            } else {
                throw new Error('Failed to export CSV');
            }
        } catch (error) {
            console.error('Error exporting to CSV:', error);
            this.showError('Failed to export CSV data');
        }
    }

    async exportToJSON() {
        try {
            const response = await fetch('/api/admin/analytics/export/json', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    range: this.currentDateRange,
                    filters: {
                        trafficSource: this.currentTrafficSource,
                        contentType: this.currentContentType
                    }
                })
            });

            if (response.ok) {
                const blob = await response.blob();
                this.downloadFile(blob, 'analytics-data.json');
            } else {
                throw new Error('Failed to export JSON');
            }
        } catch (error) {
            console.error('Error exporting to JSON:', error);
            this.showError('Failed to export JSON data');
        }
    }

    downloadFile(blob, filename) {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
    }

    showError(message) {
        const notification = document.createElement('div');
        notification.className = 'notification error';
        notification.textContent = message;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.remove();
        }, 5000);
    }

    destroy() {
        // Clean up charts
        Object.values(this.charts).forEach(chart => {
            if (chart && typeof chart.destroy === 'function') {
                chart.destroy();
            }
        });
        
        // Clear intervals
        this.stopRealTimeUpdates();
    }
}

// Initialize analytics dashboard
const analyticsDashboard = new AnalyticsDashboard();

// Export for global use
window.AnalyticsDashboard = analyticsDashboard;
