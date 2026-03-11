// Google Sheets config
export const SHEET_ID = '1LuqQipb1_MD7WoVy0064mZ1vwWgWCg9ikBRUN_-F0-A';
export const API_KEY = import.meta.env.VITE_GOOGLE_API_KEY || '';

export const SHEETS = {
  JUGADORES: 'JUGADORES',
  ESTADO_MENSUALIDADES: 'ESTADO_MENSUALIDADES',
};

export const CUOTA_MENSUAL = 65000;

// URL del Google Apps Script
export const APPS_SCRIPT_URL = import.meta.env.VITE_APPS_SCRIPT_URL || '';

export const ESTADO_COLORS = {
  AL_DIA: { bg: 'bg-[rgba(0,208,132,0.12)]', text: 'text-[#00D084]', dot: 'bg-[#00D084]' },
  PARCIAL: { bg: 'bg-[rgba(74,158,255,0.12)]', text: 'text-[#4A9EFF]', dot: 'bg-[#4A9EFF]' },
  PENDIENTE: { bg: 'bg-[rgba(245,166,35,0.12)]', text: 'text-[#F5A623]', dot: 'bg-[#F5A623]' },
  MORA: { bg: 'bg-[rgba(255,94,94,0.12)]', text: 'text-[#FF5E5E]', dot: 'bg-[#FF5E5E]' },
  POR_VALIDAR: { bg: 'bg-[rgba(192,120,255,0.12)]', text: 'text-[#C678FF]', dot: 'bg-[#C678FF]' },
};
