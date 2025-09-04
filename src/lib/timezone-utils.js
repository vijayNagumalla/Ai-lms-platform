// Timezone utilities for the LMS platform - REBUILT VERSION
// This version prevents double conversion and handles timezone conversion correctly

// Country to timezone mapping
const COUNTRY_TIMEZONE_MAP = {
  'India': 'Asia/Kolkata',
  'india': 'Asia/Kolkata',
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
  'Chile': 'America/Santiago',
  'Argentina': 'America/Argentina/Buenos_Aires',
  'Uruguay': 'America/Montevideo',
  'Paraguay': 'America/Asuncion',
  'Bolivia': 'America/La_Paz',
  'Peru': 'America/Lima',
  'Ecuador': 'America/Guayaquil',
  'Colombia': 'America/Bogota',
  'Venezuela': 'America/Caracas',
  'Guyana': 'America/Guyana',
  'Suriname': 'America/Paramaribo',
  'French Guiana': 'America/Cayenne',
  'Falkland Islands': 'Atlantic/Stanley',
  'South Georgia': 'Atlantic/South_Georgia',
  'Antarctica': 'Antarctica/McMurdo',
  'Greenland': 'America/Godthab',
  'Faroe Islands': 'Atlantic/Faroe',
  'Svalbard': 'Arctic/Longyearbyen',
  'Jan Mayen': 'Arctic/Longyearbyen',
  'Bouvet Island': 'Antarctica/Bouvet',
  'Heard Island': 'Indian/Kerguelen',
  'French Southern Territories': 'Indian/Kerguelen',
  'South African Republic': 'Africa/Johannesburg',
  'Egypt': 'Africa/Cairo',
  'Libya': 'Africa/Tripoli',
  'Tunisia': 'Africa/Tunis',
  'Algeria': 'Africa/Algiers',
  'Morocco': 'Africa/Casablanca',
  'Western Sahara': 'Africa/El_Aaiun',
  'Mauritania': 'Africa/Nouakchott',
  'Senegal': 'Africa/Dakar',
  'Gambia': 'Africa/Banjul',
  'Guinea-Bissau': 'Africa/Bissau',
  'Guinea': 'Africa/Conakry',
  'Sierra Leone': 'Africa/Freetown',
  'Liberia': 'Africa/Monrovia',
  'Ivory Coast': 'Africa/Abidjan',
  'Ghana': 'Africa/Accra',
  'Togo': 'Africa/Lome',
  'Benin': 'Africa/Porto-Novo',
  'Nigeria': 'Africa/Lagos',
  'Niger': 'Africa/Niamey',
  'Burkina Faso': 'Africa/Ouagadougou',
  'Mali': 'Africa/Bamako',
  'Chad': 'Africa/Ndjamena',
  'Central African Republic': 'Africa/Bangui',
  'Cameroon': 'Africa/Douala',
  'Equatorial Guinea': 'Africa/Malabo',
  'Gabon': 'Africa/Libreville',
  'Republic of the Congo': 'Africa/Brazzaville',
  'Democratic Republic of the Congo': 'Africa/Kinshasa',
  'Angola': 'Africa/Luanda',
  'Zambia': 'Africa/Lusaka',
  'Malawi': 'Africa/Blantyre',
  'Mozambique': 'Africa/Maputo',
  'Zimbabwe': 'Africa/Harare',
  'Botswana': 'Africa/Gaborone',
  'Namibia': 'Africa/Windhoek',
  'Lesotho': 'Africa/Maseru',
  'Eswatini': 'Africa/Mbabane',
  'Madagascar': 'Indian/Antananarivo',
  'Comoros': 'Indian/Comoro',
  'Mayotte': 'Indian/Mayotte',
  'Seychelles': 'Indian/Mahe',
  'Mauritius': 'Indian/Mauritius',
  'Reunion': 'Indian/Reunion',
  'Saint Helena': 'Atlantic/St_Helena',
  'Ascension Island': 'Atlantic/St_Helena',
  'Tristan da Cunha': 'Atlantic/St_Helena',
  'Cape Verde': 'Atlantic/Cape_Verde',
  'Sao Tome and Principe': 'Africa/Sao_Tome'
};

