import { useState } from 'react';
import {
  RefreshCw, LayoutDashboard, Users, Shirt, Activity,
  Clock, MessageSquare, ClipboardCheck, Settings,
  Copy, Check, Bell,
} from 'lucide-react';
import { useSheetData } from '../hooks/useSheetData';
import DashboardOverview from '../components/DashboardOverview';
import JugadoresTable from '../components/JugadoresTable';
import Uniformes from '../components/Uniformes';
import ArbitrajePagos from './ArbitrajePagos';
import TimelineCobro from '../components/TimelineCobro';
import WhatsAppMockup from '../components/WhatsAppMockup';
import Conciliacion from '../components/Conciliacion';
import PagoManualModal from '../components/PagoManualModal';

const NAV = [
  { id: 'dashboard',    Icon: LayoutDashboard, title: 'Dashboard'     },
  { id: 'jugadores',    Icon: Users,            title: 'Jugadores'     },
  { id: 'uniformes',    Icon: Shirt,            title: 'Uniformes'     },
  { id: 'arbitraje',    Icon: Activity,         title: 'Pago Arbitraje'},
  { id: 'cobro',        Icon: Clock,            title: 'Ciclo de Cobro'},
  { id: 'whatsapp',     Icon: MessageSquare,    title: 'WhatsApp Bot'  },
  { id: 'conciliacion', Icon: ClipboardCheck,   title: 'Conciliación'  },
];

/* ── estilos del shell (no usan Tailwind para respetar el grid exacto del diseño) ── */
const S = {
  shell: {
    display: 'grid',
    gridTemplateRows: '58px 1fr',
    gridTemplateColumns: '64px 1fr',
    height: '100vh',
    overflow: 'hidden',
    fontFamily: "'Inter', system-ui, sans-serif",
    background: '#0A0A0A',
  },
  topbar: {
    gridColumn: '1 / -1',
    background: 'rgba(18,18,18,0.96)',
    borderBottom: '1px solid rgba(225,73,36,0.2)',
    backdropFilter: 'blur(12px)',
    display: 'flex',
    alignItems: 'center',
    padding: '0 18px 0 16px',
    gap: '12px',
    position: 'relative',
    zIndex: 50,
  },
  sep: {
    width: '1px', height: '30px',
    background: 'rgba(225,73,36,0.25)',
    flexShrink: 0,
  },
  sidebar: {
    background: 'rgba(15,15,15,0.98)',
    borderRight: '1px solid rgba(225,73,36,0.15)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: '14px 0 12px',
    gap: '4px',
    overflowY: 'auto',
    scrollbarWidth: 'none',
  },
  main: {
    overflowY: 'auto',
    padding: '16px 18px 24px',
    scrollbarWidth: 'thin',
    scrollbarColor: 'rgba(225,73,36,0.2) transparent',
  },
  iconBtn: (active) => ({
    width: '42px', height: '42px',
    borderRadius: '10px',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    cursor: 'pointer',
    border: 'none',
    background: active ? 'rgba(225,73,36,0.12)' : 'transparent',
    position: 'relative',
    transition: 'all 0.2s',
    flexShrink: 0,
  }),
  actionBtn: (primary) => ({
    padding: '6px 12px',
    borderRadius: '8px',
    border: `1px solid ${primary ? 'rgba(225,73,36,0.3)' : 'rgba(182,134,49,0.3)'}`,
    background: primary ? 'rgba(225,73,36,0.08)' : 'rgba(182,134,49,0.08)',
    color: primary ? '#E14924' : '#B68631',
    fontSize: '11px', letterSpacing: '1px',
    cursor: 'pointer',
    transition: 'all 0.2s',
    whiteSpace: 'nowrap',
    flexShrink: 0,
  }),
  roundBtn: {
    width: '34px', height: '34px',
    borderRadius: '8px',
    border: '1px solid rgba(225,73,36,0.25)',
    background: 'rgba(225,73,36,0.06)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    cursor: 'pointer',
    position: 'relative',
    flexShrink: 0,
    transition: 'all 0.2s',
  },
};

