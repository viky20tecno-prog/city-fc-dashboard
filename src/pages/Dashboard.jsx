import { useState } from 'react';
import { RefreshCw, Activity, LayoutDashboard, Users, MessageSquare, Clock, Link2, Check, DollarSign, Shirt } from 'lucide-react';
import { useSheetData } from '../hooks/useSheetData';
import StatsCards from '../components/StatsCards';
import JugadoresTable from '../components/JugadoresTable';
import RecaudacionChart from '../components/RecaudacionChart';
import MorososList from '../components/MorososList';
import TimelineCobro from '../components/TimelineCobro';
import WhatsAppMockup from '../components/WhatsAppMockup';
import PagoManualModal from '../components/PagoManualModal';
import UniformesTab from '../components/UniformesTab';

const tabs = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'jugadores', label: 'Jugadores', icon: Users },
  { id: 'uniformes', label: 'Uniformes', icon: Shirt },
  { id: 'cobro', label: 'Ciclo de Cobro', icon: Clock },
  { id: 'whatsapp', label: 'WhatsApp Bot', icon: MessageSquare },
];

export default function Dashboard() {
  const { jugadores, mensualidades, uniformes, torneos, registroPagos, morosos, loading, error, lastUpdated, refresh } = useSheetData();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [refreshing, setRefreshing] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);
  const [showPagoManual, setShowPagoManual] = useState(false);

  const handleRefresh = async () => {
    setRefreshing(true);
    await refresh();
    setRefreshing(false);
  };

  const handleCopyLink = () => {
    const url = `${window.location.origin}/inscripcion`;
    navigator.clipboard.writeText(url);
    setLinkCopied(true);
    setTimeout(() => setLinkCopied(false), 2000);
  };

  if (error) {
    return (
      <div className="min-h-screen bg-[#0D1117] flex items-center justify-center p-4">
        <div className="bg-[#161B22] rounded-2xl border border-[#30363D] p-8 max-w-md text-center">
          <div className="w-16 h-16 rounded-full bg-[rgba(255,94,94,0.12)] flex items-center justify-center mx-auto mb-4">
            <Activity className="w-8 h-8 text-[#FF5E5E]" />
          </div>
          <h2 className="text-xl font-bold text-[#E6EDF3] mb-2">Error de conexión</h2>
          <p className="text-[#8B949E] mb-4 text-sm">{error}</p>
          <p className="text-[#8B949E] text-xs mb-4">Verificá que la API Key esté configurada en <code className="bg-[#1E2530] px-1 rounded">.env</code></p>
          <button onClick={refresh} className="px-4 py-2 bg-[#00D084] text-[#0D1117] rounded-xl text-sm font-medium hover:bg-[#00D084]/80 transition-colors">
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0D1117]">
      {/* Header */}
      <header className="bg-[#161B22] border-b border-[#30363D] sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <img src="/10894351.png" alt="Logo" className="w-9 h-9 rounded-xl object-contain" />
              <div>
                <h1 className="text-lg font-bold text-[#E6EDF3]">City FC</h1>
                <p className="text-xs text-[#8B949E]">Agente Contable</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowPagoManual(true)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-[#F5A623]/30 bg-[rgba(245,166,35,0.12)] text-sm text-[#F5A623] hover:bg-[rgba(245,166,35,0.2)] transition-colors"
              >
                <DollarSign className="w-4 h-4" />
                <span className="hidden sm:inline">Pago Manual</span>
              </button>

              <button
                onClick={handleCopyLink}
                className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-[#00D084]/30 bg-[rgba(0,208,132,0.12)] text-sm text-[#00D084] hover:bg-[rgba(0,208,132,0.2)] transition-colors"
                title="Copiar link de inscripción para enviar por WhatsApp"
              >
                {linkCopied ? (
                  <>
                    <Check className="w-4 h-4" />
                    <span className="hidden sm:inline">¡Copiado!</span>
                  </>
                ) : (
                  <>
                    <Link2 className="w-4 h-4" />
                    <span className="hidden sm:inline">Link Inscripción</span>
                  </>
                )}
              </button>

              {lastUpdated && (
                <span className="text-xs text-[#8B949E] hidden sm:block">
                  {lastUpdated.toLocaleTimeString('es-CO')}
                </span>
              )}
              <button
                onClick={handleRefresh}
                disabled={refreshing || loading}
                className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-[#30363D] text-sm text-[#8B949E] hover:text-[#E6EDF3] hover:border-[#8B949E] transition-colors disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 ${refreshing || loading ? 'animate-spin' : ''}`} />
                <span className="hidden sm:inline">Actualizar</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Tab Nav */}
      <nav className="bg-[#161B22] border-b border-[#30363D]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex gap-1 overflow-x-auto py-2">
            {tabs.map(tab => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-colors ${
                    activeTab === tab.id
                      ? 'bg-[rgba(0,208,132,0.12)] text-[#00D084]'
                      : 'text-[#8B949E] hover:text-[#E6EDF3] hover:bg-[#1E2530]'
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

      {/* Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <RefreshCw className="w-8 h-8 text-[#00D084] animate-spin mx-auto mb-3" />
              <p className="text-[#8B949E]">Cargando datos del Sheet...</p>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
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
              <JugadoresTable jugadores={jugadores} mensualidades={mensualidades} uniformes={uniformes} torneos={torneos} registroPagos={registroPagos} onRefresh={handleRefresh} />
            )}
            
            {activeTab === 'uniformes' && (
              <UniformesTab jugadores={jugadores} />
            )}
            
            {activeTab === 'cobro' && (
              <TimelineCobro />
            )}
            
            {activeTab === 'whatsapp' && (
              <WhatsAppMockup />
            )}
          </div>
        )}
      </main>

      {/* Modal Pago Manual */}
      {showPagoManual && (
        <PagoManualModal
          jugadores={jugadores}
          onClose={() => setShowPagoManual(false)}
          onSuccess={handleRefresh}
        />
      )}

      {/* Footer */}
      <footer className="border-t border-[#30363D] mt-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 text-center text-xs text-[#8B949E]">
          Powered by AI · Automatización inteligente de cobros para clubes deportivos
        </div>
      </footer>
    </div>
  );
}
