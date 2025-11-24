import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/ui/use-toast';
import apiService from '@/services/api';
import { motion, AnimatePresence } from 'framer-motion';
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
  Play,
  Clock,
  Star,
  Zap,
  Shield,
  Globe,
  Smartphone,
  Monitor,
  Download,
  Share2,
  RefreshCw,
  Hash,
  FileText,
  Code
} from 'lucide-react';

// Enhanced Score Display Component
const EnhancedScoreDisplay = ({ score, maxScore, percentage, passingScore, isPassed, isAutoSubmitted = false }) => {
  const getScoreColor = () => {
    if (percentage >= 90) return 'text-green-600';
    if (percentage >= 80) return 'text-blue-600';
    if (percentage >= 70) return 'text-yellow-600';
    if (percentage >= 60) return 'text-orange-600';
    return 'text-red-600';
  };

  const getScoreMessage = () => {
    if (percentage >= 95) return 'Outstanding!';
    if (percentage >= 90) return 'Excellent!';
    if (percentage >= 80) return 'Great job!';
    if (percentage >= 70) return 'Good work!';
    if (percentage >= 60) return 'Not bad!';
    return 'Keep trying!';
  };

  const getAchievementLevel = () => {
    if (percentage >= 95) return { level: 'Master', icon: Crown, color: 'text-purple-600' };
    if (percentage >= 90) return { level: 'Expert', icon: Trophy, color: 'text-yellow-600' };
    if (percentage >= 80) return { level: 'Advanced', icon: Award, color: 'text-blue-600' };
    if (percentage >= 70) return { level: 'Proficient', icon: Medal, color: 'text-green-600' };
    if (percentage >= 60) return { level: 'Developing', icon: Target, color: 'text-orange-600' };
    return { level: 'Beginner', icon: BookOpen, color: 'text-gray-600' };
  };

  const achievement = getAchievementLevel();
  const AchievementIcon = achievement.icon;

  return (
    <Card className={`${isPassed ? 'border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20' : 'border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20'} border-2`}>
      <CardContent className="p-6 text-center">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="space-y-4"
        >
          {/* Score Circle */}
          <div className="relative inline-block">
            <div className="w-32 h-32 rounded-full border-8 border-gray-200 dark:border-gray-700 flex items-center justify-center relative overflow-hidden">
              <div className="text-center z-10">
                <div className={`text-4xl font-bold ${getScoreColor()}`}>
                  {percentage.toFixed(1)}%
                </div>
                <div className="text-sm text-muted-foreground">
                  {score.toFixed(1)}/{maxScore.toFixed(1)}
                </div>
              </div>
              <div 
                className="absolute inset-0 rounded-full border-8 border-transparent border-t-green-500 transform rotate-45"
                style={{
                  background: `conic-gradient(from 0deg, #10b981 0deg ${(percentage / 100) * 360}deg, #e5e7eb ${(percentage / 100) * 360}deg 360deg)`
                }}
              />
            </div>
          </div>

          {/* Status and Message */}
          <div className="space-y-2">
            <div className="flex items-center justify-center space-x-2">
              {isPassed ? (
                <CheckCircle className="h-6 w-6 text-green-600" />
              ) : (
                <XCircle className="h-6 w-6 text-red-600" />
              )}
              <span className={`text-xl font-bold ${isPassed ? 'text-green-600' : 'text-red-600'}`}>
                {isPassed ? 'PASSED' : 'FAILED'}
              </span>
            </div>
            <p className="text-lg font-semibold text-foreground">
              {getScoreMessage()}
            </p>
            <p className="text-sm text-muted-foreground">
              Passing Score: {passingScore}%
            </p>
            
            {/* Auto-Submission Indicator */}
            {isAutoSubmitted && (
              <div className="mt-3 p-3 bg-orange-100 dark:bg-orange-900/20 border border-orange-300 dark:border-orange-800 rounded-lg">
                <div className="flex items-center space-x-2">
                  <AlertTriangle className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                  <span className="text-sm text-orange-800 dark:text-orange-200 font-medium">
                    This assessment was automatically submitted when time expired
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Achievement Badge */}
          <div className="flex items-center justify-center space-x-2">
            <AchievementIcon className={`h-5 w-5 ${achievement.color}`} />
            <span className={`font-semibold ${achievement.color}`}>
              {achievement.level}
            </span>
          </div>
        </motion.div>
      </CardContent>
    </Card>
  );
};

// Performance Analytics Component
const PerformanceAnalytics = ({ questions, totalPoints, maxPoints, timeTaken, timeLimit }) => {
  const analytics = useMemo(() => {
    const questionTypes = questions.reduce((acc, question) => {
      const type = question.question_type || 'multiple_choice';
      if (!acc[type]) {
        acc[type] = { count: 0, correct: 0, points: 0, maxPoints: 0 };
      }
      acc[type].count++;
      
      const questionPoints = Number(question.points) || 1;
      acc[type].maxPoints += questionPoints;
      
      if (question.is_correct) {
        acc[type].correct++;
        acc[type].points += questionPoints;
      }
      
      return acc;
    }, {});

    const overallAccuracy = maxPoints > 0 ? (totalPoints / maxPoints) * 100 : 0;
    const timeEfficiency = timeLimit > 0 ? ((timeLimit - timeTaken) / timeLimit) * 100 : 0;

    return {
      questionTypes,
      overallAccuracy,
      timeEfficiency,
      totalQuestions: questions.length,
      correctQuestions: questions.filter(q => q.is_correct).length
    };
  }, [questions, totalPoints, maxPoints, timeTaken, timeLimit]);

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
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                {analytics.overallAccuracy.toFixed(1)}%
              </div>
              <div className="text-sm text-muted-foreground">Accuracy</div>
            </div>
            <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                {analytics.correctQuestions}/{analytics.totalQuestions}
              </div>
              <div className="text-sm text-muted-foreground">Questions Correct</div>
            </div>
            <div className="text-center p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
              <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                {totalPoints.toFixed(1)}
              </div>
              <div className="text-sm text-muted-foreground">Points Earned</div>
            </div>
            <div className="text-center p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
              <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                {analytics.timeEfficiency.toFixed(1)}%
              </div>
              <div className="text-sm text-muted-foreground">Time Efficiency</div>
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
            {Object.entries(analytics.questionTypes).map(([type, stats]) => {
              const accuracy = stats.count > 0 ? (stats.correct / stats.count) * 100 : 0;
              const pointsPercentage = stats.maxPoints > 0 ? (stats.points / stats.maxPoints) * 100 : 0;
              
              return (
                <motion.div
                  key={type}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span className="font-medium capitalize">
                        {type.replace('_', ' ')}
                      </span>
                      <Badge variant="outline">{stats.count} questions</Badge>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {stats.points.toFixed(1)}/{stats.maxPoints.toFixed(1)} points
                    </div>
                  </div>
                  <div className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span>Accuracy</span>
                      <span>{accuracy.toFixed(1)}%</span>
                    </div>
                    <Progress value={accuracy} className="h-2" />
                  </div>
                </motion.div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Time Analysis */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Clock className="h-5 w-5" />
            Time Analysis
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                {Math.floor(timeTaken / 60)}:{(timeTaken % 60).toString().padStart(2, '0')}
              </div>
              <div className="text-sm text-muted-foreground">Time Used</div>
            </div>
            <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                {Math.floor(timeLimit / 60)}:{(timeLimit % 60).toString().padStart(2, '0')}
              </div>
              <div className="text-sm text-muted-foreground">Time Limit</div>
            </div>
            <div className="text-center p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
              <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                {analytics.timeEfficiency.toFixed(1)}%
              </div>
              <div className="text-sm text-muted-foreground">Efficiency</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

// Question Review Component
const QuestionReview = ({ question, userAnswer, correctAnswer, isCorrect, points, maxPoints, questionNumber }) => {
  const [showExplanation, setShowExplanation] = useState(false);

  const getQuestionTypeIcon = (type) => {
    switch (type) {
      case 'multiple_choice': return <Hash className="h-4 w-4" />;
      case 'true_false': return <CheckCircle className="h-4 w-4" />;
      case 'short_answer': return <FileText className="h-4 w-4" />;
      case 'essay': return <FileText className="h-4 w-4" />;
      case 'coding': return <Code className="h-4 w-4" />;
      default: return <FileText className="h-4 w-4" />;
    }
  };

  const getQuestionTypeColor = (type) => {
    switch (type) {
      case 'multiple_choice': return 'text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/20';
      case 'true_false': return 'text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900/20';
      case 'short_answer': return 'text-orange-600 dark:text-orange-400 bg-orange-100 dark:bg-orange-900/20';
      case 'essay': return 'text-purple-600 dark:text-purple-400 bg-purple-100 dark:bg-purple-900/20';
      case 'coding': return 'text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900/20';
      default: return 'text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-900/20';
    }
  };

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
            optionClass += " bg-green-100 dark:bg-green-900/20 border-green-300 dark:border-green-700 text-green-800 dark:text-green-200";
          } else if (isUserAnswer && !isCorrectOption) {
            optionClass += " bg-red-100 dark:bg-red-900/20 border-red-300 dark:border-red-700 text-red-800 dark:text-red-200";
          } else if (isCorrectOption) {
            optionClass += " bg-green-100 dark:bg-green-900/20 border-green-300 dark:border-green-700 text-green-800 dark:text-green-200";
          } else {
            optionClass += " bg-muted border-border text-foreground";
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

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card className={`${isCorrect ? 'border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20' : 'border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20'}`}>
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
                <Badge className={getQuestionTypeColor(question.question_type)}>
                  {getQuestionTypeIcon(question.question_type)}
                  <span className="ml-1">
                    {question.question_type?.replace('_', ' ').toUpperCase()}
                  </span>
                </Badge>
              </div>
              <div className="text-sm text-muted-foreground">
                {points}/{maxPoints} points
              </div>
            </div>

            {/* Question Text */}
            <div>
              <h4 className="font-medium mb-2">Question {questionNumber}:</h4>
              <div className="p-3 bg-card border border-border rounded-lg">
                <p className="text-foreground whitespace-pre-wrap">{question.question_text}</p>
              </div>
            </div>

            {/* Options for multiple choice questions */}
            {question.question_type === 'multiple_choice' && renderOptions()}

            {/* Your Answer */}
            <div>
              <h5 className="font-medium text-sm mb-2">Your Answer:</h5>
              <div className={`p-3 rounded-lg ${
                isCorrect ? 'bg-green-100 dark:bg-green-900/20 border border-green-300 dark:border-green-700' : 'bg-red-100 dark:bg-red-900/20 border border-red-300 dark:border-red-700'
              }`}>
                <span className="text-sm whitespace-pre-wrap">
                  {userAnswer || 'No answer provided'}
                </span>
              </div>
            </div>

            {/* Correct Answer */}
            <div>
              <h5 className="font-medium text-sm mb-2">Correct Answer:</h5>
              <div className="p-3 rounded-lg bg-green-100 dark:bg-green-900/20 border border-green-300 dark:border-green-700">
                <span className="text-sm whitespace-pre-wrap">
                  {correctAnswer || 'Not available'}
                </span>
              </div>
            </div>

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
                  {showExplanation ? 'Hide' : 'Show'} Explanation
                </Button>
                <AnimatePresence>
                  {showExplanation && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="mt-3 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg"
                    >
                      <p className="text-sm text-blue-800 dark:text-blue-200 whitespace-pre-wrap">
                        {question.explanation}
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

// Main Enhanced Results Component
const StudentAssessmentResultsEnhanced = () => {
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
  const [isAutoSubmitted, setIsAutoSubmitted] = useState(false);
  const [error, setError] = useState(null);

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
        // Load specific submission results using submissionId endpoint
        const resultsResponse = await apiService.get(`/student-assessments/${submissionId}/results`);
        if (resultsResponse.success) {
          setSubmission(resultsResponse.data);
          setQuestions(resultsResponse.data.answers || resultsResponse.data.questions || []);
          setIsAutoSubmitted(resultsResponse.data.autoSubmitted || false);
        }
      } else {
        // Load latest results
        const resultsResponse = await apiService.getAssessmentResults(assessmentId, user.id);
        if (resultsResponse.success) {
          setSubmission(resultsResponse.data);
          setQuestions(resultsResponse.data.questions || []);
          setIsAutoSubmitted(resultsResponse.data.autoSubmitted || false);
        }
      }

    } catch (error) {
      console.error('Error loading results:', error);
      
      // Set error state clearly
      setError({
        message: error.message || 'Failed to load assessment results',
        isFallback: false,
        canRetry: true
      });
      
      toast({
        variant: "destructive",
        title: "Error Loading Results",
        description: error.message || "Failed to load assessment results. Please try again or contact support."
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

  if (error && !error.canRetry) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="h-5 w-5" />
              Error Loading Results
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Alert variant="destructive">
              <AlertDescription>
                {error.message || 'Failed to load assessment results'}
              </AlertDescription>
            </Alert>
            {error.isFallback && (
              <Alert className="mt-4">
                <Info className="h-4 w-4" />
                <AlertDescription>
                  Note: Results shown may be calculated from cached data. Please refresh for accurate results.
                </AlertDescription>
              </Alert>
            )}
            <div className="flex gap-2 mt-4">
              <Button 
                onClick={() => {
                  setError(null);
                  loadResults();
                }} 
                variant="outline"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Retry
              </Button>
              <Button onClick={() => navigate('/student/assessments')}>
                Back to Assessments
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!assessment || !submission) {
    if (!loading && !error) {
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
    return null;
  }

  // Parse scores safely
  const parseScore = (value) => {
    if (typeof value === 'string') {
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
  const timeTaken = submission.time_taken_minutes || 0;
  const timeLimit = assessment.time_limit_minutes || 0;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-card border-b">
        <div className="container mx-auto px-4 py-6">
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
                <h1 className="text-3xl font-bold text-foreground">{assessment.title}</h1>
                <p className="text-muted-foreground">Assessment Results</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
              <Button variant="outline" size="sm">
                <Share2 className="h-4 w-4 mr-2" />
                Share
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Score Display */}
          <div className="lg:col-span-1">
            <EnhancedScoreDisplay
              score={score}
              maxScore={maxScore}
              percentage={percentage}
              passingScore={passingScore}
              isPassed={isPassed}
              isAutoSubmitted={isAutoSubmitted}
            />

            {/* Assessment Details */}
            <Card className="mt-6">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Assessment Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Type:</span>
                    <span className="font-medium capitalize">
                      {assessment.assessment_type?.replace('_', ' ')}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Duration:</span>
                    <span className="font-medium">{formatDuration(timeLimit)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Completed:</span>
                    <span className="font-medium">{formatDate(submission.submitted_at)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Time Used:</span>
                    <span className="font-medium">{formatDuration(timeTaken)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Attempts History */}
            {attemptsHistory && (
              <Card className="mt-6">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center space-x-2">
                    <History className="h-4 w-4 text-blue-600" />
                    <span>Attempts</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="space-y-2">
                    {attemptsHistory.attempts.map((attempt, index) => (
                      <div key={attempt.id} className="flex items-center justify-between p-2 bg-muted rounded text-sm">
                        <div className="flex items-center space-x-2">
                          <span className="font-medium">#{attempt.attempt_number}:</span>
                          <span className="text-muted-foreground">
                            {attempt.percentage_score}% • {attempt.time_taken_minutes}m
                          </span>
                        </div>
                        <span className="text-muted-foreground">
                          {new Date(attempt.submitted_at).toLocaleDateString()}
                        </span>
                      </div>
                    ))}
                  </div>
                  
                  {attemptsHistory.can_retake && (
                    <div className="p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded">
                      <div className="text-sm text-green-700 dark:text-green-300 mb-2">
                        <strong>Can retake!</strong> Next: {attemptsHistory.next_attempt_number}
                        {attemptsHistory.assessment.max_attempts && (
                          <span>/{attemptsHistory.assessment.max_attempts}</span>
                        )}
                      </div>
                      <Button 
                        onClick={async () => {
                          try {
                            // Set retake flag BEFORE calling API
                            localStorage.setItem(`retake_${assessmentId}`, 'true');
                            console.log('Retake flag set:', `retake_${assessmentId}`);
                            
                            // Call the retake API endpoint using the API service
                            const result = await apiService.retakeAssessment(assessmentId);
                            
                            if (result.success) {
                              toast({
                                title: "Assessment Taking Unavailable",
                                description: "Assessment taking functionality has been temporarily disabled.",
                                duration: 3000
                              });
                              
                              navigate('/student/assessments');
                            } else {
                              throw new Error(result.message || 'Failed to start retake');
                            }
                          } catch (error) {
                            // Clear the flag if retake failed
                            localStorage.removeItem(`retake_${assessmentId}`);
                            console.error('Error starting retake:', error);
                            toast({
                              title: "Retake Failed",
                              description: error.message || "Failed to start assessment retake",
                              variant: "destructive",
                              duration: 5000
                            });
                          }
                        }} 
                        size="sm"
                        className="w-full bg-green-600 hover:bg-green-700"
                      >
                        <Play className="mr-1 h-3 w-3" />
                        Retake
                      </Button>
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

              <TabsContent value="overview" className="space-y-6">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                >
                  {/* Performance Summary */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center space-x-2">
                        <TrendingUp className="h-5 w-5" />
                        Performance Summary
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-muted-foreground">Questions:</span>
                            <span className="font-medium">{questions.length || 0}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-muted-foreground">Score:</span>
                            <span className="font-medium text-green-600 dark:text-green-400">
                              {score.toFixed(1)}/{maxScore.toFixed(1)}
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-muted-foreground">Accuracy:</span>
                            <span className="font-medium">{percentage.toFixed(1)}%</span>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-muted-foreground">Time Used:</span>
                            <span className="font-medium">{formatDuration(timeTaken)}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-muted-foreground">Time Limit:</span>
                            <span className="font-medium">{formatDuration(timeLimit)}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-muted-foreground">Status:</span>
                            <span className={`font-medium ${isPassed ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                              {isPassed ? 'Passed' : 'Failed'}
                            </span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Recommendations */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center space-x-2">
                        <Lightbulb className="h-5 w-5" />
                        Recommendations
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {isPassed ? (
                          <div className="flex items-start space-x-2">
                            <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                            <div>
                              <p className="font-medium text-green-800 dark:text-green-200">Great job!</p>
                              <p className="text-sm text-muted-foreground">
                                You've successfully passed this assessment.
                              </p>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-start space-x-2">
                            <AlertTriangle className="h-5 w-5 text-orange-600 mt-0.5" />
                            <div>
                              <p className="font-medium text-orange-800 dark:text-orange-200">Areas for improvement</p>
                              <p className="text-sm text-muted-foreground">
                                Review wrong questions and focus on those topics.
                              </p>
                            </div>
                          </div>
                        )}
                        
                        {percentage < 80 && (
                          <div className="flex items-start space-x-2">
                            <BookOpen className="h-5 w-5 text-blue-600 mt-0.5" />
                            <div>
                              <p className="font-medium text-blue-800 dark:text-blue-200">Study suggestions</p>
                              <p className="text-sm text-muted-foreground">
                                Review course materials and practice similar questions.
                              </p>
                            </div>
                          </div>
                        )}

                        {percentage >= 90 && (
                          <div className="flex items-start space-x-2">
                            <Trophy className="h-5 w-5 text-yellow-600 mt-0.5" />
                            <div>
                              <p className="font-medium text-yellow-800 dark:text-yellow-200">Outstanding performance!</p>
                              <p className="text-sm text-muted-foreground">
                                You achieved an excellent score. Keep up the great work!
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              </TabsContent>

              <TabsContent value="questions" className="space-y-6">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                >
                  <div className="space-y-4">
                    {questions.map((question, index) => (
                      <QuestionReview
                        key={question.id}
                        question={question}
                        userAnswer={question.user_answer}
                        correctAnswer={question.correct_answer}
                        isCorrect={question.is_correct}
                        points={question.is_correct ? (question.points || 1) : 0}
                        maxPoints={question.points || 1}
                        questionNumber={index + 1}
                      />
                    ))}
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
                    timeTaken={timeTaken}
                    timeLimit={timeLimit}
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

export default StudentAssessmentResultsEnhanced;

