import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

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
