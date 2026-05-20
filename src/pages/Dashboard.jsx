import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  RefreshCw, LayoutDashboard, Users, Shirt, Activity,
  Clock, ClipboardCheck, Settings,
  Copy, Check, Bell, LogOut, TrendingUp, Trophy, CalendarDays,
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { authFetch } from '../lib/authFetch';
import { useAppData } from '../hooks/useAppData';
import { useClubConfig } from '../hooks/useClubConfig';
import { useRole } from '../hooks/useRole';
import { getClubId } from '../services/api';
import { API_BASE_URL } from '../config';
import DashboardOverview from '../components/DashboardOverview';
import JugadoresTable from '../components/JugadoresTable';
import Uniformes from '../components/Uniformes';
import ArbitrajePagos from './ArbitrajePagos';
import TimelineCobro from '../components/TimelineCobro';
import Conciliacion from '../components/Conciliacion';
import Finanzas from '../components/Finanzas';
import TorneosPage from '../components/TorneosPage';
import PagoManualModal from '../components/PagoManualModal';
import OnboardingWizard from '../components/OnboardingWizard';
import ThemeSelector, { applyTheme, getStoredTheme } from '../components/ThemeSelector';
import CategoriasJugadoresModal from '../components/CategoriasJugadoresModal';
import MiEquipoModal from '../components/MiEquipoModal';
import Calendario from '../components/Calendario';
import ErrorBoundary from '../components/ErrorBoundary';

const NAV = [
  { id: 'dashboard',    Icon: LayoutDashboard, title: 'Dashboard'     },
  { id: 'jugadores',    Icon: Users,            title: 'Jugadores'     },
  { id: 'calendario',   Icon: CalendarDays,     title: 'Calendario'    },
  { id: 'uniformes',    Icon: Shirt,            title: 'Uniformes'     },
  { id: 'torneos',      Icon: Trophy,           title: 'Torneos'       },
  { id: 'arbitraje',    Icon: Activity,         title: 'Pago Arbitraje'},
  { id: 'cobro',        Icon: Clock,            title: 'Ciclo de Cobro'},
  { id: 'conciliacion', Icon: ClipboardCheck,   title: 'Conciliación'  },
  { id: 'finanzas',     Icon: TrendingUp,       title: 'Finanzas'      },
];

function NavBtn({ id, Icon, title, active, color, onClick }) {
  return (
    <button
      style={{
        width: '42px', height: '42px',
        borderRadius: '10px',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        cursor: 'pointer',
        border: 'none',
        background: active ? `${color}1F` : 'transparent',
        position: 'relative',
        transition: 'background-color 0.2s',
        flexShrink: 0,
      }}
      onClick={() => onClick(id)}
      title={title}
    >
      {active && (
        <div style={{
          position: 'absolute', left: 0, top: '50%', transform: 'translateY(-50%)',
          width: '3px', height: '24px',
          background: color, borderRadius: '0 2px 2px 0',
          boxShadow: `0 0 8px ${color}, 0 0 16px ${color}66`,
          pointerEvents: 'none',
          transition: 'background 0.3s, box-shadow 0.3s',
        }} />
      )}
      <Icon
        size={18}
        color={active ? color : 'var(--text-mut)'}
        style={active ? { filter: `drop-shadow(0 0 5px ${color}E6)`, transition: 'filter 0.3s' } : {}}
        strokeWidth={1.7}
      />
    </button>
  );
}

