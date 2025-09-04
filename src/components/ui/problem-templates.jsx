import React from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { BookOpen, Code, Calculator, Search } from 'lucide-react';

const problemTemplates = [
  {
    id: 'simple-addition',
    title: 'Simple Addition',
    description: 'Add two numbers read from input. This problem can be solved in multiple programming languages.',
    difficulty: 'easy',
    tags: 'math, input-output, multi-language',
    preset_codes: {
      54: `# Python 3 - Read two integers from input and print their sum
a = int(input())
b = int(input())
print(a + b)`,
      62: `// Java - Read two integers from input and print their sum
import java.util.Scanner;

public class Main {
    public static void main(String[] args) {
        Scanner scanner = new Scanner(System.in);
        int a = scanner.nextInt();
        int b = scanner.nextInt();
        System.out.println(a + b);
        scanner.close();
    }
}`,
      50: `// C++ - Read two integers from input and print their sum
#include <iostream>
using namespace std;

int main() {
    int a, b;
    cin >> a >> b;
    cout << a + b << endl;
    return 0;
}`,
      63: `// JavaScript - Read two integers from input and print their sum
const readline = require('readline');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

let lines = [];
rl.on('line', (line) => {
    lines.push(line);
    if (lines.length === 2) {
        const a = parseInt(lines[0]);
        const b = parseInt(lines[1]);
        console.log(a + b);
        rl.close();
    }
});`,
      51: `// C# - Read two integers from input and print their sum
using System;

class Program {
    static void Main(string[] args) {
        int a = int.Parse(Console.ReadLine());
        int b = int.Parse(Console.ReadLine());
        Console.WriteLine(a + b);
    }
}`,
      60: `// Go - Read two integers from input and print their sum
package main

import "fmt"

func main() {
    var a, b int
    fmt.Scan(&a, &b)
    fmt.Println(a + b)
}`
    },
    test_cases: [
      { input: '10\n20', output: '30' },
      { input: '5\n15', output: '20' },
      { input: '100\n200', output: '300' }
    ]
  },
  {
    id: 'two-sum',
    title: 'Two Sum',
    description: 'Find two numbers in an array that add up to a target value. Solve this classic problem in your preferred language.',
    difficulty: 'easy',
    tags: 'arrays, hash-table, multi-language',
    preset_codes: {
      54: `# Python 3 - Find two numbers that add up to target
def twoSum(nums, target):
    # Your code here
    # Return indices of two numbers that add up to target
    # Example: nums = [2,7,11,15], target = 9 -> return [0,1]
    pass`,
      62: `// Java - Find two numbers that add up to target
import java.util.*;

class Solution {
    public int[] twoSum(int[] nums, int target) {
        // Your code here
        // Return indices of two numbers that add up to target
        // Example: nums = [2,7,11,15], target = 9 -> return [0,1]
        return new int[]{};
    }
}`,
      50: `// C++ - Find two numbers that add up to target
#include <vector>
#include <unordered_map>
using namespace std;

class Solution {
public:
    vector<int> twoSum(vector<int>& nums, int target) {
        // Your code here
        // Return indices of two numbers that add up to target
        // Example: nums = [2,7,11,15], target = 9 -> return [0,1]
        return {};
    }
};`,
      63: `// JavaScript - Find two numbers that add up to target
/**
 * @param {number[]} nums
 * @param {number} target
 * @return {number[]}
 */
var twoSum = function(nums, target) {
    // Your code here
    // Return indices of two numbers that add up to target
    // Example: nums = [2,7,11,15], target = 9 -> return [0,1]
};`,
      51: `// C# - Find two numbers that add up to target
using System;

public class Solution {
    public int[] TwoSum(int[] nums, int target) {
  // Your code here
  // Return indices of two numbers that add up to target
        // Example: nums = [2,7,11,15], target = 9 -> return [0,1]
        return new int[]{};
    }
}`,
      60: `// Go - Find two numbers that add up to target
func twoSum(nums []int, target int) []int {
    // Your code here
    // Return indices of two numbers that add up to target
    // Example: nums = [2,7,11,15], target = 9 -> return [0,1]
    return []int{}
}`
    },
    test_cases: [
      { input: '[2,7,11,15], 9', output: '[0,1]' },
      { input: '[3,2,4], 6', output: '[1,2]' },
      { input: '[3,3], 6', output: '[0,1]' }
    ]
  },
  {
    id: 'palindrome-number',
    title: 'Palindrome Number',
    description: 'Determine if a number is a palindrome. This problem can be solved using string manipulation or mathematical operations.',
    difficulty: 'easy',
    tags: 'math, palindrome, multi-language',
    preset_codes: {
      54: `# Python 3 - Check if number is palindrome
def isPalindrome(x):
    # Your code here
    # Return true if x is a palindrome, false otherwise
    # Example: 121 -> True, -121 -> False, 10 -> False
    pass`,
      62: `// Java - Check if number is palindrome
class Solution {
    public boolean isPalindrome(int x) {
        // Your code here
        // Return true if x is a palindrome, false otherwise
        // Example: 121 -> true, -121 -> false, 10 -> false
        return false;
    }
}`,
      50: `// C++ - Check if number is palindrome
class Solution {
public:
    bool isPalindrome(int x) {
        // Your code here
        // Return true if x is a palindrome, false otherwise
        // Example: 121 -> true, -121 -> false, 10 -> false
        return false;
    }
};`,
      63: `// JavaScript - Check if number is palindrome
/**
 * @param {number} x
 * @return {boolean}
 */
var isPalindrome = function(x) {
    // Your code here
    // Return true if x is a palindrome, false otherwise
    // Example: 121 -> true, -121 -> false, 10 -> false
};`,
      51: `// C# - Check if number is palindrome
public class Solution {
    public bool IsPalindrome(int x) {
  // Your code here
  // Return true if x is a palindrome, false otherwise
        // Example: 121 -> true, -121 -> false, 10 -> false
        return false;
    }
}`,
      60: `// Go - Check if number is palindrome
func isPalindrome(x int) bool {
    // Your code here
    // Return true if x is a palindrome, false otherwise
    // Example: 121 -> true, -121 -> false, 10 -> false
    return false
}`
    },
    test_cases: [
      { input: '121', output: 'true' },
      { input: '-121', output: 'false' },
      { input: '10', output: 'false' }
    ]
  },
  {
    id: 'fibonacci',
    title: 'Fibonacci Number',
    description: 'Calculate the nth Fibonacci number. Implement this using recursion, iteration, or dynamic programming.',
    difficulty: 'easy',
    tags: 'math, dynamic-programming, multi-language',
    preset_codes: {
      54: `# Python 3 - Calculate nth Fibonacci number
def fib(n):
    # Your code here
    # Return the nth Fibonacci number
    # Example: fib(2) = 1, fib(3) = 2, fib(4) = 3
    pass`,
      62: `// Java - Calculate nth Fibonacci number
class Solution {
    public int fib(int n) {
        // Your code here
        // Return the nth Fibonacci number
        // Example: fib(2) = 1, fib(3) = 2, fib(4) = 3
        return 0;
    }
}`,
      50: `// C++ - Calculate nth Fibonacci number
class Solution {
public:
    int fib(int n) {
        // Your code here
        // Return the nth Fibonacci number
        // Example: fib(2) = 1, fib(3) = 2, fib(4) = 3
        return 0;
    }
};`,
      63: `// JavaScript - Calculate nth Fibonacci number
/**
 * @param {number} n
 * @return {number}
 */
var fib = function(n) {
    // Your code here
    // Return the nth Fibonacci number
    // Example: fib(2) = 1, fib(3) = 2, fib(4) = 3
};`,
      51: `// C# - Calculate nth Fibonacci number
public class Solution {
    public int Fib(int n) {
  // Your code here
  // Return the nth Fibonacci number
        // Example: fib(2) = 1, fib(3) = 2, fib(4) = 3
        return 0;
    }
}`,
      60: `// Go - Calculate nth Fibonacci number
func fib(n int) int {
    // Your code here
    // Return the nth Fibonacci number
    // Example: fib(2) = 1, fib(3) = 2, fib(4) = 3
    return 0
}`
    },
    test_cases: [
      { input: '2', output: '1' },
      { input: '3', output: '2' },
      { input: '4', output: '3' }
    ]
  },
  {
    id: 'reverse-string',
    title: 'Reverse String',
    description: 'Reverse a string in-place. This problem tests your understanding of string manipulation and two-pointer technique.',
    difficulty: 'easy',
    tags: 'strings, two-pointers, multi-language',
    preset_codes: {
      54: `# Python 3 - Reverse string in-place
def reverseString(s):
    # Your code here
    # Reverse the string in-place
    # Example: ["h","e","l","l","o"] -> ["o","l","l","e","h"]
    pass`,
      62: `// Java - Reverse string in-place
class Solution {
    public void reverseString(char[] s) {
        // Your code here
        // Reverse the string in-place
        // Example: ["h","e","l","l","o"] -> ["o","l","l","e","h"]
    }
}`,
      50: `// C++ - Reverse string in-place
class Solution {
public:
    void reverseString(vector<char>& s) {
        // Your code here
        // Reverse the string in-place
        // Example: ["h","e","l","l","o"] -> ["o","l","l","e","h"]
    }
};`,
      63: `// JavaScript - Reverse string in-place
/**
 * @param {character[]} s
 * @return {void} Do not return anything, modify s in-place instead.
 */
var reverseString = function(s) {
    // Your code here
    // Reverse the string in-place
    // Example: ["h","e","l","l","o"] -> ["o","l","l","e","h"]
};`,
      51: `// C# - Reverse string in-place
public class Solution {
    public void ReverseString(char[] s) {
  // Your code here
  // Reverse the string in-place
        // Example: ["h","e","l","l","o"] -> ["o","l","l","e","h"]
    }
}`,
      60: `// Go - Reverse string in-place
func reverseString(s []byte) {
    // Your code here
    // Reverse the string in-place
    // Example: ["h","e","l","l","o"] -> ["o","l","l","e","h"]
}`
    },
    test_cases: [
      { input: '["h","e","l","l","o"]', output: '["o","l","l","e","h"]' },
      { input: '["H","a","n","n","a","h"]', output: '["h","a","n","n","a","H"]' }
    ]
  },
  {
    id: 'binary-search',
    title: 'Binary Search',
    description: 'Find target in a sorted array using binary search. This is a fundamental algorithm every programmer should know.',
    difficulty: 'medium',
    tags: 'binary-search, arrays, multi-language',
    preset_codes: {
      54: `# Python 3 - Binary search in sorted array
def search(nums, target):
    # Your code here
    # Return index of target, or -1 if not found
    # Example: nums = [-1,0,3,5,9,12], target = 9 -> return 4
    pass`,
      62: `// Java - Binary search in sorted array
class Solution {
    public int search(int[] nums, int target) {
        // Your code here
        // Return index of target, or -1 if not found
        // Example: nums = [-1,0,3,5,9,12], target = 9 -> return 4
        return -1;
    }
}`,
      50: `// C++ - Binary search in sorted array
class Solution {
public:
    int search(vector<int>& nums, int target) {
        // Your code here
        // Return index of target, or -1 if not found
        // Example: nums = [-1,0,3,5,9,12], target = 9 -> return 4
        return -1;
    }
};`,
      63: `// JavaScript - Binary search in sorted array
/**
 * @param {number[]} nums
 * @param {number} target
 * @return {number}
 */
var search = function(nums, target) {
    // Your code here
    // Return index of target, or -1 if not found
    // Example: nums = [-1,0,3,5,9,12], target = 9 -> return 4
};`,
      51: `// C# - Binary search in sorted array
public class Solution {
    public int Search(int[] nums, int target) {
  // Your code here
  // Return index of target, or -1 if not found
        // Example: nums = [-1,0,3,5,9,12], target = 9 -> return 4
        return -1;
    }
}`,
      60: `// Go - Binary search in sorted array
func search(nums []int, target int) int {
    // Your code here
    // Return index of target, or -1 if not found
    // Example: nums = [-1,0,3,5,9,12], target = 9 -> return 4
    return -1
}`
    },
    test_cases: [
      { input: '[-1,0,3,5,9,12], 9', output: '4' },
      { input: '[-1,0,3,5,9,12], 2', output: '-1' }
    ]
  }
];

