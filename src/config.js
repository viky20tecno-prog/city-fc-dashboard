// Google Sheets config
// El Sheet debe estar compartido como "Anyone with the link can view"
// O usar la service account que ya tenemos configurada
export const SHEET_ID = '1EES2rYosfqqbHBXUoH68qseSsLqLmYT1BSi8PxEE7R4';

// Para leer sin OAuth, necesitamos API Key de Google Cloud
// La service account ya está en: openclaw-cityfc@united-tempest-488522-i8.iam.gserviceaccount.com
// Pero para el frontend usaremos API Key (solo lectura, más simple)
export const API_KEY = import.meta.env.VITE_GOOGLE_API_KEY || '';

export const SHEETS = {
  JUGADORES: 'JUGADORES',
  PAGOS: 'PAGOS',
  MOROSOS: 'MOROSOS',
  DASHBOARD: 'DASHBOARD',
};

export const CUOTA_MENSUAL = 65000;

export const ESTADOS_PAGO = {
  PENDIENTE: 'PENDIENTE',
  ABONO_PARCIAL: 'ABONO PARCIAL',
  POR_VALIDAR: 'POR VALIDAR',
  PAGADO: 'PAGADO',
  MORA: 'MORA',
};

export const ESTADO_COLORS = {
  PAGADO: { bg: 'bg-emerald-100', text: 'text-emerald-700', dot: 'bg-emerald-500' },
  PENDIENTE: { bg: 'bg-amber-100', text: 'text-amber-700', dot: 'bg-amber-500' },
  'ABONO PARCIAL': { bg: 'bg-blue-100', text: 'text-blue-700', dot: 'bg-blue-500' },
  'POR VALIDAR': { bg: 'bg-purple-100', text: 'text-purple-700', dot: 'bg-purple-500' },
  MORA: { bg: 'bg-red-100', text: 'text-red-700', dot: 'bg-red-500' },
};
