const API_URL = 'http://localhost:5002/api';

// Helper function to handle fetch requests
export const fetchAPI = async (url, options = {}) => {
  try {
    // Add default headers
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers
    };

    // Add auth token if available
    const token = localStorage.getItem('token');
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    // Make the request
    const response = await fetch(`${API_URL}${url}`, {
      ...options,
      headers
    });

    // Parse the response
    const data = await response.json();

    // Check if the response is ok
    if (!response.ok) {
      throw new Error(data.message || 'Something went wrong');
    }

    return data;
  } catch (error) {
    console.error(`API Error (${url}):`, error);
    throw error;
  }
};

// Auth API
export const register = (userData) => fetchAPI('/auth/register', {
  method: 'POST',
  body: JSON.stringify(userData)
});

export const login = (userData) => fetchAPI('/auth/login', {
  method: 'POST',
  body: JSON.stringify(userData)
});

export const getCurrentUser = () => fetchAPI('/auth/me');

export const deleteUserAccount = () => fetchAPI('/users/me', {
  method: 'DELETE'
});

// Tests API
export const getAllTests = () => fetchAPI('/tests');
export const getPublicTests = () => fetchAPI('/tests/public');
export const getMyTests = () => fetchAPI('/tests/my-tests');
export const getTestTemplates = () => fetchAPI('/tests/templates');
export const createTestFromTemplate = (templateIndex) => fetchAPI(`/tests/from-template/${templateIndex}`, {
  method: 'POST'
});
export const getTestById = (id) => fetchAPI(`/tests/${id}`);
export const createTest = (testData) => fetchAPI('/tests', {
  method: 'POST',
  body: JSON.stringify(testData)
});
export const updateTest = (id, testData) => fetchAPI(`/tests/${id}`, {
  method: 'PUT',
  body: JSON.stringify(testData)
});
export const deleteTest = (id) => fetchAPI(`/tests/${id}`, {
  method: 'DELETE'
});

// Test Cases API
export const getTestCases = (testId) => fetchAPI(`/tests/${testId}/test-cases`);
export const addTestCase = (testId, testCaseData) => fetchAPI(`/tests/${testId}/test-cases`, {
  method: 'POST',
  body: JSON.stringify(testCaseData)
});
export const updateTestCase = (testId, caseId, testCaseData) => fetchAPI(`/tests/${testId}/test-cases/${caseId}`, {
  method: 'PUT',
  body: JSON.stringify(testCaseData)
});
export const deleteTestCase = (testId, caseId) => fetchAPI(`/tests/${testId}/test-cases/${caseId}`, {
  method: 'DELETE'
});

// Submissions API
export const submitCode = (testId, submissionData) => fetchAPI(`/tests/${testId}/submissions`, {
  method: 'POST',
  body: JSON.stringify(submissionData)
});
export const getTestSubmissions = (testId) => fetchAPI(`/tests/${testId}/submissions`);
export const getUserSubmissions = () => fetchAPI('/code/submissions');
export const getSubmissionById = (id) => fetchAPI(`/code/submissions/${id}`);
export const deleteSubmission = (id) => fetchAPI(`/code/submissions/${id}`, {
  method: 'DELETE'
});

// Code Execution API
export const executeCode = (codeData) => fetchAPI('/code/execute', {
  method: 'POST',
  body: JSON.stringify(codeData)
});
export const runTestCases = (testId, codeData) => fetchAPI(`/code/tests/${testId}/run`, {
  method: 'POST',
  body: JSON.stringify(codeData)
});

// Assessments API
export const getMyAssessments = () => fetchAPI('/assessments/my-assessments');
export const getAssignedAssessments = () => fetchAPI('/assessments/assigned');
export const getAssessmentById = (id) => fetchAPI(`/assessments/${id}`);
export const createAssessment = (assessmentData) => fetchAPI('/assessments', {
  method: 'POST',
  body: JSON.stringify(assessmentData)
});
export const updateAssessment = (id, assessmentData) => fetchAPI(`/assessments/${id}`, {
  method: 'PUT',
  body: JSON.stringify(assessmentData)
});
export const deleteAssessment = (id) => fetchAPI(`/assessments/${id}`, {
  method: 'DELETE'
});
export const addTestToAssessment = (assessmentId, testId) => fetchAPI(`/assessments/${assessmentId}/tests/${testId}`, {
  method: 'POST'
});
export const removeTestFromAssessment = (assessmentId, testId) => fetchAPI(`/assessments/${assessmentId}/tests/${testId}`, {
  method: 'DELETE'
});
export const assignAssessmentToUser = (assessmentId, userId) => fetchAPI(`/assessments/${assessmentId}/assign/${userId}`, {
  method: 'POST'
});
export const unassignAssessmentFromUser = (assessmentId, userId) => fetchAPI(`/assessments/${assessmentId}/assign/${userId}`, {
  method: 'DELETE'
});
export const getAssessees = () => fetchAPI('/users/assessees');

export const inviteStudentsByEmail = (assessmentId, emails) => fetchAPI(`/assessments/${assessmentId}/invite`, {
  method: 'POST',
  body: JSON.stringify({ emails })
});

export const inviteStudentsByIds = (assessmentId, userIds) => fetchAPI(`/assessments/${assessmentId}/invite`, {
  method: 'POST',
  body: JSON.stringify({ userIds })
});

// Notifications API
export const getNotifications = () => fetchAPI('/notifications');
export const markNotificationAsRead = (notificationId) => fetchAPI(`/notifications/${notificationId}/read`, {
  method: 'POST'
});

export default {
  // Auth
  register,
  login,
  getCurrentUser,
  deleteUserAccount,

  // Tests
  getAllTests,
  getPublicTests,
  getMyTests,
  getTestTemplates,
  createTestFromTemplate,
  getTestById,
  createTest,
  updateTest,
  deleteTest,

  // Test Cases
  getTestCases,
  addTestCase,
  updateTestCase,
  deleteTestCase,

  // Submissions
  submitCode,
  getTestSubmissions,
  getUserSubmissions,
  getSubmissionById,
  deleteSubmission,

  // Code Execution
  executeCode,
  runTestCases,

  // Assessments
  getMyAssessments,
  getAssignedAssessments,
  getAssessmentById,
  createAssessment,
  updateAssessment,
  deleteAssessment,
  addTestToAssessment,
  removeTestFromAssessment,
  assignAssessmentToUser,
  unassignAssessmentFromUser,
  getAssessees,
  inviteStudentsByEmail,
  inviteStudentsByIds,

  // Notifications
  getNotifications,
  markNotificationAsRead
};
