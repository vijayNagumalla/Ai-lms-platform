import React, { useState } from 'react';
import { getLanguageIconPath, getLanguageIcon, getLanguageName } from '@/lib/language-utils';

const LanguageIcon = ({ 
  language, 
  showText = true, 
  size = "sm",
  className = "" 
}) => {
  const [imageError, setImageError] = useState(false);
  const iconPath = getLanguageIconPath(language);
  const fallbackText = getLanguageIcon(language);
  const displayName = getLanguageName(language);
  
  const sizeClasses = {
    sm: "w-4 h-4",
    md: "w-6 h-6", 
    lg: "w-8 h-8"
  };

  // Handle image loading error
  const handleImageError = () => {
    setImageError(true);
  };

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      {/* Icon Image or Fallback */}
      {!imageError ? (
        <img 
          src={iconPath}
          alt={`${language} icon`}
          className={`${sizeClasses[size]} object-contain flex-shrink-0`}
          onError={handleImageError}
        />
      ) : (
        <div className={`${sizeClasses[size]} flex items-center justify-center bg-gray-100 rounded text-xs font-bold flex-shrink-0`}>
          {fallbackText.split(' ')[0]}
        </div>
      )}
      
      {/* Language Name */}
      {showText && (
        <span className="text-sm font-medium">
          {displayName}
        </span>
      )}
    </div>
  );
};

export default LanguageIcon;
