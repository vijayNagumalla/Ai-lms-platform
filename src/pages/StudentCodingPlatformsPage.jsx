import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { useToast } from '@/components/ui/use-toast';
import { 
  RefreshCw, 
  ExternalLink, 
  CheckCircle, 
  XCircle, 
  Clock, 
  AlertCircle,
  TrendingUp,
  Code,
  Award,
  BarChart3,
  Edit,
  Trash2,
  Plus,
  Download,
  Upload,
  User,
  Calendar,
  MapPin,
  GraduationCap,
  BookOpen,
  Star,
  Trophy,
  Zap,
  Target
} from 'lucide-react';
import apiService from '@/services/api';

const StudentCodingPlatformsPage = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [platforms, setPlatforms] = useState([]);
  const [platformStats, setPlatformStats] = useState({});
  const [codingProfiles, setCodingProfiles] = useState([]);
  const [loadingStats, setLoadingStats] = useState(false);
  const [autoLoading, setAutoLoading] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [profileToDelete, setProfileToDelete] = useState(null);
  const [hackerrankDialogOpen, setHackerrankDialogOpen] = useState(false);
  const [selectedHackerrankData, setSelectedHackerrankData] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [statsCache, setStatsCache] = useState(new Map());
  const { toast } = useToast();

  const platformsData = [
    { name: 'leetcode', displayName: 'LeetCode', color: 'bg-orange-100 text-orange-800' },
    { name: 'codechef', displayName: 'CodeChef', color: 'bg-red-100 text-red-800' },
    { name: 'hackerrank', displayName: 'HackerRank', color: 'bg-green-100 text-green-800' },
    { name: 'hackerearth', displayName: 'HackerEarth', color: 'bg-blue-100 text-blue-800' },
    { name: 'geeksforgeeks', displayName: 'GeeksforGeeks', color: 'bg-purple-100 text-purple-800' }
  ];

  useEffect(() => {
    initializePage();
  }, []);

  const initializePage = async () => {
    try {
      setLoading(true);
      // Load user data first
      const userData = await loadUserData();
      // Load platforms first
      await loadPlatforms();
      // Load profiles second
      await loadCodingProfiles();
      // Then load cached stats
      await loadCachedPlatformStats(userData);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to initialize page",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const loadUserData = async () => {
    try {
      const response = await apiService.getProfile();
      if (response.success) {
        setUser(response.data);
        return response.data;
      }
      return null;
    } catch (error) {
      return null;
    }
  };

  const loadPlatforms = async () => {
    try {
      const response = await apiService.getCodingPlatforms();
      if (response.success) {
        setPlatforms(response.data);
      }
    } catch (error) {
      // Silently handle error
    }
  };

  const loadCodingProfiles = async () => {
    try {
      const response = await apiService.getStudentCodingProfiles();
      if (response.success) {
        setCodingProfiles(response.data);
      }
    } catch (error) {
      // Silently handle error
    }
  };

  const loadCachedPlatformStats = async (userData = null) => {
    const currentUser = userData || user;
    if (!currentUser?.id) {
      return;
    }

    try {
      setAutoLoading(true);
      const response = await apiService.getStudentCachedPlatformStatistics();
      
      if (response.success) {
        // Filter out null/undefined values before setting state
        const filteredStats = {};
        Object.entries(response.data.platformStatistics).forEach(([platform, data]) => {
          if (data !== null && data !== undefined) {
            filteredStats[platform] = data;
          }
        });
        
        setPlatformStats(filteredStats);
        setLastUpdated(response.data.lastUpdated);
        
        // Update cache
        setStatsCache(prev => {
          const newCache = new Map(prev);
          newCache.set('cached', {
            data: filteredStats,
            timestamp: Date.now(),
            cached: true
          });
          return newCache;
        });

        toast({
          title: "Cached Data Loaded",
          description: "Loaded your cached platform statistics",
          variant: "default"
        });
      }
    } catch (error) {
      // No cached data available, which is fine
    } finally {
      setAutoLoading(false);
    }
  };

  const fetchPlatformStats = async () => {
    try {
      setLoadingStats(true);
      setAutoLoading(true);
      
      // Use the sync-all endpoint instead of getStudentPlatformStatistics
      const response = await apiService.syncAllProfiles();
      
      if (response.success) {
        toast({
          title: "Success",
          description: `Synced ${response.data.synced} profiles successfully!`,
          variant: "default",
        });
        
        // Reload the cached stats after successful sync
        await loadCachedPlatformStats();
        await loadCodingProfiles();
      } else {
        throw new Error(response.message || 'Failed to sync profiles');
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error.message || "Failed to sync profiles. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoadingStats(false);
      setAutoLoading(false);
    }
  };


  const handleDeleteProfile = (profile) => {
    setProfileToDelete(profile);
    setDeleteDialogOpen(true);
  };

  const confirmDeleteProfile = async () => {
    if (!profileToDelete) return;
    
    try {
      toast({
        title: "Deleting",
        description: "Deleting coding profile...",
      });
      
      const response = await apiService.deleteCodingProfile(profileToDelete.id);
      
      if (response.success) {
        toast({
          title: "Success",
          description: "Coding profile deleted successfully",
        });
        
        // Refresh the profiles and stats
        await loadCodingProfiles();
        if (user?.id) {
          await loadCachedPlatformStats(user);
        }
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete coding profile",
        variant: "destructive",
      });
    } finally {
      setDeleteDialogOpen(false);
      setProfileToDelete(null);
    }
  };

  const handleHackerrankClick = () => {
    const hackerrankData = platformStats.hackerrank;
    if (hackerrankData) {
      setSelectedHackerrankData(hackerrankData);
      setHackerrankDialogOpen(true);
    }
  };

  const getPlatformColor = (platformName) => {
    const platform = platformsData.find(p => p.name === platformName);
    return platform ? platform.color : 'bg-gray-100 text-gray-800';
  };

  const getPlatformDisplayName = (platformName) => {
    const platform = platformsData.find(p => p.name === platformName);
    return platform ? platform.displayName : platformName;
  };

  const getPerformanceColor = (score) => {
    if (score >= 90) return 'text-emerald-600';
    if (score >= 80) return 'text-blue-600';
    if (score >= 70) return 'text-yellow-600';
    if (score >= 60) return 'text-orange-600';
    return 'text-red-600';
  };

  const getPerformanceIcon = (score) => {
    if (score >= 90) return <Trophy className="h-5 w-5 text-yellow-500" />;
    if (score >= 80) return <Star className="h-5 w-5 text-blue-500" />;
    if (score >= 70) return <Award className="h-5 w-5 text-green-500" />;
    if (score >= 60) return <Zap className="h-5 w-5 text-orange-500" />;
    return <Target className="h-5 w-5 text-red-500" />;
  };

  // Merge platform statistics with coding profiles to get profile URLs
  const getMergedPlatformData = useMemo(() => {
    const merged = {};
    
    // Start with platform statistics
    Object.entries(platformStats).forEach(([platform, stats]) => {
      if (stats) {
        merged[platform] = { ...stats };
      }
    });
    
    // Add profile URLs from coding profiles
    if (codingProfiles && codingProfiles.length > 0) {
      codingProfiles.forEach(profile => {
        if (profile.platform_name && merged[profile.platform_name]) {
          merged[profile.platform_name] = {
            ...merged[profile.platform_name],
            username: profile.username,
            profile_url: profile.profile_url,
            profile_id: profile.id,
            sync_status: profile.sync_status,
            sync_error: profile.sync_error
          };
        }
      });
    }
    return merged;
  }, [platformStats, codingProfiles]);

  // Calculate total problems solved across all platforms
  const totalProblemsSolved = useMemo(() => {
    return Object.values(getMergedPlatformData).reduce((total, platformData) => {
      return total + (platformData?.problemsSolved || 0);
    }, 0);
  }, [getMergedPlatformData]);

  // Calculate platform distribution
  const platformDistribution = useMemo(() => {
    const distribution = {};
    Object.entries(getMergedPlatformData).forEach(([platform, data]) => {
      if (data && data.problemsSolved > 0) {
        distribution[platform] = data.problemsSolved;
      }
    });
    return distribution;
  }, [getMergedPlatformData]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-muted-foreground mx-auto"></div>
          <p className="mt-4 text-muted-foreground text-lg">Loading your coding profiles...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="bg-background p-4">
        <div className="max-w-7xl mx-auto">
          {/* Compact Card Layout */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          
          {/* Card 1: Sync Profiles */}
          <Card className="bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-blue-900/20 dark:to-indigo-900/20 border-blue-200 dark:border-blue-800 hover:shadow-lg transition-all duration-300 z-10 h-full flex flex-col">
            <CardContent className="p-4 sm:p-6 flex-1 flex flex-col justify-center">
              <div className="text-center space-y-4">
                <div className="w-16 h-16 mx-auto bg-blue-500 dark:bg-blue-600 rounded-full flex items-center justify-center">
                  <RefreshCw className="h-8 w-8 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-foreground mb-2">Sync Profiles</h3>
                  <p className="text-sm text-muted-foreground mb-4">Sync your existing coding platform profiles</p>
                </div>
                <div className="space-y-2">
                  <Button 
                    onClick={fetchPlatformStats}
                    disabled={loadingStats || autoLoading}
                    variant="outline"
                    className="w-full border-blue-300 dark:border-blue-700 text-blue-700 dark:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/20 text-xs sm:text-sm"
                    size="sm"
                  >
                    {loadingStats || autoLoading ? (
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <RefreshCw className="h-4 w-4 mr-2" />
                    )}
                    Sync All
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Platform Cards - Generate for each platform */}
          {Object.entries(getMergedPlatformData)
            .filter(([platform, data]) => data !== null && data !== undefined)
            .map(([platform, data]) => (
              <Card key={platform} className="hover:shadow-lg transition-all duration-300 transform hover:scale-105 z-10 h-full flex flex-col">
                <CardContent className="p-4 sm:p-6 flex-1 flex flex-col">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-2 sm:space-x-3 flex-1 min-w-0">
                      <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg flex items-center justify-center bg-white dark:bg-white p-1 flex-shrink-0 border border-gray-200 dark:border-gray-300 shadow-sm">
                        <img 
                          src={
                            platform === 'leetcode' ? 'https://upload.wikimedia.org/wikipedia/commons/1/19/LeetCode_logo_black.png' :
                            platform === 'codechef' ? 'https://codechefgcet.github.io/assets/codechef.png' :
                            platform === 'hackerrank' ? 'https://upload.wikimedia.org/wikipedia/commons/6/65/HackerRank_logo.png' :
                            platform === 'hackerearth' ? 'https://upload.wikimedia.org/wikipedia/commons/e/e8/HackerEarth_logo.png' :
                            platform === 'geeksforgeeks' ? 'https://upload.wikimedia.org/wikipedia/commons/e/eb/GeeksForGeeks_logo.png' :
                            ''
                          }
                          alt={`${getPlatformDisplayName(platform)} logo`}
                          className="w-full h-full object-contain"
                          onError={(e) => {
                            // Fallback to colored circle if image fails to load
                            e.target.style.display = 'none';
                            e.target.nextSibling.style.display = 'flex';
                          }}
                        />
                        <div 
                          className="w-full h-full rounded-lg flex items-center justify-center text-white font-bold text-sm sm:text-lg hidden"
                          style={{
                            backgroundColor: platform === 'leetcode' ? '#f97316' :
                                           platform === 'codechef' ? '#dc2626' :
                                           platform === 'hackerrank' ? '#16a34a' :
                                           platform === 'hackerearth' ? '#2563eb' :
                                           platform === 'geeksforgeeks' ? '#9333ea' : '#6b7280'
                          }}
                        >
                          {getPlatformDisplayName(platform).charAt(0)}
                        </div>
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className="font-semibold text-base sm:text-lg text-foreground truncate">{getPlatformDisplayName(platform)}</h3>
                        <p className="text-xs sm:text-sm text-muted-foreground truncate">
                          {data?.username || 'No username'}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex space-x-1 flex-shrink-0">
                      {data?.profile_url ? (
                        <div className="flex items-center space-x-1">
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => window.open(data.profile_url, '_blank')}
                                className="h-8 w-8 p-0 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                              >
                                <ExternalLink className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent 
                              className="z-[9999] bg-gray-900 text-white px-2 py-1 rounded text-sm" 
                              side="right"
                              align="center"
                            >
                              <p>View Profile</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                          
                          {/* X mark for failed sync */}
                          {data?.sync_status === 'failed' && (
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <div className="cursor-help">
                                    <span className="text-red-500 text-lg">❌</span>
                                  </div>
                                </TooltipTrigger>
                                <TooltipContent 
                                  className="z-[9999] bg-red-600 text-white px-2 py-1 rounded text-xs" 
                                  side="right"
                                  align="center"
                                >
                                  <p>
                                    Sync failed - Kindly solve a problem or reach out to Admin
                                  </p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          )}
                        </div>
                      ) : (
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => {
                                  toast({
                                    title: "Edit Profile",
                                    description: "Please use the Super Admin panel to edit profiles.",
                                    variant: "default",
                                  });
                                }}
                                className="h-8 w-8 p-0 text-orange-600 hover:text-orange-700 hover:bg-orange-50"
                              >
                                <Plus className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent 
                              className="z-[9999] bg-orange-600 text-white px-2 py-1 rounded text-sm" 
                              side="right"
                              align="center"
                            >
                              <p>Edit Profile</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      )}
                      
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleDeleteProfile({ id: data.profile_id, platform })}
                              className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent 
                            className="z-[9999] bg-red-600 text-white px-2 py-1 rounded text-sm" 
                            side="right"
                            align="center"
                          >
                            <p>Delete Profile</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                  </div>

                  {/* Problems Solved / Badges */}
                  <div className="text-center mb-4 flex-1 flex flex-col justify-center">
                    <div className="text-2xl sm:text-3xl font-bold text-foreground mb-1">
                      {platform === 'hackerrank' 
                        ? (data?.badges?.length || 0)
                        : (data?.problemsSolved || 0)
                      }
                    </div>
                    <div className="text-xs sm:text-sm text-muted-foreground">
                      {platform === 'hackerrank' ? 'Badges Earned' : 'Problems Solved'}
                    </div>
                  </div>

                  {/* Platform-specific details */}
                  {(platform === 'leetcode' || platform === 'geeksforgeeks') && data?.easySolved !== undefined && (
                    <div className="grid grid-cols-3 gap-1 sm:gap-2 text-center mt-auto">
                      <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-1 sm:p-2">
                        <div className="text-green-600 dark:text-green-400 font-bold text-xs sm:text-sm">{data?.easySolved || 0}</div>
                        <div className="text-green-600 dark:text-green-400 text-xs">Easy</div>
                      </div>
                      <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-1 sm:p-2">
                        <div className="text-yellow-600 dark:text-yellow-400 font-bold text-xs sm:text-sm">{data?.mediumSolved || 0}</div>
                        <div className="text-yellow-600 dark:text-yellow-400 text-xs">Medium</div>
                      </div>
                      <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-1 sm:p-2">
                        <div className="text-red-600 dark:text-red-400 font-bold text-xs sm:text-sm">{data?.hardSolved || 0}</div>
                        <div className="text-red-600 dark:text-red-400 text-xs">Hard</div>
                      </div>
                    </div>
                  )}

                  {platform === 'hackerrank' && data?.badges && data.badges.length > 0 && (
                    <div className="mt-3 mt-auto">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-medium text-muted-foreground">Badges ({data.badges.length})</span>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={handleHackerrankClick}
                          className="text-xs h-6 px-2 text-blue-600 hover:text-blue-700"
                        >
                          View
                        </Button>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {data.badges.slice(0, 2).map((badge, index) => (
                          <Badge key={index} variant="outline" className="text-xs px-1 py-0">
                            {badge?.name || 'Unknown'} ({badge?.stars || 0}⭐)
                          </Badge>
                        ))}
                        {data.badges.length > 2 && (
                          <Badge variant="outline" className="text-xs px-1 py-0">
                            +{data.badges.length - 2}
                          </Badge>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Warning for profiles that need setup */}
                  {(!data?.username || !data?.profile_url) && (
                    <div className="mt-3 p-2 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg">
                      <p className="text-xs text-orange-700 dark:text-orange-300 text-center">
                        ⚠️ Profile needs setup
                      </p>
                    </div>
                  )}

                </CardContent>
              </Card>
            ))}

          </div>
        </div>
      </div>

      {/* HackerRank Details Dialog */}
      <Dialog open={hackerrankDialogOpen} onOpenChange={setHackerrankDialogOpen}>
        <DialogContent className="max-w-md mx-4 sm:mx-0">
          <DialogHeader>
            <DialogTitle className="text-lg">HackerRank Badges</DialogTitle>
          </DialogHeader>
          {selectedHackerrankData ? (
            <div className="space-y-2">
              {selectedHackerrankData.badges && Array.isArray(selectedHackerrankData.badges) && selectedHackerrankData.badges.length > 0 ? (
                <div className="space-y-1">
                  {selectedHackerrankData.badges.map((badge, index) => {
                    const level = (badge.level || '').toLowerCase();
                    const getThemeColors = (level) => {
                      switch (level) {
                        case 'bronze':
                          return {
                            bg: 'bg-orange-100 dark:bg-orange-900/20',
                            border: 'border-orange-300 dark:border-orange-800',
                            text: 'text-orange-900 dark:text-orange-300',
                            accent: 'text-orange-700 dark:text-orange-400'
                          };
                        case 'silver':
                          return {
                            bg: 'bg-gray-100 dark:bg-gray-800/20',
                            border: 'border-gray-300 dark:border-gray-700',
                            text: 'text-gray-900 dark:text-gray-300',
                            accent: 'text-gray-700 dark:text-gray-400'
                          };
                        case 'gold':
                          return {
                            bg: 'bg-yellow-100 dark:bg-yellow-900/20',
                            border: 'border-yellow-300 dark:border-yellow-800',
                            text: 'text-yellow-900 dark:text-yellow-300',
                            accent: 'text-yellow-700 dark:text-yellow-400'
                          };
                        case 'platinum':
                          return {
                            bg: 'bg-blue-100 dark:bg-blue-900/20',
                            border: 'border-blue-300 dark:border-blue-800',
                            text: 'text-blue-900 dark:text-blue-300',
                            accent: 'text-blue-600 dark:text-blue-400'
                          };
                        default:  
                          return {
                            bg: 'bg-gray-100 dark:bg-gray-800/20',
                            border: 'border-gray-300 dark:border-gray-700',
                            text: 'text-gray-900 dark:text-gray-300',
                            accent: 'text-gray-700 dark:text-gray-400'
                          };
                      }
                    };
                    const theme = getThemeColors(level);
                    
                    return (
                      <div key={index} className={`flex items-center justify-between p-2 ${theme.bg} border ${theme.border} rounded-md`}>
                        <div className="flex-1">
                          <div className={`text-sm font-medium ${theme.text}`}>{badge.name || 'Unknown Badge'}</div>
                          <div className={`text-xs ${theme.accent}`}>
                            {badge.stars ? `${badge.stars} ⭐` : 'No stars'}
                          </div>
                        </div>
                        <div className={`text-xs font-medium ${theme.accent} px-2 py-1 rounded-full ${theme.bg}`}>
                          {level.toUpperCase()}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-4 text-muted-foreground">
                  <p className="text-sm">No badges available</p>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-4 text-muted-foreground">
              <p className="text-sm">No HackerRank data available</p>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Coding Profile</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this coding profile? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeleteProfile}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete Profile
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default StudentCodingPlatformsPage;
