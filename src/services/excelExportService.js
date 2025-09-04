import * as XLSX from 'xlsx';
import ExcelJS from 'exceljs';

class ExcelExportService {
  constructor() {
    this.workbook = null;
  }

  // Main export function
  async exportAssessmentData(config) {
    const { type, columns, filters, settings, assessmentData, submissions } = config;
    
    this.workbook = new ExcelJS.Workbook();
    this.workbook.creator = 'LMS Platform';
    this.workbook.lastModifiedBy = 'LMS Platform';
    this.workbook.created = new Date();
    this.workbook.modified = new Date();

    // Filter submissions based on selected filters
    const filteredSubmissions = this.filterSubmissions(submissions, filters);
    
    if (type === 'regular') {
      await this.createRegularExport(filteredSubmissions, assessmentData, settings);
    } else {
      await this.createAdvancedExport(filteredSubmissions, assessmentData, columns, filters, settings);
    }

    return this.workbook;
  }

  // Filter submissions based on selected criteria
  filterSubmissions(submissions, filters) {
    let filtered = [...submissions];

    // Student filters
    if (filters.presentStudents) {
      filtered = filtered.filter(sub => sub.status === 'submitted' || sub.status === 'graded');
    }
    if (filters.absentStudents) {
      filtered = filtered.filter(sub => sub.status !== 'submitted' && sub.status !== 'graded');
    }
    if (filters.byDepartment && filters.selectedDepartments) {
      filtered = filtered.filter(sub => filters.selectedDepartments.includes(sub.department_name));
    }
    if (filters.byBatch && filters.selectedBatches) {
      filtered = filtered.filter(sub => filters.selectedBatches.includes(sub.batch));
    }

    // Performance filters
    if (filters.byPerformanceRange && filters.selectedRanges) {
      filtered = filtered.filter(sub => {
        const score = sub.score || 0;
        return filters.selectedRanges.some(range => {
          switch (range) {
            case '>90%': return score > 90;
            case '80-90%': return score >= 80 && score <= 90;
            case '70-80%': return score >= 70 && score < 80;
            case '60-70%': return score >= 60 && score < 70;
            case '50-60%': return score >= 50 && score < 60;
            case '<50%': return score < 50;
            default: return true;
          }
        });
      });
    }
    if (filters.firstAttemptOnly) {
      filtered = filtered.filter(sub => (sub.attempt_number || 1) === 1);
    }
    if (filters.lateSubmissionsOnly) {
      filtered = filtered.filter(sub => sub.late_submission === true);
    }

    return filtered;
  }

  // Create regular export with all data
  async createRegularExport(submissions, assessmentData, settings) {
    // Get question types for this assessment to create dynamic columns
    const questionTypes = await this.getAssessmentQuestionTypes(assessmentData.id);
    
    // Sheet 1: Student Performance Report (Dynamic columns based on question types)
    await this.createDynamicStudentPerformanceSheet(submissions, assessmentData, settings, questionTypes);
    
    // Sheet 2: Absentees Report
    const absentees = submissions.filter(sub => sub.status !== 'submitted' && sub.status !== 'graded');
    await this.createDynamicAbsenteesSheet(absentees, assessmentData, questionTypes);
    
    // Sheet 3: Analytics Summary
    await this.createAnalyticsSummarySheet(submissions, assessmentData, settings);
  }

  // Create advanced export with selected columns
  async createAdvancedExport(submissions, assessmentData, columns, filters, settings) {
    // Sheet 1: Custom Student Data
    await this.createCustomStudentSheet(submissions, assessmentData, columns, settings);
    
    // Sheet 2: Absentees (if selected)
    if (filters.absentStudents || filters.allStudents) {
      const absentees = submissions.filter(sub => sub.status !== 'submitted' && sub.status !== 'graded');
      await this.createCustomAbsenteesSheet(absentees, assessmentData, columns);
    }
    
    // Sheet 3: Analytics (if enabled)
    if (settings.includeSummary) {
      await this.createAnalyticsSummarySheet(submissions, assessmentData, settings);
    }
  }





