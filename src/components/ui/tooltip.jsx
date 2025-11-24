import React, { useState, useContext, createContext } from 'react';

const TooltipContext = createContext();

const TooltipProvider = ({ children }) => {
  return <div>{children}</div>;
};

const Tooltip = ({ children, delayDuration = 0 }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <TooltipContext.Provider value={{ isOpen, setIsOpen, delayDuration }}>
      <div className="relative inline-block">{children}</div>
    </TooltipContext.Provider>
  );
};

const TooltipTrigger = ({ asChild, children, ...props }) => {
  const { setIsOpen, delayDuration } = useContext(TooltipContext);
  let timeoutId = null;

  const handleMouseEnter = () => {
    if (delayDuration > 0) {
      timeoutId = setTimeout(() => {
        setIsOpen(true);
      }, delayDuration);
    } else {
      setIsOpen(true);
    }
  };

  const handleMouseLeave = () => {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    setIsOpen(false);
  };

  if (asChild) {
    return React.cloneElement(children, {
      ...props,
      onMouseEnter: (e) => {
        handleMouseEnter();
        children.props.onMouseEnter?.(e);
      },
      onMouseLeave: (e) => {
        handleMouseLeave();
        children.props.onMouseLeave?.(e);
      }
    });
  }
  return (
    <div 
      {...props} 
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {children}
    </div>
  );
};

const TooltipContent = ({ className, children, ...props }) => {
  const { isOpen, setIsOpen } = useContext(TooltipContext);

  if (!isOpen) return null;

  return (
    <div
      className={`absolute z-[9999] px-3 py-2 text-sm text-white bg-gray-900 rounded-md shadow-lg transition-opacity duration-200 ${className || ''}`}
      style={{
        bottom: '100%',
        left: '50%',
        transform: 'translateX(-50%)',
        marginBottom: '8px',
        minWidth: '180px'
      }}
      onMouseEnter={() => setIsOpen(true)}
      onMouseLeave={() => setIsOpen(false)}
      {...props}
    >
      {children}
      {/* Arrow */}
      <div 
        className="absolute top-full left-1/2 transform -translate-x-1/2"
        style={{
          borderLeft: '5px solid transparent',
          borderRight: '5px solid transparent',
          borderTop: '5px solid #1f2937'
        }}
      />
    </div>
  );
};

export { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent };
