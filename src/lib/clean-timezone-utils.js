// Clean timezone utilities for assessment display

// Country to timezone mapping
const COUNTRY_TIMEZONE_MAP = {
  'India': 'Asia/Kolkata',
  'india': 'Asia/Kolkata', // Handle lowercase
  'United States': 'America/New_York',
  'Canada': 'America/Toronto',
  'United Kingdom': 'Europe/London',
  'Germany': 'Europe/Berlin',
  'France': 'Europe/Paris',
  'Australia': 'Australia/Sydney',
  'Japan': 'Asia/Tokyo',
  'China': 'Asia/Shanghai',
  'South Korea': 'Asia/Seoul',
  'Singapore': 'Asia/Singapore',
  'Brazil': 'America/Sao_Paulo',
  'Mexico': 'America/Mexico_City',
  'South Africa': 'Africa/Johannesburg',
  'Russia': 'Europe/Moscow',
  'Italy': 'Europe/Rome',
  'Spain': 'Europe/Madrid',
  'Netherlands': 'Europe/Amsterdam',
  'Sweden': 'Europe/Stockholm',
  'Norway': 'Europe/Oslo',
  'Denmark': 'Europe/Copenhagen',
  'Finland': 'Europe/Helsinki',
  'Poland': 'Europe/Warsaw',
  'Czech Republic': 'Europe/Prague',
  'Hungary': 'Europe/Budapest',
  'Austria': 'Europe/Vienna',
  'Switzerland': 'Europe/Zurich',
  'Belgium': 'Europe/Brussels',
  'Ireland': 'Europe/Dublin',
  'Portugal': 'Europe/Lisbon',
  'Greece': 'Europe/Athens',
  'Turkey': 'Europe/Istanbul',
  'Ukraine': 'Europe/Kiev',
  'Romania': 'Europe/Bucharest',
  'Bulgaria': 'Europe/Sofia',
  'Croatia': 'Europe/Zagreb',
  'Slovenia': 'Europe/Ljubljana',
  'Slovakia': 'Europe/Bratislava',
  'Lithuania': 'Europe/Vilnius',
  'Latvia': 'Europe/Riga',
  'Estonia': 'Europe/Tallinn',
  'Iceland': 'Atlantic/Reykjavik',
  'Malta': 'Europe/Malta',
  'Cyprus': 'Asia/Nicosia',
  'Luxembourg': 'Europe/Luxembourg',
  'Monaco': 'Europe/Monaco',
  'Liechtenstein': 'Europe/Vaduz',
  'Andorra': 'Europe/Andorra',
  'San Marino': 'Europe/San_Marino',
  'Vatican City': 'Europe/Vatican',
  'Albania': 'Europe/Tirane',
  'Bosnia and Herzegovina': 'Europe/Sarajevo',
  'Montenegro': 'Europe/Podgorica',
  'North Macedonia': 'Europe/Skopje',
  'Serbia': 'Europe/Belgrade',
  'Kosovo': 'Europe/Belgrade',
  'Moldova': 'Europe/Chisinau',
  'Georgia': 'Asia/Tbilisi',
  'Armenia': 'Asia/Yerevan',
  'Azerbaijan': 'Asia/Baku',
  'Kazakhstan': 'Asia/Almaty',
  'Uzbekistan': 'Asia/Tashkent',
  'Kyrgyzstan': 'Asia/Bishkek',
  'Tajikistan': 'Asia/Dushanbe',
  'Turkmenistan': 'Asia/Ashgabat',
  'Mongolia': 'Asia/Ulaanbaatar',
  'Vietnam': 'Asia/Ho_Chi_Minh',
  'Thailand': 'Asia/Bangkok',
  'Malaysia': 'Asia/Kuala_Lumpur',
  'Indonesia': 'Asia/Jakarta',
  'Philippines': 'Asia/Manila',
  'Myanmar': 'Asia/Yangon',
  'Cambodia': 'Asia/Phnom_Penh',
  'Laos': 'Asia/Vientiane',
  'Brunei': 'Asia/Brunei',
  'East Timor': 'Asia/Dili',
  'Papua New Guinea': 'Pacific/Port_Moresby',
  'Fiji': 'Pacific/Fiji',
  'New Zealand': 'Pacific/Auckland',
  'Vanuatu': 'Pacific/Efate',
  'Solomon Islands': 'Pacific/Guadalcanal',
  'New Caledonia': 'Pacific/Noumea',
  'French Polynesia': 'Pacific/Tahiti',
  'Samoa': 'Pacific/Apia',
  'Tonga': 'Pacific/Tongatapu',
  'Cook Islands': 'Pacific/Rarotonga',
  'Niue': 'Pacific/Niue',
  'Tokelau': 'Pacific/Fakaofo',
  'Tuvalu': 'Pacific/Funafuti',
  'Kiribati': 'Pacific/Tarawa',
  'Marshall Islands': 'Pacific/Majuro',
  'Micronesia': 'Pacific/Pohnpei',
  'Palau': 'Pacific/Palau',
  'Nauru': 'Pacific/Nauru',
  'Chile': 'America/Santiago'
};

/**
 * Get timezone for a user based on their country or browser timezone
 * @param {Object} user - User object with country property
 * @returns {string} Timezone string
 */
export const getUserTimezone = (user) => {
  if (!user) return 'UTC';
  
  let timezone = 'UTC';
  
  if (user.country) {
    timezone = getTimezoneForCountry(user.country);
  }
  
  if (timezone === 'UTC') {
    const browserTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    timezone = browserTimezone || 'UTC';
  }
  
  return timezone;
};

