
import React from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { CheckCircle, BookCopy, Users, Code, BarChart3 } from 'lucide-react';
import { Link } from 'react-router-dom';

const LandingPage = () => {
  const featureVariants = {
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

  const features = [
    {
      icon: <Users className="h-10 w-10 text-primary" />,
      title: 'Multi-Role Access',
      description: 'Dedicated portals for Admins, Faculty, and Students.',
    },
    {
      icon: <Code className="h-10 w-10 text-primary" />,
      title: 'Interactive Learning Tools',
      description: 'Engage students with interactive assessments and multimedia content.',
    },
    {
      icon: <BarChart3 className="h-10 w-10 text-primary" />,
      title: 'Advanced Analytics',
      description: 'Track progress and performance with insightful dashboards.',
    },
  ];

  return (
    <div className="space-y-16">
      {/* Hero Section */}
      <motion.section
        initial={{ opacity: 0, y: -50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="text-center py-16 md:py-24 bg-gradient-to-br from-primary/10 via-background to-secondary/10 rounded-xl"
      >
        <div className="container mx-auto px-4">
          <motion.h1 
            className="text-4xl md:text-6xl font-bold mb-6 tracking-tight"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
          >
            The Future of <span className="bg-clip-text text-transparent bg-gradient-to-r from-purple-500 via-pink-500 to-orange-500">Education</span>, Reimagined.
          </motion.h1>
          <motion.p 
            className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.5 }}
          >
            EduHorizon LMS provides a scalable, multi-tenant platform for modern learning institutions. Empower your faculty and inspire your students.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.5 }}
            className="space-x-4"
          >
            <Button size="lg" asChild>
              <Link to="/signup">Get Started</Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link to="/features">Learn More</Link>
            </Button>
          </motion.div>
        </div>
      </motion.section>

      {/* Features Section */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-4">Platform Highlights</h2>
          <p className="text-muted-foreground text-center max-w-xl mx-auto mb-12">
            Discover the powerful features that make EduHorizon LMS the ideal choice for your institution.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                custom={index}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, amount: 0.3 }}
                variants={featureVariants}
                className="w-full"
              >
                <Card className="h-full hover:shadow-xl transition-shadow duration-300 glassmorphic">
                  <CardHeader className="items-center text-center">
                    {feature.icon}
                    <CardTitle className="mt-4">{feature.title}</CardTitle>
                  </CardHeader>
                  <CardContent className="text-center">
                    <CardDescription>{feature.description}</CardDescription>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Call to Action Section */}
      <section className="py-16 bg-secondary/50 rounded-xl">
        <div className="container mx-auto px-4 text-center">
          <motion.h2 
            className="text-3xl md:text-4xl font-bold mb-6"
            initial={{ opacity: 0, y:20 }}
            whileInView={{ opacity: 1, y:0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            Ready to Elevate Your Institution's Learning Experience?
          </motion.h2>
          <motion.p 
            className="text-muted-foreground max-w-xl mx-auto mb-8"
            initial={{ opacity: 0, y:20 }}
            whileInView={{ opacity: 1, y:0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            Join leading colleges and universities who trust EduHorizon LMS to deliver exceptional education.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, scale:0.8 }}
            whileInView={{ opacity: 1, scale:1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            <Button size="lg" className="bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-600/90 text-primary-foreground shadow-lg transform hover:scale-105 transition-transform duration-300">
              Request a Demo
            </Button>
          </motion.div>
        </div>
      </section>

      {/* Placeholder for image section */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">Visualizing Success</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            <div>
              <h3 className="text-2xl font-semibold mb-4">Seamless Integration, Powerful Results</h3>
              <p className="text-muted-foreground mb-2">Our platform is designed for ease of use, allowing for quick adoption and immediate impact. See how EduHorizon LMS can transform your educational delivery.</p>
              <ul className="space-y-2 text-muted-foreground">
                <li className="flex items-center"><CheckCircle className="h-5 w-5 text-green-500 mr-2" /> Intuitive dashboards for all user roles.</li>
                <li className="flex items-center"><CheckCircle className="h-5 w-5 text-green-500 mr-2" /> Customizable learning paths.</li>
                <li className="flex items-center"><CheckCircle className="h-5 w-5 text-green-500 mr-2" /> Secure and reliable infrastructure.</li>
              </ul>
            </div>
            <motion.div 
              className="rounded-lg overflow-hidden shadow-2xl"
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7 }}
            >
              <img  
                className="w-full h-auto object-cover" 
                alt="Modern e-learning dashboard interface"
               src="https://images.unsplash.com/photo-1562212424-f9452f6d6e8f" />
            </motion.div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default LandingPage;
  
