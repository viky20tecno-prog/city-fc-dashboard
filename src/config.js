export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://api.zensports.zenpra.ai/api';

export const SUPPORT_WHATSAPP = '573023903192';

// Oferta de lanzamiento (no permanente, ver admin/lib/utils.ts PLAN_PRICE_ANUAL):
// pagando el año completo de una vez, el club se lleva 12 meses por el precio
// de 10 ("2 meses gratis"). Para terminar la oferta: OFERTA_ANUAL_LANZAMIENTO = false.
export const OFERTA_ANUAL_LANZAMIENTO = true;

export const PLANES_PRECIO_ANUAL = {
  starter: '$1.490.000',
  pro:     '$3.990.000',
  scale:   '$7.990.000',
};

export const ESTADO_COLORS = {
  AL_DIA:      { bg: 'bg-[rgba(0,208,132,0.12)]',   text: 'text-[#00D084]', dot: 'bg-[#00D084]' },
  PARCIAL:     { bg: 'bg-[rgba(74,158,255,0.12)]',  text: 'text-[#4A9EFF]', dot: 'bg-[#4A9EFF]' },
  PENDIENTE:   { bg: 'bg-[rgba(245,166,35,0.12)]',  text: 'text-[#F5A623]', dot: 'bg-[#F5A623]' },
  MORA:        { bg: 'bg-[rgba(255,94,94,0.12)]',   text: 'text-[#FF5E5E]', dot: 'bg-[#FF5E5E]' },
  POR_VALIDAR: { bg: 'bg-[rgba(192,120,255,0.12)]', text: 'text-[#C678FF]', dot: 'bg-[#C678FF]' },
  NO_APLICA:   { bg: 'bg-[rgba(148,163,184,0.12)]', text: 'text-[#94A3B8]', dot: 'bg-[#94A3B8]' },
};
