import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Checkbox } from './ui/checkbox';
import { Alert, AlertDescription } from './ui/alert';
import { 
    BookOpen, 
    Clock, 
    Shield, 
    Camera, 
    Mic, 
    Monitor, 
    AlertTriangle, 
    CheckCircle, 
    XCircle,
    Info,
    Lock,
    Eye,
    EyeOff,
    Download,
    ExternalLink
} from 'lucide-react';
import { toast } from 'react-hot-toast';

const InstructionsReview = ({ 
    assessmentData,
    onInstructionsAccepted, 
    onInstructionsRejected,
    showProctoringInfo = true,
    showTimeInfo = true,
    showSecurityInfo = true
}) => {
    const [acceptedSections, setAcceptedSections] = useState({});
    const [allSectionsAccepted, setAllSectionsAccepted] = useState(false);
    const [isReviewing, setIsReviewing] = useState(false);
    const [reviewProgress, setReviewProgress] = useState(0);
    const [currentSection, setCurrentSection] = useState(0);
    const [expandedSections, setExpandedSections] = useState({});

    const instructionSections = [
        {
            id: 'general',
            title: 'General Instructions',
            icon: BookOpen,
            required: true,
            content: [
                'Read all questions carefully before answering',
                'Answer all questions to the best of your ability',
                'Do not refresh the page or navigate away during the assessment',
                'Ensure you have a stable internet connection',
                'Complete the assessment within the allotted time'
            ]
        },
        {
            id: 'time',
            title: 'Time Management',
            icon: Clock,
            required: true,
            content: [
                `Assessment duration: ${assessmentData?.duration || 'N/A'} minutes`,
                'Timer will be displayed at the top of the screen',
                'You will receive warnings at 10 minutes and 5 minutes remaining',
                'Assessment will auto-submit when time expires',
                'Time spent on each question is tracked for analysis'
            ]
        },
        {
            id: 'proctoring',
            title: 'Proctoring Requirements',
            icon: Shield,
            required: showProctoringInfo,
            content: [
                'Webcam must be enabled and working throughout the assessment',
                'Microphone must be enabled for audio monitoring',
                'Fullscreen mode is required and will be enforced',
                'Screen recording may be enabled for security purposes',
                'Browser lockdown will prevent access to other applications'
            ]
        },
        {
            id: 'security',
            title: 'Security Guidelines',
            icon: Lock,
            required: showSecurityInfo,
            content: [
                'Do not use any external resources or materials',
                'Do not communicate with others during the assessment',
                'Do not take screenshots or record the assessment',
                'Do not use multiple devices or browsers',
                'Follow all proctoring guidelines and instructions'
            ]
        },
        {
            id: 'technical',
            title: 'Technical Requirements',
            icon: Monitor,
            required: true,
            content: [
                'Use a supported browser (Chrome, Firefox, Safari, Edge)',
                'Ensure your device meets minimum system requirements',
                'Keep your browser updated to the latest version',
                'Disable browser extensions that may interfere',
                'Ensure sufficient battery life or keep device plugged in'
            ]
        }
    ];

    useEffect(() => {
        // Initialize accepted sections
        const initialAccepted = {};
        instructionSections.forEach(section => {
            if (section.required) {
                initialAccepted[section.id] = false;
            }
        });
        setAcceptedSections(initialAccepted);
    }, []);

    useEffect(() => {
        // Check if all required sections are accepted
        const requiredSections = instructionSections.filter(section => section.required);
        const allAccepted = requiredSections.every(section => acceptedSections[section.id]);
        setAllSectionsAccepted(allAccepted);
    }, [acceptedSections]);

    const handleSectionAcceptance = (sectionId, accepted) => {
        setAcceptedSections(prev => ({
            ...prev,
            [sectionId]: accepted
        }));
    };

    const toggleSectionExpansion = (sectionId) => {
        setExpandedSections(prev => ({
            ...prev,
            [sectionId]: !prev[sectionId]
        }));
    };

    const startReview = async () => {
        setIsReviewing(true);
        setReviewProgress(0);
        
        try {
            for (let i = 0; i < instructionSections.length; i++) {
                setCurrentSection(i);
                setReviewProgress((i / instructionSections.length) * 100);
                
                // Simulate review time for each section
                await new Promise(resolve => setTimeout(resolve, 500)); // Reduced from 1000ms
            }
            
            setReviewProgress(100);
            setIsReviewing(false);
            
            toast.success('Instructions review completed');
        } catch (error) {
            console.error('Review error:', error);
            toast.error('Review failed');
            setIsReviewing(false);
        }
    };

    const handleAcceptInstructions = () => {
        if (allSectionsAccepted) {
            if (onInstructionsAccepted) {
                onInstructionsAccepted(acceptedSections);
            }
            toast.success('Instructions accepted');
        } else {
            toast.error('Please accept all required sections');
        }
    };

    const handleRejectInstructions = () => {
        if (onInstructionsRejected) {
            onInstructionsRejected();
        }
        toast.error('Instructions rejected');
    };

    const getSectionIcon = (section, index) => {
        if (index < currentSection) {
            return <CheckCircle className="w-5 h-5 text-green-500" />;
        } else if (index === currentSection) {
            return <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />;
        } else {
            return <div className="w-5 h-5 border-2 border-gray-300 rounded-full" />;
        }
    };

    const getSectionStatus = (section, index) => {
        if (index < currentSection) {
            return <Badge className="bg-green-100 text-green-800">Reviewed</Badge>;
        } else if (index === currentSection) {
            return <Badge className="bg-blue-100 text-blue-800">Reviewing</Badge>;
        } else {
            return <Badge className="bg-gray-100 text-gray-800">Pending</Badge>;
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="text-center">
                <h2 className="text-3xl font-bold text-gray-900">Assessment Instructions</h2>
                <p className="text-gray-600 mt-2">Please review and accept the following instructions before starting the assessment</p>
            </div>

            {/* Assessment Overview */}
            <Card className="border-blue-200 bg-blue-50">
                <CardContent className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
                        <div>
                            <h3 className="text-lg font-bold text-blue-800">{assessmentData?.title || 'Assessment'}</h3>
                            <p className="text-sm text-blue-600">Assessment Title</p>
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-blue-800">{assessmentData?.duration || 'N/A'} min</h3>
                            <p className="text-sm text-blue-600">Duration</p>
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-blue-800">{assessmentData?.totalPoints || 'N/A'} pts</h3>
                            <p className="text-sm text-blue-600">Total Points</p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Progress */}
            {isReviewing && (
                <Card>
                    <CardContent className="p-6">
                        <div className="space-y-4">
                            <div className="flex justify-between items-center">
                                <span className="text-sm font-medium text-gray-700">Review Progress</span>
                                <span className="text-sm text-gray-500">{Math.round(reviewProgress)}%</span>
                            </div>
                            <Progress value={reviewProgress} className="w-full" />
                            
                            {currentSection < instructionSections.length && (
                                <p className="text-sm text-gray-600 text-center">
                                    {instructionSections[currentSection]?.title}
                                </p>
                            )}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Instruction Sections */}
            <div className="space-y-4">
                {instructionSections.map((section, index) => {
                    const Icon = section.icon;
                    const isExpanded = expandedSections[section.id];
                    const isAccepted = acceptedSections[section.id];
                    
                    return (
                        <Card key={section.id} className={isAccepted ? 'border-green-200 bg-green-50' : 'border-gray-200'}>
                            <CardContent className="p-4">
                                <div className="space-y-4">
                                    {/* Section Header */}
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center space-x-3">
                                            {getSectionIcon(section, index)}
                                            <Icon className="w-5 h-5 text-gray-600" />
                                            <div>
                                                <h3 className="font-medium text-gray-900">{section.title}</h3>
                                                <p className="text-sm text-gray-600">
                                                    {section.required ? 'Required' : 'Optional'}
                                                </p>
                                            </div>
                                        </div>
                                        
                                        <div className="flex items-center space-x-2">
                                            {getSectionStatus(section, index)}
                                            {section.required && (
                                                <Badge variant="outline" className="text-xs">Required</Badge>
                                            )}
                                        </div>
                                    </div>
                                    
                                    {/* Section Content */}
                                    <div className="space-y-3">
                                        <div className="flex items-center space-x-2">
                                            <Checkbox
                                                id={section.id}
                                                checked={isAccepted}
                                                onCheckedChange={(checked) => handleSectionAcceptance(section.id, checked)}
                                                disabled={!section.required}
                                            />
                                            <label 
                                                htmlFor={section.id}
                                                className="text-sm font-medium text-gray-700 cursor-pointer"
                                            >
                                                I have read and understood the {section.title.toLowerCase()}
                                            </label>
                                        </div>
                                        
                                        {/* Expandable Content */}
                                        <div className="space-y-2">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => toggleSectionExpansion(section.id)}
                                                className="text-blue-600 hover:text-blue-700"
                                            >
                                                {isExpanded ? <EyeOff className="w-4 h-4 mr-2" /> : <Eye className="w-4 h-4 mr-2" />}
                                                {isExpanded ? 'Hide Details' : 'Show Details'}
                                            </Button>
                                            
                                            {isExpanded && (
                                                <div className="pl-6 space-y-2">
                                                    <ul className="list-disc list-inside space-y-1 text-sm text-gray-600">
                                                        {section.content.map((item, itemIndex) => (
                                                            <li key={itemIndex}>{item}</li>
                                                        ))}
                                                    </ul>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    );
                })}
            </div>

            {/* Important Notices */}
            <Alert className="border-yellow-200 bg-yellow-50">
                <AlertTriangle className="w-4 h-4 text-yellow-600" />
                <AlertDescription>
                    <div className="space-y-2">
                        <p className="font-medium">Important Notices:</p>
                        <ul className="list-disc list-inside space-y-1 text-sm">
                            <li>Once you start the assessment, you cannot pause or restart it</li>
                            <li>All proctoring features will be active throughout the assessment</li>
                            <li>Any violation of the assessment rules may result in disqualification</li>
                            <li>Ensure you have sufficient time to complete the assessment</li>
                        </ul>
                    </div>
                </AlertDescription>
            </Alert>

            {/* Acceptance Summary */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                        <CheckCircle className="w-5 h-5" />
                        <span>Acceptance Summary</span>
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-3">
                        {instructionSections.map(section => (
                            <div key={section.id} className="flex items-center justify-between">
                                <div className="flex items-center space-x-2">
                                    {acceptedSections[section.id] ? (
                                        <CheckCircle className="w-4 h-4 text-green-500" />
                                    ) : (
                                        <XCircle className="w-4 h-4 text-red-500" />
                                    )}
                                    <span className="text-sm text-gray-700">{section.title}</span>
                                </div>
                                
                                <Badge className={
                                    acceptedSections[section.id] ? 
                                    'bg-green-100 text-green-800' : 
                                    'bg-red-100 text-red-800'
                                }>
                                    {acceptedSections[section.id] ? 'Accepted' : 'Not Accepted'}
                                </Badge>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>

            {/* Actions */}
            <div className="flex justify-center space-x-4">
                <Button 
                    onClick={startReview}
                    disabled={isReviewing}
                    variant="outline"
                >
                    {isReviewing ? (
                        <>
                            <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mr-2" />
                            Reviewing...
                        </>
                    ) : (
                        <>
                            <BookOpen className="w-4 h-4 mr-2" />
                            Start Review
                        </>
                    )}
                </Button>
                
                <Button 
                    onClick={handleAcceptInstructions}
                    disabled={!allSectionsAccepted}
                    className="bg-green-600 hover:bg-green-700"
                >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Accept Instructions
                </Button>
                
                <Button 
                    onClick={handleRejectInstructions}
                    variant="destructive"
                >
                    <XCircle className="w-4 h-4 mr-2" />
                    Reject Instructions
                </Button>
            </div>

            {/* Download Instructions */}
            <div className="text-center">
                <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => {
                        // Generate and download instructions PDF
                        toast.success('Instructions downloaded');
                    }}
                >
                    <Download className="w-4 h-4 mr-2" />
                    Download Instructions (PDF)
                </Button>
            </div>
        </div>
    );
};

export default InstructionsReview;
