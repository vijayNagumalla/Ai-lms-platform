import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Card } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import { Button } from '../components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import CodeEditor from '../components/ui/code-editor';

import { toast } from '../components/ui/use-toast';
import apiService from '../services/api.js';
import { Dialog } from '../components/ui/dialog';
import { QUESTION_TYPES } from '../lib/constants';

const DIFFICULTY_LEVELS = [
  { value: 'easy', label: 'Easy' },
  { value: 'medium', label: 'Medium' },
  { value: 'hard', label: 'Hard' },
];

const defaultState = {
  title: '',
  content: '',
  question_type: 'multiple_choice',
  difficulty_level: 'medium',
  points: 1,
  time_limit_seconds: null,
  category_id: null,
  subcategory_id: null,
  status: 'draft',
  tags: [],
  options: ['', ''],
  correctAnswers: [],
  explanation: '',
  hints: [],
  acceptable_answers: [],
  rubric: '',
  coding_details: {
    languages: ['javascript'],
    starter_codes: {
      javascript: '// Write your solution here\n// Example: function solve(input) {\n//   // Your code here\n//   return result;\n// }',
      python: '# Write your solution here\n# Example:\n# def solve(input):\n#     # Your code here\n#     return result',
      java: '// Write your solution here\n// Example:\n// public class Solution {\n//     public static String solve(String input) {\n//         // Your code here\n//         return result;\n//     }\n// }',
      cpp: '// Write your solution here\n// Example:\n// #include <iostream>\n// #include <string>\n// using namespace std;\n// \n// string solve(string input) {\n//     // Your code here\n//     return result;\n// }',
      c: '// Write your solution here\n// Example:\n// #include <stdio.h>\n// #include <string.h>\n// \n// char* solve(char* input) {\n//     // Your code here\n//     return result;\n// }',
      php: '<?php\n// Write your solution here\n// Example:\n// function solve($input) {\n//     // Your code here\n//     return $result;\n// }',
      ruby: '# Write your solution here\n# Example:\n# def solve(input)\n#   # Your code here\n#   result\n# end',
      go: 'package main\n\n// Write your solution here\n// Example:\n// func solve(input string) string {\n//     // Your code here\n//     return result\n// }',
      rust: '// Write your solution here\n// Example:\n// fn solve(input: &str) -> String {\n//     // Your code here\n//     result\n// }'
    },
    solution_codes: {
      javascript: '',
      python: '',
      java: '',
      cpp: '',
      c: '',
      php: '',
      ruby: '',
      go: '',
      rust: ''
    },
    test_cases: []
  },
  blanks: [''],
};

// Helper to find all blanks in content
function extractBlanks(content) {
  const regex = /\[\[blank(\d+)\]\]/g;
  const blanks = [];
  let match;
  while ((match = regex.exec(content)) !== null) {
    const idx = parseInt(match[1], 10) - 1;
    if (!blanks.includes(idx)) blanks.push(idx);
  }
  return blanks;
}