/**
 * Get timezone for a country
 * @param {string} country - Country name
 * @returns {string} Timezone string
 */
export const getTimezoneForCountry = (country) => {
  if (!country) return 'UTC';
  
  const normalizedCountry = country.toLowerCase().trim();
  return COUNTRY_TIMEZONE_MAP[normalizedCountry] || 'UTC';
};

/**
 * Format assessment time for display
 * @param {string} dateString - Date string (YYYY-MM-DD) or full ISO datetime
 * @param {string} timeString - Time string (HH:MM or HH:MM:SS or HH:MM:SS.SSSZ)
 * @param {string} assessmentTimezone - Assessment timezone
 * @param {string} userTimezone - User timezone
 * @returns {string} Formatted time string
 */
export const formatAssessmentTime = (dateString, timeString, assessmentTimezone, userTimezone) => {
  if (!dateString || !timeString) return 'N/A';
  
  try {
    // Clean up the date string - extract just the date part if it's a full ISO datetime
    let cleanDateString = dateString;
    
    // If dateString contains time info (like T18:30:00.000Z), extract just the date part
    if (cleanDateString.includes('T')) {
      cleanDateString = cleanDateString.split('T')[0];
    }
    
    // Ensure we have a valid date format (YYYY-MM-DD)
    if (!/^\d{4}-\d{2}-\d{2}$/.test(cleanDateString)) {
      return 'Invalid Date';
    }
    
    // Clean up the time string - remove any timezone info and ensure it's just HH:MM or HH:MM:SS
    let cleanTimeString = timeString;
    
    // If time string contains timezone info (like .000Z or T), extract just the time part
    if (cleanTimeString.includes('T')) {
      // Extract time part after the last T
      const parts = cleanTimeString.split('T');
      cleanTimeString = parts[parts.length - 1];
    }
    
    // Remove timezone suffix if present (like .000Z, +00:00, -05:00)
    cleanTimeString = cleanTimeString.replace(/[+-]\d{2}:\d{2}$/, ''); // Remove +00:00 or -05:00
    cleanTimeString = cleanTimeString.replace(/\.\d{3}Z?$/, ''); // Remove .000Z
    
    // Ensure we have a valid time format (HH:MM or HH:MM:SS)
    if (!/^\d{1,2}:\d{2}(:\d{2})?$/.test(cleanTimeString)) {
      return 'Invalid Time';
    }
    
    // Create the date string
    const dateTimeString = `${cleanDateString}T${cleanTimeString}`;
    
    // Create a Date object - this will be interpreted as local time
    const date = new Date(dateTimeString);
    
    // Check if the date is valid
    if (isNaN(date.getTime())) {
      return 'Invalid Date';
    }
    
    // Format the date in the user's timezone
    const formattedDate = date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
      timeZone: userTimezone
    });
    
    return formattedDate;
  } catch (error) {
    return 'Invalid Date';
  }
};

/**
 * Calculate time remaining until assessment end
 * @param {string} dateString - End date string (YYYY-MM-DD) or full ISO datetime
 * @param {string} timeString - End time string (HH:MM or HH:MM:SS or HH:MM:SS.SSSZ)
 * @param {string} timezone - Assessment timezone
 * @returns {string} Time remaining string
 */
export const getAssessmentTimeRemaining = (dateString, timeString, timezone) => {
  if (!dateString || !timeString) return 'No end date';
  
  try {
    // Clean up the date string - extract just the date part if it's a full ISO datetime
    let cleanDateString = dateString;
    
    // If dateString contains time info (like T18:30:00.000Z), extract just the date part
    if (cleanDateString.includes('T')) {
      cleanDateString = cleanDateString.split('T')[0];
    }
    
    // Ensure we have a valid date format (YYYY-MM-DD)
    if (!/^\d{4}-\d{2}-\d{2}$/.test(cleanDateString)) {
      return 'Invalid end date';
    }
    
    // Clean up the time string - remove any timezone info and ensure it's just HH:MM or HH:MM:SS
    let cleanTimeString = timeString;
    
    // If time string contains timezone info (like .000Z or T), extract just the time part
    if (cleanTimeString.includes('T')) {
      // Extract time part after the last T
      const parts = cleanTimeString.split('T');
      cleanTimeString = parts[parts.length - 1];
    }
    
    // Remove timezone suffix if present (like .000Z, +00:00, -05:00)
    cleanTimeString = cleanTimeString.replace(/[+-]\d{2}:\d{2}$/, ''); // Remove +00:00 or -05:00
    cleanTimeString = cleanTimeString.replace(/\.\d{3}Z?$/, ''); // Remove .000Z
    
    // Ensure we have a valid time format (HH:MM or HH:MM:SS)
    if (!/^\d{1,2}:\d{2}(:\d{2})?$/.test(cleanTimeString)) {
      return 'Invalid end date';
    }
    
    const now = new Date();
    const endDateTime = `${cleanDateString}T${cleanTimeString}`;
    const endDate = new Date(endDateTime);
    
    if (isNaN(endDate.getTime())) {
      return 'Invalid end date';
    }
    
    const diff = endDate - now;
    
    if (diff <= 0) return 'Overdue';
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    if (days > 0) return `${days}d ${hours}h remaining`;
    if (hours > 0) return `${hours}h ${minutes}m remaining`;
    return `${minutes}m remaining`;
  } catch (error) {
    return 'Error calculating time';
  }
}; 