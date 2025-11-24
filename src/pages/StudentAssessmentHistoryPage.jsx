import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle 
} from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Input } from '../components/ui/input';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '../components/ui/select';
import { 
  Search, 
  Filter, 
  Clock, 
  Calendar,
  Award,
  Eye,
  Download,
  TrendingUp,
  TrendingDown,
  CheckCircle,
  XCircle,
  AlertTriangle,
  BookOpen,
  Target
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'react-hot-toast';
import apiService from '../services/api';

const StudentAssessmentHistoryPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    status: '',
    dateFrom: '',
    dateTo: '',
    subject: ''
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('submitted_at');
  const [sortOrder, setSortOrder] = useState('desc');

  useEffect(() => {
    fetchHistory();
  }, [filters, sortBy, sortOrder]);

  const fetchHistory = async () => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams();
      
      Object.entries(filters).forEach(([key, value]) => {
        if (value) queryParams.append(key, value);
      });

      queryParams.append('sortBy', sortBy);
      queryParams.append('sortOrder', sortOrder);

      const response = await fetch(`/api/student-assessments/history?${queryParams}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setHistory(data.data || []);
      } else {
        toast.error('Failed to fetch assessment history');
      }
    } catch (error) {
      console.error('Error fetching history:', error);
      toast.error('Error fetching assessment history');
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      'completed': { color: 'bg-green-100 text-green-800', label: 'Completed' },
      'auto_submitted': { color: 'bg-blue-100 text-blue-800', label: 'Auto Submitted' },
      'abandoned': { color: 'bg-red-100 text-red-800', label: 'Abandoned' },
      'in_progress': { color: 'bg-yellow-100 text-yellow-800', label: 'In Progress' }
    };

    const config = statusConfig[status] || statusConfig['completed'];
    return <Badge className={config.color}>{config.label}</Badge>;
  };

  const getGradeColor = (grade) => {
    const colors = {
      'A': 'bg-green-100 text-green-800',
      'B': 'bg-blue-100 text-blue-800',
      'C': 'bg-yellow-100 text-yellow-800',
      'D': 'bg-orange-100 text-orange-800',
      'F': 'bg-red-100 text-red-800'
    };
    return colors[grade] || colors['F'];
  };

  const getPerformanceIcon = (percentage) => {
    if (percentage >= 90) return <CheckCircle className="h-4 w-4 text-green-600" />;
    if (percentage >= 70) return <Target className="h-4 w-4 text-blue-600" />;
    if (percentage >= 60) return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
    return <XCircle className="h-4 w-4 text-red-600" />;
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString();
  };

  const formatTime = (seconds) => {
    if (!seconds) return 'N/A';
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    } else if (minutes > 0) {
      return `${minutes}m ${secs}s`;
    } else {
      return `${secs}s`;
    }
  };

  const handleViewResults = (submission) => {
    navigate(`/student/assessments/${submission.assessment_id}/results`);
  };

  const handleRetakeAssessment = async (assessment) => {
    try {
      // Set retake flag BEFORE calling API
      localStorage.setItem(`retake_${assessment.assessment_id}`, 'true');
      console.log('Retake flag set:', `retake_${assessment.assessment_id}`);
      
      // Call the retake API endpoint using the API service
      const result = await apiService.retakeAssessment(assessment.assessment_id);
      
      if (result.success) {
        toast({
          title: "Assessment Taking Unavailable",
          description: "Assessment taking functionality has been temporarily disabled.",
          duration: 3000
        });
        
        navigate('/student/assessments');
      } else {
        throw new Error(result.message || 'Failed to start retake');
      }
    } catch (error) {
      // Clear the flag if retake failed
      localStorage.removeItem(`retake_${assessment.assessment_id}`);
      console.error('Error starting retake:', error);
      toast({
        title: "Retake Failed",
        description: error.message || "Failed to start assessment retake",
        variant: "destructive",
        duration: 5000
      });
    }
  };

  const filteredHistory = history.filter(item =>
    item.assessment_title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.subject?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.college_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.department_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading assessment history...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Assessment History</h1>
          <p className="text-gray-600">View your past assessment attempts and performance</p>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filters & Search
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search assessments..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <Select value={filters.status} onValueChange={(value) => handleFilterChange('status', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All Status</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="auto_submitted">Auto Submitted</SelectItem>
                    <SelectItem value="abandoned">Abandoned</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date From</label>
                <Input
                  type="date"
                  value={filters.dateFrom}
                  onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date To</label>
                <Input
                  type="date"
                  value={filters.dateTo}
                  onChange={(e) => handleFilterChange('dateTo', e.target.value)}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
                <Input
                  placeholder="Subject"
                  value={filters.subject}
                  onChange={(e) => handleFilterChange('subject', e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Sort By</label>
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="submitted_at">Date Submitted</SelectItem>
                    <SelectItem value="percentage">Score</SelectItem>
                    <SelectItem value="total_time_spent">Time Spent</SelectItem>
                    <SelectItem value="assessment_title">Assessment Name</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Sort Order</label>
                <Select value={sortOrder} onValueChange={setSortOrder}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="desc">Descending</SelectItem>
                    <SelectItem value="asc">Ascending</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Assessment History */}
        <div className="space-y-4">
          {filteredHistory.map((item) => (
            <Card key={item.id} className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {item.assessment_title}
                      </h3>
                      {getStatusBadge(item.status)}
                      {getPerformanceIcon(item.percentage)}
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600 mb-4">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        <span>{formatDate(item.submitted_at)}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        <span>{formatTime(item.total_time_spent)}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <BookOpen className="h-4 w-4" />
                        <span>{item.subject || 'N/A'}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Award className="h-4 w-4" />
                        <span>Attempt #{item.attempt_number}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-600">Score:</span>
                        <span className="font-semibold text-lg">
                          {item.total_score}/{item.assessment?.total_points || 100}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-600">Percentage:</span>
                        <span className={`font-semibold text-lg ${
                          item.percentage >= 70 ? 'text-green-600' : 
                          item.percentage >= 60 ? 'text-yellow-600' : 'text-red-600'
                        }`}>
                          {item.percentage}%
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-600">Grade:</span>
                        <Badge className={getGradeColor(item.grade)}>
                          {item.grade}
                        </Badge>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 ml-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleViewResults(item)}
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      View Results
                    </Button>
                    
                    {item.status === 'completed' && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleRetakeAssessment(item)}
                      >
                        <BookOpen className="h-4 w-4 mr-2" />
                        Retake
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredHistory.length === 0 && !loading && (
          <div className="text-center py-12">
            <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No assessments found</h3>
            <p className="text-gray-600">
              {searchTerm || Object.values(filters).some(f => f) 
                ? 'Try adjusting your search or filters' 
                : 'You haven\'t taken any assessments yet'
              }
            </p>
          </div>
        )}

        {/* Summary Stats */}
        {filteredHistory.length > 0 && (
          <Card className="mt-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                Performance Summary
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900 mb-1">
                    {filteredHistory.length}
                  </div>
                  <div className="text-sm text-gray-600">Total Assessments</div>
                </div>
                
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600 mb-1">
                    {Math.round(filteredHistory.reduce((sum, item) => sum + item.percentage, 0) / filteredHistory.length)}%
                  </div>
                  <div className="text-sm text-gray-600">Average Score</div>
                </div>
                
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600 mb-1">
                    {filteredHistory.filter(item => item.percentage >= 70).length}
                  </div>
                  <div className="text-sm text-gray-600">Passed</div>
                </div>
                
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600 mb-1">
                    {Math.round(filteredHistory.reduce((sum, item) => sum + (item.total_time_spent || 0), 0) / 3600)}h
                  </div>
                  <div className="text-sm text-gray-600">Total Time</div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default StudentAssessmentHistoryPage;
