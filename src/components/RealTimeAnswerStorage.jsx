import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { Alert, AlertDescription } from './ui/alert';
import { 
    Save, 
    Wifi, 
    WifiOff, 
    Clock, 
    CheckCircle, 
    AlertTriangle, 
    Cloud, 
    CloudOff,
    Database,
    Shield
} from 'lucide-react';
import { toast } from 'react-hot-toast';

const RealTimeAnswerStorage = ({ 
    submissionId, 
    questionId, 
    initialAnswer = '', 
    onAnswerChange,
    autoSaveInterval = 30000, // 30 seconds
    enableOfflineMode = true 
}) => {
    const [answer, setAnswer] = useState(initialAnswer);
    const [isOnline, setIsOnline] = useState(navigator.onLine);
    const [isSaving, setIsSaving] = useState(false);
    const [lastSaved, setLastSaved] = useState(null);
    const [saveStatus, setSaveStatus] = useState('idle'); // idle, saving, saved, error
    const [offlineAnswers, setOfflineAnswers] = useState([]);
    const [syncStatus, setSyncStatus] = useState('synced');
    const [version, setVersion] = useState(1);
    
    const saveTimeoutRef = useRef(null);
    const debounceTimeoutRef = useRef(null);
    const isInitialMount = useRef(true);

    // Debounced save function
    const debouncedSave = useCallback((answerToSave) => {
        if (debounceTimeoutRef.current) {
            clearTimeout(debounceTimeoutRef.current);
        }
        
        debounceTimeoutRef.current = setTimeout(() => {
            saveAnswer(answerToSave);
        }, 800); // 800ms debounce (reduced from 2000ms)
    }, []);

    // Save answer to server
    const saveAnswer = async (answerToSave) => {
        if (!answerToSave && answerToSave !== '') return;
        
        try {
            setIsSaving(true);
            setSaveStatus('saving');
            
            const response = await fetch('/api/student-assessments/save-answer', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    submissionId,
                    questionId,
                    answer: answerToSave,
                    version: version + 1,
                    metadata: {
                        timestamp: new Date().toISOString(),
                        isRealTime: true,
                        userAgent: navigator.userAgent
                    }
                })
            });

            if (!response.ok) throw new Error('Save failed');
            
            const result = await response.json();
            
            setLastSaved(new Date());
            setSaveStatus('saved');
            setVersion(result.version);
            
            // Clear from offline storage if it was there
            if (enableOfflineMode) {
                removeFromOfflineStorage(questionId);
            }
            
            toast.success('Answer saved', { duration: 1000 });
        } catch (error) {
            console.error('Error saving answer:', error);
            setSaveStatus('error');
            
            // Save to offline storage if online mode fails
            if (enableOfflineMode && isOnline) {
                saveToOfflineStorage(answerToSave);
            }
            
            toast.error('Failed to save answer');
        } finally {
            setIsSaving(false);
        }
    };

    // Save to offline storage
    const saveToOfflineStorage = (answerToSave) => {
        try {
            const offlineAnswer = {
                submissionId,
                questionId,
                answer: answerToSave,
                timestamp: new Date().toISOString(),
                version: version + 1
            };
            
            const existingOffline = JSON.parse(localStorage.getItem('offlineAnswers') || '[]');
            const updatedOffline = existingOffline.filter(item => 
                !(item.submissionId === submissionId && item.questionId === questionId)
            );
            updatedOffline.push(offlineAnswer);
            
            localStorage.setItem('offlineAnswers', JSON.stringify(updatedOffline));
            setOfflineAnswers(updatedOffline);
            setSyncStatus('offline');
            
            toast('Answer saved offline', { 
                icon: '💾',
                duration: 2000 
            });
        } catch (error) {
            console.error('Error saving to offline storage:', error);
        }
    };

    // Remove from offline storage
    const removeFromOfflineStorage = (questionId) => {
        try {
            const existingOffline = JSON.parse(localStorage.getItem('offlineAnswers') || '[]');
            const updatedOffline = existingOffline.filter(item => 
                !(item.submissionId === submissionId && item.questionId === questionId)
            );
            
            localStorage.setItem('offlineAnswers', JSON.stringify(updatedOffline));
            setOfflineAnswers(updatedOffline);
        } catch (error) {
            console.error('Error removing from offline storage:', error);
        }
    };

    // Sync offline answers when back online
    const syncOfflineAnswers = async () => {
        if (!isOnline || offlineAnswers.length === 0) return;
        
        try {
            setSyncStatus('syncing');
            
            const response = await fetch('/api/student-assessments/sync-offline', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    submissionId,
                    offlineAnswers
                })
            });

            if (!response.ok) throw new Error('Sync failed');
            
            const result = await response.json();
            
            if (result.success) {
                localStorage.removeItem('offlineAnswers');
                setOfflineAnswers([]);
                setSyncStatus('synced');
                
                toast.success(`Synced ${result.syncedCount} offline answers`);
            }
        } catch (error) {
            console.error('Error syncing offline answers:', error);
            setSyncStatus('error');
            toast.error('Failed to sync offline answers');
        }
    };

    // Handle answer change
    const handleAnswerChange = (newAnswer) => {
        setAnswer(newAnswer);
        setVersion(prev => prev + 1);
        
        if (onAnswerChange) {
            onAnswerChange(newAnswer);
        }
        
        // Debounced save
        debouncedSave(newAnswer);
    };

    // Manual save
    const handleManualSave = () => {
        if (debounceTimeoutRef.current) {
            clearTimeout(debounceTimeoutRef.current);
        }
        saveAnswer(answer);
    };

    // Auto-save interval
    useEffect(() => {
        if (isInitialMount.current) {
            isInitialMount.current = false;
            return;
        }
        
        const interval = setInterval(() => {
            if (answer && answer.trim() !== '') {
                saveAnswer(answer);
            }
        }, autoSaveInterval);
        
        return () => clearInterval(interval);
    }, [answer, autoSaveInterval]);

    // Online/offline detection
    useEffect(() => {
        const handleOnline = () => {
            setIsOnline(true);
            syncOfflineAnswers();
        };
        
        const handleOffline = () => {
            setIsOnline(false);
            setSyncStatus('offline');
        };
        
        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);
        
        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, [offlineAnswers]);

    // Load offline answers on mount
    useEffect(() => {
        if (enableOfflineMode) {
            const offlineData = JSON.parse(localStorage.getItem('offlineAnswers') || '[]');
            const relevantOffline = offlineData.filter(item => 
                item.submissionId === submissionId && item.questionId === questionId
            );
            
            if (relevantOffline.length > 0) {
                const latestOffline = relevantOffline[relevantOffline.length - 1];
                setAnswer(latestOffline.answer);
                setSyncStatus('offline');
            }
            
            setOfflineAnswers(offlineData);
        }
    }, [submissionId, questionId, enableOfflineMode]);

    // Cleanup timeouts
    useEffect(() => {
        return () => {
            if (saveTimeoutRef.current) {
                clearTimeout(saveTimeoutRef.current);
            }
            if (debounceTimeoutRef.current) {
                clearTimeout(debounceTimeoutRef.current);
            }
        };
    }, []);

    const getSaveStatusIcon = () => {
        switch (saveStatus) {
            case 'saving':
                return <Clock className="w-4 h-4 animate-spin text-blue-500" />;
            case 'saved':
                return <CheckCircle className="w-4 h-4 text-green-500" />;
            case 'error':
                return <AlertTriangle className="w-4 h-4 text-red-500" />;
            default:
                return <Save className="w-4 h-4 text-gray-400" />;
        }
    };

    const getSyncStatusIcon = () => {
        switch (syncStatus) {
            case 'synced':
                return <Cloud className="w-4 h-4 text-green-500" />;
            case 'syncing':
                return <Cloud className="w-4 h-4 animate-pulse text-blue-500" />;
            case 'offline':
                return <CloudOff className="w-4 h-4 text-orange-500" />;
            case 'error':
                return <CloudOff className="w-4 h-4 text-red-500" />;
            default:
                return <Cloud className="w-4 h-4 text-gray-400" />;
        }
    };

    return (
        <div className="space-y-4">
            {/* Storage Status */}
            <Card>
                <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                            <div className="flex items-center space-x-2">
                                {getSaveStatusIcon()}
                                <span className="text-sm font-medium">
                                    {saveStatus === 'saving' ? 'Saving...' :
                                     saveStatus === 'saved' ? 'Saved' :
                                     saveStatus === 'error' ? 'Save Error' :
                                     'Not Saved'}
                                </span>
                            </div>
                            
                            <div className="flex items-center space-x-2">
                                {isOnline ? 
                                    <Wifi className="w-4 h-4 text-green-500" /> : 
                                    <WifiOff className="w-4 h-4 text-red-500" />
                                }
                                <span className="text-sm text-gray-600">
                                    {isOnline ? 'Online' : 'Offline'}
                                </span>
                            </div>
                            
                            <div className="flex items-center space-x-2">
                                {getSyncStatusIcon()}
                                <span className="text-sm text-gray-600">
                                    {syncStatus === 'synced' ? 'Synced' :
                                     syncStatus === 'syncing' ? 'Syncing...' :
                                     syncStatus === 'offline' ? 'Offline' :
                                     'Sync Error'}
                                </span>
                            </div>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                            <Badge variant="outline" className="flex items-center space-x-1">
                                <Database className="w-3 h-3" />
                                <span>v{version}</span>
                            </Badge>
                            
                            {enableOfflineMode && (
                                <Badge variant="outline" className="flex items-center space-x-1">
                                    <Shield className="w-3 h-3" />
                                    <span>Offline</span>
                                </Badge>
                            )}
                        </div>
                    </div>
                    
                    {lastSaved && (
                        <div className="mt-2 text-xs text-gray-500">
                            Last saved: {lastSaved.toLocaleTimeString()}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Offline Answers Alert */}
            {offlineAnswers.length > 0 && (
                <Alert className="border-orange-200 bg-orange-50">
                    <AlertTriangle className="w-4 h-4 text-orange-600" />
                    <AlertDescription>
                        You have {offlineAnswers.length} offline answer(s) that will be synced when you're back online.
                    </AlertDescription>
                </Alert>
            )}

            {/* Manual Save Button */}
            <div className="flex justify-end">
                <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={handleManualSave}
                    disabled={isSaving}
                >
                    {isSaving ? (
                        <>
                            <Clock className="w-4 h-4 mr-2 animate-spin" />
                            Saving...
                        </>
                    ) : (
                        <>
                            <Save className="w-4 h-4 mr-2" />
                            Save Now
                        </>
                    )}
                </Button>
            </div>

            {/* Auto-save Progress */}
            {isSaving && (
                <div className="space-y-2">
                    <div className="flex justify-between text-sm text-gray-600">
                        <span>Auto-saving...</span>
                        <span>Every {autoSaveInterval / 1000}s</span>
                    </div>
                    <Progress value={75} className="w-full" />
                </div>
            )}
        </div>
    );
};

export default RealTimeAnswerStorage;
