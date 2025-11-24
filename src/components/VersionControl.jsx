import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Alert, AlertDescription } from './ui/alert';
import { 
    GitBranch, 
    Clock, 
    User, 
    FileText, 
    CheckCircle, 
    XCircle, 
    AlertTriangle,
    Download,
    Upload,
    RefreshCw,
    Eye,
    EyeOff,
    Filter,
    Search,
    History,
    RotateCcw,
    Copy,
    Trash2,
    Save,
    GitCommit
} from 'lucide-react';
import { toast } from 'react-hot-toast';

const VersionControl = ({ 
    submissionId,
    assessmentId,
    onVersionControlViewed,
    showVersionHistory = true,
    showChangeTracking = true,
    showRollbackOptions = true,
    showConflictResolution = true
}) => {
    const [versionControl, setVersionControl] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [showDetails, setShowDetails] = useState(false);
    const [filterType, setFilterType] = useState('all'); // all, auto-save, manual-save, rollback
    const [searchTerm, setSearchTerm] = useState('');
    const [filteredVersions, setFilteredVersions] = useState([]);
    const [selectedVersion, setSelectedVersion] = useState(null);
    const [conflicts, setConflicts] = useState([]);

    useEffect(() => {
        loadVersionControl();
    }, [submissionId]);

    useEffect(() => {
        filterVersions();
    }, [versionControl, filterType, searchTerm]);

    const loadVersionControl = async () => {
        try {
            setIsLoading(true);
            
            const response = await fetch('/api/assessment/version-control', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    submissionId, 
                    assessmentId,
                    showVersionHistory,
                    showChangeTracking,
                    showRollbackOptions,
                    showConflictResolution
                })
            });

            if (!response.ok) throw new Error('Failed to load version control');
            
            const data = await response.json();
            setVersionControl(data.versionControl);
            setConflicts(data.conflicts || []);
            
            if (onVersionControlViewed) {
                onVersionControlViewed(data);
            }
            
        } catch (error) {
            console.error('Error loading version control:', error);
            toast.error('Failed to load version control');
        } finally {
            setIsLoading(false);
        }
    };

    const filterVersions = () => {
        if (!versionControl?.versions) return;
        
        let filtered = versionControl.versions;
        
        // Filter by type
        if (filterType !== 'all') {
            filtered = filtered.filter(version => {
                switch (filterType) {
                    case 'auto-save':
                        return version.type === 'auto-save';
                    case 'manual-save':
                        return version.type === 'manual-save';
                    case 'rollback':
                        return version.type === 'rollback';
                    default:
                        return true;
                }
            });
        }
        
        // Filter by search term
        if (searchTerm) {
            filtered = filtered.filter(version => 
                version.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                version.changes?.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }
        
        setFilteredVersions(filtered);
    };

    const getVersionIcon = (type) => {
        switch (type) {
            case 'auto-save':
                return <Clock className="w-4 h-4 text-blue-500" />;
            case 'manual-save':
                return <Save className="w-4 h-4 text-green-500" />;
            case 'rollback':
                return <RotateCcw className="w-4 h-4 text-orange-500" />;
            default:
                return <GitCommit className="w-4 h-4 text-gray-500" />;
        }
    };

    const getVersionBadge = (type) => {
        switch (type) {
            case 'auto-save':
                return <Badge className="bg-blue-100 text-blue-800">Auto-save</Badge>;
            case 'manual-save':
                return <Badge className="bg-green-100 text-green-800">Manual Save</Badge>;
            case 'rollback':
                return <Badge className="bg-orange-100 text-orange-800">Rollback</Badge>;
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
            case 'conflict':
                return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
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
            case 'conflict':
                return <Badge className="bg-yellow-100 text-yellow-800">Conflict</Badge>;
            default:
                return <Badge className="bg-gray-100 text-gray-800">Unknown</Badge>;
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

    const rollbackToVersion = async (versionId) => {
        try {
            const response = await fetch('/api/assessment/rollback-version', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    submissionId, 
                    versionId
                })
            });

            if (!response.ok) throw new Error('Rollback failed');
            
            const result = await response.json();
            toast.success('Successfully rolled back to version');
            
            // Reload version control
            loadVersionControl();
            
        } catch (error) {
            console.error('Rollback error:', error);
            toast.error('Rollback failed');
        }
    };

    const resolveConflict = async (conflictId, resolution) => {
        try {
            const response = await fetch('/api/assessment/resolve-conflict', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    submissionId, 
                    conflictId,
                    resolution
                })
            });

            if (!response.ok) throw new Error('Conflict resolution failed');
            
            const result = await response.json();
            toast.success('Conflict resolved successfully');
            
            // Reload version control
            loadVersionControl();
            
        } catch (error) {
            console.error('Conflict resolution error:', error);
            toast.error('Conflict resolution failed');
        }
    };

    const downloadVersion = async (versionId, format = 'json') => {
        try {
            const response = await fetch('/api/assessment/download-version', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    submissionId, 
                    versionId,
                    format
                })
            });

            if (!response.ok) throw new Error('Download failed');
            
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `version_${versionId}_${format}_${Date.now()}.${format}`;
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

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    if (!versionControl) {
        return (
            <div className="text-center py-8">
                <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                <p className="text-gray-500">No version control data available</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="text-center">
                <h2 className="text-3xl font-bold text-gray-900">Version Control</h2>
                <p className="text-gray-600 mt-2">Track and manage answer changes with complete version history</p>
            </div>

            {/* Version Control Overview */}
            <Card className="border-blue-200 bg-blue-50">
                <CardContent className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-center">
                        <div>
                            <h3 className="text-2xl font-bold text-blue-800">
                                {versionControl.totalVersions || 0}
                            </h3>
                            <p className="text-sm text-blue-600">Total Versions</p>
                        </div>
                        <div>
                            <h3 className="text-2xl font-bold text-blue-800">
                                {versionControl.autoSaveVersions || 0}
                            </h3>
                            <p className="text-sm text-blue-600">Auto-save</p>
                        </div>
                        <div>
                            <h3 className="text-2xl font-bold text-blue-800">
                                {versionControl.manualSaveVersions || 0}
                            </h3>
                            <p className="text-sm text-blue-600">Manual Save</p>
                        </div>
                        <div>
                            <h3 className="text-2xl font-bold text-blue-800">
                                {versionControl.rollbackVersions || 0}
                            </h3>
                            <p className="text-sm text-blue-600">Rollbacks</p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Conflicts */}
            {conflicts.length > 0 && (
                <Card className="border-yellow-200 bg-yellow-50">
                    <CardHeader>
                        <CardTitle className="flex items-center space-x-2">
                            <AlertTriangle className="w-5 h-5 text-yellow-600" />
                            <span>Version Conflicts</span>
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {conflicts.map((conflict, index) => (
                                <div key={index} className="p-4 border rounded-lg bg-white">
                                    <div className="flex items-center justify-between mb-3">
                                        <div className="flex items-center space-x-3">
                                            <AlertTriangle className="w-5 h-5 text-yellow-500" />
                                            <h4 className="font-medium text-gray-900">
                                                Conflict {index + 1}
                                            </h4>
                                        </div>
                                        
                                        <Badge className="bg-yellow-100 text-yellow-800">
                                            {conflict.severity}
                                        </Badge>
                                    </div>
                                    
                                    <p className="text-sm text-gray-700 mb-3">{conflict.description}</p>
                                    
                                    <div className="flex space-x-2">
                                        <Button
                                            onClick={() => resolveConflict(conflict.id, 'accept')}
                                            size="sm"
                                            className="bg-green-600 hover:bg-green-700"
                                        >
                                            Accept
                                        </Button>
                                        <Button
                                            onClick={() => resolveConflict(conflict.id, 'reject')}
                                            size="sm"
                                            variant="outline"
                                        >
                                            Reject
                                        </Button>
                                        <Button
                                            onClick={() => resolveConflict(conflict.id, 'merge')}
                                            size="sm"
                                            variant="outline"
                                        >
                                            Merge
                                        </Button>
                                    </div>
                                </div>
                            ))}
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
                                    placeholder="Search versions..."
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
                                <option value="all">All Versions</option>
                                <option value="auto-save">Auto-save</option>
                                <option value="manual-save">Manual Save</option>
                                <option value="rollback">Rollback</option>
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

            {/* Version History */}
            <div className="space-y-4">
                {filteredVersions.map((version, index) => (
                    <Card key={index} className="border-gray-200">
                        <CardContent className="p-6">
                            <div className="space-y-4">
                                {/* Version Header */}
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center space-x-3">
                                        {getVersionIcon(version.type)}
                                        <h4 className="font-medium text-gray-900">
                                            Version {version.versionNumber}
                                        </h4>
                                    </div>
                                    
                                    <div className="flex items-center space-x-2">
                                        {getVersionBadge(version.type)}
                                        {getStatusBadge(version.status)}
                                    </div>
                                </div>
                                
                                {/* Version Details */}
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                                    <div>
                                        <p className="text-gray-600">Created:</p>
                                        <p className="font-medium">{formatDate(version.createdAt)}</p>
                                    </div>
                                    <div>
                                        <p className="text-gray-600">File Size:</p>
                                        <p className="font-medium">{formatFileSize(version.fileSize || 0)}</p>
                                    </div>
                                    <div>
                                        <p className="text-gray-600">Changes:</p>
                                        <p className="font-medium">{version.changesCount || 0}</p>
                                    </div>
                                </div>
                                
                                {/* Description */}
                                {version.description && (
                                    <div>
                                        <h5 className="font-medium text-gray-900 mb-2">Description:</h5>
                                        <p className="text-gray-700">{version.description}</p>
                                    </div>
                                )}
                                
                                {/* Changes */}
                                {version.changes && version.changes.length > 0 && (
                                    <div>
                                        <h5 className="font-medium text-gray-900 mb-2">Changes:</h5>
                                        <div className="space-y-2">
                                            {version.changes.map((change, changeIndex) => (
                                                <div key={changeIndex} className="p-3 border rounded-lg bg-gray-50">
                                                    <div className="flex items-center justify-between">
                                                        <span className="text-sm font-medium">
                                                            {change.type}
                                                        </span>
                                                        <span className="text-xs text-gray-500">
                                                            {formatDate(change.timestamp)}
                                                        </span>
                                                    </div>
                                                    {change.description && (
                                                        <p className="text-xs text-gray-600 mt-1">
                                                            {change.description}
                                                        </p>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                                
                                {/* Version Actions */}
                                <div className="flex space-x-2">
                                    <Button
                                        onClick={() => setSelectedVersion(selectedVersion === version.id ? null : version.id)}
                                        variant="outline"
                                        size="sm"
                                    >
                                        <Eye className="w-4 h-4 mr-2" />
                                        View Details
                                    </Button>
                                    
                                    <Button
                                        onClick={() => downloadVersion(version.id, 'json')}
                                        variant="outline"
                                        size="sm"
                                    >
                                        <Download className="w-4 h-4 mr-2" />
                                        Download
                                    </Button>
                                    
                                    {showRollbackOptions && (
                                        <Button
                                            onClick={() => rollbackToVersion(version.id)}
                                            variant="outline"
                                            size="sm"
                                            className="text-orange-600 hover:text-orange-700"
                                        >
                                            <RotateCcw className="w-4 h-4 mr-2" />
                                            Rollback
                                        </Button>
                                    )}
                                </div>
                                
                                {/* Version Details */}
                                {selectedVersion === version.id && (
                                    <div className="p-4 border rounded-lg bg-gray-50">
                                        <h5 className="font-medium text-gray-900 mb-2">Version Details</h5>
                                        <div className="space-y-2 text-sm">
                                            <div className="flex justify-between">
                                                <span className="text-gray-600">Version ID:</span>
                                                <span className="font-mono text-xs">{version.id}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-gray-600">Hash:</span>
                                                <span className="font-mono text-xs">{version.hash}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-gray-600">Checksum:</span>
                                                <span className="font-mono text-xs">{version.checksum}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-gray-600">Parent Version:</span>
                                                <span className="font-mono text-xs">{version.parentVersion || 'None'}</span>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Actions */}
            <div className="flex justify-center space-x-4">
                <Button 
                    onClick={() => downloadVersion('latest', 'json')}
                    variant="outline"
                >
                    <Download className="w-4 h-4 mr-2" />
                    Download Latest
                </Button>
                
                <Button 
                    onClick={() => downloadVersion('all', 'json')}
                    variant="outline"
                >
                    <Download className="w-4 h-4 mr-2" />
                    Download All
                </Button>
                
                <Button 
                    onClick={loadVersionControl}
                    variant="outline"
                >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Refresh
                </Button>
            </div>
        </div>
    );
};

export default VersionControl;
