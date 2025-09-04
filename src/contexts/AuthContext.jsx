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
          
          // Verify token is still valid by fetching profile
          try {
            await apiService.getProfile();
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
        toast({ 
          variant: "destructive", 
          title: "Login Failed", 
          description: response.message || "Invalid email or password." 
        });
        return null;
      }
    } catch (error) {
      toast({ 
        variant: "destructive", 
        title: "Login Failed", 
        description: error.message || "An error occurred during login." 
      });
      return null;
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
    <AuthContext.Provider value={{ user, login, logout, signup, updateUser, loading }}>
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
