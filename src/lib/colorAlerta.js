// Tono de las alertas del dashboard (p. ej. comprobantes por conciliar).
// El ámbar se lee como "ojo, revisa esto", pero el color del club es libre: con
// un club rojo, naranja o amarillo el ámbar se confunde con la marca. En ese
// caso se usa el candidato cuyo tono queda más lejos del color del club.
// Todos son claros → el texto encima va oscuro (TEXTO_SOBRE_ALERTA).

export const ALERTA_AMBAR   = '#F59E0B';
export const ALERTA_CIAN    = '#22D3EE';
export const ALERTA_ROSA    = '#F472B6';
export const ALERTA_VIOLETA = '#A78BFA';
export const TEXTO_SOBRE_ALERTA = '#1a1200';

const DISTANCIA_MINIMA = 60; // grados de tono para que el ámbar se distinga
const ALTERNATIVAS = [ALERTA_CIAN, ALERTA_ROSA, ALERTA_VIOLETA];

// Tono (0-360) de un hex, o null si es gris / inválido
function tono(hex) {
  let h = String(hex || '').trim().replace(/^#/, '');
  if (/^[0-9a-f]{3}$/i.test(h)) h = h.split('').map(ch => ch + ch).join('');
  if (!/^[0-9a-f]{6}$/i.test(h)) return null;
  const [r, g, b] = [0, 2, 4].map(i => parseInt(h.slice(i, i + 2), 16) / 255);
  const max = Math.max(r, g, b), min = Math.min(r, g, b), d = max - min;
  if (d < 0.15) return null; // sin saturación → sin tono con el que chocar
  let t;
  if (max === r)      t = ((g - b) / d) % 6;
  else if (max === g) t = (b - r) / d + 2;
  else                t = (r - g) / d + 4;
  return (t * 60 + 360) % 360;
}

const distancia = (a, b) => { const x = Math.abs(a - b); return Math.min(x, 360 - x); };

export function colorAlerta(colorClub) {
  const t = tono(colorClub);
  if (t === null || distancia(t, tono(ALERTA_AMBAR)) >= DISTANCIA_MINIMA) return ALERTA_AMBAR;
  return ALTERNATIVAS.reduce((mejor, c) =>
    distancia(t, tono(c)) > distancia(t, tono(mejor)) ? c : mejor);
}
