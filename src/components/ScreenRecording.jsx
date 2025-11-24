import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { Alert, AlertDescription } from './ui/alert';
import { 
    Video, 
    VideoOff, 
    Record, 
    Square, 
    Play, 
    Pause,
    Download,
    AlertTriangle,
    CheckCircle,
    Clock,
    HardDrive,
    Wifi,
    WifiOff
} from 'lucide-react';
import { toast } from 'react-hot-toast';

const ScreenRecording = ({ 
    submissionId, 
    isEnabled = false, 
    onRecordingStart, 
    onRecordingStop,
    maxDuration = 1800000, // 30 minutes
    quality = 'medium' // low, medium, high
}) => {
    const [isRecording, setIsRecording] = useState(false);
    const [isPaused, setIsPaused] = useState(false);
    const [recordingTime, setRecordingTime] = useState(0);
    const [recordingSize, setRecordingSize] = useState(0);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [recordingBlob, setRecordingBlob] = useState(null);
    const [error, setError] = useState(null);
    const [isOnline, setIsOnline] = useState(navigator.onLine);
    
    const mediaRecorderRef = useRef(null);
    const streamRef = useRef(null);
    const chunksRef = useRef([]);
    const timerRef = useRef(null);
    const startTimeRef = useRef(null);

    // Quality settings
    const qualitySettings = {
        low: { width: 640, height: 480, bitrate: 1000000 },
        medium: { width: 1280, height: 720, bitrate: 2500000 },
        high: { width: 1920, height: 1080, bitrate: 5000000 }
    };

    useEffect(() => {
        // Online/offline detection
        const handleOnline = () => setIsOnline(true);
        const handleOffline = () => setIsOnline(false);
        
        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);
        
        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    // Start recording
    const startRecording = async () => {
        try {
            setError(null);
            
            // Request screen capture
            const stream = await navigator.mediaDevices.getDisplayMedia({
                video: {
                    width: qualitySettings[quality].width,
                    height: qualitySettings[quality].height,
                    frameRate: 30
                },
                audio: true
            });
            
            streamRef.current = stream;
            
            // Create media recorder
            const mediaRecorder = new MediaRecorder(stream, {
                mimeType: 'video/webm;codecs=vp9',
                videoBitsPerSecond: qualitySettings[quality].bitrate
            });
            
            mediaRecorderRef.current = mediaRecorder;
            chunksRef.current = [];
            
            // Handle data available
            mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    chunksRef.current.push(event.data);
                }
            };
            
            // Handle recording stop
            mediaRecorder.onstop = () => {
                const blob = new Blob(chunksRef.current, { type: 'video/webm' });
                setRecordingBlob(blob);
                setRecordingSize(blob.size);
                
                // Auto-upload if online
                if (isOnline) {
                    uploadRecording(blob);
                }
            };
            
            // Start recording
            mediaRecorder.start(1000); // Collect data every second
            setIsRecording(true);
            setIsPaused(false);
            startTimeRef.current = Date.now();
            
            // Start timer
            timerRef.current = setInterval(() => {
                setRecordingTime(Date.now() - startTimeRef.current);
            }, 1000);
            
            // Handle stream end (user stops sharing)
            stream.getVideoTracks()[0].onended = () => {
                stopRecording();
            };
            
            if (onRecordingStart) {
                onRecordingStart();
            }
            
            toast.success('Screen recording started');
        } catch (error) {
            console.error('Error starting recording:', error);
            setError('Failed to start screen recording. Please check permissions.');
            toast.error('Failed to start recording');
        }
    };

    // Stop recording
    const stopRecording = () => {
        try {
            if (mediaRecorderRef.current && isRecording) {
                mediaRecorderRef.current.stop();
            }
            
            if (streamRef.current) {
                streamRef.current.getTracks().forEach(track => track.stop());
            }
            
            setIsRecording(false);
            setIsPaused(false);
            
            if (timerRef.current) {
                clearInterval(timerRef.current);
            }
            
            if (onRecordingStop) {
                onRecordingStop();
            }
            
            toast.success('Screen recording stopped');
        } catch (error) {
            console.error('Error stopping recording:', error);
            setError('Failed to stop recording');
        }
    };

    // Pause/Resume recording
    const togglePause = () => {
        if (!mediaRecorderRef.current) return;
        
        if (isPaused) {
            mediaRecorderRef.current.resume();
            setIsPaused(false);
            startTimeRef.current = Date.now() - recordingTime;
            timerRef.current = setInterval(() => {
                setRecordingTime(Date.now() - startTimeRef.current);
            }, 1000);
        } else {
            mediaRecorderRef.current.pause();
            setIsPaused(true);
            if (timerRef.current) {
                clearInterval(timerRef.current);
            }
        }
    };

    // Upload recording
    const uploadRecording = async (blob) => {
        try {
            setIsUploading(true);
            setUploadProgress(0);
            
            const formData = new FormData();
            formData.append('recording', blob, `recording_${submissionId}_${Date.now()}.webm`);
            formData.append('submissionId', submissionId);
            formData.append('duration', recordingTime);
            formData.append('quality', quality);
            
            const xhr = new XMLHttpRequest();
            
            xhr.upload.onprogress = (event) => {
                if (event.lengthComputable) {
                    const progress = (event.loaded / event.total) * 100;
                    setUploadProgress(progress);
                }
            };
            
            xhr.onload = () => {
                if (xhr.status === 200) {
                    setUploadProgress(100);
                    toast.success('Recording uploaded successfully');
                } else {
                    throw new Error('Upload failed');
                }
            };
            
            xhr.onerror = () => {
                throw new Error('Upload failed');
            };
            
            xhr.open('POST', '/api/proctoring/upload-recording');
            xhr.send(formData);
            
        } catch (error) {
            console.error('Upload error:', error);
            toast.error('Failed to upload recording');
        } finally {
            setIsUploading(false);
        }
    };

    // Manual upload
    const handleManualUpload = () => {
        if (recordingBlob) {
            uploadRecording(recordingBlob);
        }
    };

    // Download recording
    const downloadRecording = () => {
        if (recordingBlob) {
            const url = URL.createObjectURL(recordingBlob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `recording_${submissionId}_${Date.now()}.webm`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        }
    };

    // Format time
    const formatTime = (ms) => {
        const seconds = Math.floor(ms / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);
        
        if (hours > 0) {
            return `${hours}:${(minutes % 60).toString().padStart(2, '0')}:${(seconds % 60).toString().padStart(2, '0')}`;
        }
        return `${minutes}:${(seconds % 60).toString().padStart(2, '0')}`;
    };

    // Format file size
    const formatFileSize = (bytes) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    // Check if recording is near max duration
    const isNearMaxDuration = recordingTime > maxDuration * 0.9;
    const isMaxDurationReached = recordingTime >= maxDuration;

    if (!isEnabled) {
        return (
            <Card className="border-gray-200">
                <CardContent className="p-4">
                    <div className="flex items-center space-x-2 text-gray-500">
                        <VideoOff className="w-5 h-5" />
                        <span>Screen recording disabled</span>
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <div className="space-y-4">
            {/* Recording Status */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                        <Video className="w-5 h-5" />
                        <span>Screen Recording</span>
                        {isRecording && (
                            <Badge variant="destructive" className="animate-pulse">
                                <Record className="w-3 h-3 mr-1" />
                                Recording
                            </Badge>
                        )}
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {/* Recording Controls */}
                        <div className="flex items-center space-x-2">
                            {!isRecording ? (
                                <Button 
                                    onClick={startRecording}
                                    disabled={!isOnline}
                                    className="bg-red-600 hover:bg-red-700"
                                >
                                    <Record className="w-4 h-4 mr-2" />
                                    Start Recording
                                </Button>
                            ) : (
                                <div className="flex items-center space-x-2">
                                    <Button 
                                        onClick={togglePause}
                                        variant="outline"
                                    >
                                        {isPaused ? (
                                            <>
                                                <Play className="w-4 h-4 mr-2" />
                                                Resume
                                            </>
                                        ) : (
                                            <>
                                                <Pause className="w-4 h-4 mr-2" />
                                                Pause
                                            </>
                                        )}
                                    </Button>
                                    
                                    <Button 
                                        onClick={stopRecording}
                                        variant="destructive"
                                    >
                                        <Square className="w-4 h-4 mr-2" />
                                        Stop
                                    </Button>
                                </div>
                            )}
                        </div>

                        {/* Recording Info */}
                        {isRecording && (
                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-gray-600">Recording Time</span>
                                    <span className={`font-mono text-sm ${
                                        isMaxDurationReached ? 'text-red-600' :
                                        isNearMaxDuration ? 'text-yellow-600' :
                                        'text-gray-900'
                                    }`}>
                                        {formatTime(recordingTime)}
                                    </span>
                                </div>
                                
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-gray-600">Max Duration</span>
                                    <span className="text-sm text-gray-900">
                                        {formatTime(maxDuration)}
                                    </span>
                                </div>
                                
                                <Progress 
                                    value={(recordingTime / maxDuration) * 100} 
                                    className={`w-full ${
                                        isMaxDurationReached ? 'bg-red-100' :
                                        isNearMaxDuration ? 'bg-yellow-100' :
                                        ''
                                    }`}
                                />
                            </div>
                        )}

                        {/* Recording Stats */}
                        {recordingBlob && (
                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-gray-600">File Size</span>
                                    <span className="text-sm text-gray-900">
                                        {formatFileSize(recordingSize)}
                                    </span>
                                </div>
                                
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-gray-600">Quality</span>
                                    <Badge variant="outline">
                                        {quality.toUpperCase()}
                                    </Badge>
                                </div>
                            </div>
                        )}

                        {/* Upload Status */}
                        {isUploading && (
                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-gray-600">Uploading</span>
                                    <span className="text-sm text-gray-900">
                                        {Math.round(uploadProgress)}%
                                    </span>
                                </div>
                                <Progress value={uploadProgress} className="w-full" />
                            </div>
                        )}

                        {/* Connection Status */}
                        <div className="flex items-center space-x-2">
                            {isOnline ? (
                                <Wifi className="w-4 h-4 text-green-500" />
                            ) : (
                                <WifiOff className="w-4 h-4 text-red-500" />
                            )}
                            <span className="text-sm text-gray-600">
                                {isOnline ? 'Online' : 'Offline'}
                            </span>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Error Alert */}
            {error && (
                <Alert className="border-red-200 bg-red-50">
                    <AlertTriangle className="w-4 h-4 text-red-600" />
                    <AlertDescription>
                        {error}
                    </AlertDescription>
                </Alert>
            )}

            {/* Recording Actions */}
            {recordingBlob && (
                <Card>
                    <CardHeader>
                        <CardTitle>Recording Actions</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex space-x-2">
                            <Button 
                                variant="outline" 
                                onClick={downloadRecording}
                            >
                                <Download className="w-4 h-4 mr-2" />
                                Download
                            </Button>
                            
                            {!isOnline && (
                                <Button 
                                    variant="outline" 
                                    onClick={handleManualUpload}
                                    disabled={isUploading}
                                >
                                    {isUploading ? (
                                        <>
                                            <Clock className="w-4 h-4 mr-2 animate-spin" />
                                            Uploading...
                                        </>
                                    ) : (
                                        <>
                                            <HardDrive className="w-4 h-4 mr-2" />
                                            Upload
                                        </>
                                    )}
                                </Button>
                            )}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Max Duration Warning */}
            {isNearMaxDuration && !isMaxDurationReached && (
                <Alert className="border-yellow-200 bg-yellow-50">
                    <AlertTriangle className="w-4 h-4 text-yellow-600" />
                    <AlertDescription>
                        Recording is approaching maximum duration. Consider stopping soon.
                    </AlertDescription>
                </Alert>
            )}

            {/* Max Duration Reached */}
            {isMaxDurationReached && (
                <Alert className="border-red-200 bg-red-50">
                    <AlertTriangle className="w-4 h-4 text-red-600" />
                    <AlertDescription>
                        Maximum recording duration reached. Recording will be stopped automatically.
                    </AlertDescription>
                </Alert>
            )}
        </div>
    );
};

export default ScreenRecording;
