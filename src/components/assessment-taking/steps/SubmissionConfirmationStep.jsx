import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  Clock,
  Target,
  Flag,
  Save,
  Send,
  ArrowLeft,
  ArrowRight,
  Eye,
  EyeOff,
  FileText,
  Code,
  BookOpen,
  Timer,
  Shield,
  Activity
} from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'react-hot-toast';

const SubmissionConfirmationStep = ({ 
  assessment, 
  submission, 
  questions, 
  answers,
  flaggedQuestions,
  proctoringViolations,
  onComplete,
  onBack,
  onCancel,
  onSubmit,
  timerRef,
  theme = 'light',
  isDarkMode = false
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [confirmationChecked, setConfirmationChecked] = useState(false);
  const [showDetailedReview, setShowDetailedReview] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [timeTaken, setTimeTaken] = useState(0);

  const answeredCount = Object.keys(answers).length;
  const flaggedCount = flaggedQuestions.size;
  const violationCount = Array.isArray(proctoringViolations) ? proctoringViolations.length : 0;
  const completionPercentage = questions.length > 0 ? (answeredCount / questions.length) * 100 : 0;

  useEffect(() => {
    // Calculate time taken from start to now
    if (submission?.started_at) {
      try {
        const startTime = new Date(submission.started_at);
        if (!isNaN(startTime.getTime())) {
          const elapsed = Date.now() - startTime.getTime();
          const taken = Math.floor(elapsed / 1000); // seconds
          setTimeTaken(taken);
        }
      } catch (e) {
        console.error('Error calculating time taken:', e);
        setTimeTaken(0);
      }
    }

    // Get time remaining from timer component if available
    if (timerRef?.current?.getTimeRemaining) {
      const time = timerRef.current.getTimeRemaining();
      if (time && !isNaN(time) && time > 0) {
        setTimeRemaining(time);
        // Update every second
        const interval = setInterval(() => {
          const updatedTime = timerRef.current?.getTimeRemaining();
          if (updatedTime && !isNaN(updatedTime) && updatedTime >= 0) {
            setTimeRemaining(updatedTime);
          }
          
          // Also update time taken
          if (submission?.started_at) {
            try {
              const startTime = new Date(submission.started_at);
              if (!isNaN(startTime.getTime())) {
                const elapsed = Date.now() - startTime.getTime();
                const taken = Math.floor(elapsed / 1000);
                setTimeTaken(taken);
              }
            } catch (e) {
              // Ignore errors
            }
          }
        }, 1000);
        return () => clearInterval(interval);
      }
    }
    
    // Fallback: Calculate from submission start time
    if (submission?.started_at && assessment?.time_limit_minutes) {
      try {
        const startTime = new Date(submission.started_at);
        if (!isNaN(startTime.getTime())) {
          const timeLimit = assessment.time_limit_minutes * 60 * 1000;
          const elapsed = Date.now() - startTime.getTime();
          const remaining = Math.max(0, timeLimit - elapsed);
          setTimeRemaining(Math.floor(remaining / 1000));
        }
      } catch (e) {
        console.error('Error calculating time remaining:', e);
        setTimeRemaining(0);
      }
    }
  }, [submission, assessment, timerRef]);

  const formatTime = (seconds) => {
    if (!seconds || isNaN(seconds) || seconds < 0) {
      return '0:00';
    }
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
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

  const getSeverityColor = (severity, isDark = false) => {
    if (isDark) {
      switch (severity) {
        case 'high': return 'text-red-300 bg-red-900';
        case 'medium': return 'text-orange-300 bg-orange-900';
        case 'low': return 'text-yellow-300 bg-yellow-900';
        default: return 'text-gray-300 bg-gray-700';
      }
    }
    switch (severity) {
      case 'high': return 'text-red-600 bg-red-100';
      case 'medium': return 'text-orange-600 bg-orange-100';
      case 'low': return 'text-yellow-600 bg-yellow-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const handleSubmit = async () => {
    if (!confirmationChecked) {
      toast.error('Please confirm that you want to submit your assessment');
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit();
      onComplete();
    } catch (error) {
      console.error('Error submitting assessment:', error);
      toast.error('Failed to submit assessment');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getUnansweredQuestions = () => {
    return questions.filter(q => !answers[q.id]);
  };

  const getFlaggedQuestions = () => {
    return questions.filter(q => flaggedQuestions.has(q.id));
  };

  const getHighSeverityViolations = () => {
    return proctoringViolations.filter(v => v.severity === 'high');
  };

  return (
    <div className={`min-h-screen py-8 px-4 ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
      <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <Card className={isDarkMode ? 'bg-gray-800 border-gray-700' : ''}>
        <CardHeader className={isDarkMode ? 'bg-gray-700' : ''}>
          <CardTitle className={`text-2xl flex items-center ${isDarkMode ? 'text-gray-100' : ''}`}>
            <Send className={`h-6 w-6 mr-2 ${isDarkMode ? 'text-gray-300' : ''}`} />
            Submit Assessment
          </CardTitle>
          <p className={isDarkMode ? 'text-gray-300' : 'text-gray-600'}>
            Review your answers and confirm submission. This action cannot be undone.
          </p>
        </CardHeader>
      </Card>

      {/* Assessment Summary - Simplified */}
      <Card className={isDarkMode ? 'bg-gray-800 border-gray-700' : ''}>
        <CardHeader className={isDarkMode ? 'bg-gray-700' : ''}>
          <CardTitle className={`text-lg ${isDarkMode ? 'text-gray-100' : ''}`}>Assessment Summary</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className={`text-center p-4 rounded-lg ${isDarkMode ? 'bg-blue-900' : 'bg-blue-50'}`}>
              <div className={`text-2xl font-bold ${isDarkMode ? 'text-blue-300' : 'text-blue-600'}`}>
                {answeredCount}
              </div>
              <div className={`text-sm ${isDarkMode ? 'text-blue-200' : 'text-blue-700'}`}>Answered</div>
            </div>
            
            <div className={`text-center p-4 rounded-lg ${isDarkMode ? 'bg-yellow-900' : 'bg-yellow-50'}`}>
              <div className={`text-2xl font-bold ${isDarkMode ? 'text-yellow-300' : 'text-yellow-600'}`}>
                {flaggedCount}
              </div>
              <div className={`text-sm ${isDarkMode ? 'text-yellow-200' : 'text-yellow-700'}`}>Flagged</div>
            </div>
            
            <div className={`text-center p-4 rounded-lg ${isDarkMode ? 'bg-red-900' : 'bg-red-50'}`}>
              <div className={`text-2xl font-bold ${isDarkMode ? 'text-red-300' : 'text-red-600'}`}>
                {questions.length - answeredCount}
              </div>
              <div className={`text-sm ${isDarkMode ? 'text-red-200' : 'text-red-700'}`}>Unanswered</div>
            </div>
            
            <div className={`text-center p-4 rounded-lg ${isDarkMode ? 'bg-green-900' : 'bg-green-50'}`}>
              <div className={`text-2xl font-bold ${isDarkMode ? 'text-green-300' : 'text-green-600'}`}>
                {Math.round(completionPercentage)}%
              </div>
              <div className={`text-sm ${isDarkMode ? 'text-green-200' : 'text-green-700'}`}>Complete</div>
            </div>
          </div>

          {/* Key Info */}
          <div className={`grid grid-cols-3 gap-4 ${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'} p-4 rounded-lg`}>
            <div className="flex items-center space-x-3">
              <Timer className={`h-5 w-5 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`} />
              <div>
                <p className={`font-medium ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>Time Remaining</p>
                <p className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>{formatTime(timeRemaining)}</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <Clock className={`h-5 w-5 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`} />
              <div>
                <p className={`font-medium ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>Total Time Taken</p>
                <p className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>{formatTime(timeTaken)}</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <Target className={`h-5 w-5 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`} />
              <div>
                <p className={`font-medium ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>Total Points</p>
                <p className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>{assessment.total_points} points</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Warnings */}
      {violationCount > 0 && (
        <Alert variant="destructive" className={isDarkMode ? 'bg-red-900 border-red-700' : ''}>
          <AlertTriangle className={`h-4 w-4 ${isDarkMode ? 'text-red-300' : ''}`} />
          <AlertDescription className={isDarkMode ? 'text-red-200' : ''}>
            <strong>Warning:</strong> {violationCount} proctoring violation{violationCount > 1 ? 's' : ''} detected during your assessment.
          </AlertDescription>
        </Alert>
      )}

      {getUnansweredQuestions().length > 0 && (
        <Alert className={isDarkMode ? 'bg-orange-900 border-orange-700' : ''}>
          <AlertTriangle className={`h-4 w-4 ${isDarkMode ? 'text-orange-300' : ''}`} />
          <AlertDescription className={isDarkMode ? 'text-orange-200' : ''}>
            <strong>Warning:</strong> You have {getUnansweredQuestions().length} unanswered question{getUnansweredQuestions().length > 1 ? 's' : ''}. 
            These will receive zero points.
          </AlertDescription>
        </Alert>
      )}

      {/* Final Confirmation */}
      <Card className={isDarkMode ? 'bg-gray-800 border-gray-700' : ''}>
        <CardHeader className={isDarkMode ? 'bg-gray-700' : ''}>
          <CardTitle className={`text-lg ${isDarkMode ? 'text-gray-100' : ''}`}>Final Confirmation</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert className={isDarkMode ? 'bg-orange-900 border-orange-700' : ''}>
            <AlertTriangle className={`h-4 w-4 ${isDarkMode ? 'text-orange-300' : ''}`} />
            <AlertDescription className={isDarkMode ? 'text-orange-200' : ''}>
              <strong>Important:</strong> Once you submit your assessment, you cannot make any changes. 
              Make sure you have reviewed all your answers carefully.
            </AlertDescription>
          </Alert>

          <div className={`space-y-3 ${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'} p-4 rounded-lg`}>
            <div className="flex items-start space-x-3">
              <Checkbox
                id="confirm-submission"
                checked={confirmationChecked}
                onCheckedChange={setConfirmationChecked}
              />
              <label htmlFor="confirm-submission" className={`text-sm cursor-pointer ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                I confirm that I have reviewed my answers and want to submit this assessment. 
                I understand that this action cannot be undone.
              </label>
            </div>

            {violationCount > 0 && (
              <div className="flex items-start space-x-3">
                <Checkbox
                  id="acknowledge-violations"
                  checked={true}
                  disabled
                />
                <label htmlFor="acknowledge-violations" className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  I acknowledge that {violationCount} proctoring violation{violationCount > 1 ? 's were' : ' was'} detected during my assessment.
                </label>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex justify-between gap-3">
        <Button 
          variant="outline" 
          onClick={onBack}
          className={isDarkMode ? 'border-gray-600 text-gray-300 hover:bg-gray-700' : ''}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Questions
        </Button>
        
        <div className="flex space-x-3">
          <Button 
            variant="outline" 
            onClick={onCancel}
            className={isDarkMode ? 'border-gray-600 text-gray-300 hover:bg-gray-700' : ''}
          >
            Cancel
          </Button>
          
          <Button
            onClick={handleSubmit}
            disabled={!confirmationChecked || isSubmitting}
            className="bg-green-600 hover:bg-green-700 text-white relative"
          >
            {isSubmitting ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
            ) : (
              <Send className="h-4 w-4 mr-2" />
            )}
            {isSubmitting ? 'Submitting...' : 'Submit Assessment'}
            {violationCount > 0 && (
              <Badge 
                variant="destructive" 
                className="ml-2 bg-red-600 hover:bg-red-700"
                title={`${violationCount} proctoring violation${violationCount > 1 ? 's' : ''} detected`}
              >
                {violationCount}
              </Badge>
            )}
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </div>
      </div>
      </div>
    </div>
  );
};

export default SubmissionConfirmationStep;

