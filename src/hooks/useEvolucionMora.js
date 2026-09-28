import { useEffect, useState } from 'react';
import { fetchEvolucionMora } from '../services/api';

// Evolución de la mora + pago a tiempo por mes (GET /reports/evolucion-mora). La usan dos
// gráficas del Resumen (Evolución de la mora y Recaudación): se pide una sola vez.
export function useEvolucionMora() {
  const [evolucion, setEvolucion] = useState(null);
  useEffect(() => {
    let vivo = true;
    fetchEvolucionMora().then(r => { if (vivo) setEvolucion(r); });
    return () => { vivo = false; };
  }, []);
  return evolucion;
}