const ProblemTemplates = ({ onSelectTemplate }) => {
  const [isOpen, setIsOpen] = React.useState(false);

  const handleSelectTemplate = (template) => {
    onSelectTemplate(template);
    setIsOpen(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button type="button" variant="outline" size="sm">
          <BookOpen className="mr-2 h-4 w-4" />
          Use Template
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Multi-Language Problem Templates</DialogTitle>
          <DialogDescription>
            Choose from pre-built coding problem templates with starter code in multiple programming languages.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          {problemTemplates.map((template) => (
            <div key={template.id} className="border rounded-lg p-4 hover:bg-muted/50">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="font-semibold text-lg">{template.title}</h3>
                  <p className="text-sm text-muted-foreground mt-1">{template.description}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      template.difficulty === 'easy' ? 'bg-green-100 text-green-800' :
                      template.difficulty === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {template.difficulty}
                    </span>
                    <span className="text-xs text-muted-foreground">{template.tags}</span>
                    <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                      Multi-Language
                    </span>
                  </div>
                  <div className="mt-2 text-xs text-muted-foreground">
                    Supports: Python, Java, C++, JavaScript, C#, Go
                  </div>
                </div>
                <Button 
                  type="button"
                  size="sm" 
                  onClick={() => handleSelectTemplate(template)}
                  className="ml-4"
                >
                  Use Template
                </Button>
              </div>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ProblemTemplates; 