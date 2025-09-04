import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/ui/use-toast';
import { motion } from 'framer-motion';
import { 
  CheckCircle, 
  XCircle, 
  Target, 
  Award, 
  Trophy, 
  BarChart3,
  PieChart,
  ArrowLeft,
  AlertTriangle,
  Info,
  Medal,
  Lightbulb,
  TrendingUp,
  BookOpen,
  Crown,
  History,
  Play
} from 'lucide-react';
import apiService from '@/services/api';

// Score Display Component
const ScoreDisplay = ({ score, maxScore, percentage, passingScore }) => {
  // Ensure all values are numbers
  const numericScore = Number(score) || 0;
  const numericMaxScore = Number(maxScore) || 0;
  const numericPercentage = Number(percentage) || 0;
  const numericPassingScore = Number(passingScore) || 70;
  
  const isPassed = numericPercentage >= numericPassingScore;
  const scoreColor = isPassed ? 'text-green-600' : 'text-red-600';
  const bgColor = isPassed ? 'bg-green-50' : 'bg-red-50';
  const borderColor = isPassed ? 'border-green-200' : 'border-red-200';

  return (
    <Card className={`${bgColor} ${borderColor} border`}>
      <CardContent className="p-4 text-center">
        <div className="space-y-3">
          {/* Score Circle - Compact */}
          <div className="relative inline-block">
            <div className="w-24 h-24 rounded-full border-6 border-gray-200 flex items-center justify-center">
              <div className="text-center">
                <div className={`text-2xl font-bold ${scoreColor}`}>
                  {numericPercentage.toFixed(1)}%
                </div>
                <div className="text-xs text-gray-600">
                  {numericScore.toFixed(1)}/{numericMaxScore.toFixed(1)}
                </div>
              </div>
            </div>
            <div className="absolute inset-0 w-24 h-24 rounded-full border-6 border-transparent border-t-green-500 transform rotate-45"></div>
          </div>

          {/* Status - Compact */}
          <div className="space-y-1">
            <div className="flex items-center justify-center space-x-2">
              {isPassed ? (
                <CheckCircle className="h-5 w-5 text-green-600" />
              ) : (
                <XCircle className="h-5 w-5 text-red-600" />
              )}
              <span className={`text-base font-semibold ${scoreColor}`}>
                {isPassed ? 'PASSED' : 'FAILED'}
              </span>
            </div>
            <p className="text-xs text-gray-600">
              Pass: {numericPassingScore}%
            </p>
          </div>

          {/* Achievement Badge - Compact */}
          {isPassed && (
            <div className="flex items-center justify-center space-x-1">
              <Trophy className="h-4 w-4 text-yellow-600" />
              <span className="text-xs font-medium text-yellow-700">
                Great job!
              </span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

// Question Review Component
const QuestionReview = ({ question, userAnswer, correctAnswer, isCorrect, points, maxPoints }) => {
  const [showExplanation, setShowExplanation] = useState(false);

  // Helper function to render options for multiple choice questions
  const renderOptions = () => {
    if (!question.options || !Array.isArray(question.options)) return null;

    return (
      <div className="space-y-2">
        <h5 className="font-medium text-sm mb-2">Options:</h5>
        {question.options.map((option, index) => {
          const isUserAnswer = userAnswer === option;
          const isCorrectOption = correctAnswer === option;
          let optionClass = "p-3 rounded-lg border";
          
          if (isUserAnswer && isCorrectOption) {
            optionClass += " bg-green-100 border-green-300 text-green-800";
          } else if (isUserAnswer && !isCorrectOption) {
            optionClass += " bg-red-100 border-red-300 text-red-800";
          } else if (isCorrectOption) {
            optionClass += " bg-green-100 border-green-300 text-green-800";
          } else {
            optionClass += " bg-gray-50 border-gray-200 text-gray-700";
          }

          return (
            <div key={index} className={optionClass}>
              <div className="flex items-center space-x-2">
                <span className="font-medium">{String.fromCharCode(65 + index)}.</span>
                <span>{option}</span>
                {isUserAnswer && isCorrectOption && (
                  <CheckCircle className="h-4 w-4 text-green-600 ml-auto" />
                )}
                {isUserAnswer && !isCorrectOption && (
                  <XCircle className="h-4 w-4 text-red-600 ml-auto" />
                )}
                {!isUserAnswer && isCorrectOption && (
                  <CheckCircle className="h-4 w-4 text-green-600 ml-auto" />
                )}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  // Helper function to render coding question results
  const renderCodingQuestion = () => {
    if (!question.coding_result) return null;

    return (
      <div className="space-y-4">
        {/* Test Case Summary */}
        <div className="flex items-center justify-between p-4 bg-gray-100 rounded-lg">
          <div className="flex items-center space-x-6">
            <div className="text-sm">
              <span className="font-medium">Test Cases Passed:</span>
              <span className="ml-2 text-green-600 font-bold">
                {question.coding_result.testCasesPassed}/{question.coding_result.totalTestCases}
              </span>
            </div>
            <div className="text-sm">
              <span className="font-medium">Score:</span>
              <span className="ml-2 font-bold">{question.coding_result.score}%</span>
            </div>
            <div className="text-sm">
              <span className="font-medium">Language:</span>
              <span className="ml-2 capitalize">
                {question.coding_result.language || 
                 (question.user_answer && typeof question.user_answer === 'object' && question.user_answer.language) || 
                 'Not specified'}
              </span>
            </div>
          </div>
        </div>
        
        {/* Your Code */}
        <div>
          <h5 className="font-medium text-sm mb-2">Your Code:</h5>
          <pre className="p-4 bg-gray-900 text-green-400 rounded-lg text-sm overflow-x-auto">
            {question.coding_result.code || question.user_answer || 'No code provided'}
          </pre>
        </div>
      </div>
    );
  };

  // Helper function to render question type badge
  const getQuestionTypeBadge = () => {
    const type = question.question_type || 'unknown';
    const typeColors = {
      'multiple_choice': 'bg-blue-100 text-blue-800',
      'true_false': 'bg-purple-100 text-purple-800',
      'short_answer': 'bg-orange-100 text-orange-800',
      'essay': 'bg-indigo-100 text-indigo-800',
      'coding': 'bg-green-100 text-green-800',
      'unknown': 'bg-gray-100 text-gray-800'
    };
    
    return (
      <Badge className={typeColors[type] || typeColors.unknown}>
        {type.replace('_', ' ').toUpperCase()}
      </Badge>
    );
  };

  return (
    <Card className={`${isCorrect ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}`}>
      <CardContent className="p-6">
        <div className="space-y-4">
          {/* Question Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              {isCorrect ? (
                <CheckCircle className="h-5 w-5 text-green-600" />
              ) : (
                <XCircle className="h-5 w-5 text-red-600" />
              )}
              <Badge variant={isCorrect ? "default" : "destructive"}>
                {isCorrect ? 'Correct' : 'Incorrect'}
              </Badge>
              {getQuestionTypeBadge()}
            </div>
            <div className="text-sm text-gray-600">
              {points}/{maxPoints} points
            </div>
          </div>

          {/* Question Details */}
          <div className="space-y-3">
          {/* Question Text */}
          <div>
            <h4 className="font-medium mb-2">Question:</h4>
              <div className="p-3 bg-white border border-gray-200 rounded-lg">
                <p className="text-gray-700 whitespace-pre-wrap">{question.question_text}</p>
              </div>
            </div>

            {/* For coding questions, show simplified view */}
            {question.question_type === 'coding' ? (
              renderCodingQuestion()
            ) : (
              <>
                {/* Question Metadata - Only for non-coding questions */}
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600">Difficulty:</span>
                <span className="ml-2 font-medium capitalize">{question.difficulty_level || 'Not specified'}</span>
              </div>
              <div>
                <span className="text-gray-600">Category:</span>
                <span className="ml-2 font-medium">{question.category || 'Not specified'}</span>
              </div>
          </div>

            {/* Options for multiple choice questions */}
            {renderOptions()}

            {/* Your Answer */}
            <div>
              <h5 className="font-medium text-sm mb-2">Your Answer:</h5>
              <div className={`p-3 rounded-lg ${
                isCorrect ? 'bg-green-100 border border-green-300' : 'bg-red-100 border border-red-300'
              }`}>
                <span className="text-sm whitespace-pre-wrap">{userAnswer || 'No answer provided'}</span>
              </div>
            </div>

            {/* Correct Answer - Always show for learning purposes */}
            <div>
              <h5 className="font-medium text-sm mb-2">Correct Answer:</h5>
              <div className="p-3 rounded-lg bg-green-100 border border-green-300">
                <span className="text-sm whitespace-pre-wrap">
                  {(() => {
                    // Try different possible correct answer formats
                    if (correctAnswer) {
                      return correctAnswer;
                    }
                    
                    // If no correct_answer, try to find it in options
                    if (question.options && Array.isArray(question.options)) {
                      // Check if there's a correct_answer_index or similar field
                      if (question.correct_answer_index !== undefined) {
                        return question.options[question.correct_answer_index];
                      }
                      
                      // Check if there's a correct_answers array
                      if (question.correct_answers && Array.isArray(question.correct_answers)) {
                        return question.correct_answers.join(', ');
                      }
                    }
                    
                    return 'Not available';
                  })()}
                </span>
              </div>
            </div>
              </>
            )}

            {/* Hints */}
            {question.hints && question.hints.length > 0 && (
              <div>
                <h5 className="font-medium text-sm mb-2">Hints:</h5>
                <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <ul className="list-disc list-inside space-y-1">
                    {question.hints.map((hint, index) => (
                      <li key={index} className="text-sm text-yellow-800">{hint}</li>
                    ))}
                  </ul>
                </div>
              </div>
            )}

          {/* Explanation */}
          {question.explanation && (
            <div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowExplanation(!showExplanation)}
                className="w-full"
              >
                <Info className="h-4 w-4 mr-2" />
                  {showExplanation ? 'Hide' : 'Show'} Detailed Explanation
              </Button>
              {showExplanation && (
                <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-sm text-blue-800 whitespace-pre-wrap">{question.explanation}</p>
                </div>
              )}
            </div>
          )}

            {/* Tags */}
            {question.tags && question.tags.length > 0 && (
              <div>
                <h5 className="font-medium text-sm mb-2">Tags:</h5>
                <div className="flex flex-wrap gap-2">
                  {question.tags.map((tag, index) => (
                    <Badge key={index} variant="outline" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

// Performance Analytics Component
const PerformanceAnalytics = ({ questions, totalPoints, maxPoints }) => {
  
  const questionTypes = questions.reduce((acc, question) => {
    const type = question.question_type || 'multiple_choice';
    if (!acc[type]) {
      acc[type] = { count: 0, correct: 0, points: 0, maxPoints: 0 };
    }
    acc[type].count++;
    
    // Use the points from the question, ensuring it's a number
    const questionPoints = Number(question.points) || 1;
    acc[type].maxPoints += questionPoints;
    
    // Use the is_correct field from the backend instead of recalculating
    if (question.is_correct) {
      acc[type].correct++;
      acc[type].points += questionPoints;
    }
    
    return acc;
  }, {});

  const overallAccuracy = maxPoints > 0 ? (totalPoints / maxPoints) * 100 : 0;

  return (
    <div className="space-y-6">
      {/* Overall Performance */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <BarChart3 className="h-5 w-5" />
            Overall Performance
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{overallAccuracy.toFixed(1)}%</div>
              <div className="text-sm text-gray-600">Accuracy</div>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">{totalPoints}</div>
              <div className="text-sm text-gray-600">Points Earned</div>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">{maxPoints}</div>
              <div className="text-sm text-gray-600">Total Points</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Performance by Question Type */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <PieChart className="h-5 w-5" />
            Performance by Question Type
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Object.entries(questionTypes).map(([type, stats]) => {
              const accuracy = stats.count > 0 ? (stats.correct / stats.count) * 100 : 0;
              const pointsPercentage = stats.maxPoints > 0 ? (stats.points / stats.maxPoints) * 100 : 0;
              

              
              return (
                <div key={type} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span className="font-medium capitalize">{type.replace('_', ' ')}</span>
                      <Badge variant="outline">{stats.count} questions</Badge>
                    </div>
                    <div className="text-sm text-gray-600">
                      {stats.points}/{stats.maxPoints} points
                    </div>
                  </div>
                  <div className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span>Accuracy</span>
                      <span>{accuracy.toFixed(1)}%</span>
                    </div>
                    <Progress value={accuracy} className="h-2" />
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

// Main Results Component
const StudentAssessmentResultsPage = () => {
  const { assessmentId } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const { toast } = useToast();

  // State management
  const [assessment, setAssessment] = useState(null);
  const [submission, setSubmission] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [attemptsHistory, setAttemptsHistory] = useState(null);
  const [loadingAttempts, setLoadingAttempts] = useState(false);

  // Load results data
  useEffect(() => {
    loadResults();
    loadAttemptsHistory();
  }, [assessmentId]);

  const loadAttemptsHistory = async () => {
    try {
      setLoadingAttempts(true);
      const response = await apiService.getAssessmentAttemptsHistory(assessmentId);
      
      if (response.success) {
        setAttemptsHistory(response.data);
      }
    } catch (error) {
      console.error('Error loading attempts history:', error);
    } finally {
      setLoadingAttempts(false);
    }
  };

  const loadResults = async () => {
    try {
      setLoading(true);

      // Load assessment details
      const assessmentResponse = await apiService.getAssessmentInstances({ 
        student_id: user.id,
        assessment_id: assessmentId 
      });

      if (assessmentResponse.success && assessmentResponse.data.length > 0) {
        setAssessment(assessmentResponse.data[0]);
      }

      // Check if a specific submission is requested
      const submissionId = searchParams.get('submission');
      
      if (submissionId) {
        // Load specific submission results
        const resultsResponse = await apiService.getAssessmentResults(assessmentId, user.id, submissionId);
        if (resultsResponse.success) {
          setSubmission(resultsResponse.data);
          setQuestions(resultsResponse.data.questions || []);
        }
      } else {
        // Load latest results
        const resultsResponse = await apiService.getAssessmentResults(assessmentId, user.id);
        if (resultsResponse.success) {
          setSubmission(resultsResponse.data);
          setQuestions(resultsResponse.data.questions || []);
        }
      }

    } catch (error) {
      console.error('Error loading results:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load assessment results"
      });
    } finally {
      setLoading(false);
    }
  };



  const formatDuration = (minutes) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading results...</p>
        </div>
      </div>
    );
  }

  if (!assessment || !submission) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md text-center">
          <CardContent className="pt-6">
            <AlertTriangle className="h-16 w-16 text-red-600 mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">Results Not Found</h2>
            <p className="text-gray-600 mb-4">Assessment results could not be loaded.</p>
                         <Button onClick={() => navigate('/student/assessments')}>
               Back to Assessments
             </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Ensure proper number conversion and handle concatenated string values
  const parseScore = (value) => {
    if (typeof value === 'string') {
      // Handle concatenated values like "01.001.00" by taking the first valid number
      const match = value.match(/(\d+\.?\d*)/);
      return match ? parseFloat(match[1]) : 0;
    }
    return parseFloat(value) || 0;
  };

  const score = parseScore(submission.score);
  const maxScore = parseScore(submission.total_points) || parseScore(assessment.total_points);
  const percentage = parseScore(submission.percentage_score) || (maxScore > 0 ? (score / maxScore) * 100 : 0);
  const passingScore = assessment.passing_score || 70;
  const isPassed = percentage >= passingScore;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header - Compact */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate('/student/assessments')}
              >
                <ArrowLeft className="h-4 w-4 mr-1" />
                Back
              </Button>
              <div>
                <h1 className="text-2xl font-bold">{assessment.title}</h1>
                <p className="text-sm text-muted-foreground">Results</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content - Compact */}
      <div className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Score Display */}
          <div className="lg:col-span-1">
            <ScoreDisplay
              score={score}
              maxScore={maxScore}
              percentage={percentage}
              passingScore={passingScore}
            />

            {/* Assessment Details - Compact */}
            <Card className="mt-4">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Type:</span>
                    <span className="font-medium capitalize">{assessment.assessment_type?.replace('_', ' ')}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Duration:</span>
                    <span className="font-medium">{formatDuration(assessment.time_limit_minutes)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Completed:</span>
                    <span className="font-medium">{formatDate(submission.submitted_at)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Time Taken:</span>
                    <span className="font-medium">{formatDuration(submission.time_taken_minutes || 0)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Attempts History - Compact */}
            {attemptsHistory && (
              <Card className="mt-4">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center space-x-2">
                    <History className="h-4 w-4 text-blue-600" />
                    <span>Attempts</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {/* Past Attempts - Compact */}
                  <div className="space-y-2">
                    <h4 className="text-xs font-medium text-gray-700">Past Attempts:</h4>
                    {attemptsHistory.attempts.map((attempt, index) => (
                      <div key={attempt.id} className="flex items-center justify-between p-2 bg-gray-50 rounded text-xs">
                        <div className="flex items-center space-x-2">
                          <span className="font-medium">#{attempt.attempt_number}:</span>
                          <span className="text-gray-600">
                            {attempt.percentage_score}% • {attempt.time_taken_minutes}m
                          </span>
                        </div>
                        <span className="text-gray-500">
                          {new Date(attempt.submitted_at).toLocaleDateString()}
                        </span>
                      </div>
                    ))}
                  </div>
                  
                  {/* Retake Information - Compact */}
                  {attemptsHistory.can_retake && (
                    <div className="p-2 bg-green-50 border border-green-200 rounded">
                      <div className="text-xs text-green-700 mb-2">
                        <strong>Can retake!</strong> Next: {attemptsHistory.next_attempt_number}
                        {attemptsHistory.assessment.max_attempts && (
                          <span>/{attemptsHistory.assessment.max_attempts}</span>
                        )}
                      </div>
                      <Button 
                        onClick={() => navigate(`/student/assessments/${assessmentId}/take`)} 
                        size="sm"
                        className="w-full bg-green-600 hover:bg-green-700 text-xs"
                      >
                        <Play className="mr-1 h-3 w-3" />
                        Retake
                      </Button>
                    </div>
                  )}
                  
                  {!attemptsHistory.can_retake && attemptsHistory.assessment.max_attempts && (
                    <div className="p-2 bg-red-50 border border-red-200 rounded">
                      <div className="text-xs text-red-700">
                        <strong>Max attempts reached</strong>
                        <br />
                        Used all {attemptsHistory.assessment.max_attempts} attempts
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Achievement Badges - Compact */}
            {isPassed && (
              <Card className="mt-4 bg-gradient-to-r from-yellow-50 to-orange-50 border-yellow-200">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center space-x-2">
                    <Trophy className="h-4 w-4 text-yellow-600" />
                    <span>Achievements</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Medal className="h-3 w-3 text-yellow-600" />
                    <span className="text-xs">Completed</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="h-3 w-3 text-green-600" />
                    <span className="text-xs">Passed</span>
                  </div>
                  {percentage >= 90 && (
                    <div className="flex items-center space-x-2">
                      <Crown className="h-3 w-3 text-purple-600" />
                      <span className="text-xs">Excellent</span>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>

          {/* Results Tabs */}
          <div className="lg:col-span-2">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="questions">Question Review</TabsTrigger>
                <TabsTrigger value="analytics">Analytics</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-4">
                {loading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="text-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                      <p className="mt-2 text-sm text-muted-foreground">Loading overview...</p>
                    </div>
                  </div>
                ) : !submission || !assessment ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="text-center">
                      <AlertTriangle className="h-8 w-8 text-orange-600 mx-auto mb-2" />
                      <p className="text-sm text-muted-foreground">No results data available</p>
                    </div>
                  </div>
                ) : (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                  >
                  {/* Performance Summary - Compact */}
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base flex items-center space-x-2">
                        <TrendingUp className="h-4 w-4" />
                        Performance Summary
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-gray-600">Questions:</span>
                            <span className="font-medium">
                              {questions.length || 0}
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-gray-600">Score:</span>
                            <span className="font-medium text-green-600">
                              {score.toFixed(1)}/{maxScore.toFixed(1)}
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-gray-600">Accuracy:</span>
                            <span className="font-medium">
                              {percentage.toFixed(1)}%
                            </span>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-gray-600">Time Used:</span>
                            <span className="font-medium">
                              {formatDuration(submission.time_taken_minutes || 0)}
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-gray-600">Time Limit:</span>
                            <span className="font-medium">
                              {formatDuration(assessment.time_limit_minutes || 0)}
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-gray-600">Status:</span>
                            <span className={`font-medium ${isPassed ? 'text-green-600' : 'text-red-600'}`}>
                              {isPassed ? 'Passed' : 'Failed'}
                            </span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Assessment Summary - Compact */}
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base flex items-center space-x-2">
                        <BarChart3 className="h-4 w-4" />
                        Assessment Summary
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-gray-600">Type:</span>
                            <span className="font-medium capitalize">
                              {assessment.assessment_type?.replace('_', ' ') || 'N/A'}
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-gray-600">Passing Score:</span>
                            <span className="font-medium">
                              {passingScore}%
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-gray-600">Total Points:</span>
                            <span className="font-medium">
                              {maxScore.toFixed(1)}
                            </span>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-gray-600">Started:</span>
                            <span className="font-medium text-xs">
                              {submission.started_at ? formatDate(submission.started_at) : 'N/A'}
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-gray-600">Submitted:</span>
                            <span className="font-medium text-xs">
                              {submission.submitted_at ? formatDate(submission.submitted_at) : 'N/A'}
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-gray-600">Attempt:</span>
                            <span className="font-medium">
                              #{submission.attempt_number || 1}
                            </span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>



                  {/* Recommendations - Compact */}
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base flex items-center space-x-2">
                        <Lightbulb className="h-4 w-4" />
                        Recommendations
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {isPassed ? (
                          <div className="flex items-start space-x-2">
                            <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
                            <div>
                              <p className="font-medium text-green-800 text-sm">Great job!</p>
                              <p className="text-xs text-gray-600">
                                You've successfully passed this assessment.
                              </p>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-start space-x-2">
                            <AlertTriangle className="h-4 w-4 text-orange-600 mt-0.5" />
                            <div>
                              <p className="font-medium text-orange-800 text-sm">Areas for improvement</p>
                              <p className="text-xs text-gray-600">
                                Review wrong questions and focus on those topics.
                              </p>
                            </div>
                          </div>
                        )}
                        
                        {percentage < 80 && (
                          <div className="flex items-start space-x-2">
                            <BookOpen className="h-4 w-4 text-blue-600 mt-0.5" />
                            <div>
                              <p className="font-medium text-blue-800 text-sm">Study suggestions</p>
                              <p className="text-xs text-gray-600">
                                Review course materials and practice similar questions.
                              </p>
                            </div>
                          </div>
                        )}

                        {percentage >= 90 && (
                          <div className="flex items-start space-x-2">
                            <Trophy className="h-4 w-4 text-yellow-600 mt-0.5" />
                            <div>
                              <p className="font-medium text-yellow-800 text-sm">Outstanding performance!</p>
                              <p className="text-xs text-gray-600">
                                You achieved an excellent score. Keep up the great work!
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                  </motion.div>
                )}
              </TabsContent>

              <TabsContent value="questions" className="space-y-6">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                >
                  <div className="space-y-4">
                    {questions.map((question, index) => {
                      return (
                        <QuestionReview
                          key={question.id}
                          question={question}
                          userAnswer={question.user_answer}
                          correctAnswer={question.correct_answer}
                          isCorrect={question.is_correct}
                          points={question.is_correct ? (question.points || 1) : 0}
                          maxPoints={question.points || 1}
                        />
                      );
                    })}
                  </div>
                </motion.div>
              </TabsContent>

              <TabsContent value="analytics" className="space-y-6">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                >
                  <PerformanceAnalytics
                    questions={questions}
                    totalPoints={score}
                    maxPoints={maxScore}
                  />
                </motion.div>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  );
  };
  
export default StudentAssessmentResultsPage; 