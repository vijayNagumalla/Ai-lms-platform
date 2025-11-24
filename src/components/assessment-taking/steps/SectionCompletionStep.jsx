import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, ArrowRight, ArrowLeft, Flag, XCircle, ChevronDown, ChevronUp, Loader2 } from 'lucide-react';

const SectionCompletionStep = ({ 
  section, 
  sectionIndex,
  totalSections,
  sectionQuestions,
  answers,
  flaggedQuestions = new Set(),
  onContinue,
  onBack,
  onCancel,
  onNavigateToQuestion,
  theme = 'light',
  isDarkMode = false,
  isSavingBeforeContinue = false,
  saving = false
}) => {
  const [showOverview, setShowOverview] = useState(true);
  
  const handleContinue = () => {
    if (onContinue) {
      onContinue();
    }
  };
  
  const answeredCount = sectionQuestions.filter(q => {
    const answer = answers[q.id];
    if (!answer) return false;
    
    // Special handling for coding questions - check if all tests passed
    if (q.question_type === 'coding') {
      return answer && (
        (typeof answer === 'object' && answer.allTestsPassed === true) ||
        (typeof answer === 'object' && answer.code && answer.code.trim() !== '' && 
         Array.isArray(answer.testResults) && answer.testResults.length > 0 &&
         answer.testResults.every(result => result && result.result?.verdict?.status === 'accepted'))
      );
    }
    
    // For other question types, use standard check
    return (
      (typeof answer === 'string' && answer.trim() !== '') ||
      (Array.isArray(answer) && answer.length > 0) ||
      (typeof answer === 'object' && answer.value)
    );
  }).length;

  const isLastSection = sectionIndex === totalSections - 1;

  const getQuestionStatus = (question) => {
    const answer = answers[question.id];
    let isAnswered = false;
    
    // Special handling for coding questions - check if all tests passed
    if (question.question_type === 'coding') {
      isAnswered = answer && (
        (typeof answer === 'object' && answer.allTestsPassed === true) ||
        (typeof answer === 'object' && answer.code && answer.code.trim() !== '' && 
         Array.isArray(answer.testResults) && answer.testResults.length > 0 &&
         answer.testResults.every(result => result && result.result?.verdict?.status === 'accepted'))
      );
    } else {
      // For other question types, use standard check
      isAnswered = answer && (
        (typeof answer === 'string' && answer.trim() !== '') ||
        (Array.isArray(answer) && answer.length > 0) ||
        (typeof answer === 'object' && answer.value)
      );
    }
    
    const isFlagged = flaggedQuestions.has(question.id);
    
    if (isAnswered && isFlagged) {
      return { status: 'answered-flagged', label: 'Answered & Marked', color: 'bg-yellow-600', textColor: 'text-yellow-100' };
    } else if (isAnswered) {
      return { status: 'answered', label: 'Answered', color: 'bg-green-600', textColor: 'text-green-100' };
    } else if (isFlagged) {
      return { status: 'flagged', label: 'Marked for Review', color: 'bg-orange-600', textColor: 'text-orange-100' };
    } else {
      return { status: 'not-answered', label: 'Not Answered', color: 'bg-red-600', textColor: 'text-red-100' };
    }
  };

  const handleQuestionClick = (questionIndex) => {
    if (onNavigateToQuestion) {
      onNavigateToQuestion(questionIndex, sectionIndex);
    }
  };

  return (
    <div className={`min-h-screen flex items-center justify-center px-4 py-8 ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
      <div className="w-full max-w-4xl">
        <Card className={`shadow-lg ${isDarkMode ? 'bg-gray-800 border-gray-700' : ''}`}>
          <CardContent className="p-6">
            {/* Section Title */}
            <div className="text-center mb-6">
              <div className="mb-3">
                <CheckCircle className={`h-8 w-8 mx-auto ${isDarkMode ? 'text-green-400' : 'text-green-600'}`} />
              </div>
              <h1 className={`text-xl font-bold mb-2 ${isDarkMode ? 'text-gray-100' : 'text-gray-900'}`}>
                {section.name || `Section ${sectionIndex + 1}`} Completed
              </h1>
              <Badge variant="default" className="text-xs bg-green-600">
                Section {sectionIndex + 1} of {totalSections}
              </Badge>
            </div>

            {/* Summary */}
            <div className={`mb-4 pb-4 border-b ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
              <div className={`rounded-lg p-4 space-y-2 ${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                <div className="flex justify-between items-center">
                  <span className={`text-sm font-medium ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>Questions Answered:</span>
                  <span className={`text-base font-semibold ${isDarkMode ? 'text-gray-100' : 'text-gray-900'}`}>
                    {answeredCount} / {sectionQuestions.length}
                  </span>
                </div>
                <div className={`w-full rounded-full h-1.5 ${isDarkMode ? 'bg-gray-600' : 'bg-gray-200'}`}>
                  <div 
                    className="bg-green-600 h-1.5 rounded-full transition-all duration-300"
                    style={{ width: `${(answeredCount / sectionQuestions.length) * 100}%` }}
                  ></div>
                </div>
              </div>
            </div>

            {/* Question Overview */}
            <Card className={`mb-4 ${isDarkMode ? 'bg-gray-700 border-gray-600' : ''}`}>
              <CardHeader 
                className={`cursor-pointer py-3 ${isDarkMode ? 'bg-gray-700 border-gray-600' : ''}`}
                onClick={() => setShowOverview(!showOverview)}
              >
                <div className="flex items-center justify-between">
                  <CardTitle className={`text-sm ${isDarkMode ? 'text-gray-100' : ''}`}>
                    Question Overview
                  </CardTitle>
                  {showOverview ? (
                    <ChevronUp className={`h-4 w-4 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`} />
                  ) : (
                    <ChevronDown className={`h-4 w-4 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`} />
                  )}
                </div>
              </CardHeader>
              {showOverview && (
                <CardContent className="pt-4">
                  <div className="grid grid-cols-8 sm:grid-cols-10 gap-1.5 mb-3">
                    {sectionQuestions.map((question, index) => {
                      const status = getQuestionStatus(question);
                      return (
                        <button
                          key={question.id}
                          onClick={() => handleQuestionClick(index)}
                          className={`
                            aspect-square rounded flex items-center justify-center
                            font-medium text-xs transition-all hover:scale-105
                            ${status.color} ${status.textColor}
                            ${isDarkMode ? 'hover:ring-1 hover:ring-gray-400' : 'hover:ring-1 hover:ring-gray-600'}
                          `}
                          title={`Question ${index + 1}: ${status.label}`}
                        >
                          {index + 1}
                        </button>
                      );
                    })}
                  </div>
                  <div className="flex flex-wrap gap-3 justify-center text-xs">
                    <div className="flex items-center gap-1.5">
                      <div className="w-3 h-3 rounded bg-green-600"></div>
                      <span className={isDarkMode ? 'text-gray-300' : 'text-gray-700'}>Answered</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className="w-3 h-3 rounded bg-yellow-600"></div>
                      <span className={isDarkMode ? 'text-gray-300' : 'text-gray-700'}>Answered & Marked</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className="w-3 h-3 rounded bg-orange-600"></div>
                      <span className={isDarkMode ? 'text-gray-300' : 'text-gray-700'}>Marked for Review</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className="w-3 h-3 rounded bg-red-600"></div>
                      <span className={isDarkMode ? 'text-gray-300' : 'text-gray-700'}>Not Answered</span>
                    </div>
                  </div>
                </CardContent>
              )}
            </Card>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <Button 
                variant="outline" 
                onClick={onBack}
                className={`flex-1 ${isDarkMode ? 'border-gray-600 text-gray-300 hover:bg-gray-700' : ''}`}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Review Section
              </Button>
              {isLastSection ? (
                <Button
                  onClick={handleContinue}
                  disabled={isSavingBeforeContinue || saving}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white disabled:opacity-50"
                >
                  {isSavingBeforeContinue || saving ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Complete Assessment
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </>
                  )}
                </Button>
              ) : (
                <Button
                  onClick={handleContinue}
                  disabled={isSavingBeforeContinue || saving}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50"
                >
                  {isSavingBeforeContinue || saving ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      Continue to Next Section
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </>
                  )}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default SectionCompletionStep;

