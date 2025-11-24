import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  ArrowRight,
  ArrowLeft,
  Scale,
  CheckCircle
} from 'lucide-react';

const TermsAgreementStep = ({ 
  assessment, 
  submission, 
  onComplete, 
  onBack, 
  onCancel,
  theme = 'light',
  isDarkMode = false
}) => {
  const [agreeAll, setAgreeAll] = useState(false);

  const allAgreed = agreeAll;

  const handleContinue = () => {
    if (!allAgreed) {
      return;
    }
    
    // Store agreement timestamp and details
    const agreementData = {
      timestamp: new Date().toISOString(),
      ipAddress: '', // Will be filled by backend
      userAgent: navigator.userAgent,
      agreements: {
        academicIntegrity: true,
        proctoring: assessment.require_proctoring || false,
        dataPrivacy: true,
        assessmentRules: true
      },
      assessmentId: assessment.id,
      submissionId: submission.submissionId
    };
    
    // Store in localStorage temporarily (will be sent to backend)
    localStorage.setItem(`agreement_${submission.submissionId}`, JSON.stringify(agreementData));
    
    onComplete();
  };

  const academicIntegrityTerms = `
    By proceeding with this assessment, you agree to maintain the highest standards of academic integrity. This includes:

    1. Completing the assessment independently without assistance from others
    2. Not using unauthorized materials, resources, or devices
    3. Not communicating with others during the assessment
    4. Not copying, sharing, or distributing assessment content
    5. Not attempting to circumvent security measures
    6. Not using artificial intelligence tools or automated assistance

    Violations of academic integrity may result in:
    - Immediate termination of the assessment
    - Zero score for the assessment
    - Academic disciplinary action
    - Permanent record of the violation
  `;

  const proctoringTerms = `
    This assessment uses proctoring technology to ensure academic integrity. By continuing, you consent to:

    1. Video and audio monitoring during the assessment
    2. Screen recording and monitoring
    3. Browser lockdown and activity tracking
    4. Eye tracking and behavioral analysis (if enabled)
    5. Detection of suspicious activities
    6. Storage of monitoring data for review purposes

    The proctoring system will:
    - Monitor your environment and behavior
    - Detect attempts to use unauthorized resources
    - Flag suspicious activities for review
    - Automatically terminate the assessment if violations are detected

    Your privacy is important to us. Monitoring data is:
    - Used solely for academic integrity purposes
    - Stored securely and encrypted
    - Not shared with third parties
    - Deleted according to our data retention policy
  `;

  const assessmentRules = `
    Assessment Rules and Guidelines:

    1. Time Management:
       - Complete the assessment within the allocated time
       - Time cannot be paused or extended
       - Unanswered questions will receive zero points

    2. Navigation:
       - Use only the provided navigation controls
       - Do not use browser back/forward buttons
       - Do not refresh the page unless instructed

    3. Answer Submission:
       - Save your answers regularly
       - Ensure all required questions are answered
       - Submit only when you are ready to complete

    4. Technical Requirements:
       - Maintain a stable internet connection
       - Use a compatible browser
       - Ensure adequate device battery/power

    5. Prohibited Activities:
       - Switching tabs or applications
       - Using external devices or materials
       - Seeking help from others
       - Attempting to hack or bypass security
  `;

  const dataPrivacyTerms = `
    Data Privacy and Protection:

    We collect and process your personal data in accordance with applicable privacy laws and our privacy policy. This includes:

    1. Personal Information:
       - Name, student ID, and contact information
       - Assessment responses and performance data
       - Device and browser information
       - IP address and location data

    2. Assessment Data:
       - Answers and submissions
       - Time spent on questions
       - Navigation patterns
       - Proctoring monitoring data

    3. Data Usage:
       - Academic evaluation and grading
       - Assessment improvement and analytics
       - Academic integrity monitoring
       - Compliance with institutional policies

    4. Data Protection:
       - Encryption of sensitive data
       - Secure data transmission
       - Access controls and authentication
       - Regular security audits

    5. Your Rights:
       - Access to your personal data
       - Correction of inaccurate data
       - Data portability
       - Right to erasure (subject to legal requirements)

    By proceeding, you acknowledge that you have read and understood our data privacy practices.
  `;

  return (
    <div className={`h-screen flex flex-col overflow-hidden m-0 ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
      {/* Fixed Header */}
      <div className={`border-b shadow-sm flex-shrink-0 ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
        <div className="max-w-4xl mx-auto px-6 py-4">
          <h1 className={`text-2xl font-bold flex items-center ${isDarkMode ? 'text-gray-100' : 'text-gray-900'}`}>
            <Scale className={`h-6 w-6 mr-2 ${isDarkMode ? 'text-gray-300' : ''}`} />
            Terms & Conditions
          </h1>
        </div>
      </div>

      {/* Scrollable Content Area - Only this scrolls */}
      <div className="flex-1 overflow-y-auto min-h-0">
        <div className="max-w-4xl mx-auto px-6 py-6">
          <Card className={isDarkMode ? 'bg-gray-800 border-gray-700' : ''}>
            <CardContent className="p-6">
              <div className={`text-sm whitespace-pre-line leading-relaxed space-y-6 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                {/* Academic Integrity */}
                <div>
                  <h2 className={`font-semibold mb-3 ${isDarkMode ? 'text-gray-100' : 'text-gray-900'}`}>Academic Integrity</h2>
                  <div className={isDarkMode ? 'text-gray-300' : 'text-gray-700'}>{academicIntegrityTerms}</div>
                </div>

                {/* Proctoring Terms */}
                {assessment.require_proctoring && (
                  <div className={`border-t pt-6 ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                    <h2 className={`font-semibold mb-3 ${isDarkMode ? 'text-gray-100' : 'text-gray-900'}`}>Proctoring Terms</h2>
                    <div className={isDarkMode ? 'text-gray-300' : 'text-gray-700'}>{proctoringTerms}</div>
                  </div>
                )}

                {/* Assessment Rules */}
                <div className={`border-t pt-6 ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                  <h2 className={`font-semibold mb-3 ${isDarkMode ? 'text-gray-100' : 'text-gray-900'}`}>Assessment Rules and Guidelines</h2>
                  <div className={isDarkMode ? 'text-gray-300' : 'text-gray-700'}>{assessmentRules}</div>
                </div>

                 {/* Data Privacy */}
                 <div className={`border-t pt-6 ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                   <h2 className={`font-semibold mb-3 ${isDarkMode ? 'text-gray-100' : 'text-gray-900'}`}>Data Privacy and Protection</h2>
                   <div className={isDarkMode ? 'text-gray-300' : 'text-gray-700'}>{dataPrivacyTerms}</div>
          </div>

                 {/* Agreement Checkbox - Inside scrollable content */}
                 <div className={`border-t pt-6 mt-8 ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                   <div className={`rounded-lg p-4 ${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                     <div className="flex items-start gap-3">
                       <Checkbox 
                         id="agree-all" 
                         checked={agreeAll} 
                         onCheckedChange={setAgreeAll}
                         className="mt-1"
                       />
                       <label htmlFor="agree-all" className={`text-sm cursor-pointer flex-1 ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>
              I have read and agree to all the above terms and conditions
            </label>
                     </div>
                   </div>
                 </div>
          </div>
        </CardContent>
      </Card>
         </div>
       </div>

       {/* Fixed Footer - Only buttons */}
       <div className={`border-t shadow-sm flex-shrink-0 ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
         <div className="max-w-4xl mx-auto px-6 py-4">
      <div className="flex justify-between">
             <Button 
               variant="outline" 
               onClick={onBack}
               className={isDarkMode ? 'border-gray-600 text-gray-300 hover:bg-gray-700' : ''}
             >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
             <div className="flex gap-3">
               <Button 
                 variant="outline" 
                 onClick={onCancel}
                 className={isDarkMode ? 'border-gray-600 text-gray-300 hover:bg-gray-700' : ''}
               >
                 Cancel
               </Button>
               <Button 
                 onClick={handleContinue} 
                 disabled={!allAgreed} 
                 className="bg-green-600 hover:bg-green-700"
               >
            <CheckCircle className="h-4 w-4 mr-2" />
                 Start Assessment
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
             </div>
           </div>
        </div>
      </div>
    </div>
  );
};

export default TermsAgreementStep;
