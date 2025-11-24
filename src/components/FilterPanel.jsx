import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Checkbox } from './ui/checkbox';
import { Slider } from './ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Filter, X, Calendar, Users, Target, TrendingUp, Clock, Award, RefreshCw } from 'lucide-react';

const FilterPanel = ({ onFiltersChange, initialFilters = {}, availableOptions = {} }) => {
    const [filters, setFilters] = useState({
        // Basic filters
        assessmentId: '',
        batchId: '',
        departmentId: '',
        collegeId: '',
        studentId: '',
        
        // Date filters
        dateFrom: '',
        dateTo: '',
        timeRange: '30d',
        
        // Performance filters
        scoreRange: [0, 100],
        status: [],
        attemptNumber: '',
        
        // Advanced filters
        includeAnalytics: true,
        includeProctoring: false,
        includeIncomplete: false,
        
        // Time-based filters
        timeSpentMin: 0,
        timeSpentMax: 300,
        
        // Grade filters
        gradeRange: ['A+', 'F'],
        
        // Custom filters
        customFilters: {},
        
        ...initialFilters
    });

    const [activeTab, setActiveTab] = useState('basic');
    const [appliedFilters, setAppliedFilters] = useState({});

    useEffect(() => {
        onFiltersChange(filters);
    }, [filters, onFiltersChange]);

    const handleFilterChange = (key, value) => {
        setFilters(prev => ({
            ...prev,
            [key]: value
        }));
    };

    const handleArrayFilterChange = (key, value, checked) => {
        setFilters(prev => ({
            ...prev,
            [key]: checked 
                ? [...prev[key], value]
                : prev[key].filter(item => item !== value)
        }));
    };

    const handleRangeFilterChange = (key, value) => {
        setFilters(prev => ({
            ...prev,
            [key]: value
        }));
    };

    const applyFilters = () => {
        setAppliedFilters({ ...filters });
        onFiltersChange(filters);
    };

    const resetFilters = () => {
        const defaultFilters = {
            assessmentId: '',
            batchId: '',
            departmentId: '',
            collegeId: '',
            studentId: '',
            dateFrom: '',
            dateTo: '',
            timeRange: '30d',
            scoreRange: [0, 100],
            status: [],
            attemptNumber: '',
            includeAnalytics: true,
            includeProctoring: false,
            includeIncomplete: false,
            timeSpentMin: 0,
            timeSpentMax: 300,
            gradeRange: ['A+', 'F'],
            customFilters: {}
        };
        setFilters(defaultFilters);
        setAppliedFilters({});
        onFiltersChange(defaultFilters);
    };

    const clearFilter = (key) => {
        setFilters(prev => ({
            ...prev,
            [key]: Array.isArray(prev[key]) ? [] : ''
        }));
    };

    const getActiveFilterCount = () => {
        let count = 0;
        Object.entries(filters).forEach(([key, value]) => {
            if (Array.isArray(value) && value.length > 0) count++;
            else if (typeof value === 'string' && value !== '') count++;
            else if (typeof value === 'number' && value !== 0) count++;
            else if (typeof value === 'boolean' && value) count++;
        });
        return count;
    };

    const getFilterBadges = () => {
        const badges = [];
        
        if (filters.assessmentId) {
            const assessment = availableOptions.assessments?.find(a => a.id === filters.assessmentId);
            badges.push({ key: 'assessmentId', label: `Assessment: ${assessment?.title || 'Selected'}`, value: filters.assessmentId });
        }
        
        if (filters.batchId) {
            const batch = availableOptions.batches?.find(b => b.id === filters.batchId);
            badges.push({ key: 'batchId', label: `Batch: ${batch?.name || 'Selected'}`, value: filters.batchId });
        }
        
        if (filters.departmentId) {
            const dept = availableOptions.departments?.find(d => d.id === filters.departmentId);
            badges.push({ key: 'departmentId', label: `Dept: ${dept?.name || 'Selected'}`, value: filters.departmentId });
        }
        
        if (filters.status.length > 0) {
            badges.push({ key: 'status', label: `Status: ${filters.status.join(', ')}`, value: filters.status });
        }
        
        if (filters.scoreRange[0] > 0 || filters.scoreRange[1] < 100) {
            badges.push({ key: 'scoreRange', label: `Score: ${filters.scoreRange[0]}-${filters.scoreRange[1]}%`, value: filters.scoreRange });
        }
        
        if (filters.dateFrom || filters.dateTo) {
            badges.push({ key: 'dateRange', label: `Date: ${filters.dateFrom || 'Start'} - ${filters.dateTo || 'End'}`, value: { from: filters.dateFrom, to: filters.dateTo } });
        }
        
        return badges;
    };

    return (
        <Card className="w-full">
            <CardHeader>
                <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center">
                        <Filter className="w-5 h-5 mr-2" />
                        Advanced Filters
                        {getActiveFilterCount() > 0 && (
                            <Badge variant="secondary" className="ml-2">
                                {getActiveFilterCount()}
                            </Badge>
                        )}
                    </CardTitle>
                    <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={resetFilters}>
                            <RefreshCw className="w-4 h-4 mr-1" />
                            Reset
                        </Button>
                        <Button size="sm" onClick={applyFilters}>
                            Apply Filters
                        </Button>
                    </div>
                </div>
            </CardHeader>
            
            <CardContent>
                {/* Active Filter Badges */}
                {getActiveFilterCount() > 0 && (
                    <div className="mb-6">
                        <h4 className="text-sm font-medium text-gray-700 mb-2">Active Filters:</h4>
                        <div className="flex flex-wrap gap-2">
                            {getFilterBadges().map((badge, index) => (
                                <Badge key={index} variant="outline" className="flex items-center gap-1">
                                    {badge.label}
                                    <X 
                                        className="w-3 h-3 cursor-pointer" 
                                        onClick={() => clearFilter(badge.key)}
                                    />
                                </Badge>
                            ))}
                        </div>
                    </div>
                )}

                <Tabs value={activeTab} onValueChange={setActiveTab}>
                    <TabsList className="grid w-full grid-cols-4">
                        <TabsTrigger value="basic">Basic</TabsTrigger>
                        <TabsTrigger value="performance">Performance</TabsTrigger>
                        <TabsTrigger value="time">Time</TabsTrigger>
                        <TabsTrigger value="advanced">Advanced</TabsTrigger>
                    </TabsList>

                    <TabsContent value="basic" className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Assessment
                                </label>
                                <Select value={filters.assessmentId} onValueChange={(value) => handleFilterChange('assessmentId', value)}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select assessment" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="">All Assessments</SelectItem>
                                        {availableOptions.assessments?.map(assessment => (
                                            <SelectItem key={assessment.id} value={assessment.id}>
                                                {assessment.title}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Batch
                                </label>
                                <Select value={filters.batchId} onValueChange={(value) => handleFilterChange('batchId', value)}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select batch" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="">All Batches</SelectItem>
                                        {availableOptions.batches?.map(batch => (
                                            <SelectItem key={batch.id} value={batch.id}>
                                                {batch.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Department
                                </label>
                                <Select value={filters.departmentId} onValueChange={(value) => handleFilterChange('departmentId', value)}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select department" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="">All Departments</SelectItem>
                                        {availableOptions.departments?.map(dept => (
                                            <SelectItem key={dept.id} value={dept.id}>
                                                {dept.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    College
                                </label>
                                <Select value={filters.collegeId} onValueChange={(value) => handleFilterChange('collegeId', value)}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select college" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="">All Colleges</SelectItem>
                                        {availableOptions.colleges?.map(college => (
                                            <SelectItem key={college.id} value={college.id}>
                                                {college.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    From Date
                                </label>
                                <input
                                    type="date"
                                    value={filters.dateFrom}
                                    onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    To Date
                                </label>
                                <input
                                    type="date"
                                    value={filters.dateTo}
                                    onChange={(e) => handleFilterChange('dateTo', e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Time Range
                            </label>
                            <Select value={filters.timeRange} onValueChange={(value) => handleFilterChange('timeRange', value)}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select time range" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="7d">Last 7 days</SelectItem>
                                    <SelectItem value="30d">Last 30 days</SelectItem>
                                    <SelectItem value="90d">Last 90 days</SelectItem>
                                    <SelectItem value="1y">Last year</SelectItem>
                                    <SelectItem value="all">All time</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </TabsContent>

                    <TabsContent value="performance" className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Score Range: {filters.scoreRange[0]}% - {filters.scoreRange[1]}%
                            </label>
                            <Slider
                                value={filters.scoreRange}
                                onValueChange={(value) => handleRangeFilterChange('scoreRange', value)}
                                max={100}
                                min={0}
                                step={1}
                                className="w-full"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Status
                            </label>
                            <div className="space-y-2">
                                {['completed', 'in_progress', 'abandoned', 'submitted', 'graded'].map(status => (
                                    <div key={status} className="flex items-center space-x-2">
                                        <Checkbox
                                            id={status}
                                            checked={filters.status.includes(status)}
                                            onCheckedChange={(checked) => handleArrayFilterChange('status', status, checked)}
                                        />
                                        <label htmlFor={status} className="text-sm text-gray-700 capitalize">
                                            {status.replace('_', ' ')}
                                        </label>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Attempt Number
                            </label>
                            <Select value={filters.attemptNumber} onValueChange={(value) => handleFilterChange('attemptNumber', value)}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select attempt" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="">All Attempts</SelectItem>
                                    <SelectItem value="1">First Attempt</SelectItem>
                                    <SelectItem value="2">Second Attempt</SelectItem>
                                    <SelectItem value="3">Third Attempt</SelectItem>
                                    <SelectItem value="4+">Fourth+ Attempt</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Grade Range
                            </label>
                            <div className="grid grid-cols-2 gap-2">
                                <Select value={filters.gradeRange[0]} onValueChange={(value) => handleFilterChange('gradeRange', [value, filters.gradeRange[1]])}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Min Grade" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {['A+', 'A', 'B+', 'B', 'C+', 'C', 'D+', 'D', 'F'].map(grade => (
                                            <SelectItem key={grade} value={grade}>{grade}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                
                                <Select value={filters.gradeRange[1]} onValueChange={(value) => handleFilterChange('gradeRange', [filters.gradeRange[0], value])}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Max Grade" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {['A+', 'A', 'B+', 'B', 'C+', 'C', 'D+', 'D', 'F'].map(grade => (
                                            <SelectItem key={grade} value={grade}>{grade}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </TabsContent>

                    <TabsContent value="time" className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Time Spent: {filters.timeSpentMin} - {filters.timeSpentMax} minutes
                            </label>
                            <div className="grid grid-cols-2 gap-2">
                                <input
                                    type="number"
                                    value={filters.timeSpentMin}
                                    onChange={(e) => handleFilterChange('timeSpentMin', parseInt(e.target.value) || 0)}
                                    className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="Min minutes"
                                />
                                <input
                                    type="number"
                                    value={filters.timeSpentMax}
                                    onChange={(e) => handleFilterChange('timeSpentMax', parseInt(e.target.value) || 300)}
                                    className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="Max minutes"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Time Categories
                            </label>
                            <div className="space-y-2">
                                {[
                                    { key: 'fast', label: 'Fast (< 30 min)', min: 0, max: 30 },
                                    { key: 'normal', label: 'Normal (30-60 min)', min: 30, max: 60 },
                                    { key: 'slow', label: 'Slow (> 60 min)', min: 60, max: 300 }
                                ].map(category => (
                                    <div key={category.key} className="flex items-center space-x-2">
                                        <Checkbox
                                            id={category.key}
                                            checked={filters.customFilters[category.key] || false}
                                            onCheckedChange={(checked) => handleFilterChange('customFilters', {
                                                ...filters.customFilters,
                                                [category.key]: checked
                                            })}
                                        />
                                        <label htmlFor={category.key} className="text-sm text-gray-700">
                                            {category.label}
                                        </label>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </TabsContent>

                    <TabsContent value="advanced" className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Include Options
                            </label>
                            <div className="space-y-2">
                                <div className="flex items-center space-x-2">
                                    <Checkbox
                                        id="includeAnalytics"
                                        checked={filters.includeAnalytics}
                                        onCheckedChange={(checked) => handleFilterChange('includeAnalytics', checked)}
                                    />
                                    <label htmlFor="includeAnalytics" className="text-sm text-gray-700">
                                        Include Analytics Data
                                    </label>
                                </div>

                                <div className="flex items-center space-x-2">
                                    <Checkbox
                                        id="includeProctoring"
                                        checked={filters.includeProctoring}
                                        onCheckedChange={(checked) => handleFilterChange('includeProctoring', checked)}
                                    />
                                    <label htmlFor="includeProctoring" className="text-sm text-gray-700">
                                        Include Proctoring Data
                                    </label>
                                </div>

                                <div className="flex items-center space-x-2">
                                    <Checkbox
                                        id="includeIncomplete"
                                        checked={filters.includeIncomplete}
                                        onCheckedChange={(checked) => handleFilterChange('includeIncomplete', checked)}
                                    />
                                    <label htmlFor="includeIncomplete" className="text-sm text-gray-700">
                                        Include Incomplete Submissions
                                    </label>
                                </div>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Student ID (Optional)
                            </label>
                            <input
                                type="text"
                                value={filters.studentId}
                                onChange={(e) => handleFilterChange('studentId', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="Enter student ID for specific student"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Custom Filters
                            </label>
                            <div className="space-y-2">
                                <div className="flex items-center space-x-2">
                                    <Checkbox
                                        id="highPerformers"
                                        checked={filters.customFilters.highPerformers || false}
                                        onCheckedChange={(checked) => handleFilterChange('customFilters', {
                                            ...filters.customFilters,
                                            highPerformers: checked
                                        })}
                                    />
                                    <label htmlFor="highPerformers" className="text-sm text-gray-700">
                                        High Performers (90%+)
                                    </label>
                                </div>

                                <div className="flex items-center space-x-2">
                                    <Checkbox
                                        id="strugglingStudents"
                                        checked={filters.customFilters.strugglingStudents || false}
                                        onCheckedChange={(checked) => handleFilterChange('customFilters', {
                                            ...filters.customFilters,
                                            strugglingStudents: checked
                                        })}
                                    />
                                    <label htmlFor="strugglingStudents" className="text-sm text-gray-700">
                                        Struggling Students (< 50%)
                                    </label>
                                </div>

                                <div className="flex items-center space-x-2">
                                    <Checkbox
                                        id="recentSubmissions"
                                        checked={filters.customFilters.recentSubmissions || false}
                                        onCheckedChange={(checked) => handleFilterChange('customFilters', {
                                            ...filters.customFilters,
                                            recentSubmissions: checked
                                        })}
                                    />
                                    <label htmlFor="recentSubmissions" className="text-sm text-gray-700">
                                        Recent Submissions (Last 7 days)
                                    </label>
                                </div>
                            </div>
                        </div>
                    </TabsContent>
                </Tabs>
            </CardContent>
        </Card>
    );
};

export default FilterPanel;