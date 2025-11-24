import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { 
  Shield, 
  Monitor, 
  Camera, 
  VolumeX, 
  Maximize, 
  Lock, 
  Copy, 
  MousePointer, 
  Keyboard,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Eye,
  EyeOff,
  Settings,
  Wifi,
  WifiOff,
  Battery,
  BatteryLow,
  Clock,
  Activity
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// Proctoring Status Indicator Component
const ProctoringStatusIndicator = ({ 
  isActive, 
  violations, 
  onToggleDetails, 
  showDetails 
}) => {
  const getStatusColor = () => {
    if (violations.length === 0) return 'text-green-600 bg-green-100';
    if (violations.length <= 2) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  const getStatusIcon = () => {
    if (violations.length === 0) return CheckCircle;
    if (violations.length <= 2) return AlertTriangle;
    return XCircle;
  };

  const StatusIcon = getStatusIcon();

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      className="fixed top-4 right-4 z-50"
    >
      <Card className="w-80 shadow-lg border-2">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Shield className="h-5 w-5 text-blue-600" />
              <CardTitle className="text-sm">Proctoring</CardTitle>
            </div>
            <div className="flex items-center space-x-2">
              <Badge className={getStatusColor()}>
                <StatusIcon className="h-3 w-3 mr-1" />
                {violations.length === 0 ? 'Secure' : `${violations.length} Alert${violations.length !== 1 ? 's' : ''}`}
              </Badge>
              <Button
                variant="ghost"
                size="sm"
                onClick={onToggleDetails}
              >
                {showDetails ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </div>
          </div>
        </CardHeader>
        
        <AnimatePresence>
          {showDetails && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
            >
              <CardContent className="pt-0">
                <div className="space-y-3">
                  {/* Active Features */}
                  <div>
                    <h4 className="text-xs font-medium text-gray-600 mb-2">Active Features:</h4>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="flex items-center space-x-1">
                        <Monitor className="h-3 w-3 text-green-600" />
                        <span>Screen Monitor</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Keyboard className="h-3 w-3 text-green-600" />
                        <span>Key Monitor</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <MousePointer className="h-3 w-3 text-green-600" />
                        <span>Mouse Monitor</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Maximize className="h-3 w-3 text-green-600" />
                        <span>Fullscreen</span>
                      </div>
                    </div>
                  </div>

                  {/* Recent Violations */}
                  {violations.length > 0 && (
                    <div>
                      <h4 className="text-xs font-medium text-gray-600 mb-2">Recent Alerts:</h4>
                      <div className="space-y-1">
                        {violations.slice(-3).map((violation, index) => (
                          <div key={index} className="text-xs p-2 bg-red-50 rounded border border-red-200">
                            <div className="flex items-center space-x-1">
                              <AlertTriangle className="h-3 w-3 text-red-600" />
                              <span className="font-medium">{violation.type}</span>
                            </div>
                            <p className="text-red-700 mt-1">{violation.message}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* System Status */}
                  <div>
                    <h4 className="text-xs font-medium text-gray-600 mb-2">System Status:</h4>
                    <div className="space-y-1 text-xs">
                      <div className="flex items-center justify-between">
                        <span>Connection:</span>
                        <div className="flex items-center space-x-1">
                          <Wifi className="h-3 w-3 text-green-600" />
                          <span className="text-green-600">Stable</span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Battery:</span>
                        <div className="flex items-center space-x-1">
                          <Battery className="h-3 w-3 text-green-600" />
                          <span className="text-green-600">Good</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </motion.div>
          )}
        </AnimatePresence>
      </Card>
    </motion.div>
  );
};

// Violation Alert Component
const ViolationAlert = ({ violation, onDismiss }) => {
  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'high': return 'border-red-500 bg-red-50 text-red-800';
      case 'medium': return 'border-yellow-500 bg-yellow-50 text-yellow-800';
      case 'low': return 'border-blue-500 bg-blue-50 text-blue-800';
      default: return 'border-gray-500 bg-gray-50 text-gray-800';
    }
  };

  const getSeverityIcon = (severity) => {
    switch (severity) {
      case 'high': return XCircle;
      case 'medium': return AlertTriangle;
      case 'low': return Eye;
      default: return AlertTriangle;
    }
  };

  const SeverityIcon = getSeverityIcon(violation.severity);

  return (
    <motion.div
      initial={{ opacity: 0, y: -50, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -50, scale: 0.9 }}
      className="fixed top-20 left-1/2 transform -translate-x-1/2 z-50 w-96"
    >
      <Alert className={`border-2 ${getSeverityColor(violation.severity)}`}>
        <SeverityIcon className="h-5 w-5" />
        <AlertDescription>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-semibold">{violation.type}</p>
              <p className="text-sm">{violation.message}</p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onDismiss}
              className="ml-4"
            >
              <XCircle className="h-4 w-4" />
            </Button>
          </div>
        </AlertDescription>
      </Alert>
    </motion.div>
  );
};

// Main Non-Intrusive Proctoring Component
const NonIntrusiveProctoring = ({ 
  settings, 
  onViolation, 
  onStatusChange, 
  onTerminate,
  isFullscreen,
  timeRemaining 
}) => {
  const [isActive, setIsActive] = useState(false);
  const [violations, setViolations] = useState([]);
  const [showDetails, setShowDetails] = useState(false);
  const [systemStatus, setSystemStatus] = useState({
    connection: 'stable',
    battery: 'good',
    performance: 'normal'
  });
  const [activeFeatures, setActiveFeatures] = useState([]);
  const [violationCount, setViolationCount] = useState(0);
  const [lastActivity, setLastActivity] = useState(new Date());

  // Refs for cleanup
  const eventListenersRef = useRef({});
  const monitoringIntervalRef = useRef(null);
  const activityTimeoutRef = useRef(null);

  // Initialize proctoring features
  useEffect(() => {
    if (settings && Object.keys(settings).length > 0) {
      initializeProctoring();
    }

    return () => {
      cleanupProctoring();
    };
  }, [settings]);

  // Monitor system status
  useEffect(() => {
    const interval = setInterval(() => {
      updateSystemStatus();
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const initializeProctoring = () => {
    const features = [];
    
    if (settings.browser_lockdown) {
      features.push('browser_lockdown');
      enableBrowserLockdown();
    }
    
    if (settings.tab_switching_detection) {
      features.push('tab_switching_detection');
      enableTabSwitchingDetection();
    }
    
    if (settings.copy_paste_detection) {
      features.push('copy_paste_detection');
      enableCopyPasteDetection();
    }
    
    if (settings.right_click_detection) {
      features.push('right_click_detection');
      enableRightClickDetection();
    }
    
    if (settings.keyboard_shortcut_detection) {
      features.push('keyboard_shortcut_detection');
      enableKeyboardShortcutDetection();
    }
    
    if (settings.fullscreen_requirement) {
      features.push('fullscreen_requirement');
      enableFullscreenMonitoring();
    }

    setActiveFeatures(features);
    setIsActive(true);
    onStatusChange({ isActive: true, features });
  };

  const cleanupProctoring = () => {
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
    onStatusChange({ isActive: false, features: [] });
  };

  const enableBrowserLockdown = () => {
    const handleBeforeUnload = (e) => {
      e.preventDefault();
      e.returnValue = 'Assessment in progress. Are you sure you want to leave?';
      return e.returnValue;
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    eventListenersRef.current.beforeUnload = () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  };

  const enableTabSwitchingDetection = () => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        const violation = {
          type: 'Tab Switch',
          message: 'Switched to another tab or application',
          severity: 'medium',
          timestamp: new Date()
        };
        addViolation(violation);
      }
    };

    const handleFocus = () => {
      setLastActivity(new Date());
    };

    const handleBlur = () => {
      const violation = {
        type: 'Window Focus Lost',
        message: 'Assessment window lost focus',
        severity: 'medium',
        timestamp: new Date()
      };
      addViolation(violation);
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);
    window.addEventListener('blur', handleBlur);

    eventListenersRef.current.tabSwitching = () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('blur', handleBlur);
    };
  };

  const enableCopyPasteDetection = () => {
    const handleCopy = (e) => {
      const violation = {
        type: 'Copy Action',
        message: 'Copy operation detected',
        severity: 'high',
        timestamp: new Date()
      };
      addViolation(violation);
      e.preventDefault();
    };

    const handlePaste = (e) => {
      const violation = {
        type: 'Paste Action',
        message: 'Paste operation detected',
        severity: 'high',
        timestamp: new Date()
      };
      addViolation(violation);
      e.preventDefault();
    };

    const handleCut = (e) => {
      const violation = {
        type: 'Cut Action',
        message: 'Cut operation detected',
        severity: 'high',
        timestamp: new Date()
      };
      addViolation(violation);
      e.preventDefault();
    };

    document.addEventListener('copy', handleCopy);
    document.addEventListener('paste', handlePaste);
    document.addEventListener('cut', handleCut);

    eventListenersRef.current.copyPaste = () => {
      document.removeEventListener('copy', handleCopy);
      document.removeEventListener('paste', handlePaste);
      document.removeEventListener('cut', handleCut);
    };
  };

  const enableRightClickDetection = () => {
    const handleContextMenu = (e) => {
      const violation = {
        type: 'Right Click',
        message: 'Right-click context menu accessed',
        severity: 'medium',
        timestamp: new Date()
      };
      addViolation(violation);
      e.preventDefault();
    };

    document.addEventListener('contextmenu', handleContextMenu);

    eventListenersRef.current.rightClick = () => {
      document.removeEventListener('contextmenu', handleContextMenu);
    };
  };

  const enableKeyboardShortcutDetection = () => {
    const handleKeyDown = (e) => {
      const blockedKeys = ['F11', 'F5', 'F12'];
      const blockedCombos = [
        'Control+r', 'Control+Shift+r', 'Control+Shift+i', 
        'Control+u', 'Control+Shift+c', 'Control+Shift+j',
        'Control+Shift+k', 'Control+Shift+e', 'Control+Shift+m'
      ];
      
      const keyCombo = [
        e.ctrlKey && 'Control',
        e.shiftKey && 'Shift',
        e.altKey && 'Alt',
        e.key
      ].filter(Boolean).join('+');

      if (blockedKeys.includes(e.key) || blockedCombos.includes(keyCombo)) {
        const violation = {
          type: 'Blocked Shortcut',
          message: `Keyboard shortcut ${keyCombo} was blocked`,
          severity: 'high',
          timestamp: new Date()
        };
        addViolation(violation);
        e.preventDefault();
        e.stopPropagation();
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    eventListenersRef.current.keyboardShortcuts = () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  };

  const enableFullscreenMonitoring = () => {
    const handleFullscreenChange = () => {
      if (!document.fullscreenElement) {
        const violation = {
          type: 'Fullscreen Exit',
          message: 'Exited fullscreen mode',
          severity: 'high',
          timestamp: new Date()
        };
        addViolation(violation);
      }
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);

    eventListenersRef.current.fullscreen = () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  };

  const addViolation = (violation) => {
    setViolations(prev => [...prev, violation].slice(-10)); // Keep only last 10 violations
    setViolationCount(prev => prev + 1);
    onViolation(violation);

    // Auto-dismiss violation after 5 seconds
    setTimeout(() => {
      setViolations(prev => prev.filter(v => v.timestamp !== violation.timestamp));
    }, 5000);

    // Check for termination conditions
    if (violation.severity === 'high' && violationCount >= 3) {
      onTerminate(violation);
    }
  };

  const updateSystemStatus = () => {
    // Simulate system status updates
    setSystemStatus(prev => ({
      ...prev,
      connection: Math.random() > 0.1 ? 'stable' : 'unstable',
      battery: Math.random() > 0.2 ? 'good' : 'low',
      performance: Math.random() > 0.15 ? 'normal' : 'slow'
    }));
  };

  const handleToggleDetails = () => {
    setShowDetails(prev => !prev);
  };

  const handleDismissViolation = (violation) => {
    setViolations(prev => prev.filter(v => v.timestamp !== violation.timestamp));
  };

  if (!isActive) {
    return null;
  }

  return (
    <>
      {/* Proctoring Status Indicator */}
      <ProctoringStatusIndicator
        isActive={isActive}
        violations={violations}
        onToggleDetails={handleToggleDetails}
        showDetails={showDetails}
      />

      {/* Violation Alerts */}
      <AnimatePresence>
        {violations.map((violation, index) => (
          <ViolationAlert
            key={`${violation.timestamp}-${index}`}
            violation={violation}
            onDismiss={() => handleDismissViolation(violation)}
          />
        ))}
      </AnimatePresence>

      {/* Fullscreen Warning */}
      {settings.fullscreen_requirement && !isFullscreen && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-50"
        >
          <Alert className="border-orange-500 bg-orange-50 text-orange-800 w-96">
            <Maximize className="h-4 w-4" />
            <AlertDescription>
              <div className="flex items-center justify-between">
                <span>Fullscreen mode required for this assessment</span>
                <Button
                  size="sm"
                  onClick={() => document.documentElement.requestFullscreen()}
                  className="ml-4"
                >
                  Enter Fullscreen
                </Button>
              </div>
            </AlertDescription>
          </Alert>
        </motion.div>
      )}
    </>
  );
};

export default NonIntrusiveProctoring;



