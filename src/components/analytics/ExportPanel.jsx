import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';

// Icons
import {
  Download, FileText, Table, File, Share2, Mail, 
  Calendar, Filter, Users, BookOpen, Layers, Target, Clock,
  CheckCircle, AlertCircle, Info, ExternalLink, Copy
} from 'lucide-react';

const ExportPanel = ({ module, filters, onExport, loading }) => {
  const [exportFormat, setExportFormat] = useState('excel');
  const [includeCharts, setIncludeCharts] = useState(true);
  const [includeTables, setIncludeTables] = useState(true);
  const [includeSummary, setIncludeSummary] = useState(true);
  const [exportProgress, setExportProgress] = useState(0);
  const [recentExports, setRecentExports] = useState([]);

  const exportOptions = [
    {
      id: 'excel',
      name: 'Excel (.xlsx)',
      description: 'Spreadsheet with pivot tables and charts',
      icon: <Table className="h-6 w-6" />,
      color: 'text-green-600',
      bgColor: 'bg-green-50 dark:bg-green-900/20'
    },
    {
      id: 'pdf',
      name: 'PDF Report',
      description: 'Printable report with visualizations',
      icon: <File className="h-6 w-6" />,
      color: 'text-red-600',
      bgColor: 'bg-red-50 dark:bg-red-900/20'
    },
    {
      id: 'csv',
      name: 'CSV Data',
      description: 'Raw data for external analysis',
      icon: <FileText className="h-6 w-6" />,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50 dark:bg-blue-900/20'
    }
  ];

  const handleExport = async () => {
    setExportProgress(0);
    
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

    try {
      await onExport(exportFormat);
      setExportProgress(100);
      
      // Add to recent exports
      const newExport = {
        id: Date.now(),
        name: `${module} Analytics Report`,
        format: exportFormat,
        timestamp: new Date(),
        size: '2.4 MB'
      };
      setRecentExports(prev => [newExport, ...prev.slice(0, 4)]);
      
      setTimeout(() => setExportProgress(0), 1000); // Reduced from 2000ms
    } catch (error) {
      setExportProgress(0);
    }
  };

  const getFilterSummary = () => {
    const activeFilters = [];
    
    if (filters.collegeId !== 'all') activeFilters.push('College');
    if (filters.departmentId !== 'all') activeFilters.push('Department');
    if (filters.batchId !== 'all') activeFilters.push('Batch');
    if (filters.facultyId !== 'all') activeFilters.push('Faculty');
    if (filters.studentId !== 'all') activeFilters.push('Student');
    if (filters.assessmentType !== 'all') activeFilters.push('Assessment Type');
    if (filters.courseCategory !== 'all') activeFilters.push('Course Category');
    if (filters.dateRange !== '30') activeFilters.push('Date Range');
    
    return activeFilters.length > 0 ? activeFilters.join(', ') : 'All data';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            Export & Share Reports
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Export your analytics data in various formats
          </p>
        </div>
        <Badge variant="secondary">
          {module === 'assessments' ? 'Assessment' : 'Course'} Analytics
        </Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Export Options */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Download className="h-5 w-5" />
                <span>Export Format</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {exportOptions.map((option) => (
                  <div
                    key={option.id}
                    className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                      exportFormat === option.id
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => setExportFormat(option.id)}
                  >
                    <div className="flex items-center space-x-3">
                      <div className={`p-2 rounded-lg ${option.bgColor}`}>
                        <div className={option.color}>{option.icon}</div>
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900 dark:text-gray-100">
                          {option.name}
                        </h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {option.description}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Export Options</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="include-summary"
                    checked={includeSummary}
                    onCheckedChange={setIncludeSummary}
                  />
                  <Label htmlFor="include-summary">Include Summary Statistics</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="include-charts"
                    checked={includeCharts}
                    onCheckedChange={setIncludeCharts}
                  />
                  <Label htmlFor="include-charts">Include Charts & Visualizations</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="include-tables"
                    checked={includeTables}
                    onCheckedChange={setIncludeTables}
                  />
                  <Label htmlFor="include-tables">Include Detailed Tables</Label>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Export Progress */}
          {loading && (
            <Card>
              <CardContent className="pt-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Exporting...</span>
                    <span className="text-sm text-gray-600">{exportProgress}%</span>
                  </div>
                  <Progress value={exportProgress} className="w-full" />
                  <p className="text-sm text-gray-600">
                    Preparing {exportFormat.toUpperCase()} file with current filters
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Export Button */}
          <Button
            onClick={handleExport}
            disabled={loading}
            className="w-full h-12 text-lg"
          >
            <Download className="h-5 w-5 mr-2" />
            {loading ? 'Exporting...' : `Export as ${exportFormat.toUpperCase()}`}
          </Button>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Current Filters */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Filter className="h-5 w-5" />
                <span>Current Filters</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-center space-x-2 text-sm">
                  <BookOpen className="h-4 w-4 text-gray-400" />
                  <span className="text-gray-600">Module:</span>
                  <Badge variant="outline">
                    {module === 'assessments' ? 'Assessments' : 'Courses'}
                  </Badge>
                </div>
                <div className="flex items-center space-x-2 text-sm">
                  <Calendar className="h-4 w-4 text-gray-400" />
                  <span className="text-gray-600">Date Range:</span>
                  <span className="font-medium">{filters.dateRange} days</span>
                </div>
                <div className="flex items-center space-x-2 text-sm">
                  <Users className="h-4 w-4 text-gray-400" />
                  <span className="text-gray-600">Filters:</span>
                  <span className="font-medium">{getFilterSummary()}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Recent Exports */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Clock className="h-5 w-5" />
                <span>Recent Exports</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {recentExports.length === 0 ? (
                <div className="text-center py-4">
                  <FileText className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-500">No recent exports</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {recentExports.map((exportItem) => (
                    <div key={exportItem.id} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <div className="flex items-center space-x-2">
                        <FileText className="h-4 w-4 text-gray-400" />
                        <div>
                          <p className="text-sm font-medium">{exportItem.name}</p>
                          <p className="text-xs text-gray-500">
                            {exportItem.timestamp.toLocaleDateString()} • {exportItem.size}
                          </p>
                        </div>
                      </div>
                      <Button variant="ghost" size="sm">
                        <Download className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Share Options */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Share2 className="h-5 w-5" />
                <span>Share Options</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button variant="outline" className="w-full justify-start">
                <Mail className="h-4 w-4 mr-2" />
                Share via Email
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <Copy className="h-4 w-4 mr-2" />
                Copy Link
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <ExternalLink className="h-4 w-4 mr-2" />
                Generate Public Link
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ExportPanel; 