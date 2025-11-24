import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Alert, AlertDescription } from './ui/alert';
import { 
    CheckCircle, 
    XCircle, 
    AlertTriangle, 
    Eye, 
    EyeOff,
    BookOpen,
    Lightbulb,
    Target,
    Clock,
    Star,
    Download,
    Share,
    RefreshCw,
    ChevronLeft,
    ChevronRight,
    Filter,
    Search
} from 'lucide-react';
import { toast } from 'react-hot-toast';

const AnswerReview = ({ 
    submissionId,
    assessmentId,
    onReviewComplete,
    showCorrectAnswers = true,
    showExplanations = true,
    showLearningResources = true,
    allowRetake = false
}) => {
    const [reviewData, setReviewData] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [currentQuestion, setCurrentQuestion] = useState(0);
    const [showAnswers, setShowAnswers] = useState(false);
    const [filterType, setFilterType] = useState('all'); // all, correct, incorrect, unanswered
    const [searchTerm, setSearchTerm] = useState('');
    const [filteredQuestions, setFilteredQuestions] = useState([]);
    const [reviewStats, setReviewStats] = useState({});
    const [learningResources, setLearningResources] = useState([]);

    useEffect(() => {
        loadAnswerReview();
    }, [submissionId]);

    useEffect(() => {
        filterQuestions();
    }, [reviewData, filterType, searchTerm]);

    const loadAnswerReview = async () => {
        try {
            setIsLoading(true);
            
            const response = await fetch('/api/assessment/answer-review', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    submissionId, 
                    assessmentId,
                    showCorrectAnswers,
                    showExplanations,
                    showLearningResources
                })
            });

            if (!response.ok) throw new Error('Failed to load answer review');
            
            const data = await response.json();
            setReviewData(data.reviewData);
            setReviewStats(data.stats);
            setLearningResources(data.learningResources || []);
            
        } catch (error) {
            console.error('Error loading answer review:', error);
            toast.error('Failed to load answer review');
        } finally {
            setIsLoading(false);
        }
    };

    const filterQuestions = () => {
        if (!reviewData?.questions) return;
        
        let filtered = reviewData.questions;
        
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
                question.text.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }
        
        setFilteredQuestions(filtered);
    };

    const navigateQuestion = (direction) => {
        if (direction === 'prev' && currentQuestion > 0) {
            setCurrentQuestion(currentQuestion - 1);
        } else if (direction === 'next' && currentQuestion < filteredQuestions.length - 1) {
            setCurrentQuestion(currentQuestion + 1);
        }
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

    const formatTime = (minutes) => {
        if (minutes < 60) return `${minutes}m`;
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        return `${hours}h ${mins}m`;
    };

    const downloadReview = async (format = 'pdf') => {
        try {
            const response = await fetch('/api/assessment/download-review', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    submissionId, 
                    format,
                    includeAnswers: showAnswers,
                    includeExplanations: showExplanations,
                    includeResources: showLearningResources
                })
            });

            if (!response.ok) throw new Error('Download failed');
            
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `answer_review_${format}_${Date.now()}.${format}`;
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

    const shareReview = async () => {
        try {
            if (navigator.share) {
                await navigator.share({
                    title: 'Answer Review',
                    text: `Review my assessment answers and performance`,
                    url: window.location.href
                });
            } else {
                await navigator.clipboard.writeText(
                    `Answer Review: ${reviewStats.correctAnswers}/${reviewStats.totalQuestions} correct`
                );
                toast.success('Review summary copied to clipboard');
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

    if (!reviewData) {
        return (
            <div className="text-center py-8">
                <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                <p className="text-gray-500">No answer review available</p>
            </div>
        );
    }

    const currentQuestionData = filteredQuestions[currentQuestion];

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="text-center">
                <h2 className="text-3xl font-bold text-gray-900">Answer Review</h2>
                <p className="text-gray-600 mt-2">Review your answers and learn from your mistakes</p>
            </div>

            {/* Review Statistics */}
            <Card className="border-blue-200 bg-blue-50">
                <CardContent className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-center">
                        <div>
                            <h3 className="text-2xl font-bold text-blue-800">
                                {reviewStats.correctAnswers || 0}
                            </h3>
                            <p className="text-sm text-blue-600">Correct Answers</p>
                        </div>
                        <div>
                            <h3 className="text-2xl font-bold text-blue-800">
                                {reviewStats.incorrectAnswers || 0}
                            </h3>
                            <p className="text-sm text-blue-600">Incorrect Answers</p>
                        </div>
                        <div>
                            <h3 className="text-2xl font-bold text-blue-800">
                                {reviewStats.unansweredQuestions || 0}
                            </h3>
                            <p className="text-sm text-blue-600">Unanswered</p>
                        </div>
                        <div>
                            <h3 className="text-2xl font-bold text-blue-800">
                                {reviewStats.totalQuestions || 0}
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
                                    placeholder="Search questions..."
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
                                onClick={() => setShowAnswers(!showAnswers)}
                                variant="outline"
                            >
                                {showAnswers ? <EyeOff className="w-4 h-4 mr-2" /> : <Eye className="w-4 h-4 mr-2" />}
                                {showAnswers ? 'Hide Answers' : 'Show Answers'}
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Question Navigation */}
            {filteredQuestions.length > 0 && (
                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-4">
                                <Button
                                    onClick={() => navigateQuestion('prev')}
                                    disabled={currentQuestion === 0}
                                    variant="outline"
                                    size="sm"
                                >
                                    <ChevronLeft className="w-4 h-4" />
                                </Button>
                                
                                <span className="text-sm text-gray-600">
                                    Question {currentQuestion + 1} of {filteredQuestions.length}
                                </span>
                                
                                <Button
                                    onClick={() => navigateQuestion('next')}
                                    disabled={currentQuestion === filteredQuestions.length - 1}
                                    variant="outline"
                                    size="sm"
                                >
                                    <ChevronRight className="w-4 h-4" />
                                </Button>
                            </div>
                            
                            <div className="flex items-center space-x-2">
                                {getQuestionIcon(currentQuestionData)}
                                {getQuestionBadge(currentQuestionData)}
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Current Question Review */}
            {currentQuestionData && (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center space-x-2">
                            <BookOpen className="w-5 h-5" />
                            <span>Question {currentQuestionData.questionNumber}</span>
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-6">
                            {/* Question Text */}
                            <div>
                                <h4 className="font-medium text-gray-900 mb-2">Question:</h4>
                                <p className="text-gray-700">{currentQuestionData.text}</p>
                            </div>
                            
                            {/* Question Details */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                                <div>
                                    <p className="text-gray-600">Points:</p>
                                    <p className="font-medium">{currentQuestionData.points}</p>
                                </div>
                                <div>
                                    <p className="text-gray-600">Time Spent:</p>
                                    <p className="font-medium">{formatTime(currentQuestionData.timeSpent)}</p>
                                </div>
                                <div>
                                    <p className="text-gray-600">Difficulty:</p>
                                    <p className="font-medium">{currentQuestionData.difficulty}</p>
                                </div>
                            </div>
                            
                            {/* Student Answer */}
                            <div>
                                <h4 className="font-medium text-gray-900 mb-2">Your Answer:</h4>
                                <div className="p-3 border rounded-lg bg-gray-50">
                                    {currentQuestionData.studentAnswer ? (
                                        <p className="text-gray-700">{currentQuestionData.studentAnswer}</p>
                                    ) : (
                                        <p className="text-gray-500 italic">No answer provided</p>
                                    )}
                                </div>
                            </div>
                            
                            {/* Correct Answer */}
                            {showAnswers && currentQuestionData.correctAnswer && (
                                <div>
                                    <h4 className="font-medium text-gray-900 mb-2">Correct Answer:</h4>
                                    <div className="p-3 border rounded-lg bg-green-50">
                                        <p className="text-gray-700">{currentQuestionData.correctAnswer}</p>
                                    </div>
                                </div>
                            )}
                            
                            {/* Explanation */}
                            {showExplanations && currentQuestionData.explanation && (
                                <div>
                                    <h4 className="font-medium text-gray-900 mb-2">Explanation:</h4>
                                    <div className="p-3 border rounded-lg bg-blue-50">
                                        <p className="text-gray-700">{currentQuestionData.explanation}</p>
                                    </div>
                                </div>
                            )}
                            
                            {/* Learning Resources */}
                            {showLearningResources && currentQuestionData.learningResources && (
                                <div>
                                    <h4 className="font-medium text-gray-900 mb-2">Learning Resources:</h4>
                                    <div className="space-y-2">
                                        {currentQuestionData.learningResources.map((resource, index) => (
                                            <div key={index} className="p-3 border rounded-lg bg-yellow-50">
                                                <div className="flex items-center space-x-2">
                                                    <Lightbulb className="w-4 h-4 text-yellow-600" />
                                                    <a 
                                                        href={resource.url} 
                                                        target="_blank" 
                                                        rel="noopener noreferrer"
                                                        className="text-blue-600 hover:text-blue-800 underline"
                                                    >
                                                        {resource.title}
                                                    </a>
                                                </div>
                                                <p className="text-sm text-gray-600 mt-1">{resource.description}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Learning Resources */}
            {learningResources.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center space-x-2">
                            <Star className="w-5 h-5" />
                            <span>Recommended Learning Resources</span>
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {learningResources.map((resource, index) => (
                                <div key={index} className="p-4 border rounded-lg hover:bg-gray-50">
                                    <div className="flex items-start space-x-3">
                                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                                            <BookOpen className="w-4 h-4 text-blue-600" />
                                        </div>
                                        <div className="flex-1">
                                            <h4 className="font-medium text-gray-900">{resource.title}</h4>
                                            <p className="text-sm text-gray-600 mt-1">{resource.description}</p>
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
                    onClick={() => downloadReview('pdf')}
                    variant="outline"
                >
                    <Download className="w-4 h-4 mr-2" />
                    Download PDF
                </Button>
                
                <Button 
                    onClick={() => downloadReview('excel')}
                    variant="outline"
                >
                    <Download className="w-4 h-4 mr-2" />
                    Download Excel
                </Button>
                
                <Button 
                    onClick={shareReview}
                    variant="outline"
                >
                    <Share className="w-4 h-4 mr-2" />
                    Share Review
                </Button>
                
                {allowRetake && (
                    <Button 
                        onClick={() => onReviewComplete && onReviewComplete('retake')}
                        className="bg-green-600 hover:bg-green-700"
                    >
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Retake Assessment
                    </Button>
                )}
                
                <Button 
                    onClick={() => onReviewComplete && onReviewComplete('complete')}
                    className="bg-blue-600 hover:bg-blue-700"
                >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Complete Review
                </Button>
            </div>
        </div>
    );
};

export default AnswerReview;
