import { useState, useEffect } from 'react';
import { X, DollarSign, Loader2, CheckCircle, AlertCircle, ArrowLeft, Shield } from 'lucide-react';
import { API_BASE_URL } from '../config';

const CLUB_ID = import.meta.env.VITE_CLUB_ID || 'city-fc';

const CONCEPTOS = ['Mensualidad', 'Uniforme', 'Torneo', 'Otro'];
const METODOS_PAGO = ['Efectivo', 'Transferencia', 'Nequi', 'Daviplata', 'Consignación'];

const MESES = [
  { nombre: 'Enero', valor: 1 },
  { nombre: 'Febrero', valor: 2 },
  { nombre: 'Marzo', valor: 3 },
  { nombre: 'Abril', valor: 4 },
  { nombre: 'Mayo', valor: 5 },
  { nombre: 'Junio', valor: 6 },
  { nombre: 'Julio', valor: 7 },
  { nombre: 'Agosto', valor: 8 },
  { nombre: 'Septiembre', valor: 9 },
  { nombre: 'Octubre', valor: 10 },
  { nombre: 'Noviembre', valor: 11 },
  { nombre: 'Diciembre', valor: 12 },
];

export default function PagoManualModal({ jugadores, onClose, onSuccess }) {

  const [mesesSeleccionados, setMesesSeleccionados] = useState([]);

  const [form, setForm] = useState({
    cedula: '',
    concepto: 'Mensualidad',
    monto: '65000',
    metodo_pago: 'Efectivo',
    referencia: '',
    observacion: '',
    torneo: '',
    uniforme: '',
  });

  // 🔥 AUTO CALCULO
  useEffect(() => {
    if (form.concepto === 'Mensualidad') {
      setForm(prev => ({
        ...prev,
        monto: (mesesSeleccionados.length * 65000).toString()
      }));
    }
  }, [mesesSeleccionados]);

  const handleChange = (key, value) => {
    setForm(prev => ({ ...prev, [key]: value }));
  };

  const handleConfirmar = async () => {

    const conceptos = [{
      tipo: form.concepto.toLowerCase(),
      descripcion: form.concepto,
      valor: parseInt(form.monto),
    }];

    const payload = {
      cedula: form.cedula,
      monto: parseInt(form.monto),
      fecha_comprobante: new Date().toISOString().split('T')[0],
      banco: form.metodo_pago,
      referencia: form.referencia,
      conceptos,
      observacion: form.observacion,
      meses: mesesSeleccionados
    };

    const res = await fetch(`${API_BASE_URL}/payments?club_id=${CLUB_ID}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const data = await res.json();

    if (data.success) {
      onSuccess && onSuccess();
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-[#161B22] rounded-2xl border border-[#30363D] w-full max-w-md p-6 space-y-4">

        <h2 className="text-lg text-white font-bold">Registrar Pago</h2>

        <select
          value={form.concepto}
          onChange={(e) => handleChange('concepto', e.target.value)}
          className="w-full p-3 bg-[#1E2530] text-white rounded"
        >
          {CONCEPTOS.map(c => <option key={c}>{c}</option>)}
        </select>

        {form.concepto === 'Mensualidad' && (
          <div className="grid grid-cols-3 gap-2">
            {MESES.map(m => (
              <button
                key={m.valor}
                type="button"
                onClick={() => {
                  setMesesSeleccionados(prev =>
                    prev.includes(m.valor)
                      ? prev.filter(x => x !== m.valor)
                      : [...prev, m.valor]
                  );
                }}
                className={`p-2 rounded text-xs ${
                  mesesSeleccionados.includes(m.valor)
                    ? 'bg-[#00D084] text-black'
                    : 'bg-[#1E2530] text-white'
                }`}
              >
                {m.nombre}
              </button>
            ))}
          </div>
        )}

        <input
          value={form.monto}
          readOnly
          className="w-full p-3 bg-[#1E2530] text-white rounded"
        />

        <textarea
          placeholder="Observación"
          value={form.observacion}
          onChange={(e) => handleChange('observacion', e.target.value)}
          className="w-full p-3 bg-[#1E2530] text-white rounded"
        />

        <button
          onClick={handleConfirmar}
          className="w-full bg-[#00D084] text-black p-3 rounded font-semibold"
        >
          Registrar
        </button>

      </div>
    </div>
  );
}
