import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import { Alert, AlertDescription } from './ui/alert';
import { 
    Lock, 
    Shield, 
    Globe, 
    Smartphone, 
    CheckCircle, 
    XCircle, 
    AlertTriangle,
    Eye,
    EyeOff,
    RefreshCw,
    Wifi,
    WifiOff,
    MapPin,
    Clock,
    User
} from 'lucide-react';
import { toast } from 'react-hot-toast';

const AccessVerification = ({ 
    assessmentId,
    onVerificationComplete, 
    onVerificationFailed,
    requirements = {
        password: true,
        deviceVerification: true,
        ipValidation: true,
        timeValidation: true
    }
}) => {
    const [verificationSteps, setVerificationSteps] = useState([]);
    const [currentStep, setCurrentStep] = useState(0);
    const [isVerifying, setIsVerifying] = useState(false);
    const [verificationProgress, setVerificationProgress] = useState(0);
    const [verificationResults, setVerificationResults] = useState({});
    const [isVerificationComplete, setIsVerificationComplete] = useState(false);
    const [failedVerifications, setFailedVerifications] = useState([]);
    
    // Form states
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [deviceInfo, setDeviceInfo] = useState({});
    const [ipInfo, setIpInfo] = useState({});
    const [timeInfo, setTimeInfo] = useState({});

    useEffect(() => {
        initializeVerification();
        loadSystemInfo();
    }, []);

    const initializeVerification = () => {
        const steps = [];
        
        if (requirements.password) {
            steps.push({
                id: 'password',
                title: 'Password Verification',
                description: 'Enter the assessment password',
                icon: Lock,
                required: true
            });
        }
        
        if (requirements.deviceVerification) {
            steps.push({
                id: 'deviceVerification',
                title: 'Device Verification',
                description: 'Verify your device and browser',
                icon: Smartphone,
                required: true
            });
        }
        
        if (requirements.ipValidation) {
            steps.push({
                id: 'ipValidation',
                title: 'IP Address Validation',
                description: 'Verify your network location',
                icon: Globe,
                required: true
            });
        }
        
        if (requirements.timeValidation) {
            steps.push({
                id: 'timeValidation',
                title: 'Time Validation',
                description: 'Verify assessment timing',
                icon: Clock,
                required: true
            });
        }
        
        setVerificationSteps(steps);
    };

    const loadSystemInfo = async () => {
        try {
            // Load device info
            const device = {
                userAgent: navigator.userAgent,
                platform: navigator.platform,
                language: navigator.language,
                screenResolution: `${screen.width}x${screen.height}`,
                colorDepth: screen.colorDepth,
                timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
                timestamp: new Date().toISOString()
            };
            setDeviceInfo(device);
            
            // Load IP info
            const ipResponse = await fetch('/api/assessment/ip-info');
            if (ipResponse.ok) {
                const ipData = await ipResponse.json();
                setIpInfo(ipData);
            }
            
            // Load time info
            const time = {
                currentTime: new Date().toISOString(),
                timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
                offset: new Date().getTimezoneOffset(),
                timestamp: Date.now()
            };
            setTimeInfo(time);
        } catch (error) {
            console.error('Error loading system info:', error);
        }
    };

    const startVerification = async () => {
        setIsVerifying(true);
        setVerificationProgress(0);
        setFailedVerifications([]);
        
        try {
            for (let i = 0; i < verificationSteps.length; i++) {
                setCurrentStep(i);
                setVerificationProgress((i / verificationSteps.length) * 100);
                
                const step = verificationSteps[i];
                const result = await executeVerificationStep(step);
                
                setVerificationResults(prev => ({
                    ...prev,
                    [step.id]: result
                }));
                
                if (result.success) {
                    toast.success(`${step.title} verified`);
                } else {
                    if (step.required) {
                        setFailedVerifications(prev => [...prev, { step, result }]);
                        toast.error(`${step.title} verification failed`);
                        if (onVerificationFailed) {
                            onVerificationFailed(step, result.error);
                        }
                        return;
                    } else {
                        toast.warning(`${step.title} verification failed (optional)`);
                    }
                }
                
                // Add delay between steps
                await new Promise(resolve => setTimeout(resolve, 500)); // Reduced from 1000ms
            }
            
            setVerificationProgress(100);
            setIsVerificationComplete(true);
            
            if (onVerificationComplete) {
                onVerificationComplete(verificationResults);
            }
            
            toast.success('All verifications completed successfully');
        } catch (error) {
            console.error('Verification error:', error);
            toast.error('Verification failed');
            if (onVerificationFailed) {
                onVerificationFailed(null, error.message);
            }
        } finally {
            setIsVerifying(false);
        }
    };

    const executeVerificationStep = async (step) => {
        try {
            switch (step.id) {
                case 'password':
                    return await verifyPassword();
                case 'deviceVerification':
                    return await verifyDevice();
                case 'ipValidation':
                    return await verifyIP();
                case 'timeValidation':
                    return await verifyTime();
                default:
                    return { success: false, error: 'Unknown verification step' };
            }
        } catch (error) {
            return { success: false, error: error.message };
        }
    };

    const verifyPassword = async () => {
        try {
            if (!password.trim()) {
                return { success: false, error: 'Password is required' };
            }
            
            const response = await fetch('/api/assessment/verify-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    assessmentId,
                    password: password.trim()
                })
            });
            
            if (!response.ok) {
                const errorData = await response.json();
                return { success: false, error: errorData.message || 'Password verification failed' };
            }
            
            const result = await response.json();
            return { success: true, data: result };
        } catch (error) {
            return { success: false, error: error.message };
        }
    };

    const verifyDevice = async () => {
        try {
            const response = await fetch('/api/assessment/verify-device', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    assessmentId,
                    deviceInfo
                })
            });
            
            if (!response.ok) {
                const errorData = await response.json();
                return { success: false, error: errorData.message || 'Device verification failed' };
            }
            
            const result = await response.json();
            return { success: true, data: result };
        } catch (error) {
            return { success: false, error: error.message };
        }
    };

    const verifyIP = async () => {
        try {
            const response = await fetch('/api/assessment/verify-ip', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    assessmentId,
                    ipInfo
                })
            });
            
            if (!response.ok) {
                const errorData = await response.json();
                return { success: false, error: errorData.message || 'IP verification failed' };
            }
            
            const result = await response.json();
            return { success: true, data: result };
        } catch (error) {
            return { success: false, error: error.message };
        }
    };

    const verifyTime = async () => {
        try {
            const response = await fetch('/api/assessment/verify-time', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    assessmentId,
                    timeInfo
                })
            });
            
            if (!response.ok) {
                const errorData = await response.json();
                return { success: false, error: errorData.message || 'Time verification failed' };
            }
            
            const result = await response.json();
            return { success: true, data: result };
        } catch (error) {
            return { success: false, error: error.message };
        }
    };

    const getStepIcon = (step, index) => {
        if (index < currentStep) {
            return <CheckCircle className="w-5 h-5 text-green-500" />;
        } else if (index === currentStep) {
            return <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />;
        } else {
            return <div className="w-5 h-5 border-2 border-gray-300 rounded-full" />;
        }
    };

    const getStepStatus = (step, index) => {
        if (index < currentStep) {
            return <Badge className="bg-green-100 text-green-800">Verified</Badge>;
        } else if (index === currentStep) {
            return <Badge className="bg-blue-100 text-blue-800">Verifying</Badge>;
        } else {
            return <Badge className="bg-gray-100 text-gray-800">Pending</Badge>;
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="text-center">
                <h2 className="text-3xl font-bold text-gray-900">Access Verification</h2>
                <p className="text-gray-600 mt-2">Verify your access to this assessment</p>
            </div>

            {/* Progress */}
            {isVerifying && (
                <Card>
                    <CardContent className="p-6">
                        <div className="space-y-4">
                            <div className="flex justify-between items-center">
                                <span className="text-sm font-medium text-gray-700">Verification Progress</span>
                                <span className="text-sm text-gray-500">{Math.round(verificationProgress)}%</span>
                            </div>
                            <Progress value={verificationProgress} className="w-full" />
                            
                            {currentStep < verificationSteps.length && (
                                <p className="text-sm text-gray-600 text-center">
                                    {verificationSteps[currentStep]?.title} - {verificationSteps[currentStep]?.description}
                                </p>
                            )}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Password Input */}
            {requirements.password && (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center space-x-2">
                            <Lock className="w-5 h-5" />
                            <span>Assessment Password</span>
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            <div className="relative">
                                <Input
                                    type={showPassword ? 'text' : 'password'}
                                    placeholder="Enter assessment password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="pr-10"
                                />
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                                    onClick={() => setShowPassword(!showPassword)}
                                >
                                    {showPassword ? (
                                        <EyeOff className="h-4 w-4" />
                                    ) : (
                                        <Eye className="h-4 w-4" />
                                    )}
                                </Button>
                            </div>
                            
                            <p className="text-sm text-gray-600">
                                Enter the password provided by your instructor to access this assessment.
                            </p>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Verification Steps */}
            <div className="space-y-4">
                {verificationSteps.map((step, index) => {
                    const Icon = step.icon;
                    return (
                        <Card key={step.id} className={index <= currentStep ? 'border-blue-200' : 'border-gray-200'}>
                            <CardContent className="p-4">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center space-x-3">
                                        {getStepIcon(step, index)}
                                        <Icon className="w-5 h-5 text-gray-600" />
                                        <div>
                                            <h3 className="font-medium text-gray-900">{step.title}</h3>
                                            <p className="text-sm text-gray-600">{step.description}</p>
                                        </div>
                                    </div>
                                    
                                    <div className="flex items-center space-x-2">
                                        {getStepStatus(step, index)}
                                        {step.required && (
                                            <Badge variant="outline" className="text-xs">Required</Badge>
                                        )}
                                    </div>
                                </div>
                                
                                {/* Verification Results */}
                                {index < currentStep && verificationResults[step.id] && (
                                    <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                                        <div className="flex items-center space-x-2">
                                            {verificationResults[step.id].success ? (
                                                <CheckCircle className="w-4 h-4 text-green-500" />
                                            ) : (
                                                <XCircle className="w-4 h-4 text-red-500" />
                                            )}
                                            <span className="text-sm text-gray-700">
                                                {verificationResults[step.id].success ? 'Verified' : 'Failed'}
                                            </span>
                                        </div>
                                        
                                        {!verificationResults[step.id].success && (
                                            <p className="text-xs text-red-600 mt-1">
                                                {verificationResults[step.id].error}
                                            </p>
                                        )}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    );
                })}
            </div>

            {/* System Information */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                        <Shield className="w-5 h-5" />
                        <span>System Information</span>
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div>
                            <p className="text-gray-600">Device:</p>
                            <p className="font-mono text-xs">{deviceInfo.platform}</p>
                        </div>
                        
                        <div>
                            <p className="text-gray-600">Browser:</p>
                            <p className="font-mono text-xs">{deviceInfo.userAgent?.split(' ')[0]}</p>
                        </div>
                        
                        <div>
                            <p className="text-gray-600">Screen Resolution:</p>
                            <p className="font-mono text-xs">{deviceInfo.screenResolution}</p>
                        </div>
                        
                        <div>
                            <p className="text-gray-600">Timezone:</p>
                            <p className="font-mono text-xs">{deviceInfo.timezone}</p>
                        </div>
                        
                        {ipInfo.ip && (
                            <div>
                                <p className="text-gray-600">IP Address:</p>
                                <p className="font-mono text-xs">{ipInfo.ip}</p>
                            </div>
                        )}
                        
                        {ipInfo.location && (
                            <div>
                                <p className="text-gray-600">Location:</p>
                                <p className="font-mono text-xs">{ipInfo.location}</p>
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* Failed Verifications */}
            {failedVerifications.length > 0 && (
                <Alert className="border-red-200 bg-red-50">
                    <AlertTriangle className="w-4 h-4 text-red-600" />
                    <AlertDescription>
                        <div className="space-y-2">
                            <p className="font-medium">Verification Failed:</p>
                            <ul className="list-disc list-inside space-y-1">
                                {failedVerifications.map(({ step, result }, index) => (
                                    <li key={index} className="text-sm">
                                        {step.title}: {result.error}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </AlertDescription>
                </Alert>
            )}

            {/* Verification Complete */}
            {isVerificationComplete && (
                <Card className="border-green-200 bg-green-50">
                    <CardContent className="p-6">
                        <div className="text-center space-y-4">
                            <CheckCircle className="w-16 h-16 text-green-500 mx-auto" />
                            <div>
                                <h3 className="text-xl font-bold text-green-800">Verification Complete!</h3>
                                <p className="text-green-600">
                                    All access verifications have been completed successfully
                                </p>
                            </div>
                            
                            <div className="flex justify-center space-x-4">
                                <Button 
                                    onClick={onVerificationComplete}
                                    className="bg-green-600 hover:bg-green-700"
                                >
                                    <CheckCircle className="w-4 h-4 mr-2" />
                                    Continue to Assessment
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Actions */}
            {!isVerificationComplete && (
                <div className="flex justify-center space-x-4">
                    <Button 
                        onClick={startVerification}
                        disabled={isVerifying || (requirements.password && !password.trim())}
                        className="bg-blue-600 hover:bg-blue-700"
                    >
                        {isVerifying ? (
                            <>
                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                                Verifying...
                            </>
                        ) : (
                            <>
                                <Shield className="w-4 h-4 mr-2" />
                                Start Verification
                            </>
                        )}
                    </Button>
                    
                    <Button 
                        onClick={loadSystemInfo}
                        variant="outline"
                    >
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Refresh Info
                    </Button>
                </div>
            )}
        </div>
    );
};

export default AccessVerification;
