import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Eye, 
  EyeOff, 
  Volume2, 
  VolumeX, 
  Type, 
  MousePointer, 
  Keyboard, 
  Settings,
  Accessibility,
  Contrast,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Play,
  Pause,
  SkipForward,
  SkipBack,
  Repeat,
  HighContrast,
  LowVision,
  Hearing,
  Focus,
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  Enter,
  Escape,
  Tab,
  Space
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// Accessibility Settings Context
const AccessibilityContext = React.createContext();

export const useAccessibility = () => {
  const context = React.useContext(AccessibilityContext);
  if (!context) {
    throw new Error('useAccessibility must be used within an AccessibilityProvider');
  }
  return context;
};

// Accessibility Provider Component
export const AccessibilityProvider = ({ children }) => {
  const [settings, setSettings] = useState({
    // Visual Settings
    highContrast: false,
    fontSize: 16,
    fontFamily: 'system-ui',
    lineHeight: 1.5,
    letterSpacing: 0,
    colorScheme: 'default', // default, dark, light, high-contrast
    
    // Motion Settings
    reduceMotion: false,
    disableAnimations: false,
    
    // Audio Settings
    audioDescriptions: false,
    soundEffects: true,
    volume: 0.7,
    
    // Navigation Settings
    keyboardNavigation: true,
    focusIndicators: true,
    skipLinks: true,
    tabOrder: 'logical',
    
    // Screen Reader Settings
    screenReader: false,
    announceChanges: true,
    liveRegions: true,
    
    // Cognitive Settings
    readingMode: false,
    simplifiedLayout: false,
    distractionFree: false,
    
    // Motor Settings
    largeClickTargets: false,
    stickyKeys: false,
    slowKeys: false,
    mouseKeys: false
  });

  const [isOpen, setIsOpen] = useState(false);
  const [announcements, setAnnouncements] = useState([]);

  // Load settings from localStorage
  useEffect(() => {
    const savedSettings = localStorage.getItem('accessibility-settings');
    if (savedSettings) {
      setSettings(prev => ({ ...prev, ...JSON.parse(savedSettings) }));
    }
  }, []);

  // Save settings to localStorage
  useEffect(() => {
    localStorage.setItem('accessibility-settings', JSON.stringify(settings));
    applySettings();
  }, [settings]);

  const applySettings = () => {
    const root = document.documentElement;
    
    // Apply visual settings
    root.style.setProperty('--font-size', `${settings.fontSize}px`);
    root.style.setProperty('--font-family', settings.fontFamily);
    root.style.setProperty('--line-height', settings.lineHeight);
    root.style.setProperty('--letter-spacing', `${settings.letterSpacing}px`);
    
    // Apply color scheme
    if (settings.colorScheme === 'high-contrast') {
      root.classList.add('high-contrast');
    } else {
      root.classList.remove('high-contrast');
    }
    
    // Apply motion settings
    if (settings.reduceMotion) {
      root.classList.add('reduce-motion');
    } else {
      root.classList.remove('reduce-motion');
    }
    
    if (settings.disableAnimations) {
      root.classList.add('no-animations');
    } else {
      root.classList.remove('no-animations');
    }
    
    // Apply focus indicators
    if (settings.focusIndicators) {
      root.classList.add('focus-visible');
    } else {
      root.classList.remove('focus-visible');
    }
  };

  const updateSetting = (key, value) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const announce = (message, priority = 'polite') => {
    if (settings.screenReader && settings.announceChanges) {
      setAnnouncements(prev => [...prev, { message, priority, id: Date.now() }]);
      
      // Remove announcement after 5 seconds
      setTimeout(() => {
        setAnnouncements(prev => prev.slice(1));
      }, 5000);
    }
  };

  const resetSettings = () => {
    setSettings({
      highContrast: false,
      fontSize: 16,
      fontFamily: 'system-ui',
      lineHeight: 1.5,
      letterSpacing: 0,
      colorScheme: 'default',
      reduceMotion: false,
      disableAnimations: false,
      audioDescriptions: false,
      soundEffects: true,
      volume: 0.7,
      keyboardNavigation: true,
      focusIndicators: true,
      skipLinks: true,
      tabOrder: 'logical',
      screenReader: false,
      announceChanges: true,
      liveRegions: true,
      readingMode: false,
      simplifiedLayout: false,
      distractionFree: false,
      largeClickTargets: false,
      stickyKeys: false,
      slowKeys: false,
      mouseKeys: false
    });
    announce('Accessibility settings reset to default');
  };

  const value = {
    settings,
    updateSetting,
    announce,
    isOpen,
    setIsOpen,
    resetSettings
  };

  return (
    <AccessibilityContext.Provider value={value}>
      {children}
      
      {/* Live Region for Screen Reader Announcements */}
      <div
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
      >
        {announcements.map(announcement => (
          <div key={announcement.id}>
            {announcement.message}
          </div>
        ))}
      </div>
    </AccessibilityContext.Provider>
  );
};

