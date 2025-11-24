import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
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
  ArrowRight,
  ArrowLeft,
  Shield,
  Lock,
  Maximize
} from 'lucide-react';
import { motion } from 'framer-motion';

const ProctoringSetupStep = ({ 
  assessment, 
  submission, 
  proctoringPermissions,
  setProctoringPermissions,
  onComplete, 
  onBack, 
  onCancel,
  theme = 'light',
  isDarkMode = false
}) => {
  const [permissions, setPermissions] = useState({
    camera: false,
    microphone: false,
    fullscreen: false
  });
  
  const [permissionErrors, setPermissionErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  
  const videoRef = useRef(null);
  const streamRef = useRef(null);

  const proctoringSettings = assessment.proctoring_settings || {};
  
  // Get only active proctoring features
  const getActiveFeatures = () => {
    const features = [];
    if (proctoringSettings.require_webcam) features.push({ name: 'Camera Monitoring', icon: Camera });
    if (proctoringSettings.require_microphone) features.push({ name: 'Microphone Monitoring', icon: Mic });
    if (proctoringSettings.fullscreen_requirement) features.push({ name: 'Fullscreen Mode', icon: Maximize });
    if (proctoringSettings.browser_lockdown) features.push({ name: 'Browser Lockdown', icon: Lock });
    if (proctoringSettings.tab_switching_detection) features.push({ name: 'Tab Switching Detection', icon: Monitor });
    return features;
  };

  const activeFeatures = getActiveFeatures();

  useEffect(() => {
    // Initialize permissions state based on proctoring settings
    const initialPermissions = {
      camera: false,
      microphone: false,
      fullscreen: false
    };
    setPermissions(initialPermissions);
  }, [proctoringSettings]);

  const requestCameraPermission = async () => {
    if (!proctoringSettings.require_webcam) return true;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: 'user'
        } 
      });
      
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      
      setPermissions(prev => ({ ...prev, camera: true }));
      setPermissionErrors(prev => ({ ...prev, camera: null }));
      return true;
    } catch (error) {
      console.error('Camera permission error:', error);
      setPermissionErrors(prev => ({ 
        ...prev, 
        camera: 'Camera access denied. Please enable camera access in your browser settings.' 
      }));
      return false;
    }
  };

  const requestMicrophonePermission = async () => {
    if (!proctoringSettings.require_microphone) return true;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: { 
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        } 
      });
      
      // Merge with existing video stream if available
      if (streamRef.current) {
        const tracks = [...streamRef.current.getTracks(), ...stream.getTracks()];
        streamRef.current = new MediaStream(tracks);
      } else {
        streamRef.current = stream;
      }
      
      setPermissions(prev => ({ ...prev, microphone: true }));
      setPermissionErrors(prev => ({ ...prev, microphone: null }));
      return true;
    } catch (error) {
      console.error('Microphone permission error:', error);
      setPermissionErrors(prev => ({ 
        ...prev, 
        microphone: 'Microphone access denied. Please enable microphone access in your browser settings.' 
      }));
      return false;
    }
  };

  const requestFullscreenPermission = async () => {
    if (!proctoringSettings.fullscreen_requirement) return true;

    try {
      if (document.documentElement.requestFullscreen) {
        await document.documentElement.requestFullscreen();
      } else if (document.documentElement.webkitRequestFullscreen) {
        await document.documentElement.webkitRequestFullscreen();
      } else if (document.documentElement.mozRequestFullScreen) {
        await document.documentElement.mozRequestFullScreen();
      } else if (document.documentElement.msRequestFullscreen) {
        await document.documentElement.msRequestFullscreen();
      }
      
      setPermissions(prev => ({ ...prev, fullscreen: true }));
      return true;
    } catch (error) {
      console.error('Fullscreen permission error:', error);
      setPermissionErrors(prev => ({ 
        ...prev, 
        fullscreen: 'Fullscreen access denied. Please allow fullscreen mode.' 
      }));
      return false;
    }
  };

  const setupBrowserLockdown = () => {
    if (!proctoringSettings.browser_lockdown) return true;
    // Browser lockdown will be handled when proctoring starts
    return true;
  };

  const handleContinue = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Request all required permissions
      const cameraSuccess = await requestCameraPermission();
      const micSuccess = await requestMicrophonePermission();
      const fullscreenSuccess = await requestFullscreenPermission();
      const lockdownSuccess = setupBrowserLockdown();

      const allPermissionsGranted = 
        (!proctoringSettings.require_webcam || cameraSuccess) &&
        (!proctoringSettings.require_microphone || micSuccess) &&
        (!proctoringSettings.fullscreen_requirement || fullscreenSuccess) &&
        lockdownSuccess;

      if (allPermissionsGranted) {
        setProctoringPermissions(permissions);
        onComplete();
      } else {
        setError('Please grant all required permissions to continue.');
      }
    } catch (error) {
      console.error('Setup error:', error);
      setError('An error occurred during setup. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const canProceed = () => {
    const cameraOk = !proctoringSettings.require_webcam || permissions.camera;
    const micOk = !proctoringSettings.require_microphone || permissions.microphone;
    const fullscreenOk = !proctoringSettings.fullscreen_requirement || permissions.fullscreen;
    return cameraOk && micOk && fullscreenOk && !isLoading;
  };

  return (
    <div className={`max-w-3xl mx-auto space-y-6 ${isDarkMode ? 'bg-gray-900 min-h-screen py-8' : ''}`}>
      <Card className={isDarkMode ? 'bg-gray-800 border-gray-700' : ''}>
        <CardHeader className={isDarkMode ? 'bg-gray-700' : ''}>
          <CardTitle className={`text-xl flex items-center ${isDarkMode ? 'text-gray-100' : ''}`}>
            <Shield className={`h-5 w-5 mr-2 ${isDarkMode ? 'text-gray-300' : ''}`} />
            Proctoring Setup
          </CardTitle>
          <p className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
            Grant required permissions to continue. Proctoring will only activate when you start answering questions.
          </p>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Active Features List */}
          {activeFeatures.length > 0 ? (
            <div className="space-y-3">
              <h3 className={`font-medium ${isDarkMode ? 'text-gray-100' : 'text-gray-900'}`}>Active Proctoring Features:</h3>
              <div className="grid grid-cols-1 gap-2">
                {activeFeatures.map((feature, index) => {
                  const Icon = feature.icon;
                  const isEnabled = 
                    (feature.name === 'Camera Monitoring' && permissions.camera) ||
                    (feature.name === 'Microphone Monitoring' && permissions.microphone) ||
                    (feature.name === 'Fullscreen Mode' && permissions.fullscreen) ||
                    (feature.name === 'Browser Lockdown' || feature.name === 'Tab Switching Detection');
                  
                  return (
                    <div 
                      key={index}
                      className={`flex items-center justify-between p-3 border rounded-lg ${isDarkMode ? 'bg-gray-700 border-gray-600' : ''}`}
                    >
                      <div className="flex items-center space-x-3">
                        <Icon className={`h-5 w-5 ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`} />
                        <span className={`text-sm font-medium ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>{feature.name}</span>
                      </div>
                      {isEnabled ? (
                        <CheckCircle className={`h-5 w-5 ${isDarkMode ? 'text-green-400' : 'text-green-600'}`} />
                      ) : (
                        <XCircle className={`h-5 w-5 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`} />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <Alert className={isDarkMode ? 'bg-gray-700 border-gray-600' : ''}>
              <AlertTriangle className={`h-4 w-4 ${isDarkMode ? 'text-gray-300' : ''}`} />
              <AlertDescription className={isDarkMode ? 'text-gray-300' : ''}>
                Basic proctoring is enabled. No additional permissions required.
              </AlertDescription>
            </Alert>
          )}

          {/* Permission Request Area */}
          {(proctoringSettings.require_webcam || proctoringSettings.require_microphone) && (
            <div className="space-y-4">
              {proctoringSettings.require_webcam && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className={`text-sm font-medium ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>Camera Access</label>
                    {permissions.camera ? (
                      <Badge variant="default" className="bg-green-600">Granted</Badge>
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={requestCameraPermission}
                        disabled={isLoading}
                        className={isDarkMode ? 'border-gray-600 text-gray-300 hover:bg-gray-700' : ''}
                      >
                        Request Camera
                      </Button>
                    )}
                  </div>
                  {permissionErrors.camera && (
                    <p className={`text-sm mt-1 ${isDarkMode ? 'text-red-400' : 'text-red-600'}`}>{permissionErrors.camera}</p>
                  )}
                  {permissions.camera && (
                    <video
                      ref={videoRef}
                      autoPlay
                      muted
                      className={`w-full h-48 rounded-lg border mt-2 ${isDarkMode ? 'border-gray-600' : ''}`}
                    />
                  )}
                </div>
              )}

              {proctoringSettings.require_microphone && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className={`text-sm font-medium ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>Microphone Access</label>
                    {permissions.microphone ? (
                      <Badge variant="default" className="bg-green-600">Granted</Badge>
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={requestMicrophonePermission}
                        disabled={isLoading}
                        className={isDarkMode ? 'border-gray-600 text-gray-300 hover:bg-gray-700' : ''}
                      >
                        Request Microphone
                      </Button>
                    )}
                  </div>
                  {permissionErrors.microphone && (
                    <p className={`text-sm mt-1 ${isDarkMode ? 'text-red-400' : 'text-red-600'}`}>{permissionErrors.microphone}</p>
                  )}
                </div>
              )}

              {proctoringSettings.fullscreen_requirement && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className={`text-sm font-medium ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>Fullscreen Mode</label>
                    {permissions.fullscreen ? (
                      <Badge variant="default" className="bg-green-600">Enabled</Badge>
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={requestFullscreenPermission}
                        disabled={isLoading}
                        className={isDarkMode ? 'border-gray-600 text-gray-300 hover:bg-gray-700' : ''}
                      >
                        Enable Fullscreen
                      </Button>
                    )}
                  </div>
                  {permissionErrors.fullscreen && (
                    <p className={`text-sm mt-1 ${isDarkMode ? 'text-red-400' : 'text-red-600'}`}>{permissionErrors.fullscreen}</p>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Error Display */}
          {error && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Info Alert */}
          <Alert className={isDarkMode ? 'bg-gray-700 border-gray-600' : ''}>
            <Shield className={`h-4 w-4 ${isDarkMode ? 'text-gray-300' : ''}`} />
            <AlertDescription className={isDarkMode ? 'text-gray-300' : ''}>
              Proctoring monitoring will only begin when you start answering questions, not during instructions or setup.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex justify-between">
        <Button 
          variant="outline" 
          onClick={onBack}
          className={isDarkMode ? 'border-gray-600 text-gray-300 hover:bg-gray-700' : ''}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
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
            onClick={handleContinue}
            disabled={!canProceed()}
            className="bg-blue-600 hover:bg-blue-700"
          >
            Continue
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ProctoringSetupStep;
