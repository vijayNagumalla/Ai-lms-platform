import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { Button } from '../ui/button';
import { Checkbox } from '../ui/checkbox';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Input } from '../ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Badge } from '../ui/badge';
import { Progress } from '../ui/progress';
import { Separator } from '../ui/separator';
import { 
  Download, 
  FileSpreadsheet, 
  FileText, 
  File, 
  Settings, 
  Eye, 
  History,
  Save,
  Loader2,
  CheckCircle,
  AlertCircle,
  X
} from 'lucide-react';
import exportHistoryService from '@/services/exportHistoryService';

const EnhancedExportModal = ({ 
  isOpen, 
  onClose, 
  assessmentData, 
  submissions, 
  onExport 
}) => {
  const [exportType, setExportType] = useState('regular');
  const [selectedColumns, setSelectedColumns] = useState({});
  const [selectedFilters, setSelectedFilters] = useState({});
  const [exportSettings, setExportSettings] = useState({
    fileFormat: 'xlsx',
    includeCharts: true,
    includeSummary: true,
    colorCode: true,
    customFilename: '',
    includeTimestamp: true
  });
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [previewData, setPreviewData] = useState([]);
  const [exportHistory, setExportHistory] = useState([]);
  const [exportTemplates, setExportTemplates] = useState([]);

  // Available columns for selection (Based on actual database schema)
  const availableColumns = {
    studentInfo: [
      { key: 'studentIdNumber', label: 'Student ID Number', default: true },
      { key: 'studentName', label: 'Student Name', default: true },
      { key: 'emailId', label: 'Email ID', default: true },
      { key: 'phoneNumber', label: 'Phone Number', default: false },
      { key: 'avatarUrl', label: 'Avatar URL', default: false },
      { key: 'isActive', label: 'Is Active', default: false },
      { key: 'emailVerified', label: 'Email Verified', default: false }
    ],
    academicInfo: [
      { key: 'department', label: 'Department', default: true },
      { key: 'batch', label: 'Batch', default: true },
      { key: 'admissionType', label: 'Admission Type (Regular/Lateral)', default: false },
      { key: 'joiningYear', label: 'Joining Year', default: false },
      { key: 'finalYear', label: 'Final Year', default: false },
      { key: 'currentYear', label: 'Current Year', default: false },
      { key: 'yearStartDate', label: 'Year Start Date', default: false }
    ],
    collegeInfo: [
      { key: 'collegeName', label: 'College Name', default: true },
      { key: 'collegeCode', label: 'College Code', default: false },
      { key: 'collegeAddress', label: 'College Address', default: false },
      { key: 'collegeCity', label: 'College City', default: false },
      { key: 'collegeState', label: 'College State', default: false },
      { key: 'collegeCountry', label: 'College Country', default: false },
      { key: 'collegePhone', label: 'College Phone', default: false },
      { key: 'collegeEmail', label: 'College Email', default: false },
      { key: 'collegeWebsite', label: 'College Website', default: false }
    ],
    assessmentDetails: [
      { key: 'assessmentId', label: 'Assessment ID', default: false },
      { key: 'assessmentTitle', label: 'Assessment Title', default: true },
      { key: 'assessmentType', label: 'Assessment Type', default: true },
      { key: 'assessmentCategory', label: 'Assessment Category', default: false },
      { key: 'difficultyLevel', label: 'Difficulty Level', default: false },
      { key: 'totalPoints', label: 'Total Points', default: true },
      { key: 'durationMinutes', label: 'Duration (Minutes)', default: false },
      { key: 'startTime', label: 'Start Time', default: false },
      { key: 'endTime', label: 'End Time', default: false },
      { key: 'passingScore', label: 'Passing Score', default: false },
      { key: 'maxAttempts', label: 'Max Attempts', default: false },
      { key: 'isTimed', label: 'Is Timed', default: false },
      { key: 'allowRetake', label: 'Allow Retake', default: false }
    ],
    submissionDetails: [
      { key: 'submissionId', label: 'Submission ID', default: false },
      { key: 'submittedAt', label: 'Submitted At', default: true },
      { key: 'startedAt', label: 'Started At', default: false },
      { key: 'gradedAt', label: 'Graded At', default: false },
      { key: 'gradedBy', label: 'Graded By', default: false },
      { key: 'timeTakenMinutes', label: 'Time Taken (Minutes)', default: true },
      { key: 'attemptNumber', label: 'Attempt Number', default: true },
      { key: 'submissionStatus', label: 'Submission Status', default: true },
      { key: 'ipAddress', label: 'IP Address', default: false },
      { key: 'userAgent', label: 'User Agent', default: false }
    ],
    performanceMetrics: [
      { key: 'score', label: 'Score (Points)', default: true },
      { key: 'maxScore', label: 'Max Score (Points)', default: true },
      { key: 'percentageScore', label: 'Percentage Score', default: true },
      { key: 'correctAnswers', label: 'Correct Answers', default: false },
      { key: 'totalQuestions', label: 'Total Questions', default: false },
      { key: 'feedback', label: 'Feedback', default: false },
      { key: 'performanceLevel', label: 'Performance Level', default: true }
    ],
    questionTypeBreakdown: [
      { key: 'multipleChoiceMarks', label: 'Multiple Choice Marks', default: false },
      { key: 'trueFalseMarks', label: 'True/False Marks', default: false },
      { key: 'shortAnswerMarks', label: 'Short Answer Marks', default: false },
      { key: 'essayMarks', label: 'Essay Marks', default: false },
      { key: 'codingMarks', label: 'Coding Marks', default: false },
      { key: 'fillBlanksMarks', label: 'Fill Blanks Marks', default: false },
      { key: 'matchingMarks', label: 'Matching Marks', default: false },
      { key: 'orderingMarks', label: 'Ordering Marks', default: false },
      { key: 'fileUploadMarks', label: 'File Upload Marks', default: false }
    ],
    attendanceInfo: [
      { key: 'attendanceStatus', label: 'Attendance Status (Present/Absent)', default: true },
      { key: 'lateSubmission', label: 'Late Submission', default: false },
      { key: 'disqualified', label: 'Disqualified', default: false }
    ],
    additionalAnalytics: [
      { key: 'createdAt', label: 'Created At', default: false },
      { key: 'updatedAt', label: 'Updated At', default: false },
      { key: 'isPublished', label: 'Is Published', default: false },
      { key: 'isActive', label: 'Is Active', default: false }
    ]
  };

  // Filter options (Based on actual database fields)
  const filterOptions = {
    studentFilters: [
      { key: 'allStudents', label: 'All Students', default: true },
      { key: 'presentStudents', label: 'Present Students Only (Submitted/Graded)', default: false },
      { key: 'absentStudents', label: 'Absent Students Only (Not Submitted)', default: false },
      { key: 'byDepartment', label: 'By Department', default: false },
      { key: 'byBatch', label: 'By Batch', default: false },
      { key: 'byAdmissionType', label: 'By Admission Type (Regular/Lateral)', default: false },
      { key: 'byJoiningYear', label: 'By Joining Year', default: false },
      { key: 'byCurrentYear', label: 'By Current Year', default: false },
      { key: 'activeStudentsOnly', label: 'Active Students Only', default: false },
      { key: 'emailVerifiedOnly', label: 'Email Verified Students Only', default: false }
    ],
    performanceFilters: [
      { key: 'byPerformanceRange', label: 'By Performance Range', default: false },
      { key: 'byPerformanceLevel', label: 'By Performance Level', default: false },
      { key: 'byAttemptNumber', label: 'By Attempt Number', default: false },
      { key: 'bySubmissionStatus', label: 'By Submission Status', default: false },
      { key: 'lateSubmissionsOnly', label: 'Late Submissions Only', default: false },
      { key: 'firstAttemptOnly', label: 'First Attempt Only', default: false },
      { key: 'disqualifiedOnly', label: 'Disqualified Students Only', default: false },
      { key: 'gradedSubmissionsOnly', label: 'Graded Submissions Only', default: false }
    ],
    assessmentFilters: [
      { key: 'byAssessmentType', label: 'By Assessment Type', default: false },
      { key: 'byAssessmentCategory', label: 'By Assessment Category', default: false },
      { key: 'byDifficultyLevel', label: 'By Difficulty Level', default: false },
      { key: 'byDateRange', label: 'By Date Range', default: false },
      { key: 'byTimeRange', label: 'By Time Range', default: false },
      { key: 'byDurationRange', label: 'By Duration Range', default: false },
      { key: 'timedAssessmentsOnly', label: 'Timed Assessments Only', default: false },
      { key: 'retakeAllowedOnly', label: 'Retake Allowed Only', default: false },
      { key: 'publishedAssessmentsOnly', label: 'Published Assessments Only', default: false }
    ],
    collegeFilters: [
      { key: 'byCollege', label: 'By College', default: false },
      { key: 'byCollegeCity', label: 'By College City', default: false },
      { key: 'byCollegeState', label: 'By College State', default: false },
      { key: 'byCollegeCountry', label: 'By College Country', default: false }
    ]
  };

  // Initialize default selections and load history
  useEffect(() => {
    const defaultColumns = {};
    Object.values(availableColumns).forEach(category => {
      category.forEach(column => {
        defaultColumns[column.key] = column.default;
      });
    });
    setSelectedColumns(defaultColumns);

    const defaultFilters = {};
    Object.values(filterOptions).forEach(category => {
      category.forEach(filter => {
        defaultFilters[filter.key] = filter.default;
      });
    });
    setSelectedFilters(defaultFilters);

    // Load export history and templates
    setExportHistory(exportHistoryService.getExportHistory());
    setExportTemplates(exportHistoryService.getExportTemplates());
  }, []);

  // Generate preview data
  useEffect(() => {
    if (submissions && submissions.length > 0) {
      const preview = submissions.slice(0, 5).map(submission => ({
        rollNumber: submission.student_id_number || 'N/A',
        studentName: submission.student_name || 'N/A',
        emailId: submission.student_email || 'N/A',
        department: submission.department_name || 'N/A',
        batch: submission.batch || 'N/A',
        percentage: submission.score || 0,
        attendanceStatus: submission.status === 'submitted' ? 'Present' : 'Absent'
      }));
      setPreviewData(preview);
    }
  }, [submissions, selectedColumns, selectedFilters]);

  const handleColumnToggle = (columnKey, checked) => {
    setSelectedColumns(prev => ({
      ...prev,
      [columnKey]: checked
    }));
  };

  const handleFilterToggle = (filterKey, checked) => {
    setSelectedFilters(prev => ({
      ...prev,
      [filterKey]: checked
    }));
  };

  const handleExport = async (type = 'regular') => {
    setIsExporting(true);
    setExportProgress(0);

    try {
      const exportConfig = {
        type,
        columns: selectedColumns,
        filters: selectedFilters,
        settings: exportSettings,
        assessmentData,
        submissions
      };

      // Simulate progress
      const progressInterval = setInterval(() => {
        setExportProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 200);

      await onExport(exportConfig);
      
      // Save to export history
      const historyData = {
        filename: generateFilename(),
        type: type,
        assessmentName: assessmentData?.title || 'Unknown Assessment',
        collegeName: assessmentData?.college_name || 'Unknown College',
        recordCount: submissions?.length || 0,
        fileSize: 0, // Will be updated by the export service
        settings: exportSettings
      };
      
      exportHistoryService.addExportToHistory(historyData);
      setExportHistory(exportHistoryService.getExportHistory());
      
      setExportProgress(100);
      setTimeout(() => {
        setIsExporting(false);
        setExportProgress(0);
        onClose();
      }, 1000);

    } catch (error) {
      console.error('Export failed:', error);
      setIsExporting(false);
      setExportProgress(0);
    }
  };

  const generateFilename = () => {
    const assessmentName = assessmentData?.title?.replace(/[^a-zA-Z0-9]/g, '_') || 'Assessment';
    const collegeName = assessmentData?.college_name?.replace(/[^a-zA-Z0-9]/g, '_') || 'College';
    const timestamp = new Date().toISOString().slice(0, 19).replace(/[:-]/g, '');
    
    if (exportSettings.customFilename) {
      return `${exportSettings.customFilename}_${timestamp}`;
    }
    
    return `${assessmentName}_${collegeName}_${timestamp}`;
  };

  const getSelectedColumnsCount = () => {
    return Object.values(selectedColumns).filter(Boolean).length;
  };

  const getSelectedFiltersCount = () => {
    return Object.values(selectedFilters).filter(Boolean).length;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Download className="h-5 w-5 text-blue-600" />
              <span>Enhanced Export Options</span>
            </div>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto">
          <Tabs defaultValue="quick" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="quick">Quick Export</TabsTrigger>
              <TabsTrigger value="advanced">Advanced Export</TabsTrigger>
              <TabsTrigger value="history">Export History</TabsTrigger>
            </TabsList>

            <TabsContent value="quick" className="space-y-6">
              <div className="bg-blue-50 p-4 rounded-lg">
                <h3 className="font-semibold text-blue-900 mb-2">Quick Export</h3>
                <p className="text-blue-700 text-sm mb-4">
                  Export with dynamic columns based on assessment question types. Includes:
                </p>
                <ul className="text-blue-700 text-sm mb-4 list-disc list-inside space-y-1">
                  <li>Roll Number, Name, Email ID, Department, Batch</li>
                  <li>Dynamic assessment marks columns (MCQ, Coding, Descriptive, etc.)</li>
                  <li>Total Marks, Percentage</li>
                  <li>All students (present and absent) sorted by percentage</li>
                  <li>Performance distribution charts</li>
                </ul>
                <div className="flex items-center justify-between">
                  <div className="text-sm text-blue-600">
                    <strong>{submissions?.length || 0}</strong> students • 
                    <strong> {assessmentData?.title || 'Assessment'}</strong>
                  </div>
                  <Button 
                    onClick={() => handleExport('regular')}
                    disabled={isExporting}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    {isExporting ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Exporting...
                      </>
                    ) : (
                      <>
                        <Download className="h-4 w-4 mr-2" />
                        Quick Export
                      </>
                    )}
                  </Button>
                </div>
              </div>

              {isExporting && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span>Export Progress</span>
                    <span>{exportProgress}%</span>
                  </div>
                  <Progress value={exportProgress} className="w-full" />
                </div>
              )}
            </TabsContent>

            <TabsContent value="advanced" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Column Selection */}
                <div className="space-y-4">
                  <h3 className="font-semibold flex items-center">
                    <Settings className="h-4 w-4 mr-2" />
                    Select Data Columns ({getSelectedColumnsCount()})
                  </h3>
                  
                  {Object.entries(availableColumns).map(([category, columns]) => (
                    <div key={category} className="space-y-2">
                      <h4 className="font-medium text-sm text-gray-700 capitalize">
                        {category.replace(/([A-Z])/g, ' $1').trim()}
                      </h4>
                      <div className="space-y-1 pl-4">
                        {columns.map(column => (
                          <div key={column.key} className="flex items-center space-x-2">
                            <Checkbox
                              id={column.key}
                              checked={selectedColumns[column.key] || false}
                              onCheckedChange={(checked) => handleColumnToggle(column.key, checked)}
                            />
                            <Label htmlFor={column.key} className="text-sm">
                              {column.label}
                            </Label>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Filter Selection */}
                <div className="space-y-4">
                  <h3 className="font-semibold flex items-center">
                    <Eye className="h-4 w-4 mr-2" />
                    Apply Filters ({getSelectedFiltersCount()})
                  </h3>
                  
                  {Object.entries(filterOptions).map(([category, filters]) => (
                    <div key={category} className="space-y-2">
                      <h4 className="font-medium text-sm text-gray-700 capitalize">
                        {category.replace(/([A-Z])/g, ' $1').trim()}
                      </h4>
                      <div className="space-y-1 pl-4">
                        {filters.map(filter => (
                          <div key={filter.key} className="flex items-center space-x-2">
                            <Checkbox
                              id={filter.key}
                              checked={selectedFilters[filter.key] || false}
                              onCheckedChange={(checked) => handleFilterToggle(filter.key, checked)}
                            />
                            <Label htmlFor={filter.key} className="text-sm">
                              {filter.label}
                            </Label>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <Separator />

              {/* Export Settings */}
              <div className="space-y-4">
                <h3 className="font-semibold">Export Settings</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>File Format</Label>
                    <Select 
                      value={exportSettings.fileFormat} 
                      onValueChange={(value) => setExportSettings(prev => ({ ...prev, fileFormat: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="xlsx">Excel (.xlsx)</SelectItem>
                        <SelectItem value="csv">CSV (.csv)</SelectItem>
                        <SelectItem value="pdf">PDF (.pdf)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Custom Filename</Label>
                    <Input
                      placeholder="Enter custom filename"
                      value={exportSettings.customFilename}
                      onChange={(e) => setExportSettings(prev => ({ ...prev, customFilename: e.target.value }))}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="includeCharts"
                      checked={exportSettings.includeCharts}
                      onCheckedChange={(checked) => setExportSettings(prev => ({ ...prev, includeCharts: checked }))}
                    />
                    <Label htmlFor="includeCharts">Include Charts and Graphs</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="includeSummary"
                      checked={exportSettings.includeSummary}
                      onCheckedChange={(checked) => setExportSettings(prev => ({ ...prev, includeSummary: checked }))}
                    />
                    <Label htmlFor="includeSummary">Include Summary Statistics</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="colorCode"
                      checked={exportSettings.colorCode}
                      onCheckedChange={(checked) => setExportSettings(prev => ({ ...prev, colorCode: checked }))}
                    />
                    <Label htmlFor="colorCode">Color Code Performance Levels</Label>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Preview */}
              <div className="space-y-4">
                <h3 className="font-semibold">Preview</h3>
                <div className="text-sm text-gray-600 mb-2">
                  Filename: <code className="bg-gray-100 px-2 py-1 rounded">{generateFilename()}.{exportSettings.fileFormat}</code>
                </div>
                <div className="border rounded-lg overflow-hidden">
                  <div className="bg-gray-50 p-2 text-xs font-medium">
                    Preview (First 5 records)
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead className="bg-gray-100">
                        <tr>
                          {Object.entries(selectedColumns).filter(([_, selected]) => selected).slice(0, 6).map(([key, _]) => (
                            <th key={key} className="p-2 text-left">
                              {availableColumns.studentInfo.find(col => col.key === key)?.label || 
                               availableColumns.academicInfo.find(col => col.key === key)?.label ||
                               availableColumns.performanceMetrics.find(col => col.key === key)?.label ||
                               key}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {previewData.map((row, index) => (
                          <tr key={index} className="border-t">
                            {Object.entries(selectedColumns).filter(([_, selected]) => selected).slice(0, 6).map(([key, _]) => (
                              <td key={key} className="p-2">
                                {row[key] || 'N/A'}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={onClose}>
                  Cancel
                </Button>
                <Button 
                  onClick={() => handleExport('advanced')}
                  disabled={isExporting}
                  className="bg-green-600 hover:bg-green-700"
                >
                  {isExporting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Exporting...
                    </>
                  ) : (
                    <>
                      <Download className="h-4 w-4 mr-2" />
                      Export Selected Data
                    </>
                  )}
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="history" className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold">Export History & Templates</h3>
                <div className="flex space-x-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => {
                      const templateData = {
                        name: `Template_${new Date().toISOString().slice(0, 10)}`,
                        description: 'Custom export template',
                        columns: selectedColumns,
                        filters: selectedFilters,
                        settings: exportSettings
                      };
                      exportHistoryService.saveExportTemplate(templateData);
                      setExportTemplates(exportHistoryService.getExportTemplates());
                    }}
                  >
                    <Save className="h-4 w-4 mr-2" />
                    Save Template
                  </Button>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Export History */}
                <div className="space-y-2">
                  <h4 className="font-medium text-sm text-gray-700">Recent Exports</h4>
                  {exportHistory.length === 0 ? (
                    <div className="text-center py-4 text-gray-500 text-sm">
                      <History className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p>No export history available</p>
                    </div>
                  ) : (
                    exportHistory.slice(0, 5).map((exportItem, index) => (
                      <div key={index} className="border rounded-lg p-3">
                        <div className="flex items-center justify-between">
                          <div className="flex-1 min-w-0">
                            <h5 className="font-medium text-sm truncate">{exportItem.filename}</h5>
                            <p className="text-xs text-gray-600">{exportHistoryService.formatTimestamp(exportItem.timestamp)}</p>
                            <p className="text-xs text-gray-500">{exportItem.recordCount} records</p>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Badge variant="outline" className="text-xs">{exportItem.type}</Badge>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* Export Templates */}
                <div className="space-y-2">
                  <h4 className="font-medium text-sm text-gray-700">Saved Templates</h4>
                  {exportTemplates.length === 0 ? (
                    <div className="text-center py-4 text-gray-500 text-sm">
                      <Save className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p>No templates saved</p>
                    </div>
                  ) : (
                    exportTemplates.map((template, index) => (
                      <div key={index} className="border rounded-lg p-3">
                        <div className="flex items-center justify-between">
                          <div className="flex-1 min-w-0">
                            <h5 className="font-medium text-sm truncate">{template.name}</h5>
                            <p className="text-xs text-gray-600">{exportHistoryService.formatTimestamp(template.timestamp)}</p>
                            <p className="text-xs text-gray-500">{template.description}</p>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => {
                                setSelectedColumns(template.columns);
                                setSelectedFilters(template.filters);
                                setExportSettings(template.settings);
                              }}
                            >
                              Load
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default EnhancedExportModal;
