import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Wifi, 
  WifiOff, 
  Download, 
  Upload, 
  Save, 
  RefreshCw, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  Database, 
  Cpu, 
  MemoryStick, 
  HardDrive, 
  Network,
  Zap,
  Shield,
  Activity,
  TrendingUp,
  TrendingDown,
  Pause,
  Play,
  RotateCcw
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// Performance Monitor Hook
export const usePerformanceMonitor = () => {
  const [metrics, setMetrics] = useState({
    memoryUsage: 0,
    cpuUsage: 0,
    networkLatency: 0,
    renderTime: 0,
    bundleSize: 0,
    cacheHitRate: 0
  });

  const [isMonitoring, setIsMonitoring] = useState(false);
  const monitoringRef = useRef(null);

  const startMonitoring = useCallback(() => {
    if (monitoringRef.current) return;

    setIsMonitoring(true);
    
    monitoringRef.current = setInterval(() => {
      // Memory usage
      if (performance.memory) {
        const memoryUsage = (performance.memory.usedJSHeapSize / performance.memory.totalJSHeapSize) * 100;
        setMetrics(prev => ({ ...prev, memoryUsage }));
      }

      // Network latency (simulated)
      const startTime = performance.now();
      fetch('/api/ping', { method: 'HEAD' })
        .then(() => {
          const latency = performance.now() - startTime;
          setMetrics(prev => ({ ...prev, networkLatency: latency }));
        })
        .catch(() => {
          setMetrics(prev => ({ ...prev, networkLatency: -1 }));
        });

      // Render time (simulated)
      const renderStart = performance.now();
      requestAnimationFrame(() => {
        const renderTime = performance.now() - renderStart;
        setMetrics(prev => ({ ...prev, renderTime }));
      });

    }, 1000);
  }, []);

  const stopMonitoring = useCallback(() => {
    if (monitoringRef.current) {
      clearInterval(monitoringRef.current);
      monitoringRef.current = null;
    }
    setIsMonitoring(false);
  }, []);

  useEffect(() => {
    return () => {
      stopMonitoring();
    };
  }, [stopMonitoring]);

  return {
    metrics,
    isMonitoring,
    startMonitoring,
    stopMonitoring
  };
};

// Offline Support Hook
export const useOfflineSupport = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [offlineData, setOfflineData] = useState({});
  const [pendingActions, setPendingActions] = useState([]);
  const [syncStatus, setSyncStatus] = useState('idle'); // idle, syncing, error

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      syncPendingActions();
    };

    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const syncPendingActions = useCallback(async () => {
    if (pendingActions.length === 0) return;

    setSyncStatus('syncing');
    
    try {
      for (const action of pendingActions) {
        await action();
      }
      
      setPendingActions([]);
      setSyncStatus('idle');
    } catch (error) {
      console.error('Sync failed:', error);
      setSyncStatus('error');
    }
  }, [pendingActions]);

  const addOfflineAction = useCallback((action) => {
    if (isOnline) {
      action();
    } else {
      setPendingActions(prev => [...prev, action]);
    }
  }, [isOnline]);

  const saveOfflineData = useCallback((key, data) => {
    const offlineData = { ...data, timestamp: Date.now() };
    localStorage.setItem(`offline_${key}`, JSON.stringify(offlineData));
    setOfflineData(prev => ({ ...prev, [key]: offlineData }));
  }, []);

  const getOfflineData = useCallback((key) => {
    return offlineData[key] || null;
  }, [offlineData]);

  return {
    isOnline,
    offlineData,
    pendingActions,
    syncStatus,
    addOfflineAction,
    saveOfflineData,
    getOfflineData
  };
};

// Lazy Loading Component
export const LazyComponent = ({ 
  children, 
  fallback = <div>Loading...</div>, 
  threshold = 0.1 
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);
  const ref = useRef();

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasLoaded) {
          setIsVisible(true);
          setHasLoaded(true);
        }
      },
      { threshold }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => {
      if (ref.current) {
        observer.unobserve(ref.current);
      }
    };
  }, [threshold, hasLoaded]);

  return (
    <div ref={ref}>
      {isVisible ? children : fallback}
    </div>
  );
};

