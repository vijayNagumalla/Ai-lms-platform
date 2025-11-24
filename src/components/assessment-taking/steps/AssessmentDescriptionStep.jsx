import React, { useState } from 'react';
import DOMPurify from 'dompurify';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Clock, 
  Play,
  ArrowRight,
  AlertTriangle,
  CheckCircle
} from 'lucide-react';

const AssessmentDescriptionStep = ({ 
  assessment, 
  submission, 
  isRetake, 
  onComplete, 
  onBack, 
  onCancel,
  sections = [],
  theme = 'light',
  isDarkMode = false
}) => {
  const [agreedToStart, setAgreedToStart] = useState(false);

  // Get section count - check sections prop, assessment.sections, or parsed assessment.sections
  const getSectionCount = () => {
    if (sections && sections.length > 0) {
      return sections.length;
    }
    
    // Check if assessment has sections property
    if (assessment?.sections) {
      if (Array.isArray(assessment.sections)) {
        return assessment.sections.length;
      }
      // If it's a string (JSON), try to parse it
      if (typeof assessment.sections === 'string') {
        try {
          const parsed = JSON.parse(assessment.sections);
          if (Array.isArray(parsed)) {
            return parsed.length;
          }
        } catch (e) {
          // Ignore parse errors
        }
      }
    }
    
    return 0;
  };

  const sectionCount = getSectionCount();

  const getAssessmentStatus = () => {
    const now = new Date();
    const startTime = assessment.start_date && assessment.start_time 
      ? new Date(`${assessment.start_date}T${assessment.start_time}`)
      : null;
    const endTime = assessment.end_date && assessment.end_time 
      ? new Date(`${assessment.end_date}T${assessment.end_time}`)
      : null;

    if (startTime && now < startTime) {
      return { status: 'upcoming', message: 'Assessment has not started yet' };
    }
    if (endTime && now > endTime) {
      return { status: 'expired', message: 'Assessment has ended' };
    }
    return { status: 'active', message: 'Assessment is currently active' };
  };

  const status = getAssessmentStatus();

  const handleStart = () => {
    if (!agreedToStart) {
      return;
    }
    onComplete();
  };

  return (
    <div className={`min-h-screen flex items-center justify-center px-4 py-8 ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
      <div className="w-full max-w-2xl">
        <Card className={`shadow-lg ${isDarkMode ? 'bg-gray-800 border-gray-700' : ''}`}>
          <CardContent className="p-8">
            {/* Title */}
            <div className="text-center mb-8">
              <h1 className={`text-3xl font-bold mb-3 ${isDarkMode ? 'text-gray-100' : 'text-gray-900'}`}>
                {assessment.title}
              </h1>
              <Badge 
                variant={status.status === 'active' ? 'default' : 'secondary'}
                className="text-sm"
              >
                {status.status === 'active' ? 'Active' : status.status === 'upcoming' ? 'Upcoming' : 'Expired'}
              </Badge>
            </div>

            {/* Key Information */}
            <div className={`flex items-center justify-center gap-6 mb-8 pb-8 border-b ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
              <div className="text-center">
                <div className={`flex items-center justify-center gap-2 mb-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  <Clock className="h-4 w-4" />
                  <span className="text-sm">Time Limit</span>
                </div>
                <p className={`text-lg font-semibold ${isDarkMode ? 'text-gray-100' : 'text-gray-900'}`}>
                  {assessment.time_limit_minutes} minutes
                </p>
              </div>
              <div className={`w-px h-12 ${isDarkMode ? 'bg-gray-700' : 'bg-gray-200'}`}></div>
              <div className="text-center">
                <div className={`flex items-center justify-center gap-2 mb-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  <CheckCircle className="h-4 w-4" />
                  <span className="text-sm">
                    {assessment.total_questions ? 'Questions' : sectionCount > 0 ? 'Sections' : 'Questions'}
                  </span>
                </div>
                <p className={`text-lg font-semibold ${isDarkMode ? 'text-gray-100' : 'text-gray-900'}`}>
                  {assessment.total_questions || (sectionCount > 0 ? sectionCount : 'Multiple')}
                </p>
              </div>
              <div className={`w-px h-12 ${isDarkMode ? 'bg-gray-700' : 'bg-gray-200'}`}></div>
              <div className="text-center">
                <div className={`mb-1 text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Total Points</div>
                <p className={`text-lg font-semibold ${isDarkMode ? 'text-gray-100' : 'text-gray-900'}`}>
                  {assessment.total_points}
                </p>
              </div>
            </div>

            {/* Description & Instructions */}
            <div className="space-y-6 mb-8">
              {assessment.description && (
                <div>
                  <h3 className={`text-sm font-semibold mb-2 uppercase tracking-wide ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    Description
                  </h3>
                  <div className={`leading-relaxed ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                    <p>{assessment.description}</p>
                  </div>
                </div>
              )}

              {assessment.instructions && (
                <div>
                  <h3 className={`text-sm font-semibold mb-2 uppercase tracking-wide ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    Instructions
                  </h3>
                  <div 
                    className={`leading-relaxed prose prose-sm max-w-none ${isDarkMode ? 'text-gray-300 prose-invert' : 'text-gray-600'}`}
                    dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(assessment.instructions) }} 
                  />
                </div>
              )}
            </div>

            {/* Status Alert */}
            {status.status !== 'active' && (
              <Alert variant={status.status === 'expired' ? 'destructive' : 'default'} className="mb-6">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  {status.message}
                </AlertDescription>
              </Alert>
            )}

            {/* Agreement Checkbox */}
            <div className={`mb-6 p-4 rounded-lg ${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={agreedToStart}
                  onChange={(e) => setAgreedToStart(e.target.checked)}
                  className={`mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 rounded ${isDarkMode ? 'border-gray-500 bg-gray-600' : 'border-gray-300'}`}
                />
                <span className={`text-sm ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                  I have read and understood the assessment requirements and instructions
                </span>
              </label>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <Button 
                variant="outline" 
                onClick={onCancel}
                className={`flex-1 ${isDarkMode ? 'border-gray-600 text-gray-300 hover:bg-gray-700' : ''}`}
              >
                Cancel
              </Button>
              <Button
                onClick={handleStart}
                disabled={!agreedToStart || status.status !== 'active'}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
              >
                <Play className="h-4 w-4 mr-2" />
                {isRetake ? 'Start Retake' : 'Start Assessment'}
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AssessmentDescriptionStep;
