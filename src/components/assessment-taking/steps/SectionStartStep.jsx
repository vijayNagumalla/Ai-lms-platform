import React from 'react';
import DOMPurify from 'dompurify';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Clock, Play, ArrowRight, CheckCircle } from 'lucide-react';

const SectionStartStep = ({ 
  section, 
  sectionIndex,
  totalSections,
  onStart,
  onBack,
  onCancel,
  theme = 'light',
  isDarkMode = false
}) => {
  return (
    <div className={`min-h-screen flex items-center justify-center px-4 py-8 ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
      <div className="w-full max-w-2xl">
        <Card className={`shadow-lg ${isDarkMode ? 'bg-gray-800 border-gray-700' : ''}`}>
          <CardContent className="p-8">
            {/* Section Title */}
            <div className="text-center mb-8">
              <h1 className={`text-3xl font-bold mb-3 ${isDarkMode ? 'text-gray-100' : 'text-gray-900'}`}>
                {section.name || `Section ${sectionIndex + 1}`}
              </h1>
              <Badge variant="default" className="text-sm">
                Section {sectionIndex + 1} of {totalSections}
              </Badge>
            </div>

            {/* Section Details */}
            {section.description && (
              <div className="mb-6">
                <h3 className={`text-sm font-semibold mb-2 uppercase tracking-wide ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Description
                </h3>
                <div className={`leading-relaxed ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                  <p>{section.description}</p>
                </div>
              </div>
            )}

            {section.instructions && (
              <div className="mb-6">
                <h3 className={`text-sm font-semibold mb-2 uppercase tracking-wide ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Instructions
                </h3>
                <div 
                  className={`leading-relaxed prose prose-sm max-w-none ${isDarkMode ? 'text-gray-300 prose-invert' : 'text-gray-600'}`}
                  dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(section.instructions) }} 
                />
              </div>
            )}

            {/* Section Information */}
            <div className={`flex items-center justify-center gap-6 mb-8 pb-8 border-b ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
              {section.time_limit_minutes && (
                <>
                  <div className="text-center">
                    <div className={`flex items-center justify-center gap-2 mb-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      <Clock className="h-4 w-4" />
                      <span className="text-sm">Time Limit</span>
                    </div>
                    <p className={`text-lg font-semibold ${isDarkMode ? 'text-gray-100' : 'text-gray-900'}`}>
                      {section.time_limit_minutes} minutes
                    </p>
                  </div>
                  <div className={`w-px h-12 ${isDarkMode ? 'bg-gray-700' : 'bg-gray-200'}`}></div>
                </>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <Button 
                variant="outline" 
                onClick={onBack}
                className={`flex-1 ${isDarkMode ? 'border-gray-600 text-gray-300 hover:bg-gray-700' : ''}`}
                disabled={sectionIndex === 0}
              >
                Back
              </Button>
              <Button
                onClick={onStart}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
              >
                <Play className="h-4 w-4 mr-2" />
                Start Section
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default SectionStartStep;

