import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { 
  FileText, Clock, Users, Settings, Eye, Calendar, 
  CheckSquare, Star, AlertTriangle, Info
} from 'lucide-react';

export default function ReviewStep({ formData, calculateTotalPoints, colleges }) {
  const getAssessmentTypeLabel = (type) => {
    const typeMap = {
      'quiz': 'Quiz',
      'test': 'Test',
      'exam': 'Exam',
      'assignment': 'Assignment',
      'coding_challenge': 'Coding Challenge',
      'survey': 'Survey'
    };
    return typeMap[type] || type;
  };

  const getDifficultyColor = (difficulty) => {
    const colorMap = {
      'beginner': 'bg-green-100 text-green-800',
      'intermediate': 'bg-yellow-100 text-yellow-800',
      'advanced': 'bg-red-100 text-red-800',
      'expert': 'bg-purple-100 text-purple-800'
    };
    return colorMap[difficulty] || 'bg-gray-100 text-gray-800';
  };

  const getProctoringLabel = (type) => {
    const typeMap = {
      'none': 'None',
      'basic': 'Basic',
      'advanced': 'Advanced',
      'ai': 'AI Proctoring'
    };
    return typeMap[type] || type;
  };

  const getAssignmentCount = () => {
    return (
      (formData.assigned_colleges?.length || 0) +
      (formData.assigned_departments?.length || 0) +
      (formData.assigned_groups?.length || 0) +
      (formData.assigned_students?.length || 0)
    );
  };

  const getTotalQuestions = () => {
    return formData.sections.reduce((total, section) => total + section.questions.length, 0);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-4">Review & Submit</h2>
        <p className="text-gray-600 mb-6">
          Review all your assessment settings before creating and assigning it.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Basic Information */}
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <FileText className="w-5 h-5 text-blue-600" />
            <h3 className="text-lg font-semibold">Basic Information</h3>
          </div>
          
          <div className="space-y-3">
            <div>
              <label className="text-sm font-medium text-gray-600">Title</label>
              <p className="text-sm">{formData.title || 'No title'}</p>
            </div>
            
            <div>
              <label className="text-sm font-medium text-gray-600">Assessment Type</label>
              <Badge variant="outline">{getAssessmentTypeLabel(formData.assessment_category)}</Badge>
            </div>
            
            <div>
              <label className="text-sm font-medium text-gray-600">Assessment Structure</label>
              <Badge variant={formData.assessment_type === 'multi_type' ? 'default' : 'secondary'}>
                {formData.assessment_type === 'multi_type' 
                  ? `Multi-Type (${formData.multi_type_structure === 'section_based' ? 'Section Based' : 'Non-Section Based'})`
                  : 'Single Type'
                }
              </Badge>
            </div>
            
            <div>
              <label className="text-sm font-medium text-gray-600">Difficulty</label>
              <Badge className={getDifficultyColor(formData.difficulty_level)}>
                {formData.difficulty_level}
              </Badge>
            </div>
            
            {formData.description && (
              <div>
                <label className="text-sm font-medium text-gray-600">Description</label>
                <p className="text-sm text-gray-700">{formData.description}</p>
              </div>
            )}
            
            {formData.instructions && (
              <div>
                <label className="text-sm font-medium text-gray-600">Instructions</label>
                <p className="text-sm text-gray-700">{formData.instructions}</p>
              </div>
            )}
          </div>
        </Card>

        {/* Assessment Settings */}
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <Settings className="w-5 h-5 text-green-600" />
            <h3 className="text-lg font-semibold">Assessment Settings</h3>
          </div>
          
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-600">Time Limit</label>
                <p className="text-sm">
                  {formData.time_limit_minutes ? `${formData.time_limit_minutes} minutes` : 'No limit'}
                </p>
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-600">Total Points</label>
                <p className="text-sm font-medium">{Number(calculateTotalPoints()).toFixed(2)} points</p>
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-600">Passing Score</label>
                <p className="text-sm">{formData.passing_score}%</p>
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-600">Max Attempts</label>
                <p className="text-sm">{formData.max_attempts}</p>
              </div>
            </div>
            
            <div className="flex flex-wrap gap-2">
              {formData.shuffle_questions && <Badge variant="secondary">Shuffle Questions</Badge>}
              {formData.show_results_immediately && <Badge variant="secondary">Show Results Immediately</Badge>}
              {formData.allow_review && <Badge variant="secondary">Allow Review</Badge>}
              {formData.show_correct_answers && <Badge variant="secondary">Show Correct Answers</Badge>}
            </div>
          </div>
        </Card>

        {/* Scheduling */}
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <Calendar className="w-5 h-5 text-purple-600" />
            <h3 className="text-lg font-semibold">Scheduling</h3>
          </div>
          
          <div className="space-y-3">
            <div>
              <label className="text-sm font-medium text-gray-600">Start Date & Time</label>
              <p className="text-sm">
                {formData.start_date} at {formData.start_time} ({formData.assessment_country || formData.timezone})
              </p>
            </div>
            
            <div>
              <label className="text-sm font-medium text-gray-600">End Date & Time</label>
              <p className="text-sm">
                {formData.end_date} at {formData.end_time} ({formData.assessment_country || formData.timezone})
              </p>
            </div>
            
            {formData.early_access_hours > 0 && (
              <div>
                <label className="text-sm font-medium text-gray-600">Early Access</label>
                <p className="text-sm">{formData.early_access_hours} hours before start</p>
              </div>
            )}
            
            {formData.late_submission_minutes > 0 && (
              <div>
                <label className="text-sm font-medium text-gray-600">Late Window</label>
                <p className="text-sm">{formData.late_submission_minutes} minutes after time limit</p>
              </div>
            )}
          </div>
        </Card>

        {/* Proctoring */}
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <Eye className="w-5 h-5 text-orange-600" />
            <h3 className="text-lg font-semibold">Proctoring</h3>
          </div>
          
          <div className="space-y-3">
            <div>
              <label className="text-sm font-medium text-gray-600">Proctoring Type</label>
              <Badge variant="outline">{getProctoringLabel(formData.proctoring_type)}</Badge>
            </div>
            
            {formData.require_proctoring && (
              <div className="space-y-2">
                {formData.require_webcam && <Badge variant="secondary">Webcam Required</Badge>}
                {formData.require_microphone && <Badge variant="secondary">Microphone Required</Badge>}
                {formData.screen_sharing_detection && <Badge variant="secondary">Screen Sharing Detection</Badge>}
                {formData.multiple_device_detection && <Badge variant="secondary">Multiple Device Detection</Badge>}
                {formData.plagiarism_detection && <Badge variant="secondary">Plagiarism Detection</Badge>}
              </div>
            )}
          </div>
        </Card>

        {/* Section Control */}
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <CheckSquare className="w-5 h-5 text-indigo-600" />
            <h3 className="text-lg font-semibold">Assessment Control</h3>
          </div>
          
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-600">Assessment Type</label>
                <Badge variant={formData.assessment_type === 'multi_type' ? "default" : "secondary"}>
                  {formData.assessment_type === 'multi_type' ? 'Multi-Type' : 'Single Type'}
                </Badge>
              </div>
              
              {formData.assessment_type === 'multi_type' && formData.multi_type_structure === 'section_based' ? (
                <>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Structure</label>
                    <Badge variant="default">Section Based</Badge>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium text-gray-600">Sequential Access</label>
                    <Badge variant={formData.sequential_sections ? "default" : "secondary"}>
                      {formData.sequential_sections ? 'Enabled' : 'Disabled'}
                    </Badge>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium text-gray-600">Section Completion</label>
                    <Badge variant={formData.require_section_completion ? "default" : "secondary"}>
                      {formData.require_section_completion ? 'Required' : 'Optional'}
                    </Badge>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium text-gray-600">Multi-Type Sections</label>
                    <p className="text-sm">
                      {formData.sections.filter(s => (s.allowed_question_types || []).length > 1).length} of {formData.sections.length} sections
                    </p>
                  </div>
                </>
              ) : formData.assessment_type === 'multi_type' && formData.multi_type_structure === 'non_section_based' ? (
                <>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Structure</label>
                    <Badge variant="default">Non-Section Based</Badge>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium text-gray-600">Question Shuffling</label>
                    <Badge variant={formData.shuffle_all_questions ? "default" : "secondary"}>
                      {formData.shuffle_all_questions ? 'Enabled' : 'Disabled'}
                    </Badge>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium text-gray-600">Question Navigation</label>
                    <Badge variant={formData.allow_question_navigation ? "default" : "secondary"}>
                      {formData.allow_question_navigation ? 'Enabled' : 'Disabled'}
                    </Badge>
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Section Navigation</label>
                    <Badge variant={formData.allow_section_navigation ? "default" : "secondary"}>
                      {formData.allow_section_navigation ? 'Enabled' : 'Disabled'}
                    </Badge>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium text-gray-600">Progress Tracking</label>
                    <Badge variant={formData.show_section_progress ? "default" : "secondary"}>
                      {formData.show_section_progress ? 'Enabled' : 'Disabled'}
                    </Badge>
                  </div>
                </>
              )}
            </div>
            
            {formData.assessment_type === 'multi_type' && formData.multi_type_structure === 'section_based' && formData.sequential_sections && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-sm text-blue-700">
                  <Info className="w-4 h-4 inline mr-1" />
                  Students must complete each section before accessing the next one.
                </p>
              </div>
            )}
            
            {formData.assessment_type === 'multi_type' && formData.multi_type_structure === 'non_section_based' && (
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
                <p className="text-sm text-purple-700">
                  <Info className="w-4 h-4 inline mr-1" />
                  All questions in continuous flow with mixed question types throughout.
                </p>
              </div>
            )}
            
            {formData.assessment_type === 'single_type' && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                <p className="text-sm text-green-700">
                  <Info className="w-4 h-4 inline mr-1" />
                  Traditional single-type assessment with standard navigation.
                </p>
              </div>
            )}
          </div>
        </Card>

        {/* Assignment */}
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <Users className="w-5 h-5 text-indigo-600" />
            <h3 className="text-lg font-semibold">Assignment</h3>
          </div>
          
          <div className="space-y-3">
            <div>
              <label className="text-sm font-medium text-gray-600">Total Assignments</label>
              <p className="text-sm font-medium">{getAssignmentCount()} recipients</p>
            </div>
            
            {formData.assigned_colleges?.length > 0 && (
              <div>
                <label className="text-sm font-medium text-gray-600">Colleges</label>
                <div className="flex flex-wrap gap-1 mt-1">
                  {formData.assigned_colleges.map(collegeId => {
                    const college = colleges.find(c => c.id === collegeId);
                    return (
                      <Badge key={collegeId} variant="outline" className="text-xs">
                        {college?.name || 'Unknown College'}
                      </Badge>
                    );
                  })}
                </div>
              </div>
            )}
            
            {formData.assigned_departments?.length > 0 && (
              <div>
                <label className="text-sm font-medium text-gray-600">Departments</label>
                <p className="text-sm">{formData.assigned_departments.length} departments</p>
              </div>
            )}
            
            {formData.assigned_groups?.length > 0 && (
              <div>
                <label className="text-sm font-medium text-gray-600">Groups</label>
                <p className="text-sm">{formData.assigned_groups.length} groups</p>
              </div>
            )}
            
            {formData.assigned_students?.length > 0 && (
              <div>
                <label className="text-sm font-medium text-gray-600">Individual Students</label>
                <p className="text-sm">{formData.assigned_students.length} students</p>
              </div>
            )}
            
            {formData.access_password && (
              <div>
                <label className="text-sm font-medium text-gray-600">Access Password</label>
                <p className="text-sm">Password protected</p>
              </div>
            )}
          </div>
        </Card>

        {/* Sections & Questions */}
        <Card className="p-6 lg:col-span-2">
          <div className="flex items-center gap-2 mb-4">
            <CheckSquare className="w-5 h-5 text-teal-600" />
            <h3 className="text-lg font-semibold">Sections & Questions</h3>
          </div>
          
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-2xl font-bold text-blue-600">{formData.sections.length}</p>
                <p className="text-sm text-gray-600">Sections</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-2xl font-bold text-green-600">{getTotalQuestions()}</p>
                <p className="text-sm text-gray-600">Questions</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-2xl font-bold text-purple-600">{Number(calculateTotalPoints()).toFixed(2)}</p>
                <p className="text-sm text-gray-600">Total Points</p>
              </div>
            </div>
            
            <Separator />
            
            <div className="space-y-3">
              {formData.sections.map((section, index) => {
                const getSectionTypeIcon = (section) => {
                  const allowedTypes = section.allowed_question_types || [];
                  const hasCoding = allowedTypes.includes('coding');
                  const hasMCQ = allowedTypes.includes('multiple_choice') || 
                                 allowedTypes.includes('single_choice') ||
                                 allowedTypes.includes('true_false');
                  
                  if (hasCoding && hasMCQ) return '🔗'; // Multi-type
                  if (hasCoding) return '💻'; // Coding only
                  if (hasMCQ) return '📝'; // MCQ only
                  return '📄'; // Other types
                };

                const getSectionTypeLabel = (section) => {
                  const types = section.allowed_question_types || [];
                  const typeLabels = [];
                  
                  if (types.includes('coding')) typeLabels.push('Coding');
                  if (types.includes('multiple_choice') || types.includes('single_choice') || types.includes('true_false')) {
                    typeLabels.push('MCQ');
                  }
                  if (types.includes('essay')) typeLabels.push('Essay');
                  if (types.includes('short_answer')) typeLabels.push('Short Answer');
                  if (types.includes('fill_blanks')) typeLabels.push('Fill Blanks');
                  
                  return typeLabels.join(' + ');
                };

                return (
                  <div key={section.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="text-2xl">{getSectionTypeIcon(section)}</div>
                        <div>
                          <h4 className="font-medium flex items-center gap-2">
                            {section.name}
                            <Badge variant="outline" className="text-xs">
                              {getSectionTypeLabel(section)}
                            </Badge>
                          </h4>
                          <p className="text-sm text-gray-500">Section {index + 1}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">{section.questions.length} questions</Badge>
                        {section.time_limit_minutes && (
                          <Badge variant="secondary">{section.time_limit_minutes} min</Badge>
                        )}
                      </div>
                    </div>
                    
                    {section.description && (
                      <p className="text-sm text-gray-600 mb-3">{section.description}</p>
                    )}
                    
                    <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4 mb-3">
                      <div>
                        <label className="text-xs font-medium text-gray-500">Navigation</label>
                        <div className="flex items-center gap-1 mt-1">
                          <Badge variant="outline" className="text-xs">
                            {section.navigation_type === 'free' ? 'Free Navigation' : 'Sequential'}
                          </Badge>
                          {section.navigation_type === 'sequential' && (
                            <span className="text-xs text-orange-600">🔒</span>
                          )}
                        </div>
                      </div>
                      
                      <div>
                        <label className="text-xs font-medium text-gray-500">Completion</label>
                        <div className="flex items-center gap-1 mt-1">
                          <Badge variant="outline" className="text-xs">
                            {section.completion_requirement === 'all' ? 'All Required' : 
                             section.completion_requirement === 'minimum' ? `Min ${section.minimum_questions}` :
                             section.completion_requirement === 'percentage' ? `${section.completion_percentage}%` : 'All Required'}
                          </Badge>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex flex-wrap gap-1">
                      {section.shuffle_questions && (
                        <Badge variant="secondary" className="text-xs">Shuffle</Badge>
                      )}
                      {section.allow_return_to_section && (
                        <Badge variant="secondary" className="text-xs">Allow Return</Badge>
                      )}
                      {(section.allowed_question_types || []).length > 1 && (
                        <Badge variant="default" className="text-xs">Multi-Type</Badge>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </Card>
      </div>

      {/* Email Notification Summary */}
      <Card className="p-6 bg-blue-50 border-blue-200">
        <div className="flex items-center gap-2 mb-4">
          <Info className="w-5 h-5 text-blue-600" />
          <h3 className="text-lg font-semibold text-blue-800">Email Notification Summary</h3>
        </div>
        
        <div className="text-sm text-blue-700 space-y-2">
          <p><strong>Recipients:</strong> {getAssignmentCount()} total recipients will receive email notifications</p>
          <p><strong>Email Content:</strong> Assessment details, schedule, instructions, and direct access link</p>
          <p><strong>Proctoring Info:</strong> {formData.require_proctoring ? 'Included' : 'Not applicable'}</p>
          <p><strong>Timing:</strong> Emails will be sent immediately after assessment creation</p>
        </div>
      </Card>

      {/* Final Summary */}
      <Card className="p-6 bg-green-50 border-green-200">
        <div className="flex items-center gap-2 mb-4">
          <Star className="w-5 h-5 text-green-600" />
          <h3 className="text-lg font-semibold text-green-800">Ready to Create Assessment</h3>
        </div>
        
        <div className="text-sm text-green-700 space-y-1">
          <p>✓ All required fields completed</p>
          <p>✓ {getTotalQuestions()} questions added across {formData.sections.length} sections</p>
          <p>✓ Assessment assigned to {getAssignmentCount()} recipients</p>
          <p>✓ Email notifications will be sent automatically</p>
                          <p>✓ Total assessment value: {Number(calculateTotalPoints()).toFixed(2)} points</p>
        </div>
      </Card>
    </div>
  );
} 