// Virtual Scrolling Component
export const VirtualList = ({ 
  items, 
  itemHeight, 
  containerHeight, 
  renderItem,
  overscan = 5 
}) => {
  const [scrollTop, setScrollTop] = useState(0);
  const containerRef = useRef();

  const visibleStart = Math.floor(scrollTop / itemHeight);
  const visibleEnd = Math.min(
    visibleStart + Math.ceil(containerHeight / itemHeight) + overscan,
    items.length
  );

  const visibleItems = items.slice(visibleStart, visibleEnd);
  const totalHeight = items.length * itemHeight;
  const offsetY = visibleStart * itemHeight;

  const handleScroll = useCallback((e) => {
    setScrollTop(e.target.scrollTop);
  }, []);

  return (
    <div
      ref={containerRef}
      style={{ height: containerHeight, overflow: 'auto' }}
      onScroll={handleScroll}
    >
      <div style={{ height: totalHeight, position: 'relative' }}>
        <div style={{ transform: `translateY(${offsetY}px)` }}>
          {visibleItems.map((item, index) => (
            <div
              key={visibleStart + index}
              style={{ height: itemHeight }}
            >
              {renderItem(item, visibleStart + index)}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// Performance Metrics Display
const PerformanceMetrics = ({ metrics, isMonitoring, onStart, onStop }) => {
  const getStatusColor = (value, thresholds) => {
    if (value < thresholds.good) return 'text-green-600';
    if (value < thresholds.warning) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getStatusIcon = (value, thresholds) => {
    if (value < thresholds.good) return CheckCircle;
    if (value < thresholds.warning) return AlertTriangle;
    return AlertTriangle;
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center space-x-2">
            <Activity className="h-5 w-5" />
            <span>Performance Metrics</span>
          </CardTitle>
          <div className="flex items-center space-x-2">
            <Badge variant={isMonitoring ? "default" : "outline"}>
              {isMonitoring ? 'Monitoring' : 'Stopped'}
            </Badge>
            <Button
              variant="outline"
              size="sm"
              onClick={isMonitoring ? onStop : onStart}
            >
              {isMonitoring ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {/* Memory Usage */}
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <MemoryStick className="h-4 w-4" />
              <span className="text-sm font-medium">Memory</span>
            </div>
            <div className="space-y-1">
              <div className="flex justify-between text-sm">
                <span>Usage</span>
                <span className={getStatusColor(metrics.memoryUsage, { good: 60, warning: 80 })}>
                  {metrics.memoryUsage.toFixed(1)}%
                </span>
              </div>
              <Progress value={metrics.memoryUsage} className="h-2" />
            </div>
          </div>

          {/* Network Latency */}
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <Network className="h-4 w-4" />
              <span className="text-sm font-medium">Network</span>
            </div>
            <div className="space-y-1">
              <div className="flex justify-between text-sm">
                <span>Latency</span>
                <span className={getStatusColor(metrics.networkLatency, { good: 100, warning: 300 })}>
                  {metrics.networkLatency === -1 ? 'Offline' : `${metrics.networkLatency.toFixed(0)}ms`}
                </span>
              </div>
              <Progress 
                value={metrics.networkLatency === -1 ? 100 : Math.min(metrics.networkLatency / 5, 100)} 
                className="h-2" 
              />
            </div>
          </div>

          {/* Render Time */}
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <Cpu className="h-4 w-4" />
              <span className="text-sm font-medium">Render</span>
            </div>
            <div className="space-y-1">
              <div className="flex justify-between text-sm">
                <span>Time</span>
                <span className={getStatusColor(metrics.renderTime, { good: 16, warning: 33 })}>
                  {metrics.renderTime.toFixed(1)}ms
                </span>
              </div>
              <Progress 
                value={Math.min(metrics.renderTime / 2, 100)} 
                className="h-2" 
              />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

// Offline Status Indicator
const OfflineStatusIndicator = ({ isOnline, syncStatus, pendingActions }) => {
  const getStatusColor = () => {
    if (!isOnline) return 'text-red-600 bg-red-100';
    if (syncStatus === 'syncing') return 'text-yellow-600 bg-yellow-100';
    if (syncStatus === 'error') return 'text-red-600 bg-red-100';
    return 'text-green-600 bg-green-100';
  };

  const getStatusIcon = () => {
    if (!isOnline) return WifiOff;
    if (syncStatus === 'syncing') return RefreshCw;
    if (syncStatus === 'error') return AlertTriangle;
    return Wifi;
  };

  const getStatusText = () => {
    if (!isOnline) return 'Offline';
    if (syncStatus === 'syncing') return 'Syncing...';
    if (syncStatus === 'error') return 'Sync Error';
    return 'Online';
  };

  const StatusIcon = getStatusIcon();

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="fixed top-4 left-4 z-50"
    >
      <Alert className={`border-2 ${getStatusColor()}`}>
        <StatusIcon className="h-4 w-4" />
        <AlertDescription>
          <div className="flex items-center space-x-2">
            <span className="font-medium">{getStatusText()}</span>
            {pendingActions.length > 0 && (
              <Badge variant="outline">
                {pendingActions.length} pending
              </Badge>
            )}
          </div>
        </AlertDescription>
      </Alert>
    </motion.div>
  );
};

// Cache Management Component
const CacheManagement = () => {
  const [cacheSize, setCacheSize] = useState(0);
  const [cacheItems, setCacheItems] = useState([]);

  useEffect(() => {
    updateCacheInfo();
  }, []);

  const updateCacheInfo = () => {
    // Calculate cache size
    let totalSize = 0;
    const items = [];
    
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('cache_')) {
        const value = localStorage.getItem(key);
        const size = new Blob([value]).size;
        totalSize += size;
        items.push({ key, size, timestamp: Date.now() });
      }
    }
    
    setCacheSize(totalSize);
    setCacheItems(items);
  };

  const clearCache = () => {
    const keysToRemove = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('cache_')) {
        keysToRemove.push(key);
      }
    }
    
    keysToRemove.forEach(key => localStorage.removeItem(key));
    updateCacheInfo();
  };

  const formatBytes = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Database className="h-5 w-5" />
          <span>Cache Management</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Cache Size:</span>
            <span className="font-medium">{formatBytes(cacheSize)}</span>
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Items:</span>
            <span className="font-medium">{cacheItems.length}</span>
          </div>
          
          <Button
            onClick={clearCache}
            variant="outline"
            className="w-full"
          >
            <RotateCcw className="h-4 w-4 mr-2" />
            Clear Cache
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

// Performance Optimization Dashboard
const PerformanceDashboard = () => {
  const { metrics, isMonitoring, startMonitoring, stopMonitoring } = usePerformanceMonitor();
  const { isOnline, syncStatus, pendingActions } = useOfflineSupport();

  return (
    <div className="space-y-6">
      {/* Offline Status */}
      <OfflineStatusIndicator
        isOnline={isOnline}
        syncStatus={syncStatus}
        pendingActions={pendingActions}
      />

      {/* Performance Metrics */}
      <PerformanceMetrics
        metrics={metrics}
        isMonitoring={isMonitoring}
        onStart={startMonitoring}
        onStop={stopMonitoring}
      />

      {/* Cache Management */}
      <CacheManagement />
    </div>
  );
};

export default PerformanceDashboard;



