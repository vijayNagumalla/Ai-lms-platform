import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { 
  CheckCircle, 
  Circle, 
  Flag, 
  Clock,
  Eye,
  EyeOff
} from 'lucide-react';

const NavigationPanel = ({ 
  questions, 
  currentIndex, 
  answers, 
  onNavigate, 
  onFlag 
}) => {
  // Load filter preferences from localStorage
  const [showAnsweredOnly, setShowAnsweredOnly] = useState(() => {
    if (typeof Storage !== 'undefined') {
      const saved = localStorage.getItem('navPanel_showAnsweredOnly');
      return saved === 'true';
    }
    return false;
  });
  const [showFlaggedOnly, setShowFlaggedOnly] = useState(() => {
    if (typeof Storage !== 'undefined') {
      const saved = localStorage.getItem('navPanel_showFlaggedOnly');
      return saved === 'true';
    }
    return false;
  });
  const [flaggedQuestions, setFlaggedQuestions] = useState(new Set());
  
  // Persist filter preferences
  useEffect(() => {
    if (typeof Storage !== 'undefined') {
      localStorage.setItem('navPanel_showAnsweredOnly', showAnsweredOnly.toString());
    }
  }, [showAnsweredOnly]);
  
  useEffect(() => {
    if (typeof Storage !== 'undefined') {
      localStorage.setItem('navPanel_showFlaggedOnly', showFlaggedOnly.toString());
    }
  }, [showFlaggedOnly]);

  const handleFlagQuestion = (questionId) => {
    const newFlagged = new Set(flaggedQuestions);
    if (newFlagged.has(questionId)) {
      newFlagged.delete(questionId);
    } else {
      newFlagged.add(questionId);
    }
    setFlaggedQuestions(newFlagged);
    
    if (onFlag) {
      onFlag(questionId);
    }
  };

  const getQuestionStatus = (question, index) => {
    const isAnswered = answers[question.id];
    const isFlagged = flaggedQuestions.has(question.id);
    const isCurrent = index === currentIndex;

    if (isCurrent) return 'current';
    if (isAnswered) return 'answered';
    if (isFlagged) return 'flagged';
    return 'unanswered';
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'answered':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'flagged':
        return <Flag className="h-4 w-4 text-orange-600" />;
      case 'current':
        return <Circle className="h-4 w-4 text-blue-600" />;
      default:
        return <Circle className="h-4 w-4 text-gray-400" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'answered':
        return 'bg-green-50 border-green-200 text-green-800';
      case 'flagged':
        return 'bg-orange-50 border-orange-200 text-orange-800';
      case 'current':
        return 'bg-blue-50 border-blue-200 text-blue-800';
      default:
        return 'bg-gray-50 border-gray-200 text-gray-800';
    }
  };

  const filteredQuestions = questions.filter((question, index) => {
    if (showAnsweredOnly && !answers[question.id]) return false;
    if (showFlaggedOnly && !flaggedQuestions.has(question.id)) return false;
    return true;
  });

  const answeredCount = questions.filter(q => answers[q.id]).length;
  const flaggedCount = flaggedQuestions.size;
  const unansweredCount = questions.length - answeredCount;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm flex items-center justify-between">
          <span>Question Navigation</span>
          <Badge variant="outline">
            {answeredCount}/{questions.length}
          </Badge>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Summary Stats */}
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="flex items-center space-x-1">
            <CheckCircle className="h-3 w-3 text-green-600" />
            <span>Answered: {answeredCount}</span>
          </div>
          <div className="flex items-center space-x-1">
            <Circle className="h-3 w-3 text-gray-400" />
            <span>Unanswered: {unansweredCount}</span>
          </div>
          <div className="flex items-center space-x-1">
            <Flag className="h-3 w-3 text-orange-600" />
            <span>Flagged: {flaggedCount}</span>
          </div>
          <div className="flex items-center space-x-1">
            <Clock className="h-3 w-3 text-blue-600" />
            <span>Total: {questions.length}</span>
          </div>
        </div>

        {/* Filter Buttons */}
        <div className="flex space-x-1">
          <Button
            variant={showAnsweredOnly ? "default" : "outline"}
            size="sm"
            onClick={() => setShowAnsweredOnly(!showAnsweredOnly)}
            className="flex-1 text-xs"
          >
            <Eye className="h-3 w-3 mr-1" />
            Answered
          </Button>
          <Button
            variant={showFlaggedOnly ? "default" : "outline"}
            size="sm"
            onClick={() => setShowFlaggedOnly(!showFlaggedOnly)}
            className="flex-1 text-xs"
          >
            <Flag className="h-3 w-3 mr-1" />
            Flagged
          </Button>
        </div>

        {/* Question Grid */}
        <div className="grid grid-cols-5 gap-1">
          {filteredQuestions.map((question, index) => {
            const originalIndex = questions.findIndex(q => q.id === question.id);
            const status = getQuestionStatus(question, originalIndex);
            const isCurrent = originalIndex === currentIndex;

            return (
              <Button
                key={question.id}
                variant="outline"
                size="sm"
                className={`h-8 w-8 p-0 text-xs relative ${
                  isCurrent ? 'ring-2 ring-blue-500' : ''
                } ${getStatusColor(status)}`}
                onClick={() => onNavigate(originalIndex)}
              >
                <div className="flex flex-col items-center">
                  {getStatusIcon(status)}
                  <span className="text-xs font-medium">
                    {originalIndex + 1}
                  </span>
                </div>
                
                {/* Flag indicator */}
                {flaggedQuestions.has(question.id) && (
                  <div className="absolute -top-1 -right-1">
                    <Flag className="h-3 w-3 text-orange-600" />
                  </div>
                )}
              </Button>
            );
          })}
        </div>

        {/* Legend */}
        <div className="space-y-2 text-xs">
          <div className="font-medium text-gray-700">Legend:</div>
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-3 w-3 text-green-600" />
              <span>Answered</span>
            </div>
            <div className="flex items-center space-x-2">
              <Flag className="h-3 w-3 text-orange-600" />
              <span>Flagged</span>
            </div>
            <div className="flex items-center space-x-2">
              <Circle className="h-3 w-3 text-blue-600" />
              <span>Current</span>
            </div>
            <div className="flex items-center space-x-2">
              <Circle className="h-3 w-3 text-gray-400" />
              <span>Unanswered</span>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="space-y-2">
          <Button
            variant="outline"
            size="sm"
            className="w-full text-xs"
            onClick={() => {
              const firstUnanswered = questions.findIndex(q => !answers[q.id]);
              if (firstUnanswered !== -1) {
                onNavigate(firstUnanswered);
              }
            }}
            disabled={answeredCount === questions.length}
          >
            Go to First Unanswered
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            className="w-full text-xs"
            onClick={() => {
              const firstFlagged = questions.findIndex(q => flaggedQuestions.has(q.id));
              if (firstFlagged !== -1) {
                onNavigate(firstFlagged);
              }
            }}
            disabled={flaggedCount === 0}
          >
            Go to First Flagged
          </Button>
        </div>

        {/* Progress Bar */}
        <div className="space-y-1">
          <div className="flex justify-between text-xs text-gray-600">
            <span>Progress</span>
            <span>{Math.round((answeredCount / questions.length) * 100)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-green-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${(answeredCount / questions.length) * 100}%` }}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default NavigationPanel;
