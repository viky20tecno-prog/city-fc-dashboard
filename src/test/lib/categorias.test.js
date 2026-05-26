import { describe, it, expect } from 'vitest';
import { normalizarCategorias, listarEquipos } from '../../lib/categorias';

describe('normalizarCategorias', () => {
  it('devuelve [] cuando recibe null o no-array', () => {
    expect(normalizarCategorias(null)).toEqual([]);
    expect(normalizarCategorias(undefined)).toEqual([]);
    expect(normalizarCategorias('cadena')).toEqual([]);
  });

  it('normaliza formato antiguo (array de strings)', () => {
    const result = normalizarCategorias(['Sub-12', 'Sub-15']);
    expect(result).toEqual([
      { nombre: 'Sub-12', equipos: ['Sub-12'] },
      { nombre: 'Sub-15', equipos: ['Sub-15'] },
    ]);
  });

  it('normaliza formato nuevo (array de objetos con equipos)', () => {
    const raw = [{ nombre: 'Sub-12', equipos: ['Rojo', 'Azul'] }];
    const result = normalizarCategorias(raw);
    expect(result).toEqual([{ nombre: 'Sub-12', equipos: ['Rojo', 'Azul'] }]);
  });

  it('usa el nombre como equipo único cuando equipos está vacío', () => {
    const raw = [{ nombre: 'Sub-18', equipos: [] }];
    const result = normalizarCategorias(raw);
    expect(result[0].equipos).toEqual(['Sub-18']);
  });

  it('filtra entradas sin nombre', () => {
    const raw = [{ nombre: '', equipos: ['A'] }, { nombre: 'Sub-12', equipos: [] }];
    expect(normalizarCategorias(raw)).toHaveLength(1);
  });

  it('mezcla formatos string y objeto en el mismo array', () => {
    const raw = ['Sub-10', { nombre: 'Sub-14', equipos: ['A', 'B'] }];
    const result = normalizarCategorias(raw);
    expect(result).toHaveLength(2);
    expect(result[0]).toEqual({ nombre: 'Sub-10', equipos: ['Sub-10'] });
    expect(result[1]).toEqual({ nombre: 'Sub-14', equipos: ['A', 'B'] });
  });
});

describe('listarEquipos', () => {
  it('devuelve [] con input vacío', () => {
    expect(listarEquipos([])).toEqual([]);
    expect(listarEquipos(null)).toEqual([]);
  });

  it('devuelve solo el nombre cuando no hay sub-equipos', () => {
    const result = listarEquipos(['Sub-12', 'Sub-15']);
    expect(result).toEqual(['Sub-12', 'Sub-15']);
  });

  it('expande categorías con sub-equipos incluyendo el padre', () => {
    const raw = [{ nombre: 'Sub-12', equipos: ['Rojo', 'Azul'] }];
    const result = listarEquipos(raw);
    expect(result).toEqual(['Sub-12', 'Rojo', 'Azul']);
  });

  it('mezcla correctamente simples y con sub-equipos', () => {
    const raw = [
      'Sub-10',
      { nombre: 'Sub-14', equipos: ['A', 'B'] },
    ];
    const result = listarEquipos(raw);
    expect(result).toEqual(['Sub-10', 'Sub-14', 'A', 'B']);
  });
});
