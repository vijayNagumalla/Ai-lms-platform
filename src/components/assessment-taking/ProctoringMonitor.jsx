import React, { useState, useEffect, useRef, useImperativeHandle, forwardRef } from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { 
  Eye, 
  AlertTriangle, 
  Camera, 
  Mic, 
  Monitor, 
  Lock,
  WifiOff,
  MousePointer,
  Keyboard,
  Copy,
  Maximize,
  Minimize,
  VolumeX,
  Volume2,
  Activity,
  Shield,
  Zap
} from 'lucide-react';
import { toast } from 'react-hot-toast';

const ProctoringMonitor = forwardRef(({ 
  submissionId, 
  proctoringSettings, 
  onViolation,
  onMaxViolationsExceeded
}, ref) => {
  const [isActive, setIsActive] = useState(false);
  const [violations, setViolations] = useState([]);
  const [status, setStatus] = useState({
    camera: false,
    microphone: false,
    fullscreen: false,
    browserLockdown: false,
    eyeTracking: false,
    tabSwitching: false
  });
  
  const [violationCount, setViolationCount] = useState(0);
  const [lastActivity, setLastActivity] = useState(Date.now());
  const [collapsed, setCollapsed] = useState(true);
  const [tabSwitchCount, setTabSwitchCount] = useState(0);
  
  const streamRef = useRef(null);
  const monitoringIntervalRef = useRef(null);
  const activityTimeoutRef = useRef(null);
  const eventListenersRef = useRef({});
  const eyeTrackingRef = useRef(null);
  const tabSwitchCountRef = useRef(0);
  const copyPasteCountRef = useRef(0);
  const rightClickCountRef = useRef(0);

  useImperativeHandle(ref, () => ({
    initialize: initializeProctoring,
    cleanup: cleanupProctoring,
    getStatus: () => status,
    getViolations: () => violations,
    getViolationCount: () => violationCount,
    getTabSwitchCount: () => tabSwitchCount
  }));

  // Auto-initialize when component mounts with valid settings
  useEffect(() => {
    if (proctoringSettings && submissionId && !isActive) {
      initializeProctoring();
    }
    
    return () => {
      cleanupProctoring();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [proctoringSettings, submissionId]);

  const initializeProctoring = async () => {
    try {
      if (!proctoringSettings) {
        console.warn('Proctoring settings not provided');
        return;
      }

      console.log('Initializing proctoring with settings:', proctoringSettings);
      setIsActive(true);
      
      // Initialize camera monitoring
      if (proctoringSettings.require_webcam || proctoringSettings.require_webcam === true) {
        try {
          await initializeCameraMonitoring();
        } catch (error) {
          console.error('Failed to initialize camera monitoring:', error);
          logViolation('camera_error', 'Failed to initialize camera monitoring');
        }
      }
      
      // Initialize microphone monitoring
      if (proctoringSettings.require_microphone || proctoringSettings.require_microphone === true) {
        try {
          await initializeMicrophoneMonitoring();
        } catch (error) {
          console.error('Failed to initialize microphone monitoring:', error);
          logViolation('microphone_error', 'Failed to initialize microphone monitoring');
        }
      }
      
      // Initialize fullscreen monitoring
      if (proctoringSettings.fullscreen_requirement || proctoringSettings.fullscreen_requirement === true) {
        initializeFullscreenMonitoring();
      }
      
      // Initialize browser lockdown
      if (proctoringSettings.browser_lockdown || proctoringSettings.browser_lockdown === true) {
        initializeBrowserLockdown();
      }
      
      // Initialize tab switching detection
      if (proctoringSettings.tab_switching_detection || proctoringSettings.tab_switching_detection === true) {
        initializeTabSwitchingDetection();
      }
      
      // Initialize copy/paste detection
      if (proctoringSettings.copy_paste_detection || proctoringSettings.copy_paste_detection === true) {
        initializeCopyPasteDetection();
      }
      
      // Initialize right-click detection
      if (proctoringSettings.right_click_detection || proctoringSettings.right_click_detection === true) {
        initializeRightClickDetection();
      }
      
      // Initialize keyboard shortcut detection
      if (proctoringSettings.keyboard_shortcut_detection || proctoringSettings.keyboard_shortcut_detection === true) {
        initializeKeyboardShortcutDetection();
      }
      
      // Initialize eye tracking
      if (proctoringSettings.eye_tracking || proctoringSettings.eye_tracking === true) {
        initializeEyeTracking();
      }
      
      // Start general monitoring (always active)
      startGeneralMonitoring();
      
      toast.success('Proctoring monitoring started', { duration: 3000 });
    } catch (error) {
      console.error('Error initializing proctoring:', error);
      toast.error('Failed to initialize proctoring');
    }
  };

  const cleanupProctoring = () => {
    // Stop all media streams
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    
    // Remove all event listeners
    Object.values(eventListenersRef.current).forEach(cleanup => {
      if (typeof cleanup === 'function') {
        cleanup();
      }
    });
    eventListenersRef.current = {};
    
    // Clear intervals
    if (monitoringIntervalRef.current) {
      clearInterval(monitoringIntervalRef.current);
    }
    if (activityTimeoutRef.current) {
      clearTimeout(activityTimeoutRef.current);
    }
    
    setIsActive(false);
    setStatus({
      camera: false,
      microphone: false,
      fullscreen: false,
      browserLockdown: false,
      eyeTracking: false,
      tabSwitching: false
    });
  };

  const initializeCameraMonitoring = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: 'user'
        } 
      });
      
      streamRef.current = stream;
      setStatus(prev => ({ ...prev, camera: true }));
      
      // Monitor camera activity
      const videoTrack = stream.getVideoTracks()[0];
      if (videoTrack) {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const video = document.createElement('video');
        video.srcObject = stream;
        
        const checkCameraActivity = () => {
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
          ctx.drawImage(video, 0, 0);
          
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const data = imageData.data;
          
          // Simple motion detection
          let motionDetected = false;
          for (let i = 0; i < data.length; i += 4) {
            const brightness = (data[i] + data[i + 1] + data[i + 2]) / 3;
            if (brightness > 200) {
              motionDetected = true;
              break;
            }
          }
          
          if (!motionDetected) {
            logViolation('camera_inactive', 'Camera appears to be covered or inactive');
          }
        };
        
        const interval = setInterval(checkCameraActivity, 5000);
        eventListenersRef.current.camera = () => clearInterval(interval);
      }
    } catch (error) {
      console.error('Camera monitoring error:', error);
      logViolation('camera_error', 'Failed to access camera');
    }
  };

  const initializeMicrophoneMonitoring = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: { 
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        } 
      });
      
      if (streamRef.current) {
        const tracks = [...streamRef.current.getTracks(), ...stream.getTracks()];
        streamRef.current = new MediaStream(tracks);
      } else {
        streamRef.current = stream;
      }
      
      setStatus(prev => ({ ...prev, microphone: true }));
      
      // Monitor audio levels
      const audioContext = new AudioContext();
      const analyser = audioContext.createAnalyser();
      const microphone = audioContext.createMediaStreamSource(stream);
      microphone.connect(analyser);
      
      analyser.fftSize = 256;
      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);
      
      const checkAudioLevels = () => {
        analyser.getByteFrequencyData(dataArray);
        const average = dataArray.reduce((a, b) => a + b) / dataArray.length;
        
        if (average < 5) {
          logViolation('microphone_inactive', 'Microphone appears to be muted or inactive');
        }
      };
      
      const interval = setInterval(checkAudioLevels, 3000);
      eventListenersRef.current.microphone = () => {
        clearInterval(interval);
        audioContext.close();
      };
    } catch (error) {
      console.error('Microphone monitoring error:', error);
      logViolation('microphone_error', 'Failed to access microphone');
    }
  };

  const initializeFullscreenMonitoring = () => {
    const checkFullscreen = () => {
      const isFullscreen = !!(document.fullscreenElement || 
                            document.webkitFullscreenElement || 
                            document.mozFullScreenElement || 
                            document.msFullscreenElement);
      
      setStatus(prev => ({ ...prev, fullscreen: isFullscreen }));
      
      if (!isFullscreen) {
        logViolation('fullscreen_exit', 'Exited fullscreen mode');
      }
    };
    
    const events = ['fullscreenchange', 'webkitfullscreenchange', 'mozfullscreenchange', 'MSFullscreenChange'];
    events.forEach(event => {
      document.addEventListener(event, checkFullscreen);
    });
    
    eventListenersRef.current.fullscreen = () => {
      events.forEach(event => {
        document.removeEventListener(event, checkFullscreen);
      });
    };
    
    checkFullscreen();
  };

  const initializeBrowserLockdown = () => {
    setStatus(prev => ({ ...prev, browserLockdown: true }));
    
    // Disable right-click
    const disableRightClick = (e) => {
      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation();
      rightClickCountRef.current++;
      logViolation('right_click', 'Right-click detected');
      return false;
    };
    
    // Disable developer tools
    const disableDevTools = (e) => {
      if (e.key === 'F12' || 
          (e.ctrlKey && e.shiftKey && e.key === 'I') ||
          (e.ctrlKey && e.shiftKey && e.key === 'C') ||
          (e.ctrlKey && e.key === 'U')) {
        e.preventDefault();
        e.stopPropagation();
        logViolation('dev_tools', 'Developer tools shortcut detected');
      }
    };
    
    // Disable copy/paste
    const disableCopyPaste = (e) => {
      e.preventDefault();
      e.stopPropagation();
      copyPasteCountRef.current++;
      logViolation('copy_paste', 'Copy/paste operation detected');
      return false;
    };
    
    // Use capture phase to catch events early
    document.addEventListener('contextmenu', disableRightClick, { capture: true });
    window.addEventListener('contextmenu', disableRightClick, { capture: true });
    document.addEventListener('keydown', disableDevTools, { capture: true });
    document.addEventListener('copy', disableCopyPaste, { capture: true });
    document.addEventListener('paste', disableCopyPaste, { capture: true });
    document.addEventListener('cut', disableCopyPaste, { capture: true });
    
    eventListenersRef.current.browserLockdown = () => {
      document.removeEventListener('contextmenu', disableRightClick, { capture: true });
      window.removeEventListener('contextmenu', disableRightClick, { capture: true });
      document.removeEventListener('keydown', disableDevTools, { capture: true });
      document.removeEventListener('copy', disableCopyPaste, { capture: true });
      document.removeEventListener('paste', disableCopyPaste, { capture: true });
      document.removeEventListener('cut', disableCopyPaste, { capture: true });
    };
  };

  const initializeTabSwitchingDetection = () => {
    setStatus(prev => ({ ...prev, tabSwitching: true }));
    
    const handleVisibilityChange = () => {
      if (document.hidden) {
        tabSwitchCountRef.current++;
        setTabSwitchCount(prev => prev + 1);
        logViolation('tab_switch', 'Tab switching or window focus lost detected');
      }
    };
    
    const handleBlur = () => {
      tabSwitchCountRef.current++;
      setTabSwitchCount(prev => prev + 1);
      logViolation('window_blur', 'Window focus lost');
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleBlur);
    
    eventListenersRef.current.tabSwitching = () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleBlur);
    };
  };

  const initializeCopyPasteDetection = () => {
    const handleCopyPaste = (e) => {
      e.preventDefault();
      e.stopPropagation();
      copyPasteCountRef.current++;
      logViolation('copy_paste', 'Copy/paste operation detected');
      return false;
    };
    
    // Use capture phase to catch events early
    document.addEventListener('copy', handleCopyPaste, { capture: true });
    document.addEventListener('paste', handleCopyPaste, { capture: true });
    document.addEventListener('cut', handleCopyPaste, { capture: true });
    
    eventListenersRef.current.copyPaste = () => {
      document.removeEventListener('copy', handleCopyPaste, { capture: true });
      document.removeEventListener('paste', handleCopyPaste, { capture: true });
      document.removeEventListener('cut', handleCopyPaste, { capture: true });
    };
  };

  const initializeRightClickDetection = () => {
    const handleRightClick = (e) => {
      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation();
      rightClickCountRef.current++;
      logViolation('right_click', 'Right-click detected');
      return false;
    };
    
    // Use capture phase to catch event early
    document.addEventListener('contextmenu', handleRightClick, { capture: true });
    // Also prevent on window level
    window.addEventListener('contextmenu', handleRightClick, { capture: true });
    
    eventListenersRef.current.rightClick = () => {
      document.removeEventListener('contextmenu', handleRightClick, { capture: true });
      window.removeEventListener('contextmenu', handleRightClick, { capture: true });
    };
  };

  const initializeKeyboardShortcutDetection = () => {
    const handleKeyboardShortcuts = (e) => {
      if (e.key === 'F12' || 
          (e.ctrlKey && e.shiftKey && e.key === 'I') ||
          (e.ctrlKey && e.shiftKey && e.key === 'C') ||
          (e.ctrlKey && e.key === 'U') ||
          (e.ctrlKey && e.key === 'S') ||
          (e.ctrlKey && e.key === 'A')) {
        e.preventDefault();
        logViolation('keyboard_shortcut', `Keyboard shortcut detected: ${e.key}`);
      }
    };
    
    document.addEventListener('keydown', handleKeyboardShortcuts);
    
    eventListenersRef.current.keyboardShortcuts = () => {
      document.removeEventListener('keydown', handleKeyboardShortcuts);
    };
  };

  const initializeEyeTracking = () => {
    setStatus(prev => ({ ...prev, eyeTracking: true }));
    
    // Simple eye tracking simulation (replace with actual implementation)
    const trackEyeMovement = () => {
      // This would integrate with actual eye tracking libraries
      // For now, we'll simulate basic monitoring
      const isLookingAway = Math.random() < 0.1; // 10% chance of looking away
      
      if (isLookingAway) {
        logViolation('eye_tracking', 'Eye movement suggests looking away from screen');
      }
    };
    
    const interval = setInterval(trackEyeMovement, 2000);
    eventListenersRef.current.eyeTracking = () => clearInterval(interval);
  };

  const startGeneralMonitoring = () => {
    // Monitor user activity - use closure to track last activity time
    let lastActivityTime = Date.now();
    
    const updateActivity = () => {
      const now = Date.now();
      lastActivityTime = now;
      setLastActivity(now);
    };
    
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];
    events.forEach(event => {
      document.addEventListener(event, updateActivity, { passive: true });
    });
    
    // Check for inactivity
    const checkInactivity = () => {
      const timeSinceActivity = Date.now() - lastActivityTime;
      if (timeSinceActivity > 30000) { // 30 seconds
        logViolation('inactivity', 'Extended period of inactivity detected');
      }
    };
    
    monitoringIntervalRef.current = setInterval(checkInactivity, 10000);
    
    eventListenersRef.current.generalMonitoring = () => {
      events.forEach(event => {
        document.removeEventListener(event, updateActivity);
      });
      if (monitoringIntervalRef.current) {
        clearInterval(monitoringIntervalRef.current);
      }
    };
  };

  const logViolation = (type, description) => {
    const violation = {
      id: Date.now() + Math.random(), // Ensure unique ID
      type,
      description,
      timestamp: new Date().toISOString(),
      severity: getViolationSeverity(type),
      metadata: {
        tabSwitches: tabSwitchCountRef.current,
        copyPasteAttempts: copyPasteCountRef.current,
        rightClickAttempts: rightClickCountRef.current,
        timeSinceActivity: Date.now() - lastActivity
      }
    };
    
    setViolations(prev => {
      // Prevent duplicate violations within 1 second
      const recent = prev.filter(v => 
        v.type === type && 
        Date.now() - new Date(v.timestamp).getTime() < 1000
      );
      if (recent.length > 0) {
        return prev; // Don't add duplicate
      }
      return [...prev, violation];
    });
    
    setViolationCount(prev => prev + 1);
    
    // Call parent callback
    if (onViolation) {
      onViolation(violation);
    }
    
    // Show toast notification
    toast.error(`Proctoring violation: ${description}`, {
      duration: 5000
    });
    
    // Log to console for debugging
    console.warn('Proctoring violation logged:', violation);
  };

  const getViolationSeverity = (type) => {
    const severityMap = {
      'camera_inactive': 'medium',
      'microphone_inactive': 'medium',
      'fullscreen_exit': 'high',
      'tab_switch': 'high',
      'window_blur': 'high',
      'copy_paste': 'high',
      'right_click': 'medium',
      'dev_tools': 'high',
      'keyboard_shortcut': 'medium',
      'eye_tracking': 'low',
      'inactivity': 'low'
    };
    
    return severityMap[type] || 'medium';
  };

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'high': return 'text-red-600 bg-red-100';
      case 'medium': return 'text-orange-600 bg-orange-100';
      case 'low': return 'text-yellow-600 bg-yellow-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  if (!isActive) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-30 max-w-sm">
      <div className="bg-white border border-gray-200 rounded-full shadow-lg px-3 py-2 cursor-pointer flex items-center space-x-2" onClick={() => setCollapsed(!collapsed)}>
        <Shield className="h-4 w-4 text-blue-600" />
        <span className="text-xs font-medium">Proctoring Active</span>
        {violationCount > 0 && <Badge variant="destructive">{violationCount}</Badge>}
      </div>
      {!collapsed && (
        <div className="mt-2 bg-white border border-gray-200 rounded-lg shadow-lg p-3">
          {/* Minimal status */}
          <div className="grid grid-cols-2 gap-2 mb-2">
            <div className="flex items-center space-x-1 text-xs">
              <Camera className={`h-3 w-3 ${status.camera ? 'text-green-600' : 'text-red-600'}`} />
              <span>Camera</span>
            </div>
            <div className="flex items-center space-x-1 text-xs">
              <Mic className={`h-3 w-3 ${status.microphone ? 'text-green-600' : 'text-red-600'}`} />
              <span>Mic</span>
            </div>
            <div className="flex items-center space-x-1 text-xs">
              <Maximize className={`h-3 w-3 ${status.fullscreen ? 'text-green-600' : 'text-red-600'}`} />
              <span>Fullscreen</span>
            </div>
            <div className="flex items-center space-x-1 text-xs">
              <Lock className={`h-3 w-3 ${status.browserLockdown ? 'text-green-600' : 'text-red-600'}`} />
              <span>Lockdown</span>
            </div>
          </div>
          {violations.length > 0 && (
            <div className="space-y-1">
              <div className="text-xs font-medium text-gray-600">Recent</div>
              {violations.slice(-3).map((violation) => (
                <Alert key={violation.id} className="p-2">
                  <AlertTriangle className="h-3 w-3" />
                  <AlertDescription className="text-xs">
                    <div className={`inline-block px-1 py-0.5 rounded text-xs mr-1 ${getSeverityColor(violation.severity)}`}>
                      {violation.severity}
                    </div>
                    {violation.description}
                  </AlertDescription>
                </Alert>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
});

ProctoringMonitor.displayName = 'ProctoringMonitor';

export default ProctoringMonitor;
