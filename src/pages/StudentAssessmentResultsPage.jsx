import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle 
} from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Progress } from '../components/ui/progress';
import { 
  Trophy, 
  Clock, 
  CheckCircle, 
  XCircle, 
  Award,
  TrendingUp,
  BookOpen,
  Target,
  Download,
  Share,
  ArrowLeft,
  Eye,
  EyeOff,
  Star,
  AlertTriangle
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'react-hot-toast';
import apiService from '../services/api';

const StudentAssessmentResultsPage = () => {
  const { submissionId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showAnswers, setShowAnswers] = useState(false);
  const [selectedQuestion, setSelectedQuestion] = useState(null);

  useEffect(() => {
    fetchResults();
  }, [submissionId]);

  const fetchResults = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/student-assessments/${submissionId}/results`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setResults(data.data);
      } else {
        toast.error('Failed to fetch results');
        navigate('/student/assessments');
      }
    } catch (error) {
      console.error('Error fetching results:', error);
      toast.error('Error fetching results');
      navigate('/student/assessments');
    } finally {
      setLoading(false);
    }
  };

  const getGradeColor = (grade) => {
    const colors = {
      'A': 'bg-green-100 text-green-800',
      'B': 'bg-blue-100 text-blue-800',
      'C': 'bg-yellow-100 text-yellow-800',
      'D': 'bg-orange-100 text-orange-800',
      'F': 'bg-red-100 text-red-800'
    };
    return colors[grade] || colors['F'];
  };

  const getPerformanceLevel = (percentage) => {
    if (percentage >= 90) return { level: 'Excellent', color: 'text-green-600', icon: Star };
    if (percentage >= 80) return { level: 'Good', color: 'text-blue-600', icon: TrendingUp };
    if (percentage >= 70) return { level: 'Satisfactory', color: 'text-yellow-600', icon: Target };
    if (percentage >= 60) return { level: 'Needs Improvement', color: 'text-orange-600', icon: AlertTriangle };
    return { level: 'Poor', color: 'text-red-600', icon: XCircle };
  };

  const formatTime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours}h ${minutes}m ${secs}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${secs}s`;
    } else {
      return `${secs}s`;
    }
  };

  const handleDownloadResults = () => {
    // Implement download functionality
    toast.info('Download feature coming soon');
  };

  const handleShareResults = () => {
    // Implement share functionality
    toast.info('Share feature coming soon');
  };

  const handleRetakeAssessment = async () => {
    if (results.assessment) {
      try {
        // Call the retake API endpoint using the API service
        const result = await apiService.retakeAssessment(results.assessment.id);
        
        if (result.success) {
          toast({
            title: "Retake Started",
            description: "Assessment retake has been initiated successfully",
            duration: 3000
          });
          
          // Navigate to the NEW assessment taking page
          navigate(`/student/assessments/${results.assessment.id}/take-new`);
        } else {
          throw new Error(result.message || 'Failed to start retake');
        }
      } catch (error) {
        console.error('Error starting retake:', error);
        toast({
          title: "Retake Failed",
          description: error.message || "Failed to start assessment retake",
          variant: "destructive",
          duration: 5000
        });
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading results...</p>
        </div>
      </div>
    );
  }

  if (!results) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <XCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Results Not Found</h2>
          <p className="text-gray-600 mb-4">The results you're looking for don't exist or you don't have access to them.</p>
          <Button onClick={() => navigate('/student/assessments')}>
            Back to Assessments
          </Button>
        </div>
      </div>
    );
  }

  const performance = getPerformanceLevel(results.percentage);
  const PerformanceIcon = performance.icon;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <Button
                variant="outline"
                onClick={() => navigate('/student/assessments')}
                className="mr-4"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
              <h1 className="text-xl font-semibold text-gray-900">
                Assessment Results
              </h1>
            </div>
            
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                onClick={handleDownloadResults}
                size="sm"
              >
                <Download className="h-4 w-4 mr-2" />
                Download
              </Button>
              <Button
                variant="outline"
                onClick={handleShareResults}
                size="sm"
              >
                <Share className="h-4 w-4 mr-2" />
                Share
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Results */}
          <div className="lg:col-span-2 space-y-6">
            {/* Score Overview */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Trophy className="h-5 w-5 text-yellow-600" />
                  Score Overview
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="text-center">
                    <div className="text-4xl font-bold text-gray-900 mb-2">
                      {results.total_score}
                    </div>
                    <div className="text-sm text-gray-600">Total Score</div>
                    <div className="text-xs text-gray-500">
                      out of {results.assessment?.total_points || 100} points
                    </div>
                  </div>
                  
                  <div className="text-center">
                    <div className="text-4xl font-bold text-blue-600 mb-2">
                      {results.percentage}%
                    </div>
                    <div className="text-sm text-gray-600">Percentage</div>
                    <div className="flex items-center justify-center gap-1 mt-1">
                      <PerformanceIcon className={`h-4 w-4 ${performance.color}`} />
                      <span className={`text-xs ${performance.color}`}>
                        {performance.level}
                      </span>
                    </div>
                  </div>
                  
                  <div className="text-center">
                    <div className="text-4xl font-bold mb-2">
                      <Badge className={`text-lg px-3 py-1 ${getGradeColor(results.grade)}`}>
                        {results.grade}
                      </Badge>
                    </div>
                    <div className="text-sm text-gray-600">Grade</div>
                  </div>
                </div>

                <div className="mt-6">
                  <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
                    <span>Overall Progress</span>
                    <span>{results.percentage}%</span>
                  </div>
                  <Progress value={results.percentage} className="h-3" />
                </div>
              </CardContent>
            </Card>

            {/* Performance Breakdown */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5 text-blue-600" />
                  Performance Breakdown
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <CheckCircle className="h-6 w-6 text-green-600 mx-auto mb-2" />
                    <div className="text-2xl font-bold text-green-600">
                      {results.correct_answers || 0}
                    </div>
                    <div className="text-sm text-gray-600">Correct</div>
                  </div>
                  
                  <div className="text-center p-4 bg-red-50 rounded-lg">
                    <XCircle className="h-6 w-6 text-red-600 mx-auto mb-2" />
                    <div className="text-2xl font-bold text-red-600">
                      {(results.total_questions || 0) - (results.correct_answers || 0)}
                    </div>
                    <div className="text-sm text-gray-600">Incorrect</div>
                  </div>
                  
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <BookOpen className="h-6 w-6 text-blue-600 mx-auto mb-2" />
                    <div className="text-2xl font-bold text-blue-600">
                      {results.total_questions || 0}
                    </div>
                    <div className="text-sm text-gray-600">Total Questions</div>
                  </div>
                  
                  <div className="text-center p-4 bg-purple-50 rounded-lg">
                    <Clock className="h-6 w-6 text-purple-600 mx-auto mb-2" />
                    <div className="text-2xl font-bold text-purple-600">
                      {formatTime(results.total_time_spent || 0)}
                    </div>
                    <div className="text-sm text-gray-600">Time Spent</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Question Review */}
            {results.answers && results.answers.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Eye className="h-5 w-5 text-gray-600" />
                      Question Review
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowAnswers(!showAnswers)}
                    >
                      {showAnswers ? (
                        <>
                          <EyeOff className="h-4 w-4 mr-2" />
                          Hide Answers
                        </>
                      ) : (
                        <>
                          <Eye className="h-4 w-4 mr-2" />
                          Show Answers
                        </>
                      )}
                    </Button>
                  </CardTitle>
                </CardHeader>
                
                {showAnswers && (
                  <CardContent>
                    <div className="space-y-4">
                      {results.answers.map((answer, index) => (
                        <div 
                          key={answer.question_id}
                          className={`p-4 border rounded-lg ${
                            answer.is_correct 
                              ? 'border-green-200 bg-green-50' 
                              : 'border-red-200 bg-red-50'
                          }`}
                        >
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <span className="font-medium">Question {index + 1}</span>
                              <Badge variant={answer.is_correct ? "default" : "destructive"}>
                                {answer.is_correct ? 'Correct' : 'Incorrect'}
                              </Badge>
                              <Badge variant="outline">
                                {answer.points_earned || 0} / {answer.points || 0} pts
                              </Badge>
                            </div>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setSelectedQuestion(answer)}
                            >
                              View Details
                            </Button>
                          </div>
                          
                          <div className="text-sm text-gray-700 mb-2">
                            {answer.question_text}
                          </div>
                          
                          <div className="text-sm">
                            <span className="font-medium">Your Answer: </span>
                            <span className={answer.is_correct ? 'text-green-700' : 'text-red-700'}>
                              {answer.student_answer || 'No answer provided'}
                            </span>
                          </div>
                          
                          {answer.explanation && (
                            <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded text-sm">
                              <span className="font-medium text-blue-800">Explanation: </span>
                              <span className="text-blue-700">{answer.explanation}</span>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                )}
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Assessment Info */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Assessment Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Assessment:</span>
                  <span className="font-medium">{results.assessment_title}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Attempt:</span>
                  <span className="font-medium">#{results.attempt_number}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Submitted:</span>
                  <span className="font-medium">
                    {new Date(results.submitted_at).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Duration:</span>
                  <span className="font-medium">
                    {formatTime(results.total_time_spent || 0)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Status:</span>
                  <Badge variant="default">Completed</Badge>
                </div>
              </CardContent>
            </Card>

            {/* Performance Insights */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Performance Insights</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <div className="text-2xl font-bold text-gray-900 mb-1">
                    {Math.round((results.correct_answers / results.total_questions) * 100)}%
                  </div>
                  <div className="text-sm text-gray-600">Accuracy Rate</div>
                </div>
                
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <div className="text-2xl font-bold text-gray-900 mb-1">
                    {Math.round((results.total_time_spent / results.total_questions) / 60)}m
                  </div>
                  <div className="text-sm text-gray-600">Avg Time per Question</div>
                </div>
              </CardContent>
            </Card>

            {/* Actions */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button
                  onClick={handleRetakeAssessment}
                  className="w-full"
                  variant="outline"
                >
                  <BookOpen className="h-4 w-4 mr-2" />
                  Retake Assessment
                </Button>
                
                <Button
                  onClick={() => navigate('/student/assessments')}
                  className="w-full"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Assessments
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentAssessmentResultsPage;