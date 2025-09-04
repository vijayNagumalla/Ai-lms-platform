import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Users, BookOpen, BarChart2, Settings, UserPlus, FilePlus, Eye } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { Link } from 'react-router-dom';
import apiService from '@/services/api';

const CollegeAdminDashboard = () => {
  const { user } = useAuth();

  const [stats, setStats] = useState([
    { title: "Total Students", value: "0", icon: <Users className="h-6 w-6 text-primary" />, color: "bg-blue-500/10", detailsLink: `/college/${user?.collegeId}/students` },
    { title: "Active Faculty", value: "0", icon: <Users className="h-6 w-6 text-primary" />, color: "bg-green-500/10", detailsLink: `/college/${user?.collegeId}/faculty` },
    { title: "Courses Offered", value: "0", icon: <BookOpen className="h-6 w-6 text-primary" />, color: "bg-yellow-500/10", detailsLink: `/college/${user?.collegeId}/courses` },
    { title: "Overall Engagement", value: "0%", icon: <BarChart2 className="h-6 w-6 text-primary" />, color: "bg-purple-500/10", detailsLink: `/college/${user?.collegeId}/analytics/engagement` },
  ]);

  const actions = [
    { label: "Manage Faculty", icon: <UserPlus className="mr-2 h-5 w-5" />, linkTo: `/college/${user?.collegeId}/faculty/manage` },
    { label: "Manage Students", icon: <Users className="mr-2 h-5 w-5" />, linkTo: `/college/${user?.collegeId}/students/manage` },
    { label: "Course Management", icon: <FilePlus className="mr-2 h-5 w-5" />, linkTo: "/courses" },
    { label: "View College Analytics", icon: <BarChart2 className="mr-2 h-5 w-5" />, linkTo: "/analytics/dashboard" },
    { label: "College Settings", icon: <Settings className="mr-2 h-5 w-5" />, linkTo: `/college/${user?.collegeId}/settings` },

  ];

  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: (i) => ({
      opacity: 1,
      y: 0,
      transition: {
        delay: i * 0.1,
        duration: 0.5,
      },
    }),
  };

  // Load real data from API
  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        if (user?.collegeId) {
          // Load analytics data for the college
          const analyticsResponse = await apiService.getAnalyticsData({
            viewType: 'college',
            collegeId: user.collegeId,
            dateRange: '30'
          });

          if (analyticsResponse.success && analyticsResponse.data.summary) {
            const summary = analyticsResponse.data.summary;
            
            setStats([
              { 
                title: "Total Students", 
                value: summary.total_students?.toString() || "0", 
                icon: <Users className="h-6 w-6 text-primary" />, 
                color: "bg-blue-500/10", 
                detailsLink: `/college/${user?.collegeId}/students` 
              },
              { 
                title: "Active Faculty", 
                value: "0", // TODO: Add faculty count to analytics
                icon: <Users className="h-6 w-6 text-primary" />, 
                color: "bg-green-500/10", 
                detailsLink: `/college/${user?.collegeId}/faculty` 
              },
              { 
                title: "Courses Offered", 
                value: "0", // TODO: Add courses count to analytics
                icon: <BookOpen className="h-6 w-6 text-primary" />, 
                color: "bg-yellow-500/10", 
                detailsLink: `/college/${user?.collegeId}/courses` 
              },
              { 
                title: "Overall Engagement", 
                value: `${(summary.completion_rate || 0).toFixed(1)}%`, 
                icon: <BarChart2 className="h-6 w-6 text-primary" />, 
                color: "bg-purple-500/10", 
                detailsLink: `/college/${user?.collegeId}/analytics/engagement` 
              },
            ]);
          }
        }
      } catch (error) {
        console.error('Error loading dashboard data:', error);
      }
    };

    loadDashboardData();
  }, [user?.collegeId]);

  return (
    <div className="space-y-8">
      <motion.h1 
        className="text-3xl md:text-4xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-primary via-purple-500 to-pink-500"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        College Admin Dashboard
      </motion.h1>
      {user?.collegeId && <p className="text-muted-foreground">Managing: College ID {user.collegeId}</p>}


      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, index) => (
          <motion.div
            key={index}
            custom={index}
            initial="hidden"
            animate="visible"
            variants={cardVariants}
          >
            <Card className={`shadow-lg hover:shadow-xl transition-shadow duration-300 ${stat.color} border-primary/20`}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">{stat.title}</CardTitle>
                {stat.icon}
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-foreground">{stat.value}</div>
                 {stat.detailsLink && (
                  <Button variant="link" size="sm" asChild className="px-0 text-xs text-primary hover:underline">
                    <Link to={stat.detailsLink}><Eye className="mr-1 h-3 w-3" />View Details</Link>
                  </Button>
                )}
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4, duration: 0.5 }}
      >
        <Card className="shadow-lg glassmorphic">
          <CardHeader>
            <CardTitle className="text-xl">Administrative Tools</CardTitle>
            <CardDescription>Manage your college's resources and users.</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {actions.map((action, index) => (
              <motion.div
                key={index}
                custom={index + stats.length}
                initial="hidden"
                animate="visible"
                variants={cardVariants}
              >
                <Button 
                  variant="outline" 
                  className="w-full justify-start py-6 text-left hover:bg-accent/50 transition-colors duration-300 border-primary/30"
                  asChild
                >
                  <Link to={action.linkTo}>
                    {action.icon}
                    <span className="text-md font-medium">{action.label}</span>
                  </Link>
                </Button>
              </motion.div>
            ))}
          </CardContent>
        </Card>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6, duration: 0.5 }}
        className="mt-8"
      >
        <Card className="shadow-lg">
            <CardHeader>
                <CardTitle>College Performance Overview</CardTitle>
                <CardDescription>Key metrics for your institution.</CardDescription>
            </CardHeader>
            <CardContent>
                <p className="text-muted-foreground">This area will display detailed analytics on student progress, faculty activity, and course effectiveness specific to your college. Integration with a backend will enable dynamic charts, reports, and data filtering capabilities.</p>
                 <div className="mt-4 p-6 bg-secondary/30 rounded-lg">
                    <h3 className="text-lg font-semibold mb-2 text-primary">Key Analytics Areas:</h3>
                    <ul className="list-disc list-inside text-muted-foreground space-y-1">
                        <li>Student Performance Tracking (Quizzes, Exams, Assignments)</li>
                        <li>Faculty Engagement & Course Creation Metrics</li>
                        <li>Assessment Success Rates & Difficulty Analysis</li>
                        <li>Overall Student Activity & Time Spent</li>
                    </ul>
                </div>
            </CardContent>
        </Card>
      </motion.div>

    </div>
  );
};

export default CollegeAdminDashboard;
