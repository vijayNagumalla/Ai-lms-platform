import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  BookOpen, 
  Target, 
  TrendingUp, 
  Users, 
  Award,
  Clock,
  BarChart3,
  PieChart,
  LineChart,
  Activity,
  Zap,
  Star,
  Crown,
  Building,
  GraduationCap,
  Info
} from 'lucide-react';

const ModuleToggle = ({ activeModule, onModuleChange, userRole = 'student' }) => {
  const modules = [
    {
      id: 'assessments',
      name: 'Assessment Reports',
      description: 'Performance analytics, score distributions, and completion trends',
      icon: <Target className="h-6 w-6" />,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50 dark:bg-blue-900/20',
      borderColor: 'border-blue-200 dark:border-blue-800',
      features: [
        'Score Distribution Analysis',
        'Department-wise Performance',
        'Time vs Score Correlation',
        'Completion Rate Trends',
        'Top Performing Students',
        'Most Challenging Questions'
      ],
      metrics: [
        { label: 'Total Assessments', icon: <BookOpen className="h-4 w-4" /> },
        { label: 'Average Score', icon: <TrendingUp className="h-4 w-4" /> },
        { label: 'Completion Rate', icon: <Clock className="h-4 w-4" /> },
        { label: 'Active Students', icon: <Users className="h-4 w-4" /> }
      ],
      available: true
    },
    {
      id: 'courses',
      name: 'Course Reports',
      description: 'Enrollment analytics, completion rates, and learning progress',
      icon: <GraduationCap className="h-6 w-6" />,
      color: 'text-green-600',
      bgColor: 'bg-green-50 dark:bg-green-900/20',
      borderColor: 'border-green-200 dark:border-green-800',
      features: [
        'Enrollment vs Completion Rates',
        'Chapter-wise Progress',
        'Instructor Performance',
        'Student Engagement Metrics',
        'Course Category Analysis',
        'Learning Path Optimization'
      ],
      metrics: [
        { label: 'Total Courses', icon: <BookOpen className="h-4 w-4" /> },
        { label: 'Enrollment Rate', icon: <TrendingUp className="h-4 w-4" /> },
        { label: 'Completion Rate', icon: <Award className="h-4 w-4" /> },
        { label: 'Average Rating', icon: <Star className="h-4 w-4" /> }
      ],
      available: userRole !== 'student' // Students see limited course analytics
    }
  ];

  const getRoleBasedFeatures = (module) => {
    if (userRole === 'student') {
      return module.id === 'assessments' 
        ? ['My Performance Trends', 'Score History', 'Time Analysis', 'Subject-wise Progress']
        : ['My Course Progress', 'Chapter Completion', 'Learning Time', 'Achievement Badges'];
    }
    return module.features;
  };

  const getRoleBasedMetrics = (module) => {
    if (userRole === 'student') {
      return module.id === 'assessments'
        ? [
            { label: 'My Assessments', icon: <BookOpen className="h-4 w-4" /> },
            { label: 'My Average Score', icon: <TrendingUp className="h-4 w-4" /> },
            { label: 'My Completion Rate', icon: <Clock className="h-4 w-4" /> },
            { label: 'My Rank', icon: <Crown className="h-4 w-4" /> }
          ]
        : [
            { label: 'My Courses', icon: <BookOpen className="h-4 w-4" /> },
            { label: 'My Progress', icon: <TrendingUp className="h-4 w-4" /> },
            { label: 'My Completion', icon: <Award className="h-4 w-4" /> },
            { label: 'My Rating', icon: <Star className="h-4 w-4" /> }
          ];
    }
    return module.metrics;
  };

  return (
    <div className="bg-white dark:bg-gray-900 border-b">
      <div className="container mx-auto px-4 py-6">
        <div className="space-y-4">
          {/* Header */}
        <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                Analytics Module
            </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Select the type of analytics you want to explore
              </p>
            </div>
            <Badge variant="outline" className="capitalize">
              {userRole.replace('-', ' ')} View
            </Badge>
          </div>
          
          {/* Module Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {modules.map((module) => (
              <Card
                key={module.id}
                className={`cursor-pointer transition-all duration-200 hover:shadow-lg ${
                  activeModule === module.id
                    ? `border-2 ${module.borderColor} shadow-lg`
                    : 'border border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                } ${!module.available ? 'opacity-50 cursor-not-allowed' : ''}`}
                onClick={() => module.available && onModuleChange(module.id)}
              >
                <CardContent className="p-6">
                  <div className="flex items-start space-x-4">
                    {/* Icon */}
                    <div className={`p-3 rounded-lg ${module.bgColor}`}>
                      <div className={module.color}>{module.icon}</div>
                    </div>

                    {/* Content */}
                    <div className="flex-1 space-y-3">
                      <div className="flex items-center justify-between">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                          {module.name}
                        </h3>
                        {activeModule === module.id && (
                          <Badge variant="default" className="bg-blue-600">
                      Active
                    </Badge>
                  )}
                        {!module.available && (
                          <Badge variant="secondary" className="bg-gray-500">
                            Coming Soon
                          </Badge>
                        )}
                      </div>

                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {module.description}
                      </p>

                      {/* Features */}
                      <div className="space-y-2">
                        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          Key Features:
                        </h4>
                        <div className="grid grid-cols-1 gap-1">
                          {getRoleBasedFeatures(module).slice(0, 3).map((feature, index) => (
                            <div key={index} className="flex items-center space-x-2 text-xs text-gray-600 dark:text-gray-400">
                              <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
                              <span>{feature}</span>
                            </div>
                          ))}
                          {getRoleBasedFeatures(module).length > 3 && (
                            <div className="text-xs text-gray-500 dark:text-gray-500">
                              +{getRoleBasedFeatures(module).length - 3} more features
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Metrics Preview */}
                      <div className="grid grid-cols-2 gap-2 pt-2">
                        {getRoleBasedMetrics(module).map((metric, index) => (
                          <div key={index} className="flex items-center space-x-2 text-xs text-gray-600 dark:text-gray-400">
                            <div className="text-gray-400">{metric.icon}</div>
                            <span>{metric.label}</span>
                          </div>
                        ))}
                      </div>

                      {/* Action Button */}
                      <div className="pt-3">
                <Button
                          variant={activeModule === module.id ? "default" : "outline"}
                          size="sm"
                          className="w-full"
                          disabled={!module.available}
                        >
                          {activeModule === module.id ? 'Currently Active' : 'Switch to Module'}
                        </Button>
                      </div>
                    </div>
                  </div>
              </CardContent>
            </Card>
            ))}
          </div>

          {/* Role-based Information */}
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <Info className="h-5 w-5 text-blue-600 mt-0.5" />
              <div className="flex-1">
                <h4 className="text-sm font-medium text-blue-900 dark:text-blue-100">
                  Role-based Access
                </h4>
                <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                  {userRole === 'student' 
                    ? 'You have access to your personal learning analytics and performance insights.'
                    : userRole === 'faculty'
                    ? 'You can view analytics for your department and assigned courses/assessments.'
                    : userRole === 'college-admin'
                    ? 'You have access to college-wide analytics and can view all departments.'
                    : 'You have full system access to all analytics and reports.'
                  }
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ModuleToggle; 