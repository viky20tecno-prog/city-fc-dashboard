export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://api.zensports.zenpra.ai/api';

export const SUPPORT_WHATSAPP = '573023903192';

export const ESTADO_COLORS = {
  AL_DIA:      { bg: 'bg-[rgba(0,208,132,0.12)]',   text: 'text-[#00D084]', dot: 'bg-[#00D084]' },
  PARCIAL:     { bg: 'bg-[rgba(74,158,255,0.12)]',  text: 'text-[#4A9EFF]', dot: 'bg-[#4A9EFF]' },
  PENDIENTE:   { bg: 'bg-[rgba(245,166,35,0.12)]',  text: 'text-[#F5A623]', dot: 'bg-[#F5A623]' },
  MORA:        { bg: 'bg-[rgba(255,94,94,0.12)]',   text: 'text-[#FF5E5E]', dot: 'bg-[#FF5E5E]' },
  POR_VALIDAR: { bg: 'bg-[rgba(192,120,255,0.12)]', text: 'text-[#C678FF]', dot: 'bg-[#C678FF]' },
  NO_APLICA:   { bg: 'bg-[rgba(148,163,184,0.12)]', text: 'text-[#94A3B8]', dot: 'bg-[#94A3B8]' },
};
