import { useState, useEffect } from 'react';
import ArbitrajeListadoPartidos from '../components/ArbitrajeListadoPartidos';
import ArbitrajeCrearPartido from '../components/ArbitrajeCrearPartido';
import ArbitrajeGestionPagos from '../components/ArbitrajeGestionPagos';

export default function ArbitrajePagos() {
  const [activeTab, setActiveTab] = useState(0);
  const [selectedPartidoId, setSelectedPartidoId] = useState(null);
  const clubId = localStorage.getItem('clubId') || 'city-fc';

  const handleViewPagos = (partidoId) => {
    setSelectedPartidoId(partidoId);
    setActiveTab(2);
  };

  const handleCreatedPartido = () => {
    setActiveTab(0);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">⚽ Gestión Pago Arbitraje</h1>
          <p className="text-gray-600 mt-2">Administra partidos y registra pagos de arbitraje</p>
        </div>

        {/* Tabs Navigation */}
        <div className="flex gap-2 mb-6 border-b border-gray-200">
          <button
            onClick={() => setActiveTab(0)}
            className={`px-4 py-3 font-medium text-sm transition ${
              activeTab === 0
                ? 'border-b-2 border-blue-600 text-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            📋 Listado de Partidos
          </button>
          <button
            onClick={() => setActiveTab(1)}
            className={`px-4 py-3 font-medium text-sm transition ${
              activeTab === 1
                ? 'border-b-2 border-blue-600 text-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            ➕ Crear Partido
          </button>
          <button
            onClick={() => setActiveTab(2)}
            className={`px-4 py-3 font-medium text-sm transition ${
              activeTab === 2
                ? 'border-b-2 border-blue-600 text-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            ✅ Gestión de Pagos
          </button>
        </div>

        {/* Tab Content */}
        <div className="bg-white rounded-lg shadow-sm p-6">
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
