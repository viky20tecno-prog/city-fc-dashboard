import { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  RefreshCw, LayoutDashboard, Users, Shirt, Activity,
  Clock, ClipboardCheck, Settings, AlertTriangle,
  Copy, Check, Bell, LogOut, TrendingUp, Trophy, CalendarDays, Shield,
  ChevronLeft, ChevronRight, ClipboardList,
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
import EquiposPage from '../components/EquiposPage';
import MiEquipoModal from '../components/MiEquipoModal';
import Calendario from '../components/Calendario';
import AsistenciaPage from '../components/AsistenciaPage';
import CobroConfigModal from '../components/CobroConfigModal';
import ErrorBoundary from '../components/ErrorBoundary';

const NAV = [
  { id: 'dashboard',    Icon: LayoutDashboard, title: 'Dashboard'     },
  { id: 'jugadores',    Icon: Users,            title: 'Jugadores'     },
  { id: 'calendario',   Icon: CalendarDays,     title: 'Calendario'    },
  { id: 'asistencia',   Icon: ClipboardList,    title: 'Asistencia'    },
  { id: 'equipos',      Icon: Shield,           title: 'Equipos'       },
  { id: 'uniformes',    Icon: Shirt,            title: 'Uniformes'     },
  { id: 'torneos',      Icon: Trophy,           title: 'Torneos'       },
  { id: 'arbitraje',    Icon: Activity,         title: 'Pago Arbitraje'},
  { id: 'cobro',        Icon: Clock,            title: 'Ciclo de Cobro'},
  { id: 'conciliacion', Icon: ClipboardCheck,   title: 'Conciliación'  },
  { id: 'finanzas',     Icon: TrendingUp,       title: 'Finanzas'      },
];

function NavBtn({ id, Icon, title, active, color, onClick, collapsed }) {
  return (
    <button
      style={{
        width: collapsed ? '42px' : '100%',
        height: '40px',
        borderRadius: '8px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: collapsed ? 'center' : 'flex-start',
        gap: collapsed ? 0 : '10px',
        padding: collapsed ? '0' : '0 12px',
        cursor: 'pointer',
        border: 'none',
        background: active ? `${color}1F` : 'transparent',
        position: 'relative',
        transition: 'background-color 0.2s',
        flexShrink: 0,
        whiteSpace: 'nowrap',
        overflow: 'hidden',
      }}
      onClick={() => onClick(id)}
      title={collapsed ? title : undefined}
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
        style={{ flexShrink: 0, ...(active ? { filter: `drop-shadow(0 0 5px ${color}E6)`, transition: 'filter 0.3s' } : {}) }}
        strokeWidth={1.7}
      />
      {!collapsed && (
        <span style={{
          fontSize: '13px',
          fontWeight: active ? 600 : 400,
          color: active ? color : 'var(--text-sec)',
          letterSpacing: '0.2px',
          transition: 'color 0.2s',
        }}>
          {title}
        </span>
      )}
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
  const [portalCopied,    setPortalCopied]    = useState(false);
  const [showPagoModal,   setShowPagoModal]   = useState(false);
  const [showOnboarding,   setShowOnboarding]   = useState(false);
  const [showTheme,        setShowTheme]        = useState(false);
  const [showEquipo,       setShowEquipo]       = useState(false);
  const [showCobro,        setShowCobro]        = useState(false);
  const [colorOverride,    setColorOverride]    = useState(null);
  const [isMobile,         setIsMobile]         = useState(() => window.innerWidth < 768);
  const [showBell,         setShowBell]         = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => localStorage.getItem('sidebarCollapsed') === 'true');
  const bellRef = useRef(null);

  const toggleSidebar = () => setSidebarCollapsed(v => {
    const next = !v;
    localStorage.setItem('sidebarCollapsed', String(next));
    return next;
  });

  // ── Detectar viewport móvil ──
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 767px)');
    const handler = (e) => setIsMobile(e.matches);
    mq.addEventListener('change', handler);
    setIsMobile(mq.matches);
    return () => mq.removeEventListener('change', handler);
  }, []);

  // ── Guard: si no hay clubId en localStorage, cerrar sesión y redirigir ──
  useEffect(() => {
    if (!localStorage.getItem('clubId')) {
      supabase.auth.signOut().then(() => navigate('/login', { replace: true }));
    }
  }, [navigate]);

  // ── Revalidar rol desde Supabase al montar (evita manipulación de localStorage) ──
  useEffect(() => {
    async function revalidarRol() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user?.id) return;
      const userId = session.user.id;

      const { data: ownedClub } = await supabase
        .from('clubs').select('slug').eq('owner_user_id', userId).single();
      if (ownedClub?.slug) {
        localStorage.setItem('userRole', 'ADMIN');
        return;
      }
      const { data: membership } = await supabase
        .from('club_members')
        .select('role')
        .eq('user_id', userId)
        .eq('activo', true)
        .single();
      if (membership?.role) {
        localStorage.setItem('userRole', membership.role);
      }
    }
    revalidarRol();
  }, []);

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

  // Cierra el bell dropdown al hacer click afuera
  useEffect(() => {
    if (!showBell) return;
    const h = (e) => { if (bellRef.current && !bellRef.current.contains(e.target)) setShowBell(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, [showBell]);

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
  // Normalizar deportes del club: array nuevo o string legacy
  const deportesClub = Array.isArray(clubConfig?.deportes) && clubConfig.deportes.length > 0
    ? clubConfig.deportes
    : [clubConfig?.deporte || 'futbol'];
  const navVisible = NAV.filter(({ id }) => {
    if (!isAdmin && ADMIN_ONLY_TABS.has(id)) return false;
    if (id === 'dashboard' || id === 'jugadores') return true;
    // Arbitraje solo aplica a fútbol — ocultar si ningún deporte del club es fútbol
    if (id === 'arbitraje' && !deportesClub.includes('futbol')) return false;
    if (!modulos) return true;
    return modulos[id] !== false;
  });

  const S = {
    shell: {
      display: 'grid',
      gridTemplateRows: isMobile ? '56px 1fr 56px' : '58px 1fr',
      gridTemplateColumns: isMobile ? '1fr' : (sidebarCollapsed ? '64px 1fr' : '200px 1fr'),
      height: isMobile ? '100dvh' : '100vh',
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
      padding: isMobile ? '0 12px' : '0 18px 0 16px',
      gap: isMobile ? '8px' : '12px',
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
      display: isMobile ? 'none' : 'flex',
      flexDirection: 'column',
      alignItems: sidebarCollapsed ? 'center' : 'stretch',
      padding: sidebarCollapsed ? '10px 0 12px' : '10px 8px 12px',
      gap: '2px',
      overflowY: 'auto',
      overflowX: 'hidden',
      scrollbarWidth: 'none',
      transition: 'border-color 0.5s, padding 0.25s',
    },
    main: {
      gridColumn: isMobile ? '1' : '2',
      gridRow: isMobile ? '2' : '2',
      overflowY: 'auto',
      padding: isMobile ? '12px 12px 16px' : '16px 18px 24px',
      background: 'var(--bg-app)',
      scrollbarWidth: 'thin',
      scrollbarColor: `${c}33 transparent`,
    },
    bottomNav: {
      gridColumn: '1',
      gridRow: '3',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-around',
      background: 'var(--bg-card)',
      borderTop: `1px solid ${c}26`,
      padding: '0 4px',
      zIndex: 50,
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

  const clubId = getClubId();
  const inscripcionUrl = `${window.location.origin}/inscripcion?club_id=${clubId}`;
  const portalUrl = `${window.location.origin}/p/${clubId}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(inscripcionUrl);
    setLinkCopied(true);
    setTimeout(() => setLinkCopied(false), 2000);
  };

  const handleCopyPortal = () => {
    navigator.clipboard.writeText(portalUrl);
    setPortalCopied(true);
    setTimeout(() => setPortalCopied(false), 2000);
  };

  const nowStr = new Date()
    .toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })
    .toUpperCase();

  const cumpleaniosList = useMemo(() => {
    const hoy = new Date();
    const MESES = ['ene','feb','mar','abr','may','jun','jul','ago','sep','oct','nov','dic'];
    const lista = [];
    jugadores.forEach(j => {
      if (!j.fecha_nacimiento || !(j.activo === true || (j.activo || '').toString().toUpperCase() === 'SI')) return;
      const [anioStr, mesStr, diaStr] = j.fecha_nacimiento.split('-');
      if (!mesStr || !diaStr || !anioStr) return;
      const mes = parseInt(mesStr), dia = parseInt(diaStr), anioNac = parseInt(anioStr);
      for (let offset = 0; offset <= 7; offset++) {
        const d = new Date(hoy); d.setDate(hoy.getDate() + offset);
        if (d.getMonth() + 1 === mes && d.getDate() === dia) {
          const nombre = `${j.nombre || ''} ${j.apellidos || ''}`.trim();
          const edad = d.getFullYear() - anioNac;
          const fechaLabel = `${dia} ${MESES[mes - 1]}`;
          lista.push({ nombre, cedula: j.cedula, offset, edad, fechaLabel, diaLabel: offset === 0 ? 'Hoy' : offset === 1 ? 'Mañana' : `En ${offset} días` });
          break;
        }
      }
    });
    return lista.sort((a, b) => a.offset - b.offset);
  }, [jugadores]);

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
                  fontFamily="Sport Event, sans-serif" fontSize="9.5" letterSpacing="1.5">{initials}</text>
            <line x1="13" y1="24" x2="25" y2="24" stroke="#B68631" strokeWidth="0.8" opacity="0.6"/>
            <text x="19" y="35" textAnchor="middle" fill="#B68631" fontFamily="Arial" fontSize="6.5" letterSpacing="1">★ ★ ★</text>
          </svg>
        )}

        {/* Nombre del club */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1px', flexShrink: 0, minWidth: 0 }}>
          <span style={{ fontFamily: "'Sport Event', cursive", fontSize: isMobile ? '17px' : '20px', letterSpacing: '3px', lineHeight: 1, color: 'var(--text-pri)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: isMobile ? '130px' : 'none' }}>
            {clubConfig?.nombre || 'Mi Club'}
          </span>
          {!isMobile && (
            <span style={{ fontSize: '9px', letterSpacing: '3.5px', textTransform: 'uppercase', color: 'var(--text-mut)' }}>
              {clubConfig?.subtitulo || ''}
            </span>
          )}
        </div>

        <div style={S.sep} />
        <div style={{ flex: 1 }} />

        {/* Indicador en vivo — solo desktop */}
        {!isMobile && (
          <>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '10px', letterSpacing: '2px', color: 'var(--text-mut)', textTransform: 'uppercase', flexShrink: 0 }}>
              <div style={{ width: '6px', height: '6px', background: '#22C55E', borderRadius: '50%', boxShadow: '0 0 6px #22C55E', animation: 'pulse-green 2s ease-in-out infinite' }} />
              En Vivo
            </div>
            <div style={S.sep} />
            <div style={{ fontSize: '11px', color: 'var(--text-mut)', letterSpacing: '1px', textTransform: 'uppercase', flexShrink: 0 }}>
              {nowStr}
            </div>
            <div style={S.sep} />
          </>
        )}

        {/* Indicador de Trial */}
        {trialActivo && !trialExpirado && (
          <a
            href="https://zensports.zenpra.ai#precios"
            target="_blank"
            rel="noreferrer"
            title={`Prueba gratis — vence el ${new Date(clubConfig.trial_ends_at).toLocaleDateString('es-CO', { day: 'numeric', month: 'long' })}`}
            style={{
              display: 'flex', alignItems: 'center', gap: '5px',
              padding: '4px 10px', borderRadius: '20px',
              background: trialDaysLeft <= 2 ? 'rgba(239,68,68,0.12)' : 'rgba(245,158,11,0.10)',
              border: `1px solid ${trialDaysLeft <= 2 ? 'rgba(239,68,68,0.40)' : 'rgba(245,158,11,0.40)'}`,
              fontSize: '11px', fontWeight: 700, letterSpacing: '0.3px',
              color: trialDaysLeft <= 2 ? '#EF4444' : '#F59E0B',
              flexShrink: 0, textDecoration: 'none', cursor: 'pointer',
            }}
          >
            <Clock size={11} />
            {trialDaysLeft <= 2
              ? `⚠️ ${trialDaysLeft}d restante${trialDaysLeft !== 1 ? 's' : ''}`
              : `Prueba — ${trialDaysLeft} días`}
          </a>
        )}

        {/* Pago Manual */}
        <button style={S.actionBtn(true)} onClick={() => setShowPagoModal(true)}>
          {isMobile ? '+PAGO' : 'PAGO MANUAL'}
        </button>

        {/* Inscripción y Portal — solo desktop */}
        {!isMobile && (
          <>
            <button style={S.actionBtn(false)} onClick={() => window.open(inscripcionUrl, '_blank')}>
              INSCRIPCIÓN
            </button>
            <div style={S.roundBtn} onClick={handleCopyLink} title="Copiar link de inscripción">
              {linkCopied ? <Check size={14} color="#22C55E" /> : <Copy size={14} color="var(--text-sec)" />}
            </div>
            <button style={{ ...S.actionBtn(false), background: 'rgba(0,170,255,0.08)', border: '1px solid rgba(0,170,255,0.25)', color: '#4A9EFF' }} onClick={() => window.open(portalUrl, '_blank')} title="Abrir portal del atleta">
              PORTAL
            </button>
            <div style={S.roundBtn} onClick={handleCopyPortal} title="Copiar link del Portal Atleta">
              {portalCopied ? <Check size={14} color="#22C55E" /> : <Copy size={14} color="#4A9EFF" />}
            </div>
          </>
        )}

        {/* Refresh */}
        <div style={S.roundBtn} onClick={handleRefresh} title="Actualizar datos">
          <RefreshCw
            size={14}
            color="var(--text-sec)"
            style={{ animation: (refreshing || loading) ? 'spin 1s linear infinite' : 'none' }}
          />
        </div>

        {/* Notificaciones cumpleaños */}
        <div ref={bellRef} style={{ position: 'relative', flexShrink: 0 }}>
          <div
            style={{ ...S.roundBtn, background: showBell ? `${c}1F` : S.roundBtn.background }}
            onClick={() => setShowBell(v => !v)}
            title={`Notificaciones${cumpleaniosList.length ? ` · ${cumpleaniosList.length} cumpleaños` : ''}`}
          >
            <Bell size={14} color={showBell ? c : 'var(--text-sec)'} />
            {cumpleaniosList.length > 0 && (
              <span style={{
                position: 'absolute', top: '5px', right: '5px',
                width: cumpleaniosList.length > 9 ? '14px' : '10px', height: '10px',
                background: '#EF4444', borderRadius: '99px',
                fontSize: '8px', color: '#fff', fontWeight: 700,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                lineHeight: 1,
              }}>
                {cumpleaniosList.length > 9 ? '9+' : cumpleaniosList.length}
              </span>
            )}
          </div>
          {showBell && (
            <div style={{
              position: 'absolute', top: '42px', right: 0,
              background: 'var(--bg-surface)', border: `1px solid ${c}33`,
              borderRadius: '14px', boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
              width: '280px', zIndex: 200, overflow: 'hidden',
            }}>
              <div style={{ padding: '14px 16px 10px', borderBottom: '1px solid var(--border-sub)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Bell size={13} color={c} />
                <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-pri)' }}>Cumpleaños próximos</span>
              </div>
              {cumpleaniosList.length === 0 ? (
                <div style={{ padding: '24px 16px', textAlign: 'center', color: 'var(--text-mut)', fontSize: '13px' }}>
                  Sin cumpleaños en los próximos 7 días
                </div>
              ) : (
                <div style={{ maxHeight: '280px', overflowY: 'auto' }}>
                  {cumpleaniosList.map(j => (
                    <div key={j.cedula} style={{ padding: '10px 16px', display: 'flex', alignItems: 'center', gap: '10px', borderBottom: '1px solid var(--border-sub)' }}>
                      <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: j.offset === 0 ? `${c}20` : 'var(--bg-card)', border: `1px solid ${j.offset === 0 ? c : 'var(--border-sub)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: '16px' }}>
                        🎂
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-pri)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{j.nombre}</div>
                        <div style={{ fontSize: '11px', color: j.offset === 0 ? c : 'var(--text-mut)', fontWeight: j.offset === 0 ? 600 : 400 }}>
                          {j.diaLabel} · {j.fechaLabel} · {j.edad} años
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              {cumpleaniosList.length > 0 && (
                <div style={{ padding: '10px 16px', fontSize: '11px', color: 'var(--text-mut)', textAlign: 'center', borderTop: '1px solid var(--border-sub)' }}>
                  Revisa sus perfiles en Jugadores para enviar saludos
                </div>
              )}
            </div>
          )}
        </div>
      </header>

      {/* ───── SIDEBAR ───── */}
      <nav style={S.sidebar}>
        {/* Toggle contraer/expandir */}
        <button
          onClick={toggleSidebar}
          title={sidebarCollapsed ? 'Expandir menú' : 'Contraer menú'}
          style={{
            alignSelf: sidebarCollapsed ? 'center' : 'flex-end',
            width: '26px', height: '26px',
            borderRadius: '6px',
            border: `1px solid ${c}26`,
            background: `${c}0F`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer',
            marginBottom: '6px',
            flexShrink: 0,
            transition: 'background 0.2s, border-color 0.2s',
          }}
        >
          {sidebarCollapsed
            ? <ChevronRight size={13} color="var(--text-mut)" />
            : <ChevronLeft  size={13} color="var(--text-mut)" />}
        </button>

        {navVisible.map(({ id, Icon, title }) => (
          <NavBtn key={id} id={id} Icon={Icon} title={title} active={activeTab === id} color={c} onClick={setActiveTab} collapsed={sidebarCollapsed} />
        ))}

        <div style={{ flex: 1 }} />

        {/* Configuración */}
        <button
          style={{
            width: sidebarCollapsed ? '42px' : '100%',
            height: '40px',
            borderRadius: '8px',
            display: 'flex', alignItems: 'center',
            justifyContent: sidebarCollapsed ? 'center' : 'flex-start',
            gap: sidebarCollapsed ? 0 : '10px',
            padding: sidebarCollapsed ? '0' : '0 12px',
            border: 'none',
            background: showTheme ? `${c}1F` : 'transparent',
            cursor: 'pointer',
            flexShrink: 0,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
          }}
          title="Apariencia y configuración"
          onClick={() => setShowTheme(v => !v)}
        >
          <Settings size={18} color={showTheme ? c : 'var(--text-mut)'} strokeWidth={1.7} style={{ flexShrink: 0 }} />
          {!sidebarCollapsed && <span style={{ fontSize: '13px', color: showTheme ? c : 'var(--text-sec)' }}>Configuración</span>}
        </button>

        {/* Cerrar sesión */}
        <button
          style={{
            width: sidebarCollapsed ? '42px' : '100%',
            height: '40px',
            borderRadius: '8px',
            display: 'flex', alignItems: 'center',
            justifyContent: sidebarCollapsed ? 'center' : 'flex-start',
            gap: sidebarCollapsed ? 0 : '10px',
            padding: sidebarCollapsed ? '0' : '0 12px',
            border: 'none',
            background: 'transparent',
            cursor: 'pointer',
            flexShrink: 0,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
          }}
          title="Cerrar sesión"
          onClick={handleLogout}
        >
          <LogOut size={18} color="var(--text-sec)" strokeWidth={1.7} style={{ flexShrink: 0 }} />
          {!sidebarCollapsed && <span style={{ fontSize: '13px', color: 'var(--text-sec)' }}>Cerrar sesión</span>}
        </button>
      </nav>

      {/* ───── BOTTOM NAV (mobile) ───── */}
      {isMobile && (
        <nav style={S.bottomNav}>
          {navVisible.slice(0, 5).map(({ id, Icon, title }) => {
            const isActive = activeTab === id;
            return (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                style={{
                  flex: 1, height: '56px',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                  gap: '3px', border: 'none', background: 'transparent', cursor: 'pointer',
                  color: isActive ? c : 'var(--text-mut)',
                  position: 'relative',
                }}
              >
                {isActive && (
                  <div style={{ position: 'absolute', top: 0, left: '20%', right: '20%', height: '2px', background: c, borderRadius: '0 0 2px 2px' }} />
                )}
                <Icon size={20} strokeWidth={isActive ? 2 : 1.6} style={isActive ? { filter: `drop-shadow(0 0 4px ${c}AA)` } : {}} />
                <span style={{ fontSize: '9px', letterSpacing: '0.5px', fontWeight: isActive ? 600 : 400 }}>{title.split(' ')[0]}</span>
              </button>
            );
          })}
          {/* Botón "Más" para tabs extra */}
          <button
            onClick={() => setShowTheme(v => !v)}
            style={{
              flex: 1, height: '56px',
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              gap: '3px', border: 'none', background: 'transparent', cursor: 'pointer',
              color: 'var(--text-mut)',
            }}
          >
            <Settings size={20} strokeWidth={1.6} />
            <span style={{ fontSize: '9px', letterSpacing: '0.5px' }}>Más</span>
          </button>
        </nav>
      )}

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
              <div style={{ fontFamily: "'Sport Event', cursive", fontSize: '28px', letterSpacing: '3px', color: 'var(--text-pri)', marginBottom: '8px' }}>
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
              <div style={{ fontSize: '13px', color: 'var(--text-sec)' }}>1. Elige un plan en zensports.zenpra.ai</div>
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
                href="https://wa.me/573023903192?text=Quiero%20activar%20mi%20plan%20de%20ZenSports"
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
        {/* Banner trial — visible durante todo el período de prueba */}
        {trialActivo && !trialExpirado && (() => {
          const urgente = trialDaysLeft <= 3;
          const color   = trialDaysLeft <= 1 ? '#EF4444' : urgente ? '#F59E0B' : '#60A5FA';
          const bg      = trialDaysLeft <= 1 ? 'rgba(239,68,68,0.07)' : urgente ? 'rgba(245,158,11,0.07)' : 'rgba(96,165,250,0.07)';
          const border  = trialDaysLeft <= 1 ? 'rgba(239,68,68,0.25)' : urgente ? 'rgba(245,158,11,0.25)' : 'rgba(96,165,250,0.20)';
          const fechaVence = new Date(clubConfig.trial_ends_at).toLocaleDateString('es-CO', { day: 'numeric', month: 'long' });
          const mensaje = trialDaysLeft <= 0
            ? 'Tu prueba vence hoy. Activa un plan para no perder el acceso.'
            : urgente
            ? `Tu prueba vence en ${trialDaysLeft} día${trialDaysLeft !== 1 ? 's' : ''} (${fechaVence}). Activa un plan para no perder el acceso.`
            : `Estás en período de prueba gratuita — vence el ${fechaVence}. Explora los planes cuando quieras.`;
          return (
            <div style={{
              marginBottom: '14px', padding: '9px 16px', borderRadius: '12px',
              background: bg, border: `1px solid ${border}`,
              display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px',
              flexWrap: 'wrap',
            }}>
              <div style={{ fontSize: '13px', color, fontWeight: 500, display: 'flex', alignItems: 'center', gap: '6px' }}>
                {urgente ? <AlertTriangle size={13} /> : <Clock size={13} />}
                {mensaje}
              </div>
              <a
                href="https://zensports.zenpra.ai#precios"
                target="_blank"
                rel="noreferrer"
                style={{
                  fontSize: '12px', fontWeight: 700, color,
                  textDecoration: 'none', whiteSpace: 'nowrap',
                  padding: '4px 12px', borderRadius: '8px',
                  border: `1px solid ${border}`, background: bg,
                }}
              >
                Ver planes →
              </a>
            </div>
          );
        })()}

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
            {activeTab === 'asistencia'   && <AsistenciaPage color={c} jugadores={jugadores} />}
            {activeTab === 'equipos'      && <EquiposPage  color={c} clubConfig={clubConfig} onConfigSaved={() => refetchConfig()} />}
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
          onOpenEquipo={isAdmin ? () => { setShowTheme(false); setShowEquipo(true); } : undefined}
          onOpenCobro={() => { setShowTheme(false); setShowCobro(true); }}
          onColorChange={handleColorChange}
        />
      )}

{showEquipo && (
        <MiEquipoModal
          clubId={clubId}
          onClose={() => setShowEquipo(false)}
        />
      )}

      {showCobro && (
        <CobroConfigModal
          color={c}
          clubConfig={clubConfig}
          onClose={() => setShowCobro(false)}
          onSaved={() => { refetchConfig(); setShowCobro(false); }}
        />
      )}
    </div>
  );
}
