import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { UserPlus, Loader2 } from 'lucide-react';
import apiService from '@/services/api';

const AddProfileModal = ({ onProfileAdded }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false);
  const [students, setStudents] = useState([]);
  const [platforms, setPlatforms] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const { toast } = useToast();

  // Form data
  const [formData, setFormData] = useState({
    studentSearch: '',
    rollNumber: '',
    email: '',
    leetcode: '',
    codechef: '',
    hackerrank: '',
    hackerearth: '',
    geeksforgeeks: ''
  });

  useEffect(() => {
    if (isOpen) {
      fetchPlatforms();
    }
  }, [isOpen]);

  const fetchPlatforms = async () => {
    try {
      const response = await apiService.get('/coding-profiles/platforms');
      if (response.success) {
        setPlatforms(response.data);
      }
    } catch (error) {
      console.error('Error fetching platforms:', error);
      toast({
        title: "Error",
        description: "Failed to fetch platforms.",
        variant: "destructive",
      });
    }
  };

  const searchStudents = async (searchTerm) => {
    if (!searchTerm || searchTerm.length < 2) {
      setStudents([]);
      return;
    }

    setSearching(true);
    try {
      const response = await apiService.get(`/users/search?q=${encodeURIComponent(searchTerm)}&role=student&limit=10`);
      
      if (response.success) {
        setStudents(response.data);
      } else {
        setStudents([]);
      }
    } catch (error) {
      console.error('Error searching students:', error);
      toast({
        title: "Error",
        description: "Failed to search students.",
        variant: "destructive",
      });
      setStudents([]);
    } finally {
      setSearching(false);
    }
  };

  const handleStudentSelect = (student) => {
    setSelectedStudent(student);
    setFormData(prev => ({
      ...prev,
      rollNumber: student.student_id || '',
      email: student.email || ''
    }));
    setStudents([]);
    setSearchTerm('');
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));

    if (field === 'studentSearch') {
      setSearchTerm(value);
      searchStudents(value);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!selectedStudent) {
      toast({
        title: "Error",
        description: "Please select a student first.",
        variant: "destructive",
      });
      return;
    }

    // Check if at least one platform username is provided
    const platformUsernames = {
      leetcode: formData.leetcode,
      codechef: formData.codechef,
      hackerrank: formData.hackerrank,
      hackerearth: formData.hackerearth,
      geeksforgeeks: formData.geeksforgeeks
    };

    const hasAnyUsername = Object.values(platformUsernames).some(username => username.trim());
    
    if (!hasAnyUsername) {
      toast({
        title: "Error",
        description: "Please provide at least one platform username.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const profilesToAdd = [];
      
      // Prepare profiles for each platform that has a username
      Object.entries(platformUsernames).forEach(([platform, username]) => {
        if (username.trim()) {
          profilesToAdd.push({
            platform,
            username: username.trim()
          });
        }
      });

      // Add each profile
      for (const profile of profilesToAdd) {
        await apiService.post('/coding-profiles/profiles', {
          student_id: selectedStudent.id,
          platform: profile.platform,
          username: profile.username
        });
      }

      toast({
        title: "Success",
        description: `Added ${profilesToAdd.length} profile(s) for ${selectedStudent.name}`,
      });

      // Reset form
      setFormData({
        studentSearch: '',
        rollNumber: '',
        email: '',
        leetcode: '',
        codechef: '',
        hackerrank: '',
        hackerearth: '',
        geeksforgeeks: ''
      });
      setSelectedStudent(null);
      setSearchTerm('');
      setIsOpen(false);
      
      // Notify parent to refresh data
      if (onProfileAdded) {
        onProfileAdded();
      }
    } catch (error) {
      console.error('Error adding profiles:', error);
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to add profiles.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      studentSearch: '',
      rollNumber: '',
      email: '',
      leetcode: '',
      codechef: '',
      hackerrank: '',
      hackerearth: '',
      geeksforgeeks: ''
    });
    setSelectedStudent(null);
    setSearchTerm('');
    setStudents([]);
    setIsOpen(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <UserPlus className="h-4 w-4 mr-2" /> Add Profile
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add Student Coding Profile</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Student Search */}
          <div className="space-y-2">
            <Label htmlFor="studentSearch">Search Student</Label>
            <div className="relative">
              <Input
                id="studentSearch"
                type="text"
                placeholder="Search by name, roll number, or email..."
                value={formData.studentSearch}
                onChange={(e) => handleInputChange('studentSearch', e.target.value)}
                className="w-full"
              />
              {searching && (
                <Loader2 className="absolute right-3 top-3 h-4 w-4 animate-spin" />
              )}
            </div>
            
            {/* Student Results */}
            {students.length > 0 && (
              <div className="border rounded-md max-h-40 overflow-y-auto">
                {students.map((student) => (
                  <div
                    key={student.id}
                    className="p-2 hover:bg-muted cursor-pointer border-b last:border-b-0"
                    onClick={() => handleStudentSelect(student)}
                  >
                    <div className="font-medium">{student.name}</div>
                    <div className="text-sm text-muted-foreground">
                      {student.student_id && `Roll: ${student.student_id}`}
                      {student.student_id && student.email && ' • '}
                      {student.email && `Email: ${student.email}`}
                    </div>
                  </div>
                ))}
              </div>
            )}
            {searchTerm && searchTerm.length >= 2 && students.length === 0 && !searching && (
              <div className="p-2 text-sm text-gray-500 bg-gray-50 rounded-md">
                No students found for "{searchTerm}"
              </div>
            )}
          </div>

          {/* Selected Student Info */}
          {selectedStudent && (
            <div className="p-3 bg-muted rounded-md">
              <div className="font-medium">Selected Student:</div>
              <div className="text-sm text-muted-foreground">
                {selectedStudent.name}
                {selectedStudent.student_id && ` (${selectedStudent.student_id})`}
              </div>
              <div className="text-sm text-muted-foreground">
                {selectedStudent.email}
              </div>
            </div>
          )}

          {/* Platform Usernames */}
          <div className="space-y-4">
            <h3 className="font-medium">Platform Usernames</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="leetcode">LeetCode</Label>
                <Input
                  id="leetcode"
                  type="text"
                  placeholder="Enter LeetCode username"
                  value={formData.leetcode}
                  onChange={(e) => handleInputChange('leetcode', e.target.value)}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="codechef">CodeChef</Label>
                <Input
                  id="codechef"
                  type="text"
                  placeholder="Enter CodeChef username"
                  value={formData.codechef}
                  onChange={(e) => handleInputChange('codechef', e.target.value)}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="hackerrank">HackerRank</Label>
                <Input
                  id="hackerrank"
                  type="text"
                  placeholder="Enter HackerRank username"
                  value={formData.hackerrank}
                  onChange={(e) => handleInputChange('hackerrank', e.target.value)}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="hackerearth">HackerEarth</Label>
                <Input
                  id="hackerearth"
                  type="text"
                  placeholder="Enter HackerEarth username"
                  value={formData.hackerearth}
                  onChange={(e) => handleInputChange('hackerearth', e.target.value)}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="geeksforgeeks">GeeksforGeeks</Label>
                <Input
                  id="geeksforgeeks"
                  type="text"
                  placeholder="Enter GeeksforGeeks username"
                  value={formData.geeksforgeeks}
                  onChange={(e) => handleInputChange('geeksforgeeks', e.target.value)}
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleCancel}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading || !selectedStudent}>
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Adding...
                </>
              ) : (
                'Add Profiles'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddProfileModal;
