import React, { useState, useEffect } from 'react';
import api from '@/services/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar, Clock, Download, Zap } from 'lucide-react';
import { toast } from 'react-hot-toast';

const SchedulingView = ({ selectedProject }) => {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [formData, setFormData] = useState({
    project_id: '',
    batch_id: '',
    faculty_id: '',
    title: '',
    topic: '',
    start_time: '',
    end_time: '',
    mode: 'online'
  });

  useEffect(() => {
    if (selectedProject) {
      loadSessions();
      setFormData(prev => ({ ...prev, project_id: selectedProject.id }));
    }
  }, [selectedProject]);

  const loadSessions = async () => {
    if (!selectedProject) return;
    try {
      setLoading(true);
      const response = await api.getSessions({ project_id: selectedProject.id });
      if (response.success) {
        setSessions(response.data || []);
      }
    } catch (error) {
      toast.error('Failed to load sessions');
    } finally {
      setLoading(false);
    }
  };

  const handleAutoGenerate = async () => {
    if (!selectedProject) return;
    try {
      setLoading(true);
      const response = await api.autoGenerateSchedule(selectedProject.id);
      if (response.success) {
        toast.success(`Generated ${response.data?.length || 0} sessions`);
        loadSessions();
      }
    } catch (error) {
      toast.error(error.message || 'Failed to generate schedule');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSession = async () => {
    try {
      setLoading(true);
      await api.createSession(formData);
      toast.success('Session created successfully');
      setShowCreateDialog(false);
      loadSessions();
    } catch (error) {
      toast.error(error.message || 'Failed to create session');
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    try {
      const response = await api.exportSessionsToExcel({ project_id: selectedProject?.id });
      const url = window.URL.createObjectURL(new Blob([response]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'sessions.xlsx');
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success('Sessions exported successfully');
    } catch (error) {
      toast.error('Failed to export sessions');
    }
  };

  if (!selectedProject) {
    return (
      <Card>
        <CardContent className="text-center py-8">
          <p className="text-gray-500">Please select a project to view sessions</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Sessions - {selectedProject.name}</CardTitle>
            <div className="flex gap-2">
              <Button variant="outline" onClick={handleExport}>
                <Download className="mr-2 h-4 w-4" />
                Export
              </Button>
              <Button variant="outline" onClick={handleAutoGenerate} disabled={loading}>
                <Zap className="mr-2 h-4 w-4" />
                Auto-Generate
              </Button>
              <Button onClick={() => setShowCreateDialog(true)}>
                <Calendar className="mr-2 h-4 w-4" />
                Create Session
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading && sessions.length === 0 ? (
            <div className="text-center py-8">Loading sessions...</div>
          ) : (
            <div className="space-y-2">
              {sessions.map(session => (
                <div key={session.id} className="border rounded-lg p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="font-medium">{session.title}</div>
                      <div className="text-sm text-gray-600 mt-1">
                        <Clock className="inline h-3 w-3 mr-1" />
                        {new Date(session.start_time).toLocaleString()} - {new Date(session.end_time).toLocaleString()}
                      </div>
                      <div className="text-sm text-gray-500 mt-1">
                        {session.batch_name} • {session.faculty_name} • {session.mode}
                      </div>
                      {session.topic && (
                        <div className="text-sm text-gray-500 mt-1">Topic: {session.topic}</div>
                      )}
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium">{session.duration_minutes} min</div>
                      <div className="text-xs text-gray-500">{session.status}</div>
                    </div>
                  </div>
                </div>
              ))}
              {sessions.length === 0 && (
                <div className="text-center py-8 text-gray-500">No sessions scheduled</div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Session</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Title *</Label>
              <Input
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
              />
            </div>
            <div>
              <Label>Topic</Label>
              <Input
                value={formData.topic}
                onChange={(e) => setFormData({ ...formData, topic: e.target.value })}
              />
            </div>
            <div>
              <Label>Start Time *</Label>
              <Input
                type="datetime-local"
                value={formData.start_time}
                onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                required
              />
            </div>
            <div>
              <Label>End Time *</Label>
              <Input
                type="datetime-local"
                value={formData.end_time}
                onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                required
              />
            </div>
            <div>
              <Label>Mode *</Label>
              <Select value={formData.mode} onValueChange={(value) => setFormData({ ...formData, mode: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="online">Online</SelectItem>
                  <SelectItem value="offline">Offline</SelectItem>
                  <SelectItem value="hybrid">Hybrid</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowCreateDialog(false)}>Cancel</Button>
              <Button onClick={handleCreateSession} disabled={loading}>
                {loading ? 'Creating...' : 'Create'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SchedulingView;

