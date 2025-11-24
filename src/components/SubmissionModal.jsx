import React, { useState } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle 
} from '../components/ui/dialog';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  Clock,
  FileText,
  Flag,
  Save
} from 'lucide-react';

const SubmissionModal = ({ 
  isOpen, 
  onClose, 
  onSubmit, 
  assessment, 
  answers, 
  questions,
  flaggedQuestions = new Set(),
  loading = false 
}) => {
  const [showDetails, setShowDetails] = useState(false);

  const answeredCount = Object.keys(answers).length;
  const unansweredCount = questions.length - answeredCount;
  const flaggedCount = flaggedQuestions.size;
  
  // Check for required questions that are unanswered
  const requiredQuestions = questions.filter(q => q.is_required !== false);
  const unansweredRequired = requiredQuestions.filter(q => !answers[q.id]);

  const getQuestionStatus = (question) => {
    if (answers[question.id]) {
      return {
        status: 'answered',
        icon: <CheckCircle className="h-4 w-4 text-green-600" />,
        color: 'text-green-600'
      };
    } else {
      return {
        status: 'unanswered',
        icon: <XCircle className="h-4 w-4 text-red-600" />,
        color: 'text-red-600'
      };
    }
  };

  const handleSubmit = () => {
    onSubmit();
  };

  const handleClose = () => {
    if (!loading) {
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Save className="h-5 w-5" />
            Submit Assessment
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Assessment Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">{assessment?.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-gray-400" />
                  <span>Duration: {assessment?.duration_minutes} minutes</span>
                </div>
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-gray-400" />
                  <span>Questions: {questions.length}</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span>Answered: {answeredCount}</span>
                </div>
                <div className="flex items-center gap-2">
                  <XCircle className="h-4 w-4 text-red-600" />
                  <span>Unanswered: {unansweredCount}</span>
                </div>
                {flaggedCount > 0 && (
                  <div className="flex items-center gap-2">
                    <Flag className="h-4 w-4 text-orange-600" />
                    <span>Flagged: {flaggedCount}</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
          
          {unansweredRequired.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5" />
                <div>
                  <h4 className="text-sm font-medium text-red-800 mb-1">
                    Required Questions Unanswered
                  </h4>
                  <p className="text-sm text-red-700">
                    You have {unansweredRequired.length} required question{unansweredRequired.length > 1 ? 's' : ''} that must be answered before submission.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Submission Status */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Submission Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Questions Answered</span>
                  <Badge variant={answeredCount === questions.length ? "default" : "secondary"}>
                    {answeredCount}/{questions.length}
                  </Badge>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm">Completion Rate</span>
                  <Badge variant={answeredCount === questions.length ? "default" : "secondary"}>
                    {Math.round((answeredCount / questions.length) * 100)}%
                  </Badge>
                </div>

                {unansweredCount > 0 && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                    <div className="flex items-center gap-2 text-yellow-800">
                      <AlertTriangle className="h-4 w-4" />
                      <span className="text-sm font-medium">
                        {unansweredCount} question{unansweredCount > 1 ? 's' : ''} remain{unansweredCount > 1 ? '' : 's'} unanswered
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Detailed Question Review */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center justify-between">
                <span>Question Review</span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowDetails(!showDetails)}
                >
                  {showDetails ? 'Hide Details' : 'Show Details'}
                </Button>
              </CardTitle>
            </CardHeader>
            
            {showDetails && (
              <CardContent>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {questions.map((question, index) => {
                    const status = getQuestionStatus(question);
                    const isFlagged = flaggedQuestions.has(question.id);
                    const answerText = answers[question.id];
                    const answerPreview = typeof answerText === 'string' 
                      ? (answerText.length > 50 ? answerText.substring(0, 50) + '...' : answerText)
                      : typeof answerText === 'object' && answerText?.code
                      ? `Code: ${answerText.language || 'N/A'}`
                      : answerText ? 'Answer provided' : '';
                    
                    return (
                      <div 
                        key={question.id}
                        className="flex items-center justify-between p-2 border rounded-lg hover:bg-gray-50"
                      >
                        <div className="flex items-center gap-3 flex-1">
                          {status.icon}
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium">
                                Question {index + 1}
                              </span>
                              {isFlagged && (
                                <Flag className="h-3 w-3 text-orange-600" />
                              )}
                              <span className="text-xs text-gray-500">
                                {question.points} pts
                              </span>
                            </div>
                            {answerPreview && (
                              <p className="text-xs text-gray-600 mt-1 truncate">
                                {answerPreview}
                              </p>
                            )}
                          </div>
                        </div>
                        <Badge 
                          variant={status.status === 'answered' ? 'default' : 'destructive'}
                          className="text-xs"
                        >
                          {status.status === 'answered' ? 'Answered' : 'Unanswered'}
                        </Badge>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            )}
          </Card>

          {/* Warning for Unanswered Questions (non-required) */}
          {unansweredCount > 0 && unansweredRequired.length === 0 && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
                <div>
                  <h4 className="text-sm font-medium text-yellow-800 mb-1">
                    Unanswered Questions
                  </h4>
                  <p className="text-sm text-yellow-700">
                    You have {unansweredCount} unanswered question{unansweredCount > 1 ? 's' : ''}. 
                    You can still submit, but unanswered questions will receive zero points.
                  </p>
                </div>
              </div>
            </div>
          )}
          
          {/* Error for Required Questions */}
          {unansweredRequired.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5" />
                <div>
                  <h4 className="text-sm font-medium text-red-800 mb-1">
                    Required Questions Unanswered
                  </h4>
                  <p className="text-sm text-red-700">
                    You cannot submit until you answer {unansweredRequired.length} required question{unansweredRequired.length > 1 ? 's' : ''}.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center justify-end space-x-3 pt-4 border-t">
            <Button
              variant="outline"
              onClick={handleClose}
              disabled={loading}
            >
              Cancel
            </Button>
            
            <Button
              onClick={handleSubmit}
              disabled={loading || unansweredRequired.length > 0}
              className="bg-green-600 hover:bg-green-700"
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Submitting...
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Save className="h-4 w-4" />
                  Submit Assessment
                </div>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SubmissionModal;
