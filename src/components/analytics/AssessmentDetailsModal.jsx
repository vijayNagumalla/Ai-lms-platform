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
  BarChart3, PieChart, LineChart, Activity, Zap
} from 'lucide-react';

const AssessmentDetailsModal = ({ 
  isOpen, 
  onClose, 
  assessmentId, 
  assessmentTitle 
}) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
  const [activeTab, setActiveTab] = useState('overview');

  // Load assessment details
  const loadAssessmentDetails = async () => {
    if (!assessmentId) return;
    
    try {
      setLoading(true);
      const response = await apiService.getAssessmentDetails(assessmentId);
      
      if (response.success) {
        setData(response.data);
      } else {
        toast({
          variant: "destructive",
          title: "Error",
          description: response.message || "Failed to load assessment details"
        });
      }
    } catch (error) {
      console.error('Error loading assessment details:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load assessment details"
      });
    } finally {
      setLoading(false);
    }
  };

  // Load data when modal opens
  useEffect(() => {
    if (isOpen && assessmentId) {
      loadAssessmentDetails();
    }
  }, [isOpen, assessmentId]);

  // Filter and sort submissions
  const filteredSubmissions = React.useMemo(() => {
    if (!data?.submissions) return [];

    let filtered = data.submissions.filter(submission =>
      submission.student_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      submission.student_email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      submission.college_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      submission.department?.toLowerCase().includes(searchTerm.toLowerCase())
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
  }, [data?.submissions, searchTerm, sortConfig]);

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
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Assessment Details</DialogTitle>
          </DialogHeader>
          <div className="flex items-center justify-center h-64">
            {loading ? (
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
                <p className="mt-2 text-gray-600">Loading assessment details...</p>
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
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            Assessment Details: {data.assessment?.title || assessmentTitle}
          </DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="submissions">Submissions</TabsTrigger>
            <TabsTrigger value="statistics">Statistics</TabsTrigger>
            <TabsTrigger value="distribution">Score Distribution</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Students</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{data.statistics?.total_students || 0}</div>
                  <p className="text-xs text-muted-foreground">
                    Students who attempted
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
                    {data.statistics?.average_score?.toFixed(1) || 0}%
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Overall performance
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Pass Rate</CardTitle>
                  <Award className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {data.statistics?.total_submissions > 0 
                      ? Math.round((data.statistics.passed_count / data.statistics.total_submissions) * 100)
                      : 0}%
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Students who passed
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Avg Time</CardTitle>
                  <Clock className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {formatDuration(data.statistics?.average_time_taken)}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Time per attempt
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
                  <div>
                    <Label className="text-sm font-medium">Created By</Label>
                    <p className="text-sm text-gray-600">{data.assessment?.created_by_name || 'Unknown'}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Created Date</Label>
                    <p className="text-sm text-gray-600">{formatDate(data.assessment?.created_at)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Submissions Tab */}
          <TabsContent value="submissions" className="space-y-4">
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
                Export
              </Button>
            </div>

            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>
                        <Button variant="ghost" onClick={() => handleSort('student_name')} className="h-auto p-0">
                          Student Name {getSortIcon('student_name')}
                        </Button>
                      </TableHead>
                      <TableHead>
                        <Button variant="ghost" onClick={() => handleSort('student_email')} className="h-auto p-0">
                          Email {getSortIcon('student_email')}
                        </Button>
                      </TableHead>
                      <TableHead>
                        <Button variant="ghost" onClick={() => handleSort('college_name')} className="h-auto p-0">
                          College {getSortIcon('college_name')}
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
                      <TableHead>
                        <Button variant="ghost" onClick={() => handleSort('submitted_at')} className="h-auto p-0">
                          Submitted {getSortIcon('submitted_at')}
                        </Button>
                      </TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Performance</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredSubmissions.map((submission) => (
                      <TableRow key={submission.submission_id}>
                        <TableCell className="font-medium">{submission.student_name}</TableCell>
                        <TableCell>{submission.student_email}</TableCell>
                        <TableCell>{submission.college_name || 'N/A'}</TableCell>
                        <TableCell>{submission.department || 'N/A'}</TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <span className="font-medium">{submission.percentage_score?.toFixed(1) || 0}%</span>
                            <span className="text-sm text-gray-500">
                              ({submission.score}/{submission.max_score})
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>{formatDuration(submission.time_taken_minutes)}</TableCell>
                        <TableCell>{formatDate(submission.submitted_at)}</TableCell>
                        <TableCell>
                          <Badge variant={submission.status === 'graded' ? 'default' : 'secondary'}>
                            {submission.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {getPerformanceBadge(submission.percentage_score)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Statistics Tab */}
          <TabsContent value="statistics" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Performance Summary</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between">
                      <span>Highest Score</span>
                      <span className="font-medium">{data.statistics?.highest_score?.toFixed(1) || 0}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Lowest Score</span>
                      <span className="font-medium">{data.statistics?.lowest_score?.toFixed(1) || 0}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Passed Students</span>
                      <span className="font-medium">{data.statistics?.passed_count || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Failed Students</span>
                      <span className="font-medium">{data.statistics?.failed_count || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Total Submissions</span>
                      <span className="font-medium">{data.statistics?.total_submissions || 0}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Time Analysis</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between">
                      <span>Average Time</span>
                      <span className="font-medium">{formatDuration(data.statistics?.average_time_taken)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Time Limit</span>
                      <span className="font-medium">
                        {data.assessment?.time_limit_minutes ? `${data.assessment.time_limit_minutes} minutes` : 'No limit'}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Score Distribution Tab */}
          <TabsContent value="distribution" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Score Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {data.scoreDistribution?.map((item) => (
                    <div key={item.scoreRange} className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="w-4 h-4 rounded-full bg-blue-500"></div>
                        <span>{item.scoreRange}</span>
                      </div>
                      <div className="flex items-center space-x-4">
                        <div className="w-32 bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-blue-500 h-2 rounded-full" 
                            style={{ 
                              width: `${data.statistics?.total_submissions > 0 
                                ? (item.count / data.statistics.total_submissions) * 100 
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
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default AssessmentDetailsModal; 