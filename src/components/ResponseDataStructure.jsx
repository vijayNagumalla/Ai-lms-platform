import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Alert, AlertDescription } from './ui/alert';
import { 
    Database, 
    FileText, 
    Clock, 
    Shield, 
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
    Lock,
    Unlock,
    Archive,
    Trash2,
    Copy,
    Edit
} from 'lucide-react';
import { toast } from 'react-hot-toast';

const ResponseDataStructure = ({ 
    submissionId,
    assessmentId,
    onDataStructureViewed,
    showSubmissionRecords = true,
    showResponseHistory = true,
    showDataIntegrity = true,
    showEncryptionStatus = true
}) => {
    const [dataStructure, setDataStructure] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [showDetails, setShowDetails] = useState(false);
    const [filterType, setFilterType] = useState('all'); // all, submitted, draft, auto-saved
    const [searchTerm, setSearchTerm] = useState('');
    const [filteredResponses, setFilteredResponses] = useState([]);
    const [dataIntegrity, setDataIntegrity] = useState({});
    const [encryptionStatus, setEncryptionStatus] = useState({});

    useEffect(() => {
        loadResponseDataStructure();
    }, [submissionId]);

    useEffect(() => {
        filterResponses();
    }, [dataStructure, filterType, searchTerm]);

    const loadResponseDataStructure = async () => {
        try {
            setIsLoading(true);
            
            const response = await fetch('/api/assessment/response-data-structure', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    submissionId, 
                    assessmentId,
                    showSubmissionRecords,
                    showResponseHistory,
                    showDataIntegrity,
                    showEncryptionStatus
                })
            });

            if (!response.ok) throw new Error('Failed to load response data structure');
            
            const data = await response.json();
            setDataStructure(data.dataStructure);
            setDataIntegrity(data.dataIntegrity);
            setEncryptionStatus(data.encryptionStatus);
            
            if (onDataStructureViewed) {
                onDataStructureViewed(data);
            }
            
        } catch (error) {
            console.error('Error loading response data structure:', error);
            toast.error('Failed to load response data structure');
        } finally {
            setIsLoading(false);
        }
    };

    const filterResponses = () => {
        if (!dataStructure?.responses) return;
        
        let filtered = dataStructure.responses;
        
        // Filter by type
        if (filterType !== 'all') {
            filtered = filtered.filter(response => {
                switch (filterType) {
                    case 'submitted':
                        return response.status === 'submitted';
                    case 'draft':
                        return response.status === 'draft';
                    case 'auto-saved':
                        return response.status === 'auto-saved';
                    default:
                        return true;
                }
            });
        }
        
        // Filter by search term
        if (searchTerm) {
            filtered = filtered.filter(response => 
                response.questionText?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                response.answer?.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }
        
        setFilteredResponses(filtered);
    };

    const getStatusIcon = (status) => {
        switch (status) {
            case 'submitted':
                return <CheckCircle className="w-4 h-4 text-green-500" />;
            case 'draft':
                return <Edit className="w-4 h-4 text-yellow-500" />;
            case 'auto-saved':
                return <Clock className="w-4 h-4 text-blue-500" />;
            default:
                return <AlertTriangle className="w-4 h-4 text-gray-500" />;
        }
    };

    const getStatusBadge = (status) => {
        switch (status) {
            case 'submitted':
                return <Badge className="bg-green-100 text-green-800">Submitted</Badge>;
            case 'draft':
                return <Badge className="bg-yellow-100 text-yellow-800">Draft</Badge>;
            case 'auto-saved':
                return <Badge className="bg-blue-100 text-blue-800">Auto-saved</Badge>;
            default:
                return <Badge className="bg-gray-100 text-gray-800">Unknown</Badge>;
        }
    };

    const getEncryptionIcon = (encrypted) => {
        return encrypted ? 
            <Lock className="w-4 h-4 text-green-500" /> : 
            <Unlock className="w-4 h-4 text-red-500" />;
    };

    const getEncryptionBadge = (encrypted) => {
        return encrypted ? 
            <Badge className="bg-green-100 text-green-800">Encrypted</Badge> : 
            <Badge className="bg-red-100 text-red-800">Not Encrypted</Badge>;
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

    const downloadDataStructure = async (format = 'json') => {
        try {
            const response = await fetch('/api/assessment/download-data-structure', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    submissionId, 
                    format,
                    includeDetails: showDetails,
                    includeHistory: showResponseHistory
                })
            });

            if (!response.ok) throw new Error('Download failed');
            
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `response_data_structure_${format}_${Date.now()}.${format}`;
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

    const exportDataStructure = async () => {
        try {
            const response = await fetch('/api/assessment/export-data-structure', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    submissionId,
                    includeDetails: showDetails,
                    includeHistory: showResponseHistory
                })
            });

            if (!response.ok) throw new Error('Export failed');
            
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `response_data_structure_export_${Date.now()}.json`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
            
            toast.success('Data structure exported');
        } catch (error) {
            console.error('Export error:', error);
            toast.error('Export failed');
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    if (!dataStructure) {
        return (
            <div className="text-center py-8">
                <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                <p className="text-gray-500">No response data structure available</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="text-center">
                <h2 className="text-3xl font-bold text-gray-900">Response Data Structure</h2>
                <p className="text-gray-600 mt-2">Complete data structure and integrity analysis</p>
            </div>

            {/* Data Structure Overview */}
            <Card className="border-blue-200 bg-blue-50">
                <CardContent className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-center">
                        <div>
                            <h3 className="text-2xl font-bold text-blue-800">
                                {dataStructure.totalResponses || 0}
                            </h3>
                            <p className="text-sm text-blue-600">Total Responses</p>
                        </div>
                        <div>
                            <h3 className="text-2xl font-bold text-blue-800">
                                {dataStructure.submittedResponses || 0}
                            </h3>
                            <p className="text-sm text-blue-600">Submitted</p>
                        </div>
                        <div>
                            <h3 className="text-2xl font-bold text-blue-800">
                                {dataStructure.draftResponses || 0}
                            </h3>
                            <p className="text-sm text-blue-600">Draft</p>
                        </div>
                        <div>
                            <h3 className="text-2xl font-bold text-blue-800">
                                {dataStructure.autoSavedResponses || 0}
                            </h3>
                            <p className="text-sm text-blue-600">Auto-saved</p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Data Integrity Status */}
            {showDataIntegrity && dataIntegrity && (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center space-x-2">
                            <Shield className="w-5 h-5" />
                            <span>Data Integrity Status</span>
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="text-center">
                                    <p className="text-2xl font-bold text-green-600">
                                        {dataIntegrity.validResponses || 0}
                                    </p>
                                    <p className="text-sm text-gray-600">Valid Responses</p>
                                </div>
                                
                                <div className="text-center">
                                    <p className="text-2xl font-bold text-red-600">
                                        {dataIntegrity.invalidResponses || 0}
                                    </p>
                                    <p className="text-sm text-gray-600">Invalid Responses</p>
                                </div>
                                
                                <div className="text-center">
                                    <p className="text-2xl font-bold text-blue-600">
                                        {dataIntegrity.integrityScore || 0}%
                                    </p>
                                    <p className="text-sm text-gray-600">Integrity Score</p>
                                </div>
                            </div>
                            
                            {dataIntegrity.issues && dataIntegrity.issues.length > 0 && (
                                <Alert className="border-red-200 bg-red-50">
                                    <AlertTriangle className="w-4 h-4 text-red-600" />
                                    <AlertDescription>
                                        <div className="space-y-2">
                                            <p className="font-medium">Data Integrity Issues:</p>
                                            <ul className="list-disc list-inside space-y-1">
                                                {dataIntegrity.issues.map((issue, index) => (
                                                    <li key={index} className="text-sm">{issue}</li>
                                                ))}
                                            </ul>
                                        </div>
                                    </AlertDescription>
                                </Alert>
                            )}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Encryption Status */}
            {showEncryptionStatus && encryptionStatus && (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center space-x-2">
                            <Lock className="w-5 h-5" />
                            <span>Encryption Status</span>
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="text-center">
                                    <p className="text-2xl font-bold text-green-600">
                                        {encryptionStatus.encryptedResponses || 0}
                                    </p>
                                    <p className="text-sm text-gray-600">Encrypted</p>
                                </div>
                                
                                <div className="text-center">
                                    <p className="text-2xl font-bold text-red-600">
                                        {encryptionStatus.unencryptedResponses || 0}
                                    </p>
                                    <p className="text-sm text-gray-600">Unencrypted</p>
                                </div>
                                
                                <div className="text-center">
                                    <p className="text-2xl font-bold text-blue-600">
                                        {encryptionStatus.encryptionRate || 0}%
                                    </p>
                                    <p className="text-sm text-gray-600">Encryption Rate</p>
                                </div>
                            </div>
                            
                            {encryptionStatus.encryptionDetails && (
                                <div className="p-4 border rounded-lg bg-gray-50">
                                    <h4 className="font-medium text-gray-900 mb-2">Encryption Details</h4>
                                    <div className="space-y-2 text-sm">
                                        <div className="flex justify-between">
                                            <span className="text-gray-600">Algorithm:</span>
                                            <span className="font-medium">{encryptionStatus.encryptionDetails.algorithm}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-600">Key Size:</span>
                                            <span className="font-medium">{encryptionStatus.encryptionDetails.keySize}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-600">Last Encrypted:</span>
                                            <span className="font-medium">{formatDate(encryptionStatus.encryptionDetails.lastEncrypted)}</span>
                                        </div>
                                    </div>
                                </div>
                            )}
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
                                    placeholder="Search responses..."
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
                                <option value="all">All Responses</option>
                                <option value="submitted">Submitted</option>
                                <option value="draft">Draft</option>
                                <option value="auto-saved">Auto-saved</option>
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

            {/* Response Data Structure */}
            <div className="space-y-4">
                {filteredResponses.map((response, index) => (
                    <Card key={index} className="border-gray-200">
                        <CardContent className="p-6">
                            <div className="space-y-4">
                                {/* Response Header */}
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center space-x-3">
                                        {getStatusIcon(response.status)}
                                        <h4 className="font-medium text-gray-900">
                                            Response {response.questionNumber}
                                        </h4>
                                    </div>
                                    
                                    <div className="flex items-center space-x-2">
                                        {getStatusBadge(response.status)}
                                        {getEncryptionBadge(response.encrypted)}
                                    </div>
                                </div>
                                
                                {/* Question Text */}
                                <div>
                                    <h5 className="font-medium text-gray-900 mb-2">Question:</h5>
                                    <p className="text-gray-700">{response.questionText}</p>
                                </div>
                                
                                {/* Student Answer */}
                                <div>
                                    <h5 className="font-medium text-gray-900 mb-2">Answer:</h5>
                                    <div className="p-3 border rounded-lg bg-gray-50">
                                        <p className="text-gray-700">{response.answer || 'No answer provided'}</p>
                                    </div>
                                </div>
                                
                                {/* Response Details */}
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                                    <div>
                                        <p className="text-gray-600">Points:</p>
                                        <p className="font-medium">{response.points}</p>
                                    </div>
                                    <div>
                                        <p className="text-gray-600">Time Spent:</p>
                                        <p className="font-medium">{response.timeSpent}</p>
                                    </div>
                                    <div>
                                        <p className="text-gray-600">File Size:</p>
                                        <p className="font-medium">{formatFileSize(response.fileSize || 0)}</p>
                                    </div>
                                </div>
                                
                                {/* Timestamps */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                    <div>
                                        <p className="text-gray-600">Created:</p>
                                        <p className="font-medium">{formatDate(response.createdAt)}</p>
                                    </div>
                                    <div>
                                        <p className="text-gray-600">Last Modified:</p>
                                        <p className="font-medium">{formatDate(response.lastModified)}</p>
                                    </div>
                                </div>
                                
                                {/* Response History */}
                                {showResponseHistory && response.history && response.history.length > 0 && (
                                    <div>
                                        <h5 className="font-medium text-gray-900 mb-2">Response History:</h5>
                                        <div className="space-y-2">
                                            {response.history.map((historyItem, historyIndex) => (
                                                <div key={historyIndex} className="p-3 border rounded-lg bg-gray-50">
                                                    <div className="flex items-center justify-between">
                                                        <span className="text-sm font-medium">
                                                            {historyItem.action}
                                                        </span>
                                                        <span className="text-xs text-gray-500">
                                                            {formatDate(historyItem.timestamp)}
                                                        </span>
                                                    </div>
                                                    {historyItem.changes && (
                                                        <p className="text-xs text-gray-600 mt-1">
                                                            {historyItem.changes}
                                                        </p>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                                
                                {/* Data Integrity */}
                                {showDataIntegrity && response.integrity && (
                                    <div>
                                        <h5 className="font-medium text-gray-900 mb-2">Data Integrity:</h5>
                                        <div className="p-3 border rounded-lg bg-gray-50">
                                            <div className="flex items-center justify-between">
                                                <span className="text-sm">Checksum:</span>
                                                <span className="font-mono text-xs">{response.integrity.checksum}</span>
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <span className="text-sm">Hash:</span>
                                                <span className="font-mono text-xs">{response.integrity.hash}</span>
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <span className="text-sm">Valid:</span>
                                                <span className={`font-medium ${response.integrity.valid ? 'text-green-600' : 'text-red-600'}`}>
                                                    {response.integrity.valid ? 'Yes' : 'No'}
                                                </span>
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
                    onClick={() => downloadDataStructure('json')}
                    variant="outline"
                >
                    <Download className="w-4 h-4 mr-2" />
                    Download JSON
                </Button>
                
                <Button 
                    onClick={() => downloadDataStructure('csv')}
                    variant="outline"
                >
                    <Download className="w-4 h-4 mr-2" />
                    Download CSV
                </Button>
                
                <Button 
                    onClick={exportDataStructure}
                    variant="outline"
                >
                    <Upload className="w-4 h-4 mr-2" />
                    Export Structure
                </Button>
                
                <Button 
                    onClick={loadResponseDataStructure}
                    variant="outline"
                >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Refresh
                </Button>
            </div>
        </div>
    );
};

export default ResponseDataStructure;
