import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { Alert, AlertDescription } from './ui/alert';
import { 
    Filter, 
    Download,
    FileText,
    FileSpreadsheet,
    File,
    BarChart3,
    PieChart,
    LineChart,
    Users,
    BookOpen,
    Award,
    Clock,
    Target,
    TrendingUp,
    RefreshCw,
    Calendar,
    Settings,
    Eye,
    Zap,
    Database,
    Cloud,
    HardDrive,
    CheckCircle,
    XCircle,
    AlertTriangle,
    Lightbulb,
    Search,
    Sliders,
    Layers,
    Grid,
    List,
    Columns,
    SortAsc,
    SortDesc,
    MoreHorizontal,
    Save,
    Share,
    Mail,
    Printer
} from 'lucide-react';
import { toast } from 'react-hot-toast';

const AdvancedFilteringExport = ({ 
    onAdvancedFilteringExportViewed,
    showAdvancedFilters = true,
    showExportFormats = true,
    showCustomReports = true,
    showScheduledExports = true
}) => {
    const [advancedFiltering, setAdvancedFiltering] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedFilters, setSelectedFilters] = useState({});
    const [exportFormats, setExportFormats] = useState([]);
    const [customReports, setCustomReports] = useState([]);
    const [scheduledExports, setScheduledExports] = useState([]);
    const [filterPresets, setFilterPresets] = useState([]);

    useEffect(() => {
        loadAdvancedFilteringExport();
    }, []);

    const loadAdvancedFilteringExport = async () => {
        try {
            setIsLoading(true);
            
            const response = await fetch('/api/analytics/advanced-filtering-export', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    showAdvancedFilters,
                    showExportFormats,
                    showCustomReports,
                    showScheduledExports
                })
            });

            if (!response.ok) throw new Error('Failed to load advanced filtering export');
            
            const data = await response.json();
            setAdvancedFiltering(data.advancedFiltering);
            setExportFormats(data.exportFormats || []);
            setCustomReports(data.customReports || []);
            setScheduledExports(data.scheduledExports || []);
            setFilterPresets(data.filterPresets || []);
            
            if (onAdvancedFilteringExportViewed) {
                onAdvancedFilteringExportViewed(data);
            }
            
        } catch (error) {
            console.error('Error loading advanced filtering export:', error);
            toast.error('Failed to load advanced filtering export');
        } finally {
            setIsLoading(false);
        }
    };

    const getFilterIcon = (type) => {
        switch (type) {
            case 'assessment':
                return <BookOpen className="w-4 h-4" />;
            case 'batch':
                return <Users className="w-4 h-4" />;
            case 'department':
                return <Database className="w-4 h-4" />;
            case 'college':
                return <Award className="w-4 h-4" />;
            case 'date':
                return <Calendar className="w-4 h-4" />;
            case 'performance':
                return <TrendingUp className="w-4 h-4" />;
            case 'status':
                return <CheckCircle className="w-4 h-4" />;
            default:
                return <Filter className="w-4 h-4" />;
        }
    };

    const getFormatIcon = (format) => {
        switch (format) {
            case 'excel':
                return <FileSpreadsheet className="w-6 h-6 text-green-600" />;
            case 'pdf':
                return <FileText className="w-6 h-6 text-red-600" />;
            case 'csv':
                return <File className="w-6 h-6 text-blue-600" />;
            case 'dashboard':
                return <BarChart3 className="w-6 h-6 text-purple-600" />;
            default:
                return <File className="w-6 h-6 text-gray-600" />;
        }
    };

    const getFormatBadge = (format) => {
        switch (format) {
            case 'excel':
                return 'bg-green-100 text-green-800';
            case 'pdf':
                return 'bg-red-100 text-red-800';
            case 'csv':
                return 'bg-blue-100 text-blue-800';
            case 'dashboard':
                return 'bg-purple-100 text-purple-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const formatFileSize = (bytes) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    const downloadAdvancedExport = async (format, filters) => {
        try {
            const response = await fetch('/api/analytics/download-advanced-export', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    format,
                    filters
                })
            });

            if (!response.ok) throw new Error('Download failed');
            
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `advanced_export_${format}_${Date.now()}.${format}`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
            
            toast.success(`${format.toUpperCase()} download started`);
        } catch (error) {
            console.error('Download error:', error);
            toast.error('Download failed');
        }
    };

    const saveFilterPreset = async (presetName, filters) => {
        try {
            const response = await fetch('/api/analytics/save-filter-preset', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    presetName,
                    filters
                })
            });

            if (!response.ok) throw new Error('Save failed');
            
            toast.success('Filter preset saved successfully');
            loadAdvancedFilteringExport();
        } catch (error) {
            console.error('Save error:', error);
            toast.error('Save failed');
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    if (!advancedFiltering) {
        return (
            <div className="text-center py-8">
                <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                <p className="text-gray-500">No advanced filtering export data available</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="text-center">
                <h2 className="text-3xl font-bold text-gray-900">Advanced Filtering & Export</h2>
                <p className="text-gray-600 mt-2">Advanced filtering options and comprehensive export features</p>
            </div>

            {/* Advanced Filters */}
            {showAdvancedFilters && (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center space-x-2">
                            <Sliders className="w-5 h-5" />
                            <span>Advanced Filters</span>
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {/* Assessment Filter */}
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-700">Assessment</label>
                                <select
                                    value={selectedFilters.assessment || ''}
                                    onChange={(e) => setSelectedFilters({...selectedFilters, assessment: e.target.value})}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                >
                                    <option value="">All Assessments</option>
                                    {advancedFiltering.assessments && advancedFiltering.assessments.map((assessment, index) => (
                                        <option key={index} value={assessment.id}>{assessment.name}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Batch Filter */}
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-700">Batch</label>
                                <select
                                    value={selectedFilters.batch || ''}
                                    onChange={(e) => setSelectedFilters({...selectedFilters, batch: e.target.value})}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                >
                                    <option value="">All Batches</option>
                                    {advancedFiltering.batches && advancedFiltering.batches.map((batch, index) => (
                                        <option key={index} value={batch.id}>{batch.name}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Department Filter */}
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-700">Department</label>
                                <select
                                    value={selectedFilters.department || ''}
                                    onChange={(e) => setSelectedFilters({...selectedFilters, department: e.target.value})}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                >
                                    <option value="">All Departments</option>
                                    {advancedFiltering.departments && advancedFiltering.departments.map((department, index) => (
                                        <option key={index} value={department.id}>{department.name}</option>
                                    ))}
                                </select>
                            </div>

                            {/* College Filter */}
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-700">College</label>
                                <select
                                    value={selectedFilters.college || ''}
                                    onChange={(e) => setSelectedFilters({...selectedFilters, college: e.target.value})}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                >
                                    <option value="">All Colleges</option>
                                    {advancedFiltering.colleges && advancedFiltering.colleges.map((college, index) => (
                                        <option key={index} value={college.id}>{college.name}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Date Range Filter */}
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-700">Date Range</label>
                                <div className="flex space-x-2">
                                    <input
                                        type="date"
                                        value={selectedFilters.startDate || ''}
                                        onChange={(e) => setSelectedFilters({...selectedFilters, startDate: e.target.value})}
                                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    />
                                    <input
                                        type="date"
                                        value={selectedFilters.endDate || ''}
                                        onChange={(e) => setSelectedFilters({...selectedFilters, endDate: e.target.value})}
                                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    />
                                </div>
                            </div>

                            {/* Performance Filter */}
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-700">Performance Range</label>
                                <div className="flex space-x-2">
                                    <input
                                        type="number"
                                        placeholder="Min %"
                                        value={selectedFilters.minPerformance || ''}
                                        onChange={(e) => setSelectedFilters({...selectedFilters, minPerformance: e.target.value})}
                                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    />
                                    <input
                                        type="number"
                                        placeholder="Max %"
                                        value={selectedFilters.maxPerformance || ''}
                                        onChange={(e) => setSelectedFilters({...selectedFilters, maxPerformance: e.target.value})}
                                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    />
                                </div>
                            </div>

                            {/* Status Filter */}
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-700">Status</label>
                                <select
                                    value={selectedFilters.status || ''}
                                    onChange={(e) => setSelectedFilters({...selectedFilters, status: e.target.value})}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                >
                                    <option value="">All Statuses</option>
                                    <option value="completed">Completed</option>
                                    <option value="in-progress">In Progress</option>
                                    <option value="not-started">Not Started</option>
                                    <option value="abandoned">Abandoned</option>
                                </select>
                            </div>
                        </div>

                        {/* Filter Actions */}
                        <div className="flex justify-between items-center mt-6">
                            <div className="flex space-x-2">
                                <Button 
                                    onClick={() => setSelectedFilters({})}
                                    variant="outline"
                                    size="sm"
                                >
                                    <RefreshCw className="w-4 h-4 mr-2" />
                                    Clear All
                                </Button>
                                
                                <Button 
                                    onClick={() => saveFilterPreset('Custom Preset', selectedFilters)}
                                    variant="outline"
                                    size="sm"
                                >
                                    <Save className="w-4 h-4 mr-2" />
                                    Save Preset
                                </Button>
                            </div>
                            
                            <div className="text-sm text-gray-600">
                                {Object.keys(selectedFilters).filter(key => selectedFilters[key]).length} filters active
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Filter Presets */}
            {filterPresets.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center space-x-2">
                            <Layers className="w-5 h-5" />
                            <span>Filter Presets</span>
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {filterPresets.map((preset, index) => (
                                <div key={index} className="p-4 border rounded-lg hover:bg-gray-50">
                                    <div className="flex items-center justify-between mb-2">
                                        <h4 className="font-medium text-gray-900">{preset.name}</h4>
                                        <Badge className="bg-blue-100 text-blue-800">
                                            {preset.filters.length} filters
                                        </Badge>
                                    </div>
                                    
                                    <p className="text-sm text-gray-600 mb-3">{preset.description}</p>
                                    
                                    <div className="flex space-x-2">
                                        <Button 
                                            onClick={() => setSelectedFilters(preset.filters)}
                                            variant="outline"
                                            size="sm"
                                        >
                                            <Eye className="w-4 h-4 mr-2" />
                                            Apply
                                        </Button>
                                        
                                        <Button 
                                            onClick={() => downloadAdvancedExport('excel', preset.filters)}
                                            variant="outline"
                                            size="sm"
                                        >
                                            <Download className="w-4 h-4 mr-2" />
                                            Export
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Export Formats */}
            {showExportFormats && exportFormats.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center space-x-2">
                            <Download className="w-5 h-5" />
                            <span>Export Formats</span>
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            {exportFormats.map((format, index) => (
                                <div key={index} className="p-4 border rounded-lg text-center">
                                    <div className="flex justify-center mb-3">
                                        {getFormatIcon(format.type)}
                                    </div>
                                    
                                    <h4 className="font-medium text-gray-900 mb-2">{format.name}</h4>
                                    <p className="text-sm text-gray-600 mb-3">{format.description}</p>
                                    
                                    <div className="space-y-2">
                                        <Button 
                                            onClick={() => downloadAdvancedExport(format.type, selectedFilters)}
                                            variant="outline"
                                            size="sm"
                                            className="w-full"
                                        >
                                            <Download className="w-4 h-4 mr-2" />
                                            Export {format.type.toUpperCase()}
                                        </Button>
                                        
                                        <Badge className={getFormatBadge(format.type)}>
                                            {format.type.toUpperCase()}
                                        </Badge>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Custom Reports */}
            {showCustomReports && customReports.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center space-x-2">
                            <FileText className="w-5 h-5" />
                            <span>Custom Reports</span>
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {customReports.map((report, index) => (
                                <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                                    <div className="flex items-center space-x-4">
                                        <FileText className="w-6 h-6 text-blue-600" />
                                        <div>
                                            <h4 className="font-medium text-gray-900">{report.name}</h4>
                                            <p className="text-sm text-gray-600">{report.description}</p>
                                        </div>
                                    </div>
                                    
                                    <div className="flex items-center space-x-2">
                                        <Badge className="bg-blue-100 text-blue-800">
                                            {report.type}
                                        </Badge>
                                        
                                        <Button 
                                            onClick={() => downloadAdvancedExport(report.format, selectedFilters)}
                                            variant="outline"
                                            size="sm"
                                        >
                                            <Download className="w-4 h-4 mr-2" />
                                            Generate
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Scheduled Exports */}
            {showScheduledExports && scheduledExports.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center space-x-2">
                            <Clock className="w-5 h-5" />
                            <span>Scheduled Exports</span>
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {scheduledExports.map((exportItem, index) => (
                                <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                                    <div className="flex items-center space-x-4">
                                        <Clock className="w-6 h-6 text-purple-600" />
                                        <div>
                                            <h4 className="font-medium text-gray-900">{exportItem.name}</h4>
                                            <p className="text-sm text-gray-600">
                                                {exportItem.schedule} • {exportItem.format.toUpperCase()}
                                            </p>
                                        </div>
                                    </div>
                                    
                                    <div className="flex items-center space-x-2">
                                        <Badge className={
                                            exportItem.status === 'active' ? 'bg-green-100 text-green-800' :
                                            exportItem.status === 'paused' ? 'bg-yellow-100 text-yellow-800' :
                                            'bg-red-100 text-red-800'
                                        }>
                                            {exportItem.status}
                                        </Badge>
                                        
                                        <Button 
                                            onClick={() => downloadAdvancedExport(exportItem.format, exportItem.filters)}
                                            variant="outline"
                                            size="sm"
                                        >
                                            <Download className="w-4 h-4 mr-2" />
                                            Run Now
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Actions */}
            <div className="flex justify-center space-x-4">
                <Button 
                    onClick={() => downloadAdvancedExport('excel', selectedFilters)}
                    variant="outline"
                >
                    <Download className="w-4 h-4 mr-2" />
                    Export Excel
                </Button>
                
                <Button 
                    onClick={() => downloadAdvancedExport('pdf', selectedFilters)}
                    variant="outline"
                >
                    <Download className="w-4 h-4 mr-2" />
                    Export PDF
                </Button>
                
                <Button 
                    onClick={() => downloadAdvancedExport('csv', selectedFilters)}
                    variant="outline"
                >
                    <Download className="w-4 h-4 mr-2" />
                    Export CSV
                </Button>
                
                <Button 
                    onClick={loadAdvancedFilteringExport}
                    variant="outline"
                >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Refresh
                </Button>
            </div>
        </div>
    );
};

export default AdvancedFilteringExport;