  // Sheet 3: Analytics Summary
  async createAnalyticsSummarySheet(submissions, assessmentData, settings) {
    const worksheet = this.workbook.addWorksheet('Analytics Summary');
    
    // Overall Statistics
    const totalStudents = submissions.length;
    const presentStudents = submissions.filter(sub => sub.status === 'submitted' || sub.status === 'graded').length;
    const absentStudents = totalStudents - presentStudents;
    const averageScore = presentStudents > 0 ? 
      submissions.filter(sub => sub.status === 'submitted' || sub.status === 'graded')
        .reduce((sum, sub) => sum + (sub.score || 0), 0) / presentStudents : 0;
    
    // Add summary data
    worksheet.addRow(['Assessment Analytics Summary', '']);
    worksheet.addRow(['Assessment Title', assessmentData?.title || 'N/A']);
    worksheet.addRow(['Assessment Date', assessmentData?.created_at ? new Date(assessmentData.created_at).toLocaleDateString() : 'N/A']);
    worksheet.addRow(['Total Students', totalStudents]);
    worksheet.addRow(['Present Students', presentStudents]);
    worksheet.addRow(['Absent Students', absentStudents]);
    worksheet.addRow(['Attendance Rate', `${((presentStudents / totalStudents) * 100).toFixed(1)}%`]);
    worksheet.addRow(['Average Score', `${averageScore.toFixed(1)}%`]);
    worksheet.addRow(['']);
    
    // Performance Distribution
    worksheet.addRow(['Performance Distribution', '']);
    const performanceRanges = [
      { range: '>90%', count: submissions.filter(sub => (sub.score || 0) > 90).length },
      { range: '80-90%', count: submissions.filter(sub => (sub.score || 0) >= 80 && (sub.score || 0) <= 90).length },
      { range: '70-80%', count: submissions.filter(sub => (sub.score || 0) >= 70 && (sub.score || 0) < 80).length },
      { range: '60-70%', count: submissions.filter(sub => (sub.score || 0) >= 60 && (sub.score || 0) < 70).length },
      { range: '50-60%', count: submissions.filter(sub => (sub.score || 0) >= 50 && (sub.score || 0) < 60).length },
      { range: '<50%', count: submissions.filter(sub => (sub.score || 0) < 50).length }
    ];
    
    worksheet.addRow(['Range', 'Count']);
    performanceRanges.forEach(range => {
      worksheet.addRow([range.range, range.count]);
    });
    
    // Department-wise Analysis
    worksheet.addRow(['']);
    worksheet.addRow(['Department-wise Analysis', '']);
    const departments = [...new Set(submissions.map(sub => sub.department_name).filter(Boolean))];
    worksheet.addRow(['Department', 'Total', 'Present', 'Absent', 'Avg Score']);
    
    departments.forEach(dept => {
      const deptStudents = submissions.filter(sub => sub.department_name === dept);
      const deptPresent = deptStudents.filter(sub => sub.status === 'submitted' || sub.status === 'graded');
      const deptAvgScore = deptPresent.length > 0 ? 
        deptPresent.reduce((sum, sub) => sum + (sub.score || 0), 0) / deptPresent.length : 0;
      
      worksheet.addRow([
        dept,
        deptStudents.length,
        deptPresent.length,
        deptStudents.length - deptPresent.length,
        `${deptAvgScore.toFixed(1)}%`
      ]);
    });
    
    // Style the summary
    const titleRow = worksheet.getRow(1);
    titleRow.font = { bold: true, size: 14 };
    titleRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF4472C4' } };
    
    // Auto-fit columns
    worksheet.columns.forEach(column => {
      column.width = Math.max(column.width || 10, 20);
    });
  }

