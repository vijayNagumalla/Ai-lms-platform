import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { Alert, AlertDescription } from './ui/alert';
import { 
    BarChart3, 
    PieChart, 
    TrendingUp, 
    TrendingDown,
    Clock, 
    Target, 
    Award,
    Star,
    BookOpen,
    Brain,
    Zap,
    Download,
    RefreshCw,
    Filter,
    Calendar,
    Users,
    Activity
} from 'lucide-react';
import { toast } from 'react-hot-toast';

const PerformanceAnalytics = ({ 
    submissionId,
    assessmentId,
    studentId,
    onAnalyticsViewed,
    showTimeAnalysis = true,
    showSectionPerformance = true,
    showAccuracyAnalysis = true,
    showLearningInsights = true
}) => {
    const [analytics, setAnalytics] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [timeRange, setTimeRange] = useState('30d');
    const [selectedMetric, setSelectedMetric] = useState('overall');
    const [performanceInsights, setPerformanceInsights] = useState({});
    const [learningRecommendations, setLearningRecommendations] = useState([]);

    useEffect(() => {
        loadPerformanceAnalytics();
    }, [submissionId, timeRange]);

    const loadPerformanceAnalytics = async () => {
        try {
            setIsLoading(true);
            
            const response = await fetch('/api/assessment/performance-analytics', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    submissionId, 
                    assessmentId,
                    studentId,
                    timeRange,
                    showTimeAnalysis,
                    showSectionPerformance,
                    showAccuracyAnalysis,
                    showLearningInsights
                })
            });

            if (!response.ok) throw new Error('Failed to load performance analytics');
            
            const data = await response.json();
            setAnalytics(data.analytics);
            setPerformanceInsights(data.insights);
            setLearningRecommendations(data.recommendations || []);
            
            if (onAnalyticsViewed) {
                onAnalyticsViewed(data);
            }
            
        } catch (error) {
            console.error('Error loading performance analytics:', error);
            toast.error('Failed to load performance analytics');
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

    const formatTime = (minutes) => {
        if (minutes < 60) return `${minutes}m`;
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        return `${hours}h ${mins}m`;
    };

    const getTrendIcon = (trend) => {
        if (trend > 0) return <TrendingUp className="w-4 h-4 text-green-500" />;
        if (trend < 0) return <TrendingDown className="w-4 h-4 text-red-500" />;
        return <Target className="w-4 h-4 text-gray-500" />;
    };

    const downloadAnalytics = async (format = 'pdf') => {
        try {
            const response = await fetch('/api/assessment/download-analytics', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    submissionId, 
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
            a.download = `performance_analytics_${format}_${Date.now()}.${format}`;
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

    if (!analytics) {
        return (
            <div className="text-center py-8">
                <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                <p className="text-gray-500">No performance analytics available</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="text-center">
                <h2 className="text-3xl font-bold text-gray-900">Performance Analytics</h2>
                <p className="text-gray-600 mt-2">Detailed analysis of your assessment performance</p>
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

            {/* Overall Performance Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center">
                            <div className="p-2 bg-blue-100 rounded-lg">
                                <Target className="w-6 h-6 text-blue-600" />
                            </div>
                            <div className="ml-4">
                                <p className="text-sm font-medium text-gray-600">Overall Score</p>
                                <p className={`text-2xl font-bold ${getPerformanceColor(analytics.overallScore)}`}>
                                    {analytics.overallScore}%
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center">
                            <div className="p-2 bg-green-100 rounded-lg">
                                <Clock className="w-6 h-6 text-green-600" />
                            </div>
                            <div className="ml-4">
                                <p className="text-sm font-medium text-gray-600">Average Time</p>
                                <p className="text-2xl font-bold text-gray-900">
                                    {formatTime(analytics.averageTime)}
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
                                <p className="text-sm font-medium text-gray-600">Accuracy Rate</p>
                                <p className="text-2xl font-bold text-gray-900">
                                    {analytics.accuracyRate}%
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
                                    {analytics.improvement}%
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Time Analysis */}
            {showTimeAnalysis && analytics.timeAnalysis && (
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
                                    <p className="text-2xl font-bold text-blue-600">
                                        {formatTime(analytics.timeAnalysis.totalTime)}
                                    </p>
                                    <p className="text-sm text-gray-600">Total Time</p>
                                </div>
                                
                                <div className="text-center">
                                    <p className="text-2xl font-bold text-green-600">
                                        {formatTime(analytics.timeAnalysis.avgTimePerQuestion)}
                                    </p>
                                    <p className="text-sm text-gray-600">Avg per Question</p>
                                </div>
                                
                                <div className="text-center">
                                    <p className="text-2xl font-bold text-purple-600">
                                        {analytics.timeAnalysis.efficiency}%
                                    </p>
                                    <p className="text-sm text-gray-600">Time Efficiency</p>
                                </div>
                            </div>
                            
                            {analytics.timeAnalysis.timeDistribution && (
                                <div>
                                    <h4 className="font-medium text-gray-900 mb-2">Time Distribution</h4>
                                    <div className="space-y-2">
                                        {analytics.timeAnalysis.timeDistribution.map((item, index) => (
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

            {/* Section Performance */}
            {showSectionPerformance && analytics.sectionPerformance && (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center space-x-2">
                            <BarChart3 className="w-5 h-5" />
                            <span>Section Performance</span>
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {analytics.sectionPerformance.map((section, index) => (
                                <div key={index} className="p-4 border rounded-lg">
                                    <div className="flex items-center justify-between mb-3">
                                        <div>
                                            <h4 className="font-medium text-gray-900">{section.name}</h4>
                                            <p className="text-sm text-gray-600">
                                                {section.questions} questions • {section.points} points
                                            </p>
                                        </div>
                                        
                                        <div className="text-right">
                                            <p className={`text-2xl font-bold ${getPerformanceColor(section.score)}`}>
                                                {section.score}%
                                            </p>
                                            <Badge className={getPerformanceBadge(section.score)}>
                                                {section.score >= 70 ? 'Passed' : 'Failed'}
                                            </Badge>
                                        </div>
                                    </div>
                                    
                                    <div className="space-y-2">
                                        <div className="flex justify-between text-sm">
                                            <span className="text-gray-600">Correct Answers:</span>
                                            <span className="font-medium">{section.correctAnswers}</span>
                                        </div>
                                        
                                        <div className="flex justify-between text-sm">
                                            <span className="text-gray-600">Time Spent:</span>
                                            <span className="font-medium">{formatTime(section.timeSpent)}</span>
                                        </div>
                                        
                                        <div className="flex justify-between text-sm">
                                            <span className="text-gray-600">Average Time per Question:</span>
                                            <span className="font-medium">{formatTime(section.avgTimePerQuestion)}</span>
                                        </div>
                                    </div>
                                    
                                    <div className="mt-3">
                                        <Progress value={section.score} className="w-full" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Accuracy Analysis */}
            {showAccuracyAnalysis && analytics.accuracyAnalysis && (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center space-x-2">
                            <PieChart className="w-5 h-5" />
                            <span>Accuracy Analysis</span>
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <h4 className="font-medium text-gray-900 mb-3">Question Types</h4>
                                <div className="space-y-3">
                                    {analytics.accuracyAnalysis.questionTypes.map((type, index) => (
                                        <div key={index} className="flex items-center justify-between">
                                            <span className="text-sm text-gray-600">{type.name}</span>
                                            <div className="flex items-center space-x-2">
                                                <Progress value={type.accuracy} className="w-24" />
                                                <span className="text-sm font-medium">{type.accuracy}%</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            
                            <div>
                                <h4 className="font-medium text-gray-900 mb-3">Difficulty Levels</h4>
                                <div className="space-y-3">
                                    {analytics.accuracyAnalysis.difficultyLevels.map((level, index) => (
                                        <div key={index} className="flex items-center justify-between">
                                            <span className="text-sm text-gray-600">{level.name}</span>
                                            <div className="flex items-center space-x-2">
                                                <Progress value={level.accuracy} className="w-24" />
                                                <span className="text-sm font-medium">{level.accuracy}%</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Learning Insights */}
            {showLearningInsights && performanceInsights && (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center space-x-2">
                            <Brain className="w-5 h-5" />
                            <span>Learning Insights</span>
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {performanceInsights.strengths && performanceInsights.strengths.length > 0 && (
                                <div>
                                    <h4 className="font-medium text-green-800 mb-2">Strengths</h4>
                                    <div className="flex flex-wrap gap-2">
                                        {performanceInsights.strengths.map((strength, index) => (
                                            <Badge key={index} className="bg-green-100 text-green-800">
                                                {strength}
                                            </Badge>
                                        ))}
                                    </div>
                                </div>
                            )}
                            
                            {performanceInsights.weaknesses && performanceInsights.weaknesses.length > 0 && (
                                <div>
                                    <h4 className="font-medium text-red-800 mb-2">Areas for Improvement</h4>
                                    <div className="flex flex-wrap gap-2">
                                        {performanceInsights.weaknesses.map((weakness, index) => (
                                            <Badge key={index} className="bg-red-100 text-red-800">
                                                {weakness}
                                            </Badge>
                                        ))}
                                    </div>
                                </div>
                            )}
                            
                            {performanceInsights.recommendations && performanceInsights.recommendations.length > 0 && (
                                <div>
                                    <h4 className="font-medium text-blue-800 mb-2">Recommendations</h4>
                                    <ul className="list-disc list-inside space-y-1 text-sm text-gray-700">
                                        {performanceInsights.recommendations.map((rec, index) => (
                                            <li key={index}>{rec}</li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Learning Recommendations */}
            {learningRecommendations.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center space-x-2">
                            <Star className="w-5 h-5" />
                            <span>Learning Recommendations</span>
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {learningRecommendations.map((recommendation, index) => (
                                <div key={index} className="p-4 border rounded-lg hover:bg-gray-50">
                                    <div className="flex items-start space-x-3">
                                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                                            <BookOpen className="w-4 h-4 text-blue-600" />
                                        </div>
                                        <div className="flex-1">
                                            <h4 className="font-medium text-gray-900">{recommendation.title}</h4>
                                            <p className="text-sm text-gray-600 mt-1">{recommendation.description}</p>
                                            <div className="flex items-center space-x-2 mt-2">
                                                <Badge className="bg-blue-100 text-blue-800">
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
                    onClick={() => downloadAnalytics('pdf')}
                    variant="outline"
                >
                    <Download className="w-4 h-4 mr-2" />
                    Download PDF
                </Button>
                
                <Button 
                    onClick={() => downloadAnalytics('excel')}
                    variant="outline"
                >
                    <Download className="w-4 h-4 mr-2" />
                    Download Excel
                </Button>
                
                <Button 
                    onClick={loadPerformanceAnalytics}
                    variant="outline"
                >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Refresh
                </Button>
            </div>
        </div>
    );
};

export default PerformanceAnalytics;
