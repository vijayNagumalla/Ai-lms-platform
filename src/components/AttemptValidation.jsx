import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Alert, AlertDescription } from './ui/alert';
import { 
    Clock, 
    CheckCircle, 
    XCircle, 
    AlertTriangle, 
    History, 
    TrendingUp, 
    TrendingDown,
    Target,
    Award,
    Calendar,
    User,
    BarChart3,
    RefreshCw
} from 'lucide-react';
import { toast } from 'react-hot-toast';

const AttemptValidation = ({ 
    assessmentId, 
    studentId,
    onValidationComplete, 
    onValidationFailed,
    maxAttempts = 3,
    allowRetake = true
}) => {
    const [attemptData, setAttemptData] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [validationResults, setValidationResults] = useState({});
    const [canStartAttempt, setCanStartAttempt] = useState(false);
    const [remainingAttempts, setRemainingAttempts] = useState(0);
    const [previousAttempts, setPreviousAttempts] = useState([]);
    const [attemptHistory, setAttemptHistory] = useState([]);
    const [performanceStats, setPerformanceStats] = useState({});

    useEffect(() => {
        loadAttemptData();
    }, [assessmentId, studentId]);

    const loadAttemptData = async () => {
        try {
            setIsLoading(true);
            
            const response = await fetch('/api/assessment/attempt-validation', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ assessmentId, studentId })
            });

            if (!response.ok) throw new Error('Failed to load attempt data');
            
            const data = await response.json();
            setAttemptData(data);
            setRemainingAttempts(data.remainingAttempts);
            setPreviousAttempts(data.previousAttempts || []);
            setAttemptHistory(data.attemptHistory || []);
            setPerformanceStats(data.performanceStats || {});
            
            // Validate if student can start attempt
            const canStart = validateAttemptEligibility(data);
            setCanStartAttempt(canStart);
            
            if (canStart) {
                setValidationResults({
                    eligible: true,
                    message: 'You are eligible to start this assessment'
                });
            } else {
                setValidationResults({
                    eligible: false,
                    message: 'You are not eligible to start this assessment',
                    reasons: data.restrictions || []
                });
            }
            
        } catch (error) {
            console.error('Error loading attempt data:', error);
            toast.error('Failed to load attempt data');
            setValidationResults({
                eligible: false,
                message: 'Failed to load attempt data',
                error: error.message
            });
        } finally {
            setIsLoading(false);
        }
    };

    const validateAttemptEligibility = (data) => {
        // Check if student has remaining attempts
        if (data.remainingAttempts <= 0) {
            return false;
        }
        
        // Check if assessment is still available
        if (data.assessmentStatus !== 'active') {
            return false;
        }
        
        // Check if student is within time window
        if (data.timeWindow && !data.timeWindow.isWithinWindow) {
            return false;
        }
        
        // Check if student has completed prerequisite assessments
        if (data.prerequisites && !data.prerequisites.completed) {
            return false;
        }
        
        return true;
    };

    const startNewAttempt = async () => {
        try {
            const response = await fetch('/api/assessment/start-attempt', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    assessmentId, 
                    studentId,
                    attemptNumber: previousAttempts.length + 1
                })
            });

            if (!response.ok) throw new Error('Failed to start attempt');
            
            const result = await response.json();
            
            if (onValidationComplete) {
                onValidationComplete(result);
            }
            
            toast.success('Assessment attempt started');
        } catch (error) {
            console.error('Error starting attempt:', error);
            toast.error('Failed to start attempt');
            if (onValidationFailed) {
                onValidationFailed(error.message);
            }
        }
    };

    const retakeAssessment = async () => {
        try {
            const response = await fetch('/api/assessment/retake-assessment', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    assessmentId, 
                    studentId,
                    previousAttemptId: previousAttempts[0]?.id
                })
            });

            if (!response.ok) throw new Error('Failed to retake assessment');
            
            const result = await response.json();
            
            if (onValidationComplete) {
                onValidationComplete(result);
            }
            
            toast.success('Assessment retake started');
        } catch (error) {
            console.error('Error retaking assessment:', error);
            toast.error('Failed to retake assessment');
            if (onValidationFailed) {
                onValidationFailed(error.message);
            }
        }
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

    const getScoreColor = (score) => {
        if (score >= 90) return 'text-green-600';
        if (score >= 70) return 'text-blue-600';
        if (score >= 50) return 'text-yellow-600';
        return 'text-red-600';
    };

    const getScoreBadge = (score) => {
        if (score >= 90) return 'bg-green-100 text-green-800';
        if (score >= 70) return 'bg-blue-100 text-blue-800';
        if (score >= 50) return 'bg-yellow-100 text-yellow-800';
        return 'bg-red-100 text-red-800';
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="text-center">
                <h2 className="text-3xl font-bold text-gray-900">Attempt Validation</h2>
                <p className="text-gray-600 mt-2">Review your attempt history and eligibility</p>
            </div>

            {/* Validation Status */}
            <Card className={validationResults.eligible ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}>
                <CardContent className="p-6">
                    <div className="flex items-center justify-center space-x-3">
                        {validationResults.eligible ? 
                            <CheckCircle className="w-8 h-8 text-green-500" /> : 
                            <XCircle className="w-8 h-8 text-red-500" />
                        }
                        <div className="text-center">
                            <h3 className={`text-xl font-bold ${validationResults.eligible ? 'text-green-800' : 'text-red-800'}`}>
                                {validationResults.eligible ? 'Eligible to Start' : 'Not Eligible'}
                            </h3>
                            <p className={`text-sm ${validationResults.eligible ? 'text-green-600' : 'text-red-600'}`}>
                                {validationResults.message}
                            </p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Attempt Summary */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center">
                            <div className="p-2 bg-blue-100 rounded-lg">
                                <Target className="w-6 h-6 text-blue-600" />
                            </div>
                            <div className="ml-4">
                                <p className="text-sm font-medium text-gray-600">Remaining Attempts</p>
                                <p className="text-2xl font-bold text-gray-900">{remainingAttempts}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center">
                            <div className="p-2 bg-green-100 rounded-lg">
                                <History className="w-6 h-6 text-green-600" />
                            </div>
                            <div className="ml-4">
                                <p className="text-sm font-medium text-gray-600">Previous Attempts</p>
                                <p className="text-2xl font-bold text-gray-900">{previousAttempts.length}</p>
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
                                <p className="text-sm font-medium text-gray-600">Best Score</p>
                                <p className="text-2xl font-bold text-gray-900">
                                    {performanceStats.bestScore || 0}%
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Previous Attempts */}
            {previousAttempts.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center space-x-2">
                            <History className="w-5 h-5" />
                            <span>Previous Attempts</span>
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {previousAttempts.map((attempt, index) => (
                                <div key={attempt.id} className="flex items-center justify-between p-4 border rounded-lg">
                                    <div className="flex items-center space-x-4">
                                        <div className="text-center">
                                            <p className="text-sm text-gray-600">Attempt</p>
                                            <p className="font-bold text-gray-900">{attempt.attemptNumber}</p>
                                        </div>
                                        
                                        <div className="text-center">
                                            <p className="text-sm text-gray-600">Score</p>
                                            <p className={`font-bold ${getScoreColor(attempt.score)}`}>
                                                {attempt.score}%
                                            </p>
                                        </div>
                                        
                                        <div className="text-center">
                                            <p className="text-sm text-gray-600">Duration</p>
                                            <p className="font-bold text-gray-900">
                                                {formatDuration(attempt.duration)}
                                            </p>
                                        </div>
                                        
                                        <div className="text-center">
                                            <p className="text-sm text-gray-600">Date</p>
                                            <p className="font-bold text-gray-900">
                                                {formatDate(attempt.submittedAt)}
                                            </p>
                                        </div>
                                    </div>
                                    
                                    <div className="flex items-center space-x-2">
                                        <Badge className={getScoreBadge(attempt.score)}>
                                            {attempt.grade}
                                        </Badge>
                                        
                                        <Badge variant="outline">
                                            {attempt.status}
                                        </Badge>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Performance Statistics */}
            {performanceStats && Object.keys(performanceStats).length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center space-x-2">
                            <BarChart3 className="w-5 h-5" />
                            <span>Performance Statistics</span>
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            <div className="text-center">
                                <p className="text-2xl font-bold text-blue-600">
                                    {performanceStats.averageScore || 0}%
                                </p>
                                <p className="text-sm text-gray-600">Average Score</p>
                            </div>
                            
                            <div className="text-center">
                                <p className="text-2xl font-bold text-green-600">
                                    {performanceStats.bestScore || 0}%
                                </p>
                                <p className="text-sm text-gray-600">Best Score</p>
                            </div>
                            
                            <div className="text-center">
                                <p className="text-2xl font-bold text-purple-600">
                                    {performanceStats.averageTime || 0}m
                                </p>
                                <p className="text-sm text-gray-600">Average Time</p>
                            </div>
                            
                            <div className="text-center">
                                <p className="text-2xl font-bold text-orange-600">
                                    {performanceStats.improvement || 0}%
                                </p>
                                <p className="text-sm text-gray-600">Improvement</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Attempt History Timeline */}
            {attemptHistory.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center space-x-2">
                            <Calendar className="w-5 h-5" />
                            <span>Attempt History Timeline</span>
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {attemptHistory.map((event, index) => (
                                <div key={index} className="flex items-center space-x-4 p-3 border rounded-lg">
                                    <div className="flex-shrink-0">
                                        <div className={`w-3 h-3 rounded-full ${
                                            event.type === 'start' ? 'bg-green-500' :
                                            event.type === 'submit' ? 'bg-blue-500' :
                                            event.type === 'abandon' ? 'bg-red-500' :
                                            'bg-gray-500'
                                        }`}></div>
                                    </div>
                                    
                                    <div className="flex-1">
                                        <p className="font-medium text-gray-900">{event.description}</p>
                                        <p className="text-sm text-gray-600">{formatDate(event.timestamp)}</p>
                                    </div>
                                    
                                    <Badge variant="outline">
                                        {event.type}
                                    </Badge>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Restrictions */}
            {validationResults.reasons && validationResults.reasons.length > 0 && (
                <Alert className="border-red-200 bg-red-50">
                    <AlertTriangle className="w-4 h-4 text-red-600" />
                    <AlertDescription>
                        <div className="space-y-2">
                            <p className="font-medium">Restrictions:</p>
                            <ul className="list-disc list-inside space-y-1">
                                {validationResults.reasons.map((reason, index) => (
                                    <li key={index} className="text-sm">{reason}</li>
                                ))}
                            </ul>
                        </div>
                    </AlertDescription>
                </Alert>
            )}

            {/* Actions */}
            <div className="flex justify-center space-x-4">
                {canStartAttempt && (
                    <Button 
                        onClick={startNewAttempt}
                        className="bg-green-600 hover:bg-green-700"
                    >
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Start New Attempt
                    </Button>
                )}
                
                {allowRetake && previousAttempts.length > 0 && (
                    <Button 
                        onClick={retakeAssessment}
                        variant="outline"
                    >
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Retake Assessment
                    </Button>
                )}
                
                <Button 
                    onClick={loadAttemptData}
                    variant="outline"
                >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Refresh Data
                </Button>
            </div>

            {/* Assessment Information */}
            {attemptData && (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center space-x-2">
                            <User className="w-5 h-5" />
                            <span>Assessment Information</span>
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                            <div>
                                <p className="text-gray-600">Assessment ID:</p>
                                <p className="font-mono text-xs">{assessmentId}</p>
                            </div>
                            
                            <div>
                                <p className="text-gray-600">Student ID:</p>
                                <p className="font-mono text-xs">{studentId}</p>
                            </div>
                            
                            <div>
                                <p className="text-gray-600">Max Attempts:</p>
                                <p className="font-mono text-xs">{maxAttempts}</p>
                            </div>
                            
                            <div>
                                <p className="text-gray-600">Allow Retake:</p>
                                <p className="font-mono text-xs">{allowRetake ? 'Yes' : 'No'}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
};

export default AttemptValidation;
