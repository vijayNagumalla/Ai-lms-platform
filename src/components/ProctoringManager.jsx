import React, { forwardRef, useImperativeHandle, useEffect, useState, useRef } from 'react';
import { toast } from 'react-hot-toast';

const ProctoringManager = forwardRef(({ submissionId, onViolation, onStatusChange }, ref) => {
  const [isInitialized, setIsInitialized] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [webcamStream, setWebcamStream] = useState(null);
  const [violations, setViolations] = useState([]);
  const [isMonitoring, setIsMonitoring] = useState(false);
  
  const webcamRef = useRef(null);
  const monitoringInterval = useRef(null);
  const devtoolsIntervalRef = useRef(null);
  // CRITICAL FIX: Track all event listeners for proper cleanup
  const eventListenersRef = useRef([]);
  const lastFocusTime = useRef(Date.now());
  const tabSwitchCount = useRef(0);
  const rightClickCount = useRef(0);
  const copyPasteCount = useRef(0);

  // Update status when it changes
  useEffect(() => {
    if (onStatusChange) {
      const status = {
        isInitialized,
        isMonitoring,
        isFullscreen,
        webcamActive: !!webcamStream,
        violations: violations.length
      };
      onStatusChange(status);
    }
  }, [isInitialized, isMonitoring, isFullscreen, webcamStream, violations.length, onStatusChange]);

  useImperativeHandle(ref, () => ({
    initialize: initializeProctoring,
    startMonitoring: startMonitoring,
    stopMonitoring: stopMonitoring,
    cleanup: cleanup,
    getViolations: () => violations,
    getStatus: () => ({
      isInitialized,
      isMonitoring,
      isFullscreen,
      webcamActive: !!webcamStream,
      violations: violations.length
    })
  }));

  useEffect(() => {
    // Initialize browser lockdown
    initializeBrowserLockdown();
    
    // Set up event listeners
    setupEventListeners();

    return () => {
      cleanup();
    };
  }, []);

  useEffect(() => {
    if (isMonitoring) {
      startMonitoring();
    } else {
      stopMonitoring();
    }
  }, [isMonitoring]);

  const initializeProctoring = async () => {
    try {
      // Request webcam access with error handling
      try {
        await requestWebcamAccess();
      } catch (webcamError) {
        console.error('Webcam access error:', webcamError);
        // If webcam is required, don't proceed
        if (onStatusChange) {
          onStatusChange('error');
        }
        toast.error('Camera access is required for proctoring. Please allow camera access and try again.');
        throw new Error('Webcam access denied or failed');
      }
      
      // Request fullscreen with error handling
      try {
        await requestFullscreen();
      } catch (fullscreenError) {
        console.error('Fullscreen error:', fullscreenError);
        // Warn but don't block if fullscreen fails
        toast.warning('Fullscreen mode could not be enabled. Assessment will continue with limited monitoring.');
      }
      
      // Start monitoring
      setIsMonitoring(true);
      setIsInitialized(true);
      
      if (onStatusChange) {
        onStatusChange('active');
      }
      
      toast.success('Proctoring initialized successfully');
    } catch (error) {
      console.error('Error initializing proctoring:', error);
      setIsInitialized(false);
      if (onStatusChange) {
        onStatusChange('error');
      }
      toast.error(`Failed to initialize proctoring: ${error.message || 'Please check your camera permissions and try again.'}`);
      throw error;
    }
  };

  const requestWebcamAccess = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true
      });
      
      setWebcamStream(stream);
      
      if (webcamRef.current) {
        webcamRef.current.srcObject = stream;
      }
    } catch (error) {
      console.error('Error accessing webcam:', error);
      logViolation('webcam_disconnect', {
        message: 'Webcam access denied or failed',
        error: error.message
      });
    }
  };

  const requestFullscreen = async () => {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
        setIsFullscreen(true);
      }
    } catch (error) {
      console.error('Error entering fullscreen:', error);
      logViolation('fullscreen_exit', {
        message: 'Failed to enter fullscreen mode',
        error: error.message
      });
    }
  };

  const initializeBrowserLockdown = () => {
    // CRITICAL FIX: Track all event listeners for cleanup
    const listeners = [
      { element: document, event: 'contextmenu', handler: handleRightClick },
      { element: document, event: 'copy', handler: handleCopyPaste },
      { element: document, event: 'paste', handler: handleCopyPaste },
      { element: document, event: 'cut', handler: handleCopyPaste },
      { element: document, event: 'keydown', handler: handleKeyboardShortcuts },
      { element: document, event: 'visibilitychange', handler: handleVisibilityChange },
      { element: window, event: 'focus', handler: handleWindowFocus },
      { element: window, event: 'blur', handler: handleWindowBlur },
      { element: document, event: 'fullscreenchange', handler: handleFullscreenChange }
    ];
    
    // Add all listeners and track them
    listeners.forEach(({ element, event, handler }) => {
      element.addEventListener(event, handler);
      eventListenersRef.current.push({ element, event, handler });
    });
  };

  const setupEventListeners = () => {
    // Monitor for developer tools
    let devtools = false;
    const threshold = 160;
    
    devtoolsIntervalRef.current = setInterval(() => {
      if (window.outerHeight - window.innerHeight > threshold || 
          window.outerWidth - window.innerWidth > threshold) {
        if (!devtools) {
          devtools = true;
          logViolation('dev_tools', {
            message: 'Developer tools detected'
          });
        }
      } else {
        devtools = false;
      }
    }, 500);
  };

  const handleRightClick = (e) => {
    e.preventDefault();
    rightClickCount.current++;
    logViolation('right_click', {
      message: 'Right-click detected',
      count: rightClickCount.current
    });
  };

  const handleCopyPaste = (e) => {
    e.preventDefault();
    copyPasteCount.current++;
    logViolation('copy_paste', {
      message: 'Copy/paste operation detected',
      operation: e.type,
      count: copyPasteCount.current
    });
  };

  const handleKeyboardShortcuts = (e) => {
    const blockedShortcuts = [
      'F12', 'F11', 'F5', 'Ctrl+Shift+I', 'Ctrl+Shift+J', 'Ctrl+U',
      'Ctrl+S', 'Ctrl+A', 'Ctrl+C', 'Ctrl+V', 'Ctrl+X', 'Ctrl+P',
      'Alt+Tab', 'Ctrl+Tab', 'Ctrl+W', 'Ctrl+R', 'Ctrl+Shift+R'
    ];

    const key = e.key;
    const ctrlKey = e.ctrlKey;
    const shiftKey = e.shiftKey;
    const altKey = e.altKey;

    let shortcut = '';
    if (ctrlKey) shortcut += 'Ctrl+';
    if (shiftKey) shortcut += 'Shift+';
    if (altKey) shortcut += 'Alt+';
    shortcut += key;

    if (blockedShortcuts.includes(shortcut) || blockedShortcuts.includes(key)) {
      e.preventDefault();
      logViolation('keyboard_shortcut', {
        message: `Blocked keyboard shortcut: ${shortcut}`,
        shortcut
      });
    }
  };

  const handleVisibilityChange = () => {
    if (document.hidden) {
      tabSwitchCount.current++;
      logViolation('tab_switch', {
        message: 'Tab switching detected',
        count: tabSwitchCount.current
      });
    }
  };

  const handleWindowFocus = () => {
    lastFocusTime.current = Date.now();
  };

  const handleWindowBlur = () => {
    const timeSinceLastFocus = Date.now() - lastFocusTime.current;
    if (timeSinceLastFocus > 1000) { // More than 1 second
      logViolation('window_focus', {
        message: 'Window focus lost',
        duration: timeSinceLastFocus
      });
    }
  };

  const handleFullscreenChange = () => {
    if (!document.fullscreenElement) {
      setIsFullscreen(false);
      logViolation('fullscreen_exit', {
        message: 'Fullscreen mode exited'
      });
    } else {
      setIsFullscreen(true);
    }
  };

  const startMonitoring = () => {
    if (monitoringInterval.current) {
      clearInterval(monitoringInterval.current);
    }

    monitoringInterval.current = setInterval(() => {
      // Check for suspicious activity patterns
      detectSuspiciousActivity();
    }, 10000); // Check every 10 seconds
  };

  const stopMonitoring = () => {
    if (monitoringInterval.current) {
      clearInterval(monitoringInterval.current);
      monitoringInterval.current = null;
    }
  };

  const detectSuspiciousActivity = () => {
    const activityData = {
      rapidAnswerChanges: 0, // This would be tracked from parent component
      typingSpeed: 0, // This would be calculated from typing events
      copyPasteCount: copyPasteCount.current,
      tabSwitchCount: tabSwitchCount.current,
      rightClickCount: rightClickCount.current,
      timeSpentPerQuestion: 0 // This would be tracked from parent component
    };

    // Check for suspicious patterns
    const suspiciousPatterns = [];

    if (activityData.copyPasteCount > 3) {
      suspiciousPatterns.push('Multiple copy-paste operations');
    }

    if (activityData.tabSwitchCount > 10) {
      suspiciousPatterns.push('Excessive tab switching');
    }

    if (activityData.rightClickCount > 5) {
      suspiciousPatterns.push('Multiple right-click attempts');
    }

    if (suspiciousPatterns.length > 0) {
      logViolation('suspicious_activity', {
        message: 'Suspicious activity patterns detected',
        patterns: suspiciousPatterns,
        activityData
      });
    }
  };

  const violationQueueRef = useRef([]);
  
  const logViolation = async (violationType, metadata = {}, retries = 3) => {
    // CRITICAL FIX: Verify HTTPS before sending sensitive proctoring data
    if (process.env.NODE_ENV === 'production' && window.location.protocol !== 'https:') {
      console.error('CRITICAL: Proctoring data must be sent over HTTPS. Current protocol:', window.location.protocol);
      // Don't send violation data over insecure connection
      setViolations(prev => [...prev, {
        id: Date.now(),
        type: violationType,
        timestamp: new Date().toISOString(),
        metadata: { ...metadata, error: 'HTTPS required for proctoring data' }
      }]);
      return;
    }
    
    const violation = {
      id: Date.now(),
      type: violationType,
      timestamp: new Date().toISOString(),
      metadata
    };

    setViolations(prev => [...prev, violation]);

    // Send to backend with retry logic
    let attempt = 0;
    let success = false;
    
    while (attempt < retries && !success) {
      try {
        // CRITICAL FIX: Use absolute URL for HTTPS verification
        const apiUrl = `${window.location.origin}/api/student-assessments/${submissionId}/proctoring/violation`;
        
        // CRITICAL FIX: Verify HTTPS in production
        if (process.env.NODE_ENV === 'production' && !apiUrl.startsWith('https://')) {
          throw new Error('HTTPS required for proctoring data transmission');
        }
        
        const response = await fetch(apiUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: JSON.stringify({
            violationType,
            metadata
          })
        });

        if (response.ok) {
          success = true;
          // Remove from queue if it was there
          violationQueueRef.current = violationQueueRef.current.filter(
            v => v.id !== violation.id
          );
        } else {
          throw new Error('Failed to log violation');
        }
      } catch (error) {
        attempt++;
        console.error(`Error logging violation (attempt ${attempt}/${retries}):`, error);
        
        if (attempt < retries) {
          // Exponential backoff
          await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
        } else {
          // Add to queue for retry later
          violationQueueRef.current.push(violation);
          // Store in localStorage as backup
          if (typeof Storage !== 'undefined') {
            const queueKey = `violation_queue_${submissionId}`;
            localStorage.setItem(queueKey, JSON.stringify(violationQueueRef.current));
          }
        }
      }
    }

    // Notify parent component
    if (onViolation) {
      onViolation(violation);
    }
  };
  
  // Retry queued violations
  useEffect(() => {
    if (!submissionId || violationQueueRef.current.length === 0) return;
    
    const retryQueue = async () => {
      const queue = [...violationQueueRef.current];
      violationQueueRef.current = [];
      
      for (const violation of queue) {
        await logViolation(violation.type, violation.metadata, 3);
      }
    };
    
    // Retry every 30 seconds
    const retryInterval = setInterval(retryQueue, 30000);
    
    return () => clearInterval(retryInterval);
  }, [submissionId]);
  
  // Load violation queue from localStorage on mount
  useEffect(() => {
    if (submissionId && typeof Storage !== 'undefined') {
      const queueKey = `violation_queue_${submissionId}`;
      const storedQueue = localStorage.getItem(queueKey);
      if (storedQueue) {
        try {
          violationQueueRef.current = JSON.parse(storedQueue);
        } catch (e) {
          console.error('Error loading violation queue:', e);
        }
      }
    }
  }, [submissionId]);

  const cleanup = () => {
    // Stop monitoring
    stopMonitoring();
    
    // Clear devtools interval
    if (devtoolsIntervalRef.current) {
      clearInterval(devtoolsIntervalRef.current);
      devtoolsIntervalRef.current = null;
    }
    
    // Stop webcam stream
    if (webcamStream) {
      webcamStream.getTracks().forEach(track => track.stop());
      setWebcamStream(null);
    }
    
    // CRITICAL FIX: Remove all tracked event listeners
    eventListenersRef.current.forEach(({ element, event, handler }) => {
      try {
        element.removeEventListener(event, handler);
      } catch (error) {
        console.error(`Error removing event listener for ${event}:`, error);
      }
    });
    eventListenersRef.current = []; // Clear the tracking array
  };
  
  // CRITICAL FIX: Ensure cleanup on beforeunload and pagehide (for better browser support)
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      // CRITICAL FIX: Call cleanup immediately
      cleanup();
      
      // Show browser warning if webcam is active
      if (webcamStream) {
        e.preventDefault();
        e.returnValue = 'You have an active proctoring session. Are you sure you want to leave?';
        return e.returnValue;
      }
    };
    
    const handlePageHide = () => {
      // CRITICAL FIX: Cleanup on page hide (works better than beforeunload in some browsers)
      cleanup();
    };
    
    // CRITICAL FIX: Add both event listeners for maximum compatibility
    window.addEventListener('beforeunload', handleBeforeUnload);
    window.addEventListener('pagehide', handlePageHide);
    
    // CRITICAL FIX: Also cleanup on visibility change (when tab becomes hidden)
    const handleVisibilityChange = () => {
      if (document.hidden && webcamStream) {
        // Tab is hidden, but don't stop webcam yet (might be temporary)
        // Just log for monitoring
        console.warn('Tab became hidden during proctoring session');
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('pagehide', handlePageHide);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [webcamStream]);

  return (
    <div className="proctoring-manager">
      {/* Webcam Preview (hidden) */}
      {webcamStream && (
        <video
          ref={webcamRef}
          autoPlay
          muted
          style={{ display: 'none' }}
        />
      )}
      
      {/* Proctoring Status Indicator */}
      {isMonitoring && (
        <div className="fixed top-4 right-4 bg-red-600 text-white px-3 py-1 rounded-full text-sm font-medium z-50">
          <div className="flex items-center">
            <div className="w-2 h-2 bg-white rounded-full mr-2 animate-pulse"></div>
            Proctoring Active
          </div>
        </div>
      )}
    </div>
  );
});

ProctoringManager.displayName = 'ProctoringManager';

export default ProctoringManager;
