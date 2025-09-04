import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Checkbox } from '@/components/ui/checkbox';
import DatePicker from '@/components/ui/date-picker';
import { 
  Filter, 
  X, 
  RefreshCw, 
  Search, 
  Calendar, 
  Building, 
  Users, 
  BookOpen,
  Target,
  GraduationCap,
  ChevronDown,
  ChevronUp,
  Save,
  Loader2,
  Eye,
  EyeOff,
  Settings,
  Zap
} from 'lucide-react';

const AdvancedFilterPanel = ({ 
  filters, 
  filterOptions, 
  activeModule, 
  onFilterChange, 
  onApplyFilters, 
  loading = false,
  userRole = 'student',
  accessibleData = {}
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [localFilters, setLocalFilters] = useState(filters);
  const [hasChanges, setHasChanges] = useState(false);
  const [quickFilters, setQuickFilters] = useState([]);

  // Update local filters when props change
  useEffect(() => {
    setLocalFilters(filters);
    setHasChanges(false);
  }, [filters]);

  // Quick filter presets
  const quickFilterPresets = [
    {
      id: 'last7days',
      name: 'Last 7 Days',
      filters: { dateRange: '7' },
      icon: <Calendar className="h-4 w-4" />
    },
    {
      id: 'last30days',
      name: 'Last 30 Days',
      filters: { dateRange: '30' },
      icon: <Calendar className="h-4 w-4" />
    },
    {
      id: 'last90days',
      name: 'Last 90 Days',
      filters: { dateRange: '90' },
      icon: <Calendar className="h-4 w-4" />
    },
    {
      id: 'thisMonth',
      name: 'This Month',
      filters: { 
        startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
        endDate: new Date().toISOString().split('T')[0]
      },
      icon: <Calendar className="h-4 w-4" />
    },
    {
      id: 'highPerformers',
      name: 'High Performers',
      filters: { 
        minScore: '80',
        assessmentType: activeModule === 'assessments' ? 'exam' : 'all'
      },
      icon: <Target className="h-4 w-4" />
    },
    {
      id: 'needsAttention',
      name: 'Needs Attention',
      filters: { 
        maxScore: '60',
        assessmentType: activeModule === 'assessments' ? 'exam' : 'all'
      },
      icon: <Eye className="h-4 w-4" />
    }
  ];

  const handleLocalFilterChange = (key, value) => {
    setLocalFilters(prev => ({
      ...prev,
      [key]: value
    }));
    setHasChanges(true);
  };

  const handleApplyFilters = () => {
    onApplyFilters(localFilters);
    setHasChanges(false);
  };

  const handleResetFilters = () => {
    const defaultFilters = {
      collegeId: accessibleData.collegeId || 'all',
      departmentId: accessibleData.departmentId || 'all',
      batchId: 'all',
      facultyId: 'all',
      studentId: accessibleData.studentId || 'all',
      dateRange: '30',
      startDate: null,
      endDate: null,
      assessmentType: 'all',
      assessmentTitle: '',
      courseCategory: 'all',
      courseTitle: '',
      viewType: 'college'
    };
    
    setLocalFilters(defaultFilters);
    onApplyFilters(defaultFilters);
    setHasChanges(false);
  };

  const handleQuickFilter = (preset) => {
    const newFilters = { ...localFilters, ...preset.filters };
    setLocalFilters(newFilters);
    onApplyFilters(newFilters);
    setHasChanges(false);
  };

  const getActiveFilterCount = () => {
    let count = 0;
    Object.entries(localFilters).forEach(([key, value]) => {
      if (value && value !== 'all' && value !== '' && key !== 'dateRange') {
        count++;
      }
    });
    return count;
  };

  const getFilterSummary = () => {
    const activeFilters = [];
    
    if (localFilters.collegeId !== 'all') {
      const college = filterOptions.colleges.find(c => c.id === localFilters.collegeId);
      if (college) activeFilters.push(`College: ${college.name}`);
    }
    
    if (localFilters.departmentId !== 'all') {
      const dept = filterOptions.departments.find(d => d.id === localFilters.departmentId);
      if (dept) activeFilters.push(`Department: ${dept.name}`);
    }
    
    if (localFilters.facultyId !== 'all') {
      const faculty = filterOptions.faculty.find(f => f.id === localFilters.facultyId);
      if (faculty) activeFilters.push(`Faculty: ${faculty.name}`);
    }
    
    if (localFilters.studentId !== 'all') {
      const student = filterOptions.students.find(s => s.id === localFilters.studentId);
      if (student) activeFilters.push(`Student: ${student.name}`);
    }
    
    if (localFilters.assessmentType !== 'all') {
      activeFilters.push(`Type: ${localFilters.assessmentType}`);
    }
    
    if (localFilters.courseCategory !== 'all') {
      activeFilters.push(`Category: ${localFilters.courseCategory}`);
    }
    
    if (localFilters.dateRange !== '30') {
      activeFilters.push(`Date Range: ${localFilters.dateRange} days`);
    }
    
    return activeFilters;
  };

  const isFilterDisabled = (filterKey) => {
    // Disable filters based on role and accessible data
    if (userRole === 'student') {
      return ['collegeId', 'departmentId', 'facultyId'].includes(filterKey);
    }
    
    if (userRole === 'faculty') {
      return ['collegeId'].includes(filterKey);
    }
    
    return false;
  };

  return (
    <div className="bg-white dark:bg-gray-900 border-b">
      <div className="container mx-auto px-4 py-4">
        <Card className="border-0 shadow-none">
          <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
              <Filter className="h-5 w-5 text-gray-600" />
              <div>
                  <CardTitle className="text-lg">Advanced Filters</CardTitle>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Refine your analytics data with precise filters
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
                {getActiveFilterCount() > 0 && (
                  <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                    {getActiveFilterCount()} active
                </Badge>
              )}
              
              <Button
                variant="outline"
                size="sm"
                  onClick={() => setIsExpanded(!isExpanded)}
              >
                  {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  {isExpanded ? 'Collapse' : 'Expand'}
              </Button>
              </div>
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Quick Filters */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium">Quick Filters</Label>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleResetFilters}
                  disabled={loading}
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Reset All
                </Button>
              </div>
              
              <div className="flex flex-wrap gap-2">
                {quickFilterPresets.map((preset) => (
                  <Button
                    key={preset.id}
                    variant="outline"
                    size="sm"
                    onClick={() => handleQuickFilter(preset)}
                    disabled={loading}
                    className="flex items-center space-x-2"
                  >
                    {preset.icon}
                    <span>{preset.name}</span>
                  </Button>
                ))}
              </div>
            </div>

            {/* Active Filters Summary */}
            {getActiveFilterCount() > 0 && (
              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
                <div className="flex items-center justify-between mb-2">
                  <Label className="text-sm font-medium">Active Filters</Label>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleResetFilters}
                    disabled={loading}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {getFilterSummary().map((filter, index) => (
                    <Badge key={index} variant="outline" className="text-xs">
                      {filter}
                    </Badge>
                  ))}
            </div>
          </div>
            )}

            {/* Advanced Filters */}
            {isExpanded && (
              <div className="space-y-6">
                <Separator />
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {/* College Filter */}
                  {userRole !== 'student' && (
                  <div className="space-y-2">
                      <Label htmlFor="college">College</Label>
                    <Select 
                        value={localFilters.collegeId}
                        onValueChange={(value) => handleLocalFilterChange('collegeId', value)}
                        disabled={isFilterDisabled('collegeId') || loading}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select College" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Colleges</SelectItem>
                          {filterOptions.colleges.map((college) => (
                          <SelectItem key={college.id} value={college.id}>
                            {college.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    </div>
                  )}

                  {/* Department Filter */}
                  <div className="space-y-2">
                    <Label htmlFor="department">Department</Label>
                    <Select 
                      value={localFilters.departmentId}
                      onValueChange={(value) => handleLocalFilterChange('departmentId', value)}
                      disabled={isFilterDisabled('departmentId') || loading}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select Department" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Departments</SelectItem>
                        {filterOptions.departments.map((dept) => (
                          <SelectItem key={dept.id} value={dept.id}>
                            {dept.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Faculty Filter */}
                  {userRole !== 'student' && (
                  <div className="space-y-2">
                      <Label htmlFor="faculty">Faculty</Label>
                    <Select 
                        value={localFilters.facultyId}
                        onValueChange={(value) => handleLocalFilterChange('facultyId', value)}
                        disabled={isFilterDisabled('facultyId') || loading}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select Faculty" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Faculty</SelectItem>
                          {filterOptions.faculty.map((faculty) => (
                          <SelectItem key={faculty.id} value={faculty.id}>
                            {faculty.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    </div>
                  )}

                  {/* Student Filter */}
                  {userRole !== 'student' && (
                  <div className="space-y-2">
                      <Label htmlFor="student">Student</Label>
                    <Select 
                        value={localFilters.studentId}
                        onValueChange={(value) => handleLocalFilterChange('studentId', value)}
                        disabled={isFilterDisabled('studentId') || loading}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select Student" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Students</SelectItem>
                          {filterOptions.students.map((student) => (
                          <SelectItem key={student.id} value={student.id}>
                            {student.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    </div>
                  )}

                  {/* Assessment Type Filter */}
                  {activeModule === 'assessments' && (
                      <div className="space-y-2">
                      <Label htmlFor="assessmentType">Assessment Type</Label>
                        <Select 
                        value={localFilters.assessmentType}
                        onValueChange={(value) => handleLocalFilterChange('assessmentType', value)}
                        disabled={loading}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select Type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All Types</SelectItem>
                          {filterOptions.assessmentTypes.map((type) => (
                            <SelectItem key={type.assessment_type} value={type.assessment_type}>
                              {type.assessment_type}
                            </SelectItem>
                          ))}
                          </SelectContent>
                        </Select>
                      </div>
                  )}

                  {/* Course Category Filter */}
                  {activeModule === 'courses' && (
                      <div className="space-y-2">
                      <Label htmlFor="courseCategory">Course Category</Label>
                        <Select 
                        value={localFilters.courseCategory}
                        onValueChange={(value) => handleLocalFilterChange('courseCategory', value)}
                        disabled={loading}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select Category" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All Categories</SelectItem>
                          {filterOptions.courseCategories.map((category) => (
                            <SelectItem key={category.category} value={category.category}>
                              {category.category}
                            </SelectItem>
                          ))}
                          </SelectContent>
                        </Select>
                      </div>
                  )}

                  {/* Date Range Filter */}
                  <div className="space-y-2">
                    <Label htmlFor="dateRange">Date Range</Label>
                    <Select 
                      value={localFilters.dateRange}
                      onValueChange={(value) => handleLocalFilterChange('dateRange', value)}
                      disabled={loading}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select Date Range" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="7">Last 7 Days</SelectItem>
                        <SelectItem value="30">Last 30 Days</SelectItem>
                        <SelectItem value="90">Last 90 Days</SelectItem>
                        <SelectItem value="180">Last 6 Months</SelectItem>
                        <SelectItem value="365">Last Year</SelectItem>
                        <SelectItem value="custom">Custom Range</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Custom Date Range */}
                {localFilters.dateRange === 'custom' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="startDate">Start Date</Label>
                      <Input
                        type="date"
                        value={localFilters.startDate || ''}
                        onChange={(e) => handleLocalFilterChange('startDate', e.target.value)}
                        disabled={loading}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="endDate">End Date</Label>
                      <Input
                        type="date"
                        value={localFilters.endDate || ''}
                        onChange={(e) => handleLocalFilterChange('endDate', e.target.value)}
                        disabled={loading}
                      />
                    </div>
                  </div>
                )}

                {/* Search Filters */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {activeModule === 'assessments' && (
                    <div className="space-y-2">
                      <Label htmlFor="assessmentTitle">Assessment Title</Label>
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input
                          placeholder="Search assessments..."
                          value={localFilters.assessmentTitle}
                          onChange={(e) => handleLocalFilterChange('assessmentTitle', e.target.value)}
                          className="pl-10"
                          disabled={loading}
                        />
                      </div>
                    </div>
                  )}

                  {activeModule === 'courses' && (
                    <div className="space-y-2">
                      <Label htmlFor="courseTitle">Course Title</Label>
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input
                          placeholder="Search courses..."
                          value={localFilters.courseTitle}
                          onChange={(e) => handleLocalFilterChange('courseTitle', e.target.value)}
                          className="pl-10"
                          disabled={loading}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex items-center justify-between pt-4">
              <div className="flex items-center space-x-2">
                {hasChanges && (
                  <Badge variant="outline" className="text-orange-600 border-orange-200">
                    Unsaved Changes
                  </Badge>
                    )}
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                  onClick={handleResetFilters}
                  disabled={loading}
                    >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Reset
                    </Button>
                
                    <Button
                  onClick={handleApplyFilters}
                  disabled={loading || !hasChanges}
                >
                  {loading ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Zap className="h-4 w-4 mr-2" />
                  )}
                  Apply Filters
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
      </div>
    </div>
  );
};

export default AdvancedFilterPanel; 