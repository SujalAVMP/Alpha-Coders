const API_URL = 'http://localhost:5002/api';

// Helper function to handle fetch requests
const fetchAPI = async (url, options = {}) => {
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

// Tests API
export const getAllTests = () => fetchAPI('/tests');
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

// Submissions API
export const submitCode = (testId, submissionData) => fetchAPI(`/tests/${testId}/submissions`, {
  method: 'POST',
  body: JSON.stringify(submissionData)
});
export const getTestSubmissions = (testId) => fetchAPI(`/tests/${testId}/submissions`);
export const getUserSubmissions = () => fetchAPI('/code/submissions');
export const getSubmissionById = (id) => fetchAPI(`/code/submissions/${id}`);

// Code Execution API
export const executeCode = (codeData) => fetchAPI('/code/execute', {
  method: 'POST',
  body: JSON.stringify(codeData)
});
export const runTestCases = (testId, codeData) => fetchAPI(`/code/tests/${testId}/run`, {
  method: 'POST',
  body: JSON.stringify(codeData)
});

export default {
  register,
  login,
  getCurrentUser,
  getAllTests,
  getTestById,
  createTest,
  updateTest,
  deleteTest,
  submitCode,
  getTestSubmissions,
  getUserSubmissions,
  getSubmissionById,
  executeCode,
  runTestCases
};
