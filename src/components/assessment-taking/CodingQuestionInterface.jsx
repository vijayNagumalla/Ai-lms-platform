import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import DOMPurify from 'dompurify';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  Code, 
  Play, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  Clock,
  Save,
  Terminal,
  RotateCcw,
  GripVertical,
  ChevronDown,
  ChevronUp,
  Maximize2,
  Minimize2,
  X
} from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'react-hot-toast';
import apiService from '@/services/api';
import CodeEditor from '@/components/ui/code-editor';
import { Textarea } from '@/components/ui/textarea';

const CodingQuestionInterface = ({ 
  question, 
  answer, 
  onAnswerChange, 
  onSave, 
  submissionId,
  theme = 'light',
  isDarkMode = false
}) => {
  // Extract available languages from question data
  const getAvailableLanguages = () => {
    const languageMap = {
      'javascript': { label: 'JavaScript', icon: '🟨' },
      'python': { label: 'Python', icon: '🐍' },
      'java': { label: 'Java', icon: '☕' },
      'cpp': { label: 'C++', icon: '⚡' },
      'c': { label: 'C', icon: '⚡' },
      'php': { label: 'PHP', icon: '🐘' },
      'ruby': { label: 'Ruby', icon: '💎' },
      'go': { label: 'Go', icon: '🐹' },
      'rust': { label: 'Rust', icon: '🦀' },
      'typescript': { label: 'TypeScript', icon: '🔷' }
    };

    let availableLanguages = [];
    
    // Get languages from metadata first (since that's where the data is in your case)
    if (question.metadata?.languages && Array.isArray(question.metadata.languages)) {
      availableLanguages = question.metadata.languages;
    }
    // Get languages from starter_codes keys in metadata
    else if (question.metadata?.starter_codes && typeof question.metadata.starter_codes === 'object') {
      availableLanguages = Object.keys(question.metadata.starter_codes);
    }
    // Get languages from coding_details
    else if (question.coding_details?.languages && Array.isArray(question.coding_details.languages)) {
      availableLanguages = question.coding_details.languages;
    }
    // Get languages from starter_codes keys in coding_details
    else if (question.coding_details?.starter_codes && typeof question.coding_details.starter_codes === 'object') {
      availableLanguages = Object.keys(question.coding_details.starter_codes);
    }
    // Fallback to default if none found
    else {
      availableLanguages = ['javascript'];
    }

    return availableLanguages.map(lang => ({
      value: lang,
      label: languageMap[lang]?.label || lang,
      icon: languageMap[lang]?.icon || '💻'
    }));
  };

  // Extract starter code for current language
  const getStarterCode = (lang) => {
    // From answer
    if (answer?.code && answer?.language === lang) {
      return answer.code;
    }
    // From metadata starter_codes first (since that's where the data is in your case)
    if (question.metadata?.starter_codes?.[lang]) {
      return question.metadata.starter_codes[lang];
    }
    // From coding_details starter_codes
    if (question.coding_details?.starter_codes?.[lang]) {
      return question.coding_details.starter_codes[lang];
    }
    // Fallback to direct properties
    if (lang === (question.language || question.coding_details?.language || question.metadata?.language || 'javascript')) {
      return question.starter_code || question.coding_details?.starter_code || question.metadata?.starter_code || '';
    }
    return '';
  };

  // Extract initial language from answer or question data
  const getInitialLanguage = () => {
    const availableLangs = getAvailableLanguages();
    if (availableLangs.length === 0) return 'javascript';
    
    // Prefer answer language if available and in list
    if (answer?.language && availableLangs.find(l => l.value === answer.language)) {
      return answer.language;
    }
    // Use first available language
    return availableLangs[0].value;
  };

  // Map language names to Monaco Editor language codes
  const getMonacoLanguage = (lang) => {
    const languageMap = {
      'javascript': 'javascript',
      'python': 'python',
      'java': 'java',
      'cpp': 'cpp',
      'c': 'c',
      'php': 'php',
      'ruby': 'ruby',
      'go': 'go',
      'rust': 'rust',
      'typescript': 'typescript'
    };
    return languageMap[lang] || 'javascript';
  };

  const availableLanguages = getAvailableLanguages();
  const initialLanguage = getInitialLanguage();
  
  const [code, setCode] = useState(getStarterCode(initialLanguage));
  const [language, setLanguage] = useState(initialLanguage);
  const [testResults, setTestResults] = useState(answer?.testResults || []);
  const [isRunning, setIsRunning] = useState(false);
  const [isRunningCustomTest, setIsRunningCustomTest] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [executionTime, setExecutionTime] = useState(0);
  const [memoryUsage, setMemoryUsage] = useState(0);
  const [leftWidth, setLeftWidth] = useState(40); // Percentage
  const [isResizing, setIsResizing] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [customTestInput, setCustomTestInput] = useState('');
  const [customTestExpected, setCustomTestExpected] = useState('');
  const [customTestResult, setCustomTestResult] = useState(null);
  const [showCustomTest, setShowCustomTest] = useState(true); // Expanded by default for visibility
  
  const autoSaveTimeoutRef = useRef(null);
  const containerRef = useRef(null);
  const editorContainerRef = useRef(null);
  const [editorHeight, setEditorHeight] = useState('500px');
  const fullscreenContainerRef = useRef(null);

  // Extract test cases from multiple possible locations, with language-specific support
  const extractTestCases = (selectedLanguage) => {
    // Try different locations for test cases
    let testCases = [];
    
    // Debug: Log the question structure to help identify where test cases are
    if (process.env.NODE_ENV === 'development') {
      console.log('Extracting test cases from question:', {
        hasMetadata: !!question.metadata,
        hasCodingDetails: !!question.coding_details,
        metadataKeys: question.metadata ? Object.keys(question.metadata) : [],
        metadataTestCases: question.metadata?.test_cases,
        codingDetailsTestCases: question.coding_details?.test_cases,
        directTestCases: question.test_cases
      });
    }
    
    // First, try language-specific test cases
    if (selectedLanguage) {
      if (question.coding_details?.test_cases_by_language?.[selectedLanguage] && Array.isArray(question.coding_details.test_cases_by_language[selectedLanguage])) {
        testCases = question.coding_details.test_cases_by_language[selectedLanguage];
      }
      else if (question.metadata?.test_cases_by_language?.[selectedLanguage] && Array.isArray(question.metadata.test_cases_by_language[selectedLanguage])) {
        testCases = question.metadata.test_cases_by_language[selectedLanguage];
      }
    }
    
    // Fallback to general test cases if language-specific not found
    if (testCases.length === 0) {
      // Direct property
      if (question.test_cases && Array.isArray(question.test_cases)) {
        testCases = question.test_cases;
      }
      // From coding_details
      else if (question.coding_details?.test_cases && Array.isArray(question.coding_details.test_cases)) {
        testCases = question.coding_details.test_cases;
      }
      // From metadata - CHECK THIS FIRST since that's where the data is
      else if (question.metadata?.test_cases) {
        if (Array.isArray(question.metadata.test_cases)) {
          testCases = question.metadata.test_cases;
        } else if (typeof question.metadata.test_cases === 'string') {
          try {
            testCases = JSON.parse(question.metadata.test_cases);
          } catch (e) {
            console.warn('Failed to parse metadata.test_cases string:', e);
          }
        }
      }
      // Try parsing if it's a string
      else if (question.test_cases && typeof question.test_cases === 'string') {
        try {
          testCases = JSON.parse(question.test_cases);
        } catch (e) {
          console.warn('Failed to parse test_cases string:', e);
        }
      }
      else if (question.coding_details?.test_cases && typeof question.coding_details.test_cases === 'string') {
        try {
          testCases = JSON.parse(question.coding_details.test_cases);
        } catch (e) {
          console.warn('Failed to parse coding_details.test_cases string:', e);
        }
      }
    }
    
    // Normalize test case format - handle both 'output' and 'expected_output' field names
    testCases = testCases.map(tc => {
      // If test case has 'output' but not 'expected_output', map it
      if (tc.output && !tc.expected_output && !tc.expectedOutput) {
        return {
          ...tc,
          expected_output: tc.output,
          expectedOutput: tc.output
        };
      }
      // Ensure both field names exist for compatibility
      if (tc.expected_output && !tc.expectedOutput) {
        tc.expectedOutput = tc.expected_output;
      }
      if (tc.expectedOutput && !tc.expected_output) {
        tc.expected_output = tc.expectedOutput;
      }
      // Handle input field variations
      if (tc.input_data && !tc.input) {
        tc.input = tc.input_data;
      }
      if (tc.inputData && !tc.input && !tc.input_data) {
        tc.input = tc.inputData;
      }
      return tc;
    });
    
    // Ensure it's an array
    if (!Array.isArray(testCases)) {
      testCases = [];
    }
    
    return testCases;
  };

  // Extract time and memory limits based on selected language
  const getTimeLimit = (selectedLanguage) => {
    if (selectedLanguage) {
      if (question.coding_details?.time_limits_by_language?.[selectedLanguage]) {
        return question.coding_details.time_limits_by_language[selectedLanguage];
      }
      if (question.metadata?.time_limits_by_language?.[selectedLanguage]) {
        return question.metadata.time_limits_by_language[selectedLanguage];
      }
    }
    return question.time_limit || question.coding_details?.time_limit || question.metadata?.time_limit || 1000;
  };

  const getMemoryLimit = (selectedLanguage) => {
    if (selectedLanguage) {
      if (question.coding_details?.memory_limits_by_language?.[selectedLanguage]) {
        return question.coding_details.memory_limits_by_language[selectedLanguage];
      }
      if (question.metadata?.memory_limits_by_language?.[selectedLanguage]) {
        return question.metadata.memory_limits_by_language[selectedLanguage];
      }
    }
    return question.memory_limit || question.coding_details?.memory_limit || question.metadata?.memory_limit || 256;
  };

  // Use useMemo to recalculate when language changes
  const testCases = useMemo(() => extractTestCases(language), [language, question]);
  const timeLimit = useMemo(() => getTimeLimit(language), [language, question]);
  const memoryLimit = useMemo(() => getMemoryLimit(language), [language, question]);

  // Ensure editor container gets proper height and updates on resize
  useEffect(() => {
    let observer = null;
    let timeoutId = null;

    const updateEditorHeight = () => {
      if (editorContainerRef.current) {
        const container = editorContainerRef.current;
        const height = container.clientHeight;
        if (height > 0) {
          setEditorHeight(`${height}px`);
        }
      }
    };

    // Initial update
    timeoutId = setTimeout(() => {
      updateEditorHeight();
      if (editorContainerRef.current) {
        // Use ResizeObserver to watch for container size changes
        observer = new ResizeObserver(() => {
          updateEditorHeight();
        });
        observer.observe(editorContainerRef.current);
        
        // Also listen to window resize
        window.addEventListener('resize', updateEditorHeight);
      }
    }, 100);

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
      if (observer) observer.disconnect();
      window.removeEventListener('resize', updateEditorHeight);
    };
  }, []);

  useEffect(() => {
    // Auto-save code every 30 seconds
    autoSaveTimeoutRef.current = setInterval(() => {
      if (code && code !== answer?.code) {
        handleSave();
      }
    }, 30000);

    return () => {
      if (autoSaveTimeoutRef.current) {
        clearInterval(autoSaveTimeoutRef.current);
      }
    };
  }, [code]);

  useEffect(() => {
    // Check if all test cases passed
    const allTestsPassed = testResults.length > 0 && 
                          testResults.every(result => result && result.result?.verdict?.status === 'accepted');
    
    // Update answer when code, language, or test results change
    const newAnswer = {
      code,
      language,
      testResults,
      executionTime,
      memoryUsage,
      allTestsPassed,
      timestamp: new Date().toISOString()
    };
    
    if (JSON.stringify(newAnswer) !== JSON.stringify(answer)) {
      onAnswerChange(newAnswer);
      // Auto-save after a short delay (or immediately if all tests passed)
      if (onSave && code.trim()) {
        if (autoSaveTimeoutRef.current) {
          clearTimeout(autoSaveTimeoutRef.current);
        }
        // Save immediately if all tests passed, otherwise delay
        const saveDelay = allTestsPassed ? 0 : 1000;
        autoSaveTimeoutRef.current = setTimeout(() => {
          onSave(newAnswer);
        }, saveDelay);
      }
    }

    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
    };
  }, [code, language, testResults, executionTime, memoryUsage, answer, onAnswerChange, onSave]);

  const handleCodeChange = (newCode) => {
    // Monaco Editor passes the code as first parameter
    const codeValue = typeof newCode === 'string' ? newCode : (newCode || '');
    setCode(codeValue);
  };

  // Store code per language to preserve work when switching
  const [codeByLanguage, setCodeByLanguage] = useState(() => {
    // Load from localStorage if available
    if (typeof Storage !== 'undefined' && question?.id) {
      try {
        const saved = localStorage.getItem(`code_${question.id}`);
        if (saved) {
          return JSON.parse(saved);
        }
      } catch (e) {
        console.error('Error loading code from localStorage:', e);
      }
    }
    return {};
  });
  
  // Persist code to localStorage
  useEffect(() => {
    if (typeof Storage !== 'undefined' && question?.id && Object.keys(codeByLanguage).length > 0) {
      try {
        localStorage.setItem(`code_${question.id}`, JSON.stringify(codeByLanguage));
      } catch (e) {
        console.error('Error saving code to localStorage:', e);
      }
    }
  }, [codeByLanguage, question?.id]);

  const handleLanguageChange = (newLanguage) => {
    // Save current code for current language before switching
    if (code && code.trim() && language) {
      setCodeByLanguage(prev => ({
        ...prev,
        [language]: code
      }));
    }
    
    setLanguage(newLanguage);
    
    // Load saved code for new language if available, otherwise use starter code
    const savedCode = codeByLanguage[newLanguage];
    if (savedCode && savedCode.trim()) {
      setCode(savedCode);
    } else {
      const newStarterCode = getStarterCode(newLanguage);
      setCode(newStarterCode);
    }
    
    setTestResults([]);
    // Test cases and limits will automatically update via extractTestCases and getTimeLimit/getMemoryLimit
  };

  const handleSave = async () => {
    if (!code.trim()) {
      toast.error('Please write some code before saving');
      return;
    }

    setIsSaving(true);
    try {
      const answerData = {
        code,
        language,
        testResults,
        executionTime,
        memoryUsage,
        timestamp: new Date().toISOString()
      };

      await onSave(answerData);
      toast.success('Code saved successfully');
    } catch (error) {
      console.error('Error saving code:', error);
      toast.error('Failed to save code');
    } finally {
      setIsSaving(false);
    }
  };

  const runTestCases = async () => {
    if (!code.trim()) {
      toast.error('Please write some code before running tests');
      return;
    }

    if (testCases.length === 0) {
      toast.error('No test cases available for this question');
      return;
    }

    setIsRunning(true);
    setTestResults([]);
    
    try {
      const startTime = Date.now();
      
      // Prepare test cases in the format expected by the API
      const formattedTestCases = testCases.map(tc => ({
        input: tc.input || tc.input_data || '',
        expected_output: tc.expected_output || tc.expectedOutput || tc.output || '',
        input_data: tc.input || tc.input_data || ''
      }));
      
      const response = await apiService.runCodingTests({
        sourceCode: code,
        language: language,
        testCases: formattedTestCases
      });

      const endTime = Date.now();
      setExecutionTime(endTime - startTime);

      if (response.success) {
        const results = response.data.results || [];
        // Map results to match test case indices
        const mappedResults = results.map((result, index) => ({
          testCase: testCases[index],
          result: result.result,
          index
        }));
        setTestResults(mappedResults);
        
        const passedTests = mappedResults.filter(result => 
          result.result?.verdict?.status === 'accepted'
        ).length;
        
        // Check if all test cases passed
        const allPassed = passedTests === mappedResults.length && mappedResults.length > 0;
        
        if (allPassed) {
          toast.success(`All tests passed! Question marked as completed.`, { duration: 5000 });
          // Immediately save answer when all tests pass to mark question as completed
          const completedAnswer = {
            code,
            language,
            testResults: mappedResults,
            executionTime,
            memoryUsage,
            allTestsPassed: true,
            timestamp: new Date().toISOString()
          };
          onAnswerChange(completedAnswer);
          if (onSave) {
            onSave(completedAnswer);
          }
        } else {
          toast.success(`Tests completed: ${passedTests}/${mappedResults.length} passed`);
          // Save partial results even if not all tests passed
          const partialAnswer = {
            code,
            language,
            testResults: mappedResults,
            executionTime: endTime - startTime,
            memoryUsage,
            allTestsPassed: false,
            timestamp: new Date().toISOString()
          };
          onAnswerChange(partialAnswer);
          // Auto-save will handle saving this
        }
      } else {
        throw new Error(response.message || 'Failed to run tests');
      }
    } catch (error) {
      console.error('Error running tests:', error);
      toast.error(error.message || 'Failed to run test cases');
      
      setTestResults(testCases.map((testCase, index) => ({
        testCase,
        result: {
          verdict: { status: 'error' },
          output: '',
          error: error.message,
          executionTime: 0,
          memoryUsage: 0
        },
        index
      })));
    } finally {
      setIsRunning(false);
    }
  };

  const runSingleTestCase = async (testCase, index) => {
    if (!code.trim()) {
      toast.error('Please write some code before running tests');
      return;
    }

    setIsRunning(true);
    
    try {
      const formattedTestCase = {
        input: testCase.input || testCase.input_data || '',
        expected_output: testCase.expected_output || testCase.expectedOutput || testCase.output || '',
        input_data: testCase.input || testCase.input_data || ''
      };
      
      const response = await apiService.runCodingTests({
        sourceCode: code,
        language: language,
        testCases: [formattedTestCase]
      });

      if (response.success) {
        const result = response.data.results[0];
        setTestResults(prev => {
          const newResults = [...prev];
          newResults[index] = { 
            testCase, 
            result: result.result, 
            index 
          };
          
          // Check if all test cases are now passed after this update
          const allPassed = newResults.length > 0 && 
                           newResults.every(r => r && r.result?.verdict?.status === 'accepted');
          
          // If all passed, trigger save immediately
          if (allPassed) {
            setTimeout(() => {
              const completedAnswer = {
                code,
                language,
                testResults: newResults,
                executionTime,
                memoryUsage,
                allTestsPassed: true,
                timestamp: new Date().toISOString()
              };
              onAnswerChange(completedAnswer);
              if (onSave) {
                onSave(completedAnswer);
              }
              toast.success(`All tests passed! Question marked as completed.`, { duration: 5000 });
            }, 100);
          } else {
        toast.success(`Test case ${index + 1} ${result.result?.verdict?.status === 'accepted' ? 'passed' : 'failed'}`);
          }
          
          return newResults;
        });
      } else {
        throw new Error(response.message || 'Failed to run test');
      }
    } catch (error) {
      console.error('Error running single test:', error);
      toast.error(error.message || 'Failed to run test case');
    } finally {
      setIsRunning(false);
    }
  };

  const resetCode = () => {
    if (window.confirm('Are you sure you want to reset your code? This action cannot be undone.')) {
      const starterCode = getStarterCode(language);
      setCode(starterCode || '');
      setTestResults([]);
      setExecutionTime(0);
      setMemoryUsage(0);
      toast.success('Code reset to starter code');
    }
  };

  const handleMouseDown = (e) => {
    setIsResizing(true);
    e.preventDefault();
  };

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!isResizing || !containerRef.current) return;
      
      const container = containerRef.current;
      const rect = container.getBoundingClientRect();
      const newLeftWidth = ((e.clientX - rect.left) / rect.width) * 100;
      
      // Limit resize between 25% and 75%
      const clampedWidth = Math.max(25, Math.min(75, newLeftWidth));
      setLeftWidth(clampedWidth);
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing]);

  const getTestResultIcon = (result) => {
    if (!result) return <AlertTriangle className="h-4 w-4 text-gray-400" />;
    
    const status = result.result?.verdict?.status;
    switch (status) {
      case 'accepted':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'wrong_answer':
        return <XCircle className="h-4 w-4 text-red-600" />;
      case 'time_limit_exceeded':
        return <Clock className="h-4 w-4 text-orange-600" />;
      case 'runtime_error':
        return <AlertTriangle className="h-4 w-4 text-red-600" />;
      case 'compilation_error':
        return <XCircle className="h-4 w-4 text-red-600" />;
      default:
        return <AlertTriangle className="h-4 w-4 text-gray-400" />;
    }
  };

  const getTestResultColor = (result) => {
    if (!result) return 'bg-gray-100';
    
    const status = result.result?.verdict?.status;
    switch (status) {
      case 'accepted':
        return 'bg-green-50 border-green-200';
      case 'wrong_answer':
        return 'bg-red-50 border-red-200';
      case 'time_limit_exceeded':
        return 'bg-orange-50 border-orange-200';
      case 'runtime_error':
        return 'bg-red-50 border-red-200';
      case 'compilation_error':
        return 'bg-red-50 border-red-200';
      default:
        return 'bg-gray-50 border-gray-200';
    }
  };

  const getPassedTestsCount = () => {
    return testResults.filter(result => 
      result.result?.verdict?.status === 'accepted'
    ).length;
  };

  const handleExitFullscreen = useCallback(async () => {
    try {
      if (document.exitFullscreen) {
        await document.exitFullscreen();
      } else if (document.webkitExitFullscreen) {
        await document.webkitExitFullscreen();
      } else if (document.msExitFullscreen) {
        await document.msExitFullscreen();
      }
      setIsFullscreen(false);
      
      // Clean up the container
      if (fullscreenContainerRef.current && fullscreenContainerRef.current.parentNode) {
        fullscreenContainerRef.current.parentNode.removeChild(fullscreenContainerRef.current);
      }
      fullscreenContainerRef.current = null;
    } catch (error) {
      console.error('Error exiting fullscreen:', error);
      setIsFullscreen(false);
    }
  }, []);

  const handleEnterFullscreen = async () => {
    setIsFullscreen(true);
    // Use React state to render fullscreen component
  };

  // Handle fullscreen mode
  useEffect(() => {
    const handleFullscreenChange = () => {
      if (!document.fullscreenElement && !document.webkitFullscreenElement && !document.msFullscreenElement) {
        setIsFullscreen(false);
      } else {
        setIsFullscreen(true);
      }
    };

    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isFullscreen) {
        handleExitFullscreen();
      }
    };

    if (isFullscreen) {
      document.addEventListener('fullscreenchange', handleFullscreenChange);
      document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
      document.addEventListener('msfullscreenchange', handleFullscreenChange);
      document.addEventListener('keydown', handleKeyDown);
    }
    
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      document.removeEventListener('msfullscreenchange', handleFullscreenChange);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isFullscreen, handleExitFullscreen]);

  const runCustomTestCase = async () => {
    if (!code.trim()) {
      toast.error('Please write some code before running custom test');
      return;
    }

    if (!customTestInput.trim()) {
      toast.error('Please enter test input');
      return;
    }
    
    setIsRunningCustomTest(true);
    setCustomTestResult(null);
    
    try {
      const formattedTestCase = {
        input: customTestInput.trim(),
        expected_output: customTestExpected?.trim() || '',
        input_data: customTestInput.trim()
      };

      const response = await apiService.runCodingTests({
        sourceCode: code,
        language: language,
        testCases: [formattedTestCase]
      });

      if (response.success && response.data) {
        const result = response.data.results?.[0];
        if (result && result.result) {
          // Store the result to display in UI
          setCustomTestResult({
            input: customTestInput.trim(),
            expectedOutput: customTestExpected?.trim() || '',
            output: result.result.output || '',
            error: result.result.error || '',
            status: result.result.verdict?.status || 'unknown',
            executionTime: result.result.executionTime || 0,
            memoryUsage: result.result.memoryUsage || 0
          });
          
          const verdict = result.result.verdict?.status;
          const isAccepted = verdict === 'accepted';
          
          if (isAccepted) {
            toast.success(`✓ Custom test passed!`, { duration: 3000 });
          } else {
            toast.error(`✗ Custom test failed`, { duration: 3000 });
          }
        } else {
          throw new Error('Unexpected response format from test server');
        }
      } else {
        throw new Error(response.message || 'Failed to run custom test');
      }
    } catch (error) {
      console.error('Error running custom test:', error);
      toast.error(error.message || 'Failed to run custom test case');
      setCustomTestResult({
        input: customTestInput.trim(),
        expectedOutput: customTestExpected?.trim() || '',
        output: '',
        error: error.message || 'Execution failed',
        status: 'error',
        executionTime: 0,
        memoryUsage: 0
      });
    } finally {
      setIsRunningCustomTest(false);
    }
  };

  // Fullscreen editor component
  const FullscreenEditor = () => {
    if (!isFullscreen) return null;

  return (
      <div 
        className={`fixed inset-0 z-[9999] flex flex-col ${isDarkMode ? 'bg-gray-900' : 'bg-white'}`}
      >
        <div className={`flex items-center justify-between px-4 py-3 border-b ${isDarkMode ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-gray-50'}`}>
          <div className="flex items-center gap-4">
            <h3 className={`text-lg font-semibold ${isDarkMode ? 'text-gray-100' : 'text-gray-900'}`}>
              Code Editor - {availableLanguages.find(l => l.value === language)?.label || language}
            </h3>
            {availableLanguages.length > 0 && (
              <Select value={language} onValueChange={handleLanguageChange}>
                <SelectTrigger className="w-[180px] h-8 text-xs">
                  <SelectValue>
                    <div className="flex items-center gap-2">
                      <span>{availableLanguages.find(l => l.value === language)?.icon || '💻'}</span>
                      <span>{availableLanguages.find(l => l.value === language)?.label || language}</span>
          </div>
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {availableLanguages.map((lang) => (
                    <SelectItem key={lang.value} value={lang.value}>
                      <div className="flex items-center gap-2">
                        <span>{lang.icon}</span>
                        <span>{lang.label}</span>
              </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
          <div className="flex items-center gap-2">
            <div className={`text-xs flex items-center gap-1 ${isDarkMode ? 'text-green-400' : 'text-green-600'}`}>
              <CheckCircle className="h-3 w-3" />
              Auto-saved
            </div>
              <Button
              variant="ghost"
                size="sm"
              onClick={handleExitFullscreen}
              className="h-8 w-8 p-0"
              title="Exit Fullscreen (ESC)"
              >
              <X className="h-4 w-4" />
              </Button>
          </div>
        </div>
        <div className="flex-1 overflow-hidden">
          <CodeEditor
            value={code || ''}
            onChange={handleCodeChange}
            language={getMonacoLanguage(language)}
            theme={isDarkMode ? 'vs-dark' : 'vs-light'}
            height="100%"
            options={{
              minimap: { enabled: false },
              fontSize: 14,
              lineNumbers: 'on',
              wordWrap: 'on',
              automaticLayout: true,
              scrollBeyondLastLine: false,
              tabSize: language === 'python' ? 4 : 2,
              insertSpaces: true,
              detectIndentation: true,
              renderWhitespace: 'selection',
              bracketPairColorization: { enabled: true },
              readOnly: false
            }}
          />
        </div>
      </div>
    );
  };

  return (
    <>
      {isFullscreen && <FullscreenEditor />}
      <div className="h-full flex flex-col overflow-hidden" ref={containerRef}>
        {/* Two Column Layout */}
        <div className="flex-1 flex overflow-hidden min-h-0">
          
          {/* Left Column - Scrollable Question and Test Cases */}
          <div 
            className={`border-r overflow-y-auto flex flex-col min-h-0 ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white'}`}
            style={{ width: `${leftWidth}%`, height: '100%' }}
          >
            <div className="p-4 space-y-4 pb-20">
              {/* Question Header */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Code className={`h-5 w-5 ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`} />
                  <h2 className={`text-xl font-bold ${isDarkMode ? 'text-gray-100' : 'text-gray-900'}`}>
                    {question.title || question.question_text || 'Coding Question'}
                  </h2>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">
                    {question.points || 1} {question.points === 1 ? 'point' : 'points'}
              </Badge>
                  {question.difficulty_level && (
                    <Badge variant="outline" className="text-xs">
                      {question.difficulty_level}
              </Badge>
                  )}
            </div>
          </div>

              {/* Question Description */}
              {question.question_text && (
                <div className={`prose max-w-none leading-relaxed ${isDarkMode ? 'text-gray-300 prose-invert' : 'text-gray-700'}`}>
                  <div dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(question.question_text) }} />
                  </div>
              )}
              
              {question.content && (
                <div className={`prose max-w-none leading-relaxed ${isDarkMode ? 'text-gray-300 prose-invert' : 'text-gray-700'}`}>
                  <div dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(question.content) }} />
                  </div>
              )}
              
              {question.explanation && (
                <div className={`p-4 rounded-lg border ${isDarkMode ? 'bg-blue-900 border-blue-700 text-blue-200' : 'bg-blue-50 border-blue-200 text-blue-800'}`}>
                  <h4 className="font-medium mb-2">Explanation</h4>
                  <div className="text-sm">{question.explanation}</div>
                </div>
              )}

              {/* Test Cases */}
              <Card className={isDarkMode ? 'bg-gray-800 border-gray-700' : ''}>
                <CardHeader className={isDarkMode ? 'bg-gray-700' : ''}>
              <div className="flex items-center justify-between">
                    <CardTitle className={`text-sm ${isDarkMode ? 'text-gray-100' : ''}`}>Predefined Test Cases</CardTitle>
                  <Button
                    onClick={runTestCases}
                    disabled={isRunning || !code.trim() || testCases.length === 0}
                      className="bg-green-600 hover:bg-green-700 text-white h-7 text-xs"
                      size="sm"
                  >
                    {isRunning ? (
                        <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white mr-2"></div>
                    ) : (
                        <Play className="h-3 w-3 mr-2" />
                    )}
                    Run All Tests
                  </Button>
                    </div>
                </CardHeader>
                <CardContent>
                {testCases.length === 0 ? (
                    <Alert className={isDarkMode ? 'bg-gray-700 border-gray-600' : ''}>
                      <AlertTriangle className={`h-4 w-4 ${isDarkMode ? 'text-gray-300' : ''}`} />
                      <AlertDescription className={`text-xs ${isDarkMode ? 'text-gray-300' : ''}`}>
                      No test cases available for this question.
                    </AlertDescription>
                  </Alert>
                ) : (
                    <div className="space-y-3">
                      {testCases.map((testCase, index) => {
                    const result = testResults.find(r => r.index === index);
                    return (
                          <div 
                            key={index} 
                            className={`border rounded-lg p-3 ${
                              result ? getTestResultColor(result, isDarkMode) : (isDarkMode ? 'bg-gray-700 border-gray-600' : 'bg-gray-50')
                            }`}
                          >
                            <div className="flex items-center gap-2 mb-2">
                              {result && getTestResultIcon(result)}
                              <Badge variant="outline" className={`text-xs ${isDarkMode ? 'border-gray-500 text-gray-300' : ''}`}>
                                Test Case {index + 1}
                              </Badge>
                              {result && (
                                <Badge variant={result.result?.verdict?.status === 'accepted' ? 'default' : 'destructive'} className="text-xs">
                                  {result.result?.verdict?.status?.replace(/_/g, ' ') || 'Pending'}
                                </Badge>
                              )}
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => runSingleTestCase(testCase, index)}
                              disabled={isRunning || !code.trim()}
                                className={`ml-auto h-6 text-xs ${isDarkMode ? 'border-gray-600 text-gray-300 hover:bg-gray-600' : ''}`}
                            >
                                <Play className="h-3 w-3 mr-1" />
                              Run
                            </Button>
                          </div>
                            <div className={`space-y-2 text-sm ${isDarkMode ? 'text-gray-300' : ''}`}>
                          <div>
                                <span className={`font-medium ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>Input:</span>
                                <div className={`mt-1 p-2 rounded border font-mono text-xs ${isDarkMode ? 'bg-gray-800 border-gray-600 text-gray-200' : 'bg-white'}`}>
                                  {testCase.input || testCase.input_data || 'No input'}
                            </div>
                          </div>
                          <div>
                                <span className={`font-medium ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>Expected Output:</span>
                                <div className={`mt-1 p-2 rounded border font-mono text-xs ${isDarkMode ? 'bg-gray-800 border-gray-600 text-gray-200' : 'bg-white'}`}>
                                  {testCase.expected_output || testCase.expectedOutput || testCase.output || 'No expected output'}
                            </div>
                          </div>
                          {result && (
                                <>
                            <div>
                                    <span className={`font-medium ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>Your Output:</span>
                                    <div className={`mt-1 p-2 rounded border font-mono text-xs ${
                                result.result?.verdict?.status === 'accepted' 
                                        ? (isDarkMode ? 'bg-green-900 border-green-700 text-green-200' : 'bg-green-50 border-green-200 text-green-800')
                                        : (isDarkMode ? 'bg-red-900 border-red-700 text-red-200' : 'bg-red-50 border-red-200 text-red-800')
                              }`}>
                                      {result.result?.output || result.result?.error || 'No output'}
                              </div>
                                  </div>
                                  {result.result?.executionTime && (
                                    <div className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                      Time: {result.result.executionTime}ms | Memory: {result.result.memoryUsage || 0}KB
                                </div>
                              )}
                                </>
                              )}
                              </div>
                            </div>
                        );
                      })}
                    </div>
                  )}
                  {testResults.length > 0 && (
                    <div className={`mt-4 pt-4 border-t ${isDarkMode ? 'border-gray-700' : ''}`}>
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-4">
                          <span className={`font-semibold ${isDarkMode ? 'text-green-400' : 'text-green-600'}`}>
                            ✓ {getPassedTestsCount()} passed
                          </span>
                          <span className={`font-semibold ${isDarkMode ? 'text-red-400' : 'text-red-600'}`}>
                            ✗ {testResults.length - getPassedTestsCount()} failed
                          </span>
                          <span className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>
                            Total: {testResults.length}
                          </span>
              </div>
                        {getPassedTestsCount() === testResults.length && testResults.length > 0 && (
                          <Badge className="bg-green-600 text-xs">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            All tests passed!
                          </Badge>
                        )}
                      </div>
                    </div>
                  )}
        </CardContent>
      </Card>

              {/* Custom Test Case - Always visible below Test Cases */}
              <Card className={`mt-6 ${isDarkMode ? 'bg-gray-800 border-gray-700' : ''}`}>
                <CardHeader 
                  className={`cursor-pointer ${isDarkMode ? 'bg-gray-700 hover:bg-gray-600' : 'hover:bg-gray-50'}`}
                  onClick={() => setShowCustomTest(!showCustomTest)}
                >
                  <div className="flex items-center justify-between">
                    <CardTitle className={`text-sm ${isDarkMode ? 'text-gray-100' : ''}`}>Custom Test Case</CardTitle>
                    {showCustomTest ? (
                      <ChevronUp className={`h-4 w-4 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`} />
                    ) : (
                      <ChevronDown className={`h-4 w-4 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`} />
                    )}
                  </div>
          </CardHeader>
                {showCustomTest && (
                  <CardContent className="space-y-3 pt-4">
                    <div>
                      <label className={`text-xs font-medium mb-1 block ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                        Input
                      </label>
                      <Textarea
                        value={customTestInput}
                        onChange={(e) => setCustomTestInput(e.target.value)}
                        placeholder="Enter test input..."
                        className={`font-mono text-xs ${isDarkMode ? 'bg-gray-700 border-gray-600 text-gray-100' : ''}`}
                        rows={3}
                      />
                </div>
                    <Button
                      onClick={runCustomTestCase}
                      disabled={isRunningCustomTest || !code.trim() || !customTestInput.trim()}
                      className="bg-blue-600 hover:bg-blue-700 text-white h-8 text-xs w-full"
                      size="sm"
                    >
                      {isRunningCustomTest ? (
                        <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white mr-2"></div>
                      ) : (
                        <Play className="h-3 w-3 mr-2" />
                      )}
                      Run Custom Test
                    </Button>

                    {/* Custom Test Result Display */}
                    {customTestResult && (
                      <div className={`mt-4 pt-4 border-t ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                        <div className="flex items-center gap-2 mb-3">
                          {customTestResult.status === 'accepted' ? (
                            <CheckCircle className={`h-4 w-4 ${isDarkMode ? 'text-green-400' : 'text-green-600'}`} />
                          ) : (
                            <XCircle className={`h-4 w-4 ${isDarkMode ? 'text-red-400' : 'text-red-600'}`} />
                          )}
                          <Badge 
                            variant={customTestResult.status === 'accepted' ? 'default' : 'destructive'} 
                            className="text-xs"
                          >
                            {customTestResult.status === 'accepted' ? 'Passed' : 
                             customTestResult.status === 'wrong_answer' ? 'Wrong Answer' :
                             customTestResult.status === 'time_limit_exceeded' ? 'Time Limit Exceeded' :
                             customTestResult.status === 'runtime_error' ? 'Runtime Error' :
                             customTestResult.status === 'compilation_error' ? 'Compilation Error' :
                             customTestResult.status === 'error' ? 'Error' : 'Failed'}
                          </Badge>
                          {customTestResult.executionTime > 0 && (
                            <span className={`text-xs ml-auto ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                              {customTestResult.executionTime}ms | {customTestResult.memoryUsage || 0}KB
                            </span>
                          )}
              </div>
              
                        <div className="space-y-2">
                          <div>
                            <span className={`text-xs font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Your Output:</span>
                            <div className={`mt-1 p-2 rounded border font-mono text-xs ${
                              customTestResult.status === 'accepted' 
                                ? (isDarkMode ? 'bg-green-900 border-green-700 text-green-200' : 'bg-green-50 border-green-200 text-green-800')
                                : (isDarkMode ? 'bg-red-900 border-red-700 text-red-200' : 'bg-red-50 border-red-200 text-red-800')
                            }`}>
                              {customTestResult.output || 'No output'}
                </div>
              </div>
              
                          {customTestResult.expectedOutput && (
                            <div>
                              <span className={`text-xs font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Expected Output:</span>
                              <div className={`mt-1 p-2 rounded border font-mono text-xs ${isDarkMode ? 'bg-gray-800 border-gray-600 text-gray-200' : 'bg-white'}`}>
                                {customTestResult.expectedOutput}
                </div>
              </div>
                          )}
            
                          {customTestResult.error && (
                            <div>
                              <span className={`text-xs font-medium ${isDarkMode ? 'text-red-300' : 'text-red-700'}`}>Error:</span>
                              <div className={`mt-1 p-2 rounded border font-mono text-xs ${isDarkMode ? 'bg-red-900 border-red-700 text-red-200' : 'bg-red-50 border-red-200 text-red-800'}`}>
                                {customTestResult.error}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
            )}
          </CardContent>
                )}
        </Card>
            </div>
          </div>

          {/* Resizer */}
          <div
            className={`w-1 cursor-col-resize flex items-center justify-center transition-colors ${isDarkMode ? 'bg-gray-700 hover:bg-blue-600' : 'bg-gray-200 hover:bg-blue-500'}`}
            onMouseDown={handleMouseDown}
          >
            <GripVertical className={`h-4 w-4 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`} />
          </div>

          {/* Right Column - Code Editor */}
          <div 
            className={`flex flex-col overflow-hidden ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'}`}
            style={{ width: `${100 - leftWidth}%` }}
          >
            <Card className={`h-full flex flex-col border-0 ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
              <CardHeader className={`flex-shrink-0 border-b ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
                <div className="flex items-center justify-between">
                  <CardTitle className={`text-sm flex items-center gap-2 ${isDarkMode ? 'text-gray-100' : ''}`}>
                    <Terminal className={`h-4 w-4 ${isDarkMode ? 'text-gray-300' : ''}`} />
                    Code Editor
                  </CardTitle>
                  <div className="flex items-center space-x-2">
                    {availableLanguages.length > 0 && (
                      <Select value={language} onValueChange={handleLanguageChange}>
                        <SelectTrigger className="w-[180px] h-8 text-xs">
                          <SelectValue>
                            <div className="flex items-center gap-2">
                              <span>{availableLanguages.find(l => l.value === language)?.icon || '💻'}</span>
                              <span>{availableLanguages.find(l => l.value === language)?.label || language}</span>
                            </div>
                          </SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                          {availableLanguages.map((lang) => (
                            <SelectItem key={lang.value} value={lang.value}>
                              <div className="flex items-center gap-2">
                                <span>{lang.icon}</span>
                                <span>{lang.label}</span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                    <Button variant="ghost" size="sm" onClick={handleEnterFullscreen} className="h-7 text-xs" title="Fullscreen">
                      <Maximize2 className="h-3 w-3 mr-1" />
                      Fullscreen
                    </Button>
                    <Button variant="ghost" size="sm" onClick={resetCode} className="h-7 text-xs">
                      <RotateCcw className="h-3 w-3 mr-1" />
                      Reset
                    </Button>
    </div>
                </div>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col p-0 overflow-hidden min-h-0" style={{ height: '100%' }}>
                <div className={`px-4 py-2 border-b flex items-center justify-between flex-shrink-0 ${isDarkMode ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-200'}`}>
                  <span className={`text-sm font-medium ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>Your Solution</span>
                  <div className={`text-xs flex items-center gap-1 ${isDarkMode ? 'text-green-400' : 'text-green-600'}`}>
                    <CheckCircle className="h-3 w-3" />
                    Auto-saved
                  </div>
                </div>
                <div 
                  ref={editorContainerRef} 
                  className="flex-1 overflow-hidden"
                  style={{ 
                    minHeight: '400px',
                    height: '100%',
                    position: 'relative'
                  }}
                >
                  <CodeEditor
                    value={code || ''}
                    onChange={handleCodeChange}
                    language={getMonacoLanguage(language)}
                    theme={isDarkMode ? 'vs-dark' : 'vs-light'}
                    height="100%"
                    width="100%"
                    options={{
                      minimap: { enabled: false },
                      fontSize: 14,
                      lineNumbers: 'on',
                      wordWrap: 'on',
                      automaticLayout: true,
                      scrollBeyondLastLine: false,
                      tabSize: language === 'python' ? 4 : 2,
                      insertSpaces: true,
                      detectIndentation: true,
                      renderWhitespace: 'selection',
                      bracketPairColorization: { enabled: true },
                      readOnly: false
                    }}
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </>
  );
};

export default CodingQuestionInterface;
