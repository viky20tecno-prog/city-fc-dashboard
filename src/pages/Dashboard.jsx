// src/pages/Dashboard.jsx

import { useState } from 'react';
import { RefreshCw, Activity, LayoutDashboard, Users, MessageSquare, Clock, Link2, Check, Copy, DollarSign, Shirt, Plus, Loader2, AlertCircle, CheckCircle } from 'lucide-react';
import { useSheetData } from '../hooks/useSheetData';
import StatsCards from '../components/StatsCards';
import JugadoresTable from '../components/JugadoresTable';
import RecaudacionChart from '../components/RecaudacionChart';
import MorososList from '../components/MorososList';
import TimelineCobro from '../components/TimelineCobro';
import WhatsAppMockup from '../components/WhatsAppMockup';
import PagoManualModal from '../components/PagoManualModal';
import Uniformes from '../components/Uniformes';
import ArbitrajePagos from './ArbitrajePagos';

const tabs = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'jugadores', label: 'Jugadores', icon: Users },
  { id: 'uniformes', label: 'Uniformes', icon: Shirt },
  { id: 'arbitraje', label: 'Pago Arbitraje', icon: Activity },
  { id: 'cobro', label: 'Ciclo de Cobro', icon: Clock },
  { id: 'whatsapp', label: 'WhatsApp Bot', icon: MessageSquare },
];

export default function Dashboard() {
  const { jugadores, mensualidades, uniformes, torneos, registroPagos, morosos, suspensiones, loading, error, lastUpdated, refresh } = useSheetData();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [refreshing, setRefreshing] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);
  const [showPagoManual, setShowPagoManual] = useState(false);

  const handleRefresh = async () => {
    setRefreshing(true);
    await refresh();
    setRefreshing(false);
  };

  const inscripcionUrl = `${window.location.origin}/inscripcion`;

  const handleOpenInscripcion = () => {
    window.open(inscripcionUrl, '_blank');
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(inscripcionUrl);
    setLinkCopied(true);
    setTimeout(() => setLinkCopied(false), 2000);
  };

  if (error) {
    return (
      <div className="min-h-screen bg-[#0C0C0C] flex items-center justify-center p-4">
        <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-8 max-w-md text-center shadow-[0_0_40px_rgba(255,0,0,0.1)]">
          <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-4">
            <Activity className="w-8 h-8 text-red-400" />
          </div>
          <h2 className="text-xl font-bold text-white mb-2">Error de conexión</h2>
          <p className="text-gray-400 mb-4 text-sm">{error}</p>
          <button onClick={refresh} className="px-4 py-2 bg-[#F97316] text-white rounded-xl text-sm font-medium hover:opacity-80 transition">
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0C0C0C]">

      {/* HEADER */}
      <header className="bg-white/5 backdrop-blur-xl border-b border-white/10 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-16">

            <div className="flex items-center gap-3">
              <img src="/10894351.png" alt="Logo" className="w-9 h-9 rounded-xl object-contain" />
              <div>
                <h1 className="text-lg font-bold text-white">City FC</h1>
                <p className="text-xs text-gray-400">Agente Contable</p>
              </div>
            </div>

            <div className="flex items-center gap-3">

              <button
                onClick={() => setShowPagoManual(true)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-yellow-400/20 bg-yellow-400/10 text-sm text-yellow-400 hover:bg-yellow-400/20 transition"
              >
                <DollarSign className="w-4 h-4" />
                <span className="hidden sm:inline">Pago Manual</span>
              </button>

              {/* Botón principal — abre formulario en nueva pestaña */}
              <button
                onClick={handleOpenInscripcion}
                className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-orange-400/20 bg-orange-400/10 text-sm text-orange-400 hover:bg-orange-400/20 transition"
              >
                <Link2 className="w-4 h-4" />
                <span className="hidden sm:inline">Registrarse</span>
              </button>

              {/* Botón copiar link */}
              <button
                onClick={handleCopyLink}
                title="Copiar link de inscripción"
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border border-white/10 text-sm text-gray-400 hover:text-green-400 hover:border-green-400/20 transition"
              >
                {linkCopied ? (
                  <><Check className="w-4 h-4 text-orange-400" /><span className="hidden sm:inline text-orange-400 text-xs">¡Copiado!</span></>
                ) : (
                  <><Copy className="w-4 h-4" /><span className="hidden sm:inline text-xs">Copiar link</span></>
                )}
              </button>

              <button
                onClick={handleRefresh}
                disabled={refreshing || loading}
                className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-white/10 text-sm text-gray-400 hover:text-white transition"
              >
                <RefreshCw className={`w-4 h-4 ${refreshing || loading ? 'animate-spin' : ''}`} />
              </button>

            </div>
          </div>
        </div>
      </header>

      {/* NAV */}
      <nav className="bg-white/5 backdrop-blur-xl border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex gap-2 overflow-x-auto py-2">

            {tabs.map(tab => {
              const Icon = tab.icon;
              const active = activeTab === tab.id;

              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm transition-all ${
                    active
                      ? 'bg-orange-500/10 text-orange-400 shadow-[0_0_20px_rgba(249,115,22,0.2)]'
                      : 'text-gray-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </button>
              );
            })}

          </div>
        </div>
      </nav>

      {/* MAIN */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <RefreshCw className="w-8 h-8 text-orange-400 animate-spin" />
          </div>
        ) : (
          <div className="space-y-8">

            {activeTab === 'dashboard' && (
              <>
                <StatsCards mensualidades={mensualidades} jugadores={jugadores} morosos={morosos} />

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <div className="lg:col-span-2">
                    <RecaudacionChart mensualidades={mensualidades} />
                  </div>
                  <MorososList morosos={morosos} />
                </div>
              </>
            )}

            {activeTab === 'jugadores' && (
              <JugadoresTable jugadores={jugadores} mensualidades={mensualidades} uniformes={uniformes} torneos={torneos} registroPagos={registroPagos} suspensiones={suspensiones} onRefresh={handleRefresh} />
            )}

            {activeTab === 'uniformes' && <Uniformes />}
            {activeTab === 'arbitraje' && <ArbitrajePagos />}
            {activeTab === 'cobro' && <TimelineCobro />}
            {activeTab === 'whatsapp' && <WhatsAppMockup />}

          </div>
        )}
      </main>

      {showPagoManual && (
        <PagoManualModal
          jugadores={jugadores}
          onClose={() => setShowPagoManual(false)}
          onSuccess={handleRefresh}
        />
      )}

      <footer className="border-t border-white/10 mt-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 text-center text-xs text-gray-500">
          Powered by AI · Sistema inteligente de cobros
        </div>
      </footer>
    </div>
  );
}
