import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { Alert, AlertDescription } from './ui/alert';
import { 
    Filter, 
    Search,
    Sliders,
    Layers,
    Grid,
    List,
    Columns,
    SortAsc,
    SortDesc,
    MoreHorizontal,
    Save,
    RefreshCw,
    Calendar,
    Users,
    BookOpen,
    Award,
    Clock,
    Target,
    TrendingUp,
    CheckCircle,
    XCircle,
    AlertTriangle,
    Lightbulb,
    Eye,
    Settings,
    Database,
    Building,
    GraduationCap,
    User,
    Book,
    BarChart3,
    PieChart,
    LineChart
} from 'lucide-react';
import { toast } from 'react-hot-toast';

const MultiLevelFiltering = ({ 
    onMultiLevelFilteringViewed,
    showAssessmentFiltering = true,
    showBatchFiltering = true,
    showDepartmentFiltering = true,
    showCollegeFiltering = true,
    showDateFiltering = true,
    showPerformanceFiltering = true,
    showStatusFiltering = true
}) => {
    const [multiLevelFiltering, setMultiLevelFiltering] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [activeFilters, setActiveFilters] = useState({});
    const [filterResults, setFilterResults] = useState(null);
    const [filterPresets, setFilterPresets] = useState([]);
    const [sortOptions, setSortOptions] = useState({});

    useEffect(() => {
        loadMultiLevelFiltering();
    }, []);

    const loadMultiLevelFiltering = async () => {
        try {
            setIsLoading(true);
            
            const response = await fetch('/api/analytics/multi-level-filtering', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    showAssessmentFiltering,
                    showBatchFiltering,
                    showDepartmentFiltering,
                    showCollegeFiltering,
                    showDateFiltering,
                    showPerformanceFiltering,
                    showStatusFiltering
                })
            });

            if (!response.ok) throw new Error('Failed to load multi-level filtering');
            
            const data = await response.json();
            setMultiLevelFiltering(data.multiLevelFiltering);
            setFilterPresets(data.filterPresets || []);
            setSortOptions(data.sortOptions || {});
            
            if (onMultiLevelFilteringViewed) {
                onMultiLevelFilteringViewed(data);
            }
            
        } catch (error) {
            console.error('Error loading multi-level filtering:', error);
            toast.error('Failed to load multi-level filtering');
        } finally {
            setIsLoading(false);
        }
    };

    const applyFilters = async () => {
        try {
            const response = await fetch('/api/analytics/apply-filters', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    filters: activeFilters
                })
            });

            if (!response.ok) throw new Error('Failed to apply filters');
            
            const data = await response.json();
            setFilterResults(data.results);
            
            toast.success('Filters applied successfully');
        } catch (error) {
            console.error('Error applying filters:', error);
            toast.error('Failed to apply filters');
        }
    };

    const clearFilters = () => {
        setActiveFilters({});
        setFilterResults(null);
        toast.success('Filters cleared');
    };

    const saveFilterPreset = async (presetName) => {
        try {
            const response = await fetch('/api/analytics/save-filter-preset', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    presetName,
                    filters: activeFilters
                })
            });

            if (!response.ok) throw new Error('Save failed');
            
            toast.success('Filter preset saved successfully');
            loadMultiLevelFiltering();
        } catch (error) {
            console.error('Save error:', error);
            toast.error('Save failed');
        }
    };

    const getFilterIcon = (type) => {
        switch (type) {
            case 'assessment':
                return <BookOpen className="w-4 h-4" />;
            case 'batch':
                return <Users className="w-4 h-4" />;
            case 'department':
                return <Database className="w-4 h-4" />;
            case 'college':
                return <Award className="w-4 h-4" />;
            case 'date':
                return <Calendar className="w-4 h-4" />;
            case 'performance':
                return <TrendingUp className="w-4 h-4" />;
            case 'status':
                return <CheckCircle className="w-4 h-4" />;
            default:
                return <Filter className="w-4 h-4" />;
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'completed':
                return 'text-green-600';
            case 'in-progress':
                return 'text-blue-600';
            case 'not-started':
                return 'text-gray-600';
            case 'abandoned':
                return 'text-red-600';
            default:
                return 'text-gray-600';
        }
    };

    const getStatusBadge = (status) => {
        switch (status) {
            case 'completed':
                return 'bg-green-100 text-green-800';
            case 'in-progress':
                return 'bg-blue-100 text-blue-800';
            case 'not-started':
                return 'bg-gray-100 text-gray-800';
            case 'abandoned':
                return 'bg-red-100 text-red-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    if (!multiLevelFiltering) {
        return (
            <div className="text-center py-8">
                <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                <p className="text-gray-500">No multi-level filtering data available</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="text-center">
                <h2 className="text-3xl font-bold text-gray-900">Multi-Level Filtering</h2>
                <p className="text-gray-600 mt-2">Advanced filtering across multiple dimensions</p>
            </div>

            {/* Filter Controls */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                        <Sliders className="w-5 h-5" />
                        <span>Filter Controls</span>
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {/* Assessment Filter */}
                        {showAssessmentFiltering && (
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-700 flex items-center space-x-2">
                                    {getFilterIcon('assessment')}
                                    <span>Assessment</span>
                                </label>
                                <select
                                    value={activeFilters.assessment || ''}
                                    onChange={(e) => setActiveFilters({...activeFilters, assessment: e.target.value})}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                >
                                    <option value="">All Assessments</option>
                                    {multiLevelFiltering.assessments && multiLevelFiltering.assessments.map((assessment, index) => (
                                        <option key={index} value={assessment.id}>{assessment.name}</option>
                                    ))}
                                </select>
                            </div>
                        )}

                        {/* Batch Filter */}
                        {showBatchFiltering && (
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-700 flex items-center space-x-2">
                                    {getFilterIcon('batch')}
                                    <span>Batch</span>
                                </label>
                                <select
                                    value={activeFilters.batch || ''}
                                    onChange={(e) => setActiveFilters({...activeFilters, batch: e.target.value})}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                >
                                    <option value="">All Batches</option>
                                    {multiLevelFiltering.batches && multiLevelFiltering.batches.map((batch, index) => (
                                        <option key={index} value={batch.id}>{batch.name}</option>
                                    ))}
                                </select>
                            </div>
                        )}

                        {/* Department Filter */}
                        {showDepartmentFiltering && (
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-700 flex items-center space-x-2">
                                    {getFilterIcon('department')}
                                    <span>Department</span>
                                </label>
                                <select
                                    value={activeFilters.department || ''}
                                    onChange={(e) => setActiveFilters({...activeFilters, department: e.target.value})}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                >
                                    <option value="">All Departments</option>
                                    {multiLevelFiltering.departments && multiLevelFiltering.departments.map((department, index) => (
                                        <option key={index} value={department.id}>{department.name}</option>
                                    ))}
                                </select>
                            </div>
                        )}

                        {/* College Filter */}
                        {showCollegeFiltering && (
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-700 flex items-center space-x-2">
                                    {getFilterIcon('college')}
                                    <span>College</span>
                                </label>
                                <select
                                    value={activeFilters.college || ''}
                                    onChange={(e) => setActiveFilters({...activeFilters, college: e.target.value})}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                >
                                    <option value="">All Colleges</option>
                                    {multiLevelFiltering.colleges && multiLevelFiltering.colleges.map((college, index) => (
                                        <option key={index} value={college.id}>{college.name}</option>
                                    ))}
                                </select>
                            </div>
                        )}

                        {/* Date Range Filter */}
                        {showDateFiltering && (
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-700 flex items-center space-x-2">
                                    {getFilterIcon('date')}
                                    <span>Date Range</span>
                                </label>
                                <div className="flex space-x-2">
                                    <input
                                        type="date"
                                        value={activeFilters.startDate || ''}
                                        onChange={(e) => setActiveFilters({...activeFilters, startDate: e.target.value})}
                                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    />
                                    <input
                                        type="date"
                                        value={activeFilters.endDate || ''}
                                        onChange={(e) => setActiveFilters({...activeFilters, endDate: e.target.value})}
                                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    />
                                </div>
                            </div>
                        )}

                        {/* Performance Range Filter */}
                        {showPerformanceFiltering && (
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-700 flex items-center space-x-2">
                                    {getFilterIcon('performance')}
                                    <span>Performance Range</span>
                                </label>
                                <div className="flex space-x-2">
                                    <input
                                        type="number"
                                        placeholder="Min %"
                                        value={activeFilters.minPerformance || ''}
                                        onChange={(e) => setActiveFilters({...activeFilters, minPerformance: e.target.value})}
                                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    />
                                    <input
                                        type="number"
                                        placeholder="Max %"
                                        value={activeFilters.maxPerformance || ''}
                                        onChange={(e) => setActiveFilters({...activeFilters, maxPerformance: e.target.value})}
                                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    />
                                </div>
                            </div>
                        )}

                        {/* Status Filter */}
                        {showStatusFiltering && (
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-700 flex items-center space-x-2">
                                    {getFilterIcon('status')}
                                    <span>Status</span>
                                </label>
                                <select
                                    value={activeFilters.status || ''}
                                    onChange={(e) => setActiveFilters({...activeFilters, status: e.target.value})}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                >
                                    <option value="">All Statuses</option>
                                    <option value="completed">Completed</option>
                                    <option value="in-progress">In Progress</option>
                                    <option value="not-started">Not Started</option>
                                    <option value="abandoned">Abandoned</option>
                                </select>
                            </div>
                        )}
                    </div>

                    {/* Filter Actions */}
                    <div className="flex justify-between items-center mt-6">
                        <div className="flex space-x-2">
                            <Button 
                                onClick={applyFilters}
                                variant="default"
                                size="sm"
                            >
                                <Search className="w-4 h-4 mr-2" />
                                Apply Filters
                            </Button>
                            
                            <Button 
                                onClick={clearFilters}
                                variant="outline"
                                size="sm"
                            >
                                <RefreshCw className="w-4 h-4 mr-2" />
                                Clear All
                            </Button>
                            
                            <Button 
                                onClick={() => saveFilterPreset('Custom Preset')}
                                variant="outline"
                                size="sm"
                            >
                                <Save className="w-4 h-4 mr-2" />
                                Save Preset
                            </Button>
                        </div>
                        
                        <div className="text-sm text-gray-600">
                            {Object.keys(activeFilters).filter(key => activeFilters[key]).length} filters active
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Filter Presets */}
            {filterPresets.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center space-x-2">
                            <Layers className="w-5 h-5" />
                            <span>Filter Presets</span>
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {filterPresets.map((preset, index) => (
                                <div key={index} className="p-4 border rounded-lg hover:bg-gray-50">
                                    <div className="flex items-center justify-between mb-2">
                                        <h4 className="font-medium text-gray-900">{preset.name}</h4>
                                        <Badge className="bg-blue-100 text-blue-800">
                                            {preset.filters.length} filters
                                        </Badge>
                                    </div>
                                    
                                    <p className="text-sm text-gray-600 mb-3">{preset.description}</p>
                                    
                                    <Button 
                                        onClick={() => setActiveFilters(preset.filters)}
                                        variant="outline"
                                        size="sm"
                                        className="w-full"
                                    >
                                        <Eye className="w-4 h-4 mr-2" />
                                        Apply Preset
                                    </Button>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Filter Results */}
            {filterResults && (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center space-x-2">
                            <BarChart3 className="w-5 h-5" />
                            <span>Filter Results</span>
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {/* Results Summary */}
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                <div className="text-center">
                                    <p className="text-2xl font-bold text-blue-600">
                                        {filterResults.totalRecords}
                                    </p>
                                    <p className="text-sm text-gray-600">Total Records</p>
                                </div>
                                
                                <div className="text-center">
                                    <p className="text-2xl font-bold text-green-600">
                                        {filterResults.completedRecords}
                                    </p>
                                    <p className="text-sm text-gray-600">Completed</p>
                                </div>
                                
                                <div className="text-center">
                                    <p className="text-2xl font-bold text-yellow-600">
                                        {filterResults.inProgressRecords}
                                    </p>
                                    <p className="text-sm text-gray-600">In Progress</p>
                                </div>
                                
                                <div className="text-center">
                                    <p className="text-2xl font-bold text-purple-600">
                                        {filterResults.averageScore}%
                                    </p>
                                    <p className="text-sm text-gray-600">Average Score</p>
                                </div>
                            </div>

                            {/* Results List */}
                            {filterResults.records && filterResults.records.length > 0 && (
                                <div>
                                    <h4 className="font-medium text-gray-900 mb-2">Filtered Records</h4>
                                    <div className="space-y-3">
                                        {filterResults.records.map((record, index) => (
                                            <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                                                <div className="flex items-center space-x-3">
                                                    <div className="p-2 bg-blue-100 rounded-lg">
                                                        <BookOpen className="w-4 h-4 text-blue-600" />
                                                    </div>
                                                    <div>
                                                        <h5 className="font-medium text-gray-900">{record.assessmentName}</h5>
                                                        <p className="text-sm text-gray-600">
                                                            {record.studentName} • {record.batch} • {record.department}
                                                        </p>
                                                    </div>
                                                </div>
                                                
                                                <div className="text-right">
                                                    <p className="font-bold text-gray-900">{record.score}%</p>
                                                    <Badge className={getStatusBadge(record.status)}>
                                                        {record.status}
                                                    </Badge>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Actions */}
            <div className="flex justify-center space-x-4">
                <Button 
                    onClick={applyFilters}
                    variant="default"
                >
                    <Search className="w-4 h-4 mr-2" />
                    Apply Filters
                </Button>
                
                <Button 
                    onClick={clearFilters}
                    variant="outline"
                >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Clear All
                </Button>
                
                <Button 
                    onClick={loadMultiLevelFiltering}
                    variant="outline"
                >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Refresh
                </Button>
            </div>
        </div>
    );
};

export default MultiLevelFiltering;
