const PAISES = {
  '57':  { locale: 'es-CO', currency: 'COP', symbol: '$',   label: 'COP' },
  '52':  { locale: 'es-MX', currency: 'MXN', symbol: '$',   label: 'MXN' },
  '54':  { locale: 'es-AR', currency: 'ARS', symbol: '$',   label: 'ARS' },
  '51':  { locale: 'es-PE', currency: 'PEN', symbol: 'S/',  label: 'PEN' },
  '56':  { locale: 'es-CL', currency: 'CLP', symbol: '$',   label: 'CLP' },
  '57':  { locale: 'es-CO', currency: 'COP', symbol: '$',   label: 'COP' },
  '58':  { locale: 'es-VE', currency: 'USD', symbol: '$',   label: 'USD' },
  '593': { locale: 'es-EC', currency: 'USD', symbol: '$',   label: 'USD' },
  '598': { locale: 'es-UY', currency: 'UYU', symbol: '$U',  label: 'UYU' },
  '591': { locale: 'es-BO', currency: 'BOB', symbol: 'Bs.', label: 'BOB' },
  '595': { locale: 'es-PY', currency: 'PYG', symbol: 'Gs.', label: 'PYG' },
  '502': { locale: 'es-GT', currency: 'GTQ', symbol: 'Q',   label: 'GTQ' },
  '503': { locale: 'es-SV', currency: 'USD', symbol: '$',   label: 'USD' },
  '504': { locale: 'es-HN', currency: 'HNL', symbol: 'L',   label: 'HNL' },
  '505': { locale: 'es-NI', currency: 'NIO', symbol: 'C$',  label: 'NIO' },
  '506': { locale: 'es-CR', currency: 'CRC', symbol: '₡',   label: 'CRC' },
  '507': { locale: 'es-PA', currency: 'USD', symbol: '$',   label: 'USD' },
  '1':   { locale: 'en-US', currency: 'USD', symbol: '$',   label: 'USD' },
};

const DEFAULT = PAISES['57'];

export function getMonedaConfig(codigoPais) {
  return PAISES[String(codigoPais)] || DEFAULT;
}

export function formatMoney(amount, codigoPais) {
  const { locale, currency } = getMonedaConfig(codigoPais);
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(parseFloat(amount) || 0);
}

export function getCurrencyLabel(codigoPais) {
  return getMonedaConfig(codigoPais).label;
}

export function getCodigoPais() {
  return sessionStorage.getItem('codigoPais') || '57';
}
