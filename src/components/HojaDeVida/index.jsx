import { useState, useCallback } from 'react';
import { X, User, DollarSign, CreditCard } from 'lucide-react';
import FinancieroContent from '../FinancieroContent';
import TabPerfil from './TabPerfil';
import TabCarnet from './TabCarnet';

const TABS = [
  { key: 'perfil',     label: 'Perfil',     icon: User       },
  { key: 'financiero', label: 'Financiero', icon: DollarSign },
  { key: 'carnet',     label: 'Carnet',     icon: CreditCard },
];

export default function HojaDeVida({ jugador, mensualidades, torneos, suspensiones, onClose, onRefresh, initialTab = 'perfil', visibleTabs, categoriasJugadores = [], clubConfig }) {
  const tabsToShow = visibleTabs
    ? TABS.filter(t => visibleTabs.includes(t.key))
    : TABS;
  const [tab, setTab] = useState(initialTab);
  const [jugadorLocal, setJugadorLocal] = useState(jugador);

  const nombre = `${jugadorLocal['nombre(s)'] || jugadorLocal.nombre || ''} ${jugadorLocal['apellido(s)'] || jugadorLocal.apellidos || ''}`.trim();

  const handleFotoUpdate = useCallback((nuevaUrl) => {
    setJugadorLocal(j => ({ ...j, foto_url: nuevaUrl }));
    onRefresh?.();
  }, [onRefresh]);

  const handleUpdate = useCallback((campos) => {
    setJugadorLocal(j => ({ ...j, ...campos }));
    onRefresh?.();
  }, [onRefresh]);

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      <div
        className="relative w-full max-w-[560px] h-full bg-[var(--bg-card)] border-l border-[var(--border-sub)] flex flex-col shadow-2xl"
        style={{ animation: 'hdv-slide-in 0.22s ease both' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border-sub)] flex-shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-full bg-[var(--cc)]/10 border border-[var(--cc)]/20 overflow-hidden flex-shrink-0 flex items-center justify-center">
              {jugadorLocal.foto_url
                ? <img src={jugadorLocal.foto_url} alt="" className="w-full h-full object-cover" />
                : <User className="w-4 h-4 text-[var(--cc)]" />}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-[var(--text-pri)] truncate">{nombre}</p>
              <p className="text-xs text-[var(--text-mut)]">CC {jugadorLocal.cedula}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-[var(--bg-surface)] transition flex-shrink-0">
            <X className="w-5 h-5 text-[var(--text-mut)]" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-[var(--border-sub)] flex-shrink-0">
          {tabsToShow.map(t => {
            const Icon   = t.icon;
            const active = tab === t.key;
            return (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={`flex-1 flex items-center justify-center gap-2 py-3 text-xs font-semibold transition relative ${
                  active ? 'text-[var(--cc)]' : 'text-[var(--text-mut)] hover:text-[var(--text-pri)]'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {t.label}
                {active && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[var(--cc)] rounded-t" />
                )}
              </button>
            );
          })}
        </div>

        {/* Contenido */}
        <div className="flex-1 overflow-y-auto p-6">
          {tab === 'perfil' && (
            <TabPerfil jugador={jugadorLocal} onFotoUpdate={handleFotoUpdate} onUpdate={handleUpdate} categoriasJugadores={categoriasJugadores} clubConfig={clubConfig} />
          )}
          {tab === 'financiero' && (
            <FinancieroContent
              cedula={jugadorLocal.cedula}
              jugador={jugadorLocal}
              mensualidades={mensualidades}
              torneos={torneos}
              suspensiones={suspensiones}
            />
          )}
          {tab === 'carnet' && (
            <TabCarnet jugador={jugadorLocal} clubConfig={clubConfig} />
          )}
        </div>
      </div>

      <style>{`
        @keyframes hdv-slide-in {
          from { transform: translateX(100%); opacity: 0.6; }
          to   { transform: translateX(0);    opacity: 1;   }
        }
      `}</style>
    </div>
  );
}
