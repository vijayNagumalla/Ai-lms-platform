import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { 
  ArrowLeft, 
  ArrowRight, 
  Plus, 
  Trash2, 
  Save, 
  Send, 
  Eye, 
  Edit, 
  Copy,
  Calendar,
  Clock,
  Users,
  Building,
  GraduationCap,
  UserCheck,
  Shield,
  Globe,
  Monitor,
  Smartphone,
  Chrome,
  Settings,
  AlertCircle,
  CheckCircle,
  XCircle,
  Info,
  BookOpen,
  FileText,
  Code,
  Image,
  Video,
  Download,
  Upload,
  Link,
  ExternalLink,
  Lock,
  Unlock,
  Key,
  Wifi,
  WifiOff,
  MapPin,
  Globe2,
  Zap,
  Target,
  Timer,
  Award,
  Star,
  Heart,
  ThumbsUp,
  ThumbsDown,
  MessageSquare,
  Mail,
  Bell,
  BellOff,
  CalendarDays,
  Clock3,
  ChevronLeft,
  ChevronRight,
  CheckSquare
} from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { motion, AnimatePresence } from 'framer-motion';
import apiService from '@/services/api';
import { getCountryForTimezone } from '@/components/ui/country-select';

import { ASSESSMENT_TYPES, PROCTORING_TYPES, QUESTION_TYPES, STEPS } from '@/lib/constants';

// Import step components
import BasicInformationStep from '../components/assessment-wizard/BasicInformationStep';
import AssessmentSettingsStep from '../components/assessment-wizard/AssessmentSettingsStep';
import SchedulingStep from '../components/assessment-wizard/SchedulingStep';
import ProctoringStep from '../components/assessment-wizard/ProctoringStep';
import AssignmentStep from '../components/assessment-wizard/AssignmentStep';
import SectionManagementStep from '../components/assessment-wizard/SectionManagementStep';
import QuestionSelectionStep from '../components/assessment-wizard/QuestionSelectionStep';
import ReviewStep from '../components/assessment-wizard/ReviewStep';

export default function AssessmentCreationWizard() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [colleges, setColleges] = useState([]);
  const [selectedQuestions, setSelectedQuestions] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterDifficulty, setFilterDifficulty] = useState('all');

  // Edit mode state
  const editAssessmentId = searchParams.get('edit');
  const isEditMode = !!editAssessmentId;
  const [editLoading, setEditLoading] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    // Step 1: Basic Information
    title: '',
    assessment_type: 'single_type', // 'single_type' or 'multi_type'
    multi_type_structure: null, // 'section_based' or 'non_section_based' (only for multi_type)

    selected_question_types: [], // Array of selected question types for multi-type assessments
    description: '',
    instructions: '',
    
    // Step 2: Assessment Settings
    time_limit_minutes: 30,
    per_question_time_limit: null,
    total_points: 100,
    passing_score: 70,
    max_attempts: 1,
    time_between_attempts_hours: 24,
    shuffle_questions: false,
    show_results_immediately: true,
    allow_review: true,
    show_correct_answers: false,
    
    // Step 3: Scheduling
    start_date: '',
    start_time: '',
    end_date: '',
    end_time: '',
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    assessment_country: '',
    early_access_hours: 0,
    late_submission_minutes: 0,
    
    // Step 4: Proctoring
    require_proctoring: false,
    proctoring_type: 'none',
    
    // Basic Proctoring Features
    browser_lockdown: false,
    tab_switching_detection: false,
    copy_paste_detection: false,
    right_click_detection: false,
    fullscreen_requirement: false,
    keyboard_shortcut_detection: false,
    max_tab_switches: 0,
    
    // Advanced Proctoring Features
    require_webcam: false,
    require_microphone: false,
    screen_sharing_detection: false,
    multiple_device_detection: false,
    plagiarism_detection: false,
    face_detection: false,
    voice_detection: false,
    background_noise_detection: false,
    eye_tracking: false,
    
    // AI Proctoring Features
    behavioral_analysis: false,
    facial_recognition: false,
    emotion_detection: false,
    attention_monitoring: false,
    suspicious_activity_detection: false,
    ai_plagiarism_detection: false,
    voice_analysis: false,
    gesture_recognition: false,
    real_time_alerts: false,
    
    // Step 5: Assignment
    assigned_colleges: [],
    assigned_departments: [],
    assigned_groups: [],
    assigned_students: [],
    access_password: '',
    ip_restrictions: '',
    device_restrictions: '',
    browser_restrictions: '',
    
    // Step 6: Sections
    sections: [
      {
        id: 'section-1',
        name: 'Section 1',
        description: '',
        instructions: '',
        time_limit_minutes: null,
        allowed_question_types: [...QUESTION_TYPES.map(qt => qt.value)],
        shuffle_questions: false,
        navigation_type: 'free', // 'free' or 'sequential'
        completion_requirement: 'all', // 'all', 'minimum', 'percentage'
        minimum_questions: null,
        completion_percentage: null,
        allow_return_to_section: false,
        questions: []
      }
    ],
    
    // Section Control Settings
    sequential_sections: false,
    require_section_completion: false,
    
    // Metadata
    difficulty_level: 'medium',
    tags: [],
    status: 'draft'
  });

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    // Load assessment data if in edit mode
    if (isEditMode && editAssessmentId) {
      loadAssessmentForEdit();
    }
  }, [isEditMode, editAssessmentId]);

  // Show loading state while editing
  if (isEditMode && editLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading assessment data...</p>
        </div>
      </div>
    );
  }

  const loadInitialData = async () => {
    try {
      setLoading(true);
      
      // Load colleges
      const collegesResponse = await apiService.getSuperAdminColleges();
      
      if (collegesResponse.success) {
        // Handle different possible response structures
        let collegesData = [];
        if (collegesResponse.data && Array.isArray(collegesResponse.data)) {
          // Direct array response
          collegesData = collegesResponse.data;
        } else if (collegesResponse.data && collegesResponse.data.colleges && Array.isArray(collegesResponse.data.colleges)) {
          // Nested colleges array
          collegesData = collegesResponse.data.colleges;
        } else if (collegesResponse.data && collegesResponse.data.data && Array.isArray(collegesResponse.data.data)) {
          // Double nested data
          collegesData = collegesResponse.data.data;
        }
        
        setColleges(collegesData);
      } else {
        setColleges([]);
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load initial data"
      });
      setColleges([]);
    } finally {
      setLoading(false);
    }
  };

  // Load assessment data for edit mode
  const loadAssessmentForEdit = async () => {
    if (!editAssessmentId) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "No assessment ID provided for editing"
      });
      navigate('/assessments');
      return;
    }
    
    try {
      setEditLoading(true);
      const response = await apiService.getAssessmentTemplateById(editAssessmentId);
      
      if (response.success) {
        const assessment = response.data;

        // Process assignment data
        const collegeAssignments = assessment.assignments?.filter(a => a.assignment_type === 'college') || [];
        const departmentAssignments = assessment.assignments?.filter(a => a.assignment_type === 'department') || [];
        const studentAssignments = assessment.assignments?.filter(a => a.assignment_type === 'individual' || a.assignment_type === 'student') || [];
        
        // Prepare sections with questions
        let sectionsWithQuestions = assessment.sections && assessment.sections.length > 0 ? assessment.sections : [
          {
            id: 'section-1',
            name: 'Section 1',
            description: '',
            instructions: '',
            time_limit_minutes: null,
            allowed_question_types: [...QUESTION_TYPES.map(qt => qt.value)],
            shuffle_questions: false,
            navigation_type: 'free',
            completion_requirement: 'all',
            minimum_questions: null,
            completion_percentage: null,
            allow_return_to_section: false,
            questions: []
          }
        ];

        // Distribute questions to sections if they exist
        if (assessment.questions && assessment.questions.length > 0) {
          // Group questions by section_id
          const questionsBySection = {};
          assessment.questions.forEach(q => {
            const sectionId = q.section_id || 'section-1'; // Default to first section if no section_id
            if (!questionsBySection[sectionId]) {
              questionsBySection[sectionId] = [];
            }
            questionsBySection[sectionId].push({
              ...q,
              section_question_id: `${sectionId}-${Date.now()}-${Math.random()}`,
              points: q.points || 1,
              is_required: true,
              order: 0
            });
          });

          // Update sections with their questions
          sectionsWithQuestions = sectionsWithQuestions.map(section => ({
            ...section,
            questions: questionsBySection[section.id] || []
          }));
        }
        
        // Populate form data with existing assessment data
        setFormData({
          // Step 1: Basic Information
          title: assessment.title || '',
          assessment_type: 'single_type', // Always single type for existing assessments
          multi_type_structure: null,

          selected_question_types: [],
          description: assessment.description || '',
          instructions: assessment.instructions || '',
          
          // Step 2: Assessment Settings
          time_limit_minutes: assessment.time_limit_minutes || 30,
          per_question_time_limit: null,
          total_points: assessment.total_points || 100,
          passing_score: assessment.passing_score || 70,
          max_attempts: assessment.max_attempts || 1,
          time_between_attempts_hours: assessment.time_between_attempts_hours || 24,
          shuffle_questions: assessment.shuffle_questions || false,
          show_results_immediately: assessment.show_results_immediately !== false,
          allow_review: assessment.allow_review !== false,
          show_correct_answers: assessment.show_correct_answers || false,
          
          // Step 3: Scheduling - Use the constructed scheduling object from backend
          // Clean up date strings to extract just the date part (YYYY-MM-DD)
          start_date: (() => {
            const dateString = assessment.scheduling?.start_date || assessment.default_start_date_only || '';
            if (!dateString) return '';
            // If it's a full ISO datetime string, extract just the date part
            if (dateString.includes('T')) {
              return dateString.split('T')[0];
            }
            return dateString;
          })(),
          start_time: assessment.scheduling?.start_time || assessment.default_start_time_only || '',
          end_date: (() => {
            const dateString = assessment.scheduling?.end_date || assessment.default_end_date_only || '';
            if (!dateString) return '';
            // If it's a full ISO datetime string, extract just the date part
            if (dateString.includes('T')) {
              return dateString.split('T')[0];
            }
            return dateString;
          })(),
          end_time: assessment.scheduling?.end_time || assessment.default_end_time_only || '',
          timezone: assessment.scheduling?.timezone || assessment.default_assessment_timezone || Intl.DateTimeFormat().resolvedOptions().timeZone,
          assessment_timezone: assessment.scheduling?.timezone || assessment.default_assessment_timezone || Intl.DateTimeFormat().resolvedOptions().timeZone, // Add this for SchedulingStep compatibility
          assessment_country: (() => {
            const timezone = assessment.scheduling?.timezone || assessment.default_assessment_timezone || 'UTC';
            return getCountryForTimezone(timezone) || '';
          })(),
          early_access_hours: assessment.scheduling?.early_access_hours || assessment.default_early_access_hours || 0,
          late_submission_minutes: assessment.scheduling?.late_submission_minutes || assessment.default_late_submission_minutes || 0,
          
          // Step 4: Proctoring
          require_proctoring: assessment.require_proctoring || false,
          proctoring_type: assessment.proctoring_settings?.proctoring_type || 'none',
          
          // Basic Proctoring Features
          browser_lockdown: assessment.proctoring_settings?.browser_lockdown || false,
          tab_switching_detection: assessment.proctoring_settings?.tab_switching_detection || false,
          copy_paste_detection: assessment.proctoring_settings?.copy_paste_detection || false,
          right_click_detection: assessment.proctoring_settings?.right_click_detection || false,
          fullscreen_requirement: assessment.proctoring_settings?.fullscreen_requirement || false,
          keyboard_shortcut_detection: assessment.proctoring_settings?.keyboard_shortcut_detection || false,
          
          // Advanced Proctoring Features
          require_webcam: assessment.proctoring_settings?.require_webcam || false,
          require_microphone: assessment.proctoring_settings?.require_microphone || false,
          screen_sharing_detection: assessment.proctoring_settings?.screen_sharing_detection || false,
          multiple_device_detection: assessment.proctoring_settings?.multiple_device_detection || false,
          plagiarism_detection: assessment.proctoring_settings?.plagiarism_detection || false,
          face_detection: assessment.proctoring_settings?.face_detection || false,
          voice_detection: assessment.proctoring_settings?.voice_detection || false,
          background_noise_detection: assessment.proctoring_settings?.background_noise_detection || false,
          eye_tracking: assessment.proctoring_settings?.eye_tracking || false,
          
          // AI Proctoring Features
          behavioral_analysis: assessment.proctoring_settings?.behavioral_analysis || false,
          facial_recognition: assessment.proctoring_settings?.facial_recognition || false,
          emotion_detection: assessment.proctoring_settings?.emotion_detection || false,
          attention_monitoring: assessment.proctoring_settings?.attention_monitoring || false,
          suspicious_activity_detection: assessment.proctoring_settings?.suspicious_activity_detection || false,
          ai_plagiarism_detection: assessment.proctoring_settings?.ai_plagiarism_detection || false,
          voice_analysis: assessment.proctoring_settings?.voice_analysis || false,
          gesture_recognition: assessment.proctoring_settings?.gesture_recognition || false,
          real_time_alerts: assessment.proctoring_settings?.real_time_alerts || false,
          
          // Step 5: Assignment - Map from assignments array
          assigned_colleges: assessment.assignments?.filter(a => a.assignment_type === 'college').map(a => a.target_id) || [],
          assigned_departments: assessment.assignments?.filter(a => a.assignment_type === 'department').map(a => ({
            college_id: a.college_id || a.metadata?.college_id || null,
            department_id: a.target_id
          })).filter(d => d.college_id !== null) || [],
          assigned_groups: assessment.assignments?.filter(a => a.assignment_type === 'group').map(a => a.target_id) || [],
          assigned_students: assessment.assignments?.filter(a => a.assignment_type === 'individual' || a.assignment_type === 'student').map(a => a.target_id) || [],
          access_password: assessment.access_control?.password || '',
          ip_restrictions: assessment.access_control?.ip_restrictions || '',
          device_restrictions: assessment.access_control?.device_restrictions || '',
          browser_restrictions: assessment.access_control?.browser_restrictions || '',
          
          // Step 6: Section Management
          sections: sectionsWithQuestions,
          
          // Additional fields
          difficulty_level: (() => {
            // Map database difficulty level back to frontend values
            const mapping = {
              'beginner': 'beginner',
              'intermediate': 'intermediate',
              'advanced': 'advanced',
              'expert': 'expert'
            };
            return mapping[assessment.difficulty_level] || 'intermediate';
          })(),
          department: assessment.department || '',
          tags: assessment.tags || [],
          metadata: assessment.metadata || {}
        });

        // Clear selectedQuestions since we're using sections for edit mode
        setSelectedQuestions([]);
        
        toast({
          title: "Success",
          description: "Assessment data loaded for editing"
        });
      } else {
        toast({
          variant: "destructive",
          title: "Error",
          description: response.message || "Failed to load assessment data"
        });
        navigate('/assessments');
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load assessment data for editing"
      });
      navigate('/assessments');
    } finally {
      setEditLoading(false);
    }
  };

  // Question loading is now handled directly in QuestionSelectionStep component

  const updateFormData = (updates) => {
    setFormData(prev => ({ ...prev, ...updates }));
  };

  const updateSection = (sectionId, updates) => {
    setFormData(prev => ({
      ...prev,
      sections: prev.sections.map(section => 
        section.id === sectionId ? { ...section, ...updates } : section
      )
    }));
  };

  const addSection = () => {
    const newSection = {
      id: `section-${Date.now()}`,
      name: `Section ${formData.sections.length + 1}`,
      description: '',
      instructions: '',
      time_limit_minutes: null,
      allowed_question_types: [...QUESTION_TYPES.map(qt => qt.value)],
      shuffle_questions: false,
      navigation_type: 'free',
      completion_requirement: 'all',
      minimum_questions: null,
      completion_percentage: null,
      allow_return_to_section: false,
      questions: []
    };
    
    setFormData(prev => ({
      ...prev,
      sections: [...prev.sections, newSection]
    }));
  };

  const removeSection = (sectionId) => {
    setFormData(prev => ({
      ...prev,
      sections: prev.sections.filter(section => section.id !== sectionId)
    }));
  };

  const addQuestionToSection = (sectionId, question) => {
    const questionWithId = {
      ...question,
      section_question_id: `${sectionId}-${Date.now()}`,
      points: Number(question.points) || 1,
      is_required: true,
      order: 0
    };

    setFormData(prev => {
      const updatedSections = prev.sections.map(section => 
        section.id === sectionId 
          ? { ...section, questions: [...section.questions, questionWithId] }
          : section
      );
      
      return {
        ...prev,
        sections: updatedSections
      };
    });
  };

  const removeQuestionFromSection = (sectionId, questionId) => {
    setFormData(prev => ({
      ...prev,
      sections: prev.sections.map(section => 
        section.id === sectionId 
          ? { ...section, questions: section.questions.filter(q => q.id !== questionId) }
          : section
      )
    }));
  };

  const calculateTotalPoints = () => {
    return formData.sections.reduce((total, section) => {
      const sectionTotal = section.questions.reduce((sectionTotal, question) => {
        return sectionTotal + (Number(question.points) || 1);
      }, 0);
      return total + sectionTotal;
    }, 0);
  };

  const validateStep = (step) => {
    switch (step) {
      case 1:
        if (!formData.title.trim()) {
          toast({
            title: 'Validation Error',
            description: 'Assessment title is required',
            variant: 'destructive'
          });
          return false;
        }
        if (!formData.assessment_type) {
          toast({
            title: 'Validation Error',
            description: 'Please select an assessment type',
            variant: 'destructive'
          });
          return false;
        }
        if (formData.assessment_type === 'multi_type' && !formData.multi_type_structure) {
          toast({
            title: 'Validation Error',
            description: 'Please select a multi-type structure',
            variant: 'destructive'
          });
          return false;
        }

        if (formData.assessment_type === 'multi_type' && (!formData.selected_question_types || formData.selected_question_types.length === 0)) {
          toast({
            title: 'Validation Error',
            description: 'Please select at least one question type for your multi-type assessment',
            variant: 'destructive'
          });
          return false;
        }
        break;
      case 2:
        if (formData.time_limit_minutes <= 0) {
          toast({
            title: 'Validation Error',
            description: 'Time limit must be greater than 0',
            variant: 'destructive'
          });
          return false;
        }
        break;
      case 3:
        if (!formData.start_date || !formData.end_date) {
          toast({
            title: 'Validation Error',
            description: 'Start and end dates are required',
            variant: 'destructive'
          });
          return false;
        }
        if (!formData.start_time || !formData.end_time) {
          toast({
            title: 'Validation Error',
            description: 'Start and end times are required',
            variant: 'destructive'
          });
          return false;
        }
        if (!formData.timezone || !formData.assessment_country) {
          toast({
            title: 'Validation Error',
            description: 'Assessment country/timezone is required for proper scheduling',
            variant: 'destructive'
          });
          return false;
        }
        break;
      case 5:
        if ((!formData.assigned_colleges || formData.assigned_colleges.length === 0) && 
            (!formData.assigned_departments || formData.assigned_departments.length === 0) && 
            (!formData.assigned_groups || formData.assigned_groups.length === 0) && 
            (!formData.assigned_students || formData.assigned_students.length === 0)) {
          toast({
            title: 'Validation Error',
            description: 'Please assign the assessment to at least one college, department, group, or student',
            variant: 'destructive'
          });
          return false;
        }
        break;
      case 7:
        if (!formData.sections || formData.sections.length === 0) {
          toast({
            title: 'Validation Error',
            description: 'Please add at least one section to the assessment',
            variant: 'destructive'
          });
          return false;
        }
        const totalQuestions = formData.sections.reduce((total, section) => {
          if (!section || !section.questions) return total;
          return total + (Array.isArray(section.questions) ? section.questions.length : 0);
        }, 0);
        if (totalQuestions === 0) {
          toast({
            title: 'Validation Error',
            description: 'Please add at least one question to the assessment',
            variant: 'destructive'
          });
          return false;
        }
        break;
    }
    return true;
  };

  const nextStep = () => {
    if (validateStep(currentStep)) {
      const filteredSteps = getFilteredSteps();
      const currentIndex = filteredSteps.findIndex(step => step.id === currentStep);
      if (currentIndex < filteredSteps.length - 1) {
        setCurrentStep(filteredSteps[currentIndex + 1].id);
      }
    }
  };

  const prevStep = () => {
    const filteredSteps = getFilteredSteps();
    const currentIndex = filteredSteps.findIndex(step => step.id === currentStep);
    if (currentIndex > 0) {
      setCurrentStep(filteredSteps[currentIndex - 1].id);
    }
  };

  const saveDraft = async () => {
    try {
      setSaving(true);
      
      // Map assessment type to database enum values
      let mappedAssessmentType = 'quiz'; // default
      
      if (formData.assessment_type === 'single_type') {
        // For single type, use a default type
        mappedAssessmentType = 'quiz';
      } else if (formData.assessment_type === 'multi_type') {
        // For multi type, use a default type that supports multiple question types
        mappedAssessmentType = 'test'; // 'test' is more flexible for mixed content
      }
      
      // Prepare scheduling data
      const scheduling = {
        start_date: formData.start_date,
        start_time: formData.start_time,
        end_date: formData.end_date,
        end_time: formData.end_time,
        timezone: formData.timezone,
        early_access_hours: formData.early_access_hours,
        late_submission_minutes: formData.late_submission_minutes
      };

      // Prepare proctoring settings
      const proctoring_settings = {
        proctoring_type: formData.proctoring_type,
        
        // Basic Proctoring Features
        browser_lockdown: formData.browser_lockdown,
        tab_switching_detection: formData.tab_switching_detection,
        copy_paste_detection: formData.copy_paste_detection,
        right_click_detection: formData.right_click_detection,
        fullscreen_requirement: formData.fullscreen_requirement,
        keyboard_shortcut_detection: formData.keyboard_shortcut_detection,
        
        // Advanced Proctoring Features
        require_webcam: formData.require_webcam,
        require_microphone: formData.require_microphone,
        screen_sharing_detection: formData.screen_sharing_detection,
        multiple_device_detection: formData.multiple_device_detection,
        plagiarism_detection: formData.plagiarism_detection,
        face_detection: formData.face_detection,
        voice_detection: formData.voice_detection,
        background_noise_detection: formData.background_noise_detection,
        eye_tracking: formData.eye_tracking,
        
        // AI Proctoring Features
        behavioral_analysis: formData.behavioral_analysis,
        facial_recognition: formData.facial_recognition,
        emotion_detection: formData.emotion_detection,
        attention_monitoring: formData.attention_monitoring,
        suspicious_activity_detection: formData.suspicious_activity_detection,
        ai_plagiarism_detection: formData.ai_plagiarism_detection,
        voice_analysis: formData.voice_analysis,
        gesture_recognition: formData.gesture_recognition,
        real_time_alerts: formData.real_time_alerts
      };

      // Prepare access control
      const access_control = {
        password: formData.access_password,
        ip_restrictions: formData.ip_restrictions,
        device_restrictions: formData.device_restrictions,
        browser_restrictions: formData.browser_restrictions
      };

      // Prepare assignment settings
      const assignment_settings = {
        assigned_colleges: formData.assigned_colleges,
        assigned_departments: formData.assigned_departments,
        assigned_groups: formData.assigned_groups,
        assigned_students: formData.assigned_students
      };

      // Map difficulty level from frontend to database values
      const mapDifficultyLevel = (level) => {
        const mapping = {
          'beginner': 'beginner',
          'intermediate': 'intermediate',
          'advanced': 'advanced',
          'expert': 'expert'
        };
        return mapping[level] || 'intermediate';
      };

      const assessmentData = {
        title: formData.title,
        description: formData.description,
        instructions: formData.instructions,
        assessment_type: mappedAssessmentType,
        difficulty_level: mapDifficultyLevel(formData.difficulty_level),
        time_limit_minutes: formData.time_limit_minutes,
        total_points: calculateTotalPoints(),
        passing_score: formData.passing_score,
        max_attempts: formData.max_attempts,
        time_between_attempts_hours: formData.time_between_attempts_hours,
        shuffle_questions: formData.shuffle_questions,
        show_results_immediately: formData.show_results_immediately,
        allow_review: formData.allow_review,
        show_correct_answers: formData.show_correct_answers,
        require_proctoring: formData.require_proctoring,
        proctoring_type: formData.proctoring_type,
        proctoring_settings,
        scheduling,
        access_control,
        assignment_settings,
        sections: formData.sections,
        tags: formData.tags || [],
        metadata: {
          assessment_type: formData.assessment_type, // Store original type in metadata
          multi_type_structure: formData.multi_type_structure,
          selected_question_types: formData.selected_question_types
        },
        status: 'draft'
      };
      
      // Add max_tab_switches to proctoring_settings
      if (assessmentData.proctoring_settings) {
        assessmentData.proctoring_settings.max_tab_switches = formData.max_tab_switches || 0;
      }
      
      const response = await apiService.createAssessmentTemplate(assessmentData);
      
      if (response.success) {
        toast({
          title: 'Success',
          description: 'Assessment draft saved successfully',
          variant: 'default'
        });
        navigate('/assessments');
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to save draft',
        variant: 'destructive'
      });
    } finally {
      setSaving(false);
    }
  };

  const submitAssessment = async () => {
    try {
      setLoading(true);
      
      // Map assessment type to database enum values
      let mappedAssessmentType = 'quiz'; // default
      
      if (formData.assessment_type === 'single_type') {
        // For single type, use a default type
        mappedAssessmentType = 'quiz';
      } else if (formData.assessment_type === 'multi_type') {
        // For multi type, use a default type that supports multiple question types
        mappedAssessmentType = 'test'; // 'test' is more flexible for mixed content
      }
      
      // Prepare scheduling data
      const scheduling = {
        start_date: formData.start_date,
        start_time: formData.start_time,
        end_date: formData.end_date,
        end_time: formData.end_time,
        timezone: formData.timezone,
        early_access_hours: formData.early_access_hours,
        late_submission_minutes: formData.late_submission_minutes
      };

      // Prepare proctoring settings
      const proctoring_settings = {
        proctoring_type: formData.proctoring_type,
        
        // Basic Proctoring Features
        browser_lockdown: formData.browser_lockdown,
        tab_switching_detection: formData.tab_switching_detection,
        copy_paste_detection: formData.copy_paste_detection,
        right_click_detection: formData.right_click_detection,
        fullscreen_requirement: formData.fullscreen_requirement,
        keyboard_shortcut_detection: formData.keyboard_shortcut_detection,
        
        // Advanced Proctoring Features
        require_webcam: formData.require_webcam,
        require_microphone: formData.require_microphone,
        screen_sharing_detection: formData.screen_sharing_detection,
        multiple_device_detection: formData.multiple_device_detection,
        plagiarism_detection: formData.plagiarism_detection,
        face_detection: formData.face_detection,
        voice_detection: formData.voice_detection,
        background_noise_detection: formData.background_noise_detection,
        eye_tracking: formData.eye_tracking,
        
        // AI Proctoring Features
        behavioral_analysis: formData.behavioral_analysis,
        facial_recognition: formData.facial_recognition,
        emotion_detection: formData.emotion_detection,
        attention_monitoring: formData.attention_monitoring,
        suspicious_activity_detection: formData.suspicious_activity_detection,
        ai_plagiarism_detection: formData.ai_plagiarism_detection,
        voice_analysis: formData.voice_analysis,
        gesture_recognition: formData.gesture_recognition,
        real_time_alerts: formData.real_time_alerts
      };

      // Prepare access control
      const access_control = {
        password: formData.access_password,
        ip_restrictions: formData.ip_restrictions,
        device_restrictions: formData.device_restrictions,
        browser_restrictions: formData.browser_restrictions
      };

      // Prepare assignment settings
      const assignment_settings = {
        assigned_colleges: formData.assigned_colleges,
        assigned_departments: formData.assigned_departments,
        assigned_groups: formData.assigned_groups,
        assigned_students: formData.assigned_students
      };

      // Map difficulty level from frontend to database values
      const mapDifficultyLevel = (level) => {
        const mapping = {
          'beginner': 'beginner',
          'intermediate': 'intermediate',
          'advanced': 'advanced',
          'expert': 'expert'
        };
        return mapping[level] || 'intermediate';
      };

      // Create assessment template
      const assessmentData = {
        title: formData.title,
        description: formData.description,
        instructions: formData.instructions,
        assessment_type: mappedAssessmentType,
        difficulty_level: mapDifficultyLevel(formData.difficulty_level),
        time_limit_minutes: formData.time_limit_minutes,
        total_points: calculateTotalPoints(),
        passing_score: formData.passing_score,
        max_attempts: formData.max_attempts,
        time_between_attempts_hours: formData.time_between_attempts_hours,
        shuffle_questions: formData.shuffle_questions,
        show_results_immediately: formData.show_results_immediately,
        allow_review: formData.allow_review,
        show_correct_answers: formData.show_correct_answers,
        require_proctoring: formData.require_proctoring,
        proctoring_type: formData.proctoring_type,
        proctoring_settings,
        scheduling,
        access_control,
        assignment_settings,
        sections: formData.sections,
        tags: formData.tags || [],
        metadata: {
          assessment_type: formData.assessment_type, // Store original type in metadata
          multi_type_structure: formData.multi_type_structure,
          selected_question_types: formData.selected_question_types
        }
      };

      // Add max_tab_switches to proctoring_settings
      if (assessmentData.proctoring_settings) {
        assessmentData.proctoring_settings.max_tab_switches = formData.max_tab_switches || 0;
      }

      // Only set status for new assessments, not for updates
      if (!isEditMode) {
        assessmentData.status = 'active';
      }
      
      let response;
      let assessmentId;
      
      if (isEditMode) {
        // Update existing assessment
        response = await apiService.updateAssessmentTemplate(editAssessmentId, assessmentData);
        assessmentId = editAssessmentId;
      } else {
        // Create new assessment
        response = await apiService.createAssessmentTemplate(assessmentData);
        assessmentId = response.data.id;
      }
      
      if (response.success) {
        // Create assignments and send email notifications (only for new assessments)
        if (!isEditMode) {
          await createAssignmentsAndNotify(assessmentId);
        }
        
        // Check if there's a warning about email notifications
        if (response.warning) {
          toast({
            title: 'Assessment Created Successfully',
            description: response.message,
            variant: 'default'
          });
          
          // Show additional warning toast
          setTimeout(() => {
            toast({
              title: 'Email Notification Warning',
              description: response.warning,
              variant: 'destructive'
            });
          }, 1000);
        } else {
          toast({
            title: 'Success',
            description: isEditMode 
              ? 'Assessment updated successfully!' 
              : 'Assessment created and assigned successfully! Email notifications have been sent.',
            variant: 'default'
          });
        }
        
        navigate('/assessments');
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: isEditMode 
          ? 'Failed to update assessment' 
          : 'Failed to create assessment',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const createAssignmentsAndNotify = async (assessmentId) => {
    try {
      // Validate required scheduling data
      if (!formData.start_date || !formData.start_time || !formData.end_date || !formData.end_time || !formData.assessment_timezone) {
        throw new Error('Missing required scheduling data for assignments');
      }
      
      const assignments = [];
      
      // Create assignments for colleges
      for (const collegeId of formData.assigned_colleges || []) {
        if (!collegeId) {
          continue;
        }
        
        const assignmentData = {
          assignment_type: 'college',
          target_id: collegeId,
          start_date: `${formData.start_date}T${formData.start_time}:00`,
          end_date: `${formData.end_date}T${formData.end_time}:00`,
          start_date_only: formData.start_date,
          start_time_only: formData.start_time,
          end_date_only: formData.end_date,
          end_time_only: formData.end_time,
          assessment_timezone: formData.assessment_timezone || 'UTC',
          early_access_hours: formData.early_access_hours || 0,
          late_submission_minutes: formData.late_submission_minutes || 0,
          password: formData.access_password || '',
          ip_restrictions: formData.ip_restrictions || '',
          device_restrictions: formData.device_restrictions || '',
          browser_restrictions: formData.browser_restrictions || ''
        };
        
        const response = await apiService.createAssessmentAssignment(assessmentId, assignmentData);
        if (response.success) {
          assignments.push(response.data);
        }
      }
      
      // Create assignments for departments
      for (const deptAssignment of formData.assigned_departments || []) {
        // deptAssignment is an object with {college_id, department_id}
        if (!deptAssignment || !deptAssignment.department_id) {
          continue;
        }
        
        const assignmentData = {
          assignment_type: 'department',
          target_id: deptAssignment.department_id, // Use department_id as target_id
          college_id: deptAssignment.college_id, // Include college_id for reference
          start_date_only: formData.start_date,
          start_time_only: formData.start_time,
          end_date_only: formData.end_date,
          end_time_only: formData.end_time,
          assessment_timezone: formData.assessment_timezone || 'UTC',
          early_access_hours: formData.early_access_hours || 0,
          late_submission_minutes: formData.late_submission_minutes || 0,
          password: formData.access_password || '',
          ip_restrictions: formData.ip_restrictions || '',
          device_restrictions: formData.device_restrictions || '',
          browser_restrictions: formData.browser_restrictions || ''
        };
        
        const response = await apiService.createAssessmentAssignment(assessmentId, assignmentData);
        if (response.success) {
          assignments.push(response.data);
        }
      }
      
      // Create assignments for groups
      for (const groupId of formData.assigned_groups || []) {
        if (!groupId) {
          continue;
        }
        
        const assignmentData = {
          assignment_type: 'group',
          target_id: groupId,
          start_date_only: formData.start_date,
          start_time_only: formData.start_time,
          end_date_only: formData.end_date,
          end_time_only: formData.end_time,
          assessment_timezone: formData.assessment_timezone || 'UTC',
          early_access_hours: formData.early_access_hours || 0,
          late_submission_minutes: formData.late_submission_minutes || 0,
          password: formData.access_password || '',
          ip_restrictions: formData.ip_restrictions || '',
          device_restrictions: formData.device_restrictions || '',
          browser_restrictions: formData.browser_restrictions || ''
        };
        
        const response = await apiService.createAssessmentAssignment(assessmentId, assignmentData);
        if (response.success) {
          assignments.push(response.data);
        }
      }
      
      // Create assignments for individual students
      for (const studentId of formData.assigned_students || []) {
        if (!studentId) {
          continue;
        }
        
        const assignmentData = {
          assignment_type: 'individual',
          target_id: studentId,
          start_date_only: formData.start_date,
          start_time_only: formData.start_time,
          end_date_only: formData.end_date,
          end_time_only: formData.end_time,
          assessment_timezone: formData.assessment_timezone || 'UTC',
          early_access_hours: formData.early_access_hours || 0,
          late_submission_minutes: formData.late_submission_minutes || 0,
          password: formData.access_password || '',
          ip_restrictions: formData.ip_restrictions || '',
          device_restrictions: formData.device_restrictions || '',
          browser_restrictions: formData.browser_restrictions || ''
        };
        
        const response = await apiService.createAssessmentAssignment(assessmentId, assignmentData);
        if (response.success) {
          assignments.push(response.data);
        }
      }
      
      // If no specific assignments were made, create a default assignment to all students
      if (assignments.length === 0) {
        // Get all students from the current user's college
        const userData = JSON.parse(localStorage.getItem('lmsUser') || '{}');
        const collegeId = userData.college_id;
        
        if (collegeId) {
          const assignmentData = {
            assignment_type: 'college',
            target_id: collegeId,
            start_date_only: formData.start_date,
            start_time_only: formData.start_time,
            end_date_only: formData.end_date,
            end_time_only: formData.end_time,
            assessment_timezone: formData.timezone || 'UTC',
            early_access_hours: formData.early_access_hours || 0,
            late_submission_minutes: formData.late_submission_minutes || 0,
            password: formData.access_password || '',
            ip_restrictions: formData.ip_restrictions || '',
            device_restrictions: formData.device_restrictions || '',
            browser_restrictions: formData.browser_restrictions || ''
          };
          
          const response = await apiService.createAssessmentAssignment(assessmentId, assignmentData);
          
          if (response.success) {
            assignments.push(response.data);
          }
        }
      }
      
      // Send email notifications for all assignments
      if (assignments.length > 0) {
        await sendEmailNotifications(assessmentId, assignments);
      }
      
    } catch (error) {
      throw error;
    }
  };

  const sendEmailNotifications = async (assessmentId, assignments) => {
    try {
      // Send notifications for each assignment
      for (const assignment of assignments) {
        const notificationData = {
          assessment_id: assessmentId,
          assignment_id: assignment.id,
          recipients: [
            { type: assignment.assignment_type, id: assignment.target_id }
          ],
          assessment_details: {
            title: formData.title,
            type: formData.assessment_type,
            start_date: `${formData.start_date}T${formData.start_time}:00`,
            end_date: `${formData.end_date}T${formData.end_time}:00`,
            instructions: formData.instructions,
            total_points: calculateTotalPoints(),
            timezone: formData.timezone
          }
        };
        
        // Call email notification endpoint
        const response = await apiService.post('/assessments/notifications/send', notificationData);
        
        // If there's a warning, log it but don't throw error
        if (response.warning) {
          // Handle warning silently
        }
      }
      
    } catch (error) {
      // Don't throw error here as the assessment was created successfully
      // The error will be handled by the main assessment creation flow
    }
  };

  // Get filtered steps based on assessment type
  const getFilteredSteps = () => {
    const baseSteps = [
      { id: 1, title: 'Basic Information', icon: FileText },
      { id: 2, title: 'Assessment Settings', icon: Settings },
      { id: 3, title: 'Scheduling', icon: Calendar },
      { id: 4, title: 'Proctoring', icon: Eye },
      { id: 5, title: 'Assignment', icon: Users }
    ];

    // Add Section Management only for section-based multi-type assessments
    if (formData.assessment_type === 'multi_type' && formData.multi_type_structure === 'section_based') {
      baseSteps.push({ id: 6, title: 'Section Management', icon: FileText });
    }

    // Add Question Selection and Review & Submit
    baseSteps.push(
      { id: 7, title: 'Question Selection', icon: CheckSquare },
      { id: 8, title: 'Review & Submit', icon: Send }
    );

    return baseSteps;
  };

  const renderStepContent = () => {
    const filteredSteps = getFilteredSteps();
    const currentStepData = filteredSteps.find(step => step.id === currentStep);
    
    if (!currentStepData) return null;

    switch (currentStepData.title) {
      case 'Basic Information':
        return <BasicInformationStep formData={formData} updateFormData={updateFormData} />;
      case 'Assessment Settings':
        return <AssessmentSettingsStep formData={formData} updateFormData={updateFormData} />;
      case 'Scheduling':
        return <SchedulingStep formData={formData} updateFormData={updateFormData} />;
      case 'Proctoring':
        return <ProctoringStep formData={formData} updateFormData={updateFormData} />;
      case 'Assignment':
        return <AssignmentStep formData={formData} updateFormData={updateFormData} colleges={colleges} />;
      case 'Section Management':
        return <SectionManagementStep 
          formData={formData} 
          updateFormData={updateFormData}
          updateSection={updateSection}
          addSection={addSection}
          removeSection={removeSection}
          questionTypes={QUESTION_TYPES}
        />;
      case 'Question Selection':
        return <QuestionSelectionStep 
          formData={formData}
          selectedQuestions={selectedQuestions}
          setSelectedQuestions={setSelectedQuestions}
          addQuestionToSection={addQuestionToSection}
          removeQuestionFromSection={removeQuestionFromSection}
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          filterType={filterType}
          setFilterType={setFilterType}
          filterDifficulty={filterDifficulty}
          setFilterDifficulty={setFilterDifficulty}
        />;
      case 'Review & Submit':
        return <ReviewStep 
          formData={formData} 
          calculateTotalPoints={calculateTotalPoints}
          colleges={colleges}
        />;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
                  <div className="mb-6 lg:mb-8">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-4">
              <div>
                <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">
                  {isEditMode ? 'Edit Assessment' : 'Create Assessment'}
                </h1>
                <p className="text-gray-600 mt-2 text-sm lg:text-base">
                  {isEditMode 
                    ? 'Step-by-step wizard to edit your assessment' 
                    : 'Step-by-step wizard to create a comprehensive assessment'
                  }
                </p>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={saveDraft} disabled={saving} size="sm" className="lg:text-base">
                  <Save className="w-4 h-4 mr-2" />
                  {saving ? 'Saving...' : 'Save Draft'}
                </Button>
                <Button variant="outline" onClick={() => navigate('/assessments')} size="sm" className="lg:text-base">
                  Cancel
                </Button>
              </div>
            </div>
          
          {/* Progress Steps */}
          <div className="space-y-4">
            {/* Desktop Progress Steps */}
            <div className="hidden md:flex items-center justify-center">
              <div className="flex items-center justify-center w-full max-w-6xl">
                {getFilteredSteps().map((step, index) => (
                  <div key={step.id} className="flex flex-col items-center relative flex-1">
                    {/* Step Circle */}
                    <div className={`flex items-center justify-center w-8 h-8 lg:w-10 lg:h-10 rounded-full border-2 flex-shrink-0 z-10 ${
                      currentStep >= step.id 
                        ? 'bg-blue-600 border-blue-600 text-white' 
                        : 'bg-white border-gray-300 text-gray-500'
                    }`}>
                      {currentStep > step.id ? (
                        <CheckSquare className="w-4 h-4 lg:w-5 lg:h-5" />
                      ) : (
                        <step.icon className="w-4 h-4 lg:w-5 lg:h-5" />
                      )}
                    </div>
                    
                    {/* Connector Line */}
                    {index < getFilteredSteps().length - 1 && (
                      <div className={`absolute top-4 lg:top-5 left-1/2 w-full h-0.5 ${
                        currentStep > step.id ? 'bg-blue-600' : 'bg-gray-300'
                      }`} />
                    )}
                    
                    {/* Step Label */}
                    <div className="mt-2 text-center w-full px-1">
                      <span className={`text-xs lg:text-sm font-medium block leading-tight ${
                        currentStep >= step.id ? 'text-blue-600' : 'text-gray-500'
                      }`}>
                        {step.title}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Tablet Progress Steps */}
            <div className="hidden sm:flex md:hidden items-center justify-center">
              <div className="flex items-center justify-center w-full max-w-4xl">
                {getFilteredSteps().map((step, index) => (
                  <div key={step.id} className="flex flex-col items-center relative flex-1">
                    {/* Step Circle */}
                    <div className={`flex items-center justify-center w-7 h-7 rounded-full border-2 flex-shrink-0 z-10 ${
                      currentStep >= step.id 
                        ? 'bg-blue-600 border-blue-600 text-white' 
                        : 'bg-white border-gray-300 text-gray-500'
                    }`}>
                      {currentStep > step.id ? (
                        <CheckSquare className="w-3 h-3" />
                      ) : (
                        <step.icon className="w-3 h-3" />
                      )}
                    </div>
                    
                    {/* Connector Line */}
                    {index < getFilteredSteps().length - 1 && (
                      <div className={`absolute top-3.5 left-1/2 w-full h-0.5 ${
                        currentStep > step.id ? 'bg-blue-600' : 'bg-gray-300'
                      }`} />
                    )}
                    
                    {/* Step Label */}
                    <div className="mt-1 text-center w-full px-1">
                      <span className={`text-xs font-medium block leading-tight ${
                        currentStep >= step.id ? 'text-blue-600' : 'text-gray-500'
                      }`}>
                        {step.title}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Mobile Progress Steps */}
            <div className="sm:hidden">
              <div className="flex items-center justify-center space-x-2 mb-2">
                <span className="text-sm text-gray-600">
                  Step {currentStep} of {getFilteredSteps().length}
                </span>
              </div>
              <div className="flex items-center justify-center">
                <span className="text-sm font-medium text-blue-600 text-center">
                  {getFilteredSteps().find(step => step.id === currentStep)?.title}
                </span>
              </div>
              
              {/* Mobile Progress Dots */}
              <div className="flex items-center justify-center gap-2 mt-3">
                {getFilteredSteps().map((step) => (
                  <div
                    key={step.id}
                    className={`w-2 h-2 rounded-full ${
                      currentStep >= step.id ? 'bg-blue-600' : 'bg-gray-300'
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Step Content */}
        <Card className="p-6 lg:p-8">
          <div className="max-w-none">
            {renderStepContent()}
          </div>
        </Card>

        {/* Navigation */}
        <div className="flex flex-col sm:flex-row justify-between gap-4 mt-6">
          <Button 
            variant="outline" 
            onClick={prevStep} 
            disabled={currentStep === 1}
            size="sm"
            className="w-full sm:w-auto"
          >
            <ChevronLeft className="w-4 h-4 mr-2" />
            Previous
          </Button>
          
          <div className="flex gap-2">
            {(() => {
              const filteredSteps = getFilteredSteps();
              const currentIndex = filteredSteps.findIndex(step => step.id === currentStep);
              const isLastStep = currentIndex === filteredSteps.length - 1;
              
              return isLastStep ? (
                <Button onClick={submitAssessment} disabled={loading} size="sm" className="w-full sm:w-auto">
                  <Send className="w-4 h-4 mr-2" />
                  {loading ? (isEditMode ? 'Updating...' : 'Creating...') : (isEditMode ? 'Update Assessment' : 'Create Assessment')}
                </Button>
              ) : (
                <Button onClick={nextStep} size="sm" className="w-full sm:w-auto">
                  Next
                  <ChevronRight className="w-4 h-4 ml-2" />
                </Button>
              );
            })()}
          </div>
        </div>
      </div>
    </div>
  );
} 