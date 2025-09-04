import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '@/components/ui/pagination';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

// Icons
import {
  Table as TableIcon, Search, Filter, Download, Eye, ChevronDown, ChevronUp,
  ArrowUpDown, Users, BookOpen, Target, Clock, Award, TrendingUp, TrendingDown,
  Building, GraduationCap, User, FileText, Activity, MoreHorizontal, ExternalLink
} from 'lucide-react';

const AnalyticsTables = ({ data, module, filters }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [selectedRow, setSelectedRow] = useState(null);
  const [activeTab, setActiveTab] = useState('summary');

  // Memoized filtered and sorted data
  const processedData = useMemo(() => {
    let filteredData = [];

    if (module === 'assessments') {
      // Assessment data processing
      if (data?.studentStats) {
        filteredData = data.studentStats.map(student => ({
          id: student.id,
          name: student.name,
          email: student.email,
          college: student.college,
          department: student.department,
          totalAssessments: student.totalAssessments,
          completedAssessments: student.completedAssessments,
          averageScore: student.averageScore,
          totalTimeTaken: student.totalTimeTaken,
          completionRate: student.completedAssessments / student.totalAssessments * 100,
          status: student.averageScore >= 70 ? 'Pass' : 'Fail'
        }));
      }
    } else {
      // Course data processing
      if (data?.courseStats) {
        filteredData = data.courseStats.map(course => ({
          id: course.id,
          title: course.title,
          instructor: course.instructor,
          category: course.category,
          totalEnrollments: course.totalEnrollments,
          completedEnrollments: course.completedEnrollments,
          completionRate: course.completedEnrollments / course.totalEnrollments * 100,
          averageTimeSpent: course.averageTimeSpent,
          averageRating: course.averageRating,
          status: course.completionRate >= 80 ? 'High' : course.completionRate >= 60 ? 'Medium' : 'Low'
        }));
      }
    }

    // Apply search filter
    if (searchTerm) {
      filteredData = filteredData.filter(item =>
        Object.values(item).some(value =>
          value?.toString().toLowerCase().includes(searchTerm.toLowerCase())
        )
      );
    }

    // Apply sorting
    if (sortConfig.key) {
      filteredData.sort((a, b) => {
        const aValue = a[sortConfig.key];
        const bValue = b[sortConfig.key];
        
        if (aValue < bValue) {
          return sortConfig.direction === 'asc' ? -1 : 1;
        }
        if (aValue > bValue) {
          return sortConfig.direction === 'asc' ? 1 : -1;
        }
        return 0;
      });
    }

    return filteredData;
  }, [data, module, searchTerm, sortConfig]);

  // Pagination
  const totalPages = Math.ceil(processedData.length / itemsPerPage);
  const paginatedData = processedData.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleSort = (key) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const getSortIcon = (key) => {
    if (sortConfig.key !== key) return <ArrowUpDown className="h-4 w-4" />;
    return sortConfig.direction === 'asc' ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />;
  };

  const getStatusBadge = (status, value) => {
    const getVariant = () => {
      if (status === 'Pass' || status === 'High') return 'default';
      if (status === 'Medium') return 'secondary';
      return 'destructive';
    };

    return (
      <Badge variant={getVariant()}>
        {status} {value && `(${value.toFixed(1)}%)`}
      </Badge>
    );
  };

  const renderAssessmentTable = () => (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>
            <Button variant="ghost" onClick={() => handleSort('name')} className="h-auto p-0">
              Student Name {getSortIcon('name')}
            </Button>
          </TableHead>
          <TableHead>
            <Button variant="ghost" onClick={() => handleSort('college')} className="h-auto p-0">
              College {getSortIcon('college')}
            </Button>
          </TableHead>
          <TableHead>
            <Button variant="ghost" onClick={() => handleSort('department')} className="h-auto p-0">
              Department {getSortIcon('department')}
            </Button>
          </TableHead>
          <TableHead>
            <Button variant="ghost" onClick={() => handleSort('totalAssessments')} className="h-auto p-0">
              Total {getSortIcon('totalAssessments')}
            </Button>
          </TableHead>
          <TableHead>
            <Button variant="ghost" onClick={() => handleSort('completedAssessments')} className="h-auto p-0">
              Completed {getSortIcon('completedAssessments')}
            </Button>
          </TableHead>
          <TableHead>
            <Button variant="ghost" onClick={() => handleSort('averageScore')} className="h-auto p-0">
              Avg Score {getSortIcon('averageScore')}
            </Button>
          </TableHead>
          <TableHead>
            <Button variant="ghost" onClick={() => handleSort('completionRate')} className="h-auto p-0">
              Completion % {getSortIcon('completionRate')}
            </Button>
          </TableHead>
          <TableHead>
            <Button variant="ghost" onClick={() => handleSort('totalTimeTaken')} className="h-auto p-0">
              Time (min) {getSortIcon('totalTimeTaken')}
            </Button>
          </TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {paginatedData.map((student) => (
          <TableRow key={student.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
            <TableCell className="font-medium">{student.name}</TableCell>
            <TableCell>{student.college}</TableCell>
            <TableCell>{student.department}</TableCell>
            <TableCell>{student.totalAssessments}</TableCell>
            <TableCell>{student.completedAssessments}</TableCell>
            <TableCell>{student.averageScore.toFixed(1)}%</TableCell>
            <TableCell>{student.completionRate.toFixed(1)}%</TableCell>
            <TableCell>{student.totalTimeTaken}</TableCell>
            <TableCell>
              {getStatusBadge(student.status, student.averageScore)}
            </TableCell>
            <TableCell>
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="ghost" size="sm">
                    <Eye className="h-4 w-4" />
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>Student Details: {student.name}</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium">Email</label>
                        <p className="text-sm text-gray-600">{student.email}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium">College</label>
                        <p className="text-sm text-gray-600">{student.college}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium">Department</label>
                        <p className="text-sm text-gray-600">{student.department}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium">Status</label>
                        <p className="text-sm">{getStatusBadge(student.status, student.averageScore)}</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                      <div className="text-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                        <div className="text-2xl font-bold text-blue-600">{student.totalAssessments}</div>
                        <div className="text-sm text-gray-600">Total Assessments</div>
                      </div>
                      <div className="text-center p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                        <div className="text-2xl font-bold text-green-600">{student.averageScore.toFixed(1)}%</div>
                        <div className="text-sm text-gray-600">Average Score</div>
                      </div>
                      <div className="text-center p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                        <div className="text-2xl font-bold text-purple-600">{student.completionRate.toFixed(1)}%</div>
                        <div className="text-sm text-gray-600">Completion Rate</div>
                      </div>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );

  const renderCourseTable = () => (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>
            <Button variant="ghost" onClick={() => handleSort('title')} className="h-auto p-0">
              Course Title {getSortIcon('title')}
            </Button>
          </TableHead>
          <TableHead>
            <Button variant="ghost" onClick={() => handleSort('instructor')} className="h-auto p-0">
              Instructor {getSortIcon('instructor')}
            </Button>
          </TableHead>
          <TableHead>
            <Button variant="ghost" onClick={() => handleSort('category')} className="h-auto p-0">
              Category {getSortIcon('category')}
            </Button>
          </TableHead>
          <TableHead>
            <Button variant="ghost" onClick={() => handleSort('totalEnrollments')} className="h-auto p-0">
              Enrollments {getSortIcon('totalEnrollments')}
            </Button>
          </TableHead>
          <TableHead>
            <Button variant="ghost" onClick={() => handleSort('completedEnrollments')} className="h-auto p-0">
              Completed {getSortIcon('completedEnrollments')}
            </Button>
          </TableHead>
          <TableHead>
            <Button variant="ghost" onClick={() => handleSort('completionRate')} className="h-auto p-0">
              Completion % {getSortIcon('completionRate')}
            </Button>
          </TableHead>
          <TableHead>
            <Button variant="ghost" onClick={() => handleSort('averageTimeSpent')} className="h-auto p-0">
              Avg Time {getSortIcon('averageTimeSpent')}
            </Button>
          </TableHead>
          <TableHead>
            <Button variant="ghost" onClick={() => handleSort('averageRating')} className="h-auto p-0">
              Rating {getSortIcon('averageRating')}
            </Button>
          </TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {paginatedData.map((course) => (
          <TableRow key={course.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
            <TableCell className="font-medium">{course.title}</TableCell>
            <TableCell>{course.instructor}</TableCell>
            <TableCell>{course.category}</TableCell>
            <TableCell>{course.totalEnrollments}</TableCell>
            <TableCell>{course.completedEnrollments}</TableCell>
            <TableCell>{course.completionRate.toFixed(1)}%</TableCell>
            <TableCell>{course.averageTimeSpent} hrs</TableCell>
            <TableCell>{course.averageRating.toFixed(1)}/5</TableCell>
            <TableCell>
              {getStatusBadge(course.status, course.completionRate)}
            </TableCell>
            <TableCell>
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="ghost" size="sm">
                    <Eye className="h-4 w-4" />
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>Course Details: {course.title}</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium">Instructor</label>
                        <p className="text-sm text-gray-600">{course.instructor}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium">Category</label>
                        <p className="text-sm text-gray-600">{course.category}</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                      <div className="text-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                        <div className="text-2xl font-bold text-blue-600">{course.totalEnrollments}</div>
                        <div className="text-sm text-gray-600">Total Enrollments</div>
                      </div>
                      <div className="text-center p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                        <div className="text-2xl font-bold text-green-600">{course.completionRate.toFixed(1)}%</div>
                        <div className="text-sm text-gray-600">Completion Rate</div>
                      </div>
                      <div className="text-center p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                        <div className="text-2xl font-bold text-purple-600">{course.averageRating.toFixed(1)}/5</div>
                        <div className="text-sm text-gray-600">Average Rating</div>
                      </div>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            Tabular Reports
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Detailed {module === 'assessments' ? 'student performance' : 'course analytics'} data
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Badge variant="secondary">
            {processedData.length} records
          </Badge>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center space-x-2">
              <TableIcon className="h-5 w-5" />
              <span>{module === 'assessments' ? 'Student Performance' : 'Course Analytics'} Table</span>
            </CardTitle>
            <div className="flex items-center space-x-2">
              <Input
                placeholder="Search..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-64"
                icon={<Search className="h-4 w-4" />}
              />
              <Select value={itemsPerPage.toString()} onValueChange={(value) => setItemsPerPage(parseInt(value))}>
                <SelectTrigger className="w-24">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="25">25</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                  <SelectItem value="100">100</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {processedData.length === 0 ? (
            <div className="text-center py-8">
              <TableIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No data available for the current filters</p>
            </div>
          ) : (
            <>
              {module === 'assessments' ? renderAssessmentTable() : renderCourseTable()}
              
              {/* Pagination */}
              {totalPages > 1 && (
                <div className="mt-6 flex items-center justify-between">
                  <div className="text-sm text-gray-600">
                    Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, processedData.length)} of {processedData.length} results
                  </div>
                  <Pagination>
                    <PaginationContent>
                      <PaginationItem>
                        <PaginationPrevious 
                          onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                          disabled={currentPage === 1}
                        />
                      </PaginationItem>
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                        <PaginationItem key={page}>
                          <PaginationLink
                            onClick={() => setCurrentPage(page)}
                            isActive={currentPage === page}
                          >
                            {page}
                          </PaginationLink>
                        </PaginationItem>
                      ))}
                      <PaginationItem>
                        <PaginationNext 
                          onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                          disabled={currentPage === totalPages}
                        />
                      </PaginationItem>
                    </PaginationContent>
                  </Pagination>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AnalyticsTables; 