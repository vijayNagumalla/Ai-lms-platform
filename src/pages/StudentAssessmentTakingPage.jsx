import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle 
} from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Progress } from '../components/ui/progress';
import { 
  Clock, 
  Save, 
  ArrowLeft, 
  ArrowRight, 
  Flag, 
  CheckCircle,
  AlertTriangle,
  Eye,
  EyeOff
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'react-hot-toast';
import ProctoringManager from '../components/ProctoringManager';
import QuestionRenderer from '../components/QuestionRenderer';
import TimerComponent from '../components/TimerComponent';
import NavigationPanel from '../components/NavigationPanel';
import SubmissionModal from '../components/SubmissionModal';

const StudentAssessmentTakingPage = () => {
  const { assessmentId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  // State management
  const [assessment, setAssessment] = useState(null);
  const [submission, setSubmission] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [lastSavedAnswers, setLastSavedAnswers] = useState({}); // Track last saved state
  const [timeSpent, setTimeSpent] = useState({});
  const [flaggedQuestions, setFlaggedQuestions] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState(null);
  const [showSubmissionModal, setShowSubmissionModal] = useState(false);
  const [proctoringEnabled, setProctoringEnabled] = useState(false);
  const [proctoringStatus, setProctoringStatus] = useState('inactive');
  const [fullscreen, setFullscreen] = useState(false);
  const [highContrastMode, setHighContrastMode] = useState(() => {
    // Load from localStorage if available
    if (typeof Storage !== 'undefined') {
      const saved = localStorage.getItem('highContrastMode');
      return saved === 'true';
    }
    return false;
  });
  
  // Refs
  const autoSaveInterval = useRef(null);
  const questionStartTime = useRef(Date.now());
  const proctoringRef = useRef(null);

  // Memoize current question to prevent unnecessary re-renders
  const currentQuestion = useMemo(() => {
    return questions[currentQuestionIndex] || null;
  }, [questions, currentQuestionIndex]);

  useEffect(() => {
    startAssessment();
    return () => {
      if (autoSaveInterval.current) {
        clearInterval(autoSaveInterval.current);
      }
    };
  }, []);

  useEffect(() => {
    // Start auto-save interval
    if (submission) {
      autoSaveInterval.current = setInterval(autoSave, 30000); // 30 seconds
    }

    return () => {
      if (autoSaveInterval.current) {
        clearInterval(autoSaveInterval.current);
      }
    };
  }, [submission]);

  useEffect(() => {
    // Track time spent on current question
    questionStartTime.current = Date.now();
    
    return () => {
      if (currentQuestion) {
        const timeSpentOnQuestion = Date.now() - questionStartTime.current;
        setTimeSpent(prev => ({
          ...prev,
          [currentQuestion.id]: (prev[currentQuestion.id] || 0) + timeSpentOnQuestion
        }));
      }
    };
  }, [currentQuestionIndex, currentQuestion]);

  // Keyboard shortcuts for navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Don't trigger shortcuts when typing in inputs/textarea
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.isContentEditable) {
        // Allow Ctrl/Cmd shortcuts even in inputs
        if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
          return; // Don't navigate when typing
        }
      }

      // Prevent default for arrow keys
      if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
        e.preventDefault();
      }

      // Arrow keys for navigation
      if (e.key === 'ArrowLeft' && currentQuestionIndex > 0) {
        goToPrevious();
      } else if (e.key === 'ArrowRight' && currentQuestionIndex < questions.length - 1) {
        goToNext();
      }
      
      // Space or Enter to save answer
      if ((e.key === ' ' || e.key === 'Enter') && !e.shiftKey && currentQuestion) {
        if (e.target.tagName !== 'BUTTON' && e.target.tagName !== 'INPUT' && e.target.tagName !== 'TEXTAREA') {
          e.preventDefault();
          saveAnswer(currentQuestion.id, answers[currentQuestion.id], true);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [currentQuestionIndex, questions.length, currentQuestion, answers, goToPrevious, goToNext, saveAnswer]);

  const startAssessment = async () => {
    try {
      setLoading(true);
      
      // Get assessment details with specific error handling
      const assessmentResponse = await fetch(`/api/assessments/${assessmentId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!assessmentResponse.ok) {
        const errorData = await assessmentResponse.json().catch(() => ({}));
        if (assessmentResponse.status === 401) {
          toast.error('Your session has expired. Please log in again to continue.');
          navigate('/login');
          return;
        } else if (assessmentResponse.status === 403) {
          const message = errorData.message || 'Access denied. You do not have permission to access this assessment.';
          toast.error(`${message} If you believe this is an error, please contact your instructor.`);
          navigate('/student/assessments');
          return;
        } else if (assessmentResponse.status === 404) {
          toast.error('Assessment not found. It may have been deleted, moved, or is no longer available. Please check with your instructor.');
          navigate('/student/assessments');
          return;
        } else {
          const message = errorData.message || 'Failed to load assessment. Please check your internet connection and try again.';
          throw new Error(message);
        }
      }

      const assessmentData = await assessmentResponse.json();
      
      // Check if assessment has expired
      if (assessmentData.data.end_date_only && assessmentData.data.end_time_only) {
        const endDateTime = new Date(`${assessmentData.data.end_date_only}T${assessmentData.data.end_time_only}`);
        if (new Date() > endDateTime) {
          toast.error('This assessment has expired and is no longer available.');
          navigate('/student/assessments');
          return;
        }
      }
      
      setAssessment(assessmentData.data);
      setProctoringEnabled(assessmentData.data.proctoring_enabled);

      // Start assessment attempt with specific error handling
      const startResponse = await fetch(`/api/student-assessments/${assessmentId}/start`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          deviceInfo: {
            userAgent: navigator.userAgent,
            screenResolution: `${screen.width}x${screen.height}`,
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
          }
        })
      });

      if (!startResponse.ok) {
        const errorData = await startResponse.json().catch(() => ({}));
        if (startResponse.status === 403) {
          if (errorData.message?.includes('exceeded') || errorData.message?.includes('attempts')) {
            toast.error(`${errorData.message || 'You have exceeded the maximum number of attempts.'} Please contact your instructor if you need additional attempts.`);
          } else if (errorData.message?.includes('expired') || errorData.message?.includes('time')) {
            toast.error(`${errorData.message || 'Assessment time has expired.'} The assessment window has closed and cannot be started.`);
          } else {
            toast.error(`${errorData.message || 'Access denied.'} You cannot start this assessment. Please contact your instructor if you believe this is an error.`);
          }
          navigate('/student/assessments');
          return;
        } else if (startResponse.status === 400) {
          toast.error(`${errorData.message || 'Invalid request.'} Please refresh the page and try again. If the problem persists, contact support.`);
          navigate('/student/assessments');
          return;
        } else {
          const message = errorData.message || 'Failed to start assessment. Please check your internet connection and try again. If the problem persists, contact support.';
          throw new Error(message);
        }
      }

      const startData = await startResponse.json();
      setSubmission(startData.data);
      setQuestions(assessmentData.data.questions || []);

      // Load flagged questions from server if available
      if (startData.data.submission_id || startData.data.id) {
        try {
          const submissionId = startData.data.submission_id || startData.data.id;
          const responsesResponse = await fetch(`/api/student-assessments/${submissionId}/answers`, {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
          });
          
          if (responsesResponse.ok) {
            const responsesData = await responsesResponse.json();
            const flaggedSet = new Set();
            if (responsesData.data && Array.isArray(responsesData.data)) {
              responsesData.data.forEach(response => {
                if (response.is_flagged) {
                  flaggedSet.add(response.question_id);
                }
              });
            }
            setFlaggedQuestions(flaggedSet);
          }
        } catch (error) {
          console.error('Error loading flagged questions:', error);
        }
      }

      // Sync offline answers if any exist
      if (typeof Storage !== 'undefined' && (startData.data.submission_id || startData.data.id)) {
        const submissionId = startData.data.submission_id || startData.data.id;
        const offlineKeys = Object.keys(localStorage).filter(key => 
          key.startsWith(`offline_answer_${submissionId}_`)
        );
        
        if (offlineKeys.length > 0) {
          // Try to sync offline answers
          for (const key of offlineKeys) {
            try {
              const offlineData = JSON.parse(localStorage.getItem(key));
              if (offlineData && offlineData.questionId && offlineData.answer) {
                await saveAnswer(offlineData.questionId, offlineData.answer, false);
                localStorage.removeItem(key);
              }
            } catch (error) {
              console.error('Error syncing offline answer:', error);
            }
          }
        }
      }

      // Initialize proctoring if enabled
      if (assessmentData.data.proctoring_enabled) {
        initializeProctoring();
      }

    } catch (error) {
      console.error('Error starting assessment:', error);
      
      // Specific error handling based on error type
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        toast.error('Network error. Please check your internet connection and try again.');
      } else if (error.message.includes('timeout') || error.message.includes('network')) {
        toast.error('Connection timeout. Please check your internet connection and try again.');
      } else {
        toast.error(error.message || 'Failed to start assessment. Please try again later.');
      }
      
      navigate('/student/assessments');
    } finally {
      setLoading(false);
    }
  };

  const initializeProctoring = () => {
    if (proctoringRef.current) {
      proctoringRef.current.initialize();
    }
  };

  const handleAnswerChange = (questionId, answer) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: answer
    }));
    // Cache answer in localStorage for offline support
    if (typeof Storage !== 'undefined' && submission?.submissionId) {
      try {
        const cacheKey = `answer_cache_${submission.submissionId}_${questionId}`;
        localStorage.setItem(cacheKey, JSON.stringify({
          answer,
          timestamp: Date.now()
        }));
      } catch (e) {
        console.error('Failed to cache answer:', e);
      }
    }
  };

  const saveAnswer = useCallback(async (questionId, answer, immediate = false) => {
    if (!submission) return;
    
    // Validate answer format before saving
    if (answer === undefined || answer === null || (typeof answer === 'string' && answer.trim() === '')) {
      if (immediate) {
        toast.error('Answer cannot be empty');
      }
      return;
    }

    // Retry queue for network failures with exponential backoff
    const retrySave = async (retries = 3) => {
      let timeLimitExceeded = false;
      for (let attempt = 0; attempt < retries; attempt++) {
        try {
          const timeSpentOnQuestion = timeSpent[questionId] || 0;
          
          const response = await fetch(`/api/student-assessments/${submission.submissionId}/answers`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify({
              questionId,
              answer,
              timeSpent: Math.floor(timeSpentOnQuestion / 1000) // Convert to seconds
            })
          });

          if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            const errorMessage = errorData.message || 'Failed to save answer';
            const error = new Error(errorMessage);
            
            // Check for validation errors that shouldn't be retried
            const isValidationError = errorMessage.includes('time limit has been exceeded') || 
                                    errorMessage.includes('time has expired') ||
                                    errorMessage.includes('expired') ||
                                    errorMessage.includes('exceeded') ||
                                    errorMessage.includes('does not belong to this assessment') ||
                                    errorMessage.includes('has been deleted') ||
                                    errorMessage.includes('no longer available') ||
                                    errorMessage.includes('Unauthorized') ||
                                    errorMessage.includes('permission');
            
            if (isValidationError) {
              // Stop auto-save for validation errors
              if (errorMessage.includes('time limit has been exceeded') || 
                  errorMessage.includes('time has expired') ||
                  errorMessage.includes('expired') ||
                  errorMessage.includes('exceeded')) {
                timeLimitExceeded = true;
                console.warn('Assessment time limit exceeded, stopping saves');
              } else {
                console.warn('Validation error, stopping saves:', errorMessage);
              }
              throw error; // Don't retry
            }
            
            throw error;
          }

          if (immediate) {
            toast.success('Answer saved');
          }
          
          // Update last saved state on success
          setLastSavedAnswers(prev => ({
            ...prev,
            [questionId]: answer
          }));
          
          return; // Success, exit retry loop
        } catch (error) {
          console.error(`Error saving answer (attempt ${attempt + 1}/${retries}):`, error);
          
          // Don't retry validation errors (time limit, question validation, etc.)
          const isValidationError = error.message?.includes('time limit has been exceeded') ||
                                   error.message?.includes('time has expired') ||
                                   error.message?.includes('expired') ||
                                   error.message?.includes('exceeded') ||
                                   error.message?.includes('does not belong to this assessment') ||
                                   error.message?.includes('has been deleted') ||
                                   error.message?.includes('no longer available') ||
                                   error.message?.includes('Unauthorized') ||
                                   error.message?.includes('permission');
          
          if (isValidationError) {
            // Stop all save attempts immediately for validation errors
            throw error; // Exit immediately
          }
          
          if (attempt === retries - 1) {
            // Last attempt failed
            if (immediate) {
              toast.error(error.message || 'Failed to save answer. Answer will be saved when connection is restored.');
            }
            
            // Store in offline storage if save fails
            if (typeof Storage !== 'undefined') {
              try {
                const offlineKey = `offline_answer_${submission.submissionId}_${questionId}`;
                localStorage.setItem(offlineKey, JSON.stringify({
                  questionId,
                  answer,
                  timeSpent: Math.floor((timeSpent[questionId] || 0) / 1000),
                  timestamp: Date.now()
                }));
              } catch (e) {
                console.error('Failed to store offline answer:', e);
              }
            }
            throw error;
          }
          
          // Wait before retry (exponential backoff: 1s, 2s, 4s)
          await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
        }
      }
    };
    
    return retrySave();
  }, [submission, timeSpent]);

  // Sequential save queue to prevent race conditions
  const saveQueue = useRef([]);
  const isSaving = useRef(false);

  // Track changed answers to only save what's modified
  const getChangedAnswers = useCallback(() => {
    const changed = {};
    Object.keys(answers).forEach(questionId => {
      const currentAnswer = answers[questionId];
      const lastSaved = lastSavedAnswers[questionId];
      
      // Check if answer has changed
      if (currentAnswer !== undefined && currentAnswer !== null) {
        const hasChanged = JSON.stringify(currentAnswer) !== JSON.stringify(lastSaved);
        if (hasChanged || lastSaved === undefined) {
          changed[questionId] = currentAnswer;
        }
      }
    });
    return changed;
  }, [answers, lastSavedAnswers]);

  const autoSave = useCallback(async () => {
    if (!submission || isSaving.current) return;

    // Only save changed answers
    const changedAnswers = getChangedAnswers();
    
    if (Object.keys(changedAnswers).length === 0) {
      return; // Nothing to save
    }

    isSaving.current = true;
    setSaving(true);
    
    const failedSaves = [];
    
    try {
      // Process saves sequentially to prevent race conditions
      for (const [questionId, answer] of Object.entries(changedAnswers)) {
        try {
          await saveAnswer(questionId, answer, false);
          // Update last saved state on success
          setLastSavedAnswers(prev => ({
            ...prev,
            [questionId]: answer
          }));
        } catch (error) {
          console.error(`Failed to save answer for question ${questionId}:`, error);
          
          // Check for validation errors - stop auto-save for these
          const isValidationError = error.message?.includes('time limit has been exceeded') ||
                                   error.message?.includes('time has expired') ||
                                   error.message?.includes('expired') ||
                                   error.message?.includes('exceeded') ||
                                   error.message?.includes('does not belong to this assessment') ||
                                   error.message?.includes('has been deleted') ||
                                   error.message?.includes('no longer available') ||
                                   error.message?.includes('Unauthorized') ||
                                   error.message?.includes('permission');
          
          if (isValidationError) {
            // Handle time limit errors - trigger submission
            if (error.message?.includes('time limit has been exceeded') || 
                error.message?.includes('time has expired') ||
                error.message?.includes('expired') ||
                error.message?.includes('exceeded')) {
              toast.warning('Assessment time limit exceeded. Auto-submitting...');
              setTimeout(() => {
                handleSubmitAssessment();
              }, 1000);
              return; // Exit auto-save loop
            }
            
            // Handle other validation errors - stop auto-save but don't submit
            if (error.message?.includes('does not belong to this assessment')) {
              toast.error('This question is no longer part of the assessment. Please refresh the page.');
              console.error('Question validation error - stopping auto-save for this question');
              // Remove the question from changed answers to prevent further attempts
              return; // Exit auto-save loop for this question
            }
            
            if (error.message?.includes('has been deleted') || error.message?.includes('no longer available')) {
              toast.error('Assessment is no longer available. Please contact your instructor.');
              return; // Exit auto-save loop
            }
            
            if (error.message?.includes('Unauthorized') || error.message?.includes('permission')) {
              toast.error('You do not have permission to modify this assessment.');
              return; // Exit auto-save loop
            }
            
            // Generic validation error - stop auto-save
            toast.error('Validation error: ' + error.message);
            return; // Exit auto-save loop
          }
          
          failedSaves.push(questionId);
        }
      }
      
      // Update last saved timestamp
      if (failedSaves.length === 0) {
        setLastSaved(new Date());
      } else {
        toast.error(`Failed to save ${failedSaves.length} answer${failedSaves.length > 1 ? 's' : ''}`);
      }
    } catch (error) {
      console.error('Auto-save error:', error);
      toast.error('Failed to auto-save some answers');
    } finally {
      isSaving.current = false;
      setSaving(false);
    }
  }, [submission, getChangedAnswers, saveAnswer, handleSubmitAssessment]);

  const navigateToQuestion = useCallback((index) => {
    if (index >= 0 && index < questions.length) {
      setCurrentQuestionIndex(index);
    }
  }, [questions.length]);

  const goToPrevious = useCallback(() => {
    if (currentQuestionIndex > 0) {
      navigateToQuestion(currentQuestionIndex - 1);
    }
  }, [currentQuestionIndex, navigateToQuestion]);

  const goToNext = useCallback(() => {
    if (currentQuestionIndex < questions.length - 1) {
      navigateToQuestion(currentQuestionIndex + 1);
    }
  }, [currentQuestionIndex, questions.length, navigateToQuestion]);

  const flagQuestion = async (questionId) => {
    if (!submission) return;
    
    const isCurrentlyFlagged = flaggedQuestions.has(questionId);
    const newFlaggedState = !isCurrentlyFlagged;
    
    try {
      const response = await fetch(`/api/student-assessments/${submission.submissionId}/questions/${questionId}/flag`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          isFlagged: newFlaggedState
        })
      });

      if (response.ok) {
        setFlaggedQuestions(prev => {
          const newSet = new Set(prev);
          if (newFlaggedState) {
            newSet.add(questionId);
            toast.success('Question flagged for review');
          } else {
            newSet.delete(questionId);
            toast.success('Question unflagged');
          }
          return newSet;
        });
      } else {
        throw new Error('Failed to update flag status');
      }
    } catch (error) {
      console.error('Error flagging question:', error);
      toast.error('Failed to update flag status');
    }
  };

  const handleSubmitAssessment = async (retryCount = 0) => {
    const maxRetries = 3;
    const retryDelay = 1000; // 1 second
    
    try {
      setSaving(true);
      
      // Validate required questions
      const requiredQuestions = questions.filter(q => q.is_required !== false);
      const unansweredRequired = requiredQuestions.filter(q => !answers[q.id] || (typeof answers[q.id] === 'string' && answers[q.id].trim() === ''));
      
      if (unansweredRequired.length > 0) {
        toast.error(`Please answer ${unansweredRequired.length} required question${unansweredRequired.length > 1 ? 's' : ''} before submitting`);
        setSaving(false);
        return;
      }
      
      // Save all answers first with retry logic
      try {
        await autoSave();
      } catch (saveError) {
        console.error('Error during auto-save before submission:', saveError);
        // Continue anyway - answers may already be saved
      }
      
      // Wait a moment to ensure saves complete
      await new Promise(resolve => setTimeout(resolve, 150)); // Reduced from 300ms
      
      // Submit assessment with retry mechanism
      const submitWithRetry = async (attempt) => {
        const response = await fetch(`/api/student-assessments/${submission.submissionId}/submit`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: JSON.stringify({
            deviceInfo: {
              userAgent: navigator.userAgent,
              screenResolution: `${screen.width}x${screen.height}`,
              timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
            }
          })
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          
          // Retry on network errors or 5xx errors
          if ((errorData.message?.includes('network') || errorData.message?.includes('timeout') || response.status >= 500) && attempt < maxRetries) {
            toast.warning(`Submission attempt ${attempt + 1} failed. Retrying...`);
            await new Promise(resolve => setTimeout(resolve, retryDelay * (attempt + 1)));
            return submitWithRetry(attempt + 1);
          }
          
          throw new Error(errorData.message || 'Failed to submit assessment');
        }

        return response;
      };

      const response = await submitWithRetry(0);
      const result = await response.json();
      toast.success('Assessment submitted successfully');
      
      // Clear offline storage
      if (typeof Storage !== 'undefined') {
        Object.keys(localStorage).forEach(key => {
          if (key.startsWith(`offline_answer_${submission.submissionId}_`)) {
            localStorage.removeItem(key);
          }
        });
      }
      
      // Navigate to results if immediate results are enabled
      if (assessment.show_results_immediately) {
        navigate(`/student/assessments/${assessmentId}/results`);
      } else {
        navigate('/student/assessments');
      }
    } catch (error) {
      console.error('Error submitting assessment:', error);
      
      // Store submission state for recovery
      if (typeof Storage !== 'undefined' && submission?.submissionId) {
        try {
          localStorage.setItem(`pending_submission_${submission.submissionId}`, JSON.stringify({
            submissionId: submission.submissionId,
            assessmentId,
            answers,
            timestamp: Date.now(),
            retryCount
          }));
        } catch (e) {
          console.error('Failed to store pending submission:', e);
        }
      }
      
      if (retryCount < maxRetries && (error.message?.includes('network') || error.message?.includes('timeout'))) {
        toast.error(`Submission failed (attempt ${retryCount + 1}/${maxRetries}). Retrying...`);
        setTimeout(() => handleSubmitAssessment(retryCount + 1), retryDelay * (retryCount + 1));
      } else {
        toast.error(error.message || 'Failed to submit assessment. Your answers are saved. Please try again or contact support.');
      }
    } finally {
      setSaving(false);
    }
  };

  const handleTimeUp = async () => {
    toast.error('Time is up! Saving all answers before auto-submitting...');
    
    // Ensure all answers are saved before auto-submitting
    try {
      setSaving(true);
      await autoSave();
      
      // Wait a moment to ensure saves complete
      await new Promise(resolve => setTimeout(resolve, 300)); // Reduced from 500ms
      
      // Now submit
      await handleSubmitAssessment();
    } catch (error) {
      console.error('Error during auto-submit:', error);
      toast.error('Time expired. Attempting to submit your assessment...');
      // Still try to submit even if auto-save had issues
      try {
        await handleSubmitAssessment();
      } catch (submitError) {
        console.error('Error during final submission:', submitError);
        toast.error('Failed to auto-submit. Please contact support with your submission ID.');
      }
    }
  };

  const getProgressPercentage = () => {
    if (questions.length === 0) return 0;
    
    // Calculate weighted progress based on question points
    let totalPoints = 0;
    let answeredPoints = 0;
    
    questions.forEach((q, index) => {
      const questionPoints = parseFloat(q.points) || 1;
      totalPoints += questionPoints;
      
      // If question is answered, add its points to answeredPoints
      if (answers[q.id] && 
          (typeof answers[q.id] === 'string' ? answers[q.id].trim() !== '' : 
           answers[q.id] !== null && answers[q.id] !== undefined)) {
        answeredPoints += questionPoints;
      }
    });
    
    // Calculate percentage based on points if available, otherwise use question count
    if (totalPoints > 0) {
      return (answeredPoints / totalPoints) * 100;
    }
    
    // Fallback to simple question count percentage
    const answeredCount = questions.filter(q => answers[q.id]).length;
    return (answeredCount / questions.length) * 100;
  };

  const getAnsweredCount = () => {
    return Object.keys(answers).length;
  };

  const getFlaggedCount = () => {
    return flaggedQuestions.size;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading assessment...</p>
        </div>
      </div>
    );
  }

  if (!assessment || !submission) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Assessment Not Found</h2>
          <p className="text-gray-600 mb-4">The assessment you're looking for doesn't exist or you don't have access to it.</p>
          <Button onClick={() => navigate('/student/assessments')}>
            Back to Assessments
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Proctoring Manager */}
      {proctoringEnabled && (
        <>
          <ProctoringManager
            ref={proctoringRef}
            submissionId={submission.submissionId}
            onViolation={(violation) => {
              console.log('Proctoring violation:', violation);
              toast.error(`Proctoring violation: ${violation.type}. ${violation.message || 'This may affect your assessment score.'}`);
            }}
            onStatusChange={(status) => {
              setProctoringStatus(status);
            }}
          />
          {/* Proctoring Status Indicator */}
          <div className="fixed bottom-4 right-4 z-50 bg-white rounded-lg shadow-lg border p-3">
            <div className="flex items-center space-x-2 text-sm">
              {proctoringStatus === 'active' ? (
                <>
                  <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="text-green-700">Proctoring Active</span>
                </>
              ) : proctoringStatus === 'error' ? (
                <>
                  <div className="h-2 w-2 bg-red-500 rounded-full"></div>
                  <span className="text-red-700">Proctoring Error</span>
                </>
              ) : (
                <>
                  <div className="h-2 w-2 bg-gray-400 rounded-full"></div>
                  <span className="text-gray-600">Proctoring Inactive</span>
                </>
              )}
            </div>
          </div>
        </>
      )}

      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              {/* Navigation History - Back Button */}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/student/assessments')}
                className="mr-3"
                title="Back to Assessments"
              >
                <ArrowLeft className="h-4 w-4 mr-1" />
                Back
              </Button>
              <h1 className="text-xl font-semibold text-gray-900">
                {assessment.title}
              </h1>
              {/* Persistent Auto-save Indicator */}
              <div className="ml-4 flex items-center text-sm">
                {saving ? (
                  <div className="flex items-center text-blue-600">
                    <Save className="h-4 w-4 mr-1 animate-spin" />
                    Saving...
                  </div>
                ) : lastSaved ? (
                  <div className="flex items-center text-green-600" title={`Last saved: ${lastSaved.toLocaleTimeString()}`}>
                    <CheckCircle className="h-4 w-4 mr-1" />
                    <span className="hidden sm:inline">Saved</span>
                  </div>
                ) : (
                  <div className="flex items-center text-gray-400" title="No changes to save">
                    <Save className="h-4 w-4 mr-1" />
                    <span className="hidden sm:inline">Not saved</span>
                  </div>
                )}
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <TimerComponent
                duration={assessment.duration_minutes * 60}
                onTimeUp={handleTimeUp}
                className="text-lg font-mono"
              />
              
              <div className="text-sm text-gray-600">
                Question {currentQuestionIndex + 1} of {questions.length}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-3">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">
                    Question {currentQuestionIndex + 1}
                  </CardTitle>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => flagQuestion(currentQuestion?.id)}
                      aria-label={flaggedQuestions.has(currentQuestion?.id) ? 'Unflag question' : 'Flag question for review'}
                      aria-pressed={flaggedQuestions.has(currentQuestion?.id)}
                    >
                      <Flag className="h-4 w-4 mr-1" aria-hidden="true" />
                      Flag
                    </Button>
                  </div>
                </div>
                
                <Progress 
                  value={getProgressPercentage()} 
                  className="mt-4"
                  role="progressbar"
                  aria-valuenow={getProgressPercentage()}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-label={`Progress: ${Math.round(getProgressPercentage())}% complete`}
                />
              </CardHeader>

              <CardContent>
                {currentQuestion && (
                  <QuestionRenderer
                    question={currentQuestion}
                    answer={answers[currentQuestion.id]}
                    onAnswerChange={(answer) => handleAnswerChange(currentQuestion.id, answer)}
                    onSave={() => saveAnswer(currentQuestion.id, answers[currentQuestion.id], true)}
                  />
                )}
              </CardContent>
            </Card>

            {/* Navigation */}
            <div className="flex items-center justify-between mt-6">
              <Button
                variant="outline"
                onClick={goToPrevious}
                disabled={currentQuestionIndex === 0}
                aria-label="Previous question"
              >
                <ArrowLeft className="h-4 w-4 mr-2" aria-hidden="true" />
                Previous
              </Button>

              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  onClick={() => setShowSubmissionModal(true)}
                  title="Review all answers before submission"
                  aria-label="Review all answers before submission"
                >
                  <Eye className="h-4 w-4 mr-2" aria-hidden="true" />
                  Review Answers
                </Button>

                <Button
                  variant="outline"
                  onClick={() => saveAnswer(currentQuestion?.id, answers[currentQuestion?.id], true)}
                  disabled={!answers[currentQuestion?.id]}
                  aria-label="Save current answer"
                >
                  <Save className="h-4 w-4 mr-2" aria-hidden="true" />
                  Save Answer
                </Button>

                <Button
                  onClick={() => setShowSubmissionModal(true)}
                  className="bg-green-600 hover:bg-green-700"
                  aria-label="Submit assessment"
                >
                  <CheckCircle className="h-4 w-4 mr-2" aria-hidden="true" />
                  Submit Assessment
                </Button>
              </div>

              <Button
                variant="outline"
                onClick={goToNext}
                disabled={currentQuestionIndex === questions.length - 1}
                aria-label="Next question"
              >
                Next
                <ArrowRight className="h-4 w-4 ml-2" aria-hidden="true" />
              </Button>
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <NavigationPanel
              questions={questions}
              currentIndex={currentQuestionIndex}
              answers={answers}
              onNavigate={navigateToQuestion}
              onFlag={flagQuestion}
            />

            {/* Assessment Info */}
            <Card className="mt-6">
              <CardHeader>
                <CardTitle className="text-sm">Assessment Info</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Total Questions:</span>
                  <span>{questions.length}</span>
                </div>
                <div className="flex justify-between">
                  <span>Answered:</span>
                  <span>{getAnsweredCount()}</span>
                </div>
                <div className="flex justify-between">
                  <span>Flagged:</span>
                  <span>{getFlaggedCount()}</span>
                </div>
                <div className="flex justify-between">
                  <span>Total Points:</span>
                  <span>{assessment.total_points}</span>
                </div>
                {proctoringEnabled && (
                  <div className="flex items-center text-orange-600">
                    <Eye className="h-4 w-4 mr-1" />
                    <span>Proctored</span>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Submission Modal */}
      <SubmissionModal
        isOpen={showSubmissionModal}
        onClose={() => setShowSubmissionModal(false)}
        onSubmit={handleSubmitAssessment}
        assessment={assessment}
        answers={answers}
        questions={questions}
        flaggedQuestions={flaggedQuestions}
        loading={saving}
      />
    </div>
  );
};

export default StudentAssessmentTakingPage;