import React, { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { 
  Search, 
  Filter, 
  Plus, 
  X, 
  Eye, 
  Clock, 
  Star, 
  FileText, 
  Code, 
  CheckSquare,
  Edit3,
  Trash2,
  BookOpen,
  PlusCircle,
  RefreshCw,
  AlertCircle,
  Folder,
  ChevronRight,
  ArrowLeft,
  Tag,
  Hash,
  Type,
  Settings,
  CheckCircle,
  TestTube
} from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import apiService from '@/services/api';
import QuestionCreationPage from '@/pages/QuestionCreationPage';

export default function QuestionSelectionStep({
  formData,
  availableQuestions,
  selectedQuestions,
  setSelectedQuestions,
  addQuestionToSection,
  removeQuestionFromSection,
  searchTerm,
  setSearchTerm,
  filterType,
  setFilterType,
  filterDifficulty,
  setFilterDifficulty
}) {
  const [selectedSection, setSelectedSection] = useState(formData.sections[0]?.id || null);
  const [previewQuestion, setPreviewQuestion] = useState(null);
  const [activeTab, setActiveTab] = useState('browse');
  const [loading, setLoading] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [questions, setQuestions] = useState([]);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true);
  const [categories, setCategories] = useState([]);
  const [tags, setTags] = useState([]);

  // Category navigation state
  const [categoryView, setCategoryView] = useState('categories'); // 'categories', 'subcategories', 'questions'
  const [selectedParentCategory, setSelectedParentCategory] = useState(null);
  const [selectedSubcategory, setSelectedSubcategory] = useState(null);
  const [categoryBreadcrumb, setCategoryBreadcrumb] = useState([]);

  // Load questions from question bank
  const loadQuestionsFromBank = async () => {
    try {
      setLoading(true);
      const params = {};
      
      if (searchTerm) params.search = searchTerm;
      if (filterType !== 'all') params.question_type = filterType;
      if (filterDifficulty !== 'all') params.difficulty_level = filterDifficulty;
      params.status = 'active'; // Only show active questions
      params.limit = 50;

      // If we're in a specific category, filter by that category
      if (selectedSubcategory) {
        params.category_id = selectedSubcategory.id;
      } else if (selectedParentCategory) {
        params.category_id = selectedParentCategory.id;
      }
      
              const response = await apiService.getQuestions(params);
        
        if (response.success) {
          const questionsData = response.data.questions || response.data || [];
          setQuestions(questionsData);
        } else {
          setQuestions([]);
        }
    } catch (error) {
      console.error('Error loading questions:', error);
      toast({
        title: 'Error',
        description: 'Failed to load questions from question bank',
        variant: 'destructive'
      });
      setQuestions([]);
    } finally {
      setLoading(false);
    }
  };

  // Load categories and tags
  const loadCategoriesAndTags = async () => {
    try {
      const [categoriesRes, tagsRes] = await Promise.all([
        apiService.getQuestionCategories(),
        apiService.getQuestionTags()
      ]);
      
      if (categoriesRes.success) {
        setCategories(categoriesRes.data || []);
      }
      if (tagsRes.success) {
        setTags(tagsRes.data || []);
      }
    } catch (error) {
      console.error('Error loading categories and tags:', error);
    }
  };

  useEffect(() => {
    loadCategoriesAndTags();
  }, []);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (categoryView === 'questions') {
        loadQuestionsFromBank();
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchTerm, filterType, filterDifficulty, selectedParentCategory, selectedSubcategory]);

  // Category navigation functions
  const navigateToSubcategories = (category) => {
    setSelectedParentCategory(category);
    setSelectedSubcategory(null);
    setCategoryView('subcategories');
    setCategoryBreadcrumb([{ id: category.id, name: category.name, type: 'category' }]);
  };

  const navigateToQuestions = (subcategory) => {
    setSelectedSubcategory(subcategory);
    setCategoryView('questions');
    setCategoryBreadcrumb([
      { id: selectedParentCategory.id, name: selectedParentCategory.name, type: 'category' },
      { id: subcategory.id, name: subcategory.name, type: 'subcategory' }
    ]);
    loadQuestionsFromBank();
  };

  const navigateToCategories = () => {
    setSelectedParentCategory(null);
    setSelectedSubcategory(null);
    setCategoryView('categories');
    setCategoryBreadcrumb([]);
  };

  const getParentCategories = () => {
    return categories.filter(cat => cat.parent_id === null);
  };

  const getSubcategories = (parentId) => {
    return categories.filter(cat => cat.parent_id === parentId);
  };

  const handleAddQuestion = (question) => {
    if (!selectedSection) {
      toast({
        title: 'No Section Selected',
        description: 'Please select a section to add the question to.',
        variant: 'destructive'
      });
      return;
    }

    // Check if question is already in the section
    const section = formData.sections.find(s => s.id === selectedSection);
    const isAlreadyAdded = section.questions.some(q => q.id === question.id);
    
    if (isAlreadyAdded) {
      toast({
        title: 'Question Already Added',
        description: 'This question is already in the selected section.',
        variant: 'destructive'
      });
      return;
    }
    
    addQuestionToSection(selectedSection, question);
    toast({
      title: 'Question Added',
      description: `Question added to ${section.name} section.`,
    });
  };

  const handleCreateNewQuestion = () => {
    setShowCreateDialog(true);
  };

  const handleQuestionCreated = async (newQuestion) => {
    setShowCreateDialog(false);
    toast({
      title: 'Question Created',
      description: 'New question has been created and added to your question bank.',
    });
    // Refresh questions if we're in questions view
    if (categoryView === 'questions') {
      loadQuestionsFromBank();
    }
  };

  const handleEditQuestion = (question) => {
    // Set the question to edit mode in the create dialog
    setShowCreateDialog(true);
    // You can pass the question data to the QuestionCreationPage component
    // This would require modifying the QuestionCreationPage to accept edit data
    toast({
      title: 'Edit Question',
      description: 'Opening question editor...',
    });
  };

  const handleViewQuestion = (question) => {
    // Use the same format as Question Bank - no API call needed
    setPreviewQuestion(question);
  };

  // Utility functions
  const getQuestionTypeLabel = (type) => {
    const typeMap = {
      'multiple_choice': 'Multiple Choice',
      'single_choice': 'Single Choice',
      'true_false': 'True/False',
      'short_answer': 'Short Answer',
      'essay': 'Essay',
      'coding': 'Coding',
      'fill_blanks': 'Fill in Blanks'
    };
    return typeMap[type] || type;
  };

  const getQuestionTypeIcon = (type) => {
    switch (type) {
      case 'coding': return <Code className="h-4 w-4 text-blue-600" />;
      case 'multiple_choice': return <CheckSquare className="h-4 w-4 text-green-600" />;
      case 'single_choice': return <CheckSquare className="h-4 w-4 text-green-600" />;
      case 'true_false': return <Type className="h-4 w-4 text-orange-600" />;
      case 'short_answer': return <FileText className="h-4 w-4 text-purple-600" />;
      case 'essay': return <FileText className="h-4 w-4 text-purple-600" />;
      case 'fill_blanks': return <Hash className="h-4 w-4 text-red-600" />;
      default: return <FileText className="h-4 w-4 text-gray-600" />;
    }
  };

  const getQuestionTypeColor = (type) => {
    switch (type) {
      case 'coding': return '#3B82F6'; // Blue
      case 'multiple_choice': return '#10B981'; // Green
      case 'single_choice': return '#10B981'; // Green
      case 'true_false': return '#F59E0B'; // Orange
      case 'short_answer': return '#8B5CF6'; // Purple
      case 'essay': return '#8B5CF6'; // Purple
      case 'fill_blanks': return '#EF4444'; // Red
      default: return '#6B7280'; // Gray
    }
  };

  const getDifficultyColor = (difficulty) => {
    switch (difficulty) {
      case 'beginner': return 'bg-green-100 text-green-800';
      case 'intermediate': return 'bg-yellow-100 text-yellow-800';
      case 'advanced': return 'bg-red-100 text-red-800';
      case 'expert': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getDifficultyIcon = (difficulty) => {
    switch (difficulty) {
      case 'beginner': return <Star className="w-3 h-3" />;
      case 'intermediate': return <Star className="w-3 h-3" />;
      case 'advanced': return <Star className="w-3 h-3" />;
      case 'expert': return <Star className="w-3 h-3" />;
      default: return <Star className="w-3 h-3" />;
    }
  };

  const getCodingDetails = (question) => {
    if (question.question_type !== 'coding') return null;
    
    return (
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs">
            Language: {question.programming_language || 'Not specified'}
          </Badge>
          {question.time_limit_seconds && (
            <Badge variant="outline" className="text-xs">
              Time: {question.time_limit_seconds}s
            </Badge>
          )}
        </div>
        {question.test_cases && question.test_cases.length > 0 && (
          <div className="text-xs text-gray-600">
            {question.test_cases.length} test case(s)
          </div>
        )}
      </div>
    );
  };

  // Calculate totals
  const totalQuestions = formData.sections.reduce((total, section) => {
    return total + section.questions.length;
  }, 0);

  const totalPoints = formData.sections.reduce((total, section) => {
    const sectionTotal = section.questions.reduce((sectionTotal, question) => {
      return sectionTotal + (question.points || 1);
    }, 0);
    return total + sectionTotal;
  }, 0);

  return (
    <div className="space-y-8 w-full mx-auto px-2 sm:px-4">
      {/* Header toolbar: Create | Refresh | Assessment Summary | Section Breakdown | Assign To Section */}
      <div className="flex flex-col gap-3">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
          <div className="flex flex-wrap items-center gap-3">
            <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
              <DialogTrigger asChild>
                <Button 
                  variant="outline" 
                  className="flex items-center gap-2 px-6 py-3"
                  size="lg"
                >
                  <PlusCircle className="w-5 h-5" />
                  Create New Question
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-7xl max-h-[95vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle className="text-2xl">Create New Question</DialogTitle>
                  <DialogDescription className="text-lg">
                    Create a new question that will be added to your question bank and can be used in assessments.
                  </DialogDescription>
                </DialogHeader>
                <QuestionCreationPage 
                  onSuccess={handleQuestionCreated}
                  categories={categories}
                  tags={tags}
                />
              </DialogContent>
            </Dialog>
            <Button 
              variant="outline" 
              onClick={loadQuestionsFromBank}
              className="flex items-center gap-2 px-6 py-3"
              size="lg"
              disabled={loading}
            >
              <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center gap-3 flex-1 sm:justify-end">
            {/* Assessment Summary */}
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant="secondary" className="text-sm px-3 py-1">
                Total Questions: {totalQuestions}
              </Badge>
              <Badge variant="secondary" className="text-sm px-3 py-1">
                Total Points: {Number(totalPoints).toFixed(2)}
              </Badge>
            </div>

            {/* Section Breakdown */}
            <div className="flex items-center gap-2 overflow-x-auto">
              <div className="flex items-center gap-2">
                {formData.sections.map((section) => (
                  <Badge key={section.id} variant="outline" className="text-xs px-2 py-1 whitespace-nowrap">
                    {section.name}: {section.questions.length}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Assign To Section */}
            <div className="flex items-center gap-2 min-w-[220px]">
              <Label className="text-sm text-muted-foreground">Assign To Section</Label>
              <Select value={selectedSection || ''} onValueChange={setSelectedSection}>
                <SelectTrigger className="h-10">
                  <SelectValue placeholder="Select a section" />
                </SelectTrigger>
                <SelectContent>
                  {formData.sections.map((section) => (
                    <SelectItem key={section.id} value={section.id}>
                      {section.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </div>


      <div className="grid grid-cols-1 xl:grid-cols-6 gap-6">
        {/* Main Content Area (wider) */}
        <div className={"" + (sidebarCollapsed ? ' xl:col-span-6' : ' xl:col-span-5')}>
          <Card className="p-6">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-6 h-10">
                <TabsTrigger value="browse" className="flex items-center gap-2 text-sm">
                  <BookOpen className="w-4 h-4" />
                  Browse Questions
                </TabsTrigger>
                <TabsTrigger value="selected" className="flex items-center gap-2 text-sm">
                  <CheckSquare className="w-4 h-4" />
                  Selected Questions
                </TabsTrigger>
              </TabsList>

              <TabsContent value="browse" className="space-y-4">
                {/* Navigation Breadcrumb */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2 text-sm">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={navigateToCategories}
                      className={`text-muted-foreground hover:text-foreground ${categoryView === 'categories' ? 'text-blue-600 font-medium' : ''}`}
                    >
                      <Folder className="h-4 w-4 mr-1" />
                      Categories
                    </Button>
                    {categoryView === 'subcategories' && (
                      <>
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                        <span className="text-blue-600 font-medium">{selectedParentCategory?.name}</span>
                      </>
                    )}
                    {categoryView === 'questions' && (
                      <>
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => navigateToSubcategories(selectedParentCategory)}
                          className="text-muted-foreground hover:text-foreground"
                        >
                          {selectedParentCategory?.name}
                        </Button>
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                        <span className="text-blue-600 font-medium">{selectedSubcategory?.name}</span>
                      </>
                    )}
                  </div>
                  
                  {categoryView !== 'categories' && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={navigateToCategories}
                      className="flex items-center gap-2"
                    >
                      <ArrowLeft className="h-4 w-4" />
                      Back to Categories
                    </Button>
                  )}
                </div>

                {/* Categories */}
                {categoryView === 'categories' && (
                  <div className="bg-white border rounded-lg overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <tbody className="bg-white divide-y divide-gray-200">
                          {getParentCategories().map((category) => (
                            <tr 
                              key={category.id} 
                              className="hover:bg-gray-50 cursor-pointer transition-colors"
                              onClick={() => navigateToSubcategories(category)}
                            >
                              <td className="px-4 py-3 whitespace-nowrap">
                                <div className="flex items-center">
                                  <div 
                                    className="w-3 h-3 rounded-full mr-3"
                                    style={{ backgroundColor: category.color || '#3B82F6' }}
                                  />
                                  <div className="text-sm font-medium text-gray-900">
                                    {category.name}
                                  </div>
                                </div>
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap">
                                <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-blue-100 text-blue-800">
                                  {category.question_count || 0} questions
                                </span>
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap">
                                <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-green-100 text-green-800">
                                  {getSubcategories(category.id).length} subcategories
                                </span>
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap text-sm font-medium">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    navigateToSubcategories(category);
                                  }}
                                  className="text-blue-600 hover:text-blue-900 h-8 px-3"
                                >
                                  Select
                                </Button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* Subcategories */}
                {categoryView === 'subcategories' && (
                  <div className="space-y-4">
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <h3 className="text-lg font-semibold text-blue-900 mb-2">
                        Select Subcategory in {selectedParentCategory?.name}
                      </h3>
                      <p className="text-sm text-blue-700">
                        Choose a subcategory to view its questions
                      </p>
                    </div>
                    
                    <div className="bg-white border rounded-lg overflow-hidden">
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <tbody className="bg-white divide-y divide-gray-200">
                            {getSubcategories(selectedParentCategory?.id).map((subcategory) => (
                              <tr 
                                key={subcategory.id} 
                                className="hover:bg-gray-50 cursor-pointer transition-colors"
                                onClick={() => navigateToQuestions(subcategory)}
                              >
                                <td className="px-4 py-3 whitespace-nowrap">
                                  <div className="flex items-center">
                                    <div 
                                      className="w-3 h-3 rounded-full mr-3"
                                      style={{ backgroundColor: subcategory.color || '#3B82F6' }}
                                    />
                                    <div className="text-sm font-medium text-gray-900">
                                      {subcategory.name}
                                    </div>
                                  </div>
                                </td>
                                <td className="px-4 py-3 whitespace-nowrap">
                                  <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-blue-100 text-blue-800">
                                    {subcategory.question_count || 0} questions
                                  </span>
                                </td>
                                <td className="px-4 py-3 whitespace-nowrap text-sm font-medium">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      navigateToQuestions(subcategory);
                                    }}
                                    className="text-blue-600 hover:text-blue-900 h-8 px-3"
                                  >
                                    Select
                                  </Button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                )}

                {/* Questions */}
                {categoryView === 'questions' && (
                  <div className="space-y-4">
                    {/* Questions Header */}
                    <div className="bg-green-50 p-4 rounded-lg">
                      <h3 className="text-lg font-semibold text-green-900 mb-2">
                        Questions in {selectedSubcategory?.name}
                      </h3>
                      <p className="text-sm text-green-700">
                        Browse and select questions from this subcategory
                      </p>
                    </div>
                    
                {/* Search and Filters */}
                <Card className="p-4 sticky top-0 z-10 bg-white">
                  <div className="flex flex-col md:flex-row md:items-end gap-4">
                        <div className="flex-1">
                          <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                            <Input
                              placeholder="Search questions..."
                              value={searchTerm}
                              onChange={(e) => setSearchTerm(e.target.value)}
                              className="pl-10"
                            />
                          </div>
                        </div>
                    <Select value={filterType} onValueChange={setFilterType}>
                      <SelectTrigger className="w-full md:w-48">
                            <SelectValue placeholder="Question Type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All Types</SelectItem>
                            <SelectItem value="multiple_choice">Multiple Choice</SelectItem>
                            <SelectItem value="single_choice">Single Choice</SelectItem>
                            <SelectItem value="true_false">True/False</SelectItem>
                            <SelectItem value="short_answer">Short Answer</SelectItem>
                            <SelectItem value="essay">Essay</SelectItem>
                            <SelectItem value="coding">Coding</SelectItem>
                            <SelectItem value="fill_blanks">Fill in Blanks</SelectItem>
                          </SelectContent>
                        </Select>
                    <Select value={filterDifficulty} onValueChange={setFilterDifficulty}>
                      <SelectTrigger className="w-full md:w-48">
                            <SelectValue placeholder="Difficulty" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All Levels</SelectItem>
                            <SelectItem value="beginner">Beginner</SelectItem>
                            <SelectItem value="intermediate">Intermediate</SelectItem>
                            <SelectItem value="advanced">Advanced</SelectItem>
                            <SelectItem value="expert">Expert</SelectItem>
                          </SelectContent>
                        </Select>
                        <Button 
                          variant="outline" 
                          onClick={() => {
                            setSearchTerm('');
                            setFilterType('all');
                            setFilterDifficulty('all');
                          }}
                      className="w-full md:w-auto"
                        >
                          Reset
                        </Button>
                      </div>
                    </Card>

                    {/* Questions Table */}
                    {loading ? (
                      <div className="text-center py-12">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                        <p className="text-gray-500">Loading questions...</p>
                      </div>
                    ) : questions.length === 0 ? (
                      <Card className="text-center py-12">
                        <CardContent>
                          <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                          <h3 className="text-lg font-semibold mb-2">No questions found</h3>
                          <p className="text-muted-foreground mb-4">
                            {searchTerm || filterType !== 'all' || filterDifficulty !== 'all' 
                              ? "Try adjusting your search criteria or filters."
                              : "No questions available in this category."
                            }
                          </p>
                          <Button onClick={handleCreateNewQuestion} className="flex items-center gap-2">
                            <PlusCircle className="w-4 h-4" />
                            Create New Question
                          </Button>
                        </CardContent>
                      </Card>
                    ) : (
                      <div className="bg-white border rounded-lg overflow-hidden">
                        <div>
                          <table className="w-full">
                            <tbody className="bg-white divide-y divide-gray-200">
                              {questions.map((question) => (
                                <tr 
                                  key={question.id} 
                                  className="hover:bg-gray-50 transition-colors align-top"
                                >
                                  <td className="px-4 py-3">
                                    <div className="flex items-center">
                                      <div 
                                        className="w-3 h-3 rounded-full mr-3"
                                        style={{ backgroundColor: getQuestionTypeColor(question.question_type) }}
                                      />
                                      <div className="text-sm font-medium text-gray-900 whitespace-normal break-words">
                                        {question.title || question.content}
                                      </div>
                                    </div>
                                  </td>
                                  <td className="px-4 py-3">
                                    <span className="text-xs text-gray-500">
                                      {getQuestionTypeLabel(question.question_type)}
                                    </span>
                                  </td>
                                  <td className="px-4 py-3">
                                    <Badge className={getDifficultyColor(question.difficulty_level)}>
                                      {question.difficulty_level}
                                    </Badge>
                                  </td>
                                  <td className="px-4 py-3">
                                    <span className="text-sm text-gray-500">
                                      {question.points || 1} pts
                                    </span>
                                  </td>
                                  <td className="px-4 py-3">
                                    <span className="text-sm text-gray-500">
                                      {question.time_limit_seconds ? `${question.time_limit_seconds}s` : 'No limit'}
                                    </span>
                                  </td>
                                  <td className="px-4 py-3 whitespace-nowrap text-sm font-medium">
                                    <div className="flex items-center gap-2">
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => handleViewQuestion(question)}
                                        className="text-blue-600 hover:text-blue-900 h-8 px-3"
                                      >
                                        <Eye className="w-4 h-4 mr-1" />
                                        View
                                      </Button>
                                      <Button
                                        variant="default"
                                        size="sm"
                                        onClick={() => handleAddQuestion(question)}
                                        disabled={!selectedSection}
                                        className="h-8 px-3"
                                      >
                                        <Plus className="w-4 h-4 mr-1" />
                                        Add
                                      </Button>
                                    </div>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="selected" className="space-y-4">
                <div className="space-y-4">
                  {formData.sections.map((section) => (
                    <Card key={section.id} className="p-4">
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="text-lg font-semibold text-gray-900">{section.name}</h4>
                        <Badge variant="outline" className="text-sm px-2 py-1">
                          {section.questions.length} questions
                        </Badge>
                      </div>
                      
                      {section.questions.length === 0 ? (
                        <div className="text-center py-8 bg-gray-50 rounded-lg">
                          <AlertCircle className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                          <p className="text-gray-500">No questions added to this section yet.</p>
                        </div>
                      ) : (
                        <div className="bg-white border rounded-lg overflow-hidden">
                          <div className="overflow-x-auto">
                            <table className="w-full">
                              <tbody className="bg-white divide-y divide-gray-200">
                                {section.questions.map((question, index) => (
                                  <tr key={question.section_question_id || index} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-4 py-3 whitespace-nowrap">
                                      <div className="flex items-center">
                                        <div 
                                          className="w-3 h-3 rounded-full mr-3"
                                          style={{ backgroundColor: getQuestionTypeColor(question.question_type) }}
                                        />
                                        <div className="text-sm font-medium text-gray-900 whitespace-normal break-words">
                                          {question.title || 'Untitled Question'}
                                        </div>
                                      </div>
                                    </td>
                                    <td className="px-4 py-3 whitespace-nowrap">
                                      <span className="text-xs text-gray-500">
                                        {getQuestionTypeLabel(question.question_type)}
                                      </span>
                                    </td>
                                    <td className="px-4 py-3 whitespace-nowrap">
                                      <Badge className={getDifficultyColor(question.difficulty_level)}>
                                        {question.difficulty_level}
                                      </Badge>
                                    </td>
                                    <td className="px-4 py-3 whitespace-nowrap">
                                      <span className="text-sm text-gray-500">
                                        {question.points || 1} pts
                                      </span>
                                    </td>
                                    <td className="px-4 py-3 whitespace-nowrap text-sm font-medium">
                                      <div className="flex items-center gap-2">
                                        <Button
                                          type="button"
                                          variant="ghost"
                                          size="sm"
                                          onClick={() => handleViewQuestion(question)}
                                          className="text-blue-600 hover:text-blue-900 h-8 px-3"
                                        >
                                          <Eye className="w-4 h-4 mr-1" />
                                          View
                                        </Button>
                                        <Button
                                          type="button"
                                          variant="ghost"
                                          size="sm"
                                          onClick={() => handleEditQuestion(question)}
                                          className="text-green-600 hover:text-green-900 h-8 px-3"
                                        >
                                          <Edit3 className="w-4 h-4 mr-1" />
                                          Edit
                                        </Button>
                                        <Button
                                          type="button"
                                          variant="ghost"
                                          size="sm"
                                          onClick={() => removeQuestionFromSection(section.id, question.id)}
                                          className="text-red-600 hover:text-red-900 h-8 px-3"
                                        >
                                          <Trash2 className="w-4 h-4 mr-1" />
                                          Remove
                                        </Button>
                                      </div>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      )}
                    </Card>
                  ))}
                </div>
              </TabsContent>
            </Tabs>
          </Card>
        </div>

        {/* Right Sidebar removed (moved content to header toolbar) */}
      </div>

      {/* Question Preview Modal - Compact Format */}
      {previewQuestion && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-4xl w-full max-h-[85vh] overflow-y-auto shadow-2xl">
            <div className="flex items-center justify-between p-4 border-b">
              <div className="flex items-center gap-2">
                {previewQuestion.question_type === 'coding' && <Code className="h-4 w-4 text-blue-600" />}
                <h3 className="text-xl font-bold text-gray-900">Question Details</h3>
                {previewQuestion.question_type === 'coding' && (
                  <span className="ml-2 text-blue-600 font-medium text-sm">• Coding Question</span>
                )}
              </div>
              <Button
                type="button"
                variant="ghost"
                onClick={() => setPreviewQuestion(null)}
                className="h-8 w-8 p-0 hover:bg-gray-100"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
            
            <div className="p-4 space-y-4">
              {/* Header Card - Compact */}
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-2">
                      <div 
                        className="w-4 h-4 rounded-full"
                        style={{ backgroundColor: getQuestionTypeColor(previewQuestion.question_type) }}
                      />
                      <div>
                        <CardTitle className="text-lg">
                          {previewQuestion.title || 'Untitled Question'}
                        </CardTitle>
                        <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                          {previewQuestion.content}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Badge variant="outline" className="text-xs">
                        {getQuestionTypeLabel(previewQuestion.question_type)}
                      </Badge>
                      <Badge className={`${getDifficultyColor(previewQuestion.difficulty_level)} text-xs`}>
                        {previewQuestion.difficulty_level}
                      </Badge>
                      <Badge variant="secondary" className="text-xs">
                        {previewQuestion.points || 1} pts
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
              </Card>

              {/* Coding Question Specific Content - Compact */}
              {previewQuestion.question_type === 'coding' && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {/* Left Column - Code and Settings */}
                  <div className="space-y-4">
                    {/* Programming Language & Settings */}
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-base flex items-center gap-2">
                          <Settings className="h-4 w-4" />
                          Programming Settings
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <Label className="text-xs font-medium text-muted-foreground">Language</Label>
                            <p className="text-sm font-semibold">
                              {(() => {
                                const codingDetails = previewQuestion.metadata || previewQuestion.coding_details || {};
                                const languages = codingDetails.languages || codingDetails.language || [previewQuestion.programming_language] || ['javascript'];
                                return Array.isArray(languages) ? languages[0] : languages;
                              })()}
                            </p>
                          </div>
                          <div>
                            <Label className="text-xs font-medium text-muted-foreground">Points</Label>
                            <p className="text-sm font-semibold text-primary">
                              {previewQuestion.points || 1} pts
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Starter Code */}
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-base flex items-center gap-2">
                          <Code className="h-4 w-4" />
                          Starter Code
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <div className="bg-gray-900 text-gray-100 p-3 rounded-lg font-mono text-xs overflow-x-auto max-h-32">
                          <pre className="whitespace-pre-wrap">
                            {(() => {
                              const codingDetails = previewQuestion.metadata || previewQuestion.coding_details || {};
                              const languages = codingDetails.languages || codingDetails.language || [previewQuestion.programming_language] || ['javascript'];
                              const currentLanguage = Array.isArray(languages) ? languages[0] : languages;
                              
                              const starterCode = 
                                codingDetails.starter_codes?.[currentLanguage] ||
                                codingDetails.starterCodes?.[currentLanguage] ||
                                codingDetails.starter_code ||
                                codingDetails.starterCode ||
                                '// No starter code provided';
                              
                              return starterCode;
                            })()}
                          </pre>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Solution Code */}
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-base flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-green-600" />
                          Solution Code
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <div className="bg-green-900 text-green-100 p-3 rounded-lg font-mono text-xs overflow-x-auto max-h-32">
                          <pre className="whitespace-pre-wrap">
                            {(() => {
                              const codingDetails = previewQuestion.metadata || previewQuestion.coding_details || {};
                              const languages = codingDetails.languages || codingDetails.language || [previewQuestion.programming_language] || ['javascript'];
                              const currentLanguage = Array.isArray(languages) ? languages[0] : languages;
                              
                              const solutionCode = 
                                codingDetails.solution_codes?.[currentLanguage] ||
                                codingDetails.solutionCodes?.[currentLanguage] ||
                                codingDetails.solution_code ||
                                codingDetails.solutionCode ||
                                '// Solution code not provided';
                              
                              return solutionCode;
                            })()}
                          </pre>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Right Column - Test Cases and Details */}
                  <div className="space-y-4">
                    {/* Test Cases */}
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-base flex items-center gap-2">
                          <TestTube className="h-4 w-4" />
                          Test Cases
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <div className="space-y-2 max-h-64 overflow-y-auto">
                          {(previewQuestion.metadata?.test_cases || 
                            previewQuestion.coding_details?.test_cases || 
                            previewQuestion.test_cases || 
                            []).map((testCase, index) => (
                            <div key={index} className="border rounded p-2 bg-muted/30">
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-xs font-semibold">Test {index + 1}</span>
                                {testCase.hidden && (
                                  <Badge variant="outline" className="text-xs">Hidden</Badge>
                                )}
                              </div>
                              <div className="grid grid-cols-2 gap-2 text-xs">
                                <div>
                                  <Label className="text-xs text-muted-foreground">Input</Label>
                                  <div className="bg-gray-100 p-1 rounded font-mono text-xs">
                                    {testCase.input || testCase.test_input || 'No input'}
                                  </div>
                                </div>
                                <div>
                                  <Label className="text-xs text-muted-foreground">Output</Label>
                                  <div className="bg-green-100 p-1 rounded font-mono text-xs">
                                    {testCase.output || testCase.expected_output || 'No output'}
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                          {(!previewQuestion.metadata?.test_cases && 
                            !previewQuestion.coding_details?.test_cases && 
                            !previewQuestion.test_cases) && (
                            <div className="text-center py-4 text-muted-foreground">
                              <TestTube className="h-6 w-6 mx-auto mb-1" />
                              <p className="text-xs">No test cases defined</p>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>

                    {/* Time Limit */}
                    {previewQuestion.time_limit_seconds && (
                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-base flex items-center gap-2">
                            <Clock className="h-4 w-4" />
                            Time Limit
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-0">
                          <p className="text-lg font-bold text-primary">
                            {previewQuestion.time_limit_seconds} seconds
                          </p>
                        </CardContent>
                      </Card>
                    )}
                  </div>
                </div>
              )}

              {/* Standard Question Content (for non-coding questions) - Compact */}
              {previewQuestion.question_type !== 'coding' && (
                <Card>
                  <CardContent className="space-y-3">
                    <div>
                      <h3 className="font-semibold mb-1 text-sm">Question Content</h3>
                      <p className="text-sm text-muted-foreground whitespace-pre-wrap line-clamp-3">
                        {previewQuestion.content}
                      </p>
                    </div>
                    
                    {previewQuestion.options && previewQuestion.options.length > 0 && (
                      <div>
                        <h3 className="font-semibold mb-1 text-sm">Options</h3>
                        <div className="space-y-1 max-h-32 overflow-y-auto">
                          {previewQuestion.options.map((option, index) => (
                            <div key={index} className="flex items-center space-x-2 p-1 bg-muted/30 rounded text-xs">
                              <span className="font-medium text-primary">{String.fromCharCode(65 + index)}.</span>
                              <span className="flex-1">{option}</span>
                              {previewQuestion.correct_answers && previewQuestion.correct_answers.includes(option) && (
                                <Badge className="bg-green-100 text-green-700 border-green-200 text-xs">
                                  <CheckSquare className="w-3 h-3 mr-1" />
                                  Correct
                                </Badge>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {previewQuestion.correct_answer && (
                      <div>
                        <h3 className="font-semibold mb-1 text-sm">Correct Answer</h3>
                        <div className="p-2 bg-green-50 border border-green-200 rounded">
                          <p className="text-xs text-green-700 font-medium">
                            {Array.isArray(previewQuestion.correct_answer) 
                              ? previewQuestion.correct_answer.join(', ')
                              : previewQuestion.correct_answer
                            }
                          </p>
                        </div>
                      </div>
                    )}
                    
                    {previewQuestion.explanation && (
                      <div>
                        <h3 className="font-semibold mb-1 text-sm">Explanation</h3>
                        <div className="p-2 bg-blue-50 border border-blue-200 rounded">
                          <p className="text-xs text-blue-700 line-clamp-2">
                            {previewQuestion.explanation}
                          </p>
                        </div>
                      </div>
                    )}
                    
                    <div className="flex items-center justify-between pt-2 border-t text-xs">
                      <div className="flex items-center space-x-3 text-muted-foreground">
                        <span className="flex items-center">
                          <Clock className="h-3 w-3 mr-1" />
                          {previewQuestion.time_limit_seconds ? `${previewQuestion.time_limit_seconds}s` : 'No limit'}
                        </span>
                        <span className="font-medium text-foreground">
                          {previewQuestion.points || 1} points
                        </span>
                      </div>
                      <div className="text-muted-foreground">
                        {previewQuestion.created_at && `Created: ${new Date(previewQuestion.created_at).toLocaleDateString()}`}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Tags */}
              {previewQuestion.tags && previewQuestion.tags.length > 0 && (
                <Card>
                  <CardContent className="pt-3">
                    <h3 className="font-semibold mb-1 text-sm">Tags</h3>
                    <div className="flex items-center gap-1 flex-wrap">
                      {previewQuestion.tags.map((tag, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
              
              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setPreviewQuestion(null)}
                  size="sm"
                  className="px-4"
                >
                  Close
                </Button>
                <Button
                  type="button"
                  onClick={() => {
                    handleAddQuestion(previewQuestion);
                    setPreviewQuestion(null);
                  }}
                  size="sm"
                  className="px-4"
                >
                  Add to Section
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 