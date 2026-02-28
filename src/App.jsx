import { useState } from 'react';
import { RefreshCw, Activity, LayoutDashboard, Users, BarChart3, MessageSquare, Clock } from 'lucide-react';
import { useSheetData } from './hooks/useSheetData';
import StatsCards from './components/StatsCards';
import JugadoresTable from './components/JugadoresTable';
import RecaudacionChart from './components/RecaudacionChart';
import MorososList from './components/MorososList';
import TimelineCobro from './components/TimelineCobro';
import WhatsAppMockup from './components/WhatsAppMockup';

const tabs = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'jugadores', label: 'Jugadores', icon: Users },
  { id: 'cobro', label: 'Ciclo de Cobro', icon: Clock },
  { id: 'whatsapp', label: 'WhatsApp Bot', icon: MessageSquare },
];

export default function App() {
  const { jugadores, pagos, morosos, loading, error, lastUpdated, refresh } = useSheetData();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = async () => {
    setRefreshing(true);
    await refresh();
    setRefreshing(false);
  };

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 max-w-md text-center">
          <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
            <Activity className="w-8 h-8 text-red-500" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Error de conexión</h2>
          <p className="text-gray-500 mb-4 text-sm">{error}</p>
          <p className="text-gray-400 text-xs mb-4">Verificá que la API Key esté configurada en <code className="bg-gray-100 px-1 rounded">.env</code></p>
          <button onClick={refresh} className="px-4 py-2 bg-emerald-500 text-white rounded-xl text-sm hover:bg-emerald-600 transition-colors">
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <img
                src="/10894351.png"
                alt="Logo"
                className="w-9 h-9 rounded-xl object-contain"
              />
              <div>
                <h1 className="text-lg font-bold text-gray-900">City FC</h1>
                <p className="text-xs text-gray-400">Agente Contable</p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              {lastUpdated && (
                <span className="text-xs text-gray-400 hidden sm:block">
                  Actualizado: {lastUpdated.toLocaleTimeString('es-CO')}
                </span>
              )}
              <button
                onClick={handleRefresh}
                disabled={refreshing || loading}
                className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 ${refreshing || loading ? 'animate-spin' : ''}`} />
                <span className="hidden sm:inline">Actualizar</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Tab Nav */}
      <nav className="bg-white border-b border-gray-100">
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
                      ? 'bg-emerald-50 text-emerald-700'
                      : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
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
              <RefreshCw className="w-8 h-8 text-emerald-500 animate-spin mx-auto mb-3" />
              <p className="text-gray-400">Cargando datos del Sheet...</p>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {activeTab === 'dashboard' && (
              <>
                <StatsCards pagos={pagos} jugadores={jugadores} morosos={morosos} />
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <div className="lg:col-span-2">
                    <RecaudacionChart pagos={pagos} />
                  </div>
                  <MorososList morosos={morosos} />
                </div>
              </>
            )}
            
            {activeTab === 'jugadores' && (
              <JugadoresTable jugadores={jugadores} pagos={pagos} />
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

      {/* Footer */}
      <footer className="border-t border-gray-100 mt-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 text-center text-xs text-gray-400">
          Powered by AI · Automatización inteligente de cobros para clubes deportivos
        </div>
      </footer>
    </div>
  );
}
