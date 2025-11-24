import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';

// Icons
import {
  MessageSquare, Target, Edit, Trash2, Eye, Clock, Filter,
  BookOpen, Layers, Users, Building, GraduationCap, X,
  AlertTriangle, Info, CheckCircle, Star
} from 'lucide-react';

const ChartAnnotations = ({ annotations, module, filters }) => {
  const [selectedAnnotation, setSelectedAnnotation] = useState(null);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [newAnnotation, setNewAnnotation] = useState({
    title: '',
    comment: '',
    chartType: '',
    dataPoint: ''
  });

  const getChartTypeIcon = (chartType) => {
    switch (chartType) {
      case 'scoreDistribution':
        return <Target className="h-4 w-4" />;
      case 'submissionPatterns':
        return <Clock className="h-4 w-4" />;
      case 'assessmentTypePerformance':
        return <BookOpen className="h-4 w-4" />;
      case 'departmentPerformance':
        return <Building className="h-4 w-4" />;
      case 'enrollmentVsCompletion':
        return <Users className="h-4 w-4" />;
      case 'timeSpentPerChapter':
        return <Clock className="h-4 w-4" />;
      default:
        return <MessageSquare className="h-4 w-4" />;
    }
  };

  const getChartTypeName = (chartType) => {
    switch (chartType) {
      case 'scoreDistribution':
        return 'Score Distribution';
      case 'submissionPatterns':
        return 'Submission Patterns';
      case 'assessmentTypePerformance':
        return 'Assessment Type Performance';
      case 'departmentPerformance':
        return 'Department Performance';
      case 'enrollmentVsCompletion':
        return 'Enrollment vs Completion';
      case 'timeSpentPerChapter':
        return 'Time Spent per Chapter';
      default:
        return 'Chart';
    }
  };

  const getAnnotationPriority = (annotation) => {
    // This could be based on annotation content or user-defined priority
    if (annotation.title.toLowerCase().includes('important') || 
        annotation.title.toLowerCase().includes('critical')) {
      return 'high';
    }
    if (annotation.title.toLowerCase().includes('note') || 
        annotation.title.toLowerCase().includes('observation')) {
      return 'medium';
    }
    return 'low';
  };

  const getPriorityBadge = (priority) => {
    switch (priority) {
      case 'high':
        return <Badge className="bg-red-100 text-red-800">High Priority</Badge>;
      case 'medium':
        return <Badge className="bg-yellow-100 text-yellow-800">Medium Priority</Badge>;
      case 'low':
        return <Badge className="bg-green-100 text-green-800">Low Priority</Badge>;
      default:
        return null;
    }
  };

  const handleAddAnnotation = () => {
    // This would typically call an API to add the annotation
    // console.log('Adding annotation:', newAnnotation);
    setShowAddDialog(false);
    setNewAnnotation({ title: '', comment: '', chartType: '', dataPoint: '' });
  };

  const handleDeleteAnnotation = (annotationId) => {
    // This would typically call an API to delete the annotation
    // console.log('Deleting annotation:', annotationId);
  };

  const filteredAnnotations = annotations.filter(annotation => {
    // Filter by current module and filters
    return annotation.module === module;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            Chart Annotations
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            View and manage chart comments and observations
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Badge variant="secondary">
            {filteredAnnotations.length} annotations
          </Badge>
          <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
            <DialogTrigger asChild>
              <Button>
                <MessageSquare className="h-4 w-4 mr-2" />
                Add Annotation
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Chart Annotation</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="annotation-title">Title</Label>
                  <Input
                    id="annotation-title"
                    placeholder="Enter annotation title..."
                    value={newAnnotation.title}
                    onChange={(e) => setNewAnnotation(prev => ({ ...prev, title: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="annotation-chart">Chart Type</Label>
                  <select
                    id="annotation-chart"
                    className="w-full p-2 border rounded-md"
                    value={newAnnotation.chartType}
                    onChange={(e) => setNewAnnotation(prev => ({ ...prev, chartType: e.target.value }))}
                  >
                    <option value="">Select Chart Type</option>
                    <option value="scoreDistribution">Score Distribution</option>
                    <option value="submissionPatterns">Submission Patterns</option>
                    <option value="assessmentTypePerformance">Assessment Type Performance</option>
                    <option value="departmentPerformance">Department Performance</option>
                    <option value="enrollmentVsCompletion">Enrollment vs Completion</option>
                    <option value="timeSpentPerChapter">Time Spent per Chapter</option>
                  </select>
                </div>
                <div>
                  <Label htmlFor="annotation-comment">Comment</Label>
                  <Textarea
                    id="annotation-comment"
                    placeholder="Add your observation or comment..."
                    value={newAnnotation.comment}
                    onChange={(e) => setNewAnnotation(prev => ({ ...prev, comment: e.target.value }))}
                    rows={4}
                  />
                </div>
                <div className="flex justify-end space-x-2">
                  <Button variant="outline" onClick={() => setShowAddDialog(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleAddAnnotation} disabled={!newAnnotation.title.trim()}>
                    Add Annotation
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {filteredAnnotations.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
              No Annotations Yet
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Add annotations to charts to highlight important insights and observations.
            </p>
            <Button onClick={() => setShowAddDialog(true)}>
              <MessageSquare className="h-4 w-4 mr-2" />
              Add Your First Annotation
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredAnnotations.map((annotation) => (
            <Card key={annotation.id} className="hover:shadow-lg transition-all duration-300">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                      {getChartTypeIcon(annotation.chartType)}
                    </div>
                    <div>
                      <CardTitle className="text-lg">{annotation.title}</CardTitle>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {getChartTypeName(annotation.chartType)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {getPriorityBadge(getAnnotationPriority(annotation))}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedAnnotation(annotation)}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteAnnotation(annotation.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700 dark:text-gray-300 mb-4">
                  {annotation.comment}
                </p>
                <div className="flex items-center justify-between text-sm text-gray-500">
                  <div className="flex items-center space-x-2">
                    <Clock className="h-3 w-3" />
                    <span>{new Date(annotation.createdAt).toLocaleDateString()}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Users className="h-3 w-3" />
                    <span>{annotation.createdBy}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Annotation Detail Dialog */}
      {selectedAnnotation && (
        <Dialog open={!!selectedAnnotation} onOpenChange={() => setSelectedAnnotation(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center space-x-2">
                {getChartTypeIcon(selectedAnnotation.chartType)}
                <span>{selectedAnnotation.title}</span>
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">Chart Type</Label>
                  <p className="text-sm text-gray-600">{getChartTypeName(selectedAnnotation.chartType)}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Priority</Label>
                  <div className="mt-1">
                    {getPriorityBadge(getAnnotationPriority(selectedAnnotation))}
                  </div>
                </div>
              </div>
              <div>
                <Label className="text-sm font-medium">Comment</Label>
                <p className="text-sm text-gray-700 dark:text-gray-300 mt-1 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  {selectedAnnotation.comment}
                </p>
              </div>
              <Separator />
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <Label className="text-sm font-medium">Created</Label>
                  <p className="text-sm text-gray-600">
                    {new Date(selectedAnnotation.createdAt).toLocaleString()}
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Created By</Label>
                  <p className="text-sm text-gray-600">{selectedAnnotation.createdBy}</p>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default ChartAnnotations; 