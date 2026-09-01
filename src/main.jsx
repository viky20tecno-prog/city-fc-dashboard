import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

// #lcp-hero + #lcp-hero-scrim (fondo del hero pintado en index.html para el LCP)
// SOLO tienen sentido en la landing. Están fuera de #root, así que si no los
// sacamos asoman por detrás de cualquier otra ruta (dashboard, login…). En `/`
// se quitan después de `load` — ya cumplieron su función de LCP y así no
// quedan colgados si el usuario navega a otra ruta sin recargar.
(function manageLcpHero() {
  const kill = () => {
    document.getElementById('lcp-hero')?.remove();
    document.getElementById('lcp-hero-scrim')?.remove();
  };
  if (window.location.pathname !== '/') {
    kill();
  } else {
    // La landing (`/`) es la ruta más visitada y su chunk es grande (lazy,
    // compartido con el dashboard). Disparamos la descarga acá, en paralelo
    // con el arranque de React, para no sumar un salto de waterfall al LCP.
    import('./pages/LandingPage');
    if (document.readyState === 'complete') setTimeout(kill, 0);
    else window.addEventListener('load', () => setTimeout(kill, 0), { once: true });
  }
})();

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
