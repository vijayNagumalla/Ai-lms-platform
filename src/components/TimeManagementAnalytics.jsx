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
    Activity,
    Zap,
    Download,
    RefreshCw,
    Filter,
    Calendar,
    Timer,
    BarChart3,
    PieChart,
    Brain,
    CheckCircle,
    XCircle,
    AlertTriangle,
    Lightbulb
} from 'lucide-react';
import { toast } from 'react-hot-toast';

const TimeManagementAnalytics = ({ 
    studentId,
    onTimeManagementViewed,
    showQuestionTypeAnalysis = true,
    showTimeDistribution = true,
    showEfficiencyMetrics = true,
    showRecommendations = true
}) => {
    const [timeManagement, setTimeManagement] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [timeRange, setTimeRange] = useState('30d');
    const [selectedMetric, setSelectedMetric] = useState('overall');
    const [questionTypeAnalysis, setQuestionTypeAnalysis] = useState({});
    const [timeDistribution, setTimeDistribution] = useState({});
    const [efficiencyMetrics, setEfficiencyMetrics] = useState({});
    const [recommendations, setRecommendations] = useState([]);

    useEffect(() => {
        loadTimeManagementAnalytics();
    }, [studentId, timeRange]);

    const loadTimeManagementAnalytics = async () => {
        try {
            setIsLoading(true);
            
            const response = await fetch('/api/student/time-management-analytics', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    studentId,
                    timeRange,
                    showQuestionTypeAnalysis,
                    showTimeDistribution,
                    showEfficiencyMetrics,
                    showRecommendations
                })
            });

            if (!response.ok) throw new Error('Failed to load time management analytics');
            
            const data = await response.json();
            setTimeManagement(data.timeManagement);
            setQuestionTypeAnalysis(data.questionTypeAnalysis);
            setTimeDistribution(data.timeDistribution);
            setEfficiencyMetrics(data.efficiencyMetrics);
            setRecommendations(data.recommendations || []);
            
            if (onTimeManagementViewed) {
                onTimeManagementViewed(data);
            }
            
        } catch (error) {
            console.error('Error loading time management analytics:', error);
            toast.error('Failed to load time management analytics');
        } finally {
            setIsLoading(false);
        }
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

    const downloadTimeManagement = async (format = 'pdf') => {
        try {
            const response = await fetch('/api/student/download-time-management', {
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
            a.download = `time_management_${format}_${Date.now()}.${format}`;
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

    if (!timeManagement) {
        return (
            <div className="text-center py-8">
                <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                <p className="text-gray-500">No time management data available</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="text-center">
                <h2 className="text-3xl font-bold text-gray-900">Time Management Analytics</h2>
                <p className="text-gray-600 mt-2">Analyze your time usage and efficiency across different question types</p>
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

            {/* Time Management Overview */}
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
                                    {formatTime(timeManagement.totalTime)}
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center">
                            <div className="p-2 bg-green-100 rounded-lg">
                                <Zap className="w-6 h-6 text-green-600" />
                            </div>
                            <div className="ml-4">
                                <p className="text-sm font-medium text-gray-600">Efficiency</p>
                                <p className={`text-2xl font-bold ${getEfficiencyColor(timeManagement.efficiency)}`}>
                                    {timeManagement.efficiency}%
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center">
                            <div className="p-2 bg-purple-100 rounded-lg">
                                <Target className="w-6 h-6 text-purple-600" />
                            </div>
                            <div className="ml-4">
                                <p className="text-sm font-medium text-gray-600">Avg per Question</p>
                                <p className="text-2xl font-bold text-gray-900">
                                    {formatTime(timeManagement.averageTimePerQuestion)}
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
                                    {timeManagement.improvement}%
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Question Type Analysis */}
            {showQuestionTypeAnalysis && questionTypeAnalysis && (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center space-x-2">
                            <BarChart3 className="w-5 h-5" />
                            <span>Question Type Analysis</span>
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {questionTypeAnalysis.types && questionTypeAnalysis.types.map((type, index) => (
                                <div key={index} className="p-4 border rounded-lg">
                                    <div className="flex items-center justify-between mb-3">
                                        <div>
                                            <h4 className="font-medium text-gray-900">{type.name}</h4>
                                            <p className="text-sm text-gray-600">
                                                {type.questions} questions • {type.accuracy}% accuracy
                                            </p>
                                        </div>
                                        
                                        <div className="text-right">
                                            <p className="text-2xl font-bold text-gray-900">
                                                {formatTime(type.averageTime)}
                                            </p>
                                            <Badge className={getEfficiencyBadge(type.efficiency)}>
                                                {type.efficiency}% efficient
                                            </Badge>
                                        </div>
                                    </div>
                                    
                                    <div className="space-y-2">
                                        <div className="flex justify-between text-sm">
                                            <span className="text-gray-600">Total Time:</span>
                                            <span className="font-medium">{formatTime(type.totalTime)}</span>
                                        </div>
                                        
                                        <div className="flex justify-between text-sm">
                                            <span className="text-gray-600">Efficiency:</span>
                                            <span className="font-medium">{type.efficiency}%</span>
                                        </div>
                                        
                                        <div className="flex justify-between text-sm">
                                            <span className="text-gray-600">Trend:</span>
                                            <div className="flex items-center space-x-1">
                                                {getTrendIcon(type.trend)}
                                                <span className="font-medium">
                                                    {type.trend > 0 ? '+' : ''}{type.trend}%
                                                </span>
                                            </div>
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
                            <PieChart className="w-5 h-5" />
                            <span>Time Distribution</span>
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="text-center">
                                    <p className="text-2xl font-bold text-blue-600">
                                        {timeDistribution.assessmentTime || 0}%
                                    </p>
                                    <p className="text-sm text-gray-600">Assessment Time</p>
                                </div>
                                
                                <div className="text-center">
                                    <p className="text-2xl font-bold text-green-600">
                                        {timeDistribution.studyTime || 0}%
                                    </p>
                                    <p className="text-sm text-gray-600">Study Time</p>
                                </div>
                                
                                <div className="text-center">
                                    <p className="text-2xl font-bold text-purple-600">
                                        {timeDistribution.reviewTime || 0}%
                                    </p>
                                    <p className="text-sm text-gray-600">Review Time</p>
                                </div>
                            </div>
                            
                            {timeDistribution.breakdown && (
                                <div>
                                    <h4 className="font-medium text-gray-900 mb-2">Time Breakdown</h4>
                                    <div className="space-y-2">
                                        {timeDistribution.breakdown.map((item, index) => (
                                            <div key={index} className="flex items-center justify-between">
                                                <span className="text-sm text-gray-600">{item.category}</span>
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
                            <Activity className="w-5 h-5" />
                            <span>Efficiency Metrics</span>
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="text-center">
                                    <p className="text-2xl font-bold text-green-600">
                                        {efficiencyMetrics.overallEfficiency || 0}%
                                    </p>
                                    <p className="text-sm text-gray-600">Overall Efficiency</p>
                                </div>
                                
                                <div className="text-center">
                                    <p className="text-2xl font-bold text-blue-600">
                                        {efficiencyMetrics.timeOptimization || 0}%
                                    </p>
                                    <p className="text-sm text-gray-600">Time Optimization</p>
                                </div>
                                
                                <div className="text-center">
                                    <p className="text-2xl font-bold text-purple-600">
                                        {efficiencyMetrics.focusScore || 0}%
                                    </p>
                                    <p className="text-sm text-gray-600">Focus Score</p>
                                </div>
                            </div>
                            
                            {efficiencyMetrics.metrics && (
                                <div>
                                    <h4 className="font-medium text-gray-900 mb-2">Detailed Metrics</h4>
                                    <div className="space-y-3">
                                        {efficiencyMetrics.metrics.map((metric, index) => (
                                            <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                                                <div className="flex items-center space-x-3">
                                                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                                                        <Timer className="w-4 h-4 text-blue-600" />
                                                    </div>
                                                    <div>
                                                        <h5 className="font-medium text-gray-900">{metric.name}</h5>
                                                        <p className="text-sm text-gray-600">{metric.description}</p>
                                                    </div>
                                                </div>
                                                
                                                <div className="text-right">
                                                    <p className="font-bold text-gray-900">{metric.value}%</p>
                                                    <Badge className={getEfficiencyBadge(metric.value)}>
                                                        {metric.status}
                                                    </Badge>
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
                            <span>Time Management Recommendations</span>
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
                    onClick={() => downloadTimeManagement('pdf')}
                    variant="outline"
                >
                    <Download className="w-4 h-4 mr-2" />
                    Download PDF
                </Button>
                
                <Button 
                    onClick={() => downloadTimeManagement('excel')}
                    variant="outline"
                >
                    <Download className="w-4 h-4 mr-2" />
                    Download Excel
                </Button>
                
                <Button 
                    onClick={loadTimeManagementAnalytics}
                    variant="outline"
                >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Refresh
                </Button>
            </div>
        </div>
    );
};

export default TimeManagementAnalytics;
