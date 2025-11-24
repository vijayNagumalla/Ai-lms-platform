import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useAuth } from '@/contexts/AuthContext';
import { motion } from 'framer-motion';
import { LogIn, Mail, AlertCircle } from 'lucide-react';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [requiresVerification, setRequiresVerification] = useState(false);
  const [resendingEmail, setResendingEmail] = useState(false);
  const { login, resendVerificationEmail } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setRequiresVerification(false);
    
    try {
      const result = await login({ email, password });
      
      // Check if email verification is required
      if (result && result.requiresEmailVerification) {
        setRequiresVerification(true);
        setIsLoading(false);
        return;
      }
      
      if (result && result.role) {
        // Add a small delay to ensure state is updated
        setTimeout(() => {
          // Redirect based on role
          switch (result.role) {
            case 'super-admin':
              navigate('/dashboard/super-admin', { replace: true });
              break;
            case 'college-admin':
              navigate('/dashboard/college-admin', { replace: true });
              break;
            case 'faculty':
              navigate('/dashboard/faculty', { replace: true });
              break;
            case 'student':
              navigate('/dashboard/student', { replace: true });
              break;
            default:
              navigate('/dashboard', { replace: true });
          }
          
          // Force a page reload if navigation doesn't work
          setTimeout(() => {
            if (window.location.pathname === '/login') {
              window.location.href = `/dashboard/${result.role === 'super-admin' ? 'super-admin' : result.role === 'college-admin' ? 'college-admin' : result.role === 'faculty' ? 'faculty' : 'student'}`;
            }
          }, 1000);
        }, 100);
      }
    } catch (error) {
      // Only log actual errors, not expected business logic responses
      // Email verification and rate limiting are handled above and don't throw errors anymore
      if (error.message && 
          !error.message.includes('verify your email') && 
          !error.message.includes('Too many requests') &&
          !error.message.includes('rate limit')) {
        console.error('Login error:', error);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendVerification = async () => {
    if (!email) return;
    setResendingEmail(true);
    await resendVerificationEmail(email);
    setResendingEmail(false);
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="flex items-center justify-center min-h-[calc(100vh-10rem)] py-12"
    >
      <Card className="w-full max-w-md shadow-2xl glassmorphic">
        <CardHeader className="space-y-1 text-center">
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1}} transition={{ delay: 0.2, type: "spring", stiffness: 260, damping: 20 }}>
            <LogIn className="mx-auto h-12 w-12 text-primary" />
          </motion.div>
          <CardTitle className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary via-purple-500 to-pink-500">
            Welcome Back!
          </CardTitle>
          <CardDescription>Enter your credentials to access your account.</CardDescription>
        </CardHeader>
        <CardContent>
          {requiresVerification && (
            <Alert className="mb-6 border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20">
              <AlertCircle className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
              <AlertTitle className="text-yellow-800 dark:text-yellow-200">Email Verification Required</AlertTitle>
              <AlertDescription className="text-yellow-700 dark:text-yellow-300 mt-2">
                <p className="mb-3">
                  Please verify your email address before logging in. Check your inbox for the verification link.
                </p>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleResendVerification}
                  disabled={resendingEmail}
                  className="w-full border-yellow-500 text-yellow-700 hover:bg-yellow-100 dark:hover:bg-yellow-800"
                >
                  <Mail className="mr-2 h-4 w-4" />
                  {resendingEmail ? 'Sending...' : 'Resend Verification Email'}
                </Button>
              </AlertDescription>
            </Alert>
          )}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="m@example.com"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setRequiresVerification(false);
                }}
                required
                className="bg-background/70"
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
                <Link to="/forgot-password" className="text-sm text-primary hover:underline">
                  Forgot password?
                </Link>
              </div>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="••••••••"
                className="bg-background/70"
              />
            </div>
            <Button 
              type="submit" 
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-600/90 text-primary-foreground shadow-lg transform hover:scale-105 transition-transform duration-300"
            >
              {isLoading ? 'Signing In...' : 'Sign In'}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="text-center text-sm">
          <p>
            Don't have an account?{' '}
            <Link to="/signup" className="font-semibold text-primary hover:underline">
              Sign up
            </Link>
          </p>
        </CardFooter>
      </Card>
    </motion.div>
  );
};

export default LoginPage;