export default function Dashboard() {
  const navigate = useNavigate();
  const { config: clubConfig, refetch: refetchConfig } = useClubConfig();
  const {
    jugadores, mensualidades, uniformes, torneos,
    registroPagos, morosos, suspensiones,
    loading, error, refresh,
  } = useAppData();

  const [activeTab,       setActiveTab]       = useState('dashboard');
  const [refreshing,      setRefreshing]      = useState(false);
  const [linkCopied,      setLinkCopied]      = useState(false);
  const [showPagoModal,   setShowPagoModal]   = useState(false);
  const [showOnboarding,   setShowOnboarding]   = useState(false);
  const [showTheme,        setShowTheme]        = useState(false);
  const [showCategorias,   setShowCategorias]   = useState(false);
  const [showEquipo,       setShowEquipo]       = useState(false);
  const [colorOverride,    setColorOverride]    = useState(null);

  // ── Trial ──
  const trialActivo    = clubConfig?.plan === 'trial' && clubConfig?.trial_ends_at;
  const trialDaysLeft  = trialActivo
    ? Math.ceil((new Date(clubConfig.trial_ends_at) - new Date()) / 86400000)
    : null;
  const trialExpirado  = trialActivo && trialDaysLeft <= 0;

  // Mostrar onboarding solo cuando el config ya cargó y no está completado
  useEffect(() => {
    if (clubConfig && !clubConfig.onboarding_completed) {
      setShowOnboarding(true);
    }
  }, [clubConfig]);

  const c = colorOverride || clubConfig?.color || '#E14924';

  // Cambia el color del club: aplica CSS vars inmediatamente y persiste en API
  const handleColorChange = async (newColor) => {
    setColorOverride(newColor);
    document.documentElement.style.setProperty('--cc',   newColor);
    document.documentElement.style.setProperty('--cc12', `${newColor}1F`);
    document.documentElement.style.setProperty('--cc20', `${newColor}33`);
    document.documentElement.style.setProperty('--cc30', `${newColor}4D`);
    document.documentElement.style.setProperty('--cc50', `${newColor}80`);
    try {
      await authFetch(`${API_BASE_URL}/config?club_id=${getClubId()}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ color: newColor }),
      });
    } catch (err) {
      console.error('Error guardando color:', err);
    }
  };

  // Aplica tema guardado al montar
  useEffect(() => { applyTheme(getStoredTheme()); }, []);

  // Inyecta el color del club como variables CSS globales y persiste codigo_pais
  useEffect(() => {
    document.documentElement.style.setProperty('--cc',   c);
    document.documentElement.style.setProperty('--cc12', `${c}1F`);
    document.documentElement.style.setProperty('--cc20', `${c}33`);
    document.documentElement.style.setProperty('--cc30', `${c}4D`);
    document.documentElement.style.setProperty('--cc50', `${c}80`);
    if (clubConfig?.codigo_pais) {
      localStorage.setItem('codigoPais', clubConfig.codigo_pais);
    }
  }, [c, clubConfig?.codigo_pais]);

  // Iniciales del escudo: máx 3 letras de las primeras palabras del nombre
  const initials = clubConfig?.nombre
    ? clubConfig.nombre.split(' ').slice(0, 3).map(w => w[0]).join('').toUpperCase().slice(0, 3)
    : '?';

  useEffect(() => {
    document.title = clubConfig?.nombre
      ? `${clubConfig.nombre} — ZenSports`
      : 'ZenSports — App';
  }, [clubConfig?.nombre]);

  const { isAdmin } = useRole();

  // Filtra el nav según los módulos habilitados en el plan del club y el rol del usuario.
  const ADMIN_ONLY_TABS = new Set(['cobro', 'conciliacion', 'finanzas']);
  const modulos = clubConfig?.modulos;
  const navVisible = NAV.filter(({ id }) => {
    if (!isAdmin && ADMIN_ONLY_TABS.has(id)) return false;
    if (id === 'dashboard' || id === 'jugadores') return true;
    if (!modulos) return true;
    return modulos[id] !== false;
  });

  const S = {
    shell: {
      display: 'grid',
      gridTemplateRows: '58px 1fr',
      gridTemplateColumns: '64px 1fr',
      height: '100vh',
      overflow: 'hidden',
      fontFamily: "'Inter', system-ui, sans-serif",
      background: 'var(--bg-app)',
    },
    topbar: {
      gridColumn: '1 / -1',
      background: 'var(--bg-card)',
      borderBottom: `1px solid ${c}33`,
      backdropFilter: 'blur(12px)',
      display: 'flex',
      alignItems: 'center',
      padding: '0 18px 0 16px',
      gap: '12px',
      position: 'relative',
      zIndex: 50,
      transition: 'border-color 0.5s',
    },
    sep: {
      width: '1px', height: '30px',
      background: `${c}40`,
      flexShrink: 0,
      transition: 'background 0.5s',
    },
    sidebar: {
      background: 'var(--bg-card)',
      borderRight: `1px solid ${c}26`,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      padding: '14px 0 12px',
      gap: '4px',
      overflowY: 'auto',
      scrollbarWidth: 'none',
      transition: 'border-color 0.5s',
    },
    main: {
      overflowY: 'auto',
      padding: '16px 18px 24px',
      background: 'var(--bg-app)',
      scrollbarWidth: 'thin',
      scrollbarColor: `${c}33 transparent`,
    },
    iconBtn: (active) => ({
      width: '42px', height: '42px',
      borderRadius: '10px',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      cursor: 'pointer',
      border: 'none',
      background: active ? `${c}1F` : 'transparent',
      position: 'relative',
      transition: 'background-color 0.2s',
      flexShrink: 0,
    }),
    actionBtn: (primary) => ({
      padding: '6px 12px',
      borderRadius: '8px',
      border: `1px solid ${primary ? `${c}4D` : 'rgba(182,134,49,0.3)'}`,
      background: primary ? `${c}14` : 'rgba(182,134,49,0.08)',
      color: primary ? c : '#B68631',
      fontSize: '11px', letterSpacing: '1px',
      cursor: 'pointer',
      transition: 'background-color 0.2s, border-color 0.2s, color 0.2s',
      whiteSpace: 'nowrap',
      flexShrink: 0,
    }),
    roundBtn: {
      width: '34px', height: '34px',
      borderRadius: '8px',
      border: `1px solid ${c}40`,
      background: `${c}0F`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      cursor: 'pointer',
      position: 'relative',
      flexShrink: 0,
      transition: 'background-color 0.2s, border-color 0.2s',
    },
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    localStorage.removeItem('clubId');
    localStorage.removeItem('userRole');
    navigate('/login');
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await refresh();
    setRefreshing(false);
  };

  const clubId = localStorage.getItem('clubId') || 'city-fc';
  const inscripcionUrl = `${window.location.origin}/inscripcion?club_id=${clubId}`;

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
        <div style={{
          position: 'absolute', bottom: 0, left: 0, right: 0, height: '1px',
          background: `linear-gradient(90deg, transparent 0%, ${c}80 30%, ${c}4D 70%, transparent 100%)`,
          pointerEvents: 'none',
          transition: 'background 0.5s',
        }} />

        {/* Logo o escudo del club */}
        {clubConfig?.logo_url ? (
          <img
            src={clubConfig.logo_url}
            alt={clubConfig.nombre || 'Logo'}
            style={{ width: 38, height: 38, borderRadius: 8, objectFit: 'contain', flexShrink: 0 }}
            onError={e => { e.target.style.display = 'none'; }}
          />
        ) : (
          <svg width="38" height="44" viewBox="0 0 38 44" fill="none" style={{ flexShrink: 0 }}>
            <path d="M19 2L3 8.5V22C3 32.8 10 40.5 19 43C28 40.5 35 32.8 35 22V8.5L19 2Z"
                  fill="#161616" stroke={c} strokeWidth="1.4"/>
            <path d="M19 5L6 10.8V22C6 31.4 11.5 38.2 19 40.5C26.5 38.2 32 31.4 32 22V10.8L19 5Z"
                  fill={`${c}12`} stroke={`${c}2E`} strokeWidth="0.8"/>
            <line x1="6" y1="21" x2="32" y2="21" stroke={c} strokeWidth="0.7" opacity="0.4"/>
            <text x="19" y="18.5" textAnchor="middle" fill={c}
                  fontFamily="Bebas Neue, sans-serif" fontSize="9.5" letterSpacing="1.5">{initials}</text>
            <line x1="13" y1="24" x2="25" y2="24" stroke="#B68631" strokeWidth="0.8" opacity="0.6"/>
            <text x="19" y="35" textAnchor="middle" fill="#B68631" fontFamily="Arial" fontSize="6.5" letterSpacing="1">★ ★ ★</text>
          </svg>
        )}

        {/* Nombre del club */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1px', flexShrink: 0 }}>
          <span style={{ fontFamily: "'Bebas Neue', cursive", fontSize: '20px', letterSpacing: '3px', lineHeight: 1, color: 'var(--text-pri)' }}>
            {clubConfig?.nombre || 'Mi Club'}
          </span>
          <span style={{ fontSize: '9px', letterSpacing: '3.5px', textTransform: 'uppercase', color: 'var(--text-mut)' }}>
            {clubConfig?.subtitulo || ''}
          </span>
        </div>

        <div style={S.sep} />
        <div style={{ flex: 1 }} />

        {/* Indicador en vivo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '10px', letterSpacing: '2px', color: 'var(--text-mut)', textTransform: 'uppercase', flexShrink: 0 }}>
          <div style={{ width: '6px', height: '6px', background: '#22C55E', borderRadius: '50%', boxShadow: '0 0 6px #22C55E', animation: 'pulse-green 2s ease-in-out infinite' }} />
          En Vivo
        </div>

        <div style={S.sep} />

        {/* Fecha */}
        <div style={{ fontSize: '11px', color: 'var(--text-mut)', letterSpacing: '1px', textTransform: 'uppercase', flexShrink: 0 }}>
          {nowStr}
        </div>

        <div style={S.sep} />

        {/* Indicador de Trial */}
        {trialActivo && !trialExpirado && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: '5px',
            padding: '3px 10px', borderRadius: '20px',
            background: trialDaysLeft <= 2 ? 'rgba(239,68,68,0.12)' : 'rgba(245,158,11,0.12)',
            border: `1px solid ${trialDaysLeft <= 2 ? 'rgba(239,68,68,0.35)' : 'rgba(245,158,11,0.35)'}`,
            fontSize: '10px', fontWeight: 700, letterSpacing: '0.5px',
            color: trialDaysLeft <= 2 ? '#EF4444' : '#F59E0B',
            flexShrink: 0,
            textTransform: 'uppercase',
          }}>
            <Clock size={10} />
            Trial: {trialDaysLeft}d
          </div>
        )}

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
            : <Copy size={14} color="var(--text-sec)" />}
        </div>

        {/* Refresh */}
        <div style={S.roundBtn} onClick={handleRefresh} title="Actualizar datos">
          <RefreshCw
            size={14}
            color="var(--text-sec)"
            style={{ animation: (refreshing || loading) ? 'spin 1s linear infinite' : 'none' }}
          />
        </div>

        {/* Notificaciones */}
        <div style={S.roundBtn} title="Notificaciones">
          <Bell size={14} color="var(--text-sec)" />
          <span style={{
            position: 'absolute', top: '6px', right: '7px',
            width: '6px', height: '6px',
            background: c, borderRadius: '50%',
            boxShadow: `0 0 6px ${c}`,
            transition: 'background 0.5s, box-shadow 0.5s',
          }} />
        </div>
      </header>

      {/* ───── SIDEBAR ───── */}
      <nav style={S.sidebar}>
        {navVisible.map(({ id, Icon, title }) => (
          <NavBtn key={id} id={id} Icon={Icon} title={title} active={activeTab === id} color={c} onClick={setActiveTab} />
        ))}

        <div style={{ flex: 1 }} />

        <button
          style={{ ...S.iconBtn(showTheme), position: 'relative' }}
          title="Apariencia y configuración"
          onClick={() => setShowTheme(v => !v)}
        >
          <Settings size={18} color={showTheme ? c : 'var(--text-mut)'} strokeWidth={1.7} />
        </button>
        <button style={S.iconBtn(false)} title="Cerrar sesión" onClick={handleLogout}>
          <LogOut size={18} color="var(--text-sec)" strokeWidth={1.7} />
        </button>
      </nav>

      {/* ───── TRIAL EXPIRADO — overlay bloqueante ───── */}
      {trialExpirado && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 500,
          background: 'rgba(0,0,0,0.92)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: '24px',
        }}>
          <div style={{
            background: 'var(--bg-surface)',
            border: '1px solid rgba(239,68,68,0.35)',
            borderRadius: '20px',
            padding: '40px 36px',
            maxWidth: '440px', width: '100%',
            textAlign: 'center',
            display: 'flex', flexDirection: 'column', gap: '20px', alignItems: 'center',
          }}>
            <div style={{ lineHeight: 1 }}><Clock size={48} color="#EF4444" strokeWidth={1.5} /></div>
            <div>
              <div style={{ fontFamily: "'Bebas Neue', cursive", fontSize: '28px', letterSpacing: '3px', color: 'var(--text-pri)', marginBottom: '8px' }}>
                Tu período de prueba terminó
              </div>
              <div style={{ color: 'var(--text-sec)', fontSize: '14px', lineHeight: 1.6 }}>
                El trial de <strong style={{ color: 'var(--text-pri)' }}>{clubConfig?.nombre}</strong> venció.
                Activa un plan para seguir usando la plataforma.
              </div>
            </div>
            <div style={{
              background: 'var(--bg-card)', borderRadius: '12px', padding: '16px 20px',
              border: '1px solid var(--border-sub)', width: '100%', textAlign: 'left',
              display: 'flex', flexDirection: 'column', gap: '6px',
            }}>
              <div style={{ fontSize: '11px', color: 'var(--text-mut)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '4px' }}>¿Qué hacer ahora?</div>
              <div style={{ fontSize: '13px', color: 'var(--text-sec)' }}>1. Elige un plan en zensports.vercel.app</div>
              <div style={{ fontSize: '13px', color: 'var(--text-sec)' }}>2. Envíanos tu comprobante de pago</div>
              <div style={{ fontSize: '13px', color: 'var(--text-sec)' }}>3. Activamos tu cuenta en minutos</div>
            </div>
            <div style={{ display: 'flex', gap: '10px', width: '100%' }}>
              <button
                onClick={handleLogout}
                style={{ flex: 1, padding: '10px', borderRadius: '10px', border: '1px solid var(--border-sub)', background: 'var(--bg-card)', color: 'var(--text-sec)', fontSize: '13px', cursor: 'pointer' }}
              >
                Cerrar sesión
              </button>
              <a
                href="https://wa.me/573204409015?text=Quiero%20activar%20mi%20plan%20de%20ZenSports"
                target="_blank"
                rel="noreferrer"
                style={{ flex: 1, padding: '10px', borderRadius: '10px', border: '1px solid rgba(34,197,94,0.35)', background: 'rgba(34,197,94,0.12)', color: '#22C55E', fontSize: '13px', fontWeight: 600, cursor: 'pointer', textDecoration: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                Contactar ventas
              </a>
            </div>
          </div>
        </div>
      )}

      {/* ───── MAIN ───── */}
      <main style={S.main}>
        {/* Banner trial próximo a vencer (≤3 días, no expirado) */}
        {trialActivo && !trialExpirado && trialDaysLeft <= 3 && (
          <div style={{
            marginBottom: '14px',
            padding: '10px 16px',
            borderRadius: '12px',
            background: trialDaysLeft <= 1 ? 'rgba(239,68,68,0.08)' : 'rgba(245,158,11,0.08)',
            border: `1px solid ${trialDaysLeft <= 1 ? 'rgba(239,68,68,0.30)' : 'rgba(245,158,11,0.30)'}`,
            display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px',
            flexWrap: 'wrap',
          }}>
            <div style={{ fontSize: '13px', color: trialDaysLeft <= 1 ? '#EF4444' : '#F59E0B', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '6px' }}>
              <AlertTriangle size={13} />
              Tu período de prueba vence {trialDaysLeft === 0 ? 'hoy' : `en ${trialDaysLeft} día${trialDaysLeft !== 1 ? 's' : ''}`}.
              Activa un plan para no perder el acceso.
            </div>
            <a
              href="https://zensports.vercel.app#precios"
              target="_blank"
              rel="noreferrer"
              style={{ fontSize: '12px', fontWeight: 600, color: trialDaysLeft <= 1 ? '#EF4444' : '#F59E0B', textDecoration: 'underline', whiteSpace: 'nowrap' }}
            >
              Ver planes →
            </a>
          </div>
        )}

        {clubConfig?.logo_url && (
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
              src={clubConfig.logo_url}
              alt=""
              style={{ width: '100%', height: '100%', objectFit: 'contain', filter: 'invert(1) brightness(1.8)' }}
            />
          </div>
        )}

        {loading ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '200px' }}>
            <RefreshCw size={24} color={c} style={{ animation: 'spin 1s linear infinite' }} />
          </div>
        ) : error ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '200px' }}>
            <div style={{ textAlign: 'center', color: c, fontSize: '14px' }}>
              Error de conexión: {error}
              <button
                onClick={refresh}
                style={{ display: 'block', margin: '12px auto 0', padding: '6px 16px', borderRadius: '8px', border: `1px solid ${c}4D`, background: `${c}14`, color: c, cursor: 'pointer', fontSize: '12px' }}
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
                codigoPais={clubConfig?.codigo_pais || '57'}
                color={c}
                clubNombre={clubConfig?.nombre}
                logoUrl={clubConfig?.logo_url}
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
                categoriasJugadores={clubConfig?.categorias_jugadores || []}
                clubConfig={clubConfig}
                color={c}
              />
            )}
            {activeTab === 'calendario'   && <Calendario    color={c} clubId={getClubId()} />}
            {activeTab === 'uniformes'    && <Uniformes    color={c} clubNombre={clubConfig?.nombre} clubConfig={clubConfig} />}
            {activeTab === 'torneos'      && <TorneosPage  color={c} clubNombre={clubConfig?.nombre} clubConfig={clubConfig} />}
            {activeTab === 'arbitraje'    && <ArbitrajePagos color={c} />}
            {activeTab === 'cobro'        && <TimelineCobro  color={c} />}
            {activeTab === 'conciliacion' && <Conciliacion   color={c} />}
            {activeTab === 'finanzas'     && <Finanzas color={c} clubNombre={clubConfig?.nombre} clubConfig={clubConfig} />}
          </>
        )}
      </main>

      {showPagoModal && (
        <PagoManualModal
          jugadores={jugadores}
          catalogoUniformes={clubConfig?.prendas_uniforme || []}
          torneosConfig={clubConfig?.torneos_iniciales || []}
          valorMensualidad={clubConfig?.valor_mensualidad || 0}
          onClose={() => setShowPagoModal(false)}
          onSuccess={handleRefresh}
        />
      )}

      {showOnboarding && (
        <ErrorBoundary>
          <OnboardingWizard
            color={c}
            clubConfig={clubConfig}
            onComplete={() => { setShowOnboarding(false); refetchConfig(); }}
          />
        </ErrorBoundary>
      )}

      {showTheme && (
        <ThemeSelector
          color={c}
          onClose={() => setShowTheme(false)}
          onOpenConfig={() => { setShowTheme(false); setShowOnboarding(true); }}
          onOpenCategorias={() => { setShowTheme(false); setShowCategorias(true); }}
          onOpenEquipo={isAdmin ? () => { setShowTheme(false); setShowEquipo(true); } : undefined}
          onColorChange={handleColorChange}
        />
      )}

      {showCategorias && (
        <CategoriasJugadoresModal
          categorias={clubConfig?.categorias_jugadores || []}
          onClose={() => setShowCategorias(false)}
          onSaved={() => refetchConfig()}
        />
      )}

      {showEquipo && (
        <MiEquipoModal
          clubId={clubId}
          onClose={() => setShowEquipo(false)}
        />
      )}
    </div>
  );
}
