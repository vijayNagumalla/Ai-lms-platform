import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';

// Icons
import {
  Save, FolderOpen, Trash2, Edit, Eye, Clock, Calendar, Filter,
  BookOpen, Layers, Users, Building, GraduationCap, X
} from 'lucide-react';

const SaveViewPanel = ({ onSave, onClose, savedViews, onLoadView }) => {
  const [viewName, setViewName] = useState('');
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [editingView, setEditingView] = useState(null);

  const handleSave = () => {
    if (viewName.trim()) {
      onSave(viewName.trim());
      setViewName('');
      setShowSaveDialog(false);
    }
  };

  const handleLoadView = (view) => {
    onLoadView(view.id);
    onClose();
  };

  const handleDeleteView = async (viewId) => {
    // This would typically call an API to delete the view
    console.log('Delete view:', viewId);
  };

  const getModuleIcon = (module) => {
    return module === 'assessments' ? <BookOpen className="h-4 w-4" /> : <Layers className="h-4 w-4" />;
  };

  const getFilterSummary = (filters) => {
    const activeFilters = [];
    
    if (filters.collegeId !== 'all') activeFilters.push('College');
    if (filters.departmentId !== 'all') activeFilters.push('Department');
    if (filters.batchId !== 'all') activeFilters.push('Batch');
    if (filters.facultyId !== 'all') activeFilters.push('Faculty');
    if (filters.studentId !== 'all') activeFilters.push('Student');
    if (filters.assessmentType !== 'all') activeFilters.push('Assessment Type');
    if (filters.courseCategory !== 'all') activeFilters.push('Course Category');
    if (filters.dateRange !== '30') activeFilters.push('Date Range');
    
    return activeFilters.length > 0 ? activeFilters.join(', ') : 'No filters';
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[80vh] overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
              Save & Load Views
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Manage your analytics filter presets
            </p>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        <div className="p-6 space-y-6">
          {/* Save New View */}
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
                Save Current View
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Save your current filter configuration for quick access
              </p>
            </div>
            <Dialog open={showSaveDialog} onOpenChange={setShowSaveDialog}>
              <DialogTrigger asChild>
                <Button>
                  <Save className="h-4 w-4 mr-2" />
                  Save View
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Save Analytics View</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="view-name">View Name</Label>
                    <Input
                      id="view-name"
                      placeholder="Enter a descriptive name..."
                      value={viewName}
                      onChange={(e) => setViewName(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleSave()}
                    />
                  </div>
                  <div className="flex justify-end space-x-2">
                    <Button variant="outline" onClick={() => setShowSaveDialog(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleSave} disabled={!viewName.trim()}>
                      Save View
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <Separator />

          {/* Saved Views */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">
              Saved Views ({savedViews.length})
            </h3>
            
            {savedViews.length === 0 ? (
              <div className="text-center py-8">
                <FolderOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">No saved views yet</p>
                <p className="text-sm text-gray-400">Save your first view to get started</p>
              </div>
            ) : (
              <div className="space-y-3">
                {savedViews.map((view) => (
                  <Card key={view.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                            {getModuleIcon(view.module)}
                          </div>
                          <div>
                            <h4 className="font-medium text-gray-900 dark:text-gray-100">
                              {view.name}
                            </h4>
                            <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
                              <Badge variant="outline" className="text-xs">
                                {view.module === 'assessments' ? 'Assessment' : 'Course'} Reports
                              </Badge>
                              <span>•</span>
                              <span>{getFilterSummary(view.filters)}</span>
                            </div>
                            <div className="flex items-center space-x-2 text-xs text-gray-500 mt-1">
                              <Clock className="h-3 w-3" />
                              <span>Saved {new Date(view.createdAt).toLocaleDateString()}</span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleLoadView(view)}
                            className="text-blue-600 hover:text-blue-700"
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            Load
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setEditingView(view)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteView(view.id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>

          {/* Quick Actions */}
          <Separator />
          
          <div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">
              Quick Actions
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <Button variant="outline" className="justify-start">
                <Filter className="h-4 w-4 mr-2" />
                Clear All Filters
              </Button>
              <Button variant="outline" className="justify-start">
                <Calendar className="h-4 w-4 mr-2" />
                Reset to Default
              </Button>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end space-x-2 p-6 border-t">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </div>
  );
};

export default SaveViewPanel; 