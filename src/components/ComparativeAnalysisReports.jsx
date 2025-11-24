import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { Alert, AlertDescription } from './ui/alert';
import { 
    BarChart3, 
    TrendingUp, 
    TrendingDown,
    Target, 
    Award,
    Star,
    Clock,
    BookOpen,
    Brain,
    Zap,
    Download,
    RefreshCw,
    Filter,
    Calendar,
    Activity,
    Trophy,
    CheckCircle,
    XCircle,
    AlertTriangle,
    Lightbulb,
    Users,
    GraduationCap,
    PieChart,
    LineChart,
    Eye,
    Settings,
    FileText,
    BarChart,
    Building,
    UserCheck,
    User,
    Book,
    TrendingUp as TrendingUpIcon,
    TrendingDown as TrendingDownIcon
} from 'lucide-react';
import { toast } from 'react-hot-toast';

const ComparativeAnalysisReports = ({ 
    onComparativeAnalysisReportsViewed,
    showClassPerformance = true,
    showDepartmentComparisons = true,
    showBatchComparisons = true,
    showTrendAnalysis = true
}) => {
    const [comparativeReports, setComparativeReports] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [timeRange, setTimeRange] = useState('30d');
    const [selectedMetric, setSelectedMetric] = useState('overall');
    const [classPerformance, setClassPerformance] = useState([]);
    const [departmentComparisons, setDepartmentComparisons] = useState([]);
    const [batchComparisons, setBatchComparisons] = useState([]);
    const [trendAnalysis, setTrendAnalysis] = useState({});

    useEffect(() => {
        loadComparativeAnalysisReports();
    }, [timeRange, selectedMetric]);

    const loadComparativeAnalysisReports = async () => {
        try {
            setIsLoading(true);
            
            const response = await fetch('/api/analytics/comparative-analysis-reports', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    timeRange,
                    selectedMetric,
                    showClassPerformance,
                    showDepartmentComparisons,
                    showBatchComparisons,
                    showTrendAnalysis
                })
            });

            if (!response.ok) throw new Error('Failed to load comparative analysis reports');
            
            const data = await response.json();
            setComparativeReports(data.comparativeReports);
            setClassPerformance(data.classPerformance || []);
            setDepartmentComparisons(data.departmentComparisons || []);
            setBatchComparisons(data.batchComparisons || []);
            setTrendAnalysis(data.trendAnalysis);
            
            if (onComparativeAnalysisReportsViewed) {
                onComparativeAnalysisReportsViewed(data);
            }
            
        } catch (error) {
            console.error('Error loading comparative analysis reports:', error);
            toast.error('Failed to load comparative analysis reports');
        } finally {
            setIsLoading(false);
        }
    };

    const getPerformanceColor = (score) => {
        if (score >= 90) return 'text-green-600';
        if (score >= 80) return 'text-blue-600';
        if (score >= 70) return 'text-yellow-600';
        if (score >= 60) return 'text-orange-600';
        return 'text-red-600';
    };

    const getPerformanceBadge = (score) => {
        if (score >= 90) return 'bg-green-100 text-green-800';
        if (score >= 80) return 'bg-blue-100 text-blue-800';
        if (score >= 70) return 'bg-yellow-100 text-yellow-800';
        if (score >= 60) return 'bg-orange-100 text-orange-800';
        return 'bg-red-100 text-red-800';
    };

    const getTrendIcon = (trend) => {
        if (trend > 0) return <TrendingUp className="w-4 h-4 text-green-500" />;
        if (trend < 0) return <TrendingDown className="w-4 h-4 text-red-500" />;
        return <Target className="w-4 h-4 text-gray-500" />;
    };

    const formatTime = (minutes) => {
        if (minutes < 60) return `${minutes}m`;
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        return `${hours}h ${mins}m`;
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    const downloadComparativeReports = async (format = 'pdf') => {
        try {
            const response = await fetch('/api/analytics/download-comparative-analysis-reports', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    format,
                    timeRange,
                    selectedMetric
                })
            });

            if (!response.ok) throw new Error('Download failed');
            
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `comparative_analysis_reports_${format}_${Date.now()}.${format}`;
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

    if (!comparativeReports) {
        return (
            <div className="text-center py-8">
                <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                <p className="text-gray-500">No comparative analysis reports data available</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="text-center">
                <h2 className="text-3xl font-bold text-gray-900">Comparative Analysis Reports</h2>
                <p className="text-gray-600 mt-2">Comprehensive comparative analysis across classes, departments, and batches</p>
            </div>

            {/* Filters */}
            <Card>
                <CardContent className="p-4">
                    <div className="flex flex-col md:flex-row gap-4">
                        <div className="flex items-center space-x-2">
                            <Calendar className="w-4 h-4 text-gray-600" />
                            <span className="text-sm font-medium text-gray-700">Time Range:</span>
                            <select
                                value={timeRange}
                                onChange={(e) => setTimeRange(e.target.value)}
                                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            >
                                <option value="7d">Last 7 days</option>
                                <option value="30d">Last 30 days</option>
                                <option value="90d">Last 90 days</option>
                                <option value="1y">Last year</option>
                            </select>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                            <Filter className="w-4 h-4 text-gray-600" />
                            <span className="text-sm font-medium text-gray-700">Metric:</span>
                            <select
                                value={selectedMetric}
                                onChange={(e) => setSelectedMetric(e.target.value)}
                                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            >
                                <option value="overall">Overall Performance</option>
                                <option value="score">Score Analysis</option>
                                <option value="time">Time Analysis</option>
                                <option value="accuracy">Accuracy Analysis</option>
                            </select>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Comparative Analysis Overview */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center">
                            <div className="p-2 bg-blue-100 rounded-lg">
                                <Users className="w-6 h-6 text-blue-600" />
                            </div>
                            <div className="ml-4">
                                <p className="text-sm font-medium text-gray-600">Total Classes</p>
                                <p className="text-2xl font-bold text-gray-900">
                                    {comparativeReports.totalClasses}
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center">
                            <div className="p-2 bg-green-100 rounded-lg">
                                <Building className="w-6 h-6 text-green-600" />
                            </div>
                            <div className="ml-4">
                                <p className="text-sm font-medium text-gray-600">Total Departments</p>
                                <p className="text-2xl font-bold text-gray-900">
                                    {comparativeReports.totalDepartments}
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center">
                            <div className="p-2 bg-purple-100 rounded-lg">
                                <GraduationCap className="w-6 h-6 text-purple-600" />
                            </div>
                            <div className="ml-4">
                                <p className="text-sm font-medium text-gray-600">Total Batches</p>
                                <p className="text-2xl font-bold text-gray-900">
                                    {comparativeReports.totalBatches}
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center">
                            <div className="p-2 bg-orange-100 rounded-lg">
                                <Award className="w-6 h-6 text-orange-600" />
                            </div>
                            <div className="ml-4">
                                <p className="text-sm font-medium text-gray-600">Average Score</p>
                                <p className={`text-2xl font-bold ${getPerformanceColor(comparativeReports.averageScore)}`}>
                                    {comparativeReports.averageScore}%
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Class Performance */}
            {showClassPerformance && classPerformance.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center space-x-2">
                            <Users className="w-5 h-5" />
                            <span>Class Performance</span>
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {classPerformance.map((classData, index) => (
                                <div key={index} className="p-4 border rounded-lg">
                                    <div className="flex items-center justify-between mb-3">
                                        <div>
                                            <h4 className="font-medium text-gray-900">{classData.className}</h4>
                                            <p className="text-sm text-gray-600">
                                                {classData.totalStudents} students • {classData.department}
                                            </p>
                                        </div>
                                        
                                        <div className="text-right">
                                            <p className={`text-2xl font-bold ${getPerformanceColor(classData.averageScore)}`}>
                                                {classData.averageScore}%
                                            </p>
                                            <Badge className={getPerformanceBadge(classData.averageScore)}>
                                                {classData.averageScore >= 70 ? 'Good' : 'Needs Attention'}
                                            </Badge>
                                        </div>
                                    </div>
                                    
                                    <div className="space-y-2">
                                        <div className="flex justify-between text-sm">
                                            <span className="text-gray-600">Pass Rate:</span>
                                            <span className="font-medium">{classData.passRate}%</span>
                                        </div>
                                        
                                        <div className="flex justify-between text-sm">
                                            <span className="text-gray-600">Average Time:</span>
                                            <span className="font-medium">{formatTime(classData.averageTime)}</span>
                                        </div>
                                        
                                        <div className="flex justify-between text-sm">
                                            <span className="text-gray-600">Completion Rate:</span>
                                            <span className="font-medium">{classData.completionRate}%</span>
                                        </div>
                                        
                                        <div className="flex justify-between text-sm">
                                            <span className="text-gray-600">Rank:</span>
                                            <span className="font-medium">{classData.rank}/{classPerformance.length}</span>
                                        </div>
                                    </div>
                                    
                                    <div className="mt-3">
                                        <Progress value={classData.averageScore} className="w-full" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Department Comparisons */}
            {showDepartmentComparisons && departmentComparisons.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center space-x-2">
                            <Building className="w-5 h-5" />
                            <span>Department Comparisons</span>
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {departmentComparisons.map((department, index) => (
                                <div key={index} className="p-4 border rounded-lg">
                                    <div className="flex items-center justify-between mb-3">
                                        <div>
                                            <h4 className="font-medium text-gray-900">{department.departmentName}</h4>
                                            <p className="text-sm text-gray-600">
                                                {department.totalStudents} students • {department.totalClasses} classes
                                            </p>
                                        </div>
                                        
                                        <div className="text-right">
                                            <p className={`text-2xl font-bold ${getPerformanceColor(department.averageScore)}`}>
                                                {department.averageScore}%
                                            </p>
                                            <Badge className={getPerformanceBadge(department.averageScore)}>
                                                {department.averageScore >= 70 ? 'Good' : 'Needs Attention'}
                                            </Badge>
                                        </div>
                                    </div>
                                    
                                    <div className="space-y-2">
                                        <div className="flex justify-between text-sm">
                                            <span className="text-gray-600">Pass Rate:</span>
                                            <span className="font-medium">{department.passRate}%</span>
                                        </div>
                                        
                                        <div className="flex justify-between text-sm">
                                            <span className="text-gray-600">Average Time:</span>
                                            <span className="font-medium">{formatTime(department.averageTime)}</span>
                                        </div>
                                        
                                        <div className="flex justify-between text-sm">
                                            <span className="text-gray-600">Completion Rate:</span>
                                            <span className="font-medium">{department.completionRate}%</span>
                                        </div>
                                        
                                        <div className="flex justify-between text-sm">
                                            <span className="text-gray-600">Rank:</span>
                                            <span className="font-medium">{department.rank}/{departmentComparisons.length}</span>
                                        </div>
                                    </div>
                                    
                                    <div className="mt-3">
                                        <Progress value={department.averageScore} className="w-full" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Batch Comparisons */}
            {showBatchComparisons && batchComparisons.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center space-x-2">
                            <GraduationCap className="w-5 h-5" />
                            <span>Batch Comparisons</span>
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {batchComparisons.map((batch, index) => (
                                <div key={index} className="p-4 border rounded-lg">
                                    <div className="flex items-center justify-between mb-3">
                                        <div>
                                            <h4 className="font-medium text-gray-900">{batch.batchName}</h4>
                                            <p className="text-sm text-gray-600">
                                                {batch.totalStudents} students • {batch.department}
                                            </p>
                                        </div>
                                        
                                        <div className="text-right">
                                            <p className={`text-2xl font-bold ${getPerformanceColor(batch.averageScore)}`}>
                                                {batch.averageScore}%
                                            </p>
                                            <Badge className={getPerformanceBadge(batch.averageScore)}>
                                                {batch.averageScore >= 70 ? 'Good' : 'Needs Attention'}
                                            </Badge>
                                        </div>
                                    </div>
                                    
                                    <div className="space-y-2">
                                        <div className="flex justify-between text-sm">
                                            <span className="text-gray-600">Pass Rate:</span>
                                            <span className="font-medium">{batch.passRate}%</span>
                                        </div>
                                        
                                        <div className="flex justify-between text-sm">
                                            <span className="text-gray-600">Average Time:</span>
                                            <span className="font-medium">{formatTime(batch.averageTime)}</span>
                                        </div>
                                        
                                        <div className="flex justify-between text-sm">
                                            <span className="text-gray-600">Completion Rate:</span>
                                            <span className="font-medium">{batch.completionRate}%</span>
                                        </div>
                                        
                                        <div className="flex justify-between text-sm">
                                            <span className="text-gray-600">Rank:</span>
                                            <span className="font-medium">{batch.rank}/{batchComparisons.length}</span>
                                        </div>
                                    </div>
                                    
                                    <div className="mt-3">
                                        <Progress value={batch.averageScore} className="w-full" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Trend Analysis */}
            {showTrendAnalysis && trendAnalysis && (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center space-x-2">
                            <LineChart className="w-5 h-5" />
                            <span>Trend Analysis</span>
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="text-center">
                                    <p className="text-2xl font-bold text-green-600">
                                        {trendAnalysis.scoreTrend || 0}%
                                    </p>
                                    <p className="text-sm text-gray-600">Score Trend</p>
                                </div>
                                
                                <div className="text-center">
                                    <p className="text-2xl font-bold text-blue-600">
                                        {trendAnalysis.timeTrend || 0}%
                                    </p>
                                    <p className="text-sm text-gray-600">Time Trend</p>
                                </div>
                                
                                <div className="text-center">
                                    <p className="text-2xl font-bold text-purple-600">
                                        {trendAnalysis.accuracyTrend || 0}%
                                    </p>
                                    <p className="text-sm text-gray-600">Accuracy Trend</p>
                                </div>
                            </div>
                            
                            {trendAnalysis.trends && trendAnalysis.trends.length > 0 && (
                                <div>
                                    <h4 className="font-medium text-gray-900 mb-2">Performance Trends</h4>
                                    <div className="space-y-3">
                                        {trendAnalysis.trends.map((trend, index) => (
                                            <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                                                <div className="flex items-center space-x-3">
                                                    {getTrendIcon(trend.trend)}
                                                    <div>
                                                        <h5 className="font-medium text-gray-900">{trend.metric}</h5>
                                                        <p className="text-sm text-gray-600">{trend.description}</p>
                                                    </div>
                                                </div>
                                                
                                                <div className="text-right">
                                                    <p className="font-bold text-gray-900">{trend.currentValue}%</p>
                                                    <p className="text-xs text-gray-500">
                                                        {trend.trend > 0 ? '+' : ''}{trend.trend}%
                                                    </p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Actions */}
            <div className="flex justify-center space-x-4">
                <Button 
                    onClick={() => downloadComparativeReports('pdf')}
                    variant="outline"
                >
                    <Download className="w-4 h-4 mr-2" />
                    Download PDF
                </Button>
                
                <Button 
                    onClick={() => downloadComparativeReports('excel')}
                    variant="outline"
                >
                    <Download className="w-4 h-4 mr-2" />
                    Download Excel
                </Button>
                
                <Button 
                    onClick={loadComparativeAnalysisReports}
                    variant="outline"
                >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Refresh
                </Button>
            </div>
        </div>
    );
};

export default ComparativeAnalysisReports;
