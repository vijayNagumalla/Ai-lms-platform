import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { 
  User, 
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
  Settings,
  BarChart3,
  TrendingUp,
  Activity,
  Bell,
  Shield,
  Globe,
  Home,
  School,
  Mail,
  Phone,
  FileText,
  Database,
  Zap,
  Target,
  Award,
  Star,
  Trophy,
  Calendar,
  Timer,
  Repeat,
  ArrowLeft,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  XCircle,
  Minus,
  PlusCircle,
  UserCheck,
  UserX,
  UserPlus,
  UserMinus,
  Calendar as CalendarIcon,
  Clock3,
  MapPin as MapPinIcon,
  Smartphone,
  Monitor,
  Laptop,
  Tablet,
  Camera,
  Mic,
  Video,
  Headphones,
  Wifi as WifiIcon,
  WifiOff as WifiOffIcon,
  Battery,
  BatteryLow,
  Signal,
  SignalHigh,
  SignalLow,
  SignalZero,
  Zap as ZapIcon,
  Target as TargetIcon,
  Award as AwardIcon,
  Star as StarIcon,
  Trophy as TrophyIcon,
  Activity as ActivityIcon,
  Bell as BellIcon,
  Shield as ShieldIcon,
  Globe as GlobeIcon,
  Home as HomeIcon,
  School as SchoolIcon,
  Building as BuildingIcon,
  Mail as MailIcon,
  Phone as PhoneIcon,
  FileText as FileTextIcon,
  Database as DatabaseIcon,
  BarChart3 as BarChart3Icon,
  TrendingUp as TrendingUpIcon,
  Settings as SettingsIcon,
  Search as SearchIcon,
  Filter as FilterIcon,
  Plus as PlusIcon,
  Edit3 as Edit3Icon,
  Trash2 as Trash2Icon,
  Eye as EyeIcon,
  AlertCircle as AlertCircleIcon,
  CheckCircle as CheckCircleIcon,
  RefreshCw as RefreshCwIcon,
  Wifi as WifiIcon2,
  WifiOff as WifiOffIcon2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import apiService from '@/services/api';
import { useToast } from '@/components/ui/use-toast';

const EnhancedFacultyStatusManagement = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [lastRefresh, setLastRefresh] = useState(new Date());
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [faculty, setFaculty] = useState([]);
  const [facultyStatus, setFacultyStatus] = useState({});
  const [availability, setAvailability] = useState({});
  const [workload, setWorkload] = useState({});
  const [location, setLocation] = useState({});
  const [selectedFaculty, setSelectedFaculty] = useState(null);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [statusStats, setStatusStats] = useState({
    total: 0,
    available: 0,
    busy: 0,
    away: 0,
    offline: 0
  });

  // Real-time data refresh
  const refreshData = useCallback(async () => {
    setIsRefreshing(true);
    try {
      await loadFaculty();
      await loadFacultyStatus();
      await loadAvailability();
      await loadWorkload();
      await loadLocation();
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

  const loadFaculty = async () => {
    try {
      const response = await apiService.getUsers({ role: 'faculty' });
      
      if (response.success && response.data) {
        setFaculty(response.data);
        // Status stats will be calculated after loadFacultyStatus is called
        // For now, just set total count
        setStatusStats({
          total: response.data.length,
          available: 0,
          busy: 0,
          away: 0,
          offline: 0
        });
      } else {
        setFaculty([]);
        setStatusStats({ total: 0, available: 0, busy: 0, away: 0, offline: 0 });
      }
    } catch (error) {
      console.error('Error loading faculty:', error);
      setFaculty([]);
      setStatusStats({ total: 0, available: 0, busy: 0, away: 0, offline: 0 });
    }
  };

  const loadFacultyStatus = async () => {
    try {
      const response = await apiService.getFacultyStatus();
      
      if (response.success && response.data) {
        // Transform API response to match component structure
        const statusMap = {};
        if (Array.isArray(response.data)) {
          response.data.forEach(item => {
            statusMap[item.faculty_id || item.id] = {
              status: item.status || 'offline',
              lastSeen: item.last_seen || item.lastSeen || new Date().toISOString(),
              device: item.device || 'unknown',
              browser: item.browser || 'unknown'
            };
          });
        } else if (typeof response.data === 'object') {
          Object.assign(statusMap, response.data);
        }
        
        setFacultyStatus(statusMap);
      } else {
        setFacultyStatus({});
      }
    } catch (error) {
      console.error('Error loading faculty status:', error);
      setFacultyStatus({});
    }
  };

  const loadAvailability = async () => {
    try {
      const response = await apiService.getFacultyAvailability();
      
      if (response.success && response.data) {
        // Transform API response to match component structure
        const availabilityMap = {};
        if (Array.isArray(response.data)) {
          response.data.forEach(item => {
            availabilityMap[item.faculty_id || item.id] = {
              schedule: item.schedule || [],
              timezone: item.timezone || 'UTC',
              workingHours: item.working_hours || item.workingHours || { start: '09:00', end: '17:00' },
              breaks: item.breaks || []
            };
          });
        } else if (typeof response.data === 'object') {
          Object.assign(availabilityMap, response.data);
        }
        
        setAvailability(availabilityMap);
      } else {
        setAvailability({});
      }
    } catch (error) {
      console.error('Error loading availability:', error);
      setAvailability({});
    }
  };

  const loadWorkload = async () => {
    try {
      const response = await apiService.getFacultyWorkload();
      
      if (response.success && response.data) {
        // Transform API response to match component structure
        const workloadMap = {};
        if (Array.isArray(response.data)) {
          response.data.forEach(item => {
            workloadMap[item.faculty_id || item.id] = {
              teaching: item.teaching || { hours: 0, courses: 0, students: 0 },
              research: item.research || { hours: 0, projects: 0, publications: 0 },
              admin: item.admin || { hours: 0, tasks: 0, meetings: 0 },
              total: item.total || 0
            };
          });
        } else if (typeof response.data === 'object') {
          Object.assign(workloadMap, response.data);
        }
        
        setWorkload(workloadMap);
      } else {
        setWorkload({});
      }
    } catch (error) {
      console.error('Error loading workload:', error);
      setWorkload({});
    }
  };

  const loadLocation = async () => {
    try {
      // Location tracking may not be implemented in API yet
      // For now, set empty location data
      // Future: Implement location tracking API endpoint
      setLocation({});
    } catch (error) {
      console.error('Error loading location:', error);
      setLocation({});
    }
  };

  const updateFacultyStatus = async (facultyId, status) => {
    try {
      const response = await apiService.updateFacultyStatus({
        facultyId,
        status
      });
      
      if (response.success) {
        // Reload faculty status
        await loadFacultyStatus();
        
        toast({
          title: "Status Updated",
          description: `Faculty status updated to ${status}.`,
        });
      } else {
        throw new Error(response.message || 'Failed to update faculty status');
      }
    } catch (error) {
      console.error('Error updating faculty status:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to update faculty status.",
      });
    }
  };

  const updateAvailability = async (facultyId, availabilityData) => {
    try {
      // Note: You may need to add an updateAvailability method to apiService
      // For now, using PUT to /enhanced/faculty/availability
      const response = await apiService.put('/enhanced/faculty/availability', {
        facultyId,
        ...availabilityData
      });
      
      if (response.success) {
        // Reload availability
        await loadAvailability();
        
        toast({
          title: "Availability Updated",
          description: "Faculty availability has been updated successfully.",
        });
      } else {
        throw new Error(response.message || 'Failed to update availability');
      }
    } catch (error) {
      console.error('Error updating availability:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to update availability.",
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
      default: return <Minus className="h-4 w-4 text-gray-600" />;
    }
  };

  const getLocationIcon = (locationType) => {
    switch (locationType) {
      case 'on_campus': return <Building className="h-4 w-4 text-blue-600" />;
      case 'remote': return <Home className="h-4 w-4 text-green-600" />;
      case 'off_campus': return <MapPin className="h-4 w-4 text-orange-600" />;
      default: return <MapPin className="h-4 w-4 text-gray-600" />;
    }
  };

  const getDeviceIcon = (device) => {
    switch (device) {
      case 'desktop': return <Monitor className="h-4 w-4" />;
      case 'laptop': return <Laptop className="h-4 w-4" />;
      case 'mobile': return <Smartphone className="h-4 w-4" />;
      case 'tablet': return <Tablet className="h-4 w-4" />;
      default: return <Monitor className="h-4 w-4" />;
    }
  };

  const formatTime = (time) => {
    if (!time || typeof time !== 'string') {
      return 'N/A';
    }
    try {
      const [hours, minutes] = time.split(':');
      if (!hours || !minutes) {
        return 'N/A';
      }
      const hour = parseInt(hours);
      if (isNaN(hour)) {
        return 'N/A';
      }
      const ampm = hour >= 12 ? 'PM' : 'AM';
      const displayHour = hour % 12 || 12;
      return `${displayHour}:${minutes} ${ampm}`;
    } catch (error) {
      console.error('Error formatting time:', error, time);
      return 'N/A';
    }
  };

  const getWorkloadColor = (percentage) => {
    if (percentage >= 90) return 'text-red-600';
    if (percentage >= 75) return 'text-orange-600';
    if (percentage >= 50) return 'text-yellow-600';
    return 'text-green-600';
  };

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold">Faculty Status Management</h1>
            <p className="text-muted-foreground">Monitor faculty availability, workload, and real-time status</p>
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
        <div className="grid gap-6 md:grid-cols-5">
          <Card className="shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-muted-foreground text-sm font-medium">Total Faculty</p>
                  <p className="text-3xl font-bold text-blue-600">{statusStats.total}</p>
                </div>
                <Users className="h-12 w-12 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-muted-foreground text-sm font-medium">Available</p>
                  <p className="text-3xl font-bold text-green-600">{statusStats.available}</p>
                </div>
                <CheckCircle className="h-12 w-12 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-muted-foreground text-sm font-medium">Busy</p>
                  <p className="text-3xl font-bold text-yellow-600">{statusStats.busy}</p>
                </div>
                <Clock className="h-12 w-12 text-yellow-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-muted-foreground text-sm font-medium">Away</p>
                  <p className="text-3xl font-bold text-orange-600">{statusStats.away}</p>
                </div>
                <AlertCircle className="h-12 w-12 text-orange-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-muted-foreground text-sm font-medium">Offline</p>
                  <p className="text-3xl font-bold text-gray-600">{statusStats.offline}</p>
                </div>
                <XCircle className="h-12 w-12 text-gray-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="status" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="status">Status Overview</TabsTrigger>
            <TabsTrigger value="availability">Availability</TabsTrigger>
            <TabsTrigger value="workload">Workload</TabsTrigger>
            <TabsTrigger value="location">Location</TabsTrigger>
          </TabsList>

          <TabsContent value="status" className="space-y-6">
            {/* Faculty Status List */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  Faculty Status Overview
                </CardTitle>
                <CardDescription>Real-time status and activity of all faculty members.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {faculty.map((member) => {
                    const status = facultyStatus[member.id];
                    const locationData = location[member.id];
                    const workloadData = workload[member.id];
                    
                    return (
                      <div key={member.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors">
                        <div className="flex items-center gap-4">
                          <div className="p-2 bg-blue-100 rounded-lg">
                            <User className="h-4 w-4 text-blue-600" />
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
                                <GraduationCap className="h-3 w-3" />
                                {member.position}
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          {/* Status */}
                          <div className="flex items-center gap-2">
                            {getStatusIcon(status?.status)}
                            <Badge className={getStatusColor(status?.status)}>
                              {status?.status || 'unknown'}
                            </Badge>
                          </div>
                          
                          {/* Device */}
                          <div className="flex items-center gap-1">
                            {getDeviceIcon(status?.device)}
                            <span className="text-xs text-muted-foreground">{status?.device}</span>
                          </div>
                          
                          {/* Location */}
                          <div className="flex items-center gap-1">
                            {getLocationIcon(locationData?.type)}
                            <span className="text-xs text-muted-foreground">
                              {locationData?.type === 'on_campus' ? locationData?.room : locationData?.type}
                            </span>
                          </div>
                          
                          {/* Workload */}
                          <div className="text-sm">
                            <span className="text-muted-foreground">Workload: </span>
                            <span className={getWorkloadColor(workloadData?.total || 0)}>
                              {workloadData?.total || 0}h
                            </span>
                          </div>
                          
                          {/* Actions */}
                          <div className="flex items-center gap-2">
                            <Button variant="outline" size="sm" onClick={() => setSelectedFaculty(member)}>
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button variant="outline" size="sm" onClick={() => setShowStatusModal(true)}>
                              <Edit3 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="availability" className="space-y-6">
            {/* Availability Calendar */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Faculty Availability
                </CardTitle>
                <CardDescription>View and manage faculty availability schedules.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {faculty.map((member) => {
                    const availabilityData = availability[member.id];
                    
                    return (
                      <div key={member.id} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-4">
                          <h4 className="font-semibold">{member.name}</h4>
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-muted-foreground">
                              Working Hours: {availabilityData?.workingHours?.start && availabilityData?.workingHours?.end 
                                ? `${formatTime(availabilityData.workingHours.start)} - ${formatTime(availabilityData.workingHours.end)}`
                                : 'Not set'}
                            </span>
                            <Button variant="outline" size="sm">
                              <Edit3 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                        
                        <div className="grid gap-2 md:grid-cols-5">
                          {availabilityData?.schedule?.map((day, index) => (
                            <div key={index} className="p-2 border rounded text-center">
                              <div className="font-medium text-sm">{day.day}</div>
                              <div className="text-xs text-muted-foreground">
                                {day.start && day.end 
                                  ? `${formatTime(day.start)} - ${formatTime(day.end)}`
                                  : 'Not set'}
                              </div>
                              <Badge variant="outline" className="text-xs mt-1">
                                {day.type}
                              </Badge>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="workload" className="space-y-6">
            {/* Workload Analysis */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Faculty Workload Analysis
                </CardTitle>
                <CardDescription>Monitor teaching, research, and administrative workload distribution.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {faculty.map((member) => {
                    const workloadData = workload[member.id];
                    
                    return (
                      <div key={member.id} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-4">
                          <h4 className="font-semibold">{member.name}</h4>
                          <div className="text-right">
                            <div className="text-2xl font-bold">
                              <span className={getWorkloadColor(workloadData?.total || 0)}>
                                {workloadData?.total || 0}h
                              </span>
                            </div>
                            <div className="text-sm text-muted-foreground">Total Hours</div>
                          </div>
                        </div>
                        
                        <div className="grid gap-4 md:grid-cols-3">
                          <div className="p-3 bg-blue-50 rounded-lg">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-sm font-medium text-blue-800">Teaching</span>
                              <span className="text-sm font-bold text-blue-600">{workloadData?.teaching?.hours || 0}h</span>
                            </div>
                            <div className="text-xs text-blue-600">
                              {workloadData?.teaching?.courses || 0} courses, {workloadData?.teaching?.students || 0} students
                            </div>
                          </div>
                          
                          <div className="p-3 bg-green-50 rounded-lg">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-sm font-medium text-green-800">Research</span>
                              <span className="text-sm font-bold text-green-600">{workloadData?.research?.hours || 0}h</span>
                            </div>
                            <div className="text-xs text-green-600">
                              {workloadData?.research?.projects || 0} projects, {workloadData?.research?.publications || 0} publications
                            </div>
                          </div>
                          
                          <div className="p-3 bg-purple-50 rounded-lg">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-sm font-medium text-purple-800">Administrative</span>
                              <span className="text-sm font-bold text-purple-600">{workloadData?.admin?.hours || 0}h</span>
                            </div>
                            <div className="text-xs text-purple-600">
                              {workloadData?.admin?.tasks || 0} tasks, {workloadData?.admin?.meetings || 0} meetings
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="location" className="space-y-6">
            {/* Location Tracking */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  Faculty Location Tracking
                </CardTitle>
                <CardDescription>Monitor faculty location and presence on campus.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {faculty.map((member) => {
                    const locationData = location[member.id];
                    const status = facultyStatus[member.id];
                    
                    return (
                      <div key={member.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors">
                        <div className="flex items-center gap-4">
                          <div className="p-2 bg-blue-100 rounded-lg">
                            <User className="h-4 w-4 text-blue-600" />
                          </div>
                          <div>
                            <h4 className="font-semibold">{member.name}</h4>
                            <div className="flex items-center gap-4 text-sm text-muted-foreground">
                              <div className="flex items-center gap-1">
                                {getLocationIcon(locationData?.type)}
                                {locationData?.type === 'on_campus' ? `${locationData?.building}, ${locationData?.room}` : locationData?.type}
                              </div>
                              <div className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                Last seen: {new Date(status?.lastSeen).toLocaleTimeString()}
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge className={getStatusColor(status?.status)}>
                            {status?.status}
                          </Badge>
                          <Button variant="outline" size="sm">
                            <MapPin className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    );
                  })}
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

export default EnhancedFacultyStatusManagement;

