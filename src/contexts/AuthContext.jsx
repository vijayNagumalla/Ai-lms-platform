import React, { createContext, useContext, useState, useEffect } from 'react';
import { useToast } from '@/components/ui/use-toast';
import apiService from '@/services/api';

const AuthContext = createContext(null);

const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const initializeAuth = async () => {
      const storedUser = localStorage.getItem('lmsUser');
      const token = localStorage.getItem('lmsToken');

      if (storedUser && token) {
        try {
          const userData = JSON.parse(storedUser);
          setUser(userData);

          // PERFORMANCE FIX: Make API calls in parallel instead of sequential
          // This reduces load time from ~10s to ~5s (or less depending on backend)
          try {
            // Use Promise.allSettled to run both calls in parallel
            // allSettled ensures both complete even if one fails
            const [profileResult, csrfResult] = await Promise.allSettled([
              apiService.getProfile(),
              // Only fetch CSRF if not already cached
              localStorage.getItem('csrfToken')
                ? Promise.resolve()
                : apiService.fetchCSRFToken()
            ]);

            // If profile verification failed, token is invalid
            if (profileResult.status === 'rejected') {
              localStorage.removeItem('lmsUser');
              localStorage.removeItem('lmsToken');
              setUser(null);
            }
            // CSRF token failure is non-critical, just log it
            if (csrfResult.status === 'rejected') {
              console.warn('Failed to fetch CSRF token:', csrfResult.reason);
            }
          } catch (error) {
            // Token is invalid, clear storage
            localStorage.removeItem('lmsUser');
            localStorage.removeItem('lmsToken');
            setUser(null);
          }
        } catch (error) {
          localStorage.removeItem('lmsUser');
          localStorage.removeItem('lmsToken');
        }
      }
      setLoading(false);
    };

    initializeAuth();
  }, []);

  const login = async (userData) => {
    try {
      const response = await apiService.login(userData);

      if (response.success) {
        setUser(response.data.user);
        toast({
          title: "Login Successful",
          description: `Welcome back, ${response.data.user.name || response.data.user.email}!`
        });
        return response.data.user;
      } else {
        // Handle email verification requirement - not an error, just a requirement
        if (response.requiresEmailVerification) {
          // Return a special object to indicate email verification is needed
          // Don't show error toast, the LoginPage will handle this gracefully
          return {
            requiresEmailVerification: true,
            email: userData.email,
            message: response.message
          };
        }

        // Handle rate limiting - show user-friendly message
        if (response.rateLimited) {
          const retryMessage = response.retryAfter
            ? `Please try again in ${response.retryAfter} seconds.`
            : 'Please try again in a few minutes.';
          toast({
            variant: "destructive",
            title: "Too Many Requests",
            description: `${response.message} ${retryMessage}`
          });
          return {
            rateLimited: true,
            message: response.message,
            retryAfter: response.retryAfter
          };
        }

        toast({
          variant: "destructive",
          title: "Login Failed",
          description: response.message || "Invalid email or password."
        });
        return null;
      }
    } catch (error) {
      // Only log actual errors, not expected business logic responses
      // Email verification is handled above, so this is a real error
      console.error('Login error:', error);

      toast({
        variant: "destructive",
        title: "Login Failed",
        description: error.message || "An error occurred during login."
      });
      return null;
    }
  };

  const resendVerificationEmail = async (email) => {
    try {
      const response = await apiService.resendVerificationEmail(email);
      if (response.success) {
        toast({
          title: "Verification Email Sent",
          description: "Please check your inbox for the verification link."
        });
        return true;
      } else {
        toast({
          variant: "destructive",
          title: "Failed to Send Email",
          description: response.message || "Could not send verification email."
        });
        return false;
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Failed to Send Email",
        description: error.message || "An error occurred while sending the verification email."
      });
      return false;
    }
  };

  const signup = async (userData) => {
    try {
      const response = await apiService.register(userData);
      if (response.success) {
        setUser(response.data.user);
        toast({
          title: "Signup Successful",
          description: `Welcome, ${response.data.user.name || response.data.user.email}!`
        });
        return response.data.user;
      } else {
        toast({
          variant: "destructive",
          title: "Signup Failed",
          description: response.message || "An error occurred during signup."
        });
        return null;
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Signup Failed",
        description: error.message || "An error occurred during signup."
      });
      return null;
    }
  };

  const logout = async () => {
    try {
      await apiService.logout();
    } catch (error) {
      // Logout error
    } finally {
      setUser(null);
    }
  };

  const updateUser = async (updatedData) => {
    try {
      const response = await apiService.updateProfile(updatedData);
      if (response.success) {
        setUser(response.data);
        localStorage.setItem('lmsUser', JSON.stringify(response.data));
        toast({
          title: "Profile Updated",
          description: "Your profile information has been updated."
        });
        return response.data;
      } else {
        toast({
          variant: "destructive",
          title: "Update Failed",
          description: response.message || "Failed to update profile."
        });
        return null;
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Update Failed",
        description: error.message || "An error occurred while updating profile."
      });
      return null;
    }
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, signup, updateUser, resendVerificationEmail, loading }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export { AuthProvider, useAuth };
export default AuthProvider;
