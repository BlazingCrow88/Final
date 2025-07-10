/* ===================================
   BACKUP SYSTEM
   File: admin/backup-system/backup-manager.js
   =================================== */

class BackupManager {
    constructor() {
        this.backups = [];
        this.isCreatingBackup = false;
        this.isRestoringBackup = false;
        this.backupStatus = {
            lastBackup: null,
            nextScheduledBackup: null,
            autoBackupEnabled: false,
            backupFrequency: 'daily'
        };
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.loadBackupList();
        this.loadBackupSettings();
        this.setupAutoBackup();
    }

    setupEventListeners() {
        // Backup actions
        document.getElementById('create-backup-btn')?.addEventListener('click', () => this.createBackup());
        document.getElementById('schedule-backup-btn')?.addEventListener('click', () => this.scheduleBackup());
        document.getElementById('cancel-backup-btn')?.addEventListener('click', () => this.cancelBackup());

        // Settings
        document.getElementById('auto-backup-toggle')?.addEventListener('change', (e) => {
            this.toggleAutoBackup(e.target.checked);
        });

        document.getElementById('backup-frequency')?.addEventListener('change', (e) => {
            this.updateBackupFrequency(e.target.value);
        });

        document.getElementById('backup-retention')?.addEventListener('change', (e) => {
            this.updateBackupRetention(e.target.value);
        });

        // Storage settings
        document.getElementById('storage-location')?.addEventListener('change', (e) => {
            this.updateStorageLocation(e.target.value);
        });

        // Filters and search
        document.getElementById('backup-search')?.addEventListener('input', (e) => {
            this.searchBackups(e.target.value);
        });

        document.getElementById('backup-filter')?.addEventListener('change', (e) => {
            this.filterBackups(e.target.value);
        });

        // Export/Import
        document.getElementById('export-settings-btn')?.addEventListener('click', () => this.exportSettings());
        document.getElementById('import-settings-btn')?.addEventListener('click', () => this.importSettings());

        // Cleanup
        document.getElementById('cleanup-old-backups')?.addEventListener('click', () => this.cleanupOldBackups());
    }

    async loadBackupList() {
        const loadingSpinner = document.getElementById('backup-loading');
        const backupList = document.getElementById('backup-list');
        
        try {
            loadingSpinner.style.display = 'block';
            
            const response = await fetch('/api/admin/backups');
            if (!response.ok) throw new Error('Failed to load backups');
            
            const data = await response.json();
            this.backups = data.backups || [];
            
            this.renderBackupList();
            this.updateBackupStats(data.stats);
            
        } catch (error) {
            console.error('Error loading backups:', error);
            this.showError('Failed to load backup list');
        } finally {
            loadingSpinner.style.display = 'none';
        }
    }

    renderBackupList() {
        const backupList = document.getElementById('backup-list');
        if (!backupList) return;

        if (this.backups.length === 0) {
            backupList.innerHTML = '<div class="no-backups">No backups found. <button onclick="backupManager.createBackup()">Create your first backup</button></div>';
            return;
        }

        const html = this.backups.map(backup => this.renderBackupItem(backup)).join('');
        backupList.innerHTML = html;
        
        this.attachBackupListeners();
    }

    renderBackupItem(backup) {
        const statusClass = this.getStatusClass(backup.status);
        const statusText = this.getStatusText(backup.status);
        
        return `
            <div class="backup-item ${statusClass}" data-id="${backup.id}">
                <div class="backup-info">
                    <div class="backup-header">
                        <h4 class="backup-name">${backup.name}</h4>
                        <span class="backup-status ${statusClass}">${statusText}</span>
                    </div>
                    <div class="backup-meta">
                        <span class="backup-date">Created: ${this.formatDate(backup.createdAt)}</span>
                        <span class="backup-size">Size: ${this.formatSize(backup.size)}</span>
                        <span class="backup-type">Type: ${backup.type}</span>
                    </div>
                    <div class="backup-description">
                        <p>${backup.description || 'No description'}</p>
                    </div>
                    ${backup.components ? this.renderBackupComponents(backup.components) : ''}
                </div>
                <div class="backup-actions">
                    <button class="btn btn-sm btn-primary restore-btn" data-id="${backup.id}" ${backup.status !== 'completed' ? 'disabled' : ''}>
                        Restore
                    </button>
                    <button class="btn btn-sm btn-secondary download-btn" data-id="${backup.id}" ${backup.status !== 'completed' ? 'disabled' : ''}>
                        Download
                    </button>
                    <button class="btn btn-sm btn-outline verify-btn" data-id="${backup.id}">
                        Verify
                    </button>
                    <button class="btn btn-sm btn-danger delete-btn" data-id="${backup.id}">
                        Delete
                    </button>
                </div>
                ${backup.status === 'in-progress' ? this.renderProgressBar(backup.progress) : ''}
            </div>
        `;
    }

