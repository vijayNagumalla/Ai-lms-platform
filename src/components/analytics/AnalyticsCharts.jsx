import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  BarChart3, 
  PieChart, 
  LineChart, 
  TrendingUp, 
  TrendingDown, 
  Users, 
  BookOpen, 
  Target, 
  Clock, 
  Award, 
  Star,
  GraduationCap,
  Activity,
  Zap,
  Eye,
  Filter,
  Download,
  Share2,
  MoreHorizontal,
  ChevronDown,
  ChevronUp,
  Plus,
  MessageSquare,
  Info,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Crown,
  Trophy,
  Target as TargetIcon
} from 'lucide-react';

const AnalyticsCharts = ({ 
  data, 
  module, 
  filters, 
  onAddAnnotation, 
  userRole = 'student',
  detailed = false,
  viewMode = 'grid',
  activeChart: propActiveChart
}) => {
  const [activeChart, setActiveChart] = useState(propActiveChart || 'scoreDistribution');
  
  // Update activeChart when prop changes
  useEffect(() => {
    if (propActiveChart) {
      setActiveChart(propActiveChart);
    }
  }, [propActiveChart]);
  const [chartView, setChartView] = useState('chart');
  const [drillDownLevel, setDrillDownLevel] = useState(0);
  const [selectedDataPoint, setSelectedDataPoint] = useState(null);
  const [showAnnotationModal, setShowAnnotationModal] = useState(false);

  // Chart configurations
  const chartConfigs = {
    assessments: {
      scoreDistribution: {
        title: 'Score Distribution',
        description: 'Distribution of assessment scores across different ranges',
        icon: <BarChart3 className="h-5 w-5" />,
        type: 'bar',
        color: 'text-blue-600',
        bgColor: 'bg-blue-50 dark:bg-blue-900/20'
      },
      submissionPatterns: {
        title: 'Submission Trends',
        description: 'Assessment submission patterns over time',
        icon: <LineChart className="h-5 w-5" />,
        type: 'line',
        color: 'text-green-600',
        bgColor: 'bg-green-50 dark:bg-green-900/20'
      },
      departmentPerformance: {
        title: 'Department Performance',
        description: 'Average scores by department',
        icon: <PieChart className="h-5 w-5" />,
        type: 'pie',
        color: 'text-purple-600',
        bgColor: 'bg-purple-50 dark:bg-purple-900/20'
      },
      timeVsScore: {
        title: 'Time vs Score Correlation',
        description: 'Relationship between time taken and scores achieved',
        icon: <Target className="h-5 w-5" />,
        type: 'scatter',
        color: 'text-orange-600',
        bgColor: 'bg-orange-50 dark:bg-orange-900/20'
      },
      topPerformers: {
        title: 'Top Performing Students',
        description: 'Students with highest average scores',
        icon: <Crown className="h-5 w-5" />,
        type: 'bar',
        color: 'text-yellow-600',
        bgColor: 'bg-yellow-50 dark:bg-yellow-900/20'
      },
      assessmentTypes: {
        title: 'Assessment Type Performance',
        description: 'Performance across different assessment types',
        icon: <BookOpen className="h-5 w-5" />,
        type: 'bar',
        color: 'text-indigo-600',
        bgColor: 'bg-indigo-50 dark:bg-indigo-900/20'
      }
    },
    courses: {
      enrollmentVsCompletion: {
        title: 'Enrollment vs Completion',
        description: 'Course enrollment and completion rates',
        icon: <Users className="h-5 w-5" />,
        type: 'bar',
        color: 'text-blue-600',
        bgColor: 'bg-blue-50 dark:bg-blue-900/20'
      },
      chapterProgress: {
        title: 'Chapter Completion Progress',
        description: 'Student progress through course chapters',
        icon: <Activity className="h-5 w-5" />,
        type: 'line',
        color: 'text-green-600',
        bgColor: 'bg-green-50 dark:bg-green-900/20'
      },
      instructorPerformance: {
        title: 'Instructor Performance',
        description: 'Course completion rates by instructor',
        icon: <GraduationCap className="h-5 w-5" />,
        type: 'bar',
        color: 'text-purple-600',
        bgColor: 'bg-purple-50 dark:bg-purple-900/20'
      },
      categoryAnalysis: {
        title: 'Course Category Analysis',
        description: 'Performance across different course categories',
        icon: <PieChart className="h-5 w-5" />,
        type: 'pie',
        color: 'text-orange-600',
        bgColor: 'bg-orange-50 dark:bg-orange-900/20'
      },
      engagementTrends: {
        title: 'Student Engagement Trends',
        description: 'Student engagement patterns over time',
        icon: <TrendingUp className="h-5 w-5" />,
        type: 'line',
        color: 'text-yellow-600',
        bgColor: 'bg-yellow-50 dark:bg-yellow-900/20'
      },
      ratingDistribution: {
        title: 'Course Rating Distribution',
        description: 'Distribution of course ratings',
        icon: <Star className="h-5 w-5" />,
        type: 'bar',
        color: 'text-indigo-600',
        bgColor: 'bg-indigo-50 dark:bg-indigo-900/20'
      }
    }
  };

  const getRoleBasedCharts = () => {
    const charts = chartConfigs[module];
    
    if (userRole === 'student') {
      // Students see simplified, personal charts
      return {
        scoreDistribution: {
          ...charts.scoreDistribution,
          title: 'My Score Distribution',
          description: 'Your performance across different score ranges'
        },
        submissionPatterns: {
          ...charts.submissionPatterns,
          title: 'My Submission Trends',
          description: 'Your assessment submission patterns over time'
        },
        timeVsScore: {
          ...charts.timeVsScore,
          title: 'My Time vs Score',
          description: 'Your time taken vs scores achieved'
        },
        topPerformers: {
          ...charts.topPerformers,
          title: 'My Ranking',
          description: 'Your position among peers'
        }
      };
    }
    
    return charts;
  };

  const renderChart = (chartKey, chartData) => {
    const config = getRoleBasedCharts()[chartKey];
    if (!config) return null;

    // Use real data from backend instead of mock data
    const realData = processRealChartData(chartKey, chartData);

    return (
      <div className="space-y-4">
        {/* Chart Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className={`p-2 rounded-lg ${config.bgColor}`}>
              <div className={config.color}>{config.icon}</div>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                {config.title}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {config.description}
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowAnnotationModal(true)}
            >
              <MessageSquare className="h-4 w-4 mr-2" />
              Add Note
            </Button>
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
            <Button variant="outline" size="sm">
              <Share2 className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Chart Content */}
        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6 min-h-[300px]">
          {renderChartContent(chartKey, realData, config.type)}
        </div>

        {/* Chart Insights */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {generateChartInsights(chartKey, realData).map((insight, index) => (
            <div key={`insight-${chartKey}-${index}`} className="bg-white dark:bg-gray-900 border rounded-lg p-3">
              <div className="flex items-center space-x-2 mb-2">
                {insight.icon}
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {insight.title}
                </span>
              </div>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                {insight.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderChartContent = (chartKey, data, type) => {
    if (!data || data.length === 0) {
      return (
        <div className="flex items-center justify-center h-40 text-gray-500">
          <div className="text-center">
            <BarChart3 className="h-10 w-10 mx-auto mb-2 text-gray-400" />
            <p className="text-sm">No data available for this chart</p>
          </div>
        </div>
      );
    }

    const maxValue = Math.max(...data.map(d => d.value));
    const minValue = Math.min(...data.map(d => d.value));
    const valueRange = maxValue - minValue;
    
    // Calculate dynamic Y-axis values
    const getYAxisValues = () => {
      if (valueRange === 0) {
        // If all values are the same, create a range around that value
        const baseValue = maxValue;
        return [
          Math.ceil(baseValue * 1.2),
          Math.ceil(baseValue * 1.1),
          baseValue,
          Math.floor(baseValue * 0.9),
          Math.floor(baseValue * 0.8)
        ];
      }
      
      // Create 5 evenly spaced values
      const step = valueRange / 4;
      const values = [];
      for (let i = 0; i < 5; i++) {
        const value = maxValue - (step * i);
        values.push(Math.round(value));
      }
      
      // Ensure we don't have duplicate values
      const uniqueValues = [...new Set(values)];
      if (uniqueValues.length < 5) {
        // If we have duplicates, create a more spread out range
        const expandedRange = valueRange * 1.2;
        const expandedStep = expandedRange / 4;
        return [
          Math.ceil(maxValue + expandedRange * 0.1),
          Math.ceil(maxValue - expandedStep),
          Math.ceil(maxValue - expandedStep * 2),
          Math.ceil(maxValue - expandedStep * 3),
          Math.floor(minValue - expandedRange * 0.1)
        ];
      }
      
      return values;
    };
    
    const yAxisValues = getYAxisValues();
    
    switch (type) {
      case 'bar':
        return (
          <div className="space-y-3">
            {/* Y-axis labels */}
            <div className="flex items-end justify-between h-64 gap-2 relative">
              {/* Y-axis */}
              <div className="absolute left-0 top-0 bottom-0 w-8 flex flex-col justify-between text-xs text-gray-500">
                {yAxisValues.map((value, index) => (
                  <div key={`y-axis-${index}-${value}`} className="flex items-center">
                    <span>{value}</span>
                  </div>
                ))}
              </div>
              
              {/* Chart area with margin for Y-axis */}
              <div className="flex items-end justify-between h-48 gap-2 flex-1 ml-8">
                {data.map((item, index) => (
                  <div key={index} className="flex flex-col items-center space-y-2 flex-1 min-w-0 relative group">
                    <div 
                      className="rounded-t w-full max-w-12 hover:opacity-80 transition-opacity cursor-pointer relative"
                      style={{ 
                        height: `${valueRange > 0 ? Math.max(((item.value - minValue) / valueRange) * 180, 20) : 20}px`,
                        backgroundColor: item.color || '#3B82F6'
                      }}
                      onClick={() => handleDataPointClick(item)}
                      onMouseEnter={(e) => {
                        const tooltip = e.currentTarget.querySelector('.tooltip');
                        if (tooltip) tooltip.classList.remove('hidden');
                      }}
                      onMouseLeave={(e) => {
                        const tooltip = e.currentTarget.querySelector('.tooltip');
                        if (tooltip) tooltip.classList.add('hidden');
                      }}
                    >
                      {/* Tooltip */}
                      <div className="tooltip hidden absolute bottom-full left-1/2 transform -translate-x-1/2 mb-1 px-1.5 py-1 bg-gray-900 text-white text-[8px] rounded shadow-lg z-10 whitespace-nowrap min-w-max">
                        <div className="font-semibold text-[8px] leading-tight">{item.label}</div>
                        <div className="text-[8px] leading-tight">Count: {item.value}</div>
                        <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-2 border-r-2 border-t-2 border-transparent border-t-gray-900"></div>
                      </div>
                    </div>
                    <span className="text-xs text-gray-600 dark:text-gray-400 text-center truncate w-full px-1">
                      {item.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>
            
            {/* X-axis label and Legend */}
            <div className="text-center text-sm text-gray-600 dark:text-gray-400">
              <div className="font-medium mb-1">Score Ranges</div>
              
              {/* Legend */}
              <div className="flex flex-wrap justify-center items-center gap-2 mt-2 text-xs">
                <div className="flex items-center space-x-1">
                  <div className="w-3 h-3 rounded bg-green-500"></div>
                  <span>Excellent</span>
                </div>
                <div className="flex items-center space-x-1">
                  <div className="w-3 h-3 rounded bg-blue-500"></div>
                  <span>Good</span>
                </div>
                <div className="flex items-center space-x-1">
                  <div className="w-3 h-3 rounded bg-yellow-500"></div>
                  <span>Average</span>
                </div>
                <div className="flex items-center space-x-1">
                  <div className="w-3 h-3 rounded bg-red-500"></div>
                  <span>Below Avg</span>
                </div>
                <div className="flex items-center space-x-1">
                  <div className="w-3 h-3 rounded bg-gray-500"></div>
                  <span>Needs Help</span>
                </div>
              </div>
              
              <div className="mt-2">{data.length} data points • Click bars for details</div>
            </div>
          </div>
        );
      
      case 'line':
        return (
          <div className="space-y-3">
            <div className="relative h-48 overflow-visible">
                                                             {/* Y-axis labels */}
                 <div className="absolute left-0 top-0 bottom-0 w-12 flex flex-col justify-between text-xs text-gray-500">
                   {yAxisValues.map((value, index) => (
                     <div key={`line-y-axis-${index}-${value}`} className="flex items-center">
                       <span>{value}</span>
                     </div>
                   ))}
                 </div>
              
              {/* Chart area with margin for Y-axis */}
              <div className="ml-12 h-full">
                <svg className="w-full h-full" viewBox="0 0 100 120" preserveAspectRatio="none" style={{ overflow: 'visible' }}>
                  {/* Grid lines */}
                  <defs>
                    <pattern id="grid" width="10" height="10" patternUnits="userSpaceOnUse">
                      <path d="M 10 0 L 0 0 0 10" fill="none" stroke="#e5e7eb" strokeWidth="0.5"/>
                    </pattern>
                  </defs>
                  <rect width="100" height="100" fill="url(#grid)" />
                  
                  {/* Y-axis grid lines */}
                  {yAxisValues.map((value, index) => {
                    const chartMax = yAxisValues[0];
                    const chartMin = yAxisValues[yAxisValues.length - 1];
                    const chartRange = chartMax - chartMin;
                    const normalizedValue = chartRange > 0 ? (value - chartMin) / chartRange : 0;
                    const yPosition = 120 - (normalizedValue * 100);
                    return (
                      <line
                        key={`grid-line-${index}-${value}`}
                        x1="0"
                        y1={yPosition}
                        x2="100"
                        y2={yPosition}
                        stroke="#e5e7eb"
                        strokeWidth="0.5"
                      />
                    );
                  })}
                  
                  {/* Line chart */}
                  <polyline
                    fill="none"
                    stroke="rgb(59, 130, 246)"
                    strokeWidth="2"
                    points={data.map((item, index) => {
                      const x = (index / (data.length - 1)) * 90 + 5; // 5% margin on each side
                      // Map the value to the chart coordinate system using the actual Y-axis range
                      const chartMax = yAxisValues[0];
                      const chartMin = yAxisValues[yAxisValues.length - 1];
                      const chartRange = chartMax - chartMin;
                      const normalizedValue = chartRange > 0 ? (item.value - chartMin) / chartRange : 0;
                      const y = 115 - (normalizedValue * 80); // 5% margin on each side, adjusted for larger viewBox
                      return `${x},${y}`;
                    }).join(' ')}
                  />
                  
                  {/* Data points with tooltips */}
                  {data.map((item, index) => {
                    const x = (index / (data.length - 1)) * 90 + 5;
                    // Map the value to the chart coordinate system using the actual Y-axis range
                    const chartMax = yAxisValues[0];
                    const chartMin = yAxisValues[yAxisValues.length - 1];
                    const chartRange = chartMax - chartMin;
                    const normalizedValue = chartRange > 0 ? (item.value - chartMin) / chartRange : 0;
                    const y = 115 - (normalizedValue * 80);
                    return (
                      <g key={`data-point-${index}-${item.label}`}>
                        <circle
                          cx={x}
                          cy={y}
                          r="3"
                          fill="rgb(59, 130, 246)"
                          className="hover:r-4 transition-all cursor-pointer"
                          onMouseEnter={(e) => {
                            const tooltip = e.currentTarget.parentNode.querySelector('.tooltip');
                            if (tooltip) {
                              tooltip.classList.remove('hidden');
                              // Position tooltip above the data point, ensuring it stays within the chart area
                              const tooltipY = Math.max(y - 35, 5);
                              tooltip.setAttribute('x', x - 25);
                              tooltip.setAttribute('y', tooltipY);
                            }
                          }}
                          onMouseLeave={(e) => {
                            const tooltip = e.currentTarget.parentNode.querySelector('.tooltip');
                            if (tooltip) tooltip.classList.add('hidden');
                          }}
                        />
                        {/* Tooltip */}
                        <foreignObject
                          x={x - 25}
                          y={Math.max(y - 35, 5)}
                          width="50"
                          height="30"
                          className="tooltip hidden"
                        >
                          <div className="bg-gray-900 text-white text-[8px] rounded px-1.5 py-1 text-center shadow-lg z-10 whitespace-nowrap min-w-max">
                            <div className="font-semibold text-[8px] leading-tight truncate">{item.label}</div>
                            <div className="text-[8px] leading-tight">{item.value}</div>
                            <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-2 border-r-2 border-t-2 border-transparent border-t-gray-900"></div>
                          </div>
                        </foreignObject>
                      </g>
                    );
                  })}
                </svg>
              </div>
            </div>
            
            {/* X-axis labels and Legend */}
            <div className="text-center text-sm text-gray-600 dark:text-gray-400">
              <div className="font-medium mb-1">Submission Dates</div>
              
              {/* Dynamic X-axis labels */}
              <div className="flex justify-between items-center mt-2 text-xs text-gray-500">
                {data.map((item, index) => (
                  <div key={`x-axis-${index}-${item.label}`} className="flex-1 text-center truncate px-1">
                    {item.label}
                  </div>
                ))}
              </div>
              
              {/* Legend */}
              <div className="flex justify-center items-center space-x-3 mt-2 text-xs">
                <div className="flex items-center space-x-1">
                  <div className="w-4 h-0.5 bg-blue-500"></div>
                  <span>Submissions</span>
                </div>
                <div className="flex items-center space-x-1">
                  <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                  <span>Data Points</span>
                </div>
              </div>
              
              <div className="mt-2">{data.length} time points • Trend analysis available</div>
            </div>
          </div>
        );
      
      case 'pie':
        const total = data.reduce((sum, item) => sum + item.value, 0);
        return (
          <div className="flex items-center justify-center h-40">
            <div className="text-center">
              <div className="w-32 h-32 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 mx-auto mb-4 flex items-center justify-center">
                <span className="text-white font-semibold">{total}</span>
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                {data.length} categories • {total} total
              </div>
            </div>
          </div>
        );
      
      default:
        return (
          <div className="flex items-center justify-center h-48 text-gray-500">
            <div className="text-center">
              <BarChart3 className="h-12 w-12 mx-auto mb-2 text-gray-400" />
              <p>Chart visualization for {type} type</p>
            </div>
          </div>
        );
    }
  };

  const processRealChartData = (chartKey, rawData) => {
    if (!rawData || !Array.isArray(rawData)) {
      return [];
    }

    switch (chartKey) {
      case 'scoreDistribution':
        // Backend returns: [{ scoreRange: '90-100%', count: 25 }, ...]
        return rawData.map(item => ({
          label: item.scoreRange || item.label,
          value: parseInt(item.count) || parseInt(item.value) || 0,
          color: getScoreRangeColor(item.scoreRange || item.label)
        }));
      
      case 'submissionPatterns':
        // Backend returns: [{ date: '2023-10-27', submissions: 10, averageScore: 85.5 }, ...]
        return rawData.map(item => ({
          label: formatDate(item.date),
          value: parseInt(item.submissions) || parseInt(item.value) || 0,
          date: item.date,
          averageScore: parseFloat(item.averageScore) || 0
        }));
      
      case 'assessmentTypePerformance':
        // Backend returns: [{ assessment_type: 'Quiz', totalAssessments: 5, averageScore: 78.2 }, ...]
        return rawData.map(item => ({
          label: item.assessment_type || item.label,
          value: parseFloat(item.averageScore) || parseFloat(item.value) || 0,
          totalAssessments: parseInt(item.totalAssessments) || 0,
          totalStudents: parseInt(item.totalStudents) || 0
        }));
      
      case 'departmentPerformance':
        // Backend returns: [{ name: 'Computer Science', averageScore: 85.5 }, ...]
        return rawData.map(item => ({
          label: item.name || item.label,
          value: parseFloat(item.averageScore) || parseFloat(item.value) || 0,
          totalStudents: parseInt(item.totalStudents) || 0
        }));
      
      default:
        return rawData;
    }
  };

  const getScoreRangeColor = (scoreRange) => {
    switch (scoreRange) {
      case '90-100%': return '#10B981'; // Green
      case '80-89%': return '#3B82F6';  // Blue
      case '70-79%': return '#F59E0B';  // Yellow
      case '60-69%': return '#EF4444';  // Red
      default: return '#6B7280';        // Gray
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };



  const generateChartInsights = (chartKey, data) => {
    const insights = [];
    
    if (!data || data.length === 0) {
      return [
        {
          title: 'No Data',
          description: 'No data available for this chart',
          icon: <Info className="h-4 w-4 text-gray-600" />
        }
      ];
    }
    
    switch (chartKey) {
      case 'scoreDistribution':
        const totalStudents = data.reduce((sum, item) => sum + item.value, 0);
        const excellentCount = data.find(item => item.label === '90-100%')?.value || 0;
        const needsHelpCount = data.find(item => item.label === 'Below 60%')?.value || 0;
        const peakRange = data.reduce((max, item) => item.value > max.value ? item : max, data[0]);
        
        insights.push(
          {
            title: 'Peak Performance',
            description: `${peakRange?.label || 'N/A'} has the most students`,
            icon: <TrendingUp className="h-4 w-4 text-green-600" />
          },
          {
            title: 'Excellence',
            description: `${totalStudents > 0 ? Math.round((excellentCount / totalStudents) * 100) : 0}% achieved 90%+`,
            icon: <Trophy className="h-4 w-4 text-yellow-600" />
          },
          {
            title: 'Needs Attention',
            description: `${totalStudents > 0 ? Math.round((needsHelpCount / totalStudents) * 100) : 0}% scored below 60%`,
            icon: <AlertTriangle className="h-4 w-4 text-orange-600" />
          }
        );
        break;
      
      case 'submissionPatterns':
        const totalSubmissions = data.reduce((sum, item) => sum + item.value, 0);
        const avgSubmissions = totalSubmissions / data.length;
        const recentTrend = data.slice(0, 7).reduce((sum, item) => sum + item.value, 0) / 7;
        const previousTrend = data.slice(7, 14).reduce((sum, item) => sum + item.value, 0) / 7;
        const trendChange = previousTrend > 0 ? ((recentTrend - previousTrend) / previousTrend) * 100 : 0;
        
        insights.push(
          {
            title: 'Daily Average',
            description: `${Math.round(avgSubmissions)} submissions per day`,
            icon: <Activity className="h-4 w-4 text-blue-600" />
          },
          {
            title: 'Recent Trend',
            description: `${trendChange > 0 ? '+' : ''}${Math.round(trendChange)}% vs previous week`,
            icon: trendChange > 0 ? <TrendingUp className="h-4 w-4 text-green-600" /> : <TrendingDown className="h-4 w-4 text-red-600" />
          },
          {
            title: 'Total Activity',
            description: `${totalSubmissions} total submissions`,
            icon: <CheckCircle className="h-4 w-4 text-green-600" />
          }
        );
        break;
      
      case 'assessmentTypePerformance':
        const avgScore = data.reduce((sum, item) => sum + item.value, 0) / data.length;
        const bestType = data.reduce((max, item) => item.value > max.value ? item : max, data[0]);
        const totalAssessments = data.reduce((sum, item) => sum + (item.totalAssessments || 0), 0);
        
        insights.push(
          {
            title: 'Average Score',
            description: `${Math.round(avgScore)}% across all types`,
            icon: <Target className="h-4 w-4 text-blue-600" />
          },
          {
            title: 'Best Performing',
            description: `${bestType?.label || 'N/A'} with ${Math.round(bestType?.value || 0)}%`,
            icon: <Trophy className="h-4 w-4 text-yellow-600" />
          },
          {
            title: 'Total Assessments',
            description: `${totalAssessments} assessments analyzed`,
            icon: <BookOpen className="h-4 w-4 text-purple-600" />
          }
        );
        break;
      
      default:
        const avgValue = data.reduce((sum, item) => sum + item.value, 0) / data.length;
        insights.push(
          {
            title: 'Average',
            description: `${Math.round(avgValue)} average value`,
            icon: <Target className="h-4 w-4 text-blue-600" />
          },
          {
            title: 'Data Points',
            description: `${data.length} items analyzed`,
            icon: <Info className="h-4 w-4 text-green-600" />
          },
          {
            title: 'Performance',
            description: 'Data analysis complete',
            icon: <CheckCircle className="h-4 w-4 text-purple-600" />
          }
        );
    }
    
    return insights;
  };

  const handleDataPointClick = (dataPoint) => {
    setSelectedDataPoint(dataPoint);
    setDrillDownLevel(prev => prev + 1);
  };

  const handleAddAnnotation = () => {
    if (selectedDataPoint) {
      onAddAnnotation({
        chartType: activeChart,
        dataPoint: selectedDataPoint,
        title: `Note on ${selectedDataPoint.label}`,
        comment: 'Add your observation here...'
      });
      setShowAnnotationModal(false);
      setSelectedDataPoint(null);
    }
  };

  const charts = getRoleBasedCharts();
  const availableCharts = Object.keys(charts);

  if (viewMode === 'list') {
    return (
      <div className="space-y-6">
        {availableCharts.map((chartKey) => (
          <Card key={`list-chart-${chartKey}`} className="hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              {renderChart(chartKey, data)}
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  // If a specific chart type is provided, render just that chart
  if (propActiveChart) {
    return (
      <div className="space-y-3">
        {/* Chart Content Only - No Header */}
        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 min-h-[400px]">
          {/* Chart Title */}
          <div className="text-center mb-3">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
              {getRoleBasedCharts()[activeChart]?.title || 'Chart'}
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {getRoleBasedCharts()[activeChart]?.description || 'Chart data visualization'}
            </p>
          </div>
          
          {renderChartContent(activeChart, processRealChartData(activeChart, data), getRoleBasedCharts()[activeChart]?.type || 'bar')}
        </div>

        {/* Chart Insights */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          {generateChartInsights(activeChart, processRealChartData(activeChart, data)).map((insight, index) => (
            <div key={`insight-simple-${activeChart}-${index}`} className="bg-white dark:bg-gray-900 border rounded-lg p-2 text-center">
              <div className="flex items-center justify-center space-x-1 mb-1">
                {insight.icon}
                <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                  {insight.title}
                </span>
              </div>
              <p className="text-xs text-gray-600 dark:text-gray-400 leading-tight">
                {insight.description}
              </p>
            </div>
          ))}
        </div>
        
        {/* Annotation Modal */}
        {showAnnotationModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-900 rounded-lg p-6 w-96">
              <h3 className="text-lg font-semibold mb-4">Add Chart Annotation</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Title</label>
                  <input
                    type="text"
                    className="w-full p-2 border rounded"
                    placeholder="Annotation title"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Comment</label>
                  <textarea
                    className="w-full p-2 border rounded"
                    rows="3"
                    placeholder="Add your observation..."
                  />
                </div>
                <div className="flex justify-end space-x-2">
                  <Button
                    variant="outline"
                    onClick={() => setShowAnnotationModal(false)}
                  >
                    Cancel
                  </Button>
                  <Button onClick={handleAddAnnotation}>
                    Add Annotation
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Full analytics dashboard with navigation
  return (
    <div className="space-y-6">
      {/* Chart Navigation */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Tabs value={activeChart} onValueChange={setActiveChart} className="w-auto">
            <TabsList className="grid w-auto grid-cols-3 lg:grid-cols-6">
              {availableCharts.slice(0, 6).map((chartKey) => (
                <TabsTrigger key={`chart-tab-${chartKey}`} value={chartKey} className="text-xs">
                  {charts[chartKey].title.split(' ')[0]}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </div>
        
        <div className="flex items-center space-x-2">
          <Select value={chartView} onValueChange={setChartView}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="chart">Chart</SelectItem>
              <SelectItem value="table">Table</SelectItem>
              <SelectItem value="insights">Insights</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Main Chart Display */}
      <Card className="hover:shadow-lg transition-shadow">
        <CardContent className="p-6">
          {renderChart(activeChart, data)}
        </CardContent>
      </Card>

      {/* Drill-down Navigation */}
      {drillDownLevel > 0 && (
        <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setDrillDownLevel(prev => Math.max(0, prev - 1))}
          >
            <ChevronUp className="h-4 w-4 mr-1" />
            Back
          </Button>
          <span>Drill-down level: {drillDownLevel}</span>
          {selectedDataPoint && (
            <Badge variant="outline">
              Selected: {selectedDataPoint.label}
            </Badge>
          )}
        </div>
      )}

      {/* Annotation Modal */}
      {showAnnotationModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-900 rounded-lg p-6 w-96">
            <h3 className="text-lg font-semibold mb-4">Add Chart Annotation</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Title</label>
                <input
                  type="text"
                  className="w-full p-2 border rounded"
                  placeholder="Annotation title"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Comment</label>
                <textarea
                  className="w-full p-2 border rounded"
                  rows="3"
                  placeholder="Add your observation..."
                />
              </div>
              <div className="flex justify-end space-x-2">
                <Button
                  variant="outline"
                  onClick={() => setShowAnnotationModal(false)}
                >
                  Cancel
                </Button>
                <Button onClick={handleAddAnnotation}>
                  Add Annotation
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AnalyticsCharts; 