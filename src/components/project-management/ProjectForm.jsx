import React, { useState, useEffect } from 'react';
import api from '@/services/api';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'react-hot-toast';

const ProjectForm = ({ open, onClose, project, onSuccess, viewMode = false }) => {
  const [loading, setLoading] = useState(false);
  const [colleges, setColleges] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [batches, setBatches] = useState([]);
  const [formData, setFormData] = useState({
    name: '',
    college_id: '',
    project_type: '',
    total_hours_required: '',
    start_date: '',
    end_date: '',
    trainers_required: 1,
    admins_required: 0,
    mode: 'online',
    preferred_timings: { start: '09:00', end: '17:00' },
    project_manager_id: '',
    spoc_id: '',
    description: '',
    department_ids: [],
    batch_ids: []
  });

  useEffect(() => {
    if (open) {
      loadColleges();
      if (project) {
        setFormData({
          name: project.name || '',
          college_id: project.college_id || '',
          project_type: project.project_type || '',
          total_hours_required: project.total_hours_required || '',
          start_date: project.start_date || '',
          end_date: project.end_date || '',
          trainers_required: project.trainers_required || 1,
          admins_required: project.admins_required || 0,
          mode: project.mode || 'online',
          preferred_timings: project.preferred_timings ? JSON.parse(project.preferred_timings) : { start: '09:00', end: '17:00' },
          project_manager_id: project.project_manager_id || '',
          spoc_id: project.spoc_id || '',
          description: project.description || '',
          department_ids: [],
          batch_ids: []
        });
        if (project.college_id) {
          loadDepartments(project.college_id);
          loadBatches(project.college_id);
        }
      } else {
        resetForm();
      }
    }
  }, [open, project]);

  const resetForm = () => {
    setFormData({
      name: '',
      college_id: '',
      project_type: '',
      total_hours_required: '',
      start_date: '',
      end_date: '',
      trainers_required: 1,
      admins_required: 0,
      mode: 'online',
      preferred_timings: { start: '09:00', end: '17:00' },
      project_manager_id: '',
      spoc_id: '',
      description: '',
      department_ids: [],
      batch_ids: []
    });
  };

  const loadColleges = async () => {
    try {
      const response = await api.getColleges();
      if (response.success) {
        // API returns { data: { colleges: [...], pagination: {...} } }
        const collegesData = response.data;
        if (collegesData && Array.isArray(collegesData.colleges)) {
          setColleges(collegesData.colleges);
        } else if (Array.isArray(collegesData)) {
          // Fallback: if data is directly an array
          setColleges(collegesData);
        } else {
          setColleges([]);
        }
      } else {
        setColleges([]);
      }
    } catch (error) {
      console.error('Failed to load colleges:', error);
      setColleges([]);
    }
  };

  const loadDepartments = async (collegeId) => {
    try {
      const response = await api.getCollegeDepartments(collegeId);
      if (response.success) {
        setDepartments(response.data || []);
      }
    } catch (error) {
      console.error('Failed to load departments:', error);
    }
  };

  const loadBatches = async (collegeId) => {
    try {
      const response = await api.getCollegeBatches(collegeId);
      if (response.success) {
        setBatches(response.data || []);
      }
    } catch (error) {
      console.error('Failed to load batches:', error);
    }
  };

  const handleCollegeChange = (collegeId) => {
    setFormData({ ...formData, college_id: collegeId, department_ids: [], batch_ids: [] });
    if (collegeId) {
      loadDepartments(collegeId);
      loadBatches(collegeId);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (viewMode) return; // Don't submit in view mode
    
    setLoading(true);

    try {
      if (project) {
        await api.updateProject(project.id, formData);
        toast.success('Project updated successfully');
      } else {
        await api.createProject(formData);
        toast.success('Project created successfully');
      }
      onSuccess();
    } catch (error) {
      toast.error(error.message || 'Failed to save project');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {viewMode ? 'View Project' : project ? 'Edit Project' : 'Create New Project'}
          </DialogTitle>
          <DialogDescription>
            {viewMode 
              ? 'View project details' 
              : project 
                ? 'Update project details' 
                : 'Fill in the details to create a new project'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="name">Project Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                disabled={viewMode}
                readOnly={viewMode}
              />
            </div>

            <div>
              <Label htmlFor="college_id">College *</Label>
              <Select value={formData.college_id} onValueChange={handleCollegeChange} required disabled={viewMode}>
                <SelectTrigger>
                  <SelectValue placeholder="Select college" />
                </SelectTrigger>
                <SelectContent>
                  {colleges.map(college => (
                    <SelectItem key={college.id} value={college.id}>{college.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="project_type">Project Type *</Label>
              <Select value={formData.project_type} onValueChange={(value) => setFormData({ ...formData, project_type: value })} required disabled={viewMode}>
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="company_specific">Company Specific</SelectItem>
                  <SelectItem value="crt">CRT</SelectItem>
                  <SelectItem value="custom">Custom</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="total_hours_required">Total Hours Required *</Label>
              <Input
                id="total_hours_required"
                type="number"
                value={formData.total_hours_required}
                onChange={(e) => setFormData({ ...formData, total_hours_required: e.target.value })}
                required
                min="1"
                disabled={viewMode}
                readOnly={viewMode}
              />
            </div>

            <div>
              <Label htmlFor="start_date">Start Date *</Label>
              <Input
                id="start_date"
                type="date"
                value={formData.start_date}
                onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                required
                disabled={viewMode}
                readOnly={viewMode}
              />
            </div>

            <div>
              <Label htmlFor="end_date">End Date *</Label>
              <Input
                id="end_date"
                type="date"
                value={formData.end_date}
                onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                required
                disabled={viewMode}
                readOnly={viewMode}
              />
            </div>

            <div>
              <Label htmlFor="mode">Mode *</Label>
              <Select value={formData.mode} onValueChange={(value) => setFormData({ ...formData, mode: value })} required disabled={viewMode}>
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

            <div>
              <Label htmlFor="trainers_required">Trainers Required</Label>
              <Input
                id="trainers_required"
                type="number"
                value={formData.trainers_required}
                onChange={(e) => setFormData({ ...formData, trainers_required: parseInt(e.target.value) })}
                min="1"
                disabled={viewMode}
                readOnly={viewMode}
              />
            </div>
          </div>

          {formData.college_id && (
            <>
              <div>
                <Label>Departments</Label>
                <div className="grid grid-cols-3 gap-2 mt-2">
                  {departments.map(dept => (
                    <label key={dept.id} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={formData.department_ids.includes(dept.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setFormData({ ...formData, department_ids: [...formData.department_ids, dept.id] });
                          } else {
                            setFormData({ ...formData, department_ids: formData.department_ids.filter(id => id !== dept.id) });
                          }
                        }}
                        disabled={viewMode}
                      />
                      <span>{dept.name}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <Label>Batches</Label>
                <div className="grid grid-cols-3 gap-2 mt-2">
                  {batches.map(batch => (
                    <label key={batch.id} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={formData.batch_ids.includes(batch.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setFormData({ ...formData, batch_ids: [...formData.batch_ids, batch.id] });
                          } else {
                            setFormData({ ...formData, batch_ids: formData.batch_ids.filter(id => id !== batch.id) });
                          }
                        }}
                        disabled={viewMode}
                      />
                      <span>{batch.name}</span>
                    </label>
                  ))}
                </div>
              </div>
            </>
          )}

          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={4}
              disabled={viewMode}
              readOnly={viewMode}
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose}>
              {viewMode ? 'Close' : 'Cancel'}
            </Button>
            {!viewMode && (
              <Button type="submit" disabled={loading}>
                {loading ? 'Saving...' : project ? 'Update' : 'Create'}
              </Button>
            )}
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ProjectForm;

