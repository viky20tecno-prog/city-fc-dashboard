import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

vi.mock('../../lib/supabase', () => import('../mocks/supabase.js'));
vi.mock('../../lib/authFetch', () => ({ authFetch: vi.fn() }));

import { authFetch } from '../../lib/authFetch';
import EstadoCuentaModal from '../../components/EstadoCuentaModal';

const jugadores = [
  { cedula: '1034966779', nombre: 'Victoria', apellidos: 'Mejía Restrepo', categoria: 'SUB-11', activo: true },
  { cedula: '1026740247', nombre: 'Jacobo', apellidos: 'Giraldo Londoño', categoria: 'SUB-9', activo: true },
];

const respuesta = {
  success: true, esExento: false, saldo_pendiente: 160000, total_pagado: 560000, meses_pendientes: 2,
  atleta: { nombre: 'Jacobo', apellidos: 'Giraldo Londoño', cedula: '1026740247', categoria: 'SUB-9', activo: true },
  mensualidades: [
    { mes: 'Agosto', numero_mes: 8, anio: 2026, estado: 'vencido', valor_oficial: 80000, valor_pagado: 0, saldo: 80000 },
    { mes: 'Enero', numero_mes: 1, anio: 2026, estado: 'no_aplica', valor_oficial: 0, valor_pagado: 0, saldo: 0 },
    { mes: 'Octubre', numero_mes: 10, anio: 2026, estado: 'proximo', valor_oficial: 80000, valor_pagado: 0, saldo: 0 },
  ],
  torneos: [{ id: 't1', nombre_torneo: 'Copa', estado: 'ABONO', valor_inscrito: 90000, valor_pagado: 45000, saldo_pendiente: 45000 }],
  uniformes: [], pagos: [],
  portal_url: 'https://zensports.zenpra.ai/p/demo/abc',
  wa: { wa_link: 'https://wa.me/573001112233', texto: 'Hola', ya_enviado: false },
};

describe('EstadoCuentaModal', () => {
  beforeEach(() => vi.clearAllMocks());

  it('busca por nombre sin tildes y por cédula', () => {
    render(<EstadoCuentaModal jugadores={jugadores} onClose={() => {}} />);
    const input = screen.getByPlaceholderText(/nombre o cédula/i);
    fireEvent.change(input, { target: { value: 'mejia' } });
    expect(screen.getByText('Victoria Mejía Restrepo')).toBeInTheDocument();
    fireEvent.change(input, { target: { value: '10267' } });
    expect(screen.getByText('Jacobo Giraldo Londoño')).toBeInTheDocument();
    expect(screen.queryByText('Victoria Mejía Restrepo')).not.toBeInTheDocument();
  });

  it('al elegir un jugador muestra su estado de cuenta con las etiquetas del Portal', async () => {
    authFetch.mockResolvedValue({ ok: true, json: async () => respuesta });
    render(<EstadoCuentaModal jugadores={jugadores} onClose={() => {}} />);
    fireEvent.change(screen.getByPlaceholderText(/nombre o cédula/i), { target: { value: 'jacobo' } });
    fireEvent.click(screen.getByText('Jacobo Giraldo Londoño'));
    await waitFor(() => expect(screen.getByText('2 meses pendientes')).toBeInTheDocument());
    expect(authFetch.mock.calls[0][0]).toContain('/players/1026740247/estado-cuenta');
    expect(screen.getByText('Vencido')).toBeInTheDocument();
    expect(screen.getByText('No aplica')).toBeInTheDocument();
    expect(screen.getByText('Próximo')).toBeInTheDocument();
    // Total = mensualidades vencidas (160.000) + torneos (45.000); el mes próximo no suma
    // El total aparece dos veces (arriba junto al nombre y al pie): ambos deben coincidir.
    const totales = screen.getAllByText('Total pendiente por pagar');
    expect(totales).toHaveLength(2);
    for (const t of totales) expect(t.nextSibling.textContent.replace(/\s/g, '')).toBe('$205.000');
    expect(screen.getByText('WhatsApp')).toBeInTheDocument();
  });
});
