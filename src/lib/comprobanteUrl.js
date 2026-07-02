import { authFetch } from './authFetch';
import { getClubId } from '../services/api';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'https://api.zensports.zenpra.ai/api';

// Los comprobantes que llegan por WA se sirven desde WAHA (/api/files/...), que exige
// una API key que el navegador no puede mandar en un <img src> o <a href> directo —
// hay que pedirlos por el backend, que sí la conoce.
export const esUrlWaha = (url) => typeof url === 'string' && url.includes('/api/files/');

// Descarga el comprobante vía el proxy autenticado y devuelve un object URL temporal
// (recuerda hacer URL.revokeObjectURL cuando ya no se use).
export async function fetchComprobanteBlobUrl(url) {
  const res = await authFetch(`${API_BASE}/waha/media-proxy?url=${encodeURIComponent(url)}&club_id=${getClubId()}`);
  if (!res.ok) {
    let detalle = '';
    try { detalle = await res.text(); } catch { /* ignore */ }
    throw new Error(`No se pudo cargar el comprobante (HTTP ${res.status}): ${detalle}`);
  }
  const blob = await res.blob();
  return URL.createObjectURL(blob);
}
