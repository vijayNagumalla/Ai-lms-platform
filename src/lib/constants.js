import { 
  CheckSquare, 
  FileText, 
  Code,
  Settings,
  Calendar,
  Eye,
  Users,
  Send
} from 'lucide-react';

export const ASSESSMENT_TYPES = [
  { value: 'quiz', label: 'Quiz', icon: CheckSquare },
  { value: 'test', label: 'Test', icon: FileText },
  { value: 'exam', label: 'Exam', icon: FileText },
  { value: 'assignment', label: 'Assignment', icon: FileText },
  { value: 'coding_challenge', label: 'Coding Challenge', icon: Code },
  { value: 'survey', label: 'Survey', icon: CheckSquare }
];

export const PROCTORING_TYPES = [
  { value: 'none', label: 'None' },
  { value: 'basic', label: 'Basic' },
  { value: 'advanced', label: 'Advanced' },
  { value: 'ai', label: 'AI Proctoring' }
];

export const QUESTION_TYPES = [
  { value: 'multiple_choice', label: 'Multiple Choice', icon: '📝' },
  { value: 'single_choice', label: 'Single Choice', icon: '☑️' },
  { value: 'true_false', label: 'True/False', icon: '✅' },
  { value: 'short_answer', label: 'Short Answer', icon: '✏️' },
  { value: 'essay', label: 'Essay', icon: '📄' },
  { value: 'coding', label: 'Coding', icon: '💻' },
  { value: 'fill_blanks', label: 'Fill Blanks', icon: '🔤' }
];

export const STEPS = [
  { id: 1, title: 'Basic Information', icon: FileText },
  { id: 2, title: 'Assessment Settings', icon: Settings },
  { id: 3, title: 'Scheduling', icon: Calendar },
  { id: 4, title: 'Proctoring', icon: Eye },
  { id: 5, title: 'Assignment', icon: Users },
  { id: 6, title: 'Section Management', icon: FileText },
  { id: 7, title: 'Question Selection', icon: CheckSquare },
  { id: 8, title: 'Review & Submit', icon: Send }
]; 