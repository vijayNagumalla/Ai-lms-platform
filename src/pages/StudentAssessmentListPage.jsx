import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/ui/use-toast';
import { motion } from 'framer-motion';
import { 
  Play, Eye, Clock, Calendar, Target, Users, FileText, 
  CheckCircle, XCircle, AlertTriangle, Clock3, CalendarDays,
    Search, Filter, RefreshCw, BookOpen, Award, Timer, History, X,
    ChevronDown
} from 'lucide-react';
import apiService from '@/services/api';
import { 
  convertAssessmentTimeToUserTimezone, 
  getUserTimezone,
  getTimeRemaining,
  isDateInPast,
  isDateInFuture
} from '@/lib/timezone-utils';

// Countdown Component
const CountdownTimer = ({ startDate, startTime, timezone, onCountdownComplete }) => {
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    const calculateTimeLeft = () => {
      if (!startDate || !startTime || !timezone) {
        return { days: 0, hours: 0, minutes: 0, seconds: 0 };
      }

      try {
        // Clean up the date and time strings
        let cleanStartDate = startDate;
        let cleanStartTime = startTime;
        
        // If dateString contains time info (like T18:30:00.000Z), extract just the date part
        if (cleanStartDate.includes('T')) {
          cleanStartDate = cleanStartDate.split('T')[0];
        }
        
        // If time string contains timezone info (like .000Z or T), extract just the time part
        if (cleanStartTime.includes('T')) {
          const parts = cleanStartTime.split('T');
          cleanStartTime = parts[parts.length - 1];
        }
        
        // Remove timezone suffix if present (like .000Z, +00:00, -05:00)
        cleanStartTime = cleanStartTime.replace(/[+-]\d{2}:\d{2}$/, ''); // Remove +00:00 or -05:00
        cleanStartTime = cleanStartTime.replace(/\.\d{3}Z?$/, ''); // Remove .000Z
        
        // Validate date and time formats
        if (!/^\d{4}-\d{2}-\d{2}$/.test(cleanStartDate)) {
          return { days: 0, hours: 0, minutes: 0, seconds: 0 };
        }
        
        if (!/^\d{1,2}:\d{2}(:\d{2})?$/.test(cleanStartTime)) {
          return { days: 0, hours: 0, minutes: 0, seconds: 0 };
        }
        
        // Create a date string in the assessment timezone
        const dateTimeString = `${cleanStartDate}T${cleanStartTime}`;
        const assessmentDate = new Date(dateTimeString);
        const now = new Date();
        
        // Check if the date is valid before calling toISOString
        if (isNaN(assessmentDate.getTime())) {
          return { days: 0, hours: 0, minutes: 0, seconds: 0 };
        }
        
        const diff = assessmentDate.getTime() - now.getTime();

        if (diff <= 0) {
          return { days: 0, hours: 0, minutes: 0, seconds: 0 };
        }

        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);

        return { days, hours, minutes, seconds };
      } catch (error) {
        return { days: 0, hours: 0, minutes: 0, seconds: 0 };
      }
    };

    const updateTimeLeft = () => {
      const newTimeLeft = calculateTimeLeft();
      setTimeLeft(newTimeLeft);
      
      // Check if countdown has reached zero
      if (newTimeLeft.days === 0 && newTimeLeft.hours === 0 && 
          newTimeLeft.minutes === 0 && newTimeLeft.seconds === 0) {
        onCountdownComplete && onCountdownComplete();
      }
    };

    updateTimeLeft();
    const timer = setInterval(updateTimeLeft, 1000);

    return () => clearInterval(timer);
  }, [startDate, startTime, timezone, onCountdownComplete]);

  const formatTime = (value) => value.toString().padStart(2, '0');

  if (timeLeft.days === 0 && timeLeft.hours === 0 && timeLeft.minutes === 0 && timeLeft.seconds === 0) {
    return (
      <div className="flex items-center gap-2 text-green-600 font-medium">
        <CheckCircle className="h-4 w-4" />
        <span>Available Now!</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1 text-sm">
      {timeLeft.days > 0 && (
        <>
          <span className="font-medium">{timeLeft.days}</span>
          <span className="text-gray-500">d</span>
        </>
      )}
      {timeLeft.hours > 0 && (
        <>
          <span className="font-medium">{formatTime(timeLeft.hours)}</span>
          <span className="text-gray-500">h</span>
        </>
      )}
      {timeLeft.minutes > 0 && (
        <>
          <span className="font-medium">{formatTime(timeLeft.minutes)}</span>
          <span className="text-gray-500">m</span>
        </>
      )}
      {timeLeft.seconds > 0 && (
        <>
          <span className="font-medium">{formatTime(timeLeft.seconds)}</span>
          <span className="text-gray-500">s</span>
        </>
      )}
    </div>
  );
};

const StudentAssessmentListPage = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [assessments, setAssessments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterType, setFilterType] = useState('all');
  const [currentTab, setCurrentTab] = useState('assigned');
  const [userTimezone, setUserTimezone] = useState('UTC');
  const [availableAssessments, setAvailableAssessments] = useState(new Set());
  const [attemptsHistory, setAttemptsHistory] = useState({});
  const [loadingAttempts, setLoadingAttempts] = useState({});
  const [showAttemptsModal, setShowAttemptsModal] = useState(false);
  const [selectedAssessment, setSelectedAssessment] = useState(null);

  useEffect(() => {
    if (user) {
      const timezone = getUserTimezone(user);
      setUserTimezone(timezone);
    }
    loadAssessments();
  }, [user]);

  // Check for assessments that should be available on page load
  useEffect(() => {
    if (assessments.length > 0) {
      const now = new Date();
      const newlyAvailable = new Set();
      
      assessments.forEach(assessment => {
        // Only check for scheduled assessments that should become available
        if (assessment.status === 'scheduled' &&
            assessment.start_date_only && assessment.start_time_only && assessment.assessment_timezone) {
          try {
            const dateTimeString = `${assessment.start_date_only}T${assessment.start_time_only}`;
            const startDate = new Date(dateTimeString);
            
            if (startDate <= now) {
              newlyAvailable.add(assessment.id);
            }
          } catch (error) {
            // Ignore invalid dates
          }
        }
      });
      
      if (newlyAvailable.size > 0) {
        setAvailableAssessments(prev => new Set([...prev, ...newlyAvailable]));
      }
    }
  }, [assessments]);

  // Removed automatic refresh - page will only refresh when user manually clicks refresh button

  const loadAssessments = async () => {
    try {
      setLoading(true);
      const response = await apiService.getAssessmentInstances({ student_id: user.id });
      
      if (response.success) {
        const newAssessments = response.data;
        

        
        // Check for changes in assessment schedules
        if (assessments.length > 0) {
          const changes = [];
          
          newAssessments.forEach(newAssessment => {
            const oldAssessment = assessments.find(a => a.id === newAssessment.id);
            if (oldAssessment) {
              // Check if start time changed
              if (oldAssessment.start_date_only !== newAssessment.start_date_only || 
                  oldAssessment.start_time_only !== newAssessment.start_time_only) {
                changes.push({
                  type: 'start_time',
                  assessment: newAssessment,
                  oldStart: `${oldAssessment.start_date_only} ${oldAssessment.start_time_only}`,
                  newStart: `${newAssessment.start_date_only} ${newAssessment.start_time_only}`
                });
              }
              
              // Check if end time changed
              if (oldAssessment.end_date_only !== newAssessment.end_date_only || 
                  oldAssessment.end_time_only !== newAssessment.end_time_only) {
                changes.push({
                  type: 'end_time',
                  assessment: newAssessment,
                  oldEnd: `${oldAssessment.end_date_only} ${oldAssessment.end_time_only}`,
                  newEnd: `${newAssessment.end_date_only} ${newAssessment.end_time_only}`
                });
              }
              
              // Check if status changed
              if (oldAssessment.status !== newAssessment.status) {
                changes.push({
                  type: 'status',
                  assessment: newAssessment,
                  oldStatus: oldAssessment.status,
                  newStatus: newAssessment.status
                });
              }
            }
          });
          
          // Show notifications for changes
          changes.forEach(change => {
            if (change.type === 'start_time') {
              toast({
                title: "Assessment Schedule Updated",
                description: `${change.assessment.title} start time has been updated.`,
                duration: 5000,
              });
            } else if (change.type === 'end_time') {
              toast({
                title: "Assessment Schedule Updated",
                description: `${change.assessment.title} end time has been updated.`,
                duration: 5000,
              });
            } else if (change.type === 'status') {
              toast({
                title: "Assessment Status Changed",
                description: `${change.assessment.title} status changed from ${change.oldStatus} to ${change.newStatus}.`,
                duration: 5000,
              });
            }
          });
        }
        
        setAssessments(newAssessments);
      } else {
        toast({
          variant: "destructive",
          title: "Error",
          description: response.message || "Failed to load assessments"
        });
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load assessments"
      });
    } finally {
      setLoading(false);
    }
  };

  // Helper function to safely parse datetime strings
  const parseDateTime = (dateString, timeString) => {
    if (!dateString || !timeString) return null;
    
    try {
      let dateTimeString;
      
      // Check if dateString already contains time information
      if (dateString.includes('T')) {
        // If it's already a full datetime, use it as is
        dateTimeString = dateString;
      } else {
        // If it's just a date, combine with time
        dateTimeString = `${dateString}T${timeString}`;
      }
      
      const date = new Date(dateTimeString);
      
      // Validate the date
      if (isNaN(date.getTime())) {
        console.warn(`Invalid date: ${dateTimeString}`);
        return null;
      }
      
      return date;
    } catch (error) {
      console.error('Error parsing date:', error);
      return null;
    }
  };

  // Check if assessment is actually expired based on end time
  const isAssessmentExpired = (assessment) => {
    if (assessment.end_date_only && assessment.end_time_only && assessment.assessment_timezone) {
      const endDate = parseDateTime(assessment.end_date_only, assessment.end_time_only);
      if (endDate) {
        const now = new Date();
        return now > endDate;
      }
    }
    return false;
  };

  // Get actual status considering expiration
  const getActualStatus = (assessment) => {
    if (isAssessmentExpired(assessment)) {
      return 'expired';
    }
    return assessment.status;
  };

  // Get status color based on assessment status
  const getStatusColor = (assessment) => {
    const actualStatus = getActualStatus(assessment);
    switch (actualStatus) {
      case 'scheduled': return 'bg-blue-100 text-blue-800';
      case 'available': return 'bg-green-100 text-green-800';
      case 'in_progress': return 'bg-yellow-100 text-yellow-800';
      case 'completed': return 'bg-purple-100 text-purple-800';
      case 'expired': return 'bg-red-100 text-red-800';
      case 'overdue': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
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

  // Calculate remaining time for an in-progress assessment
  const getRemainingTime = (assessment) => {
    if (!canResumeAssessment(assessment)) {
      return null;
    }

    if (assessment.started_at && assessment.time_limit_minutes) {
      const startTime = new Date(assessment.started_at);
      const now = new Date();
      const elapsedMinutes = Math.floor((now - startTime) / (1000 * 60));
      const remainingMinutes = Math.max(0, assessment.time_limit_minutes - elapsedMinutes);
      
      const hours = Math.floor(remainingMinutes / 60);
      const minutes = remainingMinutes % 60;
      
      if (hours > 0) {
        return `${hours}h ${minutes}m`;
      } else {
        return `${minutes}m`;
      }
    }

    return null;
  };

  // Get status icon
  const getStatusIcon = (assessment) => {
    const actualStatus = getActualStatus(assessment);
    switch (actualStatus) {
      case 'scheduled': return <Calendar className="h-4 w-4" />;
      case 'available': return <Play className="h-4 w-4" />;
      case 'in_progress': return <Clock3 className="h-4 w-4" />;
      case 'completed': return <CheckCircle className="h-4 w-4" />;
      case 'expired': return <XCircle className="h-4 w-4" />;
      case 'overdue': return <AlertTriangle className="h-4 w-4" />;
      default: return <FileText className="h-4 w-4" />;
    }
  };

  // Format date and time in user's timezone
  const formatDateTime = (dateString, timeString, assessmentTimezone) => {
    if (!dateString || !timeString || !assessmentTimezone) {
      return 'No time set';
    }

    try {
      return convertAssessmentTimeToUserTimezone(
        dateString, 
        timeString, 
        assessmentTimezone, 
        userTimezone
      );
    } catch (error) {
      return 'Invalid date';
    }
  };

  // Format date only
  const formatDate = (dateString, timeString, assessmentTimezone) => {
    if (!dateString || !timeString || !assessmentTimezone) {
      return 'No date set';
    }

    try {
      // Clean up the date string - extract just the date part if it's a full ISO datetime
      let cleanDateString = dateString;
      
      // If dateString contains time info (like T18:30:00.000Z), extract just the date part
      if (cleanDateString.includes('T')) {
        cleanDateString = cleanDateString.split('T')[0];
      }
      
      // Ensure we have a valid date format (YYYY-MM-DD)
      if (!/^\d{4}-\d{2}-\d{2}$/.test(cleanDateString)) {
        return 'Invalid date';
      }
      
      // Clean up the time string - remove any timezone info and ensure it's just HH:MM or HH:MM:SS
      let cleanTimeString = timeString;
      
      // If time string contains timezone info (like .000Z or T), extract just the time part
      if (cleanTimeString.includes('T')) {
        // Extract time part after the last T
        const parts = cleanTimeString.split('T');
        cleanTimeString = parts[parts.length - 1];
      }
      
      // Remove timezone suffix if present (like .000Z, +00:00, -05:00)
      cleanTimeString = cleanTimeString.replace(/[+-]\d{2}:\d{2}$/, ''); // Remove +00:00 or -05:00
      cleanTimeString = cleanTimeString.replace(/\.\d{3}Z?$/, ''); // Remove .000Z
      
      // Ensure we have a valid time format (HH:MM or HH:MM:SS)
      if (!/^\d{1,2}:\d{2}(:\d{2})?$/.test(cleanTimeString)) {
        return 'Invalid date';
      }
      
      const dateTimeString = `${cleanDateString}T${cleanTimeString}`;
      const date = new Date(dateTimeString);
      
      if (isNaN(date.getTime())) {
        return 'Invalid date';
      }

      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        timeZone: userTimezone
      });
    } catch (error) {
      return 'Invalid date';
    }
  };

  // Format time only
  const formatTime = (dateString, timeString, assessmentTimezone) => {
    if (!dateString || !timeString || !assessmentTimezone) {
      return 'No time set';
    }

    try {
      // Clean up the date string - extract just the date part if it's a full ISO datetime
      let cleanDateString = dateString;
      
      // If dateString contains time info (like T18:30:00.000Z), extract just the date part
      if (cleanDateString.includes('T')) {
        cleanDateString = cleanDateString.split('T')[0];
      }
      
      // Ensure we have a valid date format (YYYY-MM-DD)
      if (!/^\d{4}-\d{2}-\d{2}$/.test(cleanDateString)) {
        return 'Invalid time';
      }
      
      // Clean up the time string - remove any timezone info and ensure it's just HH:MM or HH:MM:SS
      let cleanTimeString = timeString;
      
      // If time string contains timezone info (like .000Z or T), extract just the time part
      if (cleanTimeString.includes('T')) {
        // Extract time part after the last T
        const parts = cleanTimeString.split('T');
        cleanTimeString = parts[parts.length - 1];
      }
      
      // Remove timezone suffix if present (like .000Z, +00:00, -05:00)
      cleanTimeString = cleanTimeString.replace(/[+-]\d{2}:\d{2}$/, ''); // Remove +00:00 or -05:00
      cleanTimeString = cleanTimeString.replace(/\.\d{3}Z?$/, ''); // Remove .000Z
      
      // Ensure we have a valid time format (HH:MM or HH:MM:SS)
      if (!/^\d{1,2}:\d{2}(:\d{2})?$/.test(cleanTimeString)) {
        return 'Invalid time';
      }
      
      const dateTimeString = `${cleanDateString}T${cleanTimeString}`;
      const date = new Date(dateTimeString);
      
      if (isNaN(date.getTime())) {
        return 'Invalid time';
      }

      return date.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
        timeZone: userTimezone
      });
    } catch (error) {
      return 'Invalid time';
    }
  };

  // Get time remaining until assessment starts/ends
  const getTimeRemainingLocal = (dateString, timeString, assessmentTimezone) => {
    if (!dateString || !timeString || !assessmentTimezone) {
      return { days: 0, hours: 0, minutes: 0 };
    }

    try {
      return getTimeRemaining(dateString, timeString, assessmentTimezone);
    } catch (error) {
      return { days: 0, hours: 0, minutes: 0 };
    }
  };

  // Get urgency color based on time remaining
  const getUrgencyColorLocal = (dateString, timeString, assessmentTimezone) => {
    if (!dateString || !timeString || !assessmentTimezone) {
      return 'text-gray-500';
    }

    try {
      const { days, hours, minutes } = getTimeRemainingLocal(dateString, timeString, assessmentTimezone);
      const totalMinutes = days * 24 * 60 + hours * 60 + minutes;

      if (totalMinutes <= 0) return 'text-red-600';
      if (totalMinutes <= 60) return 'text-red-500'; // Less than 1 hour
      if (totalMinutes <= 1440) return 'text-orange-500'; // Less than 24 hours
      if (totalMinutes <= 10080) return 'text-yellow-500'; // Less than 1 week
      return 'text-green-500';
    } catch (error) {
      return 'text-gray-500';
    }
  };

  // Handle starting an assessment
  const handleStartAssessment = (assessment) => {
    navigate(`/student/assessments/${assessment.id}/take`);
  };

  // Handle viewing results
  const handleViewResults = (assessment) => {
    // Check if assessment has submissions to show
    if (assessment.submissions && assessment.submissions.length > 0) {
    setSelectedAssessment(assessment);
    setShowAttemptsModal(true);
    } else {
      // If no submissions, navigate directly to results page
      navigate(`/student/assessments/${assessment.id}/results`);
    }
  };

  const handleViewSpecificAttempt = (assessmentId, attemptNumber) => {
    console.log('handleViewSpecificAttempt called with:', { assessmentId, attemptNumber });
    console.log('selectedAssessment:', selectedAssessment);
    
    // Use the selectedAssessment from modal state which has the submissions data
    if (selectedAssessment && selectedAssessment.submissions) {
      const submission = selectedAssessment.submissions.find(s => s.attempt_number === attemptNumber);
      console.log('Found submission:', submission);
      
      if (submission) {
        // Store the specific attempt data in localStorage so the results page can access it
        const attemptData = {
          assessmentId,
          attemptNumber,
          submission: {
            id: `${assessmentId}-attempt-${attemptNumber}`,
            attempt_number: attemptNumber,
            score: submission.score || 0,
            max_score: submission.max_score || 0,
            percentage_score: submission.percentage_score || 0,
            time_taken_minutes: submission.time_taken_minutes || 0,
            submitted_at: submission.submitted_at || '',
            status: submission.status || '',
            started_at: submission.started_at || ''
          }
        };
        
        localStorage.setItem('selectedAttemptData', JSON.stringify(attemptData));
        
        // Navigate to results page with attempt identifier
        const url = `/student/assessments/${assessmentId}/results?attempt=${attemptNumber}`;
        console.log('Navigating to:', url);
        navigate(url);
      } else {
        console.log('Submission not found, navigating to general results');
        // Fallback to general results page
        navigate(`/student/assessments/${assessmentId}/results`);
      }
    } else {
      console.log('No selectedAssessment or submissions, navigating to general results');
      // Fallback to general results page
      navigate(`/student/assessments/${assessmentId}/results`);
    }
  };

  // Handle resuming an assessment
  const handleResumeAssessment = (assessment) => {
    navigate(`/student/assessments/${assessment.id}/take`);
  };

  // Handle countdown completion - assessment becomes available
  const handleCountdownComplete = (assessmentId) => {
    setAvailableAssessments(prev => new Set([...prev, assessmentId]));
    
    // Show toast notification
    toast({
      title: "Assessment Available",
      description: "An assessment is now available to start!",
      duration: 5000,
    });
  };

  // Load attempts history for an assessment
  const loadAttemptsHistory = async (assessmentId) => {
    if (attemptsHistory[assessmentId]) return; // Already loaded
    
    try {
      setLoadingAttempts(prev => ({ ...prev, [assessmentId]: true }));
      const response = await apiService.getAssessmentAttemptsHistory(assessmentId);
      
      if (response.success) {
        setAttemptsHistory(prev => ({
          ...prev,
          [assessmentId]: response.data
        }));
      }
    } catch (error) {
      console.error('Error loading attempts history:', error);
      toast({
        title: "Error",
        description: "Failed to load attempts history",
        variant: "destructive",
      });
    } finally {
      setLoadingAttempts(prev => ({ ...prev, [assessmentId]: false }));
    }
  };

  // Auto-load attempts history for completed assessments
  useEffect(() => {
    const completedAssessments = assessments.filter(a => a.status === 'completed');
    completedAssessments.forEach(assessment => {
      if (!attemptsHistory[assessment.id]) {
        loadAttemptsHistory(assessment.id);
      }
    });
  }, [assessments]);

  // Cleanup localStorage when component unmounts
  useEffect(() => {
    return () => {
      // Clean up any stored attempt data when leaving the page
      localStorage.removeItem('selectedAttemptData');
    };
  }, []);

  // Get action button based on assessment status
  const getActionButton = (assessment) => {
    // Check if assessment has become available due to countdown completion
    const isNowAvailable = availableAssessments.has(assessment.id);
    
    // If assessment is now available (countdown reached zero), show start button
    if (isNowAvailable && assessment.status === 'scheduled') {
      return (
        <div className="space-y-2">
          <Button onClick={() => handleStartAssessment(assessment)} className="w-full bg-green-600 hover:bg-green-700">
            <Play className="mr-2 h-4 w-4" />
            Start Assessment Now
          </Button>
          <div className="text-center">
            <div className="text-xs text-green-600 font-medium">
              <CheckCircle className="inline h-3 w-3 mr-1" />
              Assessment is now available!
            </div>
          </div>
        </div>
      );
    }

    const actualStatus = getActualStatus(assessment);
    switch (actualStatus) {
      case 'available':
        // Check if this is a retake scenario
        // When assessment.is_retake is true, it means the student has completed this assessment before
        // and is now starting a new attempt (retake)
        if (assessment.is_retake) {
          return (
            <Button onClick={() => handleStartAssessment(assessment)} className="w-full bg-green-600 hover:bg-green-700">
              <Play className="mr-2 h-4 w-4" />
              Start New Attempt
            </Button>
          );
        }
        return (
          <Button onClick={() => handleStartAssessment(assessment)} className="w-full">
            <Play className="mr-2 h-4 w-4" />
            Start Assessment
          </Button>
        );
      case 'in_progress':
        const remainingTime = getRemainingTime(assessment);
        const canResume = canResumeAssessment(assessment);
        
        if (!canResume) {
          return (
            <div className="text-center text-sm text-gray-500">
              <Clock3 className="mx-auto h-4 w-4 mb-1" />
              Time Expired
            </div>
          );
        }
        
        return (
          <div className="space-y-2">
            <Button onClick={() => handleResumeAssessment(assessment)} className="w-full bg-orange-500 hover:bg-orange-600 text-white">
              <Play className="mr-2 h-4 w-4" />
              Resume Assessment
            </Button>
            {remainingTime && (
              <div className="text-center text-xs text-orange-600 font-medium">
                <Clock3 className="inline h-3 w-3 mr-1" />
                {remainingTime} remaining
              </div>
            )}
          </div>
        );
      case 'completed':
        // Check if student can retake this assessment
        const canRetake = assessment.max_attempts && assessment.current_attempts < assessment.max_attempts;
        
        return (
          <div className="space-y-2">
            <div className="flex space-x-2">
              <Button onClick={() => handleViewResults(assessment)} variant="outline" className="flex-1">
                <Eye className="mr-2 h-4 w-4" />
                View Results
              </Button>
              {attemptsHistory[assessment.id]?.can_retake && (
                <Button 
                  onClick={() => handleStartAssessment(assessment)} 
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                >
                  <Play className="mr-2 h-4 w-4" />
                  Retake
                </Button>
              )}
            </div>
          </div>
        );
      case 'scheduled':
        // Check if assessment has future start time and show countdown
        if (assessment.start_date_only && assessment.start_time_only && assessment.assessment_timezone) {
          
          return (
            <div className="space-y-2">
              <Button disabled className="w-full">
                <Clock className="mr-2 h-4 w-4" />
                Assessment Not Available
              </Button>
              <div className="text-center">
                <div className="text-xs text-gray-500 mb-1">Starts in:</div>
                <CountdownTimer 
                  startDate={assessment.start_date_only}
                  startTime={assessment.start_time_only}
                  timezone={assessment.assessment_timezone}
                  onCountdownComplete={() => handleCountdownComplete(assessment.id)}
                />
              </div>
            </div>
          );
        } else {
          // No start time set, show unavailable
          return (
            <Button disabled variant="outline" className="w-full">
              <Clock className="mr-2 h-4 w-4" />
              Assessment Not Available
            </Button>
          );
        }
      case 'assigned':
        // Check if assessment has expired based on end time
        if (assessment.end_date_only && assessment.end_time_only && assessment.assessment_timezone) {
          const endDate = parseDateTime(assessment.end_date_only, assessment.end_time_only);
          if (endDate) {
            const now = new Date();
            if (now > endDate) {
              // Assessment has expired
              return (
                <Button disabled variant="outline" className="w-full">
                  <XCircle className="mr-2 h-4 w-4" />
                  Assessment Expired
                </Button>
              );
            }
          }
        }
        
        // If not expired, show as available
        return (
          <Button onClick={() => handleStartAssessment(assessment)} className="w-full">
            <Play className="mr-2 h-4 w-4" />
            Start Assessment
          </Button>
        );
      case 'expired':
      case 'overdue':
        return (
          <Button disabled variant="outline" className="w-full">
            <XCircle className="mr-2 h-4 w-4" />
            Assessment Expired
          </Button>
        );
      default:
        return (
          <Button disabled variant="outline" className="w-full">
            <FileText className="mr-2 h-4 w-4" />
            Unavailable
          </Button>
        );
    }
  };

  // Calculate counts for tabs
  const getTabCounts = () => {
    const now = new Date();
    
    // Get all processed assessments without tab filtering for accurate counts
    const processedAssessments = getFilteredAssessments(false);
    
    const assignedCount = processedAssessments.filter(a => {
      // Check if assessment is actually expired based on end time
      if (a.end_date_only && a.end_time_only && a.assessment_timezone) {
        const endDate = parseDateTime(a.end_date_only, a.end_time_only);
        if (endDate && now > endDate) {
          return false; // Don't count as assigned if expired
        }
      }
      return ['assigned', 'scheduled', 'available', 'in_progress'].includes(a.status);
    }).length;
    
    const completedCount = processedAssessments.filter(a => a.status === 'completed').length;
    
    const expiredCount = processedAssessments.filter(a => {
      // Include assessments marked as expired/overdue
      if (['expired', 'overdue'].includes(a.status)) {
        return true;
      }
      // Also check if assessment has actually expired based on end time
      if (a.end_date_only && a.end_time_only && a.assessment_timezone) {
        const endDate = parseDateTime(a.end_date_only, a.end_time_only);
        return endDate && now > endDate;
      }
      return false;
    }).length;
    
    return { assignedCount, completedCount, expiredCount };
  };

  // Filter assessments based on current tab and filters
  const getFilteredAssessments = (applyTabFiltering = true) => {
    // Group assessments by ID and merge submission data
    const groupedAssessments = assessments.reduce((acc, assessment) => {
      if (!acc[assessment.id]) {
        // First time seeing this assessment, create base entry
        acc[assessment.id] = {
          ...assessment,
          submissions: [],
          latestSubmission: null
        };
      }
      
      // Add submission data if it exists
      if (assessment.submission_status) {
        acc[assessment.id].submissions.push({
          status: assessment.submission_status,
          score: assessment.score,
          max_score: assessment.max_score,
          percentage_score: assessment.percentage_score,
          time_taken_minutes: assessment.time_taken_minutes,
          started_at: assessment.started_at,
          submitted_at: assessment.submitted_at,
          attempt_number: assessment.attempt_number
        });
        
        // Track latest submission for status determination
        if (!acc[assessment.id].latestSubmission || 
            assessment.attempt_number > acc[assessment.id].latestSubmission.attempt_number) {
          acc[assessment.id].latestSubmission = {
            status: assessment.submission_status,
            score: assessment.score || 0,
            max_score: assessment.max_score || assessment.total_points || 0,
            percentage_score: assessment.percentage_score || 0,
            time_taken_minutes: assessment.time_taken_minutes || 0,
            started_at: assessment.started_at,
            submitted_at: assessment.submitted_at,
            attempt_number: assessment.attempt_number || 1
          };
        }
      }
      
      return acc;
    }, {});
    
    // Convert back to array and determine final status
    const processedAssessments = Object.values(groupedAssessments).map(assessment => {
      // Determine status based on latest submission
      if (assessment.latestSubmission) {
        if (assessment.latestSubmission.status === 'submitted' || assessment.latestSubmission.status === 'graded') {
          assessment.status = 'completed';
          assessment.submission_status = assessment.latestSubmission.status;
          assessment.score = assessment.latestSubmission.score || 0;
          assessment.max_score = assessment.latestSubmission.max_score || assessment.total_points || 0;
          assessment.percentage_score = assessment.latestSubmission.percentage_score || 0;
          assessment.time_taken_minutes = assessment.latestSubmission.time_taken_minutes || 0;
          assessment.started_at = assessment.latestSubmission.started_at;
          assessment.submitted_at = assessment.latestSubmission.submitted_at;
          assessment.attempt_number = assessment.latestSubmission.attempt_number;
        } else if (assessment.latestSubmission.status === 'in_progress') {
          assessment.status = 'in_progress';
          assessment.submission_status = assessment.latestSubmission.status;
        }
      } else {
        // No submissions yet - determine status based on timing
        const now = new Date();
        let startDateTime = null;
        let endDateTime = null;
        
        if (assessment.start_date_only && assessment.start_time_only) {
          try {
            const startDateTimeString = `${assessment.start_date_only}T${assessment.start_time_only}`;
            startDateTime = new Date(startDateTimeString);
          } catch (error) {
            console.warn('Error parsing start date:', error);
          }
        }
        
        if (assessment.end_date_only && assessment.end_time_only) {
          try {
            const endDateTimeString = `${assessment.end_date_only}T${assessment.end_time_only}`;
            endDateTime = new Date(endDateTimeString);
          } catch (error) {
            console.warn('Error parsing end date:', error);
          }
        }
        
        // Determine status based on timing
        if (endDateTime && now > endDateTime) {
          assessment.status = 'expired';
        } else if (startDateTime && now < startDateTime) {
          assessment.status = 'scheduled';
        } else {
          assessment.status = 'available';
        }
      }
      
      return assessment;
    });
    
    // If not applying tab filtering, return all processed assessments
    if (!applyTabFiltering) {
      return processedAssessments;
    }
    
    let filtered = processedAssessments;
    const now = new Date();

    // Filter by tab
    if (currentTab === 'assigned') {
      filtered = filtered.filter(assessment => {
        // Don't show expired assessments in assigned tab
        if (assessment.end_date_only && assessment.end_time_only && assessment.assessment_timezone) {
          const endDate = parseDateTime(assessment.end_date_only, assessment.end_time_only);
          if (endDate && now > endDate) {
            return false; // Don't show expired assessments
          }
        }
        return ['assigned', 'scheduled', 'available', 'in_progress'].includes(assessment.status);
      });
    } else if (currentTab === 'completed') {
      filtered = filtered.filter(assessment => assessment.status === 'completed');
    } else if (currentTab === 'expired') {
      filtered = filtered.filter(assessment => {
        // Include assessments marked as expired/overdue
        if (['expired', 'overdue'].includes(assessment.status)) {
          return true;
        }
        // Also include assessments that have actually expired based on end time
        if (assessment.end_date_only && assessment.end_time_only && assessment.assessment_timezone) {
          const endDate = parseDateTime(assessment.end_date_only, assessment.end_time_only);
          return endDate && now > endDate;
        }
        return false;
      });
    }

    // Filter by search term
    if (searchTerm.trim()) {
      filtered = filtered.filter(assessment =>
        assessment.title?.toLowerCase().includes(searchTerm.toLowerCase().trim()) ||
        assessment.description?.toLowerCase().includes(searchTerm.toLowerCase().trim())
      );
    }

    // Filter by status
    if (filterStatus !== 'all') {
      filtered = filtered.filter(assessment => assessment.status === filterStatus);
    }

    // Filter by type
    if (filterType !== 'all') {
      filtered = filtered.filter(assessment => assessment.assessment_type === filterType);
    }

    return filtered;
  };

  const filteredAssessments = getFilteredAssessments();
  const { assignedCount, completedCount, expiredCount } = getTabCounts();
  
  // Get processed assessments for counts
  const allAssessments = getFilteredAssessments(false);

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-muted-foreground">Loading your assessments...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">My Assessments</h1>
            <p className="text-muted-foreground">
              View and take your assigned assessments
            </p>
          </div>
          <div className="mt-4 sm:mt-0 flex space-x-2">
            <Button variant="outline" onClick={loadAssessments}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Refresh
            </Button>
          </div>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Filter className="mr-2 h-4 w-4" />
              Filters & Search
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
              <div>
                <label className="text-sm font-medium">Search</label>
                <Input
                  placeholder="Search assessments..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <div>
                <label className="text-sm font-medium">Status</label>
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="scheduled">Scheduled</SelectItem>
                    <SelectItem value="available">Available</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="expired">Expired</SelectItem>
                    <SelectItem value="overdue">Overdue</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium">Type</label>
                <Select value={filterType} onValueChange={setFilterType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="quiz">Quiz</SelectItem>
                    <SelectItem value="test">Test</SelectItem>
                    <SelectItem value="exam">Exam</SelectItem>
                    <SelectItem value="assignment">Assignment</SelectItem>
                    <SelectItem value="coding_challenge">Coding Challenge</SelectItem>
                    <SelectItem value="survey">Survey</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-end">
                <div className="text-sm text-gray-500">
                  Timezone: {userTimezone}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Assessment Tabs */}
        <Tabs value={currentTab} onValueChange={setCurrentTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 h-auto p-1">
            <TabsTrigger value="assigned" className="text-xs sm:text-sm py-2 px-3">
              Assigned ({assignedCount})
            </TabsTrigger>
            <TabsTrigger value="completed" className="text-xs sm:text-sm py-2 px-3">
              Completed ({completedCount})
            </TabsTrigger>
            <TabsTrigger value="expired" className="text-xs sm:text-sm py-2 px-3">
              Expired ({expiredCount})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="assigned" className="space-y-4">
            <div className="grid gap-3 sm:gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
              {filteredAssessments.map((assessment, index) => (
                <motion.div
                  key={`${assessment.id}-${assessment.submission_status || 'no-submission'}-${index}`}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.3 }}
                >
                  <Card className="h-full hover:shadow-lg transition-shadow">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between gap-3">
                        {/* Title and Icon */}
                        <div className="flex items-start space-x-2 flex-1 min-w-0">
                          <BookOpen className="h-4 w-4 text-blue-600 flex-shrink-0 mt-1" />
                          <CardTitle className="text-base line-clamp-2 leading-tight">{assessment.title}</CardTitle>
                        </div>
                        
                        {/* Status Badge */}
                        <Badge className={`${getStatusColor(assessment)} text-xs shrink-0`}>
                          {getStatusIcon(assessment)}
                          <span className="ml-1">
                            {getActualStatus(assessment)}
                            {assessment.submission_status === 'in_progress' && canResumeAssessment(assessment) && ' (Resumable)'}
                          </span>
                        </Badge>
                      </div>
                      
                      {/* Retake Badge and Description */}
                      <div className="flex items-center justify-between mt-2">
                        {assessment.is_retake && (
                          <Badge variant="secondary" className="text-xs bg-green-100 text-green-700 border-green-200">
                            Retake
                          </Badge>
                        )}
                        {assessment.description && (
                          <CardDescription className="line-clamp-1 text-xs text-gray-600 ml-auto">
                        {assessment.description}
                      </CardDescription>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {/* Assessment Details - Compact Grid */}
                      <div className="grid grid-cols-4 gap-2 text-xs">
                        <div className="flex flex-col items-center p-1.5 bg-gray-50 rounded">
                          <Target className="h-3 w-3 text-blue-600 mb-0.5" />
                          <span className="text-gray-500">Points</span>
                          <span className="font-semibold text-gray-900">
                            {assessment.total_points || 0}
                          </span>
                        </div>
                        <div className="flex flex-col items-center p-1.5 bg-gray-50 rounded">
                          <Timer className="h-3 w-3 text-orange-600 mb-0.5" />
                          <span className="text-gray-500">Time</span>
                          <span className="font-semibold text-gray-900">
                            {assessment.time_limit_minutes || 0}m
                          </span>
                        </div>
                        <div className="flex flex-col items-center p-1.5 bg-gray-50 rounded">
                          <Users className="h-3 w-3 text-purple-600 mb-0.5" />
                          <span className="text-gray-500">Type</span>
                          <span className="font-semibold text-gray-900 capitalize">
                            {assessment.assessment_type?.replace('_', ' ')}
                          </span>
                        </div>
                        <div className="flex flex-col items-center p-1.5 bg-gray-50 rounded">
                          <Award className="h-3 w-3 text-green-600 mb-0.5" />
                          <span className="text-gray-500">Pass</span>
                          <span className="font-semibold text-gray-900">
                            {assessment.passing_score || 0}%
                          </span>
                        </div>
                      </div>

                      {/* Time Information - Compact */}
                      {assessment.start_date_only && assessment.start_time_only && assessment.assessment_timezone && (
                        <div className="p-2 bg-blue-50 rounded border border-blue-200">
                          <div className="grid grid-cols-2 gap-2 text-xs">
                            <div className="flex items-center justify-between">
                              <span className="text-gray-600">Start:</span>
                              <span className={`font-medium ${getUrgencyColorLocal(assessment.start_date_only, assessment.start_time_only, assessment.assessment_timezone)}`}>
                                {formatDateTime(assessment.start_date_only, assessment.start_time_only, assessment.assessment_timezone)}
                              </span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-gray-600">End:</span>
                              <span className={`font-medium ${getUrgencyColorLocal(assessment.end_date_only, assessment.end_time_only, assessment.assessment_timezone)}`}>
                                {formatDateTime(assessment.end_date_only, assessment.end_time_only, assessment.assessment_timezone)}
                              </span>
                            </div>
                          </div>
                          
                          {/* Time Remaining - Compact */}
                          {assessment.status === 'scheduled' && (
                            <div className="text-center mt-2 p-1.5 bg-blue-100 rounded border border-blue-300">
                              <span className="text-xs font-medium text-blue-800">
                              {(() => {
                                const { days, hours, minutes } = getTimeRemainingLocal(
                                  assessment.start_date_only, 
                                  assessment.start_time_only, 
                                  assessment.assessment_timezone
                                );
                                  if (days > 0) return `⏰ ${days}d ${hours}h`;
                                  if (hours > 0) return `⏰ ${hours}h ${minutes}m`;
                                  if (minutes > 0) return `⏰ ${minutes}m`;
                                  return '🚀 Soon';
                              })()}
                              </span>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Action Button - Mobile Optimized */}
                      <div className="pt-3">
                        <div className="w-full">
                        {getActionButton(assessment)}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>

            {filteredAssessments.length === 0 && (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <BookOpen className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No assessments found</h3>
                  <p className="text-muted-foreground text-center mb-4">
                    {searchTerm || filterStatus !== 'all' || filterType !== 'all'
                      ? 'Try adjusting your filters or search terms'
                      : 'You don\'t have any assigned assessments yet'}
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="completed" className="space-y-4">
            <div className="grid gap-3 sm:gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
              {filteredAssessments.map((assessment, index) => (
                <motion.div
                  key={`${assessment.id}-${assessment.submission_status || 'no-submission'}-${index}`}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.3 }}
                >
                  <Card className="h-full hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex items-center space-x-2">
                          <CheckCircle className="h-5 w-5 text-green-600" />
                          <CardTitle className="text-lg line-clamp-2">{assessment.title}</CardTitle>
                        </div>
                        <Badge className="bg-green-100 text-green-800">
                          <CheckCircle className="mr-1 h-3 w-3" />
                          Completed
                        </Badge>
                      </div>
                      <CardDescription className="line-clamp-2">
                        {assessment.description}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {/* Score Information - Compact */}
                      <div className="space-y-2">
                        {/* Score Display - Compact */}
                        <div className="bg-green-50 border border-green-200 rounded p-2">
                        <div className="flex items-center justify-between text-sm">
                            <span className="text-green-800 font-medium">Score</span>
                            <span className="text-green-900 font-bold">
                              {(() => {
                                const score = assessment.latestSubmission?.score || assessment.score || 0;
                                const maxScore = assessment.latestSubmission?.max_score || assessment.max_score || assessment.total_points || 0;
                                
                                if (score === 0 && maxScore > 0 && assessment.latestSubmission?.percentage_score) {
                                  const calculatedScore = Math.round((assessment.latestSubmission.percentage_score / 100) * maxScore);
                                  return `${calculatedScore}/${maxScore}`;
                                }
                                
                                return `${score}/${maxScore}`;
                              })()}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                            <span className="text-green-700">Percentage</span>
                            <span className="text-green-900 font-bold">
                              {(() => {
                                let percentage = assessment.latestSubmission?.percentage_score || assessment.percentage_score || 0;
                                
                                if (percentage === 0) {
                                  const score = assessment.latestSubmission?.score || assessment.score || 0;
                                  const maxScore = assessment.latestSubmission?.max_score || assessment.max_score || assessment.total_points || 0;
                                  if (score > 0 && maxScore > 0) {
                                    percentage = Math.round((score / maxScore) * 100);
                                  }
                                }
                                
                                return `${percentage}%`;
                              })()}
                          </span>
                        </div>
                        </div>
                        
                        {/* Metrics Grid - Compact */}
                        <div className="grid grid-cols-3 gap-2 text-xs">
                          <div className="flex flex-col items-center p-1.5 bg-blue-50 rounded border border-blue-200">
                            <Clock className="h-3 w-3 text-blue-600 mb-0.5" />
                            <span className="text-blue-700">Time</span>
                            <span className="font-semibold text-blue-900">
                              {(() => {
                                const time = assessment.latestSubmission?.time_taken_minutes || assessment.time_taken_minutes || 0;
                                return `${time}m`;
                              })()}
                          </span>
                          </div>
                          <div className="flex flex-col items-center p-1.5 bg-purple-50 rounded border border-purple-200">
                            <Target className="h-3 w-3 text-purple-600 mb-0.5" />
                            <span className="text-purple-700">Attempts</span>
                            <span className="font-semibold text-purple-900">
                              {assessment.submissions?.length || 1}
                            </span>
                          </div>
                          <div className="flex flex-col items-center p-1.5 bg-gray-50 rounded border border-gray-200">
                            <Award className="h-3 w-3 text-gray-600 mb-0.5" />
                            <span className="text-gray-700">Performance</span>
                            <span className={`font-semibold ${
                              (() => {
                                const percentage = assessment.latestSubmission?.percentage_score || assessment.percentage_score || 0;
                                if (percentage >= 90) return 'text-green-600';
                                if (percentage >= 80) return 'text-green-600';
                                if (percentage >= 70) return 'text-yellow-600';
                                if (percentage >= 60) return 'text-orange-600';
                                if (percentage > 0) return 'text-red-600';
                                return 'text-gray-600';
                              })()
                            }`}>
                              {(() => {
                                const percentage = assessment.latestSubmission?.percentage_score || assessment.percentage_score || 0;
                                if (percentage >= 90) return 'Excellent';
                                if (percentage >= 80) return 'Good';
                                if (percentage >= 70) return 'Average';
                                if (percentage >= 60) return 'Below Avg';
                                if (percentage > 0) return 'Needs Work';
                                return 'N/A';
                              })()}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Completion Date */}
                      {assessment.latestSubmission?.submitted_at && (
                        <div className="text-sm text-gray-500">
                          Latest Completion: {new Date(assessment.latestSubmission.submitted_at).toLocaleDateString()}
                        </div>
                      )}

                      {/* Action Buttons - Compact */}
                      <div className="pt-2">
                        <div className="flex space-x-2">
                          {assessment.latestSubmission && assessment.latestSubmission.status === 'in_progress' && canResumeAssessment(assessment) ? (
                            <>
                              <Button onClick={() => handleResumeAssessment(assessment)} size="sm" className="flex-1 bg-orange-500 hover:bg-orange-600 text-white text-xs">
                                <Play className="mr-1 h-3 w-3" />
                                Resume
                              </Button>
                              {getRemainingTime(assessment) && (
                                <div className="text-xs text-orange-600 font-medium flex items-center">
                                  <Clock3 className="h-3 w-3 mr-1" />
                                  {getRemainingTime(assessment)}
                                </div>
                              )}
                            </>
                          ) : (
                            <>
                              <Button onClick={() => handleViewResults(assessment)} variant="outline" size="sm" className="flex-1 text-xs">
                                <Eye className="mr-1 h-3 w-3" />
                                View Results
                              </Button>
                              {assessment.latestSubmission && 
                               assessment.latestSubmission.status === 'submitted' && 
                               assessment.submissions.length < (assessment.max_attempts || 999) && (
                                <Button 
                                  onClick={() => handleStartAssessment(assessment)} 
                                  size="sm"
                                  className="flex-1 bg-green-600 hover:bg-green-700 text-white text-xs"
                                >
                                  <Play className="mr-1 h-3 w-3" />
                                  Retake
                                </Button>
                              )}
                            </>
                          )}
                        </div>
                      </div>

                      {/* Attempts History */}
                        {assessment.submissions && assessment.submissions.length > 0 && (
                          <div className="mt-3">
                            <Collapsible>
                              <CollapsibleTrigger asChild>
                                <Button 
                                  variant="ghost" 
                                  size="sm"
                                  className="w-full justify-between p-2 bg-gray-50 hover:bg-gray-100 rounded border text-xs"
                                >
                                  <span className="font-medium text-gray-700">
                                    Attempts History ({assessment.submissions.length})
                                  </span>
                                  <ChevronDown className="h-3 w-3 text-gray-500" />
                                </Button>
                              </CollapsibleTrigger>
                              <CollapsibleContent>
                                <div className="mt-2 p-2 bg-gray-50 rounded border">
                          <div className="space-y-2">
                                    {assessment.submissions
                                      .sort((a, b) => b.attempt_number - a.attempt_number) // Show latest first
                                      .map((submission, index) => (
                                        <div key={`${assessment.id}-attempt-${submission.attempt_number}`} className="bg-white rounded border p-2 space-y-2">
                                          {/* Attempt Header - Compact */}
                                          <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-2">
                                              <span className="font-medium text-xs text-gray-900">
                                                Attempt {submission.attempt_number}
                                  </span>
                                              {submission.status === 'submitted' && (
                                                <Badge variant="outline" className="text-xs bg-green-100 text-green-700 border-green-200 px-1 py-0.5">
                                                  ✓
                                                </Badge>
                                              )}
                                              {submission.status === 'in_progress' && (
                                                <Badge variant="outline" className="text-xs bg-yellow-100 text-yellow-700 border-yellow-200 px-1 py-0.5">
                                                  ⏳
                                                </Badge>
                                              )}
                                </div>
                                <span className="text-xs text-gray-500">
                                              {submission.submitted_at ? 
                                                new Date(submission.submitted_at).toLocaleDateString() : 
                                                'Not submitted'
                                              }
                                </span>
                          </div>
                          
                                          {/* Attempt Details - Compact Grid */}
                                          <div className="grid grid-cols-3 gap-2 text-xs">
                                            <div className="text-center">
                                              <span className="text-gray-500 block">Score</span>
                                              <span className="font-semibold text-gray-900">
                                                {submission.percentage_score || 0}%
                                              </span>
                              </div>
                                            <div className="text-center">
                                              <span className="text-gray-500 block">Time</span>
                                              <span className="font-semibold text-gray-900">
                                                {submission.time_taken_minutes || 0}m
                                              </span>
                                            </div>
                                            <div className="text-center">
                              <Button 
                                                variant="outline"
                                size="sm" 
                                                className="w-full text-xs h-6 px-1"
                                                onClick={() => handleViewSpecificAttempt(assessment.id, submission.attempt_number)}
                              >
                                                View
                              </Button>
                            </div>
                              </div>
                            </div>
                                      ))}
                                  </div>
                                </div>
                              </CollapsibleContent>
                            </Collapsible>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>

            {filteredAssessments.length === 0 && (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <CheckCircle className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No completed assessments</h3>
                  <p className="text-muted-foreground text-center mb-4">
                    {searchTerm || filterStatus !== 'all' || filterType !== 'all'
                      ? 'Try adjusting your filters or search terms'
                      : 'You haven\'t completed any assessments yet'}
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="expired" className="space-y-4">
            <div className="grid gap-3 sm:gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
              {filteredAssessments.map((assessment, index) => (
                <motion.div
                  key={`${assessment.id}-${assessment.submission_status || 'no-submission'}-${index}`}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.3 }}
                >
                  <Card className="h-full hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex items-center space-x-2">
                          <XCircle className="h-5 w-5 text-red-600" />
                          <CardTitle className="text-lg line-clamp-2">{assessment.title}</CardTitle>
                        </div>
                        <Badge className="bg-red-100 text-red-800">
                          <XCircle className="mr-1 h-3 w-3" />
                          {assessment.status}
                        </Badge>
                      </div>
                      <CardDescription className="line-clamp-2">
                        {assessment.description}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {/* Assessment Details */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-600">Type:</span>
                          <span className="font-medium">{assessment.assessment_type}</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-600">Points:</span>
                          <span className="font-medium">{assessment.total_points || 0}</span>
                        </div>
                      </div>

                      {/* Expired Date */}
                      {assessment.end_date_only && assessment.end_time_only && assessment.assessment_timezone && (
                        <div className="text-sm text-gray-500">
                          Expired: {formatDateTime(assessment.end_date_only, assessment.end_time_only, assessment.assessment_timezone)}
                        </div>
                      )}

                      {/* Action Button */}
                      <div className="pt-2">
                        <Button disabled variant="outline" className="w-full">
                          <XCircle className="mr-2 h-4 w-4" />
                          Assessment Expired
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>

            {filteredAssessments.length === 0 && (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <XCircle className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No expired assessments</h3>
                  <p className="text-muted-foreground text-center mb-4">
                    {searchTerm || filterStatus !== 'all' || filterType !== 'all'
                      ? 'Try adjusting your filters or search terms'
                      : 'You don\'t have any expired assessments'}
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </motion.div>

      {/* Attempts History Modal */}
      {showAttemptsModal && selectedAssessment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-xl font-semibold">Assessment Results</h2>
                <p className="text-sm text-gray-600 mt-1">
                  {selectedAssessment.title} - {selectedAssessment.submissions?.length || 0} attempt{selectedAssessment.submissions?.length !== 1 ? 's' : ''}
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setShowAttemptsModal(false);
                  // Clear any stored attempt data when closing modal
                  localStorage.removeItem('selectedAttemptData');
                }}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            
            <div className="space-y-3">
              {selectedAssessment.submissions && selectedAssessment.submissions.length > 0 ? (
                selectedAssessment.submissions
                  .sort((a, b) => b.attempt_number - a.attempt_number) // Show latest first
                  .map((submission) => (
                <div
                      key={`${selectedAssessment.id}-attempt-${submission.attempt_number}`}
                  className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 cursor-pointer"
                      onClick={() => handleViewSpecificAttempt(selectedAssessment.id, submission.attempt_number)}
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <span className="text-sm font-medium text-blue-600">
                            {submission.attempt_number}
                      </span>
                    </div>
                    <div>
                          <div className="font-medium">Attempt {submission.attempt_number}</div>
                      <div className="text-sm text-gray-500">
                            {submission.percentage_score || 0}% • {submission.time_taken_minutes || 0} min
                      </div>
                    </div>
                  </div>
                  <div className="text-xs text-gray-400">
                        {submission.submitted_at ? 
                          new Date(submission.submitted_at).toLocaleDateString() : 
                          'Not submitted'
                        }
                  </div>
                </div>
                  ))
              ) : (
                <div className="text-center text-gray-500 py-4">
                  No attempts found for this assessment.
                </div>
              )}
            </div>
            
            <div className="mt-4 pt-4 border-t space-y-2">
              <Button
                variant="outline"
                className="w-full"
                onClick={() => navigate(`/student/assessments/${selectedAssessment.id}/results`)}
              >
                <Eye className="mr-2 h-4 w-4" />
                View All Results
              </Button>
              <Button
                variant="ghost"
                className="w-full"
                onClick={() => {
                  setShowAttemptsModal(false);
                  // Clear any stored attempt data when closing modal
                  localStorage.removeItem('selectedAttemptData');
                }}
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentAssessmentListPage; 