import { clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs) {
  return twMerge(clsx(inputs))
}

// Timezone and date utility functions
export const formatDateTimeWithTimezone = (dateString, timezone = 'UTC') => {
  if (!dateString) return 'N/A';
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'Invalid Date';
    
    // Format the date in the specified timezone
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
      timeZone: timezone
    });
  } catch (error) {
    return 'Invalid Date';
  }
};

export const formatDateWithTimezone = (dateString, timezone = 'UTC') => {
  if (!dateString) return 'N/A';
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'Invalid Date';
    
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      timeZone: timezone
    });
  } catch (error) {
    return 'Invalid Date';
  }
};

export const formatTimeWithTimezone = (dateString, timezone = 'UTC') => {
  if (!dateString) return 'N/A';
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'Invalid Time';
    
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
      timeZone: timezone
    });
  } catch (error) {
    return 'Invalid Time';
  }
};



export const combineDateTimeWithTimezone = (date, time, timezone = 'UTC') => {
  if (!date || !time) return null;
  
  try {
    // Create a date string - store exactly as entered without timezone conversion
    const dateTimeString = `${date}T${time}:00`;
    
    // Return the date string as-is without converting to UTC
    // This ensures that the time entered by the admin is preserved exactly as intended
    return dateTimeString;
  } catch (error) {
    return null;
  }
};



// Helper function to get timezone offset in minutes
export const getTimezoneOffsetMinutes = (timezone, date) => {
  try {
    // Create a date in the specified timezone
    const dateInTimezone = new Date(date.toLocaleString('en-US', { timeZone: timezone }));
    
    // Create a date in UTC
    const dateInUTC = new Date(date.toLocaleString('en-US', { timeZone: 'UTC' }));
    
    // Calculate the difference in minutes
    return (dateInTimezone.getTime() - dateInUTC.getTime()) / (1000 * 60);
  } catch (error) {
    return 0;
  }
};

export const getTimeRemaining = (endDate, timezone = 'UTC') => {
  if (!endDate) return 'No end date';
  
  try {
    const now = new Date();
    const end = new Date(endDate);
    
    // Adjust for timezone if needed
    if (timezone !== 'UTC') {
      const nowInTimezone = new Date(now.toLocaleString('en-US', { timeZone: timezone }));
      const endInTimezone = new Date(end.toLocaleString('en-US', { timeZone: timezone }));
      const diff = endInTimezone - nowInTimezone;
      
      if (diff <= 0) return 'Overdue';
      
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      
      if (days > 0) return `${days}d ${hours}h remaining`;
      if (hours > 0) return `${hours}h ${minutes}m remaining`;
      return `${minutes}m remaining`;
    } else {
      const diff = end - now;
      
      if (diff <= 0) return 'Overdue';
      
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      
      if (days > 0) return `${days}d ${hours}h remaining`;
      if (hours > 0) return `${hours}h ${minutes}m remaining`;
      return `${minutes}m remaining`;
    }
  } catch (error) {
    return 'Error calculating time';
  }
};

export const getUrgencyColor = (endDate, timezone = 'UTC') => {
  if (!endDate) return 'text-gray-600';
  
  try {
    const now = new Date();
    const end = new Date(endDate);
    
    // Adjust for timezone if needed
    if (timezone !== 'UTC') {
      const nowInTimezone = new Date(now.toLocaleString('en-US', { timeZone: timezone }));
      const endInTimezone = new Date(end.toLocaleString('en-US', { timeZone: timezone }));
      const diff = endInTimezone - nowInTimezone;
      const hours = diff / (1000 * 60 * 60);
      
      if (diff <= 0) return 'text-red-600';
      if (hours < 24) return 'text-orange-600';
      if (hours < 72) return 'text-yellow-600';
      return 'text-green-600';
    } else {
      const diff = end - now;
      const hours = diff / (1000 * 60 * 60);
      
      if (diff <= 0) return 'text-red-600';
      if (hours < 24) return 'text-orange-600';
      if (hours < 72) return 'text-yellow-600';
      return 'text-green-600';
    }
  } catch (error) {
    return 'text-gray-600';
  }
};
