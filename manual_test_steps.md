# Manual Testing Steps for Hackerrank Clone

## Prerequisites
- Server is running on http://localhost:5002
- Client is running on http://localhost:3000

## Step 1: Register Users
1. Open the application in your browser
2. Click on "Register" to create two accounts:
   - Teacher account:
     - Name: Teacher User
     - Email: teacher@example.com
     - Password: password123
     - Role: Assessor
   - Student account:
     - Name: Student User
     - Email: student@example.com
     - Password: password123
     - Role: Assessee

## Step 2: Login as Teacher
1. Login with the teacher account:
   - Email: teacher@example.com
   - Password: password123

## Step 3: Create Tests
1. Navigate to the "Create Test" section
2. Create a "Two Sum" test:
   - Title: Two Sum
   - Description: Find two numbers that add up to a target
   - Difficulty: Easy
   - Time Limit: 60 minutes
   - Problem Statement: Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target.
   - Input Format: First line contains an array of integers. Second line contains the target integer.
   - Output Format: Return the indices of the two numbers that add up to the target.
   - Sample Input: [2,7,11,15]\n9
   - Sample Output: [0,1]
   - Test Cases:
     - Input: [2,7,11,15]\n9, Expected: [0,1], Hidden: false
     - Input: [3,2,4]\n6, Expected: [1,2], Hidden: false
     - Input: [3,3]\n6, Expected: [0,1], Hidden: true

3. Create a "Merge K Sorted Lists" test:
   - Title: Merge K Sorted Lists
   - Description: Merge k sorted linked lists into one sorted linked list
   - Difficulty: Hard
   - Time Limit: 90 minutes
   - Problem Statement: You are given an array of k linked-lists lists, each linked-list is sorted in ascending order. Merge all the linked-lists into one sorted linked-list and return it.
   - Input Format: The input is an array of arrays, where each inner array represents a linked list.
   - Output Format: Return the merged linked list as an array.
   - Sample Input: [[1,4,5],[1,3,4],[2,6]]
   - Sample Output: [1,1,2,3,4,4,5,6]
   - Test Cases:
     - Input: [[1,4,5],[1,3,4],[2,6]], Expected: [1,1,2,3,4,4,5,6], Hidden: false
     - Input: [], Expected: [], Hidden: false
     - Input: [[]], Expected: [], Hidden: true

## Step 4: Create Assessment
1. Navigate to the "Create Assessment" section
2. Create a new assessment:
   - Title: Coding Assessment
   - Description: Test your coding skills with these two problems
   - Start Time: Current time
   - End Time: 1 day from now
   - Max Attempts: 3
   - Add both tests created in Step 3

## Step 5: Invite Student
1. Navigate to the assessment details
2. Click on "Invite Students"
3. Enter the student's email: student@example.com
4. Click "Invite"

## Step 6: Login as Student
1. Logout from the teacher account
2. Login with the student account:
   - Email: student@example.com
   - Password: password123

## Step 7: Take Assessment
1. Navigate to the "Assigned Assessments" section
2. Find the "Coding Assessment" and click on it
3. Start the assessment

## Step 8: Submit Incorrect Code
1. Select the "Two Sum" problem
2. Choose Python as the language
3. Enter the following incorrect code:
```python
print('hi')
```
4. Submit the code
5. Verify that the submission fails the test cases

## Step 9: Submit Correct Code
1. Select the "Two Sum" problem again
2. Choose Python as the language
3. Enter the following correct code:
```python
def twoSum(nums, target):
    seen = {}
    for i, num in enumerate(nums):
        complement = target - num
        if complement in seen:
            return [seen[complement], i]
        seen[num] = i
    return []

# Parse input
input_lines = input().strip().split('\n')
nums = eval(input_lines[0])
target = int(input_lines[1])

# Call function and print result
print(twoSum(nums, target))
```
4. Submit the code
5. Verify that the submission passes the test cases

## Step 10: Check Results
1. Navigate to the "Submissions" section
2. Verify that both submissions are listed
3. Check that the incorrect submission failed and the correct submission passed

## Debugging Tips
If you encounter any issues during testing:
1. Check the browser console for client-side errors
2. Check the server logs for server-side errors
3. Verify that the server is running on port 5002
4. Verify that the client is running on port 3000
5. Make sure Docker is running for code execution
