import React, { useState, useRef } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import CodeEditor from '@/components/ui/code-editor';
import TestCaseManager from '@/components/ui/test-case-manager';
import { 
  CheckCircle, 
  Clock, 
  Code, 
  FileText, 
  Hash,
  Target,
  AlertCircle
} from 'lucide-react';

const QuestionRenderer = ({ 
  question, 
  answer, 
  onAnswerChange, 
  isReadOnly = false,
  showCorrectAnswer = false 
}) => {
  const [selectedLanguage, setSelectedLanguage] = useState('javascript');
  const [testResults, setTestResults] = useState(null);
  const [isRunningTests, setIsRunningTests] = useState(false);

  const getQuestionTypeIcon = (type) => {
    switch (type) {
      case 'multiple_choice':
      case 'single_choice':
        return <CheckCircle className="h-5 w-5" />;
      case 'true_false':
        return <CheckCircle className="h-5 w-5" />;
      case 'short_answer':
        return <FileText className="h-5 w-5" />;
      case 'essay':
        return <FileText className="h-5 w-5" />;
      case 'coding':
        return <Code className="h-5 w-5" />;
      case 'fill_blanks':
        return <Hash className="h-5 w-5" />;
      default:
        return <Target className="h-5 w-5" />;
    }
  };

  const getQuestionTypeLabel = (type) => {
    switch (type) {
      case 'multiple_choice':
        return 'Multiple Choice';
      case 'single_choice':
        return 'Single Choice';
      case 'true_false':
        return 'True/False';
      case 'short_answer':
        return 'Short Answer';
      case 'essay':
        return 'Essay';
      case 'coding':
        return 'Coding';
      case 'fill_blanks':
        return 'Fill in the Blanks';
      default:
        return type;
    }
  };

  const renderMultipleChoice = () => {
    const options = question.options || [];
    const isMultiple = question.question_type === 'multiple_choice';
    
    if (isMultiple) {
      const selectedAnswers = answer || [];
      
      return (
        <div className="space-y-3">
          {options.map((option, index) => (
            <div key={index} className="flex items-center space-x-3">
              <Checkbox
                id={`option-${index}`}
                checked={selectedAnswers.includes(option)}
                onCheckedChange={(checked) => {
                  if (checked) {
                    onAnswerChange([...selectedAnswers, option]);
                  } else {
                    onAnswerChange(selectedAnswers.filter(a => a !== option));
                  }
                }}
                disabled={isReadOnly}
              />
              <Label htmlFor={`option-${index}`} className="flex-1 cursor-pointer">
                {option}
              </Label>
              {showCorrectAnswer && question.correct_answers?.includes(option) && (
                <CheckCircle className="h-4 w-4 text-green-600" />
              )}
            </div>
          ))}
        </div>
      );
    } else {
      return (
        <RadioGroup
          value={answer || ''}
          onValueChange={onAnswerChange}
          disabled={isReadOnly}
        >
          {options.map((option, index) => (
            <div key={index} className="flex items-center space-x-3">
              <RadioGroupItem value={option} id={`option-${index}`} />
              <Label htmlFor={`option-${index}`} className="flex-1 cursor-pointer">
                {option}
              </Label>
              {showCorrectAnswer && question.correct_answer === option && (
                <CheckCircle className="h-4 w-4 text-green-600" />
              )}
            </div>
          ))}
        </RadioGroup>
      );
    }
  };

  const renderTrueFalse = () => {
    const options = ['True', 'False'];
    
    return (
      <RadioGroup
        value={answer || ''}
        onValueChange={onAnswerChange}
        disabled={isReadOnly}
      >
        {options.map((option, index) => (
          <div key={index} className="flex items-center space-x-3">
            <RadioGroupItem value={option} id={`tf-${index}`} />
            <Label htmlFor={`tf-${index}`} className="flex-1 cursor-pointer">
              {option}
            </Label>
            {showCorrectAnswer && question.correct_answer === option && (
              <CheckCircle className="h-4 w-4 text-green-600" />
            )}
          </div>
        ))}
      </RadioGroup>
    );
  };

  const renderShortAnswer = () => {
    return (
      <div className="space-y-2">
        <Textarea
          value={answer || ''}
          onChange={(e) => onAnswerChange(e.target.value)}
          placeholder="Enter your answer..."
          className="min-h-[100px]"
          disabled={isReadOnly}
        />
        <div className="text-sm text-muted-foreground">
          {answer?.length || 0} characters
        </div>
        {showCorrectAnswer && question.correct_answers && (
          <div className="mt-2 p-3 bg-green-50 rounded-lg">
            <div className="text-sm font-medium text-green-800">Acceptable answers:</div>
            <ul className="text-sm text-green-700 mt-1">
              {question.correct_answers.map((ans, index) => (
                <li key={index}>• {ans}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    );
  };

  const renderEssay = () => {
    return (
      <div className="space-y-2">
        <Textarea
          value={answer || ''}
          onChange={(e) => onAnswerChange(e.target.value)}
          placeholder="Write your essay answer..."
          className="min-h-[200px]"
          disabled={isReadOnly}
        />
        <div className="text-sm text-muted-foreground">
          {answer?.length || 0} characters
        </div>
        {showCorrectAnswer && question.metadata?.rubric && (
          <div className="mt-2 p-3 bg-blue-50 rounded-lg">
            <div className="text-sm font-medium text-blue-800">Rubric/Guidelines:</div>
            <div className="text-sm text-blue-700 mt-1 whitespace-pre-wrap">
              {question.metadata.rubric}
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderCoding = () => {
    const codingDetails = question.metadata || question.coding_details || {};
    const languages = codingDetails.languages || ['javascript'];
    const starterCodes = codingDetails.starter_codes || {};
    const solutionCodes = codingDetails.solution_codes || {};
    const testCases = codingDetails.test_cases || [];

    return (
      <div className="space-y-4">
        {/* Language Selector */}
        {languages.length > 1 && (
          <div className="flex items-center space-x-2">
            <Label>Language:</Label>
            <select
              value={selectedLanguage}
              onChange={(e) => setSelectedLanguage(e.target.value)}
              className="border rounded px-2 py-1"
              disabled={isReadOnly}
            >
              {languages.map(lang => (
                <option key={lang} value={lang}>{lang}</option>
              ))}
            </select>
          </div>
        )}

        {/* Code Editor */}
        <div className="space-y-2">
          <Label>Your Code:</Label>
          <CodeEditor
            value={answer || starterCodes[selectedLanguage] || ''}
            onChange={onAnswerChange}
            language={selectedLanguage}
            readOnly={isReadOnly}
            className="min-h-[300px]"
          />
        </div>

        {/* Test Cases */}
        {testCases.length > 0 && (
          <div className="space-y-2">
            <Label>Test Cases:</Label>
            <TestCaseManager
              testCases={testCases}
              onRunTests={async (code) => {
                setIsRunningTests(true);
                try {
                  // This would integrate with your coding service
                  const results = await runCodeTests(code, testCases, selectedLanguage);
                  setTestResults(results);
                } catch (error) {
                  console.error('Test execution error:', error);
                } finally {
                  setIsRunningTests(false);
                }
              }}
              isRunning={isRunningTests}
              results={testResults}
              showResults={showCorrectAnswer}
            />
          </div>
        )}

        {/* Solution Code (only shown when reviewing) */}
        {showCorrectAnswer && solutionCodes[selectedLanguage] && (
          <div className="space-y-2">
            <Label>Solution Code:</Label>
            <CodeEditor
              value={solutionCodes[selectedLanguage]}
              readOnly={true}
              language={selectedLanguage}
              className="min-h-[200px] bg-gray-50"
            />
          </div>
        )}
      </div>
    );
  };

  const renderFillBlanks = () => {
    const content = question.content || '';
    const blanks = question.correct_answers || [];
    
    // Replace blank placeholders with input fields
    const renderContent = () => {
      const parts = content.split(/(\[\[blank\d+\]\])/);
      return parts.map((part, index) => {
        const blankMatch = part.match(/\[\[blank(\d+)\]\]/);
        if (blankMatch) {
          const blankIndex = parseInt(blankMatch[1]) - 1;
          const currentAnswers = answer || [];
          
          return (
            <input
              key={index}
              type="text"
              value={currentAnswers[blankIndex] || ''}
              onChange={(e) => {
                const newAnswers = [...(answer || [])];
                newAnswers[blankIndex] = e.target.value;
                onAnswerChange(newAnswers);
              }}
              className="border-b-2 border-blue-500 px-2 py-1 mx-1 w-32 text-center"
              placeholder={`Blank ${blankIndex + 1}`}
              disabled={isReadOnly}
            />
          );
        }
        return <span key={index}>{part}</span>;
      });
    };

    return (
      <div className="space-y-4">
        <div className="text-lg leading-relaxed">
          {renderContent()}
        </div>
        
        {showCorrectAnswer && blanks.length > 0 && (
          <div className="mt-2 p-3 bg-green-50 rounded-lg">
            <div className="text-sm font-medium text-green-800">Correct answers:</div>
            <ul className="text-sm text-green-700 mt-1">
              {blanks.map((blank, index) => (
                <li key={index}>Blank {index + 1}: {blank}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    );
  };

  const renderQuestionContent = () => {
    switch (question.question_type) {
      case 'multiple_choice':
      case 'single_choice':
        return renderMultipleChoice();
      case 'true_false':
        return renderTrueFalse();
      case 'short_answer':
        return renderShortAnswer();
      case 'essay':
        return renderEssay();
      case 'coding':
        return renderCoding();
      case 'fill_blanks':
        return renderFillBlanks();
      default:
        return (
          <div className="text-red-600">
            <AlertCircle className="h-5 w-5 inline mr-2" />
            Unsupported question type: {question.question_type}
          </div>
        );
    }
  };

  // Mock function for running code tests
  const runCodeTests = async (code, testCases, language) => {
    // This would integrate with your actual coding service
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          passed: testCases.length,
          total: testCases.length,
          results: testCases.map((testCase, index) => ({
            testCase: index + 1,
            passed: Math.random() > 0.3, // Mock result
            output: `Test case ${index + 1} result`,
            expected: testCase.expected_output,
            actual: `Output ${index + 1}`
          }))
        });
      }, 1000);
    });
  };

  return (
    <Card>
      <CardContent className="p-6">
        <div className="space-y-6">
          {/* Question Header */}
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-3">
              {getQuestionTypeIcon(question.question_type)}
              <div>
                <Badge variant="secondary">
                  {getQuestionTypeLabel(question.question_type)}
                </Badge>
                <div className="flex items-center space-x-2 mt-1">
                  <Clock className="h-4 w-4 text-gray-500" />
                  <span className="text-sm text-gray-600">
                    {question.time_limit_seconds ? `${question.time_limit_seconds}s` : 'No time limit'}
                  </span>
                  <Target className="h-4 w-4 text-gray-500" />
                  <span className="text-sm text-gray-600">
                    {question.points || 1} point{question.points !== 1 ? 's' : ''}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Question Text */}
          <div className="text-lg leading-relaxed">
            {question.question_text || question.content}
          </div>

          {/* Question Content */}
          {renderQuestionContent()}

          {/* Hints */}
          {question.hints && question.hints.length > 0 && (
            <div className="p-3 bg-yellow-50 rounded-lg">
              <div className="text-sm font-medium text-yellow-800">Hints:</div>
              <ul className="text-sm text-yellow-700 mt-1">
                {question.hints.map((hint, index) => (
                  <li key={index}>• {hint}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Explanation (only shown when reviewing) */}
          {showCorrectAnswer && question.explanation && (
            <div className="p-3 bg-blue-50 rounded-lg">
              <div className="text-sm font-medium text-blue-800">Explanation:</div>
              <div className="text-sm text-blue-700 mt-1">
                {question.explanation}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default QuestionRenderer; 