// Accessibility Settings Panel Component
const AccessibilitySettingsPanel = () => {
  const { settings, updateSetting, isOpen, setIsOpen, resetSettings } = useAccessibility();
  const [activeTab, setActiveTab] = useState('visual');

  const tabs = [
    { id: 'visual', label: 'Visual', icon: Eye },
    { id: 'audio', label: 'Audio', icon: Volume2 },
    { id: 'navigation', label: 'Navigation', icon: Keyboard },
    { id: 'cognitive', label: 'Cognitive', icon: Focus }
  ];

  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0, x: 300 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 300 }}
      className="fixed top-0 right-0 h-full w-96 bg-white border-l shadow-xl z-50 overflow-y-auto"
    >
      <Card className="h-full rounded-none border-0">
        <CardHeader className="border-b">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center space-x-2">
              <Accessibility className="h-5 w-5" />
              <span>Accessibility Settings</span>
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsOpen(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {/* Tab Navigation */}
          <div className="border-b">
            <div className="flex">
              {tabs.map(tab => {
                const Icon = tab.icon;
                return (
                  <Button
                    key={tab.id}
                    variant={activeTab === tab.id ? "default" : "ghost"}
                    className="flex-1 rounded-none"
                    onClick={() => setActiveTab(tab.id)}
                  >
                    <Icon className="h-4 w-4 mr-2" />
                    {tab.label}
                  </Button>
                );
              })}
            </div>
          </div>

          {/* Tab Content */}
          <div className="p-6 space-y-6">
            {activeTab === 'visual' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold mb-4">Visual Settings</h3>
                  
                  {/* High Contrast */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-2">
                      <HighContrast className="h-4 w-4" />
                      <span>High Contrast</span>
                    </div>
                    <Switch
                      checked={settings.highContrast}
                      onCheckedChange={(checked) => updateSetting('highContrast', checked)}
                    />
                  </div>

                  {/* Font Size */}
                  <div className="space-y-2 mb-4">
                    <div className="flex items-center space-x-2">
                      <Type className="h-4 w-4" />
                      <span>Font Size: {settings.fontSize}px</span>
                    </div>
                    <Slider
                      value={[settings.fontSize]}
                      onValueChange={([value]) => updateSetting('fontSize', value)}
                      min={12}
                      max={24}
                      step={1}
                      className="w-full"
                    />
                  </div>

                  {/* Font Family */}
                  <div className="space-y-2 mb-4">
                    <div className="flex items-center space-x-2">
                      <Type className="h-4 w-4" />
                      <span>Font Family</span>
                    </div>
                    <Select
                      value={settings.fontFamily}
                      onValueChange={(value) => updateSetting('fontFamily', value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="system-ui">System UI</SelectItem>
                        <SelectItem value="Arial">Arial</SelectItem>
                        <SelectItem value="Helvetica">Helvetica</SelectItem>
                        <SelectItem value="Times New Roman">Times New Roman</SelectItem>
                        <SelectItem value="Georgia">Georgia</SelectItem>
                        <SelectItem value="Verdana">Verdana</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Line Height */}
                  <div className="space-y-2 mb-4">
                    <div className="flex items-center space-x-2">
                      <Type className="h-4 w-4" />
                      <span>Line Height: {settings.lineHeight}</span>
                    </div>
                    <Slider
                      value={[settings.lineHeight]}
                      onValueChange={([value]) => updateSetting('lineHeight', value)}
                      min={1.2}
                      max={2.0}
                      step={0.1}
                      className="w-full"
                    />
                  </div>

                  {/* Color Scheme */}
                  <div className="space-y-2 mb-4">
                    <div className="flex items-center space-x-2">
                      <Contrast className="h-4 w-4" />
                      <span>Color Scheme</span>
                    </div>
                    <Select
                      value={settings.colorScheme}
                      onValueChange={(value) => updateSetting('colorScheme', value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="default">Default</SelectItem>
                        <SelectItem value="light">Light</SelectItem>
                        <SelectItem value="dark">Dark</SelectItem>
                        <SelectItem value="high-contrast">High Contrast</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Reduce Motion */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-2">
                      <Play className="h-4 w-4" />
                      <span>Reduce Motion</span>
                    </div>
                    <Switch
                      checked={settings.reduceMotion}
                      onCheckedChange={(checked) => updateSetting('reduceMotion', checked)}
                    />
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'audio' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold mb-4">Audio Settings</h3>
                  
                  {/* Sound Effects */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-2">
                      <Volume2 className="h-4 w-4" />
                      <span>Sound Effects</span>
                    </div>
                    <Switch
                      checked={settings.soundEffects}
                      onCheckedChange={(checked) => updateSetting('soundEffects', checked)}
                    />
                  </div>

                  {/* Volume */}
                  <div className="space-y-2 mb-4">
                    <div className="flex items-center space-x-2">
                      <Volume2 className="h-4 w-4" />
                      <span>Volume: {Math.round(settings.volume * 100)}%</span>
                    </div>
                    <Slider
                      value={[settings.volume]}
                      onValueChange={([value]) => updateSetting('volume', value)}
                      min={0}
                      max={1}
                      step={0.1}
                      className="w-full"
                    />
                  </div>

                  {/* Audio Descriptions */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-2">
                      <Hearing className="h-4 w-4" />
                      <span>Audio Descriptions</span>
                    </div>
                    <Switch
                      checked={settings.audioDescriptions}
                      onCheckedChange={(checked) => updateSetting('audioDescriptions', checked)}
                    />
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'navigation' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold mb-4">Navigation Settings</h3>
                  
                  {/* Keyboard Navigation */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-2">
                      <Keyboard className="h-4 w-4" />
                      <span>Keyboard Navigation</span>
                    </div>
                    <Switch
                      checked={settings.keyboardNavigation}
                      onCheckedChange={(checked) => updateSetting('keyboardNavigation', checked)}
                    />
                  </div>

                  {/* Focus Indicators */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-2">
                      <Focus className="h-4 w-4" />
                      <span>Focus Indicators</span>
                    </div>
                    <Switch
                      checked={settings.focusIndicators}
                      onCheckedChange={(checked) => updateSetting('focusIndicators', checked)}
                    />
                  </div>

                  {/* Skip Links */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-2">
                      <ArrowDown className="h-4 w-4" />
                      <span>Skip Links</span>
                    </div>
                    <Switch
                      checked={settings.skipLinks}
                      onCheckedChange={(checked) => updateSetting('skipLinks', checked)}
                    />
                  </div>

                  {/* Large Click Targets */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-2">
                      <MousePointer className="h-4 w-4" />
                      <span>Large Click Targets</span>
                    </div>
                    <Switch
                      checked={settings.largeClickTargets}
                      onCheckedChange={(checked) => updateSetting('largeClickTargets', checked)}
                    />
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'cognitive' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold mb-4">Cognitive Settings</h3>
                  
                  {/* Reading Mode */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-2">
                      <BookOpen className="h-4 w-4" />
                      <span>Reading Mode</span>
                    </div>
                    <Switch
                      checked={settings.readingMode}
                      onCheckedChange={(checked) => updateSetting('readingMode', checked)}
                    />
                  </div>

                  {/* Simplified Layout */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-2">
                      <Layout className="h-4 w-4" />
                      <span>Simplified Layout</span>
                    </div>
                    <Switch
                      checked={settings.simplifiedLayout}
                      onCheckedChange={(checked) => updateSetting('simplifiedLayout', checked)}
                    />
                  </div>

                  {/* Distraction Free */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-2">
                      <Focus className="h-4 w-4" />
                      <span>Distraction Free</span>
                    </div>
                    <Switch
                      checked={settings.distractionFree}
                      onCheckedChange={(checked) => updateSetting('distractionFree', checked)}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer Actions */}
          <div className="border-t p-4 space-y-2">
            <Button
              onClick={resetSettings}
              variant="outline"
              className="w-full"
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              Reset to Default
            </Button>
            <Button
              onClick={() => setIsOpen(false)}
              className="w-full"
            >
              Close
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

// Accessibility Toggle Button
const AccessibilityToggle = () => {
  const { setIsOpen } = useAccessibility();

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={() => setIsOpen(true)}
      className="fixed bottom-4 right-4 z-40"
    >
      <Accessibility className="h-4 w-4 mr-2" />
      Accessibility
    </Button>
  );
};

// Skip Links Component
const SkipLinks = () => {
  const { settings } = useAccessibility();

  if (!settings.skipLinks) return null;

  return (
    <div className="skip-links">
      <a
        href="#main-content"
        className="skip-link"
        onFocus={(e) => e.target.style.display = 'block'}
        onBlur={(e) => e.target.style.display = 'none'}
      >
        Skip to main content
      </a>
      <a
        href="#navigation"
        className="skip-link"
        onFocus={(e) => e.target.style.display = 'block'}
        onBlur={(e) => e.target.style.display = 'none'}
      >
        Skip to navigation
      </a>
    </div>
  );
};

// Keyboard Shortcuts Help
const KeyboardShortcuts = () => {
  const shortcuts = [
    { key: 'Tab', description: 'Navigate to next element' },
    { key: 'Shift + Tab', description: 'Navigate to previous element' },
    { key: 'Enter', description: 'Activate button or link' },
    { key: 'Space', description: 'Activate button or toggle' },
    { key: 'Escape', description: 'Close dialog or menu' },
    { key: 'Arrow Keys', description: 'Navigate within groups' },
    { key: 'Alt + A', description: 'Open accessibility settings' },
    { key: 'Alt + H', description: 'Show keyboard shortcuts' }
  ];

  return (
    <div className="space-y-2">
      <h3 className="text-lg font-semibold mb-4">Keyboard Shortcuts</h3>
      {shortcuts.map((shortcut, index) => (
        <div key={index} className="flex items-center justify-between py-2 border-b">
          <kbd className="px-2 py-1 bg-gray-100 rounded text-sm font-mono">
            {shortcut.key}
          </kbd>
          <span className="text-sm text-gray-600">{shortcut.description}</span>
        </div>
      ))}
    </div>
  );
};

export {
  AccessibilitySettingsPanel,
  AccessibilityToggle,
  SkipLinks,
  KeyboardShortcuts
};



