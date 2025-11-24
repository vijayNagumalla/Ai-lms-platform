import React, { useState, useEffect, useRef, useMemo, useCallback, memo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  ArrowLeft, 
  ArrowRight, 
  Save, 
  Flag, 
  CheckCircle,
  AlertTriangle,
  Clock,
  Eye,
  Menu,
  X,
  Check,
  Circle,
  CircleDot,
  Wifi,
  WifiOff,
  Loader2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';

// Import question renderers
import QuestionRenderer from '../QuestionRenderer';
import CodingQuestionInterface from '../CodingQuestionInterface';
import TimerComponent from '../TimerComponent';

const QuestionTakingStep = ({ 
  assessment, 
  submission, 
  questions, 
  sections,
  answers,
  setAnswers,
  currentQuestionIndex,
  setCurrentQuestionIndex,
  currentSectionIndex,
  setCurrentSectionIndex,
  timeSpent,
  flaggedQuestions,
  flagQuestion,
  saveAnswer,
  saving,
  onComplete,
  onBack,
  onCancel,
  onTimeUp,
  proctoringEnabled,
  proctoringViolations,
  onShowSidebar,
  setShowSidebar,
  onSectionComplete,
  theme = 'light',
  isDarkMode = false
}) => {
  // Save answers state for navigation
  const [isSavingForNavigation, setIsSavingForNavigation] = useState(false);
  // Use parent-controlled state if provided, otherwise use local state
  const [localShowSidebar, setLocalShowSidebar] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const showSidebarValue = onShowSidebar !== undefined ? onShowSidebar : localShowSidebar;
  const setShowSidebarValue = setShowSidebar || setLocalShowSidebar;
  const [showSubmissionModal, setShowSubmissionModal] = useState(false);
  const [autoSaveStatus, setAutoSaveStatus] = useState('saved'); // 'saving', 'saved', 'offline'
  const [proctorStatus, setProctorStatus] = useState('live'); // 'live', 'recording', 'disconnected', 'flagged'
  const [violationCount, setViolationCount] = useState(0);
  
  const timerRef = useRef(null);
  const questionStartTime = useRef(Date.now());
  const sidebarRef = useRef(null);

  // Get assessment section settings
  const sequentialSections = assessment?.sequential_sections || false;
  const requireSectionCompletion = assessment?.require_section_completion || false;

  // Get current section based on section index or current question's section
  const currentSection = useMemo(() => {
    if (!sections || sections.length === 0) return null;
    
    // First try to get section from current question if it exists
    if (questions && questions.length > 0 && currentQuestionIndex >= 0 && currentQuestionIndex < questions.length) {
      const question = questions[currentQuestionIndex];
      if (question.section_id) {
        const sectionFromQuestion = sections.find(s => s.id === question.section_id);
        if (sectionFromQuestion) return sectionFromQuestion;
      }
    }
    
    // Fallback to section index
    if (currentSectionIndex >= 0 && currentSectionIndex < sections.length) {
      return sections[currentSectionIndex];
    }
    
    // Default to first section
    return sections[0] || null;
  }, [sections, currentSectionIndex, questions, currentQuestionIndex]);

  // Filter questions by current section if sections exist
  const sectionQuestions = useMemo(() => {
    if (!sections || sections.length === 0) {
      // No sections, return all questions
      return questions;
    }

    // If we have a current section, filter by it
    if (currentSection) {
      return questions.filter(q => q.section_id === currentSection.id);
    }

    return questions;
  }, [questions, sections, currentSection]);

  // Memoize current question to prevent unnecessary re-renders
  const currentQuestion = useMemo(() => {
    // First, try to get question from global index
    if (questions && questions.length > 0 && currentQuestionIndex >= 0 && currentQuestionIndex < questions.length) {
      const question = questions[currentQuestionIndex];
      // If sections exist, verify it's in the current section
      if (sections.length === 0 || !currentSection || question.section_id === currentSection.id) {
        return question;
      }
      // If question is not in current section, get first question of current section
      if (sectionQuestions.length > 0) {
        return sectionQuestions[0];
      }
    }
    
    // Fallback: get first question from current section
    if (sectionQuestions.length > 0) {
      return sectionQuestions[0];
    }
    
    return null;
  }, [questions, currentQuestionIndex, sections.length, currentSection, sectionQuestions]);

  // Get relative index within current section
  const sectionQuestionIndex = useMemo(() => {
    if (!currentQuestion || !currentSection || sectionQuestions.length === 0) return 0;
    return sectionQuestions.findIndex(q => q.id === currentQuestion.id);
  }, [currentQuestion, currentSection, sectionQuestions]);

  // Memoize answer handlers
  const handleAnswerChange = useCallback((questionId, answer) => {
    if (typeof setAnswers === 'function') {
      // If setAnswers is a function, call it directly
      if (setAnswers.length === 2) {
        setAnswers(questionId, answer);
      } else {
        // If it's a state setter function
        setAnswers(prev => ({
          ...prev,
          [questionId]: answer
        }));
      }
    }
    setAutoSaveStatus('saving');
    // Auto-save status will be updated when saving prop changes
  }, [setAnswers]);

  const handleSaveAnswer = useCallback(async (questionId, answer) => {
    if (saveAnswer) {
      await saveAnswer(questionId, answer);
    }
  }, [saveAnswer]);

  const handleFlagQuestion = useCallback(() => {
    if (currentQuestion && flagQuestion) {
      flagQuestion(currentQuestion.id);
    }
  }, [currentQuestion, flagQuestion]);

  useEffect(() => {
    // Update violation count when proctoring violations change
    setViolationCount(proctoringViolations.length);
    if (proctoringViolations.length > 0) {
      setProctorStatus('flagged');
    } else if (proctoringEnabled) {
      setProctorStatus('live');
    }
  }, [proctoringViolations, proctoringEnabled]);

  useEffect(() => {
    // Sync section index when question changes
    if (currentQuestion && sections && sections.length > 0 && currentQuestion.section_id) {
      const questionSectionIndex = sections.findIndex(s => s.id === currentQuestion.section_id);
      if (questionSectionIndex >= 0 && questionSectionIndex !== currentSectionIndex) {
        setCurrentSectionIndex(questionSectionIndex);
      }
    }
  }, [currentQuestion, sections, currentSectionIndex, setCurrentSectionIndex]);

  useEffect(() => {
    // Track time spent on current question
    questionStartTime.current = Date.now();
    
    return () => {
      if (currentQuestion) {
        const timeSpentOnQuestion = Date.now() - questionStartTime.current;
        // This will be handled by the parent component
      }
    };
  }, [currentQuestionIndex, currentQuestion]);

  useEffect(() => {
    // Handle auto-save status
    if (saving) {
      setAutoSaveStatus('saving');
    } else {
      setAutoSaveStatus('saved');
    }
  }, [saving]);

  useEffect(() => {
    // Close sidebar on ESC key
    const handleEscape = (e) => {
      if (e.key === 'Escape' && showSidebarValue) {
        setShowSidebarValue(false);
      }
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [showSidebarValue]);

  useEffect(() => {
    // Focus trap for sidebar
    if (showSidebarValue && sidebarRef.current) {
      const focusableElements = sidebarRef.current.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      if (focusableElements.length > 0) {
        focusableElements[0].focus();
      }
    }
  }, [showSidebarValue]);

  // Check if section is completed
  const isSectionCompleted = useCallback((section) => {
    if (!section) return false;
    const sectionQues = questions.filter(q => q.section_id === section.id);
    if (sectionQues.length === 0) return true;

    // Check completion requirement
    const answeredCount = sectionQues.filter(q => {
      const answer = answers[q.id];
      if (!answer) return false;
      
      // Special handling for coding questions - check if all tests passed
      if (q.question_type === 'coding') {
        return answer && (
          (typeof answer === 'object' && answer.allTestsPassed === true) ||
          (typeof answer === 'object' && answer.code && answer.code.trim() !== '' && 
           Array.isArray(answer.testResults) && answer.testResults.length > 0 &&
           answer.testResults.every(result => result && result.result?.verdict?.status === 'accepted'))
        );
      }
      
      // For other question types, use standard check
      return (
        (typeof answer === 'string' && answer.trim() !== '') ||
        (Array.isArray(answer) && answer.length > 0) ||
        (typeof answer === 'object' && answer.value && answer.value !== '')
      );
    }).length;

    if (section.completion_requirement === 'all') {
      return answeredCount === sectionQues.length;
    } else if (section.completion_requirement === 'minimum' && section.minimum_questions) {
      return answeredCount >= section.minimum_questions;
    } else if (section.completion_requirement === 'percentage' && section.completion_percentage) {
      return (answeredCount / sectionQues.length) * 100 >= section.completion_percentage;
    }

    return answeredCount === sectionQues.length;
  }, [questions, answers]);

  // Check if can navigate to section
  const canNavigateToSection = useCallback((sectionIndex) => {
    if (!sections || sections.length === 0) return true;
    if (sectionIndex < 0 || sectionIndex >= sections.length) return false;
    if (sectionIndex === currentSectionIndex) return true;

    // If sequential sections enabled, enforce completion requirements
    if (sequentialSections) {
      // Can go back if allow_return_to_section is true
      if (sectionIndex < currentSectionIndex) {
        const targetSection = sections[sectionIndex];
        return targetSection?.allow_return_to_section !== false;
      }
      // Can only go forward if all previous sections are completed
      if (sectionIndex > currentSectionIndex) {
        // Check if all previous sections from current to target (exclusive) are completed
        for (let i = currentSectionIndex; i < sectionIndex; i++) {
          if (!isSectionCompleted(sections[i])) {
            return false;
          }
        }
        return true;
      }
    }

    return true;
  }, [sections, currentSectionIndex, sequentialSections, isSectionCompleted]);

  // Navigate to question within section
  const navigateToQuestion = useCallback((questionIndex, sectionIndex = null) => {
    const targetSection = sectionIndex !== null ? sections[sectionIndex] : currentSection;
    
    if (!targetSection && sections.length > 0) {
      // No section context, use global index
      if (questionIndex >= 0 && questionIndex < questions.length) {
        const question = questions[questionIndex];
        setCurrentQuestionIndex(questionIndex);
        // Update section index if question has section
        if (question.section_id) {
          const secIndex = sections.findIndex(s => s.id === question.section_id);
          if (secIndex >= 0) {
            setCurrentSectionIndex(secIndex);
          }
        }
        setShowSidebarValue(false);
      }
      return;
    }

    // Navigate within current section
    const targetQuestions = targetSection 
      ? questions.filter(q => q.section_id === targetSection.id)
      : sectionQuestions;

    if (questionIndex >= 0 && questionIndex < targetQuestions.length) {
      const targetQuestion = targetQuestions[questionIndex];
      const globalIndex = questions.findIndex(q => q.id === targetQuestion.id);
      
      if (globalIndex >= 0) {
        // Check section navigation rules
        const section = sections.find(s => s.id === targetQuestion.section_id);
        if (section) {
          // Check if sequential navigation and trying to go back
          if (section.navigation_type === 'sequential' && questionIndex < sectionQuestionIndex) {
            toast.error('Sequential navigation: You cannot go back in this section');
            return;
          }
        }

        setCurrentQuestionIndex(globalIndex);
        if (sectionIndex !== null && sectionIndex !== currentSectionIndex) {
          setCurrentSectionIndex(sectionIndex);
        }
        setShowSidebarValue(false);
      }
    }
  }, [questions, sections, currentSection, sectionQuestions, sectionQuestionIndex, currentSectionIndex, setCurrentQuestionIndex, setCurrentSectionIndex, setShowSidebarValue]);

  // Navigate to section
  const navigateToSection = useCallback(async (sectionIndex) => {
    if (!canNavigateToSection(sectionIndex)) {
      if (sequentialSections && sectionIndex > currentSectionIndex) {
        toast.error('Please complete the current section before proceeding');
      } else {
        toast.error('Cannot navigate to this section');
      }
      return;
    }

    // Save answers before navigation if saveAnswer is available
    if (saveAnswer && submission) {
      try {
        const currentSection = sections[currentSectionIndex];
        if (currentSection) {
          const sectionQuestions = questions.filter(q => q.section_id === currentSection.id);
          // Save all answers in current section
          for (const question of sectionQuestions) {
            const answer = answers[question.id];
            if (answer !== undefined && answer !== null) {
              await saveAnswer(question.id, answer, false);
            }
          }
          // Small delay to ensure saves complete
          await new Promise(resolve => setTimeout(resolve, 150)); // Reduced from 300ms
        }
      } catch (error) {
        console.error('Error saving before section navigation:', error);
        toast.warning('Some answers may not be saved. Please try again.');
        // Continue navigation anyway - don't block user
      }
    }

    if (sectionIndex >= 0 && sectionIndex < sections.length) {
      setCurrentSectionIndex(sectionIndex);
      const section = sections[sectionIndex];
      const sectionQues = questions.filter(q => q.section_id === section.id);
      if (sectionQues.length > 0) {
        const firstQuestionIndex = questions.findIndex(q => q.id === sectionQues[0].id);
        if (firstQuestionIndex >= 0) {
          setCurrentQuestionIndex(firstQuestionIndex);
        }
      }
      setShowSidebarValue(false);
    }
  }, [sections, questions, canNavigateToSection, sequentialSections, currentSectionIndex, setCurrentQuestionIndex, setCurrentSectionIndex, setShowSidebarValue, saveAnswer, submission, answers]);

  const goToPrevious = useCallback(() => {
    // Only navigate within current section
    if (sectionQuestionIndex > 0) {
      navigateToQuestion(sectionQuestionIndex - 1);
    }
  }, [sectionQuestionIndex, navigateToQuestion]);

  const goToNext = useCallback(async () => {
    if (sectionQuestionIndex < sectionQuestions.length - 1) {
      navigateToQuestion(sectionQuestionIndex + 1);
    } else {
      // Reached end of section - trigger section completion
      // This will be handled by the parent component through onSectionComplete
      if (requireSectionCompletion && !isSectionCompleted(currentSection)) {
        toast.error('Please complete all required questions in this section before proceeding');
        return;
      }
      
      // Save answers before leaving section
      if (saveAnswer && submission) {
        try {
          const sectionQues = questions.filter(q => q.section_id === currentSection?.id);
          // Save all answers in current section
          for (const question of sectionQues) {
            const answer = answers[question.id];
            if (answer !== undefined && answer !== null) {
              await saveAnswer(question.id, answer, false);
            }
          }
          // Small delay to ensure saves complete
          await new Promise(resolve => setTimeout(resolve, 150)); // Reduced from 300ms
        } catch (error) {
          console.error('Error saving before section completion:', error);
          toast.warning('Some answers may not be saved. Please try again.');
          // Continue anyway - don't block navigation
        }
      }
      
      // If onSectionComplete prop is provided (section-based flow), call it
      // Otherwise, navigate to next section normally
      if (onSectionComplete) {
        onSectionComplete();
      } else if (currentSectionIndex < sections.length - 1 && canNavigateToSection(currentSectionIndex + 1)) {
        await navigateToSection(currentSectionIndex + 1);
      }
    }
  }, [sectionQuestionIndex, sectionQuestions.length, currentSectionIndex, sections.length, requireSectionCompletion, isSectionCompleted, currentSection, canNavigateToSection, navigateToQuestion, navigateToSection, onSectionComplete, saveAnswer, submission, answers, questions]);

  const handleSubmitAssessment = () => {
    setShowSubmissionModal(true);
  };

  const getAnsweredCount = () => {
    return Object.keys(answers).filter(key => answers[key] !== null && answers[key] !== '' && answers[key] !== undefined).length;
  };

  const getFlaggedCount = () => {
    return flaggedQuestions.size;
  };

  const getQuestionStatus = (question, index) => {
    const answered = !!answers[question.id] && answers[question.id] !== '';
    const flagged = flaggedQuestions.has(question.id);
    const isCurrent = index === currentQuestionIndex;
    
    if (isCurrent) return { icon: <CircleDot className="h-4 w-4 text-blue-600" />, status: 'current' };
    if (flagged && answered) return { icon: <CircleDot className="h-4 w-4 text-yellow-600" />, status: 'marked' };
    if (flagged) return { icon: <CircleDot className="h-4 w-4 text-orange-600" />, status: 'marked' };
    if (answered) return { icon: <Check className="h-4 w-4 text-green-600" />, status: 'answered' };
    return { icon: <Circle className="h-4 w-4 text-gray-400" />, status: 'unanswered' };
  };

  const getAutoSaveStatusDisplay = () => {
    switch (autoSaveStatus) {
      case 'saving':
        return (
          <div className="flex items-center gap-2 text-amber-600">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span className="text-sm">Saving...</span>
          </div>
        );
      case 'offline':
        return (
          <div className="flex items-center gap-2 text-red-600">
            <WifiOff className="h-4 w-4" />
            <span className="text-sm">Offline</span>
          </div>
        );
      default:
        return (
          <div className="flex items-center gap-2 text-green-600">
            <Wifi className="h-4 w-4" />
            <span className="text-sm">Saved</span>
          </div>
        );
    }
  };

  const getProctorStatusDisplay = () => {
    if (!proctoringEnabled) return null;

    const statusConfig = {
      live: { color: 'text-green-600', bg: 'bg-green-50', border: 'border-green-200', label: 'Live' },
      recording: { color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-200', label: 'Recording' },
      disconnected: { color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-200', label: 'Disconnected' },
      flagged: { color: 'text-orange-600', bg: 'bg-orange-50', border: 'border-orange-200', label: `Flagged (${violationCount})` }
    };

    const config = statusConfig[proctorStatus] || statusConfig.live;

    return (
      <Badge className={`${config.color} ${config.bg} ${config.border} border`}>
        <Eye className="h-3 w-3 mr-1" />
        {config.label}
      </Badge>
    );
  };

  // Get isFlagged status - defined before use
  const isFlagged = useMemo(() => {
    return currentQuestion ? flaggedQuestions.has(currentQuestion.id) : false;
  }, [currentQuestion, flaggedQuestions]);

  // Memoized question content component (removed - no longer used since we moved navigation above)
  
  // Memoize current answer
  const currentAnswer = useMemo(() => {
    return currentQuestion ? answers[currentQuestion.id] : null;
  }, [currentQuestion, answers]);

  // Memoized response panel component
  const ResponsePanel = useMemo(() => {
    if (!currentQuestion) return null;

    if (currentQuestion.question_type === 'coding') {
      return (
        <CodingQuestionInterface
          question={currentQuestion}
          answer={currentAnswer}
          onAnswerChange={(answer) => {
            handleAnswerChange(currentQuestion.id, answer);
            // Auto-save immediately
            handleSaveAnswer(currentQuestion.id, answer);
          }}
          onSave={(answer) => handleSaveAnswer(currentQuestion.id, answer)}
          submissionId={submission?.submissionId}
          theme={theme}
          isDarkMode={isDarkMode}
        />
      );
    }

    return (
      <QuestionRenderer
        question={currentQuestion}
        answer={currentAnswer}
        onAnswerChange={(answer) => {
          handleAnswerChange(currentQuestion.id, answer);
          // Auto-save immediately
          handleSaveAnswer(currentQuestion.id, answer);
        }}
        onSave={(answer) => handleSaveAnswer(currentQuestion.id, answer)}
        theme={theme}
        isDarkMode={isDarkMode}
      />
    );
  }, [currentQuestion, currentAnswer, handleAnswerChange, handleSaveAnswer, submission, theme, isDarkMode]);

  // Check if questions array exists and has items
  if (!questions || questions.length === 0) {
            return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <AlertTriangle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className={`text-lg font-medium mb-2 ${isDarkMode ? 'text-gray-100' : 'text-gray-900'}`}>No Questions Available</h3>
          <p className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>Questions are being loaded...</p>
        </div>
      </div>
  );
  }

  return (
    <div className={`h-screen flex flex-col overflow-hidden ${isDarkMode ? 'dark bg-gray-900' : 'bg-gray-50'}`}>
      {/* Header will be rendered by parent component */}

      {/* Main Content Area with Collapsible Sidebar */}
      <div className="flex-1 flex overflow-hidden min-h-0">
        {/* Collapsible Sidebar - Always visible, can collapse */}
        <motion.aside
          initial={false}
          animate={{ width: showSidebarValue && !sidebarCollapsed ? '320px' : '60px' }}
          className={`border-r flex flex-col transition-all duration-300 flex-shrink-0 ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}
        >
          {/* Sidebar Toggle Button - Always Visible */}
          <div className={`p-2 border-b flex-shrink-0 ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                if (sidebarCollapsed || !showSidebarValue) {
                  setSidebarCollapsed(false);
                  setShowSidebarValue(true);
                } else {
                  setSidebarCollapsed(true);
                  setShowSidebarValue(false);
                }
              }}
              className="w-full justify-center"
              title={showSidebarValue && !sidebarCollapsed ? 'Collapse Sidebar' : 'Expand Sidebar'}
            >
              <Menu className="h-5 w-5" />
            </Button>
            </div>
            
          {/* Sidebar Content */}
          {showSidebarValue && !sidebarCollapsed && (
            <div className="flex-1 flex flex-col overflow-hidden">
              {/* Simple Header */}
              <div className={`p-3 border-b flex-shrink-0 ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                <div className="flex items-center justify-between mb-2">
                  <h2 className={`font-medium text-sm ${isDarkMode ? 'text-gray-100' : 'text-gray-900'}`}>
                    {currentSection ? (currentSection.name || `Section ${currentSectionIndex + 1}`) : 'Questions'}
                  </h2>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setSidebarCollapsed(true);
                      setShowSidebarValue(false);
                    }}
                    className={`h-6 w-6 p-0 ${isDarkMode ? 'text-gray-300 hover:bg-gray-700' : ''}`}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                {sections && sections.length > 0 && (
                  <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                    {sectionQuestions.filter(q => {
                      const answer = answers[q.id];
                      return answer && (
                        (typeof answer === 'string' && answer.trim() !== '') ||
                        (Array.isArray(answer) && answer.length > 0) ||
                        (typeof answer === 'object' && answer.value)
                      );
                    }).length}/{sectionQuestions.length} answered
                  </p>
                    )}
                  </div>
                  
              {/* Question List */}
              <div className="flex-1 overflow-y-auto p-2">
                {sections && sections.length > 0 && currentSection ? (
                  <div className="space-y-1">
                    {sectionQuestions.map((question, qIdx) => {
                      const globalIndex = questions.findIndex(q => q.id === question.id);
                      const status = getQuestionStatus(question, globalIndex);
                      const isCurrent = globalIndex === currentQuestionIndex;
                      const isCodingQuestion = question.question_type === 'coding' || question.type === 'coding';
                      const questionTitle = question.title || question.question_text || question.content;
                      
                      return (
                        <button
                          key={question.id}
                          onClick={() => navigateToQuestion(qIdx, currentSectionIndex)}
                          className={`w-full flex items-center gap-2 p-2.5 rounded text-sm font-medium transition-all ${
                            isCurrent
                              ? 'bg-blue-600 text-white shadow-sm'
                              : isDarkMode 
                                ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' 
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          }`}
                          title={isCodingQuestion && questionTitle ? questionTitle : undefined}
                    >
                          <span className="text-xs flex-shrink-0">{qIdx + 1}</span>
                          {isCodingQuestion && questionTitle ? (
                            <span className="flex-1 text-left truncate text-xs">{questionTitle}</span>
                          ) : (
                            <span className="text-xs flex-shrink-0">{status.icon}</span>
                          )}
                          {isCodingQuestion && questionTitle && (
                            <span className="text-xs flex-shrink-0">{status.icon}</span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <div className="space-y-1">
                    {questions.map((question, index) => {
                      const status = getQuestionStatus(question, index);
                      const isCurrent = index === currentQuestionIndex;
                      const isCodingQuestion = question.question_type === 'coding' || question.type === 'coding';
                      const questionTitle = question.title || question.question_text || question.content;
                      
                      return (
                        <button
                          key={question.id || index}
                          onClick={() => navigateToQuestion(index)}
                          className={`w-full flex items-center gap-2 p-2.5 rounded text-sm font-medium transition-all ${
                            isCurrent
                              ? 'bg-blue-600 text-white shadow-sm'
                              : isDarkMode 
                                ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' 
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          }`}
                          title={isCodingQuestion && questionTitle ? questionTitle : undefined}
                        >
                          <span className="text-xs flex-shrink-0">{index + 1}</span>
                          {isCodingQuestion && questionTitle ? (
                            <span className="flex-1 text-left truncate text-xs">{questionTitle}</span>
                          ) : (
                            <span className="text-xs flex-shrink-0">{status.icon}</span>
                          )}
                          {isCodingQuestion && questionTitle && (
                            <span className="text-xs flex-shrink-0">{status.icon}</span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}
        </motion.aside>

        {/* Main Content */}
        <div className={`flex-1 overflow-hidden min-h-0 flex flex-col ${isDarkMode ? 'bg-gray-900' : 'bg-white'}`}>
          {/* Previous/Next Navigation Buttons Above Question */}
          <div className={`flex items-center justify-between px-6 py-3 border-b flex-shrink-0 ${isDarkMode ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-white'}`}>
              <Button
                variant="outline"
                onClick={goToPrevious}
              disabled={sectionQuestionIndex === 0}
              size="sm"
              className={isDarkMode ? 'border-gray-600 text-gray-300 hover:bg-gray-700 disabled:opacity-50' : ''}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Previous
              </Button>

            {/* Mark for Review Button */}
            {currentQuestion && (
                <Button
                  variant="outline"
                onClick={handleFlagQuestion}
                size="sm"
                className={
                  isFlagged 
                    ? (isDarkMode ? 'bg-yellow-900 border-yellow-700 text-yellow-200 hover:bg-yellow-800' : 'bg-yellow-50 border-yellow-300 text-yellow-700 hover:bg-yellow-100')
                    : (isDarkMode ? 'border-gray-600 text-gray-300 hover:bg-gray-700' : '')
                }
                >
                <Flag className={`h-4 w-4 mr-2 ${isFlagged ? (isDarkMode ? 'fill-yellow-400 text-yellow-400' : 'fill-yellow-600 text-yellow-600') : ''}`} />
                {isFlagged ? 'Marked for Review' : 'Mark for Review'}
                </Button>
            )}

            {sectionQuestionIndex === sectionQuestions.length - 1 ? (
                <Button
                onClick={goToNext}
                className="bg-blue-600 hover:bg-blue-700 text-white"
                size="sm"
                >
                Complete Section
                <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
            ) : (
              <Button
                variant="outline"
                onClick={goToNext}
                size="sm"
                className={isDarkMode ? 'border-gray-600 text-gray-300 hover:bg-gray-700' : ''}
              >
                Next
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            )}
                </div>
                
          {/* Question Content - Takes remaining space */}
          <div className="flex-1 overflow-hidden min-h-0">
            {currentQuestion ? (
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentQuestionIndex}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2, ease: 'easeOut' }}
                  className="h-full"
                >
                  {ResponsePanel}
                </motion.div>
              </AnimatePresence>
            ) : (
              <div className="text-center py-12">
                <AlertTriangle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">Loading question...</p>
                  </div>
                )}
          </div>
        </div>
      </div>


      {/* Submission Modal */}
      {showSubmissionModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md mx-4">
            <CardHeader>
              <CardTitle>Submit Assessment</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <p className="text-gray-600">
                  Are you sure you want to submit your assessment? This action cannot be undone.
                </p>
                
                <div className="bg-gray-50 p-4 rounded-lg space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Questions Answered:</span>
                    <span className="font-medium">{getAnsweredCount()}/{questions.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Questions Flagged:</span>
                    <span className="font-medium">{getFlaggedCount()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Time Remaining:</span>
                    <span className="font-medium">
                      {timerRef.current?.getTimeRemaining() 
                        ? `${Math.floor(timerRef.current.getTimeRemaining() / 60)}:${String(timerRef.current.getTimeRemaining() % 60).padStart(2, '0')}`
                        : 'N/A'
                      }
                    </span>
                  </div>
                </div>
                
                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    onClick={() => setShowSubmissionModal(false)}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={() => {
                      setShowSubmissionModal(false);
                      onComplete();
                    }}
                    className="flex-1 bg-green-600 hover:bg-green-700"
                  >
                    Submit Assessment
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default QuestionTakingStep;
