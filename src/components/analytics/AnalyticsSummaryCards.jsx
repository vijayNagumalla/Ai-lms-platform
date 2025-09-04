import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { 
  TrendingUp, 
  TrendingDown, 
  Minus, 
  Users, 
  BookOpen, 
  Target, 
  Award, 
  Clock,
  Star,
  GraduationCap,
  Activity,
  BarChart3,
  PieChart,
  LineChart,
  Crown,
  Trophy,
  Zap,
  Eye,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Info,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';

const AnalyticsSummaryCards = ({ data, module, userRole = 'student' }) => {
  if (!data) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-8 bg-gray-200 rounded w-1/2"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const getRoleBasedMetrics = () => {
    if (userRole === 'student') {
      return module === 'assessments' 
        ? [
            {
              title: 'My Assessments',
              value: data.totalAssessments || 0,
              change: '+12%',
              trend: 'up',
              icon: <BookOpen className="h-4 w-4" />,
              color: 'text-blue-600',
              bgColor: 'bg-blue-50 dark:bg-blue-900/20',
              description: 'Total assessments taken'
            },
            {
              title: 'My Average Score',
              value: `${(data.averageScore || 0).toFixed(1)}%`,
              change: '+5.2%',
              trend: 'up',
              icon: <Target className="h-4 w-4" />,
              color: 'text-green-600',
              bgColor: 'bg-green-50 dark:bg-green-900/20',
              description: 'Overall performance'
            },
            {
              title: 'My Completion Rate',
              value: `${(data.completionRate || 0).toFixed(1)}%`,
              change: '+8.1%',
              trend: 'up',
              icon: <CheckCircle className="h-4 w-4" />,
              color: 'text-purple-600',
              bgColor: 'bg-purple-50 dark:bg-purple-900/20',
              description: 'Assessments completed'
            },
            {
              title: 'My Rank',
              value: data.rank || 'N/A',
              change: '+2',
              trend: 'up',
              icon: <Crown className="h-4 w-4" />,
              color: 'text-yellow-600',
              bgColor: 'bg-yellow-50 dark:bg-yellow-900/20',
              description: 'Class ranking'
            }
          ]
        : [
            {
              title: 'My Courses',
              value: data.totalCourses || 0,
              change: '+2',
              trend: 'up',
              icon: <GraduationCap className="h-4 w-4" />,
              color: 'text-blue-600',
              bgColor: 'bg-blue-50 dark:bg-blue-900/20',
              description: 'Enrolled courses'
            },
            {
              title: 'My Progress',
              value: `${(data.completionRate || 0).toFixed(1)}%`,
              change: '+12.5%',
              trend: 'up',
              icon: <Activity className="h-4 w-4" />,
              color: 'text-green-600',
              bgColor: 'bg-green-50 dark:bg-green-900/20',
              description: 'Overall progress'
            },
            {
              title: 'My Completion',
              value: data.completedEnrollments || 0,
              change: '+3',
              trend: 'up',
              icon: <Award className="h-4 w-4" />,
              color: 'text-purple-600',
              bgColor: 'bg-purple-50 dark:bg-purple-900/20',
              description: 'Courses completed'
            },
            {
              title: 'My Rating',
              value: `${(data.averageRating || 0).toFixed(1)}/5`,
              change: '+0.3',
              trend: 'up',
              icon: <Star className="h-4 w-4" />,
              color: 'text-yellow-600',
              bgColor: 'bg-yellow-50 dark:bg-yellow-900/20',
              description: 'Average course rating'
            }
          ];
    }

    // Admin/Faculty metrics
    return module === 'assessments'
      ? [
          {
            title: 'Total Assessments',
            value: data.totalAssessments || 0,
            change: '+15%',
            trend: 'up',
            icon: <BookOpen className="h-4 w-4" />,
            color: 'text-blue-600',
            bgColor: 'bg-blue-50 dark:bg-blue-900/20',
            description: 'Published assessments'
          },
          {
            title: 'Active Students',
            value: data.activeStudents || 0,
            change: '+8.2%',
            trend: 'up',
            icon: <Users className="h-4 w-4" />,
            color: 'text-green-600',
            bgColor: 'bg-green-50 dark:bg-green-900/20',
            description: 'Students with submissions'
          },
          {
            title: 'Average Score',
            value: `${(data.averageScore || 0).toFixed(1)}%`,
            change: '+3.1%',
            trend: 'up',
            icon: <Target className="h-4 w-4" />,
            color: 'text-purple-600',
            bgColor: 'bg-purple-50 dark:bg-purple-900/20',
            description: 'Overall performance'
          },
          {
            title: 'Completion Rate',
            value: `${(data.completionRate || 0).toFixed(1)}%`,
            change: '+5.7%',
            trend: 'up',
            icon: <CheckCircle className="h-4 w-4" />,
            color: 'text-orange-600',
            bgColor: 'bg-orange-50 dark:bg-orange-900/20',
            description: 'Assessment completion'
          }
        ]
      : [
          {
            title: 'Total Courses',
            value: data.totalCourses || 0,
            change: '+12%',
            trend: 'up',
            icon: <GraduationCap className="h-4 w-4" />,
            color: 'text-blue-600',
            bgColor: 'bg-blue-50 dark:bg-blue-900/20',
            description: 'Published courses'
          },
          {
            title: 'Total Enrollments',
            value: data.totalEnrollments || 0,
            change: '+18.5%',
            trend: 'up',
            icon: <Users className="h-4 w-4" />,
            color: 'text-green-600',
            bgColor: 'bg-green-50 dark:bg-green-900/20',
            description: 'Student enrollments'
          },
          {
            title: 'Completion Rate',
            value: `${(data.completionRate || 0).toFixed(1)}%`,
            change: '+7.3%',
            trend: 'up',
            icon: <Award className="h-4 w-4" />,
            color: 'text-purple-600',
            bgColor: 'bg-purple-50 dark:bg-purple-900/20',
            description: 'Course completion'
          },
          {
            title: 'Average Rating',
            value: `${(data.averageRating || 0).toFixed(1)}/5`,
            change: '+0.4',
            trend: 'up',
            icon: <Star className="h-4 w-4" />,
            color: 'text-yellow-600',
            bgColor: 'bg-yellow-50 dark:bg-yellow-900/20',
            description: 'Student satisfaction'
          }
        ];
  };

  const getTrendIcon = (trend) => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="h-4 w-4 text-green-600" />;
      case 'down':
        return <TrendingDown className="h-4 w-4 text-red-600" />;
      default:
        return <Minus className="h-4 w-4 text-gray-600" />;
    }
  };

  const getTrendColor = (trend) => {
    switch (trend) {
      case 'up':
        return 'text-green-600';
      case 'down':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  const getProgressValue = (metric) => {
    if (metric.title.includes('Score') || metric.title.includes('Rate') || metric.title.includes('Progress')) {
      return parseFloat(metric.value.replace('%', '')) || 0;
    }
    return 0;
  };

  const metrics = getRoleBasedMetrics();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            {userRole === 'student' ? 'My Performance' : 'System Overview'}
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            {userRole === 'student' 
              ? 'Your learning analytics and progress insights'
              : `${module === 'assessments' ? 'Assessment' : 'Course'} performance metrics`
            }
          </p>
        </div>
        
        <div className="flex items-center space-x-2">
          <Badge variant="outline" className="capitalize">
            {userRole.replace('-', ' ')}
          </Badge>
          <Badge variant="secondary">
            {module === 'assessments' ? 'Assessment' : 'Course'} Analytics
          </Badge>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {metrics.map((metric, index) => (
          <Card key={index} className="group hover:shadow-lg transition-all duration-200 cursor-pointer">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className={`p-2 rounded-lg ${metric.bgColor}`}>
                  <div className={metric.color}>{metric.icon}</div>
                </div>
                <div className="flex items-center space-x-1">
                  {getTrendIcon(metric.trend)}
                  <span className={`text-sm font-medium ${getTrendColor(metric.trend)}`}>
                    {metric.change}
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    {metric.title}
                  </h3>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <ArrowUpRight className="h-4 w-4" />
                  </Button>
                </div>
                
                <div className="flex items-baseline space-x-2">
                  <span className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                    {metric.value}
                  </span>
                </div>
                
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {metric.description}
                </p>

                {/* Progress Bar for relevant metrics */}
                {getProgressValue(metric) > 0 && (
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-gray-500">Progress</span>
                      <span className="text-gray-700 dark:text-gray-300">
                        {getProgressValue(metric)}%
                      </span>
                    </div>
                    <Progress 
                      value={getProgressValue(metric)} 
                      className="h-2"
                    />
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick Insights */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Zap className="h-5 w-5 text-blue-600" />
              <h4 className="font-medium text-blue-900 dark:text-blue-100">Quick Insight</h4>
            </div>
            <p className="text-sm text-blue-700 dark:text-blue-300 mt-2">
              {userRole === 'student' 
                ? 'Your performance is trending upward! Keep up the great work.'
                : 'System performance is improving across all metrics.'
              }
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Eye className="h-5 w-5 text-green-600" />
              <h4 className="font-medium text-green-900 dark:text-green-100">Focus Area</h4>
            </div>
            <p className="text-sm text-green-700 dark:text-green-300 mt-2">
              {userRole === 'student'
                ? 'Consider reviewing areas with lower scores for improvement.'
                : 'Monitor completion rates for better student engagement.'
              }
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Trophy className="h-5 w-5 text-purple-600" />
              <h4 className="font-medium text-purple-900 dark:text-purple-100">Achievement</h4>
            </div>
            <p className="text-sm text-purple-700 dark:text-purple-300 mt-2">
              {userRole === 'student'
                ? 'You\'ve completed 85% of your assigned assessments!'
                : 'System is performing above industry standards.'
              }
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AnalyticsSummaryCards; 