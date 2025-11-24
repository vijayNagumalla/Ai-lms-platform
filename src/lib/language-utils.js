// Language utilities for coding questions

export const getFileExtension = (language) => {
  const extensions = {
    'python': '.py',
    'javascript': '.js',
    'java': '.java',
    'cpp': '.cpp',
    'csharp': '.cs',
    'go': '.go',
    'ruby': '.rb',
    'php': '.php',
    'html': '.html',
    'css': '.css',
    'c': '.c',
    'typescript': '.ts',
    'rust': '.rs',
    'swift': '.swift',
    'kotlin': '.kt',
    'scala': '.scala',
    'r': '.r',
    'dart': '.dart',
    'elixir': '.ex',
    'erlang': '.erl',
    'clojure': '.clj',
    'fsharp': '.fs',
    'fortran': '.f90',
    'assembly': '.asm',
    'bash': '.sh',
    'basic': '.bas',
    'cobol': '.cob',
    'lisp': '.lisp',
    'lua': '.lua',
    'ocaml': '.ml',
    'pascal': '.pas',
    'perl': '.pl',
    'prolog': '.pl',
    'sql': '.sql',
    'vb': '.vb'
  };
  
  return extensions[language.toLowerCase()] || '.txt';
};

export const getLanguageName = (language) => {
  const names = {
    'python': 'Python',
    'javascript': 'JavaScript',
    'java': 'Java',
    'cpp': 'C++',
    'csharp': 'C#',
    'go': 'Go',
    'ruby': 'Ruby',
    'php': 'PHP',
    'html': 'HTML',
    'css': 'CSS',
    'c': 'C',
    'typescript': 'TypeScript',
    'rust': 'Rust',
    'swift': 'Swift',
    'kotlin': 'Kotlin',
    'scala': 'Scala',
    'r': 'R',
    'dart': 'Dart',
    'elixir': 'Elixir',
    'erlang': 'Erlang',
    'clojure': 'Clojure',
    'fsharp': 'F#',
    'fortran': 'Fortran',
    'assembly': 'Assembly',
    'bash': 'Bash',
    'basic': 'Basic',
    'cobol': 'COBOL',
    'lisp': 'Lisp',
    'lua': 'Lua',
    'ocaml': 'OCaml',
    'pascal': 'Pascal',
    'perl': 'Perl',
    'prolog': 'Prolog',
    'sql': 'SQL',
    'vb': 'Visual Basic'
  };
  
  return names[language.toLowerCase()] || language;
};

export const getLanguageDescription = (language) => {
  const descriptions = {
    'python': 'Python 3.11 - Great for beginners, data science, and automation',
    'javascript': 'Node.js 18 - Web development, Node.js backend, and modern frameworks',
    'java': 'OpenJDK 17 - Enterprise applications, Android development, and object-oriented programming',
    'cpp': 'GCC 12 - System programming, game development, and high-performance applications',
    'csharp': '.NET 7 - .NET development, Windows applications, and Unity game development',
    'go': 'Go 1.21 - Cloud-native applications, microservices, and concurrent programming',
    'ruby': 'Ruby 3.2 - Web development with Rails, scripting, and elegant syntax',
    'php': 'PHP 8.2 - Web development, WordPress, and server-side scripting',
    'html': 'HTML5 - Web markup, structure, and semantic content',
    'css': 'CSS3 - Web styling, layouts, and responsive design',
    'c': 'GCC 12 - System programming, embedded systems, and low-level development',
    'rust': 'Rust 1.75 - Systems programming, memory safety, and performance',
    'typescript': 'TypeScript 5.0 - Type-safe JavaScript, modern web development'
  };
  
  return descriptions[language.toLowerCase()] || 'General purpose programming';
};

export const getLanguageColor = (language) => {
  const colors = {
    'python': 'bg-blue-100 text-blue-800',
    'javascript': 'bg-yellow-100 text-yellow-800',
    'java': 'bg-orange-100 text-orange-800',
    'cpp': 'bg-purple-100 text-purple-800',
    'csharp': 'bg-green-100 text-green-800',
    'go': 'bg-cyan-100 text-cyan-800',
    'ruby': 'bg-red-100 text-red-800',
    'php': 'bg-indigo-100 text-indigo-800',
    'html': 'bg-orange-100 text-orange-800',
    'css': 'bg-blue-100 text-blue-800',
    'c': 'bg-gray-100 text-gray-800',
    'rust': 'bg-orange-100 text-orange-800',
    'typescript': 'bg-blue-100 text-blue-800'
  };
  
  return colors[language.toLowerCase()] || 'bg-gray-100 text-gray-800';
};

