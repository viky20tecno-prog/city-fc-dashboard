import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

vi.mock('../../lib/supabase', () => import('../mocks/supabase.js'));
vi.mock('../../config', () => ({ API_BASE_URL: 'https://api.test.example/api' }));

import CorregirCedulaModal from '../../components/HojaDeVida/CorregirCedulaModal';

const jugador = { cedula: '111', nombre: 'Juan', apellidos: 'Pérez' };

function renderModal(props = {}) {
  return render(
    <CorregirCedulaModal jugador={jugador} clubId="city-fc" onClose={() => {}} onDone={() => {}} {...props} />,
  );
}

describe('CorregirCedulaModal', () => {
  beforeEach(() => vi.clearAllMocks());

  it('el botón está deshabilitado hasta llenar la cédula y marcar el checkbox', async () => {
    const user = userEvent.setup();
    renderModal();
    const btn = screen.getByRole('button', { name: /corregir cédula/i });
    expect(btn).toBeDisabled();

    await user.type(screen.getByPlaceholderText(/1234567890/), '222');
    expect(btn).toBeDisabled(); // falta el checkbox

    await user.click(screen.getByRole('checkbox'));
    expect(btn).toBeEnabled();
  });

  it('corrección simple: llama al endpoint y muestra éxito', async () => {
    const onDone = vi.fn();
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ success: true, swap: false, movidos: { mensualidades: 5, pagos: 2 } }),
    });

    const user = userEvent.setup();
    renderModal({ onDone });

    await user.type(screen.getByPlaceholderText(/1234567890/), '222');
    await user.click(screen.getByRole('checkbox'));
    await user.click(screen.getByRole('button', { name: /corregir cédula/i }));

    await waitFor(() => expect(screen.getByText(/cédula corregida/i)).toBeInTheDocument());
    expect(screen.getByText(/se movieron 7 registros/i)).toBeInTheDocument();
    expect(onDone).toHaveBeenCalledWith({ cedula: '222' });

    const [url, opts] = global.fetch.mock.calls[0];
    expect(url).toContain('/players/111/corregir-cedula');
    expect(JSON.parse(opts.body)).toEqual({ nueva_cedula: '222' });
  });

  it('colisión: ofrece intercambiar y al confirmar reenvía con confirmar_swap', async () => {
    global.fetch = vi.fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: false, needs_swap: true, otro_jugador: { nombre: 'Pedro', apellidos: 'Pérez', cedula: '222' } }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, swap: true, movidos: { mensualidades: 8 } }),
      });

    const user = userEvent.setup();
    renderModal();

    await user.type(screen.getByPlaceholderText(/1234567890/), '222');
    await user.click(screen.getByRole('checkbox'));
    await user.click(screen.getByRole('button', { name: /corregir cédula/i }));

    await waitFor(() => expect(screen.getByText(/ya está registrada/i)).toBeInTheDocument());
    expect(screen.getAllByText(/Pedro Pérez/).length).toBeGreaterThan(0);

    await user.click(screen.getByRole('button', { name: /intercambiar/i }));

    await waitFor(() => expect(screen.getByText(/cédulas intercambiadas/i)).toBeInTheDocument());
    expect(JSON.parse(global.fetch.mock.calls[1][1].body)).toEqual({ nueva_cedula: '222', confirmar_swap: true });
  });

  it('muestra el error del backend', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      json: async () => ({ success: false, error: 'Solo el administrador puede corregir la cédula de un jugador.' }),
    });

    const user = userEvent.setup();
    renderModal();
    await user.type(screen.getByPlaceholderText(/1234567890/), '222');
    await user.click(screen.getByRole('checkbox'));
    await user.click(screen.getByRole('button', { name: /corregir cédula/i }));

    await waitFor(() => expect(screen.getByText(/solo el administrador/i)).toBeInTheDocument());
  });
});
