import React, { useState, useEffect } from 'react';
import api from '@/services/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Star, MessageSquare } from 'lucide-react';
import { toast } from 'react-hot-toast';

const FeedbackView = ({ selectedProject }) => {
  const [feedback, setFeedback] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [showSubmitDialog, setShowSubmitDialog] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    project_id: '',
    feedback_type: 'student_to_faculty',
    to_user_id: '',
    rating_overall: 0,
    rating_professionalism: 0,
    rating_content_relevance: 0,
    rating_communication: 0,
    textual_feedback: '',
    suggestions: ''
  });

  useEffect(() => {
    loadFeedback();
    loadAnalytics();
  }, []);

  const loadFeedback = async () => {
    try {
      const response = await api.getFeedback();
      if (response.success) {
        setFeedback(response.data || []);
      }
    } catch (error) {
      toast.error('Failed to load feedback');
    }
  };

  const loadAnalytics = async () => {
    try {
      const response = await api.getFeedbackAnalytics();
      if (response.success) {
        setAnalytics(response.data);
      }
    } catch (error) {
      console.error('Failed to load analytics:', error);
    }
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);
      await api.submitFeedback(formData);
      toast.success('Feedback submitted successfully');
      setShowSubmitDialog(false);
      loadFeedback();
      loadAnalytics();
    } catch (error) {
      toast.error('Failed to submit feedback');
    } finally {
      setLoading(false);
    }
  };

  const renderStars = (rating) => {
    return Array.from({ length: 5 }).map((_, i) => (
      <Star
        key={i}
        className={`h-4 w-4 ${i < rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`}
      />
    ));
  };

  return (
    <div className="space-y-4">
      {analytics && (
        <Card>
          <CardHeader>
            <CardTitle>Feedback Analytics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-4 gap-4">
              <div>
                <div className="text-sm text-gray-600">Overall Rating</div>
                <div className="text-2xl font-bold">{analytics.avg_overall_rating?.toFixed(2) || 'N/A'}</div>
              </div>
              <div>
                <div className="text-sm text-gray-600">Professionalism</div>
                <div className="text-2xl font-bold">{analytics.avg_professionalism?.toFixed(2) || 'N/A'}</div>
              </div>
              <div>
                <div className="text-sm text-gray-600">Content Relevance</div>
                <div className="text-2xl font-bold">{analytics.avg_content_relevance?.toFixed(2) || 'N/A'}</div>
              </div>
              <div>
                <div className="text-sm text-gray-600">Total Feedback</div>
                <div className="text-2xl font-bold">{analytics.total_feedback || 0}</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              Feedback
            </CardTitle>
            <Button onClick={() => setShowSubmitDialog(true)}>Submit Feedback</Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {feedback.map(item => (
              <div key={item.id} className="border rounded-lg p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="font-medium">{item.from_user_name}</div>
                    <div className="text-sm text-gray-600">{item.feedback_type?.replace('_', ' ')}</div>
                    {item.rating_overall && (
                      <div className="flex items-center gap-1 mt-2">
                        {renderStars(Math.round(item.rating_overall))}
                        <span className="ml-2 text-sm">{item.rating_overall.toFixed(1)}</span>
                      </div>
                    )}
                    {item.textual_feedback && (
                      <div className="mt-2 text-sm">{item.textual_feedback}</div>
                    )}
                  </div>
                  <div className="text-sm text-gray-500">
                    {new Date(item.submitted_at).toLocaleDateString()}
                  </div>
                </div>
              </div>
            ))}
            {feedback.length === 0 && (
              <div className="text-center py-8 text-gray-500">No feedback submitted yet</div>
            )}
          </div>
        </CardContent>
      </Card>

      <Dialog open={showSubmitDialog} onOpenChange={setShowSubmitDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Submit Feedback</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Feedback Type</Label>
              <Select value={formData.feedback_type} onValueChange={(value) => setFormData({ ...formData, feedback_type: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="student_to_faculty">Student to Faculty</SelectItem>
                  <SelectItem value="faculty_to_batch">Faculty to Batch</SelectItem>
                  <SelectItem value="college_to_company">College to Company</SelectItem>
                  <SelectItem value="end_of_course">End of Course</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Overall Rating</Label>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map(rating => (
                  <Star
                    key={rating}
                    className={`h-8 w-8 cursor-pointer ${
                      rating <= formData.rating_overall ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'
                    }`}
                    onClick={() => setFormData({ ...formData, rating_overall: rating })}
                  />
                ))}
              </div>
            </div>
            <div>
              <Label>Feedback</Label>
              <Textarea
                value={formData.textual_feedback}
                onChange={(e) => setFormData({ ...formData, textual_feedback: e.target.value })}
                rows={4}
              />
            </div>
            <div>
              <Label>Suggestions</Label>
              <Textarea
                value={formData.suggestions}
                onChange={(e) => setFormData({ ...formData, suggestions: e.target.value })}
                rows={3}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowSubmitDialog(false)}>Cancel</Button>
              <Button onClick={handleSubmit} disabled={loading}>
                {loading ? 'Submitting...' : 'Submit'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default FeedbackView;

