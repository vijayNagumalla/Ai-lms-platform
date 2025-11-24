import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Alert, AlertDescription } from './ui/alert';
import { 
    BookOpen, 
    Lightbulb, 
    Target, 
    Star,
    CheckCircle, 
    XCircle, 
    AlertTriangle,
    Download,
    Share,
    RefreshCw,
    Eye,
    EyeOff,
    Filter,
    Search,
    ExternalLink,
    Book,
    Video,
    FileText,
    Link
} from 'lucide-react';
import { toast } from 'react-hot-toast';

const DetailedFeedback = ({ 
    submissionId,
    assessmentId,
    onFeedbackViewed,
    showExplanations = true,
    showLearningResources = true,
    showPerformanceInsights = true,
    showRecommendations = true
}) => {
    const [feedback, setFeedback] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [showDetails, setShowDetails] = useState(false);
    const [filterType, setFilterType] = useState('all'); // all, correct, incorrect, unanswered
    const [searchTerm, setSearchTerm] = useState('');
    const [filteredQuestions, setFilteredQuestions] = useState([]);
    const [learningResources, setLearningResources] = useState([]);
    const [performanceInsights, setPerformanceInsights] = useState({});

    useEffect(() => {
        loadDetailedFeedback();
    }, [submissionId]);

    useEffect(() => {
        filterQuestions();
    }, [feedback, filterType, searchTerm]);

    const loadDetailedFeedback = async () => {
        try {
            setIsLoading(true);
            
            const response = await fetch('/api/assessment/detailed-feedback', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    submissionId, 
                    assessmentId,
                    showExplanations,
                    showLearningResources,
                    showPerformanceInsights,
                    showRecommendations
                })
            });

            if (!response.ok) throw new Error('Failed to load detailed feedback');
            
            const data = await response.json();
            setFeedback(data.feedback);
            setLearningResources(data.learningResources || []);
            setPerformanceInsights(data.performanceInsights || {});
            
            if (onFeedbackViewed) {
                onFeedbackViewed(data);
            }
            
        } catch (error) {
            console.error('Error loading detailed feedback:', error);
            toast.error('Failed to load detailed feedback');
        } finally {
            setIsLoading(false);
        }
    };

    const filterQuestions = () => {
        if (!feedback?.questions) return;
        
        let filtered = feedback.questions;
        
        // Filter by type
        if (filterType !== 'all') {
            filtered = filtered.filter(question => {
                switch (filterType) {
                    case 'correct':
                        return question.correct;
                    case 'incorrect':
                        return !question.correct && question.answered;
                    case 'unanswered':
                        return !question.answered;
                    default:
                        return true;
                }
            });
        }
        
        // Filter by search term
        if (searchTerm) {
            filtered = filtered.filter(question => 
                question.text.toLowerCase().includes(searchTerm.toLowerCase()) ||
                question.explanation?.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }
        
        setFilteredQuestions(filtered);
    };

    const getQuestionIcon = (question) => {
        if (!question.answered) {
            return <AlertTriangle className="w-5 h-5 text-gray-500" />;
        }
        return question.correct ? 
            <CheckCircle className="w-5 h-5 text-green-500" /> : 
            <XCircle className="w-5 h-5 text-red-500" />;
    };

    const getQuestionBadge = (question) => {
        if (!question.answered) {
            return <Badge className="bg-gray-100 text-gray-800">Unanswered</Badge>;
        }
        return question.correct ? 
            <Badge className="bg-green-100 text-green-800">Correct</Badge> : 
            <Badge className="bg-red-100 text-red-800">Incorrect</Badge>;
    };

    const getResourceIcon = (type) => {
        switch (type) {
            case 'video':
                return <Video className="w-4 h-4" />;
            case 'article':
                return <FileText className="w-4 h-4" />;
            case 'book':
                return <Book className="w-4 h-4" />;
            case 'link':
                return <Link className="w-4 h-4" />;
            default:
                return <BookOpen className="w-4 h-4" />;
        }
    };

    const downloadFeedback = async (format = 'pdf') => {
        try {
            const response = await fetch('/api/assessment/download-feedback', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    submissionId, 
                    format,
                    includeExplanations: showExplanations,
                    includeResources: showLearningResources,
                    includeInsights: showPerformanceInsights
                })
            });

            if (!response.ok) throw new Error('Download failed');
            
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `detailed_feedback_${format}_${Date.now()}.${format}`;
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

    const shareFeedback = async () => {
        try {
            if (navigator.share) {
                await navigator.share({
                    title: 'Detailed Feedback',
                    text: `Review my detailed assessment feedback and learning resources`,
                    url: window.location.href
                });
            } else {
                await navigator.clipboard.writeText(
                    `Detailed Feedback: ${feedback?.correctAnswers}/${feedback?.totalQuestions} correct`
                );
                toast.success('Feedback summary copied to clipboard');
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

    if (!feedback) {
        return (
            <div className="text-center py-8">
                <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                <p className="text-gray-500">No detailed feedback available</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="text-center">
                <h2 className="text-3xl font-bold text-gray-900">Detailed Feedback</h2>
                <p className="text-gray-600 mt-2">Comprehensive feedback and learning resources for your assessment</p>
            </div>

            {/* Feedback Summary */}
            <Card className="border-blue-200 bg-blue-50">
                <CardContent className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-center">
                        <div>
                            <h3 className="text-2xl font-bold text-blue-800">
                                {feedback.correctAnswers || 0}
                            </h3>
                            <p className="text-sm text-blue-600">Correct Answers</p>
                        </div>
                        <div>
                            <h3 className="text-2xl font-bold text-blue-800">
                                {feedback.incorrectAnswers || 0}
                            </h3>
                            <p className="text-sm text-blue-600">Incorrect Answers</p>
                        </div>
                        <div>
                            <h3 className="text-2xl font-bold text-blue-800">
                                {feedback.unansweredQuestions || 0}
                            </h3>
                            <p className="text-sm text-blue-600">Unanswered</p>
                        </div>
                        <div>
                            <h3 className="text-2xl font-bold text-blue-800">
                                {feedback.totalQuestions || 0}
                            </h3>
                            <p className="text-sm text-blue-600">Total Questions</p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Filters and Search */}
            <Card>
                <CardContent className="p-4">
                    <div className="flex flex-col md:flex-row gap-4">
                        <div className="flex-1">
                            <div className="relative">
                                <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder="Search questions or explanations..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                            </div>
                        </div>
                        
                        <div className="flex gap-2">
                            <select
                                value={filterType}
                                onChange={(e) => setFilterType(e.target.value)}
                                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            >
                                <option value="all">All Questions</option>
                                <option value="correct">Correct</option>
                                <option value="incorrect">Incorrect</option>
                                <option value="unanswered">Unanswered</option>
                            </select>
                            
                            <Button
                                onClick={() => setShowDetails(!showDetails)}
                                variant="outline"
                            >
                                {showDetails ? <EyeOff className="w-4 h-4 mr-2" /> : <Eye className="w-4 h-4 mr-2" />}
                                {showDetails ? 'Hide Details' : 'Show Details'}
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Question Feedback */}
            <div className="space-y-4">
                {filteredQuestions.map((question, index) => (
                    <Card key={index} className={question.correct ? 'border-green-200' : 'border-red-200'}>
                        <CardContent className="p-6">
                            <div className="space-y-4">
                                {/* Question Header */}
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center space-x-3">
                                        {getQuestionIcon(question)}
                                        <h4 className="font-medium text-gray-900">
                                            Question {question.questionNumber}
                                        </h4>
                                    </div>
                                    
                                    <div className="flex items-center space-x-2">
                                        {getQuestionBadge(question)}
                                        <Badge variant="outline">
                                            {question.points} points
                                        </Badge>
                                    </div>
                                </div>
                                
                                {/* Question Text */}
                                <div>
                                    <h5 className="font-medium text-gray-900 mb-2">Question:</h5>
                                    <p className="text-gray-700">{question.text}</p>
                                </div>
                                
                                {/* Student Answer */}
                                <div>
                                    <h5 className="font-medium text-gray-900 mb-2">Your Answer:</h5>
                                    <div className="p-3 border rounded-lg bg-gray-50">
                                        {question.studentAnswer ? (
                                            <p className="text-gray-700">{question.studentAnswer}</p>
                                        ) : (
                                            <p className="text-gray-500 italic">No answer provided</p>
                                        )}
                                    </div>
                                </div>
                                
                                {/* Correct Answer */}
                                {question.correctAnswer && (
                                    <div>
                                        <h5 className="font-medium text-gray-900 mb-2">Correct Answer:</h5>
                                        <div className="p-3 border rounded-lg bg-green-50">
                                            <p className="text-gray-700">{question.correctAnswer}</p>
                                        </div>
                                    </div>
                                )}
                                
                                {/* Explanation */}
                                {showExplanations && question.explanation && (
                                    <div>
                                        <h5 className="font-medium text-gray-900 mb-2">Explanation:</h5>
                                        <div className="p-3 border rounded-lg bg-blue-50">
                                            <p className="text-gray-700">{question.explanation}</p>
                                        </div>
                                    </div>
                                )}
                                
                                {/* Learning Resources */}
                                {showLearningResources && question.learningResources && question.learningResources.length > 0 && (
                                    <div>
                                        <h5 className="font-medium text-gray-900 mb-2">Learning Resources:</h5>
                                        <div className="space-y-2">
                                            {question.learningResources.map((resource, resourceIndex) => (
                                                <div key={resourceIndex} className="p-3 border rounded-lg bg-yellow-50">
                                                    <div className="flex items-center space-x-2">
                                                        {getResourceIcon(resource.type)}
                                                        <a 
                                                            href={resource.url} 
                                                            target="_blank" 
                                                            rel="noopener noreferrer"
                                                            className="text-blue-600 hover:text-blue-800 underline font-medium"
                                                        >
                                                            {resource.title}
                                                        </a>
                                                        <ExternalLink className="w-3 h-3 text-gray-400" />
                                                    </div>
                                                    <p className="text-sm text-gray-600 mt-1">{resource.description}</p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                                
                                {/* Performance Insights */}
                                {showPerformanceInsights && question.insights && (
                                    <div>
                                        <h5 className="font-medium text-gray-900 mb-2">Performance Insights:</h5>
                                        <div className="p-3 border rounded-lg bg-purple-50">
                                            <p className="text-gray-700">{question.insights}</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Performance Insights */}
            {showPerformanceInsights && performanceInsights && (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center space-x-2">
                            <Lightbulb className="w-5 h-5" />
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

            {/* Learning Resources */}
            {showLearningResources && learningResources.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center space-x-2">
                            <BookOpen className="w-5 h-5" />
                            <span>Recommended Learning Resources</span>
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {learningResources.map((resource, index) => (
                                <div key={index} className="p-4 border rounded-lg hover:bg-gray-50">
                                    <div className="flex items-start space-x-3">
                                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                                            {getResourceIcon(resource.type)}
                                        </div>
                                        <div className="flex-1">
                                            <h4 className="font-medium text-gray-900">{resource.title}</h4>
                                            <p className="text-sm text-gray-600 mt-1">{resource.description}</p>
                                            <div className="flex items-center space-x-2 mt-2">
                                                <Badge className="bg-blue-100 text-blue-800">
                                                    {resource.type}
                                                </Badge>
                                                <span className="text-xs text-gray-500">
                                                    {resource.estimatedTime}
                                                </span>
                                            </div>
                                            <a 
                                                href={resource.url} 
                                                target="_blank" 
                                                rel="noopener noreferrer"
                                                className="text-blue-600 hover:text-blue-800 text-sm underline mt-2 inline-block"
                                            >
                                                View Resource
                                            </a>
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
                    onClick={() => downloadFeedback('pdf')}
                    variant="outline"
                >
                    <Download className="w-4 h-4 mr-2" />
                    Download PDF
                </Button>
                
                <Button 
                    onClick={() => downloadFeedback('excel')}
                    variant="outline"
                >
                    <Download className="w-4 h-4 mr-2" />
                    Download Excel
                </Button>
                
                <Button 
                    onClick={shareFeedback}
                    variant="outline"
                >
                    <Share className="w-4 h-4 mr-2" />
                    Share Feedback
                </Button>
                
                <Button 
                    onClick={loadDetailedFeedback}
                    variant="outline"
                >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Refresh
                </Button>
            </div>
        </div>
    );
};

export default DetailedFeedback;
