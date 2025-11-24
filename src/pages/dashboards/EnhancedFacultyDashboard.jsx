import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  BookOpen, 
  Edit3, 
  Users, 
  BarChartHorizontalBig, 
  PlusCircle, 
  Code, 
  Eye, 
  Clock,
  Calendar,
  MapPin,
  UserCheck,
  AlertCircle,
  RefreshCw,
  Bell,
  Activity,
  TrendingUp,
  GraduationCap,
  BookMarked,
  CheckCircle,
  XCircle,
  Timer,
  Wifi,
  WifiOff
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import apiService from '@/services/api';
import { useToast } from '@/components/ui/use-toast';

const EnhancedFacultyDashboard = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [lastRefresh, setLastRefresh] = useState(new Date());
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState([]);
  const [facultyStatus, setFacultyStatus] = useState('offline');
  const [currentSchedule, setCurrentSchedule] = useState(null);
  const [attendanceStats, setAttendanceStats] = useState({
    today: { present: 0, absent: 0, late: 0 },
    week: { present: 0, absent: 0, late: 0 },
    month: { present: 0, absent: 0, late: 0 }
  });

  const [stats, setStats] = useState([
    { 
      title: "My Courses", 
      value: "0", 
      icon: <BookOpen className="h-6 w-6 text-primary" />, 
      color: "bg-blue-500/10", 
      link: "/courses", 
      detailsLink: "/courses",
      trend: "+0",
      trendType: "neutral"
    },
    { 
      title: "Enrolled Students", 
      value: "0", 
      icon: <Users className="h-6 w-6 text-primary" />, 
      color: "bg-green-500/10", 
      detailsLink: "/faculty/students",
      trend: "+0",
      trendType: "neutral"
    },
    { 
      title: "Pending Gradings", 
      value: "0", 
      icon: <Edit3 className="h-6 w-6 text-primary" />, 
      color: "bg-yellow-500/10", 
      detailsLink: "/faculty/grading",
      trend: "+0",
      trendType: "neutral"
    },
    { 
      title: "Average Score", 
      value: "0%", 
      icon: <BarChartHorizontalBig className="h-6 w-6 text-primary" />, 
      color: "bg-purple-500/10", 
      detailsLink: "/faculty/analytics/scores",
      trend: "+0%",
      trendType: "neutral"
    },
  ]);

  const [upcomingClasses, setUpcomingClasses] = useState([]);
  const [recentActivities, setRecentActivities] = useState([]);

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

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(refreshData, 30000);
    return () => clearInterval(interval);
  }, [refreshData]);

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
      
      // Load analytics data
      const analyticsResponse = await apiService.getAnalyticsData({
        viewType: 'faculty',
        dateRange: '30'
      });

      // Load courses data
      const coursesResponse = await apiService.getCourses({
        instructorId: user?.id,
        status: 'active'
      });

      // Load faculty status
      const statusResponse = await apiService.getFacultyStatus({
        facultyId: user?.id
      });

      // Load class schedules
      const schedulesResponse = await apiService.getClassSchedules({
        instructorId: user?.id
      });

      // Load attendance sessions
      const attendanceResponse = await apiService.getAttendanceSessions({
        instructorId: user?.id,
        date: new Date().toISOString().split('T')[0]
      });

      if (analyticsResponse.success && analyticsResponse.data.summary) {
        const summary = analyticsResponse.data.summary;
        const courses = coursesResponse.success ? coursesResponse.data : [];
        const facultyStatusData = statusResponse.success ? statusResponse.data[0] : null;
        const schedules = schedulesResponse.success ? schedulesResponse.data : [];
        const attendanceSessions = attendanceResponse.success ? attendanceResponse.data : [];
        
        setStats([
          { 
            title: "My Courses", 
            value: courses.length.toString(), 
            icon: <BookOpen className="h-6 w-6 text-primary" />, 
            color: "bg-blue-500/10", 
            link: "/courses", 
            detailsLink: "/courses",
            trend: courses.length > 0 ? "+2" : "+0",
            trendType: courses.length > 0 ? "positive" : "neutral"
          },
          { 
            title: "Enrolled Students", 
            value: summary.total_students?.toString() || "0", 
            icon: <Users className="h-6 w-6 text-primary" />, 
            color: "bg-green-500/10", 
            detailsLink: "/faculty/students",
            trend: summary.total_students > 0 ? "+12" : "+0",
            trendType: summary.total_students > 0 ? "positive" : "neutral"
          },
          { 
            title: "Pending Gradings", 
            value: summary.pending_submissions?.toString() || "0", 
            icon: <Edit3 className="h-6 w-6 text-primary" />, 
            color: "bg-yellow-500/10", 
            detailsLink: "/faculty/grading",
            trend: summary.pending_submissions > 0 ? "-3" : "+0",
            trendType: summary.pending_submissions > 0 ? "negative" : "neutral"
          },
          { 
            title: "Average Score", 
            value: `${(summary.average_score || 0).toFixed(1)}%`, 
            icon: <BarChartHorizontalBig className="h-6 w-6 text-primary" />, 
            color: "bg-purple-500/10", 
            detailsLink: "/faculty/analytics/scores",
            trend: summary.average_score > 0 ? "+5%" : "+0%",
            trendType: summary.average_score > 0 ? "positive" : "neutral"
          },
        ]);

        // Set faculty status
        if (facultyStatusData) {
          setFacultyStatus(facultyStatusData.status || 'offline');
        }

        // Set upcoming classes
        const today = new Date();
        const todaySchedules = schedules.filter(schedule => {
          const scheduleDate = new Date(schedule.start_date || today);
          return scheduleDate.toDateString() === today.toDateString();
        });
        setUpcomingClasses(todaySchedules.map(schedule => ({
          id: schedule.id,
          course: schedule.class_name || 'Class',
          time: schedule.start_time,
          room: schedule.room_name || 'TBD',
          students: 0, // This would need to be calculated from enrollments
          status: 'upcoming'
        })));

        // Calculate attendance stats
        const todayAttendance = attendanceSessions.reduce((acc, session) => {
          acc.present += session.present_count || 0;
          acc.absent += session.absent_count || 0;
          acc.late += session.late_count || 0;
          return acc;
        }, { present: 0, absent: 0, late: 0 });

        setAttendanceStats(prev => ({
          ...prev,
          today: todayAttendance
        }));
      }

      // Load recent activities (mock for now)
      setRecentActivities([
        {
          id: 1,
          type: 'assessment',
          title: 'New Assessment Created',
          description: 'Data Structures Quiz created',
          time: '2 hours ago',
          icon: <BookOpen className="h-4 w-4" />
        },
        {
          id: 2,
          type: 'student',
          title: 'Student Submission',
          description: 'John Doe submitted Algorithm Assignment',
          time: '4 hours ago',
          icon: <Users className="h-4 w-4" />
        },
        {
          id: 3,
          type: 'attendance',
          title: 'Attendance Marked',
          description: '45 students marked present for CS201',
          time: '6 hours ago',
          icon: <UserCheck className="h-4 w-4" />
        }
      ]);
      
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

  const updateFacultyStatus = async (newStatus) => {
    try {
      await apiService.updateFacultyStatus({
        facultyId: user?.id,
        status: newStatus,
        deviceType: 'desktop',
        browser: navigator.userAgent,
        locationType: 'on_campus',
        building: 'Main Building',
        room: 'Office 201'
      });
      
      setFacultyStatus(newStatus);
      toast({
        title: "Status Updated",
        description: `Your status has been updated to ${newStatus}`,
      });
    } catch (error) {
      console.error('Error updating faculty status:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update faculty status"
      });
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'available': return 'bg-green-100 text-green-800 border-green-200';
      case 'busy': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'away': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'offline': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'available': return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'busy': return <Clock className="h-4 w-4 text-yellow-600" />;
      case 'away': return <AlertCircle className="h-4 w-4 text-orange-600" />;
      case 'offline': return <XCircle className="h-4 w-4 text-gray-600" />;
      default: return <XCircle className="h-4 w-4 text-gray-600" />;
    }
  };

  const getTrendColor = (trendType) => {
    switch (trendType) {
      case 'positive': return 'text-green-600';
      case 'negative': return 'text-red-600';
      default: return 'text-gray-600';
    }
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
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold">Faculty Dashboard</h1>
            <p className="text-muted-foreground">Welcome back, {user?.name || 'Faculty'}!</p>
          </div>
          
          <div className="flex items-center gap-4">
            {/* Online Status */}
            <div className="flex items-center gap-2">
              {isOnline ? (
                <Wifi className="h-4 w-4 text-green-500" />
              ) : (
                <WifiOff className="h-4 w-4 text-red-500" />
              )}
              <span className="text-sm text-muted-foreground">
                {isOnline ? 'Online' : 'Offline'}
              </span>
            </div>

            {/* Faculty Status */}
            <div className="flex items-center gap-2">
              {getStatusIcon(facultyStatus)}
              <Badge className={getStatusColor(facultyStatus)}>
                {facultyStatus}
              </Badge>
            </div>

            {/* Refresh Button */}
            <Button
              variant="outline"
              size="sm"
              onClick={refreshData}
              disabled={isRefreshing}
              className="flex items-center gap-2"
            >
              <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </div>

        {/* Status Update Buttons */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold">Update Your Status</h3>
                <p className="text-sm text-muted-foreground">Let students know your availability</p>
              </div>
              <div className="flex gap-2">
                <Button
                  variant={facultyStatus === 'available' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => updateFacultyStatus('available')}
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Available
                </Button>
                <Button
                  variant={facultyStatus === 'busy' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => updateFacultyStatus('busy')}
                >
                  <Clock className="h-4 w-4 mr-2" />
                  Busy
                </Button>
                <Button
                  variant={facultyStatus === 'away' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => updateFacultyStatus('away')}
                >
                  <AlertCircle className="h-4 w-4 mr-2" />
                  Away
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stats Overview */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className={`shadow-lg hover:shadow-xl transition-shadow duration-300 ${stat.color} border-primary/20`}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">{stat.title}</CardTitle>
                  {stat.icon}
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-foreground">{stat.value}</div>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`text-xs ${getTrendColor(stat.trendType)}`}>
                      {stat.trend}
                    </span>
                    <span className="text-xs text-muted-foreground">vs last month</span>
                  </div>
                  {stat.detailsLink && (
                    <Button variant="link" size="sm" asChild className="px-0 text-xs text-primary hover:underline mt-2">
                      <Link to={stat.detailsLink}>
                        <Eye className="mr-1 h-3 w-3" />
                        View Details
                      </Link>
                    </Button>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Main Content */}
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="schedule">Today's Schedule</TabsTrigger>
            <TabsTrigger value="attendance">Attendance</TabsTrigger>
            <TabsTrigger value="activities">Activities</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              {/* Quick Actions */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="h-5 w-5" />
                    Quick Actions
                  </CardTitle>
                  <CardDescription>Common tasks and shortcuts</CardDescription>
                </CardHeader>
                <CardContent className="grid gap-3">
                  <Button variant="outline" className="justify-start" asChild>
                    <Link to="/assessments/create">
                      <PlusCircle className="mr-2 h-4 w-4" />
                      Create Assessment
                    </Link>
                  </Button>
                  <Button variant="outline" className="justify-start" asChild>
                    <Link to="/admin/attendance">
                      <UserCheck className="mr-2 h-4 w-4" />
                      Mark Attendance
                    </Link>
                  </Button>
                  <Button variant="outline" className="justify-start" asChild>
                    <Link to="/admin/courses">
                      <BookOpen className="mr-2 h-4 w-4" />
                      Manage Courses
                    </Link>
                  </Button>
                  <Button variant="outline" className="justify-start" asChild>
                    <Link to="/question-bank">
                      <Code className="mr-2 h-4 w-4" />
                      Question Bank
                    </Link>
                  </Button>
                </CardContent>
              </Card>

              {/* Attendance Summary */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <UserCheck className="h-5 w-5" />
                    Today's Attendance
                  </CardTitle>
                  <CardDescription>Attendance summary for today</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Present</span>
                      <span className="text-2xl font-bold text-green-600">{attendanceStats.today.present}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Absent</span>
                      <span className="text-2xl font-bold text-red-600">{attendanceStats.today.absent}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Late</span>
                      <span className="text-2xl font-bold text-yellow-600">{attendanceStats.today.late}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="schedule" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Today's Classes
                </CardTitle>
                <CardDescription>Your scheduled classes for today</CardDescription>
              </CardHeader>
              <CardContent>
                {upcomingClasses.length === 0 ? (
                  <div className="text-center py-8">
                    <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                    <p className="text-muted-foreground">No classes scheduled for today</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {upcomingClasses.map((classItem) => (
                      <div key={classItem.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors">
                        <div className="flex items-center gap-4">
                          <div className="p-2 bg-blue-100 rounded-lg">
                            <BookOpen className="h-4 w-4 text-blue-600" />
                          </div>
                          <div>
                            <h4 className="font-semibold">{classItem.course}</h4>
                            <div className="flex items-center gap-4 text-sm text-muted-foreground">
                              <div className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {classItem.time}
                              </div>
                              <div className="flex items-center gap-1">
                                <MapPin className="h-3 w-3" />
                                {classItem.room}
                              </div>
                              <div className="flex items-center gap-1">
                                <Users className="h-3 w-3" />
                                {classItem.students} students
                              </div>
                            </div>
                          </div>
                        </div>
                        <Badge variant="outline">{classItem.status}</Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="attendance" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <UserCheck className="h-5 w-5" />
                  Attendance Management
                </CardTitle>
                <CardDescription>Track and manage student attendance</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <UserCheck className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                  <p className="text-muted-foreground mb-4">Manage attendance for your classes</p>
                  <Button asChild>
                    <Link to="/admin/attendance">
                      <UserCheck className="mr-2 h-4 w-4" />
                      Open Attendance Management
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="activities" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  Recent Activities
                </CardTitle>
                <CardDescription>Your recent actions and updates</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentActivities.map((activity) => (
                    <div key={activity.id} className="flex items-center gap-4 p-3 border rounded-lg hover:bg-accent/50 transition-colors">
                      <div className="p-2 bg-blue-100 rounded-lg">
                        {activity.icon}
                      </div>
                      <div className="flex-1">
                        <h4 className="font-medium">{activity.title}</h4>
                        <p className="text-sm text-muted-foreground">{activity.description}</p>
                      </div>
                      <span className="text-xs text-muted-foreground">{activity.time}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Last Refresh Info */}
        <div className="text-center text-sm text-muted-foreground">
          Last updated: {lastRefresh.toLocaleTimeString()}
          {isRefreshing && <span className="ml-2">• Refreshing...</span>}
        </div>
      </div>
    </div>
  );
};

export default EnhancedFacultyDashboard;