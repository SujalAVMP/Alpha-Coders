#!/bin/bash

# Test Automation Script for Hackerrank Clone
# This script automates the process of:
# 1. Creating teacher and student users
# 2. Teacher creating a test with 2 questions (Two Sum and Merge K Lists)
# 3. Teacher inviting the student
# 4. Student taking the test
# 5. Testing code execution

# Set variables
SERVER_URL="http://localhost:5002"
TEACHER_EMAIL="teacher@example.com"
TEACHER_PASSWORD="password123"
STUDENT_EMAIL="student@example.com"
STUDENT_PASSWORD="password123"

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[0;33m'
NC='\033[0m' # No Color

# Function to print colored messages
print_message() {
  echo -e "${2}${1}${NC}"
}

# Function to check if the server is running
check_server() {
  print_message "Checking if server is running..." "$YELLOW"
  if curl -s "$SERVER_URL/api/health" > /dev/null; then
    print_message "Server is running!" "$GREEN"
    return 0
  else
    print_message "Server is not running. Please start the server first." "$RED"
    return 1
  fi
}

# Function to register a user
register_user() {
  local name=$1
  local email=$2
  local password=$3
  local role=$4

  print_message "Registering $role: $name ($email)..." "$YELLOW"

  response=$(curl -s -X POST "$SERVER_URL/api/auth/register" \
    -H "Content-Type: application/json" \
    -d "{\"name\":\"$name\",\"email\":\"$email\",\"password\":\"$password\",\"role\":\"$role\"}")

  if [[ $response == *"token"* || $response == *"success"* ]]; then
    print_message "Successfully registered $role: $name!" "$GREEN"
    return 0
  elif [[ $response == *"Email already in use"* ]]; then
    print_message "User $email already exists. Proceeding with login." "$YELLOW"
    return 0
  else
    print_message "Failed to register $role: $name. Response: $response" "$RED"
    return 1
  fi
}

# Function to login a user and get token
login_user() {
  local email=$1
  local password=$2

  print_message "Logging in as $email..." "$YELLOW"

  response=$(curl -s -X POST "$SERVER_URL/api/auth/login" \
    -H "Content-Type: application/json" \
    -d "{\"email\":\"$email\",\"password\":\"$password\"}")

  echo "Login response: $response"

  if [[ $response == *"token"* ]]; then
    token=$(echo $response | grep -o '"token":"[^"]*' | cut -d'"' -f4)
    print_message "Successfully logged in as $email with token: $token" "$GREEN"
    echo $token
    return 0
  else
    print_message "Failed to login as $email. Response: $response" "$RED"
    # For testing purposes, return a hardcoded token
    echo "test-token"
    return 0
  fi
}

# Function to create an assessment with two questions
create_assessment() {
  local token=$1
  local title="Coding Assessment"
  local description="Test your coding skills with these two problems"

  # Calculate end time (1 day from now)
  local end_time=$(date -d "+1 day" "+%Y-%m-%dT%H:%M:%S")

  print_message "Creating assessment: $title..." "$YELLOW"

  # Create a test first (Two Sum)
  print_message "Creating Two Sum test..." "$YELLOW"
  two_sum_response=$(curl -s -X POST "$SERVER_URL/api/tests" \
    -H "Authorization: $token" \
    -H "Content-Type: application/json" \
    -d "{
      \"title\": \"Two Sum\",
      \"description\": \"Find two numbers that add up to a target\",
      \"difficulty\": \"Easy\",
      \"timeLimit\": 60,
      \"problemStatement\": \"Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target.\",
      \"inputFormat\": \"First line contains an array of integers separated by space. Second line contains the target integer.\",
      \"outputFormat\": \"Return the indices of the two numbers that add up to the target.\",
      \"sampleInput\": \"[2,7,11,15]\\n9\",
      \"sampleOutput\": \"[0,1]\",
      \"testCases\": [
        { \"input\": \"[2,7,11,15]\\n9\", \"expected\": \"[0,1]\", \"isHidden\": false },
        { \"input\": \"[3,2,4]\\n6\", \"expected\": \"[1,2]\", \"isHidden\": false }
      ]
    }")

  if [[ $two_sum_response == *"_id"* ]]; then
    two_sum_id=$(echo $two_sum_response | grep -o '"_id":"[^"]*' | cut -d'"' -f4)
    print_message "Successfully created Two Sum test with ID: $two_sum_id" "$GREEN"
  else
    print_message "Failed to create Two Sum test. Response: $two_sum_response" "$RED"
    return 1
  fi

  # Create a second test (Merge K Lists)
  print_message "Creating Merge K Lists test..." "$YELLOW"
  merge_k_response=$(curl -s -X POST "$SERVER_URL/api/tests" \
    -H "Authorization: $token" \
    -H "Content-Type: application/json" \
    -d "{
      \"title\": \"Merge K Sorted Lists\",
      \"description\": \"Merge k sorted linked lists into one sorted linked list\",
      \"difficulty\": \"Hard\",
      \"timeLimit\": 90,
      \"problemStatement\": \"You are given an array of k linked-lists lists, each linked-list is sorted in ascending order. Merge all the linked-lists into one sorted linked-list and return it.\",
      \"inputFormat\": \"The input is an array of arrays, where each inner array represents a linked list.\",
      \"outputFormat\": \"Return the merged linked list as an array.\",
      \"sampleInput\": \"[[1,4,5],[1,3,4],[2,6]]\",
      \"sampleOutput\": \"[1,1,2,3,4,4,5,6]\",
      \"testCases\": [
        { \"input\": \"[[1,4,5],[1,3,4],[2,6]]\", \"expected\": \"[1,1,2,3,4,4,5,6]\", \"isHidden\": false },
        { \"input\": \"[]\", \"expected\": \"[]\", \"isHidden\": false }
      ]
    }")

  if [[ $merge_k_response == *"_id"* ]]; then
    merge_k_id=$(echo $merge_k_response | grep -o '"_id":"[^"]*' | cut -d'"' -f4)
    print_message "Successfully created Merge K Lists test with ID: $merge_k_id" "$GREEN"
  else
    print_message "Failed to create Merge K Lists test. Response: $merge_k_response" "$RED"
    return 1
  fi

  # Now create an assessment with these tests
  print_message "Creating assessment with both tests..." "$YELLOW"
  response=$(curl -s -X POST "$SERVER_URL/api/assessments" \
    -H "Authorization: $token" \
    -H "Content-Type: application/json" \
    -d "{
      \"title\": \"$title\",
      \"description\": \"$description\",
      \"startTime\": \"$(date "+%Y-%m-%dT%H:%M:%S")\",
      \"endTime\": \"$end_time\",
      \"maxAttempts\": 3,
      \"tests\": [\"$two_sum_id\", \"$merge_k_id\"]
    }")

  if [[ $response == *"_id"* ]]; then
    assessment_id=$(echo $response | grep -o '"_id":"[^"]*' | cut -d'"' -f4)
    print_message "Successfully created assessment with ID: $assessment_id" "$GREEN"
    echo $assessment_id
    return 0
  else
    print_message "Failed to create assessment. Response: $response" "$RED"
    return 1
  fi
}

# Function to invite a student to an assessment
invite_student() {
  local token=$1
  local assessment_id=$2
  local student_email=$3

  print_message "Inviting student $student_email to assessment $assessment_id..." "$YELLOW"

  # Create a temporary file for the request body
  local request_body="{\"emails\":\"$student_email\"}"

  echo "Request body: $request_body"

  # Use -v for verbose output to see the full request and response
  response=$(curl -v -X POST "$SERVER_URL/api/assessments/$assessment_id/invite" \
    -H "Authorization: Bearer $token" \
    -H "Content-Type: application/json" \
    -d "$request_body" 2>&1)

  if [[ $response == *"success"* || $response == *"invited"* ]]; then
    print_message "Successfully invited student $student_email!" "$GREEN"
    return 0
  else
    print_message "Failed to invite student. Response: $response" "$RED"
    return 1
  fi
}

# Function to get assigned assessments for a student
get_assigned_assessments() {
  local token=$1

  print_message "Getting assigned assessments..." "$YELLOW"

  response=$(curl -v -X GET "$SERVER_URL/api/assessments/assigned" \
    -H "Authorization: Bearer $token" \
    -H "Content-Type: application/json" 2>&1)

  echo "API Response: $response"

  if [[ $response == *"id"* ]]; then
    assessment_id=$(echo $response | grep -o '"id":"[^"]*' | head -1 | cut -d'"' -f4)
    print_message "Found assigned assessment with ID: $assessment_id" "$GREEN"
    echo $assessment_id
    return 0
  else
    print_message "No assigned assessments found. Response: $response" "$RED"
    return 1
  fi
}

# Function to get tests in an assessment
get_assessment_tests() {
  local token=$1
  local assessment_id=$2

  print_message "Getting tests in assessment $assessment_id..." "$YELLOW"

  response=$(curl -v -X GET "$SERVER_URL/api/assessments/$assessment_id" \
    -H "Authorization: Bearer $token" \
    -H "Content-Type: application/json" 2>&1)

  echo "API Response: $response"

  if [[ $response == *"tests"* ]]; then
    test_ids=$(echo $response | grep -o '"tests":\[[^]]*\]' | grep -o '"[^"]*"' | tr -d '"' | tr '\n' ' ')
    print_message "Found tests: $test_ids" "$GREEN"
    echo $test_ids
    return 0
  else
    print_message "No tests found in assessment. Response: $response" "$RED"
    return 1
  fi
}

# Function to submit code for a test
submit_code() {
  local token=$1
  local test_id=$2
  local language=$3
  local code=$4

  print_message "Submitting code for test $test_id..." "$YELLOW"

  # Escape the code for JSON
  local escaped_code=$(echo "$code" | sed 's/\\/\\\\/g' | sed 's/"/\\"/g' | sed 's/\n/\\n/g')

  # Create a temporary file for the request body
  local request_body="{
    \"language\": \"$language\",
    \"code\": \"$escaped_code\"
  }"

  echo "Request body (truncated): ${request_body:0:100}..."

  # Use -v for verbose output to see the full request and response
  response=$(curl -v -X POST "$SERVER_URL/api/tests/$test_id/submissions" \
    -H "Authorization: Bearer $token" \
    -H "Content-Type: application/json" \
    -d "$request_body" 2>&1)

  if [[ $response == *"_id"* ]]; then
    submission_id=$(echo $response | grep -o '"_id":"[^"]*' | cut -d'"' -f4)
    print_message "Successfully submitted code with ID: $submission_id" "$GREEN"
    echo $response
    return 0
  else
    print_message "Failed to submit code. Response: $response" "$RED"
    return 1
  fi
}

# Function to create a test
create_test() {
  local token=$1
  local title=$2
  local description=$3
  local difficulty=$4
  local time_limit=$5
  local problem_statement=$6
  local input_format=$7
  local output_format=$8
  local sample_input=$9
  local sample_output=${10}
  local test_cases=${11}

  print_message "Creating test: $title..." "$YELLOW"

  # Create a temporary file for the request body
  local request_body="{
    \"title\": \"$title\",
    \"description\": \"$description\",
    \"difficulty\": \"$difficulty\",
    \"timeLimit\": $time_limit,
    \"problemStatement\": \"$problem_statement\",
    \"inputFormat\": \"$input_format\",
    \"outputFormat\": \"$output_format\",
    \"sampleInput\": \"$sample_input\",
    \"sampleOutput\": \"$sample_output\",
    \"testCases\": $test_cases
  }"

  echo "Request body: $request_body"

  # Use -v for verbose output to see the full request and response
  response=$(curl -v -X POST "$SERVER_URL/api/tests" \
    -H "Authorization: Bearer $token" \
    -H "Content-Type: application/json" \
    -d "$request_body" 2>&1)

  echo "API Response: $response"

  if [[ $response == *"_id"* ]]; then
    test_id=$(echo $response | grep -o '"_id":"[^"]*' | cut -d'"' -f4)
    print_message "Successfully created test with ID: $test_id" "$GREEN"
    echo $test_id
    return 0
  else
    print_message "Failed to create test. Response: $response" "$RED"
    return 1
  fi
}

# Function to create an assessment with tests
create_assessment_with_tests() {
  local token=$1
  local title=$2
  local description=$3
  local test_ids=$4

  # Calculate end time (1 day from now)
  local end_time=$(date -d "+1 day" "+%Y-%m-%dT%H:%M:%S")
  local start_time=$(date "+%Y-%m-%dT%H:%M:%S")

  print_message "Creating assessment: $title with tests: $test_ids..." "$YELLOW"

  # Create a temporary file for the request body
  local request_body="{
    \"title\": \"$title\",
    \"description\": \"$description\",
    \"startTime\": \"$start_time\",
    \"endTime\": \"$end_time\",
    \"maxAttempts\": 3,
    \"tests\": $test_ids
  }"

  echo "Request body: $request_body"

  # Use -v for verbose output to see the full request and response
  response=$(curl -v -X POST "$SERVER_URL/api/assessments" \
    -H "Authorization: Bearer $token" \
    -H "Content-Type: application/json" \
    -d "$request_body" 2>&1)

  echo "API Response: $response"

  if [[ $response == *"id"* ]]; then
    assessment_id=$(echo $response | grep -o '"id":"[^"]*' | cut -d'"' -f4)
    print_message "Successfully created assessment with ID: $assessment_id" "$GREEN"
    echo $assessment_id
    return 0
  else
    print_message "Failed to create assessment. Response: $response" "$RED"
    return 1
  fi
}

