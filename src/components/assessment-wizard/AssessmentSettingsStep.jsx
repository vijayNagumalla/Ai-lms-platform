import React from 'react';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const DIFFICULTY_LEVELS = [
  { value: 'beginner', label: 'Beginner' },
  { value: 'intermediate', label: 'Intermediate' },
  { value: 'advanced', label: 'Advanced' },
  { value: 'expert', label: 'Expert' }
];

export default function AssessmentSettingsStep({ formData, updateFormData }) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-4">Assessment Settings</h2>
        <p className="text-gray-600 mb-6">Configure the assessment parameters and behavior.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Time Limit (minutes)
          </label>
          <Input
            type="text"
            value={formData.time_limit_minutes || ''}
            onChange={(e) => {
              const value = e.target.value.trim();
              if (value === '') {
                updateFormData({ time_limit_minutes: null });
              } else {
                const numValue = parseInt(value);
                if (!isNaN(numValue) && numValue > 0) {
                  updateFormData({ time_limit_minutes: numValue });
                }
              }
            }}
            placeholder="Leave empty for no time limit"
            className="w-full"
          />
          <p className="text-sm text-gray-500 mt-1">Leave empty for no time limit</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Per-Question Time Limit (seconds)
          </label>
          <Input
            type="text"
            value={formData.per_question_time_limit || ''}
            onChange={(e) => {
              const value = e.target.value.trim();
              if (value === '') {
                updateFormData({ per_question_time_limit: null });
              } else {
                const numValue = parseInt(value);
                if (!isNaN(numValue) && numValue > 0) {
                  updateFormData({ per_question_time_limit: numValue });
                }
              }
            }}
            placeholder="Optional"
            className="w-full"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Total Points
          </label>
          <Input
            type="number"
            value={Number(formData.sections.reduce((total, section) => {
              return total + section.questions.reduce((sectionTotal, question) => {
                return sectionTotal + (Number(question.points) || 1);
              }, 0);
            }, 0)).toFixed(2)}
            readOnly
            className="w-full bg-gray-50"
          />
          <p className="text-sm text-gray-500 mt-1">Auto-calculated from questions</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Passing Score (%)
          </label>
          <Input
            type="number"
            value={formData.passing_score}
            onChange={(e) => updateFormData({ passing_score: parseInt(e.target.value) || 0 })}
            placeholder="70"
            min="0"
            max="100"
            className="w-full"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Max Attempts
          </label>
          <Input
            type="number"
            value={formData.max_attempts}
            onChange={(e) => updateFormData({ max_attempts: parseInt(e.target.value) || 1 })}
            placeholder="1"
            min="1"
            className="w-full"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Time Between Attempts (hours)
          </label>
          <Input
            type="number"
            value={formData.time_between_attempts_hours}
            onChange={(e) => updateFormData({ time_between_attempts_hours: parseInt(e.target.value) || 0 })}
            placeholder="24"
            min="0"
            className="w-full"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Difficulty Level
        </label>
        <Select 
          value={formData.difficulty_level} 
          onValueChange={(value) => updateFormData({ difficulty_level: value })}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {DIFFICULTY_LEVELS.map((level) => (
              <SelectItem key={level.value} value={level.value}>
                {level.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Display Options</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="shuffle_questions"
              checked={formData.shuffle_questions}
              onCheckedChange={(checked) => updateFormData({ shuffle_questions: checked })}
            />
            <label htmlFor="shuffle_questions" className="text-sm font-medium">
              Shuffle Questions
            </label>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="show_results_immediately"
              checked={formData.show_results_immediately}
              onCheckedChange={(checked) => updateFormData({ show_results_immediately: checked })}
            />
            <label htmlFor="show_results_immediately" className="text-sm font-medium">
              Show Results Immediately
            </label>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="allow_review"
              checked={formData.allow_review}
              onCheckedChange={(checked) => updateFormData({ allow_review: checked })}
            />
            <label htmlFor="allow_review" className="text-sm font-medium">
              Allow Review After Submission
            </label>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="show_correct_answers"
              checked={formData.show_correct_answers}
              onCheckedChange={(checked) => updateFormData({ show_correct_answers: checked })}
            />
            <label htmlFor="show_correct_answers" className="text-sm font-medium">
              Show Correct Answers After Submission
            </label>
          </div>
        </div>
      </div>
    </div>
  );
} 