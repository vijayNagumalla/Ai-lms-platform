import React, { useState, useEffect } from 'react';
import api from '@/services/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Users, Star, TrendingUp, X } from 'lucide-react';
import { toast } from 'react-hot-toast';

const FacultyAllocation = ({ selectedProject }) => {
  const [allocations, setAllocations] = useState([]);
  const [recommendedTrainers, setRecommendedTrainers] = useState([]);
  const [showAllocateDialog, setShowAllocateDialog] = useState(false);
  const [showReplaceDialog, setShowReplaceDialog] = useState(false);
  const [selectedAllocation, setSelectedAllocation] = useState(null);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    faculty_id: '',
    allocated_hours: '',
    hourly_rate: '',
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
    try {
      setLoading(true);
      await api.allocateFaculty(selectedProject.id, formData);
      toast.success('Faculty allocated successfully');
      setShowAllocateDialog(false);
      setFormData({ faculty_id: '', allocated_hours: '', hourly_rate: '', employment_type: 'freelancer' });
      loadAllocations();
    } catch (error) {
      toast.error(error.message || 'Failed to allocate faculty');
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
          <p className="text-gray-500">Please select a project to view faculty allocations</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
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
                      <span className="font-medium">Hours:</span> {allocation.allocated_hours}h
                      <span className="ml-4 font-medium">Rate:</span> ₹{allocation.hourly_rate}/hr
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
              <Label>Allocated Hours</Label>
              <Input
                type="number"
                value={formData.allocated_hours}
                onChange={(e) => setFormData({ ...formData, allocated_hours: e.target.value })}
              />
            </div>
            <div>
              <Label>Hourly Rate</Label>
              <Input
                type="number"
                value={formData.hourly_rate}
                onChange={(e) => setFormData({ ...formData, hourly_rate: e.target.value })}
              />
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

export default FacultyAllocation;

