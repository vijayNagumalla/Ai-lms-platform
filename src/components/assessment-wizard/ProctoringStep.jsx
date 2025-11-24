import React from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PROCTORING_TYPES } from '../../lib/constants';

export default function ProctoringStep({ formData, updateFormData }) {

  const requestDevicePermissions = async (feature) => {
    try {
      if (feature === 'webcam') {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        stream.getTracks().forEach(track => track.stop()); // Stop the stream immediately
        return true;
      } else if (feature === 'microphone') {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        stream.getTracks().forEach(track => track.stop()); // Stop the stream immediately
        return true;
      }
      return true;
    } catch (error) {
      console.error(`Permission denied for ${feature}:`, error);
      alert(`Permission denied for ${feature}. Please allow access to continue.`);
      return false;
    }
  };

  const handleAdvancedFeatureChange = async (feature, checked) => {
    if (checked && (feature === 'require_webcam' || feature === 'require_microphone')) {
      const permissionGranted = await requestDevicePermissions(feature === 'require_webcam' ? 'webcam' : 'microphone');
      if (!permissionGranted) {
        return; // Don't update the state if permission is denied
      }
    }
    
    updateFormData({ [feature]: checked });
  };

  const handleProctoringChange = (checked) => {
    updateFormData({ 
      require_proctoring: checked,
      proctoring_type: checked ? 'basic' : 'none'
    });
  };

  const handleProctoringTypeChange = (value) => {
    updateFormData({ proctoring_type: value });
    
    // Reset all proctoring settings based on the selected type
    if (value === 'none') {
      updateFormData({
        // Basic Proctoring Features
        browser_lockdown: false,
        tab_switching_detection: false,
        copy_paste_detection: false,
        right_click_detection: false,
        fullscreen_requirement: false,
        keyboard_shortcut_detection: false,
        
        // Advanced Proctoring Features
        require_webcam: false,
        require_microphone: false,
        screen_sharing_detection: false,
        multiple_device_detection: false,
        plagiarism_detection: false,
        face_detection: false,
        voice_detection: false,
        background_noise_detection: false,
        eye_tracking_detection: false,
        
        // AI Proctoring Features
        behavioral_analysis: false,
        facial_recognition: false,
        emotion_detection: false,
        attention_monitoring: false,
        suspicious_activity_detection: false,
        ai_plagiarism_detection: false,
        voice_analysis: false,
        gesture_recognition: false,
        real_time_alerts: false
      });
    } else if (value === 'basic') {
      updateFormData({
        // Enable basic features, disable advanced and AI features
        browser_lockdown: true,
        tab_switching_detection: true,
        copy_paste_detection: true,
        right_click_detection: true,
        fullscreen_requirement: true,
        keyboard_shortcut_detection: true,
        
        // Disable advanced and AI features
        require_webcam: false,
        require_microphone: false,
        screen_sharing_detection: false,
        multiple_device_detection: false,
        plagiarism_detection: false,
        face_detection: false,
        voice_detection: false,
        background_noise_detection: false,
        eye_tracking_detection: false,
        behavioral_analysis: false,
        facial_recognition: false,
        emotion_detection: false,
        attention_monitoring: false,
        suspicious_activity_detection: false,
        ai_plagiarism_detection: false,
        voice_analysis: false,
        gesture_recognition: false,
        real_time_alerts: false
      });
    } else if (value === 'advanced') {
      updateFormData({
        // Enable basic features
        browser_lockdown: true,
        tab_switching_detection: true,
        copy_paste_detection: true,
        right_click_detection: true,
        fullscreen_requirement: true,
        keyboard_shortcut_detection: true,
        
        // Enable advanced features
        require_webcam: true,
        require_microphone: true,
        screen_sharing_detection: true,
        multiple_device_detection: true,
        plagiarism_detection: true,
        face_detection: true,
        voice_detection: true,
        background_noise_detection: true,
        eye_tracking_detection: true,
        
        // Disable AI features
        behavioral_analysis: false,
        facial_recognition: false,
        emotion_detection: false,
        attention_monitoring: false,
        suspicious_activity_detection: false,
        ai_plagiarism_detection: false,
        voice_analysis: false,
        gesture_recognition: false,
        real_time_alerts: false
      });
    } else if (value === 'ai') {
      updateFormData({
        // Enable basic features
        browser_lockdown: true,
        tab_switching_detection: true,
        copy_paste_detection: true,
        right_click_detection: true,
        fullscreen_requirement: true,
        keyboard_shortcut_detection: true,
        
        // Enable advanced features
        require_webcam: true,
        require_microphone: true,
        screen_sharing_detection: true,
        multiple_device_detection: true,
        plagiarism_detection: true,
        face_detection: true,
        voice_detection: true,
        background_noise_detection: true,
        eye_tracking_detection: true,
        
        // Enable AI features
        behavioral_analysis: true,
        facial_recognition: true,
        emotion_detection: true,
        attention_monitoring: true,
        suspicious_activity_detection: true,
        ai_plagiarism_detection: true,
        voice_analysis: true,
        gesture_recognition: true,
        real_time_alerts: true
      });
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-4">Proctoring Settings</h2>
        <p className="text-gray-600 mb-6">Configure automated proctoring features for this assessment.</p>
      </div>

      <div className="space-y-4">
        <div className="flex items-center space-x-2">
          <Checkbox
            id="require_proctoring"
            checked={formData.require_proctoring}
            onCheckedChange={handleProctoringChange}
          />
          <label htmlFor="require_proctoring" className="text-sm font-medium">
            Enable Proctoring
          </label>
        </div>

        {formData.require_proctoring && (
          <div className="space-y-4 pl-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Proctoring Type
              </label>
              <Select 
                value={formData.proctoring_type} 
                onValueChange={handleProctoringTypeChange}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PROCTORING_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              

            </div>

            {/* Basic Proctoring Features */}
            {(formData.proctoring_type === 'basic' || formData.proctoring_type === 'advanced' || formData.proctoring_type === 'ai') && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Basic Proctoring Features</h3>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="browser_lockdown"
                      checked={formData.browser_lockdown}
                      onCheckedChange={(checked) => updateFormData({ browser_lockdown: checked })}
                      disabled={formData.proctoring_type === 'advanced' || formData.proctoring_type === 'ai'}
                    />
                    <label htmlFor="browser_lockdown" className={`text-sm font-medium ${(formData.proctoring_type === 'advanced' || formData.proctoring_type === 'ai') ? 'text-gray-500' : ''}`}>
                      Browser Lockdown
                      {(formData.proctoring_type === 'advanced' || formData.proctoring_type === 'ai') && <span className="text-xs text-blue-600 ml-1">(Required)</span>}
                    </label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="tab_switching_detection"
                      checked={formData.tab_switching_detection}
                      onCheckedChange={(checked) => updateFormData({ tab_switching_detection: checked })}
                      disabled={formData.proctoring_type === 'advanced' || formData.proctoring_type === 'ai'}
                    />
                    <label htmlFor="tab_switching_detection" className={`text-sm font-medium ${(formData.proctoring_type === 'advanced' || formData.proctoring_type === 'ai') ? 'text-gray-500' : ''}`}>
                      Tab Switching Detection
                      {(formData.proctoring_type === 'advanced' || formData.proctoring_type === 'ai') && <span className="text-xs text-blue-600 ml-1">(Required)</span>}
                    </label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="copy_paste_detection"
                      checked={formData.copy_paste_detection}
                      onCheckedChange={(checked) => updateFormData({ copy_paste_detection: checked })}
                      disabled={formData.proctoring_type === 'advanced' || formData.proctoring_type === 'ai'}
                    />
                    <label htmlFor="copy_paste_detection" className={`text-sm font-medium ${(formData.proctoring_type === 'advanced' || formData.proctoring_type === 'ai') ? 'text-gray-500' : ''}`}>
                      Copy/Paste Detection
                      {(formData.proctoring_type === 'advanced' || formData.proctoring_type === 'ai') && <span className="text-xs text-blue-600 ml-1">(Required)</span>}
                    </label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="right_click_detection"
                      checked={formData.right_click_detection}
                      onCheckedChange={(checked) => updateFormData({ right_click_detection: checked })}
                      disabled={formData.proctoring_type === 'advanced' || formData.proctoring_type === 'ai'}
                    />
                    <label htmlFor="right_click_detection" className={`text-sm font-medium ${(formData.proctoring_type === 'advanced' || formData.proctoring_type === 'ai') ? 'text-gray-500' : ''}`}>
                      Right-Click Detection
                      {(formData.proctoring_type === 'advanced' || formData.proctoring_type === 'ai') && <span className="text-xs text-blue-600 ml-1">(Required)</span>}
                    </label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="fullscreen_requirement"
                      checked={formData.fullscreen_requirement}
                      onCheckedChange={(checked) => updateFormData({ fullscreen_requirement: checked })}
                      disabled={formData.proctoring_type === 'advanced' || formData.proctoring_type === 'ai'}
                    />
                    <label htmlFor="fullscreen_requirement" className={`text-sm font-medium ${(formData.proctoring_type === 'advanced' || formData.proctoring_type === 'ai') ? 'text-gray-500' : ''}`}>
                      Require Fullscreen Mode
                      {(formData.proctoring_type === 'advanced' || formData.proctoring_type === 'ai') && <span className="text-xs text-blue-600 ml-1">(Required)</span>}
                    </label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="keyboard_shortcut_detection"
                      checked={formData.keyboard_shortcut_detection}
                      onCheckedChange={(checked) => updateFormData({ keyboard_shortcut_detection: checked })}
                      disabled={formData.proctoring_type === 'advanced' || formData.proctoring_type === 'ai'}
                    />
                    <label htmlFor="keyboard_shortcut_detection" className={`text-sm font-medium ${(formData.proctoring_type === 'advanced' || formData.proctoring_type === 'ai') ? 'text-gray-500' : ''}`}>
                      Keyboard Shortcut Detection
                      {(formData.proctoring_type === 'advanced' || formData.proctoring_type === 'ai') && <span className="text-xs text-blue-600 ml-1">(Required)</span>}
                    </label>
                  </div>
                </div>

                {/* Max Tab Switches Setting */}
                {formData.tab_switching_detection && (
                  <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="space-y-2">
                      <Label htmlFor="max_tab_switches" className="text-sm font-medium text-blue-800">
                        Maximum Allowed Tab Switches
                      </Label>
                      <div className="flex items-center space-x-2">
                        <Input
                          id="max_tab_switches"
                          type="number"
                          min="0"
                          max="100"
                          value={formData.max_tab_switches || 0}
                          onChange={(e) => updateFormData({ max_tab_switches: parseInt(e.target.value) || 0 })}
                          className="w-24"
                          placeholder="0"
                        />
                        <span className="text-sm text-gray-600">
                          (0 = unlimited, assessment will auto-submit when exceeded)
                        </span>
                      </div>
                      <p className="text-xs text-blue-600">
                        When students exceed this limit, their assessment will be automatically submitted.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Advanced Proctoring Features */}
            {(formData.proctoring_type === 'advanced' || formData.proctoring_type === 'ai') && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Advanced Proctoring Features</h3>
                
                <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="require_webcam"
                      checked={formData.require_webcam}
                      onCheckedChange={(checked) => handleAdvancedFeatureChange('require_webcam', checked)}
                      disabled={formData.proctoring_type === 'ai'}
                    />
                    <label htmlFor="require_webcam" className={`text-sm font-medium ${formData.proctoring_type === 'ai' ? 'text-gray-500' : ''}`}>
                      Require Webcam
                      {formData.proctoring_type === 'ai' && <span className="text-xs text-blue-600 ml-1">(Required)</span>}
                    </label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="require_microphone"
                      checked={formData.require_microphone}
                      onCheckedChange={(checked) => handleAdvancedFeatureChange('require_microphone', checked)}
                      disabled={formData.proctoring_type === 'ai'}
                    />
                    <label htmlFor="require_microphone" className={`text-sm font-medium ${formData.proctoring_type === 'ai' ? 'text-gray-500' : ''}`}>
                      Require Microphone
                      {formData.proctoring_type === 'ai' && <span className="text-xs text-blue-600 ml-1">(Required)</span>}
                    </label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="screen_sharing_detection"
                      checked={formData.screen_sharing_detection}
                      onCheckedChange={(checked) => updateFormData({ screen_sharing_detection: checked })}
                      disabled={formData.proctoring_type === 'ai'}
                    />
                    <label htmlFor="screen_sharing_detection" className={`text-sm font-medium ${formData.proctoring_type === 'ai' ? 'text-gray-500' : ''}`}>
                      Screen Sharing Detection
                      {formData.proctoring_type === 'ai' && <span className="text-xs text-blue-600 ml-1">(Required)</span>}
                    </label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="multiple_device_detection"
                      checked={formData.multiple_device_detection}
                      onCheckedChange={(checked) => updateFormData({ multiple_device_detection: checked })}
                      disabled={formData.proctoring_type === 'ai'}
                    />
                    <label htmlFor="multiple_device_detection" className={`text-sm font-medium ${formData.proctoring_type === 'ai' ? 'text-gray-500' : ''}`}>
                      Multiple Device Detection
                      {formData.proctoring_type === 'ai' && <span className="text-xs text-blue-600 ml-1">(Required)</span>}
                    </label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="plagiarism_detection"
                      checked={formData.plagiarism_detection}
                      onCheckedChange={(checked) => updateFormData({ plagiarism_detection: checked })}
                      disabled={formData.proctoring_type === 'ai'}
                    />
                    <label htmlFor="plagiarism_detection" className={`text-sm font-medium ${formData.proctoring_type === 'ai' ? 'text-gray-500' : ''}`}>
                      Plagiarism Detection
                      {formData.proctoring_type === 'ai' && <span className="text-xs text-blue-600 ml-1">(Required)</span>}
                    </label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="face_detection"
                      checked={formData.face_detection}
                      onCheckedChange={(checked) => updateFormData({ face_detection: checked })}
                      disabled={formData.proctoring_type === 'ai'}
                    />
                    <label htmlFor="face_detection" className={`text-sm font-medium ${formData.proctoring_type === 'ai' ? 'text-gray-500' : ''}`}>
                      Face Detection
                      {formData.proctoring_type === 'ai' && <span className="text-xs text-blue-600 ml-1">(Required)</span>}
                    </label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="voice_detection"
                      checked={formData.voice_detection}
                      onCheckedChange={(checked) => updateFormData({ voice_detection: checked })}
                      disabled={formData.proctoring_type === 'ai'}
                    />
                    <label htmlFor="voice_detection" className={`text-sm font-medium ${formData.proctoring_type === 'ai' ? 'text-gray-500' : ''}`}>
                      Voice Detection
                      {formData.proctoring_type === 'ai' && <span className="text-xs text-blue-600 ml-1">(Required)</span>}
                    </label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="background_noise_detection"
                      checked={formData.background_noise_detection}
                      onCheckedChange={(checked) => updateFormData({ background_noise_detection: checked })}
                      disabled={formData.proctoring_type === 'ai'}
                    />
                    <label htmlFor="background_noise_detection" className={`text-sm font-medium ${formData.proctoring_type === 'ai' ? 'text-gray-500' : ''}`}>
                      Background Noise Detection
                      {formData.proctoring_type === 'ai' && <span className="text-xs text-blue-600 ml-1">(Required)</span>}
                    </label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="eye_tracking_detection"
                      checked={formData.eye_tracking_detection}
                      onCheckedChange={(checked) => updateFormData({ eye_tracking_detection: checked })}
                      disabled={formData.proctoring_type === 'ai'}
                    />
                    <label htmlFor="eye_tracking_detection" className={`text-sm font-medium ${formData.proctoring_type === 'ai' ? 'text-gray-500' : ''}`}>
                      Eye Tracking
                      {formData.proctoring_type === 'ai' && <span className="text-xs text-blue-600 ml-1">(Required)</span>}
                    </label>
                  </div>
                </div>
              </div>
            )}

            {/* AI Proctoring Features */}
            {formData.proctoring_type === 'ai' && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">AI Proctoring Features</h3>
                
                <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="behavioral_analysis"
                      checked={formData.behavioral_analysis}
                      onCheckedChange={(checked) => updateFormData({ behavioral_analysis: checked })}
                    />
                    <label htmlFor="behavioral_analysis" className="text-sm font-medium">
                      Behavioral Analysis
                    </label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="facial_recognition"
                      checked={formData.facial_recognition}
                      onCheckedChange={(checked) => updateFormData({ facial_recognition: checked })}
                    />
                    <label htmlFor="facial_recognition" className="text-sm font-medium">
                      Facial Recognition
                    </label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="emotion_detection"
                      checked={formData.emotion_detection}
                      onCheckedChange={(checked) => updateFormData({ emotion_detection: checked })}
                    />
                    <label htmlFor="emotion_detection" className="text-sm font-medium">
                      Emotion Detection
                    </label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="attention_monitoring"
                      checked={formData.attention_monitoring}
                      onCheckedChange={(checked) => updateFormData({ attention_monitoring: checked })}
                    />
                    <label htmlFor="attention_monitoring" className="text-sm font-medium">
                      Attention Monitoring
                    </label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="suspicious_activity_detection"
                      checked={formData.suspicious_activity_detection}
                      onCheckedChange={(checked) => updateFormData({ suspicious_activity_detection: checked })}
                    />
                    <label htmlFor="suspicious_activity_detection" className="text-sm font-medium">
                      Suspicious Activity Detection
                    </label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="ai_plagiarism_detection"
                      checked={formData.ai_plagiarism_detection}
                      onCheckedChange={(checked) => updateFormData({ ai_plagiarism_detection: checked })}
                    />
                    <label htmlFor="ai_plagiarism_detection" className="text-sm font-medium">
                      AI-Powered Plagiarism Detection
                    </label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="voice_analysis"
                      checked={formData.voice_analysis}
                      onCheckedChange={(checked) => updateFormData({ voice_analysis: checked })}
                    />
                    <label htmlFor="voice_analysis" className="text-sm font-medium">
                      Voice Analysis
                    </label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="gesture_recognition"
                      checked={formData.gesture_recognition}
                      onCheckedChange={(checked) => updateFormData({ gesture_recognition: checked })}
                    />
                    <label htmlFor="gesture_recognition" className="text-sm font-medium">
                      Gesture Recognition
                    </label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="real_time_alerts"
                      checked={formData.real_time_alerts}
                      onCheckedChange={(checked) => updateFormData({ real_time_alerts: checked })}
                    />
                    <label htmlFor="real_time_alerts" className="text-sm font-medium">
                      Real-time AI Alerts
                    </label>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      

      
    </div>
  );
} 