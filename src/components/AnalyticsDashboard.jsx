import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Calendar, TrendingUp, Users, Award, Clock, Target, BarChart3, PieChart, Download, Filter, RefreshCw } from 'lucide-react';
import { toast } from 'react-hot-toast';

const AnalyticsDashboard = ({ userRole, userId }) => {
    const [analytics, setAnalytics] = useState(null);
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState({
        timeRange: '30d',
        assessmentId: '',
        batchId: '',
        departmentId: '',
        dateFrom: '',
        dateTo: ''
    });
    const [activeTab, setActiveTab] = useState('overview');

    useEffect(() => {
        loadAnalytics();
    }, [filters]);

    const loadAnalytics = async () => {
        try {
            setLoading(true);
            const response = await fetch('/api/analytics/dashboard', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ filters, userRole, userId })
            });

            if (!response.ok) throw new Error('Failed to load analytics');
            
            const data = await response.json();
            setAnalytics(data);
        } catch (error) {
            console.error('Error loading analytics:', error);
            toast.error('Failed to load analytics data');
        } finally {
            setLoading(false);
        }
    };

    const handleExport = async (format) => {
        try {
            const response = await fetch('/api/analytics/export', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ format, filters, userRole, userId })
            });

            if (!response.ok) throw new Error('Export failed');

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `analytics_${format}_${Date.now()}.${format}`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);

            toast.success(`${format.toUpperCase()} export completed`);
        } catch (error) {
            console.error('Export error:', error);
            toast.error('Export failed');
        }
    };

    const handleFilterChange = (key, value) => {
        setFilters(prev => ({ ...prev, [key]: value }));
    };

    const resetFilters = () => {
        setFilters({
            timeRange: '30d',
            assessmentId: '',
            batchId: '',
            departmentId: '',
            dateFrom: '',
            dateTo: ''
        });
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    if (!analytics) {
        return (
            <div className="text-center py-8">
                <p className="text-gray-500">No analytics data available</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Analytics Dashboard</h1>
                    <p className="text-gray-600 mt-1">Performance insights and analytics</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={resetFilters}>
                        <Filter className="w-4 h-4 mr-2" />
                        Reset Filters
                    </Button>
                    <Button variant="outline" onClick={loadAnalytics}>
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Refresh
                    </Button>
                    <Button onClick={() => handleExport('excel')}>
                        <Download className="w-4 h-4 mr-2" />
                        Export Excel
                    </Button>
                </div>
            </div>

            {/* Filters */}
            <Card>
                <CardHeader>
                    <CardTitle>Filters</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
                        <Select value={filters.timeRange} onValueChange={(value) => handleFilterChange('timeRange', value)}>
                            <SelectTrigger>
                                <SelectValue placeholder="Time Range" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="7d">Last 7 days</SelectItem>
                                <SelectItem value="30d">Last 30 days</SelectItem>
                                <SelectItem value="90d">Last 90 days</SelectItem>
                                <SelectItem value="1y">Last year</SelectItem>
                            </SelectContent>
                        </Select>

                        <Select value={filters.assessmentId} onValueChange={(value) => handleFilterChange('assessmentId', value)}>
                            <SelectTrigger>
                                <SelectValue placeholder="Assessment" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="">All Assessments</SelectItem>
                                {analytics.assessments?.map(assessment => (
                                    <SelectItem key={assessment.id} value={assessment.id}>
                                        {assessment.title}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        <Select value={filters.batchId} onValueChange={(value) => handleFilterChange('batchId', value)}>
                            <SelectTrigger>
                                <SelectValue placeholder="Batch" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="">All Batches</SelectItem>
                                {analytics.batches?.map(batch => (
                                    <SelectItem key={batch.id} value={batch.id}>
                                        {batch.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        <Select value={filters.departmentId} onValueChange={(value) => handleFilterChange('departmentId', value)}>
                            <SelectTrigger>
                                <SelectValue placeholder="Department" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="">All Departments</SelectItem>
                                {analytics.departments?.map(dept => (
                                    <SelectItem key={dept.id} value={dept.id}>
                                        {dept.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        <input
                            type="date"
                            value={filters.dateFrom}
                            onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
                            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="From Date"
                        />

                        <input
                            type="date"
                            value={filters.dateTo}
                            onChange={(e) => handleFilterChange('dateTo', e.target.value)}
                            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="To Date"
                        />
                    </div>
                </CardContent>
            </Card>

            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center">
                            <div className="p-2 bg-blue-100 rounded-lg">
                                <Users className="w-6 h-6 text-blue-600" />
                            </div>
                            <div className="ml-4">
                                <p className="text-sm font-medium text-gray-600">Total Students</p>
                                <p className="text-2xl font-bold text-gray-900">{analytics.totalStudents}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center">
                            <div className="p-2 bg-green-100 rounded-lg">
                                <Target className="w-6 h-6 text-green-600" />
                            </div>
                            <div className="ml-4">
                                <p className="text-sm font-medium text-gray-600">Average Score</p>
                                <p className="text-2xl font-bold text-gray-900">{analytics.averageScore}%</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center">
                            <div className="p-2 bg-purple-100 rounded-lg">
                                <Award className="w-6 h-6 text-purple-600" />
                            </div>
                            <div className="ml-4">
                                <p className="text-sm font-medium text-gray-600">Completed</p>
                                <p className="text-2xl font-bold text-gray-900">{analytics.completedCount}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center">
                            <div className="p-2 bg-orange-100 rounded-lg">
                                <Clock className="w-6 h-6 text-orange-600" />
                            </div>
                            <div className="ml-4">
                                <p className="text-sm font-medium text-gray-600">Avg Time</p>
                                <p className="text-2xl font-bold text-gray-900">{analytics.averageTime}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Analytics Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid w-full grid-cols-4">
                    <TabsTrigger value="overview">Overview</TabsTrigger>
                    <TabsTrigger value="performance">Performance</TabsTrigger>
                    <TabsTrigger value="trends">Trends</TabsTrigger>
                    <TabsTrigger value="comparisons">Comparisons</TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="space-y-6">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <Card>
                            <CardHeader>
                                <CardTitle>Score Distribution</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    {analytics.scoreDistribution?.map((range, index) => (
                                        <div key={index} className="flex items-center justify-between">
                                            <span className="text-sm text-gray-600">{range.label}</span>
                                            <div className="flex items-center space-x-2">
                                                <Progress value={range.percentage} className="w-32" />
                                                <span className="text-sm font-medium">{range.count}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>Assessment Performance</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    {analytics.assessmentPerformance?.map((assessment, index) => (
                                        <div key={index} className="flex items-center justify-between">
                                            <div>
                                                <p className="font-medium">{assessment.title}</p>
                                                <p className="text-sm text-gray-600">{assessment.submissions} submissions</p>
                                            </div>
                                            <div className="text-right">
                                                <p className="font-bold">{assessment.averageScore}%</p>
                                                <Badge variant={assessment.averageScore >= 70 ? 'default' : 'destructive'}>
                                                    {assessment.averageScore >= 70 ? 'Good' : 'Needs Improvement'}
                                                </Badge>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>

                <TabsContent value="performance" className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Performance Analytics</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div className="text-center">
                                    <div className="text-3xl font-bold text-green-600">{analytics.performanceMetrics?.excellent}%</div>
                                    <p className="text-sm text-gray-600">Excellent (90-100%)</p>
                                </div>
                                <div className="text-center">
                                    <div className="text-3xl font-bold text-blue-600">{analytics.performanceMetrics?.good}%</div>
                                    <p className="text-sm text-gray-600">Good (70-89%)</p>
                                </div>
                                <div className="text-center">
                                    <div className="text-3xl font-bold text-orange-600">{analytics.performanceMetrics?.needsImprovement}%</div>
                                    <p className="text-sm text-gray-600">Needs Improvement (&lt;70%)</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Time Analysis</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                <div className="flex justify-between items-center">
                                    <span>Average Time per Question</span>
                                    <span className="font-bold">{analytics.timeAnalysis?.avgTimePerQuestion} min</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span>Fastest Completion</span>
                                    <span className="font-bold">{analytics.timeAnalysis?.fastestCompletion} min</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span>Slowest Completion</span>
                                    <span className="font-bold">{analytics.timeAnalysis?.slowestCompletion} min</span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="trends" className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Performance Trends</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {analytics.trends?.map((trend, index) => (
                                    <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                                        <div>
                                            <p className="font-medium">{trend.period}</p>
                                            <p className="text-sm text-gray-600">{trend.description}</p>
                                        </div>
                                        <div className="text-right">
                                            <div className="flex items-center">
                                                <TrendingUp className={`w-4 h-4 mr-1 ${trend.trend === 'up' ? 'text-green-500' : 'text-red-500'}`} />
                                                <span className={`font-bold ${trend.trend === 'up' ? 'text-green-500' : 'text-red-500'}`}>
                                                    {trend.change}%
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="comparisons" className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Comparative Analysis</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {analytics.comparisons?.map((comparison, index) => (
                                    <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                                        <div>
                                            <p className="font-medium">{comparison.category}</p>
                                            <p className="text-sm text-gray-600">{comparison.description}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-bold">{comparison.value}</p>
                                            <Badge variant={comparison.status === 'above' ? 'default' : 'destructive'}>
                                                {comparison.status === 'above' ? 'Above Average' : 'Below Average'}
                                            </Badge>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>

            {/* Export Options */}
            <Card>
                <CardHeader>
                    <CardTitle>Export Options</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex flex-wrap gap-2">
                        <Button variant="outline" onClick={() => handleExport('excel')}>
                            <Download className="w-4 h-4 mr-2" />
                            Excel Report
                        </Button>
                        <Button variant="outline" onClick={() => handleExport('pdf')}>
                            <Download className="w-4 h-4 mr-2" />
                            PDF Report
                        </Button>
                        <Button variant="outline" onClick={() => handleExport('csv')}>
                            <Download className="w-4 h-4 mr-2" />
                            CSV Data
                        </Button>
                        <Button variant="outline" onClick={() => handleExport('dashboard')}>
                            <BarChart3 className="w-4 h-4 mr-2" />
                            Dashboard Export
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};

export default AnalyticsDashboard;
