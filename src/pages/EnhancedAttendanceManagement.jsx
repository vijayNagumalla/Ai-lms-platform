import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { 
  UserCheck, 
  Calendar, 
  Clock, 
  Users, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  MapPin,
  QrCode,
  Camera,
  Fingerprint,
  Smartphone,
  Wifi,
  WifiOff,
  RefreshCw,
  Download,
  Upload,
  Filter,
  Search,
  Plus,
  Edit3,
  Trash2,
  Eye,
  BarChart3,
  TrendingUp,
  TrendingDown,
  Activity,
  BookOpen,
  GraduationCap,
  School,
  Home,
  Building,
  User,
  Mail,
  Phone,
  Settings,
  Bell,
  Shield,
  Lock,
  Unlock,
  CheckCircle2,
  X,
  Minus,
  PlusCircle,
  FileText,
  Database,
  Globe,
  Zap,
  Target,
  Award,
  Star,
  Trophy
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import apiService from '@/services/api';
import { useToast } from '@/components/ui/use-toast';

const EnhancedAttendanceManagement = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [lastRefresh, setLastRefresh] = useState(new Date());
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [attendanceData, setAttendanceData] = useState({
    today: [],
    week: [],
    month: [],
    overall: []
  });
  const [classes, setClasses] = useState([]);
  const [students, setStudents] = useState([]);
  const [attendanceStats, setAttendanceStats] = useState({
    today: { present: 0, absent: 0, late: 0, total: 0 },
    week: { present: 0, absent: 0, late: 0, total: 0 },
    month: { present: 0, absent: 0, late: 0, total: 0 },
    overall: { percentage: 0, streak: 0 }
  });
  const [selectedClass, setSelectedClass] = useState(null);
  const [attendanceMethod, setAttendanceMethod] = useState('manual');
  const [qrCode, setQrCode] = useState('');
  const [isGeneratingQR, setIsGeneratingQR] = useState(false);

  // Real-time data refresh
  const refreshData = useCallback(async () => {
    setIsRefreshing(true);
    try {
      await loadAttendanceData();
      await loadClasses();
      await loadStudents();
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

  const loadAttendanceData = async () => {
    try {
      setLoading(true);
      // Get today's attendance sessions
      const today = new Date().toISOString().split('T')[0];
      const sessionsResponse = await apiService.getAttendanceSessions({ date: today });
      
      if (sessionsResponse.success && sessionsResponse.data) {
        // Transform API data to match component structure
        const todaySessions = sessionsResponse.data.filter(session => 
          session.session_date === today
        );
        
        // Get attendance records for today's sessions
        const todayRecords = [];
        for (const session of todaySessions) {
          try {
            const recordsResponse = await apiService.getAttendanceRecords(session.id);
            if (recordsResponse.success && recordsResponse.data) {
              todayRecords.push(...recordsResponse.data.map(record => ({
                id: record.id,
                studentId: record.student_id,
                studentName: record.student_name || 'Unknown',
                classId: session.class_id,
                className: session.class_name || session.course_name,
                status: record.status,
                time: record.marked_at ? new Date(record.marked_at).toLocaleTimeString() : null,
                method: record.marking_method || 'manual'
              })));
            }
          } catch (error) {
            console.error('Error loading attendance records:', error);
          }
        }
        
        setAttendanceData({
          today: todayRecords,
          week: [],
          month: [],
          overall: []
        });

        // Calculate stats from today's records
        const presentCount = todayRecords.filter(r => r.status === 'present').length;
        const absentCount = todayRecords.filter(r => r.status === 'absent').length;
        const lateCount = todayRecords.filter(r => r.status === 'late').length;
        
        setAttendanceStats({
          today: { present: presentCount, absent: absentCount, late: lateCount, total: todayRecords.length },
          week: { present: 0, absent: 0, late: 0, total: 0 },
          month: { present: 0, absent: 0, late: 0, total: 0 },
          overall: { percentage: 0, streak: 0 }
        });
      } else {
        // No data available
        setAttendanceData({ today: [], week: [], month: [], overall: [] });
        setAttendanceStats({ today: { present: 0, absent: 0, late: 0, total: 0 }, week: { present: 0, absent: 0, late: 0, total: 0 }, month: { present: 0, absent: 0, late: 0, total: 0 }, overall: { percentage: 0, streak: 0 } });
      }
    } catch (error) {
      console.error('Error loading attendance data:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load attendance data. Please try again.",
      });
      // Set empty data on error
      setAttendanceData({ today: [], week: [], month: [], overall: [] });
      setAttendanceStats({ today: { present: 0, absent: 0, late: 0, total: 0 }, week: { present: 0, absent: 0, late: 0, total: 0 }, month: { present: 0, absent: 0, late: 0, total: 0 }, overall: { percentage: 0, streak: 0 } });
    } finally {
      setLoading(false);
    }
  };

  const loadClasses = async () => {
    try {
      // Get classes from API (using courses endpoint)
      const coursesResponse = await apiService.getCourses();
      
      if (coursesResponse.success && coursesResponse.data) {
        // Transform courses to classes format
        setClasses(coursesResponse.data.map(course => ({
          id: course.id,
          name: course.title,
          code: course.code,
          instructor: course.instructor_name || 'Unknown',
          time: course.schedule || 'TBA',
          room: course.room_name || 'TBA',
          students: course.enrolled || 0
        })));
      } else {
        setClasses([]);
      }
    } catch (error) {
      console.error('Error loading classes:', error);
      setClasses([]);
    }
  };

  const loadStudents = async () => {
    try {
      // Get students from API
      const studentsResponse = await apiService.getStudents({ role: 'student' });
      
      if (studentsResponse.success && studentsResponse.data) {
        setStudents(studentsResponse.data.map(student => ({
          id: student.id,
          name: student.name,
          email: student.email,
          rollNumber: student.student_id || 'N/A',
          status: student.is_active ? 'active' : 'inactive'
        })));
      } else {
        setStudents([]);
      }
    } catch (error) {
      console.error('Error loading students:', error);
      setStudents([]);
    }
  };

  const generateQRCode = async () => {
    setIsGeneratingQR(true);
    try {
      // Simulate QR code generation
      await new Promise(resolve => setTimeout(resolve, 500)); // Reduced from 1000ms
      setQrCode('QR_CODE_DATA_' + Date.now());
      toast({
        title: "QR Code Generated",
        description: "QR code has been generated for attendance marking.",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to generate QR code.",
      });
    } finally {
      setIsGeneratingQR(false);
    }
  };

  const markAttendance = async (studentId, status) => {
    try {
      // Get current session ID (you may need to track this)
      const currentSessionId = attendanceData.today[0]?.sessionId;
      
      if (!currentSessionId) {
        toast({
          variant: "destructive",
          title: "Error",
          description: "No active attendance session found.",
        });
        return;
      }
      
      // Call actual API
      const response = await apiService.markAttendance({
        sessionId: currentSessionId,
        studentId,
        status,
        method: attendanceMethod
      });
      
      if (response.success) {
        // Reload attendance data to get updated records
        await loadAttendanceData();
        
        toast({
          title: "Success",
          description: `Attendance marked as ${status}.`,
        });
      } else {
        throw new Error(response.message || 'Failed to mark attendance');
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to mark attendance.",
      });
    }
  };

  const bulkMarkAttendance = async (status) => {
    try {
      // Mock API call
      await new Promise(resolve => setTimeout(resolve, 500)); // Reduced from 1000ms
      
      setAttendanceData(prev => ({
        ...prev,
        today: prev.today.map(record => ({
          ...record,
          status: record.status === 'absent' ? status : record.status,
          time: record.status === 'absent' ? new Date().toLocaleTimeString() : record.time,
          method: record.status === 'absent' ? attendanceMethod : record.method
        }))
      }));

      toast({
        title: "Bulk Attendance Marked",
        description: `All absent students marked as ${status}.`,
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to mark bulk attendance.",
      });
    }
  };

  const exportAttendance = async (format) => {
    try {
      // Mock export functionality
      await new Promise(resolve => setTimeout(resolve, 1000));
      toast({
        title: "Export Complete",
        description: `Attendance data exported as ${format}.`,
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to export attendance data.",
      });
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'present': return 'bg-green-100 text-green-800 border-green-200';
      case 'absent': return 'bg-red-100 text-red-800 border-red-200';
      case 'late': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'present': return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'absent': return <XCircle className="h-4 w-4 text-red-600" />;
      case 'late': return <AlertCircle className="h-4 w-4 text-yellow-600" />;
      default: return <Minus className="h-4 w-4 text-gray-600" />;
    }
  };

  const getMethodIcon = (method) => {
    switch (method) {
      case 'qr': return <QrCode className="h-4 w-4" />;
      case 'manual': return <UserCheck className="h-4 w-4" />;
      case 'biometric': return <Fingerprint className="h-4 w-4" />;
      case 'gps': return <MapPin className="h-4 w-4" />;
      default: return <UserCheck className="h-4 w-4" />;
    }
  };

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold">Attendance Management</h1>
            <p className="text-muted-foreground">Track and manage student attendance across all classes</p>
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
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid gap-6 md:grid-cols-4">
          <Card className="shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-muted-foreground text-sm font-medium">Today</p>
                  <p className="text-3xl font-bold text-green-600">{attendanceStats.today.present}</p>
                  <p className="text-muted-foreground text-sm">Present</p>
                </div>
                <CheckCircle className="h-12 w-12 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-muted-foreground text-sm font-medium">Today</p>
                  <p className="text-3xl font-bold text-red-600">{attendanceStats.today.absent}</p>
                  <p className="text-muted-foreground text-sm">Absent</p>
                </div>
                <XCircle className="h-12 w-12 text-red-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-muted-foreground text-sm font-medium">This Month</p>
                  <p className="text-3xl font-bold text-blue-600">{attendanceStats.overall.percentage}%</p>
                  <p className="text-muted-foreground text-sm">Attendance Rate</p>
                </div>
                <TrendingUp className="h-12 w-12 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-muted-foreground text-sm font-medium">Streak</p>
                  <p className="text-3xl font-bold text-purple-600">{attendanceStats.overall.streak}</p>
                  <p className="text-muted-foreground text-sm">Days</p>
                </div>
                <Trophy className="h-12 w-12 text-purple-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="today" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="today">Today's Attendance</TabsTrigger>
            <TabsTrigger value="marking">Mark Attendance</TabsTrigger>
            <TabsTrigger value="reports">Reports</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          <TabsContent value="today" className="space-y-6">
            {/* Class Selection */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5" />
                  Select Class
                </CardTitle>
                <CardDescription>Choose a class to view attendance details.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-3">
                  {classes.map((classItem) => (
                    <Card 
                      key={classItem.id} 
                      className={`cursor-pointer transition-all hover:shadow-md ${
                        selectedClass?.id === classItem.id ? 'ring-2 ring-primary' : ''
                      }`}
                      onClick={() => setSelectedClass(classItem)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-semibold">{classItem.name}</h4>
                          <Badge variant="outline">{classItem.code}</Badge>
                        </div>
                        <div className="space-y-1 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <User className="h-3 w-3" />
                            {classItem.instructor}
                          </div>
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
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Attendance List */}
            {selectedClass && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <UserCheck className="h-5 w-5" />
                    Attendance for {selectedClass.name}
                  </CardTitle>
                  <CardDescription>Today's attendance status for all students.</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {attendanceData.today
                      .filter(record => record.classId === selectedClass.id)
                      .map((record) => (
                        <div key={record.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors">
                          <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2">
                              {getStatusIcon(record.status)}
                              <span className="font-medium">{record.studentName}</span>
                            </div>
                            <div className="flex items-center gap-4 text-sm text-muted-foreground">
                              {record.time && (
                                <div className="flex items-center gap-1">
                                  <Clock className="h-3 w-3" />
                                  {record.time}
                                </div>
                              )}
                              {record.method && (
                                <div className="flex items-center gap-1">
                                  {getMethodIcon(record.method)}
                                  {record.method}
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge className={getStatusColor(record.status)}>
                              {record.status}
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
            )}
          </TabsContent>

          <TabsContent value="marking" className="space-y-6">
            {/* Attendance Method Selection */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Attendance Method
                </CardTitle>
                <CardDescription>Choose how you want to mark attendance.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-4">
                  <Card 
                    className={`cursor-pointer transition-all hover:shadow-md ${
                      attendanceMethod === 'manual' ? 'ring-2 ring-primary' : ''
                    }`}
                    onClick={() => setAttendanceMethod('manual')}
                  >
                    <CardContent className="p-4 text-center">
                      <UserCheck className="h-8 w-8 mx-auto mb-2 text-blue-600" />
                      <h4 className="font-semibold">Manual</h4>
                      <p className="text-sm text-muted-foreground">Click to mark</p>
                    </CardContent>
                  </Card>

                  <Card 
                    className={`cursor-pointer transition-all hover:shadow-md ${
                      attendanceMethod === 'qr' ? 'ring-2 ring-primary' : ''
                    }`}
                    onClick={() => setAttendanceMethod('qr')}
                  >
                    <CardContent className="p-4 text-center">
                      <QrCode className="h-8 w-8 mx-auto mb-2 text-green-600" />
                      <h4 className="font-semibold">QR Code</h4>
                      <p className="text-sm text-muted-foreground">Scan to mark</p>
                    </CardContent>
                  </Card>

                  <Card 
                    className={`cursor-pointer transition-all hover:shadow-md ${
                      attendanceMethod === 'biometric' ? 'ring-2 ring-primary' : ''
                    }`}
                    onClick={() => setAttendanceMethod('biometric')}
                  >
                    <CardContent className="p-4 text-center">
                      <Fingerprint className="h-8 w-8 mx-auto mb-2 text-purple-600" />
                      <h4 className="font-semibold">Biometric</h4>
                      <p className="text-sm text-muted-foreground">Fingerprint scan</p>
                    </CardContent>
                  </Card>

                  <Card 
                    className={`cursor-pointer transition-all hover:shadow-md ${
                      attendanceMethod === 'gps' ? 'ring-2 ring-primary' : ''
                    }`}
                    onClick={() => setAttendanceMethod('gps')}
                  >
                    <CardContent className="p-4 text-center">
                      <MapPin className="h-8 w-8 mx-auto mb-2 text-orange-600" />
                      <h4 className="font-semibold">GPS</h4>
                      <p className="text-sm text-muted-foreground">Location based</p>
                    </CardContent>
                  </Card>
                </div>
              </CardContent>
            </Card>

            {/* QR Code Generation */}
            {attendanceMethod === 'qr' && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <QrCode className="h-5 w-5" />
                    QR Code Attendance
                  </CardTitle>
                  <CardDescription>Generate QR code for students to scan and mark attendance.</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center space-y-4">
                    {qrCode ? (
                      <div className="space-y-4">
                        <div className="w-48 h-48 mx-auto bg-white border-2 border-gray-300 rounded-lg flex items-center justify-center">
                          <div className="text-center">
                            <QrCode className="h-24 w-24 mx-auto mb-2 text-gray-600" />
                            <p className="text-sm text-gray-600">QR Code</p>
                          </div>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Students can scan this QR code to mark their attendance
                        </p>
                        <div className="flex gap-2 justify-center">
                          <Button variant="outline" onClick={() => setQrCode('')}>
                            <RefreshCw className="h-4 w-4 mr-2" />
                            Regenerate
                          </Button>
                          <Button variant="outline">
                            <Download className="h-4 w-4 mr-2" />
                            Download
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <div className="w-48 h-48 mx-auto bg-gray-100 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center">
                          <div className="text-center">
                            <QrCode className="h-16 w-16 mx-auto mb-2 text-gray-400" />
                            <p className="text-sm text-gray-500">No QR Code</p>
                          </div>
                        </div>
                        <Button onClick={generateQRCode} disabled={isGeneratingQR}>
                          {isGeneratingQR ? (
                            <>
                              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                              Generating...
                            </>
                          ) : (
                            <>
                              <Plus className="h-4 w-4 mr-2" />
                              Generate QR Code
                            </>
                          )}
                        </Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Manual Attendance Marking */}
            {attendanceMethod === 'manual' && selectedClass && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <UserCheck className="h-5 w-5" />
                    Mark Attendance - {selectedClass.name}
                  </CardTitle>
                  <CardDescription>Manually mark attendance for each student.</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {/* Bulk Actions */}
                    <div className="flex gap-2 p-4 bg-muted/50 rounded-lg">
                      <Button variant="outline" size="sm" onClick={() => bulkMarkAttendance('present')}>
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Mark All Present
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => bulkMarkAttendance('absent')}>
                        <XCircle className="h-4 w-4 mr-2" />
                        Mark All Absent
                      </Button>
                    </div>

                    {/* Student List */}
                    <div className="space-y-2">
                      {attendanceData.today
                        .filter(record => record.classId === selectedClass.id)
                        .map((record) => (
                          <div key={record.id} className="flex items-center justify-between p-3 border rounded-lg">
                            <div className="flex items-center gap-3">
                              <span className="font-medium">{record.studentName}</span>
                              <Badge className={getStatusColor(record.status)}>
                                {record.status}
                              </Badge>
                            </div>
                            <div className="flex gap-2">
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => markAttendance(record.studentId, 'present')}
                                className={record.status === 'present' ? 'bg-green-50 border-green-200' : ''}
                              >
                                <CheckCircle className="h-4 w-4" />
                              </Button>
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => markAttendance(record.studentId, 'late')}
                                className={record.status === 'late' ? 'bg-yellow-50 border-yellow-200' : ''}
                              >
                                <AlertCircle className="h-4 w-4" />
                              </Button>
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => markAttendance(record.studentId, 'absent')}
                                className={record.status === 'absent' ? 'bg-red-50 border-red-200' : ''}
                              >
                                <XCircle className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="reports" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Attendance Reports
                </CardTitle>
                <CardDescription>Generate and export attendance reports.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-3">
                  <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => exportAttendance('PDF')}>
                    <CardContent className="p-4 text-center">
                      <FileText className="h-8 w-8 mx-auto mb-2 text-red-600" />
                      <h4 className="font-semibold">PDF Report</h4>
                      <p className="text-sm text-muted-foreground">Download as PDF</p>
                    </CardContent>
                  </Card>

                  <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => exportAttendance('Excel')}>
                    <CardContent className="p-4 text-center">
                      <Database className="h-8 w-8 mx-auto mb-2 text-green-600" />
                      <h4 className="font-semibold">Excel Report</h4>
                      <p className="text-sm text-muted-foreground">Download as Excel</p>
                    </CardContent>
                  </Card>

                  <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => exportAttendance('CSV')}>
                    <CardContent className="p-4 text-center">
                      <FileText className="h-8 w-8 mx-auto mb-2 text-blue-600" />
                      <h4 className="font-semibold">CSV Report</h4>
                      <p className="text-sm text-muted-foreground">Download as CSV</p>
                    </CardContent>
                  </Card>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settings" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Attendance Settings
                </CardTitle>
                <CardDescription>Configure attendance policies and settings.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <Label htmlFor="lateThreshold">Late Threshold (minutes)</Label>
                      <Input id="lateThreshold" type="number" defaultValue="15" />
                    </div>
                    <div>
                      <Label htmlFor="attendanceRequired">Minimum Attendance Required (%)</Label>
                      <Input id="attendanceRequired" type="number" defaultValue="75" />
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="flex items-center space-x-2">
                      <Checkbox id="autoMarkAbsent" defaultChecked />
                      <Label htmlFor="autoMarkAbsent">Auto-mark absent after class ends</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox id="allowLateMarking" />
                      <Label htmlFor="allowLateMarking">Allow late attendance marking</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox id="sendNotifications" defaultChecked />
                      <Label htmlFor="sendNotifications">Send attendance notifications</Label>
                    </div>
                  </div>
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

export default EnhancedAttendanceManagement;

