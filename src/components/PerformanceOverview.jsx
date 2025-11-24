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
    AlertTriangle
} from 'lucide-react';
import { toast } from 'react-hot-toast';

const PerformanceOverview = ({ 
    studentId,
    onPerformanceViewed,
    showMetrics = true,
    showImprovementTrends = true,
    showAchievements = true,
    showRecommendations = true
}) => {
    const [performance, setPerformance] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [timeRange, setTimeRange] = useState('30d');
    const [selectedMetric, setSelectedMetric] = useState('overall');
    const [improvementTrends, setImprovementTrends] = useState({});
    const [achievements, setAchievements] = useState([]);
    const [recommendations, setRecommendations] = useState([]);

    useEffect(() => {
        loadPerformanceOverview();
    }, [studentId, timeRange]);

    const loadPerformanceOverview = async () => {
        try {
            setIsLoading(true);
            
            const response = await fetch('/api/student/performance-overview', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    studentId,
                    timeRange,
                    showMetrics,
                    showImprovementTrends,
                    showAchievements,
                    showRecommendations
                })
            });

            if (!response.ok) throw new Error('Failed to load performance overview');
            
            const data = await response.json();
            setPerformance(data.performance);
            setImprovementTrends(data.improvementTrends);
            setAchievements(data.achievements || []);
            setRecommendations(data.recommendations || []);
            
            if (onPerformanceViewed) {
                onPerformanceViewed(data);
            }
            
        } catch (error) {
            console.error('Error loading performance overview:', error);
            toast.error('Failed to load performance overview');
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

    const downloadPerformance = async (format = 'pdf') => {
        try {
            const response = await fetch('/api/student/download-performance', {
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
            a.download = `performance_overview_${format}_${Date.now()}.${format}`;
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

    if (!performance) {
        return (
            <div className="text-center py-8">
                <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                <p className="text-gray-500">No performance data available</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="text-center">
                <h2 className="text-3xl font-bold text-gray-900">Performance Overview</h2>
                <p className="text-gray-600 mt-2">Track your academic progress and achievements</p>
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

            {/* Performance Metrics */}
            {showMetrics && (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <Card>
                        <CardContent className="p-6">
                            <div className="flex items-center">
                                <div className="p-2 bg-blue-100 rounded-lg">
                                    <Target className="w-6 h-6 text-blue-600" />
                                </div>
                                <div className="ml-4">
                                    <p className="text-sm font-medium text-gray-600">Overall Score</p>
                                    <p className={`text-2xl font-bold ${getPerformanceColor(performance.overallScore)}`}>
                                        {performance.overallScore}%
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
                                    <p className="text-sm font-medium text-gray-600">Assessments</p>
                                    <p className="text-2xl font-bold text-gray-900">
                                        {performance.totalAssessments}
                                    </p>
                                </div>
                            </div>
                        </div>
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
                                        {formatTime(performance.averageTime)}
                                    </p>
                                </div>
                            </div>
                        </div>
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
                                        {performance.improvement}%
                                    </p>
                                </div>
                            </div>
                        </div>
                    </Card>
                </div>
            )}

            {/* Improvement Trends */}
            {showImprovementTrends && improvementTrends && (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center space-x-2">
                            <BarChart3 className="w-5 h-5" />
                            <span>Improvement Trends</span>
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="text-center">
                                    <p className="text-2xl font-bold text-green-600">
                                        {improvementTrends.scoreImprovement || 0}%
                                    </p>
                                    <p className="text-sm text-gray-600">Score Improvement</p>
                                </div>
                                
                                <div className="text-center">
                                    <p className="text-2xl font-bold text-blue-600">
                                        {improvementTrends.timeImprovement || 0}%
                                    </p>
                                    <p className="text-sm text-gray-600">Time Efficiency</p>
                                </div>
                                
                                <div className="text-center">
                                    <p className="text-2xl font-bold text-purple-600">
                                        {improvementTrends.accuracyImprovement || 0}%
                                    </p>
                                    <p className="text-sm text-gray-600">Accuracy Improvement</p>
                                </div>
                            </div>
                            
                            {improvementTrends.trends && improvementTrends.trends.length > 0 && (
                                <div>
                                    <h4 className="font-medium text-gray-900 mb-2">Performance Trends</h4>
                                    <div className="space-y-3">
                                        {improvementTrends.trends.map((trend, index) => (
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

            {/* Subject Performance */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                        <BookOpen className="w-5 h-5" />
                        <span>Subject Performance</span>
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {performance.subjects && performance.subjects.map((subject, index) => (
                            <div key={index} className="p-4 border rounded-lg">
                                <div className="flex items-center justify-between mb-3">
                                    <div>
                                        <h4 className="font-medium text-gray-900">{subject.name}</h4>
                                        <p className="text-sm text-gray-600">
                                            {subject.assessments} assessments
                                        </p>
                                    </div>
                                    
                                    <div className="text-right">
                                        <p className={`text-2xl font-bold ${getPerformanceColor(subject.score)}`}>
                                            {subject.score}%
                                        </p>
                                        <Badge className={getPerformanceBadge(subject.score)}>
                                            {subject.score >= 70 ? 'Passed' : 'Failed'}
                                        </Badge>
                                    </div>
                                </div>
                                
                                <div className="space-y-2">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-600">Average Time:</span>
                                        <span className="font-medium">{formatTime(subject.averageTime)}</span>
                                    </div>
                                    
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-600">Accuracy:</span>
                                        <span className="font-medium">{subject.accuracy}%</span>
                                    </div>
                                    
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-600">Improvement:</span>
                                        <span className="font-medium">{subject.improvement}%</span>
                                    </div>
                                </div>
                                
                                <div className="mt-3">
                                    <Progress value={subject.score} className="w-full" />
                                </div>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>

            {/* Achievements */}
            {showAchievements && achievements.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center space-x-2">
                            <Trophy className="w-5 h-5" />
                            <span>Achievements</span>
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {achievements.map((achievement, index) => (
                                <div key={index} className="text-center p-4 border rounded-lg">
                                    <div className="w-12 h-12 mx-auto mb-3 bg-yellow-100 rounded-full flex items-center justify-center">
                                        <Star className="w-6 h-6 text-yellow-600" />
                                    </div>
                                    <h4 className="font-medium text-gray-900">{achievement.title}</h4>
                                    <p className="text-sm text-gray-600">{achievement.description}</p>
                                    <div className="mt-2">
                                        <Badge className="bg-yellow-100 text-yellow-800">
                                            {achievement.type}
                                        </Badge>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Recommendations */}
            {showRecommendations && recommendations.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center space-x-2">
                            <Brain className="w-5 h-5" />
                            <span>Recommendations</span>
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {recommendations.map((recommendation, index) => (
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
                    onClick={() => downloadPerformance('pdf')}
                    variant="outline"
                >
                    <Download className="w-4 h-4 mr-2" />
                    Download PDF
                </Button>
                
                <Button 
                    onClick={() => downloadPerformance('excel')}
                    variant="outline"
                >
                    <Download className="w-4 h-4 mr-2" />
                    Download Excel
                </Button>
                
                <Button 
                    onClick={loadPerformanceOverview}
                    variant="outline"
                >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Refresh
                </Button>
            </div>
        </div>
    );
};

export default PerformanceOverview;
