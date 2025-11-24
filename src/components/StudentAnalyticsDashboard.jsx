import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { 
    TrendingUp, 
    Target, 
    Clock, 
    Award, 
    BookOpen, 
    Calendar, 
    BarChart3, 
    PieChart,
    Trophy,
    Star,
    Zap,
    Brain,
    Timer,
    CheckCircle,
    AlertTriangle,
    Download,
    RefreshCw
} from 'lucide-react';
import { toast } from 'react-hot-toast';

const StudentAnalyticsDashboard = ({ userId }) => {
    const [analytics, setAnalytics] = useState(null);
    const [loading, setLoading] = useState(true);
    const [timeRange, setTimeRange] = useState('30d');
    const [activeTab, setActiveTab] = useState('overview');

    useEffect(() => {
        loadAnalytics();
    }, [timeRange]);

    const loadAnalytics = async () => {
        try {
            setLoading(true);
            const response = await fetch('/api/analytics/student-dashboard', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId, timeRange })
            });

            if (!response.ok) throw new Error('Failed to load analytics');
            
            const data = await response.json();
            setAnalytics(data);
        } catch (error) {
            console.error('Error loading analytics:', error);
            toast.error('Failed to load analytics');
        } finally {
            setLoading(false);
        }
    };

    const getPerformanceColor = (score) => {
        if (score >= 90) return 'text-green-600';
        if (score >= 70) return 'text-blue-600';
        if (score >= 50) return 'text-yellow-600';
        return 'text-red-600';
    };

    const getTrendIcon = (trend) => {
        if (trend > 0) return <TrendingUp className="w-4 h-4 text-green-500" />;
        if (trend < 0) return <TrendingUp className="w-4 h-4 text-red-500 rotate-180" />;
        return <TrendingUp className="w-4 h-4 text-gray-500" />;
    };

    const formatTime = (minutes) => {
        if (minutes < 60) return `${minutes}m`;
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        return `${hours}h ${mins}m`;
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    if (!analytics) {
        return (
            <div className="text-center py-8">
                <p className="text-gray-500">No analytics data available</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">My Analytics</h1>
                    <p className="text-gray-600 mt-1">Track your learning progress and performance</p>
                </div>
                <div className="flex gap-2">
                    <Select value={timeRange} onValueChange={setTimeRange}>
                        <SelectTrigger className="w-32">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="7d">Last 7 days</SelectItem>
                            <SelectItem value="30d">Last 30 days</SelectItem>
                            <SelectItem value="90d">Last 90 days</SelectItem>
                            <SelectItem value="1y">Last year</SelectItem>
                        </SelectContent>
                    </Select>
                    <Button variant="outline" onClick={loadAnalytics}>
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Refresh
                    </Button>
                </div>
            </div>

            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center">
                            <div className="p-2 bg-blue-100 rounded-lg">
                                <Target className="w-6 h-6 text-blue-600" />
                            </div>
                            <div className="ml-4">
                                <p className="text-sm font-medium text-gray-600">Average Score</p>
                                <p className={`text-2xl font-bold ${getPerformanceColor(analytics.overview.averageScore)}`}>
                                    {analytics.overview.averageScore}%
                                </p>
                                <div className="flex items-center mt-1">
                                    {getTrendIcon(analytics.overview.scoreTrend)}
                                    <span className="text-xs text-gray-500 ml-1">
                                        {analytics.overview.scoreTrend > 0 ? '+' : ''}{analytics.overview.scoreTrend}%
                                    </span>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center">
                            <div className="p-2 bg-green-100 rounded-lg">
                                <CheckCircle className="w-6 h-6 text-green-600" />
                            </div>
                            <div className="ml-4">
                                <p className="text-sm font-medium text-gray-600">Assessments Completed</p>
                                <p className="text-2xl font-bold text-gray-900">
                                    {analytics.overview.completedAssessments}
                                </p>
                                <div className="flex items-center mt-1">
                                    <span className="text-xs text-gray-500">
                                        {analytics.overview.completionRate}% completion rate
                                    </span>
                                </div>
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
                                <p className="text-sm font-medium text-gray-600">Total Study Time</p>
                                <p className="text-2xl font-bold text-gray-900">
                                    {formatTime(analytics.overview.totalStudyTime)}
                                </p>
                                <div className="flex items-center mt-1">
                                    <span className="text-xs text-gray-500">
                                        {formatTime(analytics.overview.averageTimePerAssessment)} avg per assessment
                                    </span>
                                </div>
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
                                <p className="text-sm font-medium text-gray-600">Achievements</p>
                                <p className="text-2xl font-bold text-gray-900">
                                    {analytics.overview.achievements}
                                </p>
                                <div className="flex items-center mt-1">
                                    <span className="text-xs text-gray-500">
                                        {analytics.overview.streak} day streak
                                    </span>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Analytics Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid w-full grid-cols-4">
                    <TabsTrigger value="overview">Overview</TabsTrigger>
                    <TabsTrigger value="performance">Performance</TabsTrigger>
                    <TabsTrigger value="subjects">Subjects</TabsTrigger>
                    <TabsTrigger value="progress">Progress</TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="space-y-6">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <Card>
                            <CardHeader>
                                <CardTitle>Performance Trends</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    {analytics.performanceTrends?.map((trend, index) => (
                                        <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                                            <div className="flex items-center space-x-3">
                                                <div className={`p-2 rounded-full ${
                                                    trend.trend > 0 ? 'bg-green-100 text-green-600' :
                                                    trend.trend < 0 ? 'bg-red-100 text-red-600' :
                                                    'bg-gray-100 text-gray-600'
                                                }`}>
                                                    {getTrendIcon(trend.trend)}
                                                </div>
                                                <div>
                                                    <p className="font-medium">{trend.period}</p>
                                                    <p className="text-sm text-gray-600">{trend.description}</p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className="font-bold">{trend.value}%</p>
                                                <p className="text-xs text-gray-500">
                                                    {trend.trend > 0 ? '+' : ''}{trend.trend}%
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>Recent Assessments</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    {analytics.recentAssessments?.map((assessment, index) => (
                                        <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                                            <div>
                                                <p className="font-medium">{assessment.title}</p>
                                                <p className="text-sm text-gray-600">
                                                    {new Date(assessment.completedAt).toLocaleDateString()}
                                                </p>
                                            </div>
                                            <div className="text-right">
                                                <p className={`font-bold ${getPerformanceColor(assessment.score)}`}>
                                                    {assessment.score}%
                                                </p>
                                                <Badge variant={assessment.score >= 70 ? 'default' : 'destructive'}>
                                                    {assessment.grade}
                                                </Badge>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>

                <TabsContent value="performance" className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Performance Analysis</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div className="text-center">
                                    <div className="text-3xl font-bold text-green-600">
                                        {analytics.performance?.excellentCount || 0}
                                    </div>
                                    <p className="text-sm text-gray-600">Excellent (90%+)</p>
                                </div>
                                <div className="text-center">
                                    <div className="text-3xl font-bold text-blue-600">
                                        {analytics.performance?.goodCount || 0}
                                    </div>
                                    <p className="text-sm text-gray-600">Good (70-89%)</p>
                                </div>
                                <div className="text-center">
                                    <div className="text-3xl font-bold text-red-600">
                                        {analytics.performance?.needsImprovementCount || 0}
                                    </div>
                                    <p className="text-sm text-gray-600">Needs Improvement (&lt;70%)</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Time Management</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {analytics.timeManagement?.map((item, index) => (
                                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                                        <div>
                                            <p className="font-medium">{item.questionType}</p>
                                            <p className="text-sm text-gray-600">{item.questions} questions</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-bold">{item.averageTime} min</p>
                                            <p className="text-sm text-gray-600">avg per question</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="subjects" className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Subject Analysis</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {analytics.subjectAnalysis?.map((subject, index) => (
                                    <div key={index} className="p-4 border rounded-lg">
                                        <div className="flex items-center justify-between mb-3">
                                            <h4 className="font-medium">{subject.name}</h4>
                                            <Badge variant={subject.performance >= 70 ? 'default' : 'destructive'}>
                                                {subject.performance}%
                                            </Badge>
                                        </div>
                                        
                                        <div className="space-y-2">
                                            <div className="flex justify-between text-sm">
                                                <span>Strengths</span>
                                                <span>{subject.strengths?.length || 0}</span>
                                            </div>
                                            <div className="flex justify-between text-sm">
                                                <span>Weaknesses</span>
                                                <span>{subject.weaknesses?.length || 0}</span>
                                            </div>
                                        </div>
                                        
                                        <div className="mt-3">
                                            <Progress value={subject.performance} className="w-full" />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="progress" className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Learning Progress</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {analytics.progressTracking?.map((milestone, index) => (
                                    <div key={index} className="flex items-center space-x-4 p-3 border rounded-lg">
                                        <div className={`p-2 rounded-full ${
                                            milestone.achieved ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'
                                        }`}>
                                            {milestone.achieved ? <CheckCircle className="w-5 h-5" /> : <Clock className="w-5 h-5" />}
                                        </div>
                                        <div className="flex-1">
                                            <p className="font-medium">{milestone.title}</p>
                                            <p className="text-sm text-gray-600">{milestone.description}</p>
                                        </div>
                                        {milestone.achieved && (
                                            <Badge variant="default">
                                                <Trophy className="w-3 h-3 mr-1" />
                                                Achieved
                                            </Badge>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Achievements</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {analytics.achievements?.map((achievement, index) => (
                                    <div key={index} className="p-4 border rounded-lg text-center">
                                        <div className={`w-12 h-12 mx-auto mb-3 rounded-full flex items-center justify-center ${
                                            achievement.unlocked ? 'bg-yellow-100 text-yellow-600' : 'bg-gray-100 text-gray-400'
                                        }`}>
                                            {achievement.icon === 'trophy' ? <Trophy className="w-6 h-6" /> :
                                             achievement.icon === 'star' ? <Star className="w-6 h-6" /> :
                                             achievement.icon === 'zap' ? <Zap className="w-6 h-6" /> :
                                             <Award className="w-6 h-6" />}
                                        </div>
                                        <h4 className="font-medium mb-1">{achievement.title}</h4>
                                        <p className="text-sm text-gray-600 mb-2">{achievement.description}</p>
                                        {achievement.unlocked ? (
                                            <Badge variant="default" className="bg-yellow-100 text-yellow-800">
                                                Unlocked
                                            </Badge>
                                        ) : (
                                            <Badge variant="outline">
                                                {achievement.progress}%
                                            </Badge>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>

            {/* Export Options */}
            <Card>
                <CardHeader>
                    <CardTitle>Export Analytics</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex flex-wrap gap-2">
                        <Button variant="outline" onClick={() => handleExport('pdf')}>
                            <Download className="w-4 h-4 mr-2" />
                            Export PDF Report
                        </Button>
                        <Button variant="outline" onClick={() => handleExport('excel')}>
                            <Download className="w-4 h-4 mr-2" />
                            Export Excel Data
                        </Button>
                        <Button variant="outline" onClick={() => handleExport('csv')}>
                            <Download className="w-4 h-4 mr-2" />
                            Export CSV Data
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );

    async function handleExport(format) {
        try {
            const response = await fetch('/api/analytics/export-student', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId, format, timeRange })
            });

            if (!response.ok) throw new Error('Export failed');

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `student_analytics_${format}_${Date.now()}.${format}`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);

            toast.success(`${format.toUpperCase()} export completed`);
        } catch (error) {
            console.error('Export error:', error);
            toast.error('Export failed');
        }
    }
};

export default StudentAnalyticsDashboard;
