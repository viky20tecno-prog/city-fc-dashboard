import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

vi.mock('../../lib/supabase', () => import('../mocks/supabase.js'));

import { EvolucionMoraView } from '../../components/EvolucionMoraChart';

const mes = (numero_mes, porcentaje) => ({ numero_mes, mes: ['Enero', 'Febrero', 'Marzo'][numero_mes - 1], porcentaje, total: 100, morosos: porcentaje });

describe('EvolucionMoraView', () => {
  it('muestra el recorrido de la mora del primer al último mes', () => {
    render(<EvolucionMoraView evolucion={{ confiable: true, meses: [mes(1, 38), mes(2, 20), mes(3, 6)] }} />);
    expect(screen.getByText('Evolución de la mora')).toBeInTheDocument();
    expect(screen.getByText('38% → 6%')).toBeInTheDocument();
  });

  it('no se muestra si la reconstrucción no es confiable', () => {
    const { container } = render(<EvolucionMoraView evolucion={{ confiable: false, meses: [mes(1, 38), mes(2, 6)] }} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('no se muestra con menos de 2 meses de historia', () => {
    const { container } = render(<EvolucionMoraView evolucion={{ confiable: true, meses: [mes(1, 10)] }} />);
    expect(container).toBeEmptyDOMElement();
  });
});
