# Assessment Taking System - Current Layout & Structure

## 📁 File Structure

```
src/components/assessment-taking/
├── AssessmentTakeWizard.jsx          # Main orchestrator component
├── CodingQuestionInterface.jsx       # Coding question renderer (two-column layout)
├── QuestionRenderer.jsx              # Non-coding question renderer (MCQ, etc.)
├── TimerComponent.jsx                 # Assessment timer display
├── ProctoringMonitor.jsx             # Proctoring functionality
├── SectionNavigation.jsx              # Section navigation component
└── steps/
    ├── AssessmentDescriptionStep.jsx # Step 1: Assessment overview
    ├── TermsAgreementStep.jsx         # Step 2: Terms & conditions
    ├── ProctoringSetupStep.jsx        # Step 3: Proctoring setup (if enabled)
    ├── SectionStartStep.jsx           # Step: Section introduction
    ├── QuestionTakingStep.jsx         # Step: Main question interface
    ├── SectionCompletionStep.jsx      # Step: Section completion summary
    ├── SubmissionConfirmationStep.jsx # Step: Final submission
    └── AssessmentResultsStep.jsx      # Step: Results display (if immediate)
```

## 🏗️ Architecture Overview

### 1. **AssessmentTakeWizard.jsx** (Main Controller)
**Purpose**: Orchestrates the entire assessment flow

**Key Responsibilities**:
- Manages assessment state (questions, sections, answers)
- Controls step navigation
- Handles data fetching from backend
- Manages auto-save functionality
- Coordinates between all step components

**State Management**:
```javascript
- assessment: Assessment details
- submission: Student submission record
- questions: All questions array
- sections: Assessment sections array
- answers: { questionId: answerData }
- currentQuestionIndex: Current question position
- currentSectionIndex: Current section position
- currentStep: Wizard step index
- flaggedQuestions: Set of flagged question IDs
- timeSpent: Time tracking per question
```

**Step Flow**:
```
1. Assessment Description Step
2. Terms & Conditions Step
3. Proctoring Setup (if enabled)
4. Section Flow (if sections exist):
   - Section Start → Questions → Section Completion
   - (Repeats for each section)
5. Submission Confirmation
6. Results (if immediate results enabled)
```

---

### 2. **QuestionTakingStep.jsx** (Question Interface Container)
**Purpose**: Renders the main question-taking interface

**Layout Structure**:
```
┌─────────────────────────────────────────────────────────┐
│  Header (Timer, Assessment Info, Network Status)        │
├──────────────┬──────────────────────────────────────────┤
│              │  Navigation Buttons                      │
│              │  (Previous, Mark for Review, Next)        │
│  Sidebar     ├──────────────────────────────────────────┤
│  (Collapsible│                                           │
│   60-320px)  │  Question Content Area                   │
│              │  ┌─────────────────────────────────────┐ │
│  Section     │  │ Question Title                      │ │
│  Questions   │  │ Question Text                      │ │
│  List        │  │                                     │ │
│  (Numbered)  │  │ [Question Renderer]                 │ │
│              │  │ - MCQ: Radio/Checkbox options      │ │
│              │  │ - Coding: Two-column layout         │ │
│              │  │ - Other types                       │ │
│              │  └─────────────────────────────────────┘ │
│              │                                           │
└──────────────┴───────────────────────────────────────────┘
```

**Features**:
- Collapsible sidebar (60px collapsed, 320px expanded)
- Section-based question filtering
- Navigation buttons above question
- Auto-save functionality
- Question status indicators (answered, flagged, not answered)

**Sidebar Content**:
- Only shows questions from current section
- Displays question number and status icon
- For coding questions: shows question title
- Status indicators:
  - ✓ Answered
  - ⚠ Not answered
  - 🚩 Flagged

---

### 3. **CodingQuestionInterface.jsx** (Coding Question Layout)
**Purpose**: Specialized interface for coding questions with Monaco Editor

**Two-Column Adjustable Layout**:
```
┌────────────────────────────────────────────────────────────────┐
│  Question & Test Cases (Left Column - 40% default)             │
│  ├────────────────────────────────────────────────────────────┤
│  │  Question Title & Points                                   │
│  │  Question Description (HTML)                               │
│  │  Explanation (if available)                                │
│  │                                                             │
│  │  ┌─ Test Cases Card ────────────────────────────────────┐ │
│  │  │  Test Cases                    [Run All Tests Button] │ │
│  │  │  ┌─────────────────────────────────────────────────┐ │ │
│  │  │  │ Test Case 1                    [Run Button]     │ │ │
│  │  │  │ Input: ...                                       │ │ │
│  │  │  │ Expected Output: ...                              │ │ │
│  │  │  │ Your Output: ... (after run)                     │ │ │
│  │  │  └─────────────────────────────────────────────────┘ │ │
│  │  │  ... (more test cases)                               │ │
│  │  │  Summary: ✓ X passed / ✗ Y failed                    │ │
│  │  └───────────────────────────────────────────────────────┘ │
│  └─────────────────────────────────────────────────────────────┘
│  │
│  ║  ← Resizer (adjustable)
│  │
├─────────────────────────────────────────────────────────────────┤
│  Code Editor (Right Column - 60% default)                       │
│  ├────────────────────────────────────────────────────────────┤
│  │  [Terminal Icon] Code Editor                               │
│  │              [Language Dropdown] [Reset Button]           │
│  ├────────────────────────────────────────────────────────────┤
│  │  Your Solution                    ✓ Auto-saved            │
│  ├────────────────────────────────────────────────────────────┤
│  │                                                             │
│  │  ┌─ Monaco Editor ─────────────────────────────────────┐ │
│  │  │ 1  │ def solve(input):                               │ │
│  │  │ 2  │     # Your code here                             │ │
│  │  │ 3  │     return result                                │ │
│  │  │ 4  │                                                  │ │
│  │  │    │ (Syntax highlighting, line numbers)              │ │
│  │  └────────────────────────────────────────────────────────┘ │
│  └─────────────────────────────────────────────────────────────┘
└─────────────────────────────────────────────────────────────────┘
```

**Features**:
- **Monaco Editor**:
  - Syntax highlighting (language-specific)
  - Line numbers
  - Starter code auto-loading
  - Language-specific indentation (Python: 4 spaces, others: 2)
  - Bracket pair colorization
  - Word wrap
  - Dynamic height adjustment
  
- **Language Dropdown**:
  - Based on `question.metadata.languages` or `question.coding_details.languages`
  - Shows language icons
  - Auto-loads starter code for selected language
  
- **Test Cases**:
  - Extracted from `question.metadata.test_cases` or `question.coding_details.test_cases`
  - Individual "Run" buttons per test case
  - "Run All Tests" button in header
  - Results display: Pass/Fail, output comparison
  - Docker-based execution via backend API

- **Resizable Columns**:
  - Drag resizer between columns
  - Default: 40% left, 60% right
  - Preserves ratio during resize

**Data Flow**:
```
Question Object Structure:
{
  id, title, question_text, points,
  metadata: {
    languages: ['python', 'javascript', ...],
    starter_codes: { python: '...', javascript: '...' },
    test_cases: [{ input, expected_output, ... }],
    time_limit, memory_limit
  },
  coding_details: {
    languages: [...],
    starter_codes: {...},
    test_cases: [...]
  }
}
```

---

### 4. **QuestionRenderer.jsx** (Non-Coding Questions)
**Purpose**: Renders MCQ, single choice, true/false, short answer, etc.

**Layout Structure**:
```
┌────────────────────────────────────────────────┐
│  Padding: 24px (top & left)                    │
│                                                 │
│  Question Title (2xl, bold)                    │
│  Points Badge                                   │
│                                                 │
│  ┌─ Question Content ───────────────────────┐ │
│  │  Question Text (HTML rendered)             │ │
│  │                                             │ │
│  │  Options/Input Fields:                     │ │
│  │  - MCQ: Radio buttons or Checkboxes        │ │
│  │  - Short Answer: Text input                │ │
│  │  - Essay: Textarea                         │ │
│  │  - Fill Blanks: Input fields               │ │
│  └─────────────────────────────────────────────┘ │
│                                                 │
│  Status: ✓ Answered (Auto-saved)               │
│          or ⚠ Not answered                      │
└────────────────────────────────────────────────┘
```

**Features**:
- Auto-save on answer change
- Status indicator
- Padding for better readability (top & left)

---

## 🔄 Data Flow

### 1. **Initialization Flow**
```
AssessmentTakeWizard
  ├─> Fetch Assessment Data (apiService.getAssessment)
  ├─> Fetch Questions (apiService.getAssessmentQuestions)
  ├─> Fetch Sections (from assessment data)
  ├─> Initialize Submission (create or load existing)
  └─> Load Saved Answers (from student_responses table)
```

### 2. **Answer Saving Flow**
```
User Types Code/Selects Answer
  └─> onAnswerChange (QuestionTakingStep)
      └─> handleAnswerChange (QuestionTakingStep)
          └─> Auto-save with debounce (500ms)
              └─> saveAnswer (AssessmentTakeWizard)
                  └─> API Call: POST /api/student-assessments/{id}/answers
                      └─> Backend: studentAssessmentService.saveAnswer
                          └─> Database: INSERT/UPDATE student_responses
```

### 3. **Test Case Execution Flow**
```
User Clicks "Run Test Cases"
  └─> runTestCases (CodingQuestionInterface)
      └─> API Call: POST /api/coding/test-cases
          └─> Backend: Docker-based execution
              └─> Returns: { results: [{ verdict, output, ... }] }
                  └─> Display results in test cases UI
```

---

## 📊 Database Schema

### **student_responses** Table
```sql
- id (UUID)
- submission_id (UUID) → assessment_submissions(id)
- question_id (UUID) → questions(id)
- section_id (UUID, nullable)
- question_type (ENUM: multiple_choice, single_choice, true_false, 
                short_answer, essay, coding, fill_blanks, ...)
- student_answer (TEXT) - JSON string for coding questions
- selected_options (JSON) - For MCQ questions
- time_spent (INT)
- is_correct (BOOLEAN, nullable)
- points_earned (DECIMAL)
- auto_saved (BOOLEAN)
- created_at, updated_at
```

### **Question Data Structure** (from backend)
```javascript
{
  id, title, question_text, content,
  question_type: 'coding' | 'multiple_choice' | ...
  points, difficulty_level,
  
  // For coding questions:
  metadata: {
    languages: ['python', 'javascript'],
    starter_codes: { python: '...', javascript: '...' },
    test_cases: [{ input, expected_output, description }],
    time_limit: 1000,
    memory_limit: 256
  },
  
  coding_details: { // Alternative location for same data
    languages: [...],
    starter_codes: {...},
    test_cases: [...]
  }
}
```

---

## 🎨 UI Components Used

### **From shadcn/ui**:
- `Card`, `CardHeader`, `CardContent`, `CardTitle`
- `Button`
- `Badge`
- `Alert`, `AlertDescription`
- `Select`, `SelectContent`, `SelectItem`, `SelectTrigger`, `SelectValue`
- `Progress`

### **Custom Components**:
- `CodeEditor` (wraps Monaco Editor)
- `TimerComponent` (custom timer display)
- `ProctoringMonitor` (proctoring functionality)

### **External Libraries**:
- `@monaco-editor/react` - Code editor
- `framer-motion` - Animations
- `react-hot-toast` - Toast notifications
- `lucide-react` - Icons

---

## 🔑 Key Features

### ✅ **Section-Based Flow**
- Sections are completed sequentially
- Each section has: Start → Questions → Completion
- Section completion required before moving to next

### ✅ **Auto-Save**
- Answers auto-save on change (500ms debounce)
- Periodic auto-save (every 30 seconds)
- Visual indicator: "✓ Auto-saved"

### ✅ **Coding Question Features**
- Monaco Editor with syntax highlighting
- Multi-language support with starter codes
- Test case execution via Docker
- Two-column adjustable layout
- Real-time test results

### ✅ **Responsive Design**
- Full-screen layout (no unwanted scrolling)
- Collapsible sidebar
- Adjustable column widths for coding questions

### ✅ **Navigation**
- Previous/Next buttons above question
- Sidebar question navigation
- Section-based filtering
- "Complete Section" button on last question

### ✅ **Question Status Tracking**
- Answered/Not answered indicators
- Flagged questions (mark for review)
- Question completion tracking

---

## 🚀 Performance Optimizations

1. **React.memo** for question components
2. **useMemo** for computed values (test cases, languages)
3. **useCallback** for event handlers
4. **Debounced auto-save** (500ms)
5. **Lazy loading** for Monaco Editor

---

## 📝 Component Props Flow

```
AssessmentTakeWizard
  └─> QuestionTakingStep
      ├─> QuestionRenderer (for non-coding)
      │   └─> Props: question, answer, onAnswerChange
      │
      └─> CodingQuestionInterface (for coding)
          └─> Props: question, answer, onAnswerChange, onSave, submissionId
              └─> CodeEditor
                  └─> Monaco Editor (from @monaco-editor/react)
```

---

## 🔧 Configuration

### **Backend API Endpoints**:
- `GET /api/assessments/{id}` - Get assessment details
- `GET /api/student-assessments/{id}/questions` - Get questions
- `POST /api/student-assessments/{id}/answers` - Save answer
- `POST /api/coding/test-cases` - Run test cases
- `POST /api/student-assessments/{id}/submit` - Submit assessment

### **Environment Variables**:
- Docker configuration for test case execution
- Database connection settings
- API base URL

---

## 📌 Current Layout Summary

```
┌──────────────────────────────────────────────────────────────┐
│                    HEADER                                     │
│  [Assessment Name] [Timer] [Network Status] [Sidebar Toggle]│
├──────────────┬───────────────────────────────────────────────┤
│              │                                               │
│  SIDEBAR     │  [Previous] [Mark Review] [Next/Complete]    │
│  (Collapsed) │  ────────────────────────────────────────────│
│              │                                               │
│  Questions   │  QUESTION AREA                               │
│  List        │  ┌─────────────────────────────────────────┐ │
│              │  │ For Coding:                              │ │
│  (Current    │  │ ┌─────────────┬───────────────────────┐ │ │
│   Section    │  │ │ Question &   │ Code Editor            │ │ │
│   Only)      │  │ │ Test Cases  │ (Monaco)               │ │ │
│              │  │ │             │                         │ │ │
│              │  │ └─────────────┴───────────────────────┘ │ │
│              │  │                                           │ │
│              │  │ For Other Types:                         │ │
│              │  │ ┌───────────────────────────────────────┐ │ │
│              │  │ │ Question Text                         │ │ │
│              │  │ │ [Options/Input]                       │ │ │
│              │  │ └───────────────────────────────────────┘ │ │
│              │  └─────────────────────────────────────────┘ │
│              │                                               │
└──────────────┴───────────────────────────────────────────────┘
```

---

This structure provides a modular, maintainable, and scalable assessment-taking system with section-based flow, specialized coding question interface, and comprehensive auto-save functionality.
