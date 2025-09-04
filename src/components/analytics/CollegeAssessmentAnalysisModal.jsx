import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import apiService from '@/services/api';

// Icons
import {
  Users, Clock, Target, Award, TrendingUp, TrendingDown, 
  Download, Filter, Search, Eye, Calendar, BookOpen,
  CheckCircle, XCircle, AlertTriangle, Info, Star,
  BarChart3, PieChart, LineChart, Activity, Zap,
  Trophy, Medal, Crown, Building2, GraduationCap,
  BarChart, PieChart as PieChartIcon, LineChart as LineChartIcon,
  Clock as ClockIcon, Target as TargetIcon, Users as UsersIcon
} from 'lucide-react';

const CollegeAssessmentAnalysisModal = ({ 
  isOpen, 
  onClose, 
  assessmentId, 
  assessmentTitle,
  collegeId 
}) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });

  // Load assessment analysis data
  const loadAssessmentAnalysis = async () => {
    if (!assessmentId) return;
    
    try {
      setLoading(true);
      const response = await apiService.getAssessmentCollegeAnalysis(assessmentId, {
        collegeId: collegeId || 'all'
      });
      
      if (response.success) {
        setData(response.data);
      } else {
        toast({
          variant: "destructive",
          title: "Error",
          description: response.message || "Failed to load assessment analysis"
        });
      }
    } catch (error) {
      console.error('Error loading assessment analysis:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load assessment analysis"
      });
    } finally {
      setLoading(false);
    }
  };

  // Load data when modal opens
  useEffect(() => {
    if (isOpen && assessmentId) {
      loadAssessmentAnalysis();
    }
  }, [isOpen, assessmentId, collegeId]);

  // Filter and sort leaderboard
  const filteredLeaderboard = React.useMemo(() => {
    if (!data?.leaderboard) return [];

    let filtered = data.leaderboard.filter(student =>
      student.student_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.student_email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.department?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (sortConfig.key) {
      filtered.sort((a, b) => {
        const aValue = a[sortConfig.key];
        const bValue = b[sortConfig.key];
        
        if (aValue < bValue) {
          return sortConfig.direction === 'asc' ? -1 : 1;
        }
        if (aValue > bValue) {
          return sortConfig.direction === 'asc' ? 1 : -1;
        }
        return 0;
      });
    }

    return filtered;
  }, [data?.leaderboard, searchTerm, sortConfig]);

  const handleSort = (key) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const getSortIcon = (key) => {
    if (sortConfig.key !== key) return null;
    return sortConfig.direction === 'asc' ? '↑' : '↓';
  };

  const getPerformanceBadge = (score) => {
    if (score >= 90) return <Badge variant="default" className="bg-green-100 text-green-800">Excellent</Badge>;
    if (score >= 80) return <Badge variant="default" className="bg-blue-100 text-blue-800">Good</Badge>;
    if (score >= 70) return <Badge variant="default" className="bg-yellow-100 text-yellow-800">Average</Badge>;
    if (score >= 60) return <Badge variant="default" className="bg-orange-100 text-orange-800">Below Average</Badge>;
    return <Badge variant="default" className="bg-red-100 text-red-800">Needs Improvement</Badge>;
  };

  const getRankBadge = (index) => {
    if (index === 0) return <Crown className="h-4 w-4 text-yellow-500" />;
    if (index === 1) return <Medal className="h-4 w-4 text-gray-400" />;
    if (index === 2) return <Trophy className="h-4 w-4 text-orange-500" />;
    return <span className="text-sm font-medium text-gray-500">#{index + 1}</span>;
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString();
  };

  const formatDuration = (minutes) => {
    if (!minutes) return 'N/A';
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  if (!data) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-7xl max-h-[95vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>College Assessment Analysis</DialogTitle>
          </DialogHeader>
          <div className="flex items-center justify-center h-64">
            {loading ? (
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
                <p className="mt-2 text-gray-600">Loading analysis...</p>
              </div>
            ) : (
              <p className="text-gray-500">No data available</p>
            )}
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-7xl max-h-[95vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            College Analysis: {data.assessment?.title || assessmentTitle}
          </DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="departments">Departments</TabsTrigger>
            <TabsTrigger value="leaderboard">Leaderboard</TabsTrigger>
            <TabsTrigger value="charts">Charts</TabsTrigger>
            <TabsTrigger value="time">Time Analysis</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Departments</CardTitle>
                  <Building2 className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{data.departmentAnalysis?.length || 0}</div>
                  <p className="text-xs text-muted-foreground">
                    Participating departments
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Students</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {data.departmentAnalysis?.reduce((sum, dept) => sum + (dept.total_students || 0), 0) || 0}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Students across all departments
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Average Score</CardTitle>
                  <Target className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {data.departmentAnalysis?.length > 0 
                      ? (data.departmentAnalysis.reduce((sum, dept) => sum + (dept.average_score || 0), 0) / data.departmentAnalysis.length).toFixed(1)
                      : 0}%
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Overall performance
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Top Department</CardTitle>
                  <Award className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-lg font-bold">
                    {data.departmentAnalysis?.[0]?.department || 'N/A'}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {data.departmentAnalysis?.[0]?.average_score?.toFixed(1) || 0}% average
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Assessment Info */}
            <Card>
              <CardHeader>
                <CardTitle>Assessment Information</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium">Title</Label>
                    <p className="text-sm text-gray-600">{data.assessment?.title}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Type</Label>
                    <p className="text-sm text-gray-600">{data.assessment?.assessment_type}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Difficulty</Label>
                    <p className="text-sm text-gray-600">{data.assessment?.difficulty_level}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Time Limit</Label>
                    <p className="text-sm text-gray-600">
                      {data.assessment?.time_limit_minutes ? `${data.assessment.time_limit_minutes} minutes` : 'No limit'}
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Total Points</Label>
                    <p className="text-sm text-gray-600">{data.assessment?.total_points || 0}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Passing Score</Label>
                    <p className="text-sm text-gray-600">{data.assessment?.passing_score || 0}%</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Departments Tab */}
          <TabsContent value="departments" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Department-wise Performance Analysis</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Department</TableHead>
                      <TableHead>Total Students</TableHead>
                      <TableHead>Attempted</TableHead>
                      <TableHead>Participation Rate</TableHead>
                      <TableHead>Average Score</TableHead>
                      <TableHead>Highest Score</TableHead>
                      <TableHead>Lowest Score</TableHead>
                      <TableHead>Pass Rate</TableHead>
                      <TableHead>Avg Time</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.departmentAnalysis?.map((dept) => (
                      <TableRow key={dept.department}>
                        <TableCell className="font-medium">{dept.department}</TableCell>
                        <TableCell>{dept.total_students}</TableCell>
                        <TableCell>{dept.attempted_students}</TableCell>
                        <TableCell>
                          <Badge variant={dept.participation_rate >= 80 ? 'default' : 'secondary'}>
                            {dept.participation_rate?.toFixed(1) || 0}%
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <span className="font-medium">{dept.average_score?.toFixed(1) || 0}%</span>
                            {getPerformanceBadge(dept.average_score)}
                          </div>
                        </TableCell>
                        <TableCell>{dept.highest_score?.toFixed(1) || 0}%</TableCell>
                        <TableCell>{dept.lowest_score?.toFixed(1) || 0}%</TableCell>
                        <TableCell>
                          {dept.attempted_students > 0 
                            ? Math.round((dept.passed_count / dept.attempted_students) * 100)
                            : 0}%
                        </TableCell>
                        <TableCell>{formatDuration(dept.average_time_taken)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Leaderboard Tab */}
          <TabsContent value="leaderboard" className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Input
                  placeholder="Search students..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-64"
                />
              </div>
              <Button variant="outline" size="sm">
                <Download className="mr-2 h-4 w-4" />
                Export Leaderboard
              </Button>
            </div>

            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Rank</TableHead>
                      <TableHead>
                        <Button variant="ghost" onClick={() => handleSort('student_name')} className="h-auto p-0">
                          Student Name {getSortIcon('student_name')}
                        </Button>
                      </TableHead>
                      <TableHead>
                        <Button variant="ghost" onClick={() => handleSort('department')} className="h-auto p-0">
                          Department {getSortIcon('department')}
                        </Button>
                      </TableHead>
                      <TableHead>
                        <Button variant="ghost" onClick={() => handleSort('percentage_score')} className="h-auto p-0">
                          Score {getSortIcon('percentage_score')}
                        </Button>
                      </TableHead>
                      <TableHead>
                        <Button variant="ghost" onClick={() => handleSort('time_taken_minutes')} className="h-auto p-0">
                          Time {getSortIcon('time_taken_minutes')}
                        </Button>
                      </TableHead>
                      <TableHead>Performance</TableHead>
                      <TableHead>Submitted</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredLeaderboard.map((student, index) => (
                      <TableRow key={student.submission_id}>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            {getRankBadge(index)}
                          </div>
                        </TableCell>
                        <TableCell className="font-medium">{student.student_name}</TableCell>
                        <TableCell>{student.department}</TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <span className="font-medium">{student.percentage_score?.toFixed(1) || 0}%</span>
                            <span className="text-sm text-gray-500">
                              ({student.score}/{student.max_score})
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>{formatDuration(student.time_taken_minutes)}</TableCell>
                        <TableCell>
                          {getPerformanceBadge(student.percentage_score)}
                        </TableCell>
                        <TableCell>{formatDate(student.submitted_at)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Charts Tab */}
          <TabsContent value="charts" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Score Distribution Chart */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <PieChartIcon className="h-5 w-5" />
                    Score Distribution
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {data.scoreDistribution?.map((item) => (
                      <div key={item.score_range} className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div className="w-4 h-4 rounded-full bg-blue-500"></div>
                          <span>{item.score_range}</span>
                        </div>
                        <div className="flex items-center space-x-4">
                          <div className="w-32 bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-blue-500 h-2 rounded-full" 
                              style={{ 
                                width: `${data.leaderboard?.length > 0 
                                  ? (item.count / data.leaderboard.length) * 100 
                                  : 0}%` 
                              }}
                            ></div>
                          </div>
                          <span className="font-medium">{item.count} students</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Department Performance Chart */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart className="h-5 w-5" />
                    Department Performance
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {data.departmentAnalysis?.slice(0, 5).map((dept) => (
                      <div key={dept.department} className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div className="w-4 h-4 rounded-full bg-green-500"></div>
                          <span className="text-sm">{dept.department}</span>
                        </div>
                        <div className="flex items-center space-x-4">
                          <div className="w-32 bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-green-500 h-2 rounded-full" 
                              style={{ 
                                width: `${dept.average_score || 0}%` 
                              }}
                            ></div>
                          </div>
                          <span className="font-medium">{dept.average_score?.toFixed(1) || 0}%</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Time Analysis Tab */}
          <TabsContent value="time" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Time Analysis by Department</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Department</TableHead>
                      <TableHead>Submissions</TableHead>
                      <TableHead>Average Time</TableHead>
                      <TableHead>Fastest Time</TableHead>
                      <TableHead>Slowest Time</TableHead>
                      <TableHead>Efficiency</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.timeAnalysis?.map((time) => (
                      <TableRow key={time.department}>
                        <TableCell className="font-medium">{time.department}</TableCell>
                        <TableCell>{time.submission_count}</TableCell>
                        <TableCell>{formatDuration(time.average_time)}</TableCell>
                        <TableCell>{formatDuration(time.fastest_time)}</TableCell>
                        <TableCell>{formatDuration(time.slowest_time)}</TableCell>
                        <TableCell>
                          <Badge variant={time.average_time <= 30 ? 'default' : 'secondary'}>
                            {time.average_time <= 30 ? 'Efficient' : 'Standard'}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default CollegeAssessmentAnalysisModal; 