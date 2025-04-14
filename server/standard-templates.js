// Standard code templates for all problems
const standardTemplates = {
  python: `# Read input from stdin and solve the problem
# Example:
# n = int(input())
# arr = list(map(int, input().split()))

def solve():
    # Your solution here
    pass

if __name__ == "__main__":
    # Call the solve function
    solve()`,

  cpp: `#include <iostream>
#include <vector>
#include <string>
#include <algorithm>
using namespace std;

// Main solution function
void solve() {
    // Your solution here
    // Example:
    // int n;
    // cin >> n;
    // vector<int> arr(n);
    // for(int i = 0; i < n; i++) {
    //     cin >> arr[i];
    // }
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
