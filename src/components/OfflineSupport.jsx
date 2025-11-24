import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Alert, AlertDescription } from './ui/alert';
import { 
    Wifi, 
    WifiOff, 
    Cloud, 
    CloudOff, 
    Download, 
    Upload, 
    RefreshCw,
    AlertTriangle,
    CheckCircle,
    XCircle,
    Clock,
    Database,
    HardDrive,
    Sync,
    Archive,
    Trash2,
    Settings,
    Eye,
    EyeOff
} from 'lucide-react';
import { toast } from 'react-hot-toast';

const OfflineSupport = ({ 
    submissionId,
    assessmentId,
    onOfflineSupportViewed,
    showLocalStorage = true,
    showSyncStatus = true,
    showOfflineMode = true,
    showDataRecovery = true
}) => {
    const [offlineSupport, setOfflineSupport] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isOnline, setIsOnline] = useState(navigator.onLine);
    const [showDetails, setShowDetails] = useState(false);
    const [syncStatus, setSyncStatus] = useState('idle'); // idle, syncing, success, error
    const [localStorage, setLocalStorage] = useState({});
    const [syncQueue, setSyncQueue] = useState([]);

    useEffect(() => {
        loadOfflineSupport();
        
        // Listen for online/offline events
        const handleOnline = () => setIsOnline(true);
        const handleOffline = () => setIsOnline(false);
        
        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);
        
        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, [submissionId]);

    useEffect(() => {
        if (isOnline && syncQueue.length > 0) {
            syncPendingChanges();
        }
    }, [isOnline, syncQueue]);

    const loadOfflineSupport = async () => {
        try {
            setIsLoading(true);
            
            const response = await fetch('/api/assessment/offline-support', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    submissionId, 
                    assessmentId,
                    showLocalStorage,
                    showSyncStatus,
                    showOfflineMode,
                    showDataRecovery
                })
            });

            if (!response.ok) throw new Error('Failed to load offline support');
            
            const data = await response.json();
            setOfflineSupport(data.offlineSupport);
            setLocalStorage(data.localStorage || {});
            setSyncQueue(data.syncQueue || []);
            
            if (onOfflineSupportViewed) {
                onOfflineSupportViewed(data);
            }
            
        } catch (error) {
            console.error('Error loading offline support:', error);
            toast.error('Failed to load offline support');
        } finally {
            setIsLoading(false);
        }
    };

    const syncPendingChanges = async () => {
        try {
            setSyncStatus('syncing');
            
            const response = await fetch('/api/assessment/sync-pending-changes', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    submissionId,
                    changes: syncQueue
                })
            });

            if (!response.ok) throw new Error('Sync failed');
            
            const result = await response.json();
            setSyncStatus('success');
            setSyncQueue([]);
            
            toast.success('Successfully synced pending changes');
            
            // Reload offline support
            loadOfflineSupport();
            
        } catch (error) {
            console.error('Sync error:', error);
            setSyncStatus('error');
            toast.error('Sync failed');
        }
    };

    const clearLocalStorage = async () => {
        try {
            const response = await fetch('/api/assessment/clear-local-storage', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    submissionId
                })
            });

            if (!response.ok) throw new Error('Clear failed');
            
            toast.success('Local storage cleared');
            
            // Reload offline support
            loadOfflineSupport();
            
        } catch (error) {
            console.error('Clear error:', error);
            toast.error('Clear failed');
        }
    };

    const recoverData = async () => {
        try {
            const response = await fetch('/api/assessment/recover-data', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    submissionId
                })
            });

            if (!response.ok) throw new Error('Recovery failed');
            
            const result = await response.json();
            toast.success('Data recovery completed');
            
            // Reload offline support
            loadOfflineSupport();
            
        } catch (error) {
            console.error('Recovery error:', error);
            toast.error('Recovery failed');
        }
    };

    const getConnectionIcon = () => {
        return isOnline ? 
            <Wifi className="w-5 h-5 text-green-500" /> : 
            <WifiOff className="w-5 h-5 text-red-500" />;
    };

    const getConnectionBadge = () => {
        return isOnline ? 
            <Badge className="bg-green-100 text-green-800">Online</Badge> : 
            <Badge className="bg-red-100 text-red-800">Offline</Badge>;
    };

    const getSyncIcon = () => {
        switch (syncStatus) {
            case 'syncing':
                return <RefreshCw className="w-4 h-4 text-blue-500 animate-spin" />;
            case 'success':
                return <CheckCircle className="w-4 h-4 text-green-500" />;
            case 'error':
                return <XCircle className="w-4 h-4 text-red-500" />;
            default:
                return <Sync className="w-4 h-4 text-gray-500" />;
        }
    };

    const getSyncBadge = () => {
        switch (syncStatus) {
            case 'syncing':
                return <Badge className="bg-blue-100 text-blue-800">Syncing</Badge>;
            case 'success':
                return <Badge className="bg-green-100 text-green-800">Synced</Badge>;
            case 'error':
                return <Badge className="bg-red-100 text-red-800">Error</Badge>;
            default:
                return <Badge className="bg-gray-100 text-gray-800">Idle</Badge>;
        }
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });
    };

    const formatFileSize = (bytes) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    if (!offlineSupport) {
        return (
            <div className="text-center py-8">
                <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                <p className="text-gray-500">No offline support data available</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="text-center">
                <h2 className="text-3xl font-bold text-gray-900">Offline Support</h2>
                <p className="text-gray-600 mt-2">Manage offline data storage and synchronization</p>
            </div>

            {/* Connection Status */}
            <Card className={isOnline ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}>
                <CardContent className="p-6">
                    <div className="flex items-center justify-center space-x-3">
                        {getConnectionIcon()}
                        <div className="text-center">
                            <h3 className={`text-xl font-bold ${isOnline ? 'text-green-800' : 'text-red-800'}`}>
                                {isOnline ? 'Online' : 'Offline'}
                            </h3>
                            <p className={`text-sm ${isOnline ? 'text-green-600' : 'text-red-600'}`}>
                                {isOnline ? 'Connected to server' : 'Working offline'}
                            </p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Offline Support Overview */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center">
                            <div className="p-2 bg-blue-100 rounded-lg">
                                <Database className="w-6 h-6 text-blue-600" />
                            </div>
                            <div className="ml-4">
                                <p className="text-sm font-medium text-gray-600">Local Storage</p>
                                <p className="text-2xl font-bold text-gray-900">
                                    {offlineSupport.localStorageSize || 0}
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center">
                            <div className="p-2 bg-green-100 rounded-lg">
                                <Cloud className="w-6 h-6 text-green-600" />
                            </div>
                            <div className="ml-4">
                                <p className="text-sm font-medium text-gray-600">Synced Data</p>
                                <p className="text-2xl font-bold text-gray-900">
                                    {offlineSupport.syncedDataSize || 0}
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center">
                            <div className="p-2 bg-orange-100 rounded-lg">
                                <Clock className="w-6 h-6 text-orange-600" />
                            </div>
                            <div className="ml-4">
                                <p className="text-sm font-medium text-gray-600">Pending Sync</p>
                                <p className="text-2xl font-bold text-gray-900">
                                    {syncQueue.length}
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center">
                            <div className="p-2 bg-purple-100 rounded-lg">
                                <HardDrive className="w-6 h-6 text-purple-600" />
                            </div>
                            <div className="ml-4">
                                <p className="text-sm font-medium text-gray-600">Storage Used</p>
                                <p className="text-2xl font-bold text-gray-900">
                                    {formatFileSize(offlineSupport.storageUsed || 0)}
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Sync Status */}
            {showSyncStatus && (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center space-x-2">
                            {getSyncIcon()}
                            <span>Sync Status</span>
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-3">
                                    {getSyncIcon()}
                                    <div>
                                        <h4 className="font-medium text-gray-900">Synchronization</h4>
                                        <p className="text-sm text-gray-600">
                                            {syncStatus === 'syncing' ? 'Syncing data...' :
                                             syncStatus === 'success' ? 'Data synced successfully' :
                                             syncStatus === 'error' ? 'Sync failed' :
                                             'Ready to sync'}
                                        </p>
                                    </div>
                                </div>
                                
                                <div className="flex items-center space-x-2">
                                    {getSyncBadge()}
                                    <Button
                                        onClick={syncPendingChanges}
                                        disabled={!isOnline || syncStatus === 'syncing'}
                                        variant="outline"
                                        size="sm"
                                    >
                                        <Sync className="w-4 h-4 mr-2" />
                                        Sync Now
                                    </Button>
                                </div>
                            </div>
                            
                            {offlineSupport.lastSync && (
                                <div className="p-3 border rounded-lg bg-gray-50">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-600">Last Sync:</span>
                                        <span className="font-medium">{formatDate(offlineSupport.lastSync)}</span>
                                    </div>
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Local Storage */}
            {showLocalStorage && localStorage && (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center space-x-2">
                            <HardDrive className="w-5 h-5" />
                            <span>Local Storage</span>
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="text-center">
                                    <p className="text-2xl font-bold text-blue-600">
                                        {localStorage.totalItems || 0}
                                    </p>
                                    <p className="text-sm text-gray-600">Total Items</p>
                                </div>
                                
                                <div className="text-center">
                                    <p className="text-2xl font-bold text-green-600">
                                        {formatFileSize(localStorage.usedSpace || 0)}
                                    </p>
                                    <p className="text-sm text-gray-600">Used Space</p>
                                </div>
                                
                                <div className="text-center">
                                    <p className="text-2xl font-bold text-purple-600">
                                        {formatFileSize(localStorage.availableSpace || 0)}
                                    </p>
                                    <p className="text-sm text-gray-600">Available Space</p>
                                </div>
                            </div>
                            
                            {localStorage.items && localStorage.items.length > 0 && (
                                <div>
                                    <h4 className="font-medium text-gray-900 mb-2">Stored Items</h4>
                                    <div className="space-y-2">
                                        {localStorage.items.map((item, index) => (
                                            <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                                                <div className="flex items-center space-x-3">
                                                    <Database className="w-4 h-4 text-gray-500" />
                                                    <div>
                                                        <p className="font-medium text-gray-900">{item.name}</p>
                                                        <p className="text-sm text-gray-600">{item.type}</p>
                                                    </div>
                                                </div>
                                                
                                                <div className="text-right">
                                                    <p className="text-sm font-medium">{formatFileSize(item.size)}</p>
                                                    <p className="text-xs text-gray-500">{formatDate(item.lastModified)}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Sync Queue */}
            {syncQueue.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center space-x-2">
                            <Clock className="w-5 h-5" />
                            <span>Sync Queue</span>
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {syncQueue.map((item, index) => (
                                <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                                    <div className="flex items-center space-x-3">
                                        <Clock className="w-4 h-4 text-orange-500" />
                                        <div>
                                            <p className="font-medium text-gray-900">{item.type}</p>
                                            <p className="text-sm text-gray-600">{item.description}</p>
                                        </div>
                                    </div>
                                    
                                    <div className="text-right">
                                        <p className="text-sm font-medium">{formatDate(item.timestamp)}</p>
                                        <Badge className="bg-orange-100 text-orange-800">
                                            Pending
                                        </Badge>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Offline Mode */}
            {showOfflineMode && (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center space-x-2">
                            <WifiOff className="w-5 h-5" />
                            <span>Offline Mode</span>
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            <div className="p-4 border rounded-lg bg-gray-50">
                                <h4 className="font-medium text-gray-900 mb-2">Offline Capabilities</h4>
                                <ul className="list-disc list-inside space-y-1 text-sm text-gray-700">
                                    <li>Continue working on assessments without internet</li>
                                    <li>Auto-save answers to local storage</li>
                                    <li>Access previously loaded questions</li>
                                    <li>View assessment instructions and rules</li>
                                </ul>
                            </div>
                            
                            <div className="p-4 border rounded-lg bg-yellow-50">
                                <h4 className="font-medium text-gray-900 mb-2">Limitations</h4>
                                <ul className="list-disc list-inside space-y-1 text-sm text-gray-700">
                                    <li>Cannot submit assessments while offline</li>
                                    <li>Cannot access new questions or sections</li>
                                    <li>Cannot sync with server</li>
                                    <li>Limited proctoring features</li>
                                </ul>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Data Recovery */}
            {showDataRecovery && (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center space-x-2">
                            <Archive className="w-5 h-5" />
                            <span>Data Recovery</span>
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            <div className="p-4 border rounded-lg bg-blue-50">
                                <h4 className="font-medium text-gray-900 mb-2">Recovery Options</h4>
                                <p className="text-sm text-gray-700 mb-3">
                                    Recover lost data from local storage or server backups
                                </p>
                                
                                <div className="flex space-x-2">
                                    <Button
                                        onClick={recoverData}
                                        variant="outline"
                                        size="sm"
                                    >
                                        <Archive className="w-4 h-4 mr-2" />
                                        Recover Data
                                    </Button>
                                    
                                    <Button
                                        onClick={clearLocalStorage}
                                        variant="outline"
                                        size="sm"
                                        className="text-red-600 hover:text-red-700"
                                    >
                                        <Trash2 className="w-4 h-4 mr-2" />
                                        Clear Storage
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Actions */}
            <div className="flex justify-center space-x-4">
                <Button 
                    onClick={syncPendingChanges}
                    disabled={!isOnline || syncStatus === 'syncing'}
                    variant="outline"
                >
                    <Sync className="w-4 h-4 mr-2" />
                    Sync Now
                </Button>
                
                <Button 
                    onClick={loadOfflineSupport}
                    variant="outline"
                >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Refresh
                </Button>
                
                <Button 
                    onClick={() => setShowDetails(!showDetails)}
                    variant="outline"
                >
                    {showDetails ? <EyeOff className="w-4 h-4 mr-2" /> : <Eye className="w-4 h-4 mr-2" />}
                    {showDetails ? 'Hide Details' : 'Show Details'}
                </Button>
            </div>
        </div>
    );
};

export default OfflineSupport;
