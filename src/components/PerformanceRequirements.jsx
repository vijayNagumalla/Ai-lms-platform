import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { Alert, AlertDescription } from './ui/alert';
import { 
    Zap, 
    Clock,
    Target,
    Award,
    Star,
    TrendingUp,
    TrendingDown,
    Activity,
    Users,
    BookOpen,
    Brain,
    Download,
    RefreshCw,
    Filter,
    Calendar,
    Settings,
    Eye,
    Database,
    Cloud,
    HardDrive,
    CheckCircle,
    XCircle,
    AlertTriangle,
    Lightbulb,
    Play,
    Pause,
    Stop,
    Timer,
    BarChart3,
    PieChart,
    LineChart,
    FileText,
    Building,
    UserCheck,
    User,
    Book,
    GraduationCap,
    Shield,
    Lock,
    Key
} from 'lucide-react';
import { toast } from 'react-hot-toast';

const PerformanceRequirements = ({ 
    onPerformanceRequirementsViewed,
    showFastLoading = true,
    showSmoothNavigation = true,
    showAutoSavePerformance = true,
    showOptimizedRendering = true,
    showScalableAnalytics = true
}) => {
    const [performanceRequirements, setPerformanceRequirements] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [performanceMetrics, setPerformanceMetrics] = useState({});
    const [loadingPerformance, setLoadingPerformance] = useState({});
    const [navigationPerformance, setNavigationPerformance] = useState({});
    const [autoSavePerformance, setAutoSavePerformance] = useState({});
    const [renderingPerformance, setRenderingPerformance] = useState({});
    const [analyticsPerformance, setAnalyticsPerformance] = useState({});

    useEffect(() => {
        loadPerformanceRequirements();
    }, []);

    const loadPerformanceRequirements = async () => {
        try {
            setIsLoading(true);
            
            const response = await fetch('/api/performance/requirements', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    showFastLoading,
                    showSmoothNavigation,
                    showAutoSavePerformance,
                    showOptimizedRendering,
                    showScalableAnalytics
                })
            });

            if (!response.ok) throw new Error('Failed to load performance requirements');
            
            const data = await response.json();
            setPerformanceRequirements(data.performanceRequirements);
            setPerformanceMetrics(data.performanceMetrics);
            setLoadingPerformance(data.loadingPerformance);
            setNavigationPerformance(data.navigationPerformance);
            setAutoSavePerformance(data.autoSavePerformance);
            setRenderingPerformance(data.renderingPerformance);
            setAnalyticsPerformance(data.analyticsPerformance);
            
            if (onPerformanceRequirementsViewed) {
                onPerformanceRequirementsViewed(data);
            }
            
        } catch (error) {
            console.error('Error loading performance requirements:', error);
            toast.error('Failed to load performance requirements');
        } finally {
            setIsLoading(false);
        }
    };

    const getPerformanceIcon = (type) => {
        switch (type) {
            case 'loading':
                return <Clock className="w-4 h-4" />;
            case 'navigation':
                return <Target className="w-4 h-4" />;
            case 'auto-save':
                return <Zap className="w-4 h-4" />;
            case 'rendering':
                return <BarChart3 className="w-4 h-4" />;
            case 'analytics':
                return <TrendingUp className="w-4 h-4" />;
            default:
                return <Zap className="w-4 h-4" />;
        }
    };

    const getPerformanceColor = (performance) => {
        if (performance >= 90) return 'text-green-600';
        if (performance >= 80) return 'text-blue-600';
        if (performance >= 70) return 'text-yellow-600';
        if (performance >= 60) return 'text-orange-600';
        return 'text-red-600';
    };

    const getPerformanceBadge = (performance) => {
        if (performance >= 90) return 'bg-green-100 text-green-800';
        if (performance >= 80) return 'bg-blue-100 text-blue-800';
        if (performance >= 70) return 'bg-yellow-100 text-yellow-800';
        if (performance >= 60) return 'bg-orange-100 text-orange-800';
        return 'bg-red-100 text-red-800';
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'excellent':
                return 'text-green-600';
            case 'good':
                return 'text-blue-600';
            case 'average':
                return 'text-yellow-600';
            case 'poor':
                return 'text-red-600';
            default:
                return 'text-gray-600';
        }
    };

    const getStatusBadge = (status) => {
        switch (status) {
            case 'excellent':
                return 'bg-green-100 text-green-800';
            case 'good':
                return 'bg-blue-100 text-blue-800';
            case 'average':
                return 'bg-yellow-100 text-yellow-800';
            case 'poor':
                return 'bg-red-100 text-red-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };

    const formatTime = (milliseconds) => {
        if (milliseconds < 1000) return `${milliseconds}ms`;
        const seconds = (milliseconds / 1000).toFixed(1);
        return `${seconds}s`;
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

    const downloadPerformanceReport = async (format = 'pdf') => {
        try {
            const response = await fetch('/api/performance/download-report', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    format
                })
            });

            if (!response.ok) throw new Error('Download failed');
            
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `performance_report_${format}_${Date.now()}.${format}`;
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

    if (!performanceRequirements) {
        return (
            <div className="text-center py-8">
                <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                <p className="text-gray-500">No performance requirements data available</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="text-center">
                <h2 className="text-3xl font-bold text-gray-900">Performance Requirements</h2>
                <p className="text-gray-600 mt-2">Comprehensive performance monitoring and optimization</p>
            </div>

            {/* Performance Overview */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center">
                            <div className="p-2 bg-green-100 rounded-lg">
                                <Clock className="w-6 h-6 text-green-600" />
                            </div>
                            <div className="ml-4">
                                <p className="text-sm font-medium text-gray-600">Fast Loading</p>
                                <p className="text-2xl font-bold text-gray-900">
                                    {performanceMetrics.fastLoading || '1.2s'}
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center">
                            <div className="p-2 bg-blue-100 rounded-lg">
                                <Target className="w-6 h-6 text-blue-600" />
                            </div>
                            <div className="ml-4">
                                <p className="text-sm font-medium text-gray-600">Smooth Navigation</p>
                                <p className="text-2xl font-bold text-gray-900">
                                    {performanceMetrics.smoothNavigation || '0.3s'}
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center">
                            <div className="p-2 bg-purple-100 rounded-lg">
                                <Zap className="w-6 h-6 text-purple-600" />
                            </div>
                            <div className="ml-4">
                                <p className="text-sm font-medium text-gray-600">Auto-Save</p>
                                <p className="text-2xl font-bold text-gray-900">
                                    {performanceMetrics.autoSave || '0.1s'}
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center">
                            <div className="p-2 bg-orange-100 rounded-lg">
                                <BarChart3 className="w-6 h-6 text-orange-600" />
                            </div>
                            <div className="ml-4">
                                <p className="text-sm font-medium text-gray-600">Rendering</p>
                                <p className="text-2xl font-bold text-gray-900">
                                    {performanceMetrics.rendering || '0.5s'}
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center">
                            <div className="p-2 bg-red-100 rounded-lg">
                                <TrendingUp className="w-6 h-6 text-red-600" />
                            </div>
                            <div className="ml-4">
                                <p className="text-sm font-medium text-gray-600">Analytics</p>
                                <p className="text-2xl font-bold text-gray-900">
                                    {performanceMetrics.analytics || '2.1s'}
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Fast Loading Performance */}
            {showFastLoading && loadingPerformance && (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center space-x-2">
                            <Clock className="w-5 h-5" />
                            <span>Fast Loading Performance</span>
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="text-center">
                                    <p className={`text-2xl font-bold ${getPerformanceColor(loadingPerformance.assessmentStart)}`}>
                                        {formatTime(loadingPerformance.assessmentStart)}
                                    </p>
                                    <p className="text-sm text-gray-600">Assessment Start Time</p>
                                </div>
                                
                                <div className="text-center">
                                    <p className={`text-2xl font-bold ${getPerformanceColor(loadingPerformance.pageLoad)}`}>
                                        {formatTime(loadingPerformance.pageLoad)}
                                    </p>
                                    <p className="text-sm text-gray-600">Page Load Time</p>
                                </div>
                                
                                <div className="text-center">
                                    <p className={`text-2xl font-bold ${getPerformanceColor(loadingPerformance.dataLoad)}`}>
                                        {formatTime(loadingPerformance.dataLoad)}
                                    </p>
                                    <p className="text-sm text-gray-600">Data Load Time</p>
                                </div>
                            </div>
                            
                            {loadingPerformance.optimizations && (
                                <div>
                                    <h4 className="font-medium text-gray-900 mb-2">Loading Optimizations</h4>
                                    <div className="space-y-3">
                                        {loadingPerformance.optimizations.map((optimization, index) => (
                                            <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                                                <div className="flex items-center space-x-3">
                                                    <Zap className="w-4 h-4 text-green-500" />
                                                    <div>
                                                        <h5 className="font-medium text-gray-900">{optimization.name}</h5>
                                                        <p className="text-sm text-gray-600">{optimization.description}</p>
                                                    </div>
                                                </div>
                                                
                                                <Badge className={getStatusBadge(optimization.status)}>
                                                    {optimization.status}
                                                </Badge>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Smooth Navigation Performance */}
            {showSmoothNavigation && navigationPerformance && (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center space-x-2">
                            <Target className="w-5 h-5" />
                            <span>Smooth Navigation Performance</span>
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="text-center">
                                    <p className={`text-2xl font-bold ${getPerformanceColor(navigationPerformance.questionSwitch)}`}>
                                        {formatTime(navigationPerformance.questionSwitch)}
                                    </p>
                                    <p className="text-sm text-gray-600">Question Switch Time</p>
                                </div>
                                
                                <div className="text-center">
                                    <p className={`text-2xl font-bold ${getPerformanceColor(navigationPerformance.sectionSwitch)}`}>
                                        {formatTime(navigationPerformance.sectionSwitch)}
                                    </p>
                                    <p className="text-sm text-gray-600">Section Switch Time</p>
                                </div>
                                
                                <div className="text-center">
                                    <p className={`text-2xl font-bold ${getPerformanceColor(navigationPerformance.navigationResponse)}`}>
                                        {formatTime(navigationPerformance.navigationResponse)}
                                    </p>
                                    <p className="text-sm text-gray-600">Navigation Response</p>
                                </div>
                            </div>
                            
                            {navigationPerformance.optimizations && (
                                <div>
                                    <h4 className="font-medium text-gray-900 mb-2">Navigation Optimizations</h4>
                                    <div className="space-y-3">
                                        {navigationPerformance.optimizations.map((optimization, index) => (
                                            <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                                                <div className="flex items-center space-x-3">
                                                    <Target className="w-4 h-4 text-blue-500" />
                                                    <div>
                                                        <h5 className="font-medium text-gray-900">{optimization.name}</h5>
                                                        <p className="text-sm text-gray-600">{optimization.description}</p>
                                                    </div>
                                                </div>
                                                
                                                <Badge className={getStatusBadge(optimization.status)}>
                                                    {optimization.status}
                                                </Badge>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Auto-Save Performance */}
            {showAutoSavePerformance && autoSavePerformance && (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center space-x-2">
                            <Zap className="w-5 h-5" />
                            <span>Auto-Save Performance</span>
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="text-center">
                                    <p className={`text-2xl font-bold ${getPerformanceColor(autoSavePerformance.saveTime)}`}>
                                        {formatTime(autoSavePerformance.saveTime)}
                                    </p>
                                    <p className="text-sm text-gray-600">Save Time</p>
                                </div>
                                
                                <div className="text-center">
                                    <p className={`text-2xl font-bold ${getPerformanceColor(autoSavePerformance.syncTime)}`}>
                                        {formatTime(autoSavePerformance.syncTime)}
                                    </p>
                                    <p className="text-sm text-gray-600">Sync Time</p>
                                </div>
                                
                                <div className="text-center">
                                    <p className={`text-2xl font-bold ${getPerformanceColor(autoSavePerformance.reliability)}`}>
                                        {autoSavePerformance.reliability}%
                                    </p>
                                    <p className="text-sm text-gray-600">Reliability</p>
                                </div>
                            </div>
                            
                            {autoSavePerformance.features && (
                                <div>
                                    <h4 className="font-medium text-gray-900 mb-2">Auto-Save Features</h4>
                                    <div className="space-y-3">
                                        {autoSavePerformance.features.map((feature, index) => (
                                            <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                                                <div className="flex items-center space-x-3">
                                                    <Zap className="w-4 h-4 text-purple-500" />
                                                    <div>
                                                        <h5 className="font-medium text-gray-900">{feature.name}</h5>
                                                        <p className="text-sm text-gray-600">{feature.description}</p>
                                                    </div>
                                                </div>
                                                
                                                <Badge className={getStatusBadge(feature.status)}>
                                                    {feature.status}
                                                </Badge>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Optimized Rendering Performance */}
            {showOptimizedRendering && renderingPerformance && (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center space-x-2">
                            <BarChart3 className="w-5 h-5" />
                            <span>Optimized Rendering Performance</span>
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="text-center">
                                    <p className={`text-2xl font-bold ${getPerformanceColor(renderingPerformance.renderTime)}`}>
                                        {formatTime(renderingPerformance.renderTime)}
                                    </p>
                                    <p className="text-sm text-gray-600">Render Time</p>
                                </div>
                                
                                <div className="text-center">
                                    <p className={`text-2xl font-bold ${getPerformanceColor(renderingPerformance.memoryUsage)}`}>
                                        {renderingPerformance.memoryUsage}MB
                                    </p>
                                    <p className="text-sm text-gray-600">Memory Usage</p>
                                </div>
                                
                                <div className="text-center">
                                    <p className={`text-2xl font-bold ${getPerformanceColor(renderingPerformance.efficiency)}`}>
                                        {renderingPerformance.efficiency}%
                                    </p>
                                    <p className="text-sm text-gray-600">Efficiency</p>
                                </div>
                            </div>
                            
                            {renderingPerformance.optimizations && (
                                <div>
                                    <h4 className="font-medium text-gray-900 mb-2">Rendering Optimizations</h4>
                                    <div className="space-y-3">
                                        {renderingPerformance.optimizations.map((optimization, index) => (
                                            <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                                                <div className="flex items-center space-x-3">
                                                    <BarChart3 className="w-4 h-4 text-orange-500" />
                                                    <div>
                                                        <h5 className="font-medium text-gray-900">{optimization.name}</h5>
                                                        <p className="text-sm text-gray-600">{optimization.description}</p>
                                                    </div>
                                                </div>
                                                
                                                <Badge className={getStatusBadge(optimization.status)}>
                                                    {optimization.status}
                                                </Badge>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Scalable Analytics Performance */}
            {showScalableAnalytics && analyticsPerformance && (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center space-x-2">
                            <TrendingUp className="w-5 h-5" />
                            <span>Scalable Analytics Performance</span>
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="text-center">
                                    <p className={`text-2xl font-bold ${getPerformanceColor(analyticsPerformance.queryTime)}`}>
                                        {formatTime(analyticsPerformance.queryTime)}
                                    </p>
                                    <p className="text-sm text-gray-600">Query Time</p>
                                </div>
                                
                                <div className="text-center">
                                    <p className={`text-2xl font-bold ${getPerformanceColor(analyticsPerformance.dataProcessing)}`}>
                                        {formatTime(analyticsPerformance.dataProcessing)}
                                    </p>
                                    <p className="text-sm text-gray-600">Data Processing</p>
                                </div>
                                
                                <div className="text-center">
                                    <p className={`text-2xl font-bold ${getPerformanceColor(analyticsPerformance.scalability)}`}>
                                        {analyticsPerformance.scalability}%
                                    </p>
                                    <p className="text-sm text-gray-600">Scalability</p>
                                </div>
                            </div>
                            
                            {analyticsPerformance.optimizations && (
                                <div>
                                    <h4 className="font-medium text-gray-900 mb-2">Analytics Optimizations</h4>
                                    <div className="space-y-3">
                                        {analyticsPerformance.optimizations.map((optimization, index) => (
                                            <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                                                <div className="flex items-center space-x-3">
                                                    <TrendingUp className="w-4 h-4 text-red-500" />
                                                    <div>
                                                        <h5 className="font-medium text-gray-900">{optimization.name}</h5>
                                                        <p className="text-sm text-gray-600">{optimization.description}</p>
                                                    </div>
                                                </div>
                                                
                                                <Badge className={getStatusBadge(optimization.status)}>
                                                    {optimization.status}
                                                </Badge>
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
                    onClick={() => downloadPerformanceReport('pdf')}
                    variant="outline"
                >
                    <Download className="w-4 h-4 mr-2" />
                    Download Performance Report
                </Button>
                
                <Button 
                    onClick={() => downloadPerformanceReport('excel')}
                    variant="outline"
                >
                    <Download className="w-4 h-4 mr-2" />
                    Download Excel Report
                </Button>
                
                <Button 
                    onClick={loadPerformanceRequirements}
                    variant="outline"
                >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Refresh
                </Button>
            </div>
        </div>
    );
};

export default PerformanceRequirements;
