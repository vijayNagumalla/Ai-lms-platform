import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import { Checkbox } from '../components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '../components/ui/radio-group';
import { Label } from '../components/ui/label';
import { Badge } from '../components/ui/badge';
import { 
  Code, 
  FileText, 
  CheckSquare, 
  Square, 
  Type,
  Hash
} from 'lucide-react';
import { toast } from 'react-hot-toast';

const QuestionRenderer = ({ question, answer, onAnswerChange, onSave }) => {
  const [localAnswer, setLocalAnswer] = useState(answer || '');
  const [isDirty, setIsDirty] = useState(false);

  useEffect(() => {
    setLocalAnswer(answer || '');
    setIsDirty(false);
  }, [answer, question?.id]);

  const handleAnswerChange = useCallback((newAnswer) => {
    // Validate answer format based on question type
    if (question && question.question_type) {
      const questionType = question.question_type;
      
      // Basic validation per question type
      if (questionType === 'multiple_choice' || questionType === 'single_choice') {
        if (newAnswer && typeof newAnswer === 'object' && newAnswer.selected_options) {
          if (!Array.isArray(newAnswer.selected_options)) {
            console.warn('Invalid answer format for multiple choice');
            return;
          }
        }
      } else if (questionType === 'true_false') {
        if (newAnswer && typeof newAnswer !== 'string' && typeof newAnswer !== 'boolean') {
          console.warn('Invalid answer format for true/false');
          return;
        }
      } else if (questionType === 'essay' || questionType === 'short_answer') {
        if (newAnswer && typeof newAnswer === 'object' && newAnswer.student_answer) {
          if (typeof newAnswer.student_answer !== 'string') {
            console.warn('Invalid answer format for text question');
            return;
          }
        }
      }
    }
    
    setLocalAnswer(newAnswer);
    setIsDirty(true);
    if (onAnswerChange) {
      onAnswerChange(newAnswer);
    }
  }, [question, onAnswerChange]);

  const handleSave = () => {
    if (onSave) {
      onSave();
    }
    setIsDirty(false);
    toast.success('Answer saved');
  };

  const getQuestionIcon = (question_type) => {
    const icons = {
      multiple_choice: CheckSquare,
      true_false: Square,
      short_answer: Type,
      essay: FileText,
      fill_blank: Hash,
      coding: Code
    };
    return icons[question_type] || FileText;
  };

  const renderMultipleChoice = () => {
    const Icon = getQuestionIcon('multiple_choice');
    const options = question.options || [];
    const selectedOptions = localAnswer?.selected_options || [];

    // Debug logging
    console.log('MCQ Question Data:', {
      question: question,
      options: options,
      optionsType: typeof options,
      optionsLength: Array.isArray(options) ? options.length : 'Not an array'
    });

    return (
      <div className="space-y-3">
        <div className="flex items-center gap-2 mb-4">
          <Icon className="h-5 w-5 text-blue-600" />
          <span className="text-sm font-medium text-gray-600">Multiple Choice</span>
          <Badge variant="outline">{question.points} points</Badge>
        </div>
        
        <div className="space-y-3">
          {options.length === 0 ? (
            <div className="text-center text-gray-500 py-4">
              No options available for this question
            </div>
          ) : (
            options.map((option, index) => {
              // Handle different option structures
              const optionId = option.id || option.option_id || index;
              const optionText = option.text || option.option_text || option.content || option;
              const isChecked = selectedOptions.includes(optionId);
              
              return (
                <div key={index} className="flex items-center space-x-3">
                  <Checkbox
                    id={`option-${index}`}
                    checked={isChecked}
                    onCheckedChange={(checked) => {
                      let newSelectedOptions;
                      if (checked) {
                        newSelectedOptions = [...selectedOptions, optionId];
                      } else {
                        newSelectedOptions = selectedOptions.filter(id => id !== optionId);
                      }
                      handleAnswerChange({
                        ...localAnswer,
                        selected_options: newSelectedOptions
                      });
                    }}
                  />
                  <Label 
                    htmlFor={`option-${index}`}
                    className="flex-1 cursor-pointer"
                  >
                    {optionText}
                  </Label>
                </div>
              );
            })
          )}
        </div>
      </div>
    );
  };

  const renderTrueFalse = () => {
    const Icon = getQuestionIcon('true_false');
    const selectedValue = localAnswer?.student_answer;

    return (
      <div className="space-y-3">
        <div className="flex items-center gap-2 mb-4">
          <Icon className="h-5 w-5 text-blue-600" />
          <span className="text-sm font-medium text-gray-600">True/False</span>
          <Badge variant="outline">{question.points} points</Badge>
        </div>
        
        <RadioGroup
          value={selectedValue}
          onValueChange={(value) => handleAnswerChange({
            ...localAnswer,
            student_answer: value
          })}
        >
          <div className="flex items-center space-x-3">
            <RadioGroupItem value="true" id="true" />
            <Label htmlFor="true" className="cursor-pointer">True</Label>
          </div>
          <div className="flex items-center space-x-3">
            <RadioGroupItem value="false" id="false" />
            <Label htmlFor="false" className="cursor-pointer">False</Label>
          </div>
        </RadioGroup>
      </div>
    );
  };

  const renderShortAnswer = () => {
    const Icon = getQuestionIcon('short_answer');
    const value = localAnswer?.student_answer || '';

    return (
      <div className="space-y-3">
        <div className="flex items-center gap-2 mb-4">
          <Icon className="h-5 w-5 text-blue-600" />
          <span className="text-sm font-medium text-gray-600">Short Answer</span>
          <Badge variant="outline">{question.points} points</Badge>
        </div>
        
        <Input
          value={value}
          onChange={(e) => handleAnswerChange({
            ...localAnswer,
            student_answer: e.target.value
          })}
          placeholder="Enter your answer here..."
          className="w-full"
        />
      </div>
    );
  };

  const renderEssay = () => {
    const Icon = getQuestionIcon('essay');
    const value = localAnswer?.student_answer || '';
    const wordCount = value.split(' ').filter(word => word.length > 0).length;
    const charCount = value.length;
    
    // Get limits from question metadata or use defaults
    const maxWords = question.metadata?.max_words || question.max_words || null;
    const maxChars = question.metadata?.max_characters || question.max_characters || null;
    const minWords = question.metadata?.min_words || question.min_words || 0;

    return (
      <div className="space-y-3" role="group" aria-label="Essay question">
        <div className="flex items-center gap-2 mb-4">
          <Icon className="h-5 w-5 text-blue-600" aria-hidden="true" />
          <span className="text-sm font-medium text-gray-600">Essay Question</span>
          <Badge variant="outline">{question.points} points</Badge>
        </div>
        
        <Textarea
          value={value}
          onChange={(e) => {
            const newValue = e.target.value;
            // Enforce character limit if specified
            if (maxChars && newValue.length > maxChars) {
              return; // Don't allow typing beyond limit
            }
            handleAnswerChange({
              ...localAnswer,
              student_answer: newValue
            });
          }}
          placeholder="Write your essay here..."
          className="w-full min-h-[200px]"
          rows={8}
          maxLength={maxChars || undefined}
          aria-label="Essay answer input"
          aria-describedby="essay-helper-text"
        />
        
        <div 
          id="essay-helper-text"
          className="text-sm flex items-center gap-4"
          role="status"
          aria-live="polite"
        >
          <span className={wordCount > (maxWords || Infinity) ? 'text-red-600 font-semibold' : 'text-gray-500'}>
            Words: {wordCount}
            {maxWords && ` / ${maxWords} max`}
            {minWords > 0 && ` (${minWords} min required)`}
          </span>
          {maxChars && (
            <span className={charCount > maxChars ? 'text-red-600 font-semibold' : 'text-gray-500'}>
              Characters: {charCount} / {maxChars} max
            </span>
          )}
        </div>
      </div>
    );
  };

  const renderFillBlank = () => {
    const Icon = getQuestionIcon('fill_blank');
    const value = localAnswer?.student_answer || '';

    return (
      <div className="space-y-3">
        <div className="flex items-center gap-2 mb-4">
          <Icon className="h-5 w-5 text-blue-600" />
          <span className="text-sm font-medium text-gray-600">Fill in the Blank</span>
          <Badge variant="outline">{question.points} points</Badge>
        </div>
        
        <Input
          value={value}
          onChange={(e) => handleAnswerChange({
            ...localAnswer,
            student_answer: e.target.value
          })}
          placeholder="Enter your answer here..."
          className="w-full"
        />
      </div>
    );
  };

  const renderCoding = () => {
    const Icon = getQuestionIcon('coding');
    const value = localAnswer?.student_answer || '';

    return (
      <div className="space-y-3">
        <div className="flex items-center gap-2 mb-4">
          <Icon className="h-5 w-5 text-blue-600" />
          <span className="text-sm font-medium text-gray-600">Coding Question</span>
          <Badge variant="outline">{question.points} points</Badge>
        </div>
        
        <div className="border rounded-lg">
          <div className="bg-gray-50 px-4 py-2 border-b">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">
                {question.language || 'Code'}
              </span>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    // Implement code execution
                    toast.info('Code execution feature coming soon');
                  }}
                >
                  Run Code
                </Button>
              </div>
            </div>
          </div>
          
          <textarea
            value={value}
            onChange={(e) => handleAnswerChange({
              ...localAnswer,
              student_answer: e.target.value
            })}
            placeholder="Write your code here..."
            className="w-full h-64 p-4 font-mono text-sm border-0 resize-none focus:outline-none"
            style={{ fontFamily: 'Monaco, Consolas, "Courier New", monospace' }}
          />
        </div>
        
        {question.test_cases && question.test_cases.length > 0 && (
          <div className="mt-4">
            <h4 className="text-sm font-medium text-gray-700 mb-2">Test Cases:</h4>
            <div className="space-y-2">
              {question.test_cases.map((testCase, index) => (
                <div key={index} className="bg-gray-50 p-3 rounded text-sm">
                  <div className="font-medium">Test Case {index + 1}:</div>
                  <div className="text-gray-600">Input: {testCase.input}</div>
                  <div className="text-gray-600">Expected Output: {testCase.expected_output}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderQuestion = () => {
    switch (question.question_type) {
      case 'multiple_choice':
        return renderMultipleChoice();
      case 'true_false':
        return renderTrueFalse();
      case 'short_answer':
        return renderShortAnswer();
      case 'essay':
        return renderEssay();
      case 'fill_blank':
        return renderFillBlank();
      case 'coding':
        return renderCoding();
      default:
        return (
          <div className="text-center text-gray-500 py-8">
            Unsupported question type: {question.question_type}
          </div>
        );
    }
  };

  if (!question) {
    return (
      <div className="text-center text-gray-500 py-8">
        No question available
      </div>
    );
  }

  return (
    <Card>
      <CardContent className="p-6">
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            {question.question_text}
          </h3>
          
          {question.explanation && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
              <h4 className="text-sm font-medium text-blue-800 mb-2">Instructions:</h4>
              <p className="text-sm text-blue-700">{question.explanation}</p>
            </div>
          )}
        </div>

        {renderQuestion()}

        {isDirty && (
          <div className="mt-6 flex items-center justify-between">
            <div className="text-sm text-orange-600">
              You have unsaved changes
            </div>
            <Button
              onClick={handleSave}
              size="sm"
              className="bg-blue-600 hover:bg-blue-700"
            >
              Save Answer
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default QuestionRenderer;