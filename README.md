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

- Node.js (v18 or higher)
- npm (v9 or higher)
- MongoDB (running on localhost:27017)
- Docker (for code execution)

### Installation

1. Clone the repository
2. Install all dependencies with a single command:

```bash
npm run install-all
```

Or install dependencies for each component separately:

```bash
# Root dependencies
npm install

# Server dependencies
cd server
npm install

# Client dependencies
cd ../new-client
npm install
```

### Running the Application

The easiest way to run the application is using the provided start script:

```bash
./start-app.sh
```

Or use npm:

```bash
npm start
```

This script will:
1. Stop any running instances of the application
2. Start Docker if it's not running
3. Start MongoDB if it's not running
4. Start the server on port 5002
5. Start the client on port 5173 or 5174
6. Open the application in your default browser

### Stopping the Application

To stop the application, run:

```bash
./stop-app.sh
```

Or use npm:

```bash
npm run stop
```

### Manual Setup

If you prefer to run the components manually:

#### Server

```bash
cd server
npm install
npm start
```

#### Client

```bash
cd new-client
npm install
npm run dev
```

### Test Users

When you first start the application with a fresh database, it will automatically create the following test users:

- **Assessor**: email: `1`, password: `1`
- **Assessees**: emails: `2`, `3`, `4` with matching passwords

You can use these accounts for testing or create your own by registering new users.

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

- **Frontend**: React, Vite, Material-UI, Monaco Editor
- **Backend**: Node.js, Express
- **Database**: MongoDB
- **Code Execution**: Docker (Python and C++ support)
- **Authentication**: Session-based with tokens

## Project Structure

- **`/server`**: Backend Node.js server
  - `/models`: MongoDB schemas
  - `/code-execution`: Docker-based code execution engine
  - `/routes`: API endpoints

- **`/new-client`**: React frontend
  - `/src/components`: React components
  - `/src/utils`: Utility functions
  - `/src/context`: React context providers

- **Root**: Configuration files and startup scripts

## License

This project is licensed under the MIT License - see the LICENSE file for details.