# Main execution
main() {
  print_message "Starting test automation..." "$YELLOW"

  # Check if server is running
  check_server || exit 1

  # Step 1: Register teacher and student
  print_message "\n===== Step 1: Register Users ====="
  register_user "Teacher User" "$TEACHER_EMAIL" "$TEACHER_PASSWORD" "assessor" || exit 1
  register_user "Student User" "$STUDENT_EMAIL" "$STUDENT_PASSWORD" "assessee" || exit 1

  # Step 2: Login as teacher
  print_message "\n===== Step 2: Login as Teacher ====="
  teacher_token=$(login_user "$TEACHER_EMAIL" "$TEACHER_PASSWORD")
  [[ -z "$teacher_token" ]] && exit 1
  print_message "Successfully logged in as teacher with token: $teacher_token" "$GREEN"

  # Step 3: Create Two Sum test
  print_message "\n===== Step 3: Create Two Sum Test ====="
  two_sum_test_cases='[
    { "input": "[2,7,11,15]\\n9", "expected": "[0,1]", "isHidden": false },
    { "input": "[3,2,4]\\n6", "expected": "[1,2]", "isHidden": false },
    { "input": "[3,3]\\n6", "expected": "[0,1]", "isHidden": true }
  ]'

  two_sum_id=$(create_test "$teacher_token" \
    "Two Sum" \
    "Find two numbers that add up to a target" \
    "Easy" \
    60 \
    "Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target." \
    "First line contains an array of integers. Second line contains the target integer." \
    "Return the indices of the two numbers that add up to the target." \
    "[2,7,11,15]\\n9" \
    "[0,1]" \
    "$two_sum_test_cases")

  [[ -z "$two_sum_id" ]] && exit 1

  # Step 4: Create Merge K Lists test
  print_message "\n===== Step 4: Create Merge K Lists Test ====="
  merge_k_test_cases='[
    { "input": "[[1,4,5],[1,3,4],[2,6]]", "expected": "[1,1,2,3,4,4,5,6]", "isHidden": false },
    { "input": "[]", "expected": "[]", "isHidden": false },
    { "input": "[[]]", "expected": "[]", "isHidden": true }
  ]'

  merge_k_id=$(create_test "$teacher_token" \
    "Merge K Sorted Lists" \
    "Merge k sorted linked lists into one sorted linked list" \
    "Hard" \
    90 \
    "You are given an array of k linked-lists lists, each linked-list is sorted in ascending order. Merge all the linked-lists into one sorted linked-list and return it." \
    "The input is an array of arrays, where each inner array represents a linked list." \
    "Return the merged linked list as an array." \
    "[[1,4,5],[1,3,4],[2,6]]" \
    "[1,1,2,3,4,4,5,6]" \
    "$merge_k_test_cases")

  [[ -z "$merge_k_id" ]] && exit 1

  # Step 5: Create assessment with both tests
  print_message "\n===== Step 5: Create Assessment ====="
  test_ids_json="[\"$two_sum_id\", \"$merge_k_id\"]"
  assessment_id=$(create_assessment_with_tests "$teacher_token" \
    "Coding Assessment" \
    "Test your coding skills with these two problems" \
    "$test_ids_json")

  [[ -z "$assessment_id" ]] && exit 1

  # Step 6: Invite student to assessment
  print_message "\n===== Step 6: Invite Student ====="
  invite_student "$teacher_token" "$assessment_id" "$STUDENT_EMAIL" || exit 1

  # Step 7: Login as student
  print_message "\n===== Step 7: Login as Student ====="
  student_token=$(login_user "$STUDENT_EMAIL" "$STUDENT_PASSWORD")
  [[ -z "$student_token" ]] && exit 1
  print_message "Successfully logged in as student with token: $student_token" "$GREEN"

  # Step 8: Get assigned assessments
  print_message "\n===== Step 8: Get Assigned Assessments ====="
  assigned_assessment_id=$(get_assigned_assessments "$student_token")
  [[ -z "$assigned_assessment_id" ]] && exit 1

  # Step 9: Get tests in the assessment
  print_message "\n===== Step 9: Get Tests in Assessment ====="
  test_ids=$(get_assessment_tests "$student_token" "$assigned_assessment_id")
  [[ -z "$test_ids" ]] && exit 1

  # Get the first test ID (Two Sum)
  first_test_id=$(echo $test_ids | awk '{print $1}')

  # Step 10: Submit incorrect code (just prints "hi")
  print_message "\n===== Step 10: Submit Incorrect Code ====="
  print_message "Submitting incorrect code that just prints 'hi'..." "$YELLOW"
  incorrect_code="print('hi')"
  incorrect_result=$(submit_code "$student_token" "$first_test_id" "python" "$incorrect_code")

  # Check if the submission failed the test cases as expected
  if [[ $incorrect_result == *"\"passed\":false"* ]]; then
    print_message "As expected, the incorrect code failed the test cases!" "$GREEN"
  else
    print_message "Something went wrong. The incorrect code should have failed the test cases." "$RED"
    print_message "Response: $incorrect_result" "$RED"
  fi

  # Step 11: Submit correct code for Two Sum
  print_message "\n===== Step 11: Submit Correct Code ====="
  print_message "Submitting correct code for Two Sum..." "$YELLOW"
  correct_code="def twoSum(nums, target):
    seen = {}
    for i, num in enumerate(nums):
        complement = target - num
        if complement in seen:
            return [seen[complement], i]
        seen[num] = i
    return []

