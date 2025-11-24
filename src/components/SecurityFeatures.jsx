import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { Alert, AlertDescription } from './ui/alert';
import { 
    Shield, 
    Lock,
    Key,
    Eye,
    EyeOff,
    AlertTriangle,
    CheckCircle,
    XCircle,
    Clock,
    Users,
    Database,
    Cloud,
    HardDrive,
    Settings,
    RefreshCw,
    Download,
    Upload,
    FileText,
    BarChart3,
    PieChart,
    LineChart,
    Activity,
    TrendingUp,
    TrendingDown,
    Target,
    Award,
    Star,
    Zap,
    Brain,
    BookOpen,
    User,
    Book,
    Building,
    GraduationCap,
    Timer,
    Play,
    Pause,
    Stop,
    Filter,
    Calendar,
    Search,
    Sliders,
    Layers,
    Grid,
    List,
    Columns,
    SortAsc,
    SortDesc,
    MoreHorizontal,
    Save,
    Share,
    Mail,
    Printer,
    Archive,
    Package
} from 'lucide-react';
import { toast } from 'react-hot-toast';

const SecurityFeatures = ({ 
    onSecurityFeaturesViewed,
    showAnswerEncryption = true,
    showSessionManagement = true,
    showAntiCheating = true,
    showDataIntegrity = true,
    showAccessControl = true
}) => {
    const [securityFeatures, setSecurityFeatures] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [securityStatus, setSecurityStatus] = useState({});
    const [encryptionStatus, setEncryptionStatus] = useState({});
    const [sessionStatus, setSessionStatus] = useState({});
    const [antiCheatingStatus, setAntiCheatingStatus] = useState({});
    const [dataIntegrityStatus, setDataIntegrityStatus] = useState({});
    const [accessControlStatus, setAccessControlStatus] = useState({});

    useEffect(() => {
        loadSecurityFeatures();
    }, []);

    const loadSecurityFeatures = async () => {
        try {
            setIsLoading(true);
            
            const response = await fetch('/api/security/features', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    showAnswerEncryption,
                    showSessionManagement,
                    showAntiCheating,
                    showDataIntegrity,
                    showAccessControl
                })
            });

            if (!response.ok) throw new Error('Failed to load security features');
            
            const data = await response.json();
            setSecurityFeatures(data.securityFeatures);
            setSecurityStatus(data.securityStatus);
            setEncryptionStatus(data.encryptionStatus);
            setSessionStatus(data.sessionStatus);
            setAntiCheatingStatus(data.antiCheatingStatus);
            setDataIntegrityStatus(data.dataIntegrityStatus);
            setAccessControlStatus(data.accessControlStatus);
            
            if (onSecurityFeaturesViewed) {
                onSecurityFeaturesViewed(data);
            }
            
        } catch (error) {
            console.error('Error loading security features:', error);
            toast.error('Failed to load security features');
        } finally {
            setIsLoading(false);
        }
    };

    const getSecurityIcon = (type) => {
        switch (type) {
            case 'encryption':
                return <Lock className="w-4 h-4" />;
            case 'session':
                return <Key className="w-4 h-4" />;
            case 'anti-cheating':
                return <Shield className="w-4 h-4" />;
            case 'data-integrity':
                return <Database className="w-4 h-4" />;
            case 'access-control':
                return <Users className="w-4 h-4" />;
            default:
                return <Shield className="w-4 h-4" />;
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'active':
                return 'text-green-600';
            case 'warning':
                return 'text-yellow-600';
            case 'critical':
                return 'text-red-600';
            case 'inactive':
                return 'text-gray-600';
            default:
                return 'text-gray-600';
        }
    };

    const getStatusBadge = (status) => {
        switch (status) {
            case 'active':
                return 'bg-green-100 text-green-800';
            case 'warning':
                return 'bg-yellow-100 text-yellow-800';
            case 'critical':
                return 'bg-red-100 text-red-800';
            case 'inactive':
                return 'bg-gray-100 text-gray-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };

    const getSecurityLevel = (level) => {
        switch (level) {
            case 'high':
                return 'bg-red-100 text-red-800';
            case 'medium':
                return 'bg-yellow-100 text-yellow-800';
            case 'low':
                return 'bg-blue-100 text-blue-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const downloadSecurityReport = async (format = 'pdf') => {
        try {
            const response = await fetch('/api/security/download-report', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    format
                })
            });

            if (!response.ok) throw new Error('Download failed');
            
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `security_report_${format}_${Date.now()}.${format}`;
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

    if (!securityFeatures) {
        return (
            <div className="text-center py-8">
                <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                <p className="text-gray-500">No security features data available</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="text-center">
                <h2 className="text-3xl font-bold text-gray-900">Security & Performance System</h2>
                <p className="text-gray-600 mt-2">Comprehensive security features and performance monitoring</p>
            </div>

            {/* Security Status Overview */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center">
                            <div className="p-2 bg-green-100 rounded-lg">
                                <Lock className="w-6 h-6 text-green-600" />
                            </div>
                            <div className="ml-4">
                                <p className="text-sm font-medium text-gray-600">Encryption</p>
                                <p className="text-2xl font-bold text-gray-900">
                                    {securityStatus.encryption || 'Active'}
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center">
                            <div className="p-2 bg-blue-100 rounded-lg">
                                <Key className="w-6 h-6 text-blue-600" />
                            </div>
                            <div className="ml-4">
                                <p className="text-sm font-medium text-gray-600">Sessions</p>
                                <p className="text-2xl font-bold text-gray-900">
                                    {securityStatus.sessions || 'Active'}
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center">
                            <div className="p-2 bg-purple-100 rounded-lg">
                                <Shield className="w-6 h-6 text-purple-600" />
                            </div>
                            <div className="ml-4">
                                <p className="text-sm font-medium text-gray-600">Anti-Cheating</p>
                                <p className="text-2xl font-bold text-gray-900">
                                    {securityStatus.antiCheating || 'Active'}
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center">
                            <div className="p-2 bg-orange-100 rounded-lg">
                                <Database className="w-6 h-6 text-orange-600" />
                            </div>
                            <div className="ml-4">
                                <p className="text-sm font-medium text-gray-600">Data Integrity</p>
                                <p className="text-2xl font-bold text-gray-900">
                                    {securityStatus.dataIntegrity || 'Active'}
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center">
                            <div className="p-2 bg-red-100 rounded-lg">
                                <Users className="w-6 h-6 text-red-600" />
                            </div>
                            <div className="ml-4">
                                <p className="text-sm font-medium text-gray-600">Access Control</p>
                                <p className="text-2xl font-bold text-gray-900">
                                    {securityStatus.accessControl || 'Active'}
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Answer Encryption */}
            {showAnswerEncryption && encryptionStatus && (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center space-x-2">
                            <Lock className="w-5 h-5" />
                            <span>Answer Encryption</span>
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="text-center">
                                    <p className="text-2xl font-bold text-green-600">
                                        {encryptionStatus.encryptionLevel || 'AES-256'}
                                    </p>
                                    <p className="text-sm text-gray-600">Encryption Level</p>
                                </div>
                                
                                <div className="text-center">
                                    <p className="text-2xl font-bold text-blue-600">
                                        {encryptionStatus.encryptedData || 0}
                                    </p>
                                    <p className="text-sm text-gray-600">Encrypted Records</p>
                                </div>
                                
                                <div className="text-center">
                                    <p className="text-2xl font-bold text-purple-600">
                                        {encryptionStatus.encryptionStatus || 'Active'}
                                    </p>
                                    <p className="text-sm text-gray-600">Status</p>
                                </div>
                            </div>
                            
                            {encryptionStatus.features && (
                                <div>
                                    <h4 className="font-medium text-gray-900 mb-2">Encryption Features</h4>
                                    <div className="space-y-3">
                                        {encryptionStatus.features.map((feature, index) => (
                                            <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                                                <div className="flex items-center space-x-3">
                                                    <CheckCircle className="w-4 h-4 text-green-500" />
                                                    <div>
                                                        <h5 className="font-medium text-gray-900">{feature.name}</h5>
                                                        <p className="text-sm text-gray-600">{feature.description}</p>
                                                    </div>
                                                </div>
                                                
                                                <Badge className={getSecurityLevel(feature.level)}>
                                                    {feature.level}
                                                </Badge>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Session Management */}
            {showSessionManagement && sessionStatus && (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center space-x-2">
                            <Key className="w-5 h-5" />
                            <span>Session Management</span>
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="text-center">
                                    <p className="text-2xl font-bold text-green-600">
                                        {sessionStatus.activeSessions || 0}
                                    </p>
                                    <p className="text-sm text-gray-600">Active Sessions</p>
                                </div>
                                
                                <div className="text-center">
                                    <p className="text-2xl font-bold text-blue-600">
                                        {sessionStatus.sessionTimeout || 0}m
                                    </p>
                                    <p className="text-sm text-gray-600">Session Timeout</p>
                                </div>
                                
                                <div className="text-center">
                                    <p className="text-2xl font-bold text-purple-600">
                                        {sessionStatus.sessionSecurity || 'High'}
                                    </p>
                                    <p className="text-sm text-gray-600">Security Level</p>
                                </div>
                            </div>
                            
                            {sessionStatus.features && (
                                <div>
                                    <h4 className="font-medium text-gray-900 mb-2">Session Features</h4>
                                    <div className="space-y-3">
                                        {sessionStatus.features.map((feature, index) => (
                                            <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                                                <div className="flex items-center space-x-3">
                                                    <CheckCircle className="w-4 h-4 text-green-500" />
                                                    <div>
                                                        <h5 className="font-medium text-gray-900">{feature.name}</h5>
                                                        <p className="text-sm text-gray-600">{feature.description}</p>
                                                    </div>
                                                </div>
                                                
                                                <Badge className={getStatusBadge(feature.status)}>
                                                    {feature.status}
                                                </Badge>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Anti-Cheating */}
            {showAntiCheating && antiCheatingStatus && (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center space-x-2">
                            <Shield className="w-5 h-5" />
                            <span>Anti-Cheating</span>
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="text-center">
                                    <p className="text-2xl font-bold text-green-600">
                                        {antiCheatingStatus.violationsDetected || 0}
                                    </p>
                                    <p className="text-sm text-gray-600">Violations Detected</p>
                                </div>
                                
                                <div className="text-center">
                                    <p className="text-2xl font-bold text-blue-600">
                                        {antiCheatingStatus.protectionLevel || 'High'}
                                    </p>
                                    <p className="text-sm text-gray-600">Protection Level</p>
                                </div>
                                
                                <div className="text-center">
                                    <p className="text-2xl font-bold text-purple-600">
                                        {antiCheatingStatus.monitoringStatus || 'Active'}
                                    </p>
                                    <p className="text-sm text-gray-600">Monitoring Status</p>
                                </div>
                            </div>
                            
                            {antiCheatingStatus.features && (
                                <div>
                                    <h4 className="font-medium text-gray-900 mb-2">Anti-Cheating Features</h4>
                                    <div className="space-y-3">
                                        {antiCheatingStatus.features.map((feature, index) => (
                                            <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                                                <div className="flex items-center space-x-3">
                                                    <Shield className="w-4 h-4 text-blue-500" />
                                                    <div>
                                                        <h5 className="font-medium text-gray-900">{feature.name}</h5>
                                                        <p className="text-sm text-gray-600">{feature.description}</p>
                                                    </div>
                                                </div>
                                                
                                                <Badge className={getStatusBadge(feature.status)}>
                                                    {feature.status}
                                                </Badge>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Data Integrity */}
            {showDataIntegrity && dataIntegrityStatus && (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center space-x-2">
                            <Database className="w-5 h-5" />
                            <span>Data Integrity</span>
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="text-center">
                                    <p className="text-2xl font-bold text-green-600">
                                        {dataIntegrityStatus.integrityChecks || 0}
                                    </p>
                                    <p className="text-sm text-gray-600">Integrity Checks</p>
                                </div>
                                
                                <div className="text-center">
                                    <p className="text-2xl font-bold text-blue-600">
                                        {dataIntegrityStatus.validationStatus || 'Active'}
                                    </p>
                                    <p className="text-sm text-gray-600">Validation Status</p>
                                </div>
                                
                                <div className="text-center">
                                    <p className="text-2xl font-bold text-purple-600">
                                        {dataIntegrityStatus.dataProtection || 'High'}
                                    </p>
                                    <p className="text-sm text-gray-600">Data Protection</p>
                                </div>
                            </div>
                            
                            {dataIntegrityStatus.features && (
                                <div>
                                    <h4 className="font-medium text-gray-900 mb-2">Data Integrity Features</h4>
                                    <div className="space-y-3">
                                        {dataIntegrityStatus.features.map((feature, index) => (
                                            <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                                                <div className="flex items-center space-x-3">
                                                    <Database className="w-4 h-4 text-green-500" />
                                                    <div>
                                                        <h5 className="font-medium text-gray-900">{feature.name}</h5>
                                                        <p className="text-sm text-gray-600">{feature.description}</p>
                                                    </div>
                                                </div>
                                                
                                                <Badge className={getStatusBadge(feature.status)}>
                                                    {feature.status}
                                                </Badge>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Access Control */}
            {showAccessControl && accessControlStatus && (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center space-x-2">
                            <Users className="w-5 h-5" />
                            <span>Access Control</span>
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="text-center">
                                    <p className="text-2xl font-bold text-green-600">
                                        {accessControlStatus.activeUsers || 0}
                                    </p>
                                    <p className="text-sm text-gray-600">Active Users</p>
                                </div>
                                
                                <div className="text-center">
                                    <p className="text-2xl font-bold text-blue-600">
                                        {accessControlStatus.roleBasedAccess || 'Active'}
                                    </p>
                                    <p className="text-sm text-gray-600">Role-Based Access</p>
                                </div>
                                
                                <div className="text-center">
                                    <p className="text-2xl font-bold text-purple-600">
                                        {accessControlStatus.permissionLevel || 'High'}
                                    </p>
                                    <p className="text-sm text-gray-600">Permission Level</p>
                                </div>
                            </div>
                            
                            {accessControlStatus.features && (
                                <div>
                                    <h4 className="font-medium text-gray-900 mb-2">Access Control Features</h4>
                                    <div className="space-y-3">
                                        {accessControlStatus.features.map((feature, index) => (
                                            <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                                                <div className="flex items-center space-x-3">
                                                    <Users className="w-4 h-4 text-purple-500" />
                                                    <div>
                                                        <h5 className="font-medium text-gray-900">{feature.name}</h5>
                                                        <p className="text-sm text-gray-600">{feature.description}</p>
                                                    </div>
                                                </div>
                                                
                                                <Badge className={getStatusBadge(feature.status)}>
                                                    {feature.status}
                                                </Badge>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Actions */}
            <div className="flex justify-center space-x-4">
                <Button 
                    onClick={() => downloadSecurityReport('pdf')}
                    variant="outline"
                >
                    <Download className="w-4 h-4 mr-2" />
                    Download Security Report
                </Button>
                
                <Button 
                    onClick={() => downloadSecurityReport('excel')}
                    variant="outline"
                >
                    <Download className="w-4 h-4 mr-2" />
                    Download Excel Report
                </Button>
                
                <Button 
                    onClick={loadSecurityFeatures}
                    variant="outline"
                >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Refresh
                </Button>
            </div>
        </div>
    );
};

export default SecurityFeatures;