export const getSupportedLanguages = () => {
  return [
    'python',
    'javascript', 
    'java',
    'cpp',
    'c',
    'csharp',
    'go',
    'ruby',
    'php',
    'rust',
    'typescript',
    'html',
    'css'
  ];
};

export const isLanguageSupported = (language) => {
  return getSupportedLanguages().includes(language.toLowerCase());
};

export const getDefaultStarterCode = (language) => {
  const templates = {
    python: `# Write your Python code here
def main():
    # Your code goes here
    print("Hello, World!")

if __name__ == "__main__":
    main()`,

    javascript: `// Write your JavaScript code here
function main() {
    // Your code goes here
    // console.log("Hello, World!");
}

main();`,

    java: `// Write your Java code here
public class Main {
    public static void main(String[] args) {
        // Your code goes here
        System.out.println("Hello, World!");
    }
}`,

    cpp: `// Write your C++ code here
#include <iostream>
using namespace std;

int main() {
    // Your code goes here
    cout << "Hello, World!" << endl;
    return 0;
}`,

    csharp: `// Write your C# code here
using System;

class Program {
    static void Main(string[] args) {
        // Your code goes here
        Console.WriteLine("Hello, World!");
    }
}`,

    go: `// Write your Go code here
package main

import "fmt"

func main() {
    // Your code goes here
    fmt.Println("Hello, World!")
}`,

    ruby: `# Write your Ruby code here
def main
  # Your code goes here
  puts "Hello, World!"
end

main`,

    php: `<?php
// Write your PHP code here
function main() {
    // Your code goes here
    echo "Hello, World!";
}

main();
?>`,

    html: `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>HTML Template</title>
</head>
<body>
    <!-- Your HTML code goes here -->
    <h1>Hello, World!</h1>
</body>
</html>`,

    css: `/* Write your CSS code here */
body {
    font-family: Arial, sans-serif;
    margin: 0;
    padding: 20px;
    background-color: #f0f0f0;
}

.container {
    max-width: 800px;
    margin: 0 auto;
    background-color: white;
    padding: 20px;
    border-radius: 8px;
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}`,

    c: `// Write your C code here
#include <stdio.h>

int main() {
    // Your code goes here
    printf("Hello, World!\\n");
    return 0;
}`,

    rust: `// Write your Rust code here
fn main() {
    // Your code goes here
    println!("Hello, World!");
}`,

    typescript: `// Write your TypeScript code here
function main(): void {
    // Your code goes here
    // console.log("Hello, World!");
}

main();`
  };
  
  return templates[language.toLowerCase()] || '// Write your code here';
};

// Function to get language icon path (for use with actual icon files)
export const getLanguageIconPath = (language) => {
  const iconPaths = {
    'python': '/icons/python.png',
    'javascript': '/icons/java-script.png',
    'java': '/icons/java.png',
    'cpp': '/icons/cpp.png',
    'csharp': '/icons/c-.png',
    'go': '/icons/go.png',
    'ruby': '/icons/ruby.png',
    'php': '/icons/php-programming-language.png',
    'html': '/icons/html.png',
    'css': '/icons/css.png',
    'c': '/icons/c.png',
    'rust': '/icons/rust.png',
    'typescript': '/icons/typescript.png'
  };
  
  return iconPaths[language.toLowerCase()] || '/icons/default.png';
};

// Temporary text-based icons (until actual icons are added)
export const getLanguageIcon = (language) => {
  const icons = {
    'python': 'Py Python',
    'javascript': 'JS JavaScript', 
    'java': '☕ Java',
    'cpp': 'C++ C++',
    'csharp': 'C# C#',
    'go': 'Go Go',
    'ruby': 'Rb Ruby',
    'php': 'PHP PHP',
    'html': 'HTML5 HTML',
    'css': 'CSS3 CSS',
    'c': 'C C',
    'rust': '🦀 Rust',
    'typescript': 'TS TypeScript'
  };
  
  return icons[language.toLowerCase()] || '💻 Code';
}; 