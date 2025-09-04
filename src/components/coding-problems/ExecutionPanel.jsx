import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { 
  Play, 
  RotateCcw, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  Clock,
  Zap,
  Loader2
} from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

const ExecutionPanel = ({
  onExecute,
  onReset,
  isExecuting = false,
  results = null,
  showInput = true,
  input = '',
  onInputChange,
  language = 'javascript'
}) => {
  const { toast } = useToast();
  const [customInput, setCustomInput] = useState(input);

  const handleExecute = () => {
    if (onExecute) {
      onExecute(customInput);
    }
  };

  const handleReset = () => {
    setCustomInput('');
    if (onReset) {
      onReset();
    }
  };

  const getVerdictIcon = (verdict) => {
    switch (verdict?.status) {
      case 'accepted':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'wrong_answer':
      case 'compilation_error':
      case 'runtime_error':
      case 'time_limit_exceeded':
      case 'memory_limit_exceeded':
        return <XCircle className="h-5 w-5 text-red-500" />;
      default:
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
    }
  };

  const getVerdictBadge = (verdict) => {
    if (!verdict) return null;

    const status = verdict.status;
    const message = verdict.message;

    switch (status) {
      case 'accepted':
        return <Badge className="bg-green-100 text-green-800">Accepted</Badge>;
      case 'wrong_answer':
        return <Badge className="bg-red-100 text-red-800">Wrong Answer</Badge>;
      case 'compilation_error':
        return <Badge className="bg-red-100 text-red-800">Compilation Error</Badge>;
      case 'runtime_error':
        return <Badge className="bg-red-100 text-red-800">Runtime Error</Badge>;
      case 'time_limit_exceeded':
        return <Badge className="bg-orange-100 text-orange-800">Time Limit Exceeded</Badge>;
      case 'memory_limit_exceeded':
        return <Badge className="bg-orange-100 text-orange-800">Memory Limit Exceeded</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800">{message}</Badge>;
    }
  };

  const formatTime = (time) => {
    if (!time) return 'N/A';
    return `${(time * 1000).toFixed(2)}ms`;
  };

  const formatMemory = (memory) => {
    if (!memory) return 'N/A';
    return `${(memory / 1024).toFixed(2)}MB`;
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Code Execution</CardTitle>
          <div className="flex items-center space-x-2">
            <Button
              onClick={handleExecute}
              disabled={isExecuting}
              size="sm"
            >
              {isExecuting ? (
                <Loader2 className="h-4 w-4 mr-1 animate-spin" />
              ) : (
                <Play className="h-4 w-4 mr-1" />
              )}
              {isExecuting ? 'Running...' : 'Run Code'}
            </Button>
            <Button
              variant="outline"
              onClick={handleReset}
              disabled={isExecuting}
              size="sm"
            >
              <RotateCcw className="h-4 w-4 mr-1" />
              Reset
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Custom Input */}
        {showInput && (
          <div className="space-y-2">
            <Label htmlFor="customInput">Custom Input (Optional)</Label>
            <Textarea
              id="customInput"
              placeholder="Enter custom input for testing..."
              value={customInput}
              onChange={(e) => setCustomInput(e.target.value)}
              rows={3}
              disabled={isExecuting}
            />
          </div>
        )}

        {/* Results */}
        {results && (
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              {getVerdictIcon(results.verdict)}
              <span className="font-medium">Execution Result</span>
              {getVerdictBadge(results.verdict)}
            </div>

            {/* Performance Metrics */}
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center space-x-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">Time: {formatTime(results.time)}</span>
              </div>
              <div className="flex items-center space-x-2">
                <Zap className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">Memory: {formatMemory(results.memory)}</span>
              </div>
            </div>

            {/* Output */}
            {results.output && (
              <div className="space-y-2">
                <Label className="text-sm font-medium">Output:</Label>
                <div className="p-3 bg-muted rounded text-sm font-mono whitespace-pre-wrap">
                  {results.output}
                </div>
              </div>
            )}

            {/* Error */}
            {results.error && (
              <div className="space-y-2">
                <Label className="text-sm font-medium text-red-600">Error:</Label>
                <div className="p-3 bg-red-50 border border-red-200 rounded text-sm font-mono text-red-700 whitespace-pre-wrap">
                  {results.error}
                </div>
              </div>
            )}

            {/* Compilation Output */}
            {results.compileOutput && (
              <div className="space-y-2">
                <Label className="text-sm font-medium text-orange-600">Compilation Output:</Label>
                <div className="p-3 bg-orange-50 border border-orange-200 rounded text-sm font-mono text-orange-700 whitespace-pre-wrap">
                  {results.compileOutput}
                </div>
              </div>
            )}

            {/* Wrong Answer Details */}
            {results.verdict?.status === 'wrong_answer' && results.verdict?.details && (
              <div className="space-y-2">
                <Label className="text-sm font-medium text-red-600">Expected vs Actual:</Label>
                <div className="grid gap-2 md:grid-cols-2">
                  <div>
                    <span className="text-xs text-muted-foreground">Expected:</span>
                    <div className="p-2 bg-green-50 border border-green-200 rounded text-sm font-mono">
                      {results.verdict.details.expected || '(empty)'}
                    </div>
                  </div>
                  <div>
                    <span className="text-xs text-muted-foreground">Actual:</span>
                    <div className="p-2 bg-red-50 border border-red-200 rounded text-sm font-mono">
                      {results.verdict.details.actual || '(empty)'}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* No Results */}
        {!results && !isExecuting && (
          <div className="text-center py-8 text-muted-foreground">
            <Play className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>Click "Run Code" to execute your program</p>
          </div>
        )}

        {/* Loading State */}
        {isExecuting && (
          <div className="text-center py-8">
            <Loader2 className="h-8 w-8 mx-auto mb-2 animate-spin text-primary" />
            <p className="text-muted-foreground">Executing code...</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ExecutionPanel; 