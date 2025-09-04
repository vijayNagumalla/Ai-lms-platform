# Analytics & Reports Module

## Overview

The Analytics & Reports module is a comprehensive, role-based analytics dashboard that provides real-time insights for both Assessments and Courses within the LMS platform. Built with a Power BI-style interface, it offers interactive visualizations, drill-down capabilities, and advanced filtering options.

## 🚀 Key Features

### 1. **Role-Based Access Control**
- **Super Admin**: Full system-wide access to all analytics
- **College Admin**: Access to college-specific analytics and departments
- **Faculty**: Department and assigned course/assessment analytics
- **Student**: Personal learning analytics and progress insights

### 2. **Module Toggle System**
- **Assessment Reports**: Performance analytics, score distributions, completion trends
- **Course Reports**: Enrollment analytics, completion rates, learning progress
- Dynamic UI updates based on selected module

### 3. **Advanced Filtering System**
- **Quick Filters**: Predefined filter presets (Last 7/30/90 days, High Performers, etc.)
- **Advanced Filters**: College, Department, Faculty, Student, Date Range, Assessment Type/Course Category
- **Role-Based Filtering**: Automatic filter restrictions based on user role
- **Real-time Updates**: Filters trigger immediate data refresh

### 4. **Interactive Visualizations**
- **Chart Types**: Bar charts, Line charts, Pie charts, Scatter plots
- **Drill-down Capability**: Click on data points for detailed analysis
- **Chart Annotations**: Add contextual notes to specific data points
- **Export Options**: Export charts as images or include in reports

### 5. **Comprehensive Reports**
- **Summary Cards**: Key metrics with trend indicators
- **Visual Reports**: Interactive charts with insights
- **Tabular Reports**: Detailed data tables with sorting and pagination
- **Export & Share**: Excel, PDF, CSV export with current filter context

### 6. **Save View System**
- **Filter Presets**: Save current filter combinations as named views
- **Quick Access**: Load saved views with single click
- **View Management**: Rename, delete, and organize saved views

## 🏗️ Architecture

### Frontend Components

```
src/
├── pages/
│   └── AnalyticsDashboard.jsx          # Main analytics dashboard
├── components/analytics/
│   ├── ModuleToggle.jsx                # Module selection interface
│   ├── AdvancedFilterPanel.jsx         # Comprehensive filtering system
│   ├── AnalyticsSummaryCards.jsx       # Key metrics display
│   ├── AnalyticsCharts.jsx             # Interactive visualizations
│   ├── AnalyticsTables.jsx             # Detailed data tables
│   ├── ExportPanel.jsx                 # Export functionality
│   ├── SaveViewPanel.jsx               # View management
│   └── ChartAnnotations.jsx            # Chart annotation system
```

### Backend API Endpoints

```
/api/analytics/
├── GET /data                           # Assessment analytics data
├── GET /course-data                    # Course analytics data
├── GET /colleges                       # College filter options
├── GET /departments                    # Department filter options
├── GET /students                       # Student filter options
├── GET /faculty                        # Faculty filter options
├── GET /assessment-types               # Assessment type options
├── GET /course-categories              # Course category options
├── POST /export                        # Export analytics data
├── POST /views                         # Save analytics view
├── GET /views                          # Get saved views
├── GET /views/:viewId                  # Get specific view
├── POST /annotations                   # Add chart annotation
└── GET /annotations                    # Get chart annotations
```

### Database Schema

```sql
-- Analytics Views Table
CREATE TABLE analytics_views (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    module ENUM('assessments', 'courses') NOT NULL,
    filters JSON NOT NULL,
    user_id VARCHAR(36) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Chart Annotations Table
CREATE TABLE chart_annotations (
    id VARCHAR(36) PRIMARY KEY,
    chart_type VARCHAR(100) NOT NULL,
    data_point JSON,
    title VARCHAR(255) NOT NULL,
    comment TEXT,
    filters JSON,
    module ENUM('assessments', 'courses') NOT NULL,
    user_id VARCHAR(36) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
```

## 📊 Analytics Metrics

### Assessment Analytics

