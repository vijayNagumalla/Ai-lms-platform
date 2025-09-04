import React, { useRef, useEffect } from 'react';
import Editor from '@monaco-editor/react';

const CodeEditor = ({
  value = '',
  onChange,
  language = 'javascript',
  theme = 'vs-dark',
  height = '400px',
  width = '100%',
  readOnly = false,
  options = {},
  onMount,
  ...props
}) => {
  // Ensure value is always a string for Monaco Editor
  const normalizedValue = typeof value === 'string' ? value : 
    (value && typeof value === 'object' && value.code ? value.code : '');
  
  // Extract language from answer object if it's an object
  const normalizedLanguage = typeof value === 'object' && value.language ? value.language : language;
  
  const editorRef = useRef(null);

  const handleEditorDidMount = (editor, monaco) => {
    editorRef.current = editor;
    
    // Configure editor options
    editor.updateOptions({
      minimap: { enabled: false },
      fontSize: 14,
      fontFamily: 'Consolas, "Courier New", monospace',
      lineNumbers: 'on',
      roundedSelection: false,
      scrollBeyondLastLine: false,
      automaticLayout: true,
      wordWrap: 'on',
      ...options
    });

    if (onMount) {
      onMount(editor, monaco);
    }
  };

  const handleEditorChange = (value, event) => {
    if (onChange) {
      onChange(value, event);
    }
  };

  // Language-specific configurations
  const getLanguageConfig = (lang) => {
    const configs = {
      python: {
        tabSize: 4,
        insertSpaces: true,
        detectIndentation: true
      },
      javascript: {
        tabSize: 2,
        insertSpaces: true,
        detectIndentation: true
      },
      java: {
        tabSize: 4,
        insertSpaces: true,
        detectIndentation: true
      },
      cpp: {
        tabSize: 4,
        insertSpaces: true,
        detectIndentation: true
      },
      csharp: {
        tabSize: 4,
        insertSpaces: true,
        detectIndentation: true
      },
      go: {
        tabSize: 4,
        insertSpaces: true,
        detectIndentation: true
      },
      ruby: {
        tabSize: 2,
        insertSpaces: true,
        detectIndentation: true
      },
      php: {
        tabSize: 4,
        insertSpaces: true,
        detectIndentation: true
      },
      html: {
        tabSize: 2,
        insertSpaces: true,
        detectIndentation: true
      },
      css: {
        tabSize: 2,
        insertSpaces: true,
        detectIndentation: true
      }
    };

    return configs[lang] || configs.javascript;
  };

  return (
    <div className="code-editor-container" {...props}>
      <Editor
        height={height}
        width={width}
        language={normalizedLanguage}
        theme={theme}
        value={normalizedValue}
        onChange={handleEditorChange}
        onMount={handleEditorDidMount}
        options={{
          ...getLanguageConfig(normalizedLanguage),
          readOnly,
          ...options
        }}
        loading={
          <div className="flex items-center justify-center h-full">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <span className="ml-2 text-muted-foreground">Loading editor...</span>
          </div>
        }
      />
    </div>
  );
};

export default CodeEditor; 