import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Calendar, 
  Clock, 
  MapPin, 
  Users, 
  BookOpen, 
  GraduationCap,
  Building,
  Plus,
  Edit3,
  Trash2,
  Eye,
  AlertCircle,
  CheckCircle,
  RefreshCw,
  Wifi,
  WifiOff,
  Search,
  Filter,
  Download,
  Upload,
  Settings,
  BarChart3,
  TrendingUp,
  Activity,
  Bell,
  Shield,
  Globe,
  Home,
  School,
  User,
  Mail,
  Phone,
  FileText,
  Database,
  Zap,
  Target,
  Award,
  Star,
  Trophy,
  Calendar as CalendarIcon,
  Timer,
  Repeat,
  ArrowLeft,
  ArrowRight,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import apiService from '@/services/api';
import { useToast } from '@/components/ui/use-toast';

const EnhancedClassScheduling = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [lastRefresh, setLastRefresh] = useState(new Date());
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [schedules, setSchedules] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [faculty, setFaculty] = useState([]);
  const [courses, setCourses] = useState([]);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState('week'); // week, month, day
  const [selectedSchedule, setSelectedSchedule] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [conflicts, setConflicts] = useState([]);
  const [scheduleStats, setScheduleStats] = useState({
    totalClasses: 0,
    conflicts: 0,
    utilization: 0,
    facultyWorkload: 0
  });

  // Real-time data refresh
  const refreshData = useCallback(async () => {
    setIsRefreshing(true);
    try {
      await loadSchedules();
      await loadRooms();
      await loadFaculty();
      await loadCourses();
      await detectConflicts();
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
    refreshData();
  }, []);

  const loadSchedules = async () => {
    try {
      const response = await apiService.getClassSchedules();
      
      if (response.success && response.data) {
        // Transform API data to match component structure
        const transformedSchedules = response.data.map(schedule => ({
          id: schedule.id,
          courseId: schedule.course_id,
          courseName: schedule.course_name || schedule.course_title,
          courseCode: schedule.course_code,
          facultyId: schedule.faculty_id || schedule.instructor_id,
          facultyName: schedule.faculty_name || schedule.instructor_name || 'TBA',
          roomId: schedule.room_id,
          roomName: schedule.room_name || 'TBA',
          day: schedule.day || schedule.day_of_week,
          startTime: schedule.start_time,
          endTime: schedule.end_time,
          duration: schedule.duration || 90,
          type: schedule.type || schedule.class_type || 'lecture',
          semester: schedule.semester || 'Current',
          status: schedule.status || 'scheduled',
          capacity: schedule.capacity || 50,
          enrolled: schedule.enrolled || 0,
          recurring: schedule.recurring !== false,
          startDate: schedule.start_date,
          endDate: schedule.end_date
        }));
        
        setSchedules(transformedSchedules);
        // Note: conflicts will be updated after detectConflicts() runs
        setScheduleStats({
          totalClasses: transformedSchedules.length,
          conflicts: 0, // Will be updated by detectConflicts
          utilization: calculateUtilization(transformedSchedules),
          facultyWorkload: calculateFacultyWorkload(transformedSchedules)
        });
      } else {
        setSchedules([]);
        setScheduleStats({ totalClasses: 0, conflicts: 0, utilization: 0, facultyWorkload: 0 });
      }
    } catch (error) {
      console.error('Error loading schedules:', error);
      setSchedules([]);
      setScheduleStats({ totalClasses: 0, conflicts: 0, utilization: 0, facultyWorkload: 0 });
    }
  };

  const calculateUtilization = (schedules) => {
    if (!schedules.length) return 0;
    const totalCapacity = schedules.reduce((sum, s) => sum + (s.capacity || 0), 0);
    const totalEnrolled = schedules.reduce((sum, s) => sum + (s.enrolled || 0), 0);
    return totalCapacity > 0 ? Math.round((totalEnrolled / totalCapacity) * 100) : 0;
  };

  const calculateFacultyWorkload = (schedules) => {
    if (!schedules.length) return 0;
    // Simple calculation - can be enhanced with actual faculty workload data
    return Math.round((schedules.length / 10) * 100); // Assuming 10 classes = 100% workload
  };

  const loadRooms = async () => {
    try {
      const response = await apiService.getRooms();
      
      if (response.success && response.data) {
        setRooms(response.data.map(room => ({
          id: room.id,
          name: room.name,
          capacity: room.capacity || 0,
          type: room.type || 'lecture',
          equipment: room.equipment ? (Array.isArray(room.equipment) ? room.equipment : JSON.parse(room.equipment)) : [],
          status: room.status || 'available'
        })));
      } else {
        setRooms([]);
      }
    } catch (error) {
      console.error('Error loading rooms:', error);
      setRooms([]);
    }
  };

  const loadFaculty = async () => {
    try {
      const response = await apiService.getUsers({ role: 'faculty' });
      
      if (response.success && response.data) {
        // Get workload for each faculty member
        const facultyWithWorkload = await Promise.all(
          response.data.map(async (f) => {
            try {
              const workloadResponse = await apiService.getFacultyWorkload({ facultyId: f.id });
              return {
                id: f.id,
                name: f.name,
                email: f.email,
                department: f.department || 'Unknown',
                status: f.status || 'available',
                workload: workloadResponse.success && workloadResponse.data ? workloadResponse.data.workload_percentage || 0 : 0
              };
            } catch (error) {
              return {
                id: f.id,
                name: f.name,
                email: f.email,
                department: f.department || 'Unknown',
                status: f.status || 'available',
                workload: 0
              };
            }
          })
        );
        
        setFaculty(facultyWithWorkload);
      } else {
        setFaculty([]);
      }
    } catch (error) {
      console.error('Error loading faculty:', error);
      setFaculty([]);
    }
  };

  const loadCourses = async () => {
    try {
      const response = await apiService.getCourses();
      
      if (response.success && response.data) {
        setCourses(response.data.map(course => ({
          id: course.id,
          name: course.title,
          code: course.code,
          credits: course.credits || 3,
          department: course.department || 'Unknown'
        })));
      } else {
        setCourses([]);
      }
    } catch (error) {
      console.error('Error loading courses:', error);
      setCourses([]);
    }
  };

  const detectConflicts = async () => {
    try {
      // Check for conflicts in schedules
      const detectedConflicts = [];
      
      // Room conflicts - same room, overlapping times
      for (let i = 0; i < schedules.length; i++) {
        for (let j = i + 1; j < schedules.length; j++) {
          const s1 = schedules[i];
          const s2 = schedules[j];
          
          if (s1.roomId === s2.roomId && s1.day === s2.day) {
            // Check time overlap
            if (isTimeOverlapping(s1.startTime, s1.endTime, s2.startTime, s2.endTime)) {
              detectedConflicts.push({
                id: Date.now() + i,
                type: 'room_conflict',
                message: `Room ${s1.roomName} is double-booked on ${s1.day} ${s1.startTime}-${s1.endTime}`,
                scheduleIds: [s1.id, s2.id],
                severity: 'high'
              });
            }
          }
          
          // Faculty conflicts - same faculty, overlapping times
          if (s1.facultyId === s2.facultyId && s1.day === s2.day) {
            if (isTimeOverlapping(s1.startTime, s1.endTime, s2.startTime, s2.endTime)) {
              detectedConflicts.push({
                id: Date.now() + i + 1000,
                type: 'faculty_conflict',
                message: `${s1.facultyName} has overlapping classes on ${s1.day}`,
                scheduleIds: [s1.id, s2.id],
                severity: 'medium'
              });
            }
          }
        }
      }
      
      setConflicts(detectedConflicts);
      setScheduleStats(prev => ({ ...prev, conflicts: detectedConflicts.length }));
    } catch (error) {
      console.error('Error detecting conflicts:', error);
      setConflicts([]);
    }
  };

  const isTimeOverlapping = (start1, end1, start2, end2) => {
    const time1Start = timeToMinutes(start1);
    const time1End = timeToMinutes(end1);
    const time2Start = timeToMinutes(start2);
    const time2End = timeToMinutes(end2);
    
    return (time1Start < time2End && time1End > time2Start);
  };

  const timeToMinutes = (timeStr) => {
    const [hours, minutes] = timeStr.split(':').map(Number);
    return hours * 60 + (minutes || 0);
  };

  const createSchedule = async (scheduleData) => {
    try {
      setLoading(true);
      // Transform data to match API format
      const apiData = {
        course_id: scheduleData.courseId,
        faculty_id: scheduleData.facultyId,
        room_id: scheduleData.roomId,
        day: scheduleData.day,
        start_time: scheduleData.startTime,
        end_time: scheduleData.endTime,
        duration: scheduleData.duration || 90,
        type: scheduleData.type || 'lecture',
        semester: scheduleData.semester || 'Current',
        recurring: scheduleData.recurring !== false,
        start_date: scheduleData.startDate,
        end_date: scheduleData.endDate,
        capacity: scheduleData.capacity || 50
      };
      
      // Note: You may need to add a createSchedule method to apiService
      // For now, using POST to /enhanced/schedules
      const response = await apiService.post('/enhanced/schedules', apiData);
      
      if (response.success) {
        // Reload schedules to get updated list
        await refreshData();
        setShowCreateModal(false);
        
        toast({
          title: "Schedule Created",
          description: "Class schedule has been created successfully.",
        });
      } else {
        throw new Error(response.message || 'Failed to create schedule');
      }
    } catch (error) {
      console.error('Error creating schedule:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to create schedule.",
      });
    } finally {
      setLoading(false);
    }
  };

  const updateSchedule = async (scheduleId, updates) => {
    try {
      setLoading(true);
      // Transform data to match API format
      const apiData = {
        course_id: updates.courseId,
        faculty_id: updates.facultyId,
        room_id: updates.roomId,
        day: updates.day,
        start_time: updates.startTime,
        end_time: updates.endTime,
        duration: updates.duration,
        type: updates.type,
        semester: updates.semester,
        recurring: updates.recurring,
        start_date: updates.startDate,
        end_date: updates.endDate,
        capacity: updates.capacity,
        status: updates.status
      };
      
      // Note: You may need to add an updateSchedule method to apiService
      const response = await apiService.put(`/enhanced/schedules/${scheduleId}`, apiData);
      
      if (response.success) {
        // Reload schedules
        await refreshData();
        
        toast({
          title: "Schedule Updated",
          description: "Schedule has been updated successfully.",
        });
      } else {
        throw new Error(response.message || 'Failed to update schedule');
      }
    } catch (error) {
      console.error('Error updating schedule:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to update schedule.",
      });
    } finally {
      setLoading(false);
    }
  };

  const deleteSchedule = async (scheduleId) => {
    try {
      setLoading(true);
      // Note: You may need to add a deleteSchedule method to apiService
      const response = await apiService.delete(`/enhanced/schedules/${scheduleId}`);
      
      if (response.success) {
        // Reload schedules
        await refreshData();
        
        toast({
          title: "Schedule Deleted",
          description: "Schedule has been deleted successfully.",
        });
      } else {
        throw new Error(response.message || 'Failed to delete schedule');
      }
    } catch (error) {
      console.error('Error deleting schedule:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to delete schedule.",
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'scheduled': return 'bg-green-100 text-green-800 border-green-200';
      case 'cancelled': return 'bg-red-100 text-red-800 border-red-200';
      case 'completed': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'conflict': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getTypeColor = (type) => {
    switch (type) {
      case 'lecture': return 'bg-blue-100 text-blue-800';
      case 'lab': return 'bg-green-100 text-green-800';
      case 'tutorial': return 'bg-purple-100 text-purple-800';
      case 'seminar': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getConflictSeverityColor = (severity) => {
    switch (severity) {
      case 'high': return 'bg-red-100 text-red-800 border-red-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-blue-100 text-blue-800 border-blue-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const formatTime = (time) => {
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  const getWeekDays = () => {
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    return days;
  };

  const getTimeSlots = () => {
    const slots = [];
    for (let hour = 8; hour <= 18; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        const time = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        slots.push(time);
      }
    }
    return slots;
  };

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold">Class Scheduling</h1>
            <p className="text-muted-foreground">Manage class schedules, room assignments, and resource allocation</p>
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

            {/* Create Schedule Button */}
            <Button onClick={() => setShowCreateModal(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create Schedule
            </Button>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid gap-6 md:grid-cols-4">
          <Card className="shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-muted-foreground text-sm font-medium">Total Classes</p>
                  <p className="text-3xl font-bold text-blue-600">{scheduleStats.totalClasses}</p>
                </div>
                <Calendar className="h-12 w-12 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-muted-foreground text-sm font-medium">Conflicts</p>
                  <p className="text-3xl font-bold text-red-600">{conflicts.length}</p>
                </div>
                <AlertCircle className="h-12 w-12 text-red-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-muted-foreground text-sm font-medium">Room Utilization</p>
                  <p className="text-3xl font-bold text-green-600">{scheduleStats.utilization}%</p>
                </div>
                <BarChart3 className="h-12 w-12 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-muted-foreground text-sm font-medium">Faculty Workload</p>
                  <p className="text-3xl font-bold text-purple-600">{scheduleStats.facultyWorkload}%</p>
                </div>
                <Users className="h-12 w-12 text-purple-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="calendar" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="calendar">Calendar View</TabsTrigger>
            <TabsTrigger value="schedules">Schedules</TabsTrigger>
            <TabsTrigger value="conflicts">Conflicts</TabsTrigger>
            <TabsTrigger value="resources">Resources</TabsTrigger>
          </TabsList>

          <TabsContent value="calendar" className="space-y-6">
            {/* Calendar Controls */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CalendarIcon className="h-5 w-5" />
                  Schedule Calendar
                </CardTitle>
                <CardDescription>View and manage class schedules in calendar format.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm">
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <span className="font-semibold">Week of {currentDate.toLocaleDateString()}</span>
                    <Button variant="outline" size="sm">
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="flex items-center gap-2">
                    <Select value={viewMode} onValueChange={setViewMode}>
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="day">Day</SelectItem>
                        <SelectItem value="week">Week</SelectItem>
                        <SelectItem value="month">Month</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Weekly Calendar Grid */}
                <div className="grid grid-cols-8 gap-1">
                  {/* Time column header */}
                  <div className="p-2 text-sm font-medium text-muted-foreground">Time</div>
                  
                  {/* Day headers */}
                  {getWeekDays().map((day) => (
                    <div key={day} className="p-2 text-sm font-medium text-center border-b">
                      {day}
                    </div>
                  ))}
                  
                  {/* Time slots and schedule blocks */}
                  {getTimeSlots().map((time) => (
                    <React.Fragment key={time}>
                      <div className="p-2 text-xs text-muted-foreground border-r">
                        {formatTime(time)}
                      </div>
                      {getWeekDays().map((day) => {
                        const schedule = schedules.find(s => 
                          s.day === day && 
                          s.startTime <= time && 
                          s.endTime > time
                        );
                        return (
                          <div key={`${day}-${time}`} className="min-h-[40px] border border-gray-200 p-1">
                            {schedule && (
                              <div className={`p-1 rounded text-xs cursor-pointer hover:shadow-sm transition-shadow ${getTypeColor(schedule.type)}`}>
                                <div className="font-medium truncate">{schedule.courseName}</div>
                                <div className="text-xs opacity-75">{schedule.roomName}</div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </React.Fragment>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="schedules" className="space-y-6">
            {/* Schedules List */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Class Schedules
                </CardTitle>
                <CardDescription>Manage all class schedules and assignments.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {schedules.map((schedule) => (
                    <div key={schedule.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors">
                      <div className="flex items-center gap-4">
                        <div className="p-2 bg-blue-100 rounded-lg">
                          <BookOpen className="h-4 w-4 text-blue-600" />
                        </div>
                        <div>
                          <h4 className="font-semibold">{schedule.courseName}</h4>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {schedule.day}
                            </div>
                            <div className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {formatTime(schedule.startTime)} - {formatTime(schedule.endTime)}
                            </div>
                            <div className="flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              {schedule.roomName}
                            </div>
                            <div className="flex items-center gap-1">
                              <User className="h-3 w-3" />
                              {schedule.facultyName}
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className={getTypeColor(schedule.type)}>
                          {schedule.type}
                        </Badge>
                        <Badge className={getStatusColor(schedule.status)}>
                          {schedule.status}
                        </Badge>
                        <Button variant="outline" size="sm" onClick={() => setSelectedSchedule(schedule)}>
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => updateSchedule(schedule.id, { status: 'cancelled' })}>
                          <Edit3 className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => deleteSchedule(schedule.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="conflicts" className="space-y-6">
            {/* Conflicts List */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertCircle className="h-5 w-5" />
                  Schedule Conflicts
                </CardTitle>
                <CardDescription>Resolve scheduling conflicts and overlaps.</CardDescription>
              </CardHeader>
              <CardContent>
                {conflicts.length === 0 ? (
                  <div className="text-center py-8">
                    <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-3" />
                    <p className="text-muted-foreground">No conflicts detected</p>
                    <p className="text-sm text-muted-foreground">All schedules are properly configured</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {conflicts.map((conflict) => (
                      <div key={conflict.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors">
                        <div className="flex items-center gap-4">
                          <div className="p-2 bg-red-100 rounded-lg">
                            <AlertCircle className="h-4 w-4 text-red-600" />
                          </div>
                          <div>
                            <h4 className="font-semibold">{conflict.message}</h4>
                            <div className="flex items-center gap-4 text-sm text-muted-foreground">
                              <span>Type: {conflict.type.replace('_', ' ')}</span>
                              <span>Affected Schedules: {conflict.scheduleIds.length}</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge className={getConflictSeverityColor(conflict.severity)}>
                            {conflict.severity}
                          </Badge>
                          <Button variant="outline" size="sm">
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button variant="outline" size="sm">
                            <Edit3 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="resources" className="space-y-6">
            {/* Rooms Management */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building className="h-5 w-5" />
                  Room Management
                </CardTitle>
                <CardDescription>Manage classrooms, labs, and other resources.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {rooms.map((room) => (
                    <div key={room.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors">
                      <div className="flex items-center gap-4">
                        <div className="p-2 bg-purple-100 rounded-lg">
                          <Building className="h-4 w-4 text-purple-600" />
                        </div>
                        <div>
                          <h4 className="font-semibold">{room.name}</h4>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <Users className="h-3 w-3" />
                              Capacity: {room.capacity}
                            </div>
                            <div className="flex items-center gap-1">
                              <Settings className="h-3 w-3" />
                              Type: {room.type}
                            </div>
                            <div className="flex items-center gap-1">
                              <Zap className="h-3 w-3" />
                              Equipment: {room.equipment.join(', ')}
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={room.status === 'available' ? 'default' : 'secondary'}>
                          {room.status}
                        </Badge>
                        <Button variant="outline" size="sm">
                          <Edit3 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Faculty Workload */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Faculty Workload
                </CardTitle>
                <CardDescription>Monitor faculty teaching load and availability.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {faculty.map((member) => (
                    <div key={member.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors">
                      <div className="flex items-center gap-4">
                        <div className="p-2 bg-green-100 rounded-lg">
                          <User className="h-4 w-4 text-green-600" />
                        </div>
                        <div>
                          <h4 className="font-semibold">{member.name}</h4>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <Mail className="h-3 w-3" />
                              {member.email}
                            </div>
                            <div className="flex items-center gap-1">
                              <Building className="h-3 w-3" />
                              {member.department}
                            </div>
                            <div className="flex items-center gap-1">
                              <BarChart3 className="h-3 w-3" />
                              Workload: {member.workload}%
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={member.status === 'available' ? 'default' : 'secondary'}>
                          {member.status}
                        </Badge>
                        <Button variant="outline" size="sm">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </div>
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

export default EnhancedClassScheduling;