function NavBtn({ id, Icon, title, active, onClick }) {
  return (
    <button style={S.iconBtn(active)} onClick={() => onClick(id)} title={title}>
      {active && (
        <div style={{
          position: 'absolute', left: 0, top: '50%', transform: 'translateY(-50%)',
          width: '3px', height: '24px',
          background: '#E14924', borderRadius: '0 2px 2px 0',
          boxShadow: '0 0 8px #E14924, 0 0 16px rgba(225,73,36,0.4)',
          pointerEvents: 'none',
        }} />
      )}
      <Icon
        size={18}
        color={active ? '#E14924' : '#7A7A7A'}
        style={active ? { filter: 'drop-shadow(0 0 5px rgba(225,73,36,0.9))' } : {}}
        strokeWidth={1.7}
      />
    </button>
  );
}

export default function Dashboard() {
  const {
    jugadores, mensualidades, uniformes, torneos,
    registroPagos, morosos, suspensiones,
    loading, error, refresh,
  } = useSheetData();

  const [activeTab,     setActiveTab]     = useState('dashboard');
  const [refreshing,    setRefreshing]    = useState(false);
  const [linkCopied,    setLinkCopied]    = useState(false);
  const [showPagoModal, setShowPagoModal] = useState(false);

  const handleRefresh = async () => {
    setRefreshing(true);
    await refresh();
    setRefreshing(false);
  };

  const inscripcionUrl = `${window.location.origin}/inscripcion`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(inscripcionUrl);
    setLinkCopied(true);
    setTimeout(() => setLinkCopied(false), 2000);
  };

  const nowStr = new Date()
    .toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })
    .toUpperCase();

  return (
    <div style={S.shell}>

      {/* ───── TOPBAR ───── */}
      <header style={S.topbar}>
        {/* gradiente inferior */}
        <div style={{
          position: 'absolute', bottom: 0, left: 0, right: 0, height: '1px',
          background: 'linear-gradient(90deg, transparent 0%, rgba(225,73,36,0.5) 30%, rgba(182,134,49,0.3) 70%, transparent 100%)',
          pointerEvents: 'none',
        }} />

        {/* Escudo SVG */}
        <svg width="38" height="44" viewBox="0 0 38 44" fill="none" style={{ flexShrink: 0 }}>
          <path d="M19 2L3 8.5V22C3 32.8 10 40.5 19 43C28 40.5 35 32.8 35 22V8.5L19 2Z"
                fill="#161616" stroke="#E14924" strokeWidth="1.4"/>
          <path d="M19 5L6 10.8V22C6 31.4 11.5 38.2 19 40.5C26.5 38.2 32 31.4 32 22V10.8L19 5Z"
                fill="rgba(225,73,36,0.07)" stroke="rgba(225,73,36,0.18)" strokeWidth="0.8"/>
          <line x1="6" y1="21" x2="32" y2="21" stroke="#E14924" strokeWidth="0.7" opacity="0.4"/>
          <text x="19" y="18.5" textAnchor="middle" fill="#E14924"
                fontFamily="Bebas Neue, sans-serif" fontSize="9.5" letterSpacing="1.5">CFC</text>
          <line x1="13" y1="24" x2="25" y2="24" stroke="#B68631" strokeWidth="0.8" opacity="0.6"/>
          <text x="19" y="35" textAnchor="middle" fill="#B68631" fontFamily="Arial" fontSize="6.5" letterSpacing="1">★ ★ ★</text>
        </svg>

        {/* Nombre del club */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1px', flexShrink: 0 }}>
          <span style={{ fontFamily: "'Bebas Neue', cursive", fontSize: '20px', letterSpacing: '3px', lineHeight: 1, color: '#fff' }}>
            CITY F.C.<span style={{ color: '#B68631', marginLeft: '4px', fontSize: '12px' }}>★</span>
          </span>
          <span style={{ fontSize: '9px', letterSpacing: '3.5px', textTransform: 'uppercase', color: '#7A7A7A' }}>
            Lo Hacemos Diferente
          </span>
        </div>

        <div style={S.sep} />
        <div style={{ flex: 1 }} />

        {/* Indicador en vivo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '10px', letterSpacing: '2px', color: '#7A7A7A', textTransform: 'uppercase', flexShrink: 0 }}>
          <div style={{ width: '6px', height: '6px', background: '#22C55E', borderRadius: '50%', boxShadow: '0 0 6px #22C55E', animation: 'pulse-green 2s ease-in-out infinite' }} />
          En Vivo
        </div>

        <div style={S.sep} />

        {/* Fecha */}
        <div style={{ fontSize: '11px', color: '#7A7A7A', letterSpacing: '1px', textTransform: 'uppercase', flexShrink: 0 }}>
          {nowStr}
        </div>

        <div style={S.sep} />

        {/* Pago Manual */}
        <button style={S.actionBtn(true)} onClick={() => setShowPagoModal(true)}>
          PAGO MANUAL
        </button>

        {/* Inscripción */}
        <button style={S.actionBtn(false)} onClick={() => window.open(inscripcionUrl, '_blank')}>
          INSCRIPCIÓN
        </button>

        {/* Copiar link */}
        <div style={S.roundBtn} onClick={handleCopyLink} title="Copiar link de inscripción">
          {linkCopied
            ? <Check size={14} color="#22C55E" />
            : <Copy size={14} color="#7A7A7A" />}
        </div>

        {/* Refresh */}
        <div
          style={S.roundBtn}
          onClick={handleRefresh}
          title="Actualizar datos"
        >
          <RefreshCw
            size={14}
            color="#7A7A7A"
            style={{ animation: (refreshing || loading) ? 'spin 1s linear infinite' : 'none' }}
          />
        </div>

        {/* Notificaciones */}
        <div style={S.roundBtn} title="Notificaciones">
          <Bell size={14} color="#7A7A7A" />
          <span style={{
            position: 'absolute', top: '6px', right: '7px',
            width: '6px', height: '6px',
            background: '#E14924', borderRadius: '50%',
            boxShadow: '0 0 6px #E14924',
          }} />
        </div>
      </header>

      {/* ───── SIDEBAR ───── */}
      <nav style={S.sidebar}>
        {NAV.map(({ id, Icon, title }) => (
          <NavBtn key={id} id={id} Icon={Icon} title={title} active={activeTab === id} onClick={setActiveTab} />
        ))}

        <div style={{ flex: 1 }} />

        <button style={S.iconBtn(false)} title="Configuración">
          <Settings size={18} color="#7A7A7A" strokeWidth={1.7} />
        </button>
      </nav>

      {/* ───── MAIN ───── */}
      <main style={S.main}>
        {/* Marca de agua — logo oficial del club, persiste en todos los tabs */}
        <div style={{
          position: 'fixed',
          top: '50%',
          left: 'calc(64px + (100vw - 64px) / 2)',
          transform: 'translate(-50%, -50%)',
          width: '500px', height: '500px',
          pointerEvents: 'none',
          zIndex: 0,
          opacity: 0.06,
        }}>
          <img
            src="/logo_marca_agua.png"
            alt=""
            style={{ width: '100%', height: '100%', objectFit: 'contain', filter: 'invert(1) brightness(1.8)' }}
          />
        </div>
        {loading ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '200px' }}>
            <RefreshCw size={24} color="#E14924" style={{ animation: 'spin 1s linear infinite' }} />
          </div>
        ) : error ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '200px' }}>
            <div style={{ textAlign: 'center', color: '#E14924', fontSize: '14px' }}>
              Error de conexión: {error}
              <button
                onClick={refresh}
                style={{ display: 'block', margin: '12px auto 0', padding: '6px 16px', borderRadius: '8px', border: '1px solid rgba(225,73,36,0.3)', background: 'rgba(225,73,36,0.08)', color: '#E14924', cursor: 'pointer', fontSize: '12px' }}
              >
                Reintentar
              </button>
            </div>
          </div>
        ) : (
          <>
            {activeTab === 'dashboard' && (
              <DashboardOverview
                jugadores={jugadores}
                mensualidades={mensualidades}
                morosos={morosos}
              />
            )}
            {activeTab === 'jugadores' && (
              <JugadoresTable
                jugadores={jugadores}
                mensualidades={mensualidades}
                uniformes={uniformes}
                torneos={torneos}
                registroPagos={registroPagos}
                suspensiones={suspensiones}
                morosos={morosos}
                onRefresh={handleRefresh}
              />
            )}
            {activeTab === 'uniformes'    && <Uniformes />}
            {activeTab === 'arbitraje'    && <ArbitrajePagos />}
            {activeTab === 'cobro'        && <TimelineCobro />}
            {activeTab === 'whatsapp'     && <WhatsAppMockup />}
            {activeTab === 'conciliacion' && <Conciliacion />}
          </>
        )}
      </main>

      {showPagoModal && (
        <PagoManualModal
          jugadores={jugadores}
          onClose={() => setShowPagoModal(false)}
          onSuccess={handleRefresh}
        />
      )}
    </div>
  );
}
