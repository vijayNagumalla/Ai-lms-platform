import React from 'react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { X, Plus, GripVertical, ArrowUp, ArrowDown, Lock, Unlock, CheckCircle } from 'lucide-react';

export default function SectionManagementStep({ 
  formData, 
  updateFormData, 
  updateSection, 
  addSection, 
  removeSection,
  questionTypes 
}) {
  const handleQuestionTypeToggle = (sectionId, questionType, checked) => {
    const section = formData.sections.find(s => s.id === sectionId);
    if (!section) return;

    const allowedTypes = checked 
      ? [...section.allowed_question_types, questionType]
      : section.allowed_question_types.filter(type => type !== questionType);

    updateSection(sectionId, { allowed_question_types: allowedTypes });
  };

  const moveSection = (fromIndex, toIndex) => {
    const newSections = [...formData.sections];
    const [movedSection] = newSections.splice(fromIndex, 1);
    newSections.splice(toIndex, 0, movedSection);
    updateFormData({ sections: newSections });
  };

  const getSectionTypeIcon = (section) => {
    const hasCoding = section.allowed_question_types.includes('coding');
    const hasMCQ = section.allowed_question_types.includes('multiple_choice') || 
                   section.allowed_question_types.includes('single_choice') ||
                   section.allowed_question_types.includes('true_false');
    
    if (hasCoding && hasMCQ) return '🔗'; // Multi-type
    if (hasCoding) return '💻'; // Coding only
    if (hasMCQ) return '📝'; // MCQ only
    return '📄'; // Other types
  };

  const getSectionTypeLabel = (section) => {
    const types = section.allowed_question_types;
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
    <div className="space-y-6">
      {/* Global Section Settings */}
      <Card className="p-6 bg-blue-50 border-blue-200">
        <h3 className="text-lg font-semibold text-blue-800 mb-4">Global Section Control</h3>
        
        {/* Show different options based on assessment structure */}
        {true ? (
          <div className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="sequential_sections"
                  checked={formData.sequential_sections || false}
                  onCheckedChange={(checked) => updateFormData({ sequential_sections: checked })}
                />
                <label htmlFor="sequential_sections" className="text-sm font-medium">
                  Sequential Section Access
                </label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="require_section_completion"
                  checked={formData.require_section_completion || false}
                  onCheckedChange={(checked) => updateFormData({ require_section_completion: checked })}
                />
                <label htmlFor="require_section_completion" className="text-sm font-medium">
                  Require Section Completion
                </label>
              </div>
            </div>
            <p className="text-sm text-blue-700">
              Multi-Type Section-Based Assessment: Students must complete each section before accessing the next one.
            </p>
          </div>
        ) : formData.assessment_type === 'multi_type' && formData.multi_type_structure === 'non_section_based' ? (
          <div className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="shuffle_all_questions"
                  checked={formData.shuffle_all_questions || false}
                  onCheckedChange={(checked) => updateFormData({ shuffle_all_questions: checked })}
                />
                <label htmlFor="shuffle_all_questions" className="text-sm font-medium">
                  Shuffle All Questions
                </label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="allow_question_navigation"
                  checked={formData.allow_question_navigation || true}
                  onCheckedChange={(checked) => updateFormData({ allow_question_navigation: checked })}
                />
                <label htmlFor="allow_question_navigation" className="text-sm font-medium">
                  Allow Question Navigation
                </label>
              </div>
            </div>
            <p className="text-sm text-blue-700">
              Multi-Type Non-Section Based Assessment: All questions in continuous flow with mixed types.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="allow_section_navigation"
                  checked={formData.allow_section_navigation || true}
                  onCheckedChange={(checked) => updateFormData({ allow_section_navigation: checked })}
                />
                <label htmlFor="allow_section_navigation" className="text-sm font-medium">
                  Allow Section Navigation
                </label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="show_section_progress"
                  checked={formData.show_section_progress || true}
                  onCheckedChange={(checked) => updateFormData({ show_section_progress: checked })}
                />
                <label htmlFor="show_section_progress" className="text-sm font-medium">
                  Show Section Progress
                </label>
              </div>
            </div>
            <p className="text-sm text-blue-700">
              Single Type Assessment: Traditional navigation with optional progress tracking.
            </p>
          </div>
        )}
      </Card>

      <div className="space-y-4">
        {formData.sections.map((section, index) => (
          <Card key={section.id} className="p-6">
            <div className="space-y-4">
              {/* Section Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="text-2xl">{getSectionTypeIcon(section)}</div>
                  <div>
                    <h3 className="text-lg font-semibold flex items-center gap-2">
                      Section {index + 1}
                      <Badge variant="outline" className="text-xs">
                        {getSectionTypeLabel(section)}
                      </Badge>
                    </h3>
                    <p className="text-sm text-gray-500">
                      {section.name || 'Untitled Section'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {index > 0 && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => moveSection(index, index - 1)}
                    >
                      <ArrowUp className="w-4 h-4" />
                    </Button>
                  )}
                  {index < formData.sections.length - 1 && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => moveSection(index, index + 1)}
                    >
                      <ArrowDown className="w-4 h-4" />
                    </Button>
                  )}
                  {formData.sections.length > 1 && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => removeSection(section.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </div>

              {/* Section Details */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Section Name
                  </label>
                  <Input
                    value={section.name}
                    onChange={(e) => updateSection(section.id, { name: e.target.value })}
                    placeholder="Enter section name"
                    className="w-full"
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Time Limit (minutes)
                  </label>
                  <Input
                    type="text"
                    value={section.time_limit_minutes || ''}
                    onChange={(e) => {
                      const value = e.target.value.trim();
                      if (value === '') {
                        updateSection(section.id, { time_limit_minutes: null });
                      } else {
                        const numValue = parseInt(value);
                        if (!isNaN(numValue) && numValue > 0) {
                          updateSection(section.id, { time_limit_minutes: numValue });
                        }
                      }
                    }}
                    placeholder="No limit"
                    className="w-full"
                  />
                  <p className="text-xs text-gray-500">Leave empty for no time limit</p>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Description
                  </label>
                  <Textarea
                    value={section.description}
                    onChange={(e) => updateSection(section.id, { description: e.target.value })}
                    placeholder="Brief description of this section"
                    rows={2}
                    className="w-full"
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Instructions
                  </label>
                  <Textarea
                    value={section.instructions}
                    onChange={(e) => updateSection(section.id, { instructions: e.target.value })}
                    placeholder="Specific instructions for this section"
                    rows={2}
                    className="w-full"
                  />
                </div>
              </div>

              {/* Section Completion Requirements */}
              <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Navigation Type
                  </label>
                  <Select 
                    value={section.navigation_type} 
                    onValueChange={(value) => updateSection(section.id, { navigation_type: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="free">Free Navigation</SelectItem>
                      <SelectItem value="sequential">Sequential Navigation</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-gray-500">
                    {section.navigation_type === 'free' 
                      ? 'Students can navigate freely between questions in this section'
                      : 'Students must answer questions in order and cannot go back'
                    }
                  </p>
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Completion Requirement
                  </label>
                  <Select 
                    value={section.completion_requirement || 'all'} 
                    onValueChange={(value) => updateSection(section.id, { completion_requirement: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Questions Required</SelectItem>
                      <SelectItem value="minimum">Minimum Questions</SelectItem>
                      <SelectItem value="percentage">Percentage Required</SelectItem>
                    </SelectContent>
                  </Select>
                  {section.completion_requirement === 'minimum' && (
                    <Input
                      type="number"
                      value={section.minimum_questions || ''}
                      onChange={(e) => updateSection(section.id, { 
                        minimum_questions: e.target.value ? parseInt(e.target.value) : null 
                      })}
                      placeholder="Minimum questions to complete"
                      min="1"
                      className="w-full"
                    />
                  )}
                  {section.completion_requirement === 'percentage' && (
                    <Input
                      type="number"
                      value={section.completion_percentage || ''}
                      onChange={(e) => updateSection(section.id, { 
                        completion_percentage: e.target.value ? parseInt(e.target.value) : null 
                      })}
                      placeholder="Percentage required (1-100)"
                      min="1"
                      max="100"
                      className="w-full"
                    />
                  )}
                </div>
              </div>

              {/* Question Type Restrictions */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Allowed Question Types
                </label>
                {true ? (
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                    {questionTypes.map((type) => (
                      <div key={type.value} className="flex items-center space-x-2">
                        <Checkbox
                          id={`${section.id}-${type.value}`}
                          checked={section.allowed_question_types.includes(type.value)}
                          onCheckedChange={(checked) => handleQuestionTypeToggle(section.id, type.value, checked)}
                        />
                        <label 
                          htmlFor={`${section.id}-${type.value}`} 
                          className="text-sm font-medium cursor-pointer"
                        >
                          {type.label}
                        </label>
                      </div>
                    ))}
                  </div>
                ) : (
                  <Select 
                    value={section.allowed_question_types[0] || ''} 
                    onValueChange={(value) => updateSection(section.id, { allowed_question_types: [value] })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select question type" />
                    </SelectTrigger>
                    <SelectContent>
                      {questionTypes.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
                <p className="text-sm text-gray-500 mt-2">
                  Select the question types allowed in this section. You can mix different types for multi-type assessments.
                </p>
              </div>

              {/* Section Options */}
              <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id={`${section.id}-shuffle`}
                    checked={section.shuffle_questions}
                    onCheckedChange={(checked) => updateSection(section.id, { shuffle_questions: checked })}
                  />
                  <label htmlFor={`${section.id}-shuffle`} className="text-sm font-medium">
                    Shuffle questions within this section
                  </label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id={`${section.id}-allow_return`}
                    checked={section.allow_return_to_section || false}
                    onCheckedChange={(checked) => updateSection(section.id, { allow_return_to_section: checked })}
                  />
                  <label htmlFor={`${section.id}-allow_return`} className="text-sm font-medium">
                    Allow return to this section after completion
                  </label>
                </div>
              </div>

              {/* Question Count and Section Status */}
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-4">
                  <span className="text-sm font-medium">Questions: {section.questions.length}</span>
                  <span className="text-sm text-gray-500">|</span>
                  <span className="text-sm font-medium">Type: {getSectionTypeLabel(section)}</span>
                  <span className="text-sm text-gray-500">|</span>
                  <span className="text-sm font-medium">
                    {section.navigation_type === 'sequential' ? (
                      <span className="flex items-center gap-1 text-orange-600">
                        <Lock className="w-3 h-3" />
                        Sequential
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-green-600">
                        <Unlock className="w-3 h-3" />
                        Free Navigation
                      </span>
                    )}
                  </span>
                </div>
                {section.questions.length > 0 && (
                  <Badge variant="secondary" className="flex items-center gap-1">
                    <CheckCircle className="w-3 h-3" />
                    Ready
                  </Badge>
                )}
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Add Section Button */}
      <Button
        type="button"
        variant="outline"
        onClick={addSection}
        className="w-full"
      >
        <Plus className="w-4 h-4 mr-2" />
        Add Section
      </Button>

      {/* Section Summary */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="text-sm font-semibold text-blue-800 mb-2">Section Summary</h3>
        <div className="text-sm text-blue-700 space-y-1">
          <p><strong>Total Sections:</strong> {formData.sections.length}</p>
          <p><strong>Total Questions:</strong> {formData.sections.reduce((total, section) => total + section.questions.length, 0)}</p>
          {formData.assessment_type === 'multi_type' && formData.multi_type_structure === 'section_based' ? (
            <>
              <p><strong>Sequential Access:</strong> {formData.sequential_sections ? 'Enabled' : 'Disabled'}</p>
              <p><strong>Section Completion Required:</strong> {formData.require_section_completion ? 'Yes' : 'No'}</p>
              <p><strong>Multi-Type Sections:</strong> {formData.sections.filter(s => s.allowed_question_types.length > 1).length} sections</p>
            </>
          ) : formData.assessment_type === 'multi_type' && formData.multi_type_structure === 'non_section_based' ? (
            <>
              <p><strong>Question Shuffling:</strong> {formData.shuffle_all_questions ? 'Enabled' : 'Disabled'}</p>
              <p><strong>Question Navigation:</strong> {formData.allow_question_navigation ? 'Enabled' : 'Disabled'}</p>
              <p><strong>Assessment Structure:</strong> Non-Section Based</p>
            </>
          ) : (
            <>
              <p><strong>Section Navigation:</strong> {formData.allow_section_navigation ? 'Enabled' : 'Disabled'}</p>
              <p><strong>Progress Tracking:</strong> {formData.show_section_progress ? 'Enabled' : 'Disabled'}</p>
              <p><strong>Assessment Type:</strong> Single Type</p>
            </>
          )}
        </div>
      </div>
    </div>
  );
} 