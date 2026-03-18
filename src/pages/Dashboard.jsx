import { useState } from 'react';
import { RefreshCw, Activity, LayoutDashboard, Users, MessageSquare, Clock, Link2, Check, DollarSign, Shirt, Plus, Loader2, AlertCircle, CheckCircle } from 'lucide-react';
import { useSheetData } from '../hooks/useSheetData';
import StatsCards from '../components/StatsCards';
import JugadoresTable from '../components/JugadoresTable';
import RecaudacionChart from '../components/RecaudacionChart';
import MorososList from '../components/MorososList';
import TimelineCobro from '../components/TimelineCobro';
import WhatsAppMockup from '../components/WhatsAppMockup';
import PagoManualModal from '../components/PagoManualModal';

const tabs = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'jugadores', label: 'Jugadores', icon: Users },
  { id: 'uniformes', label: 'Pedidos Uniformes', icon: Shirt },
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
              <UniformesTabInline jugadores={jugadores} />
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
          Powered by AI · Automatización inteligente de cobros para clubes deportivos · v2.2
        </div>
      </footer>
    </div>
  );
}

// Componente Uniformes Inline
function UniformesTabInline({ jugadores }) {
  const [mostrarModal, setMostrarModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [form, setForm] = useState({
    cedula: '',
    tipo_uniforme: 'General',
    numero: '',
    nombre_estampar: '',
    talla: 'M'
  });

  const tiposUniformes = [
    { valor: 'General', precio: 90000 },
    { valor: 'Campeones EVG/SAB', precio: 60000 },
    { valor: 'Arqueros EVG/SAB', precio: 120000 },
    { valor: 'Arqueros General', precio: 160000 }
  ];

  const tallas = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      const dataToSend = {
        cedula: form.cedula,
        tipo: form.tipo_uniforme,
        talla: form.talla,
        nombre_estampar: form.nombre_estampar,
        numero_estampar: form.numero
      };

      const res = await fetch('/api/pedido-uniforme', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dataToSend)
      });

      const data = await res.json();

      if (!res.ok) {
        setMessage({ type: 'error', text: data.error || 'Error registrando pedido' });
        return;
      }

      setMessage({ type: 'success', text: `Pedido registrado: ${data.pedido.nombre_estampar} #${data.pedido.numero_estampar}` });
      setForm({ cedula: '', tipo_uniforme: 'General', numero: '', nombre_estampar: '', talla: 'M' });
      setTimeout(() => setMostrarModal(false), 2000);
    } catch (err) {
      setMessage({ type: 'error', text: 'Error al conectar con el servidor' });
    } finally {
      setLoading(false);
    }
  };

  const precioActual = tiposUniformes.find(t => t.valor === form.tipo_uniforme)?.precio || 0;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-[#E6EDF3]">Pedidos de Uniformes</h2>
        <button
          onClick={() => setMostrarModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-[#00D084] text-[#0D1117] rounded-lg font-medium hover:bg-[#00D084]/80 transition"
        >
          <Plus className="w-4 h-4" />
          Nuevo Pedido
        </button>
      </div>

      {mostrarModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-[#161B22] rounded-xl border border-[#30363D] p-6 max-w-md w-full">
            <h3 className="text-xl font-bold text-[#E6EDF3] mb-4">Hacer Pedido de Uniforme</h3>

            {message.text && (
              <div className={`flex items-start gap-2 p-3 rounded-lg mb-4 ${message.type === 'error' ? 'bg-[rgba(255,94,94,0.12)] border border-[#FF5E5E]/20' : 'bg-[rgba(0,208,132,0.12)] border border-[#00D084]/20'}`}>
                {message.type === 'error' ? (
                  <AlertCircle className="w-4 h-4 text-[#FF5E5E] shrink-0 mt-0.5" />
                ) : (
                  <CheckCircle className="w-4 h-4 text-[#00D084] shrink-0 mt-0.5" />
                )}
                <span className={`text-sm ${message.type === 'error' ? 'text-[#FF5E5E]' : 'text-[#00D084]'}`}>
                  {message.text}
                </span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-[#E6EDF3] mb-1">
                  Seleccionar Jugador *
                </label>
                <select
                  name="cedula"
                  value={form.cedula}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 rounded-lg bg-[#1E2530] border border-[#30363D] text-[#E6EDF3] focus:outline-none focus:ring-2 focus:ring-[#00D084]/30"
                >
                  <option value="">-- Selecciona jugador --</option>
                  {jugadores && jugadores.map(j => (
                    <option key={j.cedula} value={j.cedula}>
                      {j['nombre(s)'] || j.nombre} {j['apellido(s)'] || j.apellidos} ({j.cedula})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-[#E6EDF3] mb-1">
                  Tipo Uniforme *
                </label>
                <select
                  name="tipo_uniforme"
                  value={form.tipo_uniforme}
                  onChange={handleChange}
                  className="w-full px-3 py-2 rounded-lg bg-[#1E2530] border border-[#30363D] text-[#E6EDF3] focus:outline-none focus:ring-2 focus:ring-[#00D084]/30"
                >
                  {tiposUniformes.map(t => (
                    <option key={t.valor} value={t.valor}>
                      {t.valor} (${t.precio.toLocaleString()})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-[#E6EDF3] mb-1">
                  Número Camiseta (1-99) *
                </label>
                <input
                  type="number"
                  name="numero"
                  min="1"
                  max="99"
                  value={form.numero}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 rounded-lg bg-[#1E2530] border border-[#30363D] text-[#E6EDF3] focus:outline-none focus:ring-2 focus:ring-[#00D084]/30"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[#E6EDF3] mb-1">
                  Nombre a Estampar (máx 12 caracteres) *
                </label>
                <input
                  type="text"
                  name="nombre_estampar"
                  maxLength="12"
                  value={form.nombre_estampar}
                  onChange={handleChange}
                  placeholder="Ej: DIEGO"
                  required
                  className="w-full px-3 py-2 rounded-lg bg-[#1E2530] border border-[#30363D] text-[#E6EDF3] placeholder-[#8B949E] focus:outline-none focus:ring-2 focus:ring-[#00D084]/30"
                />
                <p className="text-xs text-[#8B949E] mt-1">
                  {form.nombre_estampar.length}/12
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-[#E6EDF3] mb-1">
                  Talla *
                </label>
                <select
                  name="talla"
                  value={form.talla}
                  onChange={handleChange}
                  className="w-full px-3 py-2 rounded-lg bg-[#1E2530] border border-[#30363D] text-[#E6EDF3] focus:outline-none focus:ring-2 focus:ring-[#00D084]/30"
                >
                  {tallas.map(t => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>

              <div className="bg-[#0D1117] rounded-lg p-3 border border-[#30363D]">
                <p className="text-xs text-[#8B949E]">Valor:</p>
                <p className="text-lg font-bold text-[#00D084]">
                  ${precioActual.toLocaleString()} COP
                </p>
              </div>

              <div className="flex gap-2 mt-4">
                <button
                  type="button"
                  onClick={() => setMostrarModal(false)}
                  disabled={loading}
                  className="flex-1 px-4 py-2 bg-[#30363D] text-[#E6EDF3] rounded-lg font-medium hover:bg-[#30363D]/80 transition disabled:opacity-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-[#00D084] text-[#0D1117] rounded-lg font-medium hover:bg-[#00D084]/80 transition disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Guardando...
                    </>
                  ) : (
                    'Guardar'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="bg-[#161B22] rounded-xl border border-[#30363D] p-6 text-center">
        <p className="text-[#8B949E]">
          Haz click en "Nuevo Pedido" para hacer pedidos de uniformes. Los pedidos se guardan en PEDIDOS_UNIFORMES y puedes exportarlos/imprimirlos directamente.
        </p>
      </div>
    </div>
  );
}
// Rebuild trigger 1773867203
