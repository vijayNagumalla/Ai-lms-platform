import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Trash2, Copy, Check, Play, AlertCircle } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';

const TestCaseManager = ({ 
  testCases, 
  onChange, 
  onRunTests, 
  isRunning = false, 
  results = null,
  showResults = false 
}) => {
  const { toast } = useToast();

  const addTestCase = () => {
    onChange([...testCases, { input: '', output: '', description: '', hidden: false }]);
  };

  const removeTestCase = (index) => {
    if (testCases.length > 1) {
      onChange(testCases.filter((_, i) => i !== index));
    }
  };

  const updateTestCase = (index, field, value) => {
    const updated = testCases.map((tc, i) => 
      i === index ? { ...tc, [field]: value } : tc
    );
    onChange(updated);
  };

  const copyTestCase = (testCase) => {
    const text = `Input: ${testCase.input}\nOutput: ${testCase.output}`;
    navigator.clipboard.writeText(text);
    toast({ title: 'Test case copied to clipboard' });
  };

  const handleRunTests = () => {
    if (onRunTests) {
      onRunTests();
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Test Cases</h3>
        <div className="flex gap-2">
          {onRunTests && (
            <Button 
              type="button" 
              onClick={handleRunTests} 
              size="sm"
              disabled={isRunning}
            >
              {isRunning ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Running...
                </>
              ) : (
                <>
                  <Play className="mr-2 h-4 w-4" />
                  Run Tests
                </>
              )}
            </Button>
          )}
          <Button type="button" onClick={addTestCase} size="sm">
            <Plus className="mr-2 h-4 w-4" />
            Add Test Case
          </Button>
        </div>
      </div>

      {/* Test Results */}
      {results && (
        <Card className="border-2">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              Test Results
              <Badge variant={results.passed === results.total ? "default" : "destructive"}>
                {results.passed}/{results.total} Passed
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {results.results?.map((result, index) => (
                <div key={index} className="flex items-center gap-2 p-2 rounded border">
                  {result.passed ? (
                    <Check className="h-4 w-4 text-green-600" />
                  ) : (
                    <AlertCircle className="h-4 w-4 text-red-600" />
                  )}
                  <span className="text-sm">
                    Test Case {result.testCase}: {result.passed ? 'Passed' : 'Failed'}
                  </span>
                  {showResults && !result.passed && (
                    <div className="text-xs text-gray-600 ml-2">
                      Expected: {result.expected} | Got: {result.actual}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
      
      <div className="space-y-3">
        {testCases.map((testCase, index) => (
          <Card key={index} className="border-2">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Test Case {index + 1}</CardTitle>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => copyTestCase(testCase)}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => removeTestCase(index)}
                    disabled={testCases.length === 1}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <label className="block text-sm font-medium mb-1">Description (Optional)</label>
                <Input
                  placeholder="e.g., Basic case, edge case, large input..."
                  value={testCase.description || ''}
                  onChange={(e) => updateTestCase(index, 'description', e.target.value)}
                />
              </div>
              <div className="flex items-center gap-2 mb-2">
                <Checkbox
                  id={`hidden-${index}`}
                  checked={!!testCase.hidden}
                  onCheckedChange={val => updateTestCase(index, 'hidden', val)}
                />
                <label htmlFor={`hidden-${index}`} className="text-sm">Hidden Test Case</label>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium mb-1">Input</label>
                  <Textarea
                    placeholder="e.g., [1,2,3]\n4\n5 or multi-line input"
                    value={testCase.input}
                    onChange={(e) => updateTestCase(index, 'input', e.target.value)}
                    rows={3}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Expected Output</label>
                  <Textarea
                    placeholder="e.g., 6 or multi-line output"
                    value={testCase.output}
                    onChange={(e) => updateTestCase(index, 'output', e.target.value)}
                    rows={3}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default TestCaseManager; 