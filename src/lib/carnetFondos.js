// Fondos disponibles para el carnet de jugador — todo generado en CSS (gradientes/
// patrones), sin imágenes subidas. Así el carnet se ve nítido siempre, imprime bien
// y nunca hay riesgo de que una foto de fondo tape el nombre o los datos del jugador.
//
// Es UNA sola elección por club (no por jugador) — se guarda en `clubConfig.carnet_fondo`
// y aplica a los carnets de todos los jugadores del club, para mantener una identidad
// visual consistente. Se configura desde el wizard "Configura tu club" (paso Identidad
// visual) y se usa en HojaDeVida/TabCarnet.jsx.
export const CARNET_FONDOS = [
  {
    key: 'oscuro', label: 'Oscuro', dark: true,
    bg: () => 'linear-gradient(155deg,#111111 0%,#0E0E16 100%)',
  },
  {
    key: 'claro', label: 'Claro', dark: false,
    bg: () => 'linear-gradient(155deg,#FFFFFF 0%,#F5F5F5 100%)',
  },
  {
    key: 'diagonal', label: 'Diagonal', dark: true,
    bg: (c) => `linear-gradient(135deg,#111111 0%,#111111 72%,${c} 72%,${c} 100%)`,
  },
  {
    key: 'punteado', label: 'Punteado', dark: true,
    bg: (c) => `radial-gradient(${c}55 1px,transparent 1.5px) 0 0/14px 14px,linear-gradient(155deg,#111111 0%,#0E0E16 100%)`,
  },
  {
    key: 'bicolor', label: 'Bicolor', dark: true,
    // Banda horizontal ancha SOLO en el tercio inferior (footer + margen encima) —
    // nunca puede tapar el header, la foto ni el bloque de nombre/apellidos, que
    // siempre usan clubColor como texto y quedarían ilegibles sobre un fondo del
    // mismo color.
    bg: (c) => `linear-gradient(180deg,#111111 0%,#111111 88%,${c} 88%,${c} 100%)`,
  },
  {
    key: 'minimal', label: 'Minimal', dark: false,
    bg: () => '#FFFFFF',
  },
];

export function getFondoCarnet(key) {
  return CARNET_FONDOS.find(f => f.key === key) || CARNET_FONDOS[0];
}

// Deriva la paleta completa (fondo + colores de texto/bordes) para un fondo + color
// de club dados. `dark` decide si el texto es claro sobre oscuro o al revés — todos
// los fondos son o mayormente oscuros o mayormente claros, así que esta única regla
// alcanza para los 6 sin necesitar contraste por-fondo.
export function temaCarnet(fondoKey, clubColor) {
  const fondo = getFondoCarnet(fondoKey);
  const bgCard = fondo.bg(clubColor);
  return fondo.dark
    ? { dark: true, label: fondo.label, bgCard,
        textPri: '#F0F0F0', textSec: '#AAAAAA', textMut: '#666666',
        border: `${clubColor}40`, borderImg: `${clubColor}55`, divider: '#1E1E28', photoBg: '#1A1A26' }
    : { dark: false, label: fondo.label, bgCard,
        textPri: '#111111', textSec: '#444444', textMut: '#888888',
        border: `${clubColor}50`, borderImg: `${clubColor}60`, divider: '#EBEBEB', photoBg: '#E0E0E0' };
}
