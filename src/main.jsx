import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

// La landing (`/`) es la ruta más visitada y su chunk es grande (va lazy,
// compartido con el dashboard). Disparamos la descarga acá, apenas ejecuta
// el entry y en paralelo con el arranque de React — así el chunk ya está en
// caché cuando <Suspense> lo pide tras el primer render, en vez de sumar un
// salto de waterfall al LCP. Mismo specifier que App.jsx → Rollup lo dedupe
// a un solo chunk. En el resto de rutas no se descarga nada de más.
if (window.location.pathname === '/') {
  import('./pages/LandingPage')
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