    renderBackupComponents(components) {
        const componentList = components.map(comp => `
            <span class="backup-component ${comp.status}">${comp.name}</span>
        `).join('');
        
        return `<div class="backup-components">${componentList}</div>`;
    }

    renderProgressBar(progress) {
        return `
            <div class="backup-progress">
                <div class="progress-bar">
                    <div class="progress-fill" style="width: ${progress.percentage}%"></div>
                </div>
                <div class="progress-text">
                    ${progress.currentStep} - ${progress.percentage}%
                </div>
            </div>
        `;
    }

    getStatusClass(status) {
        const classes = {
            'completed': 'success',
            'in-progress': 'warning',
            'failed': 'danger',
            'cancelled': 'secondary'
        };
        return classes[status] || 'secondary';
    }

    getStatusText(status) {
        const texts = {
            'completed': 'Completed',
            'in-progress': 'In Progress',
            'failed': 'Failed',
            'cancelled': 'Cancelled'
        };
        return texts[status] || 'Unknown';
    }

    attachBackupListeners() {
        // Restore buttons
        document.querySelectorAll('.restore-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = e.target.dataset.id;
                this.restoreBackup(id);
            });
        });

        // Download buttons
        document.querySelectorAll('.download-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = e.target.dataset.id;
                this.downloadBackup(id);
            });
        });

        // Verify buttons
        document.querySelectorAll('.verify-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = e.target.dataset.id;
                this.verifyBackup(id);
            });
        });

        // Delete buttons
        document.querySelectorAll('.delete-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = e.target.dataset.id;
                this.deleteBackup(id);
            });
        });
    }

    async createBackup() {
        if (this.isCreatingBackup) return;

        const backupForm = document.getElementById('backup-form');
        const formData = new FormData(backupForm);
        
        // Validate form
        if (!this.validateBackupForm(formData)) {
            return;
        }

        try {
            this.isCreatingBackup = true;
            this.updateBackupUI(true);
            
            const backupData = {
                name: formData.get('backup-name') || `Backup ${new Date().toISOString().split('T')[0]}`,
                description: formData.get('backup-description') || '',
                type: formData.get('backup-type') || 'full',
                components: this.getSelectedComponents(formData),
                compress: formData.get('compress') === 'on',
                encrypt: formData.get('encrypt') === 'on'
            };

            const response = await fetch('/api/admin/backups', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(backupData)
            });

            if (!response.ok) throw new Error('Failed to create backup');
            
            const result = await response.json();
            
            this.showSuccess('Backup creation started successfully');
            this.trackBackupProgress(result.backupId);
            
        } catch (error) {
            console.error('Error creating backup:', error);
            this.showError('Failed to create backup');
        } finally {
            this.isCreatingBackup = false;
            this.updateBackupUI(false);
        }
    }

    getSelectedComponents(formData) {
        const components = [];
        const checkboxes = document.querySelectorAll('input[name="backup-components"]:checked');
        
        checkboxes.forEach(checkbox => {
            components.push(checkbox.value);
        });
        
        return components;
    }

    validateBackupForm(formData) {
        const name = formData.get('backup-name');
        const components = this.getSelectedComponents(formData);
        
        if (!name || name.trim().length === 0) {
            this.showError('Please provide a backup name');
            return false;
        }
        
        if (components.length === 0) {
            this.showError('Please select at least one component to backup');
            return false;
        }
        
        return true;
    }

    async trackBackupProgress(backupId) {
        const pollInterval = setInterval(async () => {
            try {
                const response = await fetch(`/api/admin/backups/${backupId}/progress`);
                if (!response.ok) throw new Error('Failed to get backup progress');
                
                const progress = await response.json();
                this.updateBackupProgress(backupId, progress);
                
                if (progress.status === 'completed' || progress.status === 'failed') {
                    clearInterval(pollInterval);
                    this.loadBackupList();
                }
                
            } catch (error) {
                console.error('Error tracking backup progress:', error);
                clearInterval(pollInterval);
            }
        }, 2000);
    }

    updateBackupProgress(backupId, progress) {
        const backupItem = document.querySelector(`[data-id="${backupId}"]`);
        if (!backupItem) return;

        const progressBar = backupItem.querySelector('.progress-fill');
        const progressText = backupItem.querySelector('.progress-text');
        
        if (progressBar) {
            progressBar.style.width = `${progress.percentage}%`;
        }
        
        if (progressText) {
            progressText.textContent = `${progress.currentStep} - ${progress.percentage}%`;
        }
    }

    async restoreBackup(backupId) {
        if (this.isRestoringBackup) return;

        if (!confirm('Are you sure you want to restore this backup? This will overwrite current data.')) {
            return;
        }

        try {
            this.isRestoringBackup = true;
            this.showLoading('Restoring backup...');
            
            const response = await fetch(`/api/admin/backups/${backupId}/restore`, {
                method: 'POST'
            });

            if (!response.ok) throw new Error('Failed to restore backup');
            
            const result = await response.json();
            
            this.showSuccess('Backup restoration completed successfully');
            this.trackRestoreProgress(result.restoreId);
            
        } catch (error) {
            console.error('Error restoring backup:', error);
            this.showError('Failed to restore backup');
        } finally {
            this.isRestoringBackup = false;
            this.hideLoading();
        }
    }

    async downloadBackup(backupId) {
        try {
            const response = await fetch(`/api/admin/backups/${backupId}/download`);
            if (!response.ok) throw new Error('Failed to download backup');
            
            const blob = await response.blob();
            const backup = this.backups.find(b => b.id === backupId);
            const filename = `${backup.name}.zip`;
            
            this.downloadFile(blob, filename);
            
        } catch (error) {
            console.error('Error downloading backup:', error);
            this.showError('Failed to download backup');
        }
    }

    async verifyBackup(backupId) {
        try {
            this.showLoading('Verifying backup...');
            
            const response = await fetch(`/api/admin/backups/${backupId}/verify`, {
                method: 'POST'
            });

            if (!response.ok) throw new Error('Failed to verify backup');
            
            const result = await response.json();
            
            if (result.isValid) {
                this.showSuccess('Backup verification completed successfully');
            } else {
                this.showError(`Backup verification failed: ${result.errors.join(', ')}`);
            }
            
        } catch (error) {
            console.error('Error verifying backup:', error);
            this.showError('Failed to verify backup');
        } finally {
            this.hideLoading();
        }
    }

    async deleteBackup(backupId) {
        if (!confirm('Are you sure you want to delete this backup? This action cannot be undone.')) {
            return;
        }

        try {
            const response = await fetch(`/api/admin/backups/${backupId}`, {
                method: 'DELETE'
            });

            if (!response.ok) throw new Error('Failed to delete backup');
            
            this.showSuccess('Backup deleted successfully');
            this.loadBackupList();
            
        } catch (error) {
            console.error('Error deleting backup:', error);
            this.showError('Failed to delete backup');
        }
    }

    async loadBackupSettings() {
        try {
            const response = await fetch('/api/admin/backups/settings');
            if (!response.ok) throw new Error('Failed to load settings');
            
            const settings = await response.json();
            this.populateSettings(settings);
            
        } catch (error) {
            console.error('Error loading backup settings:', error);
            this.showError('Failed to load backup settings');
        }
    }

    populateSettings(settings) {
        document.getElementById('auto-backup-toggle').checked = settings.autoBackupEnabled;
        document.getElementById('backup-frequency').value = settings.backupFrequency;
        document.getElementById('backup-retention').value = settings.retentionDays;
        document.getElementById('storage-location').value = settings.storageLocation;
        document.getElementById('max-backup-size').value = settings.maxBackupSize;
        document.getElementById('compression-level').value = settings.compressionLevel;
        
        this.backupStatus = settings.status;
        this.updateStatusDisplay();
    }

    updateStatusDisplay() {
        document.getElementById('last-backup-date').textContent = 
            this.backupStatus.lastBackup ? this.formatDate(this.backupStatus.lastBackup) : 'Never';
        
        document.getElementById('next-backup-date').textContent = 
            this.backupStatus.nextScheduledBackup ? this.formatDate(this.backupStatus.nextScheduledBackup) : 'Not scheduled';
    }

    async toggleAutoBackup(enabled) {
        try {
            const response = await fetch('/api/admin/backups/settings', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    autoBackupEnabled: enabled
                })
            });

            if (!response.ok) throw new Error('Failed to update auto backup setting');
            
            this.showSuccess(`Auto backup ${enabled ? 'enabled' : 'disabled'}`);
            
        } catch (error) {
            console.error('Error updating auto backup:', error);
            this.showError('Failed to update auto backup setting');
        }
    }

    async updateBackupFrequency(frequency) {
        try {
            const response = await fetch('/api/admin/backups/settings', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    backupFrequency: frequency
                })
            });

            if (!response.ok) throw new Error('Failed to update backup frequency');
            
            this.showSuccess('Backup frequency updated');
            
        } catch (error) {
            console.error('Error updating backup frequency:', error);
            this.showError('Failed to update backup frequency');
        }
    }

    searchBackups(query) {
        const items = document.querySelectorAll('.backup-item');
        
        items.forEach(item => {
            const name = item.querySelector('.backup-name').textContent.toLowerCase();
            const description = item.querySelector('.backup-description').textContent.toLowerCase();
            
            const matches = name.includes(query.toLowerCase()) || 
                          description.includes(query.toLowerCase());
            
            item.style.display = matches ? 'block' : 'none';
        });
    }

    filterBackups(filter) {
        const items = document.querySelectorAll('.backup-item');
        
        items.forEach(item => {
            const status = item.querySelector('.backup-status').textContent.toLowerCase();
            
            if (filter === 'all' || status.includes(filter)) {
                item.style.display = 'block';
            } else {
                item.style.display = 'none';
            }
        });
    }

    setupAutoBackup() {
        // Setup automatic backup checking
        setInterval(() => {
            this.checkScheduledBackups();
        }, 60000); // Check every minute
    }

    async checkScheduledBackups() {
        try {
            const response = await fetch('/api/admin/backups/scheduled');
            if (!response.ok) return;
            
            const scheduled = await response.json();
            if (scheduled.shouldRunBackup) {
                this.runScheduledBackup();
            }
            
        } catch (error) {
            console.error('Error checking scheduled backups:', error);
        }
    }

    async runScheduledBackup() {
        try {
            const response = await fetch('/api/admin/backups/scheduled', {
                method: 'POST'
            });

            if (response.ok) {
                this.showSuccess('Scheduled backup started');
                this.loadBackupList();
            }
            
        } catch (error) {
            console.error('Error running scheduled backup:', error);
        }
    }

    updateBackupUI(isCreating) {
        const createBtn = document.getElementById('create-backup-btn');
        const cancelBtn = document.getElementById('cancel-backup-btn');
        
        if (createBtn) {
            createBtn.disabled = isCreating;
            createBtn.textContent = isCreating ? 'Creating...' : 'Create Backup';
        }
        
        if (cancelBtn) {
            cancelBtn.style.display = isCreating ? 'inline-block' : 'none';
        }
    }

    updateBackupStats(stats) {
        document.getElementById('total-backups').textContent = stats.total || 0;
        document.getElementById('successful-backups').textContent = stats.successful || 0;
        document.getElementById('failed-backups').textContent = stats.failed || 0;
        document.getElementById('total-backup-size').textContent = this.formatSize(stats.totalSize || 0);
    }

    formatDate(dateString) {
        return new Date(dateString).toLocaleString();
    }

    formatSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
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

    showLoading(message) {
        const loader = document.getElementById('global-loader');
        if (loader) {
            loader.style.display = 'block';
            loader.querySelector('.loader-text').textContent = message;
        }
    }

    hideLoading() {
        const loader = document.getElementById('global-loader');
        if (loader) {
            loader.style.display = 'none';
        }
    }

    showSuccess(message) {
        this.showNotification(message, 'success');
    }

    showError(message) {
        this.showNotification(message, 'error');
    }

    showNotification(message, type) {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.remove();
        }, 5000);
    }
}

// Initialize backup manager
const backupManager = new BackupManager();

// Export for global use
window.BackupManager = backupManager;
