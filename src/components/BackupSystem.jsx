import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Alert, AlertDescription } from './ui/alert';
import { 
    Database, 
    Cloud, 
    HardDrive, 
    Archive, 
    Download, 
    Upload, 
    RefreshCw,
    AlertTriangle,
    CheckCircle,
    XCircle,
    Clock,
    Settings,
    Trash2,
    RotateCcw,
    Shield,
    Key,
    Lock,
    Unlock,
    Eye,
    EyeOff,
    Filter,
    Search,
    Calendar,
    Activity
} from 'lucide-react';
import { toast } from 'react-hot-toast';

const BackupSystem = ({ 
    submissionId,
    assessmentId,
    onBackupSystemViewed,
    showBackupHistory = true,
    showRecoveryOptions = true,
    showBackupSettings = true,
    showStorageAnalytics = true
}) => {
    const [backupSystem, setBackupSystem] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [showDetails, setShowDetails] = useState(false);
    const [filterType, setFilterType] = useState('all'); // all, local, cloud, encrypted, unencrypted
    const [searchTerm, setSearchTerm] = useState('');
    const [filteredBackups, setFilteredBackups] = useState([]);
    const [backupSettings, setBackupSettings] = useState({});
    const [storageAnalytics, setStorageAnalytics] = useState({});

    useEffect(() => {
        loadBackupSystem();
    }, [submissionId]);

    useEffect(() => {
        filterBackups();
    }, [backupSystem, filterType, searchTerm]);

    const loadBackupSystem = async () => {
        try {
            setIsLoading(true);
            
            const response = await fetch('/api/assessment/backup-system', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    submissionId, 
                    assessmentId,
                    showBackupHistory,
                    showRecoveryOptions,
                    showBackupSettings,
                    showStorageAnalytics
                })
            });

            if (!response.ok) throw new Error('Failed to load backup system');
            
            const data = await response.json();
            setBackupSystem(data.backupSystem);
            setBackupSettings(data.backupSettings);
            setStorageAnalytics(data.storageAnalytics);
            
            if (onBackupSystemViewed) {
                onBackupSystemViewed(data);
            }
            
        } catch (error) {
            console.error('Error loading backup system:', error);
            toast.error('Failed to load backup system');
        } finally {
            setIsLoading(false);
        }
    };

    const filterBackups = () => {
        if (!backupSystem?.backups) return;
        
        let filtered = backupSystem.backups;
        
        // Filter by type
        if (filterType !== 'all') {
            filtered = filtered.filter(backup => {
                switch (filterType) {
                    case 'local':
                        return backup.type === 'local';
                    case 'cloud':
                        return backup.type === 'cloud';
                    case 'encrypted':
                        return backup.encrypted;
                    case 'unencrypted':
                        return !backup.encrypted;
                    default:
                        return true;
                }
            });
        }
        
        // Filter by search term
        if (searchTerm) {
            filtered = filtered.filter(backup => 
                backup.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                backup.description?.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }
        
        setFilteredBackups(filtered);
    };

    const getBackupIcon = (type) => {
        switch (type) {
            case 'local':
                return <HardDrive className="w-4 h-4 text-blue-500" />;
            case 'cloud':
                return <Cloud className="w-4 h-4 text-green-500" />;
            case 'encrypted':
                return <Lock className="w-4 h-4 text-purple-500" />;
            default:
                return <Database className="w-4 h-4 text-gray-500" />;
        }
    };

    const getBackupBadge = (type) => {
        switch (type) {
            case 'local':
                return <Badge className="bg-blue-100 text-blue-800">Local</Badge>;
            case 'cloud':
                return <Badge className="bg-green-100 text-green-800">Cloud</Badge>;
            case 'encrypted':
                return <Badge className="bg-purple-100 text-purple-800">Encrypted</Badge>;
            default:
                return <Badge className="bg-gray-100 text-gray-800">Unknown</Badge>;
        }
    };

    const getStatusIcon = (status) => {
        switch (status) {
            case 'success':
                return <CheckCircle className="w-4 h-4 text-green-500" />;
            case 'failed':
                return <XCircle className="w-4 h-4 text-red-500" />;
            case 'in-progress':
                return <RefreshCw className="w-4 h-4 text-blue-500 animate-spin" />;
            default:
                return <AlertTriangle className="w-4 h-4 text-gray-500" />;
        }
    };

    const getStatusBadge = (status) => {
        switch (status) {
            case 'success':
                return <Badge className="bg-green-100 text-green-800">Success</Badge>;
            case 'failed':
                return <Badge className="bg-red-100 text-red-800">Failed</Badge>;
            case 'in-progress':
                return <Badge className="bg-blue-100 text-blue-800">In Progress</Badge>;
            default:
                return <Badge className="bg-gray-100 text-gray-800">Unknown</Badge>;
        }
    };

    const createBackup = async (type = 'local') => {
        try {
            const response = await fetch('/api/assessment/create-backup', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    submissionId,
                    type
                })
            });

            if (!response.ok) throw new Error('Backup creation failed');
            
            const result = await response.json();
            toast.success('Backup created successfully');
            
            // Reload backup system
            loadBackupSystem();
            
        } catch (error) {
            console.error('Backup creation error:', error);
            toast.error('Backup creation failed');
        }
    };

    const restoreBackup = async (backupId) => {
        try {
            const response = await fetch('/api/assessment/restore-backup', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    submissionId,
                    backupId
                })
            });

            if (!response.ok) throw new Error('Backup restoration failed');
            
            const result = await response.json();
            toast.success('Backup restored successfully');
            
            // Reload backup system
            loadBackupSystem();
            
        } catch (error) {
            console.error('Backup restoration error:', error);
            toast.error('Backup restoration failed');
        }
    };

    const deleteBackup = async (backupId) => {
        try {
            const response = await fetch('/api/assessment/delete-backup', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    submissionId,
                    backupId
                })
            });

            if (!response.ok) throw new Error('Backup deletion failed');
            
            const result = await response.json();
            toast.success('Backup deleted successfully');
            
            // Reload backup system
            loadBackupSystem();
            
        } catch (error) {
            console.error('Backup deletion error:', error);
            toast.error('Backup deletion failed');
        }
    };

    const downloadBackup = async (backupId, format = 'json') => {
        try {
            const response = await fetch('/api/assessment/download-backup', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    submissionId,
                    backupId,
                    format
                })
            });

            if (!response.ok) throw new Error('Download failed');
            
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `backup_${backupId}_${format}_${Date.now()}.${format}`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
            
            toast.success(`${format.toUpperCase()} download started`);
        } catch (error) {
            console.error('Download error:', error);
            toast.error('Download failed');
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

    if (!backupSystem) {
        return (
            <div className="text-center py-8">
                <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                <p className="text-gray-500">No backup system data available</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="text-center">
                <h2 className="text-3xl font-bold text-gray-900">Backup System</h2>
                <p className="text-gray-600 mt-2">Manage and restore critical assessment data</p>
            </div>

            {/* Backup System Overview */}
            <Card className="border-blue-200 bg-blue-50">
                <CardContent className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-center">
                        <div>
                            <h3 className="text-2xl font-bold text-blue-800">
                                {backupSystem.totalBackups || 0}
                            </h3>
                            <p className="text-sm text-blue-600">Total Backups</p>
                        </div>
                        <div>
                            <h3 className="text-2xl font-bold text-blue-800">
                                {backupSystem.localBackups || 0}
                            </h3>
                            <p className="text-sm text-blue-600">Local Backups</p>
                        </div>
                        <div>
                            <h3 className="text-2xl font-bold text-blue-800">
                                {backupSystem.cloudBackups || 0}
                            </h3>
                            <p className="text-sm text-blue-600">Cloud Backups</p>
                        </div>
                        <div>
                            <h3 className="text-2xl font-bold text-blue-800">
                                {backupSystem.encryptedBackups || 0}
                            </h3>
                            <p className="text-sm text-blue-600">Encrypted Backups</p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Storage Analytics */}
            {showStorageAnalytics && storageAnalytics && (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center space-x-2">
                            <Database className="w-5 h-5" />
                            <span>Storage Analytics</span>
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="text-center">
                                    <p className="text-2xl font-bold text-blue-600">
                                        {formatFileSize(storageAnalytics.totalStorage || 0)}
                                    </p>
                                    <p className="text-sm text-gray-600">Total Storage</p>
                                </div>
                                
                                <div className="text-center">
                                    <p className="text-2xl font-bold text-green-600">
                                        {formatFileSize(storageAnalytics.usedStorage || 0)}
                                    </p>
                                    <p className="text-sm text-gray-600">Used Storage</p>
                                </div>
                                
                                <div className="text-center">
                                    <p className="text-2xl font-bold text-purple-600">
                                        {formatFileSize(storageAnalytics.availableStorage || 0)}
                                    </p>
                                    <p className="text-sm text-gray-600">Available Storage</p>
                                </div>
                            </div>
                            
                            {storageAnalytics.storageBreakdown && (
                                <div>
                                    <h4 className="font-medium text-gray-900 mb-2">Storage Breakdown</h4>
                                    <div className="space-y-2">
                                        {storageAnalytics.storageBreakdown.map((item, index) => (
                                            <div key={index} className="flex items-center justify-between">
                                                <span className="text-sm text-gray-600">{item.type}</span>
                                                <div className="flex items-center space-x-2">
                                                    <div className="w-32 bg-gray-200 rounded-full h-2">
                                                        <div 
                                                            className="bg-blue-600 h-2 rounded-full" 
                                                            style={{ width: `${item.percentage}%` }}
                                                        ></div>
                                                    </div>
                                                    <span className="text-sm font-medium">{item.percentage}%</span>
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

            {/* Backup Settings */}
            {showBackupSettings && backupSettings && (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center space-x-2">
                            <Settings className="w-5 h-5" />
                            <span>Backup Settings</span>
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="p-4 border rounded-lg">
                                    <h4 className="font-medium text-gray-900 mb-2">Auto Backup</h4>
                                    <div className="space-y-2 text-sm">
                                        <div className="flex justify-between">
                                            <span className="text-gray-600">Enabled:</span>
                                            <span className="font-medium">{backupSettings.autoBackup ? 'Yes' : 'No'}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-600">Frequency:</span>
                                            <span className="font-medium">{backupSettings.frequency}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-600">Retention:</span>
                                            <span className="font-medium">{backupSettings.retention}</span>
                                        </div>
                                    </div>
                                </div>
                                
                                <div className="p-4 border rounded-lg">
                                    <h4 className="font-medium text-gray-900 mb-2">Encryption</h4>
                                    <div className="space-y-2 text-sm">
                                        <div className="flex justify-between">
                                            <span className="text-gray-600">Enabled:</span>
                                            <span className="font-medium">{backupSettings.encryption ? 'Yes' : 'No'}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-600">Algorithm:</span>
                                            <span className="font-medium">{backupSettings.algorithm}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-600">Key Size:</span>
                                            <span className="font-medium">{backupSettings.keySize}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Filters and Search */}
            <Card>
                <CardContent className="p-4">
                    <div className="flex flex-col md:flex-row gap-4">
                        <div className="flex-1">
                            <div className="relative">
                                <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder="Search backups..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                            </div>
                        </div>
                        
                        <div className="flex gap-2">
                            <select
                                value={filterType}
                                onChange={(e) => setFilterType(e.target.value)}
                                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            >
                                <option value="all">All Backups</option>
                                <option value="local">Local</option>
                                <option value="cloud">Cloud</option>
                                <option value="encrypted">Encrypted</option>
                                <option value="unencrypted">Unencrypted</option>
                            </select>
                            
                            <Button
                                onClick={() => setShowDetails(!showDetails)}
                                variant="outline"
                            >
                                {showDetails ? <EyeOff className="w-4 h-4 mr-2" /> : <Eye className="w-4 h-4 mr-2" />}
                                {showDetails ? 'Hide Details' : 'Show Details'}
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Backup History */}
            {showBackupHistory && (
                <div className="space-y-4">
                    {filteredBackups.map((backup, index) => (
                        <Card key={index} className="border-gray-200">
                            <CardContent className="p-6">
                                <div className="space-y-4">
                                    {/* Backup Header */}
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center space-x-3">
                                            {getBackupIcon(backup.type)}
                                            <h4 className="font-medium text-gray-900">
                                                {backup.name}
                                            </h4>
                                        </div>
                                        
                                        <div className="flex items-center space-x-2">
                                            {getBackupBadge(backup.type)}
                                            {getStatusBadge(backup.status)}
                                            {backup.encrypted && (
                                                <Badge className="bg-purple-100 text-purple-800">Encrypted</Badge>
                                            )}
                                        </div>
                                    </div>
                                    
                                    {/* Backup Details */}
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                                        <div>
                                            <p className="text-gray-600">Size:</p>
                                            <p className="font-medium">{formatFileSize(backup.size || 0)}</p>
                                        </div>
                                        <div>
                                            <p className="text-gray-600">Created:</p>
                                            <p className="font-medium">{formatDate(backup.createdAt)}</p>
                                        </div>
                                        <div>
                                            <p className="text-gray-600">Last Modified:</p>
                                            <p className="font-medium">{formatDate(backup.lastModified)}</p>
                                        </div>
                                    </div>
                                    
                                    {/* Description */}
                                    {backup.description && (
                                        <div>
                                            <h5 className="font-medium text-gray-900 mb-2">Description:</h5>
                                            <p className="text-gray-700">{backup.description}</p>
                                        </div>
                                    )}
                                    
                                    {/* Backup Actions */}
                                    <div className="flex space-x-2">
                                        <Button
                                            onClick={() => downloadBackup(backup.id, 'json')}
                                            variant="outline"
                                            size="sm"
                                        >
                                            <Download className="w-4 h-4 mr-2" />
                                            Download
                                        </Button>
                                        
                                        <Button
                                            onClick={() => restoreBackup(backup.id)}
                                            variant="outline"
                                            size="sm"
                                            className="text-green-600 hover:text-green-700"
                                        >
                                            <RotateCcw className="w-4 h-4 mr-2" />
                                            Restore
                                        </Button>
                                        
                                        <Button
                                            onClick={() => deleteBackup(backup.id)}
                                            variant="outline"
                                            size="sm"
                                            className="text-red-600 hover:text-red-700"
                                        >
                                            <Trash2 className="w-4 h-4 mr-2" />
                                            Delete
                                        </Button>
                                    </div>
                                    
                                    {/* Backup Details */}
                                    {showDetails && (
                                        <div className="p-4 border rounded-lg bg-gray-50">
                                            <h5 className="font-medium text-gray-900 mb-2">Backup Details</h5>
                                            <div className="space-y-2 text-sm">
                                                <div className="flex justify-between">
                                                    <span className="text-gray-600">Backup ID:</span>
                                                    <span className="font-mono text-xs">{backup.id}</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-gray-600">Checksum:</span>
                                                    <span className="font-mono text-xs">{backup.checksum}</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-gray-600">Hash:</span>
                                                    <span className="font-mono text-xs">{backup.hash}</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-gray-600">Encrypted:</span>
                                                    <span className="font-medium">{backup.encrypted ? 'Yes' : 'No'}</span>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}

            {/* Recovery Options */}
            {showRecoveryOptions && (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center space-x-2">
                            <RotateCcw className="w-5 h-5" />
                            <span>Recovery Options</span>
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            <div className="p-4 border rounded-lg bg-blue-50">
                                <h4 className="font-medium text-gray-900 mb-2">Data Recovery</h4>
                                <p className="text-sm text-gray-700 mb-3">
                                    Recover data from backups or restore to a previous state
                                </p>
                                
                                <div className="flex space-x-2">
                                    <Button
                                        onClick={() => createBackup('local')}
                                        variant="outline"
                                        size="sm"
                                    >
                                        <HardDrive className="w-4 h-4 mr-2" />
                                        Create Local Backup
                                    </Button>
                                    
                                    <Button
                                        onClick={() => createBackup('cloud')}
                                        variant="outline"
                                        size="sm"
                                    >
                                        <Cloud className="w-4 h-4 mr-2" />
                                        Create Cloud Backup
                                    </Button>
                                    
                                    <Button
                                        onClick={() => createBackup('encrypted')}
                                        variant="outline"
                                        size="sm"
                                    >
                                        <Lock className="w-4 h-4 mr-2" />
                                        Create Encrypted Backup
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
                    onClick={() => createBackup('local')}
                    variant="outline"
                >
                    <HardDrive className="w-4 h-4 mr-2" />
                    Create Local Backup
                </Button>
                
                <Button 
                    onClick={() => createBackup('cloud')}
                    variant="outline"
                >
                    <Cloud className="w-4 h-4 mr-2" />
                    Create Cloud Backup
                </Button>
                
                <Button 
                    onClick={loadBackupSystem}
                    variant="outline"
                >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Refresh
                </Button>
            </div>
        </div>
    );
};

export default BackupSystem;
