import React, { useState, useMemo } from 'react';
import { Check, ChevronsUpDown, Globe } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

// Comprehensive country data with timezone mapping
const COUNTRIES = [
  { code: 'IN', name: 'India', timezone: 'Asia/Kolkata', flag: '🇮🇳' },
  { code: 'US', name: 'United States', timezone: 'America/New_York', flag: '🇺🇸' },
  { code: 'CA', name: 'Canada', timezone: 'America/Toronto', flag: '🇨🇦' },
  { code: 'GB', name: 'United Kingdom', timezone: 'Europe/London', flag: '🇬🇧' },
  { code: 'DE', name: 'Germany', timezone: 'Europe/Berlin', flag: '🇩🇪' },
  { code: 'FR', name: 'France', timezone: 'Europe/Paris', flag: '🇫🇷' },
  { code: 'AU', name: 'Australia', timezone: 'Australia/Sydney', flag: '🇦🇺' },
  { code: 'JP', name: 'Japan', timezone: 'Asia/Tokyo', flag: '🇯🇵' },
  { code: 'CN', name: 'China', timezone: 'Asia/Shanghai', flag: '🇨🇳' },
  { code: 'KR', name: 'South Korea', timezone: 'Asia/Seoul', flag: '🇰🇷' },
  { code: 'SG', name: 'Singapore', timezone: 'Asia/Singapore', flag: '🇸🇬' },
  { code: 'BR', name: 'Brazil', timezone: 'America/Sao_Paulo', flag: '🇧🇷' },
  { code: 'MX', name: 'Mexico', timezone: 'America/Mexico_City', flag: '🇲🇽' },
  { code: 'ZA', name: 'South Africa', timezone: 'Africa/Johannesburg', flag: '🇿🇦' },
  { code: 'RU', name: 'Russia', timezone: 'Europe/Moscow', flag: '🇷🇺' },
  { code: 'IT', name: 'Italy', timezone: 'Europe/Rome', flag: '🇮🇹' },
  { code: 'ES', name: 'Spain', timezone: 'Europe/Madrid', flag: '🇪🇸' },
  { code: 'NL', name: 'Netherlands', timezone: 'Europe/Amsterdam', flag: '🇳🇱' },
  { code: 'SE', name: 'Sweden', timezone: 'Europe/Stockholm', flag: '🇸🇪' },
  { code: 'NO', name: 'Norway', timezone: 'Europe/Oslo', flag: '🇳🇴' },
  { code: 'DK', name: 'Denmark', timezone: 'Europe/Copenhagen', flag: '🇩🇰' },
  { code: 'FI', name: 'Finland', timezone: 'Europe/Helsinki', flag: '🇫🇮' },
  { code: 'PL', name: 'Poland', timezone: 'Europe/Warsaw', flag: '🇵🇱' },
  { code: 'CZ', name: 'Czech Republic', timezone: 'Europe/Prague', flag: '🇨🇿' },
  { code: 'HU', name: 'Hungary', timezone: 'Europe/Budapest', flag: '🇭🇺' },
  { code: 'AT', name: 'Austria', timezone: 'Europe/Vienna', flag: '🇦🇹' },
  { code: 'CH', name: 'Switzerland', timezone: 'Europe/Zurich', flag: '🇨🇭' },
  { code: 'BE', name: 'Belgium', timezone: 'Europe/Brussels', flag: '🇧🇪' },
  { code: 'IE', name: 'Ireland', timezone: 'Europe/Dublin', flag: '🇮🇪' },
  { code: 'PT', name: 'Portugal', timezone: 'Europe/Lisbon', flag: '🇵🇹' },
  { code: 'GR', name: 'Greece', timezone: 'Europe/Athens', flag: '🇬🇷' },
  { code: 'TR', name: 'Turkey', timezone: 'Europe/Istanbul', flag: '🇹🇷' },
  { code: 'UA', name: 'Ukraine', timezone: 'Europe/Kiev', flag: '🇺🇦' },
  { code: 'RO', name: 'Romania', timezone: 'Europe/Bucharest', flag: '🇷🇴' },
  { code: 'BG', name: 'Bulgaria', timezone: 'Europe/Sofia', flag: '🇧🇬' },
  { code: 'HR', name: 'Croatia', timezone: 'Europe/Zagreb', flag: '🇭🇷' },
  { code: 'SI', name: 'Slovenia', timezone: 'Europe/Ljubljana', flag: '🇸🇮' },
  { code: 'SK', name: 'Slovakia', timezone: 'Europe/Bratislava', flag: '🇸🇰' },
  { code: 'LT', name: 'Lithuania', timezone: 'Europe/Vilnius', flag: '🇱🇹' },
  { code: 'LV', name: 'Latvia', timezone: 'Europe/Riga', flag: '🇱🇻' },
  { code: 'EE', name: 'Estonia', timezone: 'Europe/Tallinn', flag: '🇪🇪' },
  { code: 'IS', name: 'Iceland', timezone: 'Atlantic/Reykjavik', flag: '🇮🇸' },
  { code: 'MT', name: 'Malta', timezone: 'Europe/Malta', flag: '🇲🇹' },
  { code: 'CY', name: 'Cyprus', timezone: 'Asia/Nicosia', flag: '🇨🇾' },
  { code: 'LU', name: 'Luxembourg', timezone: 'Europe/Luxembourg', flag: '🇱🇺' },
  { code: 'MC', name: 'Monaco', timezone: 'Europe/Monaco', flag: '🇲🇨' },
  { code: 'LI', name: 'Liechtenstein', timezone: 'Europe/Vaduz', flag: '🇱🇮' },
  { code: 'AD', name: 'Andorra', timezone: 'Europe/Andorra', flag: '🇦🇩' },
  { code: 'SM', name: 'San Marino', timezone: 'Europe/San_Marino', flag: '🇸🇲' },
  { code: 'VA', name: 'Vatican City', timezone: 'Europe/Vatican', flag: '🇻🇦' },
  { code: 'AL', name: 'Albania', timezone: 'Europe/Tirane', flag: '🇦🇱' },
  { code: 'BA', name: 'Bosnia and Herzegovina', timezone: 'Europe/Sarajevo', flag: '🇧🇦' },
  { code: 'ME', name: 'Montenegro', timezone: 'Europe/Podgorica', flag: '🇲🇪' },
  { code: 'MK', name: 'North Macedonia', timezone: 'Europe/Skopje', flag: '🇲🇰' },
  { code: 'RS', name: 'Serbia', timezone: 'Europe/Belgrade', flag: '🇷🇸' },
  { code: 'XK', name: 'Kosovo', timezone: 'Europe/Belgrade', flag: '🇽🇰' },
  { code: 'MD', name: 'Moldova', timezone: 'Europe/Chisinau', flag: '🇲🇩' },
  { code: 'GE', name: 'Georgia', timezone: 'Asia/Tbilisi', flag: '🇬🇪' },
  { code: 'AM', name: 'Armenia', timezone: 'Asia/Yerevan', flag: '🇦🇲' },
  { code: 'AZ', name: 'Azerbaijan', timezone: 'Asia/Baku', flag: '🇦🇿' },
  { code: 'KZ', name: 'Kazakhstan', timezone: 'Asia/Almaty', flag: '🇰🇿' },
  { code: 'UZ', name: 'Uzbekistan', timezone: 'Asia/Tashkent', flag: '🇺🇿' },
  { code: 'KG', name: 'Kyrgyzstan', timezone: 'Asia/Bishkek', flag: '🇰🇬' },
  { code: 'TJ', name: 'Tajikistan', timezone: 'Asia/Dushanbe', flag: '🇹🇯' },
  { code: 'TM', name: 'Turkmenistan', timezone: 'Asia/Ashgabat', flag: '🇹🇲' },
  { code: 'MN', name: 'Mongolia', timezone: 'Asia/Ulaanbaatar', flag: '🇲🇳' },
  { code: 'VN', name: 'Vietnam', timezone: 'Asia/Ho_Chi_Minh', flag: '🇻🇳' },
  { code: 'TH', name: 'Thailand', timezone: 'Asia/Bangkok', flag: '🇹🇭' },
  { code: 'MY', name: 'Malaysia', timezone: 'Asia/Kuala_Lumpur', flag: '🇲🇾' },
  { code: 'ID', name: 'Indonesia', timezone: 'Asia/Jakarta', flag: '🇮🇩' },
  { code: 'PH', name: 'Philippines', timezone: 'Asia/Manila', flag: '🇵🇭' },
  { code: 'MM', name: 'Myanmar', timezone: 'Asia/Yangon', flag: '🇲🇲' },
  { code: 'KH', name: 'Cambodia', timezone: 'Asia/Phnom_Penh', flag: '🇰🇭' },
  { code: 'LA', name: 'Laos', timezone: 'Asia/Vientiane', flag: '🇱🇦' },
  { code: 'BN', name: 'Brunei', timezone: 'Asia/Brunei', flag: '🇧🇳' },
  { code: 'TL', name: 'East Timor', timezone: 'Asia/Dili', flag: '🇹🇱' },
  { code: 'PG', name: 'Papua New Guinea', timezone: 'Pacific/Port_Moresby', flag: '🇵🇬' },
  { code: 'FJ', name: 'Fiji', timezone: 'Pacific/Fiji', flag: '🇫🇯' },
  { code: 'NZ', name: 'New Zealand', timezone: 'Pacific/Auckland', flag: '🇳🇿' },
  { code: 'VU', name: 'Vanuatu', timezone: 'Pacific/Efate', flag: '🇻🇺' },
  { code: 'SB', name: 'Solomon Islands', timezone: 'Pacific/Guadalcanal', flag: '🇸🇧' },
  { code: 'NC', name: 'New Caledonia', timezone: 'Pacific/Noumea', flag: '🇳🇨' },
  { code: 'PF', name: 'French Polynesia', timezone: 'Pacific/Tahiti', flag: '🇵🇫' },
  { code: 'WS', name: 'Samoa', timezone: 'Pacific/Apia', flag: '🇼🇸' },
  { code: 'TO', name: 'Tonga', timezone: 'Pacific/Tongatapu', flag: '🇹🇴' },
  { code: 'CK', name: 'Cook Islands', timezone: 'Pacific/Rarotonga', flag: '🇨🇰' },
  { code: 'NU', name: 'Niue', timezone: 'Pacific/Niue', flag: '🇳🇺' },
  { code: 'TK', name: 'Tokelau', timezone: 'Pacific/Fakaofo', flag: '🇹🇰' },
  { code: 'TV', name: 'Tuvalu', timezone: 'Pacific/Funafuti', flag: '🇹🇻' },
  { code: 'KI', name: 'Kiribati', timezone: 'Pacific/Tarawa', flag: '🇰🇮' },
  { code: 'MH', name: 'Marshall Islands', timezone: 'Pacific/Majuro', flag: '🇲🇭' },
  { code: 'FM', name: 'Micronesia', timezone: 'Pacific/Pohnpei', flag: '🇫🇲' },
  { code: 'PW', name: 'Palau', timezone: 'Pacific/Palau', flag: '🇵🇼' },
  { code: 'NR', name: 'Nauru', timezone: 'Pacific/Nauru', flag: '🇳🇷' },
  { code: 'CL', name: 'Chile', timezone: 'America/Santiago', flag: '🇨🇱' },
  { code: 'AR', name: 'Argentina', timezone: 'America/Argentina/Buenos_Aires', flag: '🇦🇷' },
  { code: 'UY', name: 'Uruguay', timezone: 'America/Montevideo', flag: '🇺🇾' },
  { code: 'PY', name: 'Paraguay', timezone: 'America/Asuncion', flag: '🇵🇾' },
  { code: 'BO', name: 'Bolivia', timezone: 'America/La_Paz', flag: '🇧🇴' },
  { code: 'PE', name: 'Peru', timezone: 'America/Lima', flag: '🇵🇪' },
  { code: 'EC', name: 'Ecuador', timezone: 'America/Guayaquil', flag: '🇪🇨' },
  { code: 'CO', name: 'Colombia', timezone: 'America/Bogota', flag: '🇨🇴' },
  { code: 'VE', name: 'Venezuela', timezone: 'America/Caracas', flag: '🇻🇪' },
  { code: 'GY', name: 'Guyana', timezone: 'America/Guyana', flag: '🇬🇾' },
  { code: 'SR', name: 'Suriname', timezone: 'America/Paramaribo', flag: '🇸🇷' },
  { code: 'GF', name: 'French Guiana', timezone: 'America/Cayenne', flag: '🇬🇫' },
  { code: 'FK', name: 'Falkland Islands', timezone: 'Atlantic/Stanley', flag: '🇫🇰' },
  { code: 'GS', name: 'South Georgia', timezone: 'Atlantic/South_Georgia', flag: '🇬🇸' },
  { code: 'AQ', name: 'Antarctica', timezone: 'Antarctica/McMurdo', flag: '🇦🇶' },
  { code: 'GL', name: 'Greenland', timezone: 'America/Godthab', flag: '🇬🇱' },
  { code: 'FO', name: 'Faroe Islands', timezone: 'Atlantic/Faroe', flag: '🇫🇴' },
  { code: 'SJ', name: 'Svalbard', timezone: 'Arctic/Longyearbyen', flag: '🇸🇯' },
  { code: 'BV', name: 'Bouvet Island', timezone: 'Antarctica/Bouvet', flag: '🇧🇻' },
  { code: 'HM', name: 'Heard Island', timezone: 'Indian/Kerguelen', flag: '🇭🇲' },
  { code: 'TF', name: 'French Southern Territories', timezone: 'Indian/Kerguelen', flag: '🇹🇫' },
  { code: 'EG', name: 'Egypt', timezone: 'Africa/Cairo', flag: '🇪🇬' },
  { code: 'LY', name: 'Libya', timezone: 'Africa/Tripoli', flag: '🇱🇾' },
  { code: 'TN', name: 'Tunisia', timezone: 'Africa/Tunis', flag: '🇹🇳' },
  { code: 'DZ', name: 'Algeria', timezone: 'Africa/Algiers', flag: '🇩🇿' },
  { code: 'MA', name: 'Morocco', timezone: 'Africa/Casablanca', flag: '🇲🇦' },
  { code: 'EH', name: 'Western Sahara', timezone: 'Africa/El_Aaiun', flag: '🇪🇭' },
  { code: 'MR', name: 'Mauritania', timezone: 'Africa/Nouakchott', flag: '🇲🇷' },
  { code: 'SN', name: 'Senegal', timezone: 'Africa/Dakar', flag: '🇸🇳' },
  { code: 'GM', name: 'Gambia', timezone: 'Africa/Banjul', flag: '🇬🇲' },
  { code: 'GW', name: 'Guinea-Bissau', timezone: 'Africa/Bissau', flag: '🇬🇼' },
  { code: 'GN', name: 'Guinea', timezone: 'Africa/Conakry', flag: '🇬🇳' },
  { code: 'SL', name: 'Sierra Leone', timezone: 'Africa/Freetown', flag: '🇸🇱' },
  { code: 'LR', name: 'Liberia', timezone: 'Africa/Monrovia', flag: '🇱🇷' },
  { code: 'CI', name: 'Ivory Coast', timezone: 'Africa/Abidjan', flag: '🇨🇮' },
  { code: 'GH', name: 'Ghana', timezone: 'Africa/Accra', flag: '🇬🇭' },
  { code: 'TG', name: 'Togo', timezone: 'Africa/Lome', flag: '🇹🇬' },
  { code: 'BJ', name: 'Benin', timezone: 'Africa/Porto-Novo', flag: '🇧🇯' },
  { code: 'NG', name: 'Nigeria', timezone: 'Africa/Lagos', flag: '🇳🇬' },
  { code: 'NE', name: 'Niger', timezone: 'Africa/Niamey', flag: '🇳🇪' },
  { code: 'BF', name: 'Burkina Faso', timezone: 'Africa/Ouagadougou', flag: '🇧🇫' },
  { code: 'ML', name: 'Mali', timezone: 'Africa/Bamako', flag: '🇲🇱' },
  { code: 'TD', name: 'Chad', timezone: 'Africa/Ndjamena', flag: '🇹🇩' },
  { code: 'CF', name: 'Central African Republic', timezone: 'Africa/Bangui', flag: '🇨🇫' },
  { code: 'CM', name: 'Cameroon', timezone: 'Africa/Douala', flag: '🇨🇲' },
  { code: 'GQ', name: 'Equatorial Guinea', timezone: 'Africa/Malabo', flag: '🇬🇶' },
  { code: 'GA', name: 'Gabon', timezone: 'Africa/Libreville', flag: '🇬🇦' },
  { code: 'CG', name: 'Republic of the Congo', timezone: 'Africa/Brazzaville', flag: '🇨🇬' },
  { code: 'CD', name: 'Democratic Republic of the Congo', timezone: 'Africa/Kinshasa', flag: '🇨🇩' },
  { code: 'AO', name: 'Angola', timezone: 'Africa/Luanda', flag: '🇦🇴' },
  { code: 'ZM', name: 'Zambia', timezone: 'Africa/Lusaka', flag: '🇿🇲' },
  { code: 'MW', name: 'Malawi', timezone: 'Africa/Blantyre', flag: '🇲🇼' },
  { code: 'MZ', name: 'Mozambique', timezone: 'Africa/Maputo', flag: '🇲🇿' },
  { code: 'ZW', name: 'Zimbabwe', timezone: 'Africa/Harare', flag: '🇿🇼' },
  { code: 'BW', name: 'Botswana', timezone: 'Africa/Gaborone', flag: '🇧🇼' },
  { code: 'NA', name: 'Namibia', timezone: 'Africa/Windhoek', flag: '🇳🇦' },
  { code: 'LS', name: 'Lesotho', timezone: 'Africa/Maseru', flag: '🇱🇸' },
  { code: 'SZ', name: 'Eswatini', timezone: 'Africa/Mbabane', flag: '🇸🇿' },
  { code: 'MG', name: 'Madagascar', timezone: 'Indian/Antananarivo', flag: '🇲🇬' },
  { code: 'KM', name: 'Comoros', timezone: 'Indian/Comoro', flag: '🇰🇲' },
  { code: 'YT', name: 'Mayotte', timezone: 'Indian/Mayotte', flag: '🇾🇹' },
  { code: 'SC', name: 'Seychelles', timezone: 'Indian/Mahe', flag: '🇸🇨' },
  { code: 'MU', name: 'Mauritius', timezone: 'Indian/Mauritius', flag: '🇲🇺' },
  { code: 'RE', name: 'Reunion', timezone: 'Indian/Reunion', flag: '🇷🇪' },
  { code: 'SH', name: 'Saint Helena', timezone: 'Atlantic/St_Helena', flag: '🇸🇭' },
  { code: 'CV', name: 'Cape Verde', timezone: 'Atlantic/Cape_Verde', flag: '🇨🇻' },
  { code: 'ST', name: 'Sao Tome and Principe', timezone: 'Africa/Sao_Tome', flag: '🇸🇹' },
];

