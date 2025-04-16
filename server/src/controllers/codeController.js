const Test = require('../models/Test');
const Submission = require('../models/Submission');

// Execute code without submitting
exports.executeCode = async (req, res) => {
  try {
    const { code, language, input } = req.body;

    // In a real implementation, you would send the code to a code execution service
    // For now, we'll simulate it

    // Simulate code execution delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Simulate output
    let output;
    if (language === 'javascript') {
      output = `Output for JavaScript code:\n${input.split('\\n').join(' ')} processed`;
    } else if (language === 'python') {
      output = `Output for Python code:\n${input.split('\\n').join(' ')} processed`;
    } else if (language === 'java') {
      output = `Output for Java code:\n${input.split('\\n').join(' ')} processed`;
    } else if (language === 'cpp') {
      output = `Output for C++ code:\n${input.split('\\n').join(' ')} processed`;
    } else {
      output = `Output for ${language} code:\n${input.split('\\n').join(' ')} processed`;
    }

    res.json({
      output,
      executionTime: Math.floor(Math.random() * 1000),
      memoryUsed: Math.floor(Math.random() * 100)
    });
  } catch (error) {
    console.error('Execute code error:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
};

// Run code against test cases
exports.runTestCases = async (req, res) => {
  try {
    const { code, language } = req.body;
    const testId = req.params.testId;

    // Find the test
    const test = await Test.findById(testId);
    if (!test) {
      return res.status(404).json({ message: 'Test not found' });
    }

    // In a real implementation, you would send the code to a code execution service
    // For now, we'll simulate it

    // Simulate code execution delay
    await new Promise(resolve => setTimeout(resolve, 1500));

    // Simulate test case results
    const results = test.testCases.map((testCase, index) => {
      const passed = Math.random() > 0.3;
      return {
        testCaseNumber: index + 1,
        passed,
        input: testCase.isHidden ? 'Hidden' : testCase.input,
        expectedOutput: testCase.isHidden ? 'Hidden' : testCase.output,
        actualOutput: passed
          ? testCase.output
          : `Wrong output: ${Math.random().toString(36).substring(7)}`,
        executionTime: Math.floor(Math.random() * 500),
        memoryUsed: Math.floor(Math.random() * 50)
      };
    });

    const testCasesPassed = results.filter(r => r.passed).length;

    res.json({
      results,
      summary: {
        totalTestCases: test.testCases.length,
        passedTestCases: testCasesPassed,
        failedTestCases: test.testCases.length - testCasesPassed,
        status: testCasesPassed === test.testCases.length ? 'Accepted' : 'Wrong Answer'
      }
    });
  } catch (error) {
    console.error('Run test cases error:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
};
