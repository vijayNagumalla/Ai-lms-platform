import React, { useState, useEffect } from 'react';
import * as ExcelJS from 'exceljs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { 
  Upload, Download, RefreshCw, Plus, 
  Edit, Trash2, ExternalLink, Users, Trophy, Search, ChevronDown,
  AlertTriangle, CheckCircle, XCircle, FileSpreadsheet, Building, Code, RotateCcw, Loader2
} from 'lucide-react';
import apiService from '@/services/api';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/ui/use-toast';

const CodingProfilesManagementPage = () => {
  const { user: currentUser } = useAuth();
  const [codingProfiles, setCodingProfiles] = useState([]);
  const [platforms, setPlatforms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [refreshProgress, setRefreshProgress] = useState({ 
    current: 0, 
    total: 0, 
    successful: 0, 
    failed: 0, 
    percentage: 0, 
    message: '' 
  });
  const [useHighPerformance, setUseHighPerformance] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingProfile, setEditingProfile] = useState(null);
  const [bulkUploadFile, setBulkUploadFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [showBulkUpload, setShowBulkUpload] = useState(false);
  const [showProfileLinksDialog, setShowProfileLinksDialog] = useState(false);
  const [selectedProfileLinks, setSelectedProfileLinks] = useState([]);
  const [selectedStudentName, setSelectedStudentName] = useState('');
  
  // Enhanced bulk upload state
  const [parsedProfiles, setParsedProfiles] = useState([]);
  const [showParsedData, setShowParsedData] = useState(false);
  const [profileCreationResults, setProfileCreationResults] = useState([]);
  const [showResults, setShowResults] = useState(false);
  const { toast } = useToast();

  // College and Department selection state - REMOVED

  // User search state
  const [users, setUsers] = useState([]);
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

  // Form state
  const [formData, setFormData] = useState({
    userId: '',
    platformId: '',
    username: '',
    profileUrl: ''
  });
  
  // New form structure for multiple platforms
  const [platformRows, setPlatformRows] = useState([
    { platformId: '', username: '', profileUrl: '' }
  ]);
  
  // Add All Platforms state
  const [selectedPlatforms, setSelectedPlatforms] = useState([]);

  // Search state
  const [searchQuery, setSearchQuery] = useState('');

  // Grouping state - Always use college-dept grouping
  const [selectedCollege, setSelectedCollege] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState('');
  const [selectedBatch, setSelectedBatch] = useState('');

  // Colleges, departments, and batches data - extracted from existing profiles
  const [colleges, setColleges] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [batches, setBatches] = useState([]);
  const [collegesLoading, setCollegesLoading] = useState(false);
  const [departmentsLoading, setDepartmentsLoading] = useState(false);
  const [batchesLoading, setBatchesLoading] = useState(false);

  // Extract colleges, departments, and batches from existing profiles and users
  const extractCollegesAndDepartments = (profiles, usersData) => {
    const collegesSet = new Set();
    const departmentsSet = new Set();
    const batchesSet = new Set();

    // Extract from users data (students) - this is the primary source
    if (Array.isArray(usersData) && usersData.length > 0) {
      usersData.forEach(user => {
        // Extract college information from users
        if (user.college_id) {
          // We'll need to get college names from the backend or create a mapping
          // For now, we'll use the college_id as both id and name
          collegesSet.add(JSON.stringify({
            id: user.college_id,
            name: user.college_name || `College ${user.college_id}`
          }));
        }
        
        if (user.department && user.department.trim() !== '') {
          departmentsSet.add(JSON.stringify({
            id: user.department_id || `dept-${user.department}`,
            name: user.department.trim()
          }));
        }
        
        if (user.batch && user.batch.trim() !== '' && user.batch !== 'no-batch') {
          batchesSet.add(JSON.stringify({
            id: user.batch.trim(),
            name: user.batch.trim()
          }));
        }
      });
    }

    // Extract from coding profiles (secondary source)
    if (Array.isArray(profiles) && profiles.length > 0) {
      profiles.forEach(profile => {
        // Only add if not already present from users
        if (profile.college_name && profile.college_name.trim() !== '') {
          collegesSet.add(JSON.stringify({
            id: profile.college_id || `college-${profile.college_name}`,
            name: profile.college_name.trim()
          }));
        }
        if (profile.department_name && profile.department_name.trim() !== '') {
          departmentsSet.add(JSON.stringify({
            id: profile.department_id || `dept-${profile.department_name}`,
            name: profile.department_name.trim()
          }));
        }
        if (profile.batch && profile.batch.trim() !== '') {
          batchesSet.add(JSON.stringify({
            id: profile.batch.trim(),
            name: profile.batch.trim()
          }));
        }
      });
    }

    // Convert sets back to arrays and sort
    const uniqueColleges = Array.from(collegesSet).map(college => JSON.parse(college));
    const uniqueDepartments = Array.from(departmentsSet).map(dept => JSON.parse(dept));
    const uniqueBatches = Array.from(batchesSet).map(batch => JSON.parse(batch));

    // Sort alphabetically
    uniqueColleges.sort((a, b) => a.name.localeCompare(b.name));
    uniqueDepartments.sort((a, b) => a.name.localeCompare(b.name));
    uniqueBatches.sort((a, b) => a.name.localeCompare(b.name));

    setColleges(uniqueColleges);
    setDepartments(uniqueDepartments);
    setBatches(uniqueBatches);

    // If a college is selected, update departments and batches for that college
    if (selectedCollege) {
      loadDepartments(selectedCollege);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Update departments when coding profiles change and a college is selected
  useEffect(() => {
    if (selectedCollege && codingProfiles.length > 0) {
      loadDepartments(selectedCollege);
    }
  }, [codingProfiles, selectedCollege]);

  // Extract colleges and departments when users or profiles change
  useEffect(() => {
    if (users.length > 0 || codingProfiles.length > 0) {
      extractCollegesAndDepartments(codingProfiles, users);
    }
  }, [users, codingProfiles]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest('.user-search-container')) {
        setShowUserDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Ensure we always have the correct platforms
  const getCorrectPlatforms = (apiPlatforms) => {
    const correctPlatformIds = [
      'leetcode-platform',
      'hackerrank-platform', 
      'codechef-platform',
      'geeksforgeeks-platform',
      'atcoder-platform'
    ];
    
    // If we have API platforms, filter them
    if (Array.isArray(apiPlatforms) && apiPlatforms.length > 0) {
      const filtered = apiPlatforms.filter(platform => 
        correctPlatformIds.includes(platform.id) &&
        platform.name !== 'hackerearth' &&
        platform.name !== 'HackerEarth'
      );
      return filtered;
    }
    
    // Fallback to hardcoded platforms
    const fallback = [
      { id: 'leetcode-platform', name: 'leetcode', display_name: 'LeetCode' },
      { id: 'hackerrank-platform', name: 'hackerrank', display_name: 'HackerRank' },
      { id: 'codechef-platform', name: 'codechef', display_name: 'CodeChef' },
      { id: 'geeksforgeeks-platform', name: 'geeksforgeeks', display_name: 'GeeksForGeeks' },
      { id: 'atcoder-platform', name: 'atcoder', display_name: 'AtCoder' }
    ];
    return fallback;
  };

  // Load colleges and departments
  const loadCollegesAndDepartments = async () => {
    // No need to make API calls - data is extracted from existing profiles
    setCollegesLoading(false);
    setDepartmentsLoading(false);
  };

  // Load departments and batches for a specific college from existing profiles and users
  const loadDepartments = async (collegeId) => {
    if (!collegeId) {
      setDepartments([]);
      setBatches([]);
      return;
    }
    
    setDepartmentsLoading(true);
    setBatchesLoading(true);
    
    try {
      const selectedCollege = colleges.find(c => c.id === collegeId);
      const collegeName = selectedCollege?.name;
      
      // Get departments and batches from both coding profiles and users
      const departmentsSet = new Set();
      const batchesSet = new Set();
      
      // Extract from coding profiles
      const collegeProfiles = codingProfiles.filter(profile => {
        // Check by college_id (string comparison)
        if (profile.college_id === collegeId) return true;
        // Check by college_name
        if (profile.college_name === collegeName) return true;
        // Check if college_id is a number and compare as string
        if (profile.college_id && profile.college_id.toString() === collegeId.toString()) return true;
        return false;
      });
      
      // Extract from users (students) who belong to this college
      const collegeUsers = users.filter(user => {
        // Check by college_id (string comparison)
        if (user.college_id === collegeId) return true;
        // Check if college_id is a number and compare as string
        if (user.college_id && user.college_id.toString() === collegeId.toString()) return true;
        return false;
      });
      
      collegeProfiles.forEach(profile => {
        if (profile.department_name && profile.department_name.trim() !== '') {
          departmentsSet.add(JSON.stringify({
            id: profile.department_id || `dept-${profile.department_name}`,
            name: profile.department_name.trim()
          }));
        }
        if (profile.batch && profile.batch.trim() !== '') {
          batchesSet.add(JSON.stringify({
            id: profile.batch.trim(),
            name: profile.batch.trim()
          }));
        }
      });
      
      collegeUsers.forEach(user => {
        if (user.department && user.department.trim() !== '') {
          departmentsSet.add(JSON.stringify({
            id: user.department_id || `dept-${user.department}`,
            name: user.department.trim()
          }));
        }
        if (user.batch && user.batch.trim() !== '' && user.batch !== 'no-batch') {
          batchesSet.add(JSON.stringify({
            id: user.batch.trim(),
            name: user.batch.trim()
          }));
        }
      });
      
      // Convert sets back to arrays
      const uniqueDepartments = Array.from(departmentsSet).map(dept => JSON.parse(dept));
      const uniqueBatches = Array.from(batchesSet).map(batch => JSON.parse(batch));
      
      // Sort departments and batches alphabetically
      uniqueDepartments.sort((a, b) => a.name.localeCompare(b.name));
      uniqueBatches.sort((a, b) => a.name.localeCompare(b.name));
      
      setDepartments(uniqueDepartments);
      setBatches(uniqueBatches);
      
    } catch (error) {
      setDepartments([]);
      setBatches([]);
    } finally {
      setDepartmentsLoading(false);
      setBatchesLoading(false);
    }
  };

  // Handle college selection change
  const handleCollegeChange = (collegeId) => {
    setSelectedCollege(collegeId);
    setSelectedDepartment(''); // Reset department when college changes
    setSelectedBatch(''); // Reset batch when college changes
    
    if (collegeId) {
      loadDepartments(collegeId);
    } else {
      setDepartments([]);
      setBatches([]);
    }
  };

  // Load data function
  const loadData = async () => {
    try {
      setLoading(true);
      
      // Load users first
      try {
        const usersResponse = await apiService.getUsers({ limit: 10000, page: 1 });
        
        if (usersResponse.success) {
          const allUsers = usersResponse.data || [];
          
          // Filter students and normalize their data
          let studentUsers = allUsers.filter(user => 
            user.role === 'student' || 
            user.role === 'Student' || 
            user.role === 'STUDENT' ||
            (user.student_id && user.student_id.trim() !== '')
          );
          
          // Remove duplicates if any
          studentUsers = studentUsers.filter((user, index, self) => 
            index === self.findIndex(u => u.id === user.id)
          );
          
          studentUsers = studentUsers.map(user => ({
            ...user,
            student_id: user.student_id ? user.student_id.trim() : user.student_id,
            email: user.email ? user.email.trim() : user.email
          }));
          
          setUsers(studentUsers);
        } else {
          // Try fallback - load users without parameters
          try {
            const fallbackResponse = await apiService.getUsers();
            if (fallbackResponse.success) {
              const fallbackUsers = fallbackResponse.data || [];
              const fallbackStudentUsers = fallbackUsers.filter(user => user.role === 'student').map(user => ({
                ...user,
                student_id: user.student_id ? user.student_id.trim() : user.student_id,
                email: user.email ? user.email.trim() : user.email
              }));
              setUsers(fallbackStudentUsers);
            }
          } catch (fallbackError) {
            // Fallback user loading failed
          }
        }
      } catch (userError) {
        // Error loading users
      }

      // Load platforms (this should work)
      try {
        const platformsResponse = await apiService.getCodingPlatforms();
        if (platformsResponse.success && platformsResponse.data.length > 0) {
          // Filter out HackerEarth and ensure only correct platforms
          const filteredPlatforms = getCorrectPlatforms(platformsResponse.data);
          setPlatforms(filteredPlatforms);
        } else {
          // If no platforms from API, use fallback
          const fallbackPlatforms = getCorrectPlatforms([]);
          setPlatforms(fallbackPlatforms);
        }
      } catch (platformError) {
        // Use fallback platforms on error
        const fallbackPlatforms = getCorrectPlatforms([]);
        setPlatforms(fallbackPlatforms);
      }

      // Try to load coding profiles (this might fail due to permissions)
      try {
        const profilesResponse = await apiService.getAllCodingProfiles();
        if (profilesResponse.success) {
          setCodingProfiles(profilesResponse.data);
          // Extract colleges and departments from existing profiles and users
          extractCollegesAndDepartments(profilesResponse.data, users);
          
          // Bulk refresh stats for profiles that don't have solved counts
          const profilesNeedingRefresh = profilesResponse.data.filter(profile => 
            profile.platform_id && 
            (!profile.total_solved && !profile.problems_solved && !profile.solved_count)
          );
          
          if (profilesNeedingRefresh.length > 0) {
            // Use the new bulk refresh endpoint for better performance
            setTimeout(async () => {
              try {
                const profileIds = profilesNeedingRefresh.map(profile => profile.id);
                const bulkRefreshResponse = await apiService.bulkRefreshCodingProfiles(profileIds);
                
                if (bulkRefreshResponse.success) {
                  // Refresh data after bulk refresh
                  const updatedProfilesResponse = await apiService.getAllCodingProfiles();
                  if (updatedProfilesResponse.success) {
                    setCodingProfiles(updatedProfilesResponse.data);
                  }
                }
              } catch (error) {
                // Fallback to individual refresh if bulk fails
                try {
                  const bulkRefreshPromises = profilesNeedingRefresh.map(profile => 
                    apiService.fetchCodingProfileData(profile.user_id, profile.platform_id)
                  );
                  await Promise.allSettled(bulkRefreshPromises);
                  
                  const updatedProfilesResponse = await apiService.getAllCodingProfiles();
                  if (updatedProfilesResponse.success) {
                    setCodingProfiles(updatedProfilesResponse.data);
                  }
                } catch (fallbackError) {
                }
              }
            }, 1000); // Wait 1 second before starting background refresh
          }
        }
      } catch (profileError) {
        // Set empty array so the page still works
        setCodingProfiles([]);
      }

      // Load colleges and departments
      await loadCollegesAndDepartments();
      
    } catch (error) {
      // Error loading data
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  // Export coding profiles data
  const handleExportData = async () => {
    try {
      setExporting(true);
      
      // Get current filtered data
      const dataToExport = filteredProfiles;
      
      if (dataToExport.length === 0) {
        toast({
          title: "No Data to Export",
          description: "Please add some coding profiles first.",
          variant: "destructive"
        });
        setExporting(false);
        return;
      }

      // Group profiles by user to match table structure
      const userProfiles = {};
      dataToExport.forEach(profile => {
        if (!userProfiles[profile.user_id]) {
          userProfiles[profile.user_id] = {
            user: users.find(u => u.id === profile.user_id),
            profiles: []
          };
        }
        userProfiles[profile.user_id].profiles.push(profile);
      });

      // Prepare CSV headers matching the table structure
      const headers = [
        'Student Name',
        'Email',
        'Roll Number',
        'College',
        'Department',
        'LeetCode Username',
        'LeetCode Solved',
        'HackerRank Username',
        'HackerRank Solved',
        'CodeChef Username',
        'CodeChef Solved',
        'GeeksForGeeks Username',
        'GeeksForGeeks Solved',
        'AtCoder Username',
        'AtCoder Solved'
      ];

      // Prepare CSV data matching table structure
      const csvData = Object.values(userProfiles).map(({ user, profiles: userProfiles }) => {
        // Get college and department from profile or user object
        const firstProfile = userProfiles[0];
        const collegeName = firstProfile?.college_name || user?.college_name || 'Unknown College';
        const departmentName = firstProfile?.department_name || user?.department_name || 'Unknown Department';
        
        // Find profiles for each platform
        const leetcodeProfile = userProfiles.find(p => 
          p.platform_name?.toLowerCase() === 'leetcode' || 
          p.platform_name?.toLowerCase() === 'leetcod'
        );
        const hackerrankProfile = userProfiles.find(p => 
          p.platform_name?.toLowerCase() === 'hackerrank'
        );
        const codechefProfile = userProfiles.find(p => 
          p.platform_name?.toLowerCase() === 'codechef'
        );
        const geeksforgeeksProfile = userProfiles.find(p => 
          p.platform_name?.toLowerCase() === 'geeksforgeeks'
        );
        const atcoderProfile = userProfiles.find(p => 
          p.platform_name?.toLowerCase() === 'atcoder'
        );

        return [
          user?.name || 'Unknown',
          user?.email || 'N/A',
          user?.student_id || 'N/A',
          collegeName,
          departmentName,
          leetcodeProfile?.username || '',
          leetcodeProfile?.total_solved || leetcodeProfile?.problems_solved || leetcodeProfile?.solved_count || 0,
          hackerrankProfile?.username || '',
          hackerrankProfile?.total_solved || hackerrankProfile?.problems_solved || hackerrankProfile?.solved_count || 0,
          codechefProfile?.username || '',
          codechefProfile?.total_solved || codechefProfile?.problems_solved || codechefProfile?.solved_count || 0,
          geeksforgeeksProfile?.username || '',
          geeksforgeeksProfile?.total_solved || geeksforgeeksProfile?.problems_solved || geeksforgeeksProfile?.solved_count || 0,
          atcoderProfile?.username || '',
          atcoderProfile?.total_solved || atcoderProfile?.problems_solved || atcoderProfile?.solved_count || 0
        ];
      });

      // Combine headers and data
      const csvContent = [headers, ...csvData]
        .map(row => row.map(cell => `"${cell}"`).join(','))
        .join('\n');

      // Create and trigger download
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      
      if (link.download !== undefined) {
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        
        // Generate dynamic filename based on current filters
        const now = new Date();
        const timestamp = now.toISOString().split('T')[0]; // YYYY-MM-DD format
        
        let filename = 'coding_profiles_export';
        
        // Add college name if filter is applied
        if (selectedCollege) {
          const college = colleges.find(c => c.id === selectedCollege);
          const collegeName = college?.name || 'UnknownCollege';
          // Clean college name for filename (remove special characters)
          const cleanCollegeName = collegeName.replace(/[^a-zA-Z0-9]/g, '_');
          filename = cleanCollegeName;
          
          // Add department and/or batch name if filters are applied
          if (selectedDepartment) {
            const department = departments.find(d => d.id === selectedDepartment);
            const departmentName = department?.name || 'UnknownDepartment';
            const cleanDepartmentName = departmentName.replace(/[^a-zA-Z0-9]/g, '_');
            filename += `_${cleanDepartmentName}`;
          }
          
          if (selectedBatch) {
            const batch = batches.find(b => b.id === selectedBatch);
            const batchName = batch?.name || 'UnknownBatch';
            const cleanBatchName = batchName.replace(/[^a-zA-Z0-9]/g, '_');
            filename += `_${cleanBatchName}`;
          }
        }
        
        filename += `-${timestamp}.csv`;
        
        link.setAttribute('download', filename);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        // Success feedback
        toast({
          title: "Export Successful",
          description: `Successfully exported ${Object.keys(userProfiles).length} students with their coding profiles!`,
          variant: "default"
        });
      }
    } catch (error) {
      toast({
        title: "Export Failed",
        description: "Failed to export data. Please try again.",
        variant: "destructive"
      });
    } finally {
      setExporting(false);
    }
  };

  // User search functions
  const handleUserSearch = (query) => {
    setUserSearchQuery(query);
    setShowUserDropdown(true);
  };

  const handleUserSelect = (user) => {
    setSelectedUser(user);
    setFormData({ ...formData, userId: user.id });
    setUserSearchQuery(user.name || user.email);
    setShowUserDropdown(false);
    
    // Auto-populate username with student ID or email for convenience
    const suggestedUsername = user.student_id || user.email.split('@')[0];
    setFormData(prev => ({ ...prev, username: suggestedUsername }));
  };

  const filteredUsers = users.filter(user => 
    user.name?.toLowerCase().includes(userSearchQuery.toLowerCase()) ||
    user.email?.toLowerCase().includes(userSearchQuery.toLowerCase()) ||
    user.student_id?.toLowerCase().includes(userSearchQuery.toLowerCase())
  );

  // Generate profile URL based on platform and username
  const generateProfileUrl = (platformId, username) => {
    if (!platformId || !username) return '';
    
    const platform = platforms.find(p => p.id === platformId);
    if (!platform) return '';
    
    switch (platform.name.toLowerCase()) {
      case 'leetcode':
        return `https://leetcode.com/u/${username}/`;
      case 'hackerrank':
        return `https://www.hackerrank.com/${username}`;

      case 'codechef':
        return `https://www.codechef.com/users/${username}`;
      case 'geeksforgeeks':
        return `https://www.geeksforgeeks.org/user/${username}`;
      case 'atcoder':
        return `https://atcoder.jp/users/${username}`;
      default:
        return '';
    }
  };

  const handleAddProfile = async (e) => {
    e.preventDefault();
    try {
      const response = await apiService.upsertCodingProfile(formData);
      if (response.success) {
        toast({
          title: "Success",
          description: "Profile added successfully",
          variant: "default"
        });
        resetFormState();
        await loadData();
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add profile. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleEditProfile = async (e) => {
    e.preventDefault();
    try {
      const response = await apiService.upsertCodingProfile({
        ...formData,
        userId: editingProfile.user_id,
        platformId: editingProfile.platform_id
      });
      if (response.success) {
        toast({
          title: "Success",
          description: "Profile updated successfully",
          variant: "default"
        });
        resetFormState();
        await loadData();
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update profile. Please try again.",
        variant: "destructive"
      });
    }
  };

  // Function to handle edit button click
  const handleEditClick = (profile) => {
    setEditingProfile(profile);
    
    // Find the user data to populate the user search
    const user = users.find(u => u.id === profile.user_id);
    if (user) {
      setSelectedUser(user);
      setUserSearchQuery(user.name || user.email);
    }
    
    // Populate form data with existing profile data
    const formDataToSet = {
      userId: profile.user_id,
      platformId: profile.platform_id,
      username: profile.username,
      profileUrl: profile.profile_url || ''
    };
    setFormData(formDataToSet);
  };

  // Function to handle delete button click
  const handleDeleteClick = (profile) => {
    setDeleteConfirm(profile);
  };

  // Function to confirm delete
  const handleConfirmDelete = async () => {
    if (!deleteConfirm) return;
    
    try {
      const response = await apiService.deleteCodingProfile(deleteConfirm.id);
      if (response.success) {
        setDeleteConfirm(null);
        await loadData();
      }
    } catch (error) {
      // Error deleting profile
    }
  };

  // Function to reset form state
  const resetFormState = () => {
    setShowAddForm(false);
    setEditingProfile(null);
    setFormData({ userId: '', platformId: '', username: '', profileUrl: '' });
    setPlatformRows([{ platformId: '', username: '', profileUrl: '' }]);
    setSelectedPlatforms([]);
    setUserSearchQuery('');
    setSelectedUser(null);
  };
  
  // Handle platform checkbox changes
  const handlePlatformCheckboxChange = (platformId, isChecked) => {
    if (isChecked) {
      setSelectedPlatforms(prev => [...prev, platformId]);
    } else {
      setSelectedPlatforms(prev => prev.filter(id => id !== platformId));
    }
  };
  
  // Handle adding all selected platforms
  const handleAddAllPlatforms = async () => {
    if (!formData.userId || !formData.username || selectedPlatforms.length === 0) {
      toast({
        title: "Error",
        description: "Please select a student, enter username, and select platforms",
        variant: "destructive"
      });
      return;
    }
    
    try {
      const addPromises = selectedPlatforms.map(platformId => {
        const profileUrl = generateProfileUrl(platformId, formData.username);
        return apiService.upsertCodingProfile({
          userId: formData.userId,
          username: formData.username,
          platformId: platformId,
          profileUrl: profileUrl
        });
      });
      
      await Promise.allSettled(addPromises);
      
      toast({
        title: "Success",
        description: `Successfully added ${selectedPlatforms.length} platform profiles`,
        variant: "default"
      });
      
      // Reset form and refresh data
      resetFormState();
      await loadData();
      
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add some platform profiles. Please try again.",
        variant: "destructive"
      });
    }
  };
  
  // Handle platform row changes
  const handlePlatformRowChange = (index, field, value) => {
    const newRows = [...platformRows];
    newRows[index][field] = value;
    
    // Auto-generate profile URL when platform and username are set
    if (field === 'platformId' || field === 'username') {
      if (newRows[index].platformId && newRows[index].username) {
        newRows[index].profileUrl = generateProfileUrl(newRows[index].platformId, newRows[index].username);
      }
    }
    
    setPlatformRows(newRows);
  };
  
  // Add new platform row
  const addPlatformRow = () => {
    setPlatformRows([...platformRows, { platformId: '', username: '', profileUrl: '' }]);
  };
  
  // Remove platform row
  const removePlatformRow = (index) => {
    if (platformRows.length > 1) {
      const newRows = platformRows.filter((_, i) => i !== index);
      setPlatformRows(newRows);
    }
  };
  
  // Handle adding all platform rows
  const handleAddAllPlatformRows = async () => {
    if (!formData.userId) {
      toast({
        title: "Error",
        description: "Please select a student first",
        variant: "destructive"
      });
      return;
    }
    
    // Validate all rows have required data
    const validRows = platformRows.filter(row => row.platformId && row.username);
    if (validRows.length === 0) {
      toast({
        title: "Error",
        description: "Please fill in at least one platform and username",
        variant: "destructive"
      });
      return;
    }
    
    try {
      const addPromises = validRows.map(row => {
        return apiService.upsertCodingProfile({
          userId: formData.userId,
          platformId: row.platformId,
          username: row.username,
          profileUrl: row.profileUrl
        });
      });
      
      await Promise.allSettled(addPromises);
      
      toast({
        title: "Success",
        description: `Successfully added ${validRows.length} platform profiles`,
        variant: "default"
      });
      
      // Reset form and refresh data
      resetFormState();
      await loadData();
      
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add some platform profiles. Please try again.",
        variant: "destructive"
      });
    }
  };

  // Function to handle add profile button click
  const handleAddClick = () => {
    resetFormState();
    setShowAddForm(true);
  };

  const parseExcelFile = async (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const workbook = new ExcelJS.Workbook();
          await workbook.xlsx.load(e.target.result);
          const worksheet = workbook.getWorksheet(1);
          

          
          const profiles = [];
          let totalRows = 0;
          let processedRows = 0;
          let skippedRows = 0;
          
          // Helper function to safely extract cell value
          const getCellValue = (cell) => {
            if (!cell) return '';
            
            // Handle rich text objects
            if (cell.richText && Array.isArray(cell.richText)) {
              return cell.richText.map(rt => rt.text).join('');
            }
            
            // Handle hyperlinks
            if (cell.hyperlink) {
              return cell.hyperlink.text || cell.hyperlink.address || '';
            }
            
            // Handle formula results
            if (cell.result) {
              return String(cell.result);
            }
            
            // Handle regular values
            if (cell.value !== null && cell.value !== undefined) {
              return String(cell.value);
            }
            
            return '';
          };
          
          // Helper function to check if a value is effectively empty
          const isEmptyValue = (value) => {
            if (!value) return true;
            const trimmed = String(value).trim();
            return trimmed === '' || trimmed === 'undefined' || trimmed === 'null' || trimmed === 'UNDEFINED' || trimmed === 'NULL';
          };

          // Helper function to validate profile URL
          const validateProfileUrl = (url, platformName) => {
            if (!url || !url.trim()) return { isValid: false, reason: 'No URL provided' };
            
            const trimmedUrl = url.trim();
            
            // Basic URL format validation
            try {
              new URL(trimmedUrl);
            } catch (e) {
              return { isValid: false, reason: 'Invalid URL format' };
            }
            
            switch (platformName) {
              case 'LeetCode':
                if (!trimmedUrl.includes('leetcode.com') && !trimmedUrl.includes('leetcode.cn')) {
                  return { isValid: false, reason: 'Invalid LeetCode URL' };
                }
                // Check if it's a user profile URL
                if (!trimmedUrl.includes('/u/') && !trimmedUrl.includes('/profile/')) {
                  return { isValid: false, reason: 'Not a LeetCode user profile URL' };
                }
                break;
              case 'HackerRank':
                if (!trimmedUrl.includes('hackerrank.com')) {
                  return { isValid: false, reason: 'Invalid HackerRank URL' };
                }
                // Check if it's a user profile URL
                if (!trimmedUrl.match(/\/[^\/]+$/) || trimmedUrl.endsWith('/')) {
                  return { isValid: false, reason: 'Not a HackerRank user profile URL' };
                }
                break;
              case 'CodeChef':
                if (!trimmedUrl.includes('codechef.com')) {
                  return { isValid: false, reason: 'Invalid CodeChef URL' };
                }
                // Check if it's a user profile URL
                if (!trimmedUrl.includes('/users/')) {
                  return { isValid: false, reason: 'Not a CodeChef user profile URL' };
                }
                break;
              default:
                return { isValid: false, reason: 'Unknown platform' };
            }
            
            return { isValid: true, reason: 'Valid URL' };
          };
          
          let rowCount = 0;
          let headerRowFound = false;
          worksheet.eachRow((row, rowNumber) => {
            totalRows++;
            
            // Extract cell values first and normalize them
            const rollNumber = getCellValue(row.getCell(2)).trim().toUpperCase(); // Column B: Roll Number - convert to uppercase
            const email = getCellValue(row.getCell(3)).trim().toLowerCase(); // Column C: Email - convert to lowercase
            const leetcodeUsername = getCellValue(row.getCell(4)).trim(); // Column D: LeetCode Username
            const hackerrankUsername = getCellValue(row.getCell(5)).trim(); // Column E: HackerRank Username
            const codechefUsername = getCellValue(row.getCell(6)).trim(); // Column F: CodeChef Username
            const geeksforgeeksUsername = getCellValue(row.getCell(7)).trim(); // Column G: GeeksForGeeks Username
            

            
            // Detect header row by looking for specific keywords
            if (!headerRowFound) {
              const firstCell = getCellValue(row.getCell(1));
              if (firstCell.toLowerCase().includes('sno') || firstCell.toLowerCase().includes('serial')) {
                headerRowFound = true;
                return; // Skip header row
              }
            }
            
                        // Check if we have any data in this row (usernames or identifiers)
            const hasUsernames = !isEmptyValue(leetcodeUsername) || !isEmptyValue(hackerrankUsername) || !isEmptyValue(codechefUsername) || !isEmptyValue(geeksforgeeksUsername);
            const hasIdentifiers = !isEmptyValue(rollNumber) || !isEmptyValue(email);
            
            // Skip completely empty rows
            if (!hasUsernames && !hasIdentifiers) {
              return;
            }
            
            if (hasIdentifiers && hasUsernames) {
                processedRows++;
                // Find student by roll number or email
                let student = null;
                if (!isEmptyValue(rollNumber)) {
                  // Try exact match with normalized roll number (already uppercase)
                  student = users.find(user => user.student_id && user.student_id.trim().toUpperCase() === rollNumber);
                }
                if (!student && !isEmptyValue(email)) {
                  // Try exact match with normalized email (already lowercase)
                  student = users.find(user => user.email && user.email.trim().toLowerCase() === email);
                }
              if (student) {
                // Process each platform - auto-generate all profile links from usernames
                const platforms = [
                  { 
                    username: leetcodeUsername, 
                    platformId: 'leetcode-platform', 
                    platformName: 'LeetCode' 
                  },
                  { 
                    username: hackerrankUsername, 
                    platformId: 'hackerrank-platform', 
                    platformName: 'HackerRank' 
                  },
                  { 
                    username: codechefUsername, 
                    platformId: 'codechef-platform', 
                    platformName: 'CodeChef' 
                  },
                  { 
                    username: geeksforgeeksUsername, 
                    platformId: 'geeksforgeeks-platform', 
                    platformName: 'GeeksForGeeks' 
                  }
                ];
                
                platforms.forEach(platform => {
                  if (!isEmptyValue(platform.username)) {
                    // Auto-generate profile URL from username
                    const autoGeneratedLink = generateProfileUrl(platform.platformId, platform.username.trim());
                    
                    profiles.push({
                      userId: student.id,
                      platformId: platform.platformId,
                      username: platform.username.trim(),
                      profileUrl: autoGeneratedLink,
                      studentName: student.name,
                      studentEmail: student.email,
                      rollNumber: rollNumber,
                      platformName: platform.platformName,
                      isValid: true,
                      validationReason: 'Auto-generated from username'
                    });
                  }
                });
              } else {
                skippedRows++;
              }
            }
          });
          
          resolve(profiles);
        } catch (error) {
          reject(error);
        }
      };
      reader.readAsArrayBuffer(file);
    });
  };

  const handleBulkUpload = async () => {
    if (!bulkUploadFile) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please select a file to upload"
      });
      return;
    }

    try {
      setUploading(true);
      
      // Check if users are loaded
      if (users.length === 0) {
        toast({
          variant: "destructive",
          title: "Error",
          description: "No users loaded. Please refresh the page and try again."
        });
        setUploading(false);
        return;
      }
      
      // Parse the Excel file
      const profiles = await parseExcelFile(bulkUploadFile);
      
      if (profiles.length === 0) {
        toast({
          variant: "destructive",
          title: "Error",
          description: "No profiles could be created. Check the console for detailed debugging information. Common issues: 1) Roll numbers/emails don't match users in system, 2) Excel format is incorrect, 3) All rows are empty."
        });
        return;
      }

      // Store parsed profiles and show the data
      setParsedProfiles(profiles);
      setShowParsedData(true);
      
      // All profiles are valid since we auto-generate URLs
      const validProfiles = profiles.filter(p => p.isValid);
      
      let message = `Found ${profiles.length} profiles in the file. `;
      message += `All profiles with usernames will be created with auto-generated profile links.`;
      
      toast({
        title: "File Parsed Successfully",
        description: message
      });
      
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to parse file"
      });
    } finally {
      setUploading(false);
    }
  };

  const processBulkProfiles = async (profiles) => {
    // All profiles are valid since we auto-generate URLs
    if (profiles.length === 0) {
      throw new Error('No profiles to create');
    }
    
    try {
      // Send all profiles at once
      const response = await apiService.bulkUploadCodingProfiles(profiles);
      
      if (response.success) {
        // Create results array with success for all profiles
        const results = profiles.map(profile => {
          // Find the corresponding result from the backend response
          const backendResult = response.results?.find(r => 
            r.profile && r.profile.userId === profile.userId && 
            r.profile.platformId === profile.platformId
          );
          
          if (backendResult && backendResult.success) {
            return { success: true, profile, data: backendResult.data };
          } else {
            return { 
              success: false, 
              profile, 
              error: backendResult?.error || 'Profile creation failed' 
            };
          }
        });
        
        return results;
      } else {
        // If bulk upload fails, mark all profiles as failed
        return profiles.map(profile => ({
          success: false,
          profile,
          error: response.message || 'Bulk upload failed'
        }));
      }
    } catch (error) {
      // If there's an error, mark all profiles as failed
      return profiles.map(profile => ({
        success: false,
        profile,
        error: error.message || 'Unknown error'
      }));
    }
  };

  const handleCreateProfiles = async () => {
    if (parsedProfiles.length === 0) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "No profiles to create"
      });
      return;
    }

    // All profiles are valid since we auto-generate URLs
    if (parsedProfiles.length === 0) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "No profiles to create."
      });
      return;
    }

    try {
      setUploading(true);
      
      // Process profiles
      const results = await processBulkProfiles(parsedProfiles);
      
      // Store results and show them
      setProfileCreationResults(results);
      setShowResults(true);
      
      // Show summary toast
      const successCount = results.filter(r => r.success).length;
      const errorCount = results.filter(r => !r.success).length;
      
      let message = `Successfully created ${successCount} profiles`;
      if (errorCount > 0) {
        message += `. ${errorCount} profiles failed to create.`;
      }
        
      toast({
        title: "Profiles Created",
        description: message
      });
      
      // Refresh data
      await loadData();
      
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to create profiles"
      });
    } finally {
      setUploading(false);
    }
  };

  const handleResetAndUpload = () => {
    setParsedProfiles([]);
    setShowParsedData(false);
    setBulkUploadFile(null);
    setProfileCreationResults([]);
    setShowResults(false);
    // Also reset the file input
    const fileInput = document.querySelector('input[type="file"]');
    if (fileInput) {
      fileInput.value = '';
    }
  };

  const downloadExcelTemplate = async () => {
    try {
      // Create workbook and worksheet
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Coding Profiles');
      
      // Add headers row
      const headers = ['Sno', 'Roll Number', 'Email', 'LeetCode Username', 'HackerRank Username', 'CodeChef Username', 'GeeksForGeeks Username'];
      const headerRow = worksheet.addRow(headers);
      
      // Style headers - make them bold and with background color
      headerRow.eachCell((cell, colNumber) => {
        cell.font = { bold: true, size: 12 };
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFE0E0E0' }
        };
        cell.alignment = { horizontal: 'center', vertical: 'middle' };
        cell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' }
        };
      });
      
      // Add sample data rows
      const sampleData = [
        ['1', '2023001', 'john.doe@example.com', 'john_doe', 'john_doe', 'john_doe', 'john_doe'],
        ['2', '2023002', 'jane.smith@example.com', 'jane_smith', '', 'jane_smith', 'jane_smith'],
        ['3', '2023003', 'bob.wilson@example.com', '', 'bob_wilson', '', 'bob_wilson']
      ];
      
      sampleData.forEach(rowData => {
        const row = worksheet.addRow(rowData);
        row.eachCell((cell, colNumber) => {
          cell.border = {
            top: { style: 'thin' },
            left: { style: 'thin' },
            bottom: { style: 'thin' },
            right: { style: 'thin' }
          };
        });
      });
      
      // Set column widths
      worksheet.getColumn(1).width = 8;   // Sno
      worksheet.getColumn(2).width = 20;  // Roll Number
      worksheet.getColumn(3).width = 30;  // Email
      worksheet.getColumn(4).width = 20;  // LeetCode Username
      worksheet.getColumn(5).width = 20;  // HackerRank Username
      worksheet.getColumn(6).width = 20;  // CodeChef Username
      worksheet.getColumn(7).width = 20;  // GeeksForGeeks Username
      
      // Generate and download file
      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'coding_profiles_template.xlsx');
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
      toast({
        title: "Success",
        description: "Coding profiles template downloaded successfully"
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to download template"
      });
    }
  };

  // Filter and group coding profiles
  const filteredProfiles = codingProfiles.filter(profile => {
    const searchLower = searchQuery.toLowerCase();
    
    // Text search filter
    const matchesSearch = (
      profile.user_name?.toLowerCase().includes(searchLower) ||
      profile.user_email?.toLowerCase().includes(searchLower) ||
      profile.username?.toLowerCase().includes(searchLower) ||
      profile.platform_name?.toLowerCase().includes(searchLower) ||
      profile.student_id?.toLowerCase().includes(searchLower)
    );
    
    // College filter - handle both string and number comparisons
    const matchesCollege = !selectedCollege || 
      profile.college_id === selectedCollege || 
      profile.college_id?.toString() === selectedCollege?.toString() ||
      profile.college_name === colleges.find(c => c.id === selectedCollege)?.name ||
      colleges.find(c => c.id === selectedCollege)?.name === profile.college_name;
    
    // Department filter - handle both string and number comparisons
    const matchesDepartment = !selectedDepartment || 
      profile.department_id === selectedDepartment || 
      profile.department_id?.toString() === selectedDepartment?.toString() ||
      profile.department_name === departments.find(d => d.id === selectedDepartment)?.name;
    
    // Batch filter
    const matchesBatch = !selectedBatch || 
      profile.batch === selectedBatch || 
      profile.batch?.toString() === selectedBatch?.toString();
    
    return matchesSearch && matchesCollege && matchesDepartment && matchesBatch;
  });

  const groupedProfiles = () => {
    if (filteredProfiles.length === 0) return {};

    // Always use college-dept grouping method
    if (!selectedCollege) {
      // If no college selected, group by college first
      return filteredProfiles.reduce((groups, profile) => {
        const collegeName = profile.college_name && profile.college_name.trim() !== '' ? profile.college_name : 'No College Assigned';
        if (!groups[collegeName]) {
          groups[collegeName] = [];
        }
        groups[collegeName].push(profile);
        return groups;
      }, {});
    } else if (!selectedDepartment && !selectedBatch) {
      // If college selected but no department or batch, show departments for that college
      const collegeProfiles = filteredProfiles.filter(profile => 
        profile.college_id === selectedCollege || 
        profile.college_id?.toString() === selectedCollege?.toString() ||
        profile.college_name === colleges.find(c => c.id === selectedCollege)?.name
      );
      return collegeProfiles.reduce((groups, profile) => {
        const deptName = profile.department_name && profile.department_name.trim() !== '' ? profile.department_name : 'No Department Assigned';
        if (!groups[deptName]) {
          groups[deptName] = [];
        }
        groups[deptName].push(profile);
        return groups;
      }, {});
    } else if (selectedDepartment && !selectedBatch) {
      // Both college and department selected, show profiles for that specific combination
      const filteredProfilesByDept = filteredProfiles.filter(profile => 
        (profile.college_id === selectedCollege || 
         profile.college_id?.toString() === selectedCollege?.toString() ||
         profile.college_name === colleges.find(c => c.id === selectedCollege)?.name) &&
        (profile.department_id === selectedDepartment || 
         profile.department_id?.toString() === selectedDepartment?.toString() ||
         profile.department_name === departments.find(d => d.id === selectedDepartment)?.name)
      );
      return {
        [`${colleges.find(c => c.id === selectedCollege)?.name || 'Unknown College'} - ${departments.find(d => d.id === selectedDepartment)?.name || 'Unknown Department'}`]: filteredProfilesByDept
      };
    } else if (selectedBatch && !selectedDepartment) {
      // College and batch selected, show profiles for that specific combination
      const filteredProfilesByBatch = filteredProfiles.filter(profile => 
        (profile.college_id === selectedCollege || 
         profile.college_id?.toString() === selectedCollege?.toString() ||
         profile.college_name === colleges.find(c => c.id === selectedCollege)?.name) &&
        (profile.batch === selectedBatch || 
         profile.batch?.toString() === selectedBatch?.toString())
      );
      return {
        [`${colleges.find(c => c.id === selectedCollege)?.name || 'Unknown College'} - Batch ${selectedBatch}`]: filteredProfilesByBatch
      };
    } else {
      // All three selected, show profiles for that specific combination
      const filteredProfilesByAll = filteredProfiles.filter(profile => 
        (profile.college_id === selectedCollege || 
         profile.college_id?.toString() === selectedCollege?.toString() ||
         profile.college_name === colleges.find(c => c.id === selectedCollege)?.name) &&
        (profile.department_id === selectedDepartment || 
         profile.department_id?.toString() === selectedDepartment?.toString() ||
         profile.department_name === departments.find(d => d.id === selectedDepartment)?.name) &&
        (profile.batch === selectedBatch || 
         profile.batch?.toString() === selectedBatch?.toString())
      );
      return {
        [`${colleges.find(c => c.id === selectedCollege)?.name || 'Unknown College'} - ${departments.find(d => d.id === selectedDepartment)?.name || 'Unknown Department'} - Batch ${selectedBatch}`]: filteredProfilesByAll
      };
    }
  };



  if (loading) {
    return (
      <div className="min-h-screen bg-background p-4">
        <div className="w-full">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-primary mx-auto"></div>
            <p className="mt-4 text-muted-foreground text-lg">Loading coding profiles management...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="w-full space-y-6">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-muted via-muted/50 to-muted rounded-2xl p-6 text-card-foreground shadow-lg border border-border">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold mb-2">Coding Profiles Management</h1>
              <p className="text-xl text-muted-foreground">Manage student coding platform profiles and progress tracking</p>
            </div>
            <div className="flex items-center space-x-4">
              <Button 
                onClick={async () => {
                  try {
                    setRefreshing(true);
                    setRefreshProgress({ 
                      current: 0, 
                      total: 0, 
                      successful: 0, 
                      failed: 0, 
                      percentage: 0, 
                      message: 'Preparing refresh...' 
                    });
                    
                    // Fetch stats for all profiles
                    const profilesToRefresh = codingProfiles.filter(profile => profile.platform_id);
                    
                    if (profilesToRefresh.length > 0) {
                      const profileIds = profilesToRefresh.map(profile => profile.id);
                      const maxConcurrency = useHighPerformance ? 100 : 10;
                      
                      if (useHighPerformance) {
                        // Use streaming refresh for real-time updates
                        setRefreshProgress({ 
                          current: 0, 
                          total: profilesToRefresh.length, 
                          successful: 0, 
                          failed: 0, 
                          percentage: 0, 
                          message: `Starting high-performance refresh of ${profilesToRefresh.length} profiles...` 
                        });
                        
                        const result = await apiService.streamingBulkRefresh(
                          profileIds, 
                          maxConcurrency,
                          (progress) => {
                            setRefreshProgress({
                              current: progress.completed,
                              total: progress.total,
                              successful: progress.successful,
                              failed: progress.failed,
                              percentage: progress.percentage,
                              message: `Processing... ${progress.completed}/${progress.total} (${progress.percentage}%) - ${progress.successful} successful, ${progress.failed} failed`
                            });
                          }
                        );
                        
                        toast({
                          title: "Stats Updated",
                          description: `Successfully refreshed ${result.summary.successful} profiles. ${result.summary.failed} failed.`,
                          variant: result.summary.failed > 0 ? "destructive" : "default"
                        });
                      } else {
                        // Use regular bulk refresh
                        setRefreshProgress({ 
                          current: 0, 
                          total: profilesToRefresh.length, 
                          successful: 0, 
                          failed: 0, 
                          percentage: 0, 
                          message: `Refreshing ${profilesToRefresh.length} profiles...` 
                        });
                        
                        const bulkRefreshResponse = await apiService.bulkRefreshCodingProfiles(profileIds, maxConcurrency);
                        
                        if (bulkRefreshResponse.success) {
                          const { summary, results } = bulkRefreshResponse;
                          setRefreshProgress({ 
                            current: summary.total, 
                            total: summary.total, 
                            successful: summary.successful, 
                            failed: summary.failed, 
                            percentage: 100, 
                            message: `Completed: ${summary.successful} successful, ${summary.failed} failed` 
                          });
                          
                          toast({
                            title: "Stats Updated",
                            description: `Successfully refreshed ${summary.successful} profiles. ${summary.failed} failed.`,
                            variant: summary.failed > 0 ? "destructive" : "default"
                          });
                        } else {
                          throw new Error(bulkRefreshResponse.message || 'Bulk refresh failed');
                        }
                      }
                    } else {
                      setRefreshProgress({ 
                        current: 0, 
                        total: 0, 
                        successful: 0, 
                        failed: 0, 
                        percentage: 0, 
                        message: 'No profiles to refresh' 
                      });
                    }
                    
                    // Refresh the data
                    setRefreshProgress({ 
                      current: 0, 
                      total: 0, 
                      successful: 0, 
                      failed: 0, 
                      percentage: 0, 
                      message: 'Loading updated data...' 
                    });
                    await loadData();
                  } catch (error) {
                    toast({
                      title: "Refresh Failed",
                      description: "Failed to refresh profiles. Please try again.",
                      variant: "destructive"
                    });
                  } finally {
                    setRefreshing(false);
                    setRefreshProgress({ 
                      current: 0, 
                      total: 0, 
                      successful: 0, 
                      failed: 0, 
                      percentage: 0, 
                      message: '' 
                    });
                  }
                }} 
                disabled={refreshing} 
                variant="outline"
                className="bg-green-600 hover:bg-green-700 text-white border-green-600"
              >
                {refreshing ? (
                  <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                ) : (
                  <RefreshCw className="h-5 w-5 mr-2" />
                )}
                Refresh All Data
              </Button>
              
              {/* Progress indicator */}
              {refreshing && refreshProgress.total > 0 && (
                <div className="flex flex-col space-y-2 text-sm text-muted-foreground">
                  <div className="flex items-center space-x-2">
                    <div className="w-48 bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-green-600 h-2 rounded-full transition-all duration-300"
                        style={{ 
                          width: `${refreshProgress.percentage || 0}%` 
                        }}
                      ></div>
                    </div>
                    <span className="font-medium">{refreshProgress.percentage || 0}%</span>
                  </div>
                  <div className="flex items-center space-x-4 text-xs">
                    <span className="text-green-600">✓ {refreshProgress.successful || 0} successful</span>
                    <span className="text-red-600">✗ {refreshProgress.failed || 0} failed</span>
                    <span className="text-blue-600">{refreshProgress.current || 0}/{refreshProgress.total || 0} processed</span>
                  </div>
                  <div className="text-xs text-gray-500">{refreshProgress.message}</div>
                </div>
              )}
              
              {/* Performance mode toggle */}
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="highPerformance"
                  checked={useHighPerformance}
                  onChange={(e) => setUseHighPerformance(e.target.checked)}
                  className="rounded"
                />
                <label htmlFor="highPerformance" className="text-sm text-muted-foreground">
                  High Performance Mode (100 concurrent)
                </label>
              </div>

              <Button onClick={handleExportData} disabled={exporting} variant="outline" className="bg-blue-600 hover:bg-blue-700 text-white border-blue-600">
                <Download className={`h-5 w-5 mr-2 ${exporting ? 'animate-pulse' : ''}`} />
                {exporting ? 'Exporting...' : 'Export Data'}
              </Button>
              <Button onClick={handleAddClick} className="bg-primary hover:bg-primary/90">
                <Plus className="h-5 w-5 mr-2" />
                Add Profile
              </Button>
              <Button onClick={() => setShowBulkUpload(true)} variant="outline" className="bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-600">
                <Upload className="h-5 w-5 mr-2" />
                Bulk Upload
              </Button>
            </div>
          </div>
        </div>

                {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-4">
          <Card className="bg-card backdrop-blur-sm border-0 shadow-lg border border-border lg:col-span-2">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-muted-foreground text-sm font-medium">Total Students</p>
                  <p className="text-2xl font-bold text-card-foreground">{new Set(codingProfiles.map(p => p.user_id)).size}</p>
                </div>
                <Users className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card backdrop-blur-sm border-0 shadow-lg border border-border lg:col-span-2">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-muted-foreground text-sm font-medium">Active Platforms</p>
                  <p className="text-2xl font-bold text-card-foreground">{platforms.length}</p>
                </div>
                <Users className="h-8 w-8 text-emerald-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card backdrop-blur-sm border-0 shadow-lg border border-border lg:col-span-6">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-muted-foreground text-sm font-medium">Platform Breakdown</p>
                  <div className="grid grid-cols-5 gap-2 mt-2">
                    <div className="text-center p-2 bg-blue-50 rounded border border-blue-200">
                      <div className="text-sm font-semibold text-blue-800">{codingProfiles.filter(p => p.platform_id === 'leetcode-platform').length}</div>
                      <div className="text-xs text-blue-600">LeetCode</div>
                    </div>
                    <div className="text-center p-2 bg-green-50 rounded border border-green-200">
                      <div className="text-sm font-semibold text-green-800">{codingProfiles.filter(p => p.platform_id === 'hackerrank-platform').length}</div>
                      <div className="text-xs text-green-600">HackerRank</div>
                    </div>
                    <div className="text-center p-2 bg-orange-50 rounded border border-orange-200">
                      <div className="text-xs font-semibold text-orange-800">{codingProfiles.filter(p => p.platform_id === 'codechef-platform').length}</div>
                      <div className="text-xs text-orange-600">CodeChef</div>
                    </div>
                    <div className="text-center p-2 bg-purple-50 rounded border border-purple-200">
                      <div className="text-xs font-semibold text-purple-800">{codingProfiles.filter(p => p.platform_id === 'geeksforgeeks-platform').length}</div>
                      <div className="text-xs text-purple-600">GeeksForGeeks</div>
                    </div>
                    <div className="text-center p-2 bg-red-50 rounded border border-red-200">
                      <div className="text-xs font-semibold text-red-800">{codingProfiles.filter(p => p.platform_id === 'atcoder-platform').length}</div>
                      <div className="text-xs text-red-600">AtCoder</div>
                    </div>
                  </div>
                </div>
                <Code className="h-8 w-8 text-orange-600 ml-2" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card backdrop-blur-sm border-0 shadow-lg border border-border lg:col-span-2">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-muted-foreground text-sm font-medium">Active Profiles</p>
                  <p className="text-2xl font-bold text-card-foreground">
                    {codingProfiles.filter(p => p.is_active).length}
                  </p>
                </div>
                <Users className="h-8 w-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        



        {/* Add/Edit Profile Form */}
        {(showAddForm || editingProfile) && (
          <Card className="bg-card backdrop-blur-sm border-0 shadow-lg border border-border">
            <CardHeader className="bg-muted text-card-foreground rounded-t-lg border-b border-border">
              <CardTitle className="flex items-center space-x-3">
                <Edit className="h-6 w-6 text-muted-foreground" />
                <span className="text-xl">
                  {editingProfile ? 'Edit Profile' : 'Add New Profile'}
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <form onSubmit={editingProfile ? handleEditProfile : handleAddAllPlatformRows} className="space-y-4">


                {/* Student Selection */}
                <div>
                  <Label htmlFor="userSearch">Select Student</Label>
                  <div className="relative">
                    <Input
                      id="userSearch"
                      value={userSearchQuery}
                      onChange={(e) => handleUserSearch(e.target.value)}
                      onFocus={() => setShowUserDropdown(true)}
                      placeholder="Search by name, email, or roll number"
                      required
                      className="pr-10"
                    />
                    <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    
                    {/* User Dropdown */}
                    {showUserDropdown && (
                      <div className="absolute z-50 w-full mt-1 bg-popover border border-border rounded-md shadow-lg max-h-60 overflow-y-auto">
                        {filteredUsers.length > 0 ? (
                          filteredUsers.map((user) => (
                            <div
                              key={user.id}
                              onClick={() => handleUserSelect(user)}
                              className="px-4 py-2 hover:bg-muted cursor-pointer border-b border-border last:border-b-0"
                            >
                              <div className="font-medium text-popover-foreground">{user.name || 'No Name'}</div>
                              <div className="text-sm text-muted-foreground">{user.email}</div>
                              {user.student_id && (
                                <div className="text-xs text-muted-foreground">ID: {user.student_id}</div>
                              )}
                            </div>
                          ))
                        ) : (
                          <div className="px-4 py-2 text-muted-foreground text-center">
                            {userSearchQuery ? 'No students found' : 'Start typing to search...'}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Platform Rows */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label>Platform Profiles</Label>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={addPlatformRow}
                      className="text-xs"
                    >
                      + Add Platform
                    </Button>
                  </div>
                  
                  {platformRows.map((row, index) => (
                    <div key={index} className="grid grid-cols-1 md:grid-cols-3 gap-3 p-4 border border-input rounded-lg bg-muted/30">
                      {/* Platform Dropdown */}
                      <div>
                        <Label className="text-xs">Platform</Label>
                        <select
                          value={row.platformId}
                          onChange={(e) => handlePlatformRowChange(index, 'platformId', e.target.value)}
                          className="w-full p-2 border border-input rounded-md bg-background text-foreground text-sm"
                          required
                        >
                          <option value="">Select platform</option>
                          {getCorrectPlatforms(platforms).map(platform => (
                            <option key={platform.id} value={platform.id}>
                              {platform.display_name || platform.name}
                            </option>
                          ))}
                        </select>
                      </div>
                      
                      {/* Username */}
                      <div>
                        <Label className="text-xs">Username</Label>
                        <Input
                          value={row.username}
                          onChange={(e) => handlePlatformRowChange(index, 'username', e.target.value)}
                          placeholder="Enter username"
                          className="text-sm"
                          required
                        />
                      </div>
                      
                      {/* Profile URL */}
                      <div>
                        <Label className="text-xs">Profile URL</Label>
                        <div className="flex space-x-2">
                          <Input
                            value={row.profileUrl}
                            onChange={(e) => handlePlatformRowChange(index, 'profileUrl', e.target.value)}
                            placeholder="Auto-generated"
                            className="text-sm flex-1"
                            readOnly
                          />
                          {row.platformId && row.username && (
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => handlePlatformRowChange(index, 'profileUrl', generateProfileUrl(row.platformId, row.username))}
                              className="text-xs px-2"
                            >
                              ↻
                            </Button>
                          )}
                        </div>
                      </div>
                      
                      {/* Remove Row Button */}
                      {platformRows.length > 1 && (
                        <div className="flex items-end">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => removePlatformRow(index)}
                            className="text-xs px-2 text-red-600 hover:text-red-700"
                          >
                            ✕
                          </Button>
                        </div>
                          )}
                    </div>
                  ))}
                </div>
                
                {/* Action Buttons */}
                <div className="flex justify-end space-x-3">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={resetFormState}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" className="bg-primary hover:bg-primary/90">
                    Add All Platforms
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Bulk Upload Dialog */}
        <Dialog open={showBulkUpload} onOpenChange={(open) => {
          if (!open) {
            // Reset state when dialog is closed
            handleResetAndUpload();
          }
          setShowBulkUpload(open);
        }}>
          <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center space-x-3">
                <Upload className="h-6 w-6 text-muted-foreground" />
                <span className="text-xl">Bulk Upload Coding Profiles</span>
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-6">
              {!showParsedData ? (
                <>
                  {/* Upload Section */}
                  <div className="text-sm text-muted-foreground mb-4">
                    <p>Upload an Excel file with the following format:</p>
                    <p className="mt-2 font-mono text-xs bg-muted p-2 rounded">
                      Sno | Roll Number | Email | LeetCode Username | HackerRank Username | CodeChef Username | GeeksForGeeks Username
                    </p>
                    <p className="mt-2 text-xs">Note: Just provide usernames - profile links will be automatically generated!</p>
                  </div>
                  
                  <div className="flex items-center space-x-4">
                    <Button onClick={downloadExcelTemplate} variant="outline">
                      <FileSpreadsheet className="h-4 w-4 mr-2" />
                      Download Template
                    </Button>
                    <Input
                      type="file"
                      accept=".xlsx,.xls"
                      onChange={(e) => {
                        const file = e.target.files[0];
                        setBulkUploadFile(file);
                        setParsedProfiles([]);
                        setShowParsedData(false);
                        setProfileCreationResults([]);
                        setShowResults(false);
                      }}
                      className="flex-1"
                    />
                  </div>
                  
                  <div className="flex items-center space-x-4">
                    <Button 
                      onClick={handleBulkUpload} 
                      disabled={!bulkUploadFile || uploading}
                      className="bg-emerald-600 hover:bg-emerald-700 flex-1"
                    >
                      {uploading ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Parsing...
                        </>
                      ) : (
                        <>
                          <Upload className="h-4 w-4 mr-2" />
                          Parse File
                        </>
                      )}
                    </Button>
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => setShowBulkUpload(false)}
                    >
                      Cancel
                    </Button>
                  </div>
                </>
              ) : (
                <>
                  {/* Parsed Data Section */}
                  <div className="flex items-center justify-between mb-4">
                    <Label className="text-sm font-medium">
                      Parsed Data ({parsedProfiles.length} profiles)
                    </Label>
                    <div className="flex gap-2">
                      <Button 
                        variant="outline"
                        size="sm"
                        onClick={handleResetAndUpload}
                      >
                        <RotateCcw className="h-4 w-4 mr-2" />
                        Reset
                      </Button>
                      <Button 
                        onClick={handleCreateProfiles}
                        disabled={uploading}
                        size="sm"
                        className="bg-green-600 hover:bg-green-700"
                      >
                        {uploading ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2" />
                            Creating...
                          </>
                        ) : (
                          <>
                            <Upload className="h-4 w-4 mr-2" />
                            Create Profiles ({parsedProfiles.length})
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                  
                  {/* Profile Summary */}
                  <div className="mb-4 p-3 bg-muted/30 rounded-lg border">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div className="text-center">
                        <div className="text-lg font-bold text-blue-600">{parsedProfiles.length}</div>
                        <div className="text-xs text-muted-foreground">Total Profiles</div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-bold text-green-600">{parsedProfiles.length}</div>
                        <div className="text-xs text-muted-foreground">Auto-Generated Links</div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Parsed Data Table */}
                  <div className="border rounded overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="bg-muted/50">
                          <tr>
                            <th className="text-left p-2 font-medium text-xs">Student</th>
                            <th className="text-left p-2 font-medium text-xs">Roll Number</th>
                            <th className="text-left p-2 font-medium text-xs">Platform</th>
                            <th className="text-left p-2 font-medium text-xs">Username</th>
                            <th className="text-left p-2 font-medium text-xs">Profile URL</th>
                            <th className="text-left p-2 font-medium text-xs">Validation Status</th>
                            {showResults && <th className="text-left p-2 font-medium text-xs">Creation Status</th>}
                          </tr>
                        </thead>
                        <tbody>
                          {parsedProfiles.map((profile, index) => {
                            const result = showResults ? profileCreationResults[index] : null;
                            const rowClass = result ? 
                              (result.success ? 'border-t bg-green-50 hover:bg-green-100' : 'border-t bg-red-50 hover:bg-red-100') : 
                              'border-t hover:bg-muted/30';
                            
                            return (
                              <tr key={`${profile.rollNumber}-${profile.platformName}-${index}`} className={rowClass}>
                                <td className="p-2 text-xs">{profile.studentName || ''}</td>
                                <td className="p-2 text-xs">{profile.rollNumber || ''}</td>
                                <td className="p-2 text-xs">{profile.platformName || ''}</td>
                                <td className="p-2 text-xs">{profile.username || ''}</td>
                                <td className="p-2 text-xs">{profile.profileUrl || ''}</td>
                                <td className="p-2 text-xs">
                                  <div className="flex items-center gap-1 text-green-700">
                                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                    <span className="font-medium">Auto-Generated</span>
                                  </div>
                                </td>
                                {showResults && (
                                  <td className="p-2 text-xs">
                                    {result ? (
                                      result.success ? (
                                        <div className="flex items-center gap-1 text-green-700">
                                          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                          <span className="font-medium">Success</span>
                                        </div>
                                      ) : (
                                        <div className="flex items-center gap-1 text-red-700">
                                          <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                                          <span className="font-medium">Failed</span>
                                          <span className="text-xs text-red-600 ml-1">({result.error})</span>
                                        </div>
                                      )
                                    ) : (
                                      <span className="text-muted-foreground">-</span>
                                    )}
                                  </td>
                                )}
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                  
                  {/* Results Summary */}
                  {showResults && (
                    <div className="mt-4 p-4 border rounded-lg bg-muted/20">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="text-sm font-medium text-muted-foreground">Profile Creation Results</h4>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={handleResetAndUpload}
                        >
                          <RotateCcw className="h-4 w-4 mr-2" />
                          Start New Upload
                        </Button>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4 text-sm mb-3">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                          <span className="text-green-700">
                            Successfully Created: {profileCreationResults.filter(r => r.success).length}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                          <span className="text-red-700">
                            Creation Failed: {profileCreationResults.filter(r => !r.success).length}
                          </span>
                        </div>
                      </div>
                      

                      
                      {/* Show failed creation summary */}
                      {profileCreationResults.some(r => !r.success) && (
                        <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded text-sm">
                          <h5 className="font-medium text-red-800 mb-2">Failed Profile Creations:</h5>
                          <ul className="space-y-1 text-red-700">
                            {profileCreationResults
                              .filter(r => !r.success)
                              .map((result, index) => (
                                <li key={`failed-${result.profile.rollNumber}-${result.profile.platformName}-${index}`} className="flex items-center gap-2">
                                  <span className="font-medium">{result.profile.studentName || result.profile.rollNumber}</span>
                                  <span className="text-red-600">- {result.profile.platformName}: {result.error}</span>
                                </li>
                              ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>
          </DialogContent>
        </Dialog>

        {/* Profile Links Dialog */}
        <Dialog open={showProfileLinksDialog} onOpenChange={setShowProfileLinksDialog}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle className="flex items-center space-x-3">
                <ExternalLink className="h-6 w-6 text-blue-600" />
                <span className="text-xl">Profile Links - {selectedStudentName}</span>
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              {selectedProfileLinks.length > 0 ? (
                <div className="space-y-3">
                  {selectedProfileLinks.map((profile, index) => (
                    <div key={`profile-${profile.platform}-${profile.username}-${index}`} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                        <div>
                          <div className="font-medium text-foreground">{profile.platform}</div>
                          <div className="text-sm text-muted-foreground">@{profile.username}</div>
                        </div>
                      </div>
              <Button
                variant="outline"
                size="sm"
                        onClick={() => window.open(profile.url, '_blank')}
                        className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                      >
                        <ExternalLink className="h-4 w-4 mr-2" />
                        Open Profile
              </Button>
            </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 text-muted-foreground">
                  No profile links available for this student.
                </div>
              )}
              
              <div className="flex justify-end">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setShowProfileLinksDialog(false)}
                >
                  Close
                </Button>
                </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Search and Selection Controls - Properly Aligned */}
        <Card className="bg-card backdrop-blur-sm border-0 shadow-lg border border-border">
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-start">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name, email, roll number, username, or platform..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 w-full"
                />
              </div>

              {/* College Selection */}
              <div>
                <div className="relative">
                  <select
                    value={selectedCollege}
                    onChange={(e) => handleCollegeChange(e.target.value)}
                    className="w-full p-2 border border-input rounded-lg bg-background text-foreground appearance-none cursor-pointer hover:border-primary/50 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all text-sm"
                  >
                    <option value="">Choose a college...</option>
                    {Array.isArray(colleges) && colleges.length > 0 ? (
                      colleges.map(college => (
                        <option key={college.id} value={college.id}>
                          {college.name}
                        </option>
                      ))
                    ) : (
                      <option value="" disabled>No colleges available</option>
                    )}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                </div>
                {!collegesLoading && Array.isArray(colleges) && colleges.length === 0 && (
                  <p className="text-xs text-muted-foreground mt-1">
                    No colleges found in existing profiles.
                  </p>
                )}
              </div>

              {/* Department Selection */}
              <div>
                <div className="relative">
                  <select
                    value={selectedDepartment}
                    onChange={(e) => setSelectedDepartment(e.target.value)}
                    className="w-full p-2 border border-input rounded-lg bg-background text-foreground appearance-none cursor-pointer hover:border-primary/50 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all text-sm"
                    disabled={!selectedCollege}
                  >
                    <option value="">
                      {!selectedCollege ? 'Select a college first...' : 'Choose a department...'}
                    </option>
                    {Array.isArray(departments) && departments.length > 0 ? (
                      departments.map(dept => (
                        <option key={dept.id} value={dept.id}>
                          {dept.name}
                        </option>
                      ))
                    ) : selectedCollege ? (
                      <option value="" disabled>No departments available for this college</option>
                    ) : (
                      <option value="" disabled>Select a college to see departments</option>
                    )}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                </div>
                {!departmentsLoading && Array.isArray(departments) && departments.length === 0 && selectedCollege && (
                  <p className="text-xs text-muted-foreground mt-1">
                    No departments found for this college.
                  </p>
                )}
                {!selectedCollege && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Select a college first to see available departments.
                  </p>
                )}
              </div>

              {/* Batch Selection */}
              <div>
                <div className="relative">
                  <select
                    value={selectedBatch}
                    onChange={(e) => setSelectedBatch(e.target.value)}
                    className="w-full p-2 border border-input rounded-lg bg-background text-foreground appearance-none cursor-pointer hover:border-primary/50 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all text-sm"
                    disabled={!selectedCollege}
                  >
                    <option value="">
                      {!selectedCollege ? 'Select a college first...' : 'Choose a batch...'}
                    </option>
                    {Array.isArray(batches) && batches.length > 0 ? (
                      batches.map(batch => (
                        <option key={batch.id} value={batch.id}>
                          {batch.name}
                        </option>
                      ))
                    ) : selectedCollege ? (
                      <option value="" disabled>No batches available for this college</option>
                    ) : (
                      <option value="" disabled>Select a college to see batches</option>
                    )}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                </div>
                {!batchesLoading && Array.isArray(batches) && batches.length === 0 && selectedCollege && (
                  <p className="text-xs text-muted-foreground mt-1">
                    No batches found for this college.
                  </p>
                )}
                {!selectedCollege && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Select a college first to see available batches.
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Profiles List - Grouped */}
        {Object.entries(groupedProfiles()).length > 0 ? (
          Object.entries(groupedProfiles()).map(([groupName, profiles]) => (
            <Card key={groupName} className="bg-card backdrop-blur-sm border-0 shadow-lg border border-border">
              <CardHeader className="bg-muted text-card-foreground rounded-t-lg border-b border-border py-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center space-x-3">
                      <Users className="h-6 w-6 text-purple-600" />
                    <span className="text-xl">{groupName}</span>
                  </CardTitle>
                  <div className="text-sm text-muted-foreground">
                      <div className="flex items-center space-x-2">
                        <span>Students: {new Set(profiles.map(p => p.user_id)).size}</span>
                        <span>•</span>
                        <span>Platforms: {new Set(profiles.map(p => p.platform_name)).size}</span>
                      </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                {/* College and Department Grouping Table */}
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-border bg-muted/30">
                          <th className="text-left p-4 font-semibold text-card-foreground">Student Name</th>
                          <th className="text-left p-4 font-semibold text-card-foreground">Roll Number</th>
                        <th className="text-left p-4 font-semibold text-card-foreground">College</th>
                        <th className="text-left p-4 font-semibold text-card-foreground">Department</th>
                          <th className="text-left p-4 font-semibold text-card-foreground">Profile Links</th>
                          <th className="text-center p-4 font-semibold text-card-foreground">LeetCode</th>
                          <th className="text-center p-4 font-semibold text-card-foreground">HackerRank</th>
                          <th className="text-center p-4 font-semibold text-card-foreground">CodeChef</th>
                          <th className="text-center p-4 font-semibold text-card-foreground">GeeksForGeeks</th>
                          <th className="text-left p-4 font-semibold text-card-foreground">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(() => {
                          // Group profiles by user to show one row per student
                          const userProfiles = {};
                          profiles.forEach(profile => {
                            if (!userProfiles[profile.user_id]) {
                              userProfiles[profile.user_id] = {
                                user: users.find(u => u.id === profile.user_id),
                                profiles: []
                              };
                            }
                            userProfiles[profile.user_id].profiles.push(profile);
                          });

                                                  return Object.values(userProfiles).map(({ user, profiles: userProfiles }, index) => {
                            // Get college and department from profile or user object
                            const firstProfile = userProfiles[0];
                            const collegeName = firstProfile?.college_name || user?.college_name || 'Unknown College';
                            const departmentName = firstProfile?.department_name || user?.department_name || 'Unknown Department';
                            
                            return (
                            <tr key={`${user?.id}-${index}`} className="border-b border-border hover:bg-muted/50">
                              <td className="p-4">
                                <div>
                                  <div className="font-medium text-card-foreground">{user?.name || 'Unknown'}</div>
                                  <div className="text-sm text-muted-foreground">{user?.email || 'N/A'}</div>
                                </div>
                              </td>
                              <td className="p-4">
                                <div className="font-medium text-card-foreground">
                                  {user?.student_id || 'N/A'}
                                </div>
                              </td>
                                <td className="p-4">
                                  <div className="font-medium text-card-foreground">
                                    {collegeName !== 'Unknown College' ? collegeName : (
                                      <span className="text-yellow-600 bg-yellow-50 px-2 py-1 rounded text-sm">
                                        No College Assigned
                                      </span>
                                    )}
                                  </div>
                                </td>
                                <td className="p-4">
                                  <div className="font-medium text-card-foreground">
                                    {departmentName !== 'Unknown Department' ? departmentName : (
                                      <span className="text-yellow-600 bg-yellow-50 px-2 py-1 rounded text-sm">
                                        No Department Assigned
                                      </span>
                                    )}
                                  </div>
                                </td>
                              <td className="p-4">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    // Show profile links dialog
                                      setSelectedProfileLinks(userProfiles.map(p => ({
                                      platform: p.platform_name,
                                      url: p.profile_url,
                                      username: p.username
                                      })));
                                      setSelectedStudentName(user?.name || 'Student');
                                      setShowProfileLinksDialog(true);
                                  }}
                                  className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                                >
                                  <ExternalLink className="h-4 w-4 mr-2" />
                                  View Links
                                </Button>
                              </td>
                              <td className="p-4 text-center">
                                {(() => {
                                  const leetcodeProfile = userProfiles.find(p => 
                                    p.platform_name?.toLowerCase() === 'leetcode' || 
                                    p.platform_name?.toLowerCase() === 'leetcod'
                                  );
                                  if (!leetcodeProfile) {
                                    return <span className="text-muted-foreground">-</span>;
                                  }
                                  
                                  const totalSolved = leetcodeProfile.total_solved || leetcodeProfile.problems_solved || leetcodeProfile.solved_count || 0;
                                  const isRetrieved = totalSolved > 0;
                                  
                                  return (
                                    <div className="text-center">
                                      <div className={`text-lg font-bold ${isRetrieved ? 'text-green-600' : 'text-red-600'}`}>
                                        {totalSolved}
                                      </div>
                                      <div className="text-xs text-muted-foreground">problems</div>
                                      {isRetrieved && (
                                        <div className="text-xs text-green-500 font-medium">Retrieved</div>
                                      )}
                                    </div>
                                  );
                                })()}
                              </td>
                              <td className="p-4 text-center">
                                {(() => {
                                  const hackerrankProfile = userProfiles.find(p => 
                                    p.platform_name?.toLowerCase() === 'hackerrank' || 
                                    p.platform_name?.toLowerCase() === 'hackerran'
                                  );
                                  if (!hackerrankProfile) {
                                    return <span className="text-muted-foreground">-</span>;
                                  }
                                  
                                  const totalSolved = hackerrankProfile.total_solved || hackerrankProfile.problems_solved || hackerrankProfile.solved_count || 0;
                                  const isRetrieved = totalSolved > 0;
                                  
                                  return (
                                    <div className="text-center">
                                      <div className={`text-lg font-bold ${isRetrieved ? 'text-green-600' : 'text-red-600'}`}>
                                        {totalSolved}
                                      </div>
                                      <div className="text-xs text-muted-foreground">problems</div>
                                      {isRetrieved && (
                                        <div className="text-xs text-green-500 font-medium">Retrieved</div>
                                      )}
                                    </div>
                                  );
                                })()}
                              </td>
                              <td className="p-4 text-center">
                                {(() => {
                                  const codechefProfile = userProfiles.find(p => 
                                    p.platform_name?.toLowerCase() === 'codechef' || 
                                    p.platform_name?.toLowerCase() === 'codeche'
                                  );
                                  if (!codechefProfile) {
                                    return <span className="text-muted-foreground">-</span>;
                                  }
                                  
                                  const totalSolved = codechefProfile.total_solved || codechefProfile.problems_solved || codechefProfile.solved_count || 0;
                                  const isRetrieved = totalSolved > 0;
                                  
                                  return (
                                    <div className="text-center">
                                      <div className={`text-lg font-bold ${isRetrieved ? 'text-green-600' : 'text-red-600'}`}>
                                        {totalSolved}
                                      </div>
                                      <div className="text-xs text-muted-foreground">problems</div>
                                      {isRetrieved && (
                                        <div className="text-xs text-green-500 font-medium">Retrieved</div>
                                      )}
                                    </div>
                                  );
                                })()}
                              </td>
                              <td className="p-4 text-center">
                                {(() => {
                                  const geeksforgeeksProfile = userProfiles.find(p => 
                                    p.platform_name?.toLowerCase() === 'geeksforgeeks' || 
                                    p.platform_name?.toLowerCase() === 'geeksforgeek'
                                  );
                                  if (!geeksforgeeksProfile) {
                                    return <span className="text-muted-foreground">-</span>;
                                  }
                                  
                                  const totalSolved = geeksforgeeksProfile.total_solved || geeksforgeeksProfile.problems_solved || geeksforgeeksProfile.solved_count || 0;
                                  const isRetrieved = totalSolved > 0;
                                  
                                  return (
                                    <div className="text-center">
                                      <div className={`text-lg font-bold ${isRetrieved ? 'text-green-600' : 'text-red-600'}`}>
                                        {totalSolved}
                                      </div>
                                      <div className="text-xs text-muted-foreground">problems</div>
                                      {isRetrieved && (
                                        <div className="text-xs text-green-500 font-medium">Retrieved</div>
                                      )}
                                    </div>
                                  );
                                })()}
                              </td>
                              <td className="p-4">
                                <div className="flex items-center space-x-2">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={async () => {
                                      // Refresh stats for all platforms for this user in bulk
                                      try {
                                        const userProfilesToRefresh = userProfiles.filter(profile => profile.platform_id);
                                        
                                        if (userProfilesToRefresh.length > 0) {
                                          // Use bulk refresh for user profiles
                                          const profileIds = userProfilesToRefresh.map(profile => profile.id);
                                          const bulkRefreshResponse = await apiService.bulkRefreshCodingProfiles(profileIds);
                                          
                                          if (!bulkRefreshResponse.success) {
                                            throw new Error(bulkRefreshResponse.message || 'Bulk refresh failed');
                                          }
                                        }
                                        
                                        // Refresh the data
                                        await loadData();
                                        toast({
                                          title: "Stats Refreshed",
                                          description: "Platform stats have been updated for this student.",
                                          variant: "default"
                                        });
                                      } catch (error) {
                                        toast({
                                          title: "Error",
                                          description: "Failed to refresh stats. Please try again.",
                                          variant: "destructive"
                                        });
                                      }
                                    }}
                                    title="Refresh Individual Data"
                                    className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                                  >
                                    <RotateCcw className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                        // Edit the first profile (or show edit options)
                                        if (userProfiles.length > 0) {
                                          handleEditClick(userProfiles[0]);
                                        }
                                      }}
                                      title="Edit Profile"
                                    >
                                      <Edit className="h-4 w-4" />
                                    </Button>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => {
                                        // Delete all profiles for this user
                                        if (userProfiles.length > 0) {
                                          handleDeleteClick(userProfiles[0]);
                                        }
                                      }}
                                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                      title="Remove Profile"
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </Button>

                                </div>
                              </td>
                            </tr>
                            );
                          });
                        })()}
                      </tbody>
                    </table>
                  </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <Card className="bg-card backdrop-blur-sm border-0 shadow-lg border border-border">
            <CardContent className="p-12 text-center">
              <div className="flex flex-col items-center space-y-4">
                <Code className="h-16 w-16 text-muted-foreground/50" />
                <div>
                  <h3 className="text-lg font-semibold text-card-foreground mb-2">No Profiles Found</h3>
                  <p className="text-muted-foreground">
                    {searchQuery ? 'Try adjusting your search criteria or grouping options.' : 'No coding profiles match the current grouping criteria.'}
                  </p>
                </div>
                {searchQuery && (
                  <Button
                    variant="outline"
                    onClick={() => setSearchQuery('')}
                    className="mt-2"
                  >
                    Clear Search
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Delete Confirmation Modal */}
        {deleteConfirm && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <Card className="w-96 bg-card border border-border">
              <CardHeader className="bg-red-50 border-b border-red-200">
                <CardTitle className="flex items-center space-x-2 text-red-700">
                  <AlertTriangle className="h-5 w-5" />
                  <span>Confirm Delete</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <p className="text-sm text-muted-foreground mb-4">
                  Are you sure you want to delete the coding profile for{' '}
                  <strong>{deleteConfirm.user_name}</strong> on{' '}
                  <strong>{deleteConfirm.platform_name}</strong>?
                </p>
                <p className="text-xs text-muted-foreground mb-6">
                  This action cannot be undone.
                </p>
                <div className="flex justify-end space-x-3">
                  <Button
                    variant="outline"
                    onClick={() => setDeleteConfirm(null)}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={handleConfirmDelete}
                  >
                    Delete Profile
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};

export default CodingProfilesManagementPage;

