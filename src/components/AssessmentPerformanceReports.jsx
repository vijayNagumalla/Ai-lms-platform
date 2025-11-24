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
    PieChart,
    LineChart,
    Eye,
    Settings,
    FileText,
    BarChart
} from 'lucide-react';
import { toast } from 'react-hot-toast';

const AssessmentPerformanceReports = ({ 
    assessmentId,
    onAssessmentPerformanceReportsViewed,
    showDetailedAnalysis = true,
    showQuestionAnalysis = true,
    showStudentAnalysis = true,
    showTimeAnalysis = true
}) => {
    const [assessmentReports, setAssessmentReports] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [timeRange, setTimeRange] = useState('30d');
    const [selectedMetric, setSelectedMetric] = useState('overall');
    const [detailedAnalysis, setDetailedAnalysis] = useState({});
    const [questionAnalysis, setQuestionAnalysis] = useState([]);
    const [studentAnalysis, setStudentAnalysis] = useState([]);
    const [timeAnalysis, setTimeAnalysis] = useState({});

    useEffect(() => {
        loadAssessmentPerformanceReports();
    }, [assessmentId, timeRange]);

    const loadAssessmentPerformanceReports = async () => {
        try {
            setIsLoading(true);
            
            const response = await fetch('/api/assessment/performance-reports', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    assessmentId,
                    timeRange,
                    showDetailedAnalysis,
                    showQuestionAnalysis,
                    showStudentAnalysis,
                    showTimeAnalysis
                })
            });

            if (!response.ok) throw new Error('Failed to load assessment performance reports');
            
            const data = await response.json();
            setAssessmentReports(data.assessmentReports);
            setDetailedAnalysis(data.detailedAnalysis);
            setQuestionAnalysis(data.questionAnalysis || []);
            setStudentAnalysis(data.studentAnalysis || []);
            setTimeAnalysis(data.timeAnalysis);
            
            if (onAssessmentPerformanceReportsViewed) {
                onAssessmentPerformanceReportsViewed(data);
            }
            
        } catch (error) {
            console.error('Error loading assessment performance reports:', error);
            toast.error('Failed to load assessment performance reports');
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

    const downloadAssessmentReports = async (format = 'pdf') => {
        try {
            const response = await fetch('/api/assessment/download-performance-reports', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    assessmentId,
                    format,
                    timeRange
                })
            });

            if (!response.ok) throw new Error('Download failed');
            
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `assessment_performance_reports_${format}_${Date.now()}.${format}`;
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

    if (!assessmentReports) {
        return (
            <div className="text-center py-8">
                <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                <p className="text-gray-500">No assessment performance reports data available</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="text-center">
                <h2 className="text-3xl font-bold text-gray-900">Assessment Performance Reports</h2>
                <p className="text-gray-600 mt-2">Detailed analysis of assessment performance and student outcomes</p>
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

            {/* Assessment Performance Overview */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center">
                            <div className="p-2 bg-blue-100 rounded-lg">
                                <Users className="w-6 h-6 text-blue-600" />
                            </div>
                            <div className="ml-4">
                                <p className="text-sm font-medium text-gray-600">Total Students</p>
                                <p className="text-2xl font-bold text-gray-900">
                                    {assessmentReports.totalStudents}
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
                                <p className="text-sm font-medium text-gray-600">Average Score</p>
                                <p className={`text-2xl font-bold ${getPerformanceColor(assessmentReports.averageScore)}`}>
                                    {assessmentReports.averageScore}%
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center">
                            <div className="p-2 bg-purple-100 rounded-lg">
                                <Clock className="w-6 h-6 text-purple-600" />
                            </div>
                            <div className="ml-4">
                                <p className="text-sm font-medium text-gray-600">Avg Time</p>
                                <p className="text-2xl font-bold text-gray-900">
                                    {formatTime(assessmentReports.averageTime)}
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center">
                            <div className="p-2 bg-orange-100 rounded-lg">
                                <Target className="w-6 h-6 text-orange-600" />
                            </div>
                            <div className="ml-4">
                                <p className="text-sm font-medium text-gray-600">Pass Rate</p>
                                <p className="text-2xl font-bold text-gray-900">
                                    {assessmentReports.passRate}%
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Detailed Analysis */}
            {showDetailedAnalysis && detailedAnalysis && (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center space-x-2">
                            <BarChart3 className="w-5 h-5" />
                            <span>Detailed Analysis</span>
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="text-center">
                                    <p className="text-2xl font-bold text-green-600">
                                        {detailedAnalysis.completionRate || 0}%
                                    </p>
                                    <p className="text-sm text-gray-600">Completion Rate</p>
                                </div>
                                
                                <div className="text-center">
                                    <p className="text-2xl font-bold text-blue-600">
                                        {detailedAnalysis.accuracy || 0}%
                                    </p>
                                    <p className="text-sm text-gray-600">Overall Accuracy</p>
                                </div>
                                
                                <div className="text-center">
                                    <p className="text-2xl font-bold text-purple-600">
                                        {detailedAnalysis.difficulty || 0}%
                                    </p>
                                    <p className="text-sm text-gray-600">Difficulty Level</p>
                                </div>
                            </div>
                            
                            {detailedAnalysis.metrics && (
                                <div>
                                    <h4 className="font-medium text-gray-900 mb-2">Performance Metrics</h4>
                                    <div className="space-y-3">
                                        {detailedAnalysis.metrics.map((metric, index) => (
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

            {/* Question Analysis */}
            {showQuestionAnalysis && questionAnalysis.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center space-x-2">
                            <FileText className="w-5 h-5" />
                            <span>Question Analysis</span>
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {questionAnalysis.map((question, index) => (
                                <div key={index} className="p-4 border rounded-lg">
                                    <div className="flex items-center justify-between mb-3">
                                        <div>
                                            <h4 className="font-medium text-gray-900">Question {question.questionNumber}</h4>
                                            <p className="text-sm text-gray-600">{question.type} • {question.points} points</p>
                                        </div>
                                        
                                        <div className="text-right">
                                            <p className={`text-2xl font-bold ${getPerformanceColor(question.accuracy)}`}>
                                                {question.accuracy}%
                                            </p>
                                            <Badge className={getPerformanceBadge(question.accuracy)}>
                                                {question.accuracy >= 70 ? 'Good' : 'Needs Attention'}
                                            </Badge>
                                        </div>
                                    </div>
                                    
                                    <div className="space-y-2">
                                        <div className="flex justify-between text-sm">
                                            <span className="text-gray-600">Average Time:</span>
                                            <span className="font-medium">{formatTime(question.averageTime)}</span>
                                        </div>
                                        
                                        <div className="flex justify-between text-sm">
                                            <span className="text-gray-600">Correct Answers:</span>
                                            <span className="font-medium">{question.correctAnswers}/{question.totalAttempts}</span>
                                        </div>
                                        
                                        <div className="flex justify-between text-sm">
                                            <span className="text-gray-600">Difficulty:</span>
                                            <span className="font-medium">{question.difficulty}</span>
                                        </div>
                                        
                                        <div className="flex justify-between text-sm">
                                            <span className="text-gray-600">Discrimination:</span>
                                            <span className="font-medium">{question.discrimination}</span>
                                        </div>
                                    </div>
                                    
                                    <div className="mt-3">
                                        <Progress value={question.accuracy} className="w-full" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Student Analysis */}
            {showStudentAnalysis && studentAnalysis.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center space-x-2">
                            <Users className="w-5 h-5" />
                            <span>Student Analysis</span>
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {studentAnalysis.map((student, index) => (
                                <div key={index} className="p-4 border rounded-lg">
                                    <div className="flex items-center justify-between mb-3">
                                        <div>
                                            <h4 className="font-medium text-gray-900">{student.studentName}</h4>
                                            <p className="text-sm text-gray-600">
                                                {student.batch} • {student.department}
                                            </p>
                                        </div>
                                        
                                        <div className="text-right">
                                            <p className={`text-2xl font-bold ${getPerformanceColor(student.score)}`}>
                                                {student.score}%
                                            </p>
                                            <Badge className={getPerformanceBadge(student.score)}>
                                                {student.score >= 70 ? 'Passed' : 'Failed'}
                                            </Badge>
                                        </div>
                                    </div>
                                    
                                    <div className="space-y-2">
                                        <div className="flex justify-between text-sm">
                                            <span className="text-gray-600">Time Spent:</span>
                                            <span className="font-medium">{formatTime(student.timeSpent)}</span>
                                        </div>
                                        
                                        <div className="flex justify-between text-sm">
                                            <span className="text-gray-600">Questions Answered:</span>
                                            <span className="font-medium">{student.questionsAnswered}/{student.totalQuestions}</span>
                                        </div>
                                        
                                        <div className="flex justify-between text-sm">
                                            <span className="text-gray-600">Accuracy:</span>
                                            <span className="font-medium">{student.accuracy}%</span>
                                        </div>
                                        
                                        <div className="flex justify-between text-sm">
                                            <span className="text-gray-600">Submitted:</span>
                                            <span className="font-medium">{formatDate(student.submittedAt)}</span>
                                        </div>
                                    </div>
                                    
                                    <div className="mt-3">
                                        <Progress value={student.score} className="w-full" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Time Analysis */}
            {showTimeAnalysis && timeAnalysis && (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center space-x-2">
                            <Clock className="w-5 h-5" />
                            <span>Time Analysis</span>
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="text-center">
                                    <p className="text-2xl font-bold text-green-600">
                                        {timeAnalysis.averageTime || 0}
                                    </p>
                                    <p className="text-sm text-gray-600">Average Time (minutes)</p>
                                </div>
                                
                                <div className="text-center">
                                    <p className="text-2xl font-bold text-blue-600">
                                        {timeAnalysis.fastestTime || 0}
                                    </p>
                                    <p className="text-sm text-gray-600">Fastest Time (minutes)</p>
                                </div>
                                
                                <div className="text-center">
                                    <p className="text-2xl font-bold text-purple-600">
                                        {timeAnalysis.slowestTime || 0}
                                    </p>
                                    <p className="text-sm text-gray-600">Slowest Time (minutes)</p>
                                </div>
                            </div>
                            
                            {timeAnalysis.timeDistribution && (
                                <div>
                                    <h4 className="font-medium text-gray-900 mb-2">Time Distribution</h4>
                                    <div className="space-y-2">
                                        {timeAnalysis.timeDistribution.map((item, index) => (
                                            <div key={index} className="flex items-center justify-between">
                                                <span className="text-sm text-gray-600">{item.range}</span>
                                                <div className="flex items-center space-x-2">
                                                    <Progress value={item.percentage} className="w-32" />
                                                    <span className="text-sm font-medium">{item.percentage}%</span>
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
                    onClick={() => downloadAssessmentReports('pdf')}
                    variant="outline"
                >
                    <Download className="w-4 h-4 mr-2" />
                    Download PDF
                </Button>
                
                <Button 
                    onClick={() => downloadAssessmentReports('excel')}
                    variant="outline"
                >
                    <Download className="w-4 h-4 mr-2" />
                    Download Excel
                </Button>
                
                <Button 
                    onClick={loadAssessmentPerformanceReports}
                    variant="outline"
                >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Refresh
                </Button>
            </div>
        </div>
    );
};

export default AssessmentPerformanceReports;
