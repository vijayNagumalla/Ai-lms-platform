import React, { useState, useEffect } from 'react';
import api from '@/services/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react';
import { toast } from 'react-hot-toast';

const CalendarView = ({ selectedProject }) => {
  const [view, setView] = useState('month');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (selectedProject) {
      loadEvents();
    }
  }, [view, currentDate, selectedProject]);

  const loadEvents = async () => {
    if (!selectedProject) return;
    
    try {
      setLoading(true);
      const startDate = getStartDate();
      const endDate = getEndDate();
      
      // Use getCalendarEvents with project_id filter
      const params = {
        project_id: selectedProject.id,
        start_date: startDate.toISOString().split('T')[0],
        end_date: endDate.toISOString().split('T')[0]
      };
      
      const response = await api.getCalendarEvents(params);

      if (response.success) {
        setEvents(response.data || []);
      }
    } catch (error) {
      toast.error('Failed to load calendar events');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const getStartDate = () => {
    const date = new Date(currentDate);
    if (view === 'day') {
      return date;
    } else if (view === 'week') {
      date.setDate(date.getDate() - date.getDay());
      return date;
    } else if (view === 'month') {
      date.setDate(1);
      return date;
    } else if (view === 'year') {
      date.setMonth(0, 1);
      return date;
    }
    return date;
  };

  const getEndDate = () => {
    const date = new Date(currentDate);
    if (view === 'day') {
      return date;
    } else if (view === 'week') {
      date.setDate(date.getDate() + (6 - date.getDay()));
      return date;
    } else if (view === 'month') {
      date.setMonth(date.getMonth() + 1);
      date.setDate(0);
      return date;
    } else if (view === 'year') {
      date.setMonth(11, 31);
      return date;
    }
    return date;
  };

  const navigateDate = (direction) => {
    const newDate = new Date(currentDate);
    if (view === 'day') {
      newDate.setDate(newDate.getDate() + (direction === 'next' ? 1 : -1));
    } else if (view === 'week') {
      newDate.setDate(newDate.getDate() + (direction === 'next' ? 7 : -7));
    } else if (view === 'month') {
      newDate.setMonth(newDate.getMonth() + (direction === 'next' ? 1 : -1));
    } else if (view === 'year') {
      newDate.setFullYear(newDate.getFullYear() + (direction === 'next' ? 1 : -1));
    }
    setCurrentDate(newDate);
  };

  const formatDate = () => {
    if (view === 'day') {
      return currentDate.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    } else if (view === 'week') {
      const start = getStartDate();
      const end = getEndDate();
      return `${start.toLocaleDateString()} - ${end.toLocaleDateString()}`;
    } else if (view === 'month') {
      return currentDate.toLocaleDateString('en-US', { year: 'numeric', month: 'long' });
    } else if (view === 'year') {
      return currentDate.getFullYear().toString();
    }
    return currentDate.toLocaleDateString();
  };

  if (!selectedProject) {
    return (
      <div className="text-center py-8 text-gray-500">
        Please select a project to view calendar
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="flex items-center gap-2">
              <CalendarIcon className="h-5 w-5" />
              Calendar - {selectedProject.name}
            </CardTitle>
            <div className="flex gap-2">
              <Select value={view} onValueChange={setView}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="day">Day</SelectItem>
                  <SelectItem value="week">Week</SelectItem>
                  <SelectItem value="month">Month</SelectItem>
                  <SelectItem value="year">Year</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" size="icon" onClick={() => navigateDate('prev')}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="icon" onClick={() => setCurrentDate(new Date())}>
                Today
              </Button>
              <Button variant="outline" size="icon" onClick={() => navigateDate('next')}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <p className="text-sm text-gray-600">{formatDate()}</p>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">Loading calendar...</div>
          ) : (
            <div className="space-y-2">
              {events.map(event => (
                <div
                  key={event.id}
                  className="p-3 border rounded-lg hover:bg-gray-50"
                  style={{ borderLeftColor: event.color_code || '#3B82F6', borderLeftWidth: '4px' }}
                >
                  <div className="font-medium">{event.title || event.session_title}</div>
                  <div className="text-sm text-gray-600">
                    {new Date(event.start_time).toLocaleString()} - {new Date(event.end_time).toLocaleString()}
                  </div>
                  <div className="text-sm text-gray-500">
                    {event.project_name} • {event.batch_name} • {event.faculty_name}
                  </div>
                </div>
              ))}
              {events.length === 0 && (
                <div className="text-center py-8 text-gray-500">No events scheduled</div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default CalendarView;

