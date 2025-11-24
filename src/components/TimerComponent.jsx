import React, { useState, useEffect, useRef } from 'react';
import { Badge } from '../components/ui/badge';
import { Clock, AlertTriangle } from 'lucide-react';
import { toast } from 'react-hot-toast';

const TimerComponent = ({ duration, onTimeUp, className = '' }) => {
  const [timeLeft, setTimeLeft] = useState(duration);
  const [isRunning, setIsRunning] = useState(true);
  const [warningsShown, setWarningsShown] = useState({
    tenMinutes: false,
    fiveMinutes: false,
    oneMinute: false,
    thirtySeconds: false
  });

  const intervalRef = useRef(null);
  const audioRef = useRef(null);
  const timerRegionRef = useRef(null);

  useEffect(() => {
    if (isRunning && timeLeft > 0) {
      intervalRef.current = setInterval(() => {
        setTimeLeft(prev => {
          const newTime = prev - 1;
          
          // Check for warnings
          checkWarnings(newTime);
          
          // Check if time is up
          if (newTime <= 0) {
            setIsRunning(false);
            if (onTimeUp) {
              onTimeUp();
            }
            return 0;
          }
          
          return newTime;
        });
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isRunning, timeLeft, onTimeUp]);

  const checkWarnings = (time) => {
    const minutes = Math.floor(time / 60);
    const seconds = time % 60;

    // Announce to screen readers via aria-live
    const announceToScreenReader = (message) => {
      if (timerRegionRef.current) {
        timerRegionRef.current.textContent = message;
        // Clear after announcement
        setTimeout(() => {
          if (timerRegionRef.current) {
            timerRegionRef.current.textContent = '';
          }
        }, 1000);
      }
    };

    // 10 minutes warning
    if (time === 600 && !warningsShown.tenMinutes) {
      const message = '10 minutes remaining!';
      showWarning(message, 'warning');
      announceToScreenReader(message);
      setWarningsShown(prev => ({ ...prev, tenMinutes: true }));
    }

    // 5 minutes warning
    if (time === 300 && !warningsShown.fiveMinutes) {
      const message = '5 minutes remaining!';
      showWarning(message, 'warning');
      announceToScreenReader(message);
      setWarningsShown(prev => ({ ...prev, fiveMinutes: true }));
    }

    // 1 minute warning
    if (time === 60 && !warningsShown.oneMinute) {
      const message = '1 minute remaining!';
      showWarning(message, 'error');
      announceToScreenReader(message);
      setWarningsShown(prev => ({ ...prev, oneMinute: true }));
    }

    // 30 seconds warning
    if (time === 30 && !warningsShown.thirtySeconds) {
      const message = '30 seconds remaining!';
      showWarning(message, 'error');
      announceToScreenReader(message);
      setWarningsShown(prev => ({ ...prev, thirtySeconds: true }));
    }
  };

  const showWarning = (message, type) => {
    if (type === 'error') {
      toast.error(message, { duration: 5000 });
      // Play warning sound
      playWarningSound();
    } else {
      toast.warning(message, { duration: 3000 });
    }
  };

  const playWarningSound = () => {
    // Create a simple beep sound
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
    
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.5);
  };

  const formatTime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    } else {
      return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
  };

  const getTimerColor = () => {
    if (timeLeft <= 30) return 'bg-red-600 text-white';
    if (timeLeft <= 60) return 'bg-orange-600 text-white';
    if (timeLeft <= 300) return 'bg-yellow-600 text-white';
    return 'bg-blue-600 text-white';
  };

  const getTimerIcon = () => {
    if (timeLeft <= 30) return <AlertTriangle className="h-4 w-4" />;
    return <Clock className="h-4 w-4" />;
  };

  return (
    <div className={`flex items-center space-x-2 ${className}`} role="timer" aria-live="polite" aria-atomic="true">
      <Clock className="h-5 w-5 text-gray-600" aria-hidden="true" />
      <Badge 
        className={`${getTimerColor()} px-3 py-1 font-mono text-sm`}
        aria-label={`Time remaining: ${formatTime(timeLeft)}`}
      >
        <div className="flex items-center space-x-1">
          {getTimerIcon()}
          <span>{formatTime(timeLeft)}</span>
        </div>
      </Badge>
      
      {timeLeft === 0 && (
        <div className="text-red-600 text-sm font-medium" role="alert" aria-live="assertive">
          Time's up!
        </div>
      )}
      
      {/* Hidden aria-live region for screen reader announcements */}
      <div 
        ref={timerRegionRef}
        className="sr-only"
        aria-live="assertive"
        aria-atomic="true"
        role="status"
      />
    </div>
  );
};

export default TimerComponent;
