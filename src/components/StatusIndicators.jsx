import React from 'react';
import { Badge } from './ui/badge';
import { Clock, CheckCircle, XCircle, AlertTriangle, Calendar, Play, Pause } from 'lucide-react';

const StatusIndicators = ({ status, assessment, submission = null }) => {
    const getStatusConfig = (status) => {
        const configs = {
            'upcoming': {
                icon: <Calendar className="w-4 h-4" />,
                color: 'bg-blue-100 text-blue-800 border-blue-200',
                label: 'Upcoming',
                description: 'Assessment not yet available'
            },
            'active': {
                icon: <Play className="w-4 h-4" />,
                color: 'bg-green-100 text-green-800 border-green-200',
                label: 'Active',
                description: 'Assessment is currently available'
            },
            'ended': {
                icon: <XCircle className="w-4 h-4" />,
                color: 'bg-gray-100 text-gray-800 border-gray-200',
                label: 'Ended',
                description: 'Assessment deadline has passed'
            },
            'completed': {
                icon: <CheckCircle className="w-4 h-4" />,
                label: 'Completed',
                description: 'Assessment completed successfully'
            },
            'overdue': {
                icon: <AlertTriangle className="w-4 h-4" />,
                color: 'bg-red-100 text-red-800 border-red-200',
                label: 'Overdue',
                description: 'Assessment deadline has passed'
            },
            'attempted': {
                icon: <Clock className="w-4 h-4" />,
                color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
                label: 'Attempted',
                description: 'Assessment has been attempted'
            },
            'in_progress': {
                icon: <Pause className="w-4 h-4" />,
                color: 'bg-orange-100 text-orange-800 border-orange-200',
                label: 'In Progress',
                description: 'Assessment is currently being taken'
            },
            'abandoned': {
                icon: <XCircle className="w-4 h-4" />,
                color: 'bg-red-100 text-red-800 border-red-200',
                label: 'Abandoned',
                description: 'Assessment was started but not completed'
            },
            'submitted': {
                icon: <CheckCircle className="w-4 h-4" />,
                color: 'bg-green-100 text-green-800 border-green-200',
                label: 'Submitted',
                description: 'Assessment has been submitted'
            },
            'graded': {
                icon: <CheckCircle className="w-4 h-4" />,
                color: 'bg-purple-100 text-purple-800 border-purple-200',
                label: 'Graded',
                description: 'Assessment has been graded'
            }
        };

        return configs[status] || {
            icon: <Clock className="w-4 h-4" />,
            color: 'bg-gray-100 text-gray-800 border-gray-200',
            label: 'Unknown',
            description: 'Status unknown'
        };
    };

    const getDetailedStatus = () => {
        if (!assessment) return getStatusConfig(status);

        const now = new Date();
        const startDate = new Date(assessment.scheduling?.start_date);
        const endDate = new Date(assessment.scheduling?.end_date);
        const duration = assessment.duration || 0;

        // Check if assessment is upcoming
        if (startDate && startDate > now) {
            return {
                ...getStatusConfig('upcoming'),
                timeRemaining: Math.ceil((startDate - now) / (1000 * 60 * 60 * 24)),
                availableAt: startDate
            };
        }

        // Check if assessment has ended
        if (endDate && endDate < now) {
            return {
                ...getStatusConfig('ended'),
                endedAt: endDate,
                timeSinceEnd: Math.ceil((now - endDate) / (1000 * 60 * 60 * 24))
            };
        }

        // Check if assessment is currently active
        if (startDate && endDate && startDate <= now && endDate >= now) {
            return {
                ...getStatusConfig('active'),
                timeRemaining: Math.ceil((endDate - now) / (1000 * 60)),
                endsAt: endDate
            };
        }

        // Check submission status if available
        if (submission) {
            switch (submission.status) {
                case 'completed':
                    return {
                        ...getStatusConfig('completed'),
                        completedAt: submission.submitted_at,
                        score: submission.score,
                        percentage: submission.percentage
                    };
                case 'in_progress':
                    return {
                        ...getStatusConfig('in_progress'),
                        startedAt: submission.started_at,
                        timeSpent: submission.time_spent
                    };
                case 'abandoned':
                    return {
                        ...getStatusConfig('abandoned'),
                        abandonedAt: submission.submitted_at,
                        timeSpent: submission.time_spent
                    };
                case 'submitted':
                    return {
                        ...getStatusConfig('submitted'),
                        submittedAt: submission.submitted_at,
                        score: submission.score
                    };
                case 'graded':
                    return {
                        ...getStatusConfig('graded'),
                        gradedAt: submission.graded_at,
                        score: submission.score,
                        grade: submission.grade
                    };
                default:
                    return getStatusConfig(submission.status);
            }
        }

        return getStatusConfig(status);
    };

    const getPriorityLevel = () => {
        const priorityLevels = {
            'overdue': 'high',
            'in_progress': 'high',
            'active': 'medium',
            'upcoming': 'low',
            'completed': 'low',
            'graded': 'low',
            'abandoned': 'medium',
            'submitted': 'low',
            'ended': 'low'
        };

        return priorityLevels[status] || 'low';
    };

    const getTimeIndicator = () => {
        const config = getDetailedStatus();
        
        if (config.timeRemaining && config.timeRemaining > 0) {
            if (config.timeRemaining < 1) {
                return (
                    <div className="text-xs text-red-600 font-medium">
                        {config.timeRemaining < 0.1 ? 'Ending soon!' : `${Math.ceil(config.timeRemaining * 24)} hours left`}
                    </div>
                );
            } else if (config.timeRemaining < 7) {
                return (
                    <div className="text-xs text-orange-600 font-medium">
                        {config.timeRemaining} days left
                    </div>
                );
            } else {
                return (
                    <div className="text-xs text-blue-600 font-medium">
                        {config.timeRemaining} days left
                    </div>
                );
            }
        }

        if (config.timeSinceEnd && config.timeSinceEnd > 0) {
            return (
                <div className="text-xs text-gray-600">
                    Ended {config.timeSinceEnd} days ago
                </div>
            );
        }

        return null;
    };

    const getScoreIndicator = () => {
        const config = getDetailedStatus();
        
        if (config.score !== undefined && config.percentage !== undefined) {
            const scoreColor = config.percentage >= 90 ? 'text-green-600' : 
                             config.percentage >= 70 ? 'text-blue-600' : 
                             config.percentage >= 50 ? 'text-yellow-600' : 'text-red-600';
            
            return (
                <div className="text-xs font-medium">
                    <span className={scoreColor}>
                        {config.percentage}% ({config.score}/{assessment?.total_points || 'N/A'})
                    </span>
                    {config.grade && (
                        <span className="ml-1 text-gray-600">({config.grade})</span>
                    )}
                </div>
            );
        }

        return null;
    };

    const getProgressIndicator = () => {
        if (submission && submission.status === 'in_progress') {
            const progress = submission.answers_saved || 0;
            const total = assessment?.total_questions || 1;
            const percentage = Math.round((progress / total) * 100);
            
            return (
                <div className="text-xs text-gray-600">
                    {progress}/{total} questions answered ({percentage}%)
                </div>
            );
        }

        return null;
    };

    const config = getDetailedStatus();
    const priority = getPriorityLevel();

    return (
        <div className="flex flex-col space-y-2">
            {/* Main Status Badge */}
            <div className="flex items-center space-x-2">
                <Badge 
                    className={`${config.color} border flex items-center space-x-1`}
                    variant={priority === 'high' ? 'destructive' : 'secondary'}
                >
                    {config.icon}
                    <span>{config.label}</span>
                </Badge>
                
                {priority === 'high' && (
                    <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                )}
            </div>

            {/* Status Description */}
            <div className="text-sm text-gray-600">
                {config.description}
            </div>

            {/* Time Indicators */}
            {getTimeIndicator()}

            {/* Score Indicators */}
            {getScoreIndicator()}

            {/* Progress Indicators */}
            {getProgressIndicator()}

            {/* Additional Info */}
            {config.availableAt && (
                <div className="text-xs text-blue-600">
                    Available: {new Date(config.availableAt).toLocaleDateString()}
                </div>
            )}

            {config.endsAt && (
                <div className="text-xs text-orange-600">
                    Ends: {new Date(config.endsAt).toLocaleDateString()}
                </div>
            )}

            {config.completedAt && (
                <div className="text-xs text-green-600">
                    Completed: {new Date(config.completedAt).toLocaleDateString()}
                </div>
            )}

            {config.submittedAt && (
                <div className="text-xs text-purple-600">
                    Submitted: {new Date(config.submittedAt).toLocaleDateString()}
                </div>
            )}

            {config.gradedAt && (
                <div className="text-xs text-indigo-600">
                    Graded: {new Date(config.gradedAt).toLocaleDateString()}
                </div>
            )}
        </div>
    );
};

export default StatusIndicators;
