import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/ui/use-toast';
import { motion, AnimatePresence } from 'framer-motion';
import ProctorMonitoring from '@/components/ProctorMonitoring';
import EnhancedProctorMonitoring from '@/components/EnhancedProctorMonitoring';
import AssessmentFlow from '@/components/AssessmentFlow';
import QuestionRenderer from '@/components/QuestionRenderer';
import CodingQuestionRenderer from '@/components/CodingQuestionRenderer';
import { 
  Clock, 
  CheckCircle, 
  Play, 
  Save, 
  ChevronLeft,
  ChevronRight,
  Timer,
  AlertTriangle,
  Shield,
  Monitor,
  Camera,
  WifiOff,
  VolumeX,
  Maximize,
  BookOpen,
  Target,
  Award,
  Check,
  XCircle,
  Eye,
  EyeOff,
  Code,
  FileText,
  Hash,
  List,
  Grid,
  X,
  Lock,
  Copy,
  MousePointer,
  Keyboard
} from 'lucide-react';
import apiService from '@/services/api';

// Proctor Rules Component - Updated to use actual assessment settings
const ProctorRules = ({ assessment, onAccept }) => {
  const [accepted, setAccepted] = useState(false);
  const [currentRule, setCurrentRule] = useState(0);

  // Get actual proctoring settings from assessment
  const proctoringSettings = assessment?.proctoring_settings || {};
  const requireProctoring = assessment?.require_proctoring || false;

  // Check if any proctoring features are enabled
  const hasProctoringFeatures = proctoringSettings && (
    proctoringSettings.browser_lockdown ||
    proctoringSettings.tab_switching_detection ||
    proctoringSettings.copy_paste_detection ||
    proctoringSettings.right_click_detection ||
    proctoringSettings.fullscreen_requirement ||
    proctoringSettings.keyboard_shortcut_detection ||
    proctoringSettings.require_webcam ||
    proctoringSettings.require_microphone ||
    proctoringSettings.screen_sharing_detection
  );

  // Show rules if proctoring is required OR if any proctoring features are enabled
  if (!requireProctoring && !hasProctoringFeatures) {
  
    return null;
  }



  const proctorRules = [];

  // Add rules based on actual enabled settings
  if (proctoringSettings.browser_lockdown) {
    proctorRules.push({
      icon: <Lock className="h-8 w-8 text-blue-600" />,
      title: "Browser Lockdown",
      description: "Your browser will be locked to prevent switching tabs or opening other applications.",
      warning: "Attempting to switch tabs may result in assessment termination."
    });
  }

  if (proctoringSettings.tab_switching_detection) {
    proctorRules.push({
      icon: <Monitor className="h-8 w-8 text-green-600" />,
      title: "Tab Switching Detection",
      description: "The system will monitor for tab switching and application switching.",
      warning: "Switching tabs or applications will be flagged as suspicious activity."
    });
  }

  if (proctoringSettings.copy_paste_detection) {
    proctorRules.push({
      icon: <Copy className="h-8 w-8 text-red-600" />,
      title: "Copy-Paste Detection",
      description: "Copy and paste operations are monitored and may be restricted.",
      warning: "Unauthorized copy-paste actions may result in penalties."
    });
  }

  if (proctoringSettings.right_click_detection) {
    proctorRules.push({
      icon: <MousePointer className="h-8 w-8 text-orange-600" />,
      title: "Right-Click Restriction",
      description: "Right-click context menus are disabled during the assessment.",
      warning: "Attempting to use right-click may be flagged as suspicious activity."
    });
  }

  if (proctoringSettings.fullscreen_requirement) {
    proctorRules.push({
      icon: <Maximize className="h-8 w-8 text-purple-600" />,
      title: "Fullscreen Requirement",
      description: "The assessment must be taken in fullscreen mode.",
      warning: "Exiting fullscreen mode may result in assessment termination."
    });
  }

  if (proctoringSettings.keyboard_shortcut_detection) {
    proctorRules.push({
      icon: <Keyboard className="h-8 w-8 text-indigo-600" />,
      title: "Keyboard Shortcut Monitoring",
      description: "Certain keyboard shortcuts are monitored and may be restricted.",
      warning: "Using restricted keyboard shortcuts may be flagged."
    });
  }

  if (proctoringSettings.require_webcam) {
    proctorRules.push({
      icon: <Camera className="h-8 w-8 text-teal-600" />,
      title: "Webcam Monitoring",
      description: "Your webcam will be used to monitor your face during the assessment.",
      warning: "Keep your face visible and well-lit throughout the assessment."
    });
  }

  if (proctoringSettings.require_microphone) {
    proctorRules.push({
      icon: <VolumeX className="h-8 w-8 text-pink-600" />,
      title: "Audio Monitoring",
      description: "Your microphone will be monitored for background noise and communication.",
      warning: "Avoid talking or making noise during the assessment."
    });
  }

  // If no specific rules, show general proctoring message
  if (proctorRules.length === 0) {
    proctorRules.push({
      icon: <Shield className="h-8 w-8 text-blue-600" />,
      title: "Proctoring Enabled",
      description: "This assessment uses automated proctoring to ensure academic integrity.",
      warning: "Follow all assessment guidelines and avoid any suspicious behavior."
    });
  }

  const handleNext = () => {
    if (currentRule < proctorRules.length - 1) {
      setCurrentRule(currentRule + 1);
    } else {
      setAccepted(true);
    }
  };

  const handleAccept = () => {
    onAccept();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Simple header for proctor rules */}
      <div className="bg-white border-b px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Shield className="h-6 w-6 text-blue-600" />
            <h1 className="text-lg font-semibold">Assessment Proctor Rules</h1>
          </div>
          <div className="text-sm text-gray-500">
            {assessment?.title || 'Assessment'}
          </div>
        </div>
      </div>
      
      <div className="flex items-center justify-center p-4 flex-1">
      <Card className="w-full max-w-2xl">
        <CardHeader className="text-center">
          <div className="flex items-center justify-center mb-4">
            <Shield className="h-12 w-12 text-blue-600" />
          </div>
          <CardTitle className="text-2xl font-bold">Assessment Proctor Rules</CardTitle>
          <CardDescription>
            Please read and understand these rules before starting your assessment
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Progress indicator */}
          <div className="flex justify-center space-x-2">
            {proctorRules.map((_, index) => (
              <div
                key={index}
                className={`h-2 w-2 rounded-full ${
                  index <= currentRule ? 'bg-blue-600' : 'bg-gray-300'
                }`}
              />
            ))}
          </div>

          {/* Current rule */}
          <motion.div
            key={currentRule}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="text-center space-y-4"
          >
            <div className="flex justify-center">
              {proctorRules[currentRule].icon}
            </div>
            <h3 className="text-xl font-semibold">{proctorRules[currentRule].title}</h3>
            <p className="text-gray-600">{proctorRules[currentRule].description}</p>
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription className="font-medium text-orange-800">
                {proctorRules[currentRule].warning}
              </AlertDescription>
            </Alert>
          </motion.div>

          {/* Navigation buttons */}
          <div className="flex justify-between pt-4">
            <Button
              variant="outline"
              onClick={() => setCurrentRule(Math.max(0, currentRule - 1))}
              disabled={currentRule === 0}
            >
              <ChevronLeft className="h-4 w-4 mr-2" />
              Previous
            </Button>
            
            {currentRule < proctorRules.length - 1 ? (
              <Button onClick={handleNext}>
                Next
                <ChevronRight className="h-4 w-4 ml-2" />
              </Button>
            ) : (
              <Button onClick={handleAccept} disabled={!accepted}>
                <Check className="h-4 w-4 mr-2" />
                Accept & Continue
              </Button>
            )}
          </div>

          {/* Final acceptance */}
          {currentRule === proctorRules.length - 1 && (
            <div className="flex items-center space-x-2 justify-center pt-4">
              <Checkbox
                id="accept-rules"
                checked={accepted}
                onCheckedChange={setAccepted}
              />
              <label htmlFor="accept-rules" className="text-sm">
                I understand and agree to follow all proctor rules
              </label>
            </div>
          )}
        </CardContent>
      </Card>
      </div>
    </div>
  );
};

