import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { Alert, AlertDescription } from './ui/alert';
import { 
    BookOpen, 
    TrendingUp, 
    TrendingDown,
    Target, 
    Award,
    Star,
    Clock,
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
    Book,
    Users
} from 'lucide-react';
import { toast } from 'react-hot-toast';

const SubjectAnalysis = ({ 
    studentId,
    onSubjectAnalysisViewed,
    showTopicPerformance = true,
    showStrengthsWeaknesses = true,
    showLearningPath = true,
    showRecommendations = true
}) => {
    const [subjectAnalysis, setSubjectAnalysis] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [timeRange, setTimeRange] = useState('30d');
    const [selectedSubject, setSelectedSubject] = useState('all');
    const [topicPerformance, setTopicPerformance] = useState({});
    const [strengthsWeaknesses, setStrengthsWeaknesses] = useState({});
    const [learningPath, setLearningPath] = useState([]);
    const [recommendations, setRecommendations] = useState([]);

    useEffect(() => {
        loadSubjectAnalysis();
    }, [studentId, timeRange, selectedSubject]);

    const loadSubjectAnalysis = async () => {
        try {
            setIsLoading(true);
            
            const response = await fetch('/api/student/subject-analysis', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    studentId,
                    timeRange,
                    selectedSubject,
                    showTopicPerformance,
                    showStrengthsWeaknesses,
                    showLearningPath,
                    showRecommendations
                })
            });

            if (!response.ok) throw new Error('Failed to load subject analysis');
            
            const data = await response.json();
            setSubjectAnalysis(data.subjectAnalysis);
            setTopicPerformance(data.topicPerformance);
            setStrengthsWeaknesses(data.strengthsWeaknesses);
            setLearningPath(data.learningPath || []);
            setRecommendations(data.recommendations || []);
            
            if (onSubjectAnalysisViewed) {
                onSubjectAnalysisViewed(data);
            }
            
        } catch (error) {
            console.error('Error loading subject analysis:', error);
            toast.error('Failed to load subject analysis');
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

    const downloadSubjectAnalysis = async (format = 'pdf') => {
        try {
            const response = await fetch('/api/student/download-subject-analysis', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    studentId,
                    format,
                    timeRange,
                    selectedSubject
                })
            });

            if (!response.ok) throw new Error('Download failed');
            
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `subject_analysis_${format}_${Date.now()}.${format}`;
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

    if (!subjectAnalysis) {
        return (
            <div className="text-center py-8">
                <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                <p className="text-gray-500">No subject analysis data available</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="text-center">
                <h2 className="text-3xl font-bold text-gray-900">Subject Analysis</h2>
                <p className="text-gray-600 mt-2">Analyze your performance by subject and topic</p>
            </div>

            {/* Time Range and Subject Selectors */}
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
                            <span className="text-sm font-medium text-gray-700">Subject:</span>
                            <select
                                value={selectedSubject}
                                onChange={(e) => setSelectedSubject(e.target.value)}
                                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            >
                                <option value="all">All Subjects</option>
                                {subjectAnalysis.subjects && subjectAnalysis.subjects.map((subject, index) => (
                                    <option key={index} value={subject.id}>{subject.name}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Subject Performance Overview */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center">
                            <div className="p-2 bg-blue-100 rounded-lg">
                                <BookOpen className="w-6 h-6 text-blue-600" />
                            </div>
                            <div className="ml-4">
                                <p className="text-sm font-medium text-gray-600">Total Subjects</p>
                                <p className="text-2xl font-bold text-gray-900">
                                    {subjectAnalysis.totalSubjects || 0}
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
                                <p className={`text-2xl font-bold ${getPerformanceColor(subjectAnalysis.averageScore)}`}>
                                    {subjectAnalysis.averageScore}%
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
                                    {formatTime(subjectAnalysis.totalStudyTime)}
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
                                    {subjectAnalysis.improvement}%
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Subject Performance Breakdown */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                        <BookOpen className="w-5 h-5" />
                        <span>Subject Performance</span>
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {subjectAnalysis.subjects && subjectAnalysis.subjects.map((subject, index) => (
                            <div key={index} className="p-4 border rounded-lg">
                                <div className="flex items-center justify-between mb-3">
                                    <div>
                                        <h4 className="font-medium text-gray-900">{subject.name}</h4>
                                        <p className="text-sm text-gray-600">
                                            {subject.assessments} assessments • {subject.topics} topics
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
                                        <span className="text-gray-600">Study Time:</span>
                                        <span className="font-medium">{formatTime(subject.studyTime)}</span>
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

            {/* Topic Performance */}
            {showTopicPerformance && topicPerformance && (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center space-x-2">
                            <Target className="w-5 h-5" />
                            <span>Topic Performance</span>
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {topicPerformance.topics && topicPerformance.topics.map((topic, index) => (
                                <div key={index} className="p-4 border rounded-lg">
                                    <div className="flex items-center justify-between mb-3">
                                        <div>
                                            <h4 className="font-medium text-gray-900">{topic.name}</h4>
                                            <p className="text-sm text-gray-600">{topic.description}</p>
                                        </div>
                                        
                                        <div className="text-right">
                                            <p className={`text-2xl font-bold ${getPerformanceColor(topic.score)}`}>
                                                {topic.score}%
                                            </p>
                                            <Badge className={getPerformanceBadge(topic.score)}>
                                                {topic.score >= 70 ? 'Mastered' : 'Needs Work'}
                                            </Badge>
                                        </div>
                                    </div>
                                    
                                    <div className="space-y-2">
                                        <div className="flex justify-between text-sm">
                                            <span className="text-gray-600">Questions:</span>
                                            <span className="font-medium">{topic.questions}</span>
                                        </div>
                                        
                                        <div className="flex justify-between text-sm">
                                            <span className="text-gray-600">Time Spent:</span>
                                            <span className="font-medium">{formatTime(topic.timeSpent)}</span>
                                        </div>
                                        
                                        <div className="flex justify-between text-sm">
                                            <span className="text-gray-600">Difficulty:</span>
                                            <span className="font-medium">{topic.difficulty}</span>
                                        </div>
                                    </div>
                                    
                                    <div className="mt-3">
                                        <Progress value={topic.score} className="w-full" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Strengths and Weaknesses */}
            {showStrengthsWeaknesses && strengthsWeaknesses && (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center space-x-2">
                            <Brain className="w-5 h-5" />
                            <span>Strengths & Weaknesses</span>
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <h4 className="font-medium text-green-800 mb-3">Strengths</h4>
                                <div className="space-y-2">
                                    {strengthsWeaknesses.strengths && strengthsWeaknesses.strengths.map((strength, index) => (
                                        <div key={index} className="flex items-center space-x-2 p-3 border rounded-lg bg-green-50">
                                            <CheckCircle className="w-4 h-4 text-green-600" />
                                            <div>
                                                <p className="font-medium text-green-900">{strength.topic}</p>
                                                <p className="text-sm text-green-700">{strength.description}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            
                            <div>
                                <h4 className="font-medium text-red-800 mb-3">Areas for Improvement</h4>
                                <div className="space-y-2">
                                    {strengthsWeaknesses.weaknesses && strengthsWeaknesses.weaknesses.map((weakness, index) => (
                                        <div key={index} className="flex items-center space-x-2 p-3 border rounded-lg bg-red-50">
                                            <XCircle className="w-4 h-4 text-red-600" />
                                            <div>
                                                <p className="font-medium text-red-900">{weakness.topic}</p>
                                                <p className="text-sm text-red-700">{weakness.description}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Learning Path */}
            {showLearningPath && learningPath.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center space-x-2">
                            <Book className="w-5 h-5" />
                            <span>Recommended Learning Path</span>
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {learningPath.map((step, index) => (
                                <div key={index} className="flex items-center space-x-4 p-4 border rounded-lg">
                                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                                        <span className="text-sm font-bold text-blue-600">{index + 1}</span>
                                    </div>
                                    
                                    <div className="flex-1">
                                        <h4 className="font-medium text-gray-900">{step.title}</h4>
                                        <p className="text-sm text-gray-600">{step.description}</p>
                                        <div className="flex items-center space-x-2 mt-2">
                                            <Badge className="bg-blue-100 text-blue-800">
                                                {step.type}
                                            </Badge>
                                            <span className="text-xs text-gray-500">
                                                {step.estimatedTime}
                                            </span>
                                        </div>
                                    </div>
                                    
                                    <div className="text-right">
                                        <p className="text-sm font-medium text-gray-900">{step.difficulty}</p>
                                        <p className="text-xs text-gray-500">Difficulty</p>
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
                            <span>Learning Recommendations</span>
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
                    onClick={() => downloadSubjectAnalysis('pdf')}
                    variant="outline"
                >
                    <Download className="w-4 h-4 mr-2" />
                    Download PDF
                </Button>
                
                <Button 
                    onClick={() => downloadSubjectAnalysis('excel')}
                    variant="outline"
                >
                    <Download className="w-4 h-4 mr-2" />
                    Download Excel
                </Button>
                
                <Button 
                    onClick={loadSubjectAnalysis}
                    variant="outline"
                >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Refresh
                </Button>
            </div>
        </div>
    );
};

export default SubjectAnalysis;
