import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Calendar, Clock, Award, TrendingUp, Eye, Download, Filter, RefreshCw, AlertCircle } from 'lucide-react';
import { toast } from 'react-hot-toast';

const AssessmentHistory = ({ userId, userRole }) => {
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState({
        status: '',
        assessmentId: '',
        dateFrom: '',
        dateTo: '',
        sortBy: 'submitted_at',
        sortOrder: 'desc'
    });
    const [activeTab, setActiveTab] = useState('all');

    useEffect(() => {
        loadHistory();
    }, [filters, activeTab]);

    const loadHistory = async () => {
        try {
            setLoading(true);
            const response = await fetch('/api/student-assessments/history', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    userId, 
                    userRole, 
                    filters,
                    tab: activeTab
                })
            });

            if (!response.ok) throw new Error('Failed to load history');
            
            const data = await response.json();
            setHistory(data);
        } catch (error) {
            console.error('Error loading assessment history:', error);
            toast.error('Failed to load assessment history');
        } finally {
            setLoading(false);
        }
    };

    const handleFilterChange = (key, value) => {
        setFilters(prev => ({ ...prev, [key]: value }));
    };

    const resetFilters = () => {
        setFilters({
            status: '',
            assessmentId: '',
            dateFrom: '',
            dateTo: '',
            sortBy: 'submitted_at',
            sortOrder: 'desc'
        });
    };

    const getStatusBadge = (status) => {
        const statusConfig = {
            'completed': { variant: 'default', color: 'bg-green-100 text-green-800' },
            'in_progress': { variant: 'secondary', color: 'bg-blue-100 text-blue-800' },
            'abandoned': { variant: 'destructive', color: 'bg-red-100 text-red-800' },
            'submitted': { variant: 'default', color: 'bg-green-100 text-green-800' },
            'graded': { variant: 'default', color: 'bg-purple-100 text-purple-800' }
        };
        
        const config = statusConfig[status] || { variant: 'secondary', color: 'bg-gray-100 text-gray-800' };
        
        return (
            <Badge className={config.color}>
                {status.replace('_', ' ').toUpperCase()}
            </Badge>
        );
    };

    const getScoreColor = (percentage) => {
        if (percentage >= 90) return 'text-green-600';
        if (percentage >= 70) return 'text-blue-600';
        if (percentage >= 50) return 'text-yellow-600';
        return 'text-red-600';
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const formatDuration = (minutes) => {
        if (minutes < 60) return `${minutes}m`;
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        return `${hours}h ${mins}m`;
    };

    const handleViewResults = async (submissionId) => {
        try {
            const response = await fetch(`/api/student-assessments/results/${submissionId}`);
            if (!response.ok) throw new Error('Failed to load results');
            
            const results = await response.json();
            // Navigate to results page or open modal
            window.open(`/assessment-results/${submissionId}`, '_blank');
        } catch (error) {
            console.error('Error loading results:', error);
            toast.error('Failed to load assessment results');
        }
    };

    const handleDownloadReport = async (submissionId) => {
        try {
            const response = await fetch(`/api/student-assessments/export/${submissionId}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ format: 'pdf' })
            });

            if (!response.ok) throw new Error('Export failed');

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `assessment_report_${submissionId}.pdf`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);

            toast.success('Report downloaded successfully');
        } catch (error) {
            console.error('Export error:', error);
            toast.error('Failed to download report');
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Assessment History</h1>
                    <p className="text-gray-600 mt-1">View your past assessment attempts and results</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={resetFilters}>
                        <Filter className="w-4 h-4 mr-2" />
                        Reset Filters
                    </Button>
                    <Button variant="outline" onClick={loadHistory}>
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Refresh
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
                        <Select value={filters.status} onValueChange={(value) => handleFilterChange('status', value)}>
                            <SelectTrigger>
                                <SelectValue placeholder="Status" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="">All Status</SelectItem>
                                <SelectItem value="completed">Completed</SelectItem>
                                <SelectItem value="in_progress">In Progress</SelectItem>
                                <SelectItem value="abandoned">Abandoned</SelectItem>
                                <SelectItem value="submitted">Submitted</SelectItem>
                                <SelectItem value="graded">Graded</SelectItem>
                            </SelectContent>
                        </Select>

                        <Select value={filters.assessmentId} onValueChange={(value) => handleFilterChange('assessmentId', value)}>
                            <SelectTrigger>
                                <SelectValue placeholder="Assessment" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="">All Assessments</SelectItem>
                                {history.map(item => (
                                    <SelectItem key={item.assessment_id} value={item.assessment_id}>
                                        {item.assessment_title}
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

                        <Select value={filters.sortBy} onValueChange={(value) => handleFilterChange('sortBy', value)}>
                            <SelectTrigger>
                                <SelectValue placeholder="Sort By" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="submitted_at">Submission Date</SelectItem>
                                <SelectItem value="score">Score</SelectItem>
                                <SelectItem value="percentage">Percentage</SelectItem>
                                <SelectItem value="assessment_title">Assessment Name</SelectItem>
                            </SelectContent>
                        </Select>

                        <Select value={filters.sortOrder} onValueChange={(value) => handleFilterChange('sortOrder', value)}>
                            <SelectTrigger>
                                <SelectValue placeholder="Order" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="desc">Descending</SelectItem>
                                <SelectItem value="asc">Ascending</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </CardContent>
            </Card>

            {/* Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid w-full grid-cols-4">
                    <TabsTrigger value="all">All Attempts</TabsTrigger>
                    <TabsTrigger value="completed">Completed</TabsTrigger>
                    <TabsTrigger value="in_progress">In Progress</TabsTrigger>
                    <TabsTrigger value="graded">Graded</TabsTrigger>
                </TabsList>

                <TabsContent value={activeTab} className="space-y-4">
                    {history.length === 0 ? (
                        <Card>
                            <CardContent className="text-center py-8">
                                <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                                <p className="text-gray-500">No assessment history found</p>
                            </CardContent>
                        </Card>
                    ) : (
                        <div className="space-y-4">
                            {history.map((item, index) => (
                                <Card key={index} className="hover:shadow-md transition-shadow">
                                    <CardContent className="p-6">
                                        <div className="flex justify-between items-start">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-3 mb-2">
                                                    <h3 className="text-lg font-semibold text-gray-900">
                                                        {item.assessment_title}
                                                    </h3>
                                                    {getStatusBadge(item.status)}
                                                </div>
                                                
                                                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                                                    <div className="flex items-center text-sm text-gray-600">
                                                        <Calendar className="w-4 h-4 mr-2" />
                                                        {formatDate(item.submitted_at)}
                                                    </div>
                                                    
                                                    <div className="flex items-center text-sm text-gray-600">
                                                        <Clock className="w-4 h-4 mr-2" />
                                                        {formatDuration(item.time_spent)}
                                                    </div>
                                                    
                                                    <div className="flex items-center text-sm text-gray-600">
                                                        <Award className="w-4 h-4 mr-2" />
                                                        Attempt {item.attempt_number}
                                                    </div>
                                                    
                                                    <div className="flex items-center text-sm text-gray-600">
                                                        <TrendingUp className="w-4 h-4 mr-2" />
                                                        {item.total_questions} questions
                                                    </div>
                                                </div>

                                                {item.status === 'completed' || item.status === 'graded' ? (
                                                    <div className="flex items-center gap-4">
                                                        <div className="text-center">
                                                            <div className={`text-2xl font-bold ${getScoreColor(item.percentage)}`}>
                                                                {item.percentage}%
                                                            </div>
                                                            <div className="text-sm text-gray-600">Score</div>
                                                        </div>
                                                        
                                                        <div className="text-center">
                                                            <div className="text-lg font-semibold text-gray-900">
                                                                {item.score}/{item.total_points}
                                                            </div>
                                                            <div className="text-sm text-gray-600">Points</div>
                                                        </div>
                                                        
                                                        {item.grade && (
                                                            <div className="text-center">
                                                                <div className="text-lg font-semibold text-gray-900">
                                                                    {item.grade}
                                                                </div>
                                                                <div className="text-sm text-gray-600">Grade</div>
                                                            </div>
                                                        )}
                                                    </div>
                                                ) : (
                                                    <div className="text-sm text-gray-600">
                                                        {item.status === 'in_progress' ? 'Assessment in progress' : 'Assessment not completed'}
                                                    </div>
                                                )}
                                            </div>

                                            <div className="flex flex-col gap-2 ml-4">
                                                {item.status === 'completed' || item.status === 'graded' ? (
                                                    <>
                                                        <Button 
                                                            variant="outline" 
                                                            size="sm"
                                                            onClick={() => handleViewResults(item.id)}
                                                        >
                                                            <Eye className="w-4 h-4 mr-2" />
                                                            View Results
                                                        </Button>
                                                        
                                                        <Button 
                                                            variant="outline" 
                                                            size="sm"
                                                            onClick={() => handleDownloadReport(item.id)}
                                                        >
                                                            <Download className="w-4 h-4 mr-2" />
                                                            Download Report
                                                        </Button>
                                                    </>
                                                ) : item.status === 'in_progress' ? (
                                                    <Button 
                                                        variant="default" 
                                                        size="sm"
                                                        onClick={() => window.location.href = `/assessment/${item.assessment_id}`}
                                                    >
                                                        Continue Assessment
                                                    </Button>
                                                ) : (
                                                    <Button 
                                                        variant="outline" 
                                                        size="sm"
                                                        onClick={() => window.location.href = `/assessment/${item.assessment_id}`}
                                                    >
                                                        Retake Assessment
                                                    </Button>
                                                )}
                                            </div>
                                        </div>

                                        {/* Performance Insights */}
                                        {item.performance_insights && (
                                            <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                                                <h4 className="font-medium text-gray-900 mb-2">Performance Insights</h4>
                                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                                                    <div>
                                                        <span className="text-gray-600">Accuracy:</span>
                                                        <span className="ml-2 font-medium">{item.performance_insights.accuracy}%</span>
                                                    </div>
                                                    <div>
                                                        <span className="text-gray-600">Time per Question:</span>
                                                        <span className="ml-2 font-medium">{item.performance_insights.avgTimePerQuestion} min</span>
                                                    </div>
                                                    <div>
                                                        <span className="text-gray-600">Strongest Section:</span>
                                                        <span className="ml-2 font-medium">{item.performance_insights.strongestSection}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    )}
                </TabsContent>
            </Tabs>

            {/* Summary Statistics */}
            {history.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle>Summary Statistics</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                            <div className="text-center">
                                <div className="text-2xl font-bold text-gray-900">
                                    {history.filter(item => item.status === 'completed' || item.status === 'graded').length}
                                </div>
                                <div className="text-sm text-gray-600">Completed</div>
                            </div>
                            
                            <div className="text-center">
                                <div className="text-2xl font-bold text-gray-900">
                                    {history.filter(item => item.status === 'in_progress').length}
                                </div>
                                <div className="text-sm text-gray-600">In Progress</div>
                            </div>
                            
                            <div className="text-center">
                                <div className="text-2xl font-bold text-gray-900">
                                    {history.length > 0 ? Math.round(history.reduce((sum, item) => sum + (item.percentage || 0), 0) / history.length) : 0}%
                                </div>
                                <div className="text-sm text-gray-600">Average Score</div>
                            </div>
                            
                            <div className="text-center">
                                <div className="text-2xl font-bold text-gray-900">
                                    {history.length}
                                </div>
                                <div className="text-sm text-gray-600">Total Attempts</div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
};

export default AssessmentHistory;