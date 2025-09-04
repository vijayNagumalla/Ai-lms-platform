import React, { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
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
  Type
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Question Selection</h2>
          <p className="text-gray-600 mt-1">
            Browse and select questions from your question bank to add to your assessment sections.
          </p>
        </div>
        <div className="flex gap-2">
          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button 
                variant="outline" 
                className="flex items-center gap-2"
              >
                <PlusCircle className="w-4 h-4" />
                Create New Question
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Create New Question</DialogTitle>
                <DialogDescription>
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
            className="flex items-center gap-2"
            disabled={loading}
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Breadcrumb Navigation */}
      {categoryBreadcrumb.length > 0 && (
        <div className="flex items-center space-x-2 text-sm">
          <Button
            variant="ghost"
            size="sm"
            onClick={navigateToCategories}
            className="text-muted-foreground hover:text-foreground"
          >
            <Folder className="h-4 w-4 mr-1" />
            Categories
          </Button>
          {categoryBreadcrumb.map((item, index) => (
            <React.Fragment key={item.id}>
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  if (index === 0) {
                    navigateToSubcategories(categories.find(c => c.id === item.id));
                  }
                }}
                className="text-muted-foreground hover:text-foreground"
              >
                {item.name}
              </Button>
            </React.Fragment>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Main Content Area */}
        <div className="lg:col-span-3">
          <Card className="p-6">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="browse" className="flex items-center gap-2">
                  <BookOpen className="w-4 h-4" />
                  Browse Questions
                </TabsTrigger>
                <TabsTrigger value="selected" className="flex items-center gap-2">
                  <CheckSquare className="w-4 h-4" />
                  Selected Questions
                </TabsTrigger>
              </TabsList>

              <TabsContent value="browse" className="space-y-6">
                {/* Category Navigation */}
                <Tabs value={categoryView} onValueChange={setCategoryView} className="space-y-4">
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="categories">Categories</TabsTrigger>
                    <TabsTrigger value="subcategories" disabled={!selectedParentCategory}>
                      Subcategories
                    </TabsTrigger>
                    <TabsTrigger value="questions" disabled={!selectedSubcategory}>
                      Questions
                    </TabsTrigger>
                  </TabsList>

                  {/* Categories Tab */}
                  <TabsContent value="categories" className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                      {getParentCategories().map((category) => (
                        <Card 
                          key={category.id} 
                          className="h-full hover:shadow-lg transition-shadow cursor-pointer"
                          onClick={() => navigateToSubcategories(category)}
                        >
                          <CardHeader>
                            <div className="flex items-center space-x-2">
                              <div 
                                className="w-4 h-4 rounded-full"
                                style={{ backgroundColor: category.color || '#3B82F6' }}
                              />
                              <CardTitle className="text-lg">{category.name}</CardTitle>
                            </div>
                          </CardHeader>
                          <CardContent>
                            <p className="text-sm text-muted-foreground mb-4">
                              {category.description || 'No description provided'}
                            </p>
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-muted-foreground">
                                {category.question_count || 0} questions
                              </span>
                              <span className="text-muted-foreground">
                                {getSubcategories(category.id).length} subcategories
                              </span>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </TabsContent>

                  {/* Subcategories Tab */}
                  <TabsContent value="subcategories" className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                      {getSubcategories(selectedParentCategory?.id).map((subcategory) => (
                        <Card 
                          key={subcategory.id} 
                          className="h-full hover:shadow-lg transition-shadow cursor-pointer"
                          onClick={() => navigateToQuestions(subcategory)}
                        >
                          <CardHeader>
                            <div className="flex items-center space-x-2">
                              <div 
                                className="w-4 h-4 rounded-full"
                                style={{ backgroundColor: subcategory.color || '#3B82F6' }}
                              />
                              <CardTitle className="text-lg">{subcategory.name}</CardTitle>
                            </div>
                          </CardHeader>
                          <CardContent>
                            <p className="text-sm text-muted-foreground mb-4">
                              {subcategory.description || 'No description provided'}
                            </p>
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-muted-foreground">
                                {subcategory.question_count || 0} questions
                              </span>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </TabsContent>

                  {/* Questions Tab */}
                  <TabsContent value="questions" className="space-y-4">
                {/* Search and Filters */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center">
                          <Filter className="mr-2 h-4 w-4" />
                          Search & Filters
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          {/* Search Bar */}
                          <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                    <Input
                      placeholder="Search questions by title or content..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>

                          {/* Filter Grid */}
                          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                            <div>
                              <label className="text-sm font-medium">Question Type</label>
                  <Select value={filterType} onValueChange={setFilterType}>
                                <SelectTrigger>
                                  <SelectValue />
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
                            </div>

                            <div>
                              <label className="text-sm font-medium">Difficulty</label>
                  <Select value={filterDifficulty} onValueChange={setFilterDifficulty}>
                                <SelectTrigger>
                                  <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Levels</SelectItem>
                                  <SelectItem value="beginner">Beginner</SelectItem>
                                  <SelectItem value="intermediate">Intermediate</SelectItem>
                                  <SelectItem value="advanced">Advanced</SelectItem>
                      <SelectItem value="expert">Expert</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                            <div className="flex items-end">
                              <Button 
                                variant="outline" 
                                onClick={() => {
                                  setSearchTerm('');
                                  setFilterType('all');
                                  setFilterDifficulty('all');
                                }}
                              >
                                Reset Filters
                              </Button>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                {/* Question List */}
                    <div className="space-y-3">
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
                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                          {questions.map((question) => (
                            <Card 
                              key={question.id} 
                              className="h-full hover:shadow-lg transition-shadow cursor-pointer"
                              onClick={() => setPreviewQuestion(question)}
                            >
                              <CardHeader>
                            <div className="flex items-start justify-between">
                                  <div className="flex items-center space-x-2">
                                    <div 
                                      className="w-4 h-4 rounded-full"
                                      style={{ backgroundColor: getQuestionTypeColor(question.question_type) }}
                                    />
                                    <CardTitle className="text-lg line-clamp-2">
                                      {question.title || question.content.substring(0, 50)}
                                    </CardTitle>
                                </div>
                                  <div className="flex items-center space-x-1" onClick={(e) => e.stopPropagation()}>
                                <Button
                                      variant="ghost"
                                  size="sm"
                                  onClick={() => setPreviewQuestion(question)}
                                >
                                      <Eye className="h-3 w-3" />
                                </Button>
                                <Button
                                  variant="default"
                                  size="sm"
                                  onClick={() => handleAddQuestion(question)}
                                  disabled={!selectedSection}
                                >
                                      <Plus className="h-3 w-3" />
                                </Button>
                              </div>
                            </div>
                              </CardHeader>
                              <CardContent>
                                <p className="text-sm text-muted-foreground mb-4 line-clamp-3">
                                  {question.content.substring(0, 120)}...
                                </p>
                                <div className="space-y-3">
                                  <div className="flex items-center justify-between">
                                    <Badge className={getDifficultyColor(question.difficulty_level)}>
                                      {question.difficulty_level}
                                    </Badge>
                                    <Badge variant="outline" className="text-xs">
                                {getQuestionTypeLabel(question.question_type)}
                              </Badge>
                                  </div>
                                  <div className="flex items-center justify-between text-sm">
                                    <span className="text-muted-foreground">
                                {question.points || 1} points
                                    </span>
                                    <span className="text-muted-foreground flex items-center">
                                      <Clock className="h-3 w-3 mr-1" />
                                      {question.time_limit_seconds ? `${question.time_limit_seconds}s` : 'No limit'}
                                    </span>
                                </div>
                              {question.tags && question.tags.length > 0 && (
                                    <div className="flex items-center gap-1 flex-wrap">
                                  {question.tags.slice(0, 2).map((tag, index) => (
                                    <Badge key={index} variant="outline" className="text-xs">
                                      {tag}
                                    </Badge>
                                  ))}
                                  {question.tags.length > 2 && (
                                    <Badge variant="outline" className="text-xs">
                                      +{question.tags.length - 2}
                                    </Badge>
                                  )}
                                </div>
                              )}
                            </div>
                              </CardContent>
                        </Card>
                          ))}
                        </div>
                  )}
                </div>
                  </TabsContent>
                </Tabs>
              </TabsContent>

              <TabsContent value="selected" className="space-y-4">
                <div className="space-y-3">
                  {formData.sections.map((section) => (
                    <Card key={section.id} className="p-4">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-semibold text-gray-900">{section.name}</h4>
                        <Badge variant="outline" className="text-xs">
                          {section.questions.length} questions
                        </Badge>
                      </div>
                      
                      {section.questions.length === 0 ? (
                        <p className="text-gray-500 text-sm italic">No questions added to this section yet.</p>
                      ) : (
                        <div className="space-y-2">
                          {section.questions.map((question, index) => (
                            <div key={question.section_question_id || index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium truncate">{question.title || 'Untitled Question'}</p>
                                <p className="text-xs text-gray-500">{getQuestionTypeLabel(question.question_type)} • {question.points || 1} points</p>
                              </div>
                              <div className="flex items-center gap-2 ml-2">
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => removeQuestionFromSection(section.id, question.id)}
                                  className="h-6 w-6 p-0 text-red-600 hover:text-red-700"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </Card>
                  ))}
                </div>
              </TabsContent>
            </Tabs>
          </Card>
        </div>

        {/* Right Sidebar */}
        <div className="space-y-4">
          {/* Section Assignment */}
          <Card className="p-4">
            <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <CheckSquare className="w-4 h-4" />
              Assign to Section
            </h3>
            
            <div className="space-y-3">
              <Select value={selectedSection || ''} onValueChange={setSelectedSection}>
                <SelectTrigger>
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

              {selectedSection && (
                <div className="text-sm text-gray-600 space-y-1">
                  <p><strong>Section:</strong> {formData.sections.find(s => s.id === selectedSection)?.name}</p>
                  <p><strong>Questions:</strong> {formData.sections.find(s => s.id === selectedSection)?.questions.length}</p>
                </div>
              )}
            </div>
          </Card>

          {/* Assessment Summary */}
          <Card className="p-4">
            <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Assessment Summary
            </h3>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-center">
                <div className="bg-blue-50 p-3 rounded-lg">
                  <p className="text-2xl font-bold text-blue-600">{totalQuestions}</p>
                  <p className="text-xs text-blue-600">Total Questions</p>
                </div>
                <div className="bg-green-50 p-3 rounded-lg">
                  <p className="text-2xl font-bold text-green-600">{Number(totalPoints).toFixed(2)}</p>
                  <p className="text-xs text-green-600">Total Points</p>
                </div>
              </div>
              
              <div className="space-y-2">
                {formData.sections.map((section) => (
                  <div key={section.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                    <span className="text-sm font-medium">{section.name}</span>
                    <Badge variant="outline" className="text-xs">
                      {section.questions.length} questions
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Question Preview Modal */}
      {previewQuestion && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-gray-900">Question Preview</h3>
              <Button
                type="button"
                variant="ghost"
                onClick={() => setPreviewQuestion(null)}
                className="h-8 w-8 p-0"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
            
            <div className="space-y-6">
              {/* Question Header */}
              <div className="border-b pb-4">
                <h4 className="font-semibold text-xl text-gray-900 mb-2">{previewQuestion.title || 'Untitled Question'}</h4>
                <div className="flex items-center gap-3 flex-wrap">
                  <Badge variant="outline" className="border-blue-200 text-blue-700">
                    {getQuestionTypeLabel(previewQuestion.question_type)}
                  </Badge>
                  <Badge className={`border ${getDifficultyColor(previewQuestion.difficulty_level)}`}>
                    {getDifficultyIcon(previewQuestion.difficulty_level)}
                    <span className="ml-1 capitalize">{previewQuestion.difficulty_level}</span>
                  </Badge>
                  <Badge variant="secondary">
                    {previewQuestion.points || 1} points
                  </Badge>
                  {previewQuestion.time_limit_seconds && (
                    <div className="flex items-center gap-1 text-sm text-gray-500 bg-gray-50 px-3 py-1 rounded">
                      <Clock className="w-4 h-4" />
                      {previewQuestion.time_limit_seconds} seconds
                    </div>
                  )}
                </div>
              </div>

              {/* Question Content */}
              <div className="space-y-4">
                <div>
                  <h5 className="font-semibold text-gray-900 mb-2">Question Content</h5>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">{previewQuestion.content}</p>
                  </div>
                </div>

                {/* Options for Multiple Choice/Single Choice Questions */}
                {['multiple_choice', 'single_choice'].includes(previewQuestion.question_type) && (
                  <div>
                    <h5 className="font-semibold text-gray-900 mb-2">Options</h5>
                    {previewQuestion.options && previewQuestion.options.length > 0 ? (
                      <div className="space-y-2">
                        {previewQuestion.options.map((option, index) => (
                          <div key={index} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                            <div className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-medium">
                              {String.fromCharCode(65 + index)}
                            </div>
                            <span className="flex-1 text-gray-700">{option}</span>
                            {previewQuestion.correct_answers && previewQuestion.correct_answers.includes(option) && (
                              <Badge className="bg-green-100 text-green-700 border-green-200">
                                <CheckSquare className="w-3 h-3 mr-1" />
                                Correct
                              </Badge>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <p className="text-gray-500 text-sm">No options defined for this question.</p>
                      </div>
                    )}
                  </div>
                )}

                {/* Coding Details */}
                {previewQuestion.question_type === 'coding' && (
                  <div>
                    <h5 className="font-semibold text-gray-900 mb-2">Coding Details</h5>
                    {getCodingDetails(previewQuestion)}
                  </div>
                )}

                {/* Tags */}
                {previewQuestion.tags && previewQuestion.tags.length > 0 && (
                  <div>
                    <h5 className="font-semibold text-gray-900 mb-2">Tags</h5>
                    <div className="flex items-center gap-2 flex-wrap">
                      {previewQuestion.tags.map((tag, index) => (
                        <Badge key={index} variant="outline" className="text-sm">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              
              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setPreviewQuestion(null)}
                >
                  Close
                </Button>
                <Button
                  type="button"
                  onClick={() => {
                    handleAddQuestion(previewQuestion);
                    setPreviewQuestion(null);
                  }}
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