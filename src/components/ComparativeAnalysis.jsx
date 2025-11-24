import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { Alert, AlertDescription } from './ui/alert';
import { 
    BarChart3, 
    PieChart, 
    TrendingUp, 
    TrendingDown,
    Users, 
    Target, 
    Award,
    Star,
    Trophy,
    Download,
    Share,
    RefreshCw,
    Filter,
    Calendar,
    BookOpen,
    Brain,
    Zap,
    Activity
} from 'lucide-react';
import { toast } from 'react-hot-toast';

const ComparativeAnalysis = ({ 
    submissionId,
    assessmentId,
    studentId,
    onAnalysisViewed,
    showClassComparison = true,
    showPercentileRanking = true,
    showDepartmentComparison = true,
    showBatchComparison = true
}) => {
    const [analysis, setAnalysis] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [timeRange, setTimeRange] = useState('30d');
    const [comparisonType, setComparisonType] = useState('class'); // class, department, batch, college
    const [performanceInsights, setPerformanceInsights] = useState({});
    const [recommendations, setRecommendations] = useState([]);

    useEffect(() => {
        loadComparativeAnalysis();
    }, [submissionId, timeRange, comparisonType]);

    const loadComparativeAnalysis = async () => {
        try {
            setIsLoading(true);
            
            const response = await fetch('/api/assessment/comparative-analysis', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    submissionId, 
                    assessmentId,
                    studentId,
                    timeRange,
                    comparisonType,
                    showClassComparison,
                    showPercentileRanking,
                    showDepartmentComparison,
                    showBatchComparison
                })
            });

            if (!response.ok) throw new Error('Failed to load comparative analysis');
            
            const data = await response.json();
            setAnalysis(data.analysis);
            setPerformanceInsights(data.insights);
            setRecommendations(data.recommendations || []);
            
            if (onAnalysisViewed) {
                onAnalysisViewed(data);
            }
            
        } catch (error) {
            console.error('Error loading comparative analysis:', error);
            toast.error('Failed to load comparative analysis');
        } finally {
            setIsLoading(false);
        }
    };

    const getPerformanceColor = (score) => {
        if (score >= 90) return 'text-green-600';
        if (score >= 80) return 'text-blue-600';
        if (score >= 70) return 'text-yellow-600';
        if (score >= 60) return 'text-orange-600';
        return 'text-red-600';
    };

    const getPerformanceBadge = (score) => {
        if (score >= 90) return 'bg-green-100 text-green-800';
        if (score >= 80) return 'bg-blue-100 text-blue-800';
        if (score >= 70) return 'bg-yellow-100 text-yellow-800';
        if (score >= 60) return 'bg-orange-100 text-orange-800';
        return 'bg-red-100 text-red-800';
    };

    const getPercentileColor = (percentile) => {
        if (percentile >= 90) return 'text-green-600';
        if (percentile >= 75) return 'text-blue-600';
        if (percentile >= 50) return 'text-yellow-600';
        if (percentile >= 25) return 'text-orange-600';
        return 'text-red-600';
    };

    const getPercentileBadge = (percentile) => {
        if (percentile >= 90) return 'bg-green-100 text-green-800';
        if (percentile >= 75) return 'bg-blue-100 text-blue-800';
        if (percentile >= 50) return 'bg-yellow-100 text-yellow-800';
        if (percentile >= 25) return 'bg-orange-100 text-orange-800';
        return 'bg-red-100 text-red-800';
    };

    const getTrendIcon = (trend) => {
        if (trend > 0) return <TrendingUp className="w-4 h-4 text-green-500" />;
        if (trend < 0) return <TrendingDown className="w-4 h-4 text-red-500" />;
        return <Target className="w-4 h-4 text-gray-500" />;
    };

    const downloadAnalysis = async (format = 'pdf') => {
        try {
            const response = await fetch('/api/assessment/download-analysis', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    submissionId, 
                    format,
                    timeRange,
                    comparisonType
                })
            });

            if (!response.ok) throw new Error('Download failed');
            
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `comparative_analysis_${format}_${Date.now()}.${format}`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
            
            toast.success(`${format.toUpperCase()} download started`);
        } catch (error) {
            console.error('Download error:', error);
            toast.error('Download failed');
        }
    };

    const shareAnalysis = async () => {
        try {
            if (navigator.share) {
                await navigator.share({
                    title: 'Comparative Analysis',
                    text: `Check out my performance analysis and rankings`,
                    url: window.location.href
                });
            } else {
                await navigator.clipboard.writeText(
                    `Comparative Analysis: ${analysis?.percentileRank}th percentile, ${analysis?.classRank}th in class`
                );
                toast.success('Analysis summary copied to clipboard');
            }
        } catch (error) {
            console.error('Share error:', error);
            toast.error('Share failed');
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    if (!analysis) {
        return (
            <div className="text-center py-8">
                <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                <p className="text-gray-500">No comparative analysis available</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="text-center">
                <h2 className="text-3xl font-bold text-gray-900">Comparative Analysis</h2>
                <p className="text-gray-600 mt-2">Compare your performance with peers and track your progress</p>
            </div>

            {/* Time Range and Comparison Type Selectors */}
            <Card>
                <CardContent className="p-4">
                    <div className="flex flex-col md:flex-row gap-4">
                        <div className="flex items-center space-x-2">
                            <Calendar className="w-4 h-4 text-gray-600" />
                            <span className="text-sm font-medium text-gray-700">Time Range:</span>
                            <select
                                value={timeRange}
                                onChange={(e) => setTimeRange(e.target.value)}
                                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            >
                                <option value="7d">Last 7 days</option>
                                <option value="30d">Last 30 days</option>
                                <option value="90d">Last 90 days</option>
                                <option value="1y">Last year</option>
                            </select>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                            <Filter className="w-4 h-4 text-gray-600" />
                            <span className="text-sm font-medium text-gray-700">Comparison:</span>
                            <select
                                value={comparisonType}
                                onChange={(e) => setComparisonType(e.target.value)}
                                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            >
                                <option value="class">Class</option>
                                <option value="department">Department</option>
                                <option value="batch">Batch</option>
                                <option value="college">College</option>
                            </select>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Performance Overview */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center">
                            <div className="p-2 bg-blue-100 rounded-lg">
                                <Target className="w-6 h-6 text-blue-600" />
                            </div>
                            <div className="ml-4">
                                <p className="text-sm font-medium text-gray-600">Your Score</p>
                                <p className={`text-2xl font-bold ${getPerformanceColor(analysis.studentScore)}`}>
                                    {analysis.studentScore}%
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center">
                            <div className="p-2 bg-green-100 rounded-lg">
                                <Users className="w-6 h-6 text-green-600" />
                            </div>
                            <div className="ml-4">
                                <p className="text-sm font-medium text-gray-600">Class Average</p>
                                <p className="text-2xl font-bold text-gray-900">
                                    {analysis.classAverage}%
                                </p>
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
                                <p className="text-sm font-medium text-gray-600">Percentile Rank</p>
                                <p className={`text-2xl font-bold ${getPercentileColor(analysis.percentileRank)}`}>
                                    {analysis.percentileRank}th
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center">
                            <div className="p-2 bg-orange-100 rounded-lg">
                                <Trophy className="w-6 h-6 text-orange-600" />
                            </div>
                            <div className="ml-4">
                                <p className="text-sm font-medium text-gray-600">Class Rank</p>
                                <p className="text-2xl font-bold text-gray-900">
                                    {analysis.classRank}th
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Performance Comparison */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                        <BarChart3 className="w-5 h-5" />
                        <span>Performance Comparison</span>
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="p-4 border rounded-lg">
                                <h4 className="font-medium text-gray-900 mb-2">Your Performance</h4>
                                <div className="space-y-2">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-600">Score:</span>
                                        <span className={`font-medium ${getPerformanceColor(analysis.studentScore)}`}>
                                            {analysis.studentScore}%
                                        </span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-600">Time Taken:</span>
                                        <span className="font-medium">{analysis.studentTime}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-600">Accuracy:</span>
                                        <span className="font-medium">{analysis.studentAccuracy}%</span>
                                    </div>
                                </div>
                            </div>
                            
                            <div className="p-4 border rounded-lg">
                                <h4 className="font-medium text-gray-900 mb-2">Class Average</h4>
                                <div className="space-y-2">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-600">Score:</span>
                                        <span className="font-medium text-gray-900">
                                            {analysis.classAverage}%
                                        </span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-600">Time Taken:</span>
                                        <span className="font-medium">{analysis.classAverageTime}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-600">Accuracy:</span>
                                        <span className="font-medium">{analysis.classAverageAccuracy}%</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        <div className="p-4 border rounded-lg bg-gray-50">
                            <h4 className="font-medium text-gray-900 mb-2">Performance Gap</h4>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
                                <div>
                                    <p className={`text-2xl font-bold ${analysis.scoreDifference >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                        {analysis.scoreDifference >= 0 ? '+' : ''}{analysis.scoreDifference}%
                                    </p>
                                    <p className="text-sm text-gray-600">Score Difference</p>
                                </div>
                                
                                <div>
                                    <p className={`text-2xl font-bold ${analysis.timeDifference >= 0 ? 'text-red-600' : 'text-green-600'}`}>
                                        {analysis.timeDifference >= 0 ? '+' : ''}{analysis.timeDifference}m
                                    </p>
                                    <p className="text-sm text-gray-600">Time Difference</p>
                                </div>
                                
                                <div>
                                    <p className={`text-2xl font-bold ${analysis.accuracyDifference >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                        {analysis.accuracyDifference >= 0 ? '+' : ''}{analysis.accuracyDifference}%
                                    </p>
                                    <p className="text-sm text-gray-600">Accuracy Difference</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Percentile Ranking */}
            {showPercentileRanking && analysis.percentileRanking && (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center space-x-2">
                            <PieChart className="w-5 h-5" />
                            <span>Percentile Ranking</span>
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            <div className="text-center">
                                <div className="relative w-32 h-32 mx-auto">
                                    <svg className="w-32 h-32 transform -rotate-90">
                                        <circle
                                            cx="64"
                                            cy="64"
                                            r="56"
                                            stroke="currentColor"
                                            strokeWidth="8"
                                            fill="transparent"
                                            className="text-gray-200"
                                        />
                                        <circle
                                            cx="64"
                                            cy="64"
                                            r="56"
                                            stroke="currentColor"
                                            strokeWidth="8"
                                            fill="transparent"
                                            strokeDasharray={`${2 * Math.PI * 56}`}
                                            strokeDashoffset={`${2 * Math.PI * 56 * (1 - analysis.percentileRank / 100)}`}
                                            className="text-blue-600"
                                        />
                                    </svg>
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <div className="text-center">
                                            <p className="text-2xl font-bold text-blue-600">
                                                {analysis.percentileRank}th
                                            </p>
                                            <p className="text-xs text-gray-600">Percentile</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
                                <div>
                                    <p className="text-2xl font-bold text-green-600">
                                        {analysis.percentileRanking.topPerformers}%
                                    </p>
                                    <p className="text-sm text-gray-600">Top Performers</p>
                                </div>
                                
                                <div>
                                    <p className="text-2xl font-bold text-blue-600">
                                        {analysis.percentileRanking.averagePerformers}%
                                    </p>
                                    <p className="text-sm text-gray-600">Average Performers</p>
                                </div>
                                
                                <div>
                                    <p className="text-2xl font-bold text-red-600">
                                        {analysis.percentileRanking.belowAverage}%
                                    </p>
                                    <p className="text-sm text-gray-600">Below Average</p>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Department Comparison */}
            {showDepartmentComparison && analysis.departmentComparison && (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center space-x-2">
                            <Users className="w-5 h-5" />
                            <span>Department Comparison</span>
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {analysis.departmentComparison.map((dept, index) => (
                                <div key={index} className="p-4 border rounded-lg">
                                    <div className="flex items-center justify-between mb-3">
                                        <div>
                                            <h4 className="font-medium text-gray-900">{dept.name}</h4>
                                            <p className="text-sm text-gray-600">
                                                {dept.studentCount} students
                                            </p>
                                        </div>
                                        
                                        <div className="text-right">
                                            <p className={`text-2xl font-bold ${getPerformanceColor(dept.averageScore)}`}>
                                                {dept.averageScore}%
                                            </p>
                                            <Badge className={getPerformanceBadge(dept.averageScore)}>
                                                {dept.averageScore >= 70 ? 'Passed' : 'Failed'}
                                            </Badge>
                                        </div>
                                    </div>
                                    
                                    <div className="space-y-2">
                                        <div className="flex justify-between text-sm">
                                            <span className="text-gray-600">Average Time:</span>
                                            <span className="font-medium">{dept.averageTime}</span>
                                        </div>
                                        
                                        <div className="flex justify-between text-sm">
                                            <span className="text-gray-600">Pass Rate:</span>
                                            <span className="font-medium">{dept.passRate}%</span>
                                        </div>
                                        
                                        <div className="flex justify-between text-sm">
                                            <span className="text-gray-600">Your Rank:</span>
                                            <span className="font-medium">{dept.studentRank}th</span>
                                        </div>
                                    </div>
                                    
                                    <div className="mt-3">
                                        <Progress value={dept.averageScore} className="w-full" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Batch Comparison */}
            {showBatchComparison && analysis.batchComparison && (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center space-x-2">
                            <Activity className="w-5 h-5" />
                            <span>Batch Comparison</span>
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {analysis.batchComparison.map((batch, index) => (
                                <div key={index} className="p-4 border rounded-lg">
                                    <div className="flex items-center justify-between mb-3">
                                        <div>
                                            <h4 className="font-medium text-gray-900">{batch.name}</h4>
                                            <p className="text-sm text-gray-600">
                                                {batch.studentCount} students
                                            </p>
                                        </div>
                                        
                                        <div className="text-right">
                                            <p className={`text-2xl font-bold ${getPerformanceColor(batch.averageScore)}`}>
                                                {batch.averageScore}%
                                            </p>
                                            <Badge className={getPerformanceBadge(batch.averageScore)}>
                                                {batch.averageScore >= 70 ? 'Passed' : 'Failed'}
                                            </Badge>
                                        </div>
                                    </div>
                                    
                                    <div className="space-y-2">
                                        <div className="flex justify-between text-sm">
                                            <span className="text-gray-600">Average Time:</span>
                                            <span className="font-medium">{batch.averageTime}</span>
                                        </div>
                                        
                                        <div className="flex justify-between text-sm">
                                            <span className="text-gray-600">Pass Rate:</span>
                                            <span className="font-medium">{batch.passRate}%</span>
                                        </div>
                                        
                                        <div className="flex justify-between text-sm">
                                            <span className="text-gray-600">Your Rank:</span>
                                            <span className="font-medium">{batch.studentRank}th</span>
                                        </div>
                                    </div>
                                    
                                    <div className="mt-3">
                                        <Progress value={batch.averageScore} className="w-full" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Performance Insights */}
            {performanceInsights && (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center space-x-2">
                            <Brain className="w-5 h-5" />
                            <span>Performance Insights</span>
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {performanceInsights.strengths && performanceInsights.strengths.length > 0 && (
                                <div>
                                    <h4 className="font-medium text-green-800 mb-2">Strengths</h4>
                                    <div className="flex flex-wrap gap-2">
                                        {performanceInsights.strengths.map((strength, index) => (
                                            <Badge key={index} className="bg-green-100 text-green-800">
                                                {strength}
                                            </Badge>
                                        ))}
                                    </div>
                                </div>
                            )}
                            
                            {performanceInsights.weaknesses && performanceInsights.weaknesses.length > 0 && (
                                <div>
                                    <h4 className="font-medium text-red-800 mb-2">Areas for Improvement</h4>
                                    <div className="flex flex-wrap gap-2">
                                        {performanceInsights.weaknesses.map((weakness, index) => (
                                            <Badge key={index} className="bg-red-100 text-red-800">
                                                {weakness}
                                            </Badge>
                                        ))}
                                    </div>
                                </div>
                            )}
                            
                            {performanceInsights.recommendations && performanceInsights.recommendations.length > 0 && (
                                <div>
                                    <h4 className="font-medium text-blue-800 mb-2">Recommendations</h4>
                                    <ul className="list-disc list-inside space-y-1 text-sm text-gray-700">
                                        {performanceInsights.recommendations.map((rec, index) => (
                                            <li key={index}>{rec}</li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Recommendations */}
            {recommendations.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center space-x-2">
                            <Star className="w-5 h-5" />
                            <span>Recommendations</span>
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {recommendations.map((recommendation, index) => (
                                <div key={index} className="p-4 border rounded-lg hover:bg-gray-50">
                                    <div className="flex items-start space-x-3">
                                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                                            <BookOpen className="w-4 h-4 text-blue-600" />
                                        </div>
                                        <div className="flex-1">
                                            <h4 className="font-medium text-gray-900">{recommendation.title}</h4>
                                            <p className="text-sm text-gray-600 mt-1">{recommendation.description}</p>
                                            <div className="flex items-center space-x-2 mt-2">
                                                <Badge className="bg-blue-100 text-blue-800">
                                                    {recommendation.type}
                                                </Badge>
                                                <span className="text-xs text-gray-500">
                                                    {recommendation.estimatedTime}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Actions */}
            <div className="flex justify-center space-x-4">
                <Button 
                    onClick={() => downloadAnalysis('pdf')}
                    variant="outline"
                >
                    <Download className="w-4 h-4 mr-2" />
                    Download PDF
                </Button>
                
                <Button 
                    onClick={() => downloadAnalysis('excel')}
                    variant="outline"
                >
                    <Download className="w-4 h-4 mr-2" />
                    Download Excel
                </Button>
                
                <Button 
                    onClick={shareAnalysis}
                    variant="outline"
                >
                    <Share className="w-4 h-4 mr-2" />
                    Share Analysis
                </Button>
                
                <Button 
                    onClick={loadComparativeAnalysis}
                    variant="outline"
                >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Refresh
                </Button>
            </div>
        </div>
    );
};

export default ComparativeAnalysis;
