import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { Alert, AlertDescription } from './ui/alert';
import { 
    Clock, 
    TrendingUp,
    TrendingDown,
    Target,
    Award,
    Star,
    Timer,
    Play,
    Pause,
    Stop,
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
    BookOpen,
    Brain,
    Zap
} from 'lucide-react';
import { toast } from 'react-hot-toast';

const TimeAnalysis = ({ 
    assessmentId,
    onTimeAnalysisViewed,
    showQuestionTypeAnalysis = true,
    showTimeDistribution = true,
    showEfficiencyMetrics = true,
    showPerformanceTrends = true
}) => {
    const [timeAnalysis, setTimeAnalysis] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [timeRange, setTimeRange] = useState('30d');
    const [selectedMetric, setSelectedMetric] = useState('overall');
    const [questionTypeAnalysis, setQuestionTypeAnalysis] = useState([]);
    const [timeDistribution, setTimeDistribution] = useState({});
    const [efficiencyMetrics, setEfficiencyMetrics] = useState({});
    const [performanceTrends, setPerformanceTrends] = useState({});

    useEffect(() => {
        loadTimeAnalysis();
    }, [assessmentId, timeRange]);

    const loadTimeAnalysis = async () => {
        try {
            setIsLoading(true);
            
            const response = await fetch('/api/analytics/time-analysis', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    assessmentId,
                    timeRange,
                    showQuestionTypeAnalysis,
                    showTimeDistribution,
                    showEfficiencyMetrics,
                    showPerformanceTrends
                })
            });

            if (!response.ok) throw new Error('Failed to load time analysis');
            
            const data = await response.json();
            setTimeAnalysis(data.timeAnalysis);
            setQuestionTypeAnalysis(data.questionTypeAnalysis || []);
            setTimeDistribution(data.timeDistribution);
            setEfficiencyMetrics(data.efficiencyMetrics);
            setPerformanceTrends(data.performanceTrends);
            
            if (onTimeAnalysisViewed) {
                onTimeAnalysisViewed(data);
            }
            
        } catch (error) {
            console.error('Error loading time analysis:', error);
            toast.error('Failed to load time analysis');
        } finally {
            setIsLoading(false);
        }
    };

    const getTimeColor = (time) => {
        if (time <= 30) return 'text-green-600';
        if (time <= 60) return 'text-blue-600';
        if (time <= 120) return 'text-yellow-600';
        if (time <= 300) return 'text-orange-600';
        return 'text-red-600';
    };

    const getTimeBadge = (time) => {
        if (time <= 30) return 'bg-green-100 text-green-800';
        if (time <= 60) return 'bg-blue-100 text-blue-800';
        if (time <= 120) return 'bg-yellow-100 text-yellow-800';
        if (time <= 300) return 'bg-orange-100 text-orange-800';
        return 'bg-red-100 text-red-800';
    };

    const getEfficiencyColor = (efficiency) => {
        if (efficiency >= 90) return 'text-green-600';
        if (efficiency >= 80) return 'text-blue-600';
        if (efficiency >= 70) return 'text-yellow-600';
        if (efficiency >= 60) return 'text-orange-600';
        return 'text-red-600';
    };

    const getEfficiencyBadge = (efficiency) => {
        if (efficiency >= 90) return 'bg-green-100 text-green-800';
        if (efficiency >= 80) return 'bg-blue-100 text-blue-800';
        if (efficiency >= 70) return 'bg-yellow-100 text-yellow-800';
        if (efficiency >= 60) return 'bg-orange-100 text-orange-800';
        return 'bg-red-100 text-red-800';
    };

    const getQuestionTypeIcon = (type) => {
        switch (type) {
            case 'mcq':
                return <Target className="w-4 h-4" />;
            case 'true-false':
                return <CheckCircle className="w-4 h-4" />;
            case 'short-answer':
                return <FileText className="w-4 h-4" />;
            case 'essay':
                return <BookOpen className="w-4 h-4" />;
            case 'fill-blanks':
                return <Edit className="w-4 h-4" />;
            case 'coding':
                return <Code className="w-4 h-4" />;
            default:
                return <Question className="w-4 h-4" />;
        }
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

    const downloadTimeAnalysis = async (format = 'pdf') => {
        try {
            const response = await fetch('/api/analytics/download-time-analysis', {
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
            a.download = `time_analysis_${format}_${Date.now()}.${format}`;
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

    if (!timeAnalysis) {
        return (
            <div className="text-center py-8">
                <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                <p className="text-gray-500">No time analysis data available</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="text-center">
                <h2 className="text-3xl font-bold text-gray-900">Time Analysis</h2>
                <p className="text-gray-600 mt-2">Analyze time spent on different question types and performance</p>
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

            {/* Time Analysis Overview */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center">
                            <div className="p-2 bg-blue-100 rounded-lg">
                                <Clock className="w-6 h-6 text-blue-600" />
                            </div>
                            <div className="ml-4">
                                <p className="text-sm font-medium text-gray-600">Total Time</p>
                                <p className="text-2xl font-bold text-gray-900">
                                    {formatTime(timeAnalysis.totalTime)}
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center">
                            <div className="p-2 bg-green-100 rounded-lg">
                                <Target className="w-6 h-6 text-green-600" />
                            </div>
                            <div className="ml-4">
                                <p className="text-sm font-medium text-gray-600">Average Time</p>
                                <p className="text-2xl font-bold text-gray-900">
                                    {formatTime(timeAnalysis.averageTime)}
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center">
                            <div className="p-2 bg-yellow-100 rounded-lg">
                                <TrendingUp className="w-6 h-6 text-yellow-600" />
                            </div>
                            <div className="ml-4">
                                <p className="text-sm font-medium text-gray-600">Efficiency</p>
                                <p className={`text-2xl font-bold ${getEfficiencyColor(timeAnalysis.efficiency)}`}>
                                    {timeAnalysis.efficiency}%
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
                                <p className="text-sm font-medium text-gray-600">Performance</p>
                                <p className="text-2xl font-bold text-gray-900">
                                    {timeAnalysis.performance}%
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Question Type Analysis */}
            {showQuestionTypeAnalysis && questionTypeAnalysis.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center space-x-2">
                            <PieChart className="w-5 h-5" />
                            <span>Question Type Analysis</span>
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {questionTypeAnalysis.map((type, index) => (
                                <div key={index} className="p-4 border rounded-lg">
                                    <div className="flex items-center justify-between mb-3">
                                        <div className="flex items-center space-x-3">
                                            {getQuestionTypeIcon(type.type)}
                                            <div>
                                                <h4 className="font-medium text-gray-900">{type.name}</h4>
                                                <p className="text-sm text-gray-600">{type.count} questions</p>
                                            </div>
                                        </div>
                                        
                                        <div className="text-right">
                                            <p className={`text-2xl font-bold ${getTimeColor(type.averageTime)}`}>
                                                {formatTime(type.averageTime)}
                                            </p>
                                            <Badge className={getTimeBadge(type.averageTime)}>
                                                {type.averageTime <= 30 ? 'Fast' : 
                                                 type.averageTime <= 60 ? 'Good' : 
                                                 type.averageTime <= 120 ? 'Average' : 
                                                 type.averageTime <= 300 ? 'Slow' : 'Very Slow'}
                                            </Badge>
                                        </div>
                                    </div>
                                    
                                    <div className="space-y-2">
                                        <div className="flex justify-between text-sm">
                                            <span className="text-gray-600">Total Time:</span>
                                            <span className="font-medium">{formatTime(type.totalTime)}</span>
                                        </div>
                                        
                                        <div className="flex justify-between text-sm">
                                            <span className="text-gray-600">Fastest Time:</span>
                                            <span className="font-medium">{formatTime(type.fastestTime)}</span>
                                        </div>
                                        
                                        <div className="flex justify-between text-sm">
                                            <span className="text-gray-600">Slowest Time:</span>
                                            <span className="font-medium">{formatTime(type.slowestTime)}</span>
                                        </div>
                                        
                                        <div className="flex justify-between text-sm">
                                            <span className="text-gray-600">Efficiency:</span>
                                            <span className="font-medium">{type.efficiency}%</span>
                                        </div>
                                    </div>
                                    
                                    <div className="mt-3">
                                        <Progress value={type.efficiency} className="w-full" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Time Distribution */}
            {showTimeDistribution && timeDistribution && (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center space-x-2">
                            <BarChart className="w-5 h-5" />
                            <span>Time Distribution</span>
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="text-center">
                                    <p className="text-2xl font-bold text-green-600">
                                        {timeDistribution.fastQuestions || 0}
                                    </p>
                                    <p className="text-sm text-gray-600">Fast Questions (&lt;1 min)</p>
                                </div>
                                
                                <div className="text-center">
                                    <p className="text-2xl font-bold text-blue-600">
                                        {timeDistribution.mediumQuestions || 0}
                                    </p>
                                    <p className="text-sm text-gray-600">Medium Questions (1-5 min)</p>
                                </div>
                                
                                <div className="text-center">
                                    <p className="text-2xl font-bold text-red-600">
                                        {timeDistribution.slowQuestions || 0}
                                    </p>
                                    <p className="text-sm text-gray-600">Slow Questions (&gt;5 min)</p>
                                </div>
                            </div>
                            
                            {timeDistribution.breakdown && (
                                <div>
                                    <h4 className="font-medium text-gray-900 mb-2">Time Breakdown</h4>
                                    <div className="space-y-2">
                                        {timeDistribution.breakdown.map((item, index) => (
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

            {/* Efficiency Metrics */}
            {showEfficiencyMetrics && efficiencyMetrics && (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center space-x-2">
                            <Zap className="w-5 h-5" />
                            <span>Efficiency Metrics</span>
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="text-center">
                                    <p className={`text-2xl font-bold ${getEfficiencyColor(efficiencyMetrics.overallEfficiency)}`}>
                                        {efficiencyMetrics.overallEfficiency}%
                                    </p>
                                    <p className="text-sm text-gray-600">Overall Efficiency</p>
                                </div>
                                
                                <div className="text-center">
                                    <p className={`text-2xl font-bold ${getEfficiencyColor(efficiencyMetrics.timeEfficiency)}`}>
                                        {efficiencyMetrics.timeEfficiency}%
                                    </p>
                                    <p className="text-sm text-gray-600">Time Efficiency</p>
                                </div>
                                
                                <div className="text-center">
                                    <p className={`text-2xl font-bold ${getEfficiencyColor(efficiencyMetrics.accuracyEfficiency)}`}>
                                        {efficiencyMetrics.accuracyEfficiency}%
                                    </p>
                                    <p className="text-sm text-gray-600">Accuracy Efficiency</p>
                                </div>
                            </div>
                            
                            {efficiencyMetrics.recommendations && (
                                <div>
                                    <h4 className="font-medium text-gray-900 mb-2">Efficiency Recommendations</h4>
                                    <div className="space-y-3">
                                        {efficiencyMetrics.recommendations.map((recommendation, index) => (
                                            <div key={index} className="flex items-start space-x-3 p-3 border rounded-lg">
                                                <Lightbulb className="w-5 h-5 text-yellow-500 mt-0.5" />
                                                <div>
                                                    <h5 className="font-medium text-gray-900">{recommendation.title}</h5>
                                                    <p className="text-sm text-gray-600">{recommendation.description}</p>
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

            {/* Performance Trends */}
            {showPerformanceTrends && performanceTrends && (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center space-x-2">
                            <LineChart className="w-5 h-5" />
                            <span>Performance Trends</span>
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="text-center">
                                    <p className="text-2xl font-bold text-green-600">
                                        {performanceTrends.improvementTrend || 0}%
                                    </p>
                                    <p className="text-sm text-gray-600">Improvement Trend</p>
                                </div>
                                
                                <div className="text-center">
                                    <p className="text-2xl font-bold text-blue-600">
                                        {performanceTrends.timeTrend || 0}%
                                    </p>
                                    <p className="text-sm text-gray-600">Time Trend</p>
                                </div>
                                
                                <div className="text-center">
                                    <p className="text-2xl font-bold text-purple-600">
                                        {performanceTrends.accuracyTrend || 0}%
                                    </p>
                                    <p className="text-sm text-gray-600">Accuracy Trend</p>
                                </div>
                            </div>
                            
                            {performanceTrends.trends && performanceTrends.trends.length > 0 && (
                                <div>
                                    <h4 className="font-medium text-gray-900 mb-2">Performance Trends</h4>
                                    <div className="space-y-3">
                                        {performanceTrends.trends.map((trend, index) => (
                                            <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                                                <div className="flex items-center space-x-3">
                                                    {trend.trend > 0 ? 
                                                        <TrendingUp className="w-4 h-4 text-green-500" /> :
                                                        <TrendingDown className="w-4 h-4 text-red-500" />
                                                    }
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
                    onClick={() => downloadTimeAnalysis('pdf')}
                    variant="outline"
                >
                    <Download className="w-4 h-4 mr-2" />
                    Download PDF
                </Button>
                
                <Button 
                    onClick={() => downloadTimeAnalysis('excel')}
                    variant="outline"
                >
                    <Download className="w-4 h-4 mr-2" />
                    Download Excel
                </Button>
                
                <Button 
                    onClick={loadTimeAnalysis}
                    variant="outline"
                >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Refresh
                </Button>
            </div>
        </div>
    );
};

export default TimeAnalysis;
