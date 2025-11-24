import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Copy, 
  Users, 
  Clock, 
  Calendar, 
  Mail, 
  CheckCircle, 
  AlertTriangle,
  Loader2,
  Eye,
  Shield,
  Settings,
  FileText,
  Target
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import apiService from '@/services/api';

const CopyAssessmentDialog = ({ 
  isOpen, 
  onClose, 
  assessment, 
  onCopy, 
  loading = false 
}) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    instructions: '',
    startDate: '',
    endDate: '',
    startTime: '09:00',
    endTime: '17:00',
    timezone: 'UTC',
    earlyAccessHours: 0,
    lateSubmissionMinutes: 0,
    timeLimit: '',
    maxAttempts: '',
    passingScore: '',
    totalPoints: '',
    department: '',
    tags: [],
    proctoringSettings: {},
    questionSettings: {},
    assignmentSettings: {}
  });

  const [selectedStudents, setSelectedStudents] = useState([]);
  const [allStudents, setAllStudents] = useState([]);
  const [studentSearchQuery, setStudentSearchQuery] = useState('');
  const [showStudentSelection, setShowStudentSelection] = useState(false);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [studentsError, setStudentsError] = useState(null);
  const [reminderSettings, setReminderSettings] = useState({
    sendImmediately: true,
    sendBeforeStart: true,
    sendBeforeEnd: true,
    customReminderDays: 1,
    customReminderMessage: ''
  });

  // Load students when dialog opens
  useEffect(() => {
    if (isOpen && assessment) {
      loadStudents();
      initializeFormData();
    }
  }, [isOpen, assessment]);

  const loadStudents = async () => {
    try {
      setLoadingStudents(true);
      setStudentsError(null);
      
      const response = await apiService.getStudents();
      if (response.success) {
        const students = response.data.map(student => ({
          id: student.id,
          name: student.name,
          email: student.email,
          rollNumber: student.roll_number || student.student_id || 'N/A'
        }));
        setAllStudents(students);
      } else {
        setStudentsError(response.message || 'Failed to load students');
        setAllStudents([]);
      }
    } catch (error) {
      console.error('Error loading students:', error);
      setStudentsError('Failed to load students. Please try again.');
      setAllStudents([]);
    } finally {
      setLoadingStudents(false);
    }
  };

  const initializeFormData = () => {
    if (assessment) {
      setFormData({
        title: `${assessment.title} (Copy)`,
        description: assessment.description || '',
        instructions: assessment.instructions || '',
        startDate: new Date().toISOString().split('T')[0],
        endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 7 days from now
        startTime: assessment.scheduling?.start_time || '09:00',
        endTime: assessment.scheduling?.end_time || '17:00',
        timezone: assessment.scheduling?.timezone || 'UTC',
        earlyAccessHours: assessment.scheduling?.early_access_hours || 0,
        lateSubmissionMinutes: assessment.scheduling?.late_submission_minutes || 0,
        timeLimit: assessment.time_limit_minutes?.toString() || '60',
        maxAttempts: assessment.max_attempts?.toString() || '1',
        passingScore: assessment.passing_score?.toString() || '50',
        totalPoints: assessment.total_points?.toString() || '100',
        department: assessment.department || '',
        tags: assessment.tags || [],
        proctoringSettings: assessment.proctoring_settings || {},
        questionSettings: {
          shuffleQuestions: assessment.shuffle_questions || false,
          showResultsImmediately: assessment.show_results_immediately || false,
          allowReview: assessment.allow_review || false
        },
        assignmentSettings: {
          requireProctoring: assessment.require_proctoring || false,
          accessPassword: assessment.access_password || ''
        }
      });
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleStudentToggle = (student) => {
    setSelectedStudents(prev => {
      const isSelected = prev.some(s => s.id === student.id);
      if (isSelected) {
        return prev.filter(s => s.id !== student.id);
      } else {
        return [...prev, student];
      }
    });
  };

  const handleSelectAllStudents = () => {
    if (selectedStudents.length === allStudents.length) {
      setSelectedStudents([]);
    } else {
      setSelectedStudents(allStudents);
    }
  };

  const filteredStudents = allStudents.filter(student =>
    student.name.toLowerCase().includes(studentSearchQuery.toLowerCase()) ||
    student.email.toLowerCase().includes(studentSearchQuery.toLowerCase()) ||
    student.rollNumber.toLowerCase().includes(studentSearchQuery.toLowerCase())
  );

  const handleCopy = () => {
    const copyData = {
      ...formData,
      selectedStudents,
      reminderSettings,
      originalAssessmentId: assessment.id
    };
    onCopy(copyData);
  };

  const getAssessmentTypeIcon = (type) => {
    switch (type) {
      case 'quiz': return <FileText className="h-4 w-4" />;
      case 'exam': return <Target className="h-4 w-4" />;
      case 'assignment': return <FileText className="h-4 w-4" />;
      default: return <FileText className="h-4 w-4" />;
    }
  };

  const getDifficultyColor = (level) => {
    switch (level) {
      case 'easy': return 'bg-green-100 text-green-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'hard': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Copy className="h-5 w-5" />
            <span>Copy Assessment</span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Original Assessment Preview */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Original Assessment</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h3 className="font-semibold text-lg mb-2">{assessment?.title}</h3>
                  <p className="text-gray-600 text-sm mb-3">{assessment?.description}</p>
                  <div className="flex items-center space-x-2 mb-2">
                    {getAssessmentTypeIcon(assessment?.assessment_type)}
                    <span className="text-sm capitalize">{assessment?.assessment_type}</span>
                    <Badge className={getDifficultyColor(assessment?.difficulty_level)}>
                      {assessment?.difficulty_level}
                    </Badge>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Clock className="h-4 w-4 text-gray-500" />
                    <span className="text-sm">{assessment?.time_limit_minutes} minutes</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Target className="h-4 w-4 text-gray-500" />
                    <span className="text-sm">{assessment?.total_points} points</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Users className="h-4 w-4 text-gray-500" />
                    <span className="text-sm">{assessment?.max_attempts} attempts</span>
                  </div>
                  {assessment?.require_proctoring && (
                    <div className="flex items-center space-x-2">
                      <Shield className="h-4 w-4 text-red-500" />
                      <span className="text-sm text-red-600">Proctoring Required</span>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Copy Settings */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Basic Information */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Basic Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="title">Assessment Title *</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => handleInputChange('title', e.target.value)}
                    placeholder="Enter assessment title"
                  />
                </div>
                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    placeholder="Enter assessment description"
                    rows={3}
                  />
                </div>
                <div>
                  <Label htmlFor="instructions">Instructions</Label>
                  <Textarea
                    id="instructions"
                    value={formData.instructions}
                    onChange={(e) => handleInputChange('instructions', e.target.value)}
                    placeholder="Enter assessment instructions"
                    rows={3}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Schedule & Settings */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Schedule & Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="startDate">Start Date</Label>
                    <Input
                      id="startDate"
                      type="date"
                      value={formData.startDate}
                      onChange={(e) => handleInputChange('startDate', e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="endDate">End Date</Label>
                    <Input
                      id="endDate"
                      type="date"
                      value={formData.endDate}
                      onChange={(e) => handleInputChange('endDate', e.target.value)}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="startTime">Start Time</Label>
                    <Input
                      id="startTime"
                      type="time"
                      value={formData.startTime}
                      onChange={(e) => handleInputChange('startTime', e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="endTime">End Time</Label>
                    <Input
                      id="endTime"
                      type="time"
                      value={formData.endTime}
                      onChange={(e) => handleInputChange('endTime', e.target.value)}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="timezone">Timezone</Label>
                    <Select value={formData.timezone} onValueChange={(value) => handleInputChange('timezone', value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="UTC">UTC</SelectItem>
                        <SelectItem value="America/New_York">EST (New York)</SelectItem>
                        <SelectItem value="America/Chicago">CST (Chicago)</SelectItem>
                        <SelectItem value="America/Denver">MST (Denver)</SelectItem>
                        <SelectItem value="America/Los_Angeles">PST (Los Angeles)</SelectItem>
                        <SelectItem value="Europe/London">GMT (London)</SelectItem>
                        <SelectItem value="Europe/Paris">CET (Paris)</SelectItem>
                        <SelectItem value="Asia/Tokyo">JST (Tokyo)</SelectItem>
                        <SelectItem value="Asia/Kolkata">IST (India)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="earlyAccessHours">Early Access (hours)</Label>
                    <Input
                      id="earlyAccessHours"
                      type="number"
                      min="0"
                      value={formData.earlyAccessHours}
                      onChange={(e) => handleInputChange('earlyAccessHours', parseInt(e.target.value) || 0)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="lateSubmissionMinutes">Late Submission (minutes)</Label>
                    <Input
                      id="lateSubmissionMinutes"
                      type="number"
                      min="0"
                      value={formData.lateSubmissionMinutes}
                      onChange={(e) => handleInputChange('lateSubmissionMinutes', parseInt(e.target.value) || 0)}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="timeLimit">Time Limit (minutes)</Label>
                    <Input
                      id="timeLimit"
                      type="number"
                      value={formData.timeLimit}
                      onChange={(e) => handleInputChange('timeLimit', e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="maxAttempts">Max Attempts</Label>
                    <Input
                      id="maxAttempts"
                      type="number"
                      value={formData.maxAttempts}
                      onChange={(e) => handleInputChange('maxAttempts', e.target.value)}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="passingScore">Passing Score (%)</Label>
                    <Input
                      id="passingScore"
                      type="number"
                      value={formData.passingScore}
                      onChange={(e) => handleInputChange('passingScore', e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="totalPoints">Total Points</Label>
                    <Input
                      id="totalPoints"
                      type="number"
                      value={formData.totalPoints}
                      onChange={(e) => handleInputChange('totalPoints', e.target.value)}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Student Assignment */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Student Assignment</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="assignToStudents"
                      checked={showStudentSelection}
                      onCheckedChange={setShowStudentSelection}
                    />
                    <Label htmlFor="assignToStudents">Assign to students immediately</Label>
                  </div>
                  {showStudentSelection && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleSelectAllStudents}
                    >
                      {selectedStudents.length === allStudents.length ? 'Deselect All' : 'Select All'}
                    </Button>
                  )}
                </div>

                {showStudentSelection && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="space-y-4"
                  >
                    <div>
                      <Label htmlFor="studentSearch">Search Students</Label>
                      <Input
                        id="studentSearch"
                        placeholder="Search by name, email, or roll number"
                        value={studentSearchQuery}
                        onChange={(e) => setStudentSearchQuery(e.target.value)}
                      />
                    </div>
                    
                    {loadingStudents ? (
                      <div className="flex items-center justify-center p-8">
                        <Loader2 className="h-6 w-6 animate-spin mr-2" />
                        <span>Loading students...</span>
                      </div>
                    ) : studentsError ? (
                      <div className="p-4 border border-red-200 rounded-lg bg-red-50">
                        <div className="flex items-center space-x-2">
                          <AlertTriangle className="h-4 w-4 text-red-600" />
                          <span className="text-red-800">{studentsError}</span>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={loadStudents}
                          className="mt-2"
                        >
                          Try Again
                        </Button>
                      </div>
                    ) : (
                      <div className="max-h-48 overflow-y-auto border rounded-lg p-4">
                        <div className="space-y-2">
                          {filteredStudents.length === 0 ? (
                            <div className="text-center text-gray-500 py-4">
                              {studentSearchQuery ? 'No students found matching your search' : 'No students available'}
                            </div>
                          ) : (
                            filteredStudents.map((student) => (
                              <div
                                key={student.id}
                                className="flex items-center space-x-3 p-2 hover:bg-gray-50 rounded"
                              >
                                <Checkbox
                                  checked={selectedStudents.some(s => s.id === student.id)}
                                  onCheckedChange={() => handleStudentToggle(student)}
                                />
                                <div className="flex-1">
                                  <div className="font-medium">{student.name}</div>
                                  <div className="text-sm text-gray-500">
                                    {student.email} • {student.rollNumber}
                                  </div>
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    )}
                    
                    <div className="text-sm text-gray-600">
                      {selectedStudents.length} student{selectedStudents.length !== 1 ? 's' : ''} selected
                    </div>
                  </motion.div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Reminder Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Reminder Settings</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="sendImmediately"
                    checked={reminderSettings.sendImmediately}
                    onCheckedChange={(checked) => 
                      setReminderSettings(prev => ({ ...prev, sendImmediately: checked }))
                    }
                  />
                  <Label htmlFor="sendImmediately">Send immediate notification</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="sendBeforeStart"
                    checked={reminderSettings.sendBeforeStart}
                    onCheckedChange={(checked) => 
                      setReminderSettings(prev => ({ ...prev, sendBeforeStart: checked }))
                    }
                  />
                  <Label htmlFor="sendBeforeStart">Send reminder before start date</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="sendBeforeEnd"
                    checked={reminderSettings.sendBeforeEnd}
                    onCheckedChange={(checked) => 
                      setReminderSettings(prev => ({ ...prev, sendBeforeEnd: checked }))
                    }
                  />
                  <Label htmlFor="sendBeforeEnd">Send reminder before end date</Label>
                </div>
                <div>
                  <Label htmlFor="customMessage">Custom Reminder Message</Label>
                  <Textarea
                    id="customMessage"
                    value={reminderSettings.customReminderMessage}
                    onChange={(e) => 
                      setReminderSettings(prev => ({ ...prev, customReminderMessage: e.target.value }))
                    }
                    placeholder="Enter custom reminder message (optional)"
                    rows={3}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Summary */}
          <Alert>
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>Summary:</strong> This will create a complete copy of the assessment with all questions, 
              proctoring settings, and configurations. {showStudentSelection && selectedStudents.length > 0 && 
                `It will be assigned to ${selectedStudents.length} student${selectedStudents.length !== 1 ? 's' : ''} and `}
              {reminderSettings.sendImmediately && 'immediate notifications will be sent.'}
            </AlertDescription>
          </Alert>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button 
            onClick={handleCopy} 
            disabled={loading || !formData.title.trim()}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Copying...
              </>
            ) : (
              <>
                <Copy className="h-4 w-4 mr-2" />
                Copy Assessment
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CopyAssessmentDialog;
