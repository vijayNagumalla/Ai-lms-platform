import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { 
  Code, 
  FileCode, 
  Coffee, 
  Zap, 
  Database, 
  Globe, 
  Palette,
  FileText
} from 'lucide-react';

const LanguageSelector = ({ 
  value, 
  onValueChange, 
  disabled = false,
  showDescription = false 
}) => {
  const languages = [
    {
      value: 'python',
      label: 'Python',
      icon: <Code className="h-4 w-4" />,
      description: 'Python 3.8.1',
      color: 'bg-blue-100 text-blue-800'
    },
    {
      value: 'javascript',
      label: 'JavaScript',
      icon: <FileCode className="h-4 w-4" />,
      description: 'Node.js 12.14.0',
      color: 'bg-yellow-100 text-yellow-800'
    },
    {
      value: 'java',
      label: 'Java',
      icon: <Coffee className="h-4 w-4" />,
      description: 'OpenJDK 13.0.1',
      color: 'bg-orange-100 text-orange-800'
    },
    {
      value: 'cpp',
      label: 'C++',
      icon: <Zap className="h-4 w-4" />,
      description: 'GCC 9.2.0',
      color: 'bg-purple-100 text-purple-800'
    },
    {
      value: 'csharp',
      label: 'C#',
      icon: <Database className="h-4 w-4" />,
      description: 'Mono 6.6.0.161',
      color: 'bg-green-100 text-green-800'
    },
    {
      value: 'go',
      label: 'Go',
      icon: <Code className="h-4 w-4" />,
      description: 'Go 1.13.5',
      color: 'bg-cyan-100 text-cyan-800'
    },
    {
      value: 'ruby',
      label: 'Ruby',
      icon: <FileText className="h-4 w-4" />,
      description: 'Ruby 2.7.0',
      color: 'bg-red-100 text-red-800'
    },
    {
      value: 'php',
      label: 'PHP',
      icon: <Code className="h-4 w-4" />,
      description: 'PHP 7.4.1',
      color: 'bg-indigo-100 text-indigo-800'
    },
    {
      value: 'html',
      label: 'HTML',
      icon: <Globe className="h-4 w-4" />,
      description: 'HTML5',
      color: 'bg-orange-100 text-orange-800'
    },
    {
      value: 'css',
      label: 'CSS',
      icon: <Palette className="h-4 w-4" />,
      description: 'CSS3',
      color: 'bg-blue-100 text-blue-800'
    }
  ];

  const selectedLanguage = languages.find(lang => lang.value === value);

  return (
    <div className="space-y-2">
      <Select value={value} onValueChange={onValueChange} disabled={disabled}>
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Select programming language">
            {selectedLanguage && (
              <div className="flex items-center space-x-2">
                {selectedLanguage.icon}
                <span>{selectedLanguage.label}</span>
                <Badge className={`text-xs ${selectedLanguage.color}`}>
                  {selectedLanguage.description}
                </Badge>
              </div>
            )}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {languages.map((language) => (
            <SelectItem key={language.value} value={language.value}>
              <div className="flex items-center space-x-2">
                {language.icon}
                <span>{language.label}</span>
                <Badge className={`text-xs ${language.color}`}>
                  {language.description}
                </Badge>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      
      {showDescription && selectedLanguage && (
        <p className="text-sm text-muted-foreground">
          {selectedLanguage.description} - {getLanguageFeatures(selectedLanguage.value)}
        </p>
      )}
    </div>
  );
};

const getLanguageFeatures = (language) => {
  const features = {
    python: 'Great for beginners, data science, and automation',
    javascript: 'Web development, Node.js backend, and modern frameworks',
    java: 'Enterprise applications, Android development, and object-oriented programming',
    cpp: 'System programming, game development, and high-performance applications',
    csharp: '.NET development, Windows applications, and Unity game development',
    go: 'Cloud-native applications, microservices, and concurrent programming',
    ruby: 'Web development with Rails, scripting, and elegant syntax',
    php: 'Web development, WordPress, and server-side scripting',
    html: 'Web markup, structure, and semantic content',
    css: 'Web styling, layouts, and responsive design'
  };
  
  return features[language] || 'General purpose programming';
};

export default LanguageSelector; 