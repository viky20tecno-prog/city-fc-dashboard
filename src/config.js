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

// URL del Google Apps Script desplegado (manejar escrituras a Sheets)
// Diego debe desplegar el script y pegar la URL aquí
export const APPS_SCRIPT_URL = import.meta.env.VITE_APPS_SCRIPT_URL || '';

export const ESTADOS_JUGADOR = {
  PRUEBA: 'PRUEBA',
  ACTIVO: 'ACTIVO',
  INACTIVO: 'INACTIVO',
};

export const ESTADOS_PAGO = {
  PENDIENTE: 'PENDIENTE',
  ABONO_PARCIAL: 'ABONO PARCIAL',
  POR_VALIDAR: 'POR VALIDAR',
  PAGADO: 'PAGADO',
  MORA: 'MORA',
};

export const ESTADO_COLORS = {
  PAGADO: { bg: 'bg-[rgba(0,208,132,0.12)]', text: 'text-[#00D084]', dot: 'bg-[#00D084]' },
  PENDIENTE: { bg: 'bg-[rgba(245,166,35,0.12)]', text: 'text-[#F5A623]', dot: 'bg-[#F5A623]' },
  'ABONO PARCIAL': { bg: 'bg-[rgba(74,158,255,0.12)]', text: 'text-[#4A9EFF]', dot: 'bg-[#4A9EFF]' },
  'POR VALIDAR': { bg: 'bg-[rgba(192,120,255,0.12)]', text: 'text-[#C678FF]', dot: 'bg-[#C678FF]' },
  MORA: { bg: 'bg-[rgba(255,94,94,0.12)]', text: 'text-[#FF5E5E]', dot: 'bg-[#FF5E5E]' },
  PRUEBA: { bg: 'bg-[rgba(245,166,35,0.12)]', text: 'text-[#F5A623]', dot: 'bg-[#F5A623]' },
  ACTIVO: { bg: 'bg-[rgba(0,208,132,0.12)]', text: 'text-[#00D084]', dot: 'bg-[#00D084]' },
  INACTIVO: { bg: 'bg-[rgba(74,158,255,0.12)]', text: 'text-[#8B949E]', dot: 'bg-[#8B949E]' },
};
