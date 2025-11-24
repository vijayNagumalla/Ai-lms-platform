// MEDIUM PRIORITY FIX: Server-side export progress tracking
// This enables accurate progress reporting for long-running export operations

class ExportProgressService {
    constructor() {
        // In-memory progress storage (can be upgraded to Redis for production)
        this.progressStore = new Map();
        // Cleanup old progress entries after 1 hour
        this.cleanupInterval = setInterval(() => this.cleanup(), 60 * 60 * 1000);
    }
    
    // Create a new progress tracker
    createProgress(exportId, totalSteps = 100) {
        this.progressStore.set(exportId, {
            exportId,
            totalSteps,
            currentStep: 0,
            percentage: 0,
            status: 'processing', // processing, completed, failed
            message: 'Initializing export...',
            startTime: Date.now(),
            lastUpdate: Date.now()
        });
        return exportId;
    }
    
    // Update progress
    updateProgress(exportId, currentStep, message = null) {
        const progress = this.progressStore.get(exportId);
        if (!progress) return false;
        
        progress.currentStep = currentStep;
        progress.percentage = Math.min(Math.round((currentStep / progress.totalSteps) * 100), 100);
        if (message) progress.message = message;
        progress.lastUpdate = Date.now();
        
        return true;
    }
    
    // Get progress
    getProgress(exportId) {
        const progress = this.progressStore.get(exportId);
        if (!progress) {
            return {
                exportId,
                status: 'not_found',
                percentage: 0,
                message: 'Export not found'
            };
        }
        
        return {
            exportId: progress.exportId,
            percentage: progress.percentage,
            status: progress.status,
            message: progress.message,
            currentStep: progress.currentStep,
            totalSteps: progress.totalSteps,
            elapsedTime: Date.now() - progress.startTime
        };
    }
    
    // Mark as completed
    completeProgress(exportId, message = 'Export completed successfully') {
        const progress = this.progressStore.get(exportId);
        if (!progress) return false;
        
        progress.status = 'completed';
        progress.percentage = 100;
        progress.message = message;
        progress.lastUpdate = Date.now();
        
        // Auto-cleanup after 5 minutes
        setTimeout(() => this.progressStore.delete(exportId), 5 * 60 * 1000);
        
        return true;
    }
    
    // Mark as failed
    failProgress(exportId, errorMessage = 'Export failed') {
        const progress = this.progressStore.get(exportId);
        if (!progress) return false;
        
        progress.status = 'failed';
        progress.message = errorMessage;
        progress.lastUpdate = Date.now();
        
        // Auto-cleanup after 5 minutes
        setTimeout(() => this.progressStore.delete(exportId), 5 * 60 * 1000);
        
        return true;
    }
    
    // Cleanup old entries
    cleanup() {
        const oneHourAgo = Date.now() - (60 * 60 * 1000);
        for (const [exportId, progress] of this.progressStore.entries()) {
            if (progress.lastUpdate < oneHourAgo && progress.status !== 'processing') {
                this.progressStore.delete(exportId);
            }
        }
    }
    
    // Cleanup on service shutdown
    destroy() {
        if (this.cleanupInterval) {
            clearInterval(this.cleanupInterval);
        }
        this.progressStore.clear();
    }
}

export default new ExportProgressService();

