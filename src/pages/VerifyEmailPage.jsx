import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { motion } from 'framer-motion';
import { CheckCircle, XCircle, Loader2, Mail } from 'lucide-react';
import apiService from '@/services/api';

const VerifyEmailPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState('verifying'); // 'verifying', 'success', 'error'
  const [message, setMessage] = useState('');
  const token = searchParams.get('token');

  useEffect(() => {
    const verifyEmail = async () => {
      if (!token) {
        setStatus('error');
        setMessage('Verification token is missing. Please check your email for the complete verification link.');
        return;
      }

      try {
        const response = await apiService.verifyEmail(token);
        
        if (response.success) {
          setStatus('success');
          setMessage('Your email has been verified successfully! You can now log in to your account.');
          
          // Redirect to login after 3 seconds
          setTimeout(() => {
            navigate('/login', { replace: true });
          }, 3000);
        } else {
          setStatus('error');
          setMessage(response.message || 'Failed to verify email. Please try again.');
        }
      } catch (error) {
        console.error('Email verification error:', error);
        setStatus('error');
        setMessage(error.message || 'An error occurred while verifying your email. The link may have expired. Please request a new verification email.');
      }
    };

    verifyEmail();
  }, [token, navigate]);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="flex items-center justify-center min-h-[calc(100vh-10rem)] py-12"
    >
      <Card className="w-full max-w-md shadow-2xl glassmorphic">
        <CardHeader className="space-y-1 text-center">
          {status === 'verifying' && (
            <motion.div 
              initial={{ scale: 0 }} 
              animate={{ scale: 1 }} 
              transition={{ delay: 0.2, type: "spring", stiffness: 260, damping: 20 }}
            >
              <Loader2 className="mx-auto h-12 w-12 text-primary animate-spin" />
            </motion.div>
          )}
          {status === 'success' && (
            <motion.div 
              initial={{ scale: 0 }} 
              animate={{ scale: 1 }} 
              transition={{ delay: 0.2, type: "spring", stiffness: 260, damping: 20 }}
            >
              <CheckCircle className="mx-auto h-12 w-12 text-green-500" />
            </motion.div>
          )}
          {status === 'error' && (
            <motion.div 
              initial={{ scale: 0 }} 
              animate={{ scale: 1 }} 
              transition={{ delay: 0.2, type: "spring", stiffness: 260, damping: 20 }}
            >
              <XCircle className="mx-auto h-12 w-12 text-red-500" />
            </motion.div>
          )}
          <CardTitle className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary via-purple-500 to-pink-500">
            {status === 'verifying' && 'Verifying Email...'}
            {status === 'success' && 'Email Verified!'}
            {status === 'error' && 'Verification Failed'}
          </CardTitle>
          <CardDescription>
            {status === 'verifying' && 'Please wait while we verify your email address.'}
            {status === 'success' && 'Your email has been successfully verified.'}
            {status === 'error' && 'We couldn\'t verify your email address.'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {status === 'verifying' && (
            <div className="text-center py-4">
              <p className="text-muted-foreground">Verifying your email address...</p>
            </div>
          )}

          {status === 'success' && (
            <Alert className="border-green-500 bg-green-50 dark:bg-green-900/20">
              <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
              <AlertTitle className="text-green-800 dark:text-green-200">Verification Successful</AlertTitle>
              <AlertDescription className="text-green-700 dark:text-green-300 mt-2">
                {message}
              </AlertDescription>
            </Alert>
          )}

          {status === 'error' && (
            <>
              <Alert className="border-red-500 bg-red-50 dark:bg-red-900/20">
                <XCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
                <AlertTitle className="text-red-800 dark:text-red-200">Verification Failed</AlertTitle>
                <AlertDescription className="text-red-700 dark:text-red-300 mt-2">
                  {message}
                </AlertDescription>
              </Alert>
              
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground text-center">
                  The verification link may have expired or is invalid. You can request a new verification email.
                </p>
                <Button
                  asChild
                  variant="outline"
                  className="w-full"
                >
                  <Link to="/login">
                    <Mail className="mr-2 h-4 w-4" />
                    Go to Login
                  </Link>
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default VerifyEmailPage;

