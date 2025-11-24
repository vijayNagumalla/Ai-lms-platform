import React, { useState, useEffect } from 'react';
import api from '@/services/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Users, Star, TrendingUp, X, Calendar, Clock, Download, Zap } from 'lucide-react';
import { toast } from 'react-hot-toast';
import ExcelSchedulingGrid from './ExcelSchedulingGrid';

const FacultyScheduling = ({ selectedProject }) => {
  const [activeTab, setActiveTab] = useState('faculty');
  const [allocations, setAllocations] = useState([]);
  const [recommendedTrainers, setRecommendedTrainers] = useState([]);
  const [showAllocateDialog, setShowAllocateDialog] = useState(false);
  const [showReplaceDialog, setShowReplaceDialog] = useState(false);
  const [selectedAllocation, setSelectedAllocation] = useState(null);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    faculty_id: '',
    training_type: '',
    employment_type: 'freelancer'
  });

  useEffect(() => {
    if (selectedProject) {
      loadAllocations();
      loadRecommendedTrainers();
    }
  }, [selectedProject]);

  const loadAllocations = async () => {
    if (!selectedProject) return;
    try {
      const response = await api.getProjectFaculty(selectedProject.id);
      if (response.success) {
        setAllocations(response.data || []);
      }
    } catch (error) {
      toast.error('Failed to load faculty allocations');
    }
  };

  const loadRecommendedTrainers = async () => {
    if (!selectedProject) return;
    try {
      const response = await api.getRecommendedTrainers(selectedProject.id);
      if (response.success) {
        setRecommendedTrainers(response.data || []);
      }
    } catch (error) {
      console.error('Failed to load recommended trainers:', error);
    }
  };

  const handleAllocate = async () => {
    if (!selectedProject) return;
    
    // Validation
    if (!formData.faculty_id) {
      toast.error('Please select a faculty member');
      return;
    }
    if (!formData.training_type) {
      toast.error('Please select a training type');
      return;
    }
    if (!formData.employment_type) {
      toast.error('Please select an employment type');
      return;
    }
    
    try {
      setLoading(true);
      const response = await api.allocateFaculty(selectedProject.id, {
        faculty_id: formData.faculty_id,
        training_type: formData.training_type,
        employment_type: formData.employment_type
      });
      
      if (response.success) {
        toast.success('Faculty allocated successfully');
        setShowAllocateDialog(false);
        setFormData({ faculty_id: '', training_type: '', employment_type: 'freelancer' });
        loadAllocations();
      } else {
        toast.error(response.message || 'Failed to allocate faculty');
      }
    } catch (error) {
      console.error('Allocation error:', error);
      toast.error(error.response?.data?.message || error.message || 'Failed to allocate faculty');
    } finally {
      setLoading(false);
    }
  };

  const handleReplace = async () => {
    if (!selectedAllocation) return;
    try {
      setLoading(true);
      await api.replaceFaculty(selectedAllocation.id, {
        new_faculty_id: formData.faculty_id,
        reason: formData.reason || 'Faculty replacement'
      });
      toast.success('Faculty replaced successfully');
      setShowReplaceDialog(false);
      setSelectedAllocation(null);
      loadAllocations();
    } catch (error) {
      toast.error(error.message || 'Failed to replace faculty');
    } finally {
      setLoading(false);
    }
  };

  if (!selectedProject) {
    return (
      <Card>
        <CardContent className="text-center py-8">
          <p className="text-gray-500">Please select a project to view faculty and scheduling</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="faculty">Faculty Allocation</TabsTrigger>
          <TabsTrigger value="scheduling">Scheduling</TabsTrigger>
        </TabsList>

        <TabsContent value="faculty" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Faculty Allocations - {selectedProject.name}</CardTitle>
                <Button onClick={() => setShowAllocateDialog(true)}>
                  <Users className="mr-2 h-4 w-4" />
                  Allocate Faculty
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {allocations.map(allocation => (
                  <div key={allocation.id} className="border rounded-lg p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="font-medium">{allocation.faculty_name}</div>
                        <div className="text-sm text-gray-600">{allocation.faculty_email}</div>
                        <div className="flex gap-2 mt-2">
                          <Badge>{allocation.employment_type}</Badge>
                          <Badge variant="outline">{allocation.allocation_status}</Badge>
                        </div>
                        <div className="mt-2 text-sm">
                          <span className="font-medium">Training Type:</span> 
                          <Badge variant="outline" className="ml-2 capitalize">
                            {allocation.training_type?.replace('_', ' ') || allocation.training_type || 'N/A'}
                          </Badge>
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedAllocation(allocation);
                          setShowReplaceDialog(true);
                        }}
                      >
                        Replace
                      </Button>
                    </div>
                  </div>
                ))}
                {allocations.length === 0 && (
                  <div className="text-center py-8 text-gray-500">No faculty allocated yet</div>
                )}
              </div>
            </CardContent>
          </Card>

          {recommendedTrainers.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Recommended Trainers
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {recommendedTrainers.slice(0, 5).map(trainer => (
                    <div key={trainer.id} className="flex justify-between items-center p-2 border rounded">
                      <div>
                        <div className="font-medium">{trainer.name}</div>
                        <div className="text-sm text-gray-600 flex items-center gap-2">
                          <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                          {trainer.rating || 'N/A'} • {trainer.remaining_hours || 0}h available
                        </div>
                      </div>
                      <Badge>Score: {trainer.score?.toFixed(1)}</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="scheduling" className="space-y-4">
          <ExcelSchedulingGrid selectedProject={selectedProject} />
        </TabsContent>
      </Tabs>

      {/* Allocate Dialog */}
      <Dialog open={showAllocateDialog} onOpenChange={setShowAllocateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Allocate Faculty</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Select Faculty</Label>
              <Select value={formData.faculty_id} onValueChange={(value) => setFormData({ ...formData, faculty_id: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select faculty" />
                </SelectTrigger>
                <SelectContent>
                  {recommendedTrainers.map(trainer => (
                    <SelectItem key={trainer.id} value={trainer.id}>
                      {trainer.name} (Rating: {trainer.rating || 'N/A'})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Type of Training *</Label>
              <Select 
                value={formData.training_type} 
                onValueChange={(value) => setFormData({ ...formData, training_type: value })}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select training type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="technical">Technical</SelectItem>
                  <SelectItem value="aptitude">Aptitude</SelectItem>
                  <SelectItem value="verbal">Verbal</SelectItem>
                  <SelectItem value="softskills">Soft Skills</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Employment Type</Label>
              <Select value={formData.employment_type} onValueChange={(value) => setFormData({ ...formData, employment_type: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="freelancer">Freelancer</SelectItem>
                  <SelectItem value="full_time">Full Time</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowAllocateDialog(false)}>Cancel</Button>
              <Button onClick={handleAllocate} disabled={loading}>
                {loading ? 'Allocating...' : 'Allocate'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Replace Dialog */}
      <Dialog open={showReplaceDialog} onOpenChange={setShowReplaceDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Replace Faculty</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Current Faculty</Label>
              <Input value={selectedAllocation?.faculty_name || ''} disabled />
            </div>
            <div>
              <Label>New Faculty</Label>
              <Select value={formData.faculty_id} onValueChange={(value) => setFormData({ ...formData, faculty_id: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select new faculty" />
                </SelectTrigger>
                <SelectContent>
                  {recommendedTrainers.map(trainer => (
                    <SelectItem key={trainer.id} value={trainer.id}>
                      {trainer.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Reason</Label>
              <Input
                value={formData.reason || ''}
                onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                placeholder="Reason for replacement"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowReplaceDialog(false)}>Cancel</Button>
              <Button onClick={handleReplace} disabled={loading}>
                {loading ? 'Replacing...' : 'Replace'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default FacultyScheduling;

