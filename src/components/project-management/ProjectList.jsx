import React, { useState, useEffect } from 'react';
import api from '@/services/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Edit, Trash2, Eye, Calendar, Users, Plus } from 'lucide-react';
import { toast } from 'react-hot-toast';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

const ProjectList = ({ onSelectProject, onCreateNew, onEditProject, refreshKey, showCreateButton = false }) => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    search: '',
    status: 'all',
    project_type: 'all',
    college_id: 'all'
  });
  const [colleges, setColleges] = useState([]);

  useEffect(() => {
    loadProjects();
    loadColleges();
  }, [filters, refreshKey]);

  const loadProjects = async () => {
    try {
      setLoading(true);
      // Convert 'all' values to empty strings for API
      const apiFilters = {
        ...filters,
        status: filters.status === 'all' ? '' : filters.status,
        project_type: filters.project_type === 'all' ? '' : filters.project_type,
        college_id: filters.college_id === 'all' ? '' : filters.college_id
      };
      const response = await api.getProjects(apiFilters);
      if (response.success) {
        setProjects(response.data || []);
      }
    } catch (error) {
      toast.error('Failed to load projects');
      console.error(error);
    } finally {
      setLoading(false);
    }
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

  const handleDelete = async (projectId) => {
    if (!confirm('Are you sure you want to delete this project?')) return;

    try {
      await api.deleteProject(projectId);
      toast.success('Project deleted successfully');
      loadProjects();
    } catch (error) {
      toast.error('Failed to delete project');
    }
  };

  // Calculate dynamic status based on project state
  const getDynamicStatus = (project) => {
    // If no faculty allocated, status is "Faculty Allocation"
    if (!project.allocated_trainers_count || project.allocated_trainers_count === 0) {
      return {
        status: 'faculty_allocation',
        label: 'Allocate Faculty',
        color: 'bg-blue-500',
        action: 'allocate_faculty'
      };
    }
    
    // If faculty allocated but no sessions, status is "Create Schedule"
    if (project.allocated_trainers_count > 0 && (!project.sessions_count || project.sessions_count === 0)) {
      return {
        status: 'scheduling',
        label: 'Create Schedule',
        color: 'bg-yellow-500',
        action: 'create_schedule'
      };
    }
    
    // If sessions exist but project not live, status is "Ready to Start"
    if (project.sessions_count > 0 && project.status !== 'live' && project.status !== 'completed') {
      return {
        status: 'admin_allocation',
        label: 'Ready to Start',
        color: 'bg-orange-500',
        action: 'start_project'
      };
    }
    
    // Return actual status from database
    return {
      status: project.status || 'draft',
      label: (project.status || 'draft')?.replace('_', ' ') || 'Draft',
      color: getStatusColor(project.status || 'draft'),
      action: null
    };
  };

  const getStatusColor = (status) => {
    const colors = {
      draft: 'bg-gray-500',
      faculty_allocation: 'bg-blue-500',
      scheduling: 'bg-yellow-500',
      admin_allocation: 'bg-orange-500',
      live: 'bg-green-500',
      completed: 'bg-purple-500',
      cancelled: 'bg-red-500'
    };
    return colors[status] || 'bg-gray-500';
  };

  if (loading) {
    return <div className="text-center py-8">Loading projects...</div>;
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap items-center gap-4">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search projects..."
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                className="pl-10"
              />
            </div>
            <Select value={filters.status} onValueChange={(value) => setFilters({ ...filters, status: value })}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="faculty_allocation">Faculty Allocation</SelectItem>
                <SelectItem value="scheduling">Scheduling</SelectItem>
                <SelectItem value="admin_allocation">Admin Allocation</SelectItem>
                <SelectItem value="live">Live</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filters.project_type} onValueChange={(value) => setFilters({ ...filters, project_type: value })}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="All Types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="company_specific">Company Specific</SelectItem>
                <SelectItem value="crt">CRT</SelectItem>
                <SelectItem value="custom">Custom</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filters.college_id} onValueChange={(value) => setFilters({ ...filters, college_id: value })}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="All Colleges" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Colleges</SelectItem>
                {Array.isArray(colleges) && colleges.map(college => (
                  <SelectItem key={college.id} value={String(college.id)}>{college.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {showCreateButton && (
              <Button onClick={onCreateNew}>
                <Plus className="mr-2 h-4 w-4" />
                Create Project
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Projects Table */}
      <Card>
        <CardContent className="pt-6">
          {projects.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500 mb-4">No projects found</p>
              <Button onClick={onCreateNew}>
                Create Your First Project
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Project Name</TableHead>
                    <TableHead>College</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Start Date</TableHead>
                    <TableHead>End Date</TableHead>
                    <TableHead>Hours</TableHead>
                    <TableHead>Trainers</TableHead>
                    <TableHead>Sessions</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {projects.map(project => (
                    <TableRow key={project.id} className="hover:bg-muted/50">
                      <TableCell className="font-medium">{project.name}</TableCell>
                      <TableCell>{project.college_name || 'N/A'}</TableCell>
                      <TableCell>
                        <span className="capitalize">
                          {project.project_type?.replace('_', ' ') || 'N/A'}
                        </span>
                      </TableCell>
                       <TableCell>
                         {(() => {
                           const dynamicStatus = getDynamicStatus(project);
                           return (
                             <Badge 
                               className={`${dynamicStatus.color} text-white text-xs px-2 py-0.5`}
                               title={dynamicStatus.action ? `Click "Select" to ${dynamicStatus.label.toLowerCase()}` : 'Current Status'}
                             >
                               {dynamicStatus.label}
                             </Badge>
                           );
                         })()}
                       </TableCell>
                      <TableCell>
                        {project.start_date ? new Date(project.start_date).toLocaleDateString() : 'N/A'}
                      </TableCell>
                      <TableCell>
                        {project.end_date ? new Date(project.end_date).toLocaleDateString() : 'N/A'}
                      </TableCell>
                      <TableCell>{project.total_hours_required || 0}h</TableCell>
                      <TableCell>{project.allocated_trainers_count || 0}</TableCell>
                      <TableCell>{project.sessions_count || 0}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="default"
                            size="sm"
                            onClick={() => {
                              onSelectProject(project);
                            }}
                            title="Select Project"
                          >
                            Select
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              if (onEditProject) {
                                onEditProject(project);
                              }
                            }}
                            title="Edit Project"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(project.id)}
                            className="text-red-600 hover:text-red-700"
                            title="Delete Project"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

    </div>
  );
};

export default ProjectList;

