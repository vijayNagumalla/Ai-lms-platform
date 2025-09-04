import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import apiService from '@/services/api';

// Icons
import {
  ArrowLeft, Download, FileText, Users, BookOpen, 
  Target, Clock, Building, GraduationCap, CheckCircle, TrendingUp
} from 'lucide-react';

const AssessmentDetailsPage = () => {
  const { assessmentId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  
  // State management
  const [loading, setLoading] = useState(true);
  const [assessment, setAssessment] = useState(null);
  const [submissions, setSubmissions] = useState([]);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    if (assessmentId) {
      loadAssessmentDetails();
    }
  }, [assessmentId]);

  const loadAssessmentDetails = async () => {
    try {
      setLoading(true);
      
      // Load assessment details
      const assessmentResponse = await apiService.getAssessmentDetails(assessmentId);
      if (assessmentResponse.success) {
        setAssessment(assessmentResponse.data.assessment);
      }
      
      // Load student submissions
      const submissionsResponse = await apiService.getAssessmentSubmissions(assessmentId);
      if (submissionsResponse.success) {
        setSubmissions(submissionsResponse.data);
      }
      
    } catch (error) {
      console.error('Error loading assessment details:', error);
      toast({
        title: "Error",
        description: "Failed to load assessment details",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleExportData = async () => {
    try {
      setExporting(true);
      
      if (submissions.length === 0) {
        toast({
          title: "No Data",
          description: "No submissions to export",
          variant: "destructive"
        });
        return;
      }

      // Prepare CSV data
      const headers = [
        'Student Name', 'Student ID', 'Email', 'College', 'Department',
        'Submission Date', 'Score', 'Status', 'Time Taken', 'Attempt'
      ];

      const csvData = submissions.map(submission => [
        submission.student_name || '',
        submission.student_id_number || '',
        submission.student_email || '',
        submission.college_name || '',
        submission.department_name || '',
        submission.submitted_at ? new Date(submission.submitted_at).toLocaleString() : 'Not submitted',
        submission.score || 0,
        submission.status || 'Not attempted',
        submission.time_taken_minutes ? `${submission.time_taken_minutes} min` : '-',
        submission.attempt_number || 1
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
      const filename = `assessment_${assessment?.title || assessmentId}_submissions_${timestamp}.csv`;
      
      link.setAttribute('download', filename);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast({
        title: "Success",
        description: `Exported ${submissions.length} student submissions!`,
      });
      
    } catch (error) {
      console.error('Export error:', error);
      toast({
        title: "Error",
        description: "Failed to export data",
        variant: "destructive"
      });
    } finally {
      setExporting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-4">
        <div className="w-full">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-primary mx-auto"></div>
            <p className="mt-4 text-muted-foreground text-lg">Loading assessment details...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!assessment) {
    return (
      <div className="min-h-screen bg-background p-4">
        <div className="w-full">
          <div className="text-center py-12">
            <p className="text-muted-foreground text-lg">Assessment not found</p>
            <Button 
              onClick={() => navigate('/analytics')} 
              className="mt-4"
              variant="outline"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Analytics
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button
              variant="outline"
              onClick={() => navigate('/analytics')}
              className="h-10 w-10 p-0"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-foreground">
                Assessment Details
              </h1>
              <p className="text-muted-foreground">
                {assessment.title}
              </p>
            </div>
          </div>
          
          <Button
            onClick={handleExportData}
            disabled={exporting}
            variant="outline"
            className="bg-green-600 hover:bg-green-700 text-white border-green-600"
          >
            <Download className="h-4 w-4 mr-2" />
            {exporting ? 'Exporting...' : 'Export Data'}
          </Button>
        </div>

        {/* Assessment Summary */}
        <Card>
          <CardHeader>
            <CardTitle className="text-xl font-semibold flex items-center space-x-2">
              <BookOpen className="h-5 w-5" />
              <span>Assessment Summary</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div className="text-center p-4 bg-blue-50 rounded-lg border border-blue-200">
                <Users className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                <p className="text-3xl font-bold text-blue-600">{submissions.length || 0}</p>
                <p className="text-sm text-muted-foreground mt-1">Total Students</p>
              </div>
              <div className="text-center p-4 bg-orange-50 rounded-lg border border-orange-200">
                <Target className="h-8 w-8 text-orange-600 mx-auto mb-2" />
                <p className="text-3xl font-bold text-orange-600">{submissions.length || 0}</p>
                <p className="text-sm text-muted-foreground mt-1">Students Attempted</p>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg border border-green-200">
                <CheckCircle className="h-8 w-8 text-green-600 mx-auto mb-2" />
                <p className="text-3xl font-bold text-green-600">
                  {submissions.filter(s => s.status === 'submitted' || s.status === 'graded').length || 0}
                </p>
                <p className="text-sm text-muted-foreground mt-1">Student Submissions</p>
              </div>
              <div className="text-center p-4 bg-purple-50 rounded-lg border border-purple-200">
                <TrendingUp className="h-8 w-8 text-purple-600 mx-auto mb-2" />
                <p className="text-3xl font-bold text-purple-600">
                  {submissions.length > 0 ? 
                    Math.round((submissions.filter(s => s.status === 'submitted' || s.status === 'graded').length / submissions.length) * 100) : 0
                  }%
                </p>
                <p className="text-sm text-muted-foreground mt-1">Completion Rate</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Assessment Info */}
        <Card>
          <CardHeader>
            <CardTitle className="text-xl font-semibold">Assessment Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <BookOpen className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">Type:</span>
                  <Badge variant="outline">{assessment.assessment_type || 'N/A'}</Badge>
                </div>
                <div className="flex items-center space-x-3">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">Time Limit:</span>
                  <span>{assessment.time_limit_minutes || 'No limit'} minutes</span>
                </div>
                <div className="flex items-center space-x-3">
                  <Target className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">Total Points:</span>
                  <span>{assessment.total_points || 'N/A'}</span>
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <CheckCircle className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">Passing Score:</span>
                  <span>{assessment.passing_score || 'N/A'}%</span>
                </div>
                <div className="flex items-center space-x-3">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">Max Attempts:</span>
                  <span>{assessment.max_attempts || 'Unlimited'}</span>
                </div>
                <div className="flex items-center space-x-3">
                  <Building className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">Status:</span>
                  <Badge variant={assessment.status === 'published' ? 'default' : 'secondary'}>
                    {assessment.status || 'N/A'}
                  </Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Student Submissions Table */}
        <Card>
          <CardHeader className="bg-gray-50 border-b">
            <CardTitle className="text-xl font-semibold flex items-center space-x-2">
              <GraduationCap className="h-5 w-5" />
              <span>Student Submissions Details</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[800px]">
                <thead>
                  <tr className="border-b border-border bg-muted/30">
                    <th className="text-left p-3 font-semibold text-card-foreground min-w-[160px]">Student Name</th>
                    <th className="text-left p-3 font-semibold text-card-foreground min-w-[100px]">Student ID</th>
                    <th className="text-left p-3 font-semibold text-card-foreground min-w-[180px]">Email</th>
                    <th className="text-center p-3 font-semibold text-card-foreground min-w-[120px]">College</th>
                    <th className="text-center p-3 font-semibold text-card-foreground min-w-[100px]">Department</th>
                    <th className="text-center p-3 font-semibold text-card-foreground min-w-[120px]">Submission Date</th>
                    <th className="text-center p-3 font-semibold text-card-foreground min-w-[60px]">Score</th>
                    <th className="text-center p-3 font-semibold text-card-foreground min-w-[80px]">Status</th>
                    <th className="text-center p-3 font-semibold text-card-foreground min-w-[80px]">Time Taken</th>
                    <th className="text-center p-3 font-semibold text-card-foreground min-w-[60px]">Attempt</th>
                  </tr>
                </thead>
                <tbody>
                  {submissions && submissions.length > 0 ? (
                    submissions.map((submission, index) => (
                      <tr key={submission.id} className={`border-b border-border hover:bg-blue-50/50 transition-colors duration-200 ${index % 2 === 0 ? 'bg-gray-50/30' : ''}`}>
                        <td className="p-2">
                          <div className="font-medium text-card-foreground text-sm">{submission.student_name}</div>
                        </td>
                        <td className="p-2">
                          <div className="text-xs text-muted-foreground font-mono">{submission.student_id_number}</div>
                        </td>
                        <td className="p-2">
                          <div className="text-xs text-muted-foreground truncate max-w-[170px]" title={submission.student_email}>
                            {submission.student_email}
                          </div>
                        </td>
                        <td className="text-center p-2">
                          <div className="text-xs text-muted-foreground truncate max-w-[110px]" title={submission.college_name}>
                            {submission.college_name}
                          </div>
                        </td>
                        <td className="text-center p-2">
                          <div className="text-xs text-muted-foreground truncate max-w-[90px]" title={submission.department_name}>
                            {submission.department_name}
                          </div>
                        </td>
                        <td className="text-center p-2">
                          <div className="text-xs text-muted-foreground">
                            {submission.submitted_at ? new Date(submission.submitted_at).toLocaleDateString() : 'Not submitted'}
                          </div>
                        </td>
                        <td className="text-center p-2">
                          <Badge variant={submission.score >= 70 ? 'default' : submission.score >= 50 ? 'secondary' : 'destructive'} className="text-xs px-1.5 py-0.5">
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
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="10" className="text-center py-8">
                        <div className="text-muted-foreground">
                          <FileText className="h-12 w-12 mx-auto mb-2 opacity-50" />
                          <p className="text-lg font-medium">No submissions found</p>
                          <p className="text-sm">This assessment doesn't have any student submissions yet.</p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AssessmentDetailsPage;

