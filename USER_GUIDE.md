# Alpha Coders User Guide

This guide will walk you through the complete workflow of using the Alpha Coders application, from registration to creating and taking assessments.

## Table of Contents
- [Alpha Coders User Guide](#alpha-coders-user-guide)
  - [Table of Contents](#table-of-contents)
  - [Getting Started](#getting-started)
    - [Registration](#registration)
    - [Login](#login)
  - [For Assessors (Teachers)](#for-assessors-teachers)
    - [Creating Tests](#creating-tests)
      - [Using Templates](#using-templates)
      - [Adding Test Cases](#adding-test-cases)
    - [Creating Assessments](#creating-assessments)
      - [Adding Tests to an Assessment](#adding-tests-to-an-assessment)
    - [Inviting Students](#inviting-students)
  - [For Assessees (Students)](#for-assessees-students)
    - [Taking Assessments](#taking-assessments)
    - [Submitting Code](#submitting-code)
  - [Troubleshooting](#troubleshooting)
    - [Getting Signed Out When Refreshing](#getting-signed-out-when-refreshing)
    - [Can't See the Tests Tab](#cant-see-the-tests-tab)
    - [Can't Add Multiple Tests to an Assessment](#cant-add-multiple-tests-to-an-assessment)
    - [Invitation Not Working](#invitation-not-working)

## Getting Started

### Registration
1. Navigate to the login page at http://localhost:5173/ (or http://localhost:5174/ depending on which port is available)
2. Click on "Register" to create a new account
3. Fill in your details:
   - Name
   - Email
   - Password
   - Role (Assessor or Assessee)
4. Click "Register" to create your account

### Login
1. Navigate to the login page at http://localhost:5173/ (or http://localhost:5174/ depending on which port is available)
2. Enter your email and password
   - For testing, you can use these pre-created accounts:
     - Assessor: email `1`, password `1`
     - Assessees: emails `2`, `3`, `4` with matching passwords
   - Or register your own accounts
3. Click "Login" to access your dashboard

## For Assessors (Teachers)

### Creating Tests

Tests are individual coding problems that can be added to assessments. To create a test:

1. From your dashboard, click on "Tests" in the navigation menu
2. Click the "Create New Test" button
3. You'll see the test editor with three tabs:
   - **Basic Info**: Enter the test title, description, difficulty, and time limit
   - **Problem Statement**: Enter the problem statement, input/output format, constraints, and sample input/output
   - **Test Cases**: Add test cases to validate student submissions

#### Using Templates
1. When creating a new test, you can start with a template
2. Select a template from the dropdown at the top of the page
3. The form will be pre-filled with the template data
4. You can modify any fields as needed

#### Adding Test Cases
1. Go to the "Test Cases" tab
2. Enter the input and expected output for a test case
3. Select whether the test case should be hidden from students
4. Click "Add Test Case" to add it to the list
5. Repeat for additional test cases
6. Click "Save Test" when you're done

### Creating Assessments

Assessments are collections of tests that you can assign to students. To create an assessment:

1. From your dashboard, click on "Assessments" in the navigation menu
2. Click the "Create New Assessment" button
3. You'll see the assessment editor with three tabs:
   - **Basic Information**: Enter the assessment title, description, start/end times, and maximum attempts
   - **Tests**: Select tests to include in the assessment
   - **Students**: Invite students to take the assessment

#### Adding Tests to an Assessment
1. Go to the "Tests" tab in the assessment editor
2. You'll see a list of available tests
3. Click the "Add to Assessment" button for each test you want to include
4. The button will change to "Remove" when a test is selected
5. You can add multiple tests to an assessment

### Inviting Students

1. Go to the "Students" tab in the assessment editor
2. Enter the email addresses of the students you want to invite (comma-separated)
3. Click "Invite Students" to send invitations
4. Students will see the assessment in their dashboard once invited

## For Assessees (Students)

### Taking Assessments

1. From your dashboard, click on "My Assessments" to see assessments assigned to you
2. Click on an assessment to view its details
3. Click "Start Assessment" to begin

### Submitting Code

1. When taking an assessment, you'll see the problem statement and a code editor
2. Write your solution in the code editor
3. Select the programming language (Python or C++)
4. Click "Submit" to run your code against the test cases
5. You'll see the results of your submission, including which test cases passed or failed

## Troubleshooting

### Getting Signed Out When Refreshing
- Make sure you're using the latest version of the application
- Clear your browser cache and cookies
- Try using a different browser

### Can't See the Tests Tab
- Make sure you're logged in as an Assessor
- Navigate to the Assessments section and create a new assessment
- The Tests tab should be visible in the assessment editor

### Can't Add Multiple Tests to an Assessment
- Make sure you're clicking the "Add to Assessment" button for each test
- The button should change to "Remove" when a test is selected
- You can add as many tests as you want to an assessment

### Invitation Not Working
- Make sure you're entering the correct email address
- The email address must be registered in the system
- Check the server logs for any errors

If you encounter any other issues, please contact the administrator for assistance.
