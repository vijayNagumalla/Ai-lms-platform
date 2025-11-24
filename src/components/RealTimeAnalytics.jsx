import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { Alert, AlertDescription } from './ui/alert';
import { 
    Activity, 
    TrendingUp,
    TrendingDown,
    Target,
    Award,
    Star,
    Clock,
    Users,
    BookOpen,
    Brain,
    Zap,
    Download,
    RefreshCw,
    Filter,
    Calendar,
    Eye,
    Settings,
    FileText,
    BarChart,
    Building,
    UserCheck,
    User,
    Book,
    PieChart,
    LineChart,
    AlertTriangle,
    Lightbulb,
    Play,
    Pause,
    Stop,
    CheckCircle,
    XCircle,
    Timer,
    Database,
    Cloud,
    HardDrive
} from 'lucide-react';
import { toast } from 'react-hot-toast';

const RealTimeAnalytics = ({ 
    assessmentId,
    onRealTimeAnalyticsViewed,
    showLiveMetrics = true,
    showPerformanceTracking = true,
    showCompletionMonitoring = true,
    showAlertSystem = true
}) => {
    const [realTimeAnalytics, setRealTimeAnalytics] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isLive, setIsLive] = useState(true);
    const [liveMetrics, setLiveMetrics] = useState({});
    const [performanceTracking, setPerformanceTracking] = useState({});
    const [completionMonitoring, setCompletionMonitoring] = useState({});
    const [alertSystem, setAlertSystem] = useState({});
    const [updateInterval, setUpdateInterval] = useState(5000);

    useEffect(() => {
        loadRealTimeAnalytics();
        
        if (isLive) {
            const interval = setInterval(loadRealTimeAnalytics, updateInterval);
            return () => clearInterval(interval);
        }
    }, [assessmentId, isLive, updateInterval]);

    const loadRealTimeAnalytics = async () => {
        try {
            setIsLoading(true);
            
            const response = await fetch('/api/analytics/real-time', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    assessmentId,
                    showLiveMetrics,
                    showPerformanceTracking,
                    showCompletionMonitoring,
                    showAlertSystem
                })
            });

            if (!response.ok) throw new Error('Failed to load real-time analytics');
            
            const data = await response.json();
            setRealTimeAnalytics(data.realTimeAnalytics);
            setLiveMetrics(data.liveMetrics);
            setPerformanceTracking(data.performanceTracking);
            setCompletionMonitoring(data.completionMonitoring);
            setAlertSystem(data.alertSystem);
            
            if (onRealTimeAnalyticsViewed) {
                onRealTimeAnalyticsViewed(data);
            }
            
        } catch (error) {
            console.error('Error loading real-time analytics:', error);
            toast.error('Failed to load real-time analytics');
        } finally {
            setIsLoading(false);
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'active':
                return 'text-green-600';
            case 'warning':
                return 'text-yellow-600';
            case 'critical':
                return 'text-red-600';
            case 'inactive':
                return 'text-gray-600';
            default:
                return 'text-gray-600';
        }
    };

    const getStatusBadge = (status) => {
        switch (status) {
            case 'active':
                return 'bg-green-100 text-green-800';
            case 'warning':
                return 'bg-yellow-100 text-yellow-800';
            case 'critical':
                return 'bg-red-100 text-red-800';
            case 'inactive':
                return 'bg-gray-100 text-gray-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };

    const getAlertIcon = (severity) => {
        switch (severity) {
            case 'high':
                return <AlertTriangle className="w-4 h-4 text-red-500" />;
            case 'medium':
                return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
            case 'low':
                return <AlertTriangle className="w-4 h-4 text-blue-500" />;
            default:
                return <AlertTriangle className="w-4 h-4 text-gray-500" />;
        }
    };

    const getAlertBadge = (severity) => {
        switch (severity) {
            case 'high':
                return 'bg-red-100 text-red-800';
            case 'medium':
                return 'bg-yellow-100 text-yellow-800';
            case 'low':
                return 'bg-blue-100 text-blue-800';
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

    const downloadRealTimeAnalytics = async (format = 'pdf') => {
        try {
            const response = await fetch('/api/analytics/download-real-time', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    assessmentId,
                    format
                })
            });

            if (!response.ok) throw new Error('Download failed');
            
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `real_time_analytics_${format}_${Date.now()}.${format}`;
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

    if (!realTimeAnalytics) {
        return (
            <div className="text-center py-8">
                <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                <p className="text-gray-500">No real-time analytics data available</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="text-center">
                <h2 className="text-3xl font-bold text-gray-900">Real-Time Analytics</h2>
                <p className="text-gray-600 mt-2">Live monitoring and analytics for assessments</p>
            </div>

            {/* Live Status */}
            <Card>
                <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                            <Activity className={`w-4 h-4 ${isLive ? 'text-green-600' : 'text-gray-600'}`} />
                            <span className="text-sm font-medium text-gray-700">
                                Live Status: {isLive ? 'Active' : 'Paused'}
                            </span>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                            <Button 
                                onClick={() => setIsLive(!isLive)}
                                variant={isLive ? "outline" : "default"}
                                size="sm"
                            >
                                {isLive ? <Pause className="w-4 h-4 mr-2" /> : <Play className="w-4 h-4 mr-2" />}
                                {isLive ? 'Pause' : 'Resume'}
                            </Button>
                            
                            <select
                                value={updateInterval}
                                onChange={(e) => setUpdateInterval(Number(e.target.value))}
                                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            >
                                <option value={1000}>1 second</option>
                                <option value={5000}>5 seconds</option>
                                <option value={10000}>10 seconds</option>
                                <option value={30000}>30 seconds</option>
                            </select>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Real-Time Analytics Overview */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center">
                            <div className="p-2 bg-blue-100 rounded-lg">
                                <Users className="w-6 h-6 text-blue-600" />
                            </div>
                            <div className="ml-4">
                                <p className="text-sm font-medium text-gray-600">Active Students</p>
                                <p className="text-2xl font-bold text-gray-900">
                                    {realTimeAnalytics.activeStudents}
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
                                    {realTimeAnalytics.completed}
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center">
                            <div className="p-2 bg-yellow-100 rounded-lg">
                                <Clock className="w-6 h-6 text-yellow-600" />
                            </div>
                            <div className="ml-4">
                                <p className="text-sm font-medium text-gray-600">In Progress</p>
                                <p className="text-2xl font-bold text-gray-900">
                                    {realTimeAnalytics.inProgress}
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center">
                            <div className="p-2 bg-purple-100 rounded-lg">
                                <Target className="w-6 h-6 text-purple-600" />
                            </div>
                            <div className="ml-4">
                                <p className="text-sm font-medium text-gray-600">Average Score</p>
                                <p className="text-2xl font-bold text-gray-900">
                                    {realTimeAnalytics.averageScore}%
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Live Metrics */}
            {showLiveMetrics && liveMetrics && (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center space-x-2">
                            <Activity className="w-5 h-5" />
                            <span>Live Metrics</span>
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="text-center">
                                    <p className="text-2xl font-bold text-green-600">
                                        {liveMetrics.completionRate || 0}%
                                    </p>
                                    <p className="text-sm text-gray-600">Completion Rate</p>
                                </div>
                                
                                <div className="text-center">
                                    <p className="text-2xl font-bold text-blue-600">
                                        {formatTime(liveMetrics.averageTime || 0)}
                                    </p>
                                    <p className="text-sm text-gray-600">Average Time</p>
                                </div>
                                
                                <div className="text-center">
                                    <p className="text-2xl font-bold text-purple-600">
                                        {liveMetrics.efficiency || 0}%
                                    </p>
                                    <p className="text-sm text-gray-600">Efficiency</p>
                                </div>
                            </div>
                            
                            {liveMetrics.students && liveMetrics.students.length > 0 && (
                                <div>
                                    <h4 className="font-medium text-gray-900 mb-2">Active Students</h4>
                                    <div className="space-y-3">
                                        {liveMetrics.students.map((student, index) => (
                                            <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                                                <div className="flex items-center space-x-3">
                                                    <div className={`w-3 h-3 rounded-full ${
                                                        student.status === 'active' ? 'bg-green-500' :
                                                        student.status === 'warning' ? 'bg-yellow-500' :
                                                        'bg-red-500'
                                                    }`}></div>
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

            {/* Performance Tracking */}
            {showPerformanceTracking && performanceTracking && (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center space-x-2">
                            <TrendingUp className="w-5 h-5" />
                            <span>Performance Tracking</span>
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="text-center">
                                    <p className="text-2xl font-bold text-green-600">
                                        {performanceTracking.scoreTrend || 0}%
                                    </p>
                                    <p className="text-sm text-gray-600">Score Trend</p>
                                </div>
                                
                                <div className="text-center">
                                    <p className="text-2xl font-bold text-blue-600">
                                        {performanceTracking.timeTrend || 0}%
                                    </p>
                                    <p className="text-sm text-gray-600">Time Trend</p>
                                </div>
                                
                                <div className="text-center">
                                    <p className="text-2xl font-bold text-purple-600">
                                        {performanceTracking.accuracyTrend || 0}%
                                    </p>
                                    <p className="text-sm text-gray-600">Accuracy Trend</p>
                                </div>
                            </div>
                            
                            {performanceTracking.metrics && performanceTracking.metrics.length > 0 && (
                                <div>
                                    <h4 className="font-medium text-gray-900 mb-2">Performance Metrics</h4>
                                    <div className="space-y-3">
                                        {performanceTracking.metrics.map((metric, index) => (
                                            <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                                                <div className="flex items-center space-x-3">
                                                    <TrendingUp className="w-4 h-4 text-green-500" />
                                                    <div>
                                                        <h5 className="font-medium text-gray-900">{metric.name}</h5>
                                                        <p className="text-sm text-gray-600">{metric.description}</p>
                                                    </div>
                                                </div>
                                                
                                                <div className="text-right">
                                                    <p className="font-bold text-gray-900">{metric.value}%</p>
                                                    <p className="text-xs text-gray-500">
                                                        {metric.trend > 0 ? '+' : ''}{metric.trend}%
                                                    </p>
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

            {/* Completion Monitoring */}
            {showCompletionMonitoring && completionMonitoring && (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center space-x-2">
                            <CheckCircle className="w-5 h-5" />
                            <span>Completion Monitoring</span>
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="text-center">
                                    <p className="text-2xl font-bold text-green-600">
                                        {completionMonitoring.completed || 0}
                                    </p>
                                    <p className="text-sm text-gray-600">Completed</p>
                                </div>
                                
                                <div className="text-center">
                                    <p className="text-2xl font-bold text-blue-600">
                                        {completionMonitoring.inProgress || 0}
                                    </p>
                                    <p className="text-sm text-gray-600">In Progress</p>
                                </div>
                                
                                <div className="text-center">
                                    <p className="text-2xl font-bold text-purple-600">
                                        {completionMonitoring.completionRate || 0}%
                                    </p>
                                    <p className="text-sm text-gray-600">Completion Rate</p>
                                </div>
                            </div>
                            
                            {completionMonitoring.students && completionMonitoring.students.length > 0 && (
                                <div>
                                    <h4 className="font-medium text-gray-900 mb-2">Student Progress</h4>
                                    <div className="space-y-3">
                                        {completionMonitoring.students.map((student, index) => (
                                            <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                                                <div className="flex items-center space-x-3">
                                                    <CheckCircle className="w-4 h-4 text-green-500" />
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

            {/* Alert System */}
            {showAlertSystem && alertSystem && alertSystem.alerts && alertSystem.alerts.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center space-x-2">
                            <AlertTriangle className="w-5 h-5" />
                            <span>Alert System</span>
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {alertSystem.alerts.map((alert, index) => (
                                <div key={index} className={`p-4 border rounded-lg ${
                                    alert.severity === 'high' ? 'bg-red-50 border-red-200' :
                                    alert.severity === 'medium' ? 'bg-yellow-50 border-yellow-200' :
                                    'bg-blue-50 border-blue-200'
                                }`}>
                                    <div className="flex items-center justify-between mb-2">
                                        <div className="flex items-center space-x-2">
                                            {getAlertIcon(alert.severity)}
                                            <h4 className="font-medium text-gray-900">{alert.title}</h4>
                                        </div>
                                        
                                        <Badge className={getAlertBadge(alert.severity)}>
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
                    onClick={() => downloadRealTimeAnalytics('pdf')}
                    variant="outline"
                >
                    <Download className="w-4 h-4 mr-2" />
                    Download PDF
                </Button>
                
                <Button 
                    onClick={() => downloadRealTimeAnalytics('excel')}
                    variant="outline"
                >
                    <Download className="w-4 h-4 mr-2" />
                    Download Excel
                </Button>
                
                <Button 
                    onClick={loadRealTimeAnalytics}
                    variant="outline"
                >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Refresh
                </Button>
            </div>
        </div>
    );
};

export default RealTimeAnalytics;
