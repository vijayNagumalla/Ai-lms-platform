import React, { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { X, Plus, Search, Building, Users, GraduationCap } from 'lucide-react';
import apiService from '../../services/api';

export default function AssignmentStep({ formData, updateFormData, colleges }) {
  // Search states
  const [collegeSearch, setCollegeSearch] = useState('');
  const [studentSearch, setStudentSearch] = useState('');
  
  // Search results
  const [collegeResults, setCollegeResults] = useState([]);
  const [studentResults, setStudentResults] = useState([]);
  
  // Cache for selected students data
  const [selectedStudentsData, setSelectedStudentsData] = useState({});
  
  // Department and batch data
  const [departmentsByCollege, setDepartmentsByCollege] = useState({});
  const [batchesByCollege, setBatchesByCollege] = useState({});
  const [loadingDepartments, setLoadingDepartments] = useState(false);
  const [loadingBatches, setLoadingBatches] = useState(false);

  // Filter colleges based on search term
  useEffect(() => {
    if (Array.isArray(colleges)) {
      if (collegeSearch.trim()) {
        const filtered = colleges.filter(college => 
          college.name.toLowerCase().includes(collegeSearch.toLowerCase()) ||
          college.code?.toLowerCase().includes(collegeSearch.toLowerCase())
        );
        setCollegeResults(filtered);
      } else {
        setCollegeResults([]);
      }
    } else {
      setCollegeResults([]);
    }
  }, [collegeSearch, colleges]);

  // Load departments and batches when colleges are selected
  useEffect(() => {
    const loadDepartmentsAndBatches = async () => {
      const selectedColleges = formData.assigned_colleges || [];
      
      if (selectedColleges.length === 0) {
        setDepartmentsByCollege({});
        setBatchesByCollege({});
        return;
      }

      try {
        setLoadingDepartments(true);
        setLoadingBatches(true);
        
        // Load departments and batches for each college individually
        const deptMap = {};
        const batchMap = {};
        
        for (const collegeId of selectedColleges) {
          try {
            // Get departments for this college using the same API as College Management
            const deptResponse = await apiService.getSuperAdminCollegeDetails(collegeId);
            
            if (deptResponse.success && deptResponse.data) {
              const collegeData = deptResponse.data;
              deptMap[collegeId] = {
                college_name: collegeData.name,
                departments: collegeData.departments || []
              };
            }
            
            // Get batches for this college using the same API as College Management
            const batchResponse = await apiService.getBatches({ college_id: collegeId });
            
            if (batchResponse.success && batchResponse.data) {
              const college = colleges.find(c => c.id === collegeId);
              batchMap[collegeId] = {
                college_name: college?.name || `College ${collegeId}`,
                batches: batchResponse.data || []
              };
            }
          } catch (error) {
            console.error(`Error loading data for college ${collegeId}:`, error);
          }
        }
        

        setDepartmentsByCollege(deptMap);
        setBatchesByCollege(batchMap);
      } catch (error) {
        console.error('Error loading departments and batches:', error);
        setDepartmentsByCollege({});
        setBatchesByCollege({});
      } finally {
        setLoadingDepartments(false);
        setLoadingBatches(false);
      }
    };

    loadDepartmentsAndBatches();
  }, [formData.assigned_colleges]);

  // Filter students using the API
  useEffect(() => {
    const searchStudents = async () => {
      if (studentSearch.trim()) {
        try {
          const response = await apiService.getSuperAdminUsers({
            role: 'student',
            search: studentSearch,
            limit: 20
          });
          
          if (response.success && response.data && Array.isArray(response.data)) {
            setStudentResults(response.data);
          } else {
            setStudentResults([]);
          }
        } catch (error) {
          console.error('Error searching students:', error);
          setStudentResults([]);
        }
      } else {
        setStudentResults([]);
      }
    };

    // Debounce the search to avoid too many API calls
    const timeoutId = setTimeout(searchStudents, 300);
    return () => clearTimeout(timeoutId);
  }, [studentSearch]);

  // Load student data for existing assignments when component mounts
  useEffect(() => {
    const loadExistingStudentData = async () => {
      const existingStudents = formData.assigned_students || [];
      if (existingStudents.length > 0) {
        try {
          // Load student data for each existing assignment
          const studentPromises = existingStudents.map(async (studentId) => {
            try {
              const response = await apiService.getSuperAdminUserById(studentId);
              
              if (response.success && response.data) {
                return { id: studentId, data: response.data };
              }
            } catch (error) {
              console.error(`Error loading student data for ${studentId}:`, error);
            }
            return null;
          });

          const studentData = await Promise.all(studentPromises);
          const validStudentData = studentData.filter(item => item !== null);
          
          // Update the cache with loaded student data
          const newCache = {};
          validStudentData.forEach(item => {
            newCache[item.id] = item.data;
          });
          
          setSelectedStudentsData(prev => ({
            ...prev,
            ...newCache
          }));
          

        } catch (error) {
          console.error('Error loading existing student data:', error);
        }
      }
    };

    loadExistingStudentData();
  }, [formData.assigned_students]);

  const handleAssignmentChange = (type, id, checked) => {
    const field = `assigned_${type}s`;
    const currentAssignments = formData[field] || [];
    
    if (checked) {
      // Cache student data when selected
      if (type === 'student') {
        const student = studentResults.find(s => s.id === id);
        if (student) {
          setSelectedStudentsData(prev => ({
            ...prev,
            [id]: student
          }));
        }
      }
      updateFormData({ [field]: [...currentAssignments, id] });
    } else {
      // Remove from cache when deselected
      if (type === 'student') {
        setSelectedStudentsData(prev => {
          const newData = { ...prev };
          delete newData[id];
          return newData;
        });
      }
      updateFormData({ [field]: currentAssignments.filter(item => item !== id) });
    }
  };

  const removeAssignment = (type, id) => {
    const field = `assigned_${type}s`;
    const currentAssignments = formData[field] || [];
    
    // Remove from cache when removed
    if (type === 'student') {
      setSelectedStudentsData(prev => {
        const newData = { ...prev };
        delete newData[id];
        return newData;
      });
    }
    
    updateFormData({ [field]: currentAssignments.filter(item => item !== id) });
  };

  const handleDepartmentChange = (collegeId, departmentId, checked) => {
    const currentDepartments = formData.assigned_departments || [];
    
    if (checked) {
      updateFormData({ 
        assigned_departments: [...currentDepartments, { college_id: collegeId, department_id: departmentId }]
      });
    } else {
      updateFormData({ 
        assigned_departments: currentDepartments.filter(item => 
          !(item.college_id === collegeId && item.department_id === departmentId)
        )
      });
    }
  };

  const handleAllDepartmentsChange = (collegeId, checked) => {
    const collegeData = departmentsByCollege[collegeId];
    if (!collegeData) return;

    const currentDepartments = formData.assigned_departments || [];
    const existingDeptsForCollege = currentDepartments.filter(item => item.college_id === collegeId);
    
    if (checked) {
      // Add all departments for this college
      const newDepartments = collegeData.departments.map(dept => ({
        college_id: collegeId,
        department_id: dept.id
      }));
      
      // Remove existing departments for this college and add all new ones
      const otherDepartments = currentDepartments.filter(item => item.college_id !== collegeId);
      updateFormData({ 
        assigned_departments: [...otherDepartments, ...newDepartments]
      });
    } else {
      // Remove all departments for this college
      updateFormData({ 
        assigned_departments: currentDepartments.filter(item => item.college_id !== collegeId)
      });
    }
  };

  const handleBatchChange = (collegeId, batchId, checked) => {
    const currentBatches = formData.assigned_batches || [];
    
    if (checked) {
      updateFormData({ 
        assigned_batches: [...currentBatches, { college_id: collegeId, batch_id: batchId }]
      });
    } else {
      updateFormData({ 
        assigned_batches: currentBatches.filter(item => 
          !(item.college_id === collegeId && item.batch_id === batchId)
        )
      });
    }
  };

  const handleAllBatchesChange = (collegeId, checked) => {
    const collegeData = batchesByCollege[collegeId];
    if (!collegeData) return;

    const currentBatches = formData.assigned_batches || [];
    
    if (checked) {
      // Add all batches for this college
      const newBatches = collegeData.batches.map(batch => ({
        college_id: collegeId,
        batch_id: batch.id
      }));
      
      // Remove existing batches for this college and add all new ones
      const otherBatches = currentBatches.filter(item => item.college_id !== collegeId);
      updateFormData({ 
        assigned_batches: [...otherBatches, ...newBatches]
      });
    } else {
      // Remove all batches for this college
      updateFormData({ 
        assigned_batches: currentBatches.filter(item => item.college_id !== collegeId)
      });
    }
  };

  const getAssignmentName = (type, id) => {
    switch (type) {
      case 'college':
        const college = Array.isArray(colleges) ? colleges.find(c => c.id === id) : null;
        return college ? college.name : 'Unknown College';
      case 'department':
        // For departments, we need to find the department name from the loaded data
        for (const collegeId in departmentsByCollege) {
          const dept = departmentsByCollege[collegeId].departments.find(d => d.id === id);
          if (dept) return `${departmentsByCollege[collegeId].college_name} - ${dept.name}`;
        }
        return `Department ${id}`;
      case 'batch':
        // For batches, we need to find the batch name from the loaded data
        for (const collegeId in batchesByCollege) {
          const batch = batchesByCollege[collegeId].batches.find(b => b.id === id);
          if (batch) return `${batchesByCollege[collegeId].college_name} - ${batch.name}`;
        }
        return `Batch ${id}`;
      case 'student':
        // First check cached data, then search results
        const cachedStudent = selectedStudentsData[id];
        if (cachedStudent) {
          return cachedStudent.name;
        }
        const student = studentResults.find(s => s.id === id);
        return student ? student.name : `Student ${id}`;
      default:
        return `Unknown ${type}`;
    }
  };

  const isDepartmentSelected = (collegeId, departmentId) => {
    const currentDepartments = formData.assigned_departments || [];
    return currentDepartments.some(item => 
      item.college_id === collegeId && item.department_id === departmentId
    );
  };

  const areAllDepartmentsSelected = (collegeId) => {
    const collegeData = departmentsByCollege[collegeId];
    if (!collegeData || collegeData.departments.length === 0) return false;
    
    const currentDepartments = formData.assigned_departments || [];
    const selectedDeptsForCollege = currentDepartments.filter(item => item.college_id === collegeId);
    
    return selectedDeptsForCollege.length === collegeData.departments.length;
  };

  const isBatchSelected = (collegeId, batchId) => {
    const currentBatches = formData.assigned_batches || [];
    return currentBatches.some(item => 
      item.college_id === collegeId && item.batch_id === batchId
    );
  };

  const areAllBatchesSelected = (collegeId) => {
    const collegeData = batchesByCollege[collegeId];
    if (!collegeData || collegeData.batches.length === 0) return false;
    
    const currentBatches = formData.assigned_batches || [];
    const selectedBatchesForCollege = currentBatches.filter(item => item.college_id === collegeId);
    
    return selectedBatchesForCollege.length === collegeData.batches.length;
  };

  const renderCollegeSection = () => {
    const isAssigned = (id) => (formData.assigned_colleges || []).includes(id);
    
    return (
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Building className="w-5 h-5" />
            Assign to Colleges
          </h3>
          <p className="text-sm text-gray-600">Assign the assessment to entire colleges. All students in the selected colleges will have access.</p>
        </div>

        {/* Selected colleges */}
        {(formData.assigned_colleges || []).length > 0 && (
          <div className="flex flex-wrap gap-2">
            {formData.assigned_colleges.map((collegeId) => {
              const college = colleges.find(c => c.id === collegeId);
              return (
                <Badge key={collegeId} variant="secondary" className="flex items-center gap-1">
                  {college?.name || `College ${collegeId}`}
                  <button
                    type="button"
                    onClick={() => removeAssignment('college', collegeId)}
                    className="ml-1 hover:text-red-600"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </Badge>
              );
            })}
          </div>
        )}



        {/* Search colleges */}
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Search colleges..."
              value={collegeSearch}
              onChange={(e) => setCollegeSearch(e.target.value)}
              className="w-full pl-10"
            />
          </div>
        </div>

        {/* Search results */}
        {collegeSearch && collegeResults.length > 0 && (
          <div className="border rounded-lg p-4 bg-gray-50">
            <h4 className="font-medium mb-2">Search Results for "{collegeSearch}"</h4>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {collegeResults.map((college) => (
                <div key={college.id} className="flex items-center justify-between p-2 bg-white rounded border">
                  <div>
                    <span className="font-medium">{college.name}</span>
                    {college.code && <span className="text-sm text-gray-500 ml-2">({college.code})</span>}
                  </div>
                  <Button
                    type="button"
                    variant={isAssigned(college.id) ? "secondary" : "outline"}
                    size="sm"
                    onClick={() => handleAssignmentChange('college', college.id, !isAssigned(college.id))}
                    disabled={isAssigned(college.id)}
                  >
                    {isAssigned(college.id) ? 'Added' : 'Add'}
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* No results message */}
        {collegeSearch && collegeResults.length === 0 && (
          <div className="border rounded-lg p-4 bg-gray-50">
            <p className="text-gray-500 text-center">No colleges found matching "{collegeSearch}"</p>
          </div>
        )}


      </div>
    );
  };

  const renderDepartmentSection = () => {
    const selectedColleges = formData.assigned_colleges || [];
    
    if (selectedColleges.length === 0) {
      return (
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <GraduationCap className="w-5 h-5" />
              Assign to Departments
            </h3>
            <p className="text-sm text-gray-600">Select colleges first to assign departments.</p>
          </div>
          <div className="p-4 bg-gray-50 border rounded-lg">
            <p className="text-gray-500 text-center">Please select at least one college to assign departments</p>
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <GraduationCap className="w-5 h-5" />
            Assign to Departments
          </h3>
          <p className="text-sm text-gray-600">Assign the assessment to specific departments within selected colleges.</p>
        </div>

        {/* Selected departments */}
        {(formData.assigned_departments || []).length > 0 && (
          <div className="flex flex-wrap gap-2">
            {formData.assigned_departments.map((dept, index) => (
              <Badge key={`${dept.college_id}-${dept.department_id}-${index}`} variant="secondary" className="flex items-center gap-1">
                {getAssignmentName('department', dept.department_id)}
                <button
                  type="button"
                  onClick={() => handleDepartmentChange(dept.college_id, dept.department_id, false)}
                  className="ml-1 hover:text-red-600"
                >
                  <X className="w-3 h-3" />
                </button>
              </Badge>
            ))}
          </div>
        )}

        {/* Department selection by college */}
        {loadingDepartments ? (
          <div className="p-4 bg-gray-50 border rounded-lg">
            <p className="text-gray-500 text-center">Loading departments...</p>
          </div>
        ) : (
          <div className="space-y-4">
            {selectedColleges.map(collegeId => {
              const college = colleges.find(c => c.id === collegeId);
              const collegeData = departmentsByCollege[collegeId];
              
              if (!college) return null;
              
              return (
                <div key={collegeId} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-medium">{college.name}</h4>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id={`all-depts-${collegeId}`}
                        checked={areAllDepartmentsSelected(collegeId)}
                        onCheckedChange={(checked) => handleAllDepartmentsChange(collegeId, checked)}
                      />
                      <label htmlFor={`all-depts-${collegeId}`} className="text-sm font-medium">
                        All Departments
                      </label>
                    </div>
                  </div>
                  
                  {collegeData && collegeData.departments.length > 0 ? (
                    <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-2">
                      {collegeData.departments.map(dept => (
                        <div key={dept.id} className="flex items-center space-x-2">
                          <Checkbox
                            id={`dept-${dept.id}`}
                            checked={isDepartmentSelected(collegeId, dept.id)}
                            onCheckedChange={(checked) => handleDepartmentChange(collegeId, dept.id, checked)}
                          />
                          <label htmlFor={`dept-${dept.id}`} className="text-sm">
                            {dept.name}
                            {dept.code && <span className="text-gray-500 ml-1">({dept.code})</span>}
                          </label>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500 text-sm">No departments found for this college</p>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  const renderBatchSection = () => {
    const selectedColleges = formData.assigned_colleges || [];
    
    if (selectedColleges.length === 0) {
      return (
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <GraduationCap className="w-5 h-5" />
              Assign to Batches
            </h3>
            <p className="text-sm text-gray-600">Select colleges first to assign batches.</p>
          </div>
          <div className="p-4 bg-gray-50 border rounded-lg">
            <p className="text-gray-500 text-center">Please select at least one college to assign batches</p>
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <GraduationCap className="w-5 h-5" />
            Assign to Batches
          </h3>
          <p className="text-sm text-gray-600">Assign the assessment to specific batches within selected colleges.</p>
        </div>

        {/* Selected batches */}
        {(formData.assigned_batches || []).length > 0 && (
          <div className="flex flex-wrap gap-2">
            {formData.assigned_batches.map((batch, index) => (
              <Badge key={`${batch.college_id}-${batch.batch_id}-${index}`} variant="secondary" className="flex items-center gap-1">
                {getAssignmentName('batch', batch.batch_id)}
                <button
                  type="button"
                  onClick={() => handleBatchChange(batch.college_id, batch.batch_id, false)}
                  className="ml-1 hover:text-red-600"
                >
                  <X className="w-3 h-3" />
                </button>
              </Badge>
            ))}
          </div>
        )}

        {/* Batch selection by college */}
        {loadingBatches ? (
          <div className="p-4 bg-gray-50 border rounded-lg">
            <p className="text-gray-500 text-center">Loading batches...</p>
          </div>
        ) : (
          <div className="space-y-4">
            {selectedColleges.map(collegeId => {
              const college = colleges.find(c => c.id === collegeId);
              const collegeData = batchesByCollege[collegeId];
              
              if (!college) return null;
              
              return (
                <div key={collegeId} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-medium">{college.name}</h4>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id={`all-batches-${collegeId}`}
                        checked={areAllBatchesSelected(collegeId)}
                        onCheckedChange={(checked) => handleAllBatchesChange(collegeId, checked)}
                      />
                      <label htmlFor={`all-batches-${collegeId}`} className="text-sm font-medium">
                        All Batches
                      </label>
                    </div>
                  </div>
                  
                  {collegeData && collegeData.batches.length > 0 ? (
                    <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-2">
                      {collegeData.batches.map(batch => (
                        <div key={batch.id} className="flex items-center space-x-2">
                          <Checkbox
                            id={`batch-${batch.id}`}
                            checked={isBatchSelected(collegeId, batch.id)}
                            onCheckedChange={(checked) => handleBatchChange(collegeId, batch.id, checked)}
                          />
                          <label htmlFor={`batch-${batch.id}`} className="text-sm">
                            {batch.name}
                            {batch.code && <span className="text-gray-500 ml-1">({batch.code})</span>}
                          </label>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500 text-sm">No batches found for this college</p>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  const renderStudentSection = () => {
    const isAssigned = (id) => (formData.assigned_students || []).includes(id);
    
    return (
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Users className="w-5 h-5" />
            Assign to Individual Students
          </h3>
          <p className="text-sm text-gray-600">Assign the assessment to specific students by name or ID.</p>
        </div>

        {/* Selected students table */}
        {(formData.assigned_students || []).length > 0 && (
          <div className="border rounded-lg overflow-hidden">
            <div className="bg-gray-50 px-4 py-3 border-b">
              <h4 className="font-medium text-gray-900">Selected Students ({formData.assigned_students.length})</h4>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Roll/ID</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">College</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Department</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {formData.assigned_students.map((id) => {
                    const student = selectedStudentsData[id];
                    return (
                      <tr key={id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                          {student?.name || `Student ${id}`}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                          {student?.student_id || student?.roll_number || 'N/A'}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                          {student?.email || 'N/A'}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                          {student?.college_name || 'N/A'}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                          {student?.department_name || 'N/A'}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                          <button
                            type="button"
                            onClick={() => removeAssignment('student', id)}
                            className="text-red-600 hover:text-red-900 flex items-center gap-1"
                          >
                            <X className="w-3 h-3" />
                            Remove
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Search students */}
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Search students..."
              value={studentSearch}
              onChange={(e) => setStudentSearch(e.target.value)}
              className="w-full pl-10"
            />
          </div>
        </div>

        {/* Search results */}
        {studentSearch && studentResults.length > 0 && (
          <div className="border rounded-lg p-4 bg-gray-50">
            <h4 className="font-medium mb-2">Search Results</h4>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {studentResults.map((student) => (
                <div key={student.id} className="flex items-center justify-between p-2 bg-white rounded border">
                  <div>
                    <span className="font-medium">{student.name}</span>
                    {student.email && <span className="text-sm text-gray-500 ml-2">({student.email})</span>}
                    {student.student_id && <span className="text-sm text-gray-500 ml-2">ID: {student.student_id}</span>}
                  </div>
                  <Button
                    type="button"
                    variant={isAssigned(student.id) ? "secondary" : "outline"}
                    size="sm"
                    onClick={() => handleAssignmentChange('student', student.id, !isAssigned(student.id))}
                    disabled={isAssigned(student.id)}
                  >
                    {isAssigned(student.id) ? 'Added' : 'Add'}
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* No results message */}
        {studentSearch && studentResults.length === 0 && (
          <div className="border rounded-lg p-4 bg-gray-50">
            <p className="text-gray-500 text-center">No students found matching "{studentSearch}"</p>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Assignment</h2>
        <p className="text-gray-600 mb-6">
          Assign this assessment to colleges, departments, batches, or individual students
        </p>
      </div>

      {/* College Search and Selection */}
      <div className="space-y-4">
        <div className="flex items-center gap-4">
          <div className="flex-1 relative">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              College Search
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                type="text"
                placeholder="Search colleges..."
                value={collegeSearch}
                onChange={(e) => setCollegeSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            {/* College search results */}
            {collegeSearch && collegeResults.length > 0 && (
              <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
                {collegeResults.map((college) => (
                  <div
                    key={college.id}
                    className="px-4 py-2 hover:bg-gray-100 cursor-pointer border-b border-gray-100 last:border-b-0"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleAssignmentChange('college', college.id, true);
                      setCollegeSearch('');
                    }}
                  >
                    <div className="font-medium">{college.name}</div>
                    {college.code && <div className="text-sm text-gray-500">{college.code}</div>}
                  </div>
                ))}
              </div>
            )}
          </div>
          
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Selected College
            </label>
            <div className="min-h-[40px] p-2 border border-gray-300 rounded-md bg-gray-50">
              {(formData.assigned_colleges || []).length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {formData.assigned_colleges.map((collegeId) => {
                    const college = colleges.find(c => c.id === collegeId);
                    return (
                      <Badge key={collegeId} variant="secondary" className="flex items-center gap-1">
                        {college?.name || `College ${collegeId}`}
                        <button
                          type="button"
                          onClick={() => removeAssignment('college', collegeId)}
                          className="ml-1 hover:text-red-600"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </Badge>
                    );
                  })}
                </div>
              ) : (
                <span className="text-gray-500 text-sm">No colleges selected</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Department and Batch Selection */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select Department
          </label>
          {(formData.assigned_colleges || []).length === 0 ? (
            <div className="border border-gray-300 rounded-md p-4">
              <p className="text-gray-500 text-center">Select colleges first to assign departments</p>
            </div>
          ) : loadingDepartments ? (
            <div className="border border-gray-300 rounded-md p-4">
              <p className="text-gray-500 text-center">Loading departments...</p>
            </div>
          ) : (
            <div className="space-y-3">
              <Select
                value=""
                onValueChange={(deptId) => {
                  if (deptId && deptId !== "no-departments") {
                    // Find which college this department belongs to
                    const selectedColleges = formData.assigned_colleges || [];
                    for (const collegeId of selectedColleges) {
                      const collegeData = departmentsByCollege[collegeId];
                      if (collegeData && collegeData.departments) {
                        const dept = collegeData.departments.find(d => d.id === deptId);
                        if (dept) {
                          handleDepartmentChange(collegeId, deptId, true);
                          break;
                        }
                      }
                    }
                  }
                }}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select department from all colleges..." />
                </SelectTrigger>
                <SelectContent>
                  {(() => {
                    const allDepartments = [];
                    const selectedColleges = formData.assigned_colleges || [];
                    
                    selectedColleges.forEach(collegeId => {
                      const college = colleges.find(c => c.id === collegeId);
                      const collegeData = departmentsByCollege[collegeId];
                      if (collegeData && collegeData.departments) {
                        collegeData.departments.forEach(dept => {
                          allDepartments.push({
                            id: dept.id,
                            name: dept.name,
                            collegeId: collegeId,
                            collegeName: college?.name || `College ${collegeId}`
                          });
                        });
                      }
                    });
                    
                    return allDepartments.length > 0 ? (
                      allDepartments.map((dept) => (
                        <SelectItem key={dept.id} value={dept.id}>
                          {dept.collegeName} - {dept.name}
                        </SelectItem>
                      ))
                    ) : (
                      <SelectItem value="no-departments" disabled>
                        No departments found
                      </SelectItem>
                    );
                  })()}
                </SelectContent>
              </Select>
              
              {/* Show all selected departments */}
              {(formData.assigned_departments || []).length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {(formData.assigned_departments || []).map((item) => {
                    const college = colleges.find(c => c.id === item.college_id);
                    const collegeData = departmentsByCollege[item.college_id];
                    const dept = collegeData?.departments?.find(d => d.id === item.department_id);
                    return (
                      <Badge key={`${item.college_id}-${item.department_id}`} variant="secondary" className="flex items-center gap-1">
                        {college?.name || `College ${item.college_id}`} - {dept?.name || `Dept ${item.department_id}`}
                        <button
                          type="button"
                          onClick={() => handleDepartmentChange(item.college_id, item.department_id, false)}
                          className="ml-1 hover:text-red-600"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </Badge>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select Batch
          </label>
          {(formData.assigned_colleges || []).length === 0 ? (
            <div className="border border-gray-300 rounded-md p-4">
              <p className="text-gray-500 text-center">Select colleges first to assign batches</p>
            </div>
          ) : loadingBatches ? (
            <div className="border border-gray-300 rounded-md p-4">
              <p className="text-gray-500 text-center">Loading batches...</p>
            </div>
          ) : (
            <div className="space-y-3">
              <Select
                value=""
                onValueChange={(batchId) => {
                  if (batchId && batchId !== "no-batches") {
                    // Find which college this batch belongs to
                    const selectedColleges = formData.assigned_colleges || [];
                    for (const collegeId of selectedColleges) {
                      const collegeData = batchesByCollege[collegeId];
                      if (collegeData && collegeData.batches) {
                        const batch = collegeData.batches.find(b => b.id === batchId);
                        if (batch) {
                          handleBatchChange(collegeId, batchId, true);
                          break;
                        }
                      }
                    }
                  }
                }}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select batch from all colleges..." />
                </SelectTrigger>
                <SelectContent>
                  {(() => {
                    const allBatches = [];
                    const selectedColleges = formData.assigned_colleges || [];
                    
                    selectedColleges.forEach(collegeId => {
                      const college = colleges.find(c => c.id === collegeId);
                      const collegeData = batchesByCollege[collegeId];
                      if (collegeData && collegeData.batches) {
                        collegeData.batches.forEach(batch => {
                          allBatches.push({
                            id: batch.id,
                            name: batch.name,
                            collegeId: collegeId,
                            collegeName: college?.name || `College ${collegeId}`
                          });
                        });
                      }
                    });
                    
                    return allBatches.length > 0 ? (
                      allBatches.map((batch) => (
                        <SelectItem key={batch.id} value={batch.id}>
                          {batch.collegeName} - {batch.name}
                        </SelectItem>
                      ))
                    ) : (
                      <SelectItem value="no-batches" disabled>
                        No batches found
                      </SelectItem>
                    );
                  })()}
                </SelectContent>
              </Select>
              
              {/* Show all selected batches */}
              {(formData.assigned_batches || []).length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {(formData.assigned_batches || []).map((item) => {
                    const college = colleges.find(c => c.id === item.college_id);
                    const collegeData = batchesByCollege[item.college_id];
                    const batch = collegeData?.batches?.find(b => b.id === item.batch_id);
                    return (
                      <Badge key={`${item.college_id}-${item.batch_id}`} variant="secondary" className="flex items-center gap-1">
                        {college?.name || `College ${item.college_id}`} - {batch?.name || `Batch ${item.batch_id}`}
                        <button
                          type="button"
                          onClick={() => handleBatchChange(item.college_id, item.batch_id, false)}
                          className="ml-1 hover:text-red-600"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </Badge>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Individual Student Selection */}
      <div className="relative">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Individual Selection search Bar
        </label>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            type="text"
            placeholder="Search students by name, ID, or email..."
            value={studentSearch}
            onChange={(e) => setStudentSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        {/* Student search results */}
        {studentSearch && studentResults.length > 0 && (
          <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
            {studentResults.map((student) => (
              <div
                key={student.id}
                className="px-4 py-2 hover:bg-gray-100 cursor-pointer border-b border-gray-100 last:border-b-0"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleAssignmentChange('student', student.id, true);
                  setStudentSearch('');
                }}
              >
                <div className="font-medium">{student.name}</div>
                <div className="text-sm text-gray-500">
                  {student.student_id || student.roll_number} • {student.email}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Selected Individual Students Display */}
      {(formData.assigned_students || []).length > 0 && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Selected Individual Students
          </label>
          <div className="border border-gray-300 rounded-md p-4 max-h-60 overflow-auto">
            <div className="space-y-2">
              {formData.assigned_students.map((studentId) => {
                const student = selectedStudentsData[studentId];
                return (
                  <div key={studentId} className="flex items-center justify-between p-2 bg-gray-50 rounded border">
                    <div className="flex-1">
                      <div className="font-medium text-sm">
                        {student?.name || `Student ${studentId}`}
                      </div>
                      <div className="text-xs text-gray-500">
                        {student?.student_id || student?.roll_number || 'N/A'} • {student?.email || 'N/A'}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleAssignmentChange('student', studentId, false)}
                      className="ml-2 hover:text-red-600"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Access Password */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Access Password
        </label>
        <div className="space-y-2">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="enable_access_password"
              checked={!!formData.access_password}
              onCheckedChange={(checked) => {
                if (checked) {
                  // Generate 5-character alphanumeric password
                  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
                  let password = '';
                  for (let i = 0; i < 5; i++) {
                    password += chars.charAt(Math.floor(Math.random() * chars.length));
                  }
                  updateFormData({ access_password: password });
                } else {
                  updateFormData({ access_password: '' });
                }
              }}
            />
            <label htmlFor="enable_access_password" className="text-sm font-medium">
              Enable Access Password
            </label>
          </div>
          {formData.access_password && (
            <Input
              value={formData.access_password}
              onChange={(e) => updateFormData({ access_password: e.target.value })}
              placeholder="Access password"
              type="text"
              className="w-full"
            />
          )}
        </div>
      </div>
    </div>
  );
} 