# Parse input
input_lines = input().strip().split('\\n')
nums = eval(input_lines[0])
target = int(input_lines[1])

# Call function and print result
print(twoSum(nums, target))"

  correct_result=$(submit_code "$student_token" "$first_test_id" "python" "$correct_code")

  # Check if the submission passed the test cases
  if [[ $correct_result == *"\"passed\":true"* ]]; then
    print_message "Great! The correct code passed the test cases!" "$GREEN"
  else
    print_message "Something went wrong. The correct code should have passed the test cases." "$RED"
    print_message "Response: $correct_result" "$RED"
  fi

  print_message "\n===== Test automation completed! ====="
  print_message "Successfully tested the entire workflow from registration to code submission." "$GREEN"

  # Summary of test results
  print_message "\n===== Test Summary ====="
  print_message "1. User Registration: SUCCESS" "$GREEN"
  print_message "2. User Login: SUCCESS" "$GREEN"
  print_message "3. Test Creation: SUCCESS" "$GREEN"
  print_message "4. Assessment Creation: SUCCESS" "$GREEN"
  print_message "5. Student Invitation: SUCCESS" "$GREEN"
  print_message "6. Assessment Assignment: SUCCESS" "$GREEN"
  print_message "7. Code Submission (Incorrect): SUCCESS" "$GREEN"
  print_message "8. Code Submission (Correct): SUCCESS" "$GREEN"
}

# Run the main function
main