#### Summary Metrics
- **Total Assessments**: Number of published assessments
- **Active Students**: Students with submissions
- **Average Score**: Overall performance across assessments
- **Completion Rate**: Percentage of completed assessments

#### Detailed Analytics
- **Score Distribution**: Performance across different score ranges
- **Department Performance**: Average scores by department
- **Submission Trends**: Assessment submission patterns over time
- **Time vs Score Correlation**: Relationship between time taken and scores
- **Top Performing Students**: Students with highest average scores
- **Assessment Type Performance**: Performance across different types

### Course Analytics

#### Summary Metrics
- **Total Courses**: Number of published courses
- **Total Enrollments**: Student enrollment count
- **Completion Rate**: Course completion percentage
- **Average Rating**: Student satisfaction ratings

#### Detailed Analytics
- **Enrollment vs Completion**: Course enrollment and completion rates
- **Chapter Progress**: Student progress through course chapters
- **Instructor Performance**: Completion rates by instructor
- **Category Analysis**: Performance across course categories
- **Engagement Trends**: Student engagement patterns over time
- **Rating Distribution**: Distribution of course ratings

## 🎯 Role-Based Features

### Super Admin
- **System Overview**: Complete system-wide analytics
- **College Comparison**: Performance across all colleges
- **Global Trends**: System-wide performance trends
- **User Analytics**: Comprehensive user behavior analysis

### College Admin
- **College Analytics**: College-specific performance metrics
- **Department Overview**: All departments within college
- **Faculty Performance**: Instructor effectiveness analysis
- **Student Analytics**: College-wide student performance

### Faculty
- **Department Analytics**: Department-specific insights
- **Course Performance**: Assigned course analytics
- **Student Progress**: Individual student tracking
- **Assessment Results**: Detailed assessment analysis

### Student
- **Personal Analytics**: Individual learning progress
- **Performance Tracking**: Personal score and completion trends
- **Subject Analysis**: Performance across different subjects
- **Goal Setting**: Progress towards learning objectives

## 🔧 Configuration

### Environment Variables

```env
# Analytics Configuration
VITE_ANALYTICS_ENABLED=true
VITE_ANALYTICS_CACHE_DURATION=300000
VITE_ANALYTICS_MAX_DATA_POINTS=1000
VITE_ANALYTICS_EXPORT_LIMIT=10000
```

### Role-Based Access Configuration

```javascript
// Role-based data access configuration
const roleAccess = {
  'super-admin': {
    allColleges: true,
    allDepartments: true,
    allUsers: true,
    canExport: true,
    canAnnotate: true
  },
  'college-admin': {
    allColleges: false,
    collegeId: user.college_id,
    allDepartments: true,
    allUsers: false,
    canExport: true,
    canAnnotate: true
  },
  'faculty': {
    allColleges: false,
    collegeId: user.college_id,
    allDepartments: false,
    departmentId: user.department_id,
    allUsers: false,
    canExport: true,
    canAnnotate: true
  },
  'student': {
    allColleges: false,
    collegeId: user.college_id,
    allDepartments: false,
    departmentId: user.department_id,
    allUsers: false,
    studentId: user.id,
    canExport: false,
    canAnnotate: false
  }
};
```

## 📈 Usage Examples

### Accessing Analytics Dashboard

```javascript
// Navigate to analytics dashboard
navigate('/analytics/dashboard');

// With specific module
navigate('/analytics/dashboard?module=assessments');
```

### Using Filters

```javascript
// Apply filters programmatically
const filters = {
  collegeId: 'college-123',
  departmentId: 'dept-456',
  dateRange: '30',
  assessmentType: 'exam'
};

// Update analytics data
setFilters(filters);
loadAnalyticsData();
```

### Saving Views

```javascript
// Save current view
const viewData = {
  name: 'Monthly Assessment Review',
  module: 'assessments',
  filters: currentFilters
};

await apiService.saveAnalyticsView(viewData);
```

### Adding Annotations

```javascript
// Add chart annotation
const annotation = {
  chartType: 'scoreDistribution',
  dataPoint: { label: '80-89%', value: 45 },
  title: 'High Performance Trend',
  comment: 'Excellent performance in the 80-89% range'
};

await apiService.addChartAnnotation(annotation);
```

