import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { BookOpenText, Moon, Sun, LogOut, User, LayoutDashboard, Settings, BookMarked, CheckSquare, Building, Users, FileText, ChevronDown, GraduationCap, BarChart3, Code, Menu, X, UserCheck, Calendar, Shield, FolderKanban, Briefcase } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator, DropdownMenuGroup, DropdownMenuLabel } from '@/components/ui/dropdown-menu';
import { useTheme } from '@/components/ThemeProvider';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/ui/use-toast';

const Header = () => {
  const { theme, setTheme } = useTheme();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const toggleTheme = () => {
    setTheme(theme === 'light' ? 'dark' : 'light');
  };

  const handleLogout = () => {
    logout();
    toast({ title: "Logged Out", description: "You have been successfully logged out." });
    navigate('/');
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };
  
  const getInitials = (name) => {
    if (!name) return "U";
    const names = name.split(' ');
    if (names.length === 1) return names[0].charAt(0).toUpperCase();
    return names[0].charAt(0).toUpperCase() + names[names.length - 1].charAt(0).toUpperCase();
  };

  // Helper function to determine if a link is active
  const isActiveLink = (path) => {
    if (path === '/dashboard') {
      return location.pathname === '/dashboard' || location.pathname.match(/^\/dashboard\/(super-admin|college-admin|faculty|student)$/);
    }
    if (path === '/assessments') {
      return location.pathname.startsWith('/assessments') && !location.pathname.startsWith('/student/assessments');
    }
    if (path === '/student/assessments') {
      return location.pathname.startsWith('/student/assessments');
    }
    if (path === '/student/coding-platforms') {
      return location.pathname.startsWith('/student/coding-platforms');
    }
    if (path === '/admin/colleges') {
      return location.pathname.startsWith('/admin/colleges');
    }
    if (path === '/admin/users') {
      return location.pathname.startsWith('/admin/users');
    }
    if (path === '/admin/faculty') {
      return location.pathname.startsWith('/admin/faculty');
    }
    if (path === '/admin/coding-profiles') {
      return location.pathname.startsWith('/admin/coding-profiles');
    }
    if (path === '/dashboard/super-admin/courses') {
      return location.pathname.startsWith('/dashboard/super-admin/courses');
    }
    if (path === '/dashboard/super-admin/attendance') {
      return location.pathname.startsWith('/dashboard/super-admin/attendance');
    }
    if (path === '/dashboard/super-admin/scheduling') {
      return location.pathname.startsWith('/dashboard/super-admin/scheduling');
    }
    if (path === '/dashboard/super-admin/faculty-status') {
      return location.pathname.startsWith('/dashboard/super-admin/faculty-status');
    }
    if (path === '/question-bank') {
      return location.pathname.startsWith('/question-bank');
    }
    if (path === '/analytics/dashboard') {
      return location.pathname.startsWith('/analytics');
    }
    if (path === '/projects' || path.includes('/project-management')) {
      return location.pathname.includes('/project-management');
    }
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  // Helper function to get link classes based on active state
  const getLinkClasses = (path) => {
    const baseClasses = "relative text-sm font-medium transition-all duration-300 px-3 py-2 rounded-lg min-w-[80px] text-center";
    const activeClasses = "text-white bg-gradient-to-r from-primary to-purple-600 shadow-lg transform scale-105";
    const inactiveClasses = "text-muted-foreground hover:text-primary hover:bg-muted/80 hover:shadow-md";
    
    return `${baseClasses} ${isActiveLink(path) ? activeClasses : inactiveClasses}`;
  };

  // Helper function to get aria attributes for accessibility
  const getAriaAttributes = (path) => {
    return {
      'aria-current': isActiveLink(path) ? 'page' : undefined,
      'aria-label': isActiveLink(path) ? `${path.split('/').pop() || 'page'} (current page)` : undefined
    };
  };

  // Helper function to get the active management item title
  const getActiveManagementItemTitle = () => {
    if (isActiveLink('/dashboard/super-admin/courses')) return 'Course Management';
    if (isActiveLink('/admin/faculty')) return 'Faculty Management';
    if (isActiveLink('/assessments')) return 'Assessment Management';
    if (isActiveLink('/dashboard/super-admin/attendance')) return 'Attendance Management';
    if (location.pathname.includes('/project-management')) return 'Project Management';
    if (isActiveLink('/admin/coding-profiles')) return 'Coding Profiles';
    if (isActiveLink('/dashboard/super-admin/scheduling')) return 'Class Management';
    if (isActiveLink('/analytics/dashboard')) return 'Analytics Management';
    return 'Management';
  };

  // Helper function to get the active administration item title
  const getActiveAdministrationItemTitle = () => {
    if (isActiveLink('/admin/users')) return 'Users';
    if (isActiveLink('/admin/colleges')) return 'Colleges';
    if (isActiveLink('/question-bank')) return 'Question Bank';
    return 'Administration';
  };

  // Management submenu items
  const managementItems = [
    {
      title: "Course Management",
      href: "/dashboard/super-admin/courses",
      icon: BookMarked,
      roles: ['super-admin']
    },
    {
      title: "Faculty Management",
      href: "/admin/faculty",
      icon: GraduationCap,
      roles: ['super-admin', 'college-admin']
    },
    {
      title: "Assessment Management",
      href: "/assessments",
      icon: CheckSquare,
      roles: ['super-admin', 'college-admin', 'faculty']
    },
    {
      title: "Attendance Management",
      href: "/dashboard/super-admin/attendance",
      icon: UserCheck,
      roles: ['super-admin']
    },
    {
      title: "Project Management",
      href: user?.role === 'super-admin' 
        ? "/dashboard/super-admin/project-management"
        : user?.role === 'college-admin'
        ? "/dashboard/college-admin/project-management"
        : user?.role === 'faculty'
        ? "/dashboard/faculty/project-management"
        : "/dashboard/student/project-management",
      icon: FolderKanban,
      roles: ['super-admin', 'college-admin', 'faculty', 'student']
    },
    {
      title: "Coding Profiles",
      href: "/admin/coding-profiles",
      icon: Code,
      roles: ['super-admin']
    },
    {
      title: "Class Management",
      href: "/dashboard/super-admin/scheduling",
      icon: Calendar,
      roles: ['super-admin']
    },
    {
      title: "Analytics Management",
      href: "/analytics/dashboard",
      icon: BarChart3,
      roles: ['super-admin', 'college-admin', 'faculty', 'student']
    },
  ];

  // Administration submenu items
  const administrationItems = [
    {
      title: "Users",
      href: "/admin/users",
      icon: Users,
      roles: ['super-admin']
    },
    {
      title: "Colleges",
      href: "/admin/colleges",
      icon: Building,
      roles: ['super-admin']
    },
    {
      title: "Question Bank",
      href: "/question-bank",
      icon: FileText,
      roles: ['super-admin', 'college-admin', 'faculty']
    },
  ];

  // Student-specific navigation items (shown separately)
  const studentNavigationItems = [
    {
      title: "Assessments",
      href: "/student/assessments",
      icon: CheckSquare,
      roles: ['student']
    },
    {
      title: "Coding Platforms",
      href: "/student/coding-platforms",
      icon: Code,
      roles: ['student']
    },
  ];

  const filteredManagementItems = managementItems.filter(item => 
    item.roles.includes(user?.role)
  );

  const filteredAdministrationItems = administrationItems.filter(item => 
    item.roles.includes(user?.role)
  );

  const filteredStudentNavigationItems = studentNavigationItems.filter(item => 
    item.roles.includes(user?.role)
  );

  const hasManagementAccess = filteredManagementItems.length > 0;
  const hasAdministrationAccess = filteredAdministrationItems.length > 0;
  const hasStudentNavigation = filteredStudentNavigationItems.length > 0;

  return (
    <>
      <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 shadow-sm">
        <div className="w-full max-w-[1920px] mx-auto flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8 xl:px-12 2xl:px-16">
          <div className="flex items-center flex-1 min-w-0">
            {/* Mobile Menu Button */}
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleMobileMenu}
              className="mr-3 lg:hidden flex-shrink-0"
              aria-label="Toggle mobile menu"
            >
              <Menu className="h-6 w-6" />
            </Button>

            <Link to="/" className="mr-4 lg:mr-6 xl:mr-8 flex items-center space-x-3 flex-shrink-0">
              <div className="relative">
                <BookOpenText className="h-8 w-8 text-primary drop-shadow-sm" />
                <div className="absolute -inset-1 bg-gradient-to-r from-primary/20 to-purple-500/20 rounded-full blur-sm"></div>
              </div>
              <span className="font-bold text-xl lg:text-2xl bg-clip-text text-transparent bg-gradient-to-r from-primary via-purple-600 to-pink-600 drop-shadow-sm whitespace-nowrap">
                EduHorizon
              </span>
            </Link>
            
            {/* Desktop Navigation - Hidden on mobile */}
            <nav className="hidden lg:flex items-center space-x-2 xl:space-x-3 2xl:space-x-4 flex-1 min-w-0">
              {/* Dashboard Link */}
              {user && (
                <Link
                  to="/dashboard"
                  className={getLinkClasses('/dashboard')}
                  {...getAriaAttributes('/dashboard')}
                >
                  <span className="relative z-10 flex items-center space-x-2">
                    <LayoutDashboard className="h-4 w-4" />
                    <span>Dashboard</span>
                  </span>
                  {isActiveLink('/dashboard') && (
                    <div className="absolute inset-0 bg-gradient-to-r from-primary/10 to-purple-500/10 rounded-lg animate-pulse"></div>
                  )}
                </Link>
              )}

              {/* Management Dropdown */}
              {user && hasManagementAccess && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button 
                      variant="ghost" 
                      className={`relative text-sm font-medium transition-all duration-300 px-3 py-2 rounded-lg min-w-[120px] text-center ${
                        isActiveLink('/dashboard/super-admin/courses') || isActiveLink('/admin/faculty') || 
                        isActiveLink('/assessments') || isActiveLink('/dashboard/super-admin/attendance') ||
                        location.pathname.includes('/project-management') || isActiveLink('/admin/coding-profiles') || 
                        isActiveLink('/dashboard/super-admin/scheduling') || isActiveLink('/analytics/dashboard')
                          ? 'text-white bg-gradient-to-r from-primary to-purple-600 shadow-lg transform scale-105'
                          : 'text-muted-foreground hover:text-primary hover:bg-muted/80 hover:shadow-md'
                      }`}
                    >
                      <span className="relative z-10">{getActiveManagementItemTitle()}</span>
                      <ChevronDown className="ml-2 h-4 w-4 relative z-10" />
                      {(isActiveLink('/dashboard/super-admin/courses') || isActiveLink('/admin/faculty') || 
                        isActiveLink('/assessments') || isActiveLink('/dashboard/super-admin/attendance') ||
                        location.pathname.includes('/project-management') || isActiveLink('/admin/coding-profiles') || 
                        isActiveLink('/dashboard/super-admin/scheduling') || isActiveLink('/analytics/dashboard')) && (
                        <div className="absolute inset-0 bg-gradient-to-r from-primary/10 to-purple-500/10 rounded-lg animate-pulse"></div>
                      )}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="w-56 p-1">
                    <DropdownMenuGroup>
                      {filteredManagementItems.map((item) => {
                        const IconComponent = item.icon;
                        return (
                          <DropdownMenuItem 
                            key={item.href} 
                            asChild 
                            className={`p-3 rounded-lg hover:bg-muted/80 ${
                              isActiveLink(item.href) ? 'bg-primary/10 text-primary' : ''
                            }`}
                          >
                            <Link to={item.href}>
                              <IconComponent className="mr-3 h-4 w-4" />
                              <span>{item.title}</span>
                            </Link>
                          </DropdownMenuItem>
                        );
                      })}
                    </DropdownMenuGroup>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}

              {/* Administration Dropdown */}
              {user && hasAdministrationAccess && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button 
                      variant="ghost" 
                      className={`relative text-sm font-medium transition-all duration-300 px-3 py-2 rounded-lg min-w-[140px] text-center ${
                        isActiveLink('/admin/users') || isActiveLink('/admin/colleges') || isActiveLink('/question-bank')
                          ? 'text-white bg-gradient-to-r from-primary to-purple-600 shadow-lg transform scale-105'
                          : 'text-muted-foreground hover:text-primary hover:bg-muted/80 hover:shadow-md'
                      }`}
                    >
                      <span className="relative z-10">{getActiveAdministrationItemTitle()}</span>
                      <ChevronDown className="ml-2 h-4 w-4 relative z-10" />
                      {(isActiveLink('/admin/users') || isActiveLink('/admin/colleges') || isActiveLink('/question-bank')) && (
                        <div className="absolute inset-0 bg-gradient-to-r from-primary/10 to-purple-500/10 rounded-lg animate-pulse"></div>
                      )}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="w-56 p-1">
                    <DropdownMenuGroup>
                      {filteredAdministrationItems.map((item) => {
                        const IconComponent = item.icon;
                        return (
                          <DropdownMenuItem 
                            key={item.href} 
                            asChild 
                            className={`p-3 rounded-lg hover:bg-muted/80 ${
                              isActiveLink(item.href) ? 'bg-primary/10 text-primary' : ''
                            }`}
                          >
                            <Link to={item.href}>
                              <IconComponent className="mr-3 h-4 w-4" />
                              <span>{item.title}</span>
                            </Link>
                          </DropdownMenuItem>
                        );
                      })}
                    </DropdownMenuGroup>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}

              {/* Student Navigation Items */}
              {user && hasStudentNavigation && filteredStudentNavigationItems.map((item) => {
                const IconComponent = item.icon;
                return (
                  <Link
                    key={item.href}
                    to={item.href}
                    className={getLinkClasses(item.href)}
                    {...getAriaAttributes(item.href)}
                  >
                    <span className="relative z-10 flex items-center space-x-2">
                      {IconComponent && <IconComponent className="h-4 w-4" />}
                      <span>{item.title}</span>
                    </span>
                    {isActiveLink(item.href) && (
                      <div className="absolute inset-0 bg-gradient-to-r from-primary/10 to-purple-500/10 rounded-lg animate-pulse"></div>
                    )}
                  </Link>
                );
              })}
            </nav>
          </div>
        
        {/* Desktop Theme and Profile - Hidden on mobile */}
        <div className="hidden lg:flex items-center space-x-2 sm:space-x-3 lg:space-x-4 xl:space-x-6 flex-shrink-0">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={toggleTheme} 
            aria-label="Toggle theme"
            className="relative overflow-hidden hover:bg-muted/80 transition-all duration-300"
          >
            <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
            <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          </Button>
          
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="ghost" 
                  className="relative h-10 w-10 rounded-full border-2 border-transparent hover:border-primary/20 transition-all duration-300"
                >
                  <Avatar className="h-9 w-9">
                    <AvatarImage src={user.avatarUrl || `https://avatar.vercel.sh/${user.email}.png`} alt={user.name || user.email} />
                    <AvatarFallback className="text-xs font-semibold">{getInitials(user.name)}</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-64 p-2">
                <DropdownMenuLabel className="font-normal p-3">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-semibold leading-none">{user.name || "User"}</p>
                    <p className="text-xs leading-none text-muted-foreground">
                      {user.email}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuGroup>
                  <DropdownMenuItem asChild className="p-3 rounded-lg hover:bg-muted/80">
                    <Link to="/profile">
                      <User className="mr-3 h-4 w-4" />
                      <span>Profile</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild className="p-3 rounded-lg hover:bg-muted/80">
                    <Link to="/dashboard">
                      <LayoutDashboard className="mr-3 h-4 w-4" />
                      <span>Dashboard</span>
                    </Link>
                  </DropdownMenuItem>
                </DropdownMenuGroup>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  onClick={handleLogout}
                  className="p-3 rounded-lg hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/20"
                >
                  <LogOut className="mr-3 h-4 w-4" />
                  <span>Log out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <div className="flex items-center space-x-3">
              <Button variant="outline" size="sm" asChild className="hover:bg-muted/80">
                <Link to="/login">Sign In</Link>
              </Button>
              <Button size="sm" asChild className="bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-600/90">
                <Link to="/signup">Sign Up</Link>
              </Button>
            </div>
          )}
        </div>
      </div>
    </header>

    {/* Mobile Sidebar Overlay */}
    {isMobileMenuOpen && (
      <div className="fixed inset-0 z-50 lg:hidden">
        {/* Backdrop */}
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-sm"
          onClick={closeMobileMenu}
        />
        
        {/* Sidebar */}
        <div className="fixed left-0 top-0 h-full w-80 max-w-[85vw] bg-background border-r border-border shadow-xl flex flex-col">
          {/* Sidebar Header */}
          <div className="flex h-16 items-center justify-between border-b px-6 flex-shrink-0">
            <Link to="/" className="flex items-center space-x-3" onClick={closeMobileMenu}>
              <BookOpenText className="h-7 w-7 text-primary" />
              <span className="font-bold text-xl bg-clip-text text-transparent bg-gradient-to-r from-primary via-purple-500 to-pink-500">
                EduHorizon
              </span>
            </Link>
            <Button
              variant="ghost"
              size="icon"
              onClick={closeMobileMenu}
              className="h-9 w-9"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* Sidebar Navigation */}
          <nav className="flex-1 space-y-2 p-6 overflow-y-auto min-h-0">
            {/* Dashboard */}
            {user && (
              <Link
                to="/dashboard"
                className={`flex items-center space-x-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 ${
                  isActiveLink('/dashboard')
                    ? 'bg-primary text-primary-foreground shadow-md'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                }`}
                onClick={closeMobileMenu}
              >
                <LayoutDashboard className="h-4 w-4" />
                <span>Dashboard</span>
              </Link>
            )}

            {/* Management Section */}
            {user && hasManagementAccess && (
              <div className="pt-4 border-t">
                <div className="px-4 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Management
                </div>
                {filteredManagementItems.map((item) => {
                  const IconComponent = item.icon;
                  return (
                    <Link
                      key={item.href}
                      to={item.href}
                      className={`flex items-center space-x-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 ${
                        isActiveLink(item.href)
                          ? 'bg-primary text-primary-foreground shadow-md'
                          : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                      }`}
                      onClick={closeMobileMenu}
                    >
                      <IconComponent className="h-4 w-4" />
                      <span>{item.title}</span>
                    </Link>
                  );
                })}
              </div>
            )}

            {/* Administration Section */}
            {user && hasAdministrationAccess && (
              <div className="pt-4 border-t">
                <div className="px-4 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Administration
                </div>
                {filteredAdministrationItems.map((item) => {
                  const IconComponent = item.icon;
                  return (
                    <Link
                      key={item.href}
                      to={item.href}
                      className={`flex items-center space-x-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 ${
                        isActiveLink(item.href)
                          ? 'bg-primary text-primary-foreground shadow-md'
                          : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                      }`}
                      onClick={closeMobileMenu}
                    >
                      <IconComponent className="h-4 w-4" />
                      <span>{item.title}</span>
                    </Link>
                  );
                })}
              </div>
            )}

            {/* Student Navigation Items */}
            {user && hasStudentNavigation && (
              <div className="pt-4 border-t">
                {filteredStudentNavigationItems.map((item) => {
                  const IconComponent = item.icon;
                  return (
                    <Link
                      key={item.href}
                      to={item.href}
                      className={`flex items-center space-x-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 ${
                        isActiveLink(item.href)
                          ? 'bg-primary text-primary-foreground shadow-md'
                          : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                      }`}
                      onClick={closeMobileMenu}
                    >
                      <IconComponent className="h-4 w-4" />
                      <span>{item.title}</span>
                    </Link>
                  );
                })}
              </div>
            )}
          </nav>

          {/* Sidebar Footer */}
          <div className="border-t p-6 space-y-3 flex-shrink-0">
            <div className="flex items-center space-x-3">
              <Avatar className="h-10 w-10">
                <AvatarImage src={user?.avatarUrl || `https://avatar.vercel.sh/${user?.email}.png`} alt={user?.name || user?.email} />
                <AvatarFallback className="text-sm font-semibold">{getInitials(user?.name)}</AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold leading-none truncate">{user?.name || "User"}</p>
                <p className="text-xs leading-none text-muted-foreground truncate">
                  {user?.email}
                </p>
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={toggleTheme} 
                className="flex-1 mr-2"
              >
                <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                <span className="ml-2">Theme</span>
              </Button>
              
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={handleLogout}
                className="flex-1 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/20"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </div>
    )}
    </>
  );
};

export default Header;
