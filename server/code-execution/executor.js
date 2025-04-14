const { exec } = require('child_process');
const fs = require('fs').promises;
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const os = require('os');

// No longer need a base directory since we're not using volume mounting

// Execute a command and return the result
function executeCommand(command, options = {}) {
  return new Promise((resolve, reject) => {
    exec(command, options, (error, stdout, stderr) => {
      if (error) {
        reject({ error, stderr });
      } else {
        resolve({ stdout, stderr });
      }
    });
  });
}

// Execute Python code in a Docker container
async function executePython(code, input) {
  const executionId = uuidv4();

  try {
    console.log(`Starting Python execution with ID: ${executionId}`);
    console.log(`Code length: ${code?.length || 0} characters`);
    console.log(`Input length: ${input?.length || 0} characters`);

    // Create temporary files for code and input
    const tempCodeFile = path.join(os.tmpdir(), `solution_${executionId}.py`);
    const tempInputFile = path.join(os.tmpdir(), `input_${executionId}.txt`);

    // Write code and input to files
    await fs.writeFile(tempCodeFile, code);
    await fs.writeFile(tempInputFile, input || '');

    // Create a temporary script to run in Docker
    const tempScriptFile = path.join(os.tmpdir(), `run_${executionId}.sh`);
    const scriptContent = `#!/bin/bash
cat > /tmp/solution.py << 'EOL'
${code}
EOL

cat > /tmp/input.txt << 'EOL'
${input || ''}
EOL

cat /tmp/input.txt | python3 /tmp/solution.py 2>&1`;

    await fs.writeFile(tempScriptFile, scriptContent);
    await executeCommand(`chmod +x ${tempScriptFile}`);

    // Check if Docker is running
    try {
      await executeCommand('docker ps');
      console.log('Docker is running');
    } catch (dockerError) {
      console.error('Docker is not running:', dockerError);
      return {
        output: '',
        error: 'Docker is not running. Please start Docker and try again.',
        executionTime: 0,
        memoryUsed: 0
      };
    }

    // Set up Docker command using a pre-built Python image
    const dockerCommand = `cat ${tempScriptFile} | docker run --rm --network none --memory=512m --cpus=1 \
      --name code_exec_${executionId} \
      -i python:3.9-slim \
      bash`;

    console.log('Executing Python code with Docker command:', dockerCommand);

    // Execute code
    const startTime = Date.now();
    const { stdout, stderr } = await executeCommand(dockerCommand);
    const executionTime = Date.now() - startTime;

    console.log('Python execution result:', {
      stdout: stdout?.substring(0, 200),
      stderr: stderr?.substring(0, 200),
      executionTime
    });

    // Clean up temporary files
    try {
      await fs.unlink(tempCodeFile);
      await fs.unlink(tempInputFile);
      await fs.unlink(tempScriptFile);
      console.log('Temporary files cleaned up');
    } catch (cleanupError) {
      console.error('Error cleaning up temporary files:', cleanupError);
    }

    // Get memory usage (this is approximate)
    const memoryUsed = 50; // Default value in MB

    return {
      output: stdout,
      error: stderr,
      executionTime,
      memoryUsed
    };
  } catch (error) {
    console.error('Error executing Python code:', error);
    return {
      output: '',
      error: error.stderr || error.message || 'Execution error',
      executionTime: 0,
      memoryUsed: 0
    };
  }
}

// Execute C++ code in a Docker container
async function executeCpp(code, input) {
  const executionId = uuidv4();

  try {
    console.log(`Starting C++ execution with ID: ${executionId}`);
    console.log(`Code length: ${code?.length || 0} characters`);
    console.log(`Input length: ${input?.length || 0} characters`);

    // Create temporary files for code and input
    const tempCodeFile = path.join(os.tmpdir(), `solution_${executionId}.cpp`);
    const tempInputFile = path.join(os.tmpdir(), `input_${executionId}.txt`);

    // Write code and input to files
    await fs.writeFile(tempCodeFile, code);
    await fs.writeFile(tempInputFile, input || '');

    // Create a temporary script to run in Docker
    const tempScriptFile = path.join(os.tmpdir(), `run_${executionId}.sh`);
    const scriptContent = `#!/bin/bash
cat > /tmp/solution.cpp << 'EOL'
${code}
EOL

cat > /tmp/input.txt << 'EOL'
${input || ''}
EOL

g++ -o /tmp/solution /tmp/solution.cpp -std=c++17 2>&1 && cat /tmp/input.txt | /tmp/solution 2>&1 || echo "Compilation failed"$?`;

    await fs.writeFile(tempScriptFile, scriptContent);
    await executeCommand(`chmod +x ${tempScriptFile}`);

    // Check if Docker is running
    try {
      await executeCommand('docker ps');
      console.log('Docker is running');
    } catch (dockerError) {
      console.error('Docker is not running:', dockerError);
      return {
        output: '',
        error: 'Docker is not running. Please start Docker and try again.',
        executionTime: 0,
        memoryUsed: 0
      };
    }

    // Set up Docker command using a pre-built GCC image
    const dockerCommand = `cat ${tempScriptFile} | docker run --rm --network none --memory=512m --cpus=1 \
      --name code_exec_${executionId} \
      -i gcc:latest \
      bash`;

    console.log('Executing C++ code with Docker command:', dockerCommand);

    // Execute code
    const startTime = Date.now();
    const { stdout, stderr } = await executeCommand(dockerCommand);
    const executionTime = Date.now() - startTime;

    console.log('C++ execution result:', {
      stdout: stdout?.substring(0, 200),
      stderr: stderr?.substring(0, 200),
      executionTime
    });

    // Clean up temporary files
    try {
      await fs.unlink(tempCodeFile);
      await fs.unlink(tempInputFile);
      await fs.unlink(tempScriptFile);
      console.log('Temporary files cleaned up');
    } catch (cleanupError) {
      console.error('Error cleaning up temporary files:', cleanupError);
    }

    // Get memory usage (this is approximate)
    const memoryUsed = 50; // Default value in MB

    return {
      output: stdout,
      error: stderr,
      executionTime,
      memoryUsed
    };
  } catch (error) {
    console.error('Error executing C++ code:', error);
    return {
      output: '',
      error: error.stderr || error.message || 'Compilation or execution error',
      executionTime: 0,
      memoryUsed: 0
    };
  }
}

// Execute code based on language
async function executeCode(code, language, input) {
  switch (language.toLowerCase()) {
    case 'python':
      return executePython(code, input);
    case 'cpp':
      return executeCpp(code, input);
    default:
      throw new Error(`Unsupported language: ${language}`);
  }
}

// Run test cases for a specific problem
async function runTestCases(code, language, testCases) {
  const results = [];

  for (const testCase of testCases) {
    const { input, expected } = testCase;

    // Execute code with test case input
    const result = await executeCode(code, language, input);

    // Compare output with expected output
    const output = result.output.trim();
    const expectedTrimmed = expected.trim();

    // Check if the output matches the expected output
    // For numeric arrays, we need to handle different formats
    let passed = false;

    if (output === expectedTrimmed) {
      passed = true;
    } else {
      // Try to parse as JSON if possible
      try {
        const outputArray = JSON.parse(output.replace(/'/g, '"'));
        const expectedArray = JSON.parse(expectedTrimmed.replace(/'/g, '"'));

        if (Array.isArray(outputArray) && Array.isArray(expectedArray) &&
            outputArray.length === expectedArray.length) {
          passed = outputArray.every((val, idx) => val === expectedArray[idx]);
        }
      } catch (e) {
        // Not valid JSON, use string comparison
        passed = false;
      }
    }

    results.push({
      ...testCase,
      actual: output,
      passed,
      executionTime: result.executionTime,
      memoryUsed: result.memoryUsed
    });
  }

  return results;
}

// Check Docker and pull required images
async function buildDockerImage() {
  try {
    console.log('Checking Docker and pulling required images...');

    // Check if Docker is installed
    try {
      const { stdout } = await executeCommand('docker --version');
      console.log('Docker version:', stdout);
    } catch (err) {
      console.error('Docker is not installed or not running:', err);
      throw new Error('Docker is not installed or not running');
    }

    // Pull required images
    console.log('Pulling Python image...');
    try {
      await executeCommand('docker pull python:3.9-slim');
      console.log('Python image pulled successfully');
    } catch (err) {
      console.error('Failed to pull Python image:', err);
      // Continue anyway, the image might already be available
    }

    console.log('Pulling GCC image...');
    try {
      await executeCommand('docker pull gcc:latest');
      console.log('GCC image pulled successfully');
    } catch (err) {
      console.error('Failed to pull GCC image:', err);
      // Continue anyway, the image might already be available
    }

    console.log('Docker setup completed');
  } catch (error) {
    console.error('Error setting up Docker:', error);
    throw error;
  }
}

module.exports = {
  executeCode,
  runTestCases,
  buildDockerImage
};