// Assessment Instructions Component
const AssessmentInstructions = ({ assessment, attemptInfo, onStart, onPasswordRequired }) => {
  const [ready, setReady] = useState(false);

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100">
      {/* Simple header for assessment instructions */}
      <div className="bg-white border-b px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <BookOpen className="h-6 w-6 text-green-600" />
            <h1 className="text-lg font-semibold">Assessment Instructions</h1>
          </div>
          <div className="text-sm text-gray-500">
            {assessment?.title || 'Assessment'}
          </div>
        </div>
      </div>
      
      <div className="flex items-center justify-center p-4 flex-1">
      <Card className="w-full max-w-4xl">
        <CardHeader className="text-center">
          <div className="flex items-center justify-center mb-4">
            <BookOpen className="h-12 w-12 text-green-600" />
          </div>
          <CardTitle className="text-3xl font-bold">{assessment.title}</CardTitle>
          <CardDescription className="text-lg">
            Assessment Instructions & Guidelines
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Assessment Overview */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <Timer className="h-8 w-8 text-blue-600 mx-auto mb-2" />
              <div className="font-semibold">Duration</div>
              <div className="text-sm text-gray-600">{assessment.time_limit_minutes} minutes</div>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <Target className="h-8 w-8 text-green-600 mx-auto mb-2" />
              <div className="font-semibold">Total Points</div>
              <div className="text-sm text-gray-600">{assessment.total_points} points</div>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <Award className="h-8 w-8 text-purple-600 mx-auto mb-2" />
              <div className="font-semibold">Passing Score</div>
              <div className="text-sm text-gray-600">{assessment.passing_score}%</div>
            </div>
          </div>

          {/* Attempt Information */}
          {attemptInfo && (
            <div className="space-y-4">
              <h3 className="text-xl font-semibold">Attempt Information:</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="text-center p-4 bg-orange-50 rounded-lg">
                  <Hash className="h-8 w-8 text-orange-600 mx-auto mb-2" />
                  <div className="font-semibold">Current Attempt</div>
                  <div className="text-sm text-gray-600">{attemptInfo.current_attempts + 1} of {attemptInfo.max_attempts || 'Unlimited'}</div>
                </div>
                {attemptInfo.time_between_attempts_hours > 0 && (
                  <div className="text-center p-4 bg-yellow-50 rounded-lg">
                    <Clock className="h-8 w-8 text-yellow-600 mx-auto mb-2" />
                    <div className="font-semibold">Time Between Attempts</div>
                    <div className="text-sm text-gray-600">{attemptInfo.time_between_attempts_hours} hours</div>
                  </div>
                )}
              </div>
              {attemptInfo.current_attempts > 0 && (
                <div className="p-4 bg-blue-50 rounded-lg">
                  <div className="text-sm text-blue-800">
                    <strong>Previous Attempts:</strong> You have completed {attemptInfo.current_attempts} attempt(s) for this assessment.
                    {attemptInfo.last_attempt_date && (
                      <span> Your last attempt was on {new Date(attemptInfo.last_attempt_date).toLocaleDateString()}.</span>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Instructions */}
          <div className="space-y-4">
            <h3 className="text-xl font-semibold">Instructions:</h3>
            <div className="space-y-2 text-sm">
              <div className="flex items-start space-x-2">
                <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                <span>Read each question carefully before answering</span>
              </div>
              <div className="flex items-start space-x-2">
                <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                <span>You can navigate between questions using the navigation panel</span>
              </div>
              <div className="flex items-start space-x-2">
                <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                <span>Save your progress regularly using the Save button</span>
              </div>
              <div className="flex items-start space-x-2">
                <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                <span>Once submitted, you cannot change your answers</span>
              </div>
            </div>
          </div>

          {/* Proctor Settings - Only show if proctoring is enabled */}
          {assessment.require_proctoring && assessment.proctoring_settings && (
            <div className="space-y-4">
              <h3 className="text-xl font-semibold">Proctor Settings:</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {assessment.proctoring_settings.browser_lockdown && (
                <div className="flex items-center space-x-2">
                    <Lock className="h-4 w-4 text-blue-600" />
                    <span className="text-sm">Browser Lockdown: Enabled</span>
                </div>
                )}
                {assessment.proctoring_settings.tab_switching_detection && (
                <div className="flex items-center space-x-2">
                    <Monitor className="h-4 w-4 text-green-600" />
                    <span className="text-sm">Tab Switching Detection: Enabled</span>
                </div>
                )}
                {assessment.proctoring_settings.copy_paste_detection && (
                <div className="flex items-center space-x-2">
                    <Copy className="h-4 w-4 text-red-600" />
                    <span className="text-sm">Copy-Paste Detection: Enabled</span>
                </div>
                )}
                {assessment.proctoring_settings.right_click_detection && (
                <div className="flex items-center space-x-2">
                    <MousePointer className="h-4 w-4 text-orange-600" />
                    <span className="text-sm">Right-Click Restriction: Enabled</span>
                </div>
                )}
                {assessment.proctoring_settings.fullscreen_requirement && (
                  <div className="flex items-center space-x-2">
                    <Maximize className="h-4 w-4 text-purple-600" />
                    <span className="text-sm">Fullscreen Requirement: Enabled</span>
                  </div>
                )}
                {assessment.proctoring_settings.require_webcam && (
                  <div className="flex items-center space-x-2">
                    <Camera className="h-4 w-4 text-teal-600" />
                    <span className="text-sm">Webcam Monitoring: Enabled</span>
                  </div>
                )}
                {assessment.proctoring_settings.require_microphone && (
                  <div className="flex items-center space-x-2">
                    <VolumeX className="h-4 w-4 text-pink-600" />
                    <span className="text-sm">Audio Monitoring: Enabled</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Start Button */}
          <div className="flex justify-center pt-6">
            <Button 
              size="lg" 
              onClick={async () => {
                if (assessment.access_password) {
                  onPasswordRequired();
                } else {
                  setShowAssessmentFlow(true);
                }
              }} 
              className="px-8 py-3"
            >
              <Play className="h-5 w-5 mr-2" />
              Start Assessment
            </Button>
          </div>
        </CardContent>
      </Card>
      </div>
    </div>
  );
};

// Main Assessment Taking Component
const StudentAssessmentTakingPage = () => {
  const { assessmentId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();

  // State management
  const [assessment, setAssessment] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [isStarted, setIsStarted] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [showProctorRules, setShowProctorRules] = useState(true);
  const [showInstructions, setShowInstructions] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [proctorWarnings, setProctorWarnings] = useState([]);
  const [proctorStatus, setProctorStatus] = useState({});
  const [showSubmitDialog, setShowSubmitDialog] = useState(false);
  const [showFullscreenDialog, setShowFullscreenDialog] = useState(false);
  const [showSidebar, setShowSidebar] = useState(true);
  const [showExitDialog, setShowExitDialog] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [assessmentStatus, setAssessmentStatus] = useState('loading');
  const [tabSwitchCount, setTabSwitchCount] = useState(0);
  const [maxTabSwitches, setMaxTabSwitches] = useState(0);
  const [attemptInfo, setAttemptInfo] = useState(null);
  const [isRetakeAttempt, setIsRetakeAttempt] = useState(false);
  const [isResumed, setIsResumed] = useState(false);
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [showAssessmentFlow, setShowAssessmentFlow] = useState(false);
  const [proctorViolations, setProctorViolations] = useState([]);
  const [assessmentTerminated, setAssessmentTerminated] = useState(false);

  // Refs
  const timerRef = useRef(null);
  const autoSaveRef = useRef(null);
  const timeRemainingRef = useRef(0);
  const streamRef = useRef(null);

  // Load assessment data
  useEffect(() => {
    loadAssessment();
  }, [assessmentId]);

  // Auto-save functionality
  useEffect(() => {
    if (isStarted && !isSubmitted) {
      autoSaveRef.current = setInterval(() => {
        saveProgress();
      }, 30000); // Auto-save every 30 seconds
    }

    return () => {
      if (autoSaveRef.current) {
        clearInterval(autoSaveRef.current);
      }
    };
  }, [isStarted, isSubmitted, answers]);

  // Activate proctoring features when assessment is loaded as in progress
  useEffect(() => {
    if (isStarted && assessment && assessment.proctoring_settings) {
      activateProctoringFeatures();
    }
  }, [isStarted, assessment]);

  // Timer functionality - Fixed timer implementation
  useEffect(() => {
    // Clear any existing timer
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    // Start timer only if assessment is started, not paused, not submitted, and has time remaining
    if (isStarted && !isPaused && !isSubmitted && timeRemaining > 0) {
      // Update the ref with current time
      timeRemainingRef.current = timeRemaining;
      
      timerRef.current = setInterval(() => {
        timeRemainingRef.current = timeRemainingRef.current - 1;
        
        if (timeRemainingRef.current <= 0) {
          // Auto-submit when time runs out
          setTimeout(() => {
            if (!isSubmitted) {
              handleSubmitAssessment();
            }
          }, 0);
          setTimeRemaining(0);
        } else {
          setTimeRemaining(timeRemainingRef.current);
        }
      }, 1000);
    }

    // Cleanup function
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [isStarted, isPaused, isSubmitted, timeRemaining]);

  // Prevent page exit
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (isStarted && !isSubmitted) {
        e.preventDefault();
        e.returnValue = 'Are you sure you want to leave? Your progress may be lost.';
        return e.returnValue;
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isStarted, isSubmitted]);

  // Cleanup proctoring features when component unmounts
  useEffect(() => {
    return () => {
      cleanupProctoringFeatures();
    };
  }, []);

  // Reset retake flag after a short delay to allow components to clear their data
  useEffect(() => {
    if (isRetakeAttempt) {
      const timer = setTimeout(() => {
        setIsRetakeAttempt(false);
      }, 1000); // Give components 1 second to clear their data
      
      return () => clearTimeout(timer);
    }
  }, [isRetakeAttempt]);

  const loadAssessment = async () => {
    try {
      setIsLoading(true);
      
      // First, get assessment templates assigned to the student to check access and timing
      const assessmentResponse = await apiService.getAssessmentInstances({ 
        student_id: user.id
      });

      if (assessmentResponse.success && assessmentResponse.data.length > 0) {
        // Find the specific assessment template (the getAssessmentInstances actually returns templates)
        const assessmentData = assessmentResponse.data.find(template => template.id === assessmentId);
        
        if (assessmentData) {
          // Check if assessment is available based on timing
          if (assessmentData.status === 'expired') {
            setAssessmentStatus('expired');
            toast({
              variant: "destructive",
              title: "Assessment Expired",
              description: "This assessment is no longer available. The time limit has passed."
            });
            return;
          } else if (assessmentData.status === 'scheduled') {
            setAssessmentStatus('scheduled');
            toast({
              variant: "destructive",
              title: "Assessment Not Started",
              description: "This assessment has not started yet. Please wait for the scheduled time."
            });
            return;
          } else if (assessmentData.status === 'completed') {
            setAssessmentStatus('completed');
            setIsSubmitted(true);
            toast({
              title: "Assessment Completed",
              description: "You have already completed this assessment."
            });
            return;
          }
          
          // Try to load proctoring settings from assessment template if not in template data
          let assessmentWithProctoring = assessmentData;
          if (!assessmentData.proctoring_settings) {
            try {
              // Set default proctoring settings based on the assessment type
              assessmentWithProctoring = {
                ...assessmentData,
                proctoring_settings: {
                  fullscreen_requirement: true,
                  right_click_detection: true,
                  copy_paste_detection: true,
                  keyboard_shortcut_detection: true,
                  tab_switching_detection: true
                }
              };
            } catch (error) {
              // Handle error silently
            }
          }
          
          setAssessment(assessmentWithProctoring);
          const initialTime = assessmentData.time_limit_minutes * 60;
          setTimeRemaining(initialTime);
          timeRemainingRef.current = initialTime;
          
          // Set max tab switches from proctoring settings
          const maxSwitches = assessmentWithProctoring.proctoring_settings?.max_tab_switches || 0;
          setMaxTabSwitches(maxSwitches);
          
          // Check if there's an in-progress assessment that can be resumed
          if (assessmentData.submission_status === 'in_progress') {
            // Check if assessment can be resumed (not expired, time remaining)
            const canResume = canResumeAssessment(assessmentData);
            
            if (canResume) {
              // Skip attempt checking for resume - just load the assessment
              setAssessmentStatus('available');
            } else {
              // Assessment is in progress but can't be resumed (expired)
              setAssessmentStatus('expired');
              toast({
                variant: "destructive",
                title: "Assessment Expired",
                description: "This in-progress assessment has expired and can no longer be resumed."
              });
              return;
            }
          } else {
            // Check attempt limits only for new attempts
            try {
              const attemptInfoResponse = await apiService.getAssessmentAttemptInfo(assessmentId);
              
              if (attemptInfoResponse.success) {
                const attemptInfo = attemptInfoResponse.data;
                
                if (!attemptInfo.can_attempt) {
                  if (attemptInfo.current_attempts >= attemptInfo.max_attempts) {
                    setAssessmentStatus('max_attempts_reached');
                    toast({
                      variant: "destructive",
                      title: "Maximum Attempts Reached",
                      description: `You have reached the maximum number of attempts (${attemptInfo.max_attempts}) for this assessment.`
                    });
                    return;
                  } else if (attemptInfo.time_until_next_attempt > 0) {
                    setAssessmentStatus('waiting_period');
                    toast({
                      variant: "destructive",
                      title: "Waiting Period",
                      description: `You must wait ${attemptInfo.time_until_next_attempt} more hours before attempting this assessment again.`
                    });
                    return;
                  }
                }
                
                // Store attempt info for display
                setAttemptInfo(attemptInfo);
              }
            } catch (error) {
              console.error('Error checking attempt info:', error);
              // Continue with assessment loading even if attempt check fails
            }
          }

          // Load questions and progress after assessment data is loaded
          const questionsAssessmentId = assessmentId;
          const questionsResponse = await apiService.getAssessmentQuestions(questionsAssessmentId);
          
          if (questionsResponse.success) {
            setQuestions(questionsResponse.data);
          } else {
            toast({
              variant: "destructive",
              title: "Error",
              description: "Failed to load questions"
            });
          }

          // Load existing progress
          const progressResponse = await apiService.getAssessmentSubmission(questionsAssessmentId, user.id);
          
          if (progressResponse.success && progressResponse.data) {
            // Check if this is a retake attempt (previous submission was completed)
            const isRetakeAttempt = progressResponse.data.status === 'submitted' || progressResponse.data.status === 'completed';
            
            if (isRetakeAttempt) {
              // For retake attempts, start fresh with no previous answers
              console.log('Retake attempt detected - starting fresh');
              console.log('Previous answers cleared, starting with empty state');
              setAnswers({});
              setIsStarted(false);
              setIsSubmitted(false);
              setTimeRemaining(initialTime);
              timeRemainingRef.current = initialTime;
              setIsRetakeAttempt(true);
            } else if (progressResponse.data.status === 'in_progress') {
              // For in-progress assessments, restore the saved state
              setAnswers(progressResponse.data.answers || {});
              setIsStarted(true);
              setIsSubmitted(false);
              
              // Calculate remaining time based on start time and time limit
              if (progressResponse.data.started_at && assessmentData.time_limit_minutes) {
                const startTime = new Date(progressResponse.data.started_at);
                const now = new Date();
                const elapsedMinutes = Math.floor((now - startTime) / (1000 * 60));
                const remainingMinutes = Math.max(0, assessmentData.time_limit_minutes - elapsedMinutes);
                
                if (remainingMinutes > 0) {
                  const remainingSeconds = remainingMinutes * 60;
                  setTimeRemaining(remainingSeconds);
                  timeRemainingRef.current = remainingSeconds;
                  
                  // Skip instructions and proctor rules for resumed assessments
                  setShowInstructions(false);
                  setShowProctorRules(false);
                  setIsResumed(true);
                  
                  toast({
                    title: "Assessment Resumed",
                    description: `Continuing from where you left off. ${remainingMinutes} minutes remaining.`
                  });
                } else {
                  // Time has expired
                  toast({
                    variant: "destructive",
                    title: "Time Expired",
                    description: "The time limit for this assessment has been exceeded."
                  });
                  setAssessmentStatus('expired');
                  return;
                }
              } else if (progressResponse.data.time_remaining) {
                // Fallback to stored time remaining
                setTimeRemaining(progressResponse.data.time_remaining);
                timeRemainingRef.current = progressResponse.data.time_remaining;
                setShowInstructions(false);
                setShowProctorRules(false);
              }
            }
          }
        } else {
          setAssessmentStatus('not_found');
          toast({
            variant: "destructive",
            title: "Error",
            description: "Assessment not found"
          });
          return;
        }
      } else {
        setAssessmentStatus('not_found');
        toast({
          variant: "destructive",
          title: "Error",
          description: "No assessments found"
        });
        return;
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load assessment: " + error.message
      });
    } finally {
      setIsLoading(false);
    }
  };

  const saveProgress = async () => {
    if (isSubmitted) return;

    try {
      setIsSaving(true);
      // The assessmentId from URL params is the assessment template ID
      const saveAssessmentId = assessmentId;
      
      await apiService.saveAssessmentProgress(saveAssessmentId, {
        student_id: user.id,
        answers,
        current_question: currentQuestionIndex,
        time_remaining: timeRemainingRef.current
      });
      setLastSaved(new Date());
    } catch (error) {
      console.error('Save progress error:', error);
      toast({
        variant: "destructive",
        title: "Save Failed",
        description: "Failed to save your progress: " + (error.message || 'Unknown error')
      });
    } finally {
      setIsSaving(false);
    }
  };

  const requestProctoringPermissions = async () => {
    if (!assessment?.proctoring_settings) return true;

    const settings = assessment.proctoring_settings;
    const permissions = { camera: false, microphone: false, screen: false };

    try {
      // Request camera permission if webcam monitoring is enabled
      if (settings.require_webcam) {
        try {
          await navigator.mediaDevices.getUserMedia({ 
            video: { 
              width: { ideal: 640 }, 
              height: { ideal: 480 },
              facingMode: 'user'
            } 
          });
          permissions.camera = true;
        } catch (error) {
          toast({
            variant: "destructive",
            title: "Camera Access Required",
            description: "Please enable camera access to continue with this assessment."
          });
          return false;
        }
      }

      // Request microphone permission if audio monitoring is enabled
      if (settings.require_microphone) {
        try {
          await navigator.mediaDevices.getUserMedia({ audio: true });
          permissions.microphone = true;
        } catch (error) {
          toast({
            variant: "destructive",
            title: "Microphone Access Required",
            description: "Please enable microphone access to continue with this assessment."
          });
          return false;
        }
      }

      // Request screen sharing permission if screen monitoring is enabled
      if (settings.screen_sharing_detection) {
        try {
          await navigator.mediaDevices.getDisplayMedia({ video: true });
          permissions.screen = true;
        } catch (error) {
          toast({
            variant: "destructive",
            title: "Screen Sharing Required",
            description: "Please enable screen sharing to continue with this assessment."
          });
          return false;
        }
      }

      return true;
    } catch (error) {
      console.error('Error requesting permissions:', error);
      toast({
        variant: "destructive",
        title: "Permission Error",
        description: "Failed to request required permissions. Please try again."
      });
      return false;
    }
  };

  const handlePasswordSubmit = async () => {
    if (passwordInput === assessment.access_password) {
      setShowPasswordDialog(false);
      setPasswordError('');
      setPasswordInput('');
      
      // Show assessment flow instead of directly starting
      setShowAssessmentFlow(true);
    } else {
      setPasswordError('Incorrect password. Please try again.');
    }
  };

  // Handle proctor violations
  const handleProctorViolation = (violation) => {
    setProctorViolations(prev => [...prev, violation]);
    
    toast({
      variant: "destructive",
      title: "Proctor Violation Detected",
      description: violation.message
    });
  };

  // Handle assessment termination
  const handleAssessmentTermination = (violation) => {
    setAssessmentTerminated(true);
    setIsStarted(false);
    
    toast({
      variant: "destructive",
      title: "Assessment Terminated",
      description: `Assessment terminated due to: ${violation.message}`
    });
  };

  // Handle assessment flow completion
  const handleAssessmentFlowComplete = () => {
    setShowAssessmentFlow(false);
    handleStartAssessment();
  };

  // Handle assessment flow cancellation
  const handleAssessmentFlowCancel = () => {
    setShowAssessmentFlow(false);
    // Cleanup any streams that might have been started
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }
  };

  const handleStartAssessment = async () => {
    setShowInstructions(false);
    setIsStarted(true);
    const startTime = assessment.time_limit_minutes * 60;
    setTimeRemaining(startTime);
    timeRemainingRef.current = startTime;
    
    // Clear any previous answers when starting (especially for retakes)
    setAnswers({});
    
    // Reset retake flag since we're now starting fresh
    setIsRetakeAttempt(false);
    
    // Activate proctoring features
    activateProctoringFeatures();
  };

  // Cleanup function to remove all proctoring event listeners
  const cleanupProctoringFeatures = () => {
    // Remove all stored event listeners
    if (window.proctorEventListeners) {
      const listeners = window.proctorEventListeners;
      
      // Remove specific event listeners
      if (listeners.rightClick) {
        document.removeEventListener('contextmenu', listeners.rightClick);
      }
      if (listeners.copy) {
        document.removeEventListener('copy', listeners.copy);
      }
      if (listeners.paste) {
        document.removeEventListener('paste', listeners.paste);
      }
      if (listeners.cut) {
        document.removeEventListener('cut', listeners.cut);
      }
      if (listeners.contextMenu) {
        document.removeEventListener('contextmenu', listeners.contextMenu);
      }
      if (listeners.keyboardShortcuts) {
        document.removeEventListener('keydown', listeners.keyboardShortcuts);
      }
      if (listeners.f12) {
        document.removeEventListener('keydown', listeners.f12);
      }
      if (listeners.inspect) {
        document.removeEventListener('keydown', listeners.inspect);
      }
      if (listeners.tabSwitch) {
        document.removeEventListener('visibilitychange', listeners.tabSwitch);
      }
      if (listeners.windowFocus) {
        window.removeEventListener('focus', listeners.windowFocus);
        document.removeEventListener('focusin', listeners.windowFocus);
      }
      if (listeners.windowBlur) {
        window.removeEventListener('blur', listeners.windowBlur);
        document.removeEventListener('focusout', listeners.windowBlur);
      }
      
      window.proctorEventListeners = null;
    }
    
    // Clear devtools detection interval
    if (window.devtoolsInterval) {
      clearInterval(window.devtoolsInterval);
      window.devtoolsInterval = null;
    }
    
    // Clear fullscreen monitoring
    if (window.fullscreenChangeListener) {
      document.removeEventListener('fullscreenchange', window.fullscreenChangeListener);
      window.fullscreenChangeListener = null;
    }
    
    // Exit fullscreen if still active
    if (document.fullscreenElement) {
      document.exitFullscreen();
    }
    
    // Close fullscreen dialog
    setShowFullscreenDialog(false);
    
    // Reset devtools state
    window.devtoolsOpen = false;
  };

  const activateProctoringFeatures = () => {
    if (assessment.proctoring_settings) {
      // Request fullscreen if required
      if (assessment.proctoring_settings.fullscreen_requirement) {
        requestFullscreen();
      }
      
      // Create named functions for event handlers so we can remove them later
      const handleRightClick = (e) => e.preventDefault();
      const handleCopy = (e) => e.preventDefault();
      const handlePaste = (e) => e.preventDefault();
      const handleCut = (e) => e.preventDefault();
      const handleContextMenu = (e) => {
        e.preventDefault();
        toast({
          variant: "destructive",
          title: "Right-Click Blocked",
          description: "Right-click is disabled during this assessment.",
        });
      };
      
      const handleKeyboardShortcuts = (e) => {
        const blockedKeys = ['F11', 'F5', 'F12'];
        const blockedCombos = ['Control+r', 'Control+Shift+r', 'Control+Shift+i', 'Control+u', 'Control+Shift+c', 'Control+Shift+j', 'Control+Shift+k', 'Control+Shift+e', 'Control+Shift+m'];
        
        const keyCombo = [
          e.ctrlKey && 'Control',
          e.shiftKey && 'Shift',
          e.altKey && 'Alt',
          e.key
        ].filter(Boolean).join('+');
        
        if (blockedKeys.includes(e.key) || blockedCombos.includes(keyCombo)) {
          e.preventDefault();
          e.stopPropagation();
          
          // Show warning toast
          toast({
            variant: "destructive",
            title: "Keyboard Shortcut Blocked",
            description: `The shortcut ${keyCombo} is not allowed during this assessment.`,
          });
          
          // Also show violation
          handleProctorViolation({
            type: 'keyboard_shortcut',
            message: `Keyboard shortcut ${keyCombo} was blocked`,
            severity: 'medium'
          });
        }
      };
      
      const handleF12 = (e) => {
        if (e.key === 'F12') {
          e.preventDefault();
          e.stopPropagation();
          toast({
            variant: "destructive",
            title: "Developer Tools Blocked",
            description: "Developer tools are not allowed during this assessment.",
          });
        }
      };
      
      const handleInspect = (e) => {
        if (e.ctrlKey && e.shiftKey && e.key === 'I') {
          e.preventDefault();
          e.stopPropagation();
          toast({
            variant: "destructive",
            title: "Inspect Element Blocked",
            description: "Inspect element is not allowed during this assessment.",
          });
        }
      };
      
      // Enhanced tab switching detection that works in fullscreen
      const handleTabSwitch = () => {
        if (document.hidden) {
          // Increment tab switch count
          setTabSwitchCount(prevCount => {
            const newCount = prevCount + 1;
            
            // Check if max tab switches exceeded
            if (maxTabSwitches > 0 && newCount > maxTabSwitches) {
              // Auto-submit after a short delay
              setTimeout(() => {
                if (!isSubmitted) {
                  handleSubmitAssessment();
                }
              }, 2000);
              
              return newCount;
            }
            
            // Show warning for tab switching
            handleProctorViolation({
              type: 'tab_switch',
              message: `Tab switching detected. Please return to the assessment. (${newCount}/${maxTabSwitches || 'unlimited'})`,
              severity: maxTabSwitches > 0 && newCount >= maxTabSwitches ? 'high' : 'medium'
            });
            
            return newCount;
          });
          
          // Show toasts outside of state update to avoid render phase issues
          const currentCount = tabSwitchCount + 1;
          if (maxTabSwitches > 0 && currentCount > maxTabSwitches) {
            toast({
              variant: "destructive",
              title: "Maximum Tab Switches Exceeded",
              description: "Your assessment will be automatically submitted due to excessive tab switching.",
            });
          } else {
            toast({
              variant: maxTabSwitches > 0 && currentCount >= maxTabSwitches ? "destructive" : "default",
              title: "Tab Switching Detected",
              description: maxTabSwitches > 0 
                ? `Tab switch ${currentCount}/${maxTabSwitches}. ${currentCount >= maxTabSwitches ? 'Assessment will auto-submit!' : 'Please return to the assessment.'}`
                : "Please return to the assessment tab immediately.",
            });
          }
        }
      };
      
      // Enhanced window focus detection
      const handleWindowFocus = () => {
        if (!document.hasFocus()) {
          handleProctorViolation({
            type: 'window_focus',
            message: 'Window focus lost. Please return to the assessment.',
            severity: 'medium'
          });
        }
      };
      
      // Enhanced blur detection
      const handleWindowBlur = () => {
        handleProctorViolation({
          type: 'window_blur',
          message: 'Window focus lost. Please return to the assessment.',
          severity: 'medium'
        });
      };
      
      // Store references to event listeners for cleanup
      window.proctorEventListeners = {
        rightClick: handleRightClick,
        copy: handleCopy,
        paste: handlePaste,
        cut: handleCut,
        contextMenu: handleContextMenu,
        keyboardShortcuts: handleKeyboardShortcuts,
        f12: handleF12,
        inspect: handleInspect,
        tabSwitch: handleTabSwitch,
        windowFocus: handleWindowFocus,
        windowBlur: handleWindowBlur
      };
      
      // Enable right-click blocking if required
      if (assessment.proctoring_settings.right_click_detection) {
        document.addEventListener('contextmenu', window.proctorEventListeners.rightClick);
      }
      
      // Enable copy-paste blocking if required
      if (assessment.proctoring_settings.copy_paste_detection) {
        document.addEventListener('copy', window.proctorEventListeners.copy);
        document.addEventListener('paste', window.proctorEventListeners.paste);
        document.addEventListener('cut', window.proctorEventListeners.cut);
      }
      
      // Enable keyboard shortcut blocking if required
      if (assessment.proctoring_settings.keyboard_shortcut_detection) {
        document.addEventListener('keydown', window.proctorEventListeners.keyboardShortcuts);
        document.addEventListener('contextmenu', window.proctorEventListeners.contextMenu);
        document.addEventListener('keydown', window.proctorEventListeners.f12);
        document.addEventListener('keydown', window.proctorEventListeners.inspect);
      }
      
      // Enhanced tab switching detection if required
      if (assessment.proctoring_settings.tab_switching_detection) {
        // Multiple detection methods for better coverage
        document.addEventListener('visibilitychange', window.proctorEventListeners.tabSwitch);
        window.addEventListener('focus', window.proctorEventListeners.windowFocus);
        window.addEventListener('blur', window.proctorEventListeners.windowBlur);
        document.addEventListener('focusin', window.proctorEventListeners.windowFocus);
        document.addEventListener('focusout', window.proctorEventListeners.windowBlur);
        
        // Additional detection for fullscreen mode
        if (assessment.proctoring_settings.fullscreen_requirement) {
          // Monitor fullscreen state changes
          document.addEventListener('fullscreenchange', () => {
            if (!document.fullscreenElement) {
              handleProctorViolation({
                type: 'fullscreen_exit',
                message: 'Fullscreen mode exited. Please return to fullscreen.',
                severity: 'high'
              });
              setShowFullscreenDialog(true);
            }
          });
        }
      }
      
      // Store devtools detection interval
      window.devtoolsInterval = setInterval(() => {
        const threshold = 160;
        const widthThreshold = window.outerWidth - window.innerWidth > threshold;
        const heightThreshold = window.outerHeight - window.innerHeight > threshold;
        
        if (widthThreshold || heightThreshold) {
          if (!window.devtoolsOpen) {
            window.devtoolsOpen = true;
            toast({
              variant: "destructive",
              title: "Developer Tools Detected",
              description: "Developer tools are not allowed during this assessment.",
            });
            handleProctorViolation({
              type: 'developer_tools',
              message: 'Developer tools detected',
              severity: 'high'
            });
          }
        } else {
          window.devtoolsOpen = false;
        }
      }, 500);
    }
  };

  const requestFullscreen = async () => {
    try {
      if (document.documentElement.requestFullscreen) {
        await document.documentElement.requestFullscreen();
        setIsFullscreen(true);
        
        // Monitor fullscreen state
        const handleFullscreenChange = () => {
          if (!document.fullscreenElement) {
            setIsFullscreen(false);
            setShowFullscreenDialog(true);
          }
        };
        
        window.fullscreenChangeListener = handleFullscreenChange;
        document.addEventListener('fullscreenchange', window.fullscreenChangeListener);
      }
    } catch (error) {
      // Handle fullscreen error silently
    }
  };

  const handleAnswerChange = (questionId, answer) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: answer
    }));
  };

  const handleNextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  };

  const handlePreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  const handleQuestionNavigation = (index) => {
    setCurrentQuestionIndex(index);
  };

  const handleSubmitAssessment = useCallback(async () => {
    try {
      // Calculate time taken using current timeRemaining value from ref
      const timeTaken = (assessment?.time_limit_minutes * 60) - timeRemainingRef.current;
      
      // The assessmentId from URL params is the assessment template ID
      const submitAssessmentId = assessmentId;
      
      await apiService.submitAssessment(submitAssessmentId, {
        student_id: user.id,
        answers,
        time_taken: timeTaken
      });
      
      setIsSubmitted(true);
      setShowSubmitDialog(false);
      
      // Cleanup proctoring features when assessment is submitted
      cleanupProctoringFeatures();
      
      toast({
        title: "Assessment Submitted",
        description: "Your assessment has been submitted successfully"
      });

      // Navigate to results page
      navigate(`/student/assessments/${assessmentId}/results`);
    } catch (error) {
      console.error('Assessment submission error:', error);
      toast({
        variant: "destructive",
        title: "Submission Failed",
        description: "Failed to submit assessment: " + (error.message || 'Unknown error')
      });
    }
  }, [assessmentId, user.id, answers, navigate, toast, assessment?.time_limit_minutes]);

  const formatTime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  const getTimeColor = () => {
    if (timeRemaining <= 300) return 'text-red-600'; // Last 5 minutes
    if (timeRemaining <= 600) return 'text-orange-600'; // Last 10 minutes
    return 'text-gray-600';
  };

  // Check if an assessment can be resumed
  const canResumeAssessment = (assessment) => {
    if (assessment.submission_status !== 'in_progress') {
      return false;
    }

    // Check if assessment has ended
    if (assessment.end_date_only && assessment.end_time_only) {
      const endDateTimeString = `${assessment.end_date_only}T${assessment.end_time_only}`;
      const endDateTime = new Date(endDateTimeString);
      const now = new Date();
      
      if (now > endDateTime) {
        return false; // Assessment has ended
      }
    }

    // Check if there's time remaining based on time limit
    if (assessment.started_at && assessment.time_limit_minutes) {
      const startTime = new Date(assessment.started_at);
      const now = new Date();
      const elapsedMinutes = Math.floor((now - startTime) / (1000 * 60));
      
      if (elapsedMinutes >= assessment.time_limit_minutes) {
        return false; // Time limit exceeded
      }
    }

    return true;
  };

  // Show proctor rules first if proctoring is required
  // Check if any proctoring features are enabled
  const hasProctoringFeatures = assessment?.proctoring_settings && (
    assessment.proctoring_settings.browser_lockdown ||
    assessment.proctoring_settings.tab_switching_detection ||
    assessment.proctoring_settings.copy_paste_detection ||
    assessment.proctoring_settings.right_click_detection ||
    assessment.proctoring_settings.fullscreen_requirement ||
    assessment.proctoring_settings.keyboard_shortcut_detection ||
    assessment.proctoring_settings.require_webcam ||
    assessment.proctoring_settings.require_microphone ||
    assessment.proctoring_settings.screen_sharing_detection
  );



  // Show proctor rules only if proctoring is actually required
  if (showProctorRules && assessment && (assessment.require_proctoring || hasProctoringFeatures)) {
  
    return (
      <ProctorRules
        assessment={assessment}
        onAccept={() => setShowProctorRules(false)}
      />
    );
  }

  // Show instructions if not started yet and assessment is loaded
  if (showInstructions && assessment && !isStarted && assessmentStatus === 'available') {
  
    return (
      <AssessmentInstructions
        assessment={assessment}
        attemptInfo={attemptInfo}
        onStart={handleStartAssessment}
        onPasswordRequired={() => setShowPasswordDialog(true)}
      />
    );
  }

  // Fallback: If no proctoring rules and no instructions shown, but assessment is loaded and not started
  if (assessment && !isStarted && assessmentStatus === 'available' && !showProctorRules && !showInstructions) {
  
    return (
      <AssessmentInstructions
        assessment={assessment}
        attemptInfo={attemptInfo}
        onStart={handleStartAssessment}
        onPasswordRequired={() => setShowPasswordDialog(true)}
      />
    );
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading assessment...</p>
        </div>
      </div>
    );
  }

  // Error states
  if (assessmentStatus === 'not_found') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md text-center">
          <CardContent className="pt-6">
            <AlertTriangle className="h-16 w-16 text-red-600 mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">Assessment Not Found</h2>
            <p className="text-gray-600 mb-4">The assessment could not be loaded. Please check the URL or contact support.</p>
            <Button onClick={() => {
              cleanupProctoringFeatures();
              navigate('/student/assessments');
            }}>
              Back to Assessments
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (assessmentStatus === 'expired') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md text-center">
          <CardContent className="pt-6">
            <Clock className="h-16 w-16 text-red-600 mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">Assessment Expired</h2>
            <p className="text-gray-600 mb-4">This assessment is no longer available. The time limit has passed.</p>
            <Button onClick={() => {
              cleanupProctoringFeatures();
              navigate('/student/assessments');
            }}>
              Back to Assessments
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (assessmentStatus === 'scheduled') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md text-center">
          <CardContent className="pt-6">
            <Timer className="h-16 w-16 text-orange-600 mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">Assessment Not Started</h2>
            <p className="text-gray-600 mb-4">This assessment has not started yet. Please wait for the scheduled time.</p>
          <Button onClick={() => {
            cleanupProctoringFeatures();
            navigate('/student/assessments');
          }}>
              Back to Assessments
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (assessmentStatus === 'max_attempts_reached') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md text-center">
          <CardContent className="pt-6">
            <XCircle className="h-16 w-16 text-red-600 mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">Maximum Attempts Reached</h2>
            <p className="text-gray-600 mb-4">
              You have reached the maximum number of attempts for this assessment. 
              {attemptInfo && ` (${attemptInfo.current_attempts}/${attemptInfo.max_attempts} attempts used)`}
            </p>
            <Button onClick={() => {
              cleanupProctoringFeatures();
              navigate('/student/assessments');
            }}>
              Back to Assessments
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (assessmentStatus === 'waiting_period') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md text-center">
          <CardContent className="pt-6">
            <Clock className="h-16 w-16 text-yellow-600 mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">Waiting Period</h2>
            <p className="text-gray-600 mb-4">
              You must wait before attempting this assessment again.
              {attemptInfo && attemptInfo.time_until_next_attempt > 0 && 
                ` Please try again in ${attemptInfo.time_until_next_attempt} hours.`
              }
            </p>
            <Button onClick={() => {
              cleanupProctoringFeatures();
              navigate('/student/assessments');
            }}>
              Back to Assessments
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Assessment completed
  if (isSubmitted || assessmentStatus === 'completed') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md text-center">
          <CardContent className="pt-6">
            <CheckCircle className="h-16 w-16 text-green-600 mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">Assessment Completed</h2>
            <p className="text-gray-600 mb-4">Your assessment has been submitted successfully.</p>
            <Button onClick={() => {
              cleanupProctoringFeatures();
              navigate(`/student/assessments/${assessmentId}/results`);
            }}>
              View Results
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Error state - no assessment or questions loaded
  if (!assessment || !questions.length) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md text-center">
          <CardContent className="pt-6">
            <AlertTriangle className="h-16 w-16 text-red-600 mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">Assessment Not Found</h2>
            <p className="text-gray-600 mb-4">The assessment could not be loaded. Please check the URL or contact support.</p>
            <div className="space-y-2">
              <Button onClick={() => {
                cleanupProctoringFeatures();
                navigate('/student/assessments');
              }}>
              Back to Assessments
            </Button>

            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];
  
  // Calculate progress considering coding questions completion status
  // For coding questions: only count as complete if ALL test cases pass
  // For other questions: count as complete if answered
  const completedQuestions = questions.reduce((count, question) => {
    const isAnswered = answers[question.id];
    if (!isAnswered) return count;
    
    if (question.question_type === 'coding') {
      // For coding questions, check if all test cases passed
      const isCodingComplete = isAnswered && 
        answers[question.id]?.testResults && 
        answers[question.id]?.testResults.length > 0 &&
        answers[question.id]?.testResults.every(result => 
          result.result?.verdict?.status === 'accepted'
        );
      return isCodingComplete ? count + 1 : count;
    } else {
      // For non-coding questions, just check if answered
      return count + 1;
    }
  }, 0);
  
  const progress = (completedQuestions / questions.length) * 100;
  const isCodingQuestion = currentQuestion?.question_type === 'coding';



  // Show assessment flow if needed
  if (showAssessmentFlow && assessment) {
    return (
      <AssessmentFlow
        assessment={assessment}
        onStart={handleAssessmentFlowComplete}
        onCancel={handleAssessmentFlowCancel}
        isResume={isResumed}
      />
    );
  }

  // Show termination screen if assessment was terminated
  if (assessmentTerminated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md text-center">
          <CardContent className="pt-6">
            <XCircle className="h-16 w-16 text-red-600 mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">Assessment Terminated</h2>
            <p className="text-gray-600 mb-4">
              Your assessment has been terminated due to proctor violations.
            </p>
            {proctorViolations.length > 0 && (
              <div className="text-left mb-4">
                <h3 className="font-medium mb-2">Violations:</h3>
                <ul className="text-sm text-gray-600 space-y-1">
                  {proctorViolations.slice(-3).map((violation, index) => (
                    <li key={index}>• {violation.message}</li>
                  ))}
                </ul>
              </div>
            )}
            <Button onClick={() => {
              cleanupProctoringFeatures();
              navigate('/student/assessments');
            }}>
              Back to Assessments
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Access Password Dialog */}
      <Dialog open={showPasswordDialog} onOpenChange={setShowPasswordDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <Lock className="h-5 w-5" />
              <span>Access Password Required</span>
            </DialogTitle>
            <DialogDescription>
              This assessment requires an access password to begin. Please enter the password provided by your instructor.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Access Password
              </label>
              <input
                id="password"
                type="text"
                value={passwordInput}
                onChange={(e) => {
                  setPasswordInput(e.target.value);
                  setPasswordError('');
                }}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    handlePasswordSubmit();
                  }
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter access password"
                autoFocus
              />
              {passwordError && (
                <p className="mt-1 text-sm text-red-600">{passwordError}</p>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowPasswordDialog(false);
                setPasswordInput('');
                setPasswordError('');
              }}
            >
              Cancel
            </Button>
            <Button onClick={handlePasswordSubmit}>
              Start Assessment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {/* Header - Maximized for screen usage */}
      <div className="bg-white border-b sticky top-0 z-50">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                {!isCodingQuestion && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowSidebar(!showSidebar)}
                    className="lg:hidden"
                  >
                    <List className="h-4 w-4" />
                  </Button>
                )}
                <h1 className="text-xl font-semibold">{assessment.title}</h1>
                {isResumed && (
                  <Badge className="bg-orange-100 text-orange-800 border-orange-200 ml-2">
                    <Play className="h-3 w-3 mr-1" />
                    Resumed
                  </Badge>
                )}
                {attemptInfo && (
                  <Badge variant="secondary" className="ml-2">
                    Attempt {attemptInfo.current_attempts + 1} of {attemptInfo.max_attempts || '∞'}
                  </Badge>
                )}
              </div>
              <Badge variant="outline">Question {currentQuestionIndex + 1} of {questions.length}</Badge>
            </div>
            
            <div className="flex items-center space-x-4">
              {/* Fullscreen Warning */}
              {showFullscreenDialog && (
                <div className="flex items-center space-x-2 text-orange-600 bg-orange-50 px-3 py-1 rounded-md">
                  <Maximize className="h-4 w-4" />
                  <span className="text-sm font-medium">Fullscreen Required</span>
                </div>
              )}
              
              {/* Timer */}
              <div className={`flex items-center space-x-2 ${getTimeColor()}`}>
                <Clock className="h-5 w-5" />
                <span className="font-mono text-lg font-semibold">
                  {formatTime(timeRemaining)}
                </span>
              </div>

              {/* Progress */}
              <div className="flex items-center space-x-2">
                <Progress value={progress} className="w-24" />
                <span className="text-sm text-gray-600">
                  {completedQuestions}/{questions.length}
                </span>
              </div>

              {/* Tab Switch Counter - Only show if max tab switches is set */}
              {maxTabSwitches > 0 && (
                <div className="flex items-center space-x-2">
                  <Badge variant={tabSwitchCount >= maxTabSwitches ? "destructive" : "outline"}>
                    Tab Switches: {tabSwitchCount}/{maxTabSwitches}
                  </Badge>
                </div>
              )}

              {/* Save Status */}
              {isSaving ? (
                <div className="flex items-center space-x-2 text-orange-600">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-orange-600"></div>
                  <span className="text-sm">Saving...</span>
                </div>
              ) : lastSaved ? (
                <div className="flex items-center space-x-2 text-green-600">
                  <CheckCircle className="h-4 w-4" />
                  <span className="text-sm">Saved</span>
                </div>
              ) : null}

              {/* Action Buttons */}
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={saveProgress}
                  disabled={isSaving}
                >
                  <Save className="h-4 w-4 mr-2" />
                  Save
                </Button>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowSubmitDialog(true)}
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Submit
                </Button>
                

                

              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content - Full Screen layout */}
      <div className="w-full h-full">
        {/* Mobile Sidebar Overlay */}
        {!isCodingQuestion && showSidebar && (
          <div className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-40" onClick={() => setShowSidebar(false)} />
        )}
        
        <div className={`${isCodingQuestion ? 'w-full h-full' : 'grid gap-6 grid-cols-1 lg:grid-cols-5'}`}>
          {/* Question Navigation Sidebar - Hidden for coding questions */}
          {!isCodingQuestion && (
            <div className={`lg:col-span-1 ${showSidebar ? 'block' : 'hidden lg:block'} lg:relative ${showSidebar ? 'fixed lg:static inset-y-0 left-0 z-50 w-80 lg:w-auto bg-white lg:bg-transparent border-r lg:border-r-0' : ''}`}>
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg flex items-center space-x-2">
                    <List className="h-5 w-5" />
                    <span>Questions</span>
                  </CardTitle>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowSidebar(false)}
                    className="lg:hidden"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {/* Improved question grid layout */}
                <div className="grid grid-cols-4 gap-2">
                  {questions.map((question, index) => {
                    const isAnswered = answers[question.id];
                    const isCurrent = index === currentQuestionIndex;
                    
                    // For coding questions, check if all test cases passed
                    const isCodingQuestion = question.question_type === 'coding';
                    const isCodingComplete = isCodingQuestion && isAnswered && 
                      answers[question.id]?.testResults && 
                      answers[question.id]?.testResults.length > 0 &&
                      answers[question.id]?.testResults.every(result => 
                        result.result?.verdict?.status === 'accepted'
                      );
                    
                    // For non-coding questions, just check if answered
                    // For coding questions, only show complete if all test cases passed
                    // This ensures students must pass all test cases to mark coding questions as complete
                    const isQuestionComplete = isCodingQuestion ? isCodingComplete : isAnswered;
                    
                    return (
                      <Button
                        key={index}
                        variant={isCurrent ? "default" : "outline"}
                        size="sm"
                        onClick={() => handleQuestionNavigation(index)}
                        className={`h-12 w-12 p-0 relative ${
                          isQuestionComplete ? 'bg-green-100 border-green-300' : ''
                        }`}
                      >
                        <span className="text-sm font-medium">{index + 1}</span>
                        {isQuestionComplete && (
                          <CheckCircle className="absolute -top-1 -right-1 h-3 w-3 text-green-600" />
                        )}
                      </Button>
                    );
                  })}
                </div>
                
                {/* Progress summary */}
                <div className="mt-4 pt-4 border-t">
                  <div className="text-sm text-gray-600 mb-2">Progress Summary:</div>
                  <div className="space-y-1 text-xs">
                    <div className="flex justify-between">
                      <span>Completed:</span>
                      <span className="font-medium text-green-600">{completedQuestions}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Remaining:</span>
                      <span className="font-medium text-orange-600">{questions.length - completedQuestions}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Progress:</span>
                      <span className="font-medium">{Math.round(progress)}%</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Enhanced Proctor Monitoring - Show if any proctoring features are enabled */}
            {isStarted && assessment.proctoring_settings && hasProctoringFeatures && (
              <Card className="mt-4">
                <CardHeader>
                  <CardTitle className="text-lg">Proctor Monitoring</CardTitle>
                </CardHeader>
                <CardContent>
                  <EnhancedProctorMonitoring
                    settings={assessment.proctoring_settings}
                    onViolation={handleProctorViolation}
                    onStatusChange={setProctorStatus}
                    onTerminate={handleAssessmentTermination}
                    isFullscreen={isFullscreen}
                    timeRemaining={timeRemaining}
                  />
                </CardContent>
              </Card>
            )}
            </div>
          )}

          {/* Question Content - Maximized for screen usage */}
          <div className={`${isCodingQuestion ? 'w-full h-full' : 'lg:col-span-4'} ${!showSidebar ? 'lg:col-span-full' : ''}`}>
            {currentQuestion && (
              <div className="h-full">
                {isCodingQuestion ? (
                  <CodingQuestionRenderer
                    question={currentQuestion}
                    answer={answers[currentQuestion.id]}
                    onAnswerChange={(answer) => handleAnswerChange(currentQuestion.id, answer)}
                    isReadOnly={isSubmitted}
                    showCorrectAnswer={false}
                    questions={questions}
                    currentQuestionIndex={currentQuestionIndex}
                    onQuestionChange={handleQuestionNavigation}
                    onSave={saveProgress}
                    lastSaved={lastSaved}
                    isSaving={isSaving}
                    clearStoredData={isRetakeAttempt}
                  />
                ) : (
                  <QuestionRenderer
                    question={currentQuestion}
                    answer={answers[currentQuestion.id]}
                    onAnswerChange={(answer) => handleAnswerChange(currentQuestion.id, answer)}
                    isReadOnly={isSubmitted}
                    showCorrectAnswer={false}
                  />
                )}
              </div>
            )}

            {/* Navigation Buttons - Only show for non-coding questions */}
            {!isCodingQuestion && (
              <div className="flex justify-between mt-6">
                <Button
                  variant="outline"
                  onClick={handlePreviousQuestion}
                  disabled={currentQuestionIndex === 0}
                >
                  <ChevronLeft className="h-4 w-4 mr-2" />
                  Previous
                </Button>

                <Button
                  onClick={handleNextQuestion}
                  disabled={currentQuestionIndex === questions.length - 1}
                >
                  Next
                  <ChevronRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Submit Dialog */}
      <Dialog open={showSubmitDialog} onOpenChange={setShowSubmitDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Submit Assessment</DialogTitle>
            <DialogDescription>
              Are you sure you want to submit your assessment? You cannot change your answers after submission.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="text-sm">
              <div className="flex justify-between">
                <span>Questions Completed:</span>
                <span>{completedQuestions}/{questions.length}</span>
              </div>
              <div className="flex justify-between">
                <span>Time Remaining:</span>
                <span>{formatTime(timeRemaining)}</span>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSubmitDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmitAssessment}>
              Submit Assessment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Fullscreen Dialog */}
      <Dialog open={showFullscreenDialog} onOpenChange={() => {}}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <Maximize className="h-5 w-5 text-orange-600" />
              <span>Fullscreen Mode Required</span>
            </DialogTitle>
            <DialogDescription>
              This assessment requires fullscreen mode to ensure academic integrity. Please return to fullscreen mode to continue.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                You have exited fullscreen mode. The assessment cannot continue until you return to fullscreen mode.
              </AlertDescription>
            </Alert>
          </div>
          <DialogFooter>
            <Button 
              onClick={async () => {
                try {
                  await requestFullscreen();
                  setShowFullscreenDialog(false);
                } catch (error) {
                  toast({
                    variant: "destructive",
                    title: "Fullscreen Failed",
                    description: "Please manually enter fullscreen mode (F11) to continue the assessment."
                  });
                }
              }}
              className="w-full"
            >
              <Maximize className="h-4 w-4 mr-2" />
              Return to Fullscreen Mode
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default StudentAssessmentTakingPage; 