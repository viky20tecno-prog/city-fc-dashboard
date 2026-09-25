import { describe, it, expect } from 'vitest';
import { colorAlerta, ALERTA_AMBAR, ALERTA_CIAN, ALERTA_VIOLETA } from '../../lib/colorAlerta';

describe('colorAlerta — tono de alerta que contraste con el color del club', () => {
  it('ámbar por defecto cuando el club está lejos de los tonos cálidos', () => {
    expect(colorAlerta('#8B5CF6')).toBe(ALERTA_AMBAR); // violeta
    expect(colorAlerta('#00AAFF')).toBe(ALERTA_AMBAR); // azul
  });

  it('club rojo/naranja (City FC) → no ámbar, el tono más lejano', () => {
    expect(colorAlerta('#E14924')).toBe(ALERTA_CIAN);
  });

  it('club amarillo (Héroes) o verde lima (Cancheroapp) → no ámbar', () => {
    expect(colorAlerta('#FACC15')).toBe(ALERTA_VIOLETA);
    expect(colorAlerta('#84CC16')).toBe(ALERTA_VIOLETA);
  });

  it('grises / blanco / negro no tienen tono → ámbar', () => {
    expect(colorAlerta('#FFFFFF')).toBe(ALERTA_AMBAR);
    expect(colorAlerta('#222222')).toBe(ALERTA_AMBAR);
  });

  it('valores raros no rompen: corto, sin #, vacío o inválido', () => {
    expect(colorAlerta('#F80')).toBe(colorAlerta('#FF8800'));
    expect(colorAlerta('E14924')).toBe(ALERTA_CIAN);
    expect(colorAlerta(undefined)).toBe(ALERTA_AMBAR);
    expect(colorAlerta('rojo')).toBe(ALERTA_AMBAR);
  });
});
