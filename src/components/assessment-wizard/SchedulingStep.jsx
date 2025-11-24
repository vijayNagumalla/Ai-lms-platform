import React, { useState, useEffect, useMemo } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CountrySelect, getTimezoneForCountry } from '@/components/ui/country-select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Clock, Calendar, Globe, AlertTriangle, CheckCircle } from 'lucide-react';

export default function SchedulingStep({ formData, updateFormData }) {
  const [validationErrors, setValidationErrors] = useState({});
  const [timePreview, setTimePreview] = useState(null);

  // Get current date and time for defaults
  const getCurrentDate = () => {
    const now = new Date();
    return now.toISOString().split('T')[0];
  };

  const getCurrentTime = () => {
    const now = new Date();
    return now.toTimeString().slice(0, 5);
  };

  // Initialize form data if not present
  useEffect(() => {
    if (!formData.start_date) {
      updateFormData({ start_date: getCurrentDate() });
    }
    if (!formData.start_time) {
      updateFormData({ start_time: getCurrentTime() });
    }
    if (!formData.end_date) {
      updateFormData({ end_date: getCurrentDate() });
    }
    if (!formData.end_time) {
      updateFormData({ end_time: getCurrentTime() });
    }
    if (!formData.assessment_timezone) {
      updateFormData({ assessment_timezone: 'UTC' });
    }
  }, []);

  // Update time preview when form data changes
  useEffect(() => {
    if (formData.start_date && formData.start_time && formData.end_date && formData.end_time && formData.assessment_timezone) {
      setTimePreview({
        start: `${formData.start_date} ${formData.start_time}`,
        end: `${formData.end_date} ${formData.end_time}`,
        timezone: formData.assessment_timezone
      });
    }
  }, [formData.start_date, formData.start_time, formData.end_date, formData.end_time, formData.assessment_timezone]);

  // Validation function - memoized to prevent infinite re-renders
  const validationResult = useMemo(() => {
    const errors = {};

    // Required field validation
    if (!formData.start_date) errors.start_date = 'Start date is required';
    if (!formData.start_time) errors.start_time = 'Start time is required';
    if (!formData.end_date) errors.end_date = 'End date is required';
    if (!formData.end_time) errors.end_time = 'End time is required';
    if (!formData.assessment_timezone) errors.assessment_timezone = 'Assessment timezone is required';

    // Date/time logic validation
    if (formData.start_date && formData.end_date) {
      if (formData.start_date > formData.end_date) {
        errors.end_date = 'End date must be after start date';
      }
    }

    if (formData.start_date && formData.end_date && formData.start_time && formData.end_time) {
      if (formData.start_date === formData.end_date && formData.start_time >= formData.end_time) {
        errors.end_time = 'End time must be after start time on the same day';
      }
    }

    // Early access validation
    if (formData.early_access_hours && formData.early_access_hours > 72) {
      errors.early_access_hours = 'Early access cannot exceed 72 hours';
    }

    // Late submission validation
    if (formData.late_submission_minutes && formData.late_submission_minutes > 1440) {
      errors.late_submission_minutes = 'Late submission window cannot exceed 24 hours';
    }

    return {
      errors,
      isValid: Object.keys(errors).length === 0
    };
  }, [formData]);

  // Update validation errors when validation result changes
  useEffect(() => {
    setValidationErrors(validationResult.errors);
  }, [validationResult.errors]);

  // Handle date/time changes
  const handleDateChange = (field, value) => {
    updateFormData({ [field]: value });
    
    // Clear validation error when user fixes it
    if (validationErrors[field]) {
      setValidationErrors(prev => ({ ...prev, [field]: null }));
    }
  };

  // Handle timezone change
  const handleTimezoneChange = (country) => {
    const timezone = getTimezoneForCountry(country);
    updateFormData({ 
      assessment_country: country,
      assessment_timezone: timezone 
    });
    
    if (validationErrors.assessment_timezone) {
      setValidationErrors(prev => ({ ...prev, assessment_timezone: null }));
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-4">Assessment Scheduling</h2>
        <p className="text-gray-600 mb-6">
          Set the assessment availability and timing. All times will be treated as local time in the selected timezone.
        </p>
      </div>

      {/* Date and Time Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Date and Time Settings
          </CardTitle>
          <CardDescription>
            Set when the assessment will be available to students
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-4 gap-4">
            <div>
              <Label htmlFor="start_date" className="text-sm font-medium">
                Start Date <span className="text-red-500">*</span>
              </Label>
              <Input
                id="start_date"
                type="date"
                value={formData.start_date || ''}
                onChange={(e) => handleDateChange('start_date', e.target.value)}
                min={getCurrentDate()}
                className={validationErrors.start_date ? 'border-red-500' : ''}
                required
              />
              {validationErrors.start_date && (
                <p className="text-sm text-red-500 mt-1">{validationErrors.start_date}</p>
              )}
            </div>

            <div>
              <Label htmlFor="start_time" className="text-sm font-medium">
                Start Time <span className="text-red-500">*</span>
              </Label>
              <Input
                id="start_time"
                type="time"
                value={formData.start_time || ''}
                onChange={(e) => handleDateChange('start_time', e.target.value)}
                className={validationErrors.start_time ? 'border-red-500' : ''}
                required
              />
              {validationErrors.start_time && (
                <p className="text-sm text-red-500 mt-1">{validationErrors.start_time}</p>
              )}
            </div>

            <div>
              <Label htmlFor="end_date" className="text-sm font-medium">
                End Date <span className="text-red-500">*</span>
              </Label>
              <Input
                id="end_date"
                type="date"
                value={formData.end_date || ''}
                onChange={(e) => handleDateChange('end_date', e.target.value)}
                min={formData.start_date || getCurrentDate()}
                className={validationErrors.end_date ? 'border-red-500' : ''}
                required
              />
              {validationErrors.end_date && (
                <p className="text-sm text-red-500 mt-1">{validationErrors.end_date}</p>
              )}
            </div>

            <div>
              <Label htmlFor="end_time" className="text-sm font-medium">
                End Time <span className="text-red-500">*</span>
              </Label>
              <Input
                id="end_time"
                type="time"
                value={formData.end_time || ''}
                onChange={(e) => handleDateChange('end_time', e.target.value)}
                className={validationErrors.end_time ? 'border-red-500' : ''}
                required
              />
              {validationErrors.end_time && (
                <p className="text-sm text-red-500 mt-1">{validationErrors.end_time}</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Timezone Selection */}
      <Card>
        <CardHeader>
        </CardHeader>
        <CardContent>
          <div>
            <Label htmlFor="assessment_timezone" className="text-sm font-medium">
              Assessment Timezone (Country) <span className="text-red-500">*</span>
            </Label>
            <CountrySelect
              value={formData.assessment_country || ''}
              onValueChange={handleTimezoneChange}
              placeholder="Select country for assessment timezone"
            />
            {formData.assessment_timezone && (
              <div className="mt-2 flex items-center gap-2">
                <Badge variant="outline" className="text-sm">
                  {formData.assessment_timezone}
                </Badge>
                <span className="text-sm text-gray-500">
                  Times will be treated as local time in this timezone
                </span>
              </div>
            )}
            {validationErrors.assessment_timezone && (
              <p className="text-sm text-red-500 mt-1">{validationErrors.assessment_timezone}</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Access Control Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Access Control
          </CardTitle>
          <CardDescription>
            Configure early access and late submission windows
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <Label htmlFor="early_access_hours" className="text-sm font-medium">
                Early Access (hours)
              </Label>
              <Input
                id="early_access_hours"
                type="number"
                min="0"
                max="72"
                value={formData.early_access_hours || 0}
                onChange={(e) => updateFormData({ early_access_hours: parseInt(e.target.value) || 0 })}
                placeholder="0"
                className={validationErrors.early_access_hours ? 'border-red-500' : ''}
              />
              <p className="text-sm text-gray-500 mt-1">
                Hours before start time students can access the assessment
              </p>
              {validationErrors.early_access_hours && (
                <p className="text-sm text-red-500 mt-1">{validationErrors.early_access_hours}</p>
              )}
            </div>

            <div>
              <Label htmlFor="late_submission_minutes" className="text-sm font-medium">
                Late Submission Window (minutes)
              </Label>
              <Input
                id="late_submission_minutes"
                type="number"
                min="0"
                max="1440"
                value={formData.late_submission_minutes || 0}
                onChange={(e) => updateFormData({ late_submission_minutes: parseInt(e.target.value) || 0 })}
                placeholder="0"
                className={validationErrors.late_submission_minutes ? 'border-red-500' : ''}
              />
              <p className="text-sm text-gray-500 mt-1">
                Minutes after end time submissions are still accepted
              </p>
              {validationErrors.late_submission_minutes && (
                <p className="text-sm text-red-500 mt-1">{validationErrors.late_submission_minutes}</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Schedule Preview */}
      {timePreview && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              Schedule Preview
            </CardTitle>
            <CardDescription>
              Preview of your assessment schedule
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-green-800">Start:</span>
                  <span className="text-green-700">{timePreview.start} ({timePreview.timezone})</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-medium text-green-800">End:</span>
                  <span className="text-green-700">{timePreview.end} ({timePreview.timezone})</span>
                </div>
                {formData.early_access_hours > 0 && (
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-green-800">Early Access:</span>
                    <span className="text-green-700">{formData.early_access_hours} hours before start</span>
                  </div>
                )}
                {formData.late_submission_minutes > 0 && (
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-green-800">Late Window:</span>
                    <span className="text-green-700">{formData.late_submission_minutes} minutes after end</span>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Validation Summary */}
      {Object.keys(validationErrors).length > 0 && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Please fix the following errors:
            <ul className="mt-2 list-disc list-inside">
              {Object.values(validationErrors).filter(Boolean).map((error, index) => (
                <li key={index}>{error}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      {/* Form validation status */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-gray-500">
          All fields marked with <span className="text-red-500">*</span> are required
        </div>
        <div className="flex items-center gap-2">
          {validationResult.isValid ? (
            <div className="flex items-center gap-2 text-green-600">
              <CheckCircle className="h-4 w-4" />
              <span className="text-sm">Schedule is valid</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="h-4 w-4" />
              <span className="text-sm">Please fix validation errors</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 