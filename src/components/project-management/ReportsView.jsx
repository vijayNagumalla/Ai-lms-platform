import React, { useState, useEffect } from 'react';
import api from '@/services/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { BarChart3, Download, TrendingUp } from 'lucide-react';
import { toast } from 'react-hot-toast';

const ReportsView = ({ selectedProject }) => {
  const [reportType, setReportType] = useState('project-progress');
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    start_date: '',
    end_date: ''
  });

  useEffect(() => {
    loadReport();
  }, [reportType, filters]);

  const loadReport = async () => {
    try {
      setLoading(true);
      let response;
      switch (reportType) {
        case 'project-progress':
          response = await api.getProjectProgressReport(filters);
          break;
        case 'trainer-utilization':
          response = await api.getTrainerUtilizationReport(filters);
          break;
        case 'college-attendance':
          response = await api.getCollegeAttendanceReport({ ...filters, format: 'json' });
          break;
        case 'invoice-summary':
          response = await api.getInvoiceSummaryReport(filters);
          break;
        default:
          return;
      }
      if (response.success) {
        setReports(response.data || []);
      }
    } catch (error) {
      toast.error('Failed to load report');
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    try {
      let response;
      switch (reportType) {
        case 'college-attendance':
          response = await api.getCollegeAttendanceReport({ ...filters, format: 'excel' });
          break;
        default:
          toast.error('Export not available for this report type');
          return;
      }
      const url = window.URL.createObjectURL(new Blob([response]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${reportType}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success('Report exported successfully');
    } catch (error) {
      toast.error('Failed to export report');
    }
  };

  const renderProjectProgress = () => (
    <div className="space-y-2">
      {reports.map(project => (
        <div key={project.id} className="border rounded-lg p-4">
          <div className="flex justify-between items-start">
            <div>
              <div className="font-medium">{project.project_name}</div>
              <div className="text-sm text-gray-600 mt-1">
                Progress: {project.progress_percentage}% • {project.completed_sessions}/{project.total_sessions} sessions
              </div>
              <div className="text-sm text-gray-500">
                Hours: {project.hours_delivered?.toFixed(1)}/{project.total_hours_required}
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm font-medium">{project.status}</div>
              <div className="text-xs text-gray-500">{project.allocated_trainers_count} trainers</div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );

  const renderTrainerUtilization = () => (
    <div className="space-y-2">
      {reports.map(trainer => (
        <div key={trainer.faculty_id} className="border rounded-lg p-4">
          <div className="flex justify-between items-start">
            <div>
              <div className="font-medium">{trainer.faculty_name}</div>
              <div className="text-sm text-gray-600 mt-1">
                Utilization: {trainer.utilization_percentage}% • {trainer.hours_worked?.toFixed(1)}h worked
              </div>
              <div className="text-sm text-gray-500">
                {trainer.active_projects} active projects • {trainer.completed_sessions} completed sessions
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm font-medium">Rating: {trainer.rating || 'N/A'}</div>
              <div className="text-xs text-gray-500">{trainer.remaining_hours}h remaining</div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );

  const renderCollegeAttendance = () => (
    <div className="space-y-2">
      {reports.map(college => (
        <div key={college.college_id} className="border rounded-lg p-4">
          <div className="flex justify-between items-start">
            <div>
              <div className="font-medium">{college.college_name}</div>
              <div className="text-sm text-gray-600 mt-1">
                Attendance: {college.attendance_percentage}%
              </div>
              <div className="text-sm text-gray-500">
                {college.present_count} present • {college.absent_count} absent • {college.late_count} late
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm font-medium">{college.total_sessions} sessions</div>
              <div className="text-xs text-gray-500">{college.unique_students} students</div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );

  const renderInvoiceSummary = () => {
    if (reports.length === 0) return <div className="text-center py-8 text-gray-500">No invoices found</div>;
    const totals = reports[0]?.totals || {};
    return (
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-4 gap-4">
              <div>
                <div className="text-sm text-gray-600">Total Invoices</div>
                <div className="text-2xl font-bold">{totals.total_invoices || 0}</div>
              </div>
              <div>
                <div className="text-sm text-gray-600">Total Hours</div>
                <div className="text-2xl font-bold">{totals.total_hours || 0}</div>
              </div>
              <div>
                <div className="text-sm text-gray-600">Total Amount</div>
                <div className="text-2xl font-bold">₹{totals.total_net_payable?.toFixed(2) || '0.00'}</div>
              </div>
              <div>
                <div className="text-sm text-gray-600">Total TDS</div>
                <div className="text-2xl font-bold">₹{totals.total_tds?.toFixed(2) || '0.00'}</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <div className="space-y-2">
          {reports[0]?.invoices?.map(invoice => (
            <div key={invoice.id} className="border rounded-lg p-4">
              <div className="flex justify-between items-start">
                <div>
                  <div className="font-medium">{invoice.invoice_number}</div>
                  <div className="text-sm text-gray-600">{invoice.faculty_name}</div>
                  <div className="text-sm text-gray-500">{invoice.college_name}</div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-medium">₹{invoice.net_payable?.toFixed(2)}</div>
                  <div className="text-xs text-gray-500">{invoice.total_hours}h</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Reports & Analytics
            </CardTitle>
            <div className="flex gap-2">
              <Button variant="outline" onClick={handleExport}>
                <Download className="mr-2 h-4 w-4" />
                Export
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div>
              <Label>Report Type</Label>
              <Select value={reportType} onValueChange={setReportType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="project-progress">Project Progress</SelectItem>
                  <SelectItem value="trainer-utilization">Trainer Utilization</SelectItem>
                  <SelectItem value="college-attendance">College Attendance</SelectItem>
                  <SelectItem value="invoice-summary">Invoice Summary</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Start Date</Label>
              <Input
                type="date"
                value={filters.start_date}
                onChange={(e) => setFilters({ ...filters, start_date: e.target.value })}
              />
            </div>
            <div>
              <Label>End Date</Label>
              <Input
                type="date"
                value={filters.end_date}
                onChange={(e) => setFilters({ ...filters, end_date: e.target.value })}
              />
            </div>
          </div>

          {loading ? (
            <div className="text-center py-8">Loading report...</div>
          ) : (
            <>
              {reportType === 'project-progress' && renderProjectProgress()}
              {reportType === 'trainer-utilization' && renderTrainerUtilization()}
              {reportType === 'college-attendance' && renderCollegeAttendance()}
              {reportType === 'invoice-summary' && renderInvoiceSummary()}
              {reports.length === 0 && !loading && (
                <div className="text-center py-8 text-gray-500">No data available</div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ReportsView;

