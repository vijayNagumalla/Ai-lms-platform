import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { 
  Plus, 
  Trash, 
  Edit, 
  Check, 
  X, 
  Eye, 
  EyeOff,
  Copy,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

const TestCaseManager = ({
  testCases = [],
  onTestCasesChange,
  showHidden = false,
  onToggleHidden,
  readOnly = false,
  showResults = false,
  results = []
}) => {
  const { toast } = useToast();
  const [editingIndex, setEditingIndex] = useState(-1);
  const [newTestCase, setNewTestCase] = useState({
    input: '',
    expectedOutput: '',
    isHidden: false,
    description: ''
  });

  const handleAddTestCase = () => {
    if (!newTestCase.input.trim() && !newTestCase.expectedOutput.trim()) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please provide at least input or expected output"
      });
      return;
    }

    const updatedTestCases = [...testCases, { ...newTestCase, id: Date.now() }];
    onTestCasesChange(updatedTestCases);
    setNewTestCase({ input: '', expectedOutput: '', isHidden: false, description: '' });
    
    toast({
      title: "Success",
      description: "Test case added successfully"
    });
  };

  const handleEditTestCase = (index) => {
    setEditingIndex(index);
    setNewTestCase({ ...testCases[index] });
  };

  const handleSaveEdit = () => {
    if (editingIndex >= 0) {
      const updatedTestCases = [...testCases];
      updatedTestCases[editingIndex] = { ...newTestCase };
      onTestCasesChange(updatedTestCases);
      setEditingIndex(-1);
      setNewTestCase({ input: '', expectedOutput: '', isHidden: false, description: '' });
      
      toast({
        title: "Success",
        description: "Test case updated successfully"
      });
    }
  };

  const handleCancelEdit = () => {
    setEditingIndex(-1);
    setNewTestCase({ input: '', expectedOutput: '', isHidden: false, description: '' });
  };

  const handleDeleteTestCase = (index) => {
    const updatedTestCases = testCases.filter((_, i) => i !== index);
    onTestCasesChange(updatedTestCases);
    
    toast({
      title: "Success",
      description: "Test case deleted successfully"
    });
  };

  const handleCopyTestCase = (testCase) => {
    const text = `Input: ${testCase.input}\nExpected Output: ${testCase.expectedOutput}`;
    navigator.clipboard.writeText(text);
    
    toast({
      title: "Copied",
      description: "Test case copied to clipboard"
    });
  };

  const getTestCaseResult = (index) => {
    if (!showResults || !results[index]) return null;
    return results[index];
  };

  const getResultIcon = (result) => {
    if (!result) return null;
    
    if (result.success && result.verdict?.status === 'accepted') {
      return <CheckCircle className="h-4 w-4 text-green-500" />;
    } else {
      return <XCircle className="h-4 w-4 text-red-500" />;
    }
  };

  const getResultBadge = (result) => {
    if (!result) return null;
    
    if (result.success && result.verdict?.status === 'accepted') {
      return <Badge className="bg-green-100 text-green-800">Passed</Badge>;
    } else {
      return <Badge className="bg-red-100 text-red-800">Failed</Badge>;
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Test Cases</CardTitle>
          <div className="flex items-center space-x-2">
            {onToggleHidden && (
              <Button
                variant="outline"
                size="sm"
                onClick={onToggleHidden}
              >
                {showHidden ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                {showHidden ? 'Hide' : 'Show'} Hidden
              </Button>
            )}
            {!readOnly && (
              <Button
                size="sm"
                onClick={handleAddTestCase}
                disabled={!newTestCase.input.trim() && !newTestCase.expectedOutput.trim()}
              >
                <Plus className="h-4 w-4 mr-1" />
                Add Test Case
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Add/Edit Test Case Form */}
        {!readOnly && (
          <Card className="border-dashed">
            <CardContent className="pt-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="input">Input</Label>
                  <Textarea
                    id="input"
                    placeholder="Enter test input..."
                    value={newTestCase.input}
                    onChange={(e) => setNewTestCase({ ...newTestCase, input: e.target.value })}
                    rows={3}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="expectedOutput">Expected Output</Label>
                  <Textarea
                    id="expectedOutput"
                    placeholder="Enter expected output..."
                    value={newTestCase.expectedOutput}
                    onChange={(e) => setNewTestCase({ ...newTestCase, expectedOutput: e.target.value })}
                    rows={3}
                  />
                </div>
              </div>
              <div className="grid gap-4 md:grid-cols-2 mt-4">
                <div className="space-y-2">
                  <Label htmlFor="description">Description (Optional)</Label>
                  <Input
                    id="description"
                    placeholder="Test case description..."
                    value={newTestCase.description}
                    onChange={(e) => setNewTestCase({ ...newTestCase, description: e.target.value })}
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="isHidden"
                    checked={newTestCase.isHidden}
                    onChange={(e) => setNewTestCase({ ...newTestCase, isHidden: e.target.checked })}
                    className="rounded"
                  />
                  <Label htmlFor="isHidden">Hidden Test Case</Label>
                </div>
              </div>
              {editingIndex >= 0 && (
                <div className="flex space-x-2 mt-4">
                  <Button size="sm" onClick={handleSaveEdit}>
                    <Check className="h-4 w-4 mr-1" />
                    Save
                  </Button>
                  <Button size="sm" variant="outline" onClick={handleCancelEdit}>
                    <X className="h-4 w-4 mr-1" />
                    Cancel
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Test Cases List */}
        <div className="space-y-3">
          {testCases.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>No test cases added yet.</p>
              {!readOnly && <p className="text-sm">Add your first test case above.</p>}
            </div>
          ) : (
            testCases.map((testCase, index) => {
              // Skip hidden test cases if not showing hidden
              if (testCase.isHidden && !showHidden) return null;
              
              const result = getTestCaseResult(index);
              const isEditing = editingIndex === index;

              return (
                <Card key={testCase.id || index} className="relative">
                  <CardContent className="pt-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <span className="font-medium">Test Case {index + 1}</span>
                          {testCase.isHidden && (
                            <Badge variant="secondary" className="text-xs">
                              Hidden
                            </Badge>
                          )}
                          {result && getResultIcon(result)}
                          {result && getResultBadge(result)}
                        </div>
                        
                        {testCase.description && (
                          <p className="text-sm text-muted-foreground mb-2">
                            {testCase.description}
                          </p>
                        )}

                        <div className="grid gap-4 md:grid-cols-2">
                          <div>
                            <Label className="text-sm font-medium">Input:</Label>
                            <div className="mt-1 p-2 bg-muted rounded text-sm font-mono">
                              {testCase.input || '(empty)'}
                            </div>
                          </div>
                          <div>
                            <Label className="text-sm font-medium">Expected Output:</Label>
                            <div className="mt-1 p-2 bg-muted rounded text-sm font-mono">
                              {testCase.expectedOutput || '(empty)'}
                            </div>
                          </div>
                        </div>

                        {/* Show actual output if results are available */}
                        {result && result.output && (
                          <div className="mt-3">
                            <Label className="text-sm font-medium">Actual Output:</Label>
                            <div className="mt-1 p-2 bg-muted rounded text-sm font-mono">
                              {result.output || '(no output)'}
                            </div>
                          </div>
                        )}

                        {/* Show error if any */}
                        {result && result.error && (
                          <div className="mt-3">
                            <Label className="text-sm font-medium text-red-600">Error:</Label>
                            <div className="mt-1 p-2 bg-red-50 border border-red-200 rounded text-sm font-mono text-red-700">
                              {result.error}
                            </div>
                          </div>
                        )}
                      </div>

                      {!readOnly && (
                        <div className="flex items-center space-x-1 ml-4">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleCopyTestCase(testCase)}
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditTestCase(index)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteTestCase(index)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default TestCaseManager; 