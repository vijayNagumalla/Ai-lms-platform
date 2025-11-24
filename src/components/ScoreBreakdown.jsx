import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { Alert, AlertDescription } from './ui/alert';
import { 
    BarChart3, 
    PieChart, 
    Target, 
    TrendingUp, 
    TrendingDown,
    CheckCircle, 
    XCircle, 
    Clock, 
    Award,
    Star,
    Download,
    Eye,
    EyeOff,
    RefreshCw
} from 'lucide-react';
import { toast } from 'react-hot-toast';

const ScoreBreakdown = ({ 
    submissionId,
    assessmentId,
    onBreakdownViewed,
    showSectionScores = true,
    showQuestionScores = true,
    showTimeAnalysis = true,
    showPerformanceTrends = true
}) => {
    const [breakdown, setBreakdown] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [showDetails, setShowDetails] = useState(false);
    const [selectedSection, setSelectedSection] = useState(null);
    const [performanceTrends, setPerformanceTrends] = useState({});
    const [timeAnalysis, setTimeAnalysis] = useState({});

    useEffect(() => {
        loadScoreBreakdown();
    }, [submissionId]);

    const loadScoreBreakdown = async () => {
        try {
            setIsLoading(true);
            
            const response = await fetch('/api/assessment/score-breakdown', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ submissionId, assessmentId })
            });

            if (!response.ok) throw new Error('Failed to load score breakdown');
            
            const data = await response.json();
            setBreakdown(data.breakdown);
            setPerformanceTrends(data.performanceTrends || {});
            setTimeAnalysis(data.timeAnalysis || {});
            
            if (onBreakdownViewed) {
                onBreakdownViewed(data);
            }
            
        } catch (error) {
            console.error('Error loading score breakdown:', error);
            toast.error('Failed to load score breakdown');
        } finally {
            setIsLoading(false);
        }
    };

    const getScoreColor = (score) => {
        if (score >= 90) return 'text-green-600';
        if (score >= 80) return 'text-blue-600';
        if (score >= 70) return 'text-yellow-600';
        if (score >= 60) return 'text-orange-600';
        return 'text-red-600';
    };

    const getScoreBadge = (score) => {
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

    const getPerformanceIcon = (trend) => {
        if (trend > 0) return <TrendingUp className="w-4 h-4 text-green-500" />;
        if (trend < 0) return <TrendingDown className="w-4 h-4 text-red-500" />;
        return <Target className="w-4 h-4 text-gray-500" />;
    };

    const downloadBreakdown = async (format = 'pdf') => {
        try {
            const response = await fetch('/api/assessment/download-breakdown', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    submissionId, 
                    format,
                    includeDetails: showDetails,
                    includeQuestions: showQuestionScores
                })
            });

            if (!response.ok) throw new Error('Download failed');
            
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `score_breakdown_${format}_${Date.now()}.${format}`;
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

    if (!breakdown) {
        return (
            <div className="text-center py-8">
                <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                <p className="text-gray-500">No score breakdown available</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="text-center">
                <h2 className="text-3xl font-bold text-gray-900">Score Breakdown</h2>
                <p className="text-gray-600 mt-2">Detailed analysis of your assessment performance</p>
            </div>

            {/* Overall Score Summary */}
            <Card className="border-blue-200 bg-blue-50">
                <CardContent className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-center">
                        <div>
                            <h3 className="text-3xl font-bold text-blue-800">
                                {breakdown.overallScore}%
                            </h3>
                            <p className="text-sm text-blue-600">Overall Score</p>
                        </div>
                        <div>
                            <h3 className="text-3xl font-bold text-blue-800">
                                {breakdown.totalPoints}
                            </h3>
                            <p className="text-sm text-blue-600">Total Points</p>
                        </div>
                        <div>
                            <h3 className="text-3xl font-bold text-blue-800">
                                {breakdown.pointsEarned}
                            </h3>
                            <p className="text-sm text-blue-600">Points Earned</p>
                        </div>
                        <div>
                            <h3 className="text-3xl font-bold text-blue-800">
                                {breakdown.grade}
                            </h3>
                            <p className="text-sm text-blue-600">Grade</p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Section Scores */}
            {showSectionScores && breakdown.sections && (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center space-x-2">
                            <BarChart3 className="w-5 h-5" />
                            <span>Section Scores</span>
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {breakdown.sections.map((section, index) => (
                                <div key={index} className="p-4 border rounded-lg hover:bg-gray-50 cursor-pointer"
                                     onClick={() => setSelectedSection(selectedSection === index ? null : index)}>
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center space-x-3">
                                            <div className="text-center">
                                                <p className="text-sm text-gray-600">Section</p>
                                                <p className="font-bold text-gray-900">{index + 1}</p>
                                            </div>
                                            
                                            <div>
                                                <h4 className="font-medium text-gray-900">{section.name}</h4>
                                                <p className="text-sm text-gray-600">
                                                    {section.questions} questions • {section.points} points
                                                </p>
                                            </div>
                                        </div>
                                        
                                        <div className="flex items-center space-x-4">
                                            <div className="text-center">
                                                <p className="text-sm text-gray-600">Score</p>
                                                <p className={`font-bold ${getScoreColor(section.score)}`}>
                                                    {section.score}%
                                                </p>
                                            </div>
                                            
                                            <div className="text-center">
                                                <p className="text-sm text-gray-600">Points</p>
                                                <p className="font-bold text-gray-900">
                                                    {section.pointsEarned}/{section.points}
                                                </p>
                                            </div>
                                            
                                            <Badge className={getScoreBadge(section.score)}>
                                                {section.score >= 70 ? 'Passed' : 'Failed'}
                                            </Badge>
                                        </div>
                                    </div>
                                    
                                    <div className="mt-3">
                                        <Progress value={section.score} className="w-full" />
                                    </div>
                                    
                                    {selectedSection === index && (
                                        <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                                            <h5 className="font-medium text-gray-900 mb-2">Section Details</h5>
                                            <div className="grid grid-cols-2 gap-4 text-sm">
                                                <div>
                                                    <p className="text-gray-600">Correct Answers:</p>
                                                    <p className="font-medium">{section.correctAnswers}</p>
                                                </div>
                                                <div>
                                                    <p className="text-gray-600">Incorrect Answers:</p>
                                                    <p className="font-medium">{section.incorrectAnswers}</p>
                                                </div>
                                                <div>
                                                    <p className="text-gray-600">Time Spent:</p>
                                                    <p className="font-medium">{formatTime(section.timeSpent)}</p>
                                                </div>
                                                <div>
                                                    <p className="text-gray-600">Average Time per Question:</p>
                                                    <p className="font-medium">{formatTime(section.avgTimePerQuestion)}</p>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Question Scores */}
            {showQuestionScores && breakdown.questions && (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center space-x-2">
                            <Target className="w-5 h-5" />
                            <span>Question Scores</span>
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {breakdown.questions.map((question, index) => (
                                <div key={index} className="p-4 border rounded-lg">
                                    <div className="flex items-center justify-between mb-2">
                                        <h4 className="font-medium text-gray-900">
                                            Question {index + 1}
                                        </h4>
                                        <Badge className={
                                            question.correct ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                        }>
                                            {question.correct ? 'Correct' : 'Incorrect'}
                                        </Badge>
                                    </div>
                                    
                                    <div className="space-y-2">
                                        <div className="flex justify-between text-sm">
                                            <span className="text-gray-600">Points:</span>
                                            <span className="font-medium">
                                                {question.pointsEarned}/{question.points}
                                            </span>
                                        </div>
                                        
                                        <div className="flex justify-between text-sm">
                                            <span className="text-gray-600">Time:</span>
                                            <span className="font-medium">
                                                {formatTime(question.timeSpent)}
                                            </span>
                                        </div>
                                        
                                        <div className="flex justify-between text-sm">
                                            <span className="text-gray-600">Difficulty:</span>
                                            <span className="font-medium">
                                                {question.difficulty}
                                            </span>
                                        </div>
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
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="text-center">
                                <p className="text-2xl font-bold text-blue-600">
                                    {formatTime(timeAnalysis.totalTime)}
                                </p>
                                <p className="text-sm text-gray-600">Total Time</p>
                            </div>
                            
                            <div className="text-center">
                                <p className="text-2xl font-bold text-green-600">
                                    {formatTime(timeAnalysis.avgTimePerQuestion)}
                                </p>
                                <p className="text-sm text-gray-600">Avg per Question</p>
                            </div>
                            
                            <div className="text-center">
                                <p className="text-2xl font-bold text-purple-600">
                                    {formatTime(timeAnalysis.timeEfficiency)}
                                </p>
                                <p className="text-sm text-gray-600">Time Efficiency</p>
                            </div>
                        </div>
                        
                        {timeAnalysis.timeDistribution && (
                            <div className="mt-4">
                                <h4 className="font-medium text-gray-900 mb-2">Time Distribution</h4>
                                <div className="space-y-2">
                                    {timeAnalysis.timeDistribution.map((item, index) => (
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
                    </CardContent>
                </Card>
            )}

            {/* Performance Trends */}
            {showPerformanceTrends && performanceTrends && (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center space-x-2">
                            <TrendingUp className="w-5 h-5" />
                            <span>Performance Trends</span>
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {performanceTrends.sections && performanceTrends.sections.map((trend, index) => (
                                <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                                    <div className="flex items-center space-x-3">
                                        {getPerformanceIcon(trend.trend)}
                                        <div>
                                            <h4 className="font-medium text-gray-900">{trend.section}</h4>
                                            <p className="text-sm text-gray-600">{trend.description}</p>
                                        </div>
                                    </div>
                                    
                                    <div className="text-right">
                                        <p className="font-bold text-gray-900">{trend.score}%</p>
                                        <p className="text-xs text-gray-500">
                                            {trend.trend > 0 ? '+' : ''}{trend.trend}%
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Performance Insights */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                        <Star className="w-5 h-5" />
                        <span>Performance Insights</span>
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {breakdown.insights && breakdown.insights.map((insight, index) => (
                            <Alert key={index} className={
                                insight.type === 'positive' ? 'border-green-200 bg-green-50' :
                                insight.type === 'negative' ? 'border-red-200 bg-red-50' :
                                'border-blue-200 bg-blue-50'
                            }>
                                <div className="flex items-center space-x-2">
                                    {insight.type === 'positive' ? 
                                        <CheckCircle className="w-4 h-4 text-green-600" /> :
                                        insight.type === 'negative' ?
                                        <XCircle className="w-4 h-4 text-red-600" /> :
                                        <Target className="w-4 h-4 text-blue-600" />
                                    }
                                    <AlertDescription>
                                        <p className="font-medium">{insight.title}</p>
                                        <p className="text-sm text-gray-700">{insight.description}</p>
                                    </AlertDescription>
                                </div>
                            </Alert>
                        ))}
                    </div>
                </CardContent>
            </Card>

            {/* Actions */}
            <div className="flex justify-center space-x-4">
                <Button 
                    onClick={() => setShowDetails(!showDetails)}
                    variant="outline"
                >
                    {showDetails ? <EyeOff className="w-4 h-4 mr-2" /> : <Eye className="w-4 h-4 mr-2" />}
                    {showDetails ? 'Hide Details' : 'Show Details'}
                </Button>
                
                <Button 
                    onClick={() => downloadBreakdown('pdf')}
                    variant="outline"
                >
                    <Download className="w-4 h-4 mr-2" />
                    Download PDF
                </Button>
                
                <Button 
                    onClick={() => downloadBreakdown('excel')}
                    variant="outline"
                >
                    <Download className="w-4 h-4 mr-2" />
                    Download Excel
                </Button>
                
                <Button 
                    onClick={loadScoreBreakdown}
                    variant="outline"
                >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Refresh
                </Button>
            </div>
        </div>
    );
};

export default ScoreBreakdown;
