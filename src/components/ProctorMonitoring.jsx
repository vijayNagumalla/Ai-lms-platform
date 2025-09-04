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
  Keyboard
} from 'lucide-react';

const ProctorMonitoring = ({ 
  settings, 
  onViolation, 
  onStatusChange,
  isFullscreen = false 
}) => {
  const [permissions, setPermissions] = useState({
    camera: false,
    microphone: false,
    screen: false
  });
  const [warnings, setWarnings] = useState([]);
  const [isMonitoring, setIsMonitoring] = useState(false);

  
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const screenStreamRef = useRef(null);
  const warningTimeoutRef = useRef(null);

  // Request permissions based on actual settings
  const requestPermissions = useCallback(async () => {
    const newPermissions = { ...permissions };
    const newWarnings = [];

    try {
      // Request camera permission if webcam monitoring is enabled
      if (settings?.require_webcam) {
        try {
          const videoStream = await navigator.mediaDevices.getUserMedia({ 
            video: { 
              width: { ideal: 640 }, 
              height: { ideal: 480 },
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

      // Request microphone permission if audio monitoring is enabled
      if (settings?.require_microphone) {
        try {
          const audioStream = await navigator.mediaDevices.getUserMedia({ 
            audio: true 
          });
          newPermissions.microphone = true;
          // Merge with existing video stream if available
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

      // Request screen sharing permission if screen monitoring is enabled
      if (settings?.screen_sharing_detection) {
        try {
          const screenStream = await navigator.mediaDevices.getDisplayMedia({ 
            video: true 
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

  // Start monitoring based on actual settings
  const startMonitoring = useCallback(() => {
    if (!isMonitoring) {
      setIsMonitoring(true);
      onStatusChange?.('monitoring_started');

      // Monitor for tab switching if enabled
      if (settings?.tab_switching_detection) {
        document.addEventListener('visibilitychange', handleVisibilityChange);
      }

      // Monitor for fullscreen changes if required
      if (settings?.fullscreen_requirement) {
        document.addEventListener('fullscreenchange', handleFullscreenChange);
      }

      // Monitor for browser exit if lockdown is enabled
      if (settings?.browser_lockdown) {
        window.addEventListener('beforeunload', handleBeforeUnload);
      }

      // Monitor for copy-paste if enabled
      if (settings?.copy_paste_detection) {
        document.addEventListener('copy', handleCopyPaste);
        document.addEventListener('paste', handleCopyPaste);
      }

      // Monitor for right-click if enabled
      if (settings?.right_click_detection) {
        document.addEventListener('contextmenu', handleRightClick);
      }

      // Monitor for keyboard shortcuts if enabled
      if (settings?.keyboard_shortcut_detection) {
        document.addEventListener('keydown', handleKeyboardShortcuts);
      }

      // Monitor for audio/video interruptions
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => {
          track.addEventListener('ended', handleTrackEnded);
        });
      }

      // Monitor for screen sharing interruptions
      if (screenStreamRef.current) {
        screenStreamRef.current.getTracks().forEach(track => {
          track.addEventListener('ended', handleScreenTrackEnded);
        });
      }
    }
  }, [isMonitoring, settings, onStatusChange]);

  // Stop monitoring
  const stopMonitoring = useCallback(() => {
    setIsMonitoring(false);
    onStatusChange?.('monitoring_stopped');

    // Remove event listeners
    document.removeEventListener('visibilitychange', handleVisibilityChange);
    document.removeEventListener('fullscreenchange', handleFullscreenChange);
    window.removeEventListener('beforeunload', handleBeforeUnload);
    document.removeEventListener('copy', handleCopyPaste);
    document.removeEventListener('paste', handleCopyPaste);
    document.removeEventListener('contextmenu', handleRightClick);
    document.removeEventListener('keydown', handleKeyboardShortcuts);

    // Stop all tracks
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }

    if (screenStreamRef.current) {
      screenStreamRef.current.getTracks().forEach(track => track.stop());
      screenStreamRef.current = null;
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }, [onStatusChange]);

  // Event handlers
  const handleVisibilityChange = () => {
    if (document.hidden) {
      addWarning({
        type: 'tab_switch',
        message: 'Tab switching detected. Please return to the assessment.',
        severity: 'medium'
      });
    }
  };

  const handleFullscreenChange = () => {
    if (!document.fullscreenElement && isFullscreen) {
      addWarning({
        type: 'fullscreen',
        message: 'Fullscreen mode exited. Please return to fullscreen.',
        severity: 'medium'
      });
    }
  };

  const handleBeforeUnload = (e) => {
    e.preventDefault();
    e.returnValue = 'Are you sure you want to leave? Your progress may be lost.';
    return e.returnValue;
  };

  const handleCopyPaste = (e) => {
    e.preventDefault();
    addWarning({
      type: 'copy_paste',
      message: 'Copy-paste operation detected and blocked.',
      severity: 'medium'
    });
  };

  const handleRightClick = (e) => {
    e.preventDefault();
    addWarning({
      type: 'right_click',
      message: 'Right-click is disabled during this assessment.',
      severity: 'low'
    });
  };

  const handleKeyboardShortcuts = (e) => {
    // Block common keyboard shortcuts
    const blockedShortcuts = [
      'F11', // Fullscreen
      'F5',  // Refresh
      'Ctrl+R', // Refresh
      'Ctrl+Shift+R', // Hard refresh
      'Ctrl+Shift+I', // Developer tools
      'F12', // Developer tools
      'Ctrl+U', // View source
      'Ctrl+Shift+C', // Developer tools
      'Ctrl+Shift+J', // Console
      'Ctrl+Shift+K', // Console
      'Ctrl+Shift+E', // Console
      'Ctrl+Shift+M', // Responsive design mode
    ];

    const keyCombo = [
      e.ctrlKey && 'Ctrl',
      e.shiftKey && 'Shift',
      e.altKey && 'Alt',
      e.key
    ].filter(Boolean).join('+');

    if (blockedShortcuts.includes(keyCombo)) {
      e.preventDefault();
      addWarning({
        type: 'keyboard_shortcut',
        message: `Keyboard shortcut ${keyCombo} is disabled during this assessment.`,
        severity: 'medium'
      });
    }
  };

  const handleTrackEnded = () => {
    addWarning({
      type: 'media',
      message: 'Camera or microphone access was interrupted.',
      severity: 'high'
    });
  };

  const handleScreenTrackEnded = () => {
    addWarning({
      type: 'screen',
      message: 'Screen sharing was interrupted.',
      severity: 'high'
    });
  };

  const addWarning = (warning) => {
    setWarnings(prev => [...prev, warning]);
    onViolation?.(warning);

    // Auto-remove warning after 10 seconds
    if (warningTimeoutRef.current) {
      clearTimeout(warningTimeoutRef.current);
    }
    warningTimeoutRef.current = setTimeout(() => {
      setWarnings(prev => prev.filter(w => w !== warning));
    }, 10000);
  };

  const clearWarning = (warning) => {
    setWarnings(prev => prev.filter(w => w !== warning));
  };

  const retryPermissions = () => {
    requestPermissions();
  };

  // Initialize on mount
  useEffect(() => {
    if (settings) {
      requestPermissions();
    }

    return () => {
      stopMonitoring();
      if (warningTimeoutRef.current) {
        clearTimeout(warningTimeoutRef.current);
      }
    };
  }, [settings]);

  const getPermissionStatus = () => {
    const required = [];
    if (settings?.require_webcam) required.push('camera');
    if (settings?.require_microphone) required.push('microphone');
    if (settings?.screen_sharing_detection) required.push('screen');

    const granted = Object.keys(permissions).filter(key => permissions[key]);
    const missing = required.filter(req => !permissions[req]);

    return { required, granted, missing };
  };

  const status = getPermissionStatus();

  // Get active monitoring features
  const getActiveFeatures = () => {
    const features = [];
    if (settings?.browser_lockdown) features.push({ icon: <Lock className="h-3 w-3" />, label: 'Browser Lock' });
    if (settings?.tab_switching_detection) features.push({ icon: <Monitor className="h-3 w-3" />, label: 'Tab Monitor' });
    if (settings?.copy_paste_detection) features.push({ icon: <Copy className="h-3 w-3" />, label: 'Copy-Paste' });
    if (settings?.right_click_detection) features.push({ icon: <MousePointer className="h-3 w-3" />, label: 'Right-Click' });
    if (settings?.fullscreen_requirement) features.push({ icon: <Maximize className="h-3 w-3" />, label: 'Fullscreen' });
    if (settings?.keyboard_shortcut_detection) features.push({ icon: <Keyboard className="h-3 w-3" />, label: 'Keyboard' });
    if (settings?.require_webcam) features.push({ icon: <Camera className="h-3 w-3" />, label: 'Webcam' });
    if (settings?.require_microphone) features.push({ icon: <Mic className="h-3 w-3" />, label: 'Microphone' });
    return features;
  };

  const activeFeatures = getActiveFeatures();

  return (
    <div className="proctor-monitoring">
      {/* Active Monitoring Features */}
      {activeFeatures.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 mb-4">
          <span className="text-xs text-gray-600">Active:</span>
          {activeFeatures.map((feature, index) => (
            <Badge key={index} variant="outline" className="text-xs">
              {feature.icon}
              <span className="ml-1">{feature.label}</span>
            </Badge>
          ))}
        </div>
      )}

      {/* Permission Status */}
      <div className="flex items-center space-x-4 mb-4">
        {settings?.require_webcam && (
          <Badge variant={permissions.camera ? "default" : "destructive"}>
            <Camera className="h-3 w-3 mr-1" />
            Camera {permissions.camera ? "Active" : "Required"}
          </Badge>
        )}
        
        {settings?.require_microphone && (
          <Badge variant={permissions.microphone ? "default" : "destructive"}>
            <Mic className="h-3 w-3 mr-1" />
            Mic {permissions.microphone ? "Active" : "Required"}
          </Badge>
        )}
        
        {settings?.screen_sharing_detection && (
          <Badge variant={permissions.screen ? "default" : "destructive"}>
            <Monitor className="h-3 w-3 mr-1" />
            Screen {permissions.screen ? "Active" : "Required"}
          </Badge>
        )}
      </div>

      {/* Camera Preview */}
      {settings?.require_webcam && permissions.camera && (
        <div className="mb-4">
          <video
            ref={videoRef}
            autoPlay
            muted
            playsInline
            className="w-32 h-24 rounded-lg border"
          />
        </div>
      )}

      {/* Warnings */}
      {warnings.length > 0 && (
        <div className="space-y-2 mb-4">
          {warnings.map((warning, index) => (
            <Alert key={index} variant={warning.severity === 'high' ? 'destructive' : 'default'}>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription className="flex items-center justify-between">
                <span>{warning.message}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => clearWarning(warning)}
                >
                  <XCircle className="h-4 w-4" />
                </Button>
              </AlertDescription>
            </Alert>
          ))}
        </div>
      )}


    </div>
  );
};

export default ProctorMonitoring; 