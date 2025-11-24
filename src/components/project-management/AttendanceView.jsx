import React, { useState, useEffect } from 'react';
import api from '@/services/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, Clock, Users } from 'lucide-react';
import { toast } from 'react-hot-toast';

const AttendanceView = ({ selectedProject }) => {
  const [sessions, setSessions] = useState([]);
  const [selectedSession, setSelectedSession] = useState(null);
  const [attendance, setAttendance] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    project_id: '',
    batch_id: '',
    start_date: '',
    end_date: ''
  });

  useEffect(() => {
    loadSessions();
  }, [filters]);

  useEffect(() => {
    if (selectedSession) {
      loadAttendance();
    }
  }, [selectedSession]);

  const loadSessions = async () => {
    try {
      setLoading(true);
      const response = await api.getSessions(filters);
      if (response.success) {
        setSessions(response.data || []);
      }
    } catch (error) {
      toast.error('Failed to load sessions');
    } finally {
      setLoading(false);
    }
  };

  const loadAttendance = async () => {
    if (!selectedSession) return;
    try {
      const response = await api.getSessionAttendance(selectedSession.id);
      if (response.success) {
        setAttendance(response.data?.attendance || []);
      }
    } catch (error) {
      toast.error('Failed to load attendance');
    }
  };

  const handleMarkAttendance = async (studentId, status) => {
    if (!selectedSession) return;
    try {
      const attendanceData = attendance.map(att => ({
        student_id: att.student_id,
        status: att.student_id === studentId ? status : att.status || 'absent'
      }));

      await api.markAttendance(selectedSession.id, attendanceData);
      toast.success('Attendance marked successfully');
      loadAttendance();
    } catch (error) {
      toast.error('Failed to mark attendance');
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'present':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'late':
        return <Clock className="h-5 w-5 text-yellow-500" />;
      case 'absent':
        return <XCircle className="h-5 w-5 text-red-500" />;
      default:
        return null;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'present':
        return 'bg-green-100 text-green-800';
      case 'late':
        return 'bg-yellow-100 text-yellow-800';
      case 'absent':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      <Card className="lg:col-span-1">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Sessions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 max-h-[600px] overflow-y-auto">
            {sessions.map(session => (
              <div
                key={session.id}
                className={`p-3 border rounded-lg cursor-pointer hover:bg-gray-50 ${
                  selectedSession?.id === session.id ? 'bg-blue-50 border-blue-500' : ''
                }`}
                onClick={() => setSelectedSession(session)}
              >
                <div className="font-medium">{session.title}</div>
                <div className="text-sm text-gray-600">
                  {new Date(session.start_time).toLocaleString()}
                </div>
                <div className="text-sm text-gray-500">{session.batch_name}</div>
              </div>
            ))}
            {sessions.length === 0 && (
              <div className="text-center py-8 text-gray-500">No sessions found</div>
            )}
          </div>
        </CardContent>
      </Card>

      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle>
            {selectedSession ? `Attendance - ${selectedSession.title}` : 'Select a Session'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {selectedSession ? (
            <div className="space-y-2">
              {attendance.map(att => (
                <div key={att.student_id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    {getStatusIcon(att.status)}
                    <div>
                      <div className="font-medium">{att.student_name}</div>
                      <div className="text-sm text-gray-600">{att.student_roll}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={getStatusColor(att.status)}>
                      {att.status || 'Not Marked'}
                    </Badge>
                    <div className="flex gap-1">
                      <Button
                        size="sm"
                        variant={att.status === 'present' ? 'default' : 'outline'}
                        onClick={() => handleMarkAttendance(att.student_id, 'present')}
                      >
                        Present
                      </Button>
                      <Button
                        size="sm"
                        variant={att.status === 'late' ? 'default' : 'outline'}
                        onClick={() => handleMarkAttendance(att.student_id, 'late')}
                      >
                        Late
                      </Button>
                      <Button
                        size="sm"
                        variant={att.status === 'absent' ? 'default' : 'outline'}
                        onClick={() => handleMarkAttendance(att.student_id, 'absent')}
                      >
                        Absent
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
              {attendance.length === 0 && (
                <div className="text-center py-8 text-gray-500">No students found</div>
              )}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">Please select a session to view attendance</div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AttendanceView;

