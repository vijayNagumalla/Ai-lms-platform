import React from 'react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { QUESTION_TYPES } from '../../lib/constants';

export default function BasicInformationStep({ formData, updateFormData }) {





  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-4">Basic Information</h2>
        <p className="text-gray-600 mb-6">Provide the fundamental details about your assessment.</p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Assessment Title <span className="text-red-500">*</span>
        </label>
        <Input
          value={formData.title}
          onChange={(e) => updateFormData({ title: e.target.value })}
          placeholder="Enter assessment title"
          className="w-full"
        />
      </div>








      {!formData.require_proctoring && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Description
          </label>
          <Textarea
            value={formData.description}
            onChange={(e) => updateFormData({ description: e.target.value })}
            placeholder="Provide a brief description of the assessment"
            rows={4}
            className="w-full"
          />
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Instructions
        </label>
        <Textarea
          value={formData.instructions}
          onChange={(e) => updateFormData({ instructions: e.target.value })}
          placeholder="Provide detailed instructions for students taking this assessment"
          rows={6}
          className="w-full"
        />
        <p className="text-sm text-gray-500 mt-2">
          These instructions will be shown to students before they begin the assessment.
        </p>
      </div>


    </div>
  );
} 