export default function QuestionCreationPage({ editMode = false, questionData = null, onSuccess = null }) {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const editQuestionId = searchParams.get('edit');

  // Determine if we're in edit mode based on props or URL parameter
  const isEditMode = editMode || !!editQuestionId;

  // Debug logging
  // console.log('QuestionCreationPage props:', { editMode, questionData, onSuccess });
  // console.log('isEditMode:', isEditMode);

  // Ensure proper initialization with default values for edit mode
  const initializeQuestion = () => {
    // console.log('initializeQuestion called with isEditMode:', isEditMode, 'questionData:', questionData);
    if (isEditMode && questionData) {
      // Always treat options as an array
      // Convert from backend format (objects with label/text) to form format (strings)
      let options = [];

      // First, ensure options is an array (might be JSON string)
      let optionsArray = questionData.options;
      if (typeof optionsArray === 'string') {
        try {
          optionsArray = JSON.parse(optionsArray);
        } catch (e) {
          console.error('Error parsing options JSON:', e);
          optionsArray = [];
        }
      }

      if (Array.isArray(optionsArray) && optionsArray.length > 0) {
        // Check if options are objects (from backend) or strings (already in form format)
        if (typeof optionsArray[0] === 'object' && optionsArray[0] !== null) {
          // Backend format: [{label: 'A', text: '...'}, ...]
          options = optionsArray.map(opt => opt.text || opt.label || '');
        } else {
          // Already in form format: ['Option 1', 'Option 2', ...]
          options = optionsArray;
        }
      } else if (Array.isArray(optionsArray) && optionsArray.length === 0) {
        // Empty array, use default
        options = defaultState.options;
      } else {
        options = defaultState.options;
      }

      // Ensure we have at least 2 options
      if (options.length < 2) {
        while (options.length < 2) {
          options.push('');
        }
      }

      // Ensure correctAnswers is always an array
      let correctAnswers = [];
      if (questionData.correctAnswers && Array.isArray(questionData.correctAnswers)) {
        correctAnswers = questionData.correctAnswers;
      } else if (questionData.correct_answers && Array.isArray(questionData.correct_answers)) {
        correctAnswers = questionData.correct_answers;
      } else if (questionData.correct_answer !== null && questionData.correct_answer !== undefined) {
        // Handle single correct answer
        // For single choice, correct_answer is a label like "A", need to find the index
        if (questionData.question_type === 'single_choice' && Array.isArray(optionsArray) && optionsArray.length > 0) {
          // Options from backend are objects with label property: [{label: 'A', text: '...'}, ...]
          const optionIndex = optionsArray.findIndex(opt => {
            if (typeof opt === 'object' && opt !== null) {
              return opt.label === questionData.correct_answer || opt.label === String(questionData.correct_answer);
            }
            return false;
          });
          if (optionIndex !== -1) {
            correctAnswers = [optionIndex];
          } else {
            // Fallback: if correct_answer is already a number/index, use it
            const numAnswer = Number(questionData.correct_answer);
            if (!isNaN(numAnswer) && numAnswer >= 0 && numAnswer < optionsArray.length) {
              correctAnswers = [numAnswer];
            } else {
              // Last resort: use 0 as default
              correctAnswers = [0];
            }
          }
        } else {
          // For other types (like true/false), use the value directly
          correctAnswers = [questionData.correct_answer];
        }
      }

      return {
        ...defaultState,
        ...questionData,
        // Ensure arrays are properly initialized
        options: options,
        correctAnswers: correctAnswers,
        acceptable_answers: questionData.acceptable_answers || [''],
        tags: questionData.tags || [],
        hints: questionData.hints || [],
        blanks: questionData.blanks || [''],
        coding_details: questionData.coding_details || defaultState.coding_details
      };
    }
    return defaultState;
  };

  const [question, setQuestion] = useState(initializeQuestion);
  const [preview, setPreview] = useState(false);
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState([]);
  const [tags, setTags] = useState([]);
  const [availableTags, setAvailableTags] = useState([]);
  const contentRef = useRef();
  const [fillBlankOptions, setFillBlankOptions] = useState([]); // [{options: ['', '', '', ''], correct: 0}]
  const [subcategories, setSubcategories] = useState([]);
  const [showCategoryDialog, setShowCategoryDialog] = useState(false);
  const [newCategory, setNewCategory] = useState({ name: '', parent_id: null });
  const [addingCategory, setAddingCategory] = useState(false);
  const [addingSubcategory, setAddingSubcategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newSubcategoryName, setNewSubcategoryName] = useState('');
  const [newTagName, setNewTagName] = useState('');
  const [filteredTags, setFilteredTags] = useState([]);
  const [testCaseResults, setTestCaseResults] = useState([]);
  const [isVerifying, setIsVerifying] = useState(false);

  // Helper function to map language names to Monaco Editor language codes
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
      'rust': 'rust'
    };
    return languageMap[lang] || 'javascript';
  };

  // Load categories and tags on component mount
  useEffect(() => {
    loadCategories();
    loadTags();
  }, []);

  // Fetch subcategories when category changes
  useEffect(() => {
    loadSubcategories();
  }, []);


  // Fetch question data when in edit mode from URL parameter
  useEffect(() => {
    const fetchQuestionData = async () => {
      if (editQuestionId && !questionData) {
        try {
          setLoading(true);
          const response = await apiService.get(`/question-bank/questions/${editQuestionId}`);
          if (response.success) {
            const fetchedQuestionData = response.data;

            // Transform options from backend format to frontend format
            let options = [];
            let optionsArray = fetchedQuestionData.options;

            // Parse if it's a JSON string
            if (typeof optionsArray === 'string') {
              try {
                optionsArray = JSON.parse(optionsArray);
              } catch (e) {
                console.error('Error parsing options JSON:', e);
                optionsArray = [];
              }
            }

            // Transform options based on format
            if (Array.isArray(optionsArray) && optionsArray.length > 0) {
              if (typeof optionsArray[0] === 'object' && optionsArray[0] !== null) {
                // Backend format: [{label: 'A', text: '...'}, ...]
                options = optionsArray.map(opt => opt.text || opt.label || '');
              } else {
                // Already in form format: ['Option 1', 'Option 2', ...]
                options = optionsArray;
              }
            } else {
              options = defaultState.options;
            }

            // Ensure at least 2 options for choice questions
            if (['multiple_choice', 'single_choice'].includes(fetchedQuestionData.question_type)) {
              while (options.length < 2) {
                options.push('');
              }
            }

            // Transform correctAnswers from backend format to frontend format
            let correctAnswers = [];

            if (fetchedQuestionData.correctAnswers && Array.isArray(fetchedQuestionData.correctAnswers)) {
              correctAnswers = fetchedQuestionData.correctAnswers;
            } else if (fetchedQuestionData.correct_answers && Array.isArray(fetchedQuestionData.correct_answers)) {
              correctAnswers = fetchedQuestionData.correct_answers;
            } else if (fetchedQuestionData.correct_answer !== null && fetchedQuestionData.correct_answer !== undefined) {
              // Handle single correct answer
              if (fetchedQuestionData.question_type === 'single_choice' && Array.isArray(optionsArray) && optionsArray.length > 0) {
                // For single choice, correct_answer might be a label like "A" or an index
                if (typeof optionsArray[0] === 'object' && optionsArray[0] !== null) {
                  // Backend format with labels - find the index
                  const optionIndex = optionsArray.findIndex(opt =>
                    opt.label === fetchedQuestionData.correct_answer ||
                    opt.label === String(fetchedQuestionData.correct_answer)
                  );
                  if (optionIndex !== -1) {
                    correctAnswers = [optionIndex];
                  } else {
                    // Fallback: try as numeric index
                    const numAnswer = Number(fetchedQuestionData.correct_answer);
                    if (!isNaN(numAnswer) && numAnswer >= 0 && numAnswer < optionsArray.length) {
                      correctAnswers = [numAnswer];
                    } else {
                      correctAnswers = [0];
                    }
                  }
                } else {
                  // Already numeric index
                  const numAnswer = Number(fetchedQuestionData.correct_answer);
                  if (!isNaN(numAnswer)) {
                    correctAnswers = [numAnswer];
                  } else {
                    correctAnswers = [0];
                  }
                }
              } else {
                // For other types (true/false, etc.), use value directly
                correctAnswers = [fetchedQuestionData.correct_answer];
              }
            }

            // Transform acceptable_answers
            let acceptable_answers = fetchedQuestionData.acceptable_answers || [''];
            if (typeof acceptable_answers === 'string') {
              try {
                acceptable_answers = JSON.parse(acceptable_answers);
              } catch (e) {
                acceptable_answers = [''];
              }
            }
            if (!Array.isArray(acceptable_answers) || acceptable_answers.length === 0) {
              acceptable_answers = [''];
            }

            // Transform hints
            let hints = fetchedQuestionData.hints || [];
            if (typeof hints === 'string') {
              try {
                hints = JSON.parse(hints);
              } catch (e) {
                hints = [];
              }
            }
            if (!Array.isArray(hints)) {
              hints = [];
            }

            // Transform tags
            let tags = fetchedQuestionData.tags || [];
            if (typeof tags === 'string') {
              try {
                tags = JSON.parse(tags);
              } catch (e) {
                tags = [];
              }
            }
            if (!Array.isArray(tags)) {
              tags = [];
            }

            // Transform blanks
            let blanks = fetchedQuestionData.blanks || [''];
            if (typeof blanks === 'string') {
              try {
                blanks = JSON.parse(blanks);
              } catch (e) {
                blanks = [''];
              }
            }
            if (!Array.isArray(blanks) || blanks.length === 0) {
              blanks = [''];
            }

            setQuestion({
              ...defaultState,
              ...fetchedQuestionData,
              // Use transformed data
              options: options,
              correctAnswers: correctAnswers,
              acceptable_answers: acceptable_answers,
              tags: tags,
              hints: hints,
              blanks: blanks,
              coding_details: fetchedQuestionData.coding_details || defaultState.coding_details
            });
          } else {
            toast({
              title: "Error",
              description: "Failed to load question data",
              variant: "destructive"
            });
            navigate('/question-bank');
          }
        } catch (error) {
          console.error('Error fetching question data:', error);
          toast({
            title: "Error",
            description: "Failed to load question data",
            variant: "destructive"
          });
          navigate('/question-bank');
        } finally {
          setLoading(false);
        }
      }
    };

    fetchQuestionData();
  }, [editQuestionId, questionData, navigate]);

  // Update question state when questionData changes (for edit mode)
  useEffect(() => {
    if (editMode && questionData) {
      // Always treat options as an array
      // Convert from backend format (objects with label/text) to form format (strings)
      let options = [];

      // First, ensure options is an array (might be JSON string)
      let optionsArray = questionData.options;
      if (typeof optionsArray === 'string') {
        try {
          optionsArray = JSON.parse(optionsArray);
        } catch (e) {
          console.error('Error parsing options JSON:', e);
          optionsArray = [];
        }
      }

      if (Array.isArray(optionsArray) && optionsArray.length > 0) {
        // Check if options are objects (from backend) or strings (already in form format)
        if (typeof optionsArray[0] === 'object' && optionsArray[0] !== null) {
          // Backend format: [{label: 'A', text: '...'}, ...]
          options = optionsArray.map(opt => opt.text || opt.label || '');
        } else {
          // Already in form format: ['Option 1', 'Option 2', ...]
          options = optionsArray;
        }
      } else if (Array.isArray(optionsArray) && optionsArray.length === 0) {
        // Empty array, use default
        options = defaultState.options;
      } else {
        options = defaultState.options;
      }

      // Ensure we have at least 2 options
      if (options.length < 2) {
        while (options.length < 2) {
          options.push('');
        }
      }

      // Ensure correctAnswers is always an array
      let correctAnswers = [];
      if (questionData.correctAnswers && Array.isArray(questionData.correctAnswers)) {
        correctAnswers = questionData.correctAnswers;
      } else if (questionData.correct_answers && Array.isArray(questionData.correct_answers)) {
        correctAnswers = questionData.correct_answers;
      } else if (questionData.correct_answer !== null && questionData.correct_answer !== undefined) {
        // Handle single correct answer
        // For single choice, correct_answer is a label like "A", need to find the index
        if (questionData.question_type === 'single_choice' && Array.isArray(optionsArray) && optionsArray.length > 0) {
          // Options from backend are objects with label property: [{label: 'A', text: '...'}, ...]
          const optionIndex = optionsArray.findIndex(opt => {
            if (typeof opt === 'object' && opt !== null) {
              return opt.label === questionData.correct_answer || opt.label === String(questionData.correct_answer);
            }
            return false;
          });
          if (optionIndex !== -1) {
            correctAnswers = [optionIndex];
          } else {
            // Fallback: if correct_answer is already a number/index, use it
            const numAnswer = Number(questionData.correct_answer);
            if (!isNaN(numAnswer) && numAnswer >= 0 && numAnswer < optionsArray.length) {
              correctAnswers = [numAnswer];
            } else {
              // Last resort: use 0 as default
              correctAnswers = [0];
            }
          }
        } else {
          // For other types (like true/false), use the value directly
          correctAnswers = [questionData.correct_answer];
        }
      }

      setQuestion({
        ...defaultState,
        ...questionData,
        // Ensure arrays are properly initialized
        options: options,
        correctAnswers: correctAnswers,
        acceptable_answers: questionData.acceptable_answers || [''],
        tags: questionData.tags || [],
        hints: questionData.hints || [],
        blanks: questionData.blanks || [''],
        coding_details: questionData.coding_details || defaultState.coding_details
      });
    }
  }, [editMode, questionData]);



  const loadCategories = async () => {
    try {
      const response = await apiService.getQuestionCategories();
      if (response.success) {
        // Filter to get only main categories (categories without parent_id)
        const mainCategories = response.data.filter(cat => cat.parent_id === null);
        setCategories(mainCategories);
      }
    } catch (error) {
      console.error('Failed to load categories:', error);
      toast({ title: 'Failed to load categories', variant: 'destructive' });
    }
  };

  const loadSubcategories = async () => {
    try {
      const response = await apiService.getQuestionCategories();
      if (response.success) {
        // Filter to get only subcategories (categories with parent_id)
        const subcats = response.data.filter(cat => cat.parent_id !== null);
        setSubcategories(subcats);
      }
    } catch (error) {
      console.error('Failed to load subcategories:', error);
      toast({ title: 'Failed to load subcategories', variant: 'destructive' });
    }
  };

  const loadTags = async () => {
    try {
      const response = await apiService.getQuestionTags();
      if (response.success) {
        setAvailableTags(response.data);
        setFilteredTags(response.data); // Initialize filtered tags
      }
    } catch (error) {
      console.error('Failed to load tags:', error);
      toast({ title: 'Failed to load tags', variant: 'destructive' });
    }
  };

  const handleTypeChange = (e) => {
    const type = e.target.value;
    setQuestion((q) => ({
      ...defaultState,
      question_type: type,
      // Retain title, content, and basic fields if switching type
      title: q.title,
      content: q.content,
      difficulty_level: q.difficulty_level,
      points: q.points,
      category_id: q.category_id,
      tags: q.tags,
      // Preserve existing coding_details if switching to coding type and we're in edit mode
      coding_details: type === 'coding' ?
        (isEditMode && q.coding_details ? q.coding_details : {
          languages: ['javascript'], // Default to javascript for now
          starter_codes: {
            javascript: '// Write your solution here\n// Example: function solve(input) {\n//   // Your code here\n//   return result;\n// }',
            python: '# Write your solution here\n# Example:\n# def solve(input):\n#     # Your code here\n#     return result',
            java: '// Write your solution here\n// Example:\n// public class Solution {\n//     public static String solve(String input) {\n//         // Your code here\n//         return result;\n//     }\n// }',
            cpp: '// Write your solution here\n// Example:\n// #include <iostream>\n// #include <string>\n// using namespace std;\n// \n// string solve(string input) {\n//     // Your code here\n//     return result;\n// }',
            c: '// Write your solution here\n// Example:\n// #include <stdio.h>\n// #include <string.h>\n// \n// char* solve(char* input) {\n//     // Your code here\n//     return result;\n// }',
            php: '<?php\n// Write your solution here\n// Example:\n// function solve($input) {\n//     // Your code here\n//     return $result;\n// }',
            ruby: '# Write your solution here\n# Example:\n# def solve(input)\n#   # Your code here\n#   result\n# end',
            go: 'package main\n\n// Write your solution here\n// Example:\n// func solve(input string) string {\n//     // Your code here\n//     return result\n// }',
            rust: '// Write your solution here\n// Example:\n// fn solve(input: &str) -> String {\n//     // Your code here\n//     result\n// }'
          },
          solution_codes: {
            javascript: '',
            python: '',
            java: '',
            cpp: '',
            c: '',
            php: '',
            ruby: '',
            go: '',
            rust: ''
          },
          test_cases: []
        }) : defaultState.coding_details
    }));
  };

  const handleOptionChange = (idx, value) => {
    setQuestion((q) => {
      const options = [...(q.options || [])];
      options[idx] = value;
      return { ...q, options };
    });
  };

  const getLanguageSpecificStarterCode = (language) => {
    switch (language) {
      case 'javascript':
        return '// Write your solution here\n// Example: function solve(input) {\n//   // Your code here\n//   return result;\n// }';
      case 'python':
        return '# Write your solution here\n# Example:\n# def solve(input):\n#     # Your code here\n#     return result';
      case 'java':
        return '// Write your solution here\n// Example:\n// public class Solution {\n//     public static String solve(String input) {\n//         // Your code here\n//         return result;\n//     }\n// }';
      case 'cpp':
        return '// Write your solution here\n// Example:\n// #include <iostream>\n// #include <string>\n// using namespace std;\n// \n// string solve(string input) {\n//     // Your code here\n//     return result;\n// }';
      case 'c':
        return '// Write your solution here\n// Example:\n// #include <stdio.h>\n// #include <string.h>\n// \n// char* solve(char* input) {\n//     // Your code here\n//     return result;\n// }';
      default:
        return '// Write your solution here\n// Add your code implementation';
    }
  };

  const addOption = () => {
    setQuestion((q) => ({ ...q, options: [...(q.options || []), ''] }));
  };

  const removeOption = (idx) => {
    setQuestion((q) => {
      const options = (q.options || []).filter((_, i) => i !== idx);
      return { ...q, options };
    });
  };

  const handleCorrectAnswerChange = (idx, checked) => {
    setQuestion((q) => {
      let correctAnswers = [...(q.correctAnswers || [])];
      if (checked) {
        correctAnswers.push(idx);
      } else {
        correctAnswers = correctAnswers.filter((i) => i !== idx);
      }
      return { ...q, correctAnswers };
    });
  };

  const handleBlanksChange = (idx, value) => {
    setQuestion((q) => {
      const blanks = [...(q.blanks || [])];
      blanks[idx] = value;
      return { ...q, blanks };
    });
  };

  const addBlank = () => {
    setQuestion((q) => ({ ...q, blanks: [...(q.blanks || []), ''] }));
  };

  const removeBlank = (idx) => {
    setQuestion((q) => {
      const blanks = (q.blanks || []).filter((_, i) => i !== idx);
      return { ...q, blanks };
    });
  };

  const handleTagChange = (tagId, checked) => {
    setQuestion((q) => {
      let tags = [...(q.tags || [])];
      if (checked) {
        tags.push(tagId);
      } else {
        tags = tags.filter((id) => id !== tagId);
      }
      return { ...q, tags };
    });

    // Clear search input when a tag is selected
    if (checked) {
      setNewTagName('');
    }
  };

  const handleCreateCustomTag = async () => {
    if (!newTagName.trim()) return;

    // Check if tag already exists
    const existingTag = availableTags.find(tag =>
      tag.name.toLowerCase() === newTagName.trim().toLowerCase()
    );

    if (existingTag) {
      // If tag exists, just select it instead of creating a new one
      if (!question.tags || !question.tags.includes(existingTag.id)) {
        handleTagChange(existingTag.id, true);
      }
      setNewTagName('');
      return;
    }

    try {
      const res = await apiService.createQuestionTag({ name: newTagName.trim() });
      if (res.success) {
        await loadTags(); // Refresh available tags
        // Automatically select the newly created tag
        if (res.data && res.data.id) {
          handleTagChange(res.data.id, true);
        }
        setNewTagName('');
        toast({
          title: 'Tag created successfully!',
          description: `Tag "${newTagName.trim()}" has been added and selected.`,
          variant: 'default'
        });
      } else {
        toast({
          title: 'Failed to create tag',
          description: res.message || 'Please try again.',
          variant: 'destructive'
        });
      }
    } catch (error) {
      console.error('Error creating tag:', error);
      toast({
        title: 'Failed to create tag',
        description: error.message || 'Please try again.',
        variant: 'destructive'
      });
    }
  };

  const handleVerifyTestCases = async (language) => {
    if (!question.coding_details.solution_codes[language]?.trim() || !question.coding_details.test_cases || question.coding_details.test_cases.length === 0) {
      toast({ title: 'Please provide solution code and test cases', variant: 'destructive' });
      return;
    }

    setIsVerifying(true);
    setTestCaseResults([]);

    try {
      // Show progress toast
      toast({
        title: 'Verifying test cases...',
        description: `Processing ${question.coding_details.test_cases.length} test cases`,
        variant: 'default'
      });

      // Use batch execution endpoint for efficient Docker-based verification
      const response = await apiService.runTestCases({
        sourceCode: question.coding_details.solution_codes[language],
        language: language,
        testCases: question.coding_details.test_cases.map(tc => ({
          input: tc.input || '',
          expectedOutput: tc.output || '',
          input_data: tc.input || '',
          expected_output: tc.output || ''
        }))
      });

      if (!response.success) {
        throw new Error(response.message || 'Test case verification failed');
      }

      // Process batch results from Docker service
      const batchResults = response.data.results || [];
      const results = batchResults.map((testResult, i) => {
        const testCase = question.coding_details.test_cases[i];
        const verdict = testResult.result?.verdict || {};
        const isCorrect = verdict.status === 'accepted';

        return {
          testCaseIndex: i,
          input: testCase.input,
          expectedOutput: testCase.output,
          actualOutput: testResult.result?.output || '',
          isCorrect: isCorrect,
          error: testResult.result?.error || null,
          executionTime: testResult.result?.time || 0,
          memoryUsed: testResult.result?.memory || 0
        };
      });

      setTestCaseResults(results);

      const passedTests = results.filter(r => r.isCorrect).length;
      const totalTests = results.length;

      if (passedTests === totalTests) {
        toast({
          title: 'All test cases passed! ✅',
          description: `${passedTests}/${totalTests} test cases successful`,
          variant: 'default'
        });
      } else {
        toast({
          title: 'Some test cases failed! ❌',
          description: `${passedTests}/${totalTests} test cases passed`,
          variant: 'destructive'
        });
      }

    } catch (error) {
      console.error('Error verifying test cases:', error);
      toast({
        title: 'Failed to verify test cases',
        description: error.message || 'Please check your code and try again.',
        variant: 'destructive'
      });
    } finally {
      setIsVerifying(false);
    }
  };

  // Helper function to execute code safely using backend API
  const executeCode = async (code, input, language) => {
    try {
      const response = await apiService.executeCode({
        sourceCode: code,
        language: language,
        input: input || '',
        expectedOutput: ''
      });

      if (!response.success) {
        throw new Error(response.message || 'Code execution failed');
      }

      return {
        output: response.data.output || '',
        error: response.data.error || '',
        executionTime: response.data.time || 0,
        memoryUsed: response.data.memory || 0
      };
    } catch (error) {
      console.error('Code execution error:', error);
      throw new Error(`Code execution failed: ${error.message}`);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Basic validation
      if (!question.content.trim()) {
        toast({ title: 'Question content is required', variant: 'destructive' });
        return;
      }

      // Title is mandatory only for coding questions
      if (question.question_type === 'coding' && !question.title.trim()) {
        toast({ title: 'Title is required for coding questions', variant: 'destructive' });
        return;
      }

      // Type-specific validation
      if (['multiple_choice', 'single_choice'].includes(question.question_type)) {
        if ((question.options || []).length < 2) {
          toast({ title: 'At least 2 options are required', variant: 'destructive' });
          return;
        }
        if ((question.correctAnswers || []).length === 0) {
          toast({ title: 'Please select at least one correct answer', variant: 'destructive' });
          return;
        }
        if (question.question_type === 'single_choice' && (question.correctAnswers || []).length > 1) {
          toast({ title: 'Single choice questions can only have one correct answer', variant: 'destructive' });
          return;
        }
      }

      if (question.question_type === 'true_false' && (question.correctAnswers || []).length === 0) {
        toast({ title: 'Please select the correct answer (True or False)', variant: 'destructive' });
        return;
      }

      if (question.question_type === 'short_answer' && ((question.acceptable_answers || []).length === 0 || (question.acceptable_answers || []).every(a => !a.trim()))) {
        toast({ title: 'Please provide at least one acceptable answer', variant: 'destructive' });
        return;
      }

      if (question.question_type === 'fill_blanks' && (question.blanks || []).some((b) => !b.trim())) {
        toast({ title: 'All blanks must be filled', variant: 'destructive' });
        return;
      }

      if (question.question_type === 'coding') {
        if ((question.coding_details?.languages || []).length === 0) {
          toast({ title: 'Please select at least one programming language for coding questions', variant: 'destructive' });
          return;
        }

        // Check if at least one language has starter code
        const hasStarterCode = (question.coding_details?.languages || []).some(lang =>
          (question.coding_details?.starter_codes?.[lang] || '').trim()
        );
        if (!hasStarterCode) {
          toast({ title: 'At least one language must have starter code', variant: 'destructive' });
          return;
        }

        // Check if at least one language has solution code
        const hasSolutionCode = (question.coding_details?.languages || []).some(lang =>
          (question.coding_details?.solution_codes?.[lang] || '').trim()
        );
        if (!hasSolutionCode) {
          toast({ title: 'At least one language must have solution code', variant: 'destructive' });
          return;
        }

        if ((question.coding_details?.test_cases || []).length === 0) {
          toast({ title: 'Coding questions must have at least one test case', variant: 'destructive' });
          return;
        }
        // Check if all test cases have input and output
        const invalidTestCases = (question.coding_details?.test_cases || []).filter(tc => !tc.input?.trim() || !tc.output?.trim());
        if (invalidTestCases.length > 0) {
          toast({ title: 'All test cases must have both input and expected output', variant: 'destructive' });
          return;
        }
      }

      // Prepare data for backend
      const questionData = {
        title: question.title,
        content: question.content,
        question_type: question.question_type,
        difficulty_level: question.difficulty_level,
        points: question.points,
        time_limit_seconds: question.time_limit_seconds,
        category_id: question.category_id,
        status: question.status || 'draft',
        tags: question.tags,
        explanation: question.explanation,
        hints: question.hints,
      };

      // Add type-specific data
      switch (question.question_type) {
        case 'multiple_choice':
          questionData.options = question.options || [];
          questionData.correct_answers = question.correctAnswers || [];
          break;
        case 'single_choice':
          questionData.options = question.options || [];
          questionData.correct_answer = (question.correctAnswers || [])[0];
          break;
        case 'true_false':
          questionData.correct_answer = (question.correctAnswers || [])[0];
          break;
        case 'short_answer':
          questionData.acceptable_answers = question.acceptable_answers || [];
          break;
        case 'essay':
          questionData.rubric = question.rubric || '';
          break;
        case 'coding':
          questionData.coding_details = {
            languages: question.coding_details?.languages || [],
            starter_codes: question.coding_details?.starter_codes || {},
            solution_codes: question.coding_details?.solution_codes || {},
            test_cases: question.coding_details?.test_cases || []
          };
          break;
        case 'fill_blanks':
          questionData.blanks = fillBlankOptions.map(opt => ({
            options: opt.options || [],
            correct: opt.correct || 0
          }));
          break;
      }

      // Add subcategory_id (always include, even if null)
      questionData.subcategory_id = question.subcategory_id || null;

      // Submit to backend
      let response;
      if (isEditMode && question.id) {
        response = await apiService.updateQuestion(question.id, questionData);
      } else {
        response = await apiService.createQuestion(questionData);
      }

      if (response.success) {
        const action = isEditMode ? 'updated' : 'created';
        toast({
          title: `Question ${action} successfully!`,
          description: isEditMode ? 'Question has been updated' : `Question ID: ${response.data.id}`,
          variant: 'default'
        });

        if (isEditMode && onSuccess) {
          onSuccess(response.data);
        } else if (isEditMode && editQuestionId) {
          // If editing from URL, navigate back to question bank
          navigate('/question-bank');
        } else {
          setQuestion(defaultState);
          setPreview(false);
        }
      } else {
        const action = isEditMode ? 'update' : 'create';
        toast({ title: response.message || `Failed to ${action} question`, variant: 'destructive' });
      }
    } catch (error) {
      console.error('Create question error:', error);
      toast({
        title: 'Failed to create question',
        description: error.message,
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  // Insert blank at cursor
  const handleInsertBlank = () => {
    const textarea = contentRef.current;
    if (!textarea) return;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const value = question.content;
    // Find next blank number
    const blanks = extractBlanks(value);
    const nextNum = blanks.length + 1;
    const insert = `[[blank${nextNum}]]`;
    const newValue = value.slice(0, start) + insert + value.slice(end);
    setQuestion(q => ({ ...q, content: newValue }));
    setTimeout(() => {
      textarea.focus();
      textarea.selectionStart = textarea.selectionEnd = start + insert.length;
    }, 0);
  };

  // Update fillBlankOptions when content changes
  React.useEffect(() => {
    if (question.question_type !== 'fill_blanks') return;
    const blanks = extractBlanks(question.content);
    setFillBlankOptions(prev => {
      // Ensure we have an entry for each blank
      const arr = [...prev];
      blanks.forEach((idx, i) => {
        if (!arr[i]) arr[i] = { options: ['', '', '', ''], correct: 0 };
      });
      return arr.slice(0, blanks.length);
    });
  }, [question.content, question.question_type]);

  // Filter available tags based on search input
  React.useEffect(() => {
    const lowerCaseSearch = newTagName.toLowerCase().trim();
    if (!lowerCaseSearch) {
      setFilteredTags(availableTags);
      return;
    }

    const matchingTags = availableTags.filter(tag =>
      tag.name.toLowerCase().includes(lowerCaseSearch)
    );

    // If no exact match and search term is not empty, show option to create new tag
    const exactMatch = availableTags.find(tag =>
      tag.name.toLowerCase() === lowerCaseSearch
    );

    if (!exactMatch && lowerCaseSearch.length > 0) {
      setFilteredTags([
        ...matchingTags,
        { id: 'new', name: `Create "${newTagName.trim()}"`, isNew: true }
      ]);
    } else {
      setFilteredTags(matchingTags);
    }
  }, [newTagName, availableTags]);

  return (
    <div className={`space-y-6 ${editMode ? 'w-full' : 'w-full'}`}>
      <Card className="p-6 mb-6">
        <h2 className="text-2xl font-bold mb-4">
          {isEditMode ? 'Edit Question' : 'Create New Question'}
        </h2>
        <form onSubmit={handleSubmit}>
          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block mb-1 font-medium">
                Question Title
                {question.question_type === 'coding' && <span className="text-red-500">*</span>}
              </label>
              <Input
                value={question.title || ''}
                onChange={e => setQuestion(q => ({ ...q, title: e.target.value }))}
                required={question.question_type === 'coding'}
                placeholder={question.question_type === 'coding' ? "Enter question title (required)" : "Enter question title (optional)"}
              />
            </div>
            <div>
              <label className="block mb-1 font-medium">Question Type</label>
              <select
                value={question.question_type}
                onChange={handleTypeChange}
                className="w-full border rounded p-2"
              >
                {QUESTION_TYPES.map((qt) => (
                  <option key={qt.value} value={qt.value}>{qt.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div>
              <label className="block mb-1 font-medium">Difficulty Level</label>
              <select
                value={question.difficulty_level}
                onChange={e => setQuestion(q => ({ ...q, difficulty_level: e.target.value }))}
                className="w-full border rounded p-2"
              >
                {DIFFICULTY_LEVELS.map((level) => (
                  <option key={level.value} value={level.value}>{level.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block mb-1 font-medium">Points</label>
              <Input
                type="number"
                min={1}
                value={question.points}
                onChange={e => setQuestion(q => ({ ...q, points: Number(e.target.value) }))}
                required
              />
            </div>
            <div>
              <label className="block mb-1 font-medium">Time Limit (seconds, optional)</label>
              <Input
                type="number"
                min={1}
                value={question.time_limit_seconds || ''}
                onChange={e => setQuestion(q => ({ ...q, time_limit_seconds: e.target.value ? Number(e.target.value) : null }))}
                placeholder="No limit"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block mb-1 font-medium">Category <span className="text-red-500">*</span></label>
              <select
                value={question.category_id || ''}
                onChange={e => {
                  if (e.target.value === 'add_new') {
                    setAddingCategory(true);
                  } else {
                    setQuestion(q => ({ ...q, category_id: e.target.value }));
                    setAddingCategory(false);
                  }
                }}
                className="w-full border rounded p-2"
                required
              >
                <option value="">Select Category</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>{category.name}</option>
                ))}
                <option value="add_new">+ Add New Category</option>
              </select>
              {addingCategory && (
                <div className="flex gap-2 mt-2">
                  <Input
                    value={newCategoryName}
                    onChange={e => setNewCategoryName(e.target.value)}
                    placeholder="New category name"
                  />
                  <Button onClick={async () => {
                    if (!newCategoryName.trim()) return;
                    try {

                      const res = await apiService.createQuestionCategory({
                        name: newCategoryName,
                        parent_id: null // Ensure it's a main category
                      });
                      if (res.success) {
                        await loadCategories();
                        setQuestion(q => ({ ...q, category_id: res.data.id }));
                        setNewCategoryName('');
                        setAddingCategory(false);
                        toast({
                          title: "Success",
                          description: "Category created successfully!"
                        });
                      }
                    } catch (error) {
                      console.error('Error creating category:', error);
                      toast({
                        variant: "destructive",
                        title: "Error",
                        description: error.message || "Failed to create category"
                      });
                    }
                  }}>Add</Button>
                  <Button variant="secondary" onClick={() => { setAddingCategory(false); setNewCategoryName(''); }}>Cancel</Button>
                </div>
              )}
            </div>
            <div>
              <label className="block mb-1 font-medium">Subcategory <span className="text-red-500">*</span></label>
              <select
                value={question.subcategory_id || ''}
                onChange={e => {
                  if (e.target.value === 'add_new') {
                    setAddingSubcategory(true);
                  } else {
                    setQuestion(q => ({ ...q, subcategory_id: e.target.value }));
                    setAddingSubcategory(false);
                  }
                }}
                className="w-full border rounded p-2"
                required
              >
                <option value="">Select Subcategory</option>
                {subcategories.map((subcat) => (
                  <option key={subcat.id} value={subcat.id}>{subcat.name}</option>
                ))}
                <option value="add_new">+ Add New Subcategory</option>
              </select>
              {addingSubcategory && (
                <div className="flex gap-2 mt-2">
                  <Input
                    value={newSubcategoryName}
                    onChange={e => setNewSubcategoryName(e.target.value)}
                    placeholder="New subcategory name"
                  />
                  <Button onClick={async () => {
                    if (!newSubcategoryName.trim()) return;
                    try {

                      const res = await apiService.createQuestionCategory({
                        name: newSubcategoryName,
                        parent_id: question.category_id || null
                      });
                      if (res.success) {
                        // Refresh subcategories
                        await loadSubcategories();
                        setQuestion(q => ({ ...q, subcategory_id: res.data.id }));
                        setNewSubcategoryName('');
                        setAddingSubcategory(false);
                        toast({
                          title: "Success",
                          description: "Subcategory created successfully!"
                        });
                      }
                    } catch (error) {
                      console.error('Error creating subcategory:', error);
                      toast({
                        variant: "destructive",
                        title: "Error",
                        description: error.message || "Failed to create subcategory"
                      });
                    }
                  }}>Add</Button>
                  <Button variant="secondary" onClick={() => { setAddingSubcategory(false); setNewSubcategoryName(''); }}>Cancel</Button>
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block mb-1 font-medium">Status</label>
              <Select
                value={question.status || 'draft'}
                onValueChange={value => setQuestion(q => ({ ...q, status: value }))}
              >
                <SelectTrigger className="w-full">
                  <div className="flex items-center space-x-2">
                    <div className={`w-2 h-2 rounded-full ${question.status === 'active' ? 'bg-green-500' :
                      question.status === 'draft' ? 'bg-yellow-500' :
                        question.status === 'archived' ? 'bg-gray-600' : 'bg-gray-500'
                      }`}></div>
                    <span>{question.status === 'active' ? 'Active' : question.status === 'draft' ? 'Draft' : question.status === 'archived' ? 'Archived' : 'Draft'}</span>
                  </div>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft" className="cursor-pointer">
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
                      <span className="font-medium">Draft</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="active" className="cursor-pointer">
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 rounded-full bg-green-500"></div>
                      <span className="font-medium">Active</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="archived" className="cursor-pointer">
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 rounded-full bg-gray-600"></div>
                      <span className="font-medium">Archived</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="block mb-1 font-medium">Tags</label>

              {/* Tags Section - Selected tags above, search below */}
              <div className={`border border-gray-300 rounded-lg p-3 w-full flex flex-col ${newTagName.trim() ? 'h-[200px]' : 'h-auto'}`}>
                {/* Selected Tags - Above Search */}
                <div className="mb-3">
                  {question.tags && question.tags.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {question.tags.map((tagId) => {
                        const tag = availableTags.find(t => t.id === tagId);
                        return tag ? (
                          <div
                            key={tagId}
                            className="flex items-center gap-1 px-2 py-1 rounded-full bg-purple-600 text-white text-sm font-medium"
                          >
                            <span>{tag.name}</span>
                            <button
                              type="button"
                              onClick={() => handleTagChange(tagId, false)}
                              className="ml-1 hover:text-red-200"
                            >
                              ×
                            </button>
                          </div>
                        ) : null;
                      })}
                    </div>
                  ) : (
                    <span className="text-gray-500 text-sm">No tags selected</span>
                  )}
                </div>

                {/* Search and Add Tag Input */}
                <div className="flex gap-2">
                  <Input
                    placeholder="Search tags or type to create custom tag..."
                    value={newTagName}
                    onChange={e => setNewTagName(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        if (newTagName.trim()) {
                          handleCreateCustomTag();
                        }
                      }
                    }}
                    className="flex-1"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleCreateCustomTag}
                    disabled={!newTagName.trim()}
                  >
                    Add Tag
                  </Button>
                </div>

                {/* Available Tags Section - Only show when typing */}
                {newTagName.trim() && (
                  <div className="mt-3 flex-1 overflow-y-auto">
                    {filteredTags.length > 0 ? (
                      <div className="p-3 border border-gray-200 rounded-lg bg-gray-50">
                        <div className="flex flex-wrap gap-2">
                          {filteredTags.map((tag) => {
                            // Handle "Create new tag" option
                            if (tag.isNew) {
                              return (
                                <button
                                  key={tag.id}
                                  type="button"
                                  onClick={() => handleCreateCustomTag()}
                                  className="px-3 py-1 rounded-full border-2 border-dashed border-green-500 text-green-700 bg-green-50 hover:bg-green-100 transition-colors text-sm font-medium"
                                >
                                  {tag.name}
                                </button>
                              );
                            }

                            const selected = question.tags && question.tags.includes(tag.id);
                            return (
                              <button
                                key={tag.id}
                                type="button"
                                onClick={() => handleTagChange(tag.id, !selected)}
                                className={`px-3 py-1 rounded-full border transition-colors text-sm font-medium ${selected
                                  ? 'bg-purple-600 text-white border-purple-600'
                                  : 'bg-gray-100 text-gray-800 border-gray-300 hover:bg-purple-100'
                                  }`}
                              >
                                {tag.name}
                                {selected && <span className="ml-1">✓</span>}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    ) : (
                      <div className="p-3 border border-gray-200 rounded-lg bg-gray-50 flex items-center justify-center h-full">
                        <p className="text-gray-500 text-sm">No matching tags found</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* General Question Content for types without specific content sections */}
          {!['multiple_choice', 'single_choice', 'true_false', 'short_answer', 'essay', 'coding', 'fill_blanks'].includes(question.question_type) && (
            <div className="mb-4">
              <label className="block mb-1 font-medium">Question Content</label>
              <Textarea
                value={question.content || ''}
                onChange={e => setQuestion(q => ({ ...q, content: e.target.value }))}
                rows={4}
                placeholder="Enter your question here..."
                required
              />
            </div>
          )}

          {/* Multiple Choice and Single Choice Options */}
          {['multiple_choice', 'single_choice'].includes(question.question_type) && (
            <div className="mb-4">
              <label className="block mb-1 font-medium">Question Content</label>
              <Textarea
                value={question.content || ''}
                onChange={e => setQuestion(q => ({ ...q, content: e.target.value }))}
                rows={4}
                placeholder="Enter your question here..."
                required
              />

              <div className="mt-4">
                <div className="flex items-center justify-between mb-2">
                  <label className="block font-medium">Options</label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addOption}
                    disabled={(question.options || []).length >= 8}
                  >
                    + Add Option
                  </Button>
                </div>

                <div className="space-y-2">
                  {(question.options || []).map((option, idx) => (
                    <div key={idx} className="flex items-center gap-2 p-3 border rounded-lg bg-gray-50">
                      <div className="flex-1">
                        <Input
                          value={option}
                          onChange={e => handleOptionChange(idx, e.target.value)}
                          placeholder={`Option ${idx + 1}`}
                          required
                        />
                      </div>

                      <div className="flex items-center gap-2">
                        {question.question_type === 'multiple_choice' ? (
                          <label className="flex items-center gap-1 text-sm">
                            <input
                              type="checkbox"
                              checked={Array.isArray(question.correctAnswers) && question.correctAnswers.includes(idx)}
                              onChange={e => handleCorrectAnswerChange(idx, e.target.checked)}
                              className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                            />
                            Correct
                          </label>
                        ) : (
                          <label className="flex items-center gap-1 text-sm">
                            <input
                              type="radio"
                              name="correct-answer"
                              checked={Array.isArray(question.correctAnswers) && question.correctAnswers.includes(idx)}
                              onChange={() => setQuestion(q => ({ ...q, correctAnswers: [idx] }))}
                              className="w-4 h-4 text-purple-600 border-gray-300 focus:ring-purple-500"
                            />
                            Correct
                          </label>
                        )}

                        {(question.options || []).length > 2 && (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => removeOption(idx)}
                            className="text-red-600 hover:text-red-700"
                          >
                            Remove
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {(question.options || []).length < 2 && (
                  <p className="text-sm text-red-600 mt-1">At least 2 options are required</p>
                )}

                {(!Array.isArray(question.correctAnswers) || question.correctAnswers.length === 0) && (
                  <p className="text-sm text-red-600 mt-1">Please select at least one correct answer</p>
                )}
              </div>
            </div>
          )}

          {/* True/False Question */}
          {question.question_type === 'true_false' && (
            <div className="mb-4">
              <label className="block mb-1 font-medium">Question Content</label>
              <Textarea
                value={question.content || ''}
                onChange={e => setQuestion(q => ({ ...q, content: e.target.value }))}
                rows={4}
                placeholder="Enter your True/False question here..."
                required
              />

              <div className="mt-4">
                <label className="block mb-2 font-medium">Correct Answer</label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="true-false"
                      checked={Array.isArray(question.correctAnswers) && question.correctAnswers.includes(true)}
                      onChange={() => setQuestion(q => ({ ...q, correctAnswers: [true] }))}
                      className="w-4 h-4 text-purple-600 border-gray-300 focus:ring-purple-500"
                    />
                    True
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="true-false"
                      checked={Array.isArray(question.correctAnswers) && question.correctAnswers.includes(false)}
                      onChange={() => setQuestion(q => ({ ...q, correctAnswers: [false] }))}
                      className="w-4 h-4 text-purple-600 border-gray-300 focus:ring-purple-500"
                    />
                    False
                  </label>
                </div>

                {(!Array.isArray(question.correctAnswers) || question.correctAnswers.length === 0) && (
                  <p className="text-sm text-red-600 mt-1">Please select the correct answer</p>
                )}
              </div>
            </div>
          )}

          {/* Short Answer Question */}
          {question.question_type === 'short_answer' && (
            <div className="mb-4">
              <label className="block mb-1 font-medium">Question Content</label>
              <Textarea
                value={question.content || ''}
                onChange={e => setQuestion(q => ({ ...q, content: e.target.value }))}
                rows={4}
                placeholder="Enter your short answer question here..."
                required
              />

              <div className="mt-4">
                <label className="block mb-2 font-medium">Acceptable Answers</label>
                <div className="space-y-2">
                  {(question.acceptable_answers || ['']).map((answer, idx) => (
                    <div key={idx} className="flex gap-2">
                      <Input
                        value={answer}
                        onChange={e => {
                          const newAnswers = [...(question.acceptable_answers || [''])];
                          newAnswers[idx] = e.target.value;
                          setQuestion(q => ({ ...q, acceptable_answers: newAnswers }));
                        }}
                        placeholder={`Acceptable answer ${idx + 1}`}
                        required
                      />
                      {(question.acceptable_answers || []).length > 1 && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            const newAnswers = (question.acceptable_answers || []).filter((_, i) => i !== idx);
                            setQuestion(q => ({ ...q, acceptable_answers: newAnswers }));
                          }}
                          className="text-red-600 hover:text-red-700"
                        >
                          Remove
                        </Button>
                      )}
                    </div>
                  ))}
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const newAnswers = [...(question.acceptable_answers || ['']), ''];
                      setQuestion(q => ({ ...q, acceptable_answers: newAnswers }));
                    }}
                  >
                    + Add Answer
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Essay Question */}
          {question.question_type === 'essay' && (
            <div className="mb-4">
              <label className="block mb-1 font-medium">Question Content</label>
              <Textarea
                value={question.content || ''}
                onChange={e => setQuestion(q => ({ ...q, content: e.target.value }))}
                rows={4}
                placeholder="Enter your essay question here..."
                required
              />

              <div className="mt-4">
                <label className="block mb-1 font-medium">Rubric / Grading Guidelines</label>
                <Textarea
                  value={question.rubric || ''}
                  onChange={e => setQuestion(q => ({ ...q, rubric: e.target.value }))}
                  rows={4}
                  placeholder="Describe what a good answer should include, grading criteria, etc..."
                />
              </div>
            </div>
          )}

          {/* Coding Question */}
          {question.question_type === 'coding' && (
            <div className="mb-4">
              <label className="block mb-1 font-medium">Question Content</label>
              <Textarea
                value={question.content || ''}
                onChange={e => setQuestion(q => ({ ...q, content: e.target.value }))}
                rows={4}
                placeholder="Enter your coding problem description here..."
                required
              />

              <div className="mt-4 space-y-4">
                <div>
                  <label className="block mb-1 font-medium">Programming Languages <span className="text-red-500">*</span></label>
                  <div className="flex flex-wrap gap-2 p-3 border rounded-lg">
                    {[
                      { value: 'javascript', label: 'JavaScript' },
                      { value: 'python', label: 'Python' },
                      { value: 'java', label: 'Java' },
                      { value: 'cpp', label: 'C++' },
                      { value: 'c', label: 'C' },
                      { value: 'php', label: 'PHP' },
                      { value: 'ruby', label: 'Ruby' },
                      { value: 'go', label: 'Go' },
                      { value: 'rust', label: 'Rust' }
                    ].map((lang) => {
                      const isSelected = question.coding_details.languages.includes(lang.value);
                      return (
                        <button
                          key={lang.value}
                          type="button"
                          onClick={() => {
                            const currentLanguages = [...question.coding_details.languages];
                            if (isSelected) {
                              // Remove language
                              const newLanguages = currentLanguages.filter(l => l !== lang.value);
                              setQuestion(q => ({
                                ...q,
                                coding_details: {
                                  ...q.coding_details,
                                  languages: newLanguages
                                }
                              }));
                            } else {
                              // Add language
                              const newLanguages = [...currentLanguages, lang.value];
                              setQuestion(q => ({
                                ...q,
                                coding_details: {
                                  ...q.coding_details,
                                  languages: newLanguages
                                }
                              }));
                            }
                          }}
                          className={`px-3 py-1 rounded-full border transition-colors text-sm font-medium ${isSelected
                            ? 'bg-blue-600 text-white border-blue-600'
                            : 'bg-gray-100 text-gray-800 border-gray-300 hover:bg-blue-100'
                            }`}
                        >
                          {lang.label}
                          {isSelected && <span className="ml-1">✓</span>}
                        </button>
                      );
                    })}
                  </div>
                  {question.coding_details.languages.length === 0 && (
                    <p className="text-sm text-red-600 mt-1">Please select at least one programming language</p>
                  )}
                </div>

                {question.coding_details.languages.length > 0 && (
                  <div>
                    <label className="block mb-1 font-medium">Code Implementation</label>
                    <div className="border rounded-lg">
                      <div className="flex border-b">
                        {question.coding_details.languages.map((lang, index) => (
                          <button
                            key={lang}
                            type="button"
                            onClick={() => setQuestion(q => ({
                              ...q,
                              coding_details: {
                                ...q.coding_details,
                                activeLanguage: lang
                              }
                            }))}
                            className={`px-4 py-2 text-sm font-medium border-r ${(question.coding_details.activeLanguage || question.coding_details.languages[0]) === lang
                              ? 'bg-blue-50 text-blue-700 border-blue-200'
                              : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                              }`}
                          >
                            {lang.charAt(0).toUpperCase() + lang.slice(1)}
                          </button>
                        ))}
                      </div>

                      {question.coding_details.languages.map((lang) => {
                        const isActive = (question.coding_details.activeLanguage || question.coding_details.languages[0]) === lang;
                        return isActive ? (
                          <div key={lang} className="p-4">
                            <div className="mb-4">
                              <label className="block mb-1 font-medium">Starter Code <span className="text-red-500">*</span></label>
                              <div className="border rounded-lg overflow-hidden shadow-sm">
                                <div className="bg-gray-50 px-3 py-1 border-b text-s font-medium text-gray-600">
                                  {lang.charAt(0).toUpperCase() + lang.slice(1)}
                                </div>
                                <CodeEditor
                                  value={question.coding_details.starter_codes[lang] || ''}
                                  onChange={(value) => setQuestion(q => ({
                                    ...q,
                                    coding_details: {
                                      ...q.coding_details,
                                      starter_codes: {
                                        ...q.coding_details.starter_codes,
                                        [lang]: value
                                      }
                                    }
                                  }))}
                                  language={getMonacoLanguage(lang)}
                                  height="200px"
                                  theme="vs-light"
                                  options={{
                                    minimap: { enabled: false },
                                    fontSize: 13,
                                    lineNumbers: 'on',
                                    wordWrap: 'on',
                                    scrollBeyondLastLine: false
                                  }}
                                />
                              </div>
                            </div>

                            <div>
                              <label className="block mb-1 font-medium">Solution Code <span className="text-red-500">*</span></label>
                              <div className="flex gap-2 mb-2">
                                <div className="flex-1 border rounded-lg overflow-hidden shadow-sm">
                                  <div className="bg-gray-50 px-3 py-1 border-b text-xs font-medium text-gray-600">
                                    {lang.charAt(0).toUpperCase() + lang.slice(1)}
                                  </div>
                                  <CodeEditor
                                    value={question.coding_details.solution_codes[lang] || ''}
                                    onChange={(value) => setQuestion(q => ({
                                      ...q,
                                      coding_details: {
                                        ...q.coding_details,
                                        solution_codes: {
                                          ...q.coding_details.solution_codes,
                                          [lang]: value
                                        }
                                      }
                                    }))}
                                    language={getMonacoLanguage(lang)}
                                    height="200px"
                                    theme="vs-light"
                                    options={{
                                      minimap: { enabled: false },
                                      fontSize: 13,
                                      lineNumbers: 'on',
                                      wordWrap: 'on',
                                      scrollBeyondLastLine: false
                                    }}
                                  />
                                </div>
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleVerifyTestCases(lang)}
                                  disabled={!question.coding_details.solution_codes[lang]?.trim() || !question.coding_details.test_cases || question.coding_details.test_cases.length === 0 || isVerifying}
                                  className="whitespace-nowrap"
                                >
                                  {isVerifying ? 'Verifying...' : 'Verify'}
                                </Button>
                              </div>
                            </div>
                          </div>
                        ) : null;
                      })}
                    </div>
                  </div>
                )}

                {/* Test Cases Section */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block font-medium">Test Cases</label>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const newTestCases = [...(question.coding_details.test_cases || []), { input: '', output: '', description: '' }];
                        setQuestion(q => ({
                          ...q,
                          coding_details: { ...q.coding_details, test_cases: newTestCases }
                        }));
                      }}
                    >
                      + Add Test Case
                    </Button>
                  </div>

                  <div className="space-y-3">
                    {(question.coding_details.test_cases || []).map((testCase, idx) => (
                      <div key={idx} className="border rounded-lg p-4 bg-gray-50">
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="font-medium text-sm">Test Case {idx + 1}</h4>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              const newTestCases = (question.coding_details.test_cases || []).filter((_, i) => i !== idx);
                              setQuestion(q => ({
                                ...q,
                                coding_details: { ...q.coding_details, test_cases: newTestCases }
                              }));
                            }}
                            className="text-red-600 hover:text-red-700"
                          >
                            Remove
                          </Button>
                        </div>

                        <div className="space-y-3">
                          <div>
                            <label className="block text-sm font-medium mb-1">Description (Optional)</label>
                            <Input
                              value={testCase.description || ''}
                              onChange={e => {
                                const newTestCases = [...(question.coding_details.test_cases || [])];
                                newTestCases[idx] = { ...newTestCases[idx], description: e.target.value };
                                setQuestion(q => ({
                                  ...q,
                                  coding_details: { ...q.coding_details, test_cases: newTestCases }
                                }));
                              }}
                              placeholder="e.g., Basic case, edge case, large input..."
                            />
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <div>
                              <label className="block text-sm font-medium mb-1">Input</label>
                              <Textarea
                                value={testCase.input || ''}
                                onChange={e => {
                                  const newTestCases = [...(question.coding_details.test_cases || [])];
                                  newTestCases[idx] = { ...newTestCases[idx], input: e.target.value };
                                  setQuestion(q => ({
                                    ...q,
                                    coding_details: { ...q.coding_details, test_cases: newTestCases }
                                  }));
                                }}
                                rows={3}
                                placeholder="e.g., [1,2,3]&#10;4&#10;5 or multi-line input"
                              />
                            </div>

                            <div>
                              <label className="block text-sm font-medium mb-1">Expected Output</label>
                              <Textarea
                                value={testCase.output || ''}
                                onChange={e => {
                                  const newTestCases = [...(question.coding_details.test_cases || [])];
                                  newTestCases[idx] = { ...newTestCases[idx], output: e.target.value };
                                  setQuestion(q => ({
                                    ...q,
                                    coding_details: { ...q.coding_details, test_cases: newTestCases }
                                  }));
                                }}
                                rows={3}
                                placeholder="e.g., [0,1]&#10;true or multi-line output"
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}

                    {(question.coding_details.test_cases || []).length === 0 && (
                      <div className="text-center py-6 border-2 border-dashed border-gray-300 rounded-lg">
                        <p className="text-gray-500 text-sm">No test cases added yet.</p>
                        <p className="text-gray-400 text-xs mt-1">Click "Add Test Case" to get started.</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Test Case Verification Results */}
                {testCaseResults.length > 0 && (
                  <div className="mt-4">
                    <div className="flex items-center justify-between mb-3">
                      <label className="block font-medium">Verification Results</label>
                      <div className="flex items-center gap-2">
                        <span className={`text-sm font-medium ${testCaseResults.every(r => r.isCorrect)
                          ? 'text-green-600'
                          : 'text-red-600'
                          }`}>
                          {testCaseResults.filter(r => r.isCorrect).length}/{testCaseResults.length} passed
                        </span>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => handleVerifyTestCases(question.coding_details.activeLanguage || question.coding_details.languages[0])}
                          disabled={isVerifying}
                        >
                          {isVerifying ? 'Verifying...' : 'Re-run Tests'}
                        </Button>
                      </div>
                    </div>

                    <div className="space-y-3">
                      {testCaseResults.map((result, idx) => (
                        <div key={idx} className={`border rounded-lg p-4 ${result.isCorrect ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
                          }`}>
                          <div className="flex items-center justify-between mb-3">
                            <h4 className={`font-medium text-sm ${result.isCorrect ? 'text-green-700' : 'text-red-700'
                              }`}>
                              Test Case {result.testCaseIndex + 1} - {result.isCorrect ? '✅ PASSED' : '❌ FAILED'}
                            </h4>
                            {result.executionTime > 0 && (
                              <span className="text-xs text-gray-500">
                                {result.executionTime}ms
                              </span>
                            )}
                          </div>

                          <div className="space-y-2 text-sm">
                            <div><b>Input:</b><pre className="bg-white p-2 rounded mt-1 text-xs border">{result.input || 'None'}</pre></div>
                            <div><b>Expected Output:</b><pre className="bg-white p-2 rounded mt-1 text-xs border">{result.expectedOutput || 'None'}</pre></div>
                            <div><b>Actual Output:</b>
                              {result.error ? (
                                <pre className="bg-red-100 p-2 rounded mt-1 text-xs border border-red-300 text-red-700">{result.error}</pre>
                              ) : (
                                <pre className="bg-white p-2 rounded mt-1 text-xs border">{result.actualOutput || 'None'}</pre>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {question.question_type === 'fill_blanks' && (
            <div className="mb-4">
              <label className="block mb-1 font-medium">Question Content</label>
              <div className="flex gap-2 mb-2">
                <Textarea
                  ref={contentRef}
                  value={question.content || ''}
                  onChange={e => setQuestion(q => ({ ...q, content: e.target.value }))}
                  rows={4}
                  placeholder="Type your question and use 'Insert Blank' to add blanks..."
                />
                <Button type="button" onClick={handleInsertBlank}>Insert Blank</Button>
              </div>
              {extractBlanks(question.content).map((idx, i) => (
                <div key={i} className="mb-2 border rounded p-2">
                  <div className="font-medium mb-1">Blank {i + 1} Options</div>
                  {fillBlankOptions[i]?.options.map((opt, j) => (
                    <div key={j} className="flex items-center gap-2 mb-1">
                      <Input
                        value={opt}
                        onChange={e => {
                          setFillBlankOptions(opts => {
                            const arr = [...opts];
                            arr[i] = { ...arr[i], options: [...arr[i].options] };
                            arr[i].options[j] = e.target.value;
                            return arr;
                          });
                        }}
                        placeholder={`Option ${j + 1}`}
                        required
                      />
                      <input
                        type="radio"
                        name={`blank-correct-${i}`}
                        checked={fillBlankOptions[i]?.correct === j}
                        onChange={() => {
                          setFillBlankOptions(opts => {
                            const arr = [...opts];
                            arr[i] = { ...arr[i], correct: j };
                            return arr;
                          });
                        }}
                      /> Correct
                    </div>
                  ))}
                </div>
              ))}
            </div>
          )}

          <div className="mb-4">
            <label className="block mb-1 font-medium">Explanation (optional)</label>
            <Textarea
              value={question.explanation || ''}
              onChange={e => setQuestion(q => ({ ...q, explanation: e.target.value }))}
              rows={3}
              placeholder="Enter explanation for the correct answer..."
            />
          </div>

          <div className="flex gap-4">
            <Button type="submit" disabled={loading}>
              {loading ? (isEditMode ? 'Updating...' : 'Creating...') : (isEditMode ? 'Update Question' : 'Create Question')}
            </Button>
            <Button type="button" variant="secondary" onClick={() => setQuestion(isEditMode && questionData ? questionData : defaultState)}>
              {isEditMode ? 'Reset Changes' : 'Reset'}
            </Button>
            <Button type="button" variant="outline" onClick={() => setPreview(!preview)}>
              {preview ? 'Hide Preview' : 'Show Preview'}
            </Button>
          </div>
        </form>
      </Card>

      {preview && (
        <Card className="p-6 mt-6 bg-gray-50">
          <h3 className="text-xl font-semibold mb-4">Preview</h3>
          <div className="space-y-2">
            <div><b>Title:</b> {question.title || 'No title'}</div>
            <div><b>Type:</b> {QUESTION_TYPES.find(qt => qt.value === question.question_type)?.label}</div>
            <div><b>Difficulty:</b> {DIFFICULTY_LEVELS.find(d => d.value === question.difficulty_level)?.label}</div>
            <div><b>Points:</b> {question.points}</div>
            <div><b>Content:</b> {question.content || 'No content'}</div>

            {['multiple_choice', 'single_choice'].includes(question.question_type) && (
              <div>
                <b>Options:</b>
                <ul className="ml-4">
                  {(question.options || []).map((opt, idx) => (
                    <li key={idx} className={(question.correctAnswers || []).includes(idx) ? 'font-bold text-green-700' : ''}>
                      {opt || `Option ${idx + 1}`}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {question.question_type === 'true_false' && (
              <div><b>Correct:</b> {(question.correctAnswers || [])[0] === true ? 'True' : (question.correctAnswers || [])[0] === false ? 'False' : 'Not set'}</div>
            )}

            {question.question_type === 'short_answer' && (
              <div>
                <b>Acceptable Answers:</b>
                <ul className="ml-4">
                  {(question.acceptable_answers || []).map((answer, idx) => (
                    <li key={idx}>{answer}</li>
                  ))}
                </ul>
              </div>
            )}

            {question.question_type === 'coding' && (
              <>
                <div><b>Languages:</b> {(question.coding_details?.languages || []).map(lang => lang.charAt(0).toUpperCase() + lang.slice(1)).join(', ')}</div>
                <div><b>Active Language:</b> {question.coding_details?.activeLanguage ? question.coding_details.activeLanguage.charAt(0).toUpperCase() + question.coding_details.activeLanguage.slice(1) : 'N/A'}</div>
                <div><b>Starter Code:</b><pre className="bg-gray-100 p-2 rounded mt-1 text-sm">{question.coding_details?.starter_codes?.[question.coding_details?.activeLanguage] || 'Required - Not provided'}</pre></div>
                <div><b>Solution Code:</b><pre className="bg-gray-100 p-2 rounded mt-1 text-sm">{question.coding_details?.solution_codes?.[question.coding_details?.activeLanguage] || 'Required - Not provided'}</pre></div>
                <div>
                  <b>Test Cases:</b>
                  {(question.coding_details.test_cases || []).length > 0 ? (
                    <div className="space-y-2 mt-1">
                      {(question.coding_details.test_cases || []).map((testCase, idx) => (
                        <div key={idx} className="border rounded p-2 bg-gray-50">
                          <div className="font-medium text-sm mb-1">Test Case {idx + 1}</div>
                          {testCase.description && <div className="text-sm text-gray-600 mb-1"><b>Description:</b> {testCase.description}</div>}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                            <div><b>Input:</b><pre className="bg-white p-1 rounded mt-1 text-xs">{testCase.input || 'None'}</pre></div>
                            <div><b>Expected Output:</b><pre className="bg-white p-1 rounded mt-1 text-xs">{testCase.output || 'None'}</pre></div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <span className="text-gray-500">No test cases</span>
                  )}
                </div>
              </>
            )}

            {question.question_type === 'fill_blanks' && (
              <div>
                <b>Preview:</b>
                <div>
                  {(() => {
                    let idx = 0;
                    return question.content.split(/(\[\[blank\d+\]\])/g).map((part, i) => {
                      const match = part.match(/^\[\[blank(\d+)\]\]$/);
                      if (match) {
                        const blankIdx = idx++;
                        const opts = fillBlankOptions[blankIdx]?.options || [];
                        return (
                          <select key={i} className="mx-1">
                            {opts.map((opt, j) => (
                              <option key={j}>{opt}</option>
                            ))}
                          </select>
                        );
                      }
                      return <span key={i}>{part}</span>;
                    });
                  })()}
                </div>
              </div>
            )}

            {question.explanation && <div><b>Explanation:</b> {question.explanation}</div>}
          </div>
        </Card>
      )}
    </div>
  );
} 