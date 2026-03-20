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
    monto: '0',
    metodo_pago: 'Efectivo',
    referencia: '',
    observacion: '',
  });

  const [jugadorSeleccionado, setJugadorSeleccionado] = useState(null);
  const [busqueda, setBusqueda] = useState('');

  useEffect(() => {
    if (form.concepto === 'Mensualidad') {
      setForm(prev => ({
        ...prev,
        monto: (mesesSeleccionados.length * 65000).toString()
      }));
    }
  }, [mesesSeleccionados]);

  const seleccionarJugador = (j) => {
    setJugadorSeleccionado(j);
    setForm(prev => ({ ...prev, cedula: j.cedula }));
    setBusqueda(j.nombre);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const conceptos = [{
      tipo: form.concepto.toLowerCase(),
      descripcion: form.concepto,
      valor: parseInt(form.monto)
    }];

    const payload = {
      cedula: form.cedula,
      monto: parseInt(form.monto),
      banco: form.metodo_pago,
      referencia: form.referencia,
      fecha_comprobante: new Date().toISOString().split('T')[0],
      conceptos,
      observacion: form.observacion,
      meses: mesesSeleccionados
    };

    const res = await fetch(`${API_BASE_URL}/payments?club_id=${CLUB_ID}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const data = await res.json();

    if (data.success) {
      alert('Pago registrado');
      onSuccess && onSuccess();
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center">
      <form onSubmit={handleSubmit} className="bg-[#161B22] p-6 rounded-xl w-full max-w-md space-y-4">

        <input placeholder="Buscar jugador"
          value={busqueda}
          onChange={e => setBusqueda(e.target.value)}
          className="w-full p-2 bg-[#1E2530] text-white rounded"
        />

        {jugadores.map(j => (
          <div key={j.cedula} onClick={() => seleccionarJugador(j)} className="cursor-pointer text-white">
            {j.nombre} - {j.cedula}
          </div>
        ))}

        <select value={form.concepto} onChange={e => setForm({...form, concepto: e.target.value})}>
          {CONCEPTOS.map(c => <option key={c}>{c}</option>)}
        </select>

        {form.concepto === 'Mensualidad' && (
          <div className="grid grid-cols-3 gap-2">
            {MESES.map(m => (
              <button type="button"
                key={m.valor}
                onClick={() => {
                  setMesesSeleccionados(prev =>
                    prev.includes(m.valor)
                      ? prev.filter(x => x !== m.valor)
                      : [...prev, m.valor]
                  );
                }}
                className={mesesSeleccionados.includes(m.valor) ? 'bg-green-500 text-black' : 'bg-gray-700 text-white'}>
                {m.nombre}
              </button>
            ))}
          </div>
        )}

        <input value={form.monto} readOnly className="w-full p-2 bg-gray-800 text-white"/>

        <textarea value={form.observacion}
          onChange={e => setForm({...form, observacion: e.target.value})}
          className="w-full p-2 bg-gray-800 text-white"
        />

        <button type="submit" className="bg-green-500 p-2 w-full">
          Registrar
        </button>

      </form>
    </div>
  );
}
