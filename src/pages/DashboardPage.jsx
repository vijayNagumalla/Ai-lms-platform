import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2 } from 'lucide-react';

const DashboardPage = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && user) {
      switch (user.role) {
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
          // Fallback or error, though should be handled by AuthProvider/ProtectedRoute
          navigate('/', { replace: true }); 
      }
    } else if (!loading && !user) {
      navigate('/login', { replace: true });
    }
  }, [user, loading, navigate]);

  if (loading || !user) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-10rem)]">
        <Loader2 className="h-16 w-16 animate-spin text-primary" />
      </div>
    );
  }

  // This content should ideally not be shown as user will be redirected.
  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-10rem)]">
      <h1 className="text-2xl font-semibold">Redirecting to your dashboard...</h1>
    </div>
  );
};

export default DashboardPage;
