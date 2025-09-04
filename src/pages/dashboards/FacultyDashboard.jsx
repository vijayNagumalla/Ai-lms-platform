import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BookOpen, Edit3, Users, BarChartHorizontalBig, PlusCircle, Code, Eye } from 'lucide-react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import apiService from '@/services/api';

const FacultyDashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState([
    { title: "My Courses", value: "0", icon: <BookOpen className="h-6 w-6 text-primary" />, color: "bg-blue-500/10", link: "/courses", detailsLink: "/courses" },
    { title: "Enrolled Students", value: "0", icon: <Users className="h-6 w-6 text-primary" />, color: "bg-green-500/10", detailsLink: "/faculty/students" },
    { title: "Pending Gradings", value: "0", icon: <Edit3 className="h-6 w-6 text-primary" />, color: "bg-yellow-500/10", detailsLink: "/faculty/grading" },
    { title: "Average Score", value: "0%", icon: <BarChartHorizontalBig className="h-6 w-6 text-primary" />, color: "bg-purple-500/10", detailsLink: "/faculty/analytics/scores" },
  ]);

  const actions = [
    { label: "Create New Course", icon: <PlusCircle className="mr-2 h-5 w-5" />, linkTo: "/courses?action=create" },
    { label: "Manage My Courses", icon: <BookOpen className="mr-2 h-5 w-5" />, linkTo: "/courses" },
    { label: "Create Coding Problem", icon: <Code className="mr-2 h-5 w-5" />, linkTo: "/coding-problems" },
    { label: "View Student Progress", icon: <Users className="mr-2 h-5 w-5" />, linkTo: "/faculty/student-progress" },
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
        if (user?.id) {
          // Load analytics data for the faculty member
          const analyticsResponse = await apiService.getAnalyticsData({
            viewType: 'student',
            dateRange: '30'
          });

          if (analyticsResponse.success && analyticsResponse.data.summary) {
            const summary = analyticsResponse.data.summary;
            
            setStats([
              { 
                title: "My Courses", 
                value: "0", // TODO: Add faculty courses count to analytics
                icon: <BookOpen className="h-6 w-6 text-primary" />, 
                color: "bg-blue-500/10", 
                link: "/courses", 
                detailsLink: "/courses" 
              },
              { 
                title: "Enrolled Students", 
                value: summary.total_students?.toString() || "0", 
                icon: <Users className="h-6 w-6 text-primary" />, 
                color: "bg-green-500/10", 
                detailsLink: "/faculty/students" 
              },
              { 
                title: "Pending Gradings", 
                value: summary.pending_submissions?.toString() || "0", 
                icon: <Edit3 className="h-6 w-6 text-primary" />, 
                color: "bg-yellow-500/10", 
                detailsLink: "/faculty/grading" 
              },
              { 
                title: "Average Score", 
                value: `${(summary.average_score || 0).toFixed(1)}%`, 
                icon: <BarChartHorizontalBig className="h-6 w-6 text-primary" />, 
                color: "bg-purple-500/10", 
                detailsLink: "/faculty/analytics/scores" 
              },
            ]);
          }
        }
      } catch (error) {
        console.error('Error loading dashboard data:', error);
      }
    };

    loadDashboardData();
  }, [user?.id]);

  return (
    <div className="space-y-8">
      <motion.h1 
        className="text-3xl md:text-4xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-primary via-purple-500 to-pink-500"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        Faculty Dashboard
      </motion.h1>

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
            <CardTitle className="text-xl">Teaching Tools</CardTitle>
            <CardDescription>Manage your courses, content, and students.</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-4">
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
                  <Link to={action.linkTo} className="flex items-center w-full">
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
                <CardTitle>My Course Performance</CardTitle>
                <CardDescription>Overview of your courses' effectiveness.</CardDescription>
            </CardHeader>
            <CardContent>
                <p className="text-muted-foreground">This section will feature analytics for your courses, including student engagement, quiz/exam performance, assignment submissions, and coding problem attempts. With backend integration, you'll see dynamic charts and be able to drill down into individual student progress.</p>
                <div className="mt-4 p-6 bg-secondary/30 rounded-lg">
                    <h3 className="text-lg font-semibold mb-2 text-primary">Key Data Points:</h3>
                    <ul className="list-disc list-inside text-muted-foreground space-y-1">
                        <li>Completion rates per course</li>
                        <li>Average scores on assessments</li>
                        <li>Student activity logs within courses</li>
                        <li>Feedback and discussion forum activity</li>
                    </ul>
                </div>
            </CardContent>
        </Card>
      </motion.div>

    </div>
  );
};

export default FacultyDashboard;
