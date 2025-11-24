import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { Alert, AlertDescription } from './ui/alert';
import { 
    BarChart3, 
    TrendingUp, 
    TrendingDown,
    Target, 
    Award,
    Star,
    Clock,
    BookOpen,
    Brain,
    Zap,
    Download,
    RefreshCw,
    Filter,
    Calendar,
    Activity,
    Trophy,
    CheckCircle,
    XCircle,
    AlertTriangle,
    Lightbulb,
    Users,
    GraduationCap,
    PieChart,
    LineChart,
    Eye,
    Settings,
    FileText,
    BarChart,
    Building,
    UserCheck,
    User,
    Book,
    Timer,
    Play,
    Pause,
    Stop
} from 'lucide-react';
import { toast } from 'react-hot-toast';

const CompletionTracking = ({ 
    assessmentId,
    onCompletionTrackingViewed,
    showRealTimeTracking = true,
    showCompletionRates = true,
    showTimeAnalysis = true,
    showAlerts = true
}) => {
    const [completionTracking, setCompletionTracking] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [timeRange, setTimeRange] = useState('30d');
    const [selectedMetric, setSelectedMetric] = useState('overall');
    const [realTimeTracking, setRealTimeTracking] = useState({});
    const [completionRates, setCompletionRates] = useState({});
    const [timeAnalysis, setTimeAnalysis] = useState({});
    const [alerts, setAlerts] = useState([]);

    useEffect(() => {
        loadCompletionTracking();
    }, [assessmentId, timeRange]);

    const loadCompletionTracking = async () => {
        try {
            setIsLoading(true);
            
            const response = await fetch('/api/assessment/completion-tracking', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    assessmentId,
                    timeRange,
                    showRealTimeTracking,
                    showCompletionRates,
                    showTimeAnalysis,
                    showAlerts
                })
            });

            if (!response.ok) throw new Error('Failed to load completion tracking');
            
            const data = await response.json();
            setCompletionTracking(data.completionTracking);
            setRealTimeTracking(data.realTimeTracking);
            setCompletionRates(data.completionRates);
            setTimeAnalysis(data.timeAnalysis);
            setAlerts(data.alerts || []);
            
            if (onCompletionTrackingViewed) {
                onCompletionTrackingViewed(data);
            }
            
        } catch (error) {
            console.error('Error loading completion tracking:', error);
            toast.error('Failed to load completion tracking');
        } finally {
            setIsLoading(false);
        }
    };

    const getCompletionColor = (rate) => {
        if (rate >= 90) return 'text-green-600';
        if (rate >= 80) return 'text-blue-600';
        if (rate >= 70) return 'text-yellow-600';
        if (rate >= 60) return 'text-orange-600';
        return 'text-red-600';
    };

    const getCompletionBadge = (rate) => {
        if (rate >= 90) return 'bg-green-100 text-green-800';
        if (rate >= 80) return 'bg-blue-100 text-blue-800';
        if (rate >= 70) return 'bg-yellow-100 text-yellow-800';
        if (rate >= 60) return 'bg-orange-100 text-orange-800';
        return 'bg-red-100 text-red-800';
    };

    const getStatusIcon = (status) => {
        switch (status) {
            case 'completed':
                return <CheckCircle className="w-4 h-4 text-green-500" />;
            case 'in-progress':
                return <Play className="w-4 h-4 text-blue-500" />;
            case 'not-started':
                return <Pause className="w-4 h-4 text-gray-500" />;
            case 'abandoned':
                return <Stop className="w-4 h-4 text-red-500" />;
            default:
                return <Clock className="w-4 h-4 text-gray-500" />;
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

    const formatTime = (minutes) => {
        if (minutes < 60) return `${minutes}m`;
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        return `${hours}h ${mins}m`;
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

    const downloadCompletionTracking = async (format = 'pdf') => {
        try {
            const response = await fetch('/api/assessment/download-completion-tracking', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    assessmentId,
                    format,
                    timeRange
                })
            });

            if (!response.ok) throw new Error('Download failed');
            
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `completion_tracking_${format}_${Date.now()}.${format}`;
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

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    if (!completionTracking) {
        return (
            <div className="text-center py-8">
                <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                <p className="text-gray-500">No completion tracking data available</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="text-center">
                <h2 className="text-3xl font-bold text-gray-900">Completion Tracking</h2>
                <p className="text-gray-600 mt-2">Monitor assessment completion rates and progress</p>
            </div>

            {/* Time Range Selector */}
            <Card>
                <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                            <Calendar className="w-4 h-4 text-gray-600" />
                            <span className="text-sm font-medium text-gray-700">Time Range:</span>
                        </div>
                        
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
                </CardContent>
            </Card>

            {/* Completion Tracking Overview */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center">
                            <div className="p-2 bg-blue-100 rounded-lg">
                                <Users className="w-6 h-6 text-blue-600" />
                            </div>
                            <div className="ml-4">
                                <p className="text-sm font-medium text-gray-600">Total Students</p>
                                <p className="text-2xl font-bold text-gray-900">
                                    {completionTracking.totalStudents}
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center">
                            <div className="p-2 bg-green-100 rounded-lg">
                                <CheckCircle className="w-6 h-6 text-green-600" />
                            </div>
                            <div className="ml-4">
                                <p className="text-sm font-medium text-gray-600">Completed</p>
                                <p className="text-2xl font-bold text-gray-900">
                                    {completionTracking.completed}
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center">
                            <div className="p-2 bg-yellow-100 rounded-lg">
                                <Play className="w-6 h-6 text-yellow-600" />
                            </div>
                            <div className="ml-4">
                                <p className="text-sm font-medium text-gray-600">In Progress</p>
                                <p className="text-2xl font-bold text-gray-900">
                                    {completionTracking.inProgress}
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center">
                            <div className="p-2 bg-orange-100 rounded-lg">
                                <Target className="w-6 h-6 text-orange-600" />
                            </div>
                            <div className="ml-4">
                                <p className="text-sm font-medium text-gray-600">Completion Rate</p>
                                <p className={`text-2xl font-bold ${getCompletionColor(completionTracking.completionRate)}`}>
                                    {completionTracking.completionRate}%
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Real-time Tracking */}
            {showRealTimeTracking && realTimeTracking && (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center space-x-2">
                            <Activity className="w-5 h-5" />
                            <span>Real-time Tracking</span>
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="text-center">
                                    <p className="text-2xl font-bold text-green-600">
                                        {realTimeTracking.activeStudents || 0}
                                    </p>
                                    <p className="text-sm text-gray-600">Active Students</p>
                                </div>
                                
                                <div className="text-center">
                                    <p className="text-2xl font-bold text-blue-600">
                                        {realTimeTracking.averageProgress || 0}%
                                    </p>
                                    <p className="text-sm text-gray-600">Average Progress</p>
                                </div>
                                
                                <div className="text-center">
                                    <p className="text-2xl font-bold text-purple-600">
                                        {realTimeTracking.estimatedCompletion || 0}%
                                    </p>
                                    <p className="text-sm text-gray-600">Estimated Completion</p>
                                </div>
                            </div>
                            
                            {realTimeTracking.students && realTimeTracking.students.length > 0 && (
                                <div>
                                    <h4 className="font-medium text-gray-900 mb-2">Student Progress</h4>
                                    <div className="space-y-3">
                                        {realTimeTracking.students.map((student, index) => (
                                            <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                                                <div className="flex items-center space-x-3">
                                                    {getStatusIcon(student.status)}
                                                    <div>
                                                        <h5 className="font-medium text-gray-900">{student.studentName}</h5>
                                                        <p className="text-sm text-gray-600">{student.batch} • {student.department}</p>
                                                    </div>
                                                </div>
                                                
                                                <div className="text-right">
                                                    <p className="font-bold text-gray-900">{student.progress}%</p>
                                                    <Badge className={getStatusBadge(student.status)}>
                                                        {student.status}
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

            {/* Completion Rates */}
            {showCompletionRates && completionRates && (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center space-x-2">
                            <BarChart3 className="w-5 h-5" />
                            <span>Completion Rates</span>
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="text-center">
                                    <p className="text-2xl font-bold text-green-600">
                                        {completionRates.overallRate || 0}%
                                    </p>
                                    <p className="text-sm text-gray-600">Overall Rate</p>
                                </div>
                                
                                <div className="text-center">
                                    <p className="text-2xl font-bold text-blue-600">
                                        {completionRates.onTimeRate || 0}%
                                    </p>
                                    <p className="text-sm text-gray-600">On-time Rate</p>
                                </div>
                                
                                <div className="text-center">
                                    <p className="text-2xl font-bold text-purple-600">
                                        {completionRates.lateRate || 0}%
                                    </p>
                                    <p className="text-sm text-gray-600">Late Rate</p>
                                </div>
                            </div>
                            
                            {completionRates.breakdown && (
                                <div>
                                    <h4 className="font-medium text-gray-900 mb-2">Completion Breakdown</h4>
                                    <div className="space-y-2">
                                        {completionRates.breakdown.map((item, index) => (
                                            <div key={index} className="flex items-center justify-between">
                                                <span className="text-sm text-gray-600">{item.category}</span>
                                                <div className="flex items-center space-x-2">
                                                    <Progress value={item.percentage} className="w-32" />
                                                    <span className="text-sm font-medium">{item.percentage}%</span>
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

            {/* Time Analysis */}
            {showTimeAnalysis && timeAnalysis && (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center space-x-2">
                            <Clock className="w-5 h-5" />
                            <span>Time Analysis</span>
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="text-center">
                                    <p className="text-2xl font-bold text-green-600">
                                        {formatTime(timeAnalysis.averageTime || 0)}
                                    </p>
                                    <p className="text-sm text-gray-600">Average Time</p>
                                </div>
                                
                                <div className="text-center">
                                    <p className="text-2xl font-bold text-blue-600">
                                        {formatTime(timeAnalysis.fastestTime || 0)}
                                    </p>
                                    <p className="text-sm text-gray-600">Fastest Time</p>
                                </div>
                                
                                <div className="text-center">
                                    <p className="text-2xl font-bold text-purple-600">
                                        {formatTime(timeAnalysis.slowestTime || 0)}
                                    </p>
                                    <p className="text-sm text-gray-600">Slowest Time</p>
                                </div>
                            </div>
                            
                            {timeAnalysis.distribution && (
                                <div>
                                    <h4 className="font-medium text-gray-900 mb-2">Time Distribution</h4>
                                    <div className="space-y-2">
                                        {timeAnalysis.distribution.map((item, index) => (
                                            <div key={index} className="flex items-center justify-between">
                                                <span className="text-sm text-gray-600">{item.range}</span>
                                                <div className="flex items-center space-x-2">
                                                    <Progress value={item.percentage} className="w-32" />
                                                    <span className="text-sm font-medium">{item.percentage}%</span>
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

            {/* Alerts */}
            {showAlerts && alerts.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center space-x-2">
                            <AlertTriangle className="w-5 h-5" />
                            <span>Completion Alerts</span>
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {alerts.map((alert, index) => (
                                <div key={index} className={`p-4 border rounded-lg ${
                                    alert.severity === 'high' ? 'bg-red-50 border-red-200' :
                                    alert.severity === 'medium' ? 'bg-yellow-50 border-yellow-200' :
                                    'bg-blue-50 border-blue-200'
                                }`}>
                                    <div className="flex items-center justify-between mb-2">
                                        <div className="flex items-center space-x-2">
                                            <AlertTriangle className={`w-4 h-4 ${
                                                alert.severity === 'high' ? 'text-red-600' :
                                                alert.severity === 'medium' ? 'text-yellow-600' :
                                                'text-blue-600'
                                            }`} />
                                            <h4 className="font-medium text-gray-900">{alert.title}</h4>
                                        </div>
                                        
                                        <Badge className={
                                            alert.severity === 'high' ? 'bg-red-100 text-red-800' :
                                            alert.severity === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                                            'bg-blue-100 text-blue-800'
                                        }>
                                            {alert.severity}
                                        </Badge>
                                    </div>
                                    
                                    <p className="text-sm text-gray-700">{alert.description}</p>
                                    <p className="text-xs text-gray-500 mt-1">
                                        {formatDate(alert.createdAt)}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Actions */}
            <div className="flex justify-center space-x-4">
                <Button 
                    onClick={() => downloadCompletionTracking('pdf')}
                    variant="outline"
                >
                    <Download className="w-4 h-4 mr-2" />
                    Download PDF
                </Button>
                
                <Button 
                    onClick={() => downloadCompletionTracking('excel')}
                    variant="outline"
                >
                    <Download className="w-4 h-4 mr-2" />
                    Download Excel
                </Button>
                
                <Button 
                    onClick={loadCompletionTracking}
                    variant="outline"
                >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Refresh
                </Button>
            </div>
        </div>
    );
};

export default CompletionTracking;
