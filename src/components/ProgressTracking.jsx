import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { Alert, AlertDescription } from './ui/alert';
import { 
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
    BarChart3,
    LineChart,
    PieChart,
    Users,
    Book,
    GraduationCap
} from 'lucide-react';
import { toast } from 'react-hot-toast';

const ProgressTracking = ({ 
    studentId,
    onProgressTrackingViewed,
    showLearningCurve = true,
    showSkillDevelopment = true,
    showMilestones = true,
    showRecommendations = true
}) => {
    const [progressTracking, setProgressTracking] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [timeRange, setTimeRange] = useState('30d');
    const [selectedMetric, setSelectedMetric] = useState('overall');
    const [learningCurve, setLearningCurve] = useState({});
    const [skillDevelopment, setSkillDevelopment] = useState({});
    const [milestones, setMilestones] = useState([]);
    const [recommendations, setRecommendations] = useState([]);

    useEffect(() => {
        loadProgressTracking();
    }, [studentId, timeRange]);

    const loadProgressTracking = async () => {
        try {
            setIsLoading(true);
            
            const response = await fetch('/api/student/progress-tracking', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    studentId,
                    timeRange,
                    showLearningCurve,
                    showSkillDevelopment,
                    showMilestones,
                    showRecommendations
                })
            });

            if (!response.ok) throw new Error('Failed to load progress tracking');
            
            const data = await response.json();
            setProgressTracking(data.progressTracking);
            setLearningCurve(data.learningCurve);
            setSkillDevelopment(data.skillDevelopment);
            setMilestones(data.milestones || []);
            setRecommendations(data.recommendations || []);
            
            if (onProgressTrackingViewed) {
                onProgressTrackingViewed(data);
            }
            
        } catch (error) {
            console.error('Error loading progress tracking:', error);
            toast.error('Failed to load progress tracking');
        } finally {
            setIsLoading(false);
        }
    };

    const getProgressColor = (progress) => {
        if (progress >= 90) return 'text-green-600';
        if (progress >= 80) return 'text-blue-600';
        if (progress >= 70) return 'text-yellow-600';
        if (progress >= 60) return 'text-orange-600';
        return 'text-red-600';
    };

    const getProgressBadge = (progress) => {
        if (progress >= 90) return 'bg-green-100 text-green-800';
        if (progress >= 80) return 'bg-blue-100 text-blue-800';
        if (progress >= 70) return 'bg-yellow-100 text-yellow-800';
        if (progress >= 60) return 'bg-orange-100 text-orange-800';
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

    const downloadProgressTracking = async (format = 'pdf') => {
        try {
            const response = await fetch('/api/student/download-progress-tracking', {
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
            a.download = `progress_tracking_${format}_${Date.now()}.${format}`;
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

    if (!progressTracking) {
        return (
            <div className="text-center py-8">
                <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                <p className="text-gray-500">No progress tracking data available</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="text-center">
                <h2 className="text-3xl font-bold text-gray-900">Progress Tracking</h2>
                <p className="text-gray-600 mt-2">Track your learning curve and skill development</p>
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

            {/* Progress Overview */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center">
                            <div className="p-2 bg-blue-100 rounded-lg">
                                <Target className="w-6 h-6 text-blue-600" />
                            </div>
                            <div className="ml-4">
                                <p className="text-sm font-medium text-gray-600">Overall Progress</p>
                                <p className={`text-2xl font-bold ${getProgressColor(progressTracking.overallProgress)}`}>
                                    {progressTracking.overallProgress}%
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
                                <p className="text-sm font-medium text-gray-600">Skills Mastered</p>
                                <p className="text-2xl font-bold text-gray-900">
                                    {progressTracking.skillsMastered}
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
                                <p className="text-sm font-medium text-gray-600">Study Time</p>
                                <p className="text-2xl font-bold text-gray-900">
                                    {formatTime(progressTracking.totalStudyTime)}
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
                                    {progressTracking.improvement}%
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Learning Curve */}
            {showLearningCurve && learningCurve && (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center space-x-2">
                            <LineChart className="w-5 h-5" />
                            <span>Learning Curve</span>
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="text-center">
                                    <p className="text-2xl font-bold text-green-600">
                                        {learningCurve.learningRate || 0}%
                                    </p>
                                    <p className="text-sm text-gray-600">Learning Rate</p>
                                </div>
                                
                                <div className="text-center">
                                    <p className="text-2xl font-bold text-blue-600">
                                        {learningCurve.retentionRate || 0}%
                                    </p>
                                    <p className="text-sm text-gray-600">Retention Rate</p>
                                </div>
                                
                                <div className="text-center">
                                    <p className="text-2xl font-bold text-purple-600">
                                        {learningCurve.applicationRate || 0}%
                                    </p>
                                    <p className="text-sm text-gray-600">Application Rate</p>
                                </div>
                            </div>
                            
                            {learningCurve.curveData && learningCurve.curveData.length > 0 && (
                                <div>
                                    <h4 className="font-medium text-gray-900 mb-2">Learning Progress</h4>
                                    <div className="space-y-3">
                                        {learningCurve.curveData.map((point, index) => (
                                            <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                                                <div className="flex items-center space-x-3">
                                                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                                                        <span className="text-sm font-bold text-blue-600">{index + 1}</span>
                                                    </div>
                                                    <div>
                                                        <h5 className="font-medium text-gray-900">{point.period}</h5>
                                                        <p className="text-sm text-gray-600">{point.description}</p>
                                                    </div>
                                                </div>
                                                
                                                <div className="text-right">
                                                    <p className="font-bold text-gray-900">{point.progress}%</p>
                                                    <div className="flex items-center space-x-1">
                                                        {getTrendIcon(point.trend)}
                                                        <span className="text-xs text-gray-500">
                                                            {point.trend > 0 ? '+' : ''}{point.trend}%
                                                        </span>
                                                    </div>
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

            {/* Skill Development */}
            {showSkillDevelopment && skillDevelopment && (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center space-x-2">
                            <Brain className="w-5 h-5" />
                            <span>Skill Development</span>
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {skillDevelopment.skills && skillDevelopment.skills.map((skill, index) => (
                                <div key={index} className="p-4 border rounded-lg">
                                    <div className="flex items-center justify-between mb-3">
                                        <div>
                                            <h4 className="font-medium text-gray-900">{skill.name}</h4>
                                            <p className="text-sm text-gray-600">{skill.description}</p>
                                        </div>
                                        
                                        <div className="text-right">
                                            <p className={`text-2xl font-bold ${getProgressColor(skill.progress)}`}>
                                                {skill.progress}%
                                            </p>
                                            <Badge className={getProgressBadge(skill.progress)}>
                                                {skill.level}
                                            </Badge>
                                        </div>
                                    </div>
                                    
                                    <div className="space-y-2">
                                        <div className="flex justify-between text-sm">
                                            <span className="text-gray-600">Time Invested:</span>
                                            <span className="font-medium">{formatTime(skill.timeInvested)}</span>
                                        </div>
                                        
                                        <div className="flex justify-between text-sm">
                                            <span className="text-gray-600">Practice Sessions:</span>
                                            <span className="font-medium">{skill.practiceSessions}</span>
                                        </div>
                                        
                                        <div className="flex justify-between text-sm">
                                            <span className="text-gray-600">Improvement:</span>
                                            <span className="font-medium">{skill.improvement}%</span>
                                        </div>
                                    </div>
                                    
                                    <div className="mt-3">
                                        <Progress value={skill.progress} className="w-full" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Milestones */}
            {showMilestones && milestones.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center space-x-2">
                            <Trophy className="w-5 h-5" />
                            <span>Learning Milestones</span>
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {milestones.map((milestone, index) => (
                                <div key={index} className="flex items-center space-x-4 p-4 border rounded-lg">
                                    <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                                        milestone.achieved ? 'bg-green-100' : 'bg-gray-100'
                                    }`}>
                                        {milestone.achieved ? (
                                            <CheckCircle className="w-6 h-6 text-green-600" />
                                        ) : (
                                            <Target className="w-6 h-6 text-gray-600" />
                                        )}
                                    </div>
                                    
                                    <div className="flex-1">
                                        <h4 className="font-medium text-gray-900">{milestone.title}</h4>
                                        <p className="text-sm text-gray-600">{milestone.description}</p>
                                        <div className="flex items-center space-x-2 mt-2">
                                            <Badge className={
                                                milestone.achieved ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                                            }>
                                                {milestone.achieved ? 'Achieved' : 'In Progress'}
                                            </Badge>
                                            <span className="text-xs text-gray-500">
                                                {milestone.achieved ? `Achieved on ${formatDate(milestone.achievedAt)}` : `Target: ${formatDate(milestone.targetDate)}`}
                                            </span>
                                        </div>
                                    </div>
                                    
                                    <div className="text-right">
                                        <p className="text-sm font-medium text-gray-900">{milestone.progress}%</p>
                                        <p className="text-xs text-gray-500">Progress</p>
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
                            <Lightbulb className="w-5 h-5" />
                            <span>Progress Recommendations</span>
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
                    onClick={() => downloadProgressTracking('pdf')}
                    variant="outline"
                >
                    <Download className="w-4 h-4 mr-2" />
                    Download PDF
                </Button>
                
                <Button 
                    onClick={() => downloadProgressTracking('excel')}
                    variant="outline"
                >
                    <Download className="w-4 h-4 mr-2" />
                    Download Excel
                </Button>
                
                <Button 
                    onClick={loadProgressTracking}
                    variant="outline"
                >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Refresh
                </Button>
            </div>
        </div>
    );
};

export default ProgressTracking;
