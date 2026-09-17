import { Shield } from 'lucide-react';

// Réplica visual (no un PDF real) del listado de jugadores que exporta
// JugadoresTable.jsx (ver drawPdfHeader/drawPdfTableHead en lib/pdfHelpers.js):
// misma barra de color con escudo + nombre de club, misma cabecera de tabla
// en gris con texto del color de marca, mismos verdes/rojos de estado.
const FILAS = [
  { nombre: 'Carlos Martínez',  categoria: 'SUB-17',  estado: 'AL_DIA' },
  { nombre: 'Laura Gómez',      categoria: 'SUB-15',  estado: 'AL_DIA' },
  { nombre: 'Juan Pérez',       categoria: 'MAYORES', estado: 'MORA'   },
  { nombre: 'Ana Rodríguez',    categoria: 'SUB-17',  estado: 'AL_DIA' },
];

export default function PdfMockup({ color, clubName = 'TU CLUB' }) {
  return (
    <div style={{
      width: '100%', maxWidth: 380,
      borderRadius: 10, overflow: 'hidden',
      background: '#fff',
      border: '1px solid rgba(0,0,0,0.06)',
      boxShadow: `0 32px 80px rgba(0,0,0,0.5), 0 0 50px ${color}18`,
      transition: 'box-shadow 0.4s',
      flexShrink: 0,
    }}>
      {/* Barra de marca */}
      <div style={{ background: color, padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 10, transition: 'background-color 0.4s' }}>
        <div style={{ width: 26, height: 26, borderRadius: 6, background: 'rgba(255,255,255,0.92)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <Shield size={14} color={color} style={{ transition: 'color 0.4s' }} />
        </div>
        <div style={{ fontSize: 11, fontWeight: 800, color: '#fff', letterSpacing: 0.3, flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {clubName.toUpperCase()}
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 8.5, fontWeight: 800, color: '#fff', letterSpacing: 0.5 }}>LISTADO DE JUGADORES</div>
          <div style={{ fontSize: 7, color: 'rgba(255,255,255,0.75)', marginTop: 1 }}>98 JUGADORES</div>
        </div>
      </div>

      {/* Cabecera de tabla */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 14px', background: '#F3F4F6' }}>
        <span style={{ fontSize: 7.5, fontWeight: 800, color, width: 14, transition: 'color 0.4s' }}>#</span>
        <span style={{ fontSize: 7.5, fontWeight: 800, color, flex: 1, transition: 'color 0.4s' }}>NOMBRE</span>
        <span style={{ fontSize: 7.5, fontWeight: 800, color, width: 62, transition: 'color 0.4s' }}>CATEGORÍA</span>
        <span style={{ fontSize: 7.5, fontWeight: 800, color, width: 54, textAlign: 'right', transition: 'color 0.4s' }}>ESTADO</span>
      </div>

      {/* Filas */}
      <div>
        {FILAS.map((f, i) => (
          <div key={f.nombre} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 14px', background: i % 2 === 0 ? '#fff' : '#FAFAFB' }}>
            <span style={{ fontSize: 8.5, color: '#4B5563', width: 14 }}>{i + 1}</span>
            <span style={{ fontSize: 8.5, color: '#1F2937', flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{f.nombre}</span>
            <span style={{ fontSize: 8.5, color: '#6B7280', width: 62 }}>{f.categoria}</span>
            <span style={{
              fontSize: 7.5, fontWeight: 800, width: 54, textAlign: 'right',
              color: f.estado === 'AL_DIA' ? '#22C55E' : '#EF4444',
            }}>
              {f.estado === 'AL_DIA' ? 'AL DÍA' : 'EN MORA'}
            </span>
          </div>
        ))}
      </div>

      {/* Pie */}
      <div style={{ borderTop: '1px solid #EEE', padding: '6px 14px', display: 'flex', justifyContent: 'space-between' }}>
        <span style={{ fontSize: 7, color: '#9CA3AF' }}>Generado por ZenSports</span>
        <span style={{ fontSize: 7, color: '#9CA3AF' }}>Página 1/1</span>
      </div>
    </div>
  );
}
