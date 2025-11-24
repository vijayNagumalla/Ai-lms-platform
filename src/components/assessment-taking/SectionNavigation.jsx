import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  BookOpen, 
  CheckCircle, 
  Circle, 
  Flag, 
  Clock,
  Target,
  Code,
  FileText,
  ArrowRight,
  ArrowLeft,
  Eye,
  EyeOff
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const SectionNavigation = ({ 
  questions, 
  sections, 
  currentIndex, 
  currentSectionIndex,
  answers, 
  flaggedQuestions, 
  onNavigate, 
  onNavigateToSection,
  onFlag 
}) => {
  const [expandedSections, setExpandedSections] = useState(new Set());
  const [showOnlyUnanswered, setShowOnlyUnanswered] = useState(false);

  const toggleSection = (sectionId) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(sectionId)) {
      newExpanded.delete(sectionId);
    } else {
      newExpanded.add(sectionId);
    }
    setExpandedSections(newExpanded);
  };

  const getQuestionTypeIcon = (questionType) => {
    switch (questionType) {
      case 'coding':
        return <Code className="h-3 w-3" />;
      case 'essay':
        return <FileText className="h-3 w-3" />;
      case 'multiple_choice':
      case 'true_false':
        return <Target className="h-3 w-3" />;
      default:
        return <BookOpen className="h-3 w-3" />;
    }
  };

  const getQuestionStatus = (question) => {
    const isAnswered = answers[question.id];
    const isFlagged = flaggedQuestions.has(question.id);
    const isCurrent = questions[currentIndex]?.id === question.id;
    
    return { isAnswered, isFlagged, isCurrent };
  };

  const getSectionProgress = (section) => {
    const sectionQuestions = questions.filter(q => q.section_id === section.id);
    const answeredInSection = sectionQuestions.filter(q => answers[q.id]).length;
    
    return {
      answered: answeredInSection,
      total: sectionQuestions.length,
      percentage: sectionQuestions.length > 0 ? (answeredInSection / sectionQuestions.length) * 100 : 0
    };
  };

  const filteredQuestions = showOnlyUnanswered 
    ? questions.filter(q => !answers[q.id])
    : questions;

  const filteredSections = sections.filter(section => {
    if (!showOnlyUnanswered) return true;
    const sectionQuestions = questions.filter(q => q.section_id === section.id);
    return sectionQuestions.some(q => !answers[q.id]);
  });

  const getQuestionNumber = (question) => {
    return questions.findIndex(q => q.id === question.id) + 1;
  };

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowOnlyUnanswered(!showOnlyUnanswered)}
            className={showOnlyUnanswered ? 'bg-blue-100' : ''}
          >
            {showOnlyUnanswered ? <EyeOff className="h-4 w-4 mr-1" /> : <Eye className="h-4 w-4 mr-1" />}
            {showOnlyUnanswered ? 'Show All' : 'Unanswered Only'}
          </Button>
        </div>
        
        <div className="text-xs text-gray-500">
          {Object.keys(answers).length} / {questions.length} answered
        </div>
      </div>

      {/* Sections */}
      {sections.length > 0 ? (
        <div className="space-y-2">
          {filteredSections.map((section, sectionIndex) => {
            const sectionQuestions = questions.filter(q => q.section_id === section.id);
            const progress = getSectionProgress(section);
            const isExpanded = expandedSections.has(section.id);
            const isCurrentSection = currentSectionIndex === sectionIndex;
            
            return (
              <Card key={section.id} className={`${isCurrentSection ? 'ring-2 ring-blue-500' : ''}`}>
                <CardHeader 
                  className="p-3 cursor-pointer"
                  onClick={() => toggleSection(section.id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className={`w-2 h-2 rounded-full ${
                        progress.percentage === 100 ? 'bg-green-500' :
                        progress.percentage > 0 ? 'bg-yellow-500' : 'bg-gray-300'
                      }`}></div>
                      <CardTitle className="text-sm">{section.name}</CardTitle>
                      <Badge variant="outline" className="text-xs">
                        {progress.answered}/{progress.total}
                      </Badge>
                    </div>
                    
                    <div className="flex items-center space-x-1">
                      <div className="w-16 bg-gray-200 rounded-full h-1">
                        <div 
                          className="bg-blue-600 h-1 rounded-full transition-all duration-300"
                          style={{ width: `${progress.percentage}%` }}
                        ></div>
                      </div>
                      {isExpanded ? <ArrowLeft className="h-3 w-3" /> : <ArrowRight className="h-3 w-3" />}
                    </div>
                  </div>
                  
                  {section.description && (
                    <p className="text-xs text-gray-600 mt-1">{section.description}</p>
                  )}
                </CardHeader>
                
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <CardContent className="p-3 pt-0">
                        <div className="space-y-1">
                          {sectionQuestions.map((question) => {
                            const { isAnswered, isFlagged, isCurrent } = getQuestionStatus(question);
                            
                            if (showOnlyUnanswered && isAnswered) return null;
                            
                            return (
                              <div
                                key={question.id}
                                className={`flex items-center justify-between p-2 rounded-lg cursor-pointer transition-colors ${
                                  isCurrent 
                                    ? 'bg-blue-100 border border-blue-300' 
                                    : 'hover:bg-gray-50'
                                }`}
                                onClick={() => onNavigate(getQuestionNumber(question) - 1)}
                              >
                                <div className="flex items-center space-x-2">
                                  <div className="flex items-center space-x-1">
                                    {isAnswered ? (
                                      <CheckCircle className="h-3 w-3 text-green-600" />
                                    ) : (
                                      <Circle className="h-3 w-3 text-gray-400" />
                                    )}
                                    <span className="text-xs font-medium">
                                      Q{getQuestionNumber(question)}
                                    </span>
                                  </div>
                                  
                                  <div className="flex items-center space-x-1">
                                    {getQuestionTypeIcon(question.question_type)}
                                    <span className="text-xs text-gray-600">
                                      {question.question_type.replace('_', ' ')}
                                    </span>
                                  </div>
                                  
                                  <Badge variant="outline" className="text-xs">
                                    {question.points || 1} pts
                                  </Badge>
                                </div>
                                
                                <div className="flex items-center space-x-1">
                                  {isFlagged && (
                                    <Flag className="h-3 w-3 text-yellow-600" />
                                  )}
                                  
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      onFlag(question.id);
                                    }}
                                    className="h-6 w-6 p-0"
                                  >
                                    <Flag className={`h-3 w-3 ${isFlagged ? 'text-yellow-600' : 'text-gray-400'}`} />
                                  </Button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </CardContent>
                    </motion.div>
                  )}
                </AnimatePresence>
              </Card>
            );
          })}
        </div>
      ) : (
        /* Questions without sections */
        <div className="space-y-1">
          {filteredQuestions.map((question, index) => {
            const { isAnswered, isFlagged, isCurrent } = getQuestionStatus(question);
            
            return (
              <div
                key={question.id}
                className={`flex items-center justify-between p-2 rounded-lg cursor-pointer transition-colors ${
                  isCurrent 
                    ? 'bg-blue-100 border border-blue-300' 
                    : 'hover:bg-gray-50'
                }`}
                onClick={() => onNavigate(index)}
              >
                <div className="flex items-center space-x-2">
                  <div className="flex items-center space-x-1">
                    {isAnswered ? (
                      <CheckCircle className="h-3 w-3 text-green-600" />
                    ) : (
                      <Circle className="h-3 w-3 text-gray-400" />
                    )}
                    <span className="text-xs font-medium">Q{index + 1}</span>
                  </div>
                  
                  <div className="flex items-center space-x-1">
                    {getQuestionTypeIcon(question.question_type)}
                    <span className="text-xs text-gray-600">
                      {question.question_type.replace('_', ' ')}
                    </span>
                  </div>
                  
                  <Badge variant="outline" className="text-xs">
                    {question.points || 1} pts
                  </Badge>
                </div>
                
                <div className="flex items-center space-x-1">
                  {isFlagged && (
                    <Flag className="h-3 w-3 text-yellow-600" />
                  )}
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      onFlag(question.id);
                    }}
                    className="h-6 w-6 p-0"
                  >
                    <Flag className={`h-3 w-3 ${isFlagged ? 'text-yellow-600' : 'text-gray-400'}`} />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Quick Navigation */}
      <div className="space-y-2">
        <div className="text-xs font-medium text-gray-600">Quick Navigation</div>
        
        <div className="grid grid-cols-2 gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              const unansweredIndex = questions.findIndex(q => !answers[q.id]);
              if (unansweredIndex !== -1) {
                onNavigate(unansweredIndex);
              }
            }}
            disabled={Object.keys(answers).length === questions.length}
          >
            <ArrowRight className="h-3 w-3 mr-1" />
            Next Unanswered
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              const flaggedIndex = questions.findIndex(q => flaggedQuestions.has(q.id));
              if (flaggedIndex !== -1) {
                onNavigate(flaggedIndex);
              }
            }}
            disabled={flaggedQuestions.size === 0}
          >
            <Flag className="h-3 w-3 mr-1" />
            Next Flagged
          </Button>
        </div>
      </div>

      {/* Summary */}
      <div className="bg-gray-50 p-3 rounded-lg">
        <div className="text-xs font-medium text-gray-600 mb-2">Progress Summary</div>
        
        <div className="space-y-1">
          <div className="flex justify-between text-xs">
            <span>Answered:</span>
            <span className="text-green-600 font-medium">
              {Object.keys(answers).length}
            </span>
          </div>
          
          <div className="flex justify-between text-xs">
            <span>Flagged:</span>
            <span className="text-yellow-600 font-medium">
              {flaggedQuestions.size}
            </span>
          </div>
          
          <div className="flex justify-between text-xs">
            <span>Remaining:</span>
            <span className="text-gray-600 font-medium">
              {questions.length - Object.keys(answers).length}
            </span>
          </div>
        </div>
        
        <div className="mt-2">
          <div className="w-full bg-gray-200 rounded-full h-1">
            <div 
              className="bg-blue-600 h-1 rounded-full transition-all duration-300"
              style={{ 
                width: `${questions.length > 0 ? (Object.keys(answers).length / questions.length) * 100 : 0}%` 
              }}
            ></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SectionNavigation;
