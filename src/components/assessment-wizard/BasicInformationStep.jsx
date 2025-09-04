import React from 'react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { ASSESSMENT_TYPES, QUESTION_TYPES } from '../../lib/constants';

export default function BasicInformationStep({ formData, updateFormData }) {
  const handleAssessmentTypeChange = (type) => {
    updateFormData({ 
      assessment_type: type,
      // Reset multi-type structure when switching to single type
      multi_type_structure: type === 'multi_type' ? 'section_based' : null
    });
  };

  const handleMultiTypeStructureChange = (structure) => {
    updateFormData({ multi_type_structure: structure });
  };





  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-4">Basic Information</h2>
        <p className="text-gray-600 mb-6">Provide the fundamental details about your assessment.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
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

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Assessment Type <span className="text-red-500">*</span>
          </label>
          <RadioGroup 
            value={formData.assessment_type || 'single_type'} 
            onValueChange={handleAssessmentTypeChange}
            className="space-y-3"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="single_type" id="single_type" />
              <Label htmlFor="single_type" className="text-sm font-medium cursor-pointer">
                Single Type Assessment
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="multi_type" id="multi_type" />
              <Label htmlFor="multi_type" className="text-sm font-medium cursor-pointer">
                Multi Type Assessment
              </Label>
            </div>
          </RadioGroup>
        </div>
      </div>

      {/* Multi-Type Structure Selection - Only show when Multi Type is selected */}
      {formData.assessment_type === 'multi_type' && (
        <Card className="p-6 bg-blue-50 border-blue-200">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Multi-Type Structure <span className="text-red-500">*</span>
              </label>
              <RadioGroup 
                value={formData.multi_type_structure || 'section_based'} 
                onValueChange={handleMultiTypeStructureChange}
                className="space-y-3"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="section_based" id="section_based" />
                  <Label htmlFor="section_based" className="text-sm font-medium cursor-pointer">
                    Section Based
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="non_section_based" id="non_section_based" />
                  <Label htmlFor="non_section_based" className="text-sm font-medium cursor-pointer">
                    Non-Section Based
                  </Label>
                </div>
              </RadioGroup>
            </div>


          </div>
        </Card>
      )}







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