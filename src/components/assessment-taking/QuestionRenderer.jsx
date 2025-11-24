import React, { useState, useEffect, useMemo, useCallback, useRef, memo } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Save,
  AlertTriangle,
  CheckCircle
} from 'lucide-react';
import { toast } from 'react-hot-toast';

// Memoized option item for better performance
const OptionItem = memo(({ option, index, value, onChange, type = 'radio', isDarkMode = false }) => {
  const optionId = `option-${index}`;
  const isSelected = type === 'radio' 
    ? value === option 
    : Array.isArray(value) && value.includes(option);

  return (
    <div className={`flex items-center space-x-3 p-3 rounded-lg transition-colors cursor-pointer ${isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-50'}`}>
      {type === 'radio' ? (
        <RadioGroupItem value={option} id={optionId} className="mt-0.5" />
      ) : (
        <Checkbox
          id={optionId}
          checked={isSelected}
          onCheckedChange={(checked) => {
            if (type === 'checkbox') {
              const currentValues = Array.isArray(value) ? value : [];
              if (checked) {
                onChange([...currentValues, option]);
              } else {
                onChange(currentValues.filter(v => v !== option));
              }
            }
          }}
          className="mt-0.5"
        />
      )}
      <Label 
        htmlFor={optionId} 
        className={`flex-1 text-sm cursor-pointer leading-relaxed ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}
      >
        {option}
      </Label>
    </div>
  );
});

OptionItem.displayName = 'OptionItem';

const QuestionRenderer = memo(({ 
  question, 
  answer, 
  onAnswerChange, 
  onSave,
  theme = 'light',
  isDarkMode = false
}) => {
  const [localAnswer, setLocalAnswer] = useState(answer || '');
  const [isSaving, setIsSaving] = useState(false);

  // Sync with external answer changes
  useEffect(() => {
    setLocalAnswer(answer || '');
  }, [answer, question.id]);

  // Memoize question data
  const questionData = useMemo(() => ({
    id: question.id,
    text: question.question_text || question.content || question.title || 'Question',
    type: question.question_type || 'multiple_choice',
    points: question.points || 1,
    options: Array.isArray(question.options) ? question.options : [],
    isRequired: question.is_required !== false
  }), [question]);

  // Auto-save effect
  const autoSaveTimerRef = useRef(null);

  useEffect(() => {
    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current);
    }
    
    if (localAnswer && onSave && localAnswer !== (answer || '') && (
      typeof localAnswer === 'string' ? localAnswer.trim() !== '' :
      Array.isArray(localAnswer) ? localAnswer.length > 0 :
      typeof localAnswer === 'object' && localAnswer !== null
    )) {
      autoSaveTimerRef.current = setTimeout(() => {
        onSave(localAnswer);
      }, 1000);
    }

    return () => {
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
      }
    };
  }, [localAnswer, answer, onSave]);

  // Memoized handlers
  const handleAnswerChange = useCallback((newAnswer) => {
    setLocalAnswer(newAnswer);
    onAnswerChange(newAnswer);
  }, [onAnswerChange]);

  const handleSave = useCallback(async () => {
    if (!localAnswer || (typeof localAnswer === 'string' && !localAnswer.trim())) {
      toast.error('Please provide an answer before saving');
      return;
    }

    setIsSaving(true);
    try {
      await onSave(localAnswer);
      toast.success('Answer saved successfully');
    } catch (error) {
      console.error('Error saving answer:', error);
      toast.error('Failed to save answer');
    } finally {
      setIsSaving(false);
    }
  }, [localAnswer, onSave]);

  // Memoized answer status
  const hasAnswer = useMemo(() => {
    if (!localAnswer) return false;
    if (typeof localAnswer === 'string') return localAnswer.trim() !== '';
    if (Array.isArray(localAnswer)) return localAnswer.length > 0;
    if (typeof localAnswer === 'object') return Object.keys(localAnswer).length > 0;
    return false;
  }, [localAnswer]);

  // Render multiple choice questions
  const renderMultipleChoice = useMemo(() => {
    if (questionData.options.length === 0) {
      return (
        <div className={`text-sm italic p-4 rounded-lg ${isDarkMode ? 'text-gray-400 bg-gray-700' : 'text-gray-500 bg-gray-50'}`}>
          No options available for this question
        </div>
      );
    }
    
    return (
      <RadioGroup
        value={localAnswer}
        onValueChange={handleAnswerChange}
        className="space-y-1"
      >
        {questionData.options.map((option, index) => (
          <OptionItem
            key={`${questionData.id}-option-${index}`}
            option={option}
            index={index}
            value={localAnswer}
            onChange={handleAnswerChange}
            type="radio"
            isDarkMode={isDarkMode}
          />
        ))}
      </RadioGroup>
    );
  }, [questionData.id, questionData.options, localAnswer, handleAnswerChange, isDarkMode]);

  // Render checkbox questions (multiple select)
  const renderCheckbox = useMemo(() => {
    if (questionData.options.length === 0) {
    return (
        <div className={`text-sm italic p-4 rounded-lg ${isDarkMode ? 'text-gray-400 bg-gray-700' : 'text-gray-500 bg-gray-50'}`}>
          No options available for this question
        </div>
    );
    }

    const selectedAnswers = Array.isArray(localAnswer) ? localAnswer : [];

    return (
      <div className="space-y-1">
        {questionData.options.map((option, index) => (
          <OptionItem
            key={`${questionData.id}-checkbox-${index}`}
            option={option}
            index={index}
            value={selectedAnswers}
            onChange={handleAnswerChange}
            type="checkbox"
            isDarkMode={isDarkMode}
          />
        ))}
      </div>
    );
  }, [questionData.id, questionData.options, localAnswer, handleAnswerChange, isDarkMode]);

  // Render true/false questions
  const renderTrueFalse = useMemo(() => (
    <RadioGroup
      value={localAnswer}
      onValueChange={handleAnswerChange}
      className="space-y-1"
    >
      <OptionItem
        option="True"
        index={0}
        value={localAnswer}
        onChange={handleAnswerChange}
        type="radio"
        isDarkMode={isDarkMode}
      />
      <OptionItem
        option="False"
        index={1}
        value={localAnswer}
        onChange={handleAnswerChange}
        type="radio"
        isDarkMode={isDarkMode}
      />
    </RadioGroup>
  ), [localAnswer, handleAnswerChange, isDarkMode]);

  // Render short answer
  const renderShortAnswer = useMemo(() => (
      <Input
        value={localAnswer}
        onChange={(e) => handleAnswerChange(e.target.value)}
        placeholder="Enter your answer here..."
      className={`w-full ${isDarkMode ? 'bg-gray-700 border-gray-600 text-gray-100 placeholder:text-gray-400' : ''}`}
      autoFocus={false}
      />
  ), [localAnswer, handleAnswerChange, isDarkMode]);

  // Render essay
  const renderEssay = useMemo(() => (
      <Textarea
        value={localAnswer}
        onChange={(e) => handleAnswerChange(e.target.value)}
        placeholder="Enter your essay answer here..."
      className={`w-full min-h-32 resize-none ${isDarkMode ? 'bg-gray-700 border-gray-600 text-gray-100 placeholder:text-gray-400' : ''}`}
      rows={8}
      />
  ), [localAnswer, handleAnswerChange, isDarkMode]);

  // Render fill blanks
  const renderFillBlanks = useMemo(() => {
    const text = questionData.text;
    const blanks = text.match(/_{3,}/g) || [];
    
    if (blanks.length === 0) {
      return (
        <div className={`text-sm p-4 rounded-lg ${isDarkMode ? 'text-gray-300 bg-gray-700' : 'text-gray-600 bg-gray-50'}`}>
          No blanks found in this question.
        </div>
      );
    }

    const answers = Array.isArray(localAnswer) ? localAnswer : [];

    return (
      <div className="space-y-4">
        <div className={`text-sm mb-4 font-medium ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>
          Fill in the blanks below:
        </div>
        {blanks.map((blank, index) => (
          <div key={index} className="flex items-center space-x-3">
            <Label className={`text-sm font-medium min-w-[80px] ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>
              Blank {index + 1}:
            </Label>
            <Input
              value={answers[index] || ''}
              onChange={(e) => {
                const newAnswers = [...answers];
                newAnswers[index] = e.target.value;
                handleAnswerChange(newAnswers);
              }}
              placeholder="Enter answer..."
              className={`flex-1 ${isDarkMode ? 'bg-gray-700 border-gray-600 text-gray-100 placeholder:text-gray-400' : ''}`}
            />
          </div>
        ))}
      </div>
    );
  }, [questionData.text, localAnswer, handleAnswerChange, isDarkMode]);

  // Render file upload
  const renderFileUpload = useMemo(() => {
    const handleFileChange = (e) => {
      const file = e.target.files[0];
      if (file) {
        // CRITICAL FIX: Validate file size on frontend (max 10MB)
        const maxSize = 10 * 1024 * 1024; // 10MB
        if (file.size > maxSize) {
          toast.error(`File size exceeds maximum allowed size (10MB). Selected file is ${(file.size / 1024 / 1024).toFixed(2)}MB`);
          e.target.value = ''; // Clear the input
          return;
        }
        
        handleAnswerChange({
          fileName: file.name,
          fileSize: file.size,
          fileType: file.type,
          file: file
        });
      }
    };

    return (
      <div className="space-y-4">
        <div className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${isDarkMode ? 'border-gray-600 hover:border-blue-500' : 'border-gray-300 hover:border-blue-400'}`}>
          <div className={`text-sm mb-4 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
            Click to upload or drag and drop
          </div>
          <Input
            type="file"
            onChange={handleFileChange}
            className={`w-full max-w-xs mx-auto cursor-pointer ${isDarkMode ? 'bg-gray-700 text-gray-100' : ''}`}
            accept={question.accepted_file_types || "*"}
          />
        </div>
        
        {localAnswer && localAnswer.fileName && (
          <div className={`border rounded-lg p-4 ${isDarkMode ? 'bg-green-900 border-green-700' : 'bg-green-50 border-green-200'}`}>
            <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
                <CheckCircle className={`h-5 w-5 ${isDarkMode ? 'text-green-400' : 'text-green-600'}`} />
                <div>
                  <div className={`text-sm font-medium ${isDarkMode ? 'text-green-200' : 'text-green-900'}`}>
                    {localAnswer.fileName}
                  </div>
                  <div className={`text-xs ${isDarkMode ? 'text-green-300' : 'text-green-700'}`}>
                    {(localAnswer.fileSize / 1024).toFixed(1)} KB
                  </div>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleAnswerChange(null)}
                className={isDarkMode ? 'text-gray-300 hover:bg-gray-700' : ''}
              >
                Remove
              </Button>
            </div>
          </div>
        )}
      </div>
    );
  }, [localAnswer, question.accepted_file_types, handleAnswerChange, isDarkMode]);

  // Get question content based on type
  const questionContent = useMemo(() => {
    switch (questionData.type) {
      case 'multiple_choice':
      case 'single_choice':
        return renderMultipleChoice;
      case 'true_false':
        return renderTrueFalse;
      case 'checkbox':
      case 'multiple_select':
        return renderCheckbox;
      case 'short_answer':
        return renderShortAnswer;
      case 'essay':
        return renderEssay;
      case 'fill_blanks':
        return renderFillBlanks;
      case 'file_upload':
        return renderFileUpload;
      default:
        return (
          <div className={`text-sm p-4 rounded-lg ${isDarkMode ? 'text-gray-300 bg-gray-700' : 'text-gray-600 bg-gray-50'}`}>
            Unsupported question type: {questionData.type}
          </div>
        );
    }
  }, [questionData.type, renderMultipleChoice, renderCheckbox, renderTrueFalse, 
      renderShortAnswer, renderEssay, renderFillBlanks, renderFileUpload]);

  return (
    <div className="space-y-6 pl-6 pt-6">
      {/* Question Header */}
      <div className="pb-4">
        <h2 className={`text-2xl font-bold mb-3 leading-tight ${isDarkMode ? 'text-gray-100' : 'text-gray-900'}`}>
          {questionData.text}
        </h2>
        <div className="flex items-center gap-2 flex-wrap">
          <Badge variant="outline" className={`text-xs font-medium ${isDarkMode ? 'border-gray-600 text-gray-300' : ''}`}>
            {questionData.points} {questionData.points === 1 ? 'point' : 'points'}
                </Badge>
          </div>
        </div>
        
      {/* Options/Response Content */}
      <div className="space-y-2">
        {questionContent}
      </div>

      {/* Answer Status - Auto-saved */}
      <div className={`flex items-center pt-4 border-t ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
        <div className="flex items-center space-x-2">
          {hasAnswer ? (
            <div className={`flex items-center space-x-2 ${isDarkMode ? 'text-green-400' : 'text-green-600'}`}>
              <CheckCircle className="h-4 w-4" />
              <span className="text-sm font-medium">Answered (Auto-saved)</span>
            </div>
          ) : (
            <div className={`flex items-center space-x-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              <AlertTriangle className="h-4 w-4" />
              <span className="text-sm">Not answered</span>
            </div>
          )}
        </div>
          </div>
    </div>
  );
});

QuestionRenderer.displayName = 'QuestionRenderer';

export default QuestionRenderer;
