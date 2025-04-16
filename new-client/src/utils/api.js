export const API_URL = 'http://localhost:5002/api';

// Helper function to handle fetch requests
export const fetchAPI = async (url, options = {}) => {
  try {
    // Add default headers
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers
    };

    // Add auth token if available - check both storage locations
    const token = sessionStorage.getItem('token') || localStorage.getItem('token');
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    // Add session ID if available
    const sessionId = sessionStorage.getItem('sessionId');
    if (sessionId) {
      headers['X-Session-ID'] = sessionId;
    }

    // Get the user email from sessionStorage
    const userEmail = sessionStorage.getItem('userEmail');

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
    if (options.body) {
      console.log('API Request Body:', options.body);
    }

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

          // Normalize ID fields to ensure both id and _id are available
          if (data && typeof data === 'object') {
            // For single objects
            if (data._id && !data.id) {
              data.id = data._id;
              console.log('Added id field based on _id:', data._id);
            } else if (data.id && !data._id) {
              data._id = data.id;
              console.log('Added _id field based on id:', data.id);
            }

            // For arrays of objects
            if (Array.isArray(data)) {
              data.forEach(item => {
                if (item && typeof item === 'object') {
                  if (item._id && !item.id) {
                    item.id = item._id;
                    console.log('Added id field to array item based on _id:', item._id);
                  } else if (item.id && !item._id) {
                    item._id = item.id;
                    console.log('Added _id field to array item based on id:', item.id);
                  }
                }
              });
            }

            // Handle nested objects like test.testCases
            const normalizeNestedObjects = (obj) => {
              if (!obj || typeof obj !== 'object') return;

              Object.keys(obj).forEach(key => {
                const value = obj[key];
                if (Array.isArray(value)) {
                  value.forEach(item => {
                    if (item && typeof item === 'object') {
                      if (item._id && !item.id) {
                        item.id = item._id;
                      } else if (item.id && !item._id) {
                        item._id = item.id;
                      }
                      normalizeNestedObjects(item);
                    }
                  });
                } else if (value && typeof value === 'object') {
                  if (value._id && !value.id) {
                    value.id = value._id;
                  } else if (value.id && !value._id) {
                    value._id = value.id;
                  }
                  normalizeNestedObjects(value);
                }
              });
            };

            // Apply normalization to nested objects
            if (!Array.isArray(data)) {
              normalizeNestedObjects(data);
            } else {
              data.forEach(item => normalizeNestedObjects(item));
            }
          }
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

export const updateUserProfile = (profileData) => fetchAPI('/users/profile', {
  method: 'PUT',
  body: JSON.stringify(profileData)
});

// Tests API
export const getAllTests = () => fetchAPI('/tests');
export const getPublicTests = () => fetchAPI('/tests/public');
export const getMyTests = () => fetchAPI('/tests/my-tests');
export const getTestTemplates = () => fetchAPI('/tests/templates');
export const createTestFromTemplate = (templateIndex) => fetchAPI(`/tests/from-template/${templateIndex}`, {
  method: 'POST'
});
export const getTestById = (id) => {
  if (!id) {
    console.error('Invalid test ID:', id);
    return Promise.reject(new Error('Invalid test ID'));
  }

  // Ensure we're using a string ID
  const testId = id.toString();
  console.log('Fetching test with ID:', testId);

  return fetchAPI(`/tests/${testId}`)
    .then(response => {
      console.log('Test data received:', response);
      return response;
    })
    .catch(error => {
      console.error(`Error fetching test ${testId}:`, error);
      throw error;
    });
};
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
export const getUserAssessmentSubmissions = () => {
  const userId = localStorage.getItem('userId');
  const userEmail = localStorage.getItem('userEmail');

  if (!userId || !userEmail) {
    console.error('User ID or email missing for fetching assessment submissions');
    return Promise.reject(new Error('User authentication required. Please log in again.'));
  }

  console.log(`Fetching assessment submissions for user ${userEmail} (${userId})`);

  return fetchAPI('/assessments/user-submissions', {
    headers: {
      'X-User-ID': userId // Add user ID to headers for additional verification
    }
  });
};
export const getAssessmentSubmissionById = (id) => {
  if (!id) {
    console.error('Invalid assessment submission ID:', id);
    return Promise.reject(new Error('Invalid assessment submission ID'));
  }
  console.log('Fetching assessment submission with ID:', id);
  return fetchAPI(`/assessments/submissions/${id}?email=${encodeURIComponent(sessionStorage.getItem('userEmail') || '')}`);
};

export const getAssessmentSubmissions = (assessmentId) => {
  if (!assessmentId) {
    console.error('Invalid assessment ID:', assessmentId);
    return Promise.reject(new Error('Invalid assessment ID'));
  }
  console.log('Fetching submissions for assessment with ID:', assessmentId);

  // Get user email from session storage
  const userEmail = sessionStorage.getItem('userEmail') || '';
  console.log('User email for submissions request:', userEmail);

  // Make sure to use the correct URL format with proper encoding
  return fetchAPI(`/assessments/${assessmentId}/submissions?email=${encodeURIComponent(userEmail)}`);
};

export const getSubmissionById = (id) => {
  if (!id) {
    console.error('Invalid submission ID:', id);
    return Promise.reject(new Error('Invalid submission ID'));
  }

  // Ensure we're using a string ID
  const submissionId = id.toString();
  console.log('Fetching submission with ID:', submissionId);

  const userEmail = sessionStorage.getItem('userEmail') || '';
  console.log('User email for submission request:', userEmail);

  return fetchAPI(`/code/submissions/${submissionId}`)
    .then(response => {
      console.log('Submission data received:', response);
      return response;
    })
    .catch(error => {
      console.error(`Error fetching submission ${submissionId}:`, error);
      throw error;
    });
};
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
export const getAssessmentById = (id) => {
  if (!id) {
    console.error('Invalid assessment ID:', id);
    return Promise.reject(new Error('Invalid assessment ID'));
  }

  // Ensure we're using a string ID
  const assessmentId = id.toString();
  console.log('Fetching assessment with ID:', assessmentId);

  return fetchAPI(`/assessments/${assessmentId}`)
    .then(response => {
      console.log('Assessment data received:', response);
      return response;
    })
    .catch(error => {
      console.error(`Error fetching assessment ${assessmentId}:`, error);
      throw error;
    });
};
export const createAssessment = (assessmentData) => fetchAPI('/assessments', {
  method: 'POST',
  body: JSON.stringify(assessmentData)
});
export const updateAssessment = (id, assessmentData) => {
  if (!id) {
    console.error('Invalid assessment ID:', id);
    return Promise.reject(new Error('Invalid assessment ID'));
  }

  // Ensure we're using the correct ID format
  const assessmentId = (assessmentData.id || assessmentData._id || id).toString();
  console.log('Updating assessment with ID:', assessmentId);

  // Make a copy of the data to avoid modifying the original
  const dataToSend = { ...assessmentData };

  // Ensure both id and _id are set correctly
  if (dataToSend.id && !dataToSend._id) {
    dataToSend._id = dataToSend.id;
    console.log('Added _id field based on id:', dataToSend.id);
  } else if (dataToSend._id && !dataToSend.id) {
    dataToSend.id = dataToSend._id;
    console.log('Added id field based on _id:', dataToSend._id);
  }

  // Normalize IDs in tests array if it exists
  if (dataToSend.tests && Array.isArray(dataToSend.tests)) {
    dataToSend.tests = dataToSend.tests.map(testId => testId.toString());
    console.log('Normalized test IDs in assessment:', dataToSend.tests);
  }

  // Normalize IDs in invitedStudents array if it exists
  if (dataToSend.invitedStudents && Array.isArray(dataToSend.invitedStudents)) {
    dataToSend.invitedStudents = dataToSend.invitedStudents.map(studentId => {
      if (typeof studentId === 'object' && (studentId.id || studentId._id)) {
        return (studentId.id || studentId._id).toString();
      }
      return studentId.toString();
    });
    console.log('Normalized invitedStudents IDs in assessment:', dataToSend.invitedStudents);
  }

  return fetchAPI(`/assessments/${assessmentId}`, {
    method: 'PUT',
    body: JSON.stringify(dataToSend)
  })
  .then(response => {
    console.log('Assessment updated successfully:', response);
    return response;
  })
  .catch(error => {
    console.error(`Error updating assessment ${assessmentId}:`, error);
    throw error;
  });
};
export const deleteAssessment = (id) => {
  if (!id) {
    console.error('Invalid assessment ID:', id);
    return Promise.reject(new Error('Invalid assessment ID'));
  }

  // Ensure we're using a string ID
  const assessmentId = id.toString();
  console.log('Deleting assessment with ID:', assessmentId);

  // Check for auth token before making request
  const token = sessionStorage.getItem('token') || localStorage.getItem('token');
  if (!token) {
    console.error('No authentication token found');
    return Promise.reject(new Error('Authentication token missing. Please log in again.'));
  }

  const userEmail = sessionStorage.getItem('userEmail') || localStorage.getItem('userEmail');
  if (!userEmail) {
    console.error('No user email found');
    return Promise.reject(new Error('User email missing. Please log in again.'));
  }

  console.log('User email for deletion request:', userEmail);

  // Use the direct endpoint for deletion
  return fetchAPI(`/direct/assessments/${assessmentId}`, {
    method: 'DELETE'
  })
  .then(response => {
    console.log('Assessment deleted successfully:', response);
    return response;
  })
  .catch(error => {
    console.error(`Error deleting assessment ${assessmentId}:`, error);
    throw error;
  });
};
export const addTestToAssessment = (assessmentId, testId) => {
  if (!assessmentId) {
    console.error('Invalid assessment ID:', assessmentId);
    return Promise.reject(new Error('Invalid assessment ID'));
  }
  if (!testId) {
    console.error('Invalid test ID:', testId);
    return Promise.reject(new Error('Invalid test ID'));
  }

  // Ensure we're using string IDs
  const assessmentIdStr = assessmentId.toString();
  const testIdStr = testId.toString();

  console.log(`Adding test ${testIdStr} to assessment ${assessmentIdStr}`);

  return fetchAPI(`/assessments/${assessmentIdStr}/tests/${testIdStr}`, {
    method: 'POST'
  })
  .then(response => {
    console.log(`Successfully added test ${testIdStr} to assessment ${assessmentIdStr}:`, response);
    return response;
  })
  .catch(error => {
    console.error(`Error adding test ${testIdStr} to assessment ${assessmentIdStr}:`, error);
    throw error;
  });
};
export const removeTestFromAssessment = (assessmentId, testId) => {
  if (!assessmentId) {
    console.error('Invalid assessment ID:', assessmentId);
    return Promise.reject(new Error('Invalid assessment ID'));
  }
  if (!testId) {
    console.error('Invalid test ID:', testId);
    return Promise.reject(new Error('Invalid test ID'));
  }

  // Ensure we're using string IDs
  const assessmentIdStr = assessmentId.toString();
  const testIdStr = testId.toString();

  console.log(`Removing test ${testIdStr} from assessment ${assessmentIdStr}`);

  return fetchAPI(`/assessments/${assessmentIdStr}/tests/${testIdStr}`, {
    method: 'DELETE'
  })
  .then(response => {
    console.log(`Successfully removed test ${testIdStr} from assessment ${assessmentIdStr}:`, response);
    return response;
  })
  .catch(error => {
    console.error(`Error removing test ${testIdStr} from assessment ${assessmentIdStr}:`, error);
    throw error;
  });
};
export const assignAssessmentToUser = (assessmentId, userId) => fetchAPI(`/assessments/${assessmentId}/assign/${userId}`, {
  method: 'POST'
});
export const unassignAssessmentFromUser = (assessmentId, userId) => fetchAPI(`/assessments/${assessmentId}/assign/${userId}`, {
  method: 'DELETE'
});
export const getAssessees = () => fetchAPI('/users/assessees');

export const inviteStudentsByEmail = (assessmentId, emails) => {
  if (!assessmentId) {
    console.error('Invalid assessment ID:', assessmentId);
    return Promise.reject(new Error('Invalid assessment ID'));
  }
  if (!emails || (Array.isArray(emails) && emails.length === 0) || emails === '') {
    console.error('No emails provided for invitation');
    return Promise.reject(new Error('No emails provided for invitation'));
  }

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

export const inviteStudentsByIds = (assessmentId, userIds) => {
  if (!assessmentId) {
    console.error('Invalid assessment ID:', assessmentId);
    return Promise.reject(new Error('Invalid assessment ID'));
  }
  if (!userIds || (Array.isArray(userIds) && userIds.length === 0)) {
    console.error('No user IDs provided for invitation');
    return Promise.reject(new Error('No user IDs provided for invitation'));
  }

  // Ensure userIds is an array
  const formattedUserIds = Array.isArray(userIds) ? userIds : [userIds];

  console.log('Inviting students to assessment by IDs:', assessmentId);
  console.log('User IDs to invite:', formattedUserIds);

  return fetchAPI(`/assessments/${assessmentId}/invite`, {
    method: 'POST',
    body: JSON.stringify({ userIds: formattedUserIds })
  });
};

export const acceptInvitation = (assessmentId, data) => {
  if (!assessmentId) {
    console.error('Invalid assessment ID:', assessmentId);
    return Promise.reject(new Error('Invalid assessment ID'));
  }
  console.log('Accepting invitation for assessment:', assessmentId);
  return fetchAPI(`/assessments/${assessmentId}/accept-invitation`, {
    method: 'POST',
    body: JSON.stringify(data || {})
  });
};

// Submit an entire assessment
export const submitAssessment = (assessmentId, userData = {}) => {
  if (!assessmentId) {
    console.error('Invalid assessment ID:', assessmentId);
    return Promise.reject(new Error('Invalid assessment ID'));
  }

  // Get user ID from localStorage if not provided
  const userId = userData.userId || localStorage.getItem('userId');
  const userEmail = userData.userEmail || localStorage.getItem('userEmail');

  if (!userId || !userEmail) {
    console.error('User ID or email missing for assessment submission');
    return Promise.reject(new Error('User authentication required. Please log in again.'));
  }

  console.log(`Submitting assessment ${assessmentId} for user ${userEmail} (${userId})`);

  return fetchAPI(`/assessments/${assessmentId}/submit`, {
    method: 'POST',
    body: JSON.stringify({
      userId,
      userEmail,
      timestamp: new Date().toISOString()
    }),
    headers: {
      'X-User-ID': userId // Add user ID to headers for additional verification
    }
  });
};

// Generate an invitation link for an assessment
export const generateInvitationLink = (assessmentId, email) => {
  if (!assessmentId) {
    console.error('Invalid assessment ID:', assessmentId);
    return null;
  }
  if (!email) {
    console.error('Invalid email for invitation link');
    return null;
  }

  // Create a simple token based on the assessment ID and email
  const token = btoa(`${assessmentId}:${email}:${Date.now()}`).replace(/=/g, '');

  // Get the base URL
  const baseUrl = window.location.origin;

  console.log(`Generating invitation link for assessment ${assessmentId} and email ${email}`);

  // Create the invitation URL
  return `${baseUrl}/assessments/${assessmentId}/invitation?token=${token}&email=${encodeURIComponent(email)}`;
};

// Notifications API
export const getNotifications = () => fetchAPI('/notifications');
export const markNotificationAsRead = (notificationId) => {
  if (!notificationId) {
    console.error('Invalid notification ID:', notificationId);
    return Promise.reject(new Error('Invalid notification ID'));
  }
  console.log('Marking notification as read:', notificationId);
  return fetchAPI(`/notifications/${notificationId}/read`, {
    method: 'POST'
  });
};

export default {
  // Auth
  register,
  login,
  getCurrentUser,
  deleteUserAccount,
  updateUserProfile,

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
  getUserAssessmentSubmissions,
  getSubmissionById,
  getAssessmentSubmissionById,
  getAssessmentSubmissions,
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
