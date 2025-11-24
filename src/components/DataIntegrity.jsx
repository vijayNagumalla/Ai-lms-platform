import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Alert, AlertDescription } from './ui/alert';
import { 
    Shield, 
    CheckCircle, 
    XCircle, 
    AlertTriangle,
    Lock,
    Unlock,
    Key,
    Hash,
    FileCheck,
    Database,
    RefreshCw,
    Download,
    Upload,
    Eye,
    EyeOff,
    Filter,
    Search,
    Settings,
    Trash2,
    RotateCcw,
    Zap
} from 'lucide-react';
import { toast } from 'react-hot-toast';

const DataIntegrity = ({ 
    submissionId,
    assessmentId,
    onDataIntegrityViewed,
    showEncryptionStatus = true,
    showValidationResults = true,
    showIntegrityChecks = true,
    showRecoveryOptions = true
}) => {
    const [dataIntegrity, setDataIntegrity] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [showDetails, setShowDetails] = useState(false);
    const [filterType, setFilterType] = useState('all'); // all, valid, invalid, encrypted, unencrypted
    const [searchTerm, setSearchTerm] = useState('');
    const [filteredItems, setFilteredItems] = useState([]);
    const [validationResults, setValidationResults] = useState({});
    const [encryptionStatus, setEncryptionStatus] = useState({});

    useEffect(() => {
        loadDataIntegrity();
    }, [submissionId]);

    useEffect(() => {
        filterItems();
    }, [dataIntegrity, filterType, searchTerm]);

    const loadDataIntegrity = async () => {
        try {
            setIsLoading(true);
            
            const response = await fetch('/api/assessment/data-integrity', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    submissionId, 
                    assessmentId,
                    showEncryptionStatus,
                    showValidationResults,
                    showIntegrityChecks,
                    showRecoveryOptions
                })
            });

            if (!response.ok) throw new Error('Failed to load data integrity');
            
            const data = await response.json();
            setDataIntegrity(data.dataIntegrity);
            setValidationResults(data.validationResults);
            setEncryptionStatus(data.encryptionStatus);
            
            if (onDataIntegrityViewed) {
                onDataIntegrityViewed(data);
            }
            
        } catch (error) {
            console.error('Error loading data integrity:', error);
            toast.error('Failed to load data integrity');
        } finally {
            setIsLoading(false);
        }
    };

    const filterItems = () => {
        if (!dataIntegrity?.items) return;
        
        let filtered = dataIntegrity.items;
        
        // Filter by type
        if (filterType !== 'all') {
            filtered = filtered.filter(item => {
                switch (filterType) {
                    case 'valid':
                        return item.valid;
                    case 'invalid':
                        return !item.valid;
                    case 'encrypted':
                        return item.encrypted;
                    case 'unencrypted':
                        return !item.encrypted;
                    default:
                        return true;
                }
            });
        }
        
        // Filter by search term
        if (searchTerm) {
            filtered = filtered.filter(item => 
                item.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                item.type?.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }
        
        setFilteredItems(filtered);
    };

    const getIntegrityIcon = (valid) => {
        return valid ? 
            <CheckCircle className="w-4 h-4 text-green-500" /> : 
            <XCircle className="w-4 h-4 text-red-500" />;
    };

    const getIntegrityBadge = (valid) => {
        return valid ? 
            <Badge className="bg-green-100 text-green-800">Valid</Badge> : 
            <Badge className="bg-red-100 text-red-800">Invalid</Badge>;
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

    const validateData = async () => {
        try {
            const response = await fetch('/api/assessment/validate-data', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    submissionId
                })
            });

            if (!response.ok) throw new Error('Validation failed');
            
            const result = await response.json();
            toast.success('Data validation completed');
            
            // Reload data integrity
            loadDataIntegrity();
            
        } catch (error) {
            console.error('Validation error:', error);
            toast.error('Validation failed');
        }
    };

    const repairData = async () => {
        try {
            const response = await fetch('/api/assessment/repair-data', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    submissionId
                })
            });

            if (!response.ok) throw new Error('Repair failed');
            
            const result = await response.json();
            toast.success('Data repair completed');
            
            // Reload data integrity
            loadDataIntegrity();
            
        } catch (error) {
            console.error('Repair error:', error);
            toast.error('Repair failed');
        }
    };

    const encryptData = async () => {
        try {
            const response = await fetch('/api/assessment/encrypt-data', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    submissionId
                })
            });

            if (!response.ok) throw new Error('Encryption failed');
            
            const result = await response.json();
            toast.success('Data encryption completed');
            
            // Reload data integrity
            loadDataIntegrity();
            
        } catch (error) {
            console.error('Encryption error:', error);
            toast.error('Encryption failed');
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

    if (!dataIntegrity) {
        return (
            <div className="text-center py-8">
                <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                <p className="text-gray-500">No data integrity information available</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="text-center">
                <h2 className="text-3xl font-bold text-gray-900">Data Integrity</h2>
                <p className="text-gray-600 mt-2">Validate and secure your assessment data</p>
            </div>

            {/* Data Integrity Overview */}
            <Card className="border-blue-200 bg-blue-50">
                <CardContent className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-center">
                        <div>
                            <h3 className="text-2xl font-bold text-blue-800">
                                {dataIntegrity.totalItems || 0}
                            </h3>
                            <p className="text-sm text-blue-600">Total Items</p>
                        </div>
                        <div>
                            <h3 className="text-2xl font-bold text-blue-800">
                                {dataIntegrity.validItems || 0}
                            </h3>
                            <p className="text-sm text-blue-600">Valid Items</p>
                        </div>
                        <div>
                            <h3 className="text-2xl font-bold text-blue-800">
                                {dataIntegrity.invalidItems || 0}
                            </h3>
                            <p className="text-sm text-blue-600">Invalid Items</p>
                        </div>
                        <div>
                            <h3 className="text-2xl font-bold text-blue-800">
                                {dataIntegrity.encryptedItems || 0}
                            </h3>
                            <p className="text-sm text-blue-600">Encrypted Items</p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Validation Results */}
            {showValidationResults && validationResults && (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center space-x-2">
                            <FileCheck className="w-5 h-5" />
                            <span>Validation Results</span>
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="text-center">
                                    <p className="text-2xl font-bold text-green-600">
                                        {validationResults.validChecks || 0}
                                    </p>
                                    <p className="text-sm text-gray-600">Valid Checks</p>
                                </div>
                                
                                <div className="text-center">
                                    <p className="text-2xl font-bold text-red-600">
                                        {validationResults.invalidChecks || 0}
                                    </p>
                                    <p className="text-sm text-gray-600">Invalid Checks</p>
                                </div>
                                
                                <div className="text-center">
                                    <p className="text-2xl font-bold text-blue-600">
                                        {validationResults.integrityScore || 0}%
                                    </p>
                                    <p className="text-sm text-gray-600">Integrity Score</p>
                                </div>
                            </div>
                            
                            {validationResults.issues && validationResults.issues.length > 0 && (
                                <Alert className="border-red-200 bg-red-50">
                                    <AlertTriangle className="w-4 h-4 text-red-600" />
                                    <AlertDescription>
                                        <div className="space-y-2">
                                            <p className="font-medium">Validation Issues:</p>
                                            <ul className="list-disc list-inside space-y-1">
                                                {validationResults.issues.map((issue, index) => (
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
                                        {encryptionStatus.encryptedItems || 0}
                                    </p>
                                    <p className="text-sm text-gray-600">Encrypted Items</p>
                                </div>
                                
                                <div className="text-center">
                                    <p className="text-2xl font-bold text-red-600">
                                        {encryptionStatus.unencryptedItems || 0}
                                    </p>
                                    <p className="text-sm text-gray-600">Unencrypted Items</p>
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
                                    placeholder="Search items..."
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
                                <option value="all">All Items</option>
                                <option value="valid">Valid</option>
                                <option value="invalid">Invalid</option>
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

            {/* Data Items */}
            <div className="space-y-4">
                {filteredItems.map((item, index) => (
                    <Card key={index} className="border-gray-200">
                        <CardContent className="p-6">
                            <div className="space-y-4">
                                {/* Item Header */}
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center space-x-3">
                                        {getIntegrityIcon(item.valid)}
                                        <h4 className="font-medium text-gray-900">
                                            {item.name}
                                        </h4>
                                    </div>
                                    
                                    <div className="flex items-center space-x-2">
                                        {getIntegrityBadge(item.valid)}
                                        {getEncryptionBadge(item.encrypted)}
                                    </div>
                                </div>
                                
                                {/* Item Details */}
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                                    <div>
                                        <p className="text-gray-600">Type:</p>
                                        <p className="font-medium">{item.type}</p>
                                    </div>
                                    <div>
                                        <p className="text-gray-600">Size:</p>
                                        <p className="font-medium">{formatFileSize(item.size || 0)}</p>
                                    </div>
                                    <div>
                                        <p className="text-gray-600">Last Modified:</p>
                                        <p className="font-medium">{formatDate(item.lastModified)}</p>
                                    </div>
                                </div>
                                
                                {/* Integrity Details */}
                                {showDetails && item.integrity && (
                                    <div>
                                        <h5 className="font-medium text-gray-900 mb-2">Integrity Details</h5>
                                        <div className="p-3 border rounded-lg bg-gray-50">
                                            <div className="space-y-2 text-sm">
                                                <div className="flex justify-between">
                                                    <span className="text-gray-600">Checksum:</span>
                                                    <span className="font-mono text-xs">{item.integrity.checksum}</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-gray-600">Hash:</span>
                                                    <span className="font-mono text-xs">{item.integrity.hash}</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-gray-600">Valid:</span>
                                                    <span className={`font-medium ${item.integrity.valid ? 'text-green-600' : 'text-red-600'}`}>
                                                        {item.integrity.valid ? 'Yes' : 'No'}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                                
                                {/* Encryption Details */}
                                {showDetails && item.encryption && (
                                    <div>
                                        <h5 className="font-medium text-gray-900 mb-2">Encryption Details</h5>
                                        <div className="p-3 border rounded-lg bg-gray-50">
                                            <div className="space-y-2 text-sm">
                                                <div className="flex justify-between">
                                                    <span className="text-gray-600">Algorithm:</span>
                                                    <span className="font-medium">{item.encryption.algorithm}</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-gray-600">Key Size:</span>
                                                    <span className="font-medium">{item.encryption.keySize}</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-gray-600">Encrypted:</span>
                                                    <span className={`font-medium ${item.encryption.encrypted ? 'text-green-600' : 'text-red-600'}`}>
                                                        {item.encryption.encrypted ? 'Yes' : 'No'}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

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
                                    Recover and repair corrupted or invalid data
                                </p>
                                
                                <div className="flex space-x-2">
                                    <Button
                                        onClick={validateData}
                                        variant="outline"
                                        size="sm"
                                    >
                                        <FileCheck className="w-4 h-4 mr-2" />
                                        Validate Data
                                    </Button>
                                    
                                    <Button
                                        onClick={repairData}
                                        variant="outline"
                                        size="sm"
                                    >
                                        <RotateCcw className="w-4 h-4 mr-2" />
                                        Repair Data
                                    </Button>
                                    
                                    <Button
                                        onClick={encryptData}
                                        variant="outline"
                                        size="sm"
                                    >
                                        <Lock className="w-4 h-4 mr-2" />
                                        Encrypt Data
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
                    onClick={validateData}
                    variant="outline"
                >
                    <FileCheck className="w-4 h-4 mr-2" />
                    Validate Data
                </Button>
                
                <Button 
                    onClick={repairData}
                    variant="outline"
                >
                    <RotateCcw className="w-4 h-4 mr-2" />
                    Repair Data
                </Button>
                
                <Button 
                    onClick={encryptData}
                    variant="outline"
                >
                    <Lock className="w-4 h-4 mr-2" />
                    Encrypt Data
                </Button>
                
                <Button 
                    onClick={loadDataIntegrity}
                    variant="outline"
                >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Refresh
                </Button>
            </div>
        </div>
    );
};

export default DataIntegrity;
