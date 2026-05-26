import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';

vi.mock('../../lib/supabase', () => import('../mocks/supabase.js'));
vi.mock('../../config', () => ({
  API_BASE_URL: 'https://api.test.example/api',
  SUPPORT_WHATSAPP: '573000000000',
  ESTADO_COLORS: {},
}));
vi.mock('../../hooks/useClubConfigPublic', () => ({
  useClubConfigPublic: () => ({ config: null }),
}));

import FormInscripcion from '../../components/FormInscripcion';

function renderWithRouter(search = '') {
  return render(
    <MemoryRouter initialEntries={[`/inscripcion${search}`]}>
      <Routes>
        <Route path="/inscripcion" element={<FormInscripcion />} />
      </Routes>
    </MemoryRouter>
  );
}

describe('FormInscripcion', () => {
  beforeEach(() => vi.clearAllMocks());

  it('muestra error "Enlace inválido" cuando falta club_id en la URL', () => {
    renderWithRouter('');
    expect(screen.getByText('Enlace inválido')).toBeInTheDocument();
    expect(screen.getByText(/contacta al administrador/i)).toBeInTheDocument();
  });

  it('no muestra error cuando club_id está presente en la URL', () => {
    renderWithRouter('?club_id=city-fc');
    expect(screen.queryByText('Enlace inválido')).not.toBeInTheDocument();
  });

  it('renderiza el formulario con los campos obligatorios cuando hay club_id', () => {
    renderWithRouter('?club_id=city-fc');
    expect(screen.getByText(/número de documento/i)).toBeInTheDocument();
    expect(screen.getByText(/nombre\(s\)/i)).toBeInTheDocument();
    expect(screen.getByText(/apellido\(s\)/i)).toBeInTheDocument();
  });
});
