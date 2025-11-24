import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { Alert, AlertDescription } from './ui/alert';
import { 
    CheckCircle, 
    XCircle, 
    AlertTriangle, 
    Monitor, 
    Camera, 
    Mic, 
    Wifi, 
    HardDrive,
    Cpu,
    Memory,
    Globe,
    Shield,
    RefreshCw,
    Download,
    Settings,
    Info
} from 'lucide-react';
import { toast } from 'react-hot-toast';

const SystemRequirementsCheck = ({ 
    onRequirementsMet, 
    onRequirementsFailed,
    requirements = {
        browser: true,
        webcam: true,
        microphone: true,
        fullscreen: true,
        internet: true,
        storage: true,
        performance: true
    }
}) => {
    const [checks, setChecks] = useState({});
    const [isChecking, setIsChecking] = useState(false);
    const [progress, setProgress] = useState(0);
    const [currentCheck, setCurrentCheck] = useState('');
    const [allChecksPassed, setAllChecksPassed] = useState(false);
    const [failedChecks, setFailedChecks] = useState([]);
    const [systemInfo, setSystemInfo] = useState({});

    useEffect(() => {
        runSystemChecks();
    }, []);

    const runSystemChecks = async () => {
        setIsChecking(true);
        setProgress(0);
        setFailedChecks([]);
        
        const checkResults = {};
        let passedChecks = 0;
        const totalChecks = Object.keys(requirements).length;
        
        try {
            // Browser compatibility check
            if (requirements.browser) {
                setCurrentCheck('Checking browser compatibility...');
                const browserCheck = await checkBrowserCompatibility();
                checkResults.browser = browserCheck;
                if (browserCheck.passed) passedChecks++;
                setProgress((passedChecks / totalChecks) * 100);
            }
            
            // Webcam check
            if (requirements.webcam) {
                setCurrentCheck('Checking webcam access...');
                const webcamCheck = await checkWebcamAccess();
                checkResults.webcam = webcamCheck;
                if (webcamCheck.passed) passedChecks++;
                setProgress((passedChecks / totalChecks) * 100);
            }
            
            // Microphone check
            if (requirements.microphone) {
                setCurrentCheck('Checking microphone access...');
                const micCheck = await checkMicrophoneAccess();
                checkResults.microphone = micCheck;
                if (micCheck.passed) passedChecks++;
                setProgress((passedChecks / totalChecks) * 100);
            }
            
            // Fullscreen support check
            if (requirements.fullscreen) {
                setCurrentCheck('Checking fullscreen support...');
                const fullscreenCheck = await checkFullscreenSupport();
                checkResults.fullscreen = fullscreenCheck;
                if (fullscreenCheck.passed) passedChecks++;
                setProgress((passedChecks / totalChecks) * 100);
            }
            
            // Internet connection check
            if (requirements.internet) {
                setCurrentCheck('Checking internet connection...');
                const internetCheck = await checkInternetConnection();
                checkResults.internet = internetCheck;
                if (internetCheck.passed) passedChecks++;
                setProgress((passedChecks / totalChecks) * 100);
            }
            
            // Storage check
            if (requirements.storage) {
                setCurrentCheck('Checking storage availability...');
                const storageCheck = await checkStorageAvailability();
                checkResults.storage = storageCheck;
                if (storageCheck.passed) passedChecks++;
                setProgress((passedChecks / totalChecks) * 100);
            }
            
            // Performance check
            if (requirements.performance) {
                setCurrentCheck('Checking system performance...');
                const performanceCheck = await checkSystemPerformance();
                checkResults.performance = performanceCheck;
                if (performanceCheck.passed) passedChecks++;
                setProgress((passedChecks / totalChecks) * 100);
            }
            
            setChecks(checkResults);
            
            const allPassed = passedChecks === totalChecks;
            setAllChecksPassed(allPassed);
            
            if (allPassed) {
                setCurrentCheck('All requirements met!');
                if (onRequirementsMet) {
                    onRequirementsMet(checkResults);
                }
                toast.success('All system requirements met');
            } else {
                const failed = Object.entries(checkResults)
                    .filter(([key, check]) => !check.passed)
                    .map(([key, check]) => ({ key, ...check }));
                setFailedChecks(failed);
                setCurrentCheck('Some requirements failed');
                if (onRequirementsFailed) {
                    onRequirementsFailed(failed);
                }
                toast.error('Some system requirements failed');
            }
            
        } catch (error) {
            console.error('System check error:', error);
            toast.error('System check failed');
        } finally {
            setIsChecking(false);
        }
    };

    const checkBrowserCompatibility = async () => {
        try {
            const userAgent = navigator.userAgent;
            const isChrome = /Chrome/.test(userAgent) && /Google Inc/.test(navigator.vendor);
            const isFirefox = /Firefox/.test(userAgent);
            const isSafari = /Safari/.test(userAgent) && /Apple Computer/.test(navigator.vendor);
            const isEdge = /Edg/.test(userAgent);
            
            const supportedBrowsers = ['Chrome', 'Firefox', 'Safari', 'Edge'];
            const currentBrowser = isChrome ? 'Chrome' : 
                                 isFirefox ? 'Firefox' : 
                                 isSafari ? 'Safari' : 
                                 isEdge ? 'Edge' : 'Unknown';
            
            const isSupported = isChrome || isFirefox || isSafari || isEdge;
            
            // Check for required features
            const hasRequiredFeatures = {
                webRTC: !!navigator.mediaDevices,
                fullscreen: !!document.documentElement.requestFullscreen,
                localStorage: !!window.localStorage,
                webGL: !!document.createElement('canvas').getContext('webgl')
            };
            
            const allFeaturesSupported = Object.values(hasRequiredFeatures).every(Boolean);
            
            return {
                passed: isSupported && allFeaturesSupported,
                browser: currentBrowser,
                version: navigator.appVersion,
                features: hasRequiredFeatures,
                message: isSupported ? 
                    `${currentBrowser} browser is supported` : 
                    'Unsupported browser detected'
            };
        } catch (error) {
            return {
                passed: false,
                message: 'Browser compatibility check failed',
                error: error.message
            };
        }
    };

    const checkWebcamAccess = async () => {
        try {
            if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
                return {
                    passed: false,
                    message: 'Webcam access not supported',
                    error: 'getUserMedia not available'
                };
            }
            
            const stream = await navigator.mediaDevices.getUserMedia({ 
                video: { 
                    width: { ideal: 1280 },
                    height: { ideal: 720 },
                    frameRate: { ideal: 30 }
                } 
            });
            
            const videoTrack = stream.getVideoTracks()[0];
            const settings = videoTrack.getSettings();
            
            // Stop the stream
            stream.getTracks().forEach(track => track.stop());
            
            return {
                passed: true,
                message: 'Webcam access granted',
                resolution: `${settings.width}x${settings.height}`,
                frameRate: settings.frameRate,
                deviceId: videoTrack.getSettings().deviceId
            };
        } catch (error) {
            return {
                passed: false,
                message: 'Webcam access denied or not available',
                error: error.message
            };
        }
    };

    const checkMicrophoneAccess = async () => {
        try {
            if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
                return {
                    passed: false,
                    message: 'Microphone access not supported',
                    error: 'getUserMedia not available'
                };
            }
            
            const stream = await navigator.mediaDevices.getUserMedia({ 
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    autoGainControl: true
                }
            });
            
            const audioTrack = stream.getAudioTracks()[0];
            const settings = audioTrack.getSettings();
            
            // Stop the stream
            stream.getTracks().forEach(track => track.stop());
            
            return {
                passed: true,
                message: 'Microphone access granted',
                sampleRate: settings.sampleRate,
                channelCount: settings.channelCount,
                deviceId: audioTrack.getSettings().deviceId
            };
        } catch (error) {
            return {
                passed: false,
                message: 'Microphone access denied or not available',
                error: error.message
            };
        }
    };

    const checkFullscreenSupport = async () => {
        try {
            const hasFullscreenAPI = !!(
                document.fullscreenEnabled ||
                document.webkitFullscreenEnabled ||
                document.mozFullScreenEnabled ||
                document.msFullscreenEnabled
            );
            
            if (!hasFullscreenAPI) {
                return {
                    passed: false,
                    message: 'Fullscreen API not supported',
                    error: 'Fullscreen not available'
                };
            }
            
            return {
                passed: true,
                message: 'Fullscreen support available',
                api: 'Fullscreen API supported'
            };
        } catch (error) {
            return {
                passed: false,
                message: 'Fullscreen support check failed',
                error: error.message
            };
        }
    };

    const checkInternetConnection = async () => {
        try {
            const startTime = Date.now();
            const response = await fetch('/api/health', {
                method: 'GET',
                cache: 'no-cache'
            });
            const endTime = Date.now();
            
            const latency = endTime - startTime;
            const isOnline = navigator.onLine;
            
            return {
                passed: response.ok && isOnline,
                message: response.ok ? 'Internet connection stable' : 'Internet connection unstable',
                latency: latency,
                status: response.status,
                online: isOnline
            };
        } catch (error) {
            return {
                passed: false,
                message: 'Internet connection failed',
                error: error.message
            };
        }
    };

    const checkStorageAvailability = async () => {
        try {
            if (!window.localStorage) {
                return {
                    passed: false,
                    message: 'Local storage not supported',
                    error: 'localStorage not available'
                };
            }
            
            // Test localStorage
            const testKey = 'system_check_test';
            const testValue = 'test_data';
            
            try {
                localStorage.setItem(testKey, testValue);
                const retrieved = localStorage.getItem(testKey);
                localStorage.removeItem(testKey);
                
                if (retrieved !== testValue) {
                    throw new Error('Local storage test failed');
                }
            } catch (error) {
                return {
                    passed: false,
                    message: 'Local storage test failed',
                    error: error.message
                };
            }
            
            // Check available storage
            if ('storage' in navigator && 'estimate' in navigator.storage) {
                const estimate = await navigator.storage.estimate();
                const availableSpace = estimate.quota - estimate.usage;
                const availableSpaceMB = Math.round(availableSpace / (1024 * 1024));
                
                return {
                    passed: true,
                    message: 'Storage available',
                    availableSpace: availableSpaceMB,
                    quota: Math.round(estimate.quota / (1024 * 1024)),
                    usage: Math.round(estimate.usage / (1024 * 1024))
                };
            }
            
            return {
                passed: true,
                message: 'Storage available (estimate not supported)'
            };
        } catch (error) {
            return {
                passed: false,
                message: 'Storage check failed',
                error: error.message
            };
        }
    };

    const checkSystemPerformance = async () => {
        try {
            const startTime = performance.now();
            
            // Simple performance test
            let iterations = 0;
            const testStart = performance.now();
            while (performance.now() - testStart < 100) {
                iterations++;
            }
            const testEnd = performance.now();
            
            const performanceScore = iterations / (testEnd - testStart);
            const isPerformanceGood = performanceScore > 1000; // Threshold for good performance
            
            // Check memory (if available)
            let memoryInfo = null;
            if (performance.memory) {
                memoryInfo = {
                    used: Math.round(performance.memory.usedJSHeapSize / (1024 * 1024)),
                    total: Math.round(performance.memory.totalJSHeapSize / (1024 * 1024)),
                    limit: Math.round(performance.memory.jsHeapSizeLimit / (1024 * 1024))
                };
            }
            
            return {
                passed: isPerformanceGood,
                message: isPerformanceGood ? 'System performance is good' : 'System performance is poor',
                performanceScore: Math.round(performanceScore),
                memoryInfo: memoryInfo,
                executionTime: Math.round(performance.now() - startTime)
            };
        } catch (error) {
            return {
                passed: false,
                message: 'Performance check failed',
                error: error.message
            };
        }
    };

    const getCheckIcon = (passed) => {
        return passed ? 
            <CheckCircle className="w-5 h-5 text-green-500" /> : 
            <XCircle className="w-5 h-5 text-red-500" />;
    };

    const getCheckColor = (passed) => {
        return passed ? 'text-green-600' : 'text-red-600';
    };

    const getCheckBadge = (passed) => {
        return passed ? 
            <Badge className="bg-green-100 text-green-800">Passed</Badge> : 
            <Badge className="bg-red-100 text-red-800">Failed</Badge>;
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="text-center">
                <h2 className="text-3xl font-bold text-gray-900">System Requirements Check</h2>
                <p className="text-gray-600 mt-2">Ensuring your system meets the requirements for this assessment</p>
            </div>

            {/* Progress */}
            {isChecking && (
                <Card>
                    <CardContent className="p-6">
                        <div className="text-center space-y-4">
                            <div className="flex items-center justify-center space-x-2">
                                <RefreshCw className="w-5 h-5 animate-spin text-blue-500" />
                                <span className="text-lg font-medium">Running System Checks...</span>
                            </div>
                            
                            <div className="space-y-2">
                                <div className="flex justify-between text-sm text-gray-600">
                                    <span>Progress</span>
                                    <span>{Math.round(progress)}%</span>
                                </div>
                                <Progress value={progress} className="w-full" />
                            </div>
                            
                            <p className="text-sm text-gray-500">{currentCheck}</p>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Check Results */}
            {!isChecking && Object.keys(checks).length > 0 && (
                <div className="space-y-4">
                    {/* Overall Status */}
                    <Card className={allChecksPassed ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}>
                        <CardContent className="p-6">
                            <div className="flex items-center justify-center space-x-3">
                                {allChecksPassed ? 
                                    <CheckCircle className="w-8 h-8 text-green-500" /> : 
                                    <XCircle className="w-8 h-8 text-red-500" />
                                }
                                <div className="text-center">
                                    <h3 className={`text-xl font-bold ${allChecksPassed ? 'text-green-800' : 'text-red-800'}`}>
                                        {allChecksPassed ? 'All Requirements Met!' : 'Some Requirements Failed'}
                                    </h3>
                                    <p className={`text-sm ${allChecksPassed ? 'text-green-600' : 'text-red-600'}`}>
                                        {allChecksPassed ? 
                                            'Your system is ready for the assessment' : 
                                            'Please address the failed requirements below'
                                        }
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Individual Checks */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {Object.entries(checks).map(([key, check]) => (
                            <Card key={key} className={check.passed ? 'border-green-200' : 'border-red-200'}>
                                <CardContent className="p-4">
                                    <div className="flex items-start justify-between">
                                        <div className="flex items-start space-x-3">
                                            {getCheckIcon(check.passed)}
                                            <div>
                                                <h4 className="font-medium text-gray-900 capitalize">
                                                    {key.replace(/([A-Z])/g, ' $1').trim()}
                                                </h4>
                                                <p className={`text-sm ${getCheckColor(check.passed)}`}>
                                                    {check.message}
                                                </p>
                                                
                                                {/* Additional details */}
                                                {check.passed && key === 'browser' && (
                                                    <p className="text-xs text-gray-500 mt-1">
                                                        Browser: {check.browser} {check.version}
                                                    </p>
                                                )}
                                                
                                                {check.passed && key === 'webcam' && (
                                                    <p className="text-xs text-gray-500 mt-1">
                                                        Resolution: {check.resolution} @ {check.frameRate}fps
                                                    </p>
                                                )}
                                                
                                                {check.passed && key === 'microphone' && (
                                                    <p className="text-xs text-gray-500 mt-1">
                                                        Sample Rate: {check.sampleRate}Hz
                                                    </p>
                                                )}
                                                
                                                {check.passed && key === 'internet' && (
                                                    <p className="text-xs text-gray-500 mt-1">
                                                        Latency: {check.latency}ms
                                                    </p>
                                                )}
                                                
                                                {check.passed && key === 'storage' && check.availableSpace && (
                                                    <p className="text-xs text-gray-500 mt-1">
                                                        Available: {check.availableSpace}MB
                                                    </p>
                                                )}
                                                
                                                {check.passed && key === 'performance' && (
                                                    <p className="text-xs text-gray-500 mt-1">
                                                        Score: {check.performanceScore}
                                                    </p>
                                                )}
                                                
                                                {!check.passed && check.error && (
                                                    <p className="text-xs text-red-500 mt-1">
                                                        Error: {check.error}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                        
                                        {getCheckBadge(check.passed)}
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>

                    {/* Failed Checks Details */}
                    {failedChecks.length > 0 && (
                        <Alert className="border-red-200 bg-red-50">
                            <AlertTriangle className="w-4 h-4 text-red-600" />
                            <AlertDescription>
                                <div className="space-y-2">
                                    <p className="font-medium">Failed Requirements:</p>
                                    <ul className="list-disc list-inside space-y-1">
                                        {failedChecks.map((check, index) => (
                                            <li key={index} className="text-sm">
                                                {check.key.replace(/([A-Z])/g, ' $1').trim()}: {check.message}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </AlertDescription>
                        </Alert>
                    )}

                    {/* Actions */}
                    <div className="flex justify-center space-x-4">
                        <Button 
                            onClick={runSystemChecks}
                            variant="outline"
                        >
                            <RefreshCw className="w-4 h-4 mr-2" />
                            Re-run Checks
                        </Button>
                        
                        {allChecksPassed && (
                            <Button 
                                onClick={() => onRequirementsMet && onRequirementsMet(checks)}
                                className="bg-green-600 hover:bg-green-700"
                            >
                                <CheckCircle className="w-4 h-4 mr-2" />
                                Continue
                            </Button>
                        )}
                    </div>
                </div>
            )}

            {/* System Information */}
            {Object.keys(checks).length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center space-x-2">
                            <Info className="w-5 h-5" />
                            <span>System Information</span>
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                            <div>
                                <p className="text-gray-600">User Agent:</p>
                                <p className="font-mono text-xs break-all">{navigator.userAgent}</p>
                            </div>
                            
                            <div>
                                <p className="text-gray-600">Platform:</p>
                                <p className="font-mono text-xs">{navigator.platform}</p>
                            </div>
                            
                            <div>
                                <p className="text-gray-600">Language:</p>
                                <p className="font-mono text-xs">{navigator.language}</p>
                            </div>
                            
                            <div>
                                <p className="text-gray-600">Online Status:</p>
                                <p className="font-mono text-xs">{navigator.onLine ? 'Online' : 'Offline'}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
};

export default SystemRequirementsCheck;
