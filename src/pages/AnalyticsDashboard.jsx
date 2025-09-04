import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import apiService from '@/services/api';
import EnhancedExportModal from '@/components/analytics/EnhancedExportModal';
import excelExportService from '@/services/excelExportService';

// Icons
import {
  Users, BookOpen, Target, Clock, Download, Filter, RefreshCw, 
  Calendar, Building, GraduationCap, Eye, FileText,
  CheckCircle, XCircle, AlertTriangle, TrendingUp, TrendingDown, Award,
  ClipboardList, Search, ArrowLeft, X
} from 'lucide-react';

const AnalyticsDashboard = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  
  // State management
  const [loading, setLoading] = useState(true);
  const [analyticsData, setAnalyticsData] = useState(null);
  const [assessments, setAssessments] = useState([]);
  const [exporting, setExporting] = useState(false);
  const [showEnhancedExport, setShowEnhancedExport] = useState(false);
  const [selectedAssessmentForExport, setSelectedAssessmentForExport] = useState(null);
  
  // Simple filters - initialize based on user role
  const [filters, setFilters] = useState(() => {
    const initialFilters = {
      dateRange: '30',
      collegeId: 'all',
      assessmentType: 'all'
    };
    
    // Set default college filter based on user role
    if (user?.role === 'admin' && user?.college_id) {
      initialFilters.collegeId = user.college_id;
    } else if (user?.role === 'faculty' && user?.college_id) {
      initialFilters.collegeId = user.college_id;
    }
    
    return initialFilters;
  });
  
  const [filterOptions, setFilterOptions] = useState({
    colleges: [],
    assessmentTypes: []
  });

  const [searchTerm, setSearchTerm] = useState('');
  const [showAssessmentDetails, setShowAssessmentDetails] = useState(false);
  const [selectedAssessment, setSelectedAssessment] = useState(null);

  useEffect(() => {
    loadData();
    loadFilterOptions();
  }, [filters]);

  const loadFilterOptions = async () => {
    try {
      // Load colleges for filtering - filter based on user role
      const collegesResponse = await apiService.getCollegesForAnalytics();
      if (collegesResponse.success) {
        let filteredColleges = collegesResponse.data;
        
        // Filter colleges based on user role
        if (user?.role === 'admin' && user?.college_id) {
          // Admins can only see their own college
          filteredColleges = collegesResponse.data.filter(college => college.id === user.college_id);
        } else if (user?.role === 'faculty' && user?.college_id) {
          // Faculty can only see their own college
          filteredColleges = collegesResponse.data.filter(college => college.id === user.college_id);
        }
        // Students and super_admins can see all colleges
        
        setFilterOptions(prev => ({
          ...prev,
          colleges: filteredColleges
        }));
      }

      // Load assessment types
      const typesResponse = await apiService.getAssessmentTypes();
      if (typesResponse.success) {
        setFilterOptions(prev => ({
          ...prev,
          assessmentTypes: typesResponse.data
        }));
      }
    } catch (error) {
      // Error loading filter options
    }
  };

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Load analytics data
      const response = await apiService.getAnalyticsData(filters);
      
      if (response.success) {
        setAnalyticsData(response.data);
        
        // Set assessments from analytics data
        if (response.data.assessmentStats) {
          setAssessments(response.data.assessmentStats);
        } else {
          setAssessments([]);
        }
      }
      
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load analytics data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    loadData();
  };

  const handleViewStudentResponse = (submission) => {
    // For now, we'll show a toast with the submission details
    // In a real implementation, this would open a modal or navigate to a detailed view
    toast({
      title: "Student Response",
      description: `Viewing response for ${submission.student_name} (Score: ${submission.score || 0}%)`,
    });
    
    // TODO: Implement actual response viewing functionality
    // This could open a modal showing the student's answers, or navigate to a detailed view
    console.log('Viewing student response:', submission);
  };

  const handleViewAssessmentDetails = async (assessment) => {
    try {
      // Get detailed assessment data including submissions
      const response = await apiService.getAssessmentSubmissions(assessment.id);
      if (response.success) {
        setSelectedAssessment({
          ...assessment,
          submissions: response.data
        });
        setShowAssessmentDetails(true);
      } else {
        toast({
          title: "Error",
          description: "Failed to load assessment details",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load assessment details",
        variant: "destructive"
      });
    }
  };

  const handleExportAssessmentData = async (assessmentId, assessmentName) => {
    // Find the assessment data
    const assessment = assessments.find(a => a.id === assessmentId);
    if (!assessment) {
      toast({
        title: "Export Failed",
        description: "Assessment not found.",
        variant: "destructive",
      });
      return;
    }

    setSelectedAssessmentForExport(assessment);
    setShowEnhancedExport(true);
  };

  const handleEnhancedExport = async (exportConfig) => {
    setExporting(true);
    try {
      const { type, columns, filters, settings, assessmentData, submissions } = exportConfig;
      
      // For regular export, we need to get the actual question types for this assessment
      let enhancedAssessmentData = { ...assessmentData };
      
      if (type === 'regular' && assessmentData?.id) {
        try {
          // Get assessment details with question types
          const response = await apiService.get(`/assessments/${assessmentData.id}/questions`);
          if (response.success && response.data) {
            const questionTypes = [...new Set(response.data.map(q => q.question_type))];
            enhancedAssessmentData.questionTypes = questionTypes;
            enhancedAssessmentData.questions = response.data;
          }
        } catch (error) {
          console.warn('Could not fetch question types, using defaults:', error);
        }
      }
      
      // Generate filename
      const filename = excelExportService.generateFilename(enhancedAssessmentData, settings);
      
      // Create workbook with enhanced assessment data
      const enhancedConfig = {
        ...exportConfig,
        assessmentData: enhancedAssessmentData
      };
      
      const workbook = await excelExportService.exportAssessmentData(enhancedConfig);
      
      // Download the file
      await excelExportService.downloadWorkbook(filename, settings.fileFormat);
      
      toast({
        title: "Export Successful",
        description: `${type === 'regular' ? 'Regular' : 'Advanced'} export completed successfully.`,
      });
    } catch (error) {
      console.error('Export failed:', error);
      toast({
        title: "Export Failed",
        description: "Failed to export data. Please try again.",
        variant: "destructive",
      });
    } finally {
      setExporting(false);
    }
  };

  const handleExportAllData = async () => {
    try {
      setExporting(true);
      
      // Prepare CSV data for all assessments
      const headers = [
        'Assessment Name',
        'Type',
        'Total Students',
        'Students Attempted',
        'Students Completed',
        'Completion Rate (%)',
        'Average Score (%)',
        'Status'
      ];

             const csvData = assessments.map(assessment => [
         assessment.title || '',
         assessment.assessment_type || '',
         assessment.totalStudents || 0,
         assessment.totalStudents || 0,
         assessment.completedSubmissions || 0,
         assessment.totalStudents > 0 ? Math.round((assessment.completedSubmissions / assessment.totalStudents) * 100) : 0,
         assessment.averageScore || 0,
         'published'
       ]);

      // Create CSV content
      const csvContent = [headers, ...csvData]
        .map(row => row.map(cell => `"${cell}"`).join(','))
        .join('\n');

      // Download CSV
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      
      const timestamp = new Date().toISOString().split('T')[0];
      const filename = `all_assessments_analytics_${timestamp}.csv`;
      
      link.setAttribute('download', filename);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast({
        title: "Success",
        description: `Exported analytics data for ${assessments.length} assessments`,
      });
      
    } catch (error) {
      // Export error
      toast({
        title: "Error",
        description: "Failed to export data",
        variant: "destructive"
      });
    } finally {
      setExporting(false);
    }
  };

  // Filter assessments based on search
  const filteredAssessments = assessments.filter(assessment => {
    const matchesSearch = !searchTerm || 
      assessment.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      assessment.type?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      assessment.assessment_type?.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesSearch;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-4">
        <div className="w-full">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-primary mx-auto"></div>
            <p className="mt-4 text-muted-foreground text-lg">Loading analytics...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-1 sm:p-2 md:p-4">
      <div className="w-full max-w-none space-y-4 sm:space-y-6 -mt-1 sm:-mt-2 md:-mt-4">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-muted via-muted/50 to-muted rounded-2xl p-4 sm:p-6 text-card-foreground shadow-lg border border-border">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold mb-2">Assessment Analytics Dashboard</h1>
              <p className="text-sm sm:text-lg text-muted-foreground">Track assessment completion and student performance</p>
              {/* Role-based data scope indicator */}
              <div className="mt-2 flex items-center space-x-2">
                <Badge variant="secondary" className="text-sm">
                  {user?.role === 'student' && '📊 Your Performance Data'}
                  {user?.role === 'faculty' && '👨‍🏫 Your Department Analytics'}
                  {user?.role === 'admin' && '🏫 Your College Analytics'}
                  {user?.role === 'super_admin' && '🌐 System-wide Analytics'}
                </Badge>
                {user?.role === 'faculty' && user?.department && (
                  <Badge variant="outline" className="text-sm">
                    Department: {user.department}
                  </Badge>
                )}
                {user?.role === 'admin' && user?.college_id && (
                  <Badge variant="outline" className="text-sm">
                    College ID: {user.college_id}
                  </Badge>
                )}
              </div>
            </div>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-4">
              <Button onClick={handleRefresh} variant="outline" className="w-full sm:w-auto">
                <RefreshCw className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
                <span className="text-sm sm:text-base">Refresh</span>
              </Button>
              <Button onClick={handleExportAllData} disabled={exporting} variant="outline" className="w-full sm:w-auto bg-green-600 hover:bg-green-700 text-white border-green-600">
                <Download className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
                <span className="text-sm sm:text-base">{exporting ? 'Exporting...' : 'Export All'}</span>
              </Button>
              <Button 
                onClick={() => setShowEnhancedExport(true)} 
                disabled={exporting} 
                variant="outline" 
                className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white border-blue-600"
              >
                <Download className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
                <span className="text-sm sm:text-base">Enhanced Export</span>
              </Button>
            </div>
          </div>
        </div>

        {/* Search and Filters */}
        <Card className="bg-card backdrop-blur-sm border-0 shadow-lg border border-border">
          <CardContent className="p-4 sm:p-6">
            <div className="flex flex-col gap-4">
              {/* Search Bar */}
              <div className="flex items-center space-x-2 sm:space-x-4 w-full">
                <Search className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground flex-shrink-0" />
                <Input
                  placeholder="Search assessments..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="flex-1 text-sm sm:text-base"
                />
              </div>
              
              {/* Filters */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full">
                <div className="w-full">
                  <Label htmlFor="dateRange" className="text-xs sm:text-sm text-muted-foreground">Date Range</Label>
                  <Select value={filters.dateRange} onValueChange={(value) => setFilters(prev => ({ ...prev, dateRange: value }))}>
                    <SelectTrigger className="text-sm">
                      <SelectValue placeholder="Select date range" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="7">Last 7 days</SelectItem>
                      <SelectItem value="30">Last 30 days</SelectItem>
                      <SelectItem value="90">Last 90 days</SelectItem>
                      <SelectItem value="365">Last year</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {/* Hide college filter for students, show for others */}
                {user?.role !== 'student' && (
                  <div className="w-full">
                    <Label htmlFor="collegeId" className="text-xs sm:text-sm text-muted-foreground">College</Label>
                    <Select 
                      value={filters.collegeId} 
                      onValueChange={(value) => setFilters(prev => ({ ...prev, collegeId: value }))}
                      disabled={user?.role === 'admin' || user?.role === 'faculty'}
                    >
                      <SelectTrigger className="text-sm">
                        <SelectValue placeholder="Select college" />
                      </SelectTrigger>
                      <SelectContent>
                        {user?.role === 'super_admin' && <SelectItem value="all">All Colleges</SelectItem>}
                        {filterOptions.colleges && Array.isArray(filterOptions.colleges) && filterOptions.colleges.map(college => (
                          <SelectItem key={college.id} value={college.id}>
                            {college.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {(user?.role === 'admin' || user?.role === 'faculty') && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Filtered to your college automatically
                      </p>
                    )}
                  </div>
                )}

              </div>
            </div>
          </CardContent>
        </Card>

        {/* Assessments Table */}
        <Card className="bg-card backdrop-blur-sm border-0 shadow-lg border border-border">
          <CardContent className="p-0">
            {/* Desktop Table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border bg-muted/30">
                    <th className="text-left p-4 font-semibold text-card-foreground">Assessment Name</th>
                    <th className="text-center p-4 font-semibold text-card-foreground">Total Students</th>
                    <th className="text-center p-4 font-semibold text-card-foreground">Students Attempted</th>
                    <th className="text-center p-4 font-semibold text-card-foreground">Student Submissions</th>
                    <th className="text-center p-4 font-semibold text-card-foreground">Completion Rate</th>
                    <th className="text-center p-4 font-semibold text-card-foreground">Average Score</th>
                    <th className="text-center p-4 font-semibold text-card-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAssessments.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="text-center py-8">
                        <div className="text-muted-foreground">
                          <FileText className="h-12 w-12 mx-auto mb-2 opacity-50" />
                          <p className="text-lg font-medium">No assessments found</p>
                          <p className="text-sm">No assessments match your current filters or no assessments have been created yet.</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredAssessments.map((assessment) => (
                    <tr key={assessment.id} className="border-b border-border hover:bg-muted/20">
                      <td className="p-4">
                        <div>
                          <div className="font-medium text-card-foreground">{assessment.title || 'Untitled Assessment'}</div>
                          <div className="text-sm text-muted-foreground">{assessment.description || 'No description available'}</div>
                        </div>
                      </td>
                      <td className="text-center p-4">
                        <Badge variant="outline">{assessment.totalStudents || 0}</Badge>
                      </td>
                      <td className="text-center p-4">
                        <Badge variant="secondary">{assessment.totalStudents || 0}</Badge>
                      </td>
                      <td className="text-center p-4">
                        <Badge variant="default">{assessment.completedSubmissions || 0}</Badge>
                      </td>
                      <td className="text-center p-4">
                        <div className="flex items-center justify-center">
                          <span className="font-medium">
                            {assessment.totalStudents > 0 ? Math.round((assessment.completedSubmissions / assessment.totalStudents) * 100) : 0}%
                          </span>
                        </div>
                      </td>
                      <td className="text-center p-4">
                        <div className="flex items-center justify-center">
                          <span className="font-medium">
                            {assessment.averageScore ? Math.round(assessment.averageScore) : 0}%
                          </span>
                        </div>
                      </td>
                      <td className="text-center p-4">
                        <div className="flex items-center justify-center space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleViewAssessmentDetails(assessment)}
                            className="bg-blue-600 hover:bg-blue-700 text-white border-blue-600"
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            View Details
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleExportAssessmentData(assessment.id, assessment.title)}
                            disabled={exporting}
                            className="bg-green-600 hover:bg-green-700 text-white border-green-600"
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Mobile Card Layout */}
            <div className="md:hidden">
              {filteredAssessments.length === 0 ? (
                <div className="text-center py-8 px-4">
                  <div className="text-muted-foreground">
                    <FileText className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p className="text-lg font-medium">No assessments found</p>
                    <p className="text-sm">No assessments match your current filters or no assessments have been created yet.</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-4 p-4">
                  {filteredAssessments.map((assessment) => (
                    <div key={assessment.id} className="bg-muted/20 rounded-lg p-4 border border-border">
                      <div className="space-y-3">
                        {/* Assessment Title */}
                        <div>
                          <h3 className="font-medium text-card-foreground text-sm">{assessment.title || 'Untitled Assessment'}</h3>
                          <p className="text-xs text-muted-foreground mt-1">{assessment.description || 'No description available'}</p>
                        </div>
                        
                        {/* Stats Grid */}
                        <div className="grid grid-cols-2 gap-3">
                          <div className="text-center">
                            <div className="text-lg font-semibold text-card-foreground">{assessment.totalStudents || 0}</div>
                            <div className="text-xs text-muted-foreground">Total Students</div>
                          </div>
                          <div className="text-center">
                            <div className="text-lg font-semibold text-card-foreground">{assessment.completedSubmissions || 0}</div>
                            <div className="text-xs text-muted-foreground">Submissions</div>
                          </div>
                          <div className="text-center">
                            <div className="text-lg font-semibold text-card-foreground">
                              {assessment.totalStudents > 0 ? Math.round((assessment.completedSubmissions / assessment.totalStudents) * 100) : 0}%
                            </div>
                            <div className="text-xs text-muted-foreground">Completion</div>
                          </div>
                          <div className="text-center">
                            <div className="text-lg font-semibold text-card-foreground">
                              {assessment.averageScore ? Math.round(assessment.averageScore) : 0}%
                            </div>
                            <div className="text-xs text-muted-foreground">Avg Score</div>
                          </div>
                        </div>
                        
                        {/* Action Buttons */}
                        <div className="flex gap-2 pt-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleViewAssessmentDetails(assessment)}
                            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white border-blue-600 text-xs"
                          >
                            <Eye className="h-3 w-3 mr-1" />
                            View Details
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleExportAssessmentData(assessment.id, assessment.title)}
                            disabled={exporting}
                            className="bg-green-600 hover:bg-green-700 text-white border-green-600 text-xs"
                          >
                            <Download className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Assessment Details Modal */}
        <Dialog open={showAssessmentDetails} onOpenChange={setShowAssessmentDetails}>
          <DialogContent className="max-w-[98vw] w-[98vw] sm:max-w-[95vw] sm:w-[95vw] md:max-w-[92vw] md:w-[92vw] lg:max-w-[90vw] lg:w-[90vw] xl:max-w-[88vw] xl:w-[88vw] 2xl:max-w-[85vw] 2xl:w-[85vw] max-h-[98vh] h-[98vh] overflow-hidden flex flex-col">
            <DialogHeader className="flex-shrink-0 border-b pb-4">
              <DialogTitle className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowAssessmentDetails(false)}
                    className="h-8 w-8 p-0 hover:bg-muted"
                  >
                    <ArrowLeft className="h-4 w-4" />
                  </Button>
                  <div>
                    <h2 className="text-xl font-bold text-foreground">Assessment Details</h2>
                    <p className="text-sm text-muted-foreground mt-1">{selectedAssessment?.title || 'Untitled Assessment'}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Button
                    onClick={() => handleExportAssessmentData(selectedAssessment?.id, selectedAssessment?.title)}
                    disabled={exporting}
                    variant="outline"
                    size="sm"
                    className="bg-green-600 hover:bg-green-700 text-white border-green-600"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    {exporting ? 'Exporting...' : 'Export'}
                  </Button>
                </div>
              </DialogTitle>
            </DialogHeader>
            
            {selectedAssessment && (
              <div className="flex-1 overflow-y-auto space-y-6 p-1">
                {/* Key Metrics */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg font-semibold flex items-center">
                      <Target className="h-5 w-5 mr-2 text-blue-600" />
                      Key Metrics
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4 border border-blue-200">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-2xl font-bold text-blue-700">{selectedAssessment.totalStudents || 0}</p>
                            <p className="text-sm text-blue-600 font-medium">Total Students</p>
                          </div>
                          <Users className="h-8 w-8 text-blue-500" />
                        </div>
                      </div>
                      <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-4 border border-green-200">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-2xl font-bold text-green-700">{selectedAssessment.completedSubmissions || 0}</p>
                            <p className="text-sm text-green-600 font-medium">Submissions</p>
                          </div>
                          <CheckCircle className="h-8 w-8 text-green-500" />
                        </div>
                      </div>
                      <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-4 border border-purple-200">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-2xl font-bold text-purple-700">
                              {selectedAssessment.totalStudents > 0 ? Math.round((selectedAssessment.completedSubmissions / selectedAssessment.totalStudents) * 100) : 0}%
                            </p>
                            <p className="text-sm text-purple-600 font-medium">Completion Rate</p>
                          </div>
                          <TrendingUp className="h-8 w-8 text-purple-500" />
                        </div>
                      </div>
                      <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl p-4 border border-orange-200">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-2xl font-bold text-orange-700">
                              {selectedAssessment.averageScore ? Math.round(selectedAssessment.averageScore) : 0}%
                            </p>
                            <p className="text-sm text-orange-600 font-medium">Average Score</p>
                          </div>
                          <Award className="h-8 w-8 text-orange-500" />
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Student Submissions */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg font-semibold flex items-center">
                      <ClipboardList className="h-5 w-5 mr-2 text-indigo-600" />
                      Student Submissions
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    {/* Desktop Table */}
                    <div className="hidden lg:block overflow-x-auto">
                      <table className="w-full min-w-[700px]">
                        <thead>
                          <tr className="border-b border-border bg-muted/30">
                            <th className="text-left p-3 font-semibold text-card-foreground min-w-[160px]">Student</th>
                            <th className="text-center p-3 font-semibold text-card-foreground min-w-[100px]">College</th>
                            <th className="text-center p-3 font-semibold text-card-foreground min-w-[90px]">Department</th>
                            <th className="text-center p-3 font-semibold text-card-foreground min-w-[100px]">Submission Date</th>
                            <th className="text-center p-3 font-semibold text-card-foreground min-w-[60px]">Score</th>
                            <th className="text-center p-3 font-semibold text-card-foreground min-w-[80px]">Status</th>
                            <th className="text-center p-3 font-semibold text-card-foreground min-w-[80px]">Time Taken</th>
                            <th className="text-center p-3 font-semibold text-card-foreground min-w-[60px]">Attempt</th>
                            <th className="text-center p-3 font-semibold text-card-foreground min-w-[80px]">Response</th>
                          </tr>
                        </thead>
                        <tbody>
                          {selectedAssessment.submissions && selectedAssessment.submissions.length > 0 ? (
                            selectedAssessment.submissions.map((submission, index) => (
                              <tr key={submission.id} className="border-b border-border hover:bg-muted/50 transition-colors duration-200">
                                <td className="p-2">
                                  <div className="space-y-0.5">
                                    <div className="font-medium text-card-foreground text-xs">{submission.student_name}</div>
                                    <div className="text-xs text-muted-foreground font-mono">{submission.student_id_number}</div>
                                    <div className="text-xs text-muted-foreground truncate max-w-[140px]" title={submission.student_email}>
                                      {submission.student_email}
                                    </div>
                                  </div>
                                </td>
                                <td className="text-center p-2">
                                  <div className="text-xs text-muted-foreground truncate max-w-[90px]" title={submission.college_name}>
                                    {submission.college_name}
                                  </div>
                                </td>
                                <td className="text-center p-2">
                                  <div className="text-xs text-muted-foreground truncate max-w-[80px]" title={submission.department_name}>
                                    {submission.department_name}
                                  </div>
                                </td>
                                <td className="text-center p-2">
                                  <div className="text-xs text-muted-foreground">
                                    {submission.submitted_at ? new Date(submission.submitted_at).toLocaleDateString() : 'Not submitted'}
                                  </div>
                                </td>
                                <td className="text-center p-2">
                                  <Badge 
                                    variant={
                                      submission.score >= 80 ? 'default' : 
                                      submission.score >= 60 ? 'secondary' : 
                                      'destructive'
                                    }
                                    className="font-medium text-xs px-1.5 py-0.5"
                                  >
                                    {submission.score || 0}%
                                  </Badge>
                                </td>
                                <td className="text-center p-2">
                                  <Badge 
                                    variant={
                                      submission.status === 'submitted' || submission.status === 'graded' ? 'default' : 
                                      submission.status === 'in_progress' ? 'secondary' : 
                                      'outline'
                                    }
                                    className="text-xs px-1.5 py-0.5"
                                  >
                                    {submission.status || 'Not attempted'}
                                  </Badge>
                                </td>
                                <td className="text-center p-2">
                                  <div className="text-xs text-muted-foreground">
                                    {submission.time_taken_minutes ? `${submission.time_taken_minutes}m` : '-'}
                                  </div>
                                </td>
                                <td className="text-center p-2">
                                  <div className="text-xs text-muted-foreground font-mono">
                                    {submission.attempt_number || 1}
                                  </div>
                                </td>
                                <td className="text-center p-2">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleViewStudentResponse(submission)}
                                    className="bg-blue-600 hover:bg-blue-700 text-white border-blue-600 px-1.5 py-0.5 text-xs h-6"
                                  >
                                    <Eye className="h-3 w-3 mr-0.5" />
                                    View
                                  </Button>
                                </td>
                              </tr>
                            ))
                          ) : (
                            <tr>
                              <td colSpan="9" className="text-center py-12">
                                <div className="text-muted-foreground">
                                  <FileText className="h-16 w-16 mx-auto mb-4 opacity-50" />
                                  <p className="text-lg font-medium">No submissions found</p>
                                  <p className="text-sm">This assessment doesn't have any student submissions yet.</p>
                                </div>
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>

                    {/* Mobile Card Layout */}
                    <div className="lg:hidden">
                      {selectedAssessment.submissions && selectedAssessment.submissions.length > 0 ? (
                        <div className="space-y-4 p-4">
                          {selectedAssessment.submissions.map((submission) => (
                            <div key={submission.id} className="bg-muted/20 rounded-lg p-4 border border-border">
                              <div className="space-y-3">
                                {/* Student Info */}
                                <div className="flex items-start justify-between">
                                  <div className="flex-1">
                                    <h4 className="font-medium text-card-foreground">{submission.student_name}</h4>
                                    <p className="text-xs text-muted-foreground font-mono">{submission.student_id_number}</p>
                                    <p className="text-xs text-muted-foreground truncate">{submission.student_email}</p>
                                  </div>
                                  <div className="text-right">
                                    <Badge 
                                      variant={
                                        submission.score >= 80 ? 'default' : 
                                        submission.score >= 60 ? 'secondary' : 
                                        'destructive'
                                      }
                                      className="font-medium"
                                    >
                                      {submission.score || 0}%
                                    </Badge>
                                  </div>
                                </div>
                                
                                {/* Submission Details */}
                                <div className="grid grid-cols-2 gap-3 text-xs">
                                  <div>
                                    <span className="text-muted-foreground">College:</span>
                                    <p className="font-medium">{submission.college_name}</p>
                                  </div>
                                  <div>
                                    <span className="text-muted-foreground">Department:</span>
                                    <p className="font-medium">{submission.department_name}</p>
                                  </div>
                                  <div>
                                    <span className="text-muted-foreground">Status:</span>
                                    <Badge 
                                      variant={
                                        submission.status === 'submitted' || submission.status === 'graded' ? 'default' : 
                                        submission.status === 'in_progress' ? 'secondary' : 
                                        'outline'
                                      }
                                      className="text-xs"
                                    >
                                      {submission.status || 'Not attempted'}
                                    </Badge>
                                  </div>
                                  <div>
                                    <span className="text-muted-foreground">Time:</span>
                                    <p className="font-medium">{submission.time_taken_minutes ? `${submission.time_taken_minutes} min` : '-'}</p>
                                  </div>
                                </div>
                                
                                {/* Submission Date */}
                                <div className="pt-2 border-t border-border">
                                  <span className="text-xs text-muted-foreground">Submitted:</span>
                                  <p className="text-xs font-medium">
                                    {submission.submitted_at ? new Date(submission.submitted_at).toLocaleString() : 'Not submitted'}
                                  </p>
                                </div>
                                
                                {/* Response Button */}
                                <div className="pt-3">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleViewStudentResponse(submission)}
                                    className="w-full bg-blue-600 hover:bg-blue-700 text-white border-blue-600"
                                  >
                                    <Eye className="h-3 w-3 mr-2" />
                                    View Response
                                  </Button>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-12 px-4">
                          <div className="text-muted-foreground">
                            <FileText className="h-16 w-16 mx-auto mb-4 opacity-50" />
                            <p className="text-lg font-medium">No submissions found</p>
                            <p className="text-sm">This assessment doesn't have any student submissions yet.</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Enhanced Export Modal */}
        <EnhancedExportModal
          isOpen={showEnhancedExport}
          onClose={() => {
            setShowEnhancedExport(false);
            setSelectedAssessmentForExport(null);
          }}
          assessmentData={selectedAssessmentForExport}
          submissions={selectedAssessmentForExport?.submissions || []}
          onExport={handleEnhancedExport}
        />
      </div>
    </div>
  );
};

export default AnalyticsDashboard; 