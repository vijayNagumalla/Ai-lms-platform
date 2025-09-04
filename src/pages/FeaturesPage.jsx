import React from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Users, BookOpenText, Code, BarChart3, ShieldCheck, Zap, Scaling, Palette, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';

const FeaturesPage = () => {
  const featuresList = [
    {
      icon: <Users className="h-12 w-12 text-primary" />,
      title: 'Multi-Tenant Architecture',
      description: 'Separate portals for each college, ensuring data isolation and custom branding capabilities.',
      category: 'Platform'
    },
    {
      icon: <ShieldCheck className="h-12 w-12 text-primary" />,
      title: 'Role-Based Access Control',
      description: 'Granular permissions for Super Admins, College Admins, Faculty, and Students.',
      category: 'Security'
    },
    {
      icon: <Code className="h-12 w-12 text-primary" />,
      title: 'Interactive Learning Tools',
      description: 'Engage students with interactive assessments, multimedia content, and real-time feedback systems.',
      category: 'Academics'
    },
    {
      icon: <Zap className="h-12 w-12 text-primary" />,
      title: 'Advanced Assessment Platform',
      description: 'Create diverse assessments including quizzes, assignments, and interactive learning modules.',
      category: 'Engagement'
    },
    {
      icon: <BarChart3 className="h-12 w-12 text-primary" />,
      title: 'Advanced Analytics & Reporting',
      description: 'Track student activity, assessment performance, and faculty contributions with detailed dashboards.',
      category: 'Insights'
    },
    {
      icon: <Scaling className="h-12 w-12 text-primary" />,
      title: 'Scalable Infrastructure',
      description: 'Designed to handle thousands of concurrent users, ensuring smooth performance during peak times.',
      category: 'Platform'
    },
    {
      icon: <Palette className="h-12 w-12 text-primary" />,
      title: 'Customizable Themes & Branding',
      description: 'Colleges can personalize their portal with their own branding, logos, and color schemes.',
      category: 'Customization'
    },
    {
      icon: <MessageSquare className="h-12 w-12 text-primary" />,
      title: 'Communication Tools',
      description: 'Facilitate interaction with announcements, discussion forums, and direct messaging capabilities.',
      category: 'Engagement'
    },
  ];

  const cardVariants = {
    hidden: { opacity: 0, scale: 0.9 },
    visible: (i) => ({
      opacity: 1,
      scale: 1,
      transition: {
        delay: i * 0.05,
        duration: 0.4,
        ease: "easeOut"
      },
    }),
  };

  return (
    <div className="py-12 md:py-20 px-4">
      <motion.section
        initial={{ opacity: 0, y: -30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: "easeOut" }}
        className="text-center mb-16"
      >
        <h1 className="text-4xl md:text-5xl font-extrabold mb-4 tracking-tight">
          Powerful Features for a <span className="bg-clip-text text-transparent bg-gradient-to-r from-purple-600 via-pink-500 to-orange-400">Transformative Learning Experience</span>
        </h1>
        <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto">
          EduHorizon LMS is packed with cutting-edge tools designed to empower educators and inspire students. Explore what makes our platform unique.
        </p>
      </motion.section>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {featuresList.map((feature, index) => (
          <motion.div
            key={index}
            custom={index}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.2 }}
            variants={cardVariants}
          >
            <Card className="h-full shadow-xl hover:shadow-2xl transition-all duration-300 ease-in-out transform hover:-translate-y-1 glassmorphic border-primary/20">
              <CardHeader className="items-center text-center p-6">
                <div className="p-4 bg-primary/10 rounded-full mb-4 inline-block">
                  {feature.icon}
                </div>
                <CardTitle className="text-2xl font-semibold">{feature.title}</CardTitle>
                <span className="text-xs font-medium text-primary bg-primary/10 px-2 py-0.5 rounded-full">{feature.category}</span>
              </CardHeader>
              <CardContent className="text-center p-6 pt-0">
                <CardDescription className="text-base leading-relaxed">{feature.description}</CardDescription>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <motion.section
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, delay: 0.5, ease: "easeOut" }}
        className="text-center mt-20"
      >
        <h2 className="text-3xl md:text-4xl font-bold mb-6">
          Ready to Experience the Future of Education?
        </h2>
        <p className="text-lg text-muted-foreground max-w-xl mx-auto mb-8">
          Join the growing number of institutions choosing EduHorizon LMS.
        </p>
        <div className="space-x-4">
            <Button size="lg" className="bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-600/90 text-primary-foreground shadow-lg transform hover:scale-105 transition-transform duration-300" asChild>
                <Link to="/signup">Get Started Now</Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
                <Link to="/contact">Request a Demo</Link>
            </Button>
        </div>
      </motion.section>
    </div>
  );
};

export default FeaturesPage;
