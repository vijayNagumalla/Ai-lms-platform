import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { BookOpenText, Moon, Sun, LogOut, User, LayoutDashboard, Settings, BookMarked, CheckSquare, Building, Users, FileText, ChevronDown, GraduationCap, BarChart3, Code } from 'lucide-react';
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

  const toggleTheme = () => {
    setTheme(theme === 'light' ? 'dark' : 'light');
  };

  const handleLogout = () => {
    logout();
    toast({ title: "Logged Out", description: "You have been successfully logged out." });
    navigate('/');
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
      return location.pathname.startsWith('/dashboard');
    }
    if (path === '/assessments') {
      return location.pathname.startsWith('/assessments') && !location.pathname.startsWith('/student/assessments');
    }
    if (path === '/student/assessments') {
      return location.pathname.startsWith('/student/assessments');
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
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  // Helper function to get link classes based on active state
  const getLinkClasses = (path) => {
    const baseClasses = "relative text-sm font-medium transition-all duration-300 px-4 py-2 rounded-lg";
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

  // Helper function to get the active admin item title
  const getActiveAdminItemTitle = () => {
    if (isActiveLink('/admin/colleges')) return 'Colleges';
    if (isActiveLink('/admin/users')) return 'Users';
    if (isActiveLink('/admin/faculty')) return 'Trainers';
    if (isActiveLink('/admin/coding-profiles')) return 'Coding Profiles';
    return 'Administrator';
  };

  const navigationItems = [
    {
      title: "Dashboard",
      href: "/dashboard",
      roles: ['super-admin', 'college-admin', 'faculty', 'student']
    },
    {
      title: "Courses",
      href: "/courses",
      roles: ['college-admin', 'faculty']
    },
    {
      title: "Assessments",
      href: user?.role === 'student' ? "/student/assessments" : "/assessments",
      roles: ['super-admin', 'college-admin', 'faculty', 'student']
    },
    {
      title: "Question Bank",
      href: "/question-bank",
      roles: ['super-admin', 'college-admin', 'faculty']
    },
    {
      title: "Analytics",
      href: "/analytics/dashboard",
      roles: ['super-admin', 'college-admin', 'faculty', 'student']
    }
  ];

  const adminItems = [
    {
      title: "Colleges",
      href: "/admin/colleges",
      icon: Building,
      roles: ['super-admin']
    },
    {
      title: "Users",
      href: "/admin/users",
      icon: Users,
      roles: ['super-admin']
    },
    {
      title: "Trainers",
      href: "/admin/faculty",
      icon: GraduationCap,
      roles: ['super-admin', 'college-admin']
    },
    {
      title: "Coding Profiles",
      href: "/admin/coding-profiles",
      icon: Code,
      roles: ['super-admin']
    }
  ];

  const filteredNavigationItems = navigationItems.filter(item => 
    item.roles.includes(user?.role)
  );

  const filteredAdminItems = adminItems.filter(item => 
    item.roles.includes(user?.role)
  );

  const hasAdminAccess = filteredAdminItems.length > 0;

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 shadow-sm">
      <div className="container flex h-16 max-w-screen-2xl items-center justify-between px-6">
        <div className="flex items-center">
          <Link to="/" className="mr-10 flex items-center space-x-3">
            <div className="relative">
              <BookOpenText className="h-8 w-8 text-primary drop-shadow-sm" />
              <div className="absolute -inset-1 bg-gradient-to-r from-primary/20 to-purple-500/20 rounded-full blur-sm"></div>
            </div>
            <span className="font-bold text-2xl bg-clip-text text-transparent bg-gradient-to-r from-primary via-purple-600 to-pink-600 drop-shadow-sm">
              EduHorizon
            </span>
          </Link>
          
          <nav className="flex items-center space-x-2">
            {user && filteredNavigationItems.map((item) => {
              const href = item.title === "Assessments" && user?.role === 'student' 
                ? "/student/assessments" 
                : item.href;
              return (
                <Link
                  key={item.href}
                  to={href}
                  className={getLinkClasses(href)}
                  {...getAriaAttributes(href)}
                >
                  <span className="relative z-10">{item.title}</span>
                  {isActiveLink(href) && (
                    <div className="absolute inset-0 bg-gradient-to-r from-primary/10 to-purple-500/10 rounded-lg animate-pulse"></div>
                  )}
                </Link>
              );
            })}
            
            {/* Admin Dropdown */}
            {user && hasAdminAccess && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button 
                    variant="ghost" 
                    className={`relative text-sm font-medium transition-all duration-300 px-4 py-2 rounded-lg ${
                      isActiveLink('/admin/colleges') || isActiveLink('/admin/users') || isActiveLink('/admin/faculty') || isActiveLink('/admin/coding-profiles')
                        ? 'text-white bg-gradient-to-r from-primary to-purple-600 shadow-lg transform scale-105'
                        : 'text-muted-foreground hover:text-primary hover:bg-muted/80 hover:shadow-md'
                    }`}
                  >
                    <span className="relative z-10">{getActiveAdminItemTitle()}</span>
                    <ChevronDown className="ml-2 h-4 w-4 relative z-10" />
                    {(isActiveLink('/admin/colleges') || isActiveLink('/admin/users') || isActiveLink('/admin/faculty') || isActiveLink('/admin/coding-profiles')) && (
                      <div className="absolute inset-0 bg-gradient-to-r from-primary/10 to-purple-500/10 rounded-lg animate-pulse"></div>
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-56 p-1">
                  <DropdownMenuGroup>
                    {filteredAdminItems.map((item) => {
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
          </nav>
        </div>
        
        <div className="flex items-center space-x-4">
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
  );
};

export default Header;
