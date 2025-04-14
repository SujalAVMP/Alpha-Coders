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

    // Get the user email from localStorage
    const userEmail = localStorage.getItem('userEmail');

    // Add email as query parameter if available
    let apiUrl = `${API_URL}${url}`;
    if (userEmail) {
      // Check if URL already has query parameters
      const separator = apiUrl.includes('?') ? '&' : '?';
      // Make sure we don't add the email parameter twice
      if (!apiUrl.includes(`email=${encodeURIComponent(userEmail)}`)) {
        apiUrl += `${separator}email=${encodeURIComponent(userEmail)}`;
      }
    }

    console.log('API Request URL:', apiUrl);
    console.log('API Request Body:', options.body);

    // Make the request
    const response = await fetch(apiUrl, {
      ...options,
      headers
    });

    console.log('API Response Status:', response.status);
    console.log('API Response Headers:', response.headers);

    // Check if the response is HTML instead of JSON (common server error)
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('text/html')) {
      const htmlText = await response.text();
      console.error('Received HTML response instead of JSON:', htmlText.substring(0, 200));
      throw new Error('Server returned HTML instead of JSON. The server might be experiencing issues.');
    }

    // Try to parse the response as JSON
    let data;
    try {
      const responseText = await response.text();
      console.log('API Response Text:', responseText.substring(0, 200));

      // Try to parse the response as JSON if it's not empty
      if (responseText.trim()) {
        try {
          data = JSON.parse(responseText);
        } catch (jsonError) {
          console.error('Error parsing JSON:', jsonError);
          throw new Error(`Failed to parse response as JSON: ${responseText.substring(0, 100)}...`);
        }
      } else {
        console.warn('Empty response received');
        data = {};
      }
    } catch (parseError) {
      console.error('Error reading response:', parseError);

      // For 500 errors, try to get more detailed error information
      if (response.status === 500) {
        throw new Error(`API request failed with status ${response.status}: ${response.statusText}`);
      } else if (!response.ok) {
        throw new Error(`API request failed with status ${response.status}: ${response.statusText}`);
      }

      return {};
    }

    // Check if the response is ok
    if (!response.ok) {
      console.error(`API Error (${url}):`, {
        status: response.status,
        statusText: response.statusText,
        data
      });
      throw new Error(data.message || `API request failed with status ${response.status}`);
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

export const getCurrentUser = (email) => {
  const url = email ? `/auth/me?email=${encodeURIComponent(email)}` : '/auth/me';
  return fetchAPI(url);
};

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
export const executeCode = (codeData) => {
  console.log('Executing code with data:', codeData);
  return fetchAPI('/code/execute', {
    method: 'POST',
    body: JSON.stringify(codeData)
  });
};

export const runTestCases = (testId, codeData) => {
  console.log(`Running test cases for test ${testId} with data:`, codeData);
  return fetchAPI(`/code/tests/${testId}/run`, {
    method: 'POST',
    body: JSON.stringify(codeData)
  });
};

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

export const inviteStudentsByEmail = (assessmentId, emails) => {
  // Ensure emails is properly formatted
  // If it's a comma-separated string, keep it as is
  // If it's an array, join it with commas
  const formattedEmails = Array.isArray(emails) ? emails.join(',') : emails;

  console.log('Inviting students to assessment:', assessmentId);
  console.log('Emails to invite:', formattedEmails);

  return fetchAPI(`/assessments/${assessmentId}/invite`, {
    method: 'POST',
    body: JSON.stringify({ emails: formattedEmails })
  });
};

export const inviteStudentsByIds = (assessmentId, userIds) => fetchAPI(`/assessments/${assessmentId}/invite`, {
  method: 'POST',
  body: JSON.stringify({ userIds })
});

export const acceptInvitation = (assessmentId, data) => fetchAPI(`/assessments/${assessmentId}/accept-invitation`, {
  method: 'POST',
  body: JSON.stringify(data)
});

// Submit an entire assessment
export const submitAssessment = (assessmentId) => fetchAPI(`/assessments/${assessmentId}/submit`, {
  method: 'POST',
  body: JSON.stringify({})
});

// Generate an invitation link for an assessment
export const generateInvitationLink = (assessmentId, email) => {
  // Create a simple token based on the assessment ID and email
  const token = btoa(`${assessmentId}:${email}:${Date.now()}`).replace(/=/g, '');

  // Get the base URL
  const baseUrl = window.location.origin;

  // Create the invitation URL
  return `${baseUrl}/assessments/${assessmentId}/invitation?token=${token}&email=${encodeURIComponent(email)}`;
};

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
  acceptInvitation,
  generateInvitationLink,

  // Notifications
  getNotifications,
  markNotificationAsRead
};
