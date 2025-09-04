class ExportHistoryService {
  constructor() {
    this.storageKey = 'lms_export_history';
    this.maxHistoryItems = 50;
  }

  // Get export history
  getExportHistory() {
    try {
      const history = localStorage.getItem(this.storageKey);
      return history ? JSON.parse(history) : [];
    } catch (error) {
      console.error('Error loading export history:', error);
      return [];
    }
  }

  // Add export to history
  addExportToHistory(exportData) {
    try {
      const history = this.getExportHistory();
      const newExport = {
        id: Date.now().toString(),
        timestamp: new Date().toISOString(),
        filename: exportData.filename,
        type: exportData.type,
        assessmentName: exportData.assessmentName,
        collegeName: exportData.collegeName,
        recordCount: exportData.recordCount,
        fileSize: exportData.fileSize,
        settings: exportData.settings
      };

      // Add to beginning of array
      history.unshift(newExport);

      // Keep only the latest items
      if (history.length > this.maxHistoryItems) {
        history.splice(this.maxHistoryItems);
      }

      localStorage.setItem(this.storageKey, JSON.stringify(history));
      return newExport;
    } catch (error) {
      console.error('Error saving export history:', error);
      return null;
    }
  }

  // Remove export from history
  removeExportFromHistory(exportId) {
    try {
      const history = this.getExportHistory();
      const filteredHistory = history.filter(exportItem => exportItem.id !== exportId);
      localStorage.setItem(this.storageKey, JSON.stringify(filteredHistory));
      return true;
    } catch (error) {
      console.error('Error removing export from history:', error);
      return false;
    }
  }

  // Clear all export history
  clearExportHistory() {
    try {
      localStorage.removeItem(this.storageKey);
      return true;
    } catch (error) {
      console.error('Error clearing export history:', error);
      return false;
    }
  }

  // Get export templates
  getExportTemplates() {
    try {
      const templates = localStorage.getItem('lms_export_templates');
      return templates ? JSON.parse(templates) : [];
    } catch (error) {
      console.error('Error loading export templates:', error);
      return [];
    }
  }

  // Save export template
  saveExportTemplate(templateData) {
    try {
      const templates = this.getExportTemplates();
      const newTemplate = {
        id: Date.now().toString(),
        name: templateData.name,
        description: templateData.description,
        timestamp: new Date().toISOString(),
        columns: templateData.columns,
        filters: templateData.filters,
        settings: templateData.settings
      };

      templates.push(newTemplate);
      localStorage.setItem('lms_export_templates', JSON.stringify(templates));
      return newTemplate;
    } catch (error) {
      console.error('Error saving export template:', error);
      return null;
    }
  }

  // Load export template
  loadExportTemplate(templateId) {
    try {
      const templates = this.getExportTemplates();
      return templates.find(template => template.id === templateId) || null;
    } catch (error) {
      console.error('Error loading export template:', error);
      return null;
    }
  }

  // Delete export template
  deleteExportTemplate(templateId) {
    try {
      const templates = this.getExportTemplates();
      const filteredTemplates = templates.filter(template => template.id !== templateId);
      localStorage.setItem('lms_export_templates', JSON.stringify(filteredTemplates));
      return true;
    } catch (error) {
      console.error('Error deleting export template:', error);
      return false;
    }
  }

  // Get export statistics
  getExportStatistics() {
    try {
      const history = this.getExportHistory();
      const templates = this.getExportTemplates();

      const stats = {
        totalExports: history.length,
        totalTemplates: templates.length,
        exportsByType: {},
        exportsByMonth: {},
        totalRecordsExported: 0,
        averageFileSize: 0
      };

      // Calculate statistics
      history.forEach(exportItem => {
        // By type
        stats.exportsByType[exportItem.type] = (stats.exportsByType[exportItem.type] || 0) + 1;
        
        // By month
        const month = new Date(exportItem.timestamp).toISOString().slice(0, 7);
        stats.exportsByMonth[month] = (stats.exportsByMonth[month] || 0) + 1;
        
        // Total records
        stats.totalRecordsExported += exportItem.recordCount || 0;
        
        // File size
        stats.averageFileSize += exportItem.fileSize || 0;
      });

      // Calculate average file size
      if (history.length > 0) {
        stats.averageFileSize = Math.round(stats.averageFileSize / history.length);
      }

      return stats;
    } catch (error) {
      console.error('Error calculating export statistics:', error);
      return {
        totalExports: 0,
        totalTemplates: 0,
        exportsByType: {},
        exportsByMonth: {},
        totalRecordsExported: 0,
        averageFileSize: 0
      };
    }
  }

  // Format file size
  formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  // Format timestamp
  formatTimestamp(timestamp) {
    return new Date(timestamp).toLocaleString();
  }
}

export default new ExportHistoryService();
