import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Checkbox } from './ui/checkbox';
import { Progress } from './ui/progress';
import { Download, FileText, BarChart3, Users, Calendar, Filter, Settings, RefreshCw, AlertCircle, CheckCircle } from 'lucide-react';
import { toast } from 'react-hot-toast';

const ExportManager = ({ userRole, userId }) => {
    const [exportConfig, setExportConfig] = useState({
        format: 'excel',
        type: 'assessment_results',
        filters: {
            assessmentId: '',
            batchId: '',
            departmentId: '',
            dateFrom: '',
            dateTo: '',
            status: '',
            includeAnalytics: true,
            includeProctoring: false,
            includeStudentDetails: true
        },
        options: {
            includeCharts: true,
            includeRawData: true,
            passwordProtect: false,
            watermark: false
        }
    });
    const [availableAssessments, setAvailableAssessments] = useState([]);
    const [availableBatches, setAvailableBatches] = useState([]);
    const [availableDepartments, setAvailableDepartments] = useState([]);
    const [exportHistory, setExportHistory] = useState([]);
    const [exporting, setExporting] = useState(false);
    const [exportProgress, setExportProgress] = useState(0);

    useEffect(() => {
        loadExportData();
        loadExportHistory();
    }, []);

    const loadExportData = async () => {
        try {
            const response = await fetch('/api/export/data', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userRole, userId })
            });

            if (!response.ok) throw new Error('Failed to load export data');
            
            const data = await response.json();
            setAvailableAssessments(data.assessments || []);
            setAvailableBatches(data.batches || []);
            setAvailableDepartments(data.departments || []);
        } catch (error) {
            console.error('Error loading export data:', error);
            toast.error('Failed to load export data');
        }
    };

    const loadExportHistory = async () => {
        try {
            const response = await fetch('/api/export/history', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userRole, userId })
            });

            if (!response.ok) throw new Error('Failed to load export history');
            
            const data = await response.json();
            setExportHistory(data);
        } catch (error) {
            console.error('Error loading export history:', error);
            toast.error('Failed to load export history');
        }
    };

    const handleConfigChange = (key, value) => {
        setExportConfig(prev => ({
            ...prev,
            [key]: value
        }));
    };

    const handleFilterChange = (key, value) => {
        setExportConfig(prev => ({
            ...prev,
            filters: {
                ...prev.filters,
                [key]: value
            }
        }));
    };

    const handleOptionChange = (key, value) => {
        setExportConfig(prev => ({
            ...prev,
            options: {
                ...prev.options,
                [key]: value
            }
        }));
    };

    const handleExport = async () => {
        try {
            setExporting(true);
            setExportProgress(0);

            // Simulate progress
            const progressInterval = setInterval(() => {
                setExportProgress(prev => {
                    if (prev >= 90) {
                        clearInterval(progressInterval);
                        return prev;
                    }
                    return prev + 10;
                });
            }, 200);

            const response = await fetch('/api/export/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    config: exportConfig,
                    userRole,
                    userId
                })
            });

            if (!response.ok) throw new Error('Export failed');

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `export_${exportConfig.type}_${Date.now()}.${exportConfig.format}`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);

            setExportProgress(100);
            clearInterval(progressInterval);

            toast.success('Export completed successfully');
            loadExportHistory();
        } catch (error) {
            console.error('Export error:', error);
            toast.error('Export failed');
        } finally {
            setExporting(false);
            setExportProgress(0);
        }
    };

    const downloadExport = async (exportId) => {
        try {
            const response = await fetch(`/api/export/download/${exportId}`);
            if (!response.ok) throw new Error('Download failed');

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `export_${exportId}.${exportConfig.format}`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);

            toast.success('File downloaded successfully');
        } catch (error) {
            console.error('Download error:', error);
            toast.error('Download failed');
        }
    };

    const getExportTypeIcon = (type) => {
        const icons = {
            'assessment_results': <BarChart3 className="w-5 h-5" />,
            'student_performance': <Users className="w-5 h-5" />,
            'batch_analytics': <Users className="w-5 h-5" />,
            'comprehensive_report': <FileText className="w-5 h-5" />,
            'proctoring_data': <AlertCircle className="w-5 h-5" />
        };
        return icons[type] || <FileText className="w-5 h-5" />;
    };

    const getFormatBadge = (format) => {
        const colors = {
            'excel': 'bg-green-100 text-green-800',
            'pdf': 'bg-red-100 text-red-800',
            'csv': 'bg-blue-100 text-blue-800',
            'dashboard': 'bg-purple-100 text-purple-800'
        };
        
        return (
            <Badge className={colors[format] || 'bg-gray-100 text-gray-800'}>
                {format.toUpperCase()}
            </Badge>
        );
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Export Manager</h1>
                    <p className="text-gray-600 mt-1">Generate and download assessment reports</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={loadExportData}>
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Refresh
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Export Configuration */}
                <div className="lg:col-span-2 space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Export Configuration</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            {/* Export Type */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Export Type
                                </label>
                                <Select value={exportConfig.type} onValueChange={(value) => handleConfigChange('type', value)}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select export type" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="assessment_results">Assessment Results</SelectItem>
                                        <SelectItem value="student_performance">Student Performance</SelectItem>
                                        <SelectItem value="batch_analytics">Batch Analytics</SelectItem>
                                        <SelectItem value="comprehensive_report">Comprehensive Report</SelectItem>
                                        <SelectItem value="proctoring_data">Proctoring Data</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Export Format */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Export Format
                                </label>
                                <Select value={exportConfig.format} onValueChange={(value) => handleConfigChange('format', value)}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select format" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="excel">Excel (.xlsx)</SelectItem>
                                        <SelectItem value="pdf">PDF (.pdf)</SelectItem>
                                        <SelectItem value="csv">CSV (.csv)</SelectItem>
                                        <SelectItem value="dashboard">Dashboard Export</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Filters */}
                            <div className="space-y-4">
                                <h3 className="text-lg font-medium text-gray-900">Filters</h3>
                                
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Assessment
                                        </label>
                                        <Select value={exportConfig.filters.assessmentId} onValueChange={(value) => handleFilterChange('assessmentId', value)}>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select assessment" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="">All Assessments</SelectItem>
                                                {availableAssessments.map(assessment => (
                                                    <SelectItem key={assessment.id} value={assessment.id}>
                                                        {assessment.title}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Batch
                                        </label>
                                        <Select value={exportConfig.filters.batchId} onValueChange={(value) => handleFilterChange('batchId', value)}>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select batch" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="">All Batches</SelectItem>
                                                {availableBatches.map(batch => (
                                                    <SelectItem key={batch.id} value={batch.id}>
                                                        {batch.name}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Department
                                        </label>
                                        <Select value={exportConfig.filters.departmentId} onValueChange={(value) => handleFilterChange('departmentId', value)}>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select department" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="">All Departments</SelectItem>
                                                {availableDepartments.map(dept => (
                                                    <SelectItem key={dept.id} value={dept.id}>
                                                        {dept.name}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Status
                                        </label>
                                        <Select value={exportConfig.filters.status} onValueChange={(value) => handleFilterChange('status', value)}>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select status" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="">All Status</SelectItem>
                                                <SelectItem value="completed">Completed</SelectItem>
                                                <SelectItem value="in_progress">In Progress</SelectItem>
                                                <SelectItem value="abandoned">Abandoned</SelectItem>
                                                <SelectItem value="graded">Graded</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            From Date
                                        </label>
                                        <input
                                            type="date"
                                            value={exportConfig.filters.dateFrom}
                                            onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            To Date
                                        </label>
                                        <input
                                            type="date"
                                            value={exportConfig.filters.dateTo}
                                            onChange={(e) => handleFilterChange('dateTo', e.target.value)}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Include Options */}
                            <div className="space-y-4">
                                <h3 className="text-lg font-medium text-gray-900">Include Options</h3>
                                
                                <div className="space-y-3">
                                    <div className="flex items-center space-x-2">
                                        <Checkbox
                                            id="includeAnalytics"
                                            checked={exportConfig.filters.includeAnalytics}
                                            onCheckedChange={(checked) => handleFilterChange('includeAnalytics', checked)}
                                        />
                                        <label htmlFor="includeAnalytics" className="text-sm font-medium text-gray-700">
                                            Include Analytics
                                        </label>
                                    </div>

                                    <div className="flex items-center space-x-2">
                                        <Checkbox
                                            id="includeProctoring"
                                            checked={exportConfig.filters.includeProctoring}
                                            onCheckedChange={(checked) => handleFilterChange('includeProctoring', checked)}
                                        />
                                        <label htmlFor="includeProctoring" className="text-sm font-medium text-gray-700">
                                            Include Proctoring Data
                                        </label>
                                    </div>

                                    <div className="flex items-center space-x-2">
                                        <Checkbox
                                            id="includeStudentDetails"
                                            checked={exportConfig.filters.includeStudentDetails}
                                            onCheckedChange={(checked) => handleFilterChange('includeStudentDetails', checked)}
                                        />
                                        <label htmlFor="includeStudentDetails" className="text-sm font-medium text-gray-700">
                                            Include Student Details
                                        </label>
                                    </div>
                                </div>
                            </div>

                            {/* Export Options */}
                            <div className="space-y-4">
                                <h3 className="text-lg font-medium text-gray-900">Export Options</h3>
                                
                                <div className="space-y-3">
                                    <div className="flex items-center space-x-2">
                                        <Checkbox
                                            id="includeCharts"
                                            checked={exportConfig.options.includeCharts}
                                            onCheckedChange={(checked) => handleOptionChange('includeCharts', checked)}
                                        />
                                        <label htmlFor="includeCharts" className="text-sm font-medium text-gray-700">
                                            Include Charts and Graphs
                                        </label>
                                    </div>

                                    <div className="flex items-center space-x-2">
                                        <Checkbox
                                            id="includeRawData"
                                            checked={exportConfig.options.includeRawData}
                                            onCheckedChange={(checked) => handleOptionChange('includeRawData', checked)}
                                        />
                                        <label htmlFor="includeRawData" className="text-sm font-medium text-gray-700">
                                            Include Raw Data
                                        </label>
                                    </div>

                                    <div className="flex items-center space-x-2">
                                        <Checkbox
                                            id="passwordProtect"
                                            checked={exportConfig.options.passwordProtect}
                                            onCheckedChange={(checked) => handleOptionChange('passwordProtect', checked)}
                                        />
                                        <label htmlFor="passwordProtect" className="text-sm font-medium text-gray-700">
                                            Password Protect PDF
                                        </label>
                                    </div>

                                    <div className="flex items-center space-x-2">
                                        <Checkbox
                                            id="watermark"
                                            checked={exportConfig.options.watermark}
                                            onCheckedChange={(checked) => handleOptionChange('watermark', checked)}
                                        />
                                        <label htmlFor="watermark" className="text-sm font-medium text-gray-700">
                                            Add Watermark
                                        </label>
                                    </div>
                                </div>
                            </div>

                            {/* Export Button */}
                            <div className="pt-4">
                                <Button 
                                    onClick={handleExport} 
                                    disabled={exporting}
                                    className="w-full"
                                >
                                    {exporting ? (
                                        <>
                                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                            Exporting...
                                        </>
                                    ) : (
                                        <>
                                            <Download className="w-4 h-4 mr-2" />
                                            Generate Export
                                        </>
                                    )}
                                </Button>

                                {exporting && (
                                    <div className="mt-4">
                                        <Progress value={exportProgress} className="w-full" />
                                        <p className="text-sm text-gray-600 mt-2 text-center">
                                            {exportProgress}% complete
                                        </p>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Export History */}
                <div className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Export History</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {exportHistory.length === 0 ? (
                                    <div className="text-center py-4">
                                        <FileText className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                                        <p className="text-sm text-gray-500">No exports yet</p>
                                    </div>
                                ) : (
                                    exportHistory.map((exportItem, index) => (
                                        <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                                            <div className="flex items-center space-x-3">
                                                {getExportTypeIcon(exportItem.type)}
                                                <div>
                                                    <p className="text-sm font-medium text-gray-900">
                                                        {exportItem.type.replace('_', ' ').toUpperCase()}
                                                    </p>
                                                    <p className="text-xs text-gray-500">
                                                        {new Date(exportItem.created_at).toLocaleDateString()}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="flex items-center space-x-2">
                                                {getFormatBadge(exportItem.format)}
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => downloadExport(exportItem.id)}
                                                >
                                                    <Download className="w-3 h-3" />
                                                </Button>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Quick Export Templates */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Quick Export Templates</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="w-full justify-start"
                                    onClick={() => {
                                        setExportConfig(prev => ({
                                            ...prev,
                                            type: 'assessment_results',
                                            format: 'excel',
                                            filters: { ...prev.filters, includeAnalytics: true }
                                        }));
                                    }}
                                >
                                    <BarChart3 className="w-4 h-4 mr-2" />
                                    Assessment Results (Excel)
                                </Button>

                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="w-full justify-start"
                                    onClick={() => {
                                        setExportConfig(prev => ({
                                            ...prev,
                                            type: 'student_performance',
                                            format: 'pdf',
                                            filters: { ...prev.filters, includeAnalytics: true }
                                        }));
                                    }}
                                >
                                    <Users className="w-4 h-4 mr-2" />
                                    Student Performance (PDF)
                                </Button>

                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="w-full justify-start"
                                    onClick={() => {
                                        setExportConfig(prev => ({
                                            ...prev,
                                            type: 'comprehensive_report',
                                            format: 'excel',
                                            filters: { ...prev.filters, includeAnalytics: true, includeProctoring: true }
                                        }));
                                    }}
                                >
                                    <FileText className="w-4 h-4 mr-2" />
                                    Comprehensive Report
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
};

export default ExportManager;