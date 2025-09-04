import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Plus, 
  Search, 
  Filter, 
  Edit, 
  Trash2, 
  Eye,
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
  Link,
  MoreHorizontal,
  Download,
  Upload,
  ChevronDown,
  Info,
  BookOpen,
  BarChart3,
  Tag,
  FolderOpen,
  ArrowLeft,
  Folder,
  ChevronRight,
  Play,
  TestTube2,
  Copy,
  ExternalLink
} from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import apiService from '@/services/api';
import QuestionCreationPage from './QuestionCreationPage';

const QuestionBankPage = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  
  // State for questions and data
  const [questions, setQuestions] = useState([]);
  const [categories, setCategories] = useState([]);
  const [tags, setTags] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalQuestions, setTotalQuestions] = useState(0);
  
  // Category navigation state
  const [categoryView, setCategoryView] = useState('categories'); // 'categories', 'subcategories', 'questions'
  const [selectedParentCategory, setSelectedParentCategory] = useState(null);
  const [selectedSubcategory, setSelectedSubcategory] = useState(null);
  const [categoryBreadcrumb, setCategoryBreadcrumb] = useState([]);
  const [showAllQuestions, setShowAllQuestions] = useState(false);
  
  // Search and filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [questionTypeFilter, setQuestionTypeFilter] = useState('all');
  const [difficultyFilter, setDifficultyFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [tagFilter, setTagFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState('DESC');
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(12);
  const [categoriesPage, setCategoriesPage] = useState(1);
  const [subcategoriesPage, setSubcategoriesPage] = useState(1);
  const [categoriesPageSize, setCategoriesPageSize] = useState(9);
  const [subcategoriesPageSize, setSubcategoriesPageSize] = useState(9);
  
  // Dialog states
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showViewDialog, setShowViewDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showCreateCategory, setShowCreateCategory] = useState(false);
  const [showEditCategory, setShowEditCategory] = useState(false);
  const [showDeleteCategory, setShowDeleteCategory] = useState(false);

  const [selectedQuestion, setSelectedQuestion] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState(null);
  
  // Category form state
  const [categoryForm, setCategoryForm] = useState({
    name: '',
    description: '',
    parent_id: null,
    color: '#3B82F6',
    icon: ''
  });
  
  // Question types for filter
  const questionTypes = [
    { value: 'all', label: 'All Types' },
    { value: 'multiple_choice', label: 'Multiple Choice' },
    { value: 'single_choice', label: 'Single Choice' },
    { value: 'true_false', label: 'True/False' },
    { value: 'short_answer', label: 'Short Answer' },
    { value: 'essay', label: 'Essay' },
    { value: 'coding', label: 'Coding' },
    { value: 'fill_blanks', label: 'Fill in the Blanks' }
  ];
  
  const difficultyLevels = [
    { value: 'all', label: 'All Difficulties' },
    { value: 'beginner', label: 'Beginner' },
    { value: 'intermediate', label: 'Intermediate' },
    { value: 'advanced', label: 'Advanced' },
    { value: 'expert', label: 'Expert' }
  ];

  useEffect(() => {
    loadData();
  }, [currentPage, pageSize, sortBy, sortOrder, categoriesPage, categoriesPageSize, subcategoriesPage, subcategoriesPageSize]);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (selectedSubcategory || showAllQuestions) {
        fetchQuestions();
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchTerm, questionTypeFilter, difficultyFilter, categoryFilter, tagFilter, statusFilter, showAllQuestions, selectedSubcategory]);

  const loadData = async () => {
    try {
      await Promise.all([
        loadCategories(),
        loadTags()
      ]);
      if (selectedSubcategory || showAllQuestions) {
        await fetchQuestions();
      }
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  const loadCategories = async () => {
    try {
      const response = await apiService.get('/question-bank/categories');
      if (response.success) {
        setCategories(response.data || []);
      }
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  };

  const loadTags = async () => {
    try {
      const response = await apiService.get('/question-bank/tags');
      if (response.success) {
        setTags(response.data || []);
      }
    } catch (error) {
      console.error('Error loading tags:', error);
    }
  };

  const fetchQuestions = async () => {
    try {
      setLoading(true);
      
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: pageSize.toString(),
        sort_by: sortBy,
        sort_order: sortOrder
      });

      if (searchTerm) params.append('search', searchTerm);
      
      // Handle grouped question types - we'll filter on frontend
      if (questionTypeFilter !== 'all' && questionTypeFilter !== 'choice_questions' && questionTypeFilter !== 'text_questions') {
        params.append('question_type', questionTypeFilter);
      }
      
      if (difficultyFilter !== 'all') params.append('difficulty_level', difficultyFilter);
      if (categoryFilter !== 'all') params.append('category_id', categoryFilter);
      if (tagFilter !== 'all') params.append('tags', tagFilter);
      if (statusFilter !== 'all') params.append('status', statusFilter);

      // If we're in a specific category, filter by that category
      if (selectedSubcategory) {
        params.append('category_id', selectedSubcategory.id);
      } else if (selectedParentCategory) {
        params.append('category_id', selectedParentCategory.id);
      }
      // If showing all questions, don't filter by category

      const response = await apiService.get(`/question-bank/questions?${params.toString()}`);
      
      if (response.success) {
        let filteredQuestions = response.data.questions || response.data;
        
        // Apply frontend filtering for grouped question types
        if (questionTypeFilter === 'choice_questions') {
          filteredQuestions = filteredQuestions.filter(q => 
            ['multiple_choice', 'single_choice', 'true_false'].includes(q.question_type)
          );
        } else if (questionTypeFilter === 'text_questions') {
          filteredQuestions = filteredQuestions.filter(q => 
            ['short_answer', 'essay'].includes(q.question_type)
          );
        }
        
        setQuestions(filteredQuestions);
        setTotalQuestions(response.data.pagination?.total || filteredQuestions.length);
      }
    } catch (error) {
      console.error('Error fetching questions:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load questions"
      });
    } finally {
      setLoading(false);
    }
  };

  // Category navigation functions
  const navigateToSubcategories = (category) => {
    setSelectedParentCategory(category);
    setSelectedSubcategory(null);
    setCategoryView('categories'); // Stay in categories tab
    setCategoryBreadcrumb([{ id: category.id, name: category.name, type: 'category' }]);
  };

  const navigateToQuestions = (subcategory) => {
    setSelectedSubcategory(subcategory);
    setCategoryView('categories'); // Stay in categories tab
    setCategoryBreadcrumb([
      { id: selectedParentCategory.id, name: selectedParentCategory.name, type: 'category' },
      { id: subcategory.id, name: subcategory.name, type: 'subcategory' }
    ]);
    fetchQuestions();
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

  // Category management functions
  const handleCreateCategory = async () => {
    try {
      const response = await apiService.post('/question-bank/categories', categoryForm);
      if (response.success) {
        toast({
          title: "Success",
          description: "Category created successfully"
        });
        setShowCreateCategory(false);
        setCategoryForm({
          name: '',
          description: '',
          parent_id: null,
          color: '#3B82F6',
          icon: ''
        });
        loadCategories();
      }
    } catch (error) {
      console.error('Error creating category:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to create category"
      });
    }
  };

  const handleUpdateCategory = async () => {
    try {
      const response = await apiService.put(`/question-bank/categories/${selectedCategory.id}`, categoryForm);
      if (response.success) {
        toast({
          title: "Success",
          description: "Category updated successfully"
        });
        setShowEditCategory(false);
        setSelectedCategory(null);
        setCategoryForm({
          name: '',
          description: '',
          parent_id: null,
          color: '#3B82F6',
          icon: ''
        });
        loadCategories();
      }
    } catch (error) {
      console.error('Error updating category:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update category"
      });
    }
  };

  const handleDeleteCategory = async () => {
    try {
      const response = await apiService.delete(`/question-bank/categories/${selectedCategory.id}`);
      if (response.success) {
        toast({
          title: "Success",
          description: "Category deleted successfully"
        });
        setShowDeleteCategory(false);
        setSelectedCategory(null);
        loadCategories();
        // Navigate back to categories if we're in a deleted category
        if (categoryView === 'subcategories' && selectedParentCategory?.id === selectedCategory?.id) {
          navigateToCategories();
        }
      }
    } catch (error) {
      console.error('Error deleting category:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to delete category"
      });
    }
  };

  const openEditCategory = (category) => {
    setSelectedCategory(category);
    setCategoryForm({
      name: category.name,
      description: category.description || '',
      parent_id: category.parent_id,
      color: category.color || '#3B82F6',
      icon: category.icon || ''
    });
    setShowEditCategory(true);
  };

  const openDeleteCategory = (category) => {
    setSelectedCategory(category);
    setShowDeleteCategory(true);
  };

  // Question management functions
  const handleDeleteQuestion = async () => {
    if (!selectedQuestion) return;

    try {
      const response = await apiService.deleteQuestion(selectedQuestion.id);
      if (response.success) {
        toast({
          title: "Success",
          description: "Question deleted successfully"
        });
        setShowDeleteDialog(false);
        setSelectedQuestion(null);
        fetchQuestions();
      }
    } catch (error) {
      console.error('Error deleting question:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error.response?.data?.message || "Failed to delete question"
      });
    }
  };

  const handleStatusChange = async (questionId, newStatus) => {
    try {
      const response = await apiService.updateQuestion(questionId, { status: newStatus });
      if (response.success) {
        toast({
          title: "Success",
          description: "Question status updated successfully"
        });
        fetchQuestions();
      }
    } catch (error) {
      console.error('Error updating question status:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update question status"
      });
    }
  };

  const openEditDialog = async (question) => {
    try {
      console.log('Opening edit dialog for question:', question);
      const response = await apiService.get(`/question-bank/questions/${question.id}`);
      if (response.success) {
        console.log('Question data loaded:', response.data);
        setSelectedQuestion(response.data);
        setShowEditDialog(true);
      } else {
        console.error('Failed to load question details:', response);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to load question details"
        });
      }
    } catch (error) {
      console.error('Error fetching question details:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load question details"
      });
    }
  };

  const openViewDialog = async (question) => {
    try {
      const response = await apiService.get(`/question-bank/questions/${question.id}`);
      if (response.success) {
        setSelectedQuestion(response.data);
    setShowViewDialog(true);
      } else {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to load question details"
        });
      }
    } catch (error) {
      console.error('Error fetching question details:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load question details"
      });
    }
  };

  const openDeleteDialog = (question) => {
    setSelectedQuestion(question);
    setShowDeleteDialog(true);
  };



  // Utility functions
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

  const getQuestionTypeLabel = (type) => {
    const typeObj = questionTypes.find(t => t.value === type);
    return typeObj ? typeObj.label : type;
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

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800 border-green-200';
      case 'draft': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'archived': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusDisplayText = (status) => {
    switch (status) {
      case 'active': return 'Active';
      case 'draft': return 'Draft';
      case 'archived': return 'Archived';
      default: return 'Draft';
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

  const getQuestionTypeGroupColor = (type) => {
    switch (type) {
      case 'choice_questions': return '#10B981'; // Green
      case 'text_questions': return '#8B5CF6'; // Purple
      case 'coding': return '#3B82F6'; // Blue
      case 'fill_blanks': return '#EF4444'; // Red
      default: return '#6B7280'; // Gray
    }
  };

  const getQuestionTypeGroupLabel = (type) => {
    switch (type) {
      case 'choice_questions': return 'Choice Questions';
      case 'text_questions': return 'Text Questions';
      case 'coding': return 'Coding';
      case 'fill_blanks': return 'Fill Blanks';
      default: return getQuestionTypeLabel(type);
    }
  };
  
  const resetFilters = () => {
    setSearchTerm('');
    setQuestionTypeFilter('all');
    setDifficultyFilter('all');
    setCategoryFilter('all');
    setTagFilter('all');
    setStatusFilter('all');
    setCurrentPage(1);
  };

  // Pagination calculations
  const totalPages = Math.ceil(totalQuestions / pageSize);
  const totalCategoriesPages = Math.ceil(getParentCategories().length / categoriesPageSize);
  const totalSubcategoriesPages = Math.ceil(categories.filter(cat => cat.parent_id !== null).length / subcategoriesPageSize);
  
  // Get paginated data
  const getPaginatedCategories = () => {
    const startIndex = (categoriesPage - 1) * categoriesPageSize;
    const endIndex = startIndex + categoriesPageSize;
    return getParentCategories().slice(startIndex, endIndex);
  };
  
  const getPaginatedSubcategories = () => {
    const startIndex = (subcategoriesPage - 1) * subcategoriesPageSize;
    const endIndex = startIndex + subcategoriesPageSize;
    return categories.filter(cat => cat.parent_id !== null).slice(startIndex, endIndex);
  };

  // Reusable pagination component
  const Pagination = ({ currentPage, totalPages, onPageChange, pageSize, onPageSizeChange, totalItems, itemsLabel }) => {
    const getPageNumbers = () => {
      const pages = [];
      const maxVisiblePages = 5;
      
      if (totalPages <= maxVisiblePages) {
        for (let i = 1; i <= totalPages; i++) {
          pages.push(i);
        }
      } else {
        if (currentPage <= 3) {
          for (let i = 1; i <= 4; i++) {
            pages.push(i);
          }
          pages.push('...');
          pages.push(totalPages);
        } else if (currentPage >= totalPages - 2) {
          pages.push(1);
          pages.push('...');
          for (let i = totalPages - 3; i <= totalPages; i++) {
            pages.push(i);
          }
        } else {
          pages.push(1);
          pages.push('...');
          for (let i = currentPage - 1; i <= currentPage + 1; i++) {
            pages.push(i);
          }
          pages.push('...');
          pages.push(totalPages);
        }
      }
      
      return pages;
    };

    return (
      <div className="flex items-center justify-between mt-6">
        <div className="flex items-center space-x-2">
          <Label htmlFor="page-size">Show</Label>
          <Select value={pageSize.toString()} onValueChange={(value) => onPageSizeChange(parseInt(value))}>
            <SelectTrigger className="w-20">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="6">6</SelectItem>
              <SelectItem value="9">9</SelectItem>
              <SelectItem value="12">12</SelectItem>
            </SelectContent>
          </Select>
          <span className="text-sm text-muted-foreground">per page</span>
          <span className="text-sm text-muted-foreground">
            ({totalItems} {itemsLabel})
          </span>
        </div>
        
        {totalPages > 1 && (
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
            >
              Previous
            </Button>
            
            <div className="flex items-center space-x-1">
              {getPageNumbers().map((page, index) => (
                <React.Fragment key={index}>
                  {page === '...' ? (
                    <span className="px-2 text-muted-foreground">...</span>
                  ) : (
                    <Button
                      variant={currentPage === page ? "default" : "outline"}
                      size="sm"
                      onClick={() => onPageChange(page)}
                      className="w-8 h-8 p-0"
                    >
                      {page}
                    </Button>
                  )}
                </React.Fragment>
              ))}
            </div>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
            >
              Next
            </Button>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Question Bank</h1>
          <p className="text-muted-foreground">
            Organize and manage your question library by categories
          </p>
        </div>
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Create Question
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create New Question</DialogTitle>
              <DialogDescription>
                Add a new question to your question bank
              </DialogDescription>
            </DialogHeader>
            <QuestionCreationPage />
          </DialogContent>
        </Dialog>
      </div>

      {/* Breadcrumb Navigation */}
      {categoryBreadcrumb.length > 0 && (
        <div className="flex items-center space-x-2 text-sm">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setSelectedParentCategory(null);
              setSelectedSubcategory(null);
              setCategoryBreadcrumb([]);
              setShowAllQuestions(false);
            }}
            className="text-muted-foreground hover:text-foreground"
          >
            <Folder className="h-4 w-4 mr-1" />
            All Categories
          </Button>
          {categoryBreadcrumb.map((item, index) => (
            <React.Fragment key={item.id}>
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  if (index === 0) {
                    // Navigate back to parent category
                    const parentCategory = categories.find(c => c.id === item.id);
                    setSelectedParentCategory(parentCategory);
                    setSelectedSubcategory(null);
                    setCategoryBreadcrumb([{ id: parentCategory.id, name: parentCategory.name, type: 'category' }]);
                  } else if (index === 1) {
                    // Navigate back to subcategory
                    const parentCategory = categories.find(c => c.id === categoryBreadcrumb[0].id);
                    const subcategory = categories.find(c => c.id === item.id);
                    setSelectedParentCategory(parentCategory);
                    setSelectedSubcategory(subcategory);
                    setCategoryBreadcrumb([
                      { id: parentCategory.id, name: parentCategory.name, type: 'category' },
                      { id: subcategory.id, name: subcategory.name, type: 'subcategory' }
                    ]);
                    fetchQuestions();
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

      {/* Main Content */}
      <Tabs value={categoryView} onValueChange={(value) => {
        setCategoryView(value);
        if (value === 'questions') {
          setShowAllQuestions(true);
          setSelectedParentCategory(null);
          setSelectedSubcategory(null);
          setCategoryBreadcrumb([]);
          fetchQuestions();
        } else if (value === 'subcategories') {
          setShowAllQuestions(false);
          setSelectedParentCategory(null);
          setSelectedSubcategory(null);
          setCategoryBreadcrumb([]);
        } else if (value === 'categories') {
          setShowAllQuestions(false);
          setSelectedParentCategory(null);
          setSelectedSubcategory(null);
          setCategoryBreadcrumb([]);
        }
      }} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="categories">Categories</TabsTrigger>
          <TabsTrigger value="subcategories">All Subcategories</TabsTrigger>
          <TabsTrigger value="questions">All Questions</TabsTrigger>
        </TabsList>

        {/* Categories Tab */}
        <TabsContent value="categories" className="space-y-6">
          {!selectedParentCategory && !selectedSubcategory ? (
            // Show main categories
            <Card>
              <CardHeader>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <CardTitle>Question Categories</CardTitle>
                    <CardDescription>
                      Organize questions by categories and subcategories
                    </CardDescription>
                  </div>
                  <Button onClick={() => setShowCreateCategory(true)} className="mt-4 sm:mt-0">
                    <Plus className="mr-2 h-4 w-4" />
                    Create Category
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {getPaginatedCategories().map((category) => (
                    <Card 
                      key={category.id} 
                      className="h-full hover:shadow-lg transition-shadow cursor-pointer"
                      onClick={() => navigateToSubcategories(category)}
                    >
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div className="flex items-center space-x-2">
                            <div 
                              className="w-4 h-4 rounded-full"
                              style={{ backgroundColor: category.color }}
                            />
                            <CardTitle className="text-lg">{category.name}</CardTitle>
                          </div>
                          <div className="flex items-center space-x-1" onClick={(e) => e.stopPropagation()}>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => openEditCategory(category)}
                            >
                              <Edit className="h-3 w-3" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => openDeleteCategory(category)}
                              className="text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
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
                
                <Pagination
                  currentPage={categoriesPage}
                  totalPages={totalCategoriesPages}
                  onPageChange={setCategoriesPage}
                  pageSize={categoriesPageSize}
                  onPageSizeChange={setCategoriesPageSize}
                  totalItems={getParentCategories().length}
                  itemsLabel="categories"
                />
              </CardContent>
            </Card>
          ) : selectedParentCategory && !selectedSubcategory ? (
            // Show subcategories of selected parent category
            <Card>
              <CardHeader>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <CardTitle>Subcategories in {selectedParentCategory.name}</CardTitle>
                    <CardDescription>
                      Browse subcategories and their questions
                    </CardDescription>
                  </div>
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      setCategoryForm({
                        name: '',
                        description: '',
                        parent_id: selectedParentCategory.id,
                        color: '#3B82F6',
                        icon: ''
                      });
                      setShowCreateCategory(true);
                    }}
                    size="sm"
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Add Subcategory
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {getSubcategories(selectedParentCategory.id).map((subcategory) => (
                    <Card 
                      key={subcategory.id} 
                      className="h-full hover:shadow-lg transition-shadow cursor-pointer"
                      onClick={() => navigateToQuestions(subcategory)}
                    >
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div className="flex items-center space-x-2">
                            <div 
                              className="w-4 h-4 rounded-full"
                              style={{ backgroundColor: subcategory.color || '#3B82F6' }}
                            />
                            <CardTitle className="text-lg">{subcategory.name}</CardTitle>
                          </div>
                          <div className="flex items-center space-x-1" onClick={(e) => e.stopPropagation()}>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => openEditCategory(subcategory)}
                            >
                              <Edit className="h-3 w-3" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => openDeleteCategory(subcategory)}
                              className="text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
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
              </CardContent>
            </Card>
          ) : (
            // Show questions in tabular format
            <div className="space-y-6">
              {/* Question Type Tabs with Search */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <FileText className="mr-2 h-4 w-4" />
                    Questions in {selectedSubcategory.name}
                  </CardTitle>
                  <CardDescription>
                    Browse and manage questions in this subcategory
                    {questionTypeFilter !== 'all' && (
                      <span className="ml-2 text-primary font-medium">
                        • {getQuestionTypeGroupLabel(questionTypeFilter)}
                      </span>
                    )}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
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

                  {/* Question Type Tabs */}
                  <Tabs value={questionTypeFilter} onValueChange={setQuestionTypeFilter} className="w-full">
                    <TabsList className="flex w-full h-10 bg-muted/50 rounded-lg p-1 gap-1">
                      <TabsTrigger 
                        value="all" 
                        className="flex-1 text-sm font-medium data-[state=active]:bg-white data-[state=active]:text-black data-[state=active]:shadow-sm transition-all duration-200 rounded-md"
                      >
                        All
                      </TabsTrigger>
                      <TabsTrigger 
                        value="choice_questions" 
                        className="flex-1 text-sm font-medium data-[state=active]:bg-white data-[state=active]:text-black data-[state=active]:shadow-sm transition-all duration-200 rounded-md"
                      >
                        Choice Questions
                      </TabsTrigger>
                      <TabsTrigger 
                        value="text_questions" 
                        className="flex-1 text-sm font-medium data-[state=active]:bg-white data-[state=active]:text-black data-[state=active]:shadow-sm transition-all duration-200 rounded-md"
                      >
                        Text Questions
                      </TabsTrigger>
                      <TabsTrigger 
                        value="coding" 
                        className="flex-1 text-sm font-medium data-[state=active]:bg-white data-[state=active]:text-black data-[state=active]:shadow-sm transition-all duration-200 rounded-md"
                      >
                        Coding
                      </TabsTrigger>
                      <TabsTrigger 
                        value="fill_blanks" 
                        className="flex-1 text-sm font-medium data-[state=active]:bg-white data-[state=active]:text-black data-[state=active]:shadow-sm transition-all duration-200 rounded-md"
                      >
                        Fill Blanks
                      </TabsTrigger>
                    </TabsList>
                  </Tabs>
                </CardContent>
              </Card>

              {/* Results Summary */}
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  Showing {questions.length} of {totalQuestions} questions
                </p>
              </div>

              {/* Questions Table */}
              {loading ? (
                <Card>
                  <CardContent className="p-6">
                    <div className="space-y-3">
                      {Array.from({ length: pageSize }).map((_, i) => (
                        <div key={i} className="flex items-center space-x-4 animate-pulse">
                          <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                          <div className="h-4 bg-gray-200 rounded w-1/6"></div>
                          <div className="h-4 bg-gray-200 rounded w-1/6"></div>
                          <div className="h-4 bg-gray-200 rounded w-1/6"></div>
                          <div className="h-4 bg-gray-200 rounded w-1/6"></div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ) : questions.length === 0 ? (
                <Card className="text-center py-12">
                  <CardContent>
                    <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No questions found</h3>
                    <p className="text-muted-foreground mb-4">
                      {searchTerm || questionTypeFilter !== 'all' || difficultyFilter !== 'all' 
                        ? "Try adjusting your search criteria or filters."
                        : "No questions available in this subcategory."
                      }
                    </p>
                    <Button onClick={() => setShowCreateDialog(true)} className="flex items-center gap-2">
                      <Plus className="w-4 h-4" />
                      Create New Question
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <Card>
                  <CardContent className="p-0">
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b bg-muted/50">
                            <th className="text-left p-3 font-medium text-sm w-1/3">Question</th>
                            <th 
                              className="text-left p-3 font-medium text-sm cursor-pointer hover:bg-muted/70 transition-colors w-24"
                              onClick={() => {
                                if (sortBy === 'question_type') {
                                  setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                                } else {
                                  setSortBy('question_type');
                                  setSortOrder('asc');
                                }
                              }}
                            >
                              <div className="flex items-center gap-1">
                                <span>Type</span>
                                {sortBy === 'question_type' && (
                                  <span className="text-xs">
                                    {sortOrder === 'asc' ? '↑' : '↓'}
                                  </span>
                                )}
                              </div>
                            </th>
                            <th 
                              className="text-center p-3 font-medium text-sm cursor-pointer hover:bg-muted/70 transition-colors w-24"
                              onClick={() => {
                                if (sortBy === 'difficulty_level') {
                                  setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                                } else {
                                  setSortBy('difficulty_level');
                                  setSortOrder('asc');
                                }
                              }}
                            >
                              <div className="flex items-center justify-center gap-1">
                                <span>Difficulty</span>
                                {sortBy === 'difficulty_level' && (
                                  <span className="text-xs">
                                    {sortOrder === 'asc' ? '↑' : '↓'}
                                  </span>
                                )}
                              </div>
                            </th>
                            <th className="text-center p-3 font-medium text-sm w-20">Points</th>
                            <th className="text-center p-3 font-medium text-sm w-24">Status</th>
                            <th className="text-center p-3 font-medium text-sm w-28">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {questions.map((question) => (
                            <tr 
                              key={question.id} 
                              className="border-b hover:bg-muted/20 transition-colors"
                            >
                              <td className="p-3">
                                <div className="max-w-xs">
                                  <div className="font-medium line-clamp-1 text-sm">
                                    {question.title || 'Untitled Question'}
                                  </div>
                                  <div className="text-xs text-muted-foreground line-clamp-2 mt-1">
                                    {question.content}
                                  </div>
                                </div>
                              </td>
                              <td className="p-3">
                                <div className="flex items-center gap-2">
                                  <div 
                                    className="w-2.5 h-2.5 rounded-full"
                                    style={{ backgroundColor: getQuestionTypeColor(question.question_type) }}
                                  />
                                  <span className="text-xs font-medium">
                                    {getQuestionTypeLabel(question.question_type)}
                                  </span>
                                </div>
                              </td>
                              <td className="p-3">
                                <div className="flex items-center justify-center">
                                  <Badge className={`${getDifficultyColor(question.difficulty_level)} text-xs px-2 py-0.5`}>
                                    {question.difficulty_level}
                                  </Badge>
                                </div>
                              </td>
                              <td className="p-3">
                                <div className="flex items-center justify-center">
                                  <span className="text-xs font-medium text-center">
                                    {question.points || 1} pts
                                  </span>
                                </div>
                              </td>
                              <td className="p-3">
                                <div className="flex items-center justify-center">
                                  <Select
                                    value={question.status || 'draft'}
                                    onValueChange={(value) => handleStatusChange(question.id, value)}
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    <SelectTrigger className={`h-6 w-16 text-xs font-medium rounded-full border-0 shadow-sm hover:shadow-md transition-all duration-200 ${getStatusColor(question.status)}`}>
                                      <div className="flex items-center gap-1.5">
                                        <div className={`w-1.5 h-1.5 rounded-full ${
                                          question.status === 'active' ? 'bg-green-500' :
                                          question.status === 'draft' ? 'bg-yellow-500' :
                                          question.status === 'archived' ? 'bg-gray-600' : 'bg-gray-500'
                                        }`}></div>
                                        <span className="text-xs">{getStatusDisplayText(question.status)}</span>
                                      </div>
                                    </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="draft">
                                      <div className="flex items-center space-x-2">
                                        <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
                                        <span className="font-medium">Draft</span>
                                      </div>
                                    </SelectItem>
                                    <SelectItem value="active">
                                      <div className="flex items-center space-x-2">
                                        <div className="w-2 h-2 rounded-full bg-green-500"></div>
                                        <span className="font-medium">Active</span>
                                      </div>
                                    </SelectItem>
                                    <SelectItem value="archived">
                                      <div className="flex items-center space-x-2">
                                        <div className="w-2 h-2 rounded-full bg-gray-600"></div>
                                        <span className="font-medium">Archived</span>
                                      </div>
                                    </SelectItem>
                                  </SelectContent>
                                </Select>
                                </div>
                              </td>
                              <td className="p-3">
                                <div className="flex items-center justify-center gap-1" onClick={(e) => e.stopPropagation()}>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => openViewDialog(question)}
                                    className="h-8 w-8 p-0 hover:bg-blue-50"
                                    title="View Details"
                                  >
                                    <Eye className="h-4 w-4 text-blue-600" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => openEditDialog(question)}
                                    className="h-8 w-8 p-0 hover:bg-orange-50"
                                    title="Edit Question"
                                  >
                                    <Edit className="h-4 w-4 text-orange-600" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => openDeleteDialog(question)}
                                    className="h-8 w-8 p-0 hover:bg-red-50"
                                    title="Delete Question"
                                  >
                                    <Trash2 className="h-4 w-4 text-red-600" />
                                  </Button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Questions Pagination */}
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
                pageSize={pageSize}
                onPageSizeChange={setPageSize}
                totalItems={totalQuestions}
                itemsLabel="questions"
              />
            </div>
          )}
        </TabsContent>

        {/* Subcategories Tab */}
        <TabsContent value="subcategories" className="space-y-6">
          {!selectedSubcategory ? (
            // Show all subcategories
            <Card>
              <CardHeader>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <CardTitle>All Subcategories</CardTitle>
                    <CardDescription>
                      Browse all subcategories across all main categories
                    </CardDescription>
                  </div>
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      setCategoryForm({
                        name: '',
                        description: '',
                        parent_id: null,
                        color: '#3B82F6',
                        icon: ''
                      });
                      setShowCreateCategory(true);
                    }}
                    size="sm"
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Add Subcategory
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {getPaginatedSubcategories().map((subcategory) => {
                    const parentCategory = categories.find(cat => cat.id === subcategory.parent_id);
                    return (
                      <Card 
                        key={subcategory.id} 
                        className="h-full hover:shadow-lg transition-shadow cursor-pointer"
                        onClick={() => {
                          setSelectedParentCategory(parentCategory);
                          setSelectedSubcategory(subcategory);
                          setCategoryBreadcrumb([
                            { id: parentCategory.id, name: parentCategory.name, type: 'category' },
                            { id: subcategory.id, name: subcategory.name, type: 'subcategory' }
                          ]);
                          fetchQuestions();
                        }}
                      >
                        <CardHeader>
                          <div className="flex items-start justify-between">
                            <div className="flex items-center space-x-2">
                              <div 
                                className="w-4 h-4 rounded-full"
                                style={{ backgroundColor: subcategory.color || '#3B82F6' }}
                              />
                              <CardTitle className="text-lg">{subcategory.name}</CardTitle>
                            </div>
                            <div className="flex items-center space-x-1" onClick={(e) => e.stopPropagation()}>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => openEditCategory(subcategory)}
                              >
                                <Edit className="h-3 w-3" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => openDeleteCategory(subcategory)}
                                className="text-red-600 hover:text-red-700"
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <p className="text-sm text-muted-foreground mb-2">
                            {subcategory.description || 'No description provided'}
                          </p>
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">
                              {subcategory.question_count || 0} questions
                            </span>
                            <span className="text-muted-foreground">
                              Parent: {parentCategory?.name || 'Unknown'}
                            </span>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
                
                <Pagination
                  currentPage={subcategoriesPage}
                  totalPages={totalSubcategoriesPages}
                  onPageChange={setSubcategoriesPage}
                  pageSize={subcategoriesPageSize}
                  onPageSizeChange={setSubcategoriesPageSize}
                  totalItems={categories.filter(cat => cat.parent_id !== null).length}
                  itemsLabel="subcategories"
                />
              </CardContent>
            </Card>
          ) : (
            // Show questions in tabular format
            <div className="space-y-6">
              {/* Question Type Tabs with Search */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <FileText className="mr-2 h-4 w-4" />
                    Questions in {selectedSubcategory.name}
                  </CardTitle>
                  <CardDescription>
                    Browse and manage questions in this subcategory
                    {questionTypeFilter !== 'all' && (
                      <span className="ml-2 text-primary font-medium">
                        • {getQuestionTypeGroupLabel(questionTypeFilter)}
                      </span>
                    )}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
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

                  {/* Question Type Tabs */}
                  <Tabs value={questionTypeFilter} onValueChange={setQuestionTypeFilter} className="w-full">
                    <TabsList className="flex w-full h-10 bg-muted/50 rounded-lg p-1 gap-1">
                      <TabsTrigger 
                        value="all" 
                        className="flex-1 text-sm font-medium data-[state=active]:bg-white data-[state=active]:text-black data-[state=active]:shadow-sm transition-all duration-200 rounded-md"
                      >
                        All
                      </TabsTrigger>
                      <TabsTrigger 
                        value="choice_questions" 
                        className="flex-1 text-sm font-medium data-[state=active]:bg-white data-[state=active]:text-black data-[state=active]:shadow-sm transition-all duration-200 rounded-md"
                      >
                        Choice Questions
                      </TabsTrigger>
                      <TabsTrigger 
                        value="text_questions" 
                        className="flex-1 text-sm font-medium data-[state=active]:bg-white data-[state=active]:text-black data-[state=active]:shadow-sm transition-all duration-200 rounded-md"
                      >
                        Text Questions
                      </TabsTrigger>
                      <TabsTrigger 
                        value="coding" 
                        className="flex-1 text-sm font-medium data-[state=active]:bg-white data-[state=active]:text-black data-[state=active]:shadow-sm transition-all duration-200 rounded-md"
                      >
                        Coding
                      </TabsTrigger>
                      <TabsTrigger 
                        value="fill_blanks" 
                        className="flex-1 text-sm font-medium data-[state=active]:bg-white data-[state=active]:text-black data-[state=active]:shadow-sm transition-all duration-200 rounded-md"
                      >
                        Fill Blanks
                      </TabsTrigger>
                    </TabsList>
                  </Tabs>
                </CardContent>
              </Card>

              {/* Results Summary */}
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  Showing {questions.length} of {totalQuestions} questions
                </p>
              </div>

              {/* Questions Table */}
              {loading ? (
                <Card>
                  <CardContent className="p-6">
                    <div className="space-y-3">
                      {Array.from({ length: pageSize }).map((_, i) => (
                        <div key={i} className="flex items-center space-x-4 animate-pulse">
                          <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                          <div className="h-4 bg-gray-200 rounded w-1/6"></div>
                          <div className="h-4 bg-gray-200 rounded w-1/6"></div>
                          <div className="h-4 bg-gray-200 rounded w-1/6"></div>
                          <div className="h-4 bg-gray-200 rounded w-1/6"></div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ) : questions.length === 0 ? (
                <Card className="text-center py-12">
                  <CardContent>
                    <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No questions found</h3>
                    <p className="text-muted-foreground mb-4">
                      {searchTerm || questionTypeFilter !== 'all' || difficultyFilter !== 'all' 
                        ? "Try adjusting your search criteria or filters."
                        : "No questions available in this subcategory."
                      }
                    </p>
                    <Button onClick={() => setShowCreateDialog(true)} className="flex items-center gap-2">
                      <Plus className="w-4 h-4" />
                      Create New Question
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <Card>
                  <CardContent className="p-0">
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b bg-muted/50">
                            <th className="text-left p-4 font-medium">Question</th>
                            <th 
                              className="text-left p-4 font-medium cursor-pointer hover:bg-muted/70 transition-colors"
                              onClick={() => {
                                if (sortBy === 'question_type') {
                                  setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                                } else {
                                  setSortBy('question_type');
                                  setSortOrder('asc');
                                }
                              }}
                            >
                              <div className="flex items-center space-x-1">
                                <span>Type</span>
                                {sortBy === 'question_type' && (
                                  <span className="text-xs">
                                    {sortOrder === 'asc' ? '↑' : '↓'}
                                  </span>
                                )}
                              </div>
                            </th>
                            <th 
                              className="text-center p-4 font-medium cursor-pointer hover:bg-muted/70 transition-colors"
                              onClick={() => {
                                if (sortBy === 'difficulty_level') {
                                  setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                                } else {
                                  setSortBy('difficulty_level');
                                  setSortOrder('asc');
                                }
                              }}
                            >
                              <div className="flex items-center justify-center space-x-1">
                                <span>Difficulty</span>
                                {sortBy === 'difficulty_level' && (
                                  <span className="text-xs">
                                    {sortOrder === 'asc' ? '↑' : '↓'}
                                  </span>
                                )}
                              </div>
                            </th>
                            <th className="text-center p-4 font-medium">Points</th>
                            <th className="text-center p-4 font-medium">Status</th>
                            <th className="text-center p-4 font-medium">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {questions.map((question) => (
                            <tr 
                              key={question.id} 
                              className="border-b hover:bg-muted/30 cursor-pointer"
                              onClick={() => openViewDialog(question)}
                            >
                              <td className="p-4">
                                <div className="max-w-xs">
                                  <div className="font-medium line-clamp-1">
                                    {question.title || 'Untitled Question'}
                                  </div>
                                  <div className="text-sm text-muted-foreground line-clamp-2 mt-1">
                                    {question.content}
                                  </div>
                                </div>
                              </td>
                              <td className="p-4">
                                <div className="flex items-center space-x-2">
                                  <div 
                                    className="w-3 h-3 rounded-full"
                                    style={{ backgroundColor: getQuestionTypeColor(question.question_type) }}
                                  />
                                  <span className="text-sm">
                                    {getQuestionTypeLabel(question.question_type)}
                                  </span>
                                </div>
                              </td>
                              <td className="p-4">
                                <div className="flex items-center justify-center">
                                  <Badge className={getDifficultyColor(question.difficulty_level)}>
                                    {question.difficulty_level}
                                  </Badge>
                                </div>
                              </td>
                              <td className="p-4">
                                <div className="flex items-center justify-center">
                                  <span className="text-sm font-medium">
                                    {question.points || 1} pts
                                  </span>
                                </div>
                              </td>
                              <td className="p-4">
                                <div className="flex items-center justify-center">
                                  <Select
                                    value={question.status || 'draft'}
                                    onValueChange={(value) => handleStatusChange(question.id, value)}
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    <SelectTrigger className={`h-7 w-24 text-xs font-semibold rounded-full border-0 shadow-sm hover:shadow-md transition-all duration-200 ${getStatusColor(question.status)}`}>
                                      <div className="flex items-center space-x-2">
                                        <div className={`w-2 h-2 rounded-full ${
                                          question.status === 'active' ? 'bg-green-500' :
                                          question.status === 'draft' ? 'bg-yellow-500' :
                                          question.status === 'archived' ? 'bg-gray-600' : 'bg-gray-500'
                                        }`}></div>
                                        <span>{getStatusDisplayText(question.status)}</span>
                                      </div>
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="draft">
                                        <div className="flex items-center space-x-2">
                                          <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
                                          <span className="font-medium">Draft</span>
                                        </div>
                                      </SelectItem>
                                      <SelectItem value="active">
                                        <div className="flex items-center space-x-2">
                                          <div className="w-2 h-2 rounded-full bg-green-500"></div>
                                          <span className="font-medium">Active</span>
                                        </div>
                                      </SelectItem>
                                      <SelectItem value="archived">
                                        <div className="flex items-center space-x-2">
                                          <div className="w-2 h-2 rounded-full bg-gray-600"></div>
                                          <span className="font-medium">Archived</span>
                                        </div>
                                      </SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>
                              </td>
                              <td className="p-4">
                                <div className="flex items-center justify-center space-x-2" onClick={(e) => e.stopPropagation()}>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => openViewDialog(question)}
                                  >
                                    <Eye className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => openEditDialog(question)}
                                  >
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => openDeleteDialog(question)}
                                    className="text-red-600 hover:text-red-700"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Questions Pagination */}
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
                pageSize={pageSize}
                onPageSizeChange={setPageSize}
                totalItems={totalQuestions}
                itemsLabel="questions"
              />
            </div>
          )}
        </TabsContent>

        {/* Questions Tab */}
        <TabsContent value="questions" className="space-y-6">
          {selectedSubcategory && (
            <div className="mb-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSelectedParentCategory(null);
                  setSelectedSubcategory(null);
                  setCategoryBreadcrumb([]);
                  setShowAllQuestions(true);
                  fetchQuestions();
                }}
                className="text-muted-foreground hover:text-foreground"
              >
                <ArrowLeft className="h-4 w-4 mr-1" />
                Show All Questions
              </Button>
            </div>
          )}

          {/* Question Type Tabs with Search */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <FileText className="mr-2 h-4 w-4" />
                All Questions
              </CardTitle>
              <CardDescription>
                Browse and manage all questions by type
                {questionTypeFilter !== 'all' && (
                  <span className="ml-2 text-primary font-medium">
                    • {getQuestionTypeGroupLabel(questionTypeFilter)}
                  </span>
                )}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
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

              {/* Question Type Tabs */}
              <Tabs value={questionTypeFilter} onValueChange={setQuestionTypeFilter} className="w-full">
                <TabsList className="flex w-full h-10 bg-muted/50 rounded-lg p-1 gap-1">
                  <TabsTrigger 
                    value="all" 
                    className="flex-1 text-sm font-medium data-[state=active]:bg-white data-[state=active]:text-black data-[state=active]:shadow-sm transition-all duration-200 rounded-md"
                  >
                    All
                  </TabsTrigger>
                  <TabsTrigger 
                    value="choice_questions" 
                    className="flex-1 text-sm font-medium data-[state=active]:bg-white data-[state=active]:text-black data-[state=active]:shadow-sm transition-all duration-200 rounded-md"
                  >
                    Choice Questions
                  </TabsTrigger>
                  <TabsTrigger 
                    value="text_questions" 
                    className="flex-1 text-sm font-medium data-[state=active]:bg-white data-[state=active]:text-black data-[state=active]:shadow-sm transition-all duration-200 rounded-md"
                  >
                    Text Questions
                  </TabsTrigger>
                  <TabsTrigger 
                    value="coding" 
                    className="flex-1 text-sm font-medium data-[state=active]:bg-white data-[state=active]:text-black data-[state=active]:shadow-sm transition-all duration-200 rounded-md"
                  >
                    Coding
                  </TabsTrigger>
                  <TabsTrigger 
                    value="fill_blanks" 
                    className="flex-1 text-sm font-medium data-[state=active]:bg-white data-[state=active]:text-black data-[state=active]:shadow-sm transition-all duration-200 rounded-md"
                  >
                    Fill Blanks
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </CardContent>
          </Card>

          {/* Results Summary */}
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Showing {questions.length} of {totalQuestions} questions
            </p>
          </div>

          {/* Questions Table */}
          {loading ? (
            <Card>
              <CardContent className="p-6">
                <div className="space-y-3">
                  {Array.from({ length: pageSize }).map((_, i) => (
                    <div key={i} className="flex items-center space-x-4 animate-pulse">
                      <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                      <div className="h-4 bg-gray-200 rounded w-1/6"></div>
                      <div className="h-4 bg-gray-200 rounded w-1/6"></div>
                      <div className="h-4 bg-gray-200 rounded w-1/6"></div>
                      <div className="h-4 bg-gray-200 rounded w-1/6"></div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ) : questions.length === 0 ? (
            <Card className="text-center py-12">
              <CardContent>
                <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No questions found</h3>
                <p className="text-muted-foreground mb-4">
                  {searchTerm || questionTypeFilter !== 'all' || difficultyFilter !== 'all' 
                    ? "Try adjusting your search criteria or filters."
                    : "No questions available in this category."
                  }
                </p>
                <Button onClick={() => setShowCreateDialog(true)} className="flex items-center gap-2">
                  <Plus className="w-4 h-4" />
                  Create New Question
                </Button>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b bg-muted/50">
                        <th className="text-left p-4 font-medium">Question</th>
                        <th 
                          className="text-left p-4 font-medium cursor-pointer hover:bg-muted/70 transition-colors"
                          onClick={() => {
                            if (sortBy === 'question_type') {
                              setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                            } else {
                              setSortBy('question_type');
                              setSortOrder('asc');
                            }
                          }}
                        >
                          <div className="flex items-center space-x-1">
                            <span>Type</span>
                            {sortBy === 'question_type' && (
                              <span className="text-xs">
                                {sortOrder === 'asc' ? '↑' : '↓'}
                              </span>
                            )}
                          </div>
                        </th>
                        <th 
                          className="text-center p-4 font-medium cursor-pointer hover:bg-muted/70 transition-colors"
                          onClick={() => {
                            if (sortBy === 'difficulty_level') {
                              setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                            } else {
                              setSortBy('difficulty_level');
                              setSortOrder('asc');
                            }
                          }}
                        >
                          <div className="flex items-center justify-center space-x-1">
                            <span>Difficulty</span>
                            {sortBy === 'difficulty_level' && (
                              <span className="text-xs">
                                {sortOrder === 'asc' ? '↑' : '↓'}
                              </span>
                            )}
                          </div>
                        </th>
                        <th className="text-center p-4 font-medium">Points</th>
                        <th className="text-center p-4 font-medium">Status</th>
                        <th className="text-center p-4 font-medium">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {questions.map((question) => (
                        <tr 
                          key={question.id} 
                          className="border-b hover:bg-muted/30 cursor-pointer"
                          onClick={() => openViewDialog(question)}
                        >
                          <td className="p-4">
                            <div className="max-w-xs">
                              <div className="font-medium line-clamp-1">
                                {question.title || 'Untitled Question'}
                              </div>
                              <div className="text-sm text-muted-foreground line-clamp-2 mt-1">
                                {question.content}
                              </div>
                            </div>
                          </td>
                          <td className="p-4">
                            <div className="flex items-center space-x-2">
                              <div 
                                className="w-3 h-3 rounded-full"
                                style={{ backgroundColor: getQuestionTypeColor(question.question_type) }}
                              />
                              <span className="text-sm">
                                {getQuestionTypeLabel(question.question_type)}
                              </span>
                            </div>
                          </td>
                          <td className="p-4">
                            <div className="flex items-center justify-center">
                              <Badge className={getDifficultyColor(question.difficulty_level)}>
                                {question.difficulty_level}
                              </Badge>
                            </div>
                          </td>
                          <td className="p-4">
                            <div className="flex items-center justify-center">
                              <span className="text-sm font-medium">
                                {question.points || 1} pts
                              </span>
                            </div>
                          </td>
                          <td className="p-4">
                            <div className="flex items-center justify-center">
                              <Select
                                value={question.status || 'draft'}
                                onValueChange={(value) => handleStatusChange(question.id, value)}
                                onClick={(e) => e.stopPropagation()}
                              >
                                <SelectTrigger className={`h-7 w-24 text-xs font-semibold rounded-full border-0 shadow-sm hover:shadow-md transition-all duration-200 ${getStatusColor(question.status)}`}>
                                  <div className="flex items-center space-x-2">
                                    <div className={`w-2 h-2 rounded-full ${
                                      question.status === 'active' ? 'bg-green-500' :
                                      question.status === 'draft' ? 'bg-yellow-500' :
                                      question.status === 'archived' ? 'bg-gray-600' : 'bg-gray-500'
                                    }`}></div>
                                    <span>{getStatusDisplayText(question.status)}</span>
                                  </div>
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="draft">
                                    <div className="flex items-center space-x-2">
                                      <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
                                      <span className="font-medium">Draft</span>
                                    </div>
                                  </SelectItem>
                                  <SelectItem value="active">
                                    <div className="flex items-center space-x-2">
                                      <div className="w-2 h-2 rounded-full bg-green-500"></div>
                                      <span className="font-medium">Active</span>
                                    </div>
                                  </SelectItem>
                                  <SelectItem value="archived">
                                    <div className="flex items-center space-x-2">
                                      <div className="w-2 h-2 rounded-full bg-gray-600"></div>
                                      <span className="font-medium">Archived</span>
                                    </div>
                                  </SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </td>
                          <td className="p-4">
                            <div className="flex items-center justify-center space-x-2" onClick={(e) => e.stopPropagation()}>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => openViewDialog(question)}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => openEditDialog(question)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => openDeleteDialog(question)}
                                className="text-red-600 hover:text-red-700"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Questions Pagination */}
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
            pageSize={pageSize}
            onPageSizeChange={setPageSize}
            totalItems={totalQuestions}
            itemsLabel="questions"
          />
        </TabsContent>
      </Tabs>

      {/* Category Create/Edit Dialog */}
      <Dialog open={showCreateCategory || showEditCategory} onOpenChange={(open) => {
        if (!open) {
          setShowCreateCategory(false);
          setShowEditCategory(false);
          setCategoryForm({
            name: '',
            description: '',
            parent_id: null,
            color: '#3B82F6',
            icon: ''
          });
        }
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {showCreateCategory ? 'Create Category' : 'Edit Category'}
            </DialogTitle>
            <DialogDescription>
              {showCreateCategory ? 'Add a new category to organize questions' : 'Update category information'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="category_name">Name</Label>
              <Input
                id="category_name"
                value={categoryForm.name}
                onChange={(e) => setCategoryForm({...categoryForm, name: e.target.value})}
                placeholder="Enter category name"
              />
            </div>
            <div>
              <Label htmlFor="category_description">Description</Label>
              <Input
                id="category_description"
                value={categoryForm.description}
                onChange={(e) => setCategoryForm({...categoryForm, description: e.target.value})}
                placeholder="Enter category description"
              />
            </div>
            <div>
              <Label htmlFor="category_parent">Parent Category</Label>
              <Select 
                value={categoryForm.parent_id || 'none'} 
                onValueChange={(value) => setCategoryForm({...categoryForm, parent_id: value === 'none' ? null : value})}
                disabled={showEditCategory && selectedCategory?.parent_id !== null}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select parent category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No Parent (Main Category)</SelectItem>
                  {getParentCategories().map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="category_color">Color</Label>
              <Input
                id="category_color"
                type="color"
                value={categoryForm.color}
                onChange={(e) => setCategoryForm({...categoryForm, color: e.target.value})}
              />
            </div>
            <div>
              <Label htmlFor="category_icon">Icon (e.g., smiley, book, star)</Label>
              <Input
                id="category_icon"
                value={categoryForm.icon}
                onChange={(e) => setCategoryForm({...categoryForm, icon: e.target.value})}
                placeholder="Enter icon name (e.g., smiley, book, star)"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setShowCreateCategory(false);
              setShowEditCategory(false);
              setCategoryForm({
                name: '',
                description: '',
                parent_id: null,
                color: '#3B82F6',
                icon: ''
              });
            }}>
              Cancel
            </Button>
            <Button onClick={showCreateCategory ? handleCreateCategory : handleUpdateCategory}>
              {showCreateCategory ? 'Create' : 'Update'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Category Delete Dialog */}
      <Dialog open={showDeleteCategory} onOpenChange={setShowDeleteCategory}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Category</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{selectedCategory?.name}"? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => setShowDeleteCategory(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteCategory}>
              Delete
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* View Question Dialog */}
      <Dialog open={showViewDialog} onOpenChange={setShowViewDialog}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {selectedQuestion?.question_type === 'coding' && <Code className="h-5 w-5 text-blue-600" />}
              Question Details
            </DialogTitle>
            <DialogDescription>
              View complete question information
              {selectedQuestion?.question_type === 'coding' && (
                <span className="ml-2 text-blue-600 font-medium">• Coding Question</span>
              )}
            </DialogDescription>
          </DialogHeader>
                    {selectedQuestion && (
            <div className="space-y-6">
              {/* Header Card */}
              <Card>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-3">
                      <div 
                        className="w-5 h-5 rounded-full"
                        style={{ backgroundColor: getQuestionTypeColor(selectedQuestion.question_type) }}
                      />
                      <div>
                        <CardTitle className="text-xl">
                          {selectedQuestion.title || 'Untitled Question'}
                        </CardTitle>
                        <p className="text-sm text-muted-foreground mt-1">
                          {selectedQuestion.content}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge variant="outline" className="text-sm">
                        {getQuestionTypeLabel(selectedQuestion.question_type)}
                      </Badge>
                      <Badge className={`${getDifficultyColor(selectedQuestion.difficulty_level)} text-sm`}>
                        {selectedQuestion.difficulty_level}
                      </Badge>
                      <Badge className={`${getStatusColor(selectedQuestion.status)} text-sm`}>
                        {getStatusDisplayText(selectedQuestion.status)}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
              </Card>

              {/* Coding Question Specific Content */}
              {selectedQuestion.question_type === 'coding' && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Left Column - Code and Settings */}
                  <div className="space-y-6">
                    {/* Programming Language & Settings */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2">
                          <Settings className="h-5 w-5" />
                          Programming Settings
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label className="text-sm font-medium text-muted-foreground">Language</Label>
                            <p className="text-sm font-semibold">
                              {(() => {
                                const codingDetails = selectedQuestion.metadata || selectedQuestion.coding_details || {};
                                const languages = codingDetails.languages || codingDetails.language || ['javascript'];
                                return Array.isArray(languages) ? languages[0] : languages;
                              })()}
                            </p>
                          </div>
                          <div>
                            <Label className="text-sm font-medium text-muted-foreground">Points</Label>
                            <p className="text-sm font-semibold text-primary">
                              {selectedQuestion.points || 1} pts
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Starter Code */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2">
                          <Code className="h-5 w-5" />
                          Starter Code
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="bg-gray-900 text-gray-100 p-4 rounded-lg font-mono text-sm overflow-x-auto">
                          <pre className="whitespace-pre-wrap">
                            {(() => {
                              const codingDetails = selectedQuestion.metadata || selectedQuestion.coding_details || {};
                              const languages = codingDetails.languages || codingDetails.language || ['javascript'];
                              const currentLanguage = Array.isArray(languages) ? languages[0] : languages;
                              
                              // Try multiple possible locations for starter code
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
                      <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2">
                          <CheckCircle className="h-5 w-5 text-green-600" />
                          Solution Code
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="bg-green-900 text-green-100 p-4 rounded-lg font-mono text-sm overflow-x-auto">
                          <pre className="whitespace-pre-wrap">
                            {(() => {
                              const codingDetails = selectedQuestion.metadata || selectedQuestion.coding_details || {};
                              const languages = codingDetails.languages || codingDetails.language || ['javascript'];
                              const currentLanguage = Array.isArray(languages) ? languages[0] : languages;
                              
                              // Try multiple possible locations for solution code
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
                  <div className="space-y-6">
                    {/* Test Cases */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2">
                          <TestTube2 className="h-5 w-5" />
                          Test Cases
                          <Badge variant="secondary" className="ml-2">
                            {(selectedQuestion.metadata?.test_cases || 
                              selectedQuestion.coding_details?.test_cases || 
                              selectedQuestion.test_cases || 
                              []).length} cases
                          </Badge>
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          {(selectedQuestion.metadata?.test_cases || 
                            selectedQuestion.coding_details?.test_cases || 
                            selectedQuestion.test_cases || 
                            []).map((testCase, index) => (
                            <div key={index} className="border rounded-lg p-3 bg-muted/30">
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-sm font-semibold">Test Case {index + 1}</span>
                                {testCase.hidden && (
                                  <Badge variant="outline" className="text-xs">Hidden</Badge>
                                )}
                              </div>
                              <div className="grid grid-cols-2 gap-3 text-sm">
                                <div>
                                  <Label className="text-xs text-muted-foreground">Input</Label>
                                  <div className="bg-gray-100 p-2 rounded font-mono text-xs">
                                    {testCase.input || testCase.test_input || 'No input'}
                                  </div>
                                </div>
                                <div>
                                  <Label className="text-xs text-muted-foreground">Expected Output</Label>
                                  <div className="bg-green-100 p-2 rounded font-mono text-xs">
                                    {testCase.output || testCase.expected_output || 'No output'}
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                          {(!selectedQuestion.metadata?.test_cases && 
                            !selectedQuestion.coding_details?.test_cases && 
                            !selectedQuestion.test_cases) && (
                            <div className="text-center py-4 text-muted-foreground">
                              <TestTube2 className="h-8 w-8 mx-auto mb-2 opacity-50" />
                              <p>No test cases defined</p>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>

                    {/* Explanation */}
                    {selectedQuestion.explanation && (
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-lg flex items-center gap-2">
                            <Info className="h-5 w-5 text-blue-600" />
                            Explanation
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                            <p className="text-sm text-blue-800">
                              {selectedQuestion.explanation}
                            </p>
                          </div>
                        </CardContent>
                      </Card>
                    )}

                    {/* Metadata */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2">
                          <Tag className="h-5 w-5" />
                          Additional Information
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Created</span>
                          <span>{new Date(selectedQuestion.created_at).toLocaleDateString()}</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Last Updated</span>
                          <span>{new Date(selectedQuestion.updated_at || selectedQuestion.created_at).toLocaleDateString()}</span>
                        </div>
                        {selectedQuestion.metadata?.category && (
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">Category</span>
                            <span>{selectedQuestion.metadata.category}</span>
                          </div>
                        )}
                        {selectedQuestion.metadata?.tags && selectedQuestion.metadata.tags.length > 0 && (
                          <div>
                            <span className="text-sm text-muted-foreground">Tags</span>
                            <div className="flex flex-wrap gap-1 mt-1">
                              {selectedQuestion.metadata.tags.map((tag, index) => (
                                <Badge key={index} variant="outline" className="text-xs">
                                  {tag}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </div>
                </div>
              )}

              {/* Standard Question Content (for non-coding questions) */}
              {selectedQuestion.question_type !== 'coding' && (
                <Card>
                  <CardContent className="space-y-4">
                    <div>
                      <h3 className="font-semibold mb-2">Question Content</h3>
                      <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                        {selectedQuestion.content}
                      </p>
                    </div>
                    
                    {selectedQuestion.options && (
                      <div>
                        <h3 className="font-semibold mb-2">Options</h3>
                        <div className="space-y-2">
                          {selectedQuestion.options.map((option, index) => (
                            <div key={index} className="flex items-center space-x-2 p-2 bg-muted/30 rounded">
                              <span className="text-sm font-medium text-primary">{String.fromCharCode(65 + index)}.</span>
                              <span className="text-sm">{option}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {selectedQuestion.correct_answer && (
                      <div>
                        <h3 className="font-semibold mb-2">Correct Answer</h3>
                        <div className="p-3 bg-green-50 border border-green-200 rounded">
                          <p className="text-sm text-green-700 font-medium">
                            {Array.isArray(selectedQuestion.correct_answer) 
                              ? selectedQuestion.correct_answer.join(', ')
                              : selectedQuestion.correct_answer
                            }
                          </p>
                        </div>
                      </div>
                    )}
                    
                    {selectedQuestion.explanation && (
                      <div>
                        <h3 className="font-semibold mb-2">Explanation</h3>
                        <div className="p-3 bg-blue-50 border border-blue-200 rounded">
                          <p className="text-sm text-blue-700">
                            {selectedQuestion.explanation}
                          </p>
                        </div>
                      </div>
                    )}
                    
                    <div className="flex items-center justify-between pt-4 border-t">
                      <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                        <span className="flex items-center">
                          <Clock className="h-4 w-4 mr-1" />
                          {selectedQuestion.time_limit_seconds ? `${selectedQuestion.time_limit_seconds}s` : 'No limit'}
                        </span>
                        <span className="font-medium text-foreground">
                          {selectedQuestion.points || 1} points
                        </span>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Created: {new Date(selectedQuestion.created_at).toLocaleDateString()}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Question Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit className="h-5 w-5" />
              Edit Question
            </DialogTitle>
            <DialogDescription>
              Update the question details and content
            </DialogDescription>
          </DialogHeader>
          {selectedQuestion ? (
            <QuestionCreationPage 
              editMode={true}
              questionData={selectedQuestion}
              onSuccess={() => {
                console.log('Question updated successfully');
                setShowEditDialog(false);
                setSelectedQuestion(null);
                fetchQuestions();
                toast({
                  title: "Success",
                  description: "Question updated successfully"
                });
              }}
            />
          ) : (
            <div className="flex items-center justify-center p-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Question</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this question? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteQuestion}>
              Delete
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default QuestionBankPage; 