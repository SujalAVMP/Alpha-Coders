# Coding Assessment Platform

A modern platform for creating, managing, and taking coding assessments. This application allows assessors to create coding tests and assessments, and assessees to take these assessments and submit their solutions.

## Features

- **User Authentication**: Register and login with role selection (Assessor or Assessee)
- **Assessor Dashboard**: Create and manage coding tests and assessments
- **Assessee Dashboard**: View and take assigned assessments
- **Real-time Code Execution**: Execute code in Docker containers for Python and C++
- **Assessment Management**: Create assessments with multiple questions, time limits, and attempt limits
- **Invitation System**: Invite specific users to private assessments by email

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- npm (v6 or higher)
- Docker (for code execution)

### Running the Application

The easiest way to run the application is using the provided start script:

```bash
./start-app.sh
```

This script will:
1. Stop any running instances of the application
2. Start the server on port 5002
3. Start the client on port 5173 or 5174
4. Open the application in your default browser

### Stopping the Application

To stop the application, run:

```bash
./stop-app.sh
```

### Manual Setup

If you prefer to run the components manually:

#### Server

```bash
cd server
node test-server.js
```

#### Client

```bash
cd new-client
npm install
npm run dev
```

## Usage

### Registration and Login

1. Register as either an Assessor or Assessee
2. Login with your credentials

### For Assessors

1. Create coding tests with descriptions, sample inputs/outputs, and test cases
2. Create assessments by selecting tests, setting time limits, and configuring other settings
3. Invite assessees by email to take your assessments
4. View submissions and results

### For Assessees

1. View assigned assessments
2. Take assessments within the specified time limits
3. Write and test your code in the integrated code editor
4. Submit your solutions for evaluation

## Technologies Used

- **Frontend**: React, Material-UI, Monaco Editor
- **Backend**: Node.js, Express
- **Code Execution**: Docker
- **Authentication**: JWT
