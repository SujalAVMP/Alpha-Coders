// Standard code templates for all problems
const standardTemplates = {
  python: `# Read input from stdin and solve the problem
# Example for array input:
# n = int(input())  # Number of elements
# arr = list(map(int, input().split()))  # Array elements

def solve():
    # Your solution here
    # For boolean output, use True/False (Python capitalization)
    # Example: return True
    pass

if __name__ == "__main__":
    # Call the solve function
    result = solve()

    # Print the result
    # For boolean values, Python uses True/False (capitalized)
    if isinstance(result, bool):
        print(str(result).lower())  # Convert to lowercase for consistency
    else:
        print(result)`,

  cpp: `#include <iostream>
#include <vector>
#include <string>
#include <algorithm>
using namespace std;

// Main solution function
// For boolean return values, C++ uses true/false (lowercase)
void solve() {
    // Your solution here
    // Example for array input:
    // int n;
    // cin >> n;  // Number of elements
    // vector<int> arr(n);
    // for(int i = 0; i < n; i++) {
    //     cin >> arr[i];  // Array elements
    // }

    // For boolean output, use true/false (C++ lowercase)
    // Example: cout << (isValid ? "true" : "false") << endl;
}

int main() {
    ios_base::sync_with_stdio(false);
    cin.tie(NULL);

    // Call the solve function
    solve();

    return 0;
}`
};

module.exports = standardTemplates;
