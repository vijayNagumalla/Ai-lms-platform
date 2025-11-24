import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Trophy, 
  Target, 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  Award,
  TrendingUp,
  BarChart3,
  PieChart,
  Download,
  Share,
  ArrowLeft,
  RefreshCw,
  Eye,
  EyeOff,
  Star,
  Flag,
  Code,
  FileText,
  BookOpen,
  Timer,
  Users,
  Calendar,
  Shield
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import apiService from '@/services/api';

const AssessmentResultsStep = ({ 
  assessment, 
  submission, 
  questions, 
  answers,
  flaggedQuestions,
  proctoringViolations,
  onComplete,
  onBack,
  onCancel
}) => {
  const navigate = useNavigate();
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showAnswers, setShowAnswers] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    fetchResults();
  }, [submission]);

  const fetchResults = async () => {
    try {
      setLoading(true);
      
      // Fetch actual results from backend
      if (submission?.id && assessment?.id) {
        const response = await apiService.getAssessmentResults(assessment.id, submission.student_id || submission.user_id);
        
        if (response.success && response.data) {
          const data = response.data;
          
          // Calculate time taken from started_at to submitted_at
          let timeTakenSeconds = 0;
          if (data.started_at && data.submitted_at) {
            const startTime = new Date(data.started_at);
            const endTime = new Date(data.submitted_at);
            timeTakenSeconds = Math.floor((endTime - startTime) / 1000);
          } else if (data.started_at) {
            // If not submitted yet, calculate from start to now
            const startTime = new Date(data.started_at);
            timeTakenSeconds = Math.floor((Date.now() - startTime.getTime()) / 1000);
          } else if (data.time_taken_minutes) {
            // Fallback to stored time_taken_minutes
            timeTakenSeconds = data.time_taken_minutes * 60;
          }
          
          // Extract coding results from questions
          const codingResults = [];
          if (data.questions && Array.isArray(data.questions)) {
            data.questions.forEach(q => {
              if (q.question_type === 'coding' && q.coding_result) {
                codingResults.push({
                  questionId: q.id,
                  testCasesPassed: q.coding_result.testCasesPassed || 0,
                  totalTestCases: q.coding_result.totalTestCases || (q.test_cases?.length || 0),
                  score: q.coding_result.score || 0
                });
              }
            });
          }
          
          // If no coding results from backend, try to get from questions prop
          if (codingResults.length === 0 && questions) {
            questions.forEach(q => {
              if (q.question_type === 'coding') {
                const answer = answers[q.id];
                if (answer && typeof answer === 'object' && answer.testResults) {
                  const passed = answer.testResults.filter(r => r.result?.verdict?.status === 'accepted').length;
                  const total = answer.testResults.length || q.test_cases?.length || 0;
                  codingResults.push({
                    questionId: q.id,
                    testCasesPassed: passed,
                    totalTestCases: total,
                    score: total > 0 ? Math.round((passed / total) * 100) : 0
                  });
                } else if (q.test_cases && q.test_cases.length > 0) {
                  codingResults.push({
                    questionId: q.id,
                    testCasesPassed: 0,
                    totalTestCases: q.test_cases.length,
                    score: 0
                  });
                }
              }
            });
          }
          
          const results = {
            score: data.score || data.total_score || 0,
            maxScore: data.total_points || assessment.total_points || 0,
            percentage: data.percentage_score || data.percentage || 0,
            grade: calculateGradeFromPercentage(data.percentage_score || data.percentage || 0),
            timeTaken: timeTakenSeconds,
            timeLimit: assessment.time_limit_minutes ? assessment.time_limit_minutes * 60 : 0,
            questions: (data.questions || questions || []).map((question, index) => ({
              ...question,
              questionNumber: index + 1,
              userAnswer: question.user_answer || answers[question.id],
              isCorrect: question.is_correct !== undefined ? question.is_correct : false,
              pointsEarned: question.points_earned || (question.is_correct ? (question.points || 1) : 0),
              timeSpent: question.time_spent || 0
            })),
            codingResults: codingResults,
            proctoringSummary: {
              violations: proctoringViolations.length,
              severity: proctoringViolations.length > 0 ? 'medium' : 'low',
              flaggedActivities: proctoringViolations.map(v => v.type)
            },
            canRetake: assessment.max_attempts > 1 && (submission.attempt_number || 1) < assessment.max_attempts,
            nextAttemptAvailable: assessment.time_between_attempts_hours > 0 ? 
              new Date(Date.now() + assessment.time_between_attempts_hours * 60 * 60 * 1000) : null
          };
          
          setResults(results);
        } else {
          // Fallback to calculated results if API fails
          setResults(calculateFallbackResults(timeTakenSeconds));
        }
      } else {
        // Fallback to calculated results if no submission ID
        setResults(calculateFallbackResults(calculateTimeTaken()));
      }
    } catch (error) {
      console.error('Error fetching results:', error);
      toast.error('Failed to load results');
      // Fallback to calculated results
      setResults(calculateFallbackResults(calculateTimeTaken()));
    } finally {
      setLoading(false);
    }
  };
  
  const calculateFallbackResults = (timeTakenSeconds) => {
    return {
      score: calculateScore(),
      maxScore: assessment.total_points,
      percentage: calculatePercentage(),
      grade: calculateGrade(),
      timeTaken: timeTakenSeconds,
      timeLimit: assessment.time_limit_minutes ? assessment.time_limit_minutes * 60 : 0,
      questions: questions.map((question, index) => {
        const answer = answers[question.id];
        let isCorrect = false;
        let pointsEarned = 0;
        const questionPoints = Number(question.points) || 1;

        if (answer) {
          // For coding questions, check if all tests passed
          if (question.question_type === 'coding') {
            if (typeof answer === 'object' && answer.allTestsPassed === true) {
              isCorrect = true;
              pointsEarned = questionPoints;
            } else if (typeof answer === 'object' && answer.testResults) {
              const allPassed = answer.testResults.every(r => r.result?.verdict?.status === 'accepted');
              if (allPassed && answer.testResults.length > 0) {
                isCorrect = true;
                pointsEarned = questionPoints;
              }
            }
          } 
          // For other question types, compare with correct answer
          else if (question.correct_answer) {
            const userAnswer = typeof answer === 'string' ? answer.trim() : JSON.stringify(answer);
            const correctAnswer = typeof question.correct_answer === 'string' 
              ? question.correct_answer.trim() 
              : JSON.stringify(question.correct_answer);
            
            if (userAnswer === correctAnswer) {
              isCorrect = true;
              pointsEarned = questionPoints;
            }
          }
        }

        return {
          ...question,
          questionNumber: index + 1,
          userAnswer: answer,
          isCorrect: isCorrect,
          pointsEarned: pointsEarned,
          timeSpent: 0
        };
      }),
      codingResults: questions
        .filter(q => q.question_type === 'coding')
        .map(q => {
          const answer = answers[q.id];
          let testCasesPassed = 0;
          let totalTestCases = q.test_cases?.length || 0;
          
          if (answer && typeof answer === 'object' && answer.testResults) {
            testCasesPassed = answer.testResults.filter(r => r.result?.verdict?.status === 'accepted').length;
            totalTestCases = answer.testResults.length || totalTestCases;
          }
          
          return {
            questionId: q.id,
            testCasesPassed: testCasesPassed,
            totalTestCases: totalTestCases,
            score: totalTestCases > 0 ? Math.round((testCasesPassed / totalTestCases) * 100) : 0
          };
        }),
      proctoringSummary: {
        violations: proctoringViolations.length,
        severity: proctoringViolations.length > 0 ? 'medium' : 'low',
        flaggedActivities: proctoringViolations.map(v => v.type)
      },
      canRetake: assessment.max_attempts > 1 && submission.attempt_number < assessment.max_attempts,
      nextAttemptAvailable: assessment.time_between_attempts_hours > 0 ? 
        new Date(Date.now() + assessment.time_between_attempts_hours * 60 * 60 * 1000) : null
    };
  };
  
  const calculateGradeFromPercentage = (percentage) => {
    if (percentage >= 90) return 'A';
    if (percentage >= 80) return 'B';
    if (percentage >= 70) return 'C';
    if (percentage >= 60) return 'D';
    return 'F';
  };

  const calculateScore = () => {
    // Calculate actual score from answers and question points
    let totalPoints = 0;
    let earnedPoints = 0;

    questions.forEach(question => {
      const questionPoints = Number(question.points) || 1;
      totalPoints += questionPoints;

      const answer = answers[question.id];
      if (!answer) {
        // No answer provided - no points
        return;
      }

      // For coding questions, check if all tests passed
      if (question.question_type === 'coding') {
        if (typeof answer === 'object' && answer.allTestsPassed === true) {
          earnedPoints += questionPoints;
        } else if (typeof answer === 'object' && answer.testResults) {
          const allPassed = answer.testResults.every(r => r.result?.verdict?.status === 'accepted');
          if (allPassed && answer.testResults.length > 0) {
            earnedPoints += questionPoints;
          }
        }
      } 
      // For other question types, compare with correct answer
      else if (question.correct_answer) {
        const userAnswer = typeof answer === 'string' ? answer.trim() : JSON.stringify(answer);
        const correctAnswer = typeof question.correct_answer === 'string' 
          ? question.correct_answer.trim() 
          : JSON.stringify(question.correct_answer);
        
        if (userAnswer === correctAnswer) {
          earnedPoints += questionPoints;
        }
      }
    });

    return Math.round(earnedPoints);
  };

  const calculatePercentage = () => {
    const score = calculateScore();
    const totalPoints = assessment.total_points || questions.reduce((sum, q) => sum + (Number(q.points) || 1), 0);
    if (totalPoints === 0) return 0;
    return Math.round((score / totalPoints) * 100);
  };

  const calculateGrade = () => {
    const percentage = calculatePercentage();
    return calculateGradeFromPercentage(percentage);
  };

  const calculateTimeTaken = () => {
    if (submission?.started_at) {
      const startTime = new Date(submission.started_at);
      const endTime = submission?.submitted_at ? new Date(submission.submitted_at) : new Date();
      return Math.floor((endTime - startTime) / 1000);
    }
    return 0;
  };

  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const getGradeColor = (grade) => {
    switch (grade) {
      case 'A': return 'text-green-600 bg-green-100';
      case 'B': return 'text-blue-600 bg-blue-100';
      case 'C': return 'text-yellow-600 bg-yellow-100';
      case 'D': return 'text-orange-600 bg-orange-100';
      case 'F': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getScoreColor = (percentage) => {
    if (percentage >= 90) return 'text-green-600';
    if (percentage >= 80) return 'text-blue-600';
    if (percentage >= 70) return 'text-yellow-600';
    if (percentage >= 60) return 'text-orange-600';
    return 'text-red-600';
  };

  const getQuestionTypeIcon = (questionType) => {
    switch (questionType) {
      case 'coding':
        return <Code className="h-4 w-4" />;
      case 'essay':
        return <FileText className="h-4 w-4" />;
      case 'multiple_choice':
      case 'true_false':
        return <Target className="h-4 w-4" />;
      default:
        return <BookOpen className="h-4 w-4" />;
    }
  };

  const handleRetake = () => {
    if (results.canRetake) {
      navigate(`/student/assessments/${assessment.id}/take?retake=true`);
    }
  };

  const handleDownloadResults = () => {
    // Implement download functionality
    toast.success('Results downloaded');
  };

  const handleShareResults = () => {
    // Implement share functionality
    toast.success('Results shared');
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
          <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Results Not Available</h2>
          <p className="text-gray-600 mb-4">Unable to load assessment results.</p>
          <Button onClick={() => navigate('/student/assessments')}>
            Back to Assessments
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl flex items-center">
                <Trophy className="h-6 w-6 mr-2" />
                Assessment Results
              </CardTitle>
              <p className="text-gray-600">{assessment.title}</p>
            </div>
            <div className="flex items-center space-x-2">
              <Badge className={getGradeColor(results.grade)}>
                Grade: {results.grade}
              </Badge>
              <Badge variant="outline">
                Attempt {submission.attempt_number}
              </Badge>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Score Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Score Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="text-center p-6 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg">
              <div className={`text-4xl font-bold ${getScoreColor(results.percentage)}`}>
                {results.percentage}%
              </div>
              <div className="text-sm text-blue-700">Overall Score</div>
            </div>
            
            <div className="text-center p-6 bg-gradient-to-br from-green-50 to-green-100 rounded-lg">
              <div className="text-4xl font-bold text-green-600">
                {results.score}
              </div>
              <div className="text-sm text-green-700">Points Earned</div>
            </div>
            
            <div className="text-center p-6 bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg">
              <div className="text-4xl font-bold text-purple-600">
                {results.maxScore}
              </div>
              <div className="text-sm text-purple-700">Total Points</div>
            </div>
            
            <div className="text-center p-6 bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg">
              <div className="text-4xl font-bold text-orange-600">
                {formatTime(results.timeTaken)}
              </div>
              <div className="text-sm text-orange-700">Time Taken</div>
            </div>
          </div>

          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600">Score Progress</span>
              <span className="text-sm text-gray-600">{results.score}/{results.maxScore}</span>
            </div>
            <Progress value={results.percentage} className="w-full" />
          </div>

          {/* Passing Score Indicator */}
          <div className="flex items-center justify-center space-x-4">
            <div className="flex items-center space-x-2">
              <div className={`w-3 h-3 rounded-full ${results.percentage >= assessment.passing_score ? 'bg-green-500' : 'bg-red-500'}`}></div>
              <span className="text-sm text-gray-600">
                Passing Score: {assessment.passing_score}%
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <div className={`w-3 h-3 rounded-full ${results.percentage >= assessment.passing_score ? 'bg-green-500' : 'bg-red-500'}`}></div>
              <span className={`text-sm font-medium ${results.percentage >= assessment.passing_score ? 'text-green-600' : 'text-red-600'}`}>
                {results.percentage >= assessment.passing_score ? 'PASSED' : 'FAILED'}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Detailed Results */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Detailed Results</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="questions">Questions</TabsTrigger>
              <TabsTrigger value="coding">Coding Results</TabsTrigger>
              <TabsTrigger value="proctoring">Proctoring</TabsTrigger>
            </TabsList>
            
            <TabsContent value="overview" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <h4 className="font-medium text-gray-800">Performance Metrics</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Questions Answered:</span>
                      <span className="text-sm font-medium">{Object.keys(answers).length}/{questions.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Correct Answers:</span>
                      <span className="text-sm font-medium">{results.questions.filter(q => q.isCorrect).length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Flagged Questions:</span>
                      <span className="text-sm font-medium">{flaggedQuestions.size}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Average Time per Question:</span>
                      <span className="text-sm font-medium">{formatTime(Math.floor(results.timeTaken / questions.length))}</span>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <h4 className="font-medium text-gray-800">Assessment Details</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Assessment Type:</span>
                      <span className="text-sm font-medium">{assessment.assessment_type || 'Quiz'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Time Limit:</span>
                      <span className="text-sm font-medium">{formatTime(results.timeLimit)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Attempt Number:</span>
                      <span className="text-sm font-medium">{submission.attempt_number}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Submission Time:</span>
                      <span className="text-sm font-medium">{new Date().toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="questions" className="space-y-4">
              <div className="flex items-center justify-between mb-4">
                <h4 className="font-medium text-gray-800">Question Review</h4>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowAnswers(!showAnswers)}
                >
                  {showAnswers ? <EyeOff className="h-4 w-4 mr-1" /> : <Eye className="h-4 w-4 mr-1" />}
                  {showAnswers ? 'Hide' : 'Show'} Answers
                </Button>
              </div>
              
              <div className="space-y-3">
                {results.questions.map((question) => (
                  <div key={question.id} className={`p-4 border rounded-lg ${
                    question.isCorrect ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'
                  }`}>
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <span className="font-medium">Question {question.questionNumber}</span>
                        {getQuestionTypeIcon(question.question_type)}
                        <Badge variant="outline" className="text-xs">
                          {question.question_type.replace('_', ' ')}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {question.points || 1} pts
                        </Badge>
                        {flaggedQuestions.has(question.id) && (
                          <Flag className="h-4 w-4 text-yellow-600" />
                        )}
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        {question.isCorrect ? (
                          <CheckCircle className="h-5 w-5 text-green-600" />
                        ) : (
                          <XCircle className="h-5 w-5 text-red-600" />
                        )}
                        <Badge variant={question.isCorrect ? 'default' : 'destructive'}>
                          {question.pointsEarned}/{question.points || 1} pts
                        </Badge>
                      </div>
                    </div>
                    
                    <div className="text-sm text-gray-700 mb-2">
                      {question.question_text}
                    </div>
                    
                    {showAnswers && (
                      <div className="space-y-2">
                        <div>
                          <span className="text-xs font-medium text-gray-600">Your Answer:</span>
                          <div className="text-sm bg-white p-2 rounded border">
                            {(() => {
                              if (!question.userAnswer) return 'No answer provided';
                              if (question.question_type === 'coding') {
                                const answer = question.userAnswer;
                                if (typeof answer === 'object' && answer.code) {
                                  return (
                                    <div>
                                      <div className="font-semibold mb-1">Language: {answer.language || 'N/A'}</div>
                                      <pre className="bg-gray-100 p-2 rounded text-xs overflow-auto max-h-40">
                                        {answer.code}
                                      </pre>
                                      {answer.testResults && (
                                        <div className="mt-2 text-xs">
                                          Test Results: {answer.testResults.filter(r => 
                                            r.result?.verdict?.status === 'accepted' || r.status === 'accepted'
                                          ).length} / {answer.testResults.length} passed
                                        </div>
                                      )}
                                    </div>
                                  );
                                }
                                return JSON.stringify(question.userAnswer);
                              } else if (question.question_type === 'multiple_choice' || question.question_type === 'single_choice') {
                                const answer = question.userAnswer;
                                if (typeof answer === 'object' && answer.selected_options) {
                                  return Array.isArray(answer.selected_options) 
                                    ? answer.selected_options.join(', ')
                                    : answer.selected_options;
                                }
                                return typeof answer === 'string' ? answer : JSON.stringify(answer);
                              } else if (question.question_type === 'true_false') {
                                return typeof question.userAnswer === 'string' 
                                  ? question.userAnswer 
                                  : JSON.stringify(question.userAnswer);
                              } else {
                                return typeof question.userAnswer === 'string' 
                                  ? question.userAnswer 
                                  : JSON.stringify(question.userAnswer);
                              }
                            })()}
                          </div>
                        </div>
                        
                        {question.correct_answer && (
                          <div>
                            <span className="text-xs font-medium text-gray-600">Correct Answer:</span>
                            <div className="text-sm bg-white p-2 rounded border">
                              {(() => {
                                if (question.question_type === 'coding') {
                                  return question.correct_answer.code || question.correct_answer || 'Manual grading required';
                                } else if (question.question_type === 'multiple_choice' || question.question_type === 'single_choice') {
                                  if (Array.isArray(question.correct_answer)) {
                                    return question.correct_answer.join(', ');
                                  }
                                  return question.correct_answer;
                                } else if (question.correct_answers && Array.isArray(question.correct_answers)) {
                                  // Handle correct_answers array format
                                  if (question.options && Array.isArray(question.options)) {
                                    return question.correct_answers.map(idx => question.options[idx]).filter(Boolean).join(', ');
                                  }
                                  return question.correct_answers.join(', ');
                                }
                                return typeof question.correct_answer === 'string' 
                                  ? question.correct_answer 
                                  : JSON.stringify(question.correct_answer);
                              })()}
                            </div>
                          </div>
                        )}
                        
                        {question.explanation && (
                          <div>
                            <span className="text-xs font-medium text-gray-600">Explanation:</span>
                            <div className="text-sm bg-white p-2 rounded border">
                              {question.explanation}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                    
                    <div className="flex items-center justify-between mt-2 text-xs text-gray-500">
                      <span>Time spent: {formatTime(question.timeSpent)}</span>
                      <span>Submitted: {new Date().toLocaleTimeString()}</span>
                    </div>
                  </div>
                ))}
              </div>
            </TabsContent>
            
            <TabsContent value="coding" className="space-y-4">
              <h4 className="font-medium text-gray-800">Coding Question Results</h4>
              
              {results.codingResults.length > 0 ? (
                <div className="space-y-3">
                  {results.codingResults.map((result) => (
                    <div key={result.questionId} className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium">Coding Question</span>
                        <Badge variant="outline">
                          {result.score}% Score
                        </Badge>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="text-center p-3 bg-green-50 rounded">
                          <div className="text-2xl font-bold text-green-600">
                            {result.testCasesPassed}
                          </div>
                          <div className="text-sm text-green-700">Test Cases Passed</div>
                        </div>
                        
                        <div className="text-center p-3 bg-blue-50 rounded">
                          <div className="text-2xl font-bold text-blue-600">
                            {result.totalTestCases}
                          </div>
                          <div className="text-sm text-blue-700">Total Test Cases</div>
                        </div>
                        
                        <div className="text-center p-3 bg-purple-50 rounded">
                          <div className="text-2xl font-bold text-purple-600">
                            {Math.round((result.testCasesPassed / result.totalTestCases) * 100)}%
                          </div>
                          <div className="text-sm text-purple-700">Success Rate</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    No coding questions in this assessment.
                  </AlertDescription>
                </Alert>
              )}
            </TabsContent>
            
            <TabsContent value="proctoring" className="space-y-4">
              <h4 className="font-medium text-gray-800">Proctoring Summary</h4>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-2 mb-2">
                    <Shield className="h-5 w-5 text-gray-600" />
                    <span className="font-medium">Violations Detected</span>
                  </div>
                  <div className="text-2xl font-bold text-gray-800">
                    {results.proctoringSummary.violations}
                  </div>
                  <div className="text-sm text-gray-600">
                    {results.proctoringSummary.violations === 0 ? 'No violations' : 'Violations detected'}
                  </div>
                </div>
                
                <div className="p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-2 mb-2">
                    <AlertTriangle className="h-5 w-5 text-gray-600" />
                    <span className="font-medium">Severity Level</span>
                  </div>
                  <div className="text-2xl font-bold text-gray-800 capitalize">
                    {results.proctoringSummary.severity}
                  </div>
                  <div className="text-sm text-gray-600">
                    Overall risk level
                  </div>
                </div>
              </div>
              
              {results.proctoringSummary.violations > 0 && (
                <div>
                  <h5 className="font-medium text-gray-800 mb-2">Flagged Activities</h5>
                  <div className="space-y-2">
                    {results.proctoringSummary.flaggedActivities.map((activity, index) => (
                      <div key={index} className="flex items-center space-x-2 p-2 bg-yellow-50 rounded">
                        <AlertTriangle className="h-4 w-4 text-yellow-600" />
                        <span className="text-sm text-yellow-800">
                          {activity.replace('_', ' ').toUpperCase()}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Retake Information */}
      {results.canRetake && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center text-green-600">
              <RefreshCw className="h-5 w-5 mr-2" />
              Retake Available
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  You can retake this assessment. You have {assessment.max_attempts - submission.attempt_number} attempt{assessment.max_attempts - submission.attempt_number > 1 ? 's' : ''} remaining.
                </AlertDescription>
              </Alert>
              
              {results.nextAttemptAvailable && (
                <div className="text-sm text-gray-600">
                  Next attempt available: {results.nextAttemptAvailable.toLocaleString()}
                </div>
              )}
              
              <Button
                onClick={handleRetake}
                className="bg-green-600 hover:bg-green-700"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Retake Assessment
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Action Buttons */}
      <div className="flex justify-between">
        <Button variant="outline" onClick={() => navigate('/student/assessments')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Assessments
        </Button>
        
        <div className="flex space-x-3">
          <Button variant="outline" onClick={handleDownloadResults}>
            <Download className="h-4 w-4 mr-2" />
            Download Results
          </Button>
          
          <Button variant="outline" onClick={handleShareResults}>
            <Share className="h-4 w-4 mr-2" />
            Share Results
          </Button>
        </div>
      </div>
    </div>
  );
};

export default AssessmentResultsStep;
