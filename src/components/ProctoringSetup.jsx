import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { Alert, AlertDescription } from './ui/alert';
import { 
    Camera, 
    Mic, 
    Monitor, 
    Shield, 
    CheckCircle, 
    XCircle, 
    AlertTriangle,
    Settings,
    Play,
    Pause,
    Square,
    Volume2,
    VolumeX,
    Video,
    VideoOff,
    Maximize,
    Minimize,
    Lock,
    Unlock
} from 'lucide-react';
import { toast } from 'react-hot-toast';

const ProctoringSetup = ({ 
    onSetupComplete, 
    onSetupFailed,
    requirements = {
        webcam: true,
        microphone: true,
        fullscreen: true,
        screenRecording: false,
        browserLockdown: true
    }
}) => {
    const [setupSteps, setSetupSteps] = useState([]);
    const [currentStep, setCurrentStep] = useState(0);
    const [isSetupComplete, setIsSetupComplete] = useState(false);
    const [setupProgress, setSetupProgress] = useState(0);
    const [permissions, setPermissions] = useState({
        webcam: false,
        microphone: false,
        fullscreen: false,
        screenRecording: false
    });
    const [deviceInfo, setDeviceInfo] = useState({
        webcam: null,
        microphone: null,
        screen: null
    });
    const [isTesting, setIsTesting] = useState(false);
    const [testResults, setTestResults] = useState({});
    
    const videoRef = useRef(null);
    const audioRef = useRef(null);
    const streamRef = useRef(null);

    useEffect(() => {
        initializeSetup();
    }, []);

    const initializeSetup = () => {
        const steps = [];
        
        if (requirements.webcam) {
            steps.push({
                id: 'webcam',
                title: 'Webcam Setup',
                description: 'Configure your webcam for proctoring',
                icon: Camera,
                required: true
            });
        }
        
        if (requirements.microphone) {
            steps.push({
                id: 'microphone',
                title: 'Microphone Setup',
                description: 'Configure your microphone for proctoring',
                icon: Mic,
                required: true
            });
        }
        
        if (requirements.fullscreen) {
            steps.push({
                id: 'fullscreen',
                title: 'Fullscreen Mode',
                description: 'Enable fullscreen mode for secure assessment',
                icon: Monitor,
                required: true
            });
        }
        
        if (requirements.screenRecording) {
            steps.push({
                id: 'screenRecording',
                title: 'Screen Recording',
                description: 'Configure screen recording for proctoring',
                icon: Video,
                required: false
            });
        }
        
        if (requirements.browserLockdown) {
            steps.push({
                id: 'browserLockdown',
                title: 'Browser Security',
                description: 'Enable browser lockdown for secure assessment',
                icon: Shield,
                required: true
            });
        }
        
        setSetupSteps(steps);
    };

    const startSetup = async () => {
        try {
            for (let i = 0; i < setupSteps.length; i++) {
                setCurrentStep(i);
                setSetupProgress((i / setupSteps.length) * 100);
                
                const step = setupSteps[i];
                const result = await executeStep(step);
                
                if (result.success) {
                    setPermissions(prev => ({
                        ...prev,
                        [step.id]: true
                    }));
                } else {
                    if (step.required) {
                        toast.error(`Required step failed: ${step.title}`);
                        if (onSetupFailed) {
                            onSetupFailed(step, result.error);
                        }
                        return;
                    } else {
                        toast.warning(`Optional step failed: ${step.title}`);
                    }
                }
                
                // Add delay between steps
                await new Promise(resolve => setTimeout(resolve, 500)); // Reduced from 1000ms
            }
            
            setSetupProgress(100);
            setIsSetupComplete(true);
            
            if (onSetupComplete) {
                onSetupComplete(permissions, deviceInfo);
            }
            
            toast.success('Proctoring setup completed successfully');
        } catch (error) {
            console.error('Setup error:', error);
            toast.error('Setup failed');
            if (onSetupFailed) {
                onSetupFailed(null, error.message);
            }
        }
    };

    const executeStep = async (step) => {
        try {
            switch (step.id) {
                case 'webcam':
                    return await setupWebcam();
                case 'microphone':
                    return await setupMicrophone();
                case 'fullscreen':
                    return await setupFullscreen();
                case 'screenRecording':
                    return await setupScreenRecording();
                case 'browserLockdown':
                    return await setupBrowserLockdown();
                default:
                    return { success: false, error: 'Unknown step' };
            }
        } catch (error) {
            return { success: false, error: error.message };
        }
    };

    const setupWebcam = async () => {
        try {
            if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
                throw new Error('Webcam access not supported');
            }
            
            const stream = await navigator.mediaDevices.getUserMedia({
                video: {
                    width: { ideal: 1280, min: 640 },
                    height: { ideal: 720, min: 480 },
                    frameRate: { ideal: 30, min: 15 }
                }
            });
            
            const videoTrack = stream.getVideoTracks()[0];
            const settings = videoTrack.getSettings();
            
            setDeviceInfo(prev => ({
                ...prev,
                webcam: {
                    deviceId: settings.deviceId,
                    label: videoTrack.label,
                    resolution: `${settings.width}x${settings.height}`,
                    frameRate: settings.frameRate
                }
            }));
            
            // Test webcam
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                videoRef.current.play();
            }
            
            streamRef.current = stream;
            
            return { success: true };
        } catch (error) {
            return { success: false, error: error.message };
        }
    };

    const setupMicrophone = async () => {
        try {
            if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
                throw new Error('Microphone access not supported');
            }
            
            const stream = await navigator.mediaDevices.getUserMedia({
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    autoGainControl: true,
                    sampleRate: { ideal: 44100 }
                }
            });
            
            const audioTrack = stream.getAudioTracks()[0];
            const settings = audioTrack.getSettings();
            
            setDeviceInfo(prev => ({
                ...prev,
                microphone: {
                    deviceId: settings.deviceId,
                    label: audioTrack.label,
                    sampleRate: settings.sampleRate,
                    channelCount: settings.channelCount
                }
            }));
            
            // Test microphone
            if (audioRef.current) {
                audioRef.current.srcObject = stream;
                audioRef.current.play();
            }
            
            return { success: true };
        } catch (error) {
            return { success: false, error: error.message };
        }
    };

    const setupFullscreen = async () => {
        try {
            if (!document.fullscreenEnabled) {
                throw new Error('Fullscreen not supported');
            }
            
            // Test fullscreen capability
            const element = document.documentElement;
            if (element.requestFullscreen) {
                await element.requestFullscreen();
                await document.exitFullscreen();
            } else {
                throw new Error('Fullscreen API not available');
            }
            
            return { success: true };
        } catch (error) {
            return { success: false, error: error.message };
        }
    };

    const setupScreenRecording = async () => {
        try {
            if (!navigator.mediaDevices || !navigator.mediaDevices.getDisplayMedia) {
                throw new Error('Screen recording not supported');
            }
            
            // Test screen recording capability
            const stream = await navigator.mediaDevices.getDisplayMedia({
                video: true,
                audio: true
            });
            
            // Stop the test stream
            stream.getTracks().forEach(track => track.stop());
            
            return { success: true };
        } catch (error) {
            return { success: false, error: error.message };
        }
    };

    const setupBrowserLockdown = async () => {
        try {
            // Test browser lockdown capabilities
            const hasRequiredAPIs = {
                fullscreen: !!document.fullscreenEnabled,
                visibility: !!document.visibilityState,
                focus: !!window.focus,
                blur: !!window.blur
            };
            
            const allAPIsAvailable = Object.values(hasRequiredAPIs).every(Boolean);
            
            if (!allAPIsAvailable) {
                throw new Error('Browser lockdown APIs not available');
            }
            
            return { success: true };
        } catch (error) {
            return { success: false, error: error.message };
        }
    };

    const testWebcam = async () => {
        setIsTesting(true);
        try {
            if (streamRef.current) {
                const videoTrack = streamRef.current.getVideoTracks()[0];
                const settings = videoTrack.getSettings();
                
                setTestResults(prev => ({
                    ...prev,
                    webcam: {
                        resolution: `${settings.width}x${settings.height}`,
                        frameRate: settings.frameRate,
                        working: true
                    }
                }));
                
                toast.success('Webcam test successful');
            }
        } catch (error) {
            setTestResults(prev => ({
                ...prev,
                webcam: { working: false, error: error.message }
            }));
            toast.error('Webcam test failed');
        } finally {
            setIsTesting(false);
        }
    };

    const testMicrophone = async () => {
        setIsTesting(true);
        try {
            if (streamRef.current) {
                const audioTrack = streamRef.current.getAudioTracks()[0];
                const settings = audioTrack.getSettings();
                
                setTestResults(prev => ({
                    ...prev,
                    microphone: {
                        sampleRate: settings.sampleRate,
                        channelCount: settings.channelCount,
                        working: true
                    }
                }));
                
                toast.success('Microphone test successful');
            }
        } catch (error) {
            setTestResults(prev => ({
                ...prev,
                microphone: { working: false, error: error.message }
            }));
            toast.error('Microphone test failed');
        } finally {
            setIsTesting(false);
        }
    };

    const cleanup = () => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
        }
    };

    useEffect(() => {
        return cleanup;
    }, []);

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
            return <Badge className="bg-green-100 text-green-800">Completed</Badge>;
        } else if (index === currentStep) {
            return <Badge className="bg-blue-100 text-blue-800">In Progress</Badge>;
        } else {
            return <Badge className="bg-gray-100 text-gray-800">Pending</Badge>;
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="text-center">
                <h2 className="text-3xl font-bold text-gray-900">Proctoring Setup</h2>
                <p className="text-gray-600 mt-2">Configure your system for secure assessment proctoring</p>
            </div>

            {/* Progress */}
            <Card>
                <CardContent className="p-6">
                    <div className="space-y-4">
                        <div className="flex justify-between items-center">
                            <span className="text-sm font-medium text-gray-700">Setup Progress</span>
                            <span className="text-sm text-gray-500">{Math.round(setupProgress)}%</span>
                        </div>
                        <Progress value={setupProgress} className="w-full" />
                        
                        {currentStep < setupSteps.length && (
                            <p className="text-sm text-gray-600 text-center">
                                {setupSteps[currentStep]?.title} - {setupSteps[currentStep]?.description}
                            </p>
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* Setup Steps */}
            <div className="space-y-4">
                {setupSteps.map((step, index) => {
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
                                
                                {/* Device Info */}
                                {index < currentStep && deviceInfo[step.id] && (
                                    <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                                        <h4 className="text-sm font-medium text-gray-700 mb-2">Device Information:</h4>
                                        <div className="grid grid-cols-2 gap-2 text-xs text-gray-600">
                                            {Object.entries(deviceInfo[step.id]).map(([key, value]) => (
                                                <div key={key}>
                                                    <span className="font-medium">{key}:</span> {value}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                                
                                {/* Test Results */}
                                {index < currentStep && testResults[step.id] && (
                                    <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                                        <h4 className="text-sm font-medium text-gray-700 mb-2">Test Results:</h4>
                                        <div className="flex items-center space-x-2">
                                            {testResults[step.id].working ? (
                                                <CheckCircle className="w-4 h-4 text-green-500" />
                                            ) : (
                                                <XCircle className="w-4 h-4 text-red-500" />
                                            )}
                                            <span className="text-sm text-gray-600">
                                                {testResults[step.id].working ? 'Working' : 'Failed'}
                                            </span>
                                        </div>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    );
                })}
            </div>

            {/* Video Preview */}
            {permissions.webcam && (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center space-x-2">
                            <Camera className="w-5 h-5" />
                            <span>Webcam Preview</span>
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            <div className="relative">
                                <video
                                    ref={videoRef}
                                    className="w-full max-w-md mx-auto rounded-lg border"
                                    autoPlay
                                    muted
                                    playsInline
                                />
                            </div>
                            
                            <div className="flex justify-center space-x-2">
                                <Button 
                                    onClick={testWebcam}
                                    disabled={isTesting}
                                    variant="outline"
                                    size="sm"
                                >
                                    {isTesting ? (
                                        <>
                                            <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mr-2" />
                                            Testing...
                                        </>
                                    ) : (
                                        <>
                                            <Play className="w-4 h-4 mr-2" />
                                            Test Webcam
                                        </>
                                    )}
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Audio Preview */}
            {permissions.microphone && (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center space-x-2">
                            <Mic className="w-5 h-5" />
                            <span>Microphone Test</span>
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            <div className="text-center">
                                <div className="w-16 h-16 mx-auto bg-gray-100 rounded-full flex items-center justify-center">
                                    <Mic className="w-8 h-8 text-gray-600" />
                                </div>
                                <p className="text-sm text-gray-600 mt-2">
                                    Speak into your microphone to test audio levels
                                </p>
                            </div>
                            
                            <div className="flex justify-center space-x-2">
                                <Button 
                                    onClick={testMicrophone}
                                    disabled={isTesting}
                                    variant="outline"
                                    size="sm"
                                >
                                    {isTesting ? (
                                        <>
                                            <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mr-2" />
                                            Testing...
                                        </>
                                    ) : (
                                        <>
                                            <Play className="w-4 h-4 mr-2" />
                                            Test Microphone
                                        </>
                                    )}
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Setup Complete */}
            {isSetupComplete && (
                <Card className="border-green-200 bg-green-50">
                    <CardContent className="p-6">
                        <div className="text-center space-y-4">
                            <CheckCircle className="w-16 h-16 text-green-500 mx-auto" />
                            <div>
                                <h3 className="text-xl font-bold text-green-800">Setup Complete!</h3>
                                <p className="text-green-600">
                                    Your system is now configured for secure assessment proctoring
                                </p>
                            </div>
                            
                            <div className="flex justify-center space-x-4">
                                <Button 
                                    onClick={onSetupComplete}
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
            {!isSetupComplete && (
                <div className="flex justify-center space-x-4">
                    <Button 
                        onClick={startSetup}
                        disabled={currentStep > 0}
                        className="bg-blue-600 hover:bg-blue-700"
                    >
                        <Settings className="w-4 h-4 mr-2" />
                        Start Setup
                    </Button>
                    
                    <Button 
                        onClick={cleanup}
                        variant="outline"
                    >
                        <Square className="w-4 h-4 mr-2" />
                        Cleanup
                    </Button>
                </div>
            )}

            {/* Hidden video and audio elements */}
            <video ref={videoRef} style={{ display: 'none' }} />
            <audio ref={audioRef} style={{ display: 'none' }} />
        </div>
    );
};

export default ProctoringSetup;
