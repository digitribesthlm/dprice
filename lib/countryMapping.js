// Map URL patterns to countries
// This helps determine which country a competitor URL belongs to

export const URL_COUNTRY_PATTERNS = [
  // Spain
  { pattern: /espana|\.es\/|spain/i, country: 'ES' },
  // Sweden  
  { pattern: /\.se\/|sweden|sverige/i, country: 'SE' },
  // Germany
  { pattern: /\.de\/|germany|deutschland/i, country: 'DE' },
  // France
  { pattern: /\.fr\/|france/i, country: 'FR' },
  // Italy
  { pattern: /\.it\/|italy|italia/i, country: 'IT' },
  // UK
  { pattern: /\.uk\/|\.co\.uk|united-kingdom|britain/i, country: 'UK' },
  // Netherlands
  { pattern: /\.nl\/|netherlands|nederland/i, country: 'NL' },
  // Belgium
  { pattern: /\.be\/|belgium|belgie/i, country: 'BE' },
  // Denmark
  { pattern: /\.dk\/|denmark|danmark/i, country: 'DK' },
  // Norway
  { pattern: /\.no\/|norway|norge/i, country: 'NO' },
  // Finland
  { pattern: /\.fi\/|finland|suomi/i, country: 'FI' },
  // Poland
  { pattern: /\.pl\/|poland|polska/i, country: 'PL' },
  // Portugal
  { pattern: /\.pt\/|portugal/i, country: 'PT' },
  // Austria
  { pattern: /\.at\/|austria|österreich/i, country: 'AT' },
]

// Determine country from URL
export function getCountryFromUrl(url) {
  if (!url) return null
  
  for (const { pattern, country } of URL_COUNTRY_PATTERNS) {
    if (pattern.test(url)) {
      return country
    }
  }
  
  return null
}

// Country names for display
export const COUNTRY_NAMES = {
  'SE': 'Sweden',
  'ES': 'Spain',
  'DE': 'Germany',
  'FR': 'France',
  'IT': 'Italy',
  'UK': 'United Kingdom',
  'NL': 'Netherlands',
  'BE': 'Belgium',
  'DK': 'Denmark',
  'NO': 'Norway',
  'FI': 'Finland',
  'PL': 'Poland',
  'PT': 'Portugal',
  'AT': 'Austria',
}

// Country flags
export const COUNTRY_FLAGS = {
  'SE': '🇸🇪',
  'ES': '🇪🇸',
  'DE': '🇩🇪',
  'FR': '🇫🇷',
  'IT': '🇮🇹',
  'UK': '🇬🇧',
  'NL': '🇳🇱',
  'BE': '🇧🇪',
  'DK': '🇩🇰',
  'NO': '🇳🇴',
  'FI': '🇫🇮',
  'PL': '🇵🇱',
  'PT': '🇵🇹',
  'AT': '🇦🇹',
}

