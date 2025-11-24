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
    Book
} from 'lucide-react';
import { toast } from 'react-hot-toast';

const StudentPerformanceReports = ({ 
    studentId,
    onStudentPerformanceReportsViewed,
    showIndividualAnalysis = true,
    showAssessmentHistory = true,
    showProgressTracking = true,
    showRecommendations = true
}) => {
    const [studentReports, setStudentReports] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [timeRange, setTimeRange] = useState('30d');
    const [selectedMetric, setSelectedMetric] = useState('overall');
    const [individualAnalysis, setIndividualAnalysis] = useState({});
    const [assessmentHistory, setAssessmentHistory] = useState([]);
    const [progressTracking, setProgressTracking] = useState({});
    const [recommendations, setRecommendations] = useState([]);

    useEffect(() => {
        loadStudentPerformanceReports();
    }, [studentId, timeRange]);

    const loadStudentPerformanceReports = async () => {
        try {
            setIsLoading(true);
            
            const response = await fetch('/api/student/performance-reports', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    studentId,
                    timeRange,
                    showIndividualAnalysis,
                    showAssessmentHistory,
                    showProgressTracking,
                    showRecommendations
                })
            });

            if (!response.ok) throw new Error('Failed to load student performance reports');
            
            const data = await response.json();
            setStudentReports(data.studentReports);
            setIndividualAnalysis(data.individualAnalysis);
            setAssessmentHistory(data.assessmentHistory || []);
            setProgressTracking(data.progressTracking);
            setRecommendations(data.recommendations || []);
            
            if (onStudentPerformanceReportsViewed) {
                onStudentPerformanceReportsViewed(data);
            }
            
        } catch (error) {
            console.error('Error loading student performance reports:', error);
            toast.error('Failed to load student performance reports');
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

    const downloadStudentReports = async (format = 'pdf') => {
        try {
            const response = await fetch('/api/student/download-performance-reports', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    studentId,
                    format,
                    timeRange
                })
            });

            if (!response.ok) throw new Error('Download failed');
            
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `student_performance_reports_${format}_${Date.now()}.${format}`;
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

    if (!studentReports) {
        return (
            <div className="text-center py-8">
                <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                <p className="text-gray-500">No student performance reports data available</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="text-center">
                <h2 className="text-3xl font-bold text-gray-900">Student Performance Reports</h2>
                <p className="text-gray-600 mt-2">Individual student performance tracking and analysis</p>
            </div>

            {/* Time Range Selector */}
            <Card>
                <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                            <Calendar className="w-4 h-4 text-gray-600" />
                            <span className="text-sm font-medium text-gray-700">Time Range:</span>
                        </div>
                        
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
                </CardContent>
            </Card>

            {/* Student Performance Overview */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center">
                            <div className="p-2 bg-blue-100 rounded-lg">
                                <User className="w-6 h-6 text-blue-600" />
                            </div>
                            <div className="ml-4">
                                <p className="text-sm font-medium text-gray-600">Student</p>
                                <p className="text-2xl font-bold text-gray-900">
                                    {studentReports.studentName}
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center">
                            <div className="p-2 bg-green-100 rounded-lg">
                                <Award className="w-6 h-6 text-green-600" />
                            </div>
                            <div className="ml-4">
                                <p className="text-sm font-medium text-gray-600">Overall Score</p>
                                <p className={`text-2xl font-bold ${getPerformanceColor(studentReports.overallScore)}`}>
                                    {studentReports.overallScore}%
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center">
                            <div className="p-2 bg-purple-100 rounded-lg">
                                <BookOpen className="w-6 h-6 text-purple-600" />
                            </div>
                            <div className="ml-4">
                                <p className="text-sm font-medium text-gray-600">Assessments</p>
                                <p className="text-2xl font-bold text-gray-900">
                                    {studentReports.totalAssessments}
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center">
                            <div className="p-2 bg-orange-100 rounded-lg">
                                <TrendingUp className="w-6 h-6 text-orange-600" />
                            </div>
                            <div className="ml-4">
                                <p className="text-sm font-medium text-gray-600">Improvement</p>
                                <p className="text-2xl font-bold text-gray-900">
                                    {studentReports.improvement}%
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Individual Analysis */}
            {showIndividualAnalysis && individualAnalysis && (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center space-x-2">
                            <BarChart3 className="w-5 h-5" />
                            <span>Individual Analysis</span>
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="text-center">
                                    <p className="text-2xl font-bold text-green-600">
                                        {individualAnalysis.accuracy || 0}%
                                    </p>
                                    <p className="text-sm text-gray-600">Overall Accuracy</p>
                                </div>
                                
                                <div className="text-center">
                                    <p className="text-2xl font-bold text-blue-600">
                                        {individualAnalysis.timeEfficiency || 0}%
                                    </p>
                                    <p className="text-sm text-gray-600">Time Efficiency</p>
                                </div>
                                
                                <div className="text-center">
                                    <p className="text-2xl font-bold text-purple-600">
                                        {individualAnalysis.consistency || 0}%
                                    </p>
                                    <p className="text-sm text-gray-600">Consistency</p>
                                </div>
                            </div>
                            
                            {individualAnalysis.metrics && (
                                <div>
                                    <h4 className="font-medium text-gray-900 mb-2">Performance Metrics</h4>
                                    <div className="space-y-3">
                                        {individualAnalysis.metrics.map((metric, index) => (
                                            <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                                                <div className="flex items-center space-x-3">
                                                    {getTrendIcon(metric.trend)}
                                                    <div>
                                                        <h5 className="font-medium text-gray-900">{metric.name}</h5>
                                                        <p className="text-sm text-gray-600">{metric.description}</p>
                                                    </div>
                                                </div>
                                                
                                                <div className="text-right">
                                                    <p className="font-bold text-gray-900">{metric.value}%</p>
                                                    <p className="text-xs text-gray-500">
                                                        {metric.trend > 0 ? '+' : ''}{metric.trend}%
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

            {/* Assessment History */}
            {showAssessmentHistory && assessmentHistory.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center space-x-2">
                            <Book className="w-5 h-5" />
                            <span>Assessment History</span>
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {assessmentHistory.map((assessment, index) => (
                                <div key={index} className="p-4 border rounded-lg">
                                    <div className="flex items-center justify-between mb-3">
                                        <div>
                                            <h4 className="font-medium text-gray-900">{assessment.assessmentName}</h4>
                                            <p className="text-sm text-gray-600">
                                                {formatDate(assessment.submittedAt)} • {assessment.subject}
                                            </p>
                                        </div>
                                        
                                        <div className="text-right">
                                            <p className={`text-2xl font-bold ${getPerformanceColor(assessment.score)}`}>
                                                {assessment.score}%
                                            </p>
                                            <Badge className={getPerformanceBadge(assessment.score)}>
                                                {assessment.score >= 70 ? 'Passed' : 'Failed'}
                                            </Badge>
                                        </div>
                                    </div>
                                    
                                    <div className="space-y-2">
                                        <div className="flex justify-between text-sm">
                                            <span className="text-gray-600">Time Spent:</span>
                                            <span className="font-medium">{formatTime(assessment.timeSpent)}</span>
                                        </div>
                                        
                                        <div className="flex justify-between text-sm">
                                            <span className="text-gray-600">Questions Answered:</span>
                                            <span className="font-medium">{assessment.questionsAnswered}/{assessment.totalQuestions}</span>
                                        </div>
                                        
                                        <div className="flex justify-between text-sm">
                                            <span className="text-gray-600">Accuracy:</span>
                                            <span className="font-medium">{assessment.accuracy}%</span>
                                        </div>
                                        
                                        <div className="flex justify-between text-sm">
                                            <span className="text-gray-600">Attempt:</span>
                                            <span className="font-medium">{assessment.attemptNumber}</span>
                                        </div>
                                    </div>
                                    
                                    <div className="mt-3">
                                        <Progress value={assessment.score} className="w-full" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Progress Tracking */}
            {showProgressTracking && progressTracking && (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center space-x-2">
                            <LineChart className="w-5 h-5" />
                            <span>Progress Tracking</span>
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="text-center">
                                    <p className="text-2xl font-bold text-green-600">
                                        {progressTracking.learningRate || 0}%
                                    </p>
                                    <p className="text-sm text-gray-600">Learning Rate</p>
                                </div>
                                
                                <div className="text-center">
                                    <p className="text-2xl font-bold text-blue-600">
                                        {progressTracking.retentionRate || 0}%
                                    </p>
                                    <p className="text-sm text-gray-600">Retention Rate</p>
                                </div>
                                
                                <div className="text-center">
                                    <p className="text-2xl font-bold text-purple-600">
                                        {progressTracking.applicationRate || 0}%
                                    </p>
                                    <p className="text-sm text-gray-600">Application Rate</p>
                                </div>
                            </div>
                            
                            {progressTracking.trends && progressTracking.trends.length > 0 && (
                                <div>
                                    <h4 className="font-medium text-gray-900 mb-2">Progress Trends</h4>
                                    <div className="space-y-3">
                                        {progressTracking.trends.map((trend, index) => (
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

            {/* Recommendations */}
            {showRecommendations && recommendations.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center space-x-2">
                            <Lightbulb className="w-5 h-5" />
                            <span>Performance Recommendations</span>
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {recommendations.map((recommendation, index) => (
                                <div key={index} className="p-4 border rounded-lg hover:bg-gray-50">
                                    <div className="flex items-start space-x-3">
                                        <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
                                            <Lightbulb className="w-4 h-4 text-yellow-600" />
                                        </div>
                                        <div className="flex-1">
                                            <h4 className="font-medium text-gray-900">{recommendation.title}</h4>
                                            <p className="text-sm text-gray-600 mt-1">{recommendation.description}</p>
                                            <div className="flex items-center space-x-2 mt-2">
                                                <Badge className="bg-yellow-100 text-yellow-800">
                                                    {recommendation.type}
                                                </Badge>
                                                <span className="text-xs text-gray-500">
                                                    {recommendation.estimatedTime}
                                                </span>
                                            </div>
                                        </div>
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
                    onClick={() => downloadStudentReports('pdf')}
                    variant="outline"
                >
                    <Download className="w-4 h-4 mr-2" />
                    Download PDF
                </Button>
                
                <Button 
                    onClick={() => downloadStudentReports('excel')}
                    variant="outline"
                >
                    <Download className="w-4 h-4 mr-2" />
                    Download Excel
                </Button>
                
                <Button 
                    onClick={loadStudentPerformanceReports}
                    variant="outline"
                >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Refresh
                </Button>
            </div>
        </div>
    );
};

export default StudentPerformanceReports;
