
import React from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { useAuth } from '@/contexts/AuthContext';

const Layout = ({ children }) => {
  const { user } = useAuth();

  // If user is not logged in, show full-width layout without header
  if (!user) {
    return (
      <div className="flex flex-col min-h-screen">
        <main className="flex-1">
          {children}
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen">
      {/* Header */}
      <Header />
      
      {/* Main Content */}
      <main className="flex-1 p-6 pt-8">
        {children}
      </main>
      <Footer />
    </div>
  );
};

export default Layout;
  
