import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { 
  Camera, 
  Mic, 
  Monitor, 
  AlertTriangle, 
  CheckCircle, 
  XCircle,
  WifiOff,
  VolumeX,
  Maximize,
  Lock,
  Copy,
  MousePointer,
  Keyboard,
  Eye,
  Users,
  Clock
} from 'lucide-react';

const EnhancedProctorMonitoring = ({ 
  settings, 
  onViolation, 
  onStatusChange,
  onTerminate,
  isFullscreen = false,
  timeRemaining = 0
}) => {
  const [permissions, setPermissions] = useState({
    camera: false,
    microphone: false,
    screen: false
  });
  const [warnings, setWarnings] = useState([]);
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [eyeTrackingStatus, setEyeTrackingStatus] = useState('inactive');
  const [faceDetected, setFaceDetected] = useState(false);
  const [multipleFaces, setMultipleFaces] = useState(false);
  const [eyeAlignment, setEyeAlignment] = useState(true);
  const [violationCount, setViolationCount] = useState(0);
  const [lastViolationTime, setLastViolationTime] = useState(null);

  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const screenStreamRef = useRef(null);
  const warningTimeoutRef = useRef(null);
  const eyeTrackingIntervalRef = useRef(null);
  const faceDetectionIntervalRef = useRef(null);

  // Eye tracking detection (simplified implementation)
  const detectEyeAlignment = useCallback(() => {
    if (!settings?.eye_tracking_detection || !videoRef.current) return;

    // This is a simplified implementation
    // In a real application, you would use computer vision libraries
    // like MediaPipe, OpenCV, or specialized eye tracking APIs
    
    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.drawImage(video, 0, 0);
    
    // Simplified eye tracking logic
    // In reality, you would analyze the video frame for eye position
    const isAligned = Math.random() > 0.1; // Simulate 90% alignment
    
    if (!isAligned && eyeAlignment) {
      setEyeAlignment(false);
      addViolation('eye_tracking', 'Eyes not properly aligned with camera');
    } else if (isAligned && !eyeAlignment) {
      setEyeAlignment(true);
    }
  }, [settings?.eye_tracking_detection, eyeAlignment]);

  // Face detection (simplified implementation)
  const detectFaces = useCallback(() => {
    if (!settings?.require_webcam || !videoRef.current) return;

    // This is a simplified implementation
    // In a real application, you would use face detection APIs
    // like MediaPipe Face Detection, OpenCV, or cloud services
    
    const hasFace = Math.random() > 0.05; // Simulate 95% face detection
    const hasMultipleFaces = Math.random() > 0.9; // Simulate 10% multiple faces
    
    if (!hasFace && faceDetected) {
      setFaceDetected(false);
      addViolation('face_detection', 'Face not detected in camera');
    } else if (hasFace && !faceDetected) {
      setFaceDetected(true);
    }

    if (hasMultipleFaces && !multipleFaces) {
      setMultipleFaces(true);
      addViolation('multiple_faces', 'Multiple people detected in camera');
    } else if (!hasMultipleFaces && multipleFaces) {
      setMultipleFaces(false);
    }
  }, [settings?.require_webcam, faceDetected, multipleFaces]);

  // Add violation and handle termination
  const addViolation = useCallback((type, message) => {
    const violation = {
      id: Date.now(),
      type,
      message,
      timestamp: new Date(),
      severity: getViolationSeverity(type)
    };

    setWarnings(prev => [...prev, violation]);
    setViolationCount(prev => prev + 1);
    setLastViolationTime(new Date());

    onViolation?.(violation);

    // Check for termination conditions
    if (shouldTerminate(violation)) {
      onTerminate?.(violation);
    }
  }, [onViolation, onTerminate]);

  // Determine if assessment should be terminated
  const shouldTerminate = useCallback((violation) => {
    // Immediate termination conditions
    if (violation.type === 'multiple_faces') return true;
    if (violation.type === 'tab_switching' && settings?.tab_switching_detection) return true;
    if (violation.type === 'browser_lockdown' && settings?.browser_lockdown) return true;

    // Multiple violations in short time
    if (violationCount >= 3 && lastViolationTime) {
      const timeSinceLastViolation = Date.now() - lastViolationTime.getTime();
      if (timeSinceLastViolation < 30000) { // 30 seconds
        return true;
      }
    }

    // Persistent eye tracking violations
    if (violation.type === 'eye_tracking' && violationCount >= 5) return true;

    return false;
  }, [violationCount, lastViolationTime, settings]);

  // Get violation severity
  const getViolationSeverity = (type) => {
    const highSeverity = ['multiple_faces', 'tab_switching', 'browser_lockdown'];
    const mediumSeverity = ['eye_tracking', 'face_detection'];
    const lowSeverity = ['copy_paste', 'right_click'];

    if (highSeverity.includes(type)) return 'high';
    if (mediumSeverity.includes(type)) return 'medium';
    if (lowSeverity.includes(type)) return 'low';
    return 'low';
  };

  // Request permissions
  const requestPermissions = useCallback(async () => {
    const newPermissions = { ...permissions };
    const newWarnings = [];

    try {
      // Request camera permission
      if (settings?.require_webcam) {
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
          newWarnings.push({
            type: 'camera',
            message: 'Camera access denied. Please enable camera access to continue.',
            severity: 'high'
          });
        }
      }

      // Request microphone permission
      if (settings?.require_microphone) {
        try {
          const audioStream = await navigator.mediaDevices.getUserMedia({ audio: true });
          newPermissions.microphone = true;
          
          if (streamRef.current) {
            const tracks = [...streamRef.current.getTracks(), ...audioStream.getTracks()];
            streamRef.current = new MediaStream(tracks);
          } else {
            streamRef.current = audioStream;
          }
        } catch (error) {
          newWarnings.push({
            type: 'microphone',
            message: 'Microphone access denied. Please enable microphone access to continue.',
            severity: 'high'
          });
        }
      }

      // Request screen sharing permission
      if (settings?.screen_sharing_detection) {
        try {
          const screenStream = await navigator.mediaDevices.getDisplayMedia({ 
            video: true,
            audio: true 
          });
          newPermissions.screen = true;
          screenStreamRef.current = screenStream;
        } catch (error) {
          newWarnings.push({
            type: 'screen',
            message: 'Screen sharing denied. Please enable screen sharing to continue.',
            severity: 'high'
          });
        }
      }

      setPermissions(newPermissions);
      setWarnings(newWarnings);

      // Start monitoring if all required permissions are granted
      if (Object.values(newPermissions).every(p => p)) {
        startMonitoring();
      }

    } catch (error) {
      console.error('Error requesting permissions:', error);
      newWarnings.push({
        type: 'general',
        message: 'Failed to initialize proctor monitoring.',
        severity: 'high'
      });
      setWarnings(newWarnings);
    }
  }, [settings, permissions]);

  // Start monitoring
  const startMonitoring = useCallback(() => {
    if (!isMonitoring) {
      setIsMonitoring(true);
      onStatusChange?.('monitoring_started');

      // Start eye tracking monitoring
      if (settings?.eye_tracking_detection) {
        setEyeTrackingStatus('active');
        eyeTrackingIntervalRef.current = setInterval(detectEyeAlignment, 1000);
      }

      // Start face detection monitoring
      if (settings?.require_webcam) {
        faceDetectionIntervalRef.current = setInterval(detectFaces, 2000);
      }

      // Monitor for tab switching
      if (settings?.tab_switching_detection) {
        let lastFocusTime = Date.now();
        
        const handleVisibilityChange = () => {
          if (document.hidden) {
            const timeHidden = Date.now() - lastFocusTime;
            if (timeHidden > 1000) { // More than 1 second
              addViolation('tab_switching', 'Tab switching detected');
            }
          } else {
            lastFocusTime = Date.now();
          }
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);
        
        // Cleanup function
        return () => {
          document.removeEventListener('visibilitychange', handleVisibilityChange);
        };
      }

      // Monitor for copy/paste
      if (settings?.copy_paste_detection) {
        const handleKeyDown = (e) => {
          if ((e.ctrlKey || e.metaKey) && (e.key === 'c' || e.key === 'v' || e.key === 'x')) {
            addViolation('copy_paste', 'Copy/paste attempt detected');
          }
        };

        document.addEventListener('keydown', handleKeyDown);
        
        // Cleanup function
        return () => {
          document.removeEventListener('keydown', handleKeyDown);
        };
      }

      // Monitor for right-click
      if (settings?.right_click_detection) {
        const handleContextMenu = (e) => {
          e.preventDefault();
          addViolation('right_click', 'Right-click attempt detected');
        };

        document.addEventListener('contextmenu', handleContextMenu);
        
        // Cleanup function
        return () => {
          document.removeEventListener('contextmenu', handleContextMenu);
        };
      }
    }
  }, [settings, isMonitoring, onStatusChange, detectEyeAlignment, detectFaces, addViolation]);

  // Stop monitoring
  const stopMonitoring = useCallback(() => {
    if (isMonitoring) {
      setIsMonitoring(false);
      setEyeTrackingStatus('inactive');
      
      // Clear intervals
      if (eyeTrackingIntervalRef.current) {
        clearInterval(eyeTrackingIntervalRef.current);
        eyeTrackingIntervalRef.current = null;
      }
      
      if (faceDetectionIntervalRef.current) {
        clearInterval(faceDetectionIntervalRef.current);
        faceDetectionIntervalRef.current = null;
      }

      // Stop streams
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
      
      if (screenStreamRef.current) {
        screenStreamRef.current.getTracks().forEach(track => track.stop());
        screenStreamRef.current = null;
      }

      onStatusChange?.('monitoring_stopped');
    }
  }, [isMonitoring, onStatusChange]);

  // Initialize monitoring
  useEffect(() => {
    requestPermissions();
    
    return () => {
      stopMonitoring();
    };
  }, [requestPermissions, stopMonitoring]);

  // Auto-cleanup on unmount
  useEffect(() => {
    return () => {
      stopMonitoring();
    };
  }, [stopMonitoring]);

  // Format time remaining
  const formatTime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="space-y-4">
      {/* Status Header */}
      <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
        <div className="flex items-center space-x-4">
          <Badge variant={isMonitoring ? "default" : "secondary"}>
            {isMonitoring ? "Monitoring Active" : "Monitoring Inactive"}
          </Badge>
          
          {timeRemaining > 0 && (
            <div className="flex items-center space-x-2">
              <Clock className="h-4 w-4 text-gray-600" />
              <span className="font-mono text-sm">{formatTime(timeRemaining)}</span>
            </div>
          )}
        </div>

        <div className="flex items-center space-x-2">
          {permissions.camera && (
            <div className={`flex items-center space-x-1 ${faceDetected ? 'text-green-600' : 'text-red-600'}`}>
              <Camera className="h-4 w-4" />
              <span className="text-xs">{faceDetected ? 'Face Detected' : 'No Face'}</span>
            </div>
          )}
          
          {settings?.eye_tracking_detection && (
            <div className={`flex items-center space-x-1 ${eyeAlignment ? 'text-green-600' : 'text-red-600'}`}>
              <Eye className="h-4 w-4" />
              <span className="text-xs">{eyeAlignment ? 'Eyes Aligned' : 'Eyes Misaligned'}</span>
            </div>
          )}
        </div>
      </div>

      {/* Camera Feed */}
      {permissions.camera && (
        <div className="relative">
          <video
            ref={videoRef}
            autoPlay
            muted
            className="w-full h-64 object-cover rounded-lg border"
          />
          
          {/* Overlay indicators */}
          <div className="absolute top-2 left-2 flex space-x-2">
            {faceDetected && (
              <Badge className="bg-green-100 text-green-800">
                <CheckCircle className="h-3 w-3 mr-1" />
                Face Detected
              </Badge>
            )}
            
            {multipleFaces && (
              <Badge className="bg-red-100 text-red-800">
                <Users className="h-3 w-3 mr-1" />
                Multiple People
              </Badge>
            )}
            
            {settings?.eye_tracking_detection && (
              <Badge className={eyeAlignment ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}>
                <Eye className="h-3 w-3 mr-1" />
                {eyeAlignment ? 'Eyes Aligned' : 'Eyes Misaligned'}
              </Badge>
            )}
          </div>
        </div>
      )}

      {/* Warnings */}
      {warnings.length > 0 && (
        <div className="space-y-2">
          <h4 className="font-medium text-sm text-gray-700">Recent Violations:</h4>
          {warnings.slice(-3).map((warning) => (
            <Alert key={warning.id} variant={warning.severity === 'high' ? 'destructive' : 'default'}>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <div className="flex items-center justify-between">
                  <span>{warning.message}</span>
                  <span className="text-xs text-gray-500">
                    {warning.timestamp.toLocaleTimeString()}
                  </span>
                </div>
              </AlertDescription>
            </Alert>
          ))}
        </div>
      )}

      {/* Violation Count */}
      {violationCount > 0 && (
        <div className="text-center">
          <Badge variant="outline" className="text-orange-600 border-orange-200">
            <AlertTriangle className="h-3 w-3 mr-1" />
            {violationCount} violation{violationCount !== 1 ? 's' : ''} detected
          </Badge>
        </div>
      )}
    </div>
  );
};

export default EnhancedProctorMonitoring;

