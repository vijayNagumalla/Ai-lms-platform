import React, { useState, useEffect, useRef, useCallback } from 'react';
import api from '@/services/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Bold, Italic, Underline, AlignLeft, AlignCenter, AlignRight,
  Merge, Split, Highlighter, Download, Save, Undo, Redo,
  Type, Palette, Zap, Users, Search
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

const ExcelSchedulingGrid = ({ selectedProject }) => {
  const [batches, setBatches] = useState([]);
  const [dates, setDates] = useState([]);
  const [gridData, setGridData] = useState({});
  const [selectedCells, setSelectedCells] = useState(new Set());
  const [cellFormats, setCellFormats] = useState({});
  const [mergedCells, setMergedCells] = useState({});
  const [loading, setLoading] = useState(false);
  const gridRef = useRef(null);
  const [isSelecting, setIsSelecting] = useState(false);
  const [selectionStart, setSelectionStart] = useState(null);
  const [history, setHistory] = useState([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [textColor, setTextColor] = useState('#000000');
  const [bgColor, setBgColor] = useState('#ffffff');
  const [allocatedTrainers, setAllocatedTrainers] = useState([]);
  const [showMentionDropdown, setShowMentionDropdown] = useState(false);
  const [mentionQuery, setMentionQuery] = useState('');
  const [mentionCell, setMentionCell] = useState(null);
  const [mentionPosition, setMentionPosition] = useState({ top: 0, left: 0 });
  const [dragStartCell, setDragStartCell] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [conflicts, setConflicts] = useState({});

  useEffect(() => {
    if (selectedProject) {
      loadBatches();
      generateDates();
      loadSessions();
      loadAllocatedTrainers();
    }
  }, [selectedProject]);

  const loadAllocatedTrainers = async () => {
    if (!selectedProject) return;
    try {
      const response = await api.getProjectFaculty(selectedProject.id);
      if (response.success) {
        setAllocatedTrainers(response.data || []);
      }
    } catch (error) {
      console.error('Failed to load allocated trainers:', error);
    }
  };

  // Undo/Redo handlers
  const handleUndo = useCallback(() => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      setHistoryIndex(newIndex);
      setGridData(history[newIndex].gridData);
      setCellFormats(history[newIndex].formats);
      toast.success('Undone');
    } else {
      toast.error('Nothing to undo');
    }
  }, [history, historyIndex]);

  const handleRedo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1;
      setHistoryIndex(newIndex);
      setGridData(history[newIndex].gridData);
      setCellFormats(history[newIndex].formats);
      toast.success('Redone');
    } else {
      toast.error('Nothing to redo');
    }
  }, [history, historyIndex]);

  // Keyboard shortcuts for undo/redo
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Check if user is editing a cell (contentEditable)
      const isEditing = document.activeElement?.contentEditable === 'true';
      
      // Only handle shortcuts if not editing a cell
      if (!isEditing && (e.ctrlKey || e.metaKey)) {
        if (e.key === 'z' || e.key === 'Z') {
          if (e.shiftKey) {
            // Ctrl+Shift+Z or Cmd+Shift+Z: Redo
            e.preventDefault();
            handleRedo();
          } else {
            // Ctrl+Z or Cmd+Z: Undo
            e.preventDefault();
            handleUndo();
          }
        } else if (e.key === 'y' || e.key === 'Y') {
          // Ctrl+Y or Cmd+Y: Redo
          e.preventDefault();
          handleRedo();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleUndo, handleRedo]);

  // Close mention dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (showMentionDropdown && !e.target.closest('.absolute.z-50')) {
        setShowMentionDropdown(false);
        setMentionCell(null);
      }
    };

    if (showMentionDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [showMentionDropdown]);

  const generateDates = () => {
    if (!selectedProject?.start_date || !selectedProject?.end_date) return;
    
    const start = new Date(selectedProject.start_date);
    const end = new Date(selectedProject.end_date);
    const dateArray = [];
    
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      dateArray.push(new Date(d));
    }
    
    setDates(dateArray);
  };

  const loadBatches = async () => {
    if (!selectedProject?.college_id) return;
    try {
      const response = await api.getBatches({ college_id: selectedProject.college_id });
      if (response.success) {
        setBatches(response.data || []);
      }
    } catch (error) {
      console.error('Failed to load batches:', error);
      toast.error('Failed to load batches');
    }
  };

  const loadSessions = async () => {
    if (!selectedProject) return;
    try {
      setLoading(true);
      const response = await api.getSessions({ project_id: selectedProject.id });
      if (response.success) {
        const sessions = response.data || [];
        const sessionMap = {};
        
        sessions.forEach(session => {
          const date = new Date(session.start_time).toISOString().split('T')[0];
          const time = new Date(session.start_time).toLocaleTimeString('en-US', { 
            hour: '2-digit', 
            minute: '2-digit',
            hour12: true 
          });
          const endTime = new Date(session.end_time).toLocaleTimeString('en-US', { 
            hour: '2-digit', 
            minute: '2-digit',
            hour12: true 
          });
          const period = time.includes('AM') || (time.includes('PM') && parseInt(time.split(':')[0]) < 12) ? 'morning' : 'afternoon';
          const key = `${date}_${session.batch_id}_${period}`;
          
          sessionMap[key] = {
            title: session.title || '',
            time: `${time} - ${endTime}`,
            faculty: session.faculty_name || '',
            faculty_id: session.faculty_id || null,
            topic: session.topic || ''
          };
        });
        
        setGridData(sessionMap);
      }
    } catch (error) {
      toast.error('Failed to load sessions');
    } finally {
      setLoading(false);
    }
  };

  const getCellKey = (date, batchId, period) => {
    const dateStr = date.toISOString().split('T')[0];
    return `${dateStr}_${batchId}_${period}`;
  };

  const getCellValue = (date, batchId, period) => {
    // If it's Sunday, show "Sunday" in the first cell
    if (isSunday(date)) {
      const isFirstCell = batchId === batches[0]?.id && period === 'morning';
      if (isFirstCell) {
        return 'Sunday';
      }
      return ''; // Other cells in Sunday row are hidden
    }
    
    const key = getCellKey(date, batchId, period);
    const data = gridData[key];
    if (data) {
      return `${data.title}\n${data.time}\n${data.faculty}`;
    }
    return '';
  };

  const handleCellClick = (e, date, batchId, period) => {
    e.preventDefault();
    const key = getCellKey(date, batchId, period);
    
    // Check if it's a Sunday - if so, select all cells in that row
    const isSunday = date.getDay() === 0;
    
    if (isSunday) {
      // Select all cells in the Sunday row
      const sundayCells = new Set();
      batches.forEach(batch => {
        sundayCells.add(getCellKey(date, batch.id, 'morning'));
        sundayCells.add(getCellKey(date, batch.id, 'afternoon'));
      });
      setSelectedCells(sundayCells);
      setSelectionStart({ date, batchId, period });
      return;
    }
    
    if (e.ctrlKey || e.metaKey) {
      // Ctrl/Cmd + Click: Toggle selection
      const newSelection = new Set(selectedCells);
      if (newSelection.has(key)) {
        newSelection.delete(key);
      } else {
        newSelection.add(key);
      }
      setSelectedCells(newSelection);
    } else if (e.shiftKey && selectionStart) {
      // Shift + Click: Select range
      const newSelection = new Set();
      const startDateIdx = dates.findIndex(d => 
        d.toISOString().split('T')[0] === selectionStart.date.toISOString().split('T')[0]
      );
      const endDateIdx = dates.findIndex(d => 
        d.toISOString().split('T')[0] === date.toISOString().split('T')[0]
      );
      
      const startBatchIdx = batches.findIndex(b => b.id === selectionStart.batchId);
      const endBatchIdx = batches.findIndex(b => b.id === batchId);
      
      const startPeriod = selectionStart.period;
      const endPeriod = period;
      
      const minDateIdx = Math.min(startDateIdx, endDateIdx);
      const maxDateIdx = Math.max(startDateIdx, endDateIdx);
      const minBatchIdx = Math.min(startBatchIdx, endBatchIdx);
      const maxBatchIdx = Math.max(startBatchIdx, endBatchIdx);
      
      for (let dIdx = minDateIdx; dIdx <= maxDateIdx; dIdx++) {
        for (let bIdx = minBatchIdx; bIdx <= maxBatchIdx; bIdx++) {
          if (dIdx === minDateIdx && bIdx === minBatchIdx) {
            newSelection.add(getCellKey(dates[dIdx], batches[bIdx].id, startPeriod));
            if (startPeriod !== endPeriod && dIdx === maxDateIdx && bIdx === maxBatchIdx) {
              newSelection.add(getCellKey(dates[dIdx], batches[bIdx].id, endPeriod));
            }
          } else if (dIdx === maxDateIdx && bIdx === maxBatchIdx) {
            newSelection.add(getCellKey(dates[dIdx], batches[bIdx].id, endPeriod));
          } else {
            newSelection.add(getCellKey(dates[dIdx], batches[bIdx].id, 'morning'));
            newSelection.add(getCellKey(dates[dIdx], batches[bIdx].id, 'afternoon'));
          }
        }
      }
      
      setSelectedCells(newSelection);
    } else {
      // Single click: Select single cell
      setSelectedCells(new Set([key]));
      setSelectionStart({ date, batchId, period });
    }
  };

  const handleCellDoubleClick = (e, date, batchId, period) => {
    e.preventDefault();
    const cell = e.target;
    cell.contentEditable = true;
    cell.focus();
  };

  const handleCellBlur = (e, date, batchId, period) => {
    const cell = e.target;
    cell.contentEditable = false;
    const key = getCellKey(date, batchId, period);
    const newData = { ...gridData };
    const lines = cell.textContent.split('\n').filter(l => l.trim());
    
    if (lines.length > 0) {
      newData[key] = {
        title: lines[0] || '',
        time: lines[1] || '',
        faculty: lines[2] || '',
        faculty_id: null, // Will be set when trainer is assigned via @mention
        topic: lines[3] || ''
      };
    } else {
      delete newData[key];
    }
    
    saveToHistory();
    setGridData(newData);
  };

  const handleCellKeyDown = async (e, date, batchId, period) => {
    const cell = e.target;
    
    // Handle Escape to close mention dropdown
    if (e.key === 'Escape' && showMentionDropdown) {
      e.preventDefault();
      setShowMentionDropdown(false);
      setMentionCell(null);
      setMentionQuery('');
      return;
    }
    
    // Handle Enter to finish editing (but not if dropdown is open - let Command handle it)
    if (e.key === 'Enter' && !e.shiftKey && !showMentionDropdown) {
      e.preventDefault();
      e.target.blur();
      return;
    }
    
    // Check for @ mention after a short delay to allow text to update
    if (!showMentionDropdown || (e.key !== 'Escape' && e.key !== 'Enter')) {
      setTimeout(() => {
        updateMentionDropdown(cell, date, batchId, period);
      }, 10);
    }
  };

  const updateMentionDropdown = (cell, date, batchId, period) => {
    const text = cell.textContent || '';
    const selection = window.getSelection();
    if (selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      const cursorPos = range.startOffset;
      const textBeforeCursor = text.substring(0, cursorPos);
      const lastAtIndex = textBeforeCursor.lastIndexOf('@');
      
      if (lastAtIndex !== -1) {
        const query = textBeforeCursor.substring(lastAtIndex + 1);
        // Only show if query doesn't contain space or newline (means still typing name)
        if (!query.includes(' ') && !query.includes('\n')) {
          setMentionQuery(query);
          setMentionCell({ date, batchId, period });
          setShowMentionDropdown(true);
          
          // Position the dropdown near the cell
          const cellRect = cell.getBoundingClientRect();
          setMentionPosition({
            top: cellRect.bottom + 5,
            left: cellRect.left
          });
        } else {
          setShowMentionDropdown(false);
          setMentionCell(null);
          setMentionQuery('');
        }
      } else {
        setShowMentionDropdown(false);
        setMentionCell(null);
        setMentionQuery('');
      }
    }
  };

  const handleMentionSelect = (trainer) => {
    if (!trainer || !mentionCell) {
      setShowMentionDropdown(false);
      setMentionCell(null);
      setMentionQuery('');
      return;
    }
    
    const cell = document.querySelector(`[data-cell-key="${getCellKey(mentionCell.date, mentionCell.batchId, mentionCell.period)}"]`);
    if (!cell) {
      setShowMentionDropdown(false);
      setMentionCell(null);
      setMentionQuery('');
      return;
    }
    
    // Close dropdown first
    setShowMentionDropdown(false);
    setMentionQuery('');
    const currentMentionCell = mentionCell;
    setMentionCell(null);
    
    // Make cell editable
    cell.contentEditable = true;
    
    // Get current text
    const text = cell.textContent || '';
    
    // Find the @ symbol and replace everything after it with the trainer name
    const lastAtIndex = text.lastIndexOf('@');
    
    if (lastAtIndex !== -1) {
      // Get text before @
      const textBeforeAt = text.substring(0, lastAtIndex);
      // Get text after @ (might include query)
      const textAfterAt = text.substring(lastAtIndex + 1);
      // Find where the query ends (space, newline, or end of text)
      const queryEnd = textAfterAt.search(/[\s\n]/);
      const queryLength = queryEnd === -1 ? textAfterAt.length : queryEnd;
      const textAfterQuery = textAfterAt.substring(queryLength);
      
      // Build new text: before @ + trainer_name + remaining text (no @ symbol)
      const newText = textBeforeAt + trainer.faculty_name + textAfterQuery;
      
      // Update cell content
      cell.textContent = newText;
      
      // Set cursor position after the trainer name
      setTimeout(() => {
        cell.focus();
        const range = document.createRange();
        const sel = window.getSelection();
        
        // Try to set cursor at the end of the trainer name
        try {
          if (cell.firstChild) {
            const cursorPos = textBeforeAt.length + trainer.faculty_name.length;
            range.setStart(cell.firstChild, Math.min(cursorPos, cell.firstChild.length || 0));
            range.collapse(true);
            sel.removeAllRanges();
            sel.addRange(range);
          }
        } catch (err) {
          // Fallback: just focus the cell
          cell.focus();
        }
      }, 0);
      
      // Update grid data
      const key = getCellKey(currentMentionCell.date, currentMentionCell.batchId, currentMentionCell.period);
      const lines = newText.split('\n').filter(l => l.trim());
      const newData = { ...gridData };
      newData[key] = {
        title: lines[0] || '',
        time: lines[1] || '',
        faculty: trainer.faculty_name, // Store only the name, not ID
        faculty_id: trainer.faculty_id || trainer.id, // Store ID separately for conflict checking
        topic: lines[3] || ''
      };
      setGridData(newData);
      saveToHistory();
      
      // Check for conflicts
      if (trainer.faculty_id || trainer.id) {
        checkConflicts(currentMentionCell.date, currentMentionCell.batchId, currentMentionCell.period, trainer.faculty_id || trainer.id);
      }
    }
  };

  const checkConflicts = async (date, batchId, period, facultyId) => {
    if (!facultyId || !date) return;
    
    try {
      const dateStr = date.toISOString().split('T')[0];
      const cellData = gridData[getCellKey(date, batchId, period)];
      if (!cellData || !cellData.time) return;
      
      const [startTime, endTime] = cellData.time.split(' - ');
      const startDateTime = new Date(`${dateStr}T${startTime}`);
      const endDateTime = new Date(`${dateStr}T${endTime}`);
      
      const response = await api.checkConflicts({
        faculty_id: facultyId,
        start_time: startDateTime.toISOString(),
        end_time: endDateTime.toISOString(),
        project_id: selectedProject.id
      });
      
      if (response.success && response.data && response.data.length > 0) {
        const key = getCellKey(date, batchId, period);
        setConflicts(prev => ({
          ...prev,
          [key]: response.data
        }));
        toast.error(`Conflict detected: Trainer has overlapping session`);
      } else {
        const key = getCellKey(date, batchId, period);
        setConflicts(prev => {
          const newConflicts = { ...prev };
          delete newConflicts[key];
          return newConflicts;
        });
      }
    } catch (error) {
      console.error('Error checking conflicts:', error);
    }
  };

  const saveToHistory = () => {
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push({ gridData: JSON.parse(JSON.stringify(gridData)), formats: JSON.parse(JSON.stringify(cellFormats)) });
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  };

  const applyFormat = (formatType, value) => {
    const newFormats = { ...cellFormats };
    selectedCells.forEach(key => {
      if (!newFormats[key]) {
        newFormats[key] = {};
      }
      newFormats[key][formatType] = value;
    });
    saveToHistory();
    setCellFormats(newFormats);
  };

  const handleMergeCells = () => {
    if (selectedCells.size < 2) {
      toast.error('Select at least 2 cells to merge');
      return;
    }
    const cellsArray = Array.from(selectedCells);
    const mergedKey = cellsArray[0];
    const newMerged = { ...mergedCells };
    newMerged[mergedKey] = cellsArray;
    saveToHistory();
    setMergedCells(newMerged);
    toast.success('Cells merged');
  };

  const handleSplitCells = () => {
    const newMerged = { ...mergedCells };
    selectedCells.forEach(key => {
      if (newMerged[key]) {
        delete newMerged[key];
      }
    });
    saveToHistory();
    setMergedCells(newMerged);
    toast.success('Cells split');
  };

  const isSunday = (date) => {
    return date.getDay() === 0;
  };

  const getCellStyle = (date, batchId, period) => {
    const key = getCellKey(date, batchId, period);
    const format = cellFormats[key] || {};
    const isMerged = Object.values(mergedCells).some(cells => cells.includes(key) && cells[0] !== key);
    
    if (isMerged) {
      return { display: 'none' };
    }
    
    const sunday = isSunday(date);
    const isFirstCellInSundayRow = sunday && batchId === batches[0]?.id && period === 'morning';
    
    return {
      fontWeight: format.bold ? 'bold' : 'normal',
      fontStyle: format.italic ? 'italic' : 'normal',
      textDecoration: format.underline ? 'underline' : 'none',
      textAlign: format.align || (sunday ? 'center' : 'left'),
      backgroundColor: sunday ? '#f3f4f6' : (format.bgColor || bgColor),
      color: format.textColor || textColor
    };
  };


  const handleExport = async () => {
    try {
      // Create Excel-like structure
      const exportData = {
        project_id: selectedProject.id,
        dates: dates.map(d => d.toISOString().split('T')[0]),
        batches: batches.map(b => ({ id: b.id, name: b.name })),
        grid_data: gridData,
        formats: cellFormats,
        merged_cells: mergedCells
      };
      
      // Convert to JSON and download
      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `schedule_${selectedProject.name}_${new Date().toISOString().split('T')[0]}.json`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success('Schedule exported successfully');
    } catch (error) {
      toast.error('Failed to export schedule');
    }
  };

  const handleAutoGenerate = async () => {
    if (!selectedProject || allocatedTrainers.length === 0) {
      toast.error('Please allocate trainers to the project first');
      return;
    }
    
    try {
      setLoading(true);
      const response = await api.autoGenerateSchedule(selectedProject.id);
      if (response.success) {
        toast.success(`Generated ${response.data?.length || 0} sessions`);
        loadSessions();
      }
    } catch (error) {
      toast.error(error.message || 'Failed to generate schedule');
    } finally {
      setLoading(false);
    }
  };

  const handleDragStart = (e, date, batchId, period) => {
    e.preventDefault();
    const key = getCellKey(date, batchId, period);
    setDragStartCell({ date, batchId, period, key });
    setIsDragging(true);
    e.dataTransfer.effectAllowed = 'copy';
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
  };

  const handleDrop = (e, date, batchId, period) => {
    e.preventDefault();
    if (!dragStartCell) return;
    
    const targetKey = getCellKey(date, batchId, period);
    const sourceKey = dragStartCell.key;
    
    if (sourceKey === targetKey) return;
    
    // Copy data from source to target
    const sourceData = gridData[sourceKey];
    if (sourceData) {
      const newData = { ...gridData };
      newData[targetKey] = { ...sourceData };
      setGridData(newData);
      saveToHistory();
      
      // Check conflicts if trainer is assigned
      if (sourceData.faculty_id) {
        checkConflicts(date, batchId, period, sourceData.faculty_id);
      }
    }
    
    setIsDragging(false);
    setDragStartCell(null);
  };

  const handleAutoFill = (direction) => {
    if (selectedCells.size === 0) {
      toast.error('Please select cells to auto-fill');
      return;
    }
    
    const selectedArray = Array.from(selectedCells);
    const sourceKey = selectedArray[0];
    const sourceData = gridData[sourceKey];
    
    if (!sourceData) {
      toast.error('Source cell is empty');
      return;
    }
    
    const newData = { ...gridData };
    const [sourceDateStr, sourceBatchId, sourcePeriod] = sourceKey.split('_');
    const sourceDateIdx = dates.findIndex(d => d.toISOString().split('T')[0] === sourceDateStr);
    const sourceBatchIdx = batches.findIndex(b => b.id === sourceBatchId);
    
    selectedArray.slice(1).forEach(key => {
      const [dateStr, batchId, period] = key.split('_');
      const dateIdx = dates.findIndex(d => d.toISOString().split('T')[0] === dateStr);
      const batchIdx = batches.findIndex(b => b.id === batchId);
      
      // Calculate relative position
      const dateDiff = dateIdx - sourceDateIdx;
      const batchDiff = batchIdx - sourceBatchIdx;
      
      // Find corresponding source cell based on direction
      let fillData = { ...sourceData };
      
      if (direction === 'down' && dateDiff > 0) {
        // Fill down: increment date, keep batch
        const newDateIdx = sourceDateIdx + dateDiff;
        if (newDateIdx < dates.length) {
          // Check if there's a pattern to follow
          const prevKey = getCellKey(dates[newDateIdx - 1], batchId, period);
          if (gridData[prevKey]) {
            fillData = { ...gridData[prevKey] };
          }
        }
      } else if (direction === 'right' && batchDiff > 0) {
        // Fill right: increment batch, keep date
        const newBatchIdx = sourceBatchIdx + batchDiff;
        if (newBatchIdx < batches.length) {
          const prevKey = getCellKey(dates[dateIdx], batches[newBatchIdx - 1].id, period);
          if (gridData[prevKey]) {
            fillData = { ...gridData[prevKey] };
          }
        }
      }
      
      newData[key] = fillData;
      
      // Check conflicts
      if (fillData.faculty_id) {
        const date = dates[dateIdx];
        checkConflicts(date, batchId, period, fillData.faculty_id);
      }
    });
    
    setGridData(newData);
    saveToHistory();
    toast.success('Cells auto-filled');
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      // Save sessions to backend
      const sessions = [];
      Object.keys(gridData).forEach(key => {
        const [date, batchId, period] = key.split('_');
        const data = gridData[key];
        if (data.title && data.time) {
          try {
            // Parse time - handle both "HH:MM AM/PM - HH:MM AM/PM" and "HH:MM - HH:MM" formats
            let startTime = data.time.split(' - ')[0].trim();
            let endTime = data.time.split(' - ')[1]?.trim() || '';
            
            // Convert to 24-hour format if needed
            const parseTime = (timeStr) => {
              if (!timeStr) return null;
              // If already in 24-hour format
              if (timeStr.includes(':')) {
                const [hours, minutes] = timeStr.split(':');
                return `${hours.padStart(2, '0')}:${minutes.padStart(2, '0')}:00`;
              }
              return timeStr;
            };
            
            startTime = parseTime(startTime);
            endTime = parseTime(endTime);
            
            if (startTime && endTime) {
              const startDateTime = new Date(`${date}T${startTime}`);
              const endDateTime = new Date(`${date}T${endTime}`);
              
              // If parsing failed, try alternative format
              if (isNaN(startDateTime.getTime()) || isNaN(endDateTime.getTime())) {
                // Try with AM/PM parsing
                const startParts = startTime.match(/(\d+):(\d+)\s*(AM|PM)/i);
                const endParts = endTime.match(/(\d+):(\d+)\s*(AM|PM)/i);
                
                if (startParts && endParts) {
                  let startHour = parseInt(startParts[1]);
                  const startMin = parseInt(startParts[2]);
                  const startPeriod = startParts[3].toUpperCase();
                  
                  let endHour = parseInt(endParts[1]);
                  const endMin = parseInt(endParts[2]);
                  const endPeriod = endParts[3].toUpperCase();
                  
                  if (startPeriod === 'PM' && startHour !== 12) startHour += 12;
                  if (startPeriod === 'AM' && startHour === 12) startHour = 0;
                  
                  if (endPeriod === 'PM' && endHour !== 12) endHour += 12;
                  if (endPeriod === 'AM' && endHour === 12) endHour = 0;
                  
                  const startDateTime = new Date(`${date}T${startHour.toString().padStart(2, '0')}:${startMin.toString().padStart(2, '0')}:00`);
                  const endDateTime = new Date(`${date}T${endHour.toString().padStart(2, '0')}:${endMin.toString().padStart(2, '0')}:00`);
                  
                  sessions.push({
                    project_id: selectedProject.id,
                    batch_id: batchId,
                    faculty_id: data.faculty_id || null,
                    title: data.title,
                    topic: data.topic || '',
                    start_time: startDateTime.toISOString(),
                    end_time: endDateTime.toISOString(),
                    mode: selectedProject.mode || 'online'
                  });
                }
              } else {
                sessions.push({
                  project_id: selectedProject.id,
                  batch_id: batchId,
                  faculty_id: data.faculty || null,
                  title: data.title,
                  topic: data.topic || '',
                  start_time: startDateTime.toISOString(),
                  end_time: endDateTime.toISOString(),
                  mode: selectedProject.mode || 'online'
                });
              }
            }
          } catch (parseError) {
            console.error(`Error parsing time for ${key}:`, parseError);
          }
        }
      });
      
      // Call API to save sessions
      for (const session of sessions) {
        try {
          await api.createSession(session);
        } catch (error) {
          console.error('Error saving session:', error);
        }
      }
      
      toast.success(`Schedule saved successfully (${sessions.length} sessions)`);
      loadSessions(); // Reload to refresh grid
    } catch (error) {
      toast.error('Failed to save schedule');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  if (!selectedProject) {
    return (
      <Card>
        <CardContent className="text-center py-8">
          <p className="text-gray-500">Please select a project to view scheduling</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>Scheduling - {selectedProject.name}</CardTitle>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleAutoGenerate} disabled={loading || allocatedTrainers.length === 0}>
              <Zap className="mr-2 h-4 w-4" />
              Auto Generate
            </Button>
            <Button variant="outline" size="sm" onClick={handleExport}>
              <Download className="mr-2 h-4 w-4" />
              Export
            </Button>
            <Button size="sm" onClick={handleSave} disabled={loading}>
              <Save className="mr-2 h-4 w-4" />
              {loading ? 'Saving...' : 'Save'}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="relative">
        {/* Formatting Toolbar */}
        <div className="flex items-center gap-2 p-2 border-b mb-4 flex-wrap">
          <Button
            variant="outline"
            size="sm"
            onClick={() => applyFormat('bold', !cellFormats[Array.from(selectedCells)[0]]?.bold)}
          >
            <Bold className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => applyFormat('italic', !cellFormats[Array.from(selectedCells)[0]]?.italic)}
          >
            <Italic className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => applyFormat('underline', !cellFormats[Array.from(selectedCells)[0]]?.underline)}
          >
            <Underline className="h-4 w-4" />
          </Button>
          <div className="w-px h-6 bg-gray-300 mx-1" />
          <Button
            variant="outline"
            size="sm"
            onClick={() => applyFormat('align', 'left')}
          >
            <AlignLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => applyFormat('align', 'center')}
          >
            <AlignCenter className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => applyFormat('align', 'right')}
          >
            <AlignRight className="h-4 w-4" />
          </Button>
          <div className="w-px h-6 bg-gray-300 mx-1" />
          <Button
            variant="outline"
            size="sm"
            onClick={handleMergeCells}
          >
            <Merge className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleSplitCells}
          >
            <Split className="h-4 w-4" />
          </Button>
          <div className="w-px h-6 bg-gray-300 mx-1" />
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm">
                <Highlighter className="h-4 w-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-64">
              <div className="space-y-2">
                <Label>Background Color</Label>
                <Input
                  type="color"
                  value={bgColor}
                  onChange={(e) => {
                    setBgColor(e.target.value);
                    applyFormat('bgColor', e.target.value);
                  }}
                />
                <Label>Text Color</Label>
                <Input
                  type="color"
                  value={textColor}
                  onChange={(e) => {
                    setTextColor(e.target.value);
                    applyFormat('textColor', e.target.value);
                  }}
                />
              </div>
            </PopoverContent>
          </Popover>
          <div className="w-px h-6 bg-gray-300 mx-1" />
          <Button
            variant="outline"
            size="sm"
            onClick={handleUndo}
            disabled={historyIndex <= 0}
            title="Undo (Ctrl+Z)"
          >
            <Undo className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRedo}
            disabled={historyIndex >= history.length - 1}
            title="Redo (Ctrl+Y or Ctrl+Shift+Z)"
          >
            <Redo className="h-4 w-4" />
          </Button>
          <div className="w-px h-6 bg-gray-300 mx-1" />
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleAutoFill('down')}
            disabled={selectedCells.size === 0}
            title="Auto Fill Down"
          >
            Fill ↓
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleAutoFill('right')}
            disabled={selectedCells.size === 0}
            title="Auto Fill Right"
          >
            Fill →
          </Button>
        </div>

        {/* Trainer Selection Dropdown - Simple and Reliable */}
        {showMentionDropdown && mentionCell && (
          <div
            className="fixed z-[9999] bg-white border rounded-lg shadow-xl"
            style={{
              top: `${mentionPosition.top}px`,
              left: `${mentionPosition.left}px`,
              width: '320px',
              maxHeight: '400px',
              display: 'flex',
              flexDirection: 'column'
            }}
            onMouseDown={(e) => e.stopPropagation()}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Search Input */}
            <div className="p-3 border-b">
              <div className="relative">
                <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Search trainers..."
                  value={mentionQuery}
                  onChange={(e) => {
                    e.stopPropagation();
                    setMentionQuery(e.target.value);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Escape') {
                      setShowMentionDropdown(false);
                      setMentionCell(null);
                      setMentionQuery('');
                    } else if (e.key === 'Enter') {
                      const filtered = allocatedTrainers.filter(trainer => 
                        !mentionQuery || 
                        trainer.faculty_name?.toLowerCase().includes(mentionQuery.toLowerCase()) ||
                        trainer.faculty_email?.toLowerCase().includes(mentionQuery.toLowerCase())
                      );
                      if (filtered.length > 0) {
                        handleMentionSelect(filtered[0]);
                      }
                    }
                  }}
                  className="pl-8"
                  autoFocus
                />
              </div>
            </div>
            
            {/* Trainer List */}
            <div className="overflow-y-auto max-h-[300px]">
              {allocatedTrainers
                .filter(trainer => 
                  !mentionQuery || 
                  trainer.faculty_name?.toLowerCase().includes(mentionQuery.toLowerCase()) ||
                  trainer.faculty_email?.toLowerCase().includes(mentionQuery.toLowerCase())
                )
                .map(trainer => (
                  <div
                    key={trainer.faculty_id || trainer.id}
                    className="px-3 py-2 hover:bg-blue-50 cursor-pointer border-b last:border-b-0 transition-colors"
                    onMouseDown={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleMentionSelect(trainer);
                    }}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleMentionSelect(trainer);
                    }}
                  >
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-gray-500 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm truncate">{trainer.faculty_name}</div>
                        <div className="text-xs text-gray-500 truncate">{trainer.faculty_email}</div>
                      </div>
                    </div>
                  </div>
                ))}
              {allocatedTrainers.filter(trainer => 
                !mentionQuery || 
                trainer.faculty_name?.toLowerCase().includes(mentionQuery.toLowerCase()) ||
                trainer.faculty_email?.toLowerCase().includes(mentionQuery.toLowerCase())
              ).length === 0 && (
                <div className="px-3 py-8 text-center text-gray-500 text-sm">
                  {mentionQuery ? `No trainers found for "${mentionQuery}"` : 'No trainers available'}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Excel Grid */}
        <div className="overflow-auto max-h-[600px] border">
          <table className="w-full border-collapse" ref={gridRef}>
            <thead className="sticky top-0 bg-white z-10">
              <tr>
                <th className="border p-2 bg-gray-50 sticky left-0 z-20 min-w-[120px]">Date</th>
                {batches.map(batch => (
                  <React.Fragment key={batch.id}>
                    <th colSpan="2" className="border p-2 bg-gray-100 text-center">
                      {batch.name}
                    </th>
                  </React.Fragment>
                ))}
              </tr>
              <tr>
                <th className="border p-2 bg-gray-50 sticky left-0 z-20"></th>
                {batches.map(batch => (
                  <React.Fragment key={batch.id}>
                    <th className="border p-2 bg-gray-50 text-center min-w-[150px]">Morning</th>
                    <th className="border p-2 bg-gray-50 text-center min-w-[150px]">Afternoon</th>
                  </React.Fragment>
                ))}
              </tr>
            </thead>
            <tbody>
              {dates.map((date, dateIdx) => {
                const sunday = isSunday(date);
                const isFirstCellInSundayRow = sunday && batches[0]?.id;
                
                return (
                  <tr key={dateIdx}>
                    <td className="border p-2 bg-gray-50 sticky left-0 z-10 font-medium">
                      {date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                    </td>
                    {sunday ? (
                      // Sunday row: Single merged cell spanning all batches
                      <td
                        colSpan={batches.length * 2}
                        className="border p-2 min-h-[80px] bg-gray-100 text-center font-semibold cursor-cell"
                        style={getCellStyle(date, batches[0]?.id, 'morning')}
                        onClick={(e) => handleCellClick(e, date, batches[0]?.id, 'morning')}
                        contentEditable={false}
                        suppressContentEditableWarning
                      >
                        Sunday
                      </td>
                    ) : (
                      // Regular row: All batch cells
                      batches.map(batch => (
                        <React.Fragment key={batch.id}>
                          <td
                            data-cell-key={getCellKey(date, batch.id, 'morning')}
                            className={`border p-2 min-h-[80px] cursor-cell whitespace-pre-line relative transition-all ${
                              selectedCells.has(getCellKey(date, batch.id, 'morning')) 
                                ? 'bg-blue-50 border-blue-400 border-2 shadow-md ring-2 ring-blue-300 ring-offset-1' 
                                : 'hover:bg-gray-50'
                            } ${conflicts[getCellKey(date, batch.id, 'morning')] ? 'bg-red-100 ring-2 ring-red-500' : ''}`}
                            style={getCellStyle(date, batch.id, 'morning')}
                            onClick={(e) => handleCellClick(e, date, batch.id, 'morning')}
                            onDoubleClick={(e) => handleCellDoubleClick(e, date, batch.id, 'morning')}
                            onBlur={(e) => handleCellBlur(e, date, batch.id, 'morning')}
                            onKeyDown={(e) => handleCellKeyDown(e, date, batch.id, 'morning')}
                            onDragStart={(e) => handleDragStart(e, date, batch.id, 'morning')}
                            onDragOver={handleDragOver}
                            onDrop={(e) => handleDrop(e, date, batch.id, 'morning')}
                            draggable
                            contentEditable={false}
                            suppressContentEditableWarning
                          >
                            {getCellValue(date, batch.id, 'morning')}
                            {conflicts[getCellKey(date, batch.id, 'morning')] && (
                              <span className="absolute top-1 right-1 text-xs text-red-600" title="Conflict detected">
                                ⚠️
                              </span>
                            )}
                          </td>
                          <td
                            data-cell-key={getCellKey(date, batch.id, 'afternoon')}
                            className={`border p-2 min-h-[80px] cursor-cell whitespace-pre-line relative transition-all ${
                              selectedCells.has(getCellKey(date, batch.id, 'afternoon')) 
                                ? 'bg-blue-50 border-blue-400 border-2 shadow-md ring-2 ring-blue-300 ring-offset-1' 
                                : 'hover:bg-gray-50'
                            } ${conflicts[getCellKey(date, batch.id, 'afternoon')] ? 'bg-red-100 ring-2 ring-red-500' : ''}`}
                            style={getCellStyle(date, batch.id, 'afternoon')}
                            onClick={(e) => handleCellClick(e, date, batch.id, 'afternoon')}
                            onDoubleClick={(e) => handleCellDoubleClick(e, date, batch.id, 'afternoon')}
                            onBlur={(e) => handleCellBlur(e, date, batch.id, 'afternoon')}
                            onKeyDown={(e) => handleCellKeyDown(e, date, batch.id, 'afternoon')}
                            onDragStart={(e) => handleDragStart(e, date, batch.id, 'afternoon')}
                            onDragOver={handleDragOver}
                            onDrop={(e) => handleDrop(e, date, batch.id, 'afternoon')}
                            draggable
                            contentEditable={false}
                            suppressContentEditableWarning
                          >
                            {getCellValue(date, batch.id, 'afternoon')}
                            {conflicts[getCellKey(date, batch.id, 'afternoon')] && (
                              <span className="absolute top-1 right-1 text-xs text-red-600" title="Conflict detected">
                                ⚠️
                              </span>
                            )}
                          </td>
                        </React.Fragment>
                      ))
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
};

export default ExcelSchedulingGrid;

