import { useState } from 'react';
import ArbitrajeListadoPartidos from '../components/ArbitrajeListadoPartidos';
import ArbitrajeCrearPartido from '../components/ArbitrajeCrearPartido';
import ArbitrajeGestionPagos from '../components/ArbitrajeGestionPagos';

const TABS = [
  { label: 'Partidos', icon: '📋' },
  { label: 'Registrar Partido', icon: '➕' },
  { label: 'Gestión de Pagos', icon: '💳' },
];

export default function ArbitrajePagos() {
  const [activeTab, setActiveTab] = useState(0);
  const [selectedPartidoId, setSelectedPartidoId] = useState(null);
  const [clubId] = useState(() => localStorage.getItem('clubId') || 'city-fc');

  const handleViewPagos = (partidoId) => {
    setSelectedPartidoId(partidoId);
    setActiveTab(2);
  };

  const handleCreatedPartido = () => {
    setActiveTab(0);
  };

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="max-w-6xl mx-auto px-4 py-6">

        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-white">Pago de Árbitros</h1>
          <p className="text-gray-400 text-sm mt-1">
            Gestiona los partidos y los pagos a árbitros del club
          </p>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-6 bg-[#141414] border border-[#2A2A2A] rounded-xl p-1">
          {TABS.map((tab, idx) => (
            <button
              key={idx}
              onClick={() => setActiveTab(idx)}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg text-sm font-medium transition-all duration-200 ${
                activeTab === idx
                  ? 'bg-orange-600 text-white shadow-lg shadow-orange-900/30'
                  : 'text-gray-400 hover:text-white hover:bg-[#1A1A1A]'
              }`}
            >
              <span>{tab.icon}</span>
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Contenido */}
        <div>
          {activeTab === 0 && (
            <ArbitrajeListadoPartidos
              clubId={clubId}
              onViewPagos={handleViewPagos}
            />
          )}
          {activeTab === 1 && (
            <ArbitrajeCrearPartido
              clubId={clubId}
              onCreated={handleCreatedPartido}
            />
          )}
          {activeTab === 2 && (
            <ArbitrajeGestionPagos
              clubId={clubId}
              partidoId={selectedPartidoId}
            />
          )}
        </div>
      </div>
    </div>
  );
}