export function CountrySelect({ value, onValueChange, placeholder = "Select country..." }) {
  const [open, setOpen] = useState(false);
  const [searchValue, setSearchValue] = useState('');

  const filteredCountries = useMemo(() => {
    if (!searchValue) return COUNTRIES;
    
    return COUNTRIES.filter(country =>
      country.name.toLowerCase().includes(searchValue.toLowerCase()) ||
      country.code.toLowerCase().includes(searchValue.toLowerCase())
    );
  }, [searchValue]);

  const selectedCountry = COUNTRIES.find(country => country.name === value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
        >
          {selectedCountry ? (
            <div className="flex items-center gap-2">
              <span className="text-lg">{selectedCountry.flag}</span>
              <span>{selectedCountry.name}</span>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Globe className="h-4 w-4" />
              <span>{placeholder}</span>
            </div>
          )}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0" align="start">
        <Command>
          <CommandInput 
            placeholder="Search countries..." 
            value={searchValue}
            onValueChange={setSearchValue}
          />
          <CommandList>
            <CommandEmpty>No country found.</CommandEmpty>
            <CommandGroup>
              {filteredCountries.map((country) => (
                <CommandItem
                  key={country.code}
                  value={country.name}
                  onSelect={() => {
                    onValueChange(country.name);
                    setOpen(false);
                    setSearchValue('');
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value === country.name ? "opacity-100" : "opacity-0"
                    )}
                  />
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{country.flag}</span>
                    <span>{country.name}</span>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

// Export the countries data for use in other components
export { COUNTRIES };

// Helper function to get timezone for a country
export const getTimezoneForCountry = (countryName) => {
  const country = COUNTRIES.find(c => c.name === countryName);
  return country ? country.timezone : 'UTC';
};

// Helper function to get country for a timezone
export const getCountryForTimezone = (timezone) => {
  const country = COUNTRIES.find(c => c.timezone === timezone);
  return country ? country.name : null;
}; 