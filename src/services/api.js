const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

class ApiService {
  constructor() {
    this.baseURL = API_BASE_URL;
  }

  // Get auth token from localStorage
  getAuthToken() {
    return localStorage.getItem('lmsToken');
  }

  // Set auth token in localStorage
  setAuthToken(token) {
    localStorage.setItem('lmsToken', token);
  }

  // Remove auth token from localStorage
  removeAuthToken() {
    localStorage.removeItem('lmsToken');
  }

  // Get headers for API requests
  getHeaders() {
    const headers = {
      'Content-Type': 'application/json',
    };

    const token = this.getAuthToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    return headers;
  }

  // Make HTTP request
  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const config = {
      headers: this.getHeaders(),
      ...options,
    };

    try {
      const response = await fetch(url, config);
      const data = await response.json();

      if (!response.ok) {
        // Handle authentication errors
        if (response.status === 401) {
          this.removeAuthToken();
          localStorage.removeItem('lmsUser');
          window.location.href = '/login';
          throw new Error('Authentication failed');
        }

        throw new Error(data.message || 'Request failed');
      }

      return data;
    } catch (error) {
      // API request failed
      throw error;
    }
  }

  // GET request
  async get(endpoint) {
    return this.request(endpoint, { method: 'GET' });
  }

  // POST request
  async post(endpoint, data) {
    return this.request(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // PUT request
  async put(endpoint, data) {
    return this.request(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  // DELETE request
  async delete(endpoint) {
    return this.request(endpoint, { method: 'DELETE' });
  }

  // PATCH request
  async patch(endpoint, data) {
    return this.request(endpoint, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  // User Management endpoints (new)
  async getUsers(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    const endpoint = queryString ? `/users?${queryString}` : '/users';
    return this.get(endpoint);
  }

  async getUserById(userId) {
    return this.get(`/users/${userId}`);
  }

  async createUser(userData) {
    return this.post('/users', userData);
  }

  async updateUser(userId, userData) {
    return this.put(`/users/${userId}`, userData);
  }

  async deleteUser(userId) {
    return this.delete(`/users/${userId}`);
  }

  async toggleUserStatus(userId) {
    return this.patch(`/users/${userId}/toggle-status`);
  }

  async downloadUserTemplate(type) {
    const url = `${this.baseURL}/users/template/${type}`;
    const headers = this.getHeaders();
    delete headers['Content-Type'];
    const response = await fetch(url, { headers });
    if (!response.ok) throw new Error('Failed to download template');
    return await response.blob();
  }

  async bulkUploadUsers(file) {
    const url = `${this.baseURL}/users/bulk-upload`;
    const headers = this.getHeaders();
    delete headers['Content-Type'];
    const formData = new FormData();
    formData.append('file', file);
    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: formData
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Upload failed');
    return data;
  }

  // Auth endpoints
  async login(credentials) {
    const response = await this.post('/auth/login', credentials);
    if (response.success) {
      this.setAuthToken(response.data.token);
      localStorage.setItem('lmsUser', JSON.stringify(response.data.user));
    }
    return response;
  }

  async register(userData) {
    const response = await this.post('/auth/register', userData);
    if (response.success) {
      this.setAuthToken(response.data.token);
      localStorage.setItem('lmsUser', JSON.stringify(response.data.user));
    }
    return response;
  }

  async logout() {
    try {
      await this.post('/auth/logout');
    } catch (error) {
      // Logout error
    } finally {
      this.removeAuthToken();
      localStorage.removeItem('lmsUser');
    }
  }

  async getProfile() {
    return this.get('/auth/profile');
  }

  async updateProfile(profileData) {
    return this.put('/auth/profile', profileData);
  }

  async changePassword(passwordData) {
    return this.put('/auth/change-password', passwordData);
  }





  // Super Admin endpoints
  async getSuperAdminDashboardStats() {
    return this.get('/super-admin/dashboard/stats');
  }

  async getSuperAdminAnalytics() {
    return this.get('/super-admin/analytics');
  }

  // Analytics endpoints
  async getAnalyticsData(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    const endpoint = queryString ? `/analytics/data?${queryString}` : '/analytics/data';
    return this.get(endpoint);
  }

  // Course analytics
  async getCourseAnalyticsData(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    const endpoint = queryString ? `/analytics/course-data?${queryString}` : '/analytics/course-data';
    return this.get(endpoint);
  }

  async getCollegesForAnalytics() {
    return this.get('/analytics/colleges');
  }

  async getDepartmentsForAnalytics(collegeId) {
    const params = { collegeId };
    const queryString = new URLSearchParams(params).toString();
    const endpoint = queryString ? `/analytics/departments?${queryString}` : '/analytics/departments';
    return this.get(endpoint);
  }

  async getStudentsForAnalytics(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    const endpoint = queryString ? `/analytics/students?${queryString}` : '/analytics/students';
    return this.get(endpoint);
  }

  async getStudents(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    const endpoint = queryString ? `/users/students?${queryString}` : '/users/students';
    return this.get(endpoint);
  }

  async getFacultyForAnalytics(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    const endpoint = queryString ? `/analytics/faculty?${queryString}` : '/analytics/faculty';
    return this.get(endpoint);
  }

  async getAssessmentTypes() {
    return this.get('/analytics/assessment-types');
  }

  async getCourseCategories() {
    return this.get('/analytics/course-categories');
  }

  async exportAnalyticsData(params = {}, format = 'excel') {
    return this.post('/analytics/export', { ...params, format });
  }

  // Save view functionality
  async saveAnalyticsView(viewData) {
    return this.post('/analytics/views', viewData);
  }

  async getSavedAnalyticsViews() {
    return this.get('/analytics/views');
  }

  async getSavedAnalyticsView(viewId) {
    return this.get(`/analytics/views/${viewId}`);
  }

  // Chart annotations
  async addChartAnnotation(annotationData) {
    return this.post('/analytics/annotations', annotationData);
  }

  async getChartAnnotations(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    const endpoint = queryString ? `/analytics/annotations?${queryString}` : '/analytics/annotations';
    return this.get(endpoint);
  }

  async getAssessmentDetails(assessmentId, params = {}) {
    const queryString = new URLSearchParams(params).toString();
    const endpoint = queryString ? `/analytics/assessment/${assessmentId}?${queryString}` : `/analytics/assessment/${assessmentId}`;
    return this.get(endpoint);
  }

  async getAssessmentSubmissions(assessmentId, params = {}) {
    const queryString = new URLSearchParams(params).toString();
    const endpoint = queryString ? `/analytics/assessment/${assessmentId}/submissions?${queryString}` : `/analytics/assessment/${assessmentId}/submissions`;
    return this.get(endpoint);
  }

  async getCollegeAssessments(collegeId, params = {}) {
    const queryString = new URLSearchParams(params).toString();
    const endpoint = queryString ? `/analytics/college/${collegeId}/assessments?${queryString}` : `/analytics/college/${collegeId}/assessments`;
    return this.get(endpoint);
  }

  async getAssessmentCollegeAnalysis(assessmentId, params = {}) {
    const queryString = new URLSearchParams(params).toString();
    const endpoint = queryString ? `/analytics/assessment/${assessmentId}/college-analysis?${queryString}` : `/analytics/assessment/${assessmentId}/college-analysis`;
    return this.get(endpoint);
  }

  async getSuperAdminColleges(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    const endpoint = queryString ? `/super-admin/colleges?${queryString}` : '/super-admin/colleges';
    return this.get(endpoint);
  }

  async getSuperAdminCollegeLocations() {
    return this.get('/super-admin/colleges/locations');
  }

  async getSuperAdminCollegeById(collegeId) {
    return this.get(`/super-admin/colleges/${collegeId}`);
  }

  async createSuperAdminCollege(collegeData) {
    return this.post('/super-admin/colleges', collegeData);
  }

  async updateSuperAdminCollege(collegeId, collegeData) {
    return this.put(`/super-admin/colleges/${collegeId}`, collegeData);
  }

  async deleteSuperAdminCollege(collegeId, options = {}) {
    const queryString = new URLSearchParams(options).toString();
    const endpoint = queryString ? `/super-admin/colleges/${collegeId}?${queryString}` : `/super-admin/colleges/${collegeId}`;
    return this.delete(endpoint);
  }

  async getSuperAdminCollegeStats(collegeId) {
    return this.get(`/super-admin/colleges/${collegeId}/stats`);
  }

  async getSuperAdminCollegeDetails(collegeId) {
    return this.get(`/super-admin/colleges/${collegeId}/details`);
  }

  // Department endpoints
  async getCollegeDepartments(collegeId) {
    return this.get(`/super-admin/colleges/${collegeId}/departments`);
  }

  async getCollegeBatches(collegeId) {
    return this.get(`/super-admin/colleges/${collegeId}/batches`);
  }

  async getDepartmentsForColleges(collegeIds) {
    return this.post('/super-admin/colleges/departments/batch', { collegeIds });
  }

  async getBatchesForColleges(collegeIds) {
    return this.post('/super-admin/colleges/batches/batch', { collegeIds });
  }

  async getCommonDepartments() {
    return this.get('/super-admin/colleges/departments/common');
  }

  // Batch endpoints
  async getBatches(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    const endpoint = queryString ? `/batches?${queryString}` : '/batches';
    return this.get(endpoint);
  }

  async createBatch(batchData) {
    return this.post('/batches', batchData);
  }

  async updateBatch(batchId, batchData) {
    return this.put(`/batches/${batchId}`, batchData);
  }

  async deleteBatch(batchId) {
    return this.delete(`/batches/${batchId}`);
  }

  async getSuperAdminUsers(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    const endpoint = queryString ? `/super-admin/users?${queryString}` : '/super-admin/users';
    return this.get(endpoint);
  }

  // Super Admin User CRUD
  async getSuperAdminUserById(userId) {
    return this.get(`/super-admin/users/${userId}`);
  }

  async createSuperAdminUser(userData) {
    return this.post('/super-admin/users', userData);
  }

  async updateSuperAdminUser(userId, userData) {
    return this.put(`/super-admin/users/${userId}`, userData);
  }

  async deleteSuperAdminUser(userId) {
    return this.delete(`/super-admin/users/${userId}`);
  }

  async toggleSuperAdminUserStatus(userId) {
    return this.request(`/super-admin/users/${userId}/toggle-status`, { method: 'PATCH' });
  }

  // Download student Excel template
  async downloadStudentTemplate() {
    const url = `${this.baseURL}/super-admin/users/template/student`;
    const headers = this.getHeaders();
    // Remove content-type for blob download
    delete headers['Content-Type'];
    const response = await fetch(url, { headers });
    if (!response.ok) throw new Error('Failed to download template');
    return await response.blob();
  }

  // Bulk upload students via Excel
  async uploadStudentsExcel(file) {
    const url = `${this.baseURL}/super-admin/users/bulk-upload`;
    const headers = this.getHeaders();
    // Remove content-type for multipart
    delete headers['Content-Type'];
    const formData = new FormData();
    formData.append('file', file);
    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: formData
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Upload failed');
    return data;
  }

  // Assessment Management endpoints
  async getAssessmentTemplates(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    const endpoint = queryString ? `/assessments/templates?${queryString}` : '/assessments/templates';
    return this.get(endpoint);
  }

  async getAssessmentTemplateById(id) {
    return this.get(`/assessments/templates/${id}`);
  }

  async createAssessmentTemplate(templateData) {
    return this.post('/assessments/templates', templateData);
  }

  async updateAssessmentTemplate(id, templateData) {
    return this.put(`/assessments/templates/${id}`, templateData);
  }

  async deleteAssessmentTemplate(id) {
    return this.delete(`/assessments/templates/${id}`);
  }

  // Assessment Sections
  async createAssessmentSection(assessmentId, sectionData) {
    return this.post(`/assessments/templates/${assessmentId}/sections`, sectionData);
  }

  async updateAssessmentSection(assessmentId, sectionId, sectionData) {
    return this.put(`/assessments/templates/${assessmentId}/sections/${sectionId}`, sectionData);
  }

  async deleteAssessmentSection(assessmentId, sectionId) {
    return this.delete(`/assessments/templates/${assessmentId}/sections/${sectionId}`);
  }

  // Assessment Questions
  async addQuestionToAssessment(assessmentId, questionData) {
    return this.post(`/assessments/templates/${assessmentId}/questions`, questionData);
  }

  async removeQuestionFromAssessment(assessmentId, questionId) {
    return this.delete(`/assessments/templates/${assessmentId}/questions/${questionId}`);
  }

  async reorderAssessmentQuestions(assessmentId, questionOrders) {
    return this.put(`/assessments/templates/${assessmentId}/questions/reorder`, { question_orders: questionOrders });
  }

  // Assessment Assignments
  async createAssessmentAssignment(assessmentId, assignmentData) {
    return this.post(`/assessments/templates/${assessmentId}/assignments`, assignmentData);
  }

  async getAssessmentAssignments(assessmentId) {
    return this.get(`/assessments/templates/${assessmentId}/assignments`);
  }

  async deleteAssessmentAssignment(assessmentId, assignmentId) {
    return this.delete(`/assessments/templates/${assessmentId}/assignments/${assignmentId}`);
  }

  // Email Notifications
  async sendAssessmentNotifications(notificationData) {
    return this.post('/assessments/notifications/send', notificationData);
  }

  async sendAssessmentReminder(assessmentId) {
    return this.post(`/assessments/notifications/reminder/${assessmentId}`);
  }

  // Question Selection Helpers
  async getQuestionsForSelection(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    const endpoint = queryString ? `/assessments/questions/selection?${queryString}` : '/assessments/questions/selection';
    return this.get(endpoint);
  }

  async calculateAssessmentPoints(assessmentId) {
    return this.get(`/assessments/templates/${assessmentId}/points`);
  }

  async getAssessmentInstances(params = {}) {
    // Add cache-busting parameter to ensure fresh data
    const cacheBuster = Date.now();
    const paramsWithCache = { ...params, _t: cacheBuster };
    const queryString = new URLSearchParams(paramsWithCache).toString();
    const endpoint = queryString ? `/assessments/instances?${queryString}` : '/assessments/instances';
    return this.get(endpoint);
  }

  async createAssessmentInstance(instanceData) {
    return this.post('/assessments/instances', instanceData);
  }

  // Student assessment attempts
  async getAssessmentAttemptInfo(assessmentId) {
    return this.get(`/assessments/${assessmentId}/attempt-info`);
  }

  async getAssessmentAttemptsHistory(assessmentId) {
    return this.get(`/assessments/${assessmentId}/attempts-history`);
  }

  async startAssessmentAttempt(attemptData) {
    return this.post('/assessments/attempts/start', attemptData);
  }

  async submitAssessmentAttempt(attemptData) {
    return this.post('/assessments/attempts/submit', attemptData);
  }

  async getAssessmentAttemptResults(attemptId) {
    return this.get(`/assessments/attempts/${attemptId}/results`);
  }

  // Assessment analytics
  async getAssessmentAnalytics(assessmentId) {
    return this.get(`/assessments/templates/${assessmentId}/analytics`);
  }

  // Question Bank endpoints
  async getQuestionCategories(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    const endpoint = queryString ? `/question-bank/categories?${queryString}` : '/question-bank/categories';
    return this.get(endpoint);
  }

  async createQuestionCategory(categoryData) {
    return this.post('/question-bank/categories', categoryData);
  }

  async updateQuestionCategory(id, categoryData) {
    return this.put(`/question-bank/categories/${id}`, categoryData);
  }

  async deleteQuestionCategory(id) {
    return this.delete(`/question-bank/categories/${id}`);
  }

  async getQuestionTags() {
    return this.get('/question-bank/tags');
  }

  async createQuestionTag(tagData) {
    return this.post('/question-bank/tags', tagData);
  }

  async getQuestions(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    const endpoint = queryString ? `/question-bank/questions?${queryString}` : '/question-bank/questions';
    return this.get(endpoint);
  }

  async getQuestionById(id) {
    return this.get(`/question-bank/questions/${id}`);
  }

  async createQuestion(questionData) {
    return this.post('/question-bank/questions', questionData);
  }

  async updateQuestion(id, questionData) {
    return this.put(`/question-bank/questions/${id}`, questionData);
  }

  async deleteQuestion(id) {
    return this.delete(`/question-bank/questions/${id}`);
  }

  async uploadQuestionAttachment(questionId, file) {
    const url = `${this.baseURL}/question-bank/questions/${questionId}/attachments`;
    const headers = this.getHeaders();
    delete headers['Content-Type'];
    const formData = new FormData();
    formData.append('file', file);
    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: formData
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Upload failed');
    return data;
  }

  async deleteQuestionAttachment(attachmentId) {
    return this.delete(`/question-bank/attachments/${attachmentId}`);
  }

  async getQuestionAnalytics(questionId) {
    return this.get(`/question-bank/questions/${questionId}/analytics`);
  }

  // Coding endpoints
  async executeCode(codeData) {
    return this.post('/coding/execute', codeData);
  }

  async runTestCases(testData) {
    return this.post('/coding/test-cases', testData);
  }

  async submitCode(codeData) {
    return this.post('/coding/submit', codeData);
  }

  async getSupportedLanguages() {
    return this.get('/coding/languages');
  }

  async getLanguageTemplates() {
    return this.get('/coding/templates');
  }

  async verifyCodingQuestion(verificationData) {
    return this.post('/coding/verify', verificationData);
      }

  async getCodingHealthCheck() {
    return this.get('/coding/health');
  }

  async getSubmissionStatus(submissionId) {
    return this.get(`/coding/submission/${submissionId}`);
  }

  // Student Assessment Methods
  async getAssessmentQuestions(assessmentId) {
    return this.get(`/assessments/${assessmentId}/questions`);
  }

  async assignAssessmentToStudents(assessmentId, studentIds) {
    return this.post(`/assessments/${assessmentId}/assign`, { student_ids: studentIds });
  }

  async sendAssessmentReminders(reminderData) {
    return this.post('/assessments/reminders', reminderData);
  }

  async getAssessmentSubmission(assessmentId, studentId) {
    return this.get(`/assessments/${assessmentId}/submissions/${studentId}`);
  }

  async saveAssessmentProgress(assessmentId, progressData) {
    return this.post(`/assessments/${assessmentId}/save-progress`, progressData);
  }

  async submitAssessment(assessmentId, submissionData) {
    return this.post(`/assessments/${assessmentId}/submit`, submissionData);
  }

  async getAssessmentResults(assessmentId, studentId) {
    return this.get(`/assessments/${assessmentId}/results/${studentId}`);
    }

  async getStudentAssessments(studentId, params = {}) {
    const queryParams = new URLSearchParams(params).toString();
    return this.get(`/student/${studentId}/assessments?${queryParams}`);
  }

  // Debug endpoint to check assessment data
  async debugAssessmentData(assessmentId) {
    return this.get(`/assessments/debug/${assessmentId}`);
  }

  // Debug endpoint to manually update assignment dates
  async debugUpdateAssignmentDates(assessmentId, dates) {
    return this.post(`/assessments/debug/${assessmentId}/update-dates`, dates);
  }

  // Coding Profiles endpoints
  async getCodingPlatforms() {
    return this.get('/coding-profiles/platforms');
  }

  async getUserCodingProfiles(userId) {
    return this.get(`/coding-profiles/user/${userId}`);
  }

  async getUserCodingProgress(userId) {
    return this.get(`/coding-profiles/user/${userId}/progress`);
  }

  async upsertCodingProfile(profileData) {
    return this.post('/coding-profiles/profile', profileData);
  }

  async fetchCodingProfileData(userId, platformId) {
    return this.get(`/coding-profiles/profile/${userId}/${platformId}/fetch`);
  }

  // Super Admin coding profile methods
  async getAllCodingProfiles() {
    return this.get('/coding-profiles/admin/all');
  }

  async bulkUploadCodingProfiles(profiles) {
    return this.post('/coding-profiles/admin/bulk-upload', { profiles });
  }

  async bulkRefreshCodingProfiles(profileIds, maxConcurrency = 100) {
    return this.post('/coding-profiles/admin/bulk-refresh', { profileIds, maxConcurrency });
  }

  async streamingBulkRefresh(profileIds, maxConcurrency = 100, onProgress) {
    return new Promise((resolve, reject) => {
      // Create a POST request with SSE
      const xhr = new XMLHttpRequest();
      xhr.open('POST', `${this.baseURL}/coding-profiles/admin/streaming-refresh`);
      xhr.setRequestHeader('Content-Type', 'application/json');
      xhr.setRequestHeader('Authorization', `Bearer ${localStorage.getItem('token')}`);
      xhr.setRequestHeader('Accept', 'text/event-stream');
      xhr.setRequestHeader('Cache-Control', 'no-cache');
      
      let buffer = '';
      
      xhr.onreadystatechange = () => {
        if (xhr.readyState === 3 || xhr.readyState === 4) {
          buffer += xhr.responseText;
          const lines = buffer.split('\n');
          buffer = lines.pop(); // Keep the last incomplete line
          
          for (const line of lines) {
            if (line.startsWith('data: ')) {
              try {
                const data = JSON.parse(line.slice(6));
                
                if (data.type === 'progress' && onProgress) {
                  onProgress(data);
                } else if (data.type === 'complete') {
                  resolve(data);
                } else if (data.type === 'error') {
                  reject(new Error(data.message));
                }
              } catch (error) {
              }
            }
          }
        }
      };
      
      xhr.onerror = (error) => {
        reject(error);
      };
      
      xhr.send(JSON.stringify({ profileIds, maxConcurrency }));
    });
  }

  async deleteCodingProfile(profileId) {
    return this.delete(`/coding-profiles/admin/profile/${profileId}`);
  }

  // College and Department methods
  async getColleges() {
    return this.get('/colleges');
  }

  async getDepartments() {
    // Get common departments from colleges endpoint
    return this.get('/colleges/departments/common');
  }

  async getDepartmentsByCollege(collegeId) {
    return this.get(`/colleges/${collegeId}/departments`);
  }
}

export default new ApiService(); 