/**
 * Get timezone for a given country
 * @param {string} country - Country name
 * @returns {string} Timezone string
 */
export const getTimezoneForCountry = (country) => {
  if (!country) return 'UTC';
  
  // Try exact match first
  if (COUNTRY_TIMEZONE_MAP[country]) {
    return COUNTRY_TIMEZONE_MAP[country];
  }
  
  // Try case-insensitive match
  const countryLower = country.toLowerCase();
  for (const [key, value] of Object.entries(COUNTRY_TIMEZONE_MAP)) {
    if (key.toLowerCase() === countryLower) {
      return value;
    }
  }
  
  // Return UTC as fallback
  return 'UTC';
};

/**
 * Get user's timezone based on their country or browser timezone
 * @param {Object} user - User object with country field
 * @returns {string} Timezone string
 */
export const getUserTimezone = (user) => {
  // If user has a country, use that
  if (user?.country) {
    return getTimezoneForCountry(user.country);
  }
  
  // Fallback to browser timezone
  return Intl.DateTimeFormat().resolvedOptions().timeZone;
};

/**
 * Convert assessment time from assessment timezone to user's local timezone
 * This is the MAIN function that handles timezone conversion correctly
 * @param {string} dateString - Assessment date string (YYYY-MM-DD) or full ISO datetime
 * @param {string} timeString - Assessment time string (HH:MM or HH:MM:SS or HH:MM:SS.SSSZ)
 * @param {string} assessmentTimezone - Assessment timezone
 * @param {string} userTimezone - User timezone
 * @returns {string} Formatted local time string
 */
export const convertAssessmentTimeToUserTimezone = (dateString, timeString, assessmentTimezone, userTimezone) => {
  if (!dateString || !timeString || !assessmentTimezone || !userTimezone) {
    return 'N/A';
  }
  
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
    
    // Create a proper date string
    const dateTimeString = `${cleanDateString}T${cleanTimeString}`;
    
    // Create a Date object
    const date = new Date(dateTimeString);
    
    // Check if the date is valid
    if (isNaN(date.getTime())) {
      return 'Invalid Date';
    }
    
    // Format the date in the user's timezone
    // This automatically handles the timezone conversion
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
 * Format assessment time range in user's timezone
 * @param {string} startDate - Assessment start date
 * @param {string} startTime - Assessment start time
 * @param {string} endDate - Assessment end date
 * @param {string} endTime - Assessment end time
 * @param {string} assessmentTimezone - Assessment timezone
 * @param {string} userTimezone - User timezone
 * @returns {string} Formatted time range string
 */
export const formatAssessmentTimeRange = (startDate, startTime, endDate, endTime, assessmentTimezone, userTimezone) => {
  if (!startDate || !startTime || !endDate || !endTime) return 'No times set';
  
  try {
    const startFormatted = convertAssessmentTimeToUserTimezone(startDate, startTime, assessmentTimezone, userTimezone);
    const endFormatted = convertAssessmentTimeToUserTimezone(endDate, endTime, assessmentTimezone, userTimezone);
    
    return `${startFormatted} - ${endFormatted}`;
  } catch (error) {
    return 'Invalid times';
  }
};

/**
 * Format date and time in user's timezone
 * @param {string} dateString - ISO date string
 * @param {string} userTimezone - User's timezone
 * @returns {string} Formatted date string
 */
export const formatDateTimeInUserTimezone = (dateString, userTimezone) => {
  if (!dateString) return 'N/A';
  
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'Invalid Date';
    
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
      timeZone: userTimezone
    });
  } catch (error) {
    return 'Invalid Date';
  }
};

/**
 * Get timezone offset string
 * @param {string} timezone - Timezone string
 * @returns {string} Timezone offset string (e.g., "+05:30", "-08:00")
 */
export const getTimezoneOffset = (timezone) => {
  try {
    const date = new Date();
    const offset = date.toLocaleString('en-US', { timeZone: timezone, timeZoneName: 'short' });
    return offset.split(' ').pop() || '';
  } catch (error) {
    return '';
  }
};

/**
 * Check if a date is in the past
 * @param {string} dateString - Date string (YYYY-MM-DD) or full ISO datetime
 * @param {string} timeString - Time string (HH:MM or HH:MM:SS or HH:MM:SS.SSSZ)
 * @param {string} timezone - Timezone string
 * @returns {boolean} True if the date is in the past
 */
export const isDateInPast = (dateString, timeString, timezone) => {
  if (!dateString || !timeString) return false;
  
  try {
    // Clean up the date string - extract just the date part if it's a full ISO datetime
    let cleanDateString = dateString;
    
    // If dateString contains time info (like T18:30:00.000Z), extract just the date part
    if (cleanDateString.includes('T')) {
      cleanDateString = cleanDateString.split('T')[0];
    }
    
    // Ensure we have a valid date format (YYYY-MM-DD)
    if (!/^\d{4}-\d{2}-\d{2}$/.test(cleanDateString)) {
      return false;
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
      return false;
    }
    
    const dateTimeString = `${cleanDateString}T${cleanTimeString}`;
    const date = new Date(dateTimeString);
    
    if (isNaN(date.getTime())) return false;
    
    const now = new Date();
    return date < now;
  } catch (error) {
    return false;
  }
};

/**
 * Check if a date is in the future
 * @param {string} dateString - Date string (YYYY-MM-DD) or full ISO datetime
 * @param {string} timeString - Time string (HH:MM or HH:MM:SS or HH:MM:SS.SSSZ)
 * @param {string} timezone - Timezone string
 * @returns {boolean} True if the date is in the future
 */
export const isDateInFuture = (dateString, timeString, timezone) => {
  if (!dateString || !timeString) return false;
  
  try {
    // Clean up the date string - extract just the date part if it's a full ISO datetime
    let cleanDateString = dateString;
    
    // If dateString contains time info (like T18:30:00.000Z), extract just the date part
    if (cleanDateString.includes('T')) {
      cleanDateString = cleanDateString.split('T')[0];
    }
    
    // Ensure we have a valid date format (YYYY-MM-DD)
    if (!/^\d{4}-\d{2}-\d{2}$/.test(cleanDateString)) {
      return false;
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
      return false;
    }
    
    const dateTimeString = `${cleanDateString}T${cleanTimeString}`;
    const date = new Date(dateTimeString);
    
    if (isNaN(date.getTime())) return false;
    
    const now = new Date();
    return date > now;
  } catch (error) {
    return false;
  }
};

/**
 * Get time remaining until a date
 * @param {string} dateString - Date string (YYYY-MM-DD) or full ISO datetime
 * @param {string} timeString - Time string (HH:MM or HH:MM:SS or HH:MM:SS.SSSZ)
 * @param {string} timezone - Timezone string
 * @returns {Object} Object with days, hours, minutes remaining
 */
export const getTimeRemaining = (dateString, timeString, timezone) => {
  if (!dateString || !timeString) return { days: 0, hours: 0, minutes: 0 };
  
  try {
    // Clean up the date string - extract just the date part if it's a full ISO datetime
    let cleanDateString = dateString;
    
    // If dateString contains time info (like T18:30:00.000Z), extract just the date part
    if (cleanDateString.includes('T')) {
      cleanDateString = cleanDateString.split('T')[0];
    }
    
    // Ensure we have a valid date format (YYYY-MM-DD)
    if (!/^\d{4}-\d{2}-\d{2}$/.test(cleanDateString)) {
      return { days: 0, hours: 0, minutes: 0 };
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
      return { days: 0, hours: 0, minutes: 0 };
    }
    
    const dateTimeString = `${cleanDateString}T${cleanTimeString}`;
    const targetDate = new Date(dateTimeString);
    
    if (isNaN(targetDate.getTime())) {
      return { days: 0, hours: 0, minutes: 0 };
    }
    
    const now = new Date();
    const diff = targetDate - now;
    
    if (diff <= 0) {
      return { days: 0, hours: 0, minutes: 0 };
    }
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    return { days, hours, minutes };
  } catch (error) {
    return { days: 0, hours: 0, minutes: 0 };
  }
};

 