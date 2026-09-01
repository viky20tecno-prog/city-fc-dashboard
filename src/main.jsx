import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

// #lcp-hero + #lcp-hero-scrim (fondo del hero pintado en index.html para el LCP)
// SOLO tienen sentido en la landing. Viven fuera de #root, así que en cualquier
// otra ruta asoman por detrás del contenido.
//   - Carga directa de otra ruta → los quitamos YA, sincrónico, antes de que
//     React monte (así no alcanzan a parpadear).
//   - En `/` NO se tocan nunca: quitar el elemento LCP del DOM hace que Chrome
//     lo descarte y el LCP salte al <img> del Hero de React (~6s). Se queda;
//     cuando la landing real monta (fondo opaco) lo tapa.
//   - Navegación cliente `/` → otra ruta → los quita <RouteHeroCleanup> en App.
if (window.location.pathname !== '/') {
  document.getElementById('lcp-hero')?.remove();
  document.getElementById('lcp-hero-scrim')?.remove();
} else {
  // La landing (`/`) es la ruta más visitada y su chunk es grande (lazy,
  // compartido con el dashboard). Disparamos la descarga acá, en paralelo
  // con el arranque de React, para no sumar un salto de waterfall al LCP.
  import('./pages/LandingPage');
}

// Evita que la rueda del mouse cambie el valor de un input numérico enfocado
// (comportamiento nativo de Chrome/Edge) — al hacer scroll, el campo pierde el
// foco en vez de sumar/restar por accidente.
document.addEventListener('wheel', () => {
  const active = document.activeElement;
  if (active?.tagName === 'INPUT' && active.type === 'number') {
    active.blur();
  }
}, { passive: true });

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
