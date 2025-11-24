import React, { useEffect, useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { 
  BookOpen, 
  CheckCircle, 
  Clock, 
  Target, 
  TrendingUp, 
  User, 
  BarChart3, 
  CheckSquare, 
  BookMarked, 
  Trophy,
  Star, 
  Award, 
  Zap, 
  Rocket, 
  Calendar, 
  Code, 
  Play,
  MapPin,
  Users,
  Bell,
  Activity,
  RefreshCw,
  Wifi,
  WifiOff,
  GraduationCap,
  Clock3,
  UserCheck,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Timer,
  BookOpenCheck,
  FileText,
  Video,
  Mic,
  Camera,
  Download,
  Upload,
  Settings,
  Home,
  School,
  Library
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import apiService from '@/services/api';
import { useToast } from '@/components/ui/use-toast';

const EnhancedStudentDashboard = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [lastRefresh, setLastRefresh] = useState(new Date());
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [assessments, setAssessments] = useState([]);
  const [courses, setCourses] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [stats, setStats] = useState({
    totalAssessments: 0,
    completedAssessments: 0,
    pendingAssessments: 0,
    scheduledAssessments: 0,
    inProgressAssessments: 0,
    averageScore: 0,
    totalScore: 0,
    streak: 0
  });
  const [codingStats, setCodingStats] = useState({
    totalProblemsSolved: 0,
    activePlatforms: 0
  });

  // Real-time data refresh
  const refreshData = useCallback(async () => {
    setIsRefreshing(true);
    try {
      await loadDashboardData();
    } catch (error) {
      console.error('Error refreshing data:', error);
    } finally {
      setIsRefreshing(false);
      setLastRefresh(new Date());
    }
  }, []);

  // Auto-refresh disabled to prevent interrupting user work
  // useEffect(() => {
  //   const interval = setInterval(refreshData, 30000);
  //   return () => clearInterval(interval);
  // }, [refreshData]);

  // Online/offline status monitoring
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      // Load user data
      const userResponse = await apiService.getProfile();
      if (userResponse.success) {
        // Load assessments
        await loadAssessments(userResponse.data.id);
        
        // Load courses
        await loadCourses(userResponse.data.id);
        
        // Load coding stats
        await loadCodingStats(userResponse.data.id);
        
        // Load notifications
        await loadNotifications();
      }
      
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load dashboard data"
      });
    } finally {
      setLoading(false);
    }
  };

  const loadAssessments = async (userId) => {
    if (!userId) return;

    try {
      const response = await apiService.getAssessmentInstances({ 
        student_id: userId,
        limit: 50
      });
      if (response.success && response.data) {
        const assessmentData = response.data;
        const uniqueAssessments = assessmentData.filter((assessment, index, self) => {
          const firstIndex = self.findIndex(a => a.id === assessment.id);
          return firstIndex === index;
        });
        
        setAssessments(uniqueAssessments);
        calculateStats(uniqueAssessments);
      } else {
        setAssessments([]);
        calculateStats([]);
      }
    } catch (error) {
      console.error('Error loading assessments:', error);
      setAssessments([]);
      calculateStats([]);
    }
  };

  const loadCourses = async (userId) => {
    try {
      if (!userId) {
        return;
      }
      // Load enrolled courses for the student
      const response = await apiService.getCourses({
        studentId: userId,
        status: 'active'
      });
      
      if (response.success && response.data) {
        setCourses(response.data);
      } else {
        setCourses([]);
      }
    } catch (error) {
      console.error('Error loading courses:', error);
      setCourses([]);
    }
  };

  const loadCodingStats = async (userId) => {
    try {
      const response = await apiService.getStudentCachedPlatformStatistics();
      if (response.success && response.data?.platformStatistics) {
        const platformStats = response.data.platformStatistics;
        const totalProblemsSolved = Object.entries(platformStats).reduce((total, [platform, platformData]) => {
          // Exclude HackerRank from problems solved count since it tracks badges, not problems
          if (platform === 'hackerrank') {
            return total;
          }
          return total + (platformData?.problemsSolved || 0);
        }, 0);
        const activePlatforms = Object.keys(platformStats).filter(platform => 
          platform !== 'hackerrank' && platformStats[platform] && platformStats[platform].problemsSolved > 0
        ).length;
        
        setCodingStats({
          totalProblemsSolved,
          activePlatforms
        });
      }
      // If success is false, it means no cached data exists - this is expected and not an error
    } catch (error) {
      // Only log actual errors, not expected "no data" responses
      if (error.message && !error.message.includes('No cached platform statistics')) {
        console.error('Error loading coding stats:', error);
      }
    }
  };

  const loadNotifications = async () => {
    try {
      // Load notifications from API
      const response = await apiService.getNotifications();
      if (response.success && response.data) {
        setNotifications(response.data);
      } else {
        setNotifications([]);
      }
    } catch (error) {
      console.error('Error loading notifications:', error);
      setNotifications([]);
    }
  };

  const calculateStats = (assessmentData) => {
    try {
      const totalAssessments = assessmentData.length;
      
      // Categorize assessments by status
      const completedAssessments = assessmentData.filter(a => 
        a.submission_status === 'submitted' || a.submission_status === 'graded'
      );
      
      const inProgressAssessments = assessmentData.filter(a => 
        a.submission_status === 'in_progress'
      );
      
      const scheduledAssessments = assessmentData.filter(a => 
        a.submission_status === 'scheduled'
      );
      
      const assignedAssessments = assessmentData.filter(a => 
        a.submission_status === 'assigned'
      );
      
      const pendingAssessments = inProgressAssessments.length + scheduledAssessments.length + assignedAssessments.length;

      // Calculate average score from completed assessments
      let totalScore = 0;
      let scoreCount = 0;
      
      completedAssessments.forEach(assessment => {
        // Calculate percentage score
        if (assessment.percentage_score) {
          totalScore += parseFloat(assessment.percentage_score) || 0;
          scoreCount++;
        } else if (assessment.score && assessment.total_points) {
          const percentage = (parseFloat(assessment.score) / parseFloat(assessment.total_points)) * 100;
          totalScore += percentage;
          scoreCount++;
        }
      });

      const averageScore = scoreCount > 0 ? Math.round(totalScore / scoreCount) : 0;

      // Calculate real streak based on assessment completion dates
      let currentStreak = 0;
      let maxStreak = 0;
      
      if (completedAssessments.length > 0) {
        // Sort completed assessments by completion date (most recent first)
        const sortedAssessments = completedAssessments
          .filter(a => a.completion_date || a.submitted_at || a.updated_at)
          .sort((a, b) => {
            const dateA = new Date(a.completion_date || a.submitted_at || a.updated_at);
            const dateB = new Date(b.completion_date || b.submitted_at || b.updated_at);
            return dateB - dateA;
          });

        if (sortedAssessments.length > 0) {
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          
          let currentDate = new Date(sortedAssessments[0].completion_date || sortedAssessments[0].submitted_at || sortedAssessments[0].updated_at);
          currentDate.setHours(0, 0, 0, 0);
          
          // Calculate current streak
          let streakCount = 0;
          let checkDate = new Date(today);
          
          while (true) {
            const hasActivityOnDate = sortedAssessments.some(assessment => {
              const assessmentDate = new Date(assessment.completion_date || assessment.submitted_at || assessment.updated_at);
              assessmentDate.setHours(0, 0, 0, 0);
              return assessmentDate.getTime() === checkDate.getTime();
            });
            
            if (hasActivityOnDate) {
              streakCount++;
              checkDate.setDate(checkDate.getDate() - 1);
            } else {
              break;
            }
          }
          
          currentStreak = streakCount;
          
          // Calculate max streak from all data
          let tempStreak = 0;
          let prevDate = null;
          
          sortedAssessments.forEach(assessment => {
            const assessmentDate = new Date(assessment.completion_date || assessment.submitted_at || assessment.updated_at);
            assessmentDate.setHours(0, 0, 0, 0);
            
            if (prevDate === null) {
              tempStreak = 1;
            } else {
              const dayDiff = Math.floor((prevDate - assessmentDate) / (1000 * 60 * 60 * 24));
              if (dayDiff === 1) {
                tempStreak++;
              } else {
                tempStreak = 1;
              }
            }
            
            if (tempStreak > maxStreak) {
              maxStreak = tempStreak;
            }
            
            prevDate = assessmentDate;
          });
        }
      }

      // If no real streak data, show completion-based streak
      if (currentStreak === 0 && completedAssessments.length > 0) {
        currentStreak = Math.min(completedAssessments.length, 7); // Show completion count as streak, max 7
      }

      const newStats = {
        totalAssessments,
        completedAssessments: completedAssessments.length,
        pendingAssessments,
        scheduledAssessments: scheduledAssessments.length,
        inProgressAssessments: inProgressAssessments.length,
        averageScore,
        totalScore: Math.round(totalScore),
        streak: currentStreak,
        maxStreak: maxStreak
      };

      setStats(newStats);
    } catch (error) {
      console.error('Error calculating stats:', error);
    }
  };

  const getInitials = (name) => {
    if (!name) return "S";
    const names = name.split(' ');
    if (names.length === 1) return names[0].charAt(0).toUpperCase();
    return names[0].charAt(0).toUpperCase() + names[names.length - 1].charAt(0).toUpperCase();
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'submitted':
      case 'graded':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'in_progress':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'scheduled':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'assigned':
        return 'bg-orange-50 text-orange-700 border-orange-200';
      default:
        return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'submitted':
      case 'graded':
        return 'Completed';
      case 'in_progress':
        return 'In Progress';
      case 'scheduled':
        return 'Scheduled';
      case 'assigned':
        return 'Assigned';
      default:
        return 'Unknown';
    }
  };

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

  const getPerformanceColor = (score) => {
    if (score >= 90) return 'text-emerald-600';
    if (score >= 80) return 'text-blue-600';
    if (score >= 70) return 'text-yellow-600';
    if (score >= 60) return 'text-orange-600';
    return 'text-red-600';
  };

  const getPerformanceIcon = (score) => {
    if (score >= 90) return <Trophy className="h-5 w-5 text-yellow-500" />;
    if (score >= 80) return <Star className="h-5 w-5 text-blue-500" />;
    if (score >= 70) return <Award className="h-5 w-5 text-green-500" />;
    if (score >= 60) return <Zap className="h-5 w-5 text-orange-500" />;
    return <Target className="h-5 w-5 text-red-500" />;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-muted-foreground mx-auto"></div>
          <p className="mt-4 text-muted-foreground text-lg">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-[95vw] mx-auto space-y-8">
        
        {/* Header - Theme-aware colors */}
        <div className="bg-card rounded-2xl p-8 text-card-foreground shadow-lg border border-border">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-6">
              <Avatar className="h-20 w-20 border-4 border-border shadow-lg bg-card">
                <AvatarImage src={user?.avatar_url} />
                <AvatarFallback className="bg-muted text-muted-foreground text-2xl font-bold">
                  {getInitials(user?.name)}
                </AvatarFallback>
              </Avatar>
              <div>
                <h1 className="text-4xl font-bold mb-2 text-card-foreground">
                  Welcome back, {user?.name || 'Student'}! 🎉
                </h1>
                <p className="text-xl text-muted-foreground">Ready to ace your next assessment?</p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-4xl font-bold text-amber-600">{stats.streak}</div>
              <div className="text-muted-foreground text-lg">
                {stats.streak === 1 ? 'Day' : 'Days'} Streak 🔥
              </div>
              {stats.maxStreak > stats.streak && (
                <div className="text-xs text-muted-foreground mt-1">
                  Best: {stats.maxStreak} days
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Key Stats - Theme-aware colors */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
          <Card className="bg-card text-card-foreground border border-border shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-muted-foreground text-sm font-medium">Total</p>
                  <p className="text-4xl font-bold text-card-foreground">{stats.totalAssessments}</p>
                  <p className="text-muted-foreground text-sm">Assessments</p>
                </div>
                <BookOpen className="h-12 w-12 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card text-card-foreground border border-border shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-muted-foreground text-sm font-medium">Completed</p>
                  <p className="text-4xl font-bold text-card-foreground">{stats.completedAssessments}</p>
                  <p className="text-muted-foreground text-sm">Finished</p>
                </div>
                <CheckCircle className="h-12 w-12 text-emerald-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card text-card-foreground border border-border shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-muted-foreground text-sm font-medium">Pending</p>
                  <p className="text-4xl font-bold text-card-foreground">{stats.pendingAssessments}</p>
                  <p className="text-muted-foreground text-sm">Awaiting</p>
                </div>
                <Clock className="h-12 w-12 text-orange-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card text-card-foreground border border-border shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-muted-foreground text-sm font-medium">Avg Score</p>
                  <p className="text-4xl font-bold text-card-foreground">{stats.averageScore}%</p>
                  <p className="text-muted-foreground text-sm">Performance</p>
                </div>
                <TrendingUp className="h-12 w-12 text-purple-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card text-card-foreground border border-border shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-muted-foreground text-sm font-medium">Coding</p>
                  <p className="text-4xl font-bold text-card-foreground">{codingStats.totalProblemsSolved}</p>
                  <p className="text-muted-foreground text-sm">Problems Solved</p>
                </div>
                <Code className="h-12 w-12 text-orange-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content - Single column layout */}
        <div className="space-y-8">
          {/* Recent Assessments - Full width with dropdown */}
          <Card className="bg-card backdrop-blur-sm border-0 shadow-lg border border-border">
            <CardHeader className="bg-muted text-card-foreground rounded-t-lg border-b border-border">
              <CardTitle className="flex items-center space-x-3">
                <CheckSquare className="h-6 w-6 text-muted-foreground" />
                <span className="text-xl">Recent Assessments</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-4">
                {assessments.length === 0 ? (
                  <div className="text-center py-8">
                    <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                    <p className="text-muted-foreground text-base">No assessments yet</p>
                    <p className="text-muted-foreground text-sm">Your assigned assessments will appear here</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {assessments.slice(0, 8).map((assessment, index) => (
                      <div key={`${assessment.id}-${assessment.submission_status}-${index}`} className="flex items-center justify-between p-3 bg-card rounded-lg border border-border hover:shadow-sm transition-all duration-200">
                        <div className="flex items-center space-x-3 flex-1">
                          <div className="p-2 bg-blue-100 rounded-lg">
                            <BookOpen className="h-4 w-4 text-blue-600" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-medium text-card-foreground truncate text-sm">{assessment.title}</h4>
                            <div className="flex items-center space-x-3 text-xs text-muted-foreground mt-1">
                              <span className="capitalize">{assessment.assessment_type?.replace('_', ' ')}</span>
                              {assessment.total_points && (
                                <span>• {assessment.total_points} pts</span>
                              )}
                              {assessment.time_limit_minutes && (
                                <span>• {assessment.time_limit_minutes}m</span>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          {assessment.percentage_score && (
                            <div className="flex items-center space-x-1">
                              {getPerformanceIcon(assessment.percentage_score)}
                              <span className={`font-medium text-xs ${getPerformanceColor(assessment.percentage_score)}`}>
                                {assessment.percentage_score}%
                              </span>
                            </div>
                          )}
                          {canResumeAssessment(assessment) && (
                            <div className="flex items-center space-x-1">
                              <Clock className="h-3 w-3 text-orange-500" />
                              <span className="text-xs text-orange-600 font-medium">
                                {getRemainingTime(assessment)} left
                              </span>
                            </div>
                          )}
                          <Badge className={`${getStatusColor(assessment.submission_status)} border text-xs`}>
                            {getStatusText(assessment.submission_status)}
                          </Badge>
                        </div>
                        {canResumeAssessment(assessment) && (
                          <div className="mt-2">
                            <Button 
                              size="sm" 
                              className="w-full bg-orange-500 hover:bg-orange-600 text-white text-xs"
                              asChild
                            >
                              <Link to={`/student/assessments/${assessment.id}/take`}>
                                <Play className="h-3 w-3 mr-1" />
                                Resume Assessment
                              </Link>
                            </Button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
                <div className="mt-4 space-y-2">
                  <Button className="w-full bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg text-sm" asChild>
                    <Link to="/student/assessments">View All Assessments</Link>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Progress Overview - Full width */}
          {stats.totalAssessments > 0 && (
            <Card className="bg-card backdrop-blur-sm border-0 shadow-lg border border-border">
              <CardHeader className="bg-muted text-card-foreground rounded-t-lg border-b border-border">
                <CardTitle className="flex items-center space-x-3">
                  <Rocket className="h-6 w-6 text-muted-foreground" />
                  <span className="text-xl">Progress Overview</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-6">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-card-foreground mb-2">
                      {Math.round((stats.completedAssessments / stats.totalAssessments) * 100)}%
                    </div>
                    <p className="text-muted-foreground">Completion Percentage</p>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 text-center">
                    <div className="bg-muted rounded-lg p-3 border border-border">
                      <div className="text-2xl font-bold text-blue-600">{stats.completedAssessments}</div>
                      <div className="text-sm text-blue-600">Completed</div>
                    </div>
                    <div className="bg-muted rounded-lg p-3 border border-border">
                      <div className="text-2xl font-bold text-orange-600">{stats.pendingAssessments}</div>
                      <div className="text-sm text-orange-600">Remaining</div>
                    </div>
                  </div>
                  
                  <p className="text-center text-sm text-slate-500">
                    {stats.completedAssessments} of {stats.totalAssessments} assessments completed
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Online Status and Refresh Info */}
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              {isOnline ? (
                <Wifi className="h-4 w-4 text-green-500" />
              ) : (
                <WifiOff className="h-4 w-4 text-red-500" />
              )}
              <span>{isOnline ? 'Online' : 'Offline'}</span>
            </div>
            <div className="flex items-center gap-2">
              <span>Last updated: {lastRefresh.toLocaleTimeString()}</span>
              {isRefreshing && <span>• Refreshing...</span>}
              <Button
                variant="outline"
                size="sm"
                onClick={refreshData}
                disabled={isRefreshing}
                className="ml-2"
              >
                <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EnhancedStudentDashboard;