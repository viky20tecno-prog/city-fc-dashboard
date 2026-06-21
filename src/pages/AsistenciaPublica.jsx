import { useEffect, useState, useCallback } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';

const API = import.meta.env.VITE_API_BASE_URL || 'https://api.zensports.zenpra.ai/api';

const DIAS  = ['Dom','Lun','Mar','Mié','Jue','Vie','Sáb'];
const MESES = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];

function fmtFecha(fechaStr, horaStr) {
  if (!fechaStr) return '';
  const d = new Date(`${fechaStr}T12:00:00`);
  return `${DIAS[d.getDay()]} ${d.getDate()} ${MESES[d.getMonth()]} · ${horaStr || ''}`;
}

function Spinner({ color = '#6A00FF' }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: '60px 0' }}>
      <span style={{
        width: 36, height: 36, borderRadius: '50%',
        border: `3px solid ${color}30`,
        borderTopColor: color,
        display: 'inline-block',
        animation: 'spin .7s linear infinite',
      }} />
    </div>
  );
}

export default function AsistenciaPublica() {
  const { clubSlug, eventoId } = useParams();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || '';

  const [estado,    setEstado]    = useState('cargando'); // cargando | listo | guardando | guardado | error
  const [club,      setClub]      = useState(null);
  const [evento,    setEvento]    = useState(null);
  const [jugadores, setJugadores] = useState([]);
  const [errorMsg,  setErrorMsg]  = useState('');

  // Carga inicial
  useEffect(() => {
    document.title = 'Pasar asistencia · ZenSports';
    if (!clubSlug || !eventoId) { setEstado('error'); setErrorMsg('URL inválida'); return; }

    fetch(`${API}/publico/asistencia/${clubSlug}/${eventoId}`)
      .then(r => r.json())
      .then(data => {
        if (!data.success) { setEstado('error'); setErrorMsg(data.error || 'Evento no encontrado'); return; }
        setClub(data.club);
        setEvento(data.evento);
        setJugadores(data.jugadores.map(j => ({ ...j })));
        setEstado('listo');
        // Aplicar color del club
        document.documentElement.style.setProperty('--ac', data.club.color || '#6A00FF');
      })
      .catch(() => { setEstado('error'); setErrorMsg('Error de conexión'); });
  }, [clubSlug, eventoId]);

  const toggleJugador = useCallback((cedula) => {
    setJugadores(prev => prev.map(j =>
      j.cedula === cedula
        ? { ...j, estado: j.estado === 'PRESENTE' ? 'PENDIENTE' : 'PRESENTE' }
        : j
    ));
  }, []);

  const marcarTodos = useCallback((estado) => {
    setJugadores(prev => prev.map(j => ({ ...j, estado })));
  }, []);

  const guardar = useCallback(async () => {
    if (!token) { setErrorMsg('Token no válido. Solicita un nuevo link desde WhatsApp.'); return; }
    setEstado('guardando');
    try {
      const res = await fetch(`${API}/publico/asistencia/${clubSlug}/${eventoId}?token=${token}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jugadores: jugadores.map(j => ({ cedula: j.cedula, estado: j.estado })) }),
      });
      const data = await res.json();
      if (!data.success) {
        setErrorMsg(data.error || 'Error al guardar');
        setEstado('listo');
        return;
      }
      setEstado('guardado');
    } catch {
      setErrorMsg('Error de conexión al guardar');
      setEstado('listo');
    }
  }, [token, clubSlug, eventoId, jugadores]);

  const color    = club?.color || '#6A00FF';
  const presentes = jugadores.filter(j => j.estado === 'PRESENTE').length;
  const total     = jugadores.length;

  // ── Pantalla de éxito ────────────────────────────────────────────────────────
  if (estado === 'guardado') {
    return (
      <div style={styles.page}>
        <style>{GLOBAL_CSS}</style>
        <div style={{ ...styles.card, textAlign: 'center', padding: '48px 24px' }}>
          <div style={{ fontSize: 64, marginBottom: 16 }}>✅</div>
          <h2 style={{ color: '#fff', fontSize: 22, fontWeight: 800, marginBottom: 8 }}>
            Asistencia guardada
          </h2>
          <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 15 }}>
            {presentes} de {total} jugadores presentes
          </p>
          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13, marginTop: 24 }}>
            {club?.nombre} · {evento?.titulo}
          </p>
        </div>
      </div>
    );
  }

  // ── Error ────────────────────────────────────────────────────────────────────
  if (estado === 'error') {
    return (
      <div style={styles.page}>
        <style>{GLOBAL_CSS}</style>
        <div style={{ ...styles.card, textAlign: 'center', padding: '48px 24px' }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>⚠️</div>
          <p style={{ color: '#EF4444', fontSize: 16, fontWeight: 600 }}>{errorMsg || 'Error al cargar'}</p>
          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13, marginTop: 12 }}>
            Solicita un nuevo link desde WhatsApp
          </p>
        </div>
      </div>
    );
  }

  // ── Cargando ─────────────────────────────────────────────────────────────────
  if (estado === 'cargando') {
    return (
      <div style={styles.page}>
        <style>{GLOBAL_CSS}</style>
        <Spinner color={color} />
      </div>
    );
  }

  // ── Vista principal ──────────────────────────────────────────────────────────
  return (
    <div style={styles.page}>
      <style>{GLOBAL_CSS}</style>

      {/* Header */}
      <div style={{ ...styles.header, background: color }}>
        {club?.logo && (
          <img src={club.logo} alt="" style={{ width: 40, height: 40, borderRadius: 8, objectFit: 'contain', background: '#fff', padding: 2 }} />
        )}
        <div>
          <p style={{ color: '#fff', fontWeight: 800, fontSize: 16, lineHeight: 1.2 }}>{club?.nombre}</p>
          <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: 13, marginTop: 2 }}>
            {evento?.titulo} · {fmtFecha(evento?.fecha, evento?.hora)}
          </p>
          {evento?.lugar && (
            <p style={{ color: 'rgba(255,255,255,0.65)', fontSize: 12, marginTop: 1 }}>📍 {evento.lugar}</p>
          )}
        </div>
      </div>

      {/* Acciones rápidas */}
      <div style={styles.quickBar}>
        <button onClick={() => marcarTodos('PRESENTE')} style={{ ...styles.quickBtn, color }}>
          ✅ Todos presentes
        </button>
        <button onClick={() => marcarTodos('PENDIENTE')} style={{ ...styles.quickBtn, color: 'rgba(255,255,255,0.45)' }}>
          ⬜ Limpiar todo
        </button>
      </div>

      {/* Contador */}
      <div style={styles.counter}>
        <span style={{ color, fontWeight: 800, fontSize: 18 }}>{presentes}</span>
        <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: 14 }}> / {total} presentes</span>
      </div>

      {/* Lista de jugadores */}
      <div style={styles.list}>
        {jugadores.map(j => {
          const presente = j.estado === 'PRESENTE';
          return (
            <button
              key={j.cedula}
              onClick={() => toggleJugador(j.cedula)}
              style={{
                ...styles.jugadorRow,
                background:   presente ? `${color}18` : 'rgba(255,255,255,0.04)',
                borderColor:  presente ? `${color}60` : 'rgba(255,255,255,0.08)',
              }}
            >
              <div style={styles.jugadorNum}>{j.numero}</div>
              <div style={styles.jugadorInfo}>
                <span style={{ color: presente ? '#fff' : 'rgba(255,255,255,0.7)', fontWeight: presente ? 700 : 400, fontSize: 15 }}>
                  {j.nombre}
                </span>
                {(j.equipo || j.categoria) && (
                  <span style={{ color: 'rgba(255,255,255,0.35)', fontSize: 12, marginTop: 2 }}>
                    {[j.categoria, j.equipo].filter(Boolean).join(' · ')}
                  </span>
                )}
              </div>
              <div style={{
                width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background:  presente ? color : 'rgba(255,255,255,0.08)',
                border: `2px solid ${presente ? color : 'rgba(255,255,255,0.15)'}`,
                fontSize: 14, fontWeight: 800,
                transition: 'all 0.15s',
              }}>
                {presente ? '✓' : ''}
              </div>
            </button>
          );
        })}
      </div>

      {/* Spacer para el botón sticky */}
      <div style={{ height: 90 }} />

      {/* Botón guardar sticky */}
      <div style={styles.stickyBar}>
        {errorMsg && (
          <p style={{ color: '#EF4444', fontSize: 12, textAlign: 'center', marginBottom: 8 }}>{errorMsg}</p>
        )}
        <button
          onClick={guardar}
          disabled={estado === 'guardando'}
          style={{
            ...styles.saveBtn,
            background: color,
            opacity: estado === 'guardando' ? 0.7 : 1,
          }}
        >
          {estado === 'guardando'
            ? 'Guardando…'
            : `Guardar asistencia · ${presentes} presentes`}
        </button>
      </div>
    </div>
  );
}

// ── Estilos ──────────────────────────────────────────────────────────────────
const styles = {
  page: {
    minHeight: '100vh',
    background: '#0B0D1A',
    fontFamily: "'Space Grotesk', sans-serif",
    paddingBottom: 0,
  },
  card: {
    margin: '40px auto',
    maxWidth: 440,
    background: 'rgba(255,255,255,0.05)',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: 20,
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    gap: 14,
    padding: '18px 20px',
  },
  quickBar: {
    display: 'flex',
    gap: 8,
    padding: '12px 16px',
    borderBottom: '1px solid rgba(255,255,255,0.06)',
  },
  quickBtn: {
    flex: 1,
    background: 'rgba(255,255,255,0.06)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: 10,
    padding: '8px 4px',
    fontSize: 13,
    fontWeight: 600,
    cursor: 'pointer',
    fontFamily: 'inherit',
  },
  counter: {
    padding: '10px 20px 6px',
    borderBottom: '1px solid rgba(255,255,255,0.06)',
  },
  list: {
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
    padding: '8px 12px',
  },
  jugadorRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    padding: '10px 12px',
    borderRadius: 12,
    border: '1px solid',
    cursor: 'pointer',
    textAlign: 'left',
    width: '100%',
    transition: 'background 0.15s, border-color 0.15s',
    fontFamily: 'inherit',
  },
  jugadorNum: {
    width: 24,
    textAlign: 'right',
    color: 'rgba(255,255,255,0.25)',
    fontSize: 12,
    fontWeight: 600,
    flexShrink: 0,
  },
  jugadorInfo: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    minWidth: 0,
  },
  stickyBar: {
    position: 'fixed',
    bottom: 0,
    left: 0,
    right: 0,
    padding: '12px 16px 20px',
    background: 'rgba(11,13,26,0.95)',
    backdropFilter: 'blur(12px)',
    borderTop: '1px solid rgba(255,255,255,0.08)',
  },
  saveBtn: {
    width: '100%',
    padding: '15px',
    borderRadius: 14,
    border: 'none',
    color: '#fff',
    fontSize: 16,
    fontWeight: 700,
    cursor: 'pointer',
    fontFamily: 'inherit',
    transition: 'opacity 0.15s',
  },
};

const GLOBAL_CSS = `
  @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { background: #0B0D1A; }
`;
