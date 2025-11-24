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
    Settings
} from 'lucide-react';
import { toast } from 'react-hot-toast';

const FacultyAdminAnalytics = ({ 
    facultyId,
    onFacultyAdminAnalyticsViewed,
    showAssessmentReports = true,
    showStudentReports = true,
    showBatchReports = true,
    showComparativeAnalysis = true
}) => {
    const [facultyAnalytics, setFacultyAnalytics] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [timeRange, setTimeRange] = useState('30d');
    const [selectedBatch, setSelectedBatch] = useState('all');
    const [selectedDepartment, setSelectedDepartment] = useState('all');
    const [assessmentReports, setAssessmentReports] = useState([]);
    const [studentReports, setStudentReports] = useState([]);
    const [batchReports, setBatchReports] = useState([]);
    const [comparativeAnalysis, setComparativeAnalysis] = useState({});

    useEffect(() => {
        loadFacultyAdminAnalytics();
    }, [facultyId, timeRange, selectedBatch, selectedDepartment]);

    const loadFacultyAdminAnalytics = async () => {
        try {
            setIsLoading(true);
            
            const response = await fetch('/api/faculty/admin-analytics', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    facultyId,
                    timeRange,
                    selectedBatch,
                    selectedDepartment,
                    showAssessmentReports,
                    showStudentReports,
                    showBatchReports,
                    showComparativeAnalysis
                })
            });

            if (!response.ok) throw new Error('Failed to load faculty admin analytics');
            
            const data = await response.json();
            setFacultyAnalytics(data.facultyAnalytics);
            setAssessmentReports(data.assessmentReports || []);
            setStudentReports(data.studentReports || []);
            setBatchReports(data.batchReports || []);
            setComparativeAnalysis(data.comparativeAnalysis);
            
            if (onFacultyAdminAnalyticsViewed) {
                onFacultyAdminAnalyticsViewed(data);
            }
            
        } catch (error) {
            console.error('Error loading faculty admin analytics:', error);
            toast.error('Failed to load faculty admin analytics');
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

    const downloadFacultyAnalytics = async (format = 'pdf') => {
        try {
            const response = await fetch('/api/faculty/download-admin-analytics', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    facultyId,
                    format,
                    timeRange,
                    selectedBatch,
                    selectedDepartment
                })
            });

            if (!response.ok) throw new Error('Download failed');
            
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `faculty_admin_analytics_${format}_${Date.now()}.${format}`;
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

    if (!facultyAnalytics) {
        return (
            <div className="text-center py-8">
                <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                <p className="text-gray-500">No faculty admin analytics data available</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="text-center">
                <h2 className="text-3xl font-bold text-gray-900">Faculty/Admin Analytics</h2>
                <p className="text-gray-600 mt-2">Comprehensive analytics for faculty and administrators</p>
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
                            <span className="text-sm font-medium text-gray-700">Batch:</span>
                            <select
                                value={selectedBatch}
                                onChange={(e) => setSelectedBatch(e.target.value)}
                                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            >
                                <option value="all">All Batches</option>
                                {facultyAnalytics.batches && facultyAnalytics.batches.map((batch, index) => (
                                    <option key={index} value={batch.id}>{batch.name}</option>
                                ))}
                            </select>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                            <Filter className="w-4 h-4 text-gray-600" />
                            <span className="text-sm font-medium text-gray-700">Department:</span>
                            <select
                                value={selectedDepartment}
                                onChange={(e) => setSelectedDepartment(e.target.value)}
                                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            >
                                <option value="all">All Departments</option>
                                {facultyAnalytics.departments && facultyAnalytics.departments.map((department, index) => (
                                    <option key={index} value={department.id}>{department.name}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Faculty Analytics Overview */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center">
                            <div className="p-2 bg-blue-100 rounded-lg">
                                <BookOpen className="w-6 h-6 text-blue-600" />
                            </div>
                            <div className="ml-4">
                                <p className="text-sm font-medium text-gray-600">Total Assessments</p>
                                <p className="text-2xl font-bold text-gray-900">
                                    {facultyAnalytics.totalAssessments}
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center">
                            <div className="p-2 bg-green-100 rounded-lg">
                                <Users className="w-6 h-6 text-green-600" />
                            </div>
                            <div className="ml-4">
                                <p className="text-sm font-medium text-gray-600">Total Students</p>
                                <p className="text-2xl font-bold text-gray-900">
                                    {facultyAnalytics.totalStudents}
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center">
                            <div className="p-2 bg-purple-100 rounded-lg">
                                <Award className="w-6 h-6 text-purple-600" />
                            </div>
                            <div className="ml-4">
                                <p className="text-sm font-medium text-gray-600">Average Score</p>
                                <p className={`text-2xl font-bold ${getPerformanceColor(facultyAnalytics.averageScore)}`}>
                                    {facultyAnalytics.averageScore}%
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center">
                            <div className="p-2 bg-orange-100 rounded-lg">
                                <Clock className="w-6 h-6 text-orange-600" />
                            </div>
                            <div className="ml-4">
                                <p className="text-sm font-medium text-gray-600">Avg Time</p>
                                <p className="text-2xl font-bold text-gray-900">
                                    {formatTime(facultyAnalytics.averageTime)}
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Assessment Performance Reports */}
            {showAssessmentReports && assessmentReports.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center space-x-2">
                            <BarChart3 className="w-5 h-5" />
                            <span>Assessment Performance Reports</span>
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {assessmentReports.map((report, index) => (
                                <div key={index} className="p-4 border rounded-lg">
                                    <div className="flex items-center justify-between mb-3">
                                        <div>
                                            <h4 className="font-medium text-gray-900">{report.assessmentName}</h4>
                                            <p className="text-sm text-gray-600">
                                                {report.totalStudents} students • {report.completionRate}% completion
                                            </p>
                                        </div>
                                        
                                        <div className="text-right">
                                            <p className={`text-2xl font-bold ${getPerformanceColor(report.averageScore)}`}>
                                                {report.averageScore}%
                                            </p>
                                            <Badge className={getPerformanceBadge(report.averageScore)}>
                                                {report.averageScore >= 70 ? 'Good' : 'Needs Attention'}
                                            </Badge>
                                        </div>
                                    </div>
                                    
                                    <div className="space-y-2">
                                        <div className="flex justify-between text-sm">
                                            <span className="text-gray-600">Total Submissions:</span>
                                            <span className="font-medium">{report.totalSubmissions}</span>
                                        </div>
                                        
                                        <div className="flex justify-between text-sm">
                                            <span className="text-gray-600">Pass Rate:</span>
                                            <span className="font-medium">{report.passRate}%</span>
                                        </div>
                                        
                                        <div className="flex justify-between text-sm">
                                            <span className="text-gray-600">Average Time:</span>
                                            <span className="font-medium">{formatTime(report.averageTime)}</span>
                                        </div>
                                        
                                        <div className="flex justify-between text-sm">
                                            <span className="text-gray-600">Difficulty:</span>
                                            <span className="font-medium">{report.difficulty}</span>
                                        </div>
                                    </div>
                                    
                                    <div className="mt-3">
                                        <Progress value={report.averageScore} className="w-full" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Student Performance Reports */}
            {showStudentReports && studentReports.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center space-x-2">
                            <Users className="w-5 h-5" />
                            <span>Student Performance Reports</span>
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {studentReports.map((report, index) => (
                                <div key={index} className="p-4 border rounded-lg">
                                    <div className="flex items-center justify-between mb-3">
                                        <div>
                                            <h4 className="font-medium text-gray-900">{report.studentName}</h4>
                                            <p className="text-sm text-gray-600">
                                                {report.batch} • {report.department}
                                            </p>
                                        </div>
                                        
                                        <div className="text-right">
                                            <p className={`text-2xl font-bold ${getPerformanceColor(report.overallScore)}`}>
                                                {report.overallScore}%
                                            </p>
                                            <Badge className={getPerformanceBadge(report.overallScore)}>
                                                {report.overallScore >= 70 ? 'Passed' : 'Failed'}
                                            </Badge>
                                        </div>
                                    </div>
                                    
                                    <div className="space-y-2">
                                        <div className="flex justify-between text-sm">
                                            <span className="text-gray-600">Assessments Taken:</span>
                                            <span className="font-medium">{report.assessmentsTaken}</span>
                                        </div>
                                        
                                        <div className="flex justify-between text-sm">
                                            <span className="text-gray-600">Average Time:</span>
                                            <span className="font-medium">{formatTime(report.averageTime)}</span>
                                        </div>
                                        
                                        <div className="flex justify-between text-sm">
                                            <span className="text-gray-600">Improvement:</span>
                                            <span className="font-medium">{report.improvement}%</span>
                                        </div>
                                        
                                        <div className="flex justify-between text-sm">
                                            <span className="text-gray-600">Last Activity:</span>
                                            <span className="font-medium">{formatDate(report.lastActivity)}</span>
                                        </div>
                                    </div>
                                    
                                    <div className="mt-3">
                                        <Progress value={report.overallScore} className="w-full" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Batch Reports */}
            {showBatchReports && batchReports.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center space-x-2">
                            <GraduationCap className="w-5 h-5" />
                            <span>Batch Reports</span>
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {batchReports.map((report, index) => (
                                <div key={index} className="p-4 border rounded-lg">
                                    <div className="flex items-center justify-between mb-3">
                                        <div>
                                            <h4 className="font-medium text-gray-900">{report.batchName}</h4>
                                            <p className="text-sm text-gray-600">
                                                {report.totalStudents} students • {report.department}
                                            </p>
                                        </div>
                                        
                                        <div className="text-right">
                                            <p className={`text-2xl font-bold ${getPerformanceColor(report.averageScore)}`}>
                                                {report.averageScore}%
                                            </p>
                                            <Badge className={getPerformanceBadge(report.averageScore)}>
                                                {report.averageScore >= 70 ? 'Good' : 'Needs Attention'}
                                            </Badge>
                                        </div>
                                    </div>
                                    
                                    <div className="space-y-2">
                                        <div className="flex justify-between text-sm">
                                            <span className="text-gray-600">Pass Rate:</span>
                                            <span className="font-medium">{report.passRate}%</span>
                                        </div>
                                        
                                        <div className="flex justify-between text-sm">
                                            <span className="text-gray-600">Average Time:</span>
                                            <span className="font-medium">{formatTime(report.averageTime)}</span>
                                        </div>
                                        
                                        <div className="flex justify-between text-sm">
                                            <span className="text-gray-600">Improvement:</span>
                                            <span className="font-medium">{report.improvement}%</span>
                                        </div>
                                        
                                        <div className="flex justify-between text-sm">
                                            <span className="text-gray-600">Completion Rate:</span>
                                            <span className="font-medium">{report.completionRate}%</span>
                                        </div>
                                    </div>
                                    
                                    <div className="mt-3">
                                        <Progress value={report.averageScore} className="w-full" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Comparative Analysis */}
            {showComparativeAnalysis && comparativeAnalysis && (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center space-x-2">
                            <PieChart className="w-5 h-5" />
                            <span>Comparative Analysis</span>
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="text-center">
                                    <p className="text-2xl font-bold text-green-600">
                                        {comparativeAnalysis.departmentComparison || 0}%
                                    </p>
                                    <p className="text-sm text-gray-600">Department Comparison</p>
                                </div>
                                
                                <div className="text-center">
                                    <p className="text-2xl font-bold text-blue-600">
                                        {comparativeAnalysis.batchComparison || 0}%
                                    </p>
                                    <p className="text-sm text-gray-600">Batch Comparison</p>
                                </div>
                                
                                <div className="text-center">
                                    <p className="text-2xl font-bold text-purple-600">
                                        {comparativeAnalysis.classComparison || 0}%
                                    </p>
                                    <p className="text-sm text-gray-600">Class Comparison</p>
                                </div>
                            </div>
                            
                            {comparativeAnalysis.comparisons && (
                                <div>
                                    <h4 className="font-medium text-gray-900 mb-2">Detailed Comparisons</h4>
                                    <div className="space-y-3">
                                        {comparativeAnalysis.comparisons.map((comparison, index) => (
                                            <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                                                <div className="flex items-center space-x-3">
                                                    {getTrendIcon(comparison.trend)}
                                                    <div>
                                                        <h5 className="font-medium text-gray-900">{comparison.metric}</h5>
                                                        <p className="text-sm text-gray-600">{comparison.description}</p>
                                                    </div>
                                                </div>
                                                
                                                <div className="text-right">
                                                    <p className="font-bold text-gray-900">{comparison.value}%</p>
                                                    <p className="text-xs text-gray-500">
                                                        {comparison.trend > 0 ? '+' : ''}{comparison.trend}%
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
                    onClick={() => downloadFacultyAnalytics('pdf')}
                    variant="outline"
                >
                    <Download className="w-4 h-4 mr-2" />
                    Download PDF
                </Button>
                
                <Button 
                    onClick={() => downloadFacultyAnalytics('excel')}
                    variant="outline"
                >
                    <Download className="w-4 h-4 mr-2" />
                    Download Excel
                </Button>
                
                <Button 
                    onClick={loadFacultyAdminAnalytics}
                    variant="outline"
                >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Refresh
                </Button>
            </div>
        </div>
    );
};

export default FacultyAdminAnalytics;
