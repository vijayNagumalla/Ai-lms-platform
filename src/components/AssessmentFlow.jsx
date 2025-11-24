import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { 
  Camera, 
  Mic, 
  Monitor, 
  Eye, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  Play,
  ArrowRight,
  ArrowLeft,
  Shield,
  Clock,
  Users,
  Lock,
  VolumeX,
  Maximize,
  MousePointer,
  Keyboard,
  Copy,
  WifiOff
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const AssessmentFlow = ({ 
  assessment, 
  onStart, 
  onCancel,
  isResume = false 
}) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [permissions, setPermissions] = useState({
    camera: false,
    microphone: false,
    screen: false
  });
  const [permissionErrors, setPermissionErrors] = useState({});
  const [eyeTrackingStatus, setEyeTrackingStatus] = useState('not_started');
  const [eyeCalibration, setEyeCalibration] = useState(false);
  const [proctorRulesAccepted, setProctorRulesAccepted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const eyeTrackingRef = useRef(null);

  const steps = [
    { id: 'description', title: 'Assessment Description', icon: <Monitor className="h-5 w-5" /> },
    { id: 'permissions', title: 'Device Permissions', icon: <Camera className="h-5 w-5" /> },
    { id: 'eye_tracking', title: 'Eye Tracking Setup', icon: <Eye className="h-5 w-5" /> },
    { id: 'proctor_rules', title: 'Proctor Rules', icon: <Shield className="h-5 w-5" /> },
    { id: 'ready', title: 'Ready to Start', icon: <Play className="h-5 w-5" /> }
  ];

  // Check if eye tracking is required
  const requiresEyeTracking = assessment?.proctoring_settings?.eye_tracking_detection || false;

  // Filter steps based on requirements
  const activeSteps = steps.filter(step => {
    if (step.id === 'eye_tracking' && !requiresEyeTracking) return false;
    return true;
  });

  const progress = ((currentStep + 1) / activeSteps.length) * 100;

  // Request device permissions
  const requestPermissions = async () => {
    const newPermissions = { ...permissions };
    const newErrors = {};

    setIsLoading(true);
    setError(null);

    try {
      // Request camera permission
      if (assessment?.proctoring_settings?.require_webcam) {
        try {
          const videoStream = await navigator.mediaDevices.getUserMedia({ 
            video: { 
              width: { ideal: 1280 }, 
              height: { ideal: 720 },
              facingMode: 'user'
            } 
          });
          newPermissions.camera = true;
          streamRef.current = videoStream;
          
          if (videoRef.current) {
            videoRef.current.srcObject = videoStream;
          }
        } catch (error) {
          newErrors.camera = 'Camera access denied. Please enable camera access to continue.';
        }
      }

      // Request microphone permission
      if (assessment?.proctoring_settings?.require_microphone) {
        try {
          const audioStream = await navigator.mediaDevices.getUserMedia({ audio: true });
          newPermissions.microphone = true;
          
          // Merge with existing video stream if available
          if (streamRef.current) {
            const tracks = [...streamRef.current.getTracks(), ...audioStream.getTracks()];
            streamRef.current = new MediaStream(tracks);
          } else {
            streamRef.current = audioStream;
          }
        } catch (error) {
          newErrors.microphone = 'Microphone access denied. Please enable microphone access to continue.';
        }
      }

      // Request screen sharing permission
      if (assessment?.proctoring_settings?.screen_sharing_detection) {
        try {
          const screenStream = await navigator.mediaDevices.getDisplayMedia({ 
            video: true,
            audio: true 
          });
          newPermissions.screen = true;
        } catch (error) {
          newErrors.screen = 'Screen sharing denied. Please enable screen sharing to continue.';
        }
      }

      setPermissions(newPermissions);
      setPermissionErrors(newErrors);

      // Check if all required permissions are granted
      const allRequiredPermissionsGranted = checkAllPermissionsGranted(newPermissions);
      
      if (!allRequiredPermissionsGranted) {
        setError('Please grant all required permissions to continue.');
        return false;
      }

      return true;
    } catch (error) {
      setError('Failed to request permissions. Please try again.');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // Check if all required permissions are granted
  const checkAllPermissionsGranted = (perms) => {
    if (assessment?.proctoring_settings?.require_webcam && !perms.camera) return false;
    if (assessment?.proctoring_settings?.require_microphone && !perms.microphone) return false;
    if (assessment?.proctoring_settings?.screen_sharing_detection && !perms.screen) return false;
    return true;
  };

  // Eye tracking setup and calibration
  const setupEyeTracking = async () => {
    if (!requiresEyeTracking) return true;

    setEyeTrackingStatus('calibrating');
    setIsLoading(true);

    try {
      // Simulate eye tracking setup (replace with actual implementation)
      await new Promise(resolve => setTimeout(resolve, 1000)); // Reduced from 2000ms
      
      setEyeTrackingStatus('calibrated');
      setEyeCalibration(true);
      return true;
    } catch (error) {
      setEyeTrackingStatus('failed');
      setError('Eye tracking setup failed. Please ensure your camera is working properly.');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // Handle step navigation
  const nextStep = async () => {
    const currentStepData = activeSteps[currentStep];
    
    if (currentStepData.id === 'permissions') {
      const success = await requestPermissions();
      if (!success) return;
    } else if (currentStepData.id === 'eye_tracking') {
      const success = await setupEyeTracking();
      if (!success) return;
    }

    if (currentStep < activeSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleStart = () => {
    // Cleanup streams before starting
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }
    onStart();
  };

  // Render step content
  const renderStepContent = () => {
    const currentStepData = activeSteps[currentStep];

    switch (currentStepData.id) {
      case 'description':
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold mb-4">{assessment.title}</h2>
              <p className="text-gray-600 mb-6">{assessment.description}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center space-x-3 p-4 bg-blue-50 rounded-lg">
                <Clock className="h-6 w-6 text-blue-600" />
                <div>
                  <p className="font-medium">Time Limit</p>
                  <p className="text-sm text-gray-600">{assessment.time_limit_minutes} minutes</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3 p-4 bg-green-50 rounded-lg">
                <Users className="h-6 w-6 text-green-600" />
                <div>
                  <p className="font-medium">Questions</p>
                  <p className="text-sm text-gray-600">{assessment.total_questions || 'Multiple'} questions</p>
                </div>
              </div>
            </div>

            {isResume && (
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  You are resuming a previous attempt. Your progress has been saved.
                </AlertDescription>
              </Alert>
            )}
          </div>
        );

      case 'permissions':
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold mb-4">Device Permissions Required</h2>
              <p className="text-gray-600 mb-6">
                This assessment requires access to your device's camera and microphone for proctoring.
              </p>
            </div>

            <div className="space-y-4">
              {assessment?.proctoring_settings?.require_webcam && (
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    <Camera className="h-6 w-6 text-blue-600" />
                    <div>
                      <p className="font-medium">Camera Access</p>
                      <p className="text-sm text-gray-600">Required for face monitoring</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {permissions.camera ? (
                      <CheckCircle className="h-5 w-5 text-green-600" />
                    ) : (
                      <XCircle className="h-5 w-5 text-red-600" />
                    )}
                    {permissionErrors.camera && (
                      <span className="text-sm text-red-600">{permissionErrors.camera}</span>
                    )}
                  </div>
                </div>
              )}

              {assessment?.proctoring_settings?.require_microphone && (
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    <Mic className="h-6 w-6 text-blue-600" />
                    <div>
                      <p className="font-medium">Microphone Access</p>
                      <p className="text-sm text-gray-600">Required for audio monitoring</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {permissions.microphone ? (
                      <CheckCircle className="h-5 w-5 text-green-600" />
                    ) : (
                      <XCircle className="h-5 w-5 text-red-600" />
                    )}
                    {permissionErrors.microphone && (
                      <span className="text-sm text-red-600">{permissionErrors.microphone}</span>
                    )}
                  </div>
                </div>
              )}

              {assessment?.proctoring_settings?.screen_sharing_detection && (
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    <Monitor className="h-6 w-6 text-blue-600" />
                    <div>
                      <p className="font-medium">Screen Sharing</p>
                      <p className="text-sm text-gray-600">Required for screen monitoring</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {permissions.screen ? (
                      <CheckCircle className="h-5 w-5 text-green-600" />
                    ) : (
                      <XCircle className="h-5 w-5 text-red-600" />
                    )}
                    {permissionErrors.screen && (
                      <span className="text-sm text-red-600">{permissionErrors.screen}</span>
                    )}
                  </div>
                </div>
              )}
            </div>

            {Object.keys(permissionErrors).length > 0 && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  Please grant all required permissions to continue. You can change these settings in your browser.
                </AlertDescription>
              </Alert>
            )}

            <div className="text-center">
              <video
                ref={videoRef}
                autoPlay
                muted
                className="w-64 h-48 mx-auto rounded-lg border"
                style={{ display: permissions.camera ? 'block' : 'none' }}
              />
            </div>
          </div>
        );

      case 'eye_tracking':
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold mb-4">Eye Tracking Setup</h2>
              <p className="text-gray-600 mb-6">
                Please look directly at the camera and follow the instructions for eye tracking calibration.
              </p>
            </div>

            <div className="text-center">
              <div className="w-32 h-32 mx-auto mb-6 bg-blue-100 rounded-full flex items-center justify-center">
                <Eye className="h-16 w-16 text-blue-600" />
              </div>
              
              {eyeTrackingStatus === 'calibrating' && (
                <div className="space-y-4">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="text-gray-600">Calibrating eye tracking...</p>
                </div>
              )}

              {eyeTrackingStatus === 'calibrated' && (
                <div className="space-y-4">
                  <CheckCircle className="h-16 w-16 text-green-600 mx-auto" />
                  <p className="text-green-600 font-medium">Eye tracking calibrated successfully!</p>
                </div>
              )}

              {eyeTrackingStatus === 'failed' && (
                <div className="space-y-4">
                  <XCircle className="h-16 w-16 text-red-600 mx-auto" />
                  <p className="text-red-600 font-medium">Eye tracking calibration failed</p>
                </div>
              )}
            </div>

            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <strong>Important:</strong> During the exam, ensure your eyes remain visible to the camera. 
                Looking away for extended periods or having another person visible may result in exam termination.
              </AlertDescription>
            </Alert>
          </div>
        );

      case 'proctor_rules':
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold mb-4">Proctor Rules & Guidelines</h2>
              <p className="text-gray-600 mb-6">
                Please read and understand these rules before starting your assessment.
              </p>
            </div>

            <div className="space-y-4">
              {assessment?.proctoring_settings?.browser_lockdown && (
                <div className="flex items-start space-x-3 p-4 bg-red-50 rounded-lg">
                  <Lock className="h-5 w-5 text-red-600 mt-1" />
                  <div>
                    <p className="font-medium text-red-800">Browser Lockdown</p>
                    <p className="text-sm text-red-700">
                      Your browser will be locked to prevent switching tabs or opening other applications.
                    </p>
                  </div>
                </div>
              )}

              {assessment?.proctoring_settings?.tab_switching_detection && (
                <div className="flex items-start space-x-3 p-4 bg-yellow-50 rounded-lg">
                  <Monitor className="h-5 w-5 text-yellow-600 mt-1" />
                  <div>
                    <p className="font-medium text-yellow-800">Tab Switching Detection</p>
                    <p className="text-sm text-yellow-700">
                      Switching tabs or applications will be flagged as suspicious activity.
                    </p>
                  </div>
                </div>
              )}

              {assessment?.proctoring_settings?.copy_paste_detection && (
                <div className="flex items-start space-x-3 p-4 bg-orange-50 rounded-lg">
                  <Copy className="h-5 w-5 text-orange-600 mt-1" />
                  <div>
                    <p className="font-medium text-orange-800">Copy/Paste Detection</p>
                    <p className="text-sm text-orange-700">
                      Copy and paste functions are disabled during the assessment.
                    </p>
                  </div>
                </div>
              )}

              {assessment?.proctoring_settings?.fullscreen_requirement && (
                <div className="flex items-start space-x-3 p-4 bg-purple-50 rounded-lg">
                  <Maximize className="h-5 w-5 text-purple-600 mt-1" />
                  <div>
                    <p className="font-medium text-purple-800">Fullscreen Required</p>
                    <p className="text-sm text-purple-700">
                      You must remain in fullscreen mode throughout the assessment.
                    </p>
                  </div>
                </div>
              )}

              {requiresEyeTracking && (
                <div className="flex items-start space-x-3 p-4 bg-blue-50 rounded-lg">
                  <Eye className="h-5 w-5 text-blue-600 mt-1" />
                  <div>
                    <p className="font-medium text-blue-800">Eye Tracking Monitoring</p>
                    <p className="text-sm text-blue-700">
                      Your eye movements will be monitored. Looking away or having another person visible may result in termination.
                    </p>
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-start space-x-3 p-4 bg-gray-50 rounded-lg">
              <AlertTriangle className="h-5 w-5 text-gray-600 mt-1" />
              <div>
                <p className="font-medium text-gray-800">Important Reminders</p>
                <ul className="text-sm text-gray-700 mt-2 space-y-1">
                  <li>• Ensure you have a stable internet connection</li>
                  <li>• Find a quiet, well-lit environment</li>
                  <li>• Keep your face visible to the camera at all times</li>
                  <li>• Do not use any external devices or materials</li>
                  <li>• Violations may result in immediate exam termination</li>
                </ul>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="accept-rules"
                checked={proctorRulesAccepted}
                onChange={(e) => setProctorRulesAccepted(e.target.checked)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="accept-rules" className="text-sm text-gray-700">
                I have read and understood all the proctor rules and guidelines
              </label>
            </div>
          </div>
        );

      case 'ready':
        return (
          <div className="space-y-6 text-center">
            <div className="w-24 h-24 mx-auto bg-green-100 rounded-full flex items-center justify-center">
              <CheckCircle className="h-12 w-12 text-green-600" />
            </div>
            
            <div>
              <h2 className="text-2xl font-bold mb-4">Ready to Start!</h2>
              <p className="text-gray-600 mb-6">
                All requirements have been met. You can now begin your assessment.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-md mx-auto">
              <div className="p-4 bg-green-50 rounded-lg">
                <p className="font-medium text-green-800">Time Limit</p>
                <p className="text-2xl font-bold text-green-600">{assessment.time_limit_minutes}m</p>
              </div>
              <div className="p-4 bg-blue-50 rounded-lg">
                <p className="font-medium text-blue-800">Questions</p>
                <p className="text-2xl font-bold text-blue-600">{assessment.total_questions || 'Multiple'}</p>
              </div>
            </div>

            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Once you start, the timer will begin and cannot be paused. Make sure you're ready!
              </AlertDescription>
            </Alert>
          </div>
        );

      default:
        return null;
    }
  };

  const canProceed = () => {
    const currentStepData = activeSteps[currentStep];
    
    switch (currentStepData.id) {
      case 'permissions':
        return checkAllPermissionsGranted(permissions);
      case 'eye_tracking':
        return eyeTrackingStatus === 'calibrated';
      case 'proctor_rules':
        return proctorRulesAccepted;
      case 'ready':
        return true;
      default:
        return true;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-4xl">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-xl">
                {isResume ? 'Resume Assessment' : 'Start Assessment'}
              </CardTitle>
              <CardDescription>
                Step {currentStep + 1} of {activeSteps.length}: {activeSteps[currentStep]?.title}
              </CardDescription>
            </div>
            <Button variant="outline" onClick={onCancel}>
              Cancel
            </Button>
          </div>
          
          <Progress value={progress} className="w-full" />
          
          <div className="flex justify-between mt-4">
            {activeSteps.map((step, index) => (
              <div
                key={step.id}
                className={`flex items-center space-x-2 px-3 py-2 rounded-lg ${
                  index <= currentStep 
                    ? 'bg-blue-100 text-blue-800' 
                    : 'bg-gray-100 text-gray-500'
                }`}
              >
                {step.icon}
                <span className="text-sm font-medium">{step.title}</span>
              </div>
            ))}
          </div>
        </CardHeader>

        <CardContent>
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              {renderStepContent()}
            </motion.div>
          </AnimatePresence>

          {error && (
            <Alert variant="destructive" className="mt-6">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="flex justify-between mt-8">
            <Button
              variant="outline"
              onClick={prevStep}
              disabled={currentStep === 0}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Previous
            </Button>

            {currentStep === activeSteps.length - 1 ? (
              <Button
                onClick={handleStart}
                disabled={!canProceed() || isLoading}
                className="bg-green-600 hover:bg-green-700"
              >
                {isLoading ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                ) : (
                  <Play className="h-4 w-4 mr-2" />
                )}
                {isResume ? 'Resume Assessment' : 'Start Assessment'}
              </Button>
            ) : (
              <Button
                onClick={nextStep}
                disabled={!canProceed() || isLoading}
              >
                Next
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AssessmentFlow;

