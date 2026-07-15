import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock supabase before importing api (api.js imports supabase at module level)
vi.mock('../../lib/supabase', () => import('../mocks/supabase.js'));

import { getClubId, setClubId, fetchAllData } from '../../services/api';

beforeEach(() => {
  sessionStorage.clear();
  vi.clearAllMocks();
});

describe('getClubId', () => {
  it('devuelve null cuando no hay clubId en sessionStorage', () => {
    expect(getClubId()).toBeNull();
  });

  it('devuelve el clubId guardado en sessionStorage', () => {
    sessionStorage.setItem('clubId', 'city-fc');
    expect(getClubId()).toBe('city-fc');
  });
});

describe('setClubId', () => {
  it('guarda el clubId en sessionStorage', () => {
    setClubId('atletico-test');
    expect(sessionStorage.getItem('clubId')).toBe('atletico-test');
  });
});

describe('fetchAllData', () => {
  it('lanza error cuando no hay clubId en sesión', async () => {
    await expect(fetchAllData()).rejects.toThrow('No hay club activo en sesión.');
  });

  it('llama a los 7 endpoints cuando hay clubId', async () => {
    sessionStorage.setItem('clubId', 'city-fc');
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ data: [] }),
    });
    global.fetch = mockFetch;

    const result = await fetchAllData();

    expect(mockFetch).toHaveBeenCalledTimes(7);
    expect(result).toHaveProperty('jugadores');
    expect(result).toHaveProperty('mensualidades');
    expect(result).toHaveProperty('uniformes');
    expect(result).toHaveProperty('torneos');
    expect(result).toHaveProperty('registroPagos');
    expect(result).toHaveProperty('morosos');
    expect(result).toHaveProperty('suspensiones');
  });

  it('retorna arrays vacíos cuando un endpoint falla (apiCallSafe)', async () => {
    sessionStorage.setItem('clubId', 'city-fc');
    global.fetch = vi.fn().mockRejectedValue(new Error('Network error'));

    const result = await fetchAllData();

    expect(result.jugadores).toEqual([]);
    expect(result.mensualidades).toEqual([]);
    expect(result.suspensiones).toEqual([]);
  });
});
