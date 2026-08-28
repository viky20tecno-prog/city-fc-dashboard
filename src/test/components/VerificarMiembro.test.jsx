import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';

vi.mock('../../lib/supabase', () => import('../mocks/supabase.js'));
vi.mock('../../config', () => ({
  API_BASE_URL: 'https://api.test.example/api',
  SUPPORT_WHATSAPP: '573000000000',
  ESTADO_COLORS: {},
}));

import VerificarMiembro from '../../pages/VerificarMiembro';

function renderVerificar(clubSlug = 'city-fc', cedula = '12345678') {
  return render(
    <MemoryRouter initialEntries={[`/verificar/${clubSlug}/${cedula}`]}>
      <Routes>
        <Route path="/verificar/:clubSlug/:cedula" element={<VerificarMiembro />} />
      </Routes>
    </MemoryRouter>
  );
}

describe('VerificarMiembro', () => {
  beforeEach(() => vi.clearAllMocks());

  it('muestra spinner de carga inicialmente', () => {
    global.fetch = vi.fn().mockImplementation(() => new Promise(() => {})); // nunca resuelve
    renderVerificar();
    expect(screen.getByText(/verificando membresía/i)).toBeInTheDocument();
  });

  it('muestra "No Verificado" cuando la API responde 404', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      json: async () => ({ success: false }),
    });

    renderVerificar();

    await waitFor(() => {
      expect(screen.getByText(/no verificado/i)).toBeInTheDocument();
    });
  });

  it('muestra "No Verificado" cuando el atleta no está activo', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        success: true,
        atleta: { cedula: '12345678', nombre: 'Juan', apellidos: 'Pérez', activo: false },
      }),
    });

    renderVerificar();

    await waitFor(() => {
      expect(screen.getByText(/no verificado/i)).toBeInTheDocument();
    });
  });

  it('muestra "Miembro Verificado" cuando el atleta existe y está activo', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        success: true,
        atleta: { cedula: '12345678', nombre: 'Juan', apellidos: 'Pérez', activo: true },
        club: { nombre: 'City FC', color: '#E14924' },
      }),
    });

    renderVerificar();

    await waitFor(() => {
      expect(screen.getByText(/miembro verificado/i)).toBeInTheDocument();
    });
    expect(screen.getByText(/Juan Pérez/i)).toBeInTheDocument();
    // Debe pegarle al endpoint dedicado del carnet (verificación por cédula),
    // NO a /publico/atleta/:slug/:token (Portal, exige token HMAC).
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/publico/verificar/city-fc/12345678'),
    );
  });

  it('muestra "Miembro Verificado" cuando activo === "SI"', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        success: true,
        atleta: { cedula: '12345678', nombre: 'María', apellidos: 'López', activo: 'SI' },
      }),
    });

    renderVerificar();

    await waitFor(() => {
      expect(screen.getByText(/miembro verificado/i)).toBeInTheDocument();
    });
  });

  it('muestra error cuando la API lanza excepción de red', async () => {
    global.fetch = vi.fn().mockRejectedValue(new Error('Network error'));

    renderVerificar();

    await waitFor(() => {
      expect(screen.getByText(/no se pudo verificar/i)).toBeInTheDocument();
    });
  });
});
