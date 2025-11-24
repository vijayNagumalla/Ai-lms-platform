import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { Alert, AlertDescription } from './ui/alert';
import { 
    Trophy, 
    Target, 
    Clock, 
    CheckCircle, 
    XCircle, 
    AlertTriangle,
    TrendingUp,
    TrendingDown,
    Award,
    Star,
    BarChart3,
    PieChart,
    Download,
    Share,
    RefreshCw,
    Eye,
    EyeOff
} from 'lucide-react';
import { toast } from 'react-hot-toast';

const ImmediateResults = ({ 
    submissionId,
    assessmentId,
    onResultsViewed,
    showDetailedFeedback = true,
    showComparativeAnalysis = true,
    showPerformanceInsights = true
}) => {
    const [results, setResults] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [showDetails, setShowDetails] = useState(false);
    const [showAnswers, setShowAnswers] = useState(false);
    const [performanceInsights, setPerformanceInsights] = useState({});
    const [comparativeData, setComparativeData] = useState({});
    const [detailedFeedback, setDetailedFeedback] = useState({});

    useEffect(() => {
        loadResults();
    }, [submissionId]);

    const loadResults = async () => {
        try {
            setIsLoading(true);
            
            const response = await fetch('/api/assessment/immediate-results', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ submissionId, assessmentId })
            });

            if (!response.ok) throw new Error('Failed to load results');
            
            const data = await response.json();
            setResults(data.results);
            setPerformanceInsights(data.performanceInsights || {});
            setComparativeData(data.comparativeData || {});
            setDetailedFeedback(data.detailedFeedback || {});
            
            if (onResultsViewed) {
                onResultsViewed(data);
            }
            
        } catch (error) {
            console.error('Error loading results:', error);
            toast.error('Failed to load results');
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

    const getGrade = (score) => {
        if (score >= 90) return 'A+';
        if (score >= 80) return 'A';
        if (score >= 70) return 'B';
        if (score >= 60) return 'C';
        if (score >= 50) return 'D';
        return 'F';
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

    const downloadResults = async (format = 'pdf') => {
        try {
            const response = await fetch('/api/assessment/download-results', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    submissionId, 
                    format,
                    includeAnswers: showAnswers,
                    includeFeedback: showDetailedFeedback
                })
            });

            if (!response.ok) throw new Error('Download failed');
            
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `assessment_results_${format}_${Date.now()}.${format}`;
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

    const shareResults = async () => {
        try {
            if (navigator.share) {
                await navigator.share({
                    title: 'Assessment Results',
                    text: `I scored ${results.score}% on the assessment!`,
                    url: window.location.href
                });
            } else {
                // Fallback to clipboard
                await navigator.clipboard.writeText(
                    `Assessment Results: ${results.score}% (${getGrade(results.score)})`
                );
                toast.success('Results copied to clipboard');
            }
        } catch (error) {
            console.error('Share error:', error);
            toast.error('Share failed');
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    if (!results) {
        return (
            <div className="text-center py-8">
                <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                <p className="text-gray-500">No results available</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="text-center">
                <h2 className="text-3xl font-bold text-gray-900">Assessment Results</h2>
                <p className="text-gray-600 mt-2">Your assessment has been completed and scored</p>
            </div>

            {/* Score Overview */}
            <Card className="border-blue-200 bg-blue-50">
                <CardContent className="p-8">
                    <div className="text-center space-y-4">
                        <div className="flex justify-center">
                            <Trophy className="w-16 h-16 text-yellow-500" />
                        </div>
                        
                        <div>
                            <h3 className="text-4xl font-bold text-blue-800">
                                {results.score}%
                            </h3>
                            <p className="text-xl text-blue-600">
                                {getGrade(results.score)}
                            </p>
                        </div>
                        
                        <div className="flex justify-center space-x-4">
                            <Badge className={getScoreBadge(results.score)}>
                                {results.score >= 70 ? 'Passed' : 'Failed'}
                            </Badge>
                            <Badge variant="outline">
                                {results.totalQuestions} Questions
                            </Badge>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center">
                            <div className="p-2 bg-green-100 rounded-lg">
                                <CheckCircle className="w-6 h-6 text-green-600" />
                            </div>
                            <div className="ml-4">
                                <p className="text-sm font-medium text-gray-600">Correct Answers</p>
                                <p className="text-2xl font-bold text-gray-900">
                                    {results.correctAnswers}
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center">
                            <div className="p-2 bg-red-100 rounded-lg">
                                <XCircle className="w-6 h-6 text-red-600" />
                            </div>
                            <div className="ml-4">
                                <p className="text-sm font-medium text-gray-600">Incorrect Answers</p>
                                <p className="text-2xl font-bold text-gray-900">
                                    {results.incorrectAnswers}
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center">
                            <div className="p-2 bg-blue-100 rounded-lg">
                                <Clock className="w-6 h-6 text-blue-600" />
                            </div>
                            <div className="ml-4">
                                <p className="text-sm font-medium text-gray-600">Time Taken</p>
                                <p className="text-2xl font-bold text-gray-900">
                                    {formatTime(results.timeTaken)}
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
                                <p className="text-sm font-medium text-gray-600">Points Earned</p>
                                <p className="text-2xl font-bold text-gray-900">
                                    {results.pointsEarned}/{results.totalPoints}
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Performance Insights */}
            {showPerformanceInsights && performanceInsights && (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center space-x-2">
                            <BarChart3 className="w-5 h-5" />
                            <span>Performance Insights</span>
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

            {/* Comparative Analysis */}
            {showComparativeAnalysis && comparativeData && (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center space-x-2">
                            <PieChart className="w-5 h-5" />
                            <span>Comparative Analysis</span>
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="text-center">
                                <p className="text-2xl font-bold text-blue-600">
                                    {comparativeData.classAverage || 0}%
                                </p>
                                <p className="text-sm text-gray-600">Class Average</p>
                            </div>
                            
                            <div className="text-center">
                                <p className="text-2xl font-bold text-green-600">
                                    {comparativeData.percentile || 0}%
                                </p>
                                <p className="text-sm text-gray-600">Percentile Rank</p>
                            </div>
                            
                            <div className="text-center">
                                <p className="text-2xl font-bold text-purple-600">
                                    {comparativeData.rank || 0}
                                </p>
                                <p className="text-sm text-gray-600">Class Rank</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Detailed Feedback */}
            {showDetailedFeedback && detailedFeedback && (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center space-x-2">
                            <Star className="w-5 h-5" />
                            <span>Detailed Feedback</span>
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {detailedFeedback.sections && detailedFeedback.sections.map((section, index) => (
                                <div key={index} className="p-4 border rounded-lg">
                                    <h4 className="font-medium text-gray-900 mb-2">{section.name}</h4>
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-sm text-gray-600">Score: {section.score}%</span>
                                        <Progress value={section.score} className="w-32" />
                                    </div>
                                    <p className="text-sm text-gray-700">{section.feedback}</p>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Answer Review */}
            {showAnswers && (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center space-x-2">
                            <Eye className="w-5 h-5" />
                            <span>Answer Review</span>
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {results.questions && results.questions.map((question, index) => (
                                <div key={index} className="p-4 border rounded-lg">
                                    <div className="flex items-start justify-between mb-2">
                                        <h4 className="font-medium text-gray-900">
                                            Question {index + 1}
                                        </h4>
                                        <Badge className={
                                            question.correct ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                        }>
                                            {question.correct ? 'Correct' : 'Incorrect'}
                                        </Badge>
                                    </div>
                                    
                                    <p className="text-sm text-gray-700 mb-2">{question.text}</p>
                                    
                                    <div className="space-y-1">
                                        <p className="text-xs text-gray-600">
                                            Your Answer: {question.studentAnswer}
                                        </p>
                                        {!question.correct && (
                                            <p className="text-xs text-gray-600">
                                                Correct Answer: {question.correctAnswer}
                                            </p>
                                        )}
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
                    onClick={() => setShowDetails(!showDetails)}
                    variant="outline"
                >
                    {showDetails ? <EyeOff className="w-4 h-4 mr-2" /> : <Eye className="w-4 h-4 mr-2" />}
                    {showDetails ? 'Hide Details' : 'Show Details'}
                </Button>
                
                <Button 
                    onClick={() => setShowAnswers(!showAnswers)}
                    variant="outline"
                >
                    <Eye className="w-4 h-4 mr-2" />
                    {showAnswers ? 'Hide Answers' : 'Show Answers'}
                </Button>
                
                <Button 
                    onClick={() => downloadResults('pdf')}
                    variant="outline"
                >
                    <Download className="w-4 h-4 mr-2" />
                    Download PDF
                </Button>
                
                <Button 
                    onClick={() => downloadResults('excel')}
                    variant="outline"
                >
                    <Download className="w-4 h-4 mr-2" />
                    Download Excel
                </Button>
                
                <Button 
                    onClick={shareResults}
                    variant="outline"
                >
                    <Share className="w-4 h-4 mr-2" />
                    Share
                </Button>
            </div>

            {/* Achievement Badges */}
            {results.achievements && results.achievements.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center space-x-2">
                            <Award className="w-5 h-5" />
                            <span>Achievements Unlocked</span>
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {results.achievements.map((achievement, index) => (
                                <div key={index} className="text-center p-4 border rounded-lg">
                                    <div className="w-12 h-12 mx-auto mb-3 bg-yellow-100 rounded-full flex items-center justify-center">
                                        <Star className="w-6 h-6 text-yellow-600" />
                                    </div>
                                    <h4 className="font-medium text-gray-900">{achievement.title}</h4>
                                    <p className="text-sm text-gray-600">{achievement.description}</p>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
};

export default ImmediateResults;
