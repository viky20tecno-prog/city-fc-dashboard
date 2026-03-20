// SOLO TE DEJO LA PARTE MODIFICADA CLAVE

// 🔥 AGREGA ESTO ARRIBA
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

const [mesesSeleccionados, setMesesSeleccionados] = useState([]);

// 🔥 AUTO CALCULAR MONTO
useEffect(() => {
  if (form.concepto === 'Mensualidad') {
    setForm(prev => ({
      ...prev,
      monto: (mesesSeleccionados.length * 65000).toString()
    }));
  }
}, [mesesSeleccionados]);

// 🔥 UI (PONLO DEBAJO DE CONCEPTO)
{form.concepto === 'Mensualidad' && (
  <div>
    <label className="text-sm text-[#E6EDF3]">Mes(es)</label>
    <div className="grid grid-cols-3 gap-2 mt-2">
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
          className={`px-3 py-2 rounded text-sm ${
            mesesSeleccionados.includes(m.valor)
              ? 'bg-[#00D084] text-black'
              : 'bg-[#1E2530] text-[#8B949E]'
          }`}
        >
          {m.nombre}
        </button>
      ))}
    </div>
  </div>
)}
