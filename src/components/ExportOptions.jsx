import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { Alert, AlertDescription } from './ui/alert';
import { 
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
    Filter,
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
    Lightbulb
} from 'lucide-react';
import { toast } from 'react-hot-toast';

const ExportOptions = ({ 
    onExportOptionsViewed,
    showExcelExports = true,
    showPDFExports = true,
    showCSVExports = true,
    showDashboardExports = true
}) => {
    const [exportOptions, setExportOptions] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedFormat, setSelectedFormat] = useState('excel');
    const [selectedType, setSelectedType] = useState('comprehensive');
    const [exportHistory, setExportHistory] = useState([]);
    const [exportSettings, setExportSettings] = useState({});

    useEffect(() => {
        loadExportOptions();
    }, []);

    const loadExportOptions = async () => {
        try {
            setIsLoading(true);
            
            const response = await fetch('/api/export/options', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    showExcelExports,
                    showPDFExports,
                    showCSVExports,
                    showDashboardExports
                })
            });

            if (!response.ok) throw new Error('Failed to load export options');
            
            const data = await response.json();
            setExportOptions(data.exportOptions);
            setExportHistory(data.exportHistory || []);
            setExportSettings(data.exportSettings);
            
            if (onExportOptionsViewed) {
                onExportOptionsViewed(data);
            }
            
        } catch (error) {
            console.error('Error loading export options:', error);
            toast.error('Failed to load export options');
        } finally {
            setIsLoading(false);
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

    const getTypeIcon = (type) => {
        switch (type) {
            case 'comprehensive':
                return <Database className="w-4 h-4" />;
            case 'performance':
                return <BarChart3 className="w-4 h-4" />;
            case 'individual':
                return <Users className="w-4 h-4" />;
            case 'batch':
                return <BookOpen className="w-4 h-4" />;
            case 'comparative':
                return <TrendingUp className="w-4 h-4" />;
            default:
                return <File className="w-4 h-4" />;
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

    const downloadExport = async (format, type) => {
        try {
            const response = await fetch('/api/export/download', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    format,
                    type
                })
            });

            if (!response.ok) throw new Error('Download failed');
            
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${type}_report_${format}_${Date.now()}.${format}`;
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

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    if (!exportOptions) {
        return (
            <div className="text-center py-8">
                <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                <p className="text-gray-500">No export options data available</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="text-center">
                <h2 className="text-3xl font-bold text-gray-900">Export Options</h2>
                <p className="text-gray-600 mt-2">Export data in various formats for analysis and reporting</p>
            </div>

            {/* Export Options Overview */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center">
                            <div className="p-2 bg-green-100 rounded-lg">
                                <FileSpreadsheet className="w-6 h-6 text-green-600" />
                            </div>
                            <div className="ml-4">
                                <p className="text-sm font-medium text-gray-600">Excel Exports</p>
                                <p className="text-2xl font-bold text-gray-900">
                                    {exportOptions.excelExports}
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center">
                            <div className="p-2 bg-red-100 rounded-lg">
                                <FileText className="w-6 h-6 text-red-600" />
                            </div>
                            <div className="ml-4">
                                <p className="text-sm font-medium text-gray-600">PDF Exports</p>
                                <p className="text-2xl font-bold text-gray-900">
                                    {exportOptions.pdfExports}
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center">
                            <div className="p-2 bg-blue-100 rounded-lg">
                                <File className="w-6 h-6 text-blue-600" />
                            </div>
                            <div className="ml-4">
                                <p className="text-sm font-medium text-gray-600">CSV Exports</p>
                                <p className="text-2xl font-bold text-gray-900">
                                    {exportOptions.csvExports}
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center">
                            <div className="p-2 bg-purple-100 rounded-lg">
                                <BarChart3 className="w-6 h-6 text-purple-600" />
                            </div>
                            <div className="ml-4">
                                <p className="text-sm font-medium text-gray-600">Dashboard Exports</p>
                                <p className="text-2xl font-bold text-gray-900">
                                    {exportOptions.dashboardExports}
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Export Format Selection */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                        <Download className="w-5 h-5" />
                        <span>Export Format Selection</span>
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Excel Exports */}
                        {showExcelExports && (
                            <div className="p-4 border rounded-lg">
                                <div className="flex items-center space-x-3 mb-4">
                                    <FileSpreadsheet className="w-6 h-6 text-green-600" />
                                    <h3 className="text-lg font-medium text-gray-900">Excel Exports</h3>
                                </div>
                                
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50">
                                        <div className="flex items-center space-x-3">
                                            {getTypeIcon('comprehensive')}
                                            <div>
                                                <h4 className="font-medium text-gray-900">Comprehensive Report</h4>
                                                <p className="text-sm text-gray-600">Complete data analysis</p>
                                            </div>
                                        </div>
                                        <Button 
                                            onClick={() => downloadExport('excel', 'comprehensive')}
                                            variant="outline"
                                            size="sm"
                                        >
                                            <Download className="w-4 h-4 mr-2" />
                                            Download
                                        </Button>
                                    </div>
                                    
                                    <div className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50">
                                        <div className="flex items-center space-x-3">
                                            {getTypeIcon('performance')}
                                            <div>
                                                <h4 className="font-medium text-gray-900">Performance Dashboard</h4>
                                                <p className="text-sm text-gray-600">Performance metrics and trends</p>
                                            </div>
                                        </div>
                                        <Button 
                                            onClick={() => downloadExport('excel', 'performance')}
                                            variant="outline"
                                            size="sm"
                                        >
                                            <Download className="w-4 h-4 mr-2" />
                                            Download
                                        </Button>
                                    </div>
                                    
                                    <div className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50">
                                        <div className="flex items-center space-x-3">
                                            {getTypeIcon('individual')}
                                            <div>
                                                <h4 className="font-medium text-gray-900">Individual Reports</h4>
                                                <p className="text-sm text-gray-600">Student-specific analysis</p>
                                            </div>
                                        </div>
                                        <Button 
                                            onClick={() => downloadExport('excel', 'individual')}
                                            variant="outline"
                                            size="sm"
                                        >
                                            <Download className="w-4 h-4 mr-2" />
                                            Download
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* PDF Exports */}
                        {showPDFExports && (
                            <div className="p-4 border rounded-lg">
                                <div className="flex items-center space-x-3 mb-4">
                                    <FileText className="w-6 h-6 text-red-600" />
                                    <h3 className="text-lg font-medium text-gray-900">PDF Exports</h3>
                                </div>
                                
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50">
                                        <div className="flex items-center space-x-3">
                                            {getTypeIcon('comprehensive')}
                                            <div>
                                                <h4 className="font-medium text-gray-900">Comprehensive Report</h4>
                                                <p className="text-sm text-gray-600">Complete data analysis</p>
                                            </div>
                                        </div>
                                        <Button 
                                            onClick={() => downloadExport('pdf', 'comprehensive')}
                                            variant="outline"
                                            size="sm"
                                        >
                                            <Download className="w-4 h-4 mr-2" />
                                            Download
                                        </Button>
                                    </div>
                                    
                                    <div className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50">
                                        <div className="flex items-center space-x-3">
                                            {getTypeIcon('performance')}
                                            <div>
                                                <h4 className="font-medium text-gray-900">Performance Dashboard</h4>
                                                <p className="text-sm text-gray-600">Performance metrics and trends</p>
                                            </div>
                                        </div>
                                        <Button 
                                            onClick={() => downloadExport('pdf', 'performance')}
                                            variant="outline"
                                            size="sm"
                                        >
                                            <Download className="w-4 h-4 mr-2" />
                                            Download
                                        </Button>
                                    </div>
                                    
                                    <div className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50">
                                        <div className="flex items-center space-x-3">
                                            {getTypeIcon('individual')}
                                            <div>
                                                <h4 className="font-medium text-gray-900">Individual Reports</h4>
                                                <p className="text-sm text-gray-600">Student-specific analysis</p>
                                            </div>
                                        </div>
                                        <Button 
                                            onClick={() => downloadExport('pdf', 'individual')}
                                            variant="outline"
                                            size="sm"
                                        >
                                            <Download className="w-4 h-4 mr-2" />
                                            Download
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* CSV Exports */}
                        {showCSVExports && (
                            <div className="p-4 border rounded-lg">
                                <div className="flex items-center space-x-3 mb-4">
                                    <File className="w-6 h-6 text-blue-600" />
                                    <h3 className="text-lg font-medium text-gray-900">CSV Exports</h3>
                                </div>
                                
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50">
                                        <div className="flex items-center space-x-3">
                                            {getTypeIcon('comprehensive')}
                                            <div>
                                                <h4 className="font-medium text-gray-900">Comprehensive Report</h4>
                                                <p className="text-sm text-gray-600">Complete data analysis</p>
                                            </div>
                                        </div>
                                        <Button 
                                            onClick={() => downloadExport('csv', 'comprehensive')}
                                            variant="outline"
                                            size="sm"
                                        >
                                            <Download className="w-4 h-4 mr-2" />
                                            Download
                                        </Button>
                                    </div>
                                    
                                    <div className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50">
                                        <div className="flex items-center space-x-3">
                                            {getTypeIcon('performance')}
                                            <div>
                                                <h4 className="font-medium text-gray-900">Performance Dashboard</h4>
                                                <p className="text-sm text-gray-600">Performance metrics and trends</p>
                                            </div>
                                        </div>
                                        <Button 
                                            onClick={() => downloadExport('csv', 'performance')}
                                            variant="outline"
                                            size="sm"
                                        >
                                            <Download className="w-4 h-4 mr-2" />
                                            Download
                                        </Button>
                                    </div>
                                    
                                    <div className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50">
                                        <div className="flex items-center space-x-3">
                                            {getTypeIcon('individual')}
                                            <div>
                                                <h4 className="font-medium text-gray-900">Individual Reports</h4>
                                                <p className="text-sm text-gray-600">Student-specific analysis</p>
                                            </div>
                                        </div>
                                        <Button 
                                            onClick={() => downloadExport('csv', 'individual')}
                                            variant="outline"
                                            size="sm"
                                        >
                                            <Download className="w-4 h-4 mr-2" />
                                            Download
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Dashboard Exports */}
                        {showDashboardExports && (
                            <div className="p-4 border rounded-lg">
                                <div className="flex items-center space-x-3 mb-4">
                                    <BarChart3 className="w-6 h-6 text-purple-600" />
                                    <h3 className="text-lg font-medium text-gray-900">Dashboard Exports</h3>
                                </div>
                                
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50">
                                        <div className="flex items-center space-x-3">
                                            {getTypeIcon('performance')}
                                            <div>
                                                <h4 className="font-medium text-gray-900">Performance Dashboard</h4>
                                                <p className="text-sm text-gray-600">Performance metrics and trends</p>
                                            </div>
                                        </div>
                                        <Button 
                                            onClick={() => downloadExport('dashboard', 'performance')}
                                            variant="outline"
                                            size="sm"
                                        >
                                            <Download className="w-4 h-4 mr-2" />
                                            Download
                                        </Button>
                                    </div>
                                    
                                    <div className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50">
                                        <div className="flex items-center space-x-3">
                                            {getTypeIcon('batch')}
                                            <div>
                                                <h4 className="font-medium text-gray-900">Batch Reports</h4>
                                                <p className="text-sm text-gray-600">Batch-wise analysis</p>
                                            </div>
                                        </div>
                                        <Button 
                                            onClick={() => downloadExport('dashboard', 'batch')}
                                            variant="outline"
                                            size="sm"
                                        >
                                            <Download className="w-4 h-4 mr-2" />
                                            Download
                                        </Button>
                                    </div>
                                    
                                    <div className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50">
                                        <div className="flex items-center space-x-3">
                                            {getTypeIcon('comparative')}
                                            <div>
                                                <h4 className="font-medium text-gray-900">Comparative Reports</h4>
                                                <p className="text-sm text-gray-600">Comparative analysis</p>
                                            </div>
                                        </div>
                                        <Button 
                                            onClick={() => downloadExport('dashboard', 'comparative')}
                                            variant="outline"
                                            size="sm"
                                        >
                                            <Download className="w-4 h-4 mr-2" />
                                            Download
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* Export History */}
            {exportHistory.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center space-x-2">
                            <Clock className="w-5 h-5" />
                            <span>Export History</span>
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {exportHistory.map((exportItem, index) => (
                                <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                                    <div className="flex items-center space-x-4">
                                        {getFormatIcon(exportItem.format)}
                                        <div>
                                            <h4 className="font-medium text-gray-900">{exportItem.name}</h4>
                                            <p className="text-sm text-gray-600">
                                                {formatDate(exportItem.createdAt)} • {formatFileSize(exportItem.size)}
                                            </p>
                                        </div>
                                    </div>
                                    
                                    <div className="flex items-center space-x-2">
                                        <Badge className={getFormatBadge(exportItem.format)}>
                                            {exportItem.format.toUpperCase()}
                                        </Badge>
                                        <Button 
                                            onClick={() => downloadExport(exportItem.format, exportItem.type)}
                                            variant="outline"
                                            size="sm"
                                        >
                                            <Download className="w-4 h-4 mr-2" />
                                            Download
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
                    onClick={loadExportOptions}
                    variant="outline"
                >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Refresh
                </Button>
            </div>
        </div>
    );
};

export default ExportOptions;
