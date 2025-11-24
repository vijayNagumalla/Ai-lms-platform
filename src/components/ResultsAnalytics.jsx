import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { 
    Trophy, 
    Target, 
    Clock, 
    TrendingUp, 
    BarChart3, 
    PieChart, 
    Award, 
    Users, 
    CheckCircle, 
    XCircle,
    AlertTriangle,
    Download,
    Eye,
    EyeOff
} from 'lucide-react';
import { toast } from 'react-hot-toast';

const ResultsAnalytics = ({ submission, assessment, showResults = true }) => {
    const [activeTab, setActiveTab] = useState('overview');
    const [showAnswers, setShowAnswers] = useState(false);
    const [analytics, setAnalytics] = useState(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (submission && assessment) {
            loadAnalytics();
        }
    }, [submission, assessment]);

    const loadAnalytics = async () => {
        try {
            setLoading(true);
            const response = await fetch('/api/student-assessments/analytics', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    submissionId: submission.id,
                    assessmentId: assessment.id
                })
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

    const getScoreColor = (percentage) => {
        if (percentage >= 90) return 'text-green-600';
        if (percentage >= 70) return 'text-blue-600';
        if (percentage >= 50) return 'text-yellow-600';
        return 'text-red-600';
    };

    const getGradeColor = (grade) => {
        const gradeColors = {
            'A+': 'text-green-600',
            'A': 'text-green-600',
            'B+': 'text-blue-600',
            'B': 'text-blue-600',
            'C+': 'text-yellow-600',
            'C': 'text-yellow-600',
            'D+': 'text-orange-600',
            'D': 'text-orange-600',
            'F': 'text-red-600'
        };
        return gradeColors[grade] || 'text-gray-600';
    };

    const formatTime = (minutes) => {
        if (minutes < 60) return `${minutes}m`;
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        return `${hours}h ${mins}m`;
    };

    const handleDownloadReport = async () => {
        try {
            const response = await fetch('/api/student-assessments/export', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    submissionId: submission.id,
                    format: 'pdf'
                })
            });

            if (!response.ok) throw new Error('Export failed');

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `assessment_report_${submission.id}.pdf`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);

            toast.success('Report downloaded successfully');
        } catch (error) {
            console.error('Export error:', error);
            toast.error('Failed to download report');
        }
    };

    if (!showResults) {
        return (
            <Card>
                <CardContent className="text-center py-8">
                    <EyeOff className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Results Not Available</h3>
                    <p className="text-gray-600">
                        Results will be available after the assessment period ends or when the instructor releases them.
                    </p>
                </CardContent>
            </Card>
        );
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Assessment Results</h1>
                    <p className="text-gray-600 mt-1">{assessment.title}</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={() => setShowAnswers(!showAnswers)}>
                        {showAnswers ? <EyeOff className="w-4 h-4 mr-2" /> : <Eye className="w-4 h-4 mr-2" />}
                        {showAnswers ? 'Hide Answers' : 'Show Answers'}
                    </Button>
                    <Button onClick={handleDownloadReport}>
                        <Download className="w-4 h-4 mr-2" />
                        Download Report
                    </Button>
                </div>
            </div>

            {/* Score Overview */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center">
                            <div className="p-2 bg-green-100 rounded-lg">
                                <Trophy className="w-6 h-6 text-green-600" />
                            </div>
                            <div className="ml-4">
                                <p className="text-sm font-medium text-gray-600">Score</p>
                                <p className={`text-2xl font-bold ${getScoreColor(submission.percentage)}`}>
                                    {submission.score}/{submission.total_points}
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center">
                            <div className="p-2 bg-blue-100 rounded-lg">
                                <Target className="w-6 h-6 text-blue-600" />
                            </div>
                            <div className="ml-4">
                                <p className="text-sm font-medium text-gray-600">Percentage</p>
                                <p className={`text-2xl font-bold ${getScoreColor(submission.percentage)}`}>
                                    {submission.percentage}%
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
                                <p className="text-sm font-medium text-gray-600">Grade</p>
                                <p className={`text-2xl font-bold ${getGradeColor(submission.grade)}`}>
                                    {submission.grade || 'N/A'}
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center">
                            <div className="p-2 bg-orange-100 rounded-lg">
                                <Clock className="w-6 h-6 text-orange-600" />
                            </div>
                            <div className="ml-4">
                                <p className="text-sm font-medium text-gray-600">Time Taken</p>
                                <p className="text-2xl font-bold text-gray-900">
                                    {formatTime(submission.time_spent)}
                                </p>
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
                    <TabsTrigger value="answers">Answers</TabsTrigger>
                    <TabsTrigger value="comparison">Comparison</TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="space-y-6">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <Card>
                            <CardHeader>
                                <CardTitle>Score Breakdown</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    {analytics?.sectionScores?.map((section, index) => (
                                        <div key={index} className="flex items-center justify-between">
                                            <div>
                                                <p className="font-medium">{section.name}</p>
                                                <p className="text-sm text-gray-600">{section.questions} questions</p>
                                            </div>
                                            <div className="text-right">
                                                <p className="font-bold">{section.score}/{section.total}</p>
                                                <div className="w-32">
                                                    <Progress value={(section.score / section.total) * 100} />
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>Performance Metrics</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    <div className="flex justify-between items-center">
                                        <span>Accuracy</span>
                                        <span className="font-bold">{analytics?.accuracy || 0}%</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span>Average Time per Question</span>
                                        <span className="font-bold">{analytics?.avgTimePerQuestion || 0} min</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span>Questions Answered</span>
                                        <span className="font-bold">{submission.answers_saved || 0}/{assessment.total_questions}</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span>Completion Rate</span>
                                        <span className="font-bold">
                                            {Math.round(((submission.answers_saved || 0) / assessment.total_questions) * 100)}%
                                        </span>
                                    </div>
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
                                        {analytics?.correctAnswers || 0}
                                    </div>
                                    <p className="text-sm text-gray-600">Correct Answers</p>
                                </div>
                                <div className="text-center">
                                    <div className="text-3xl font-bold text-red-600">
                                        {analytics?.incorrectAnswers || 0}
                                    </div>
                                    <p className="text-sm text-gray-600">Incorrect Answers</p>
                                </div>
                                <div className="text-center">
                                    <div className="text-3xl font-bold text-gray-600">
                                        {analytics?.unansweredQuestions || 0}
                                    </div>
                                    <p className="text-sm text-gray-600">Unanswered</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Time Analysis</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {analytics?.timeAnalysis?.map((item, index) => (
                                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                                        <div>
                                            <p className="font-medium">{item.questionType}</p>
                                            <p className="text-sm text-gray-600">{item.questions} questions</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-bold">{item.avgTime} min</p>
                                            <p className="text-sm text-gray-600">avg per question</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="answers" className="space-y-6">
                    {showAnswers ? (
                        <div className="space-y-4">
                            {analytics?.questionAnalysis?.map((question, index) => (
                                <Card key={index}>
                                    <CardContent className="p-6">
                                        <div className="flex items-start justify-between mb-4">
                                            <div className="flex-1">
                                                <h4 className="font-medium text-gray-900 mb-2">
                                                    Question {index + 1}
                                                </h4>
                                                <p className="text-gray-700 mb-4">{question.question}</p>
                                            </div>
                                            <div className="flex items-center space-x-2">
                                                {question.isCorrect ? (
                                                    <CheckCircle className="w-5 h-5 text-green-500" />
                                                ) : (
                                                    <XCircle className="w-5 h-5 text-red-500" />
                                                )}
                                                <Badge variant={question.isCorrect ? 'default' : 'destructive'}>
                                                    {question.points} pts
                                                </Badge>
                                            </div>
                                        </div>
                                        
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div>
                                                <p className="text-sm font-medium text-gray-600 mb-1">Your Answer:</p>
                                                <p className="text-sm text-gray-900">{question.studentAnswer || 'No answer provided'}</p>
                                            </div>
                                            <div>
                                                <p className="text-sm font-medium text-gray-600 mb-1">Correct Answer:</p>
                                                <p className="text-sm text-gray-900">{question.correctAnswer}</p>
                                            </div>
                                        </div>
                                        
                                        {question.explanation && (
                                            <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                                                <p className="text-sm font-medium text-blue-900 mb-1">Explanation:</p>
                                                <p className="text-sm text-blue-800">{question.explanation}</p>
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    ) : (
                        <Card>
                            <CardContent className="text-center py-8">
                                <EyeOff className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                                <h3 className="text-lg font-medium text-gray-900 mb-2">Answers Hidden</h3>
                                <p className="text-gray-600">
                                    Click "Show Answers" to view detailed question analysis.
                                </p>
                            </CardContent>
                        </Card>
                    )}
                </TabsContent>

                <TabsContent value="comparison" className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Class Comparison</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div className="text-center">
                                    <div className="text-3xl font-bold text-blue-600">
                                        {analytics?.classAverage || 0}%
                                    </div>
                                    <p className="text-sm text-gray-600">Class Average</p>
                                </div>
                                <div className="text-center">
                                    <div className="text-3xl font-bold text-green-600">
                                        {analytics?.yourScore || 0}%
                                    </div>
                                    <p className="text-sm text-gray-600">Your Score</p>
                                </div>
                                <div className="text-center">
                                    <div className={`text-3xl font-bold ${
                                        (analytics?.yourScore || 0) >= (analytics?.classAverage || 0) 
                                            ? 'text-green-600' : 'text-red-600'
                                    }`}>
                                        {analytics?.percentile || 0}th
                                    </div>
                                    <p className="text-sm text-gray-600">Percentile</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Performance Insights</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {analytics?.insights?.map((insight, index) => (
                                    <div key={index} className="flex items-start space-x-3 p-3 border rounded-lg">
                                        <div className={`p-1 rounded-full ${
                                            insight.type === 'strength' ? 'bg-green-100 text-green-600' :
                                            insight.type === 'weakness' ? 'bg-red-100 text-red-600' :
                                            'bg-blue-100 text-blue-600'
                                        }`}>
                                            {insight.type === 'strength' ? <CheckCircle className="w-4 h-4" /> :
                                             insight.type === 'weakness' ? <XCircle className="w-4 h-4" /> :
                                             <AlertTriangle className="w-4 h-4" />}
                                        </div>
                                        <div>
                                            <p className="font-medium text-gray-900">{insight.title}</p>
                                            <p className="text-sm text-gray-600">{insight.description}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
};

export default ResultsAnalytics;
