import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Users, Building, BarChart3, Settings, Eye, Loader2, Code, CheckSquare } from 'lucide-react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import apiService from '@/services/api';
import { useToast } from '@/components/ui/use-toast';

const SuperAdminDashboard = () => {
  const [stats, setStats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      setLoading(true);
      const response = await apiService.getSuperAdminDashboardStats();
      
      if (response.success) {
        const { totalUsers, totalColleges, totalDepartments, recentActivities } = response.data;
        
        const statsData = [
          { 
            title: "Total Users", 
            value: totalUsers.toString(), 
            icon: <Users className="h-6 w-6 text-primary" />, 
            color: "bg-blue-500/10", 
            detailsLink: "/admin/users" 
          },
          { 
            title: "Total Colleges", 
            value: totalColleges.toString(), 
            icon: <Building className="h-6 w-6 text-primary" />, 
            color: "bg-green-500/10", 
            detailsLink: "/admin/colleges" 
          },
          { 
            title: "Total Departments", 
            value: totalDepartments.toString(), 
            icon: <BarChart3 className="h-6 w-6 text-primary" />, 
            color: "bg-purple-500/10", 
            detailsLink: "/admin/departments" 
          },
          { 
            title: "Coding Profiles", 
            value: "Manage", 
            icon: <Code className="h-6 w-6 text-primary" />, 
            color: "bg-indigo-500/10", 
            detailsLink: "/admin/coding-profiles" 
          }
        ];
        
        setStats(statsData);
      }
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      setError('Failed to load dashboard statistics');
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load dashboard statistics"
      });
    } finally {
      setLoading(false);
    }
  };

  const actions = [
    { label: "Manage Colleges", icon: <Building className="mr-2 h-5 w-5" />, linkTo: "/admin/colleges" },
    { label: "User Management", icon: <Users className="mr-2 h-5 w-5" />, linkTo: "/admin/users" },
    { label: "Department Management", icon: <BarChart3 className="mr-2 h-5 w-5" />, linkTo: "/admin/departments" },
    { label: "Coding Profiles", icon: <Code className="mr-2 h-5 w-5" />, linkTo: "/admin/coding-profiles" },
    { label: "View Analytics", icon: <BarChart3 className="mr-2 h-5 w-5" />, linkTo: "/analytics/dashboard" },
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

  return (
    <div className="space-y-8">
      <motion.h1 
        className="text-3xl md:text-4xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-primary via-purple-500 to-pink-500"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        Super Admin Dashboard
      </motion.h1>

      {loading ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((index) => (
            <Card key={index} className="shadow-lg border-primary/20">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div className="h-4 w-24 bg-muted animate-pulse rounded"></div>
                <div className="h-6 w-6 bg-muted animate-pulse rounded"></div>
              </CardHeader>
              <CardContent>
                <div className="h-8 w-16 bg-muted animate-pulse rounded mb-2"></div>
                <div className="h-4 w-20 bg-muted animate-pulse rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : error ? (
        <Card className="shadow-lg border-destructive/20">
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-destructive mb-4">{error}</p>
              <Button onClick={fetchDashboardStats} variant="outline">
                <Loader2 className="mr-2 h-4 w-4" />
                Retry
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
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
      )}

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4, duration: 0.5 }}
      >
        <Card className="shadow-lg glassmorphic">
          <CardHeader>
            <CardTitle className="text-xl">Quick Actions</CardTitle>
            <CardDescription>Perform common administrative tasks.</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
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
                <CardTitle>Platform Overview</CardTitle>
                <CardDescription>High-level statistics and system status.</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
                    <div className="p-4 bg-secondary/30 rounded-lg">
                        <h4 className="font-semibold text-primary mb-2">System Status</h4>
                        <p className="text-2xl font-bold text-green-600">Active</p>
                    </div>
                </div>
                <div className="mt-4 p-6 bg-secondary/30 rounded-lg">
                    <h3 className="text-lg font-semibold mb-2 text-primary">System Features:</h3>
                    <ul className="list-disc list-inside text-muted-foreground space-y-1">
                        <li>Multi-tenant College Management</li>
                        <li>Role-based Access Control</li>
                        <li>User Management System</li>
                        <li>Department Management</li>
                        <li>Real-time Analytics Dashboard</li>
                    </ul>
                </div>
            </CardContent>
        </Card>
      </motion.div>

    </div>
  );
};

export default SuperAdminDashboard;
