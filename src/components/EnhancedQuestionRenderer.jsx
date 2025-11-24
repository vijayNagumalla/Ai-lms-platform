import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  Code, 
  FileText, 
  Hash, 
  Target,
  Clock,
  Lightbulb,
  Eye,
  EyeOff,
  Play,
  RotateCcw,
  Download,
  Upload
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// Enhanced Multiple Choice Question Component
const MultipleChoiceQuestion = ({ question, answer, onAnswerChange, isReadOnly }) => {
  const [selectedAnswer, setSelectedAnswer] = useState(answer || '');

  useEffect(() => {
    if (answer !== selectedAnswer) {
      setSelectedAnswer(answer || '');
    }
  }, [answer]);

  const handleAnswerChange = (value) => {
    setSelectedAnswer(value);
    onAnswerChange(value);
  };

  return (
    <div className="space-y-4">
      <div className="space-y-3">
        {question.options?.map((option, index) => {
          const isSelected = selectedAnswer === option;
          const optionLetter = String.fromCharCode(65 + index);
          
          return (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Label
                htmlFor={`option-${index}`}
                className={`flex items-center space-x-3 p-4 rounded-lg border-2 cursor-pointer transition-all duration-200 ${
                  isSelected
                    ? 'border-blue-500 bg-blue-50 shadow-md'
                    : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                } ${isReadOnly ? 'cursor-not-allowed opacity-75' : ''}`}
              >
                <RadioGroupItem
                  value={option}
                  id={`option-${index}`}
                  checked={isSelected}
                  onCheckedChange={() => !isReadOnly && handleAnswerChange(option)}
                  disabled={isReadOnly}
                  className="h-5 w-5"
                />
                <div className="flex items-center space-x-3 flex-1">
                  <span className="font-semibold text-gray-600 w-6">{optionLetter}.</span>
                  <span className="text-gray-900 flex-1">{option}</span>
                  {isSelected && (
                    <CheckCircle className="h-5 w-5 text-blue-600" />
                  )}
                </div>
              </Label>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};

// Enhanced True/False Question Component
const TrueFalseQuestion = ({ question, answer, onAnswerChange, isReadOnly }) => {
  const [selectedAnswer, setSelectedAnswer] = useState(answer || '');

  useEffect(() => {
    if (answer !== selectedAnswer) {
      setSelectedAnswer(answer || '');
    }
  }, [answer]);

  const handleAnswerChange = (value) => {
    setSelectedAnswer(value);
    onAnswerChange(value);
  };

  return (
    <div className="space-y-4">
      <RadioGroup
        value={selectedAnswer}
        onValueChange={handleAnswerChange}
        disabled={isReadOnly}
        className="space-y-3"
      >
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex items-center space-x-3 p-4 rounded-lg border-2 cursor-pointer transition-all duration-200 hover:border-gray-300 hover:bg-gray-50"
        >
          <RadioGroupItem value="true" id="true" className="h-5 w-5" />
          <Label htmlFor="true" className="flex items-center space-x-3 flex-1 cursor-pointer">
            <CheckCircle className="h-5 w-5 text-green-600" />
            <span className="text-lg font-medium">True</span>
          </Label>
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
          className="flex items-center space-x-3 p-4 rounded-lg border-2 cursor-pointer transition-all duration-200 hover:border-gray-300 hover:bg-gray-50"
        >
          <RadioGroupItem value="false" id="false" className="h-5 w-5" />
          <Label htmlFor="false" className="flex items-center space-x-3 flex-1 cursor-pointer">
            <XCircle className="h-5 w-5 text-red-600" />
            <span className="text-lg font-medium">False</span>
          </Label>
        </motion.div>
      </RadioGroup>
    </div>
  );
};

// Enhanced Short Answer Question Component
const ShortAnswerQuestion = ({ question, answer, onAnswerChange, isReadOnly }) => {
  const [textAnswer, setTextAnswer] = useState(answer || '');

  useEffect(() => {
    if (answer !== textAnswer) {
      setTextAnswer(answer || '');
    }
  }, [answer]);

  const handleAnswerChange = (value) => {
    setTextAnswer(value);
    onAnswerChange(value);
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="short-answer" className="text-sm font-medium text-gray-700">
          Your Answer
        </Label>
        <Input
          id="short-answer"
          value={textAnswer}
          onChange={(e) => !isReadOnly && handleAnswerChange(e.target.value)}
          placeholder="Enter your answer here..."
          disabled={isReadOnly}
          className="w-full"
        />
        <p className="text-xs text-gray-500">
          {textAnswer.length} characters
        </p>
      </div>
    </div>
  );
};

// Enhanced Essay Question Component
const EssayQuestion = ({ question, answer, onAnswerChange, isReadOnly }) => {
  const [essayAnswer, setEssayAnswer] = useState(answer || '');

  useEffect(() => {
    if (answer !== essayAnswer) {
      setEssayAnswer(answer || '');
    }
  }, [answer]);

  const handleAnswerChange = (value) => {
    setEssayAnswer(value);
    onAnswerChange(value);
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="essay-answer" className="text-sm font-medium text-gray-700">
          Your Essay
        </Label>
        <Textarea
          id="essay-answer"
          value={essayAnswer}
          onChange={(e) => !isReadOnly && handleAnswerChange(e.target.value)}
          placeholder="Write your essay here..."
          disabled={isReadOnly}
          className="min-h-[200px] w-full"
        />
        <div className="flex justify-between text-xs text-gray-500">
          <span>{essayAnswer.length} characters</span>
          <span>{Math.ceil(essayAnswer.length / 5)} words</span>
        </div>
      </div>
    </div>
  );
};

// Enhanced Coding Question Component
const CodingQuestion = ({ question, answer, onAnswerChange, isReadOnly, onSave, lastSaved, isSaving }) => {
  const [code, setCode] = useState(answer?.code || '');
  const [language, setLanguage] = useState(answer?.language || 'javascript');
  const [testResults, setTestResults] = useState(answer?.testResults || []);
  const [isRunning, setIsRunning] = useState(false);
  const [showTestResults, setShowTestResults] = useState(false);
  const codeEditorRef = useRef(null);

  const languages = [
    { value: 'javascript', label: 'JavaScript', extension: '.js' },
    { value: 'python', label: 'Python', extension: '.py' },
    { value: 'java', label: 'Java', extension: '.java' },
    { value: 'cpp', label: 'C++', extension: '.cpp' },
    { value: 'c', label: 'C', extension: '.c' },
  ];

  useEffect(() => {
    if (answer?.code !== code || answer?.language !== language) {
      setCode(answer?.code || '');
      setLanguage(answer?.language || 'javascript');
      setTestResults(answer?.testResults || []);
    }
  }, [answer]);

  const handleCodeChange = (newCode) => {
    setCode(newCode);
    onAnswerChange({ code: newCode, language, testResults });
  };

  const handleLanguageChange = (newLanguage) => {
    setLanguage(newLanguage);
    onAnswerChange({ code, language: newLanguage, testResults });
  };

  const runTests = async () => {
    setIsRunning(true);
    try {
      // Simulate test execution
      await new Promise(resolve => setTimeout(resolve, 1000)); // Reduced from 2000ms
      
      // Mock test results
      const mockResults = [
        { testCase: 1, input: '5', expected: '25', actual: '25', status: 'passed' },
        { testCase: 2, input: '10', expected: '100', actual: '100', status: 'passed' },
        { testCase: 3, input: '0', expected: '0', actual: '0', status: 'passed' },
      ];
      
      setTestResults(mockResults);
      onAnswerChange({ code, language, testResults: mockResults });
    } catch (error) {
      console.error('Test execution error:', error);
    } finally {
      setIsRunning(false);
    }
  };

  const getTestStatusColor = (status) => {
    switch (status) {
      case 'passed': return 'text-green-600 bg-green-100';
      case 'failed': return 'text-red-600 bg-red-100';
      case 'error': return 'text-orange-600 bg-orange-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  return (
    <div className="space-y-4">
      {/* Language Selector */}
      <div className="flex items-center space-x-4">
        <Label htmlFor="language-select" className="text-sm font-medium text-gray-700">
          Language:
        </Label>
        <select
          id="language-select"
          value={language}
          onChange={(e) => handleLanguageChange(e.target.value)}
          disabled={isReadOnly}
          className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {languages.map((lang) => (
            <option key={lang.value} value={lang.value}>
              {lang.label}
            </option>
          ))}
        </select>
      </div>

      {/* Code Editor */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label className="text-sm font-medium text-gray-700">
            Write your code here:
          </Label>
          <div className="flex items-center space-x-2">
            {!isReadOnly && (
              <Button
                onClick={runTests}
                disabled={isRunning || !code.trim()}
                size="sm"
                variant="outline"
              >
                {isRunning ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2" />
                ) : (
                  <Play className="h-4 w-4 mr-2" />
                )}
                {isRunning ? 'Running...' : 'Run Tests'}
              </Button>
            )}
            <Button
              onClick={() => setShowTestResults(!showTestResults)}
              size="sm"
              variant="outline"
            >
              <Eye className="h-4 w-4 mr-2" />
              {showTestResults ? 'Hide' : 'Show'} Results
            </Button>
          </div>
        </div>
        
        <div className="border border-gray-300 rounded-lg overflow-hidden">
          <div className="bg-gray-100 px-4 py-2 text-sm text-gray-600 border-b">
            {languages.find(l => l.value === language)?.label} Code
          </div>
          <textarea
            ref={codeEditorRef}
            value={code}
            onChange={(e) => !isReadOnly && handleCodeChange(e.target.value)}
            disabled={isReadOnly}
            className="w-full h-64 p-4 font-mono text-sm border-0 focus:outline-none resize-none"
            placeholder="// Write your code here..."
            style={{ fontFamily: 'Monaco, Menlo, "Ubuntu Mono", monospace' }}
          />
        </div>
      </div>

      {/* Test Results */}
      <AnimatePresence>
        {showTestResults && testResults.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-3"
          >
            <div className="flex items-center space-x-2">
              <h4 className="font-medium text-gray-900">Test Results</h4>
              <Badge variant="outline">
                {testResults.filter(r => r.status === 'passed').length}/{testResults.length} passed
              </Badge>
            </div>
            
            <div className="space-y-2">
              {testResults.map((result, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className={`p-3 rounded-lg border ${getTestStatusColor(result.status)}`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium">Test Case {result.testCase}</span>
                    <span className="text-sm capitalize">{result.status}</span>
                  </div>
                  <div className="text-sm mt-1">
                    <div>Input: {result.input}</div>
                    <div>Expected: {result.expected}</div>
                    <div>Actual: {result.actual}</div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Save Status */}
      {onSave && (
        <div className="flex items-center justify-between text-sm text-gray-500">
          <div className="flex items-center space-x-2">
            {isSaving ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600" />
                <span>Saving...</span>
              </>
            ) : lastSaved ? (
              <>
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span>Saved {lastSaved.toLocaleTimeString()}</span>
              </>
            ) : (
              <span>Not saved</span>
            )}
          </div>
          <Button
            onClick={onSave}
            disabled={isSaving}
            size="sm"
            variant="outline"
          >
            <Upload className="h-4 w-4 mr-2" />
            Save
          </Button>
        </div>
      )}
    </div>
  );
};

// Main Enhanced Question Renderer Component
const EnhancedQuestionRenderer = ({ 
  question, 
  answer, 
  onAnswerChange, 
  isReadOnly = false,
  onSave,
  lastSaved,
  isSaving
}) => {
  const [showHints, setShowHints] = useState(false);
  const [showExplanation, setShowExplanation] = useState(false);

  const getQuestionTypeIcon = (type) => {
    switch (type) {
      case 'multiple_choice': return <Hash className="h-5 w-5" />;
      case 'true_false': return <CheckCircle className="h-5 w-5" />;
      case 'short_answer': return <FileText className="h-5 w-5" />;
      case 'essay': return <FileText className="h-5 w-5" />;
      case 'coding': return <Code className="h-5 w-5" />;
      default: return <FileText className="h-5 w-5" />;
    }
  };

  const getQuestionTypeColor = (type) => {
    switch (type) {
      case 'multiple_choice': return 'text-blue-600 bg-blue-100';
      case 'true_false': return 'text-green-600 bg-green-100';
      case 'short_answer': return 'text-orange-600 bg-orange-100';
      case 'essay': return 'text-purple-600 bg-purple-100';
      case 'coding': return 'text-green-600 bg-green-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const renderQuestionContent = () => {
    switch (question.question_type) {
      case 'multiple_choice':
        return (
          <MultipleChoiceQuestion
            question={question}
            answer={answer}
            onAnswerChange={onAnswerChange}
            isReadOnly={isReadOnly}
          />
        );
      case 'true_false':
        return (
          <TrueFalseQuestion
            question={question}
            answer={answer}
            onAnswerChange={onAnswerChange}
            isReadOnly={isReadOnly}
          />
        );
      case 'short_answer':
        return (
          <ShortAnswerQuestion
            question={question}
            answer={answer}
            onAnswerChange={onAnswerChange}
            isReadOnly={isReadOnly}
          />
        );
      case 'essay':
        return (
          <EssayQuestion
            question={question}
            answer={answer}
            onAnswerChange={onAnswerChange}
            isReadOnly={isReadOnly}
          />
        );
      case 'coding':
        return (
          <CodingQuestion
            question={question}
            answer={answer}
            onAnswerChange={onAnswerChange}
            isReadOnly={isReadOnly}
            onSave={onSave}
            lastSaved={lastSaved}
            isSaving={isSaving}
          />
        );
      default:
        return (
          <div className="text-center py-8">
            <AlertTriangle className="h-12 w-12 text-orange-500 mx-auto mb-4" />
            <p className="text-gray-600">Unsupported question type: {question.question_type}</p>
          </div>
        );
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      {/* Question Header */}
      <div className="space-y-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3">
            {getQuestionTypeIcon(question.question_type)}
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                Question {question.question_number || 1}
              </h3>
              <div className="flex items-center space-x-2 mt-1">
                <Badge className={getQuestionTypeColor(question.question_type)}>
                  {question.question_type?.replace('_', ' ').toUpperCase()}
                </Badge>
                <Badge variant="outline">
                  {question.points || 1} point{question.points !== 1 ? 's' : ''}
                </Badge>
                {question.difficulty_level && (
                  <Badge variant="outline">
                    {question.difficulty_level}
                  </Badge>
                )}
              </div>
            </div>
          </div>
          
          {question.time_limit_seconds && (
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <Clock className="h-4 w-4" />
              <span>{question.time_limit_seconds}s</span>
            </div>
          )}
        </div>

        {/* Question Text */}
        <div className="prose max-w-none">
          <p className="text-gray-900 text-lg leading-relaxed whitespace-pre-wrap">
            {question.question_text}
          </p>
        </div>
      </div>

      {/* Question Content */}
      <div className="space-y-4">
        {renderQuestionContent()}
      </div>

      {/* Hints */}
      {question.hints && question.hints.length > 0 && (
        <div className="space-y-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowHints(!showHints)}
            className="w-full"
          >
            <Lightbulb className="h-4 w-4 mr-2" />
            {showHints ? 'Hide' : 'Show'} Hints ({question.hints.length})
          </Button>
          
          <AnimatePresence>
            {showHints && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="space-y-2"
              >
                {question.hints.map((hint, index) => (
                  <Alert key={index} className="border-yellow-200 bg-yellow-50">
                    <Lightbulb className="h-4 w-4 text-yellow-600" />
                    <AlertDescription className="text-yellow-800">
                      <strong>Hint {index + 1}:</strong> {hint}
                    </AlertDescription>
                  </Alert>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* Explanation */}
      {question.explanation && (
        <div className="space-y-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowExplanation(!showExplanation)}
            className="w-full"
          >
            <Eye className="h-4 w-4 mr-2" />
            {showExplanation ? 'Hide' : 'Show'} Explanation
          </Button>
          
          <AnimatePresence>
            {showExplanation && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
              >
                <Alert className="border-blue-200 bg-blue-50">
                  <AlertTriangle className="h-4 w-4 text-blue-600" />
                  <AlertDescription className="text-blue-800">
                    <strong>Explanation:</strong> {question.explanation}
                  </AlertDescription>
                </Alert>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* Tags */}
      {question.tags && question.tags.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-gray-700">Tags:</h4>
          <div className="flex flex-wrap gap-2">
            {question.tags.map((tag, index) => (
              <Badge key={index} variant="outline" className="text-xs">
                {tag}
              </Badge>
            ))}
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default EnhancedQuestionRenderer;



