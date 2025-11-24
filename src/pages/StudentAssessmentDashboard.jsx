import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/ui/use-toast';
import apiService from '@/services/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Play, 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  Search, 
  Filter, 
  RefreshCw, 
  BookOpen, 
  Award, 
  Timer, 
  History, 
  Eye,
  Calendar,
  Target,
  Users,
  FileText,
  Code,
  BarChart3,
  TrendingUp,
  Star,
  Zap,
  Shield,
  Globe,
  Smartphone,
  Monitor
} from 'lucide-react';
import apiService from '@/services/api';
import { 
  convertAssessmentTimeToUserTimezone, 
  getUserTimezone,
  getTimeRemaining,
  isDateInPast,
  isDateInFuture
} from '@/lib/timezone-utils';

// Enhanced Countdown Timer Component
const CountdownTimer = ({ startDate, startTime, timezone, onCountdownComplete, compact = false }) => {
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    const calculateTimeLeft = () => {
      if (!startDate || !startTime || !timezone) {
        return { days: 0, hours: 0, minutes: 0, seconds: 0 };
      }

      try {
        let cleanStartDate = startDate;
        let cleanStartTime = startTime;
        
        if (cleanStartDate.includes('T')) {
          cleanStartDate = cleanStartDate.split('T')[0];
        }
        
        if (cleanStartTime.includes('T')) {
          const parts = cleanStartTime.split('T');
          cleanStartTime = parts[parts.length - 1];
        }
        
        cleanStartTime = cleanStartTime.replace(/[+-]\d{2}:\d{2}$/, '');
        cleanStartTime = cleanStartTime.replace(/\.\d{3}Z?$/, '');
        
        if (!/^\d{4}-\d{2}-\d{2}$/.test(cleanStartDate) || !/^\d{1,2}:\d{2}(:\d{2})?$/.test(cleanStartTime)) {
          return { days: 0, hours: 0, minutes: 0, seconds: 0 };
        }
        
        const dateTimeString = `${cleanStartDate}T${cleanStartTime}`;
        const assessmentDate = new Date(dateTimeString);
        const now = new Date();
        
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

  if (compact) {
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
  }

  return (
    <div className="flex items-center gap-2">
      {timeLeft.days > 0 && (
        <div className="flex items-center gap-1 bg-blue-100 text-blue-800 px-2 py-1 rounded-md">
          <span className="font-bold text-lg">{timeLeft.days}</span>
          <span className="text-sm">days</span>
        </div>
      )}
      {timeLeft.hours > 0 && (
        <div className="flex items-center gap-1 bg-green-100 text-green-800 px-2 py-1 rounded-md">
          <span className="font-bold text-lg">{formatTime(timeLeft.hours)}</span>
          <span className="text-sm">hrs</span>
        </div>
      )}
      {timeLeft.minutes > 0 && (
        <div className="flex items-center gap-1 bg-orange-100 text-orange-800 px-2 py-1 rounded-md">
          <span className="font-bold text-lg">{formatTime(timeLeft.minutes)}</span>
          <span className="text-sm">min</span>
        </div>
      )}
      {timeLeft.seconds > 0 && (
        <div className="flex items-center gap-1 bg-red-100 text-red-800 px-2 py-1 rounded-md">
          <span className="font-bold text-lg">{formatTime(timeLeft.seconds)}</span>
          <span className="text-sm">sec</span>
        </div>
      )}
    </div>
  );
};

// Enhanced Assessment Card Component
const AssessmentCard = ({ assessment, onStart, onResume, onViewResults, onRetake, userTimezone }) => {
  const [isHovered, setIsHovered] = useState(false);
  
  const getStatusInfo = (assessment) => {
    const now = new Date();
    let status = assessment.status;
    let color = 'gray';
    let icon = FileText;
    let message = '';

    // Check if assessment has expired
    if (assessment.end_date_only && assessment.end_time_only && assessment.assessment_timezone) {
      const endDate = new Date(`${assessment.end_date_only}T${assessment.end_time_only}`);
      if (now > endDate) {
        status = 'expired';
      }
    }

    switch (status) {
      case 'scheduled':
        color = 'blue';
        icon = Clock;
        message = 'Scheduled';
        break;
      case 'available':
        color = 'green';
        icon = Play;
        message = 'Available';
        break;
      case 'in_progress':
        color = 'orange';
        icon = Timer;
        message = 'In Progress';
        break;
      case 'completed':
        color = 'purple';
        icon = CheckCircle;
        message = 'Completed';
        break;
      case 'expired':
        color = 'red';
        icon = XCircle;
        message = 'Expired';
        break;
      default:
        color = 'gray';
        icon = FileText;
        message = 'Unknown';
    }

    return { status, color, icon: icon, message };
  };

  const statusInfo = getStatusInfo(assessment);
  const IconComponent = statusInfo.icon;

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

  const getActionButton = () => {
    switch (statusInfo.status) {
      case 'available':
        return (
          <Button 
            onClick={() => onStart(assessment)} 
            className="w-full bg-green-600 hover:bg-green-700"
          >
            <Play className="mr-2 h-4 w-4" />
            Start Assessment
          </Button>
        );
      case 'in_progress':
        return (
          <Button 
            onClick={() => onResume(assessment)} 
            className="w-full bg-orange-600 hover:bg-orange-700"
          >
            <Play className="mr-2 h-4 w-4" />
            Resume Assessment
          </Button>
        );
      case 'completed':
        return (
          <div className="flex gap-2">
            <Button 
              onClick={() => onViewResults(assessment)} 
              variant="outline" 
              className="flex-1"
            >
              <Eye className="mr-2 h-4 w-4" />
              View Results
            </Button>
            {assessment.can_retake && (
              <Button 
                onClick={() => onRetake(assessment)} 
                className="flex-1 bg-green-600 hover:bg-green-700"
              >
                <Play className="mr-2 h-4 w-4" />
                Retake
              </Button>
            )}
          </div>
        );
      case 'active':
        // Handle both new attempts and retake scenarios
        if (assessment.submission_status === 'completed' && assessment.can_retake) {
          return (
            <div className="flex gap-2">
              <Button 
                onClick={() => onViewResults(assessment)} 
                variant="outline" 
                className="flex-1"
              >
                <Eye className="mr-2 h-4 w-4" />
                View Results
              </Button>
              <Button 
                onClick={() => onRetake(assessment)} 
                className="flex-1 bg-green-600 hover:bg-green-700"
              >
                <Play className="mr-2 h-4 w-4" />
                Retake
              </Button>
            </div>
          );
        } else if (assessment.can_attempt) {
          return (
            <Button 
              onClick={() => onStart(assessment)} 
              className="w-full bg-green-600 hover:bg-green-700"
            >
              <Play className="mr-2 h-4 w-4" />
              Start Assessment
            </Button>
          );
        } else {
          return (
            <Button disabled variant="outline" className="w-full">
              <FileText className="mr-2 h-4 w-4" />
              Unavailable
            </Button>
          );
        }
      case 'scheduled':
        return (
          <Button disabled className="w-full">
            <Clock className="mr-2 h-4 w-4" />
            Not Available Yet
          </Button>
        );
      case 'expired':
        return (
          <Button disabled variant="outline" className="w-full">
            <XCircle className="mr-2 h-4 w-4" />
            Expired
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

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4 }}
      transition={{ duration: 0.2 }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
    >
      <Card className={`h-full transition-all duration-200 ${
        isHovered ? 'shadow-xl border-primary' : 'hover:shadow-lg'
      }`}>
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-2 flex-1 min-w-0">
              <IconComponent className={`h-5 w-5 text-${statusInfo.color}-600 flex-shrink-0`} />
              <div className="min-w-0 flex-1">
                <CardTitle className="text-lg line-clamp-2 leading-tight">
                  {assessment.title}
                </CardTitle>
                <CardDescription className="line-clamp-1 mt-1">
                  {assessment.description}
                </CardDescription>
              </div>
            </div>
            <Badge className={`bg-${statusInfo.color}-100 text-${statusInfo.color}-800 border-${statusInfo.color}-200`}>
              {statusInfo.message}
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Assessment Details Grid */}
          <div className="grid grid-cols-2 gap-3">
            <div className="flex items-center space-x-2 text-sm">
              <Target className="h-4 w-4 text-blue-600" />
              <span className="text-gray-600">Points:</span>
              <span className="font-semibold">{assessment.total_points || 0}</span>
            </div>
            <div className="flex items-center space-x-2 text-sm">
              <Timer className="h-4 w-4 text-orange-600" />
              <span className="text-gray-600">Duration:</span>
              <span className="font-semibold">{assessment.time_limit_minutes || 0}m</span>
            </div>
            <div className="flex items-center space-x-2 text-sm">
              <Award className="h-4 w-4 text-purple-600" />
              <span className="text-gray-600">Pass:</span>
              <span className="font-semibold">{assessment.passing_score || 0}%</span>
            </div>
            <div className="flex items-center space-x-2 text-sm">
              <Users className="h-4 w-4 text-green-600" />
              <span className="text-gray-600">Type:</span>
              <span className="font-semibold capitalize">
                {assessment.assessment_type?.replace('_', ' ')}
              </span>
            </div>
          </div>

          {/* Time Information */}
          {assessment.start_date_only && assessment.start_time_only && assessment.assessment_timezone && (
            <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Start:</span>
                  <span className="font-medium">
                    {formatDateTime(assessment.start_date_only, assessment.start_time_only, assessment.assessment_timezone)}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">End:</span>
                  <span className="font-medium">
                    {formatDateTime(assessment.end_date_only, assessment.end_time_only, assessment.assessment_timezone)}
                  </span>
                </div>
                
                {/* Countdown Timer */}
                {statusInfo.status === 'scheduled' && (
                  <div className="pt-2 border-t border-blue-200">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Starts in:</span>
                      <CountdownTimer 
                        startDate={assessment.start_date_only}
                        startTime={assessment.start_time_only}
                        timezone={assessment.assessment_timezone}
                        compact={true}
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Proctoring Indicator */}
          {assessment.require_proctoring && (
            <div className="flex items-center space-x-2 text-sm text-amber-600 bg-amber-50 px-3 py-2 rounded-lg">
              <Shield className="h-4 w-4" />
              <span>Proctoring Enabled</span>
            </div>
          )}

          {/* Action Button */}
          <div className="pt-2">
            {getActionButton()}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

// Performance Stats Component
const PerformanceStats = ({ assessments }) => {
  const stats = useMemo(() => {
    const completed = assessments.filter(a => a.status === 'completed').length;
    const total = assessments.length;
    const averageScore = assessments
      .filter(a => a.status === 'completed' && a.percentage_score)
      .reduce((sum, a) => sum + (a.percentage_score || 0), 0) / completed || 0;
    
    return {
      completed,
      total,
      completionRate: total > 0 ? (completed / total) * 100 : 0,
      averageScore: Math.round(averageScore)
    };
  }, [assessments]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Completed</p>
              <p className="text-2xl font-bold">{stats.completed}/{stats.total}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <TrendingUp className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Completion Rate</p>
              <p className="text-2xl font-bold">{stats.completionRate.toFixed(1)}%</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Award className="h-6 w-6 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Average Score</p>
              <p className="text-2xl font-bold">{stats.averageScore}%</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

// Main Dashboard Component
const StudentAssessmentDashboard = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  // State management
  const [assessments, setAssessments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterType, setFilterType] = useState('all');
  const [currentTab, setCurrentTab] = useState('all');
  const [userTimezone, setUserTimezone] = useState('UTC');
  const [availableAssessments, setAvailableAssessments] = useState(new Set());

  useEffect(() => {
    if (user) {
      const timezone = getUserTimezone(user);
      setUserTimezone(timezone);
    }
    loadAssessments();
  }, [user]);

  const loadAssessments = async () => {
    try {
      setLoading(true);
      const response = await apiService.getAssessmentInstances({ student_id: user.id });
      
      if (response.success) {
        const newAssessments = response.data;
        
        // Check for assessments that should be available
        const now = new Date();
        const newlyAvailable = new Set();
        
        newAssessments.forEach(assessment => {
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

  const filteredAssessments = useMemo(() => {
    let filtered = assessments;

    // Filter by tab
    if (currentTab === 'upcoming') {
      filtered = filtered.filter(a => a.status === 'scheduled' || a.status === 'available');
    } else if (currentTab === 'in_progress') {
      filtered = filtered.filter(a => a.status === 'in_progress');
    } else if (currentTab === 'completed') {
      filtered = filtered.filter(a => a.status === 'completed');
    } else if (currentTab === 'expired') {
      filtered = filtered.filter(a => a.status === 'expired');
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
  }, [assessments, currentTab, searchTerm, filterStatus, filterType]);

  const getTabCounts = () => {
    const upcoming = assessments.filter(a => a.status === 'scheduled' || a.status === 'available').length;
    const inProgress = assessments.filter(a => a.status === 'in_progress').length;
    const completed = assessments.filter(a => a.status === 'completed').length;
    const expired = assessments.filter(a => a.status === 'expired').length;
    
    return { upcoming, inProgress, completed, expired };
  };

  const handleStartAssessment = (assessment) => {
    navigate(`/student/assessments/${assessment.id}/take`);
  };

  const handleResumeAssessment = (assessment) => {
    navigate(`/student/assessments/${assessment.id}/take`);
  };

  const handleViewResults = (assessment) => {
    navigate(`/student/assessments/${assessment.id}/results`);
  };

  const handleRetakeAssessment = async (assessment) => {
    try {
      // Set retake flag BEFORE calling API
      localStorage.setItem(`retake_${assessment.id}`, 'true');
      console.log('Retake flag set:', `retake_${assessment.id}`);
      
      // Navigate to assessment taking page
      navigate(`/student/assessments/${assessment.id}/take`);
    } catch (error) {
      // Clear the flag if retake failed
      localStorage.removeItem(`retake_${assessment.id}`);
      console.error('Error starting retake:', error);
      toast({
        title: "Retake Failed",
        description: error.message || "Failed to start assessment retake",
        variant: "destructive",
        duration: 5000
      });
    }
  };

  const handleCountdownComplete = (assessmentId) => {
    setAvailableAssessments(prev => new Set([...prev, assessmentId]));
    
    toast({
      title: "Assessment Available",
      description: "An assessment is now available to start!",
      duration: 5000,
    });
  };

  const { upcoming, inProgress, completed, expired } = getTabCounts();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading your assessments...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 py-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">My Assessments</h1>
              <p className="text-muted-foreground mt-2">
                Manage and take your assigned assessments
              </p>
            </div>
            <div className="mt-4 sm:mt-0 flex space-x-2">
              <Button variant="outline" onClick={loadAssessments}>
                <RefreshCw className="mr-2 h-4 w-4" />
                Refresh
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        {/* Performance Stats */}
        <div className="mb-8">
          <PerformanceStats assessments={assessments} />
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Search</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search assessments..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Status</label>
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
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Type</label>
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
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="all">All ({assessments.length})</TabsTrigger>
            <TabsTrigger value="upcoming">Upcoming ({upcoming})</TabsTrigger>
            <TabsTrigger value="in_progress">In Progress ({inProgress})</TabsTrigger>
            <TabsTrigger value="completed">Completed ({completed})</TabsTrigger>
            <TabsTrigger value="expired">Expired ({expired})</TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="space-y-4">
            <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
              <AnimatePresence>
                {filteredAssessments.map((assessment) => (
                  <AssessmentCard
                    key={assessment.id}
                    assessment={assessment}
                    onStart={handleStartAssessment}
                    onResume={handleResumeAssessment}
                    onViewResults={handleViewResults}
                    onRetake={handleRetakeAssessment}
                    userTimezone={userTimezone}
                  />
                ))}
              </AnimatePresence>
            </div>

            {filteredAssessments.length === 0 && (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <BookOpen className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No assessments found</h3>
                  <p className="text-muted-foreground text-center">
                    {searchTerm || filterStatus !== 'all' || filterType !== 'all'
                      ? 'Try adjusting your filters or search terms'
                      : 'You don\'t have any assessments assigned yet'}
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="upcoming" className="space-y-4">
            <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
              {filteredAssessments.map((assessment) => (
                <AssessmentCard
                  key={assessment.id}
                  assessment={assessment}
                  onStart={handleStartAssessment}
                  onResume={handleResumeAssessment}
                  onViewResults={handleViewResults}
                  onRetake={handleRetakeAssessment}
                  userTimezone={userTimezone}
                />
              ))}
            </div>
          </TabsContent>

          <TabsContent value="in_progress" className="space-y-4">
            <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
              {filteredAssessments.map((assessment) => (
                <AssessmentCard
                  key={assessment.id}
                  assessment={assessment}
                  onStart={handleStartAssessment}
                  onResume={handleResumeAssessment}
                  onViewResults={handleViewResults}
                  onRetake={handleRetakeAssessment}
                  userTimezone={userTimezone}
                />
              ))}
            </div>
          </TabsContent>

          <TabsContent value="completed" className="space-y-4">
            <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
              {filteredAssessments.map((assessment) => (
                <AssessmentCard
                  key={assessment.id}
                  assessment={assessment}
                  onStart={handleStartAssessment}
                  onResume={handleResumeAssessment}
                  onViewResults={handleViewResults}
                  onRetake={handleRetakeAssessment}
                  userTimezone={userTimezone}
                />
              ))}
            </div>
          </TabsContent>

          <TabsContent value="expired" className="space-y-4">
            <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
              {filteredAssessments.map((assessment) => (
                <AssessmentCard
                  key={assessment.id}
                  assessment={assessment}
                  onStart={handleStartAssessment}
                  onResume={handleResumeAssessment}
                  onViewResults={handleViewResults}
                  onRetake={handleRetakeAssessment}
                  userTimezone={userTimezone}
                />
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default StudentAssessmentDashboard;
