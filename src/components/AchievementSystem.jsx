import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { Alert, AlertDescription } from './ui/alert';
import { 
    Trophy, 
    Award,
    Star,
    Medal,
    Crown,
    Shield,
    Zap,
    Download,
    RefreshCw,
    Filter,
    Calendar,
    Activity,
    CheckCircle,
    XCircle,
    AlertTriangle,
    Lightbulb,
    Target,
    BookOpen,
    Brain,
    Clock,
    Users,
    GraduationCap,
    Certificate,
    Badge as BadgeIcon
} from 'lucide-react';
import { toast } from 'react-hot-toast';

const AchievementSystem = ({ 
    studentId,
    onAchievementSystemViewed,
    showBadges = true,
    showCertificates = true,
    showMilestones = true,
    showStreaks = true
}) => {
    const [achievementSystem, setAchievementSystem] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [timeRange, setTimeRange] = useState('30d');
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [badges, setBadges] = useState([]);
    const [certificates, setCertificates] = useState([]);
    const [milestones, setMilestones] = useState([]);
    const [streaks, setStreaks] = useState([]);

    useEffect(() => {
        loadAchievementSystem();
    }, [studentId, timeRange, selectedCategory]);

    const loadAchievementSystem = async () => {
        try {
            setIsLoading(true);
            
            const response = await fetch('/api/student/achievement-system', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    studentId,
                    timeRange,
                    selectedCategory,
                    showBadges,
                    showCertificates,
                    showMilestones,
                    showStreaks
                })
            });

            if (!response.ok) throw new Error('Failed to load achievement system');
            
            const data = await response.json();
            setAchievementSystem(data.achievementSystem);
            setBadges(data.badges || []);
            setCertificates(data.certificates || []);
            setMilestones(data.milestones || []);
            setStreaks(data.streaks || []);
            
            if (onAchievementSystemViewed) {
                onAchievementSystemViewed(data);
            }
            
        } catch (error) {
            console.error('Error loading achievement system:', error);
            toast.error('Failed to load achievement system');
        } finally {
            setIsLoading(false);
        }
    };

    const getAchievementIcon = (type) => {
        switch (type) {
            case 'badge':
                return <BadgeIcon className="w-6 h-6" />;
            case 'certificate':
                return <Certificate className="w-6 h-6" />;
            case 'milestone':
                return <Target className="w-6 h-6" />;
            case 'streak':
                return <Zap className="w-6 h-6" />;
            default:
                return <Award className="w-6 h-6" />;
        }
    };

    const getAchievementColor = (type) => {
        switch (type) {
            case 'badge':
                return 'text-blue-600';
            case 'certificate':
                return 'text-green-600';
            case 'milestone':
                return 'text-purple-600';
            case 'streak':
                return 'text-orange-600';
            default:
                return 'text-gray-600';
        }
    };

    const getAchievementBadge = (type) => {
        switch (type) {
            case 'badge':
                return 'bg-blue-100 text-blue-800';
            case 'certificate':
                return 'bg-green-100 text-green-800';
            case 'milestone':
                return 'bg-purple-100 text-purple-800';
            case 'streak':
                return 'bg-orange-100 text-orange-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };

    const getRarityColor = (rarity) => {
        switch (rarity) {
            case 'common':
                return 'text-gray-600';
            case 'uncommon':
                return 'text-green-600';
            case 'rare':
                return 'text-blue-600';
            case 'epic':
                return 'text-purple-600';
            case 'legendary':
                return 'text-orange-600';
            default:
                return 'text-gray-600';
        }
    };

    const getRarityBadge = (rarity) => {
        switch (rarity) {
            case 'common':
                return 'bg-gray-100 text-gray-800';
            case 'uncommon':
                return 'bg-green-100 text-green-800';
            case 'rare':
                return 'bg-blue-100 text-blue-800';
            case 'epic':
                return 'bg-purple-100 text-purple-800';
            case 'legendary':
                return 'bg-orange-100 text-orange-800';
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

    const downloadAchievementSystem = async (format = 'pdf') => {
        try {
            const response = await fetch('/api/student/download-achievement-system', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    studentId,
                    format,
                    timeRange,
                    selectedCategory
                })
            });

            if (!response.ok) throw new Error('Download failed');
            
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `achievement_system_${format}_${Date.now()}.${format}`;
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

    if (!achievementSystem) {
        return (
            <div className="text-center py-8">
                <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                <p className="text-gray-500">No achievement system data available</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="text-center">
                <h2 className="text-3xl font-bold text-gray-900">Achievement System</h2>
                <p className="text-gray-600 mt-2">Track your badges, certificates, milestones, and streaks</p>
            </div>

            {/* Time Range and Category Selectors */}
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
                            <span className="text-sm font-medium text-gray-700">Category:</span>
                            <select
                                value={selectedCategory}
                                onChange={(e) => setSelectedCategory(e.target.value)}
                                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            >
                                <option value="all">All Achievements</option>
                                <option value="badge">Badges</option>
                                <option value="certificate">Certificates</option>
                                <option value="milestone">Milestones</option>
                                <option value="streak">Streaks</option>
                            </select>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Achievement System Overview */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center">
                            <div className="p-2 bg-blue-100 rounded-lg">
                                <BadgeIcon className="w-6 h-6 text-blue-600" />
                            </div>
                            <div className="ml-4">
                                <p className="text-sm font-medium text-gray-600">Total Badges</p>
                                <p className="text-2xl font-bold text-gray-900">
                                    {achievementSystem.totalBadges}
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center">
                            <div className="p-2 bg-green-100 rounded-lg">
                                <Certificate className="w-6 h-6 text-green-600" />
                            </div>
                            <div className="ml-4">
                                <p className="text-sm font-medium text-gray-600">Certificates</p>
                                <p className="text-2xl font-bold text-gray-900">
                                    {achievementSystem.totalCertificates}
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
                                <p className="text-sm font-medium text-gray-600">Milestones</p>
                                <p className="text-2xl font-bold text-gray-900">
                                    {achievementSystem.totalMilestones}
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center">
                            <div className="p-2 bg-orange-100 rounded-lg">
                                <Zap className="w-6 h-6 text-orange-600" />
                            </div>
                            <div className="ml-4">
                                <p className="text-sm font-medium text-gray-600">Current Streak</p>
                                <p className="text-2xl font-bold text-gray-900">
                                    {achievementSystem.currentStreak} days
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Badges */}
            {showBadges && badges.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center space-x-2">
                            <BadgeIcon className="w-5 h-5" />
                            <span>Badges</span>
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {badges.map((badge, index) => (
                                <div key={index} className="text-center p-4 border rounded-lg">
                                    <div className={`w-16 h-16 mx-auto mb-3 rounded-full flex items-center justify-center ${
                                        badge.earned ? 'bg-blue-100' : 'bg-gray-100'
                                    }`}>
                                        {badge.earned ? (
                                            <BadgeIcon className={`w-8 h-8 ${getAchievementColor('badge')}`} />
                                        ) : (
                                            <BadgeIcon className="w-8 h-8 text-gray-400" />
                                        )}
                                    </div>
                                    <h4 className="font-medium text-gray-900">{badge.name}</h4>
                                    <p className="text-sm text-gray-600">{badge.description}</p>
                                    <div className="mt-2 space-y-1">
                                        <Badge className={getRarityBadge(badge.rarity)}>
                                            {badge.rarity}
                                        </Badge>
                                        {badge.earned && (
                                            <div className="text-xs text-gray-500">
                                                Earned on {formatDate(badge.earnedAt)}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Certificates */}
            {showCertificates && certificates.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center space-x-2">
                            <Certificate className="w-5 h-5" />
                            <span>Certificates</span>
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {certificates.map((certificate, index) => (
                                <div key={index} className="p-4 border rounded-lg">
                                    <div className="flex items-center justify-between mb-3">
                                        <div>
                                            <h4 className="font-medium text-gray-900">{certificate.name}</h4>
                                            <p className="text-sm text-gray-600">{certificate.description}</p>
                                        </div>
                                        
                                        <div className="text-right">
                                            <Badge className="bg-green-100 text-green-800">
                                                {certificate.status}
                                            </Badge>
                                            <div className="text-xs text-gray-500 mt-1">
                                                {certificate.earnedAt ? `Earned on ${formatDate(certificate.earnedAt)}` : 'Not earned yet'}
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <div className="space-y-2">
                                        <div className="flex justify-between text-sm">
                                            <span className="text-gray-600">Issuer:</span>
                                            <span className="font-medium">{certificate.issuer}</span>
                                        </div>
                                        
                                        <div className="flex justify-between text-sm">
                                            <span className="text-gray-600">Valid Until:</span>
                                            <span className="font-medium">{formatDate(certificate.validUntil)}</span>
                                        </div>
                                        
                                        <div className="flex justify-between text-sm">
                                            <span className="text-gray-600">Credential ID:</span>
                                            <span className="font-medium font-mono text-xs">{certificate.credentialId}</span>
                                        </div>
                                    </div>
                                    
                                    {certificate.earned && (
                                        <div className="mt-3">
                                            <Button variant="outline" size="sm" className="w-full">
                                                <Download className="w-4 h-4 mr-2" />
                                                Download Certificate
                                            </Button>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Milestones */}
            {showMilestones && milestones.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center space-x-2">
                            <Target className="w-5 h-5" />
                            <span>Milestones</span>
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {milestones.map((milestone, index) => (
                                <div key={index} className="flex items-center space-x-4 p-4 border rounded-lg">
                                    <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                                        milestone.achieved ? 'bg-purple-100' : 'bg-gray-100'
                                    }`}>
                                        {milestone.achieved ? (
                                            <CheckCircle className="w-6 h-6 text-purple-600" />
                                        ) : (
                                            <Target className="w-6 h-6 text-gray-600" />
                                        )}
                                    </div>
                                    
                                    <div className="flex-1">
                                        <h4 className="font-medium text-gray-900">{milestone.name}</h4>
                                        <p className="text-sm text-gray-600">{milestone.description}</p>
                                        <div className="flex items-center space-x-2 mt-2">
                                            <Badge className={
                                                milestone.achieved ? 'bg-purple-100 text-purple-800' : 'bg-gray-100 text-gray-800'
                                            }>
                                                {milestone.achieved ? 'Achieved' : 'In Progress'}
                                            </Badge>
                                            <span className="text-xs text-gray-500">
                                                {milestone.achieved ? `Achieved on ${formatDate(milestone.achievedAt)}` : `Target: ${formatDate(milestone.targetDate)}`}
                                            </span>
                                        </div>
                                    </div>
                                    
                                    <div className="text-right">
                                        <p className="text-sm font-medium text-gray-900">{milestone.progress}%</p>
                                        <p className="text-xs text-gray-500">Progress</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Streaks */}
            {showStreaks && streaks.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center space-x-2">
                            <Zap className="w-5 h-5" />
                            <span>Streaks</span>
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {streaks.map((streak, index) => (
                                <div key={index} className="p-4 border rounded-lg">
                                    <div className="flex items-center justify-between mb-3">
                                        <div>
                                            <h4 className="font-medium text-gray-900">{streak.name}</h4>
                                            <p className="text-sm text-gray-600">{streak.description}</p>
                                        </div>
                                        
                                        <div className="text-right">
                                            <p className="text-2xl font-bold text-orange-600">{streak.currentStreak}</p>
                                            <p className="text-xs text-gray-500">Current Streak</p>
                                        </div>
                                    </div>
                                    
                                    <div className="space-y-2">
                                        <div className="flex justify-between text-sm">
                                            <span className="text-gray-600">Best Streak:</span>
                                            <span className="font-medium">{streak.bestStreak}</span>
                                        </div>
                                        
                                        <div className="flex justify-between text-sm">
                                            <span className="text-gray-600">Started:</span>
                                            <span className="font-medium">{formatDate(streak.startedAt)}</span>
                                        </div>
                                        
                                        <div className="flex justify-between text-sm">
                                            <span className="text-gray-600">Last Activity:</span>
                                            <span className="font-medium">{formatDate(streak.lastActivity)}</span>
                                        </div>
                                    </div>
                                    
                                    <div className="mt-3">
                                        <Progress value={streak.progress} className="w-full" />
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
                    onClick={() => downloadAchievementSystem('pdf')}
                    variant="outline"
                >
                    <Download className="w-4 h-4 mr-2" />
                    Download PDF
                </Button>
                
                <Button 
                    onClick={() => downloadAchievementSystem('excel')}
                    variant="outline"
                >
                    <Download className="w-4 h-4 mr-2" />
                    Download Excel
                </Button>
                
                <Button 
                    onClick={loadAchievementSystem}
                    variant="outline"
                >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Refresh
                </Button>
            </div>
        </div>
    );
};

export default AchievementSystem;
