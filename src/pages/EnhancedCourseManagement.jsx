import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { 
  BookOpen, 
  Plus, 
  Edit3, 
  Trash2, 
  Eye, 
  Users, 
  Calendar, 
  Clock,
  MapPin,
  GraduationCap,
  User,
  Mail,
  Phone,
  Settings,
  BarChart3,
  TrendingUp,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  Wifi,
  WifiOff,
  Search,
  Filter,
  Download,
  Upload,
  FileText,
  Video,
  Image,
  Code,
  BookMarked,
  Award,
  Star,
  Target,
  Zap,
  Activity,
  Bell,
  Shield,
  Globe,
  Home,
  School,
  Building
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import apiService from '@/services/api';
import { useToast } from '@/components/ui/use-toast';

const EnhancedCourseManagement = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [lastRefresh, setLastRefresh] = useState(new Date());
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [courses, setCourses] = useState([]);
  const [faculty, setFaculty] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [courseStats, setCourseStats] = useState({
    total: 0,
    active: 0,
    completed: 0,
    enrolled: 0
  });

  // Real-time data refresh
  const refreshData = useCallback(async () => {
    setIsRefreshing(true);
    try {
      await loadCourses();
      await loadFaculty();
      await loadDepartments();
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

  const loadCourses = async () => {
    try {
      setLoading(true);
      const response = await apiService.getCourses();
      
      if (response.success && response.data) {
        // Transform API data to match component structure
        const transformedCourses = response.data.map(course => ({
          id: course.id,
          name: course.title,
          code: course.code,
          description: course.description || '',
          instructor: course.instructor_name || 'TBA',
          department: course.department || 'Unknown',
          credits: course.credits || 3,
          semester: course.semester || 'Current',
          status: course.status || 'active',
          enrolled: course.enrolled || 0,
          capacity: course.capacity || 50,
          progress: course.progress || 0,
          startDate: course.start_date || '',
          endDate: course.end_date || '',
          schedule: course.schedule || 'TBA',
          room: course.room_name || 'TBA',
          prerequisites: course.prerequisites ? (Array.isArray(course.prerequisites) ? course.prerequisites : JSON.parse(course.prerequisites)) : [],
          objectives: course.objectives ? (Array.isArray(course.objectives) ? course.objectives : JSON.parse(course.objectives)) : []
        }));
        
        setCourses(transformedCourses);
        setCourseStats({
          total: transformedCourses.length,
          active: transformedCourses.filter(c => c.status === 'active').length,
          completed: transformedCourses.filter(c => c.status === 'completed').length,
          enrolled: transformedCourses.reduce((sum, c) => sum + c.enrolled, 0)
        });
      } else {
        setCourses([]);
        setCourseStats({ total: 0, active: 0, completed: 0, enrolled: 0 });
      }
    } catch (error) {
      console.error('Error loading courses:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load courses. Please try again.",
      });
      setCourses([]);
      setCourseStats({ total: 0, active: 0, completed: 0, enrolled: 0 });
    } finally {
      setLoading(false);
    }
  };

  const loadFaculty = async () => {
    try {
      // Get faculty users from API
      const response = await apiService.getUsers({ role: 'faculty' });
      
      if (response.success && response.data) {
        setFaculty(response.data.map(f => ({
          id: f.id,
          name: f.name,
          email: f.email,
          department: f.department || 'Unknown',
          status: f.is_active ? 'active' : 'inactive'
        })));
      } else {
        setFaculty([]);
      }
    } catch (error) {
      console.error('Error loading faculty:', error);
      setFaculty([]);
    }
  };

  const loadDepartments = async () => {
    try {
      const response = await apiService.getDepartments();
      
      if (response.success && response.data) {
        setDepartments(response.data.map(d => ({
          id: d.id,
          name: d.name,
          code: d.code || d.name.substring(0, 4).toUpperCase(),
          head: d.head_name || 'TBA'
        })));
      } else {
        setDepartments([]);
      }
    } catch (error) {
      console.error('Error loading departments:', error);
      setDepartments([]);
    }
  };

  const createCourse = async (courseData) => {
    try {
      setLoading(true);
      // Transform data to match API format
      const apiData = {
        title: courseData.name,
        code: courseData.code,
        description: courseData.description,
        instructor_id: courseData.instructor,
        department: courseData.department,
        credits: courseData.credits,
        semester: courseData.semester,
        start_date: courseData.startDate,
        end_date: courseData.endDate,
        schedule: courseData.schedule,
        room_id: courseData.room,
        prerequisites: JSON.stringify(courseData.prerequisites || []),
        objectives: JSON.stringify(courseData.objectives || []),
        capacity: courseData.capacity || 50,
        status: 'active'
      };
      
      const response = await apiService.createCourse(apiData);
      
      if (response.success) {
        // Reload courses to get updated list
        await loadCourses();
        setShowCreateModal(false);
        
        toast({
          title: "Course Created",
          description: `${courseData.name} has been created successfully.`,
        });
      } else {
        throw new Error(response.message || 'Failed to create course');
      }
    } catch (error) {
      console.error('Error creating course:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to create course.",
      });
    } finally {
      setLoading(false);
    }
  };

  const updateCourse = async (courseId, updates) => {
    try {
      setLoading(true);
      // Transform data to match API format
      const apiData = {
        title: updates.name,
        code: updates.code,
        description: updates.description,
        instructor_id: updates.instructor,
        department: updates.department,
        credits: updates.credits,
        semester: updates.semester,
        start_date: updates.startDate,
        end_date: updates.endDate,
        schedule: updates.schedule,
        room_id: updates.room,
        prerequisites: JSON.stringify(updates.prerequisites || []),
        objectives: JSON.stringify(updates.objectives || []),
        capacity: updates.capacity,
        status: updates.status
      };
      
      // Note: You may need to add an updateCourse method to apiService
      // For now, using PUT to /enhanced/courses/{courseId}
      const response = await apiService.put(`/enhanced/courses/${courseId}`, apiData);
      
      if (response.success) {
        // Reload courses to get updated list
        await loadCourses();
        
        toast({
          title: "Course Updated",
          description: "Course has been updated successfully.",
        });
      } else {
        throw new Error(response.message || 'Failed to update course');
      }
    } catch (error) {
      console.error('Error updating course:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to update course.",
      });
    } finally {
      setLoading(false);
    }
  };

  const deleteCourse = async (courseId) => {
    try {
      setLoading(true);
      // Note: You may need to add a deleteCourse method to apiService
      // For now, using DELETE to /enhanced/courses/{courseId}
      const response = await apiService.delete(`/enhanced/courses/${courseId}`);
      
      if (response.success) {
        // Reload courses to get updated list
        await loadCourses();
        
        toast({
          title: "Course Deleted",
          description: "Course has been deleted successfully.",
        });
      } else {
        throw new Error(response.message || 'Failed to delete course');
      }
    } catch (error) {
      console.error('Error deleting course:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to delete course.",
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800 border-green-200';
      case 'completed': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'scheduled': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'cancelled': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getProgressColor = (progress) => {
    if (progress >= 80) return 'text-green-600';
    if (progress >= 60) return 'text-blue-600';
    if (progress >= 40) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold">Course Management</h1>
            <p className="text-muted-foreground">Manage courses, faculty assignments, and student enrollment</p>
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

            {/* Create Course Button */}
            <Button onClick={() => setShowCreateModal(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create Course
            </Button>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid gap-6 md:grid-cols-4">
          <Card className="shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-muted-foreground text-sm font-medium">Total Courses</p>
                  <p className="text-3xl font-bold text-blue-600">{courseStats.total}</p>
                </div>
                <BookOpen className="h-12 w-12 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-muted-foreground text-sm font-medium">Active Courses</p>
                  <p className="text-3xl font-bold text-green-600">{courseStats.active}</p>
                </div>
                <Activity className="h-12 w-12 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-muted-foreground text-sm font-medium">Total Enrolled</p>
                  <p className="text-3xl font-bold text-purple-600">{courseStats.enrolled}</p>
                </div>
                <Users className="h-12 w-12 text-purple-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-muted-foreground text-sm font-medium">Completed</p>
                  <p className="text-3xl font-bold text-orange-600">{courseStats.completed}</p>
                </div>
                <CheckCircle className="h-12 w-12 text-orange-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="courses" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="courses">Courses</TabsTrigger>
            <TabsTrigger value="faculty">Faculty</TabsTrigger>
            <TabsTrigger value="departments">Departments</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>

          <TabsContent value="courses" className="space-y-6">
            {/* Courses List */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {courses.map((course) => (
                <Card key={course.id} className="shadow-lg hover:shadow-xl transition-shadow">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-lg">{course.name}</CardTitle>
                        <CardDescription>{course.code} • {course.credits} credits</CardDescription>
                      </div>
                      <Badge className={getStatusColor(course.status)}>
                        {course.status}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span>Progress</span>
                          <span className={getProgressColor(course.progress)}>{course.progress}%</span>
                        </div>
                        <Progress value={course.progress} className="h-2" />
                      </div>
                      
                      <div className="text-sm text-muted-foreground space-y-1">
                        <div className="flex justify-between">
                          <span>Instructor:</span>
                          <span>{course.instructor}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Enrolled:</span>
                          <span>{course.enrolled}/{course.capacity}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Schedule:</span>
                          <span>{course.schedule}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Room:</span>
                          <span>{course.room}</span>
                        </div>
                      </div>
                      
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" className="flex-1" onClick={() => setSelectedCourse(course)}>
                          <Eye className="h-4 w-4 mr-2" />
                          View
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => updateCourse(course.id, { status: 'completed' })}>
                          <Edit3 className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => deleteCourse(course.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="faculty" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <GraduationCap className="h-5 w-5" />
                  Faculty Members
                </CardTitle>
                <CardDescription>Manage faculty assignments and information.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {faculty.map((member) => (
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
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={member.status === 'active' ? 'default' : 'secondary'}>
                          {member.status}
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
          </TabsContent>

          <TabsContent value="departments" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building className="h-5 w-5" />
                  Departments
                </CardTitle>
                <CardDescription>Manage academic departments and programs.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {departments.map((dept) => (
                    <div key={dept.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors">
                      <div className="flex items-center gap-4">
                        <div className="p-2 bg-purple-100 rounded-lg">
                          <Building className="h-4 w-4 text-purple-600" />
                        </div>
                        <div>
                          <h4 className="font-semibold">{dept.name}</h4>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <span>Code: {dept.code}</span>
                            <span>Head: {dept.head}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm">
                          <Edit3 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Course Analytics
                </CardTitle>
                <CardDescription>Course performance and enrollment analytics.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="p-4 bg-blue-50 rounded-lg">
                      <h4 className="font-semibold text-blue-800 mb-2">Enrollment Trends</h4>
                      <p className="text-2xl font-bold text-blue-600">{courseStats.enrolled}</p>
                      <p className="text-sm text-blue-600">Total Students</p>
                    </div>
                    <div className="p-4 bg-green-50 rounded-lg">
                      <h4 className="font-semibold text-green-800 mb-2">Average Progress</h4>
                      <p className="text-2xl font-bold text-green-600">
                        {Math.round(courses.reduce((sum, c) => sum + c.progress, 0) / courses.length)}%
                      </p>
                      <p className="text-sm text-green-600">Course Completion</p>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <h4 className="font-semibold">Course Performance</h4>
                    {courses.map((course) => (
                      <div key={course.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                        <div>
                          <span className="font-medium">{course.name}</span>
                          <span className="text-sm text-muted-foreground ml-2">({course.code})</span>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-sm">
                            <span className="text-muted-foreground">Progress: </span>
                            <span className={getProgressColor(course.progress)}>{course.progress}%</span>
                          </div>
                          <div className="text-sm">
                            <span className="text-muted-foreground">Enrolled: </span>
                            <span>{course.enrolled}</span>
                          </div>
                        </div>
                      </div>
                    ))}
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

export default EnhancedCourseManagement;

