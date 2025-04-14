const fetch = require('node-fetch');

const API_URL = 'http://localhost:5002/api';

async function testApi() {
  try {
    console.log('Testing API...');
    const response = await fetch(`${API_URL}/test`);
    const data = await response.json();
    console.log('API response:', data);
    return data;
  } catch (error) {
    console.error('Error testing API:', error.message);
    throw error;
  }
}

async function registerUser() {
  try {
    console.log('Registering user...');
    const userData = {
      name: 'Test User',
      email: 'test@gmail.com',
      password: 'password123'
    };
    const response = await fetch(`${API_URL}/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(userData)
    });
    const data = await response.json();
    console.log('Registration response:', data);
    return data;
  } catch (error) {
    console.error('Error registering user:', error.message);
    throw error;
  }
}

async function loginUser() {
  try {
    console.log('Logging in user...');
    const userData = {
      email: 'test@gmail.com',
      password: 'password123'
    };
    const response = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(userData)
    });
    const data = await response.json();
    console.log('Login response:', data);
    return data;
  } catch (error) {
    console.error('Error logging in user:', error.message);
    throw error;
  }
}

async function getTests(token) {
  try {
    console.log('Getting tests...');
    const response = await fetch(`${API_URL}/tests`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    const data = await response.json();
    console.log('Tests response:', data);
    return data;
  } catch (error) {
    console.error('Error getting tests:', error.message);
    throw error;
  }
}

async function main() {
  try {
    await testApi();
    const registerData = await registerUser();
    const loginData = await loginUser();
    await getTests(loginData.token);
  } catch (error) {
    console.error('Error in main:', error.message);
  }
}

main();
