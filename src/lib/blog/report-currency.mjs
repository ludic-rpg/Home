export const USD_PER_EUR = 1.149;

const euroRegions = new Set(['AT', 'BE', 'BG', 'CY', 'DE', 'EE', 'ES', 'FI', 'FR', 'GR', 'HR', 'IE', 'IT', 'LT', 'LU', 'LV', 'MT', 'NL', 'PT', 'SI', 'SK']);
const dollarRegions = new Set(['US', 'AS', 'EC', 'GU', 'MH', 'MP', 'PR', 'PW', 'SV', 'TL', 'VI']);

// Language preferences suggest familiarity. They do not establish location.
export function preferredReportCurrency(languages = [], saved = null) {
  if (saved === 'EUR' || saved === 'USD') return saved;
  for (const language of languages) {
    try {
      const locale = new Intl.Locale(language);
      const region = locale.region || locale.maximize().region;
      if (euroRegions.has(region)) return 'EUR';
      if (dollarRegions.has(region)) return 'USD';
    } catch { /* Ignore malformed browser language tags. */ }
  }
  return languages[0]?.toLowerCase().startsWith('en') ? 'USD' : 'EUR';
}

export function reportMoney(eur, currency = 'EUR') {
  return new Intl.NumberFormat('en-US', {
    style: 'currency', currency, minimumFractionDigits: 2, maximumFractionDigits: 2,
  }).format(currency === 'USD' ? eur * USD_PER_EUR : eur);
}