  // Custom student sheet with selected columns
  async createCustomStudentSheet(submissions, assessmentData, columns, settings) {
    const worksheet = this.workbook.addWorksheet('Custom Student Data');
    
    // Build headers based on selected columns
    const headers = [];
    const columnMapping = this.getColumnMapping();
    
    Object.entries(columns).forEach(([key, selected]) => {
      if (selected && columnMapping[key]) {
        headers.push(columnMapping[key].label);
      }
    });
    
    worksheet.addRow(headers);
    
    // Style headers
    const headerRow = worksheet.getRow(1);
    headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF4472C4' }
    };
    
    // Add data rows
    submissions.forEach(submission => {
      const row = [];
      Object.entries(columns).forEach(([key, selected]) => {
        if (selected && columnMapping[key]) {
          const value = this.getColumnValue(submission, key, columnMapping[key]);
          row.push(value);
        }
      });
      worksheet.addRow(row);
    });
    
    // Auto-fit columns
    worksheet.columns.forEach(column => {
      column.width = Math.max(column.width || 10, 15);
    });
  }

  // Custom absentees sheet
  async createCustomAbsenteesSheet(absentees, assessmentData, columns) {
    const worksheet = this.workbook.addWorksheet('Custom Absentees Data');
    
    // Similar to custom student sheet but for absentees only
    const headers = [];
    const columnMapping = this.getColumnMapping();
    
    Object.entries(columns).forEach(([key, selected]) => {
      if (selected && columnMapping[key]) {
        headers.push(columnMapping[key].label);
      }
    });
    
    worksheet.addRow(headers);
    
    // Style headers
    const headerRow = worksheet.getRow(1);
    headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFDC3545' }
    };
    
    // Add absentees data
    absentees.forEach(student => {
      const row = [];
      Object.entries(columns).forEach(([key, selected]) => {
        if (selected && columnMapping[key]) {
          const value = this.getColumnValue(student, key, columnMapping[key], true); // true for absent
          row.push(value);
        }
      });
      const dataRow = worksheet.addRow(row);
      dataRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFE4E1' } };
    });
    
    // Auto-fit columns
    worksheet.columns.forEach(column => {
      column.width = Math.max(column.width || 10, 15);
    });
  }

  // Add performance pivot table
  async addPerformancePivotTable(worksheet, submissions) {
    // This would add a pivot table showing performance distribution
    // Implementation depends on ExcelJS pivot table capabilities
  }

  // Add attendance pivot table
  async addAttendancePivotTable(worksheet, submissions) {
    // This would add a pivot table showing attendance distribution
    // Implementation depends on ExcelJS pivot table capabilities
  }

  // Get assessment question types for dynamic columns
  async getAssessmentQuestionTypes(assessmentId) {
    try {
      // Try to get question types from the assessment data if available
      if (assessmentId && typeof assessmentId === 'object' && assessmentId.questionTypes) {
        return assessmentId.questionTypes;
      }
      
      // If we have assessment data with questions, extract question types
      if (assessmentId && typeof assessmentId === 'object' && assessmentId.questions) {
        const questionTypes = [...new Set(assessmentId.questions.map(q => q.question_type))];
        return questionTypes.length > 0 ? questionTypes : this.getDefaultQuestionTypes();
      }
      
      // Default fallback - return common question types
      return this.getDefaultQuestionTypes();
    } catch (error) {
      console.error('Error getting question types:', error);
      return this.getDefaultQuestionTypes();
    }
  }

  // Get default question types
  getDefaultQuestionTypes() {
    return [
      'multiple_choice',
      'true_false', 
      'short_answer',
      'essay',
      'coding',
      'fill_blanks',
      'matching',
      'ordering',
      'file_upload'
    ];
  }

  // Create dynamic student performance sheet based on question types
  async createDynamicStudentPerformanceSheet(submissions, assessmentData, settings, questionTypes) {
    const worksheet = this.workbook.addWorksheet('Student Performance Report');
    
    // Sort by percentage (descending)
    const sortedSubmissions = [...submissions].sort((a, b) => (b.percentage_score || 0) - (a.percentage_score || 0));
    
    // Build dynamic headers - ONLY the columns you want for Quick Export
    const baseHeaders = [
      'Roll Number', 'Name', 'Email ID', 'Department', 'Batch'
    ];
    
    // Add question type columns dynamically - ONLY for question types that exist in this assessment
    const questionTypeHeaders = questionTypes.map(type => {
      const typeLabels = {
        'multiple_choice': 'MCQ Marks',
        'true_false': 'True/False Marks',
        'short_answer': 'Short Answer Marks',
        'essay': 'Essay Marks',
        'coding': 'Coding Marks',
        'fill_blanks': 'Fill Blanks Marks',
        'matching': 'Matching Marks',
        'ordering': 'Ordering Marks',
        'file_upload': 'File Upload Marks'
      };
      return typeLabels[type] || `${type.replace('_', ' ').toUpperCase()} Marks`;
    });
    
    // ONLY include these columns for Quick Export
    const finalHeaders = [
      ...baseHeaders,
      ...questionTypeHeaders,
      'Total Marks',
      'Percentage'
    ];
    
    worksheet.addRow(finalHeaders);
    
    // Style headers
    const headerRow = worksheet.getRow(1);
    headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF4472C4' }
    };
    
    // Add data rows
    sortedSubmissions.forEach(submission => {
      const baseRow = [
        submission.student_id_number || 'N/A',
        submission.student_name || 'N/A',
        submission.student_email || 'N/A',
        submission.department_name || 'N/A',
        submission.batch || 'N/A'
      ];
      
      // Add question type marks (for now, we'll use placeholder logic)
      // In a real implementation, you would calculate these from the actual question data
      const questionTypeMarks = questionTypes.map(type => {
        if (submission.status !== 'submitted' && submission.status !== 'graded') {
          return 'Absent';
        }
        // This would be calculated from actual question breakdown
        // For now, we'll use a simple distribution
        const totalScore = submission.score || 0;
        const questionCount = questionTypes.length;
        return Math.round(totalScore / questionCount) || 0;
      });
      
      const finalRow = [
        ...baseRow,
        ...questionTypeMarks,
        submission.score || 0,
        submission.percentage_score || 0
      ];
      
      const dataRow = worksheet.addRow(finalRow);
      
      // Color code based on performance
      if (settings.colorCode) {
        const score = submission.percentage_score || 0;
        const percentageColumnIndex = finalHeaders.length; // Last column
        
        if (score >= 80) {
          dataRow.getCell(percentageColumnIndex).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF90EE90' } }; // Light green
        } else if (score >= 60) {
          dataRow.getCell(percentageColumnIndex).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFFFE0' } }; // Light yellow
        } else if (score < 60) {
          dataRow.getCell(percentageColumnIndex).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFB6C1' } }; // Light red
        }
        
        // Gray for absent students
        if (submission.status !== 'submitted' && submission.status !== 'graded') {
          dataRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD3D3D3' } };
        }
      }
    });
    
    // Auto-fit columns
    worksheet.columns.forEach(column => {
      column.width = Math.max(column.width || 10, 15);
    });
    
    // Add performance distribution chart
    await this.addPerformanceDistributionChart(worksheet, sortedSubmissions);
  }

  // Create dynamic absentees sheet
  async createDynamicAbsenteesSheet(absentees, assessmentData, questionTypes) {
    const worksheet = this.workbook.addWorksheet('Absentees Report');
    
    // Build dynamic headers - ONLY the columns you want for Quick Export
    const baseHeaders = [
      'Roll Number', 'Name', 'Email ID', 'Department', 'Batch'
    ];
    
    const questionTypeHeaders = questionTypes.map(type => {
      const typeLabels = {
        'multiple_choice': 'MCQ Marks',
        'true_false': 'True/False Marks',
        'short_answer': 'Short Answer Marks',
        'essay': 'Essay Marks',
        'coding': 'Coding Marks',
        'fill_blanks': 'Fill Blanks Marks',
        'matching': 'Matching Marks',
        'ordering': 'Ordering Marks',
        'file_upload': 'File Upload Marks'
      };
      return typeLabels[type] || `${type.replace('_', ' ').toUpperCase()} Marks`;
    });
    
    // ONLY include these columns for Quick Export
    const finalHeaders = [
      ...baseHeaders,
      ...questionTypeHeaders,
      'Total'
    ];
    
    worksheet.addRow(finalHeaders);
    
    // Style headers
    const headerRow = worksheet.getRow(1);
    headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFDC3545' }
    };
    
    // Add absentees data
    absentees.forEach(student => {
      const baseRow = [
        student.student_id_number || 'N/A',
        student.student_name || 'N/A',
        student.student_email || 'N/A',
        student.department_name || 'N/A',
        student.batch || 'N/A'
      ];
      
      // All question type marks are "Absent"
      const absentMarks = questionTypes.map(() => 'Absent');
      
      const finalRow = [
        ...baseRow,
        ...absentMarks,
        'Absent'
      ];
      
      const dataRow = worksheet.addRow(finalRow);
      dataRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFE4E1' } }; // Light red
    });
    
    // Auto-fit columns
    worksheet.columns.forEach(column => {
      column.width = Math.max(column.width || 10, 15);
    });
  }

  // Add performance distribution chart
  async addPerformanceDistributionChart(worksheet, submissions) {
    // Calculate performance distribution
    const distribution = {
      '90-100%': submissions.filter(s => (s.percentage_score || 0) >= 90).length,
      '80-89%': submissions.filter(s => (s.percentage_score || 0) >= 80 && (s.percentage_score || 0) < 90).length,
      '70-79%': submissions.filter(s => (s.percentage_score || 0) >= 70 && (s.percentage_score || 0) < 80).length,
      '60-69%': submissions.filter(s => (s.percentage_score || 0) >= 60 && (s.percentage_score || 0) < 70).length,
      'Below 60%': submissions.filter(s => (s.percentage_score || 0) < 60).length
    };
    
    // Add chart data below the main table
    const startRow = submissions.length + 5;
    worksheet.addRow([]); // Empty row
    worksheet.addRow(['Performance Distribution Chart']);
    worksheet.addRow(['Range', 'Count']);
    
    Object.entries(distribution).forEach(([range, count]) => {
      worksheet.addRow([range, count]);
    });
    
    // Style the chart section
    const chartTitleRow = worksheet.getRow(startRow + 1);
    chartTitleRow.font = { bold: true, size: 14 };
    chartTitleRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF4472C4' } };
    
    const chartHeaderRow = worksheet.getRow(startRow + 2);
    chartHeaderRow.font = { bold: true };
    chartHeaderRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE0E0E0' } };
  }

  // Helper methods
  getGrade(score) {
    if (score >= 90) return 'A+';
    if (score >= 80) return 'A';
    if (score >= 70) return 'B+';
    if (score >= 60) return 'B';
    if (score >= 50) return 'C+';
    if (score >= 40) return 'C';
    return 'F';
  }

  getColumnMapping() {
    return {
      // Student Information
      studentIdNumber: { label: 'Student ID Number', key: 'student_id_number' },
      studentName: { label: 'Student Name', key: 'student_name' },
      emailId: { label: 'Email ID', key: 'student_email' },
      phoneNumber: { label: 'Phone Number', key: 'phone' },
      avatarUrl: { label: 'Avatar URL', key: 'avatar_url' },
      isActive: { label: 'Is Active', key: 'is_active' },
      emailVerified: { label: 'Email Verified', key: 'email_verified' },
      
      // Academic Information
      department: { label: 'Department', key: 'department_name' },
      batch: { label: 'Batch', key: 'batch' },
      admissionType: { label: 'Admission Type', key: 'admission_type' },
      joiningYear: { label: 'Joining Year', key: 'joining_year' },
      finalYear: { label: 'Final Year', key: 'final_year' },
      currentYear: { label: 'Current Year', key: 'current_year' },
      yearStartDate: { label: 'Year Start Date', key: 'year_start_date' },
      
      // College Information
      collegeName: { label: 'College Name', key: 'college_name' },
      collegeCode: { label: 'College Code', key: 'college_code' },
      collegeAddress: { label: 'College Address', key: 'college_address' },
      collegeCity: { label: 'College City', key: 'college_city' },
      collegeState: { label: 'College State', key: 'college_state' },
      collegeCountry: { label: 'College Country', key: 'college_country' },
      collegePhone: { label: 'College Phone', key: 'college_phone' },
      collegeEmail: { label: 'College Email', key: 'college_email' },
      collegeWebsite: { label: 'College Website', key: 'college_website' },
      
      // Assessment Details
      assessmentId: { label: 'Assessment ID', key: 'assessment_id' },
      assessmentTitle: { label: 'Assessment Title', key: 'assessment_title' },
      assessmentType: { label: 'Assessment Type', key: 'assessment_type' },
      assessmentCategory: { label: 'Assessment Category', key: 'assessment_category' },
      difficultyLevel: { label: 'Difficulty Level', key: 'difficulty_level' },
      totalPoints: { label: 'Total Points', key: 'total_points' },
      durationMinutes: { label: 'Duration (Minutes)', key: 'duration_minutes' },
      startTime: { label: 'Start Time', key: 'start_time' },
      endTime: { label: 'End Time', key: 'end_time' },
      passingScore: { label: 'Passing Score', key: 'passing_score' },
      maxAttempts: { label: 'Max Attempts', key: 'max_attempts' },
      isTimed: { label: 'Is Timed', key: 'is_timed' },
      allowRetake: { label: 'Allow Retake', key: 'allow_retake' },
      
      // Submission Details
      submissionId: { label: 'Submission ID', key: 'submission_id' },
      submittedAt: { label: 'Submitted At', key: 'submitted_at' },
      startedAt: { label: 'Started At', key: 'started_at' },
      gradedAt: { label: 'Graded At', key: 'graded_at' },
      gradedBy: { label: 'Graded By', key: 'graded_by' },
      timeTakenMinutes: { label: 'Time Taken (Minutes)', key: 'time_taken_minutes' },
      attemptNumber: { label: 'Attempt Number', key: 'attempt_number' },
      submissionStatus: { label: 'Submission Status', key: 'status' },
      ipAddress: { label: 'IP Address', key: 'ip_address' },
      userAgent: { label: 'User Agent', key: 'user_agent' },
      
      // Performance Metrics
      score: { label: 'Score (Points)', key: 'score' },
      maxScore: { label: 'Max Score (Points)', key: 'max_score' },
      percentageScore: { label: 'Percentage Score', key: 'percentage_score' },
      correctAnswers: { label: 'Correct Answers', key: 'correct_answers' },
      totalQuestions: { label: 'Total Questions', key: 'total_questions' },
      feedback: { label: 'Feedback', key: 'feedback' },
      performanceLevel: { label: 'Performance Level', key: 'performance_level' },
      
      // Question Type Breakdown (These would need to be calculated from question data)
      multipleChoiceMarks: { label: 'Multiple Choice Marks', key: 'multiple_choice_marks' },
      trueFalseMarks: { label: 'True/False Marks', key: 'true_false_marks' },
      shortAnswerMarks: { label: 'Short Answer Marks', key: 'short_answer_marks' },
      essayMarks: { label: 'Essay Marks', key: 'essay_marks' },
      codingMarks: { label: 'Coding Marks', key: 'coding_marks' },
      fillBlanksMarks: { label: 'Fill Blanks Marks', key: 'fill_blanks_marks' },
      matchingMarks: { label: 'Matching Marks', key: 'matching_marks' },
      orderingMarks: { label: 'Ordering Marks', key: 'ordering_marks' },
      fileUploadMarks: { label: 'File Upload Marks', key: 'file_upload_marks' },
      
      // Attendance Information
      attendanceStatus: { label: 'Attendance Status', key: 'attendance_status' },
      lateSubmission: { label: 'Late Submission', key: 'late_submission' },
      disqualified: { label: 'Disqualified', key: 'disqualified' },
      
      // Additional Analytics
      createdAt: { label: 'Created At', key: 'created_at' },
      updatedAt: { label: 'Updated At', key: 'updated_at' },
      isPublished: { label: 'Is Published', key: 'is_published' },
      isActive: { label: 'Is Active', key: 'is_active' }
    };
  }

  getColumnValue(submission, columnKey, mapping, isAbsent = false) {
    // Handle absent students for performance-related columns
    if (isAbsent && ['score', 'maxScore', 'percentageScore', 'correctAnswers', 'multipleChoiceMarks', 'codingMarks', 'essayMarks', 'shortAnswerMarks', 'trueFalseMarks', 'fillBlanksMarks', 'matchingMarks', 'orderingMarks', 'fileUploadMarks'].includes(columnKey)) {
      return 'Absent';
    }
    
    const value = submission[mapping.key];
    
    // Format specific columns
    switch (columnKey) {
      case 'percentageScore':
        return value ? `${value}%` : '0%';
      case 'timeTakenMinutes':
        return value ? `${value} min` : 'N/A';
      case 'performanceLevel':
        const score = submission.percentage_score || 0;
        if (score >= 90) return 'Excellent';
        if (score >= 80) return 'Good';
        if (score >= 70) return 'Average';
        if (score >= 60) return 'Below Average';
        return 'Needs Improvement';
      case 'attendanceStatus':
        return submission.status === 'submitted' || submission.status === 'graded' ? 'Present' : 'Absent';
      case 'submissionStatus':
        return submission.status || 'Not attempted';
      case 'isActive':
      case 'emailVerified':
      case 'isTimed':
      case 'allowRetake':
      case 'isPublished':
        return value ? 'Yes' : 'No';
      case 'admissionType':
        return value === 'lateral' ? 'Lateral' : 'Regular';
      case 'submittedAt':
      case 'startedAt':
      case 'gradedAt':
      case 'createdAt':
      case 'updatedAt':
      case 'yearStartDate':
        return value ? new Date(value).toLocaleString() : 'N/A';
      case 'startTime':
      case 'endTime':
        return value ? new Date(value).toLocaleString() : 'N/A';
      case 'feedback':
        return value || 'No feedback provided';
      case 'ipAddress':
        return value || 'N/A';
      case 'userAgent':
        return value ? value.substring(0, 50) + '...' : 'N/A';
      default:
        return value || 'N/A';
    }
  }

  // Generate filename
  generateFilename(assessmentData, settings) {
    const assessmentName = assessmentData?.title?.replace(/[^a-zA-Z0-9]/g, '_') || 'Assessment';
    const collegeName = assessmentData?.college_name?.replace(/[^a-zA-Z0-9]/g, '_') || 'College';
    const timestamp = new Date().toISOString().slice(0, 19).replace(/[:-]/g, '');
    
    if (settings.customFilename) {
      return `${settings.customFilename}_${timestamp}`;
    }
    
    return `${assessmentName}_${collegeName}_${timestamp}`;
  }

  // Download the workbook
  async downloadWorkbook(filename, format = 'xlsx') {
    if (format === 'xlsx') {
      const buffer = await this.workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      this.downloadBlob(blob, `${filename}.xlsx`);
    } else if (format === 'csv') {
      // Convert to CSV (simplified version)
      const csvData = this.workbookToCSV();
      const blob = new Blob([csvData], { type: 'text/csv' });
      this.downloadBlob(blob, `${filename}.csv`);
    }
  }

  workbookToCSV() {
    // Simplified CSV conversion
    let csv = '';
    this.workbook.worksheets.forEach(worksheet => {
      csv += `\n=== ${worksheet.name} ===\n`;
      worksheet.eachRow((row, rowNumber) => {
        const rowData = row.values.slice(1); // Remove first empty element
        csv += rowData.join(',') + '\n';
      });
    });
    return csv;
  }

  downloadBlob(blob, filename) {
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  }
}

export default new ExcelExportService();
