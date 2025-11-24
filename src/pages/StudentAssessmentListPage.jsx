import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle 
} from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '../components/ui/select';
import { Badge } from '../components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '../components/ui/dialog';
import { 
  Search, 
  Filter, 
  Clock, 
  Users, 
  BookOpen, 
  Calendar,
  Award,
  Lock,
  Eye,
  Play,
  LayoutGrid,
  List,
  CheckCircle,
  RotateCcw,
  Hash,
  History,
  ChevronDown
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'react-hot-toast';
import apiService from '../services/api.js';

const StudentAssessmentListPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [assessments, setAssessments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('list'); // 'list' | 'cards'
  const [filters, setFilters] = useState({
    status: 'all',
    dateFrom: '',
    dateTo: ''
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [attemptsModal, setAttemptsModal] = useState({ 
    open: false, 
    assessmentId: null, 
    attempts: [], 
    loading: false,
    assessment: null
  });

  useEffect(() => {
    fetchAssessments();
  }, [filters]);

  const fetchAssessments = async () => {
    try {
      setLoading(true);
      
      // Filter out empty values and 'all' values
      const filteredParams = {};
      Object.entries(filters).forEach(([key, value]) => {
        if (value && value !== 'all') {
          filteredParams[key] = value;
        }
      });

      const queryString = new URLSearchParams(filteredParams).toString();
      const endpoint = queryString ? `/student-assessments/available?${queryString}` : '/student-assessments/available';
      const response = await apiService.get(endpoint);
      setAssessments(response.data || []);
    } catch (error) {
      console.error('Error fetching assessments:', error);
      toast.error('Error fetching assessments');
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const getStatusBadge = (assessment) => {
    const status = assessment.status;
    const statusConfig = {
      upcoming: { color: 'bg-blue-100 text-blue-800', label: 'Upcoming' },
      active: { color: 'bg-green-100 text-green-800', label: 'Active' },
      ended: { color: 'bg-gray-100 text-gray-800', label: 'Ended' },
      attempted: { color: 'bg-purple-100 text-purple-800', label: 'Attempted' }
    };

    const config = statusConfig[status] || statusConfig.upcoming;
    return <Badge className={config.color}>{config.label}</Badge>;
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      return date.toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      return 'N/A';
    }
  };

  const formatTime = (minutes) => {
    if (!minutes) return 'N/A';
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  const getAttemptNumber = (assessment) => {
    // Use completed_attempts if available, otherwise fall back to attempts_made
    const completedAttempts = assessment.completed_attempts || 0;
    const attemptsMade = assessment.attempts_made || 0;
    
    if (assessment.can_resume || assessment.can_attempt) {
      // Show next attempt number
      return completedAttempts > 0 ? completedAttempts + 1 : attemptsMade + 1;
    }
    // Show last completed attempt or total attempts
    return completedAttempts > 0 ? completedAttempts : (attemptsMade || 0);
  };

  const getStartEndTimes = (assessment) => {
    const scheduling = assessment.scheduling;
    if (!scheduling) return { start: null, end: null };
    
    return {
      start: scheduling.start_date ? formatDateTime(scheduling.start_date) : null,
      end: scheduling.end_date ? formatDateTime(scheduling.end_date) : null
    };
  };

  const handleStartAssessment = (assessment) => {
    if (!assessment.can_attempt && !assessment.can_resume) {
      toast.error('You cannot attempt this assessment');
      return;
    }

    // Set retake flag if this is a retake
    if (assessment.can_retake) {
      localStorage.setItem(`retake_${assessment.id}`, 'true');
    }

    navigate(`/student/assessments/${assessment.id}/take`);
  };

  const handleViewResults = (assessment, submissionId = null) => {
    if (submissionId) {
      navigate(`/student/assessments/${assessment.id}/results?submission=${submissionId}`);
    } else {
      navigate(`/student/assessments/${assessment.id}/results`);
    }
  };

  const handleViewPreviousResults = async (assessment) => {
    try {
      setAttemptsModal({ open: true, assessmentId: assessment.id, attempts: [], loading: true });
      
      const response = await apiService.get(`/student-assessments/${assessment.id}/attempts`);
      
      if (response.success && response.data) {
        setAttemptsModal({
          open: true,
          assessmentId: assessment.id,
          attempts: response.data.attempts || [],
          assessment: response.data.assessment,
          loading: false
        });
      } else {
        toast.error('Failed to load previous attempts');
        setAttemptsModal(prev => ({ ...prev, loading: false }));
      }
    } catch (error) {
      console.error('Error fetching attempts:', error);
      toast.error('Failed to load previous attempts');
      setAttemptsModal(prev => ({ ...prev, loading: false }));
    }
  };

  const filteredAssessments = assessments.filter(assessment =>
    assessment.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    assessment.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    assessment.subject?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-7xl px-4 py-8   ">

      {/* Filters */}
      <Card className="mb-4">
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 items-end">
            <div>
              <label className="block text-sm font-medium text-gray-800 mb-1 mt-3">Search</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search assessments..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 h-9 text-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-800 mb-1">Status</label>
              <Select value={filters.status} onValueChange={(value) => handleFilterChange('status', value)}>
                <SelectTrigger className="h-9 text-sm">
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="upcoming">Upcoming</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="ended">Ended</SelectItem>
                  <SelectItem value="attempted">Attempted</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-800 mb-1">Date From</label>
              <Input
                type="date"
                value={filters.dateFrom}
                onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
                className="h-9 text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-800 mb-1">Date To</label>
              <Input
                type="date"
                value={filters.dateTo}
                onChange={(e) => handleFilterChange('dateTo', e.target.value)}
                className="h-9 text-sm"
              />
            </div>

            {/* View toggle beside Date To */}
            <div className="flex items-center gap-2 justify-start lg:justify-end">
              <Button
                variant={viewMode === 'list' ? 'default' : 'outline'}
                onClick={() => setViewMode('list')}
                className="h-9 px-3 text-sm"
              >
                <List className="h-4 w-4 mr-2" /> List
              </Button>
              <Button
                variant={viewMode === 'cards' ? 'default' : 'outline'}
                onClick={() => setViewMode('cards')}
                className="h-9 px-3 text-sm"
              >
                <LayoutGrid className="h-4 w-4 mr-2" /> Cards
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* View Mode Rendering */}
      {viewMode === 'list' ? (
        // Enhanced List view with sub-cards
        <div className="space-y-4">
          {filteredAssessments.length === 0 ? (
            <div className="p-6 text-center text-gray-500 bg-white border rounded-lg">No assessments found.</div>
          ) : (
            filteredAssessments.map((assessment) => {
              const times = getStartEndTimes(assessment);
              const attemptNumber = getAttemptNumber(assessment);
              
              return (
                <Card key={assessment.id} className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-2">
                          <CardTitle className="text-lg font-bold text-gray-900 truncate">
                            {assessment.title}
                          </CardTitle>
                          {getStatusBadge(assessment)}
                          {assessment.proctoring_enabled && (
                            <Badge variant="outline" className="text-blue-600 border-blue-600 text-xs">
                              Proctored
                            </Badge>
                          )}
                          {assessment.password && (
                            <Badge variant="outline" className="text-orange-600 border-orange-600 text-xs">
                              <Lock className="h-3 w-3 mr-1" /> Password
                            </Badge>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        {assessment.can_resume ? (
                          <Button onClick={() => handleStartAssessment(assessment)} className="h-9 px-4 text-sm">
                            <Play className="h-4 w-4 mr-1" /> Resume
                          </Button>
                        ) : assessment.can_attempt ? (
                          <Button onClick={() => handleStartAssessment(assessment)} className="h-9 px-4 text-sm">
                            <Play className="h-4 w-4 mr-1" /> Start
                          </Button>
                        ) : null}
                        {(assessment.has_completed_submissions || assessment.completed_attempts > 0 || assessment.submission_status === 'completed' || (assessment.attempts_made > 0 && !assessment.can_resume)) && (
                          <Button variant="outline" onClick={() => handleViewResults(assessment)} className="h-9 px-4 text-sm">
                            <Eye className="h-4 w-4 mr-1" /> View Results
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                      {/* Duration Card */}
                      <Card className="bg-blue-50 border-blue-200">
                        <CardContent className="p-3">
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4 text-blue-600" />
                            <div>
                              <p className="text-xs text-gray-600">Duration</p>
                              <p className="text-sm font-semibold text-gray-900">
                                {formatTime(assessment.time_limit_minutes || assessment.duration_minutes)}
                              </p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>

                      {/* Points Card */}
                      <Card className="bg-purple-50 border-purple-200">
                        <CardContent className="p-3">
                          <div className="flex items-center gap-2">
                            <Award className="h-4 w-4 text-purple-600" />
                            <div>
                              <p className="text-xs text-gray-600">Total Points</p>
                              <p className="text-sm font-semibold text-gray-900">
                                {assessment.total_points || 0} pts
                              </p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>

                      {/* Start Time Card */}
                      <Card className="bg-green-50 border-green-200">
                        <CardContent className="p-3">
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-green-600" />
                            <div className="min-w-0">
                              <p className="text-xs text-gray-600">Start Time</p>
                              <p className="text-sm font-semibold text-gray-900 truncate">
                                {times.start || 'N/A'}
                              </p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>

                      {/* End Time Card */}
                      <Card className="bg-red-50 border-red-200">
                        <CardContent className="p-3">
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-red-600" />
                            <div className="min-w-0">
                              <p className="text-xs text-gray-600">End Time</p>
                              <p className="text-sm font-semibold text-gray-900 truncate">
                                {times.end || 'N/A'}
                              </p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </div>

                    {/* Attempt Number and Status Row */}
                    <div className="mt-3 pt-3 border-t flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                          <Hash className="h-4 w-4 text-gray-500" />
                          <span className="text-sm text-gray-600">Attempt Number:</span>
                          <Badge variant="outline" className="font-semibold">
                            {attemptNumber > 0 ? attemptNumber : 'Not Started'}
                          </Badge>
                        </div>
                        {assessment.max_attempts && (
                          <span className="text-xs text-gray-500">
                            (Max: {assessment.max_attempts} attempts)
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        {assessment.submission_status === 'completed' && (
                          <Badge className="bg-green-100 text-green-800">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Completed
                          </Badge>
                        )}
                        {assessment.can_retake && (
                          <Badge className="bg-blue-100 text-blue-800">
                            <RotateCcw className="h-3 w-3 mr-1" />
                            Can Retake
                          </Badge>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>
      ) : (
        // Enhanced Card grid view with sub-cards
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredAssessments.map((assessment) => {
            const times = getStartEndTimes(assessment);
            const attemptNumber = getAttemptNumber(assessment);
            
            return (
              <Card key={assessment.id} className="hover:shadow-lg transition-all duration-200 flex flex-col">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <CardTitle className="text-xl font-bold text-gray-900 line-clamp-2 flex-1">
                      {assessment.title}
                    </CardTitle>
                    {getStatusBadge(assessment)}
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    {assessment.proctoring_enabled && (
                      <Badge variant="outline" className="text-blue-600 border-blue-600 text-xs">
                        <Eye className="h-3 w-3 mr-1" /> Proctored
                      </Badge>
                    )}
                    {assessment.password && (
                      <Badge variant="outline" className="text-orange-600 border-orange-600 text-xs">
                        <Lock className="h-3 w-3 mr-1" /> Password
                      </Badge>
                    )}
                  </div>
                </CardHeader>

                <CardContent className="flex-1 flex flex-col">
                  {/* Sub-cards for details */}
                  <div className="grid grid-cols-2 gap-3 mb-4">
                    {/* Duration Sub-card */}
                    <Card className="bg-blue-50 border-blue-200">
                      <CardContent className="p-3">
                        <div className="flex flex-col">
                          <div className="flex items-center gap-1 mb-1">
                            <Clock className="h-4 w-4 text-blue-600" />
                            <span className="text-xs text-gray-600 font-medium">Duration</span>
                          </div>
                          <p className="text-sm font-bold text-gray-900">
                            {formatTime(assessment.time_limit_minutes || assessment.duration_minutes)}
                          </p>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Points Sub-card */}
                    <Card className="bg-purple-50 border-purple-200">
                      <CardContent className="p-3">
                        <div className="flex flex-col">
                          <div className="flex items-center gap-1 mb-1">
                            <Award className="h-4 w-4 text-purple-600" />
                            <span className="text-xs text-gray-600 font-medium">Points</span>
                          </div>
                          <p className="text-sm font-bold text-gray-900">
                            {assessment.total_points || 0} pts
                          </p>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Start Time Sub-card */}
                    <Card className="bg-green-50 border-green-200">
                      <CardContent className="p-3">
                        <div className="flex flex-col">
                          <div className="flex items-center gap-1 mb-1">
                            <Calendar className="h-4 w-4 text-green-600" />
                            <span className="text-xs text-gray-600 font-medium">Start</span>
                          </div>
                          <p className="text-xs font-semibold text-gray-900 line-clamp-2">
                            {times.start || 'N/A'}
                          </p>
                        </div>
                      </CardContent>
                    </Card>

                    {/* End Time Sub-card */}
                    <Card className="bg-red-50 border-red-200">
                      <CardContent className="p-3">
                        <div className="flex flex-col">
                          <div className="flex items-center gap-1 mb-1">
                            <Calendar className="h-4 w-4 text-red-600" />
                            <span className="text-xs text-gray-600 font-medium">End</span>
                          </div>
                          <p className="text-xs font-semibold text-gray-900 line-clamp-2">
                            {times.end || 'N/A'}
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Attempt Number and Status */}
                  <div className="mb-4 p-3 bg-gray-50 rounded-lg border">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Hash className="h-4 w-4 text-gray-500" />
                        <span className="text-xs text-gray-600">Attempt:</span>
                        <Badge variant="outline" className="font-semibold">
                          {attemptNumber > 0 ? attemptNumber : 'Not Started'}
                        </Badge>
                      </div>
                      {assessment.max_attempts && (
                        <span className="text-xs text-gray-500">
                          / {assessment.max_attempts}
                        </span>
                      )}
                    </div>
                    {assessment.submission_status === 'completed' && (
                      <div className="mt-2 flex items-center gap-1">
                        <CheckCircle className="h-3 w-3 text-green-600" />
                        <span className="text-xs text-green-600 font-medium">Completed</span>
                      </div>
                    )}
                    {assessment.can_retake && (
                      <div className="mt-2 flex items-center gap-1">
                        <RotateCcw className="h-3 w-3 text-blue-600" />
                        <span className="text-xs text-blue-600 font-medium">Can Retake</span>
                      </div>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-col gap-2 mt-auto">
                    {assessment.can_resume ? (
                      <Button onClick={() => handleStartAssessment(assessment)} className="w-full">
                        <Play className="h-4 w-4 mr-2" /> Resume Assessment
                      </Button>
                    ) : assessment.can_attempt ? (
                      <Button onClick={() => handleStartAssessment(assessment)} className="w-full">
                        <Play className="h-4 w-4 mr-2" /> Start Assessment
                      </Button>
                    ) : null}
                    {(assessment.has_completed_submissions || assessment.completed_attempts > 0 || assessment.submission_status === 'completed' || (assessment.attempts_made > 0 && !assessment.can_resume)) && (
                      <>
                        <Button 
                          variant="outline" 
                          onClick={() => handleViewResults(assessment)} 
                          className="w-full"
                        >
                          <Eye className="h-4 w-4 mr-2" /> View Results
                        </Button>
                        {(assessment.completed_attempts > 1 || (assessment.max_attempts > 1 && assessment.completed_attempts > 0)) && (
                          <Button 
                            variant="outline" 
                            onClick={() => handleViewPreviousResults(assessment)} 
                            className="w-full"
                          >
                            <History className="h-4 w-4 mr-2" /> View Previous Results
                          </Button>
                        )}
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {filteredAssessments.length === 0 && !loading && (
        <div className="text-center py-12">
          <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No assessments found</h3>
          <p className="text-gray-600">
            {searchTerm || Object.values(filters).some(f => f) 
              ? 'Try adjusting your search or filters' 
              : 'No assessments are currently available for you'
            }
          </p>
        </div>
      )}

      {/* Previous Attempts Modal */}
      <Dialog open={attemptsModal.open} onOpenChange={(open) => setAttemptsModal(prev => ({ ...prev, open }))}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Previous Attempts</DialogTitle>
            <DialogDescription>
              {attemptsModal.assessment?.title || 'Select an attempt to view detailed results'}
            </DialogDescription>
          </DialogHeader>
          
          {attemptsModal.loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-gray-500">Loading attempts...</div>
            </div>
          ) : attemptsModal.attempts.length === 0 ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-gray-500">No previous attempts found</div>
            </div>
          ) : (
            <div className="space-y-3 mt-4">
              {attemptsModal.attempts.map((attempt) => (
                <Card 
                  key={attempt.submission_id} 
                  className="hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => {
                    handleViewResults({ id: attemptsModal.assessmentId }, attempt.submission_id);
                    setAttemptsModal(prev => ({ ...prev, open: false }));
                  }}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <Badge variant="outline" className="font-semibold">
                            Attempt #{attempt.attempt_number}
                          </Badge>
                          <Badge 
                            className={
                              attempt.status === 'submitted' || attempt.status === 'graded' 
                                ? 'bg-green-100 text-green-800' 
                                : attempt.status === 'in_progress'
                                ? 'bg-yellow-100 text-yellow-800'
                                : 'bg-gray-100 text-gray-800'
                            }
                          >
                            {attempt.status === 'submitted' || attempt.status === 'graded' 
                              ? 'Completed' 
                              : attempt.status === 'in_progress'
                              ? 'In Progress'
                              : attempt.status}
                          </Badge>
                        </div>
                        
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-3">
                          <div>
                            <p className="text-xs text-gray-500">Score</p>
                            <p className="text-sm font-semibold">
                              {attempt.percentage_score !== null && attempt.percentage_score !== undefined
                                ? `${attempt.percentage_score.toFixed(1)}%`
                                : attempt.score !== null && attempt.score !== undefined
                                ? `${attempt.score} / ${attemptsModal.assessment?.total_points || 'N/A'}`
                                : 'N/A'}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500">Time Taken</p>
                            <p className="text-sm font-semibold">
                              {attempt.time_taken_minutes 
                                ? `${Math.floor(attempt.time_taken_minutes)}m ${Math.round((attempt.time_taken_minutes % 1) * 60)}s`
                                : 'N/A'}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500">Submitted</p>
                            <p className="text-sm font-semibold">
                              {attempt.submitted_at 
                                ? formatDateTime(attempt.submitted_at)
                                : 'Not Submitted'}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500">Started</p>
                            <p className="text-sm font-semibold">
                              {attempt.started_at 
                                ? formatDateTime(attempt.started_at)
                                : formatDateTime(attempt.created_at)}
                            </p>
                          </div>
                        </div>
                      </div>
                      <div className="ml-4">
                        <Button variant="ghost" size="sm">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default StudentAssessmentListPage;