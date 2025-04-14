// Sample test templates with code templates for each problem type
const sampleTestTemplates = [
  {
    title: 'Two Sum',
    description: 'Find two numbers that add up to a target',
    difficulty: 'Easy',
    timeLimit: 60,
    problemStatement: 'Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target. You may assume that each input would have exactly one solution, and you may not use the same element twice.',
    inputFormat: 'First line contains an array of integers separated by space. Second line contains the target integer.',
    outputFormat: 'Return the indices of the two numbers that add up to the target.',
    constraints: '2 <= nums.length <= 10^4\n-10^9 <= nums[i] <= 10^9\n-10^9 <= target <= 10^9\nOnly one valid answer exists.',
    sampleInput: '[2,7,11,15]\n9',
    sampleOutput: '[0,1]',
    codeTemplates: {
      python: `def solution(nums, target):
    # Your code here
    pass

# Read input
nums = eval(input().strip())
target = int(input().strip())

# Call function and print result
print(solution(nums, target))`,
      cpp: `#include <iostream>
#include <vector>
#include <string>
#include <sstream>

std::vector<int> solution(std::vector<int>& nums, int target) {
    // Your code here
    return {};
}

// Parse input string to vector
std::vector<int> parseInput(const std::string& input) {
    std::vector<int> result;
    std::stringstream ss(input.substr(1, input.size() - 2)); // Remove [ and ]
    std::string item;
    while (std::getline(ss, item, ',')) {
        result.push_back(std::stoi(item));
    }
    return result;
}

int main() {
    // Read input
    std::string input;
    std::getline(std::cin, input);
    std::vector<int> nums = parseInput(input);

    int target;
    std::cin >> target;

    // Call solution
    std::vector<int> result = solution(nums, target);

    // Print result
    std::cout << "[";
    for (size_t i = 0; i < result.size(); ++i) {
        if (i > 0) std::cout << ", ";
        std::cout << result[i];
    }
    std::cout << "]" << std::endl;

    return 0;
}`
    },
    testCases: [
      { input: '[2,7,11,15]\n9', expected: '[0,1]', isHidden: false },
      { input: '[3,2,4]\n6', expected: '[1,2]', isHidden: false },
      { input: '[3,3]\n6', expected: '[0,1]', isHidden: true }
    ]
  },
  {
    title: 'Reverse Linked List',
    description: 'Reverse a singly linked list',
    difficulty: 'Medium',
    timeLimit: 60,
    problemStatement: 'Given the head of a singly linked list, reverse the list, and return the reversed list. The linked list is represented as an array for simplicity.',
    inputFormat: 'The input is an array representing the linked list.',
    outputFormat: 'Return the reversed linked list as an array.',
    constraints: 'The number of nodes in the list is the range [0, 5000].\n-5000 <= Node.val <= 5000',
    sampleInput: '[1,2,3,4,5]',
    sampleOutput: '[5,4,3,2,1]',
    codeTemplates: {
      python: `def solution(head):
    # Your code here
    pass

# Read input
head = eval(input().strip())

# Call function and print result
print(solution(head))`,
      cpp: `#include <iostream>
#include <vector>
#include <string>
#include <sstream>
#include <algorithm>

std::vector<int> solution(std::vector<int>& head) {
    // Your code here
    return head;
}

// Parse input string to vector
std::vector<int> parseInput(const std::string& input) {
    std::vector<int> result;
    std::stringstream ss(input.substr(1, input.size() - 2)); // Remove [ and ]
    std::string item;
    while (std::getline(ss, item, ',')) {
        result.push_back(std::stoi(item));
    }
    return result;
}

int main() {
    // Read input
    std::string input;
    std::getline(std::cin, input);
    std::vector<int> head = parseInput(input);

    // Call solution
    std::vector<int> result = solution(head);

    // Print result
    std::cout << "[";
    for (size_t i = 0; i < result.size(); ++i) {
        if (i > 0) std::cout << ", ";
        std::cout << result[i];
    }
    std::cout << "]" << std::endl;

    return 0;
}`
    },
    testCases: [
      { input: '[1,2,3,4,5]', expected: '[5,4,3,2,1]', isHidden: false },
      { input: '[1,2]', expected: '[2,1]', isHidden: false },
      { input: '[]', expected: '[]', isHidden: true }
    ]
  },
  {
    title: 'Merge K Sorted Lists',
    description: 'Merge k sorted linked lists into one sorted linked list',
    difficulty: 'Hard',
    timeLimit: 90,
    problemStatement: 'You are given an array of k linked-lists lists, each linked-list is sorted in ascending order. Merge all the linked-lists into one sorted linked-list and return it. The linked lists are represented as arrays for simplicity.',
    inputFormat: 'The input is an array of arrays, where each inner array represents a linked list.',
    outputFormat: 'Return the merged linked list as an array.',
    constraints: 'k == lists.length\n0 <= k <= 10^4\n0 <= lists[i].length <= 500\n-10^4 <= lists[i][j] <= 10^4\nlists[i] is sorted in ascending order.\nThe sum of lists[i].length will not exceed 10^4.',
    sampleInput: '[[1,4,5],[1,3,4],[2,6]]',
    sampleOutput: '[1,1,2,3,4,4,5,6]',
    codeTemplates: {
      python: `def solution(lists):
    # Your code here
    pass

# Read input
lists = eval(input().strip())

# Call function and print result
print(solution(lists))`,
      cpp: `#include <iostream>
#include <vector>
#include <string>
#include <sstream>
#include <algorithm>

std::vector<int> solution(std::vector<std::vector<int>>& lists) {
    // Your code here
    std::vector<int> result;
    return result;
}

// Parse input string to vector of vectors
std::vector<std::vector<int>> parseInput(const std::string& input) {
    std::vector<std::vector<int>> result;
    // Simple parsing for demo purposes
    // In a real implementation, you would need more robust parsing
    
    // For this example, we'll just return an empty vector
    // as the parsing is complex for nested arrays
    return result;
}

int main() {
    // Read input
    std::string input;
    std::getline(std::cin, input);
    std::vector<std::vector<int>> lists = parseInput(input);

    // Call solution
    std::vector<int> result = solution(lists);

    // Print result
    std::cout << "[";
    for (size_t i = 0; i < result.size(); ++i) {
        if (i > 0) std::cout << ", ";
        std::cout << result[i];
    }
    std::cout << "]" << std::endl;

    return 0;
}`
    },
    testCases: [
      { input: '[[1,4,5],[1,3,4],[2,6]]', expected: '[1,1,2,3,4,4,5,6]', isHidden: false },
      { input: '[]', expected: '[]', isHidden: false },
      { input: '[[]]', expected: '[]', isHidden: true }
    ]
  },
  {
    title: 'Valid Parentheses',
    description: 'Determine if a string of parentheses is valid',
    difficulty: 'Easy',
    timeLimit: 45,
    problemStatement: 'Given a string s containing just the characters \'(\', \')\', \'{\', \'}\', \'[\' and \']\', determine if the input string is valid. An input string is valid if: Open brackets must be closed by the same type of brackets, and open brackets must be closed in the correct order.',
    inputFormat: 'A string containing only parentheses characters: (){}[]',
    outputFormat: 'Return true if the string is valid, false otherwise.',
    constraints: '1 <= s.length <= 10^4\ns consists of parentheses only \'()[]{}\'.',
    sampleInput: '()[]{}',
    sampleOutput: 'true',
    codeTemplates: {
      python: `def solution(s):
    # Your code here
    pass

# Read input
s = input().strip()

# Call function and print result
print(str(solution(s)).lower())`,
      cpp: `#include <iostream>
#include <string>
#include <stack>

bool solution(std::string s) {
    // Your code here
    return false;
}

int main() {
    // Read input
    std::string s;
    std::getline(std::cin, s);

    // Call solution
    bool result = solution(s);

    // Print result
    std::cout << (result ? "true" : "false") << std::endl;

    return 0;
}`
    },
    testCases: [
      { input: '()[]{}', expected: 'true', isHidden: false },
      { input: '([)]', expected: 'false', isHidden: false },
      { input: '{[]}', expected: 'true', isHidden: false },
      { input: '((', expected: 'false', isHidden: true }
    ]
  },
  {
    title: 'Maximum Subarray',
    description: 'Find the contiguous subarray with the largest sum',
    difficulty: 'Medium',
    timeLimit: 60,
    problemStatement: 'Given an integer array nums, find the contiguous subarray (containing at least one number) which has the largest sum and return its sum.',
    inputFormat: 'An array of integers.',
    outputFormat: 'The maximum sum of a contiguous subarray.',
    constraints: '1 <= nums.length <= 10^5\n-10^4 <= nums[i] <= 10^4',
    sampleInput: '[-2,1,-3,4,-1,2,1,-5,4]',
    sampleOutput: '6',
    codeTemplates: {
      python: `def solution(nums):
    # Your code here
    pass

# Read input
nums = eval(input().strip())

# Call function and print result
print(solution(nums))`,
      cpp: `#include <iostream>
#include <vector>
#include <string>
#include <sstream>
#include <algorithm>

int solution(std::vector<int>& nums) {
    // Your code here
    return 0;
}

// Parse input string to vector
std::vector<int> parseInput(const std::string& input) {
    std::vector<int> result;
    std::stringstream ss(input.substr(1, input.size() - 2)); // Remove [ and ]
    std::string item;
    while (std::getline(ss, item, ',')) {
        result.push_back(std::stoi(item));
    }
    return result;
}

int main() {
    // Read input
    std::string input;
    std::getline(std::cin, input);
    std::vector<int> nums = parseInput(input);

    // Call solution
    int result = solution(nums);

    // Print result
    std::cout << result << std::endl;

    return 0;
}`
    },
    testCases: [
      { input: '[-2,1,-3,4,-1,2,1,-5,4]', expected: '6', isHidden: false },
      { input: '[1]', expected: '1', isHidden: false },
      { input: '[5,4,-1,7,8]', expected: '23', isHidden: false },
      { input: '[-1]', expected: '-1', isHidden: true }
    ]
  }
];

module.exports = sampleTestTemplates;