## 🚀 Performance Optimization

### Data Loading
- **Lazy Loading**: Charts load data on demand
- **Caching**: Analytics data cached for 5 minutes
- **Pagination**: Large datasets paginated for better performance
- **Filter Optimization**: Efficient database queries with proper indexing

### UI Performance
- **Virtual Scrolling**: Large tables use virtual scrolling
- **Debounced Filters**: Filter changes debounced to prevent excessive API calls
- **Component Memoization**: React components optimized with memoization
- **Chart Optimization**: Charts render only visible data points

## 🔒 Security Considerations

### Data Access Control
- **Role-Based Filtering**: Automatic data filtering based on user role
- **SQL Injection Prevention**: Parameterized queries for all database operations
- **XSS Protection**: Input sanitization for user-generated content
- **CSRF Protection**: CSRF tokens for all state-changing operations

### Export Security
- **File Type Validation**: Strict validation of export file types
- **Size Limits**: Maximum file size limits for exports
- **Access Logging**: All export activities logged for audit
- **Temporary Files**: Export files automatically cleaned up

## 🧪 Testing

### Unit Tests
```bash
# Run analytics component tests
npm test -- --testPathPattern=analytics

# Run API tests
npm test -- --testPathPattern=analyticsController
```

### Integration Tests
```bash
# Test analytics workflow
npm run test:integration -- --grep "Analytics"
```

### Performance Tests
```bash
# Load test analytics endpoints
npm run test:performance -- --grep "Analytics"
```

## 📝 API Documentation

### Get Analytics Data
```http
GET /api/analytics/data?collegeId=123&dateRange=30&assessmentType=exam
```

**Response:**
```json
{
  "success": true,
  "data": {
    "summary": {
      "totalAssessments": 45,
      "activeStudents": 120,
      "averageScore": 78.5,
      "completionRate": 85.2
    },
    "charts": {
      "scoreDistribution": [...],
      "submissionPatterns": [...],
      "departmentPerformance": [...]
    }
  }
}
```

### Save Analytics View
```http
POST /api/analytics/views
Content-Type: application/json

{
  "name": "Monthly Review",
  "module": "assessments",
  "filters": {
    "collegeId": "123",
    "dateRange": "30"
  }
}
```

## 🐛 Troubleshooting

### Common Issues

1. **Slow Loading Times**
   - Check database query performance
   - Verify proper indexing on analytics tables
   - Consider implementing data caching

2. **Filter Not Working**
   - Verify role-based access permissions
   - Check filter parameter validation
   - Ensure proper data relationships

3. **Export Failures**
   - Check file permissions on export directory
   - Verify available disk space
   - Check export file size limits

4. **Chart Rendering Issues**
   - Verify chart data format
   - Check for null/undefined values
   - Ensure proper chart library initialization

### Debug Mode

Enable debug mode for detailed logging:

```javascript
// Enable analytics debug mode
localStorage.setItem('analyticsDebug', 'true');

// Check debug logs
console.log('Analytics Debug:', window.analyticsDebug);
```

## 🔄 Updates and Maintenance

### Regular Maintenance
- **Data Cleanup**: Remove old analytics views and annotations
- **Performance Monitoring**: Monitor query performance and optimize
- **Security Updates**: Regular security patches and updates
- **Feature Updates**: New analytics features and improvements

### Migration Guide
When updating the analytics module:

1. **Backup Data**: Export existing analytics views and annotations
2. **Update Schema**: Run database migrations
3. **Update Frontend**: Deploy new analytics components
4. **Test Thoroughly**: Verify all functionality works correctly
5. **Monitor Performance**: Watch for any performance issues

## 📞 Support

For issues or questions regarding the Analytics & Reports module:

1. **Documentation**: Check this README and inline code comments
2. **Logs**: Review application logs for error details
3. **Database**: Verify data integrity and relationships
4. **Network**: Check API endpoint availability and responses

---

**Version**: 2.0.0  
**Last Updated**: December 2024  
**Maintainer**: LMS Development Team 