import React, { useState, useEffect } from 'react';
import DOMPurify from 'dompurify';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { Checkbox } from './ui/checkbox';
import { Alert, AlertDescription } from './ui/alert';
import { 
    CheckCircle, 
    XCircle, 
    AlertTriangle, 
    Camera, 
    Mic, 
    Monitor, 
    Shield, 
    Clock, 
    Wifi,
    Smartphone,
    Laptop,
    Settings,
    Eye,
    Lock
} from 'lucide-react';
import { toast } from 'react-hot-toast';

const PreAssessmentSetup = ({ assessment, onSetupComplete, onCancel }) => {
    const [currentStep, setCurrentStep] = useState(0);
    const [setupStatus, setSetupStatus] = useState({
        systemRequirements: false,
        proctoringSetup: false,
        accessVerification: false,
        instructionsReview: false,
        attemptValidation: false
    });
    const [requirements, setRequirements] = useState({
        browser: '',
        webcam: false,
        microphone: false,
        fullscreen: false,
        internet: false
    });
    const [proctoringStatus, setProctoringStatus] = useState({
        webcamPermission: false,
        microphonePermission: false,
        fullscreenMode: false,
        browserLockdown: false
    });
    const [accessData, setAccessData] = useState({
        password: '',
        deviceInfo: {},
        clientIP: ''
    });
    const [validationResults, setValidationResults] = useState({});
    const [loading, setLoading] = useState(false);

    const steps = [
        { id: 'systemRequirements', title: 'System Requirements', icon: <Settings className="w-5 h-5" /> },
        { id: 'proctoringSetup', title: 'Proctoring Setup', icon: <Shield className="w-5 h-5" /> },
        { id: 'accessVerification', title: 'Access Verification', icon: <Lock className="w-5 h-5" /> },
        { id: 'instructionsReview', title: 'Instructions Review', icon: <Eye className="w-5 h-5" /> },
        { id: 'attemptValidation', title: 'Attempt Validation', icon: <CheckCircle className="w-5 h-5" /> }
    ];

    useEffect(() => {
        checkSystemRequirements();
        getDeviceInfo();
        getClientIP();
    }, []);

    const checkSystemRequirements = async () => {
        try {
            const browser = getBrowserInfo();
            const webcam = await checkWebcamAccess();
            const microphone = await checkMicrophoneAccess();
            const fullscreen = checkFullscreenSupport();
            const internet = await checkInternetConnection();

            setRequirements({
                browser,
                webcam,
                microphone,
                fullscreen,
                internet
            });

            const allRequirementsMet = webcam && microphone && fullscreen && internet;
            setSetupStatus(prev => ({ ...prev, systemRequirements: allRequirementsMet }));

            if (!allRequirementsMet) {
                toast.error('System requirements not met');
            }
        } catch (error) {
            console.error('Error checking system requirements:', error);
            toast.error('Failed to check system requirements');
        }
    };

    const getBrowserInfo = () => {
        const userAgent = navigator.userAgent;
        if (userAgent.includes('Chrome')) return 'Chrome';
        if (userAgent.includes('Firefox')) return 'Firefox';
        if (userAgent.includes('Safari')) return 'Safari';
        if (userAgent.includes('Edge')) return 'Edge';
        return 'Unknown';
    };

    const checkWebcamAccess = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true });
            stream.getTracks().forEach(track => track.stop());
            return true;
        } catch (error) {
            return false;
        }
    };

    const checkMicrophoneAccess = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            stream.getTracks().forEach(track => track.stop());
            return true;
        } catch (error) {
            return false;
        }
    };

    const checkFullscreenSupport = () => {
        return !!(document.fullscreenEnabled || 
                 document.webkitFullscreenEnabled || 
                 document.mozFullScreenEnabled || 
                 document.msFullscreenEnabled);
    };

    const checkInternetConnection = async () => {
        try {
            const response = await fetch('/api/health', { method: 'HEAD' });
            return response.ok;
        } catch (error) {
            return false;
        }
    };

    const getDeviceInfo = () => {
        const deviceInfo = {
            browser: getBrowserInfo(),
            os: navigator.platform,
            isMobile: /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent),
            screenWidth: window.screen.width,
            screenHeight: window.screen.height,
            userAgent: navigator.userAgent
        };
        setAccessData(prev => ({ ...prev, deviceInfo }));
    };

    const getClientIP = async () => {
        try {
            const response = await fetch('/api/ip');
            const data = await response.json();
            setAccessData(prev => ({ ...prev, clientIP: data.ip }));
        } catch (error) {
            console.error('Error getting client IP:', error);
        }
    };

    const setupProctoring = async () => {
        try {
            setLoading(true);

            // Request webcam permission
            const webcamPermission = await requestWebcamPermission();
            
            // Request microphone permission
            const microphonePermission = await requestMicrophonePermission();
            
            // Enable fullscreen mode
            const fullscreenMode = await enableFullscreenMode();
            
            // Setup browser lockdown
            const browserLockdown = await setupBrowserLockdown();

            setProctoringStatus({
                webcamPermission,
                microphonePermission,
                fullscreenMode,
                browserLockdown
            });

            const allProctoringReady = webcamPermission && microphonePermission && fullscreenMode && browserLockdown;
            setSetupStatus(prev => ({ ...prev, proctoringSetup: allProctoringReady }));

            if (allProctoringReady) {
                toast.success('Proctoring setup completed');
            } else {
                toast.error('Proctoring setup failed');
            }
        } catch (error) {
            console.error('Error setting up proctoring:', error);
            toast.error('Proctoring setup failed');
        } finally {
            setLoading(false);
        }
    };

    const requestWebcamPermission = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ 
                video: { 
                    width: { ideal: 1280 },
                    height: { ideal: 720 }
                } 
            });
            stream.getTracks().forEach(track => track.stop());
            return true;
        } catch (error) {
            return false;
        }
    };

    const requestMicrophonePermission = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ 
                audio: { 
                    echoCancellation: true,
                    noiseSuppression: true
                } 
            });
            stream.getTracks().forEach(track => track.stop());
            return true;
        } catch (error) {
            return false;
        }
    };

    const enableFullscreenMode = async () => {
        try {
            if (document.documentElement.requestFullscreen) {
                await document.documentElement.requestFullscreen();
            } else if (document.documentElement.webkitRequestFullscreen) {
                await document.documentElement.webkitRequestFullscreen();
            } else if (document.documentElement.mozRequestFullScreen) {
                await document.documentElement.mozRequestFullScreen();
            } else if (document.documentElement.msRequestFullscreen) {
                await document.documentElement.msRequestFullscreen();
            }
            return true;
        } catch (error) {
            return false;
        }
    };

    const setupBrowserLockdown = async () => {
        try {
            // Disable right-click
            document.addEventListener('contextmenu', e => e.preventDefault());
            
            // Disable F12, Ctrl+Shift+I, etc.
            document.addEventListener('keydown', e => {
                if (e.key === 'F12' || 
                    (e.ctrlKey && e.shiftKey && e.key === 'I') ||
                    (e.ctrlKey && e.shiftKey && e.key === 'C') ||
                    (e.ctrlKey && e.key === 'U')) {
                    e.preventDefault();
                }
            });
            
            // Disable copy/paste
            document.addEventListener('copy', e => e.preventDefault());
            document.addEventListener('paste', e => e.preventDefault());
            document.addEventListener('cut', e => e.preventDefault());
            
            return true;
        } catch (error) {
            return false;
        }
    };

    const verifyAccess = async () => {
        try {
            setLoading(true);

            const response = await fetch('/api/student-assessments/verify-access', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    assessmentId: assessment.id,
                    accessData
                })
            });

            const result = await response.json();
            setValidationResults(result);
            setSetupStatus(prev => ({ ...prev, accessVerification: result.success }));

            if (result.success) {
                toast.success('Access verified');
            } else {
                toast.error('Access denied: ' + result.message);
            }
        } catch (error) {
            console.error('Error verifying access:', error);
            toast.error('Access verification failed');
        } finally {
            setLoading(false);
        }
    };

    const validateAttempt = async () => {
        try {
            setLoading(true);

            const response = await fetch('/api/student-assessments/validate-attempt', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    assessmentId: assessment.id
                })
            });

            const result = await response.json();
            setSetupStatus(prev => ({ ...prev, attemptValidation: result.success }));

            if (result.success) {
                toast.success('Attempt validated');
            } else {
                toast.error('Attempt validation failed: ' + result.message);
            }
        } catch (error) {
            console.error('Error validating attempt:', error);
            toast.error('Attempt validation failed');
        } finally {
            setLoading(false);
        }
    };

    const handleNext = () => {
        if (currentStep < steps.length - 1) {
            setCurrentStep(currentStep + 1);
        }
    };

    const handlePrevious = () => {
        if (currentStep > 0) {
            setCurrentStep(currentStep - 1);
        }
    };

    const handleComplete = () => {
        const allStepsComplete = Object.values(setupStatus).every(status => status);
        
        if (allStepsComplete) {
            onSetupComplete();
        } else {
            toast.error('Please complete all setup steps');
        }
    };

    const getStepContent = () => {
        switch (currentStep) {
            case 0:
                return <SystemRequirementsStep requirements={requirements} />;
            case 1:
                return <ProctoringSetupStep 
                    proctoringStatus={proctoringStatus} 
                    onSetup={setupProctoring}
                    loading={loading}
                />;
            case 2:
                return <AccessVerificationStep 
                    accessData={accessData}
                    setAccessData={setAccessData}
                    onVerify={verifyAccess}
                    validationResults={validationResults}
                    loading={loading}
                />;
            case 3:
                return <InstructionsReviewStep assessment={assessment} />;
            case 4:
                return <AttemptValidationStep 
                    onValidate={validateAttempt}
                    loading={loading}
                />;
            default:
                return null;
        }
    };

    const completedSteps = Object.values(setupStatus).filter(Boolean).length;
    const progress = (completedSteps / steps.length) * 100;

    return (
        <div className="max-w-4xl mx-auto p-6">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                        <span>Pre-Assessment Setup</span>
                        <Badge variant="outline">
                            {completedSteps}/{steps.length} Complete
                        </Badge>
                    </CardTitle>
                    <Progress value={progress} className="mt-4" />
                </CardHeader>
                
                <CardContent>
                    {/* Step Navigation */}
                    <div className="flex justify-between mb-6">
                        {steps.map((step, index) => (
                            <div key={step.id} className="flex flex-col items-center">
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                                    setupStatus[step.id] ? 'bg-green-100 text-green-600' : 
                                    index === currentStep ? 'bg-blue-100 text-blue-600' : 
                                    'bg-gray-100 text-gray-400'
                                }`}>
                                    {setupStatus[step.id] ? <CheckCircle className="w-5 h-5" /> : step.icon}
                                </div>
                                <span className="text-xs mt-1 text-center">{step.title}</span>
                            </div>
                        ))}
                    </div>

                    {/* Step Content */}
                    <div className="mb-6">
                        {getStepContent()}
                    </div>

                    {/* Navigation Buttons */}
                    <div className="flex justify-between">
                        <div>
                            {currentStep > 0 && (
                                <Button variant="outline" onClick={handlePrevious}>
                                    Previous
                                </Button>
                            )}
                        </div>
                        
                        <div className="flex space-x-2">
                            <Button variant="outline" onClick={onCancel}>
                                Cancel
                            </Button>
                            
                            {currentStep < steps.length - 1 ? (
                                <Button onClick={handleNext}>
                                    Next
                                </Button>
                            ) : (
                                <Button onClick={handleComplete}>
                                    Complete Setup
                                </Button>
                            )}
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};

// Step Components
const SystemRequirementsStep = ({ requirements }) => (
    <div className="space-y-4">
        <h3 className="text-lg font-semibold">System Requirements Check</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <RequirementItem
                icon={<Monitor className="w-5 h-5" />}
                title="Browser Compatibility"
                status={requirements.browser}
                isMet={requirements.browser !== 'Unknown'}
            />
            
            <RequirementItem
                icon={<Camera className="w-5 h-5" />}
                title="Webcam Access"
                status={requirements.webcam ? 'Available' : 'Not Available'}
                isMet={requirements.webcam}
            />
            
            <RequirementItem
                icon={<Mic className="w-5 h-5" />}
                title="Microphone Access"
                status={requirements.microphone ? 'Available' : 'Not Available'}
                isMet={requirements.microphone}
            />
            
            <RequirementItem
                icon={<Monitor className="w-5 h-5" />}
                title="Fullscreen Support"
                status={requirements.fullscreen ? 'Supported' : 'Not Supported'}
                isMet={requirements.fullscreen}
            />
            
            <RequirementItem
                icon={<Wifi className="w-5 h-5" />}
                title="Internet Connection"
                status={requirements.internet ? 'Connected' : 'Disconnected'}
                isMet={requirements.internet}
            />
        </div>
    </div>
);

const ProctoringSetupStep = ({ proctoringStatus, onSetup, loading }) => (
    <div className="space-y-4">
        <h3 className="text-lg font-semibold">Proctoring Setup</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <ProctoringItem
                icon={<Camera className="w-5 h-5" />}
                title="Webcam Permission"
                status={proctoringStatus.webcamPermission ? 'Granted' : 'Not Granted'}
                isMet={proctoringStatus.webcamPermission}
            />
            
            <ProctoringItem
                icon={<Mic className="w-5 h-5" />}
                title="Microphone Permission"
                status={proctoringStatus.microphonePermission ? 'Granted' : 'Not Granted'}
                isMet={proctoringStatus.microphonePermission}
            />
            
            <ProctoringItem
                icon={<Monitor className="w-5 h-5" />}
                title="Fullscreen Mode"
                status={proctoringStatus.fullscreenMode ? 'Enabled' : 'Not Enabled'}
                isMet={proctoringStatus.fullscreenMode}
            />
            
            <ProctoringItem
                icon={<Shield className="w-5 h-5" />}
                title="Browser Lockdown"
                status={proctoringStatus.browserLockdown ? 'Active' : 'Not Active'}
                isMet={proctoringStatus.browserLockdown}
            />
        </div>
        
        <Button onClick={onSetup} disabled={loading} className="w-full">
            {loading ? 'Setting up...' : 'Setup Proctoring'}
        </Button>
    </div>
);

const AccessVerificationStep = ({ accessData, setAccessData, onVerify, validationResults, loading }) => (
    <div className="space-y-4">
        <h3 className="text-lg font-semibold">Access Verification</h3>
        
        {assessment.password_protected && (
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                    Assessment Password
                </label>
                <input
                    type="password"
                    value={accessData.password}
                    onChange={(e) => setAccessData(prev => ({ ...prev, password: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter assessment password"
                />
            </div>
        )}
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
                <h4 className="font-medium text-gray-900">Device Information</h4>
                <div className="text-sm text-gray-600 space-y-1">
                    <div>Browser: {accessData.deviceInfo.browser}</div>
                    <div>OS: {accessData.deviceInfo.os}</div>
                    <div>Screen: {accessData.deviceInfo.screenWidth}x{accessData.deviceInfo.screenHeight}</div>
                    <div>Mobile: {accessData.deviceInfo.isMobile ? 'Yes' : 'No'}</div>
                </div>
            </div>
            
            <div>
                <h4 className="font-medium text-gray-900">Network Information</h4>
                <div className="text-sm text-gray-600">
                    <div>IP Address: {accessData.clientIP}</div>
                </div>
            </div>
        </div>
        
        {validationResults.message && (
            <Alert className={validationResults.success ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}>
                <AlertDescription>
                    {validationResults.message}
                </AlertDescription>
            </Alert>
        )}
        
        <Button onClick={onVerify} disabled={loading} className="w-full">
            {loading ? 'Verifying...' : 'Verify Access'}
        </Button>
    </div>
);

const InstructionsReviewStep = ({ assessment }) => (
    <div className="space-y-4">
        <h3 className="text-lg font-semibold">Assessment Instructions</h3>
        
        <div className="prose max-w-none">
            <div dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(assessment.instructions || 'No specific instructions provided.') }} />
        </div>
        
        <div className="bg-blue-50 p-4 rounded-lg">
            <h4 className="font-medium text-blue-900 mb-2">Important Reminders:</h4>
            <ul className="text-sm text-blue-800 space-y-1">
                <li>• Ensure you have a stable internet connection</li>
                <li>• Do not switch tabs or open other applications</li>
                <li>• Keep your webcam and microphone on throughout the assessment</li>
                <li>• Do not use any external resources or help</li>
                <li>• Complete the assessment within the time limit</li>
            </ul>
        </div>
    </div>
);

const AttemptValidationStep = ({ onValidate, loading }) => (
    <div className="space-y-4">
        <h3 className="text-lg font-semibold">Attempt Validation</h3>
        
        <div className="text-center py-8">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h4 className="text-lg font-medium text-gray-900 mb-2">Ready to Start Assessment</h4>
            <p className="text-gray-600 mb-4">
                All setup steps have been completed. Click the button below to validate your attempt and begin the assessment.
            </p>
            
            <Button onClick={onValidate} disabled={loading} size="lg">
                {loading ? 'Validating...' : 'Start Assessment'}
            </Button>
        </div>
    </div>
);

// Helper Components
const RequirementItem = ({ icon, title, status, isMet }) => (
    <div className="flex items-center space-x-3 p-3 border rounded-lg">
        <div className={`p-2 rounded-full ${isMet ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
            {icon}
        </div>
        <div className="flex-1">
            <div className="font-medium text-gray-900">{title}</div>
            <div className="text-sm text-gray-600">{status}</div>
        </div>
        {isMet ? <CheckCircle className="w-5 h-5 text-green-500" /> : <XCircle className="w-5 h-5 text-red-500" />}
    </div>
);

const ProctoringItem = ({ icon, title, status, isMet }) => (
    <div className="flex items-center space-x-3 p-3 border rounded-lg">
        <div className={`p-2 rounded-full ${isMet ? 'bg-green-100 text-green-600' : 'bg-yellow-100 text-yellow-600'}`}>
            {icon}
        </div>
        <div className="flex-1">
            <div className="font-medium text-gray-900">{title}</div>
            <div className="text-sm text-gray-600">{status}</div>
        </div>
        {isMet ? <CheckCircle className="w-5 h-5 text-green-500" /> : <AlertTriangle className="w-5 h-5 text-yellow-500" />}
    </div>
);

export default PreAssessmentSetup;
