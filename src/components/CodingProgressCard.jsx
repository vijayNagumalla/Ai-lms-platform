import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Code, Trophy, Star, Target, TrendingUp, 
  ExternalLink, RefreshCw, Award, Zap, BarChart3, Medal, Filter
} from 'lucide-react';
import apiService from '@/services/api';

const CodingProgressCard = ({ userId }) => {
  const [codingProgress, setCodingProgress] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedPlatform, setSelectedPlatform] = useState('');

  useEffect(() => {
    if (userId) {
      loadCodingProgress();
    }
  }, [userId]);

  // Set default platform when data loads
  useEffect(() => {
    if (codingProgress?.platformProgress?.length > 0 && !selectedPlatform) {
      setSelectedPlatform(codingProgress.platformProgress[0].platform_id);
    }
  }, [codingProgress, selectedPlatform]);

  const loadCodingProgress = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await apiService.getUserCodingProgress(userId);
      
      if (response.success) {
        setCodingProgress(response.data);
      } else {
        setError(`Failed to load coding progress: ${response.message || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error loading coding progress:', error);
      
      if (error.message.includes('Failed to fetch')) {
        setError('Cannot connect to server. Please check if the backend is running.');
      } else if (error.message.includes('404')) {
        setError('API endpoint not found. Please check server configuration.');
      } else if (error.message.includes('401')) {
        setError('Authentication required. Please log in again.');
      } else {
        setError(`Failed to load coding progress: ${error.message}`);
      }
    } finally {
      setLoading(false);
    }
  };

  const refreshProfileData = async () => {
    if (!codingProgress?.platformProgress) return;
    
    setRefreshing(true);
    try {
      const refreshPromises = codingProgress.platformProgress.map(profile => 
        apiService.fetchCodingProfileData(userId, profile.platform_id)
      );
      
      await Promise.all(refreshPromises);
      await loadCodingProgress();
    } catch (error) {
      console.error('Error refreshing profiles:', error);
      setError('Failed to refresh profile data');
    } finally {
      setRefreshing(false);
    }
  };

  const getRatingColor = (rating) => {
    if (rating >= 2000) return 'text-purple-600';
    if (rating >= 1500) return 'text-blue-600';
    if (rating >= 1000) return 'text-green-600';
    if (rating >= 500) return 'text-yellow-600';
    return 'text-gray-600';
  };



  // Filter platforms based on selection
  const filteredPlatforms = selectedPlatform 
    ? (codingProgress?.platformProgress || []).filter(p => p.platform_id === selectedPlatform)
    : codingProgress?.platformProgress || [];

  if (loading) {
    return (
      <Card className="bg-card backdrop-blur-sm border-0 shadow-lg border border-border">
        <CardContent className="p-8">
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-muted-foreground">Loading coding progress...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="bg-card backdrop-blur-sm border-0 shadow-lg border border-border">
        <CardContent className="p-8">
          <div className="text-center py-8">
            <Code className="h-16 w-16 text-red-400 mx-auto mb-4" />
            <p className="text-red-600 text-lg mb-2">Error Loading Progress</p>
            <p className="text-muted-foreground text-sm mb-4">{error}</p>
            <Button onClick={loadCodingProgress} variant="outline">
              <RefreshCw className="h-4 w-4 mr-2" />
              Try Again
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  const summary = codingProgress?.summary || {};
  const platformProgress = codingProgress?.platformProgress || [];

  if (platformProgress.length === 0) {
    return (
      <Card className="bg-card backdrop-blur-sm border-0 shadow-lg border border-border">
        <CardHeader className="bg-muted text-card-foreground rounded-t-lg border-b border-border">
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Code className="h-6 w-6 text-muted-foreground" />
              <span className="text-xl">Coding Progress</span>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-8">
          <div className="text-center py-8">
            <Code className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground text-lg mb-2">No coding profiles yet</p>
            <p className="text-muted-foreground text-sm">Connect your coding platform accounts to see your progress</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-card backdrop-blur-sm border-0 shadow-lg border border-border">
      <CardHeader className="bg-muted text-card-foreground rounded-t-lg border-b border-border">
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Code className="h-6 w-6 text-muted-foreground" />
            <span className="text-xl">Coding Progress</span>
          </div>
          <Button 
            onClick={refreshProfileData} 
            disabled={refreshing} 
            variant="outline" 
            size="sm"
            className="text-xs"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            {refreshing ? 'Refreshing...' : 'Refresh'}
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="overview" className="flex items-center space-x-2">
              <BarChart3 className="h-4 w-4" />
              <span className="hidden sm:inline">Overview</span>
            </TabsTrigger>
            <TabsTrigger value="platforms" className="flex items-center space-x-2">
              <Code className="h-4 w-4" />
              <span className="hidden sm:inline">Platforms</span>
              <Badge variant="secondary" className="ml-1">{platformProgress.length}</Badge>
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            {/* Quick Stats */}
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-4 bg-muted rounded-xl border border-border">
                <div className="text-3xl font-bold text-blue-600">{summary.total_platforms || 0}</div>
                <div className="text-sm text-blue-600 font-medium">Platforms</div>
              </div>
              <div className="text-center p-4 bg-muted rounded-xl border border-border">
                <div className="text-3xl font-bold text-green-600">{summary.total_problems_solved || 0}</div>
                <div className="text-sm text-green-600 font-medium">Problems</div>
              </div>
            </div>

            {/* Difficulty Breakdown */}
            <div className="bg-muted rounded-xl p-6 border border-border">
              <h3 className="text-lg font-semibold text-card-foreground mb-4 flex items-center">
                <Target className="h-5 w-5 mr-2 text-muted-foreground" />
                Total Problems Solved
              </h3>
              <div className="text-center p-6 bg-primary/10 rounded-lg border border-primary/20">
                <div className="text-4xl font-bold text-primary">
                  {platformProgress.reduce((sum, p) => sum + (p.total_solved || 0), 0)}
                </div>
                <div className="text-lg text-primary/80 font-medium">Problems Solved</div>
                {platformProgress.some(p => (p.total_solved || 0) > 0) && (
                  <div className="text-sm text-green-500 font-medium mt-2">Data Retrieved</div>
                )}
              </div>
            </div>
          </TabsContent>

          {/* Platforms Tab */}
          <TabsContent value="platforms" className="space-y-4">
            {/* Platform Filter */}
            <div className="flex items-center space-x-3 p-4 bg-muted rounded-lg border border-border">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium text-card-foreground">Select Platform:</span>
              <Select value={selectedPlatform} onValueChange={setSelectedPlatform}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Choose platform" />
                </SelectTrigger>
                <SelectContent>
                  {platformProgress.map((platform) => (
                    <SelectItem key={platform.platform_id} value={platform.platform_id}>
                      {platform.platform_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-4">
              {filteredPlatforms.map((platform, index) => (
                <div key={platform.id} className="p-6 bg-card rounded-xl border border-border hover:shadow-md transition-shadow">
                  {/* Platform Header */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className="p-3 bg-blue-100 rounded-lg">
                        <Code className="h-6 w-6 text-blue-600" />
                      </div>
                      <div>
                        <h4 className="text-lg font-semibold text-card-foreground">{platform.platform_name}</h4>
                        <p className="text-sm text-muted-foreground">@{platform.username}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-center">
                        <div className={`text-2xl font-bold ${(platform.total_solved || 0) > 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {platform.total_solved || 0}
                        </div>
                        <div className="text-xs text-muted-foreground">Problems</div>
                        {(platform.total_solved || 0) > 0 && (
                          <div className="text-xs text-green-500 font-medium">Retrieved</div>
                        )}
                      </div>
                    </div>
                  </div>



                  {/* Total Problems Solved - Simplified */}
                  <div className="text-center p-4 bg-primary/10 rounded-lg border border-primary/20 mb-4">
                    <div className={`text-3xl font-bold ${(platform.total_solved || 0) > 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {platform.total_solved || 0}
                    </div>
                    <div className="text-sm text-primary/80">Total Problems Solved</div>
                    {(platform.total_solved || 0) > 0 && (
                      <div className="text-sm text-green-500 font-medium mt-1">Data Retrieved</div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center pt-3 border-t border-border space-y-2 sm:space-y-0">
                    <div className="text-xs text-muted-foreground">
                      Last updated: {new Date(platform.last_updated).toLocaleDateString()}
                    </div>
                    <div className="flex space-x-2">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="text-xs"
                        onClick={() => window.open(platform.profile_url || '#', '_blank')}
                      >
                        <ExternalLink className="h-3 w-3 mr-1" />
                        View Profile
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default CodingProgressCard;
