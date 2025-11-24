import React, { useState, useEffect } from 'react';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle 
} from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Progress } from '../components/ui/progress';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '../components/ui/select';
import { 
  TrendingUp, 
  TrendingDown, 
  Target, 
  Clock, 
  Award,
  BookOpen,
  Calendar,
  Download,
  Filter,
  BarChart3,
  PieChart,
  LineChart,
  Star,
  Trophy,
  AlertCircle,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'react-hot-toast';
import apiService from '../services/api';

const StudentAnalyticsDashboard = () => {
  const { user } = useAuth();
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    dateFrom: '',
    dateTo: '',
    assessmentIds: [],
    batchId: '',
    departmentId: ''
  });
  const [timeRange, setTimeRange] = useState('30'); // days

  useEffect(() => {
    fetchAnalytics();
  }, [filters, timeRange]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      
      // CRITICAL FIX: Use apiService instead of raw fetch for proper error handling
      const queryParams = {};
      Object.entries(filters).forEach(([key, value]) => {
        if (value && value.length > 0) {
          queryParams[key] = Array.isArray(value) ? value.join(',') : value;
        }
      });

      const response = await apiService.get(`/student-assessments/analytics/student/${user.id}`, queryParams);
      
      if (response.success) {
        setAnalytics(response.data);
      } else {
        toast.error(response.message || 'Failed to fetch analytics');
      }
    } catch (error) {
      console.error('Error fetching analytics:', error);
      toast.error(error.message || 'Error fetching analytics');
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const getPerformanceTrend = (submissions) => {
    if (!submissions || submissions.length < 2) return null;
    
    const sortedSubmissions = submissions.sort((a, b) => 
      new Date(a.submitted_at) - new Date(b.submitted_at)
    );
    
    const firstHalf = sortedSubmissions.slice(0, Math.ceil(sortedSubmissions.length / 2));
    const secondHalf = sortedSubmissions.slice(Math.ceil(sortedSubmissions.length / 2));
    
    const firstHalfAvg = firstHalf.reduce((sum, s) => sum + s.percentage, 0) / firstHalf.length;
    const secondHalfAvg = secondHalf.reduce((sum, s) => sum + s.percentage, 0) / secondHalf.length;
    
    return {
      trend: secondHalfAvg > firstHalfAvg ? 'improving' : 'declining',
      improvement: secondHalfAvg - firstHalfAvg,
      firstHalfAverage: firstHalfAvg,
      secondHalfAverage: secondHalfAvg
    };
  };

  const getGradeDistribution = (submissions) => {
    if (!submissions) return {};
    
    return submissions.reduce((dist, s) => {
      const grade = s.grade || 'F';
      dist[grade] = (dist[grade] || 0) + 1;
      return dist;
    }, {});
  };

  const getSubjectPerformance = (submissions) => {
    if (!submissions) return {};
    
    return submissions.reduce((perf, s) => {
      const subject = s.subject || 'Unknown';
      if (!perf[subject]) {
        perf[subject] = { total: 0, sum: 0, count: 0 };
      }
      perf[subject].total += 1;
      perf[subject].sum += s.percentage;
      perf[subject].count += 1;
      return perf;
    }, {});
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString();
  };

  const getPerformanceColor = (percentage) => {
    if (percentage >= 90) return 'text-green-600';
    if (percentage >= 80) return 'text-blue-600';
    if (percentage >= 70) return 'text-yellow-600';
    if (percentage >= 60) return 'text-orange-600';
    return 'text-red-600';
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading analytics...</p>
        </div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">No Analytics Data</h2>
          <p className="text-gray-600">No assessment data available for analytics.</p>
        </div>
      </div>
    );
  }

  const trend = getPerformanceTrend(analytics.submissions);
  const gradeDistribution = getGradeDistribution(analytics.submissions);
  const subjectPerformance = getSubjectPerformance(analytics.submissions);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Performance Analytics</h1>
          <p className="text-gray-600">Track your learning progress and performance insights</p>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filters
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Time Range</label>
                <Select value={timeRange} onValueChange={setTimeRange}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="7">Last 7 days</SelectItem>
                    <SelectItem value="30">Last 30 days</SelectItem>
                    <SelectItem value="90">Last 90 days</SelectItem>
                    <SelectItem value="365">Last year</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date From</label>
                <input
                  type="date"
                  value={filters.dateFrom}
                  onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date To</label>
                <input
                  type="date"
                  value={filters.dateTo}
                  onChange={(e) => handleFilterChange('dateTo', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
                <input
                  type="text"
                  placeholder="Department"
                  value={filters.departmentId}
                  onChange={(e) => handleFilterChange('departmentId', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Performance Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Target className="h-6 w-6 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Average Score</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {analytics.performanceMetrics?.averagePercentage?.toFixed(1) || 0}%
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-green-100 rounded-lg">
                  <BookOpen className="h-6 w-6 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Assessments</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {analytics.totalAssessments || 0}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Clock className="h-6 w-6 text-purple-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Time</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {Math.round((analytics.performanceMetrics?.totalTimeSpent || 0) / 3600)}h
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-yellow-100 rounded-lg">
                  <Trophy className="h-6 w-6 text-yellow-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Best Grade</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {Object.keys(gradeDistribution).reduce((best, grade) => {
                      const gradeOrder = { 'A': 5, 'B': 4, 'C': 3, 'D': 2, 'F': 1 };
                      return gradeOrder[grade] > gradeOrder[best] ? grade : best;
                    }, 'F')}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Performance Trend */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <LineChart className="h-5 w-5" />
                Performance Trend
              </CardTitle>
            </CardHeader>
            <CardContent>
              {trend ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Overall Trend</span>
                    <div className="flex items-center gap-2">
                      {trend.trend === 'improving' ? (
                        <TrendingUp className="h-4 w-4 text-green-600" />
                      ) : (
                        <TrendingDown className="h-4 w-4 text-red-600" />
                      )}
                      <span className={`text-sm font-medium ${
                        trend.trend === 'improving' ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {trend.trend === 'improving' ? 'Improving' : 'Declining'}
                      </span>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-3 bg-gray-50 rounded-lg">
                      <div className="text-lg font-bold text-gray-900">
                        {trend.firstHalfAverage.toFixed(1)}%
                      </div>
                      <div className="text-xs text-gray-600">First Half Average</div>
                    </div>
                    <div className="text-center p-3 bg-gray-50 rounded-lg">
                      <div className="text-lg font-bold text-gray-900">
                        {trend.secondHalfAverage.toFixed(1)}%
                      </div>
                      <div className="text-xs text-gray-600">Second Half Average</div>
                    </div>
                  </div>
                  
                  <div className="text-center">
                    <Badge variant={trend.improvement > 0 ? "default" : "destructive"}>
                      {trend.improvement > 0 ? '+' : ''}{trend.improvement.toFixed(1)}% Change
                    </Badge>
                  </div>
                </div>
              ) : (
                <div className="text-center text-gray-500 py-8">
                  <AlertCircle className="h-8 w-8 mx-auto mb-2" />
                  <p>Not enough data for trend analysis</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Grade Distribution */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PieChart className="h-5 w-5" />
                Grade Distribution
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {Object.entries(gradeDistribution).map(([grade, count]) => {
                  const percentage = (count / analytics.totalAssessments) * 100;
                  const colors = {
                    'A': 'bg-green-100 text-green-800',
                    'B': 'bg-blue-100 text-blue-800',
                    'C': 'bg-yellow-100 text-yellow-800',
                    'D': 'bg-orange-100 text-orange-800',
                    'F': 'bg-red-100 text-red-800'
                  };
                  
                  return (
                    <div key={grade} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Badge className={colors[grade]}>
                          Grade {grade}
                        </Badge>
                        <span className="text-sm text-gray-600">{count} assessments</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-20 bg-gray-200 rounded-full h-2">
                          <div 
                            className={`h-2 rounded-full ${
                              grade === 'A' ? 'bg-green-500' :
                              grade === 'B' ? 'bg-blue-500' :
                              grade === 'C' ? 'bg-yellow-500' :
                              grade === 'D' ? 'bg-orange-500' : 'bg-red-500'
                            }`}
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                        <span className="text-sm font-medium w-12 text-right">
                          {percentage.toFixed(1)}%
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Subject Performance */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Subject Performance
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {Object.entries(subjectPerformance).map(([subject, data]) => {
                  const average = data.sum / data.count;
                  return (
                    <div key={subject} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <BookOpen className="h-4 w-4 text-gray-400" />
                        <span className="text-sm font-medium">{subject}</span>
                        <Badge variant="outline" className="text-xs">
                          {data.count} assessments
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`text-sm font-medium ${getPerformanceColor(average)}`}>
                          {average.toFixed(1)}%
                        </span>
                        <div className="w-16 bg-gray-200 rounded-full h-2">
                          <div 
                            className={`h-2 rounded-full ${
                              average >= 90 ? 'bg-green-500' :
                              average >= 80 ? 'bg-blue-500' :
                              average >= 70 ? 'bg-yellow-500' :
                              average >= 60 ? 'bg-orange-500' : 'bg-red-500'
                            }`}
                            style={{ width: `${average}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Recent Assessments */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Recent Assessments
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {analytics.submissions?.slice(0, 5).map((submission, index) => (
                  <div key={submission.submission_id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2">
                        {submission.percentage >= 70 ? (
                          <CheckCircle className="h-4 w-4 text-green-600" />
                        ) : (
                          <XCircle className="h-4 w-4 text-red-600" />
                        )}
                        <span className="text-sm font-medium">
                          {submission.assessment_title}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={getPerformanceColor(submission.percentage)}>
                        {submission.percentage.toFixed(1)}%
                      </Badge>
                      <span className="text-xs text-gray-500">
                        {formatDate(submission.submitted_at)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Export Options */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Download className="h-5 w-5" />
              Export Analytics
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <Button variant="outline" onClick={() => toast.info('Excel export coming soon')}>
                <Download className="h-4 w-4 mr-2" />
                Export to Excel
              </Button>
              <Button variant="outline" onClick={() => toast.info('PDF export coming soon')}>
                <Download className="h-4 w-4 mr-2" />
                Export to PDF
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default StudentAnalyticsDashboard;
