import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Plus, 
  Edit, 
  Trash2, 
  GripVertical, 
  Code, 
  FileText, 
  CheckSquare, 
  Type,
  Hash,
  Clock,
  Settings,
  Save,
  X,
  AlertCircle,
  CheckCircle,
  Link
} from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import apiService from '@/services/api';

const QuestionManagementInterface = ({ assessmentId, onQuestionsChange }) => {
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedQuestion, setSelectedQuestion] = useState(null);
  const [draggedQuestion, setDraggedQuestion] = useState(null);
  const { toast } = useToast();

  // Form state for creating/editing question
  const [formData, setFormData] = useState({
    question_text: '',
    question_type: 'multiple_choice',
    points: 1,
    difficulty_level: 'medium',
    is_required: true,
    options: ['', '', '', ''],
    correct_answer: '',
    correct_answers: [],
    explanation: '',
    // Short answer fields
    keywords: '',
    max_length: 100,
    // Essay fields
    rubric: '',
    min_length: 50,
    // Fill blanks fields
    blanks: [],
    // Numeric fields
    tolerance: 0.01,
    unit: '',
    // Matching fields
    matching_pairs: [],
    // Coding fields
    coding_details: {
      language: 'javascript',
      starter_code: '',
      solution_code: '',
      test_cases: [],
      time_limit: 1000,
      memory_limit: 256,
      difficulty: 'medium',
      category: '',
      tags: []
    }
  });

  useEffect(() => {
    fetchQuestions();
  }, [assessmentId]);

  const fetchQuestions = async () => {
    try {
      setLoading(true);
      const response = await apiService.getAssessmentQuestionsForAdmin(assessmentId);
      
      if (response.success) {
        setQuestions(response.data);
        if (onQuestionsChange) {
          onQuestionsChange(response.data);
        }
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load questions"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateQuestion = async () => {
    try {
      // Prepare the question data for the API
      const questionData = {
        title: formData.question_text || '',
        content: formData.question_text || '',
        question_type: formData.question_type,
        difficulty_level: formData.difficulty_level,
        points: formData.points,
        options: formData.options,
        correct_answer: formData.correct_answer,
        correct_answers: formData.correct_answers,
        explanation: formData.explanation,
        hints: [],
        metadata: {}
      };

      // Add coding details to metadata if it's a coding question
      if (formData.question_type === 'coding' && formData.coding_details) {
        questionData.metadata = {
          language: formData.coding_details.language || 'javascript',
          starter_code: formData.coding_details.starter_code || '',
          solution_code: formData.coding_details.solution_code || '',
          test_cases: formData.coding_details.test_cases || [],
          time_limit: formData.coding_details.time_limit || 1000,
          memory_limit: formData.coding_details.memory_limit || 256,
          difficulty: formData.coding_details.difficulty || 'medium',
          category: formData.coding_details.category || '',
          tags: formData.coding_details.tags || []
        };
      }

      const response = await apiService.createAssessmentQuestion(assessmentId, questionData);
      if (response.success) {
        toast({
          title: "Success",
          description: "Question created successfully"
        });
        setIsCreateDialogOpen(false);
        resetForm();
        fetchQuestions();
      }
    } catch (error) {
      console.error('Error creating question:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to create question"
      });
    }
  };

  const handleUpdateQuestion = async () => {
    try {
      // Prepare the question data for the API
      const questionData = {
        title: formData.question_text || '',
        content: formData.question_text || '',
        question_type: formData.question_type,
        difficulty_level: formData.difficulty_level,
        points: formData.points,
        options: formData.options,
        correct_answer: formData.correct_answer,
        correct_answers: formData.correct_answers,
        explanation: formData.explanation,
        hints: [],
        metadata: {}
      };

      // Add coding details to metadata if it's a coding question
      if (formData.question_type === 'coding' && formData.coding_details) {
        questionData.metadata = {
          language: formData.coding_details.language || 'javascript',
          starter_code: formData.coding_details.starter_code || '',
          solution_code: formData.coding_details.solution_code || '',
          test_cases: formData.coding_details.test_cases || [],
          time_limit: formData.coding_details.time_limit || 1000,
          memory_limit: formData.coding_details.memory_limit || 256,
          difficulty: formData.coding_details.difficulty || 'medium',
          category: formData.coding_details.category || '',
          tags: formData.coding_details.tags || []
        };
      }

      const response = await apiService.updateAssessmentQuestion(assessmentId, selectedQuestion.id, questionData);
      // console.log('Update response:', response);
      
      if (response.success) {
        toast({
          title: "Success",
          description: "Question updated successfully"
        });
        setIsEditDialogOpen(false);
        resetForm();
        fetchQuestions();
      }
    } catch (error) {
      console.error('Error updating question:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update question"
      });
    }
  };

  const handleDeleteQuestion = async (questionId) => {
    if (!confirm('Are you sure you want to delete this question?')) return;

    try {
      const response = await apiService.deleteAssessmentQuestion(assessmentId, questionId);
      if (response.success) {
        toast({
          title: "Success",
          description: "Question deleted successfully"
        });
        fetchQuestions();
      }
    } catch (error) {
      console.error('Error deleting question:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to delete question"
      });
    }
  };

  const handleReorderQuestions = async (newOrder) => {
    try {
      const questionIds = newOrder.map(q => q.id);
      const response = await apiService.reorderAssessmentQuestions(assessmentId, questionIds);
      if (response.success) {
        setQuestions(newOrder);
        toast({
          title: "Success",
          description: "Questions reordered successfully"
        });
      }
    } catch (error) {
      console.error('Error reordering questions:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to reorder questions"
      });
    }
  };

  const resetForm = () => {
    setFormData({
      question_text: '',
      question_type: 'multiple_choice',
      points: 1,
      difficulty_level: 'medium',
      is_required: true,
      options: ['', '', '', ''],
      correct_answer: '',
      correct_answers: [],
      explanation: '',
      // Short answer fields
      keywords: '',
      max_length: 100,
      // Essay fields
      rubric: '',
      min_length: 50,
      // Fill blanks fields
      blanks: [],
      // Numeric fields
      tolerance: 0.01,
      unit: '',
      // Matching fields
      matching_pairs: [],
      // Coding fields
      coding_details: {
        language: 'javascript',
        starter_code: '',
        solution_code: '',
        test_cases: [],
        time_limit: 1000,
        memory_limit: 256,
        difficulty: 'medium',
        category: '',
        tags: []
      }
    });
  };

  const openEditDialog = (question) => {
    setSelectedQuestion(question);
    
    // Helper function to safely parse JSON
    const safeJsonParse = (value, defaultValue = []) => {
      // If value is already an array or object, return it as is
      if (Array.isArray(value) || (typeof value === 'object' && value !== null)) {
        return value;
      }
      
      // Check for null, undefined, empty string, or whitespace-only string
      if (!value || value === '' || value === 'null' || value === 'undefined' || (typeof value === 'string' && value.trim() === '')) {
        return defaultValue;
      }
      try {
        return JSON.parse(value);
      } catch (error) {
        return defaultValue;
      }
    };

    // Handle coding details - check both coding_details and metadata
    let codingDetails = {
      language: 'javascript',
      starter_code: '',
      solution_code: '',
      test_cases: [],
      time_limit: 1000,
      memory_limit: 256,
      difficulty: 'medium',
      category: '',
      tags: []
    };

    if (question.question_type === 'coding') {
      if (question.coding_details) {
        // Use coding_details if available (from assessment questions API)
        codingDetails = {
          language: question.coding_details.language || 'javascript',
          starter_code: question.coding_details.starter_code || '',
          solution_code: question.coding_details.solution_code || '',
          test_cases: safeJsonParse(question.coding_details.test_cases, []),
          time_limit: question.coding_details.time_limit || 1000,
          memory_limit: question.coding_details.memory_limit || 256,
          difficulty: question.coding_details.difficulty || 'medium',
          category: question.coding_details.category || '',
          tags: safeJsonParse(question.coding_details.tags, [])
        };
      } else if (question.metadata && question.metadata.starter_code) {
        // Fallback to metadata (from question bank questions)
        codingDetails = {
          language: question.metadata.language || 'javascript',
          starter_code: question.metadata.starter_code || '',
          solution_code: question.metadata.solution_code || '',
          test_cases: safeJsonParse(question.metadata.test_cases, []),
          time_limit: question.metadata.time_limit || 1000,
          memory_limit: question.metadata.memory_limit || 256,
          difficulty: question.metadata.difficulty || 'medium',
          category: question.metadata.category || '',
          tags: safeJsonParse(question.metadata.tags, [])
        };
      }
    }

    const formDataToSet = {
      question_text: question.question_text || question.content || '',
      question_type: question.question_type || 'multiple_choice',
      points: question.points || 1,
      difficulty_level: question.difficulty_level || 'medium',
      is_required: question.is_required || false,
      options: safeJsonParse(question.options, ['', '', '', '']),
      correct_answer: question.correct_answer || '',
      correct_answers: safeJsonParse(question.correct_answers, []),
      explanation: question.explanation || '',
      // Short answer fields
      keywords: question.keywords || '',
      max_length: question.max_length || 100,
      // Essay fields
      rubric: question.rubric || '',
      min_length: question.min_length || 50,
      // Fill blanks fields
      blanks: safeJsonParse(question.blanks, []),
      // Numeric fields
      tolerance: question.tolerance || 0.01,
      unit: question.unit || '',
      // Matching fields
      matching_pairs: safeJsonParse(question.matching_pairs, []),
      // Coding fields
      coding_details: codingDetails
    };
    
    setFormData(formDataToSet);
    
    setIsEditDialogOpen(true);
  };

  const handleInputChange = (field, value) => {
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [field]: value
      }));
    }
  };

  const addOption = () => {
    setFormData(prev => ({
      ...prev,
      options: [...prev.options, '']
    }));
  };

  const updateOption = (index, value) => {
    setFormData(prev => ({
      ...prev,
      options: prev.options.map((option, i) => i === index ? value : option)
    }));
  };

  const removeOption = (index) => {
    setFormData(prev => ({
      ...prev,
      options: prev.options.filter((_, i) => i !== index)
    }));
  };

  const addTestCase = () => {
    setFormData(prev => ({
      ...prev,
      coding_details: {
        ...prev.coding_details,
        test_cases: [...prev.coding_details.test_cases, { input: '', output: '', description: '' }]
      }
    }));
  };

  const updateTestCase = (index, field, value) => {
    setFormData(prev => ({
      ...prev,
      coding_details: {
        ...prev.coding_details,
        test_cases: prev.coding_details.test_cases.map((testCase, i) => 
          i === index ? { ...testCase, [field]: value } : testCase
        )
      }
    }));
  };

  const removeTestCase = (index) => {
    setFormData(prev => ({
      ...prev,
      coding_details: {
        ...prev.coding_details,
        test_cases: prev.coding_details.test_cases.filter((_, i) => i !== index)
      }
    }));
  };

  const getQuestionTypeIcon = (type) => {
    switch (type) {
      case 'coding': return <Code className="h-4 w-4" />;
      case 'multiple_choice': return <CheckSquare className="h-4 w-4" />;
      case 'true_false': return <Type className="h-4 w-4" />;
      case 'short_answer': return <FileText className="h-4 w-4" />;
      case 'essay': return <FileText className="h-4 w-4" />;
      case 'fill_blanks': return <Hash className="h-4 w-4" />;
      case 'numeric': return <Hash className="h-4 w-4" />;
      case 'matching': return <Link className="h-4 w-4" />;
      default: return <FileText className="h-4 w-4" />;
    }
  };

  const getDifficultyColor = (difficulty) => {
    switch (difficulty) {
      case 'easy': return 'bg-green-100 text-green-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'hard': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Question Management</h2>
          <p className="text-muted-foreground">
            Manage questions for this assessment ({questions.length} questions)
          </p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Question
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create New Question</DialogTitle>
              <DialogDescription>
                Add a new question to this assessment
              </DialogDescription>
            </DialogHeader>
            <QuestionForm 
              formData={formData} 
              setFormData={setFormData}
              handleInputChange={handleInputChange}
              onSubmit={handleCreateQuestion}
              submitLabel="Create Question"
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* Questions List */}
      <div className="space-y-4">
        <AnimatePresence>
          {questions.map((question, index) => (
            <motion.div
              key={question.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.2 }}
            >
              <Card className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="flex items-center space-x-2">
                        <GripVertical className="h-4 w-4 text-muted-foreground cursor-move" />
                        <Badge variant="outline">#{index + 1}</Badge>
                      </div>
                      {getQuestionTypeIcon(question.question_type)}
                      <div>
                        <CardTitle className="text-lg">
                          {question.question_text.length > 100 
                            ? question.question_text.substring(0, 100) + '...'
                            : question.question_text
                          }
                        </CardTitle>
                        <CardDescription className="flex items-center space-x-2 mt-1">
                          <Badge className={getDifficultyColor(question.difficulty_level)}>
                            {question.difficulty_level}
                          </Badge>
                          <Badge variant="outline">{question.points} points</Badge>
                          {question.is_required && (
                            <Badge variant="destructive">Required</Badge>
                          )}
                        </CardDescription>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openEditDialog(question)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteQuestion(question.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
              </Card>
            </motion.div>
          ))}
        </AnimatePresence>

        {questions.length === 0 && (
          <Card className="text-center py-12">
            <CardContent>
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No questions yet</h3>
              <p className="text-muted-foreground mb-4">
                Start by adding questions to this assessment
              </p>
              <Button onClick={() => setIsCreateDialogOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Add First Question
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Edit Question Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Question</DialogTitle>
            <DialogDescription>
              Update the question details
            </DialogDescription>
          </DialogHeader>
          <QuestionForm 
            formData={formData} 
            setFormData={setFormData}
            handleInputChange={handleInputChange}
            onSubmit={handleUpdateQuestion}
            submitLabel="Update Question"
          />
        </DialogContent>
      </Dialog>
    </div>
  );
};

// Question Form Component
const QuestionForm = ({ formData, setFormData, handleInputChange, onSubmit, submitLabel }) => {
  // Force rerender on type change
  const [typeKey, setTypeKey] = React.useState(formData.question_type);
  React.useEffect(() => { setTypeKey(formData.question_type); }, [formData.question_type]);

  // Helper for dynamic list fields
  const updateList = (field, idx, value) => {
    const arr = [...(formData[field] || [''])];
    arr[idx] = value;
    setFormData(prev => ({ ...prev, [field]: arr }));
  };
  const addToList = (field) => setFormData(prev => ({ ...prev, [field]: [...(prev[field] || []), ''] }));
  const removeFromList = (field, idx) => setFormData(prev => ({ ...prev, [field]: (prev[field] || []).filter((_, i) => i !== idx) }));

  // Helper for coding test cases
  const updateTestCase = (idx, key, value) => {
    const arr = [...(formData.coding_details?.test_cases || [{input:'',output:''}])];
    arr[idx] = { ...arr[idx], [key]: value };
    setFormData(prev => ({
      ...prev,
      coding_details: { ...prev.coding_details, test_cases: arr }
    }));
  };
  const addTestCase = () => setFormData(prev => ({
    ...prev,
    coding_details: { ...prev.coding_details, test_cases: [...(prev.coding_details?.test_cases || []), {input:'',output:''}] }
  }));
  const removeTestCase = (idx) => setFormData(prev => ({
    ...prev,
    coding_details: { ...prev.coding_details, test_cases: (prev.coding_details?.test_cases || []).filter((_, i) => i !== idx) }
  }));

  // Helper for fill blanks
  const updateBlank = (idx, key, value) => {
    const arr = [...(formData.blanks || [{blank:'blank1',answers:['']}])];
    arr[idx] = { ...arr[idx], [key]: value };
    setFormData(prev => ({ ...prev, blanks: arr }));
  };
  const addBlank = () => setFormData(prev => ({ ...prev, blanks: [...(prev.blanks || []), {blank: `blank${(formData.blanks?.length||0)+1}`, answers:['']}] }));
  const removeBlank = (idx) => setFormData(prev => ({ ...prev, blanks: (prev.blanks || []).filter((_, i) => i !== idx) }));

  return (
    <form key={typeKey} className="space-y-6" onSubmit={e => { e.preventDefault(); onSubmit(); }}>
      {/* Generic fields */}
            <div>
        <label>
          Question Title 
          {formData.question_type === 'coding' && <span className="text-red-500">*</span>}
        </label>
        <input 
          className="w-full" 
          value={formData.title || ''} 
          onChange={e => handleInputChange('title', e.target.value)} 
          required={formData.question_type === 'coding'}
          placeholder={formData.question_type === 'coding' ? "Enter question title (required)" : "Enter question title (optional)"}
        />
            </div>
            <div>
        <label>Question Content *</label>
        <textarea className="w-full" value={formData.content || ''} onChange={e => handleInputChange('content', e.target.value)} required />
      </div>
      <div className="flex gap-4">
        <div className="flex-1">
          <label>Question Type *</label>
          <select className="w-full" value={formData.question_type} onChange={e => handleInputChange('question_type', e.target.value)} required>
            <option value="multiple_choice">Multiple Choice</option>
            <option value="true_false">True/False</option>
            <option value="short_answer">Short Answer</option>
            <option value="essay">Essay</option>
            <option value="coding">Coding</option>
            <option value="fill_blanks">Fill in the Blank</option>
          </select>
        </div>
        <div className="flex-1">
          <label>Difficulty Level</label>
          <select className="w-full" value={formData.difficulty_level} onChange={e => handleInputChange('difficulty_level', e.target.value)}>
            <option value="easy">Easy</option>
            <option value="medium">Medium</option>
            <option value="hard">Hard</option>
          </select>
            </div>
          </div>
      <div className="flex gap-4">
        <div className="flex-1">
          <label>Points</label>
          <input type="number" className="w-full" value={formData.points || 1} onChange={e => handleInputChange('points', parseInt(e.target.value))} />
            </div>
        <div className="flex-1">
          <label>Category</label>
          <input className="w-full" value={formData.category_id || ''} onChange={e => handleInputChange('category_id', e.target.value)} />
            </div>
          </div>

      {/* Type-specific fields */}
      {formData.question_type === 'true_false' && (
          <div>
          <label>Correct Answer</label>
          <div className="flex gap-4 mt-2">
            <label><input type="radio" name="tf" value="true" checked={formData.correct_answer === 'true'} onChange={() => handleInputChange('correct_answer', 'true')} /> True</label>
            <label><input type="radio" name="tf" value="false" checked={formData.correct_answer === 'false'} onChange={() => handleInputChange('correct_answer', 'false')} /> False</label>
          </div>
              </div>
      )}
      {formData.question_type === 'short_answer' && (
        <div>
          <label>Acceptable Answers</label>
          {(formData.acceptable_answers || ['']).map((ans, idx) => (
            <div key={idx} className="flex gap-2 mb-2">
              <input className="flex-1" value={ans} onChange={e => updateList('acceptable_answers', idx, e.target.value)} placeholder={`Answer ${idx+1}`} />
              <button type="button" onClick={() => removeFromList('acceptable_answers', idx)}>Remove</button>
                  </div>
                ))}
          <button type="button" onClick={() => addToList('acceptable_answers')}>Add Answer</button>
              </div>
      )}
      {formData.question_type === 'essay' && (
              <div>
          <label>Rubric / Guidelines</label>
          <textarea className="w-full" value={formData.rubric || ''} onChange={e => handleInputChange('rubric', e.target.value)} placeholder="Describe what a good answer should include, grading criteria, etc." rows={4} />
            </div>
          )}
      {formData.question_type === 'coding' && (
        <div className="space-y-2">
          <div>
            <label>Starter Code</label>
            <textarea className="w-full" value={formData.coding_details?.starter_code || ''} onChange={e => handleInputChange('coding_details.starter_code', e.target.value)} rows={3} />
          </div>
                <div>
            <label>Solution Code</label>
            <textarea className="w-full" value={formData.coding_details?.solution_code || ''} onChange={e => handleInputChange('coding_details.solution_code', e.target.value)} rows={3} />
                </div>
                <div>
            <label>Test Cases</label>
            {(formData.coding_details?.test_cases || [{input:'',output:''}]).map((tc, idx) => (
              <div key={idx} className="flex gap-2 mb-2">
                <input className="flex-1" value={tc.input} onChange={e => updateTestCase(idx, 'input', e.target.value)} placeholder="Input" />
                <input className="flex-1" value={tc.output} onChange={e => updateTestCase(idx, 'output', e.target.value)} placeholder="Expected Output" />
                <button type="button" onClick={() => removeTestCase(idx)}>Remove</button>
              </div>
            ))}
            <button type="button" onClick={addTestCase}>Add Test Case</button>
                </div>
              </div>
      )}
      {formData.question_type === 'fill_blanks' && (
        <div className="space-y-2">
              <div>
            <label>Question Text (use {'{blank1}'}, {'{blank2}'}, ... for blanks)</label>
            <textarea className="w-full" value={formData.question_text || ''} onChange={e => handleInputChange('question_text', e.target.value)} rows={3} />
              </div>
              <div>
            <label>Blanks & Answers</label>
            {(formData.blanks || [{blank:'blank1',answers:['']}]).map((b, idx) => (
              <div key={idx} className="flex gap-2 mb-2">
                <input className="w-32" value={b.blank} onChange={e => updateBlank(idx, 'blank', e.target.value)} placeholder="Blank name (e.g. blank1)" />
                <input className="flex-1" value={b.answers?.join(',') || ''} onChange={e => updateBlank(idx, 'answers', e.target.value.split(',').map(s=>s.trim()))} placeholder="Correct/Alternative answers (comma separated)" />
                <button type="button" onClick={() => removeBlank(idx)}>Remove</button>
              </div>
            ))}
            <button type="button" onClick={addBlank}>Add Blank</button>
                </div>
            </div>
          )}

      {/* Explanation (optional, for all types) */}
            <div>
        <label>Explanation</label>
        <textarea className="w-full" value={formData.explanation || ''} onChange={e => handleInputChange('explanation', e.target.value)} placeholder="Explain the correct answer (optional)" />
            </div>
      <div className="flex justify-end gap-2">
        <button type="button" onClick={() => setFormData({})}>Cancel</button>
        <button type="submit" className="bg-purple-600 text-white px-4 py-2 rounded">{submitLabel || 'Create Question'}</button>
      </div>
    </form>
  );
};

export default QuestionManagementInterface; 