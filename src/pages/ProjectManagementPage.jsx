import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import api from '@/services/api';
import ProjectList from '@/components/project-management/ProjectList';
import ProjectForm from '@/components/project-management/ProjectForm';
import CalendarView from '@/components/project-management/CalendarView';
import FacultyScheduling from '@/components/project-management/FacultyScheduling';
import AttendanceView from '@/components/project-management/AttendanceView';
import FeedbackView from '@/components/project-management/FeedbackView';
import ReportsView from '@/components/project-management/ReportsView';
import InvoicesView from '@/components/project-management/InvoicesView';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';

const ProjectManagementPage = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('projects');
  const [showCreateProject, setShowCreateProject] = useState(false);
  const [selectedProject, setSelectedProject] = useState(null);
  const [viewMode, setViewMode] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  // Role-based tab visibility
  const getAvailableTabs = () => {
    const allTabs = [
      { id: 'projects', label: 'Projects', roles: ['super-admin', 'college-admin', 'faculty'] },
      { id: 'calendar', label: 'Calendar', roles: ['super-admin', 'college-admin', 'faculty', 'student'] },
      { id: 'faculty-scheduling', label: 'Faculty & Scheduling', roles: ['super-admin', 'college-admin'] },
      { id: 'attendance', label: 'Attendance', roles: ['super-admin', 'college-admin', 'faculty'] },
      { id: 'feedback', label: 'Feedback', roles: ['super-admin', 'college-admin', 'faculty', 'student'] },
      { id: 'reports', label: 'Reports', roles: ['super-admin', 'college-admin'] },
      { id: 'invoices', label: 'Invoices', roles: ['super-admin', 'faculty'] },
    ];

    return allTabs.filter(tab => tab.roles.includes(user?.role));
  };

  const availableTabs = getAvailableTabs();

  return (
    <div className="container mx-auto p-6">
      {!selectedProject ? (
        // Show only Projects list when no project is selected
        <>
          <ProjectList 
            key={refreshKey}
            showCreateButton={user?.role === 'super-admin'}
            onSelectProject={async (project) => {
              // Load full project details
              try {
                const response = await api.getProjectById(project.id);
                if (response.success) {
                  setSelectedProject(response.data);
                  setActiveTab('calendar'); // Switch to calendar tab after selection
                } else {
                  setSelectedProject(project);
                  setActiveTab('calendar');
                }
              } catch (error) {
                console.error('Failed to load project details:', error);
                setSelectedProject(project);
                setActiveTab('calendar');
              }
            }}
            onCreateNew={() => {
              setShowCreateProject(true);
              setSelectedProject(null);
              setViewMode(false);
            }}
            onEditProject={(project) => {
              setSelectedProject(project);
              setViewMode(false);
              setShowCreateProject(true);
            }}
          />
        </>
      ) : (
        // Show tabs and other options when project is selected
        <>
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                onClick={() => {
                  setSelectedProject(null);
                  setActiveTab('projects');
                }}
              >
                ← Back to Projects
              </Button>
              <div>
                <h2 className="text-xl font-semibold">{selectedProject.name}</h2>
                <p className="text-sm text-muted-foreground">
                  {selectedProject.college_name} • {selectedProject.status?.replace('_', ' ')}
                </p>
              </div>
            </div>
            {user?.role === 'super-admin' && (
              <Button
                variant="outline"
                onClick={() => {
                  setViewMode(false);
                  setShowCreateProject(true);
                }}
              >
                Edit Project
              </Button>
            )}
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-4 lg:grid-cols-8">
              {availableTabs.filter(tab => tab.id !== 'projects').map(tab => (
                <TabsTrigger key={tab.id} value={tab.id}>
                  {tab.label}
                </TabsTrigger>
              ))}
            </TabsList>

            <TabsContent value="calendar" className="mt-6">
              <CalendarView selectedProject={selectedProject} />
            </TabsContent>

            <TabsContent value="faculty-scheduling" className="mt-6">
              <FacultyScheduling selectedProject={selectedProject} />
            </TabsContent>

            <TabsContent value="attendance" className="mt-6">
              <AttendanceView selectedProject={selectedProject} />
            </TabsContent>

            <TabsContent value="feedback" className="mt-6">
              <FeedbackView selectedProject={selectedProject} />
            </TabsContent>

            <TabsContent value="reports" className="mt-6">
              <ReportsView selectedProject={selectedProject} />
            </TabsContent>

            <TabsContent value="invoices" className="mt-6">
              <InvoicesView selectedProject={selectedProject} />
            </TabsContent>
          </Tabs>
        </>
      )}

      {showCreateProject && (
        <ProjectForm
          open={showCreateProject}
          onClose={() => {
            setShowCreateProject(false);
            setSelectedProject(null);
            setViewMode(false);
          }}
          project={selectedProject}
          viewMode={viewMode}
          onSuccess={() => {
            setShowCreateProject(false);
            setSelectedProject(null);
            setViewMode(false);
            setRefreshKey(prev => prev + 1); // Trigger refresh
          }}
        />
      )}
    </div>
  );
};

export default ProjectManagementPage;

