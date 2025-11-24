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
    Printer,
    FileImage,
    FileVideo,
    FileAudio,
    Archive,
    Package
} from 'lucide-react';
import { toast } from 'react-hot-toast';

const ExportFormats = ({ 
    onExportFormatsViewed,
    showComprehensiveExcel = true,
    showPerformanceDashboard = true,
    showIndividualReports = true,
    showBatchReports = true,
    showComparativeReports = true
}) => {
    const [exportFormats, setExportFormats] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedFormat, setSelectedFormat] = useState('comprehensive');
    const [exportHistory, setExportHistory] = useState([]);
    const [exportTemplates, setExportTemplates] = useState([]);
    const [exportSettings, setExportSettings] = useState({});

    useEffect(() => {
        loadExportFormats();
    }, []);

    const loadExportFormats = async () => {
        try {
            setIsLoading(true);
            
            const response = await fetch('/api/export/formats', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    showComprehensiveExcel,
                    showPerformanceDashboard,
                    showIndividualReports,
                    showBatchReports,
                    showComparativeReports
                })
            });

            if (!response.ok) throw new Error('Failed to load export formats');
            
            const data = await response.json();
            setExportFormats(data.exportFormats);
            setExportHistory(data.exportHistory || []);
            setExportTemplates(data.exportTemplates || []);
            setExportSettings(data.exportSettings);
            
            if (onExportFormatsViewed) {
                onExportFormatsViewed(data);
            }
            
        } catch (error) {
            console.error('Error loading export formats:', error);
            toast.error('Failed to load export formats');
        } finally {
            setIsLoading(false);
        }
    };

    const getFormatIcon = (format) => {
        switch (format) {
            case 'comprehensive':
                return <FileSpreadsheet className="w-6 h-6 text-green-600" />;
            case 'performance':
                return <BarChart3 className="w-6 h-6 text-blue-600" />;
            case 'individual':
                return <Users className="w-6 h-6 text-purple-600" />;
            case 'batch':
                return <BookOpen className="w-6 h-6 text-orange-600" />;
            case 'comparative':
                return <TrendingUp className="w-6 h-6 text-red-600" />;
            default:
                return <File className="w-6 h-6 text-gray-600" />;
        }
    };

    const getFormatBadge = (format) => {
        switch (format) {
            case 'comprehensive':
                return 'bg-green-100 text-green-800';
            case 'performance':
                return 'bg-blue-100 text-blue-800';
            case 'individual':
                return 'bg-purple-100 text-purple-800';
            case 'batch':
                return 'bg-orange-100 text-orange-800';
            case 'comparative':
                return 'bg-red-100 text-red-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };

    const getFileTypeIcon = (fileType) => {
        switch (fileType) {
            case 'excel':
                return <FileSpreadsheet className="w-4 h-4" />;
            case 'pdf':
                return <FileText className="w-4 h-4" />;
            case 'csv':
                return <File className="w-4 h-4" />;
            case 'json':
                return <Database className="w-4 h-4" />;
            case 'xml':
                return <FileText className="w-4 h-4" />;
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

    const downloadExportFormat = async (format, fileType = 'excel') => {
        try {
            const response = await fetch('/api/export/download-format', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    format,
                    fileType
                })
            });

            if (!response.ok) throw new Error('Download failed');
            
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${format}_report_${fileType}_${Date.now()}.${fileType}`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
            
            toast.success(`${format.toUpperCase()} ${fileType.toUpperCase()} download started`);
        } catch (error) {
            console.error('Download error:', error);
            toast.error('Download failed');
        }
    };

    const scheduleExport = async (format, schedule) => {
        try {
            const response = await fetch('/api/export/schedule-export', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    format,
                    schedule
                })
            });

            if (!response.ok) throw new Error('Schedule failed');
            
            toast.success('Export scheduled successfully');
            loadExportFormats();
        } catch (error) {
            console.error('Schedule error:', error);
            toast.error('Schedule failed');
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    if (!exportFormats) {
        return (
            <div className="text-center py-8">
                <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                <p className="text-gray-500">No export formats data available</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="text-center">
                <h2 className="text-3xl font-bold text-gray-900">Export Formats</h2>
                <p className="text-gray-600 mt-2">Comprehensive export formats for all reporting needs</p>
            </div>

            {/* Export Formats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center">
                            <div className="p-2 bg-green-100 rounded-lg">
                                <FileSpreadsheet className="w-6 h-6 text-green-600" />
                            </div>
                            <div className="ml-4">
                                <p className="text-sm font-medium text-gray-600">Comprehensive Excel</p>
                                <p className="text-2xl font-bold text-gray-900">
                                    {exportFormats.comprehensiveExcel}
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center">
                            <div className="p-2 bg-blue-100 rounded-lg">
                                <BarChart3 className="w-6 h-6 text-blue-600" />
                            </div>
                            <div className="ml-4">
                                <p className="text-sm font-medium text-gray-600">Performance Dashboard</p>
                                <p className="text-2xl font-bold text-gray-900">
                                    {exportFormats.performanceDashboard}
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center">
                            <div className="p-2 bg-purple-100 rounded-lg">
                                <Users className="w-6 h-6 text-purple-600" />
                            </div>
                            <div className="ml-4">
                                <p className="text-sm font-medium text-gray-600">Individual Reports</p>
                                <p className="text-2xl font-bold text-gray-900">
                                    {exportFormats.individualReports}
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center">
                            <div className="p-2 bg-orange-100 rounded-lg">
                                <BookOpen className="w-6 h-6 text-orange-600" />
                            </div>
                            <div className="ml-4">
                                <p className="text-sm font-medium text-gray-600">Batch Reports</p>
                                <p className="text-2xl font-bold text-gray-900">
                                    {exportFormats.batchReports}
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center">
                            <div className="p-2 bg-red-100 rounded-lg">
                                <TrendingUp className="w-6 h-6 text-red-600" />
                            </div>
                            <div className="ml-4">
                                <p className="text-sm font-medium text-gray-600">Comparative Reports</p>
                                <p className="text-2xl font-bold text-gray-900">
                                    {exportFormats.comparativeReports}
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Comprehensive Excel Reports */}
            {showComprehensiveExcel && (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center space-x-2">
                            <FileSpreadsheet className="w-5 h-5" />
                            <span>Comprehensive Excel Reports</span>
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                <div className="p-4 border rounded-lg text-center">
                                    <FileSpreadsheet className="w-8 h-8 text-green-600 mx-auto mb-3" />
                                    <h4 className="font-medium text-gray-900 mb-2">Complete Assessment Data</h4>
                                    <p className="text-sm text-gray-600 mb-3">All assessment data with detailed analytics</p>
                                    <div className="space-y-2">
                                        <Button 
                                            onClick={() => downloadExportFormat('comprehensive', 'excel')}
                                            variant="outline"
                                            size="sm"
                                            className="w-full"
                                        >
                                            <Download className="w-4 h-4 mr-2" />
                                            Download Excel
                                        </Button>
                                        <Button 
                                            onClick={() => downloadExportFormat('comprehensive', 'csv')}
                                            variant="outline"
                                            size="sm"
                                            className="w-full"
                                        >
                                            <Download className="w-4 h-4 mr-2" />
                                            Download CSV
                                        </Button>
                                    </div>
                                </div>

                                <div className="p-4 border rounded-lg text-center">
                                    <BarChart3 className="w-8 h-8 text-blue-600 mx-auto mb-3" />
                                    <h4 className="font-medium text-gray-900 mb-2">Performance Analytics</h4>
                                    <p className="text-sm text-gray-600 mb-3">Detailed performance metrics and trends</p>
                                    <div className="space-y-2">
                                        <Button 
                                            onClick={() => downloadExportFormat('performance', 'excel')}
                                            variant="outline"
                                            size="sm"
                                            className="w-full"
                                        >
                                            <Download className="w-4 h-4 mr-2" />
                                            Download Excel
                                        </Button>
                                        <Button 
                                            onClick={() => downloadExportFormat('performance', 'csv')}
                                            variant="outline"
                                            size="sm"
                                            className="w-full"
                                        >
                                            <Download className="w-4 h-4 mr-2" />
                                            Download CSV
                                        </Button>
                                    </div>
                                </div>

                                <div className="p-4 border rounded-lg text-center">
                                    <Database className="w-8 h-8 text-purple-600 mx-auto mb-3" />
                                    <h4 className="font-medium text-gray-900 mb-2">Raw Data Export</h4>
                                    <p className="text-sm text-gray-600 mb-3">Raw data for external analysis</p>
                                    <div className="space-y-2">
                                        <Button 
                                            onClick={() => downloadExportFormat('raw', 'json')}
                                            variant="outline"
                                            size="sm"
                                            className="w-full"
                                        >
                                            <Download className="w-4 h-4 mr-2" />
                                            Download JSON
                                        </Button>
                                        <Button 
                                            onClick={() => downloadExportFormat('raw', 'xml')}
                                            variant="outline"
                                            size="sm"
                                            className="w-full"
                                        >
                                            <Download className="w-4 h-4 mr-2" />
                                            Download XML
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Performance Dashboard */}
            {showPerformanceDashboard && (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center space-x-2">
                            <BarChart3 className="w-5 h-5" />
                            <span>Performance Dashboard</span>
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                <div className="p-4 border rounded-lg text-center">
                                    <BarChart3 className="w-8 h-8 text-blue-600 mx-auto mb-3" />
                                    <h4 className="font-medium text-gray-900 mb-2">Performance Overview</h4>
                                    <p className="text-sm text-gray-600 mb-3">Overall performance metrics and trends</p>
                                    <div className="space-y-2">
                                        <Button 
                                            onClick={() => downloadExportFormat('performance-overview', 'pdf')}
                                            variant="outline"
                                            size="sm"
                                            className="w-full"
                                        >
                                            <Download className="w-4 h-4 mr-2" />
                                            Download PDF
                                        </Button>
                                        <Button 
                                            onClick={() => downloadExportFormat('performance-overview', 'excel')}
                                            variant="outline"
                                            size="sm"
                                            className="w-full"
                                        >
                                            <Download className="w-4 h-4 mr-2" />
                                            Download Excel
                                        </Button>
                                    </div>
                                </div>

                                <div className="p-4 border rounded-lg text-center">
                                    <PieChart className="w-8 h-8 text-green-600 mx-auto mb-3" />
                                    <h4 className="font-medium text-gray-900 mb-2">Score Distribution</h4>
                                    <p className="text-sm text-gray-600 mb-3">Score distribution and analysis</p>
                                    <div className="space-y-2">
                                        <Button 
                                            onClick={() => downloadExportFormat('score-distribution', 'pdf')}
                                            variant="outline"
                                            size="sm"
                                            className="w-full"
                                        >
                                            <Download className="w-4 h-4 mr-2" />
                                            Download PDF
                                        </Button>
                                        <Button 
                                            onClick={() => downloadExportFormat('score-distribution', 'excel')}
                                            variant="outline"
                                            size="sm"
                                            className="w-full"
                                        >
                                            <Download className="w-4 h-4 mr-2" />
                                            Download Excel
                                        </Button>
                                    </div>
                                </div>

                                <div className="p-4 border rounded-lg text-center">
                                    <LineChart className="w-8 h-8 text-purple-600 mx-auto mb-3" />
                                    <h4 className="font-medium text-gray-900 mb-2">Trend Analysis</h4>
                                    <p className="text-sm text-gray-600 mb-3">Performance trends over time</p>
                                    <div className="space-y-2">
                                        <Button 
                                            onClick={() => downloadExportFormat('trend-analysis', 'pdf')}
                                            variant="outline"
                                            size="sm"
                                            className="w-full"
                                        >
                                            <Download className="w-4 h-4 mr-2" />
                                            Download PDF
                                        </Button>
                                        <Button 
                                            onClick={() => downloadExportFormat('trend-analysis', 'excel')}
                                            variant="outline"
                                            size="sm"
                                            className="w-full"
                                        >
                                            <Download className="w-4 h-4 mr-2" />
                                            Download Excel
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Individual Reports */}
            {showIndividualReports && (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center space-x-2">
                            <Users className="w-5 h-5" />
                            <span>Individual Reports</span>
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                <div className="p-4 border rounded-lg text-center">
                                    <Users className="w-8 h-8 text-purple-600 mx-auto mb-3" />
                                    <h4 className="font-medium text-gray-900 mb-2">Student Performance</h4>
                                    <p className="text-sm text-gray-600 mb-3">Individual student performance reports</p>
                                    <div className="space-y-2">
                                        <Button 
                                            onClick={() => downloadExportFormat('student-performance', 'pdf')}
                                            variant="outline"
                                            size="sm"
                                            className="w-full"
                                        >
                                            <Download className="w-4 h-4 mr-2" />
                                            Download PDF
                                        </Button>
                                        <Button 
                                            onClick={() => downloadExportFormat('student-performance', 'excel')}
                                            variant="outline"
                                            size="sm"
                                            className="w-full"
                                        >
                                            <Download className="w-4 h-4 mr-2" />
                                            Download Excel
                                        </Button>
                                    </div>
                                </div>

                                <div className="p-4 border rounded-lg text-center">
                                    <Target className="w-8 h-8 text-blue-600 mx-auto mb-3" />
                                    <h4 className="font-medium text-gray-900 mb-2">Progress Tracking</h4>
                                    <p className="text-sm text-gray-600 mb-3">Individual progress tracking reports</p>
                                    <div className="space-y-2">
                                        <Button 
                                            onClick={() => downloadExportFormat('progress-tracking', 'pdf')}
                                            variant="outline"
                                            size="sm"
                                            className="w-full"
                                        >
                                            <Download className="w-4 h-4 mr-2" />
                                            Download PDF
                                        </Button>
                                        <Button 
                                            onClick={() => downloadExportFormat('progress-tracking', 'excel')}
                                            variant="outline"
                                            size="sm"
                                            className="w-full"
                                        >
                                            <Download className="w-4 h-4 mr-2" />
                                            Download Excel
                                        </Button>
                                    </div>
                                </div>

                                <div className="p-4 border rounded-lg text-center">
                                    <Award className="w-8 h-8 text-green-600 mx-auto mb-3" />
                                    <h4 className="font-medium text-gray-900 mb-2">Achievement Reports</h4>
                                    <p className="text-sm text-gray-600 mb-3">Individual achievement and milestone reports</p>
                                    <div className="space-y-2">
                                        <Button 
                                            onClick={() => downloadExportFormat('achievement', 'pdf')}
                                            variant="outline"
                                            size="sm"
                                            className="w-full"
                                        >
                                            <Download className="w-4 h-4 mr-2" />
                                            Download PDF
                                        </Button>
                                        <Button 
                                            onClick={() => downloadExportFormat('achievement', 'excel')}
                                            variant="outline"
                                            size="sm"
                                            className="w-full"
                                        >
                                            <Download className="w-4 h-4 mr-2" />
                                            Download Excel
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Batch Reports */}
            {showBatchReports && (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center space-x-2">
                            <BookOpen className="w-5 h-5" />
                            <span>Batch Reports</span>
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                <div className="p-4 border rounded-lg text-center">
                                    <BookOpen className="w-8 h-8 text-orange-600 mx-auto mb-3" />
                                    <h4 className="font-medium text-gray-900 mb-2">Batch Performance</h4>
                                    <p className="text-sm text-gray-600 mb-3">Complete batch performance analysis</p>
                                    <div className="space-y-2">
                                        <Button 
                                            onClick={() => downloadExportFormat('batch-performance', 'pdf')}
                                            variant="outline"
                                            size="sm"
                                            className="w-full"
                                        >
                                            <Download className="w-4 h-4 mr-2" />
                                            Download PDF
                                        </Button>
                                        <Button 
                                            onClick={() => downloadExportFormat('batch-performance', 'excel')}
                                            variant="outline"
                                            size="sm"
                                            className="w-full"
                                        >
                                            <Download className="w-4 h-4 mr-2" />
                                            Download Excel
                                        </Button>
                                    </div>
                                </div>

                                <div className="p-4 border rounded-lg text-center">
                                    <TrendingUp className="w-8 h-8 text-blue-600 mx-auto mb-3" />
                                    <h4 className="font-medium text-gray-900 mb-2">Batch Trends</h4>
                                    <p className="text-sm text-gray-600 mb-3">Batch performance trends over time</p>
                                    <div className="space-y-2">
                                        <Button 
                                            onClick={() => downloadExportFormat('batch-trends', 'pdf')}
                                            variant="outline"
                                            size="sm"
                                            className="w-full"
                                        >
                                            <Download className="w-4 h-4 mr-2" />
                                            Download PDF
                                        </Button>
                                        <Button 
                                            onClick={() => downloadExportFormat('batch-trends', 'excel')}
                                            variant="outline"
                                            size="sm"
                                            className="w-full"
                                        >
                                            <Download className="w-4 h-4 mr-2" />
                                            Download Excel
                                        </Button>
                                    </div>
                                </div>

                                <div className="p-4 border rounded-lg text-center">
                                    <BarChart3 className="w-8 h-8 text-green-600 mx-auto mb-3" />
                                    <h4 className="font-medium text-gray-900 mb-2">Batch Analytics</h4>
                                    <p className="text-sm text-gray-600 mb-3">Detailed batch analytics and insights</p>
                                    <div className="space-y-2">
                                        <Button 
                                            onClick={() => downloadExportFormat('batch-analytics', 'pdf')}
                                            variant="outline"
                                            size="sm"
                                            className="w-full"
                                        >
                                            <Download className="w-4 h-4 mr-2" />
                                            Download PDF
                                        </Button>
                                        <Button 
                                            onClick={() => downloadExportFormat('batch-analytics', 'excel')}
                                            variant="outline"
                                            size="sm"
                                            className="w-full"
                                        >
                                            <Download className="w-4 h-4 mr-2" />
                                            Download Excel
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Comparative Reports */}
            {showComparativeReports && (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center space-x-2">
                            <TrendingUp className="w-5 h-5" />
                            <span>Comparative Reports</span>
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                <div className="p-4 border rounded-lg text-center">
                                    <TrendingUp className="w-8 h-8 text-red-600 mx-auto mb-3" />
                                    <h4 className="font-medium text-gray-900 mb-2">Class Comparisons</h4>
                                    <p className="text-sm text-gray-600 mb-3">Class performance comparisons</p>
                                    <div className="space-y-2">
                                        <Button 
                                            onClick={() => downloadExportFormat('class-comparisons', 'pdf')}
                                            variant="outline"
                                            size="sm"
                                            className="w-full"
                                        >
                                            <Download className="w-4 h-4 mr-2" />
                                            Download PDF
                                        </Button>
                                        <Button 
                                            onClick={() => downloadExportFormat('class-comparisons', 'excel')}
                                            variant="outline"
                                            size="sm"
                                            className="w-full"
                                        >
                                            <Download className="w-4 h-4 mr-2" />
                                            Download Excel
                                        </Button>
                                    </div>
                                </div>

                                <div className="p-4 border rounded-lg text-center">
                                    <Database className="w-8 h-8 text-blue-600 mx-auto mb-3" />
                                    <h4 className="font-medium text-gray-900 mb-2">Department Comparisons</h4>
                                    <p className="text-sm text-gray-600 mb-3">Department performance comparisons</p>
                                    <div className="space-y-2">
                                        <Button 
                                            onClick={() => downloadExportFormat('department-comparisons', 'pdf')}
                                            variant="outline"
                                            size="sm"
                                            className="w-full"
                                        >
                                            <Download className="w-4 h-4 mr-2" />
                                            Download PDF
                                        </Button>
                                        <Button 
                                            onClick={() => downloadExportFormat('department-comparisons', 'excel')}
                                            variant="outline"
                                            size="sm"
                                            className="w-full"
                                        >
                                            <Download className="w-4 h-4 mr-2" />
                                            Download Excel
                                        </Button>
                                    </div>
                                </div>

                                <div className="p-4 border rounded-lg text-center">
                                    <Award className="w-8 h-8 text-green-600 mx-auto mb-3" />
                                    <h4 className="font-medium text-gray-900 mb-2">Ranking Reports</h4>
                                    <p className="text-sm text-gray-600 mb-3">Performance ranking reports</p>
                                    <div className="space-y-2">
                                        <Button 
                                            onClick={() => downloadExportFormat('ranking', 'pdf')}
                                            variant="outline"
                                            size="sm"
                                            className="w-full"
                                        >
                                            <Download className="w-4 h-4 mr-2" />
                                            Download PDF
                                        </Button>
                                        <Button 
                                            onClick={() => downloadExportFormat('ranking', 'excel')}
                                            variant="outline"
                                            size="sm"
                                            className="w-full"
                                        >
                                            <Download className="w-4 h-4 mr-2" />
                                            Download Excel
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}

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
                                        <Badge className="bg-gray-100 text-gray-800">
                                            {exportItem.fileType.toUpperCase()}
                                        </Badge>
                                        <Button 
                                            onClick={() => downloadExportFormat(exportItem.format, exportItem.fileType)}
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
                    onClick={() => downloadExportFormat('comprehensive', 'excel')}
                    variant="outline"
                >
                    <Download className="w-4 h-4 mr-2" />
                    Download Comprehensive Excel
                </Button>
                
                <Button 
                    onClick={() => downloadExportFormat('performance', 'pdf')}
                    variant="outline"
                >
                    <Download className="w-4 h-4 mr-2" />
                    Download Performance PDF
                </Button>
                
                <Button 
                    onClick={loadExportFormats}
                    variant="outline"
                >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Refresh
                </Button>
            </div>
        </div>
    );
};

export default ExportFormats;
