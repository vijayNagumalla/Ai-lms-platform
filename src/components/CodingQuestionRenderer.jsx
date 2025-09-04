import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

import CodeEditor from '@/components/ui/code-editor';
import { 
  Play, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Target,
  Code,
  TestTube,
  Terminal,
  FileText,
  AlertCircle,
  Check,
  X,
  Info,
  Lightbulb,
  Settings,
  Zap,
  Monitor,
  Download,
  Upload,
  Save,
  RotateCcw,
  ChevronDown,
  ChevronRight,
  List,
  RefreshCw,
  Loader2,
  Layout,
  Palette,
  Moon,
  Sun
} from 'lucide-react';

import apiService from '@/services/api';
import { getLanguageName, getLanguageIcon, getDefaultStarterCode } from '@/lib/language-utils';
import LanguageIcon from '@/components/ui/language-icon';

const CodingQuestionRenderer = ({ 
  question, 
  answer, 
  onAnswerChange, 
  isReadOnly = false,
  showCorrectAnswer = false,
  questions = [],
  currentQuestionIndex = 0,
  onQuestionChange = () => {},
  onSave = () => {},
  lastSaved = null,
  isSaving = false,
  clearStoredData = false
}) => {

  const [selectedLanguage, setSelectedLanguage] = useState('javascript');
  const [testResults, setTestResults] = useState(null);
  const [isRunningTests, setIsRunningTests] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [customInput, setCustomInput] = useState('');
  const [customOutput, setCustomOutput] = useState('');
  const [isRunningCustom, setIsRunningCustom] = useState(false);
  const [showTestCases, setShowTestCases] = useState(true);
  const [executionHistory, setExecutionHistory] = useState([]);
  const [isCodeRunning, setIsCodeRunning] = useState(false);
  const [supportedLanguages, setSupportedLanguages] = useState([]);
  
  // New state for modern UI
  const [isDarkTheme, setIsDarkTheme] = useState(false);
  const [batchProgress, setBatchProgress] = useState(0);
  const [isBatchRunning, setIsBatchRunning] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [fontSize, setFontSize] = useState(16);
  const [testCaseStatuses, setTestCaseStatuses] = useState([]);
  const [isCustomTestExpanded, setIsCustomTestExpanded] = useState(false);
  const [isTestVerificationExpanded, setIsTestVerificationExpanded] = useState(false);
  
  // Store test results per question
  const [questionTestResults, setQuestionTestResults] = useState(new Map());
  const [questionTestCaseStatuses, setQuestionTestCaseStatuses] = useState(new Map());
  const [questionSubmissionStatuses, setQuestionSubmissionStatuses] = useState(new Map()); // Store submission status per question
  const [submissionStatus, setSubmissionStatus] = useState(null); // 'correct', 'incorrect', null

  const codingDetails = question.metadata || question.coding_details || {};
  const languages = codingDetails.languages || ['javascript'];
  const starterCodes = codingDetails.starter_codes || {};
  const solutionCodes = codingDetails.solution_codes || {};
  
  // Try multiple possible locations for test cases
  const testCases = codingDetails.test_cases || 
                   codingDetails.testCases || 
                   question.test_cases || 
                   question.testCases || 
                   [];
  const openTestCases = testCases.filter(testCase => !testCase.hidden);
  
  // Validate that test cases have required fields
  const validTestCases = openTestCases.filter(testCase => {
    const hasInput = testCase.input !== undefined || testCase.input_data !== undefined || testCase.inputData !== undefined;
    const hasOutput = testCase.expected_output !== undefined || testCase.output !== undefined || 
                      testCase.expected_result !== undefined || testCase.expectedOutput !== undefined;
    return hasInput && hasOutput;
  });

  // Load supported languages on component mount
  useEffect(() => {
    loadSupportedLanguages();
  }, []);

  // Set initial language based on available languages
  useEffect(() => {
    if (languages.length > 0 && !languages.includes(getCurrentLanguage())) {
      setSelectedLanguage(languages[0]);
    }
  }, [languages]);

  // Load test results when question changes
  useEffect(() => {
    const questionId = question.id;
    
    // Load existing test results for this question
    const existingTestResults = questionTestResults.get(questionId);
    const existingTestCaseStatuses = questionTestCaseStatuses.get(questionId);
    const existingSubmissionStatus = questionSubmissionStatuses.get(questionId);
    
    setTestResults(existingTestResults || null);
    setTestCaseStatuses(existingTestCaseStatuses || []);
    setSubmissionStatus(existingSubmissionStatus || null);
    
    // Reset running states but preserve results
    setBatchProgress(0);
    setIsBatchRunning(false);
    setIsCodeRunning(false);
    setIsRunningCustom(false);
    setIsRunningTests(false);
    setIsSubmitting(false);
    setCustomOutput('');
    setCustomInput('');
    setExecutionHistory([]);
  }, [question.id, questionTestResults, questionTestCaseStatuses, questionSubmissionStatuses]);

  // Clear stored data when clearStoredData prop is true (for retakes)
  useEffect(() => {
    if (clearStoredData) {
      console.log('Clearing stored test results and data for retake');
      setQuestionTestResults(new Map());
      setQuestionTestCaseStatuses(new Map());
      setQuestionSubmissionStatuses(new Map());
      setTestResults(null);
      setTestCaseStatuses([]);
      setSubmissionStatus(null);
      setBatchProgress(0);
      setIsBatchRunning(false);
      setIsCodeRunning(false);
      setIsRunningCustom(false);
      setIsRunningTests(false);
      setIsSubmitting(false);
      setCustomOutput('');
      setCustomInput('');
      setExecutionHistory([]);
    }
  }, [clearStoredData]);

  const loadSupportedLanguages = async () => {
    try {
      const response = await apiService.getSupportedLanguages();
      if (response.success) {
        setSupportedLanguages(response.data);
      }
    } catch (error) {
      console.error('Failed to load supported languages:', error);
    }
  };

  const getCurrentCode = () => {
    if (answer && typeof answer === 'object' && answer.code) {
      return answer.code;
    }
    return answer || starterCodes[getCurrentLanguage()] || getDefaultStarterCode(getCurrentLanguage());
  };

  const getCurrentLanguage = () => {
    if (answer && typeof answer === 'object' && answer.language) {
      return answer.language;
    }
    return selectedLanguage;
  };

  const runCustomCode = async () => {
    if (!customInput.trim()) {
      setCustomOutput('Error: Please provide input for your code');
      return;
    }

    setIsRunningCustom(true);
    setIsCodeRunning(true);
    
    try {
      const response = await apiService.executeCode({
        sourceCode: getCurrentCode(),
        language: getCurrentLanguage(),
        input: customInput
      });

      if (response.success) {
        const output = response.data.output || 'No output';
        setCustomOutput(output);
        
        // Add to execution history
        setExecutionHistory(prev => [{
          id: Date.now(),
          timestamp: new Date(),
          input: customInput,
          output: output,
          language: getCurrentLanguage(),
          success: true
        }, ...prev.slice(0, 9)]); // Keep last 10 executions
      } else {
        setCustomOutput(`Error: ${response.message}`);
      }
    } catch (error) {
      console.error('Code execution error:', error);
      setCustomOutput('Error: Failed to execute code');
    } finally {
      setIsRunningCustom(false);
      setIsCodeRunning(false);
    }
  };

  const runBatchTestCases = async () => {
    setIsBatchRunning(true);
    setIsCodeRunning(true);
    setBatchProgress(0);
    
    // Auto-expand test verification section when running tests
    setIsTestVerificationExpanded(true);
    
    if (validTestCases.length === 0) {
      setIsBatchRunning(false);
      setIsCodeRunning(false);
      return;
    }
    
    // Initialize all test case statuses to 'running'
    const initialStatuses = validTestCases.map((_, index) => ({
      id: index,
      status: 'running',
      result: null
    }));
    setTestCaseStatuses(initialStatuses);
    
    try {
      // Run all test cases in a single API call

      const response = await apiService.runTestCases({
        sourceCode: getCurrentCode(),
        language: getCurrentLanguage(),
        testCases: validTestCases
      });

      if (response.success) {
        const questionId = question.id;
        
        // Update all test case statuses based on results
        const updatedStatuses = validTestCases.map((_, index) => {
          const testResult = response.data.results[index];
          const passed = testResult?.result?.verdict?.status === 'accepted';
          
          return {
            id: index,
            status: passed ? 'passed' : 'failed',
            result: testResult
          };
        });
        
        // Save results to question-specific storage
        setQuestionTestResults(prev => new Map(prev).set(questionId, response.data));
        setQuestionTestCaseStatuses(prev => new Map(prev).set(questionId, updatedStatuses));
        
        // Update current display
        setTestResults(response.data);
        setTestCaseStatuses(updatedStatuses);
        setBatchProgress(100);
        
        // Update the student's answer with test results for assessment submission
        const updatedAnswer = {
          ...answer,
          code: getCurrentCode(),
          language: getCurrentLanguage(),
          testResults: response.data.results,
          lastTested: new Date().toISOString()
        };
        onAnswerChange(updatedAnswer);
      } else {
        // Mark all as failed if API call fails
        const failedStatuses = validTestCases.map((_, index) => ({
          id: index,
          status: 'failed',
          result: null
        }));
        
        const questionId = question.id;
        setQuestionTestCaseStatuses(prev => new Map(prev).set(questionId, failedStatuses));
        setTestCaseStatuses(failedStatuses);
      }
    } catch (error) {
      console.error('Batch test execution error:', error);
      // Mark all as failed on error
      const errorStatuses = validTestCases.map((_, index) => ({
        id: index,
        status: 'failed',
        result: null
      }));
      
      const questionId = question.id;
      setQuestionTestCaseStatuses(prev => new Map(prev).set(questionId, errorStatuses));
      setTestCaseStatuses(errorStatuses);
    } finally {
      setIsBatchRunning(false);
      setIsCodeRunning(false);
      setBatchProgress(0);
    }
  };

  const submitCode = async () => {
    setIsSubmitting(true);
    setIsCodeRunning(true);
    setIsTestVerificationExpanded(true); // Auto-expand to show results
    
    try {
      // Run test cases for submission verification
      const response = await apiService.runTestCases({
        sourceCode: getCurrentCode(),
        language: getCurrentLanguage(),
        testCases: validTestCases
      });

      if (response.success) {
        const questionId = question.id;
        
        // Update all test case statuses based on results
        const updatedStatuses = validTestCases.map((_, index) => {
          const testResult = response.data.results[index];
          const passed = testResult?.result?.verdict?.status === 'accepted';
          
          return {
            id: index,
            status: passed ? 'passed' : 'failed',
            result: testResult
          };
        });
        
        // Save results to question-specific storage
        setQuestionTestResults(prev => new Map(prev).set(questionId, response.data));
        setQuestionTestCaseStatuses(prev => new Map(prev).set(questionId, updatedStatuses));
        
        // Update current display
        setTestResults(response.data);
        setTestCaseStatuses(updatedStatuses);
        
        // Check if all test cases passed
        const allPassed = response.data.summary.allPassed;
        
        // Set submission status
        const submissionResult = allPassed ? 'correct' : 'incorrect';
        setSubmissionStatus(submissionResult);
        
        // Save submission status to question-specific storage
        setQuestionSubmissionStatuses(prev => new Map(prev).set(questionId, submissionResult));
        
        // Update the student's answer with test results for assessment submission
        const updatedAnswer = {
          ...answer,
          code: getCurrentCode(),
          language: getCurrentLanguage(),
          testResults: response.data.results,
          submissionStatus: submissionResult,
          lastTested: new Date().toISOString()
        };
        onAnswerChange(updatedAnswer);
        
        // Show submission result
        if (allPassed) {
          // All test cases passed - submission is correct
        } else {
          // Some test cases failed - submission is incorrect
        }
        
      } else {
        // Handle API failure
        const failedStatuses = validTestCases.map((_, index) => ({
          id: index,
          status: 'failed',
          result: null
        }));
        
        const questionId = question.id;
        setQuestionTestCaseStatuses(prev => new Map(prev).set(questionId, failedStatuses));
        setTestCaseStatuses(failedStatuses);
        setSubmissionStatus('incorrect');
        
        // Save submission status to question-specific storage
        setQuestionSubmissionStatuses(prev => new Map(prev).set(questionId, 'incorrect'));
        

      }
    } catch (error) {
      console.error('Code submission error:', error);
      
      // Handle execution error
      const errorStatuses = validTestCases.map((_, index) => ({
        id: index,
        status: 'failed',
        result: null
      }));
      
      const questionId = question.id;
      setQuestionTestCaseStatuses(prev => new Map(prev).set(questionId, errorStatuses));
      setTestCaseStatuses(errorStatuses);
      setSubmissionStatus('incorrect');
      
      // Save submission status to question-specific storage
      setQuestionSubmissionStatuses(prev => new Map(prev).set(questionId, 'incorrect'));
      
      
    } finally {
      setIsSubmitting(false);
      setIsCodeRunning(false);
    }
  };

  const handleCodeChange = (code) => {
    // Update the student's answer with the new code
    const updatedAnswer = {
      ...answer,
      code: code,
      language: getCurrentLanguage(),
      lastModified: new Date().toISOString()
    };
    onAnswerChange(updatedAnswer);
  };

  const handleLanguageChange = (newLanguage) => {
    setSelectedLanguage(newLanguage);
    // If there's no answer yet, set the starter code for the new language
    if (!answer) {
      const newStarterCode = starterCodes[newLanguage] || getDefaultStarterCode(newLanguage);
      onAnswerChange({
        code: newStarterCode,
        language: newLanguage,
        lastModified: new Date().toISOString()
      });
    } else {
      // Preserve existing answer data but update language
      const updatedAnswer = {
        ...answer,
        language: newLanguage,
        lastModified: new Date().toISOString()
      };
      onAnswerChange(updatedAnswer);
    }
  };

  const resetCode = () => {
    const resetCode = starterCodes[getCurrentLanguage()] || getDefaultStarterCode(getCurrentLanguage());
    // Preserve test results when resetting code
    const updatedAnswer = {
      ...answer,
      code: resetCode,
      lastModified: new Date().toISOString()
    };
    onAnswerChange(updatedAnswer);
  };

  const clearTestResults = () => {
    const questionId = question.id;
    setQuestionTestResults(prev => {
      const newMap = new Map(prev);
      newMap.delete(questionId);
      return newMap;
    });
    setQuestionTestCaseStatuses(prev => {
      const newMap = new Map(prev);
      newMap.delete(questionId);
      return newMap;
    });
    setQuestionSubmissionStatuses(prev => {
      const newMap = new Map(prev);
      newMap.delete(questionId);
      return newMap;
    });
    setTestResults(null);
    setTestCaseStatuses([]);
    setSubmissionStatus(null);
  };

  const getTestResultIcon = (passed) => {
    return passed ? (
      <CheckCircle className="h-4 w-4 text-green-600" />
    ) : (
      <XCircle className="h-4 w-4 text-red-600" />
    );
  };

  const getTestResultColor = (passed) => {
    return passed ? 'text-green-600' : 'text-red-600';
  };

  const formatTestCaseData = (data) => {
    if (!data) return 'No data';
    if (typeof data === 'string') return data;
    if (typeof data === 'object') return JSON.stringify(data, null, 2);
    return String(data);
  };

  const getLanguageDisplayName = (lang) => {
    const langInfo = supportedLanguages.find(l => l.value === lang);
    return langInfo ? langInfo.name : getLanguageName(lang);
  };

  return (
    <div className={`${isDarkTheme ? 'dark' : ''} flex h-full w-full`}>
      {/* Sidebar for Question Navigation */}
      <div className={`${sidebarCollapsed ? 'w-16' : 'w-80'} transition-all duration-300 ${isDarkTheme ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border-r flex-shrink-0`}>
        <div className="p-4 h-full">
          <div className="flex items-center justify-between mb-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="p-2"
            >
              {sidebarCollapsed ? <ChevronRight className="h-4 w-4" /> : <List className="h-4 w-4" />}
            </Button>
            {!sidebarCollapsed && (
              <div className="flex items-center space-x-2">
                <span className="font-medium text-sm">Questions</span>
              </div>
            )}
          </div>
          
          {!sidebarCollapsed ? (
            <div className="space-y-4">
              {/* Questions List */}
              <div className="space-y-2 max-h-[400px] overflow-y-auto">
                {questions.map((q, index) => (
                  <Button
                    key={q.id}
                    variant={index === currentQuestionIndex ? "default" : "ghost"}
                    size="sm"
                    onClick={() => onQuestionChange(index)}
                    className="w-full justify-start text-left h-auto p-3"
                  >
                    <div className="flex items-start space-x-3 w-full">
                      <Badge variant={index === currentQuestionIndex ? "secondary" : "outline"} className="text-xs">
                        {index + 1}
                      </Badge>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium truncate">
                          {q.title || `Question ${index + 1}`}
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          {q.question_type === 'coding' ? 'Coding' : 'MCQ'} • {q.points || 10} pts
                        </div>
                      </div>
                    </div>
                  </Button>
                ))}
              </div>

            </div>
          ) : (
            <div className="space-y-2">
              {questions.map((q, index) => (
                <Button
                  key={q.id}
                  variant={index === currentQuestionIndex ? "default" : "ghost"}
                  size="sm"
                  onClick={() => onQuestionChange(index)}
                  className="w-full h-10 p-1 text-xs"
                >
                  {index + 1}
                </Button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden">
        <div className="h-full p-2 space-y-4 overflow-y-auto">

          {/* Problem Description with Title and Points */}
          <Card className={isDarkTheme ? 'bg-gray-800 border-gray-700' : ''}>
            <CardHeader>
              <div className="space-y-3">
                {/* Question Title and Points */}
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                    {question.title}
                  </h2>
                  <Badge variant="outline" className="text-sm">
                    {question.points || 10} points
                  </Badge>
                </div>
                
                {/* Problem Description Header */}
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">Problem Description</CardTitle>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowTestCases(!showTestCases)}
                  >
                    {showTestCases ? 'Hide' : 'Show'} Test Cases
                  </Button>
                </div>
              </div>
            </CardHeader>
              <CardContent>
                <div className="prose prose-sm max-w-none mb-6">
                  <div dangerouslySetInnerHTML={{ __html: question.question_text }} />
                </div>

                {/* Question Completion Status */}
                {submissionStatus && (
                  <div className="mt-6 mb-4">
                    <div className={`p-4 rounded-lg border-2 ${
                      submissionStatus === 'correct' 
                        ? 'bg-green-50 border-green-300 text-green-800' 
                        : 'bg-yellow-50 border-yellow-300 text-yellow-800'
                    } ${isDarkTheme ? 'bg-opacity-20' : ''}`}>
                      <div className="flex items-center space-x-3">
                        {submissionStatus === 'correct' ? (
                          <>
                            <CheckCircle className="h-6 w-6 text-green-600" />
                            <div>
                              <div className="font-bold text-lg">🎯 Question Complete!</div>
                              <div className="text-sm">All test cases have passed. You can now move to the next question.</div>
                            </div>
                          </>
                        ) : (
                          <>
                            <Target className="h-6 w-6 text-yellow-600" />
                            <div>
                              <div className="font-bold text-lg">⏳ Question In Progress</div>
                              <div className="text-sm">Some test cases are still failing. Complete all tests to mark this question as done.</div>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Constraints and Hints */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {codingDetails.constraints && (
                    <div className={`p-4 rounded-lg ${isDarkTheme ? 'bg-blue-900/20 border border-blue-700' : 'bg-blue-50 border border-blue-200'}`}>
                      <div className="flex items-center space-x-2 mb-2">
                        <Info className="h-4 w-4 text-blue-600" />
                        <h4 className="font-medium">Constraints</h4>
                      </div>
                      <div className="text-sm text-gray-600">
                        {codingDetails.constraints}
                      </div>
                    </div>
                  )}

                  {codingDetails.hints && (
                    <div className={`p-4 rounded-lg ${isDarkTheme ? 'bg-yellow-900/20 border border-yellow-700' : 'bg-yellow-50 border border-yellow-200'}`}>
                      <div className="flex items-center space-x-2 mb-2">
                        <Lightbulb className="h-4 w-4 text-yellow-600" />
                        <h4 className="font-medium">Hints</h4>
                      </div>
                      <div className="text-sm text-gray-600">
                        {codingDetails.hints}
                      </div>
                    </div>
                  )}
                </div>

                {/* Test Cases */}
                {showTestCases && (validTestCases.length > 0 || testCases.length > 0) && (
                  <div className="mt-6 space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <TestTube className="h-5 w-5 text-blue-600" />
                        <h3 className="text-lg font-semibold">Sample Test Cases</h3>
                      </div>
                      {validTestCases.length !== openTestCases.length && (
                        <Badge variant="destructive" className="text-xs">
                          {openTestCases.length - validTestCases.length} invalid cases hidden
                        </Badge>
                      )}
                    </div>
                    
                    <div className="grid gap-3">
                      {(validTestCases.length > 0 ? validTestCases : testCases).slice(0, 3).map((testCase, index) => (
                        <Card key={index} className={`border-l-4 border-l-blue-500 ${isDarkTheme ? 'bg-gray-750 border-gray-600' : ''}`}>
                          <CardContent className="pt-4">
                            <div className="flex items-center justify-between mb-3">
                              <Badge variant="outline">Test Case {index + 1}</Badge>
                              {testResults && testResults.results && testResults.results[index] && (
                                <div className="flex items-center space-x-1">
                                  {getTestResultIcon(testResults.results[index]?.result?.verdict?.status === 'accepted')}
                                  <span className={`text-sm font-medium ${getTestResultColor(testResults.results[index]?.result?.verdict?.status === 'accepted')}`}>
                                    {testResults.results[index]?.result?.verdict?.status === 'accepted' ? 'Passed' : 'Failed'}
                                  </span>
                                </div>
                              )}
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div>
                                <Label className="text-sm font-medium">Input:</Label>
                                <div className={`mt-1 p-3 rounded-md font-mono text-sm whitespace-pre-wrap ${isDarkTheme ? 'bg-gray-700' : 'bg-gray-50'}`}>
                                  {formatTestCaseData(testCase.input || testCase.input_data || testCase.inputData)}
                                </div>
                              </div>
                              <div>
                                <Label className="text-sm font-medium">Expected Output:</Label>
                                <div className={`mt-1 p-3 rounded-md font-mono text-sm whitespace-pre-wrap ${isDarkTheme ? 'bg-gray-700' : 'bg-gray-50'}`}>
                                  {formatTestCaseData(testCase.expected_output || testCase.output || testCase.expected_result || testCase.expectedOutput)}
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                      {(validTestCases.length > 3) && (
                        <div className="text-center text-sm text-gray-500">
                          +{validTestCases.length - 3} more test cases (hidden)
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Code Editor */}
            <Card className={isDarkTheme ? 'bg-gray-800 border-gray-700' : ''}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg flex items-center space-x-2">
                    <Code className="h-5 w-5" />
                    <span>Code Editor</span>
                  </CardTitle>
                  <div className="flex items-center space-x-4">
                    {/* Language Selection */}
                    <div className="flex items-center space-x-2">
                      <Label className="text-sm font-medium">Language:</Label>
                      {languages.length > 1 ? (
                        <select
                          value={getCurrentLanguage()}
                          onChange={(e) => handleLanguageChange(e.target.value)}
                          className={`px-3 py-1 border rounded-md text-sm ${isDarkTheme ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`}
                          disabled={isReadOnly}
                        >
                          {languages.map(lang => (
                            <option key={lang} value={lang}>
                              {getLanguageIcon(lang)}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <Badge variant="outline" className="flex items-center space-x-1">
                          <LanguageIcon language={getCurrentLanguage()} size="sm" showText={true} />
                        </Badge>
                      )}
                    </div>
                    
                    {/* Font Size Controls */}
                    <div className="flex items-center space-x-2">
                      <Label className="text-sm font-medium">Font:</Label>
                      <div className="flex items-center space-x-1">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setFontSize(Math.max(10, fontSize - 2))}
                          disabled={isReadOnly || fontSize <= 10}
                          className="p-1 h-7 w-7"
                        >
                          <span className="text-xs">A-</span>
                        </Button>
                        <span className="text-xs font-medium w-8 text-center">{fontSize}</span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setFontSize(Math.min(24, fontSize + 2))}
                          disabled={isReadOnly || fontSize >= 24}
                          className="p-1 h-7 w-7"
                        >
                          <span className="text-xs">A+</span>
                        </Button>
                      </div>
                    </div>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={resetCode}
                      disabled={isReadOnly}
                    >
                      <RotateCcw className="h-4 w-4 mr-2" />
                      Reset
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <CodeEditor
                  value={getCurrentCode()}
                  onChange={handleCodeChange}
                  language={getCurrentLanguage()}
                  readOnly={isReadOnly}
                  height="600px"
                  options={{
                    fontSize: fontSize,
                    minimap: { enabled: fontSize >= 14 },
                    wordWrap: 'on',
                    lineNumbers: 'on',
                    automaticLayout: true,
                    theme: isDarkTheme ? 'vs-dark' : 'vs-light',
                    scrollBeyondLastLine: false,
                    renderWhitespace: 'selection',
                    bracketPairColorization: { enabled: true }
                  }}
                />
              </CardContent>
            </Card>

            {/* Custom Test Cases */}
            <Card className={isDarkTheme ? 'bg-gray-800 border-gray-700' : ''}>
              <Collapsible open={isCustomTestExpanded} onOpenChange={setIsCustomTestExpanded}>
                <CollapsibleTrigger asChild>
                  <CardHeader className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                    <CardTitle className="text-lg flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Terminal className="h-5 w-5" />
                        <span>Custom Test Cases</span>
                      </div>
                      <div className="flex items-center">
                        {isCustomTestExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                      </div>
                    </CardTitle>
                  </CardHeader>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <CardContent>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="custom-input" className="text-sm font-medium">Input:</Label>
                      <textarea
                        id="custom-input"
                        value={customInput}
                        onChange={(e) => setCustomInput(e.target.value)}
                        placeholder="Enter your test input here..."
                        className={`mt-1 w-full p-3 border rounded-md font-mono text-sm ${isDarkTheme ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`}
                        rows={8}
                        disabled={isReadOnly || isCodeRunning}
                      />
                    </div>
                    
                    <Button
                      onClick={runCustomCode}
                      disabled={isRunningCustom || isReadOnly || isCodeRunning || !customInput.trim()}
                      size="sm"
                      className="w-full"
                    >
                      {isRunningCustom ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <Play className="h-4 w-4 mr-2" />
                      )}
                      Run Custom Test
                    </Button>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <Label className="text-sm font-medium">Output:</Label>
                      <div className={`mt-1 p-3 border rounded-md font-mono text-sm min-h-[200px] max-h-[300px] overflow-y-auto ${isDarkTheme ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-300'}`}>
                        {isRunningCustom ? (
                          <div className="flex items-center space-x-2 text-blue-500">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            <span>Executing code...</span>
                          </div>
                        ) : (
                          customOutput || 'Output will appear here after running your code'
                        )}
                      </div>
                    </div>
                    
                    {executionHistory.length > 0 && (
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <Label className="text-sm font-medium">Recent Executions</Label>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setExecutionHistory([])}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                        <div className="space-y-1 max-h-32 overflow-y-auto">
                          {executionHistory.slice(0, 3).map((exec) => (
                            <div key={exec.id} className={`text-xs p-2 rounded ${isDarkTheme ? 'bg-gray-700' : 'bg-gray-100'}`}>
                              <div className="flex items-center justify-between">
                                <span>{exec.timestamp.toLocaleTimeString()}</span>
                                {exec.success ? (
                                  <Check className="h-3 w-3 text-green-500" />
                                ) : (
                                  <X className="h-3 w-3 text-red-500" />
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                  </CardContent>
                </CollapsibleContent>
              </Collapsible>
            </Card>

            {/* Batch Test Verification */}
            <Card className={isDarkTheme ? 'bg-gray-800 border-gray-700' : ''}>
              <Collapsible open={isTestVerificationExpanded} onOpenChange={setIsTestVerificationExpanded}>
                <CollapsibleTrigger asChild>
                  <CardHeader className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <TestTube className="h-5 w-5" />
                        <span className="text-lg font-semibold">Test Verification</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button
                          onClick={(e) => {
                            e.stopPropagation();
                            runBatchTestCases();
                          }}
                          disabled={isBatchRunning || isReadOnly || isCodeRunning}
                          size="sm"
                        >
                          {isBatchRunning ? (
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          ) : (
                            <CheckCircle className="h-4 w-4 mr-2" />
                          )}
                          Run Tests
                        </Button>
                        {testResults && (
                          <Button
                            onClick={(e) => {
                              e.stopPropagation();
                              clearTestResults();
                            }}
                            variant="outline"
                            size="sm"
                          >
                            <RotateCcw className="h-4 w-4 mr-2" />
                            Clear
                          </Button>
                        )}
                        {isTestVerificationExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                      </div>
                    </div>
                  </CardHeader>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <CardContent>
                {/* Test Cases List with Compact Status */}
                {validTestCases.length > 0 && (
                  <div className="space-y-2">
                    {validTestCases.map((testCase, index) => {
                      const status = testCaseStatuses.find(s => s.id === index);
                      const hasError = status?.status === 'failed' || status?.result?.verdict?.status === 'failed' || status?.result?.verdict?.status === 'error' || status?.result?.error;
                      
                      return (
                        <div key={index}>
                          {/* Compact Status Display */}
                          <div className={`p-3 border rounded-lg transition-colors ${
                            status?.status === 'passed' ? 'border-green-300 bg-green-50' :
                            status?.status === 'failed' ? 'border-red-300 bg-red-50' :
                            status?.status === 'running' ? 'border-blue-300 bg-blue-50' :
                            'border-gray-300 bg-gray-50'
                          } ${isDarkTheme ? 'bg-opacity-10' : ''}`}>
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-3">
                                <Badge variant="outline" className="text-sm">
                                  Test Case {index + 1}
                                </Badge>
                                
                                {/* Status Icon */}
                                <div className="flex items-center space-x-1">
                                  {status?.status === 'running' && (
                                    <>
                                      <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                                      <span className="text-sm font-medium text-blue-600">Running...</span>
                                    </>
                                  )}
                                  {status?.status === 'passed' && (
                                    <>
                                      <CheckCircle className="h-4 w-4 text-green-600" />
                                      <span className="text-sm font-medium text-green-600">Passed</span>
                                    </>
                                  )}
                                  {status?.status === 'failed' && (
                                    <>
                                      <XCircle className="h-4 w-4 text-red-600" />
                                      <span className="text-sm font-medium text-red-600">Failed</span>
                                    </>
                                  )}
                                  {!status && (
                                    <span className="text-sm text-gray-500">Not Run</span>
                                  )}
                                </div>
                              </div>
                              
                              {hasError && (
                                <Badge variant="secondary" className="text-xs">
                                  Error Details Below
                                </Badge>
                              )}
                            </div>
                          </div>
                          
                          {/* Error Details (only shown for failed tests) */}
                          {hasError && (
                            <div className="mt-2 p-4 border border-red-200 rounded-lg bg-red-50 dark:bg-red-900/20">
                              <div className="space-y-3">
                                <div className="flex items-center space-x-2 mb-3">
                                  <AlertCircle className="h-4 w-4 text-red-600" />
                                  <span className="text-sm font-medium text-red-700">Test Case Failed</span>
                                </div>
                                
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                  <div>
                                    <Label className="font-medium text-red-700">Input:</Label>
                                    <div className={`mt-1 p-2 rounded font-mono text-xs ${isDarkTheme ? 'bg-gray-700' : 'bg-white'} border`}>
                                      {formatTestCaseData(testCase.input || testCase.input_data || testCase.inputData)}
                                    </div>
                                  </div>
                                  <div>
                                    <Label className="font-medium text-red-700">Expected Output:</Label>
                                    <div className={`mt-1 p-2 rounded font-mono text-xs ${isDarkTheme ? 'bg-gray-700' : 'bg-white'} border`}>
                                      {formatTestCaseData(testCase.expected_output || testCase.output || testCase.expected_result || testCase.expectedOutput)}
                                    </div>
                                  </div>
                                </div>
                                
                                {/* Actual Output (if available) */}
                                {status?.result?.result?.output && (
                                  <div>
                                    <Label className="font-medium text-red-700">Your Output:</Label>
                                    <div className={`mt-1 p-2 rounded font-mono text-xs ${isDarkTheme ? 'bg-gray-700' : 'bg-white'} border`}>
                                      {formatTestCaseData(status.result.result.output)}
                                    </div>
                                  </div>
                                )}
                                
                                {/* Error Message (if available) */}
                                {status?.result?.error && (
                                  <div>
                                    <Label className="font-medium text-red-700">Error:</Label>
                                    <div className="mt-1 p-2 rounded bg-red-100 dark:bg-red-800/30 border border-red-200 text-xs text-red-800 dark:text-red-200">
                                      {status.result.error}
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Submission Status */}
                {submissionStatus && (
                  <div className="mt-4 p-4 border rounded-lg">
                    <div className={`flex items-center space-x-3 p-4 rounded-lg ${
                      submissionStatus === 'correct' 
                        ? 'text-green-700 bg-green-50 border border-green-200' 
                        : 'text-red-700 bg-red-50 border border-red-200'
                    } ${isDarkTheme ? 'bg-opacity-10' : ''}`}>
                      {submissionStatus === 'correct' ? (
                        <>
                          <CheckCircle className="h-6 w-6 text-green-600" />
                          <div>
                            <div className="font-semibold text-lg">✅ Question Complete!</div>
                            <div className="text-sm">All test cases passed successfully. This question is now marked as complete.</div>
                          </div>
                        </>
                      ) : (
                        <>
                          <XCircle className="h-6 w-6 text-red-600" />
                          <div>
                            <div className="font-semibold text-lg">❌ Question Incomplete</div>
                            <div className="text-sm">Some test cases failed. Please review your code and try again to complete this question.</div>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                )}

                {/* Summary Results */}
                {testResults && (
                  <div className="mt-6 pt-4 border-t">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <div className={`p-3 rounded-lg text-center ${isDarkTheme ? 'bg-green-900/20 border border-green-700' : 'bg-green-50 border border-green-200'}`}>
                        <div className="text-xl font-bold text-green-600">{testResults.summary.passed}</div>
                        <div className="text-xs text-green-600">Passed</div>
                      </div>
                      <div className={`p-3 rounded-lg text-center ${isDarkTheme ? 'bg-red-900/20 border border-red-700' : 'bg-red-50 border border-red-200'}`}>
                        <div className="text-xl font-bold text-red-600">{testResults.summary.failed}</div>
                        <div className="text-xs text-red-600">Failed</div>
                      </div>
                      <div className={`p-3 rounded-lg text-center ${isDarkTheme ? 'bg-blue-900/20 border border-blue-700' : 'bg-blue-50 border border-blue-200'}`}>
                        <div className="text-xl font-bold text-blue-600">{testResults.summary.percentage}%</div>
                        <div className="text-xs text-blue-600">Success Rate</div>
                      </div>
                      <div className={`p-3 rounded-lg text-center ${isDarkTheme ? 'bg-gray-700 border border-gray-600' : 'bg-gray-50 border border-gray-200'}`}>
                        <div className="text-xl font-bold">{testResults.summary.total}</div>
                        <div className="text-xs">Total Tests</div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Empty State */}
                {validTestCases.length === 0 && (
                  <div className="text-center text-gray-500 py-12">
                    <TestTube className="h-16 w-16 mx-auto mb-4 opacity-50" />
                    <p className="text-lg font-medium">No test cases available</p>
                    <p className="text-sm">Test cases will appear here when available</p>
                  </div>
                )}

                {/* Completion Guidance */}
                {validTestCases.length > 0 && !submissionStatus && (
                  <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <Info className="h-5 w-5 text-blue-600" />
                      <div className="text-sm text-blue-800">
                        <strong>To complete this question:</strong> Run the test cases and ensure all of them pass. 
                        Only when all test cases pass will this question be marked as complete in your progress.
                      </div>
                    </div>
                  </div>
                )}
                  </CardContent>
                </CollapsibleContent>
              </Collapsible>
            </Card>
        </div>
      </div>
    </div>
  );
};

export default CodingQuestionRenderer; 