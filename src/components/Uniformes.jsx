import { useState, useEffect, useRef } from 'react';
import { Shirt, CheckCircle, AlertCircle, Search, Loader, X, Pencil, Save, Download } from 'lucide-react';
import { authFetch } from '../lib/authFetch';
import jsPDF from 'jspdf';

const PRENDAS = [
  { valor: 'Uniforme naranja',  precio: 120000 },
  { valor: 'Camiseta naranja',  precio: 75000  },
  { valor: 'Uniforme blanco',   precio: 110000 },
  { valor: 'Camiseta blanca',   precio: 65000  },
  { valor: 'Uniforme Portero',  precio: 120000 },
  { valor: 'Camiseta Portero',  precio: 75000  },
  { valor: 'Peto',              precio: 44000  },
  { valor: 'Pantaloneta',       precio: 45000  },
  { valor: 'Chaqueta',          precio: 170000 },
  { valor: 'Sudadera',          precio: 115000 },
  { valor: 'Medias',            precio: 15000  },
];

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'https://city-fc-api-v2.vercel.app/api';
const CLUB_ID = 'city-fc';

export default function Uniformes() {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    cedula: '',
    nombre: '',
    prendas: [],
    nombre_estampar: '',
    talla: '',
    numero: '',
    es_familiar: false,
    genero: 'Hombre',
  });
  const [jugadorEncontrado, setJugadorEncontrado] = useState(null);
  const [jugadores, setJugadores] = useState([]);
  const [busqueda, setBusqueda] = useState('');
  const [sugerencias, setSugerencias] = useState([]);
  const [mostrarSugerencias, setMostrarSugerencias] = useState(false);
  const [numerosUsados, setNumerosUsados] = useState([]);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState('');
  const [exito, setExito] = useState(false);
  const [pedidos, setPedidos] = useState([]);
  const [tabPedidos, setTabPedidos] = useState('PENDIENTE');
  const [cambiandoEstado, setCambiandoEstado] = useState(null);
  const [generandoPDF, setGenerandoPDF] = useState(false);
  const [pedidoEditando, setPedidoEditando] = useState(null);
  const [editForm, setEditForm] = useState({ prendas: [], talla: '', numero: '', nombre_estampar: '' });
  const [editError, setEditError] = useState('');
  const [guardandoEdit, setGuardandoEdit] = useState(false);
  const searchRef = useRef(null);

  useEffect(() => {
    cargarDatos();
  }, []);

  // Cerrar sugerencias al hacer click fuera
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setMostrarSugerencias(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const cargarDatos = async () => {
    try {
      const [playersRes, numRes, pedRes] = await Promise.all([
        authFetch(`${API_BASE}/players?club_id=${CLUB_ID}`),
        authFetch(`${API_BASE}/uniforms/numeros?club_id=${CLUB_ID}`),
        authFetch(`${API_BASE}/uniforms?club_id=${CLUB_ID}`),
      ]);
      const playersData = await playersRes.json();
      const numData = await numRes.json();
      const pedData = await pedRes.json();

      if (playersData.success) setJugadores(playersData.data || []);
      if (numData.success) {
        const normalizados = (numData.numeros || []).map(n => String(parseInt(n, 10)));
        setNumerosUsados(normalizados);
      }
      if (pedData.success) setPedidos(pedData.data || []);
    } catch (e) {
      console.error('Error cargando datos:', e);
    }
  };

  const handleBusquedaChange = (e) => {
    const val = e.target.value;
    setBusqueda(val);

    if (val.trim().length < 2) {
      setSugerencias([]);
      setMostrarSugerencias(false);
      return;
    }

    const lower = val.toLowerCase();
    const filtered = jugadores.filter(j => {
      const nombreCompleto = `${j.nombre || ''} ${j.apellidos || ''}`.toLowerCase();
      const cedula = String(j.cedula || '').toLowerCase();
      return nombreCompleto.includes(lower) || cedula.includes(lower);
    }).slice(0, 6);

    setSugerencias(filtered);
    setMostrarSugerencias(true);
  };

  const seleccionarJugador = (jugador) => {
    const nombreCompleto = `${jugador.nombre || ''} ${jugador.apellidos || ''}`.trim();
    setJugadorEncontrado(jugador);
    setForm(f => ({ ...f, cedula: jugador.cedula, nombre: nombreCompleto }));
    setBusqueda(nombreCompleto);
    setSugerencias([]);
    setMostrarSugerencias(false);
    setError('');
    setStep(2);
  };

  const limpiarBusqueda = () => {
    setBusqueda('');
    setSugerencias([]);
    setMostrarSugerencias(false);
    setJugadorEncontrado(null);
    setStep(1);
    setForm({ cedula: '', nombre: '', prendas: [], nombre_estampar: '', talla: '', numero: '', es_familiar: false, genero: 'Hombre' });
    setError('');
  };

  const togglePrenda = (prenda) => {
    setForm(f => {
      const existe = f.prendas.find(p => p.valor === prenda.valor);
      return {
        ...f,
        prendas: existe
          ? f.prendas.filter(p => p.valor !== prenda.valor)
          : [...f.prendas, prenda],
      };
    });
  };

  const total = form.prendas.reduce((sum, p) => sum + p.precio, 0);

  const formatNumero = (val) => val.replace(/\D/g, '').slice(0, 3);

  const numeroNormalizado = form.numero ? String(parseInt(form.numero, 10)) : '';
  const numeroDisplay = form.numero ? form.numero.padStart(3, '0') : '';
  const numeroRepetido = numeroNormalizado ? numerosUsados.includes(numeroNormalizado) : false;
  const numeroValido = form.numero && !numeroRepetido;

  const handleSubmit = async () => {
    setError('');
    const faltantes = [];
    if (form.prendas.length === 0) faltantes.push('prenda');
    if (!form.talla) faltantes.push('talla');
    if (!form.numero) faltantes.push('número');
    if (faltantes.length > 0) {
      setError(`Faltá completar: ${faltantes.join(', ')}.`);
      return;
    }
    if (numeroRepetido) {
      setError(`El número ${numeroDisplay} ya está asignado. Elegí otro.`);
      return;
    }
    const numeroPadded = form.numero.padStart(3, '0');
    setEnviando(true);
    try {
      const res = await authFetch(`${API_BASE}/uniforms?club_id=${CLUB_ID}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          tipo: form.es_familiar ? `Familiar - ${form.genero}` : 'Jugador',
          prendas: form.prendas.map(p => p.valor).join(', '),
          total,
          numero: numeroPadded,
          club_id: CLUB_ID,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setExito(true);
        await cargarDatos();
        setTimeout(() => {
          setExito(false);
          limpiarBusqueda();
        }, 3000);
      } else {
        setError(data.error || data.message || 'Error al registrar el pedido.');
      }
    } catch (e) {
      setError('Error de conexión. Intentá de nuevo.');
    } finally {
      setEnviando(false);
    }
  };

  const generarPDF = () => {
    setGenerandoPDF(true);
    try {
      const doc   = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
      const W     = doc.internal.pageSize.getWidth();
      const H     = doc.internal.pageSize.getHeight();
      const M     = 12; // margen lateral
      const COL_W = W - M * 2;

      const fmtCOP  = (n) => `$${parseFloat(n || 0).toLocaleString('es-CO')}`;
      const fecha   = new Date().toLocaleDateString('es-CO', { day: '2-digit', month: 'long', year: 'numeric' });
      const trunc   = (s, max) => (s.length > max ? s.slice(0, max - 2) + '..' : s);

      const pendientes = pedidos.filter(p => p.estado === 'PENDIENTE');
      const pagados    = pedidos.filter(p => p.estado === 'PAGADO');
      const entregados = pedidos.filter(p => p.estado === 'ENTREGADO');

      // Leer prendas con todos los fallbacks posibles
      const getPrendas = (p) =>
        String(p.prendas || p.prenda || p.tipo_uniforme || p.tipo || '—');

      // Columnas (A4 landscape = 297mm, margen 12 cada lado → 273mm útiles)
      const C = {
        cedula:  M,       // 22mm
        nombre:  M + 22,  // 50mm
        prendas: M + 72,  // 82mm  ← la más ancha
        talla:   M + 154, // 14mm
        numero:  M + 168, // 18mm
        estampa: M + 186, // 30mm
        total:   M + 216, // hasta el margen derecho
      };

      // ── Header ──────────────────────────────────────────────────────────
      const drawHeader = () => {
        doc.setFillColor(6, 12, 24);
        doc.rect(0, 0, W, 20, 'F');
        doc.setFillColor(0, 170, 255);
        doc.rect(0, 20, W, 1, 'F');
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(15);
        doc.setTextColor(255, 255, 255);
        doc.text('CITY FC  --  Pedido de Uniformes', M, 13);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        doc.setTextColor(130, 160, 200);
        doc.text(`Generado: ${fecha}`, W - M, 13, { align: 'right' });
      };

      // ── Titulo de seccion ────────────────────────────────────────────────
      const drawSection = (label, count, y, rgb) => {
        doc.setFillColor(...rgb);
        doc.rect(M, y, COL_W, 9, 'F');
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(9.5);
        doc.setTextColor(255, 255, 255);
        doc.text(`${label}  (${count})`, M + 3, y + 6.2);
        return y + 13;
      };

      // ── Cabecera de tabla ────────────────────────────────────────────────
      const drawTableHead = (y) => {
        doc.setFillColor(15, 31, 54);
        doc.rect(M, y, COL_W, 6.5, 'F');
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(7);
        doc.setTextColor(100, 130, 160);
        [
          [C.cedula,  'CEDULA'],
          [C.nombre,  'NOMBRE'],
          [C.prendas, 'PRENDAS'],
          [C.talla,   'TALLA'],
          [C.numero,  'NUM.'],
          [C.estampa, 'ESTAMPA'],
          [C.total,   'TOTAL'],
        ].forEach(([x, h]) => doc.text(h, x, y + 4.5));
        return y + 6.5;
      };

      // ── Fila de datos ────────────────────────────────────────────────────
      const drawRow = (p, y, odd) => {
        const rH = 8.5;
        doc.setFillColor(odd ? 10 : 16, odd ? 21 : 30, odd ? 38 : 52);
        doc.rect(M, y, COL_W, rH, 'F');

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7.8);
        doc.setTextColor(190, 210, 230);
        const mid = y + 5.8;

        doc.text(trunc(String(p.cedula || ''), 14),        C.cedula,  mid);
        const esFamiliar = p.tipo && p.tipo !== 'Jugador';
        const nombrePDF  = trunc(String(p.nombre || '—'), esFamiliar ? 19 : 26);
        doc.text(nombrePDF, C.nombre, mid);
        if (esFamiliar) {
          doc.setTextColor(198, 120, 255);
          doc.setFontSize(6.5);
          doc.text(trunc(p.tipo, 14), C.nombre + doc.getTextWidth(nombrePDF) + 1.5, mid);
          doc.setFontSize(7.8);
          doc.setTextColor(190, 210, 230);
        }
        doc.text(trunc(getPrendas(p), 44),                 C.prendas, mid);
        doc.text(String(p.talla          || '—'),          C.talla,   mid);
        doc.text(String(p.numero_estampar || '—'),         C.numero,  mid);
        doc.text(trunc(String(p.nombre_estampar || '—'), 16), C.estampa, mid);

        doc.setTextColor(0, 170, 255);
        doc.setFont('helvetica', 'bold');
        doc.text(fmtCOP(p.total), C.total, mid);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(190, 210, 230);

        return y + rH;
      };

      // ── Pie de tabla ─────────────────────────────────────────────────────
      const drawFoot = (lista, y) => {
        const tot = lista.reduce((s, p) => s + parseFloat(p.total || 0), 0);
        doc.setFillColor(5, 30, 60);
        doc.rect(M, y, COL_W, 7.5, 'F');
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8);
        doc.setTextColor(160, 190, 220);
        doc.text(`${lista.length} pedido${lista.length !== 1 ? 's' : ''}`, M + 3, y + 5.2);
        doc.setTextColor(0, 200, 255);
        doc.text(`Total: ${fmtCOP(tot)}`, W - M, y + 5.2, { align: 'right' });
        return y + 10;
      };

      // ── Salto de pagina si no cabe ───────────────────────────────────────
      const chk = (y, need = 14) => {
        if (y + need > H - 10) { doc.addPage(); drawHeader(); return 26; }
        return y;
      };

      // ── Bloque completo por estado ───────────────────────────────────────
      const drawBlock = (lista, label, y, rgb, emptyMsg) => {
        y = chk(y, 30);
        y = drawSection(label, lista.length, y, rgb);
        if (lista.length === 0) {
          doc.setFont('helvetica', 'italic');
          doc.setFontSize(8);
          doc.setTextColor(100, 120, 150);
          doc.text(emptyMsg, M + 3, y + 5);
          return y + 12;
        }
        y = drawTableHead(y);
        lista.forEach((p, i) => { y = chk(y); y = drawRow(p, y, i % 2 === 0); });
        y = drawFoot(lista, y);
        return y + 5;
      };

      // ── RESUMEN SUPERIOR ─────────────────────────────────────────────────
      drawHeader();
      let y = 26;

      const cardW = (COL_W - 8) / 3;
      const cards = [
        { label: 'Pendientes de pago',           count: pendientes.length, rgb: [245, 158, 11] },
        { label: 'Pagados · pendientes de entrega', count: pagados.length, rgb: [34, 197, 94]  },
        { label: 'Entregados',                   count: entregados.length, rgb: [0, 170, 255]  },
      ];
      cards.forEach((c, i) => {
        const cx = M + i * (cardW + 4);
        doc.setFillColor(10, 22, 40);
        doc.roundedRect(cx, y, cardW, 16, 2, 2, 'F');
        doc.setFont('helvetica', 'normal'); doc.setFontSize(7.5);
        doc.setTextColor(110, 130, 160);
        doc.text(c.label, cx + 3, y + 6);
        doc.setFont('helvetica', 'bold'); doc.setFontSize(17);
        doc.setTextColor(...c.rgb);
        doc.text(String(c.count), cx + 3, y + 14);
      });
      y += 20;

      // ── LAS TRES SECCIONES ───────────────────────────────────────────────
      y = drawBlock(pendientes, 'PENDIENTES DE PAGO',             y, [160, 90, 0],   'Sin pedidos pendientes de pago.');
      y = drawBlock(pagados,    'PAGADOS  -  PENDIENTES DE ENTREGA', y, [0, 110, 55], 'Sin pedidos pagados pendientes de entrega.');
          drawBlock(entregados, 'ENTREGADOS',                     y, [0, 100, 180],  'Sin pedidos entregados aun.');

      // ── FOOTER ───────────────────────────────────────────────────────────
      const pages = doc.internal.getNumberOfPages();
      for (let i = 1; i <= pages; i++) {
        doc.setPage(i);
        doc.setFillColor(6, 12, 24);
        doc.rect(0, H - 7, W, 7, 'F');
        doc.setFont('helvetica', 'normal'); doc.setFontSize(6.5); doc.setTextColor(70, 95, 130);
        doc.text('City FC  --  Agente Contable', M, H - 2.2);
        doc.text(`Pag. ${i} / ${pages}`, W - M, H - 2.2, { align: 'right' });
      }

      doc.save(`city-fc-uniformes-${new Date().toISOString().slice(0, 10)}.pdf`);
    } finally {
      setGenerandoPDF(false);
    }
  };

  const handleCambiarEstado = async (pedido, nuevoEstado) => {
    const pedidoId = pedido.id ?? pedido._id ?? pedido.rowId ?? pedido.row_id;
    if (!pedidoId) return;
    setCambiandoEstado(pedidoId);
    try {
      const res = await authFetch(`${API_BASE}/uniforms/${pedidoId}?club_id=${CLUB_ID}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ estado: nuevoEstado }),
      });
      const data = await res.json();
      if (res.ok || data.success) await cargarDatos();
    } catch (e) {
      console.error('[Uniformes] Error cambiando estado:', e);
    } finally {
      setCambiandoEstado(null);
    }
  };

  const abrirEditar = (pedido) => {
    // Debug: ver campos disponibles del pedido
    console.log('[Uniformes] Pedido a editar:', pedido);
    // Parsear el string de prendas de vuelta a array de objetos
    const prendasStr = pedido.prendas || pedido.prenda || '';
    const prendasArray = prendasStr
      ? prendasStr.split(',').map(s => s.trim()).reduce((acc, nombre) => {
          const encontrada = PRENDAS.find(p => p.valor === nombre);
          if (encontrada) acc.push(encontrada);
          return acc;
        }, [])
      : [];

    setEditForm({
      prendas: prendasArray,
      talla: pedido.talla || '',
      numero: pedido.numero_estampar ? String(parseInt(pedido.numero_estampar, 10)) : '',
      nombre_estampar: pedido.nombre_estampar || '',
    });
    setEditError('');
    setPedidoEditando(pedido);
  };

  const cerrarEditar = () => {
    setPedidoEditando(null);
    setEditError('');
  };

  const toggleEditPrenda = (prenda) => {
    setEditForm(f => {
      const existe = f.prendas.find(p => p.valor === prenda.valor);
      return {
        ...f,
        prendas: existe
          ? f.prendas.filter(p => p.valor !== prenda.valor)
          : [...f.prendas, prenda],
      };
    });
  };

  const handleGuardarEdit = async () => {
    setEditError('');
    if (editForm.prendas.length === 0) { setEditError('Seleccioná al menos una prenda.'); return; }
    if (!editForm.talla)                { setEditError('Seleccioná una talla.'); return; }
    if (!editForm.numero)               { setEditError('Ingresá el número de camiseta.'); return; }

    const numeroNorm = String(parseInt(editForm.numero, 10));
    const numeroPadded = editForm.numero.padStart(3, '0');
    const numOriginal = pedidoEditando.numero_estampar
      ? String(parseInt(pedidoEditando.numero_estampar, 10))
      : '';

    // Solo bloquear si el número cambió Y ya está en uso
    if (numeroNorm !== numOriginal && numerosUsados.includes(numeroNorm)) {
      setEditError(`El número ${numeroPadded} ya está asignado a otro jugador.`);
      return;
    }

    const totalEdit = editForm.prendas.reduce((s, p) => s + p.precio, 0);

    // Buscar el ID del pedido en varios campos posibles
    const pedidoId = pedidoEditando.id ?? pedidoEditando._id ?? pedidoEditando.rowId ?? pedidoEditando.row_id;
    if (!pedidoId) {
      setEditError('No se encontró el ID del pedido. Revisá la consola del navegador (F12) para ver los campos disponibles.');
      console.error('[Uniformes] El pedido no tiene campo "id". Campos disponibles:', Object.keys(pedidoEditando));
      return;
    }

    setGuardandoEdit(true);
    try {
      const res = await authFetch(`${API_BASE}/uniforms/${pedidoId}?club_id=${CLUB_ID}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prendas: editForm.prendas.map(p => p.valor).join(', '),
          talla: editForm.talla,
          numero: numeroPadded,
          nombre_estampar: editForm.nombre_estampar,
          total: totalEdit,
        }),
      });

      let data = {};
      try { data = await res.json(); } catch (_) {}

      if (res.ok || data.success) {
        await cargarDatos();
        cerrarEditar();
      } else {
        setEditError(data.error || data.message || `Error ${res.status}: no se pudo actualizar.`);
      }
    } catch (e) {
      console.error('[Uniformes] Error en PUT:', e);
      setEditError(`Error: ${e.message || 'No se pudo conectar con el servidor.'}`);
    } finally {
      setGuardandoEdit(false);
    }
  };

  const formatFecha = (iso) => {
    if (!iso) return '—';
    try {
      return new Date(iso).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' });
    } catch {
      return '—';
    }
  };

  return (
    <div className="space-y-6">
      <div className="max-w-xl mx-auto">
        <div className="bg-[#0A1628] rounded-2xl border border-[#1A3A5C] p-6">

          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-[rgba(0,170,255,0.12)] flex items-center justify-center">
              <Shirt className="w-5 h-5 text-[#00AAFF]" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-[#F5F5F5]">Pedido de Uniforme</h2>
              <p className="text-xs text-[#737373]">
                {step === 1 ? 'Paso 1 — Buscá el jugador por nombre o cédula' : 'Paso 2 — Datos del uniforme'}
              </p>
            </div>
          </div>

          {exito && (
            <div className="flex items-center gap-3 p-4 rounded-xl bg-[rgba(0,170,255,0.12)] border border-[#00AAFF]/30 mb-6">
              <CheckCircle className="w-5 h-5 text-[#00AAFF]" />
              <p className="text-sm text-[#00AAFF] font-medium">¡Pedido registrado exitosamente!</p>
            </div>
          )}

          {error && (
            <div className="flex items-center gap-3 p-4 rounded-xl bg-[rgba(255,94,94,0.12)] border border-[#FF5E5E]/30 mb-6">
              <AlertCircle className="w-5 h-5 text-[#FF5E5E]" />
              <p className="text-sm text-[#FF5E5E]">{error}</p>
            </div>
          )}

          {/* Paso 1: Buscador */}
          {step === 1 && (
            <div className="space-y-4">
              <div ref={searchRef} className="relative">
                <label className="block text-xs text-[#737373] mb-1.5">Buscar jugador *</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#737373]" />
                  <input
                    type="text"
                    value={busqueda}
                    onChange={handleBusquedaChange}
                    onFocus={() => busqueda.trim().length >= 2 && setMostrarSugerencias(true)}
                    placeholder="Nombre, apellido o cédula..."
                    className="w-full bg-[#060C18] border border-[#1A3A5C] rounded-xl pl-10 pr-10 py-2.5 text-sm text-[#F5F5F5] placeholder-[#737373] focus:outline-none focus:border-[#00AAFF] transition-colors"
                  />
                  {busqueda && (
                    <button
                      onClick={limpiarBusqueda}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[#737373] hover:text-[#F5F5F5] transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>

                {/* Dropdown de sugerencias */}
                {mostrarSugerencias && sugerencias.length > 0 && (
                  <div className="absolute z-20 w-full mt-1 bg-[#0F1F36] border border-[#1A3A5C] rounded-xl shadow-xl overflow-hidden">
                    {sugerencias.map((j) => (
                      <button
                        key={j.cedula}
                        onClick={() => seleccionarJugador(j)}
                        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-[#2D3748] transition-colors text-left border-b border-[#1A3A5C]/50 last:border-0"
                      >
                        <div className="w-8 h-8 rounded-full bg-[rgba(0,170,255,0.12)] flex items-center justify-center flex-shrink-0">
                          <span className="text-xs font-bold text-[#00AAFF]">
                            {(j.nombre || '?')[0].toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-[#F5F5F5]">{j.nombre} {j.apellidos}</p>
                          <p className="text-xs text-[#737373]">CC {j.cedula}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}

                {mostrarSugerencias && sugerencias.length === 0 && busqueda.trim().length >= 2 && (
                  <div className="absolute z-20 w-full mt-1 bg-[#0F1F36] border border-[#1A3A5C] rounded-xl px-4 py-3">
                    <p className="text-sm text-[#737373]">No se encontró ningún jugador</p>
                  </div>
                )}
              </div>
              <p className="text-xs text-[#737373]">Escribe al menos 2 caracteres para ver sugerencias</p>
            </div>
          )}

          {/* Paso 2: Datos del uniforme */}
          {step === 2 && jugadorEncontrado && (
            <div className="space-y-4">

              {/* Jugador seleccionado */}
              <div className="p-3 rounded-xl bg-[rgba(0,170,255,0.1)] border border-[#00AAFF]/20 flex items-center gap-3">
                <CheckCircle className="w-4 h-4 text-[#00AAFF] flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-[#F5F5F5]">
                    {jugadorEncontrado.nombre} {jugadorEncontrado.apellidos}
                  </p>
                  <p className="text-xs text-[#737373]">CC {jugadorEncontrado.cedula}</p>
                </div>
                <button
                  onClick={limpiarBusqueda}
                  className="ml-auto text-xs text-[#737373] hover:text-[#F5F5F5] transition-colors"
                >
                  Cambiar
                </button>
              </div>

              {/* Toggle familiar */}
              <div className={`rounded-xl border transition-all ${
                form.es_familiar
                  ? 'bg-[rgba(198,120,255,0.1)] border-[#C678FF]/30'
                  : 'bg-[#060C18] border-[#1A3A5C]'
              }`}>
                <button
                  type="button"
                  onClick={() => setForm(f => ({ ...f, es_familiar: !f.es_familiar }))}
                  className="w-full flex items-center justify-between px-4 py-3 text-left"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-base">👨‍👩‍👦</span>
                    <div>
                      <p className={`text-sm font-medium ${form.es_familiar ? 'text-[#C678FF]' : 'text-[#737373]'}`}>
                        Pedido para familiar
                      </p>
                      <p className="text-xs text-[#737373]">
                        {form.es_familiar ? 'Uniforme para un familiar del jugador' : 'Activar si el uniforme es para un familiar'}
                      </p>
                    </div>
                  </div>
                  {/* Switch visual */}
                  <div className={`w-10 h-5.5 rounded-full flex items-center transition-all px-0.5 ${
                    form.es_familiar ? 'bg-[#C678FF]' : 'bg-[#1A3A5C]'
                  }`} style={{ height: '22px' }}>
                    <div className={`w-4 h-4 rounded-full bg-white transition-transform ${
                      form.es_familiar ? 'translate-x-5' : 'translate-x-0'
                    }`} />
                  </div>
                </button>

                {/* Selector de género — solo cuando es_familiar */}
                {form.es_familiar && (
                  <div className="px-4 pb-4 pt-1 border-t border-[#C678FF]/20">
                    <p className="text-xs text-[#737373] mb-2">Género del familiar *</p>
                    <div className="flex gap-3">
                      {['Hombre', 'Mujer'].map(g => (
                        <button
                          key={g}
                          type="button"
                          onClick={() => setForm(f => ({ ...f, genero: g }))}
                          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium border transition-colors ${
                            form.genero === g
                              ? 'bg-[rgba(198,120,255,0.15)] border-[#C678FF]/50 text-[#C678FF]'
                              : 'bg-[#060C18] border-[#1A3A5C] text-[#737373] hover:text-[#F5F5F5]'
                          }`}
                        >
                          <span>{g === 'Hombre' ? '👨' : '👩'}</span>
                          {g}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs text-[#737373] mb-1.5">Prendas * <span className="font-normal">(podés seleccionar varias)</span></label>
                <div className="grid grid-cols-1 gap-2">
                  {PRENDAS.map(p => {
                    const seleccionada = form.prendas.find(x => x.valor === p.valor);
                    return (
                      <button
                        key={p.valor}
                        onClick={() => togglePrenda(p)}
                        className={`flex items-center justify-between px-4 py-2.5 rounded-xl text-sm font-medium border transition-colors ${
                          seleccionada
                            ? 'bg-[rgba(0,170,255,0.12)] border-[#00AAFF]/50 text-[#00AAFF]'
                            : 'bg-[#060C18] border-[#1A3A5C] text-[#737373] hover:text-[#F5F5F5]'
                        }`}
                      >
                        <span>{p.valor}</span>
                        <span className="font-mono text-xs">${p.precio.toLocaleString('es-CO')}</span>
                      </button>
                    );
                  })}
                </div>
                {form.prendas.length > 0 && (
                  <div className="mt-3 flex items-center justify-between px-4 py-2.5 rounded-xl bg-[#060C18] border border-[#00AAFF]/30">
                    <span className="text-xs text-[#737373]">{form.prendas.length} prenda{form.prendas.length > 1 ? 's' : ''} seleccionada{form.prendas.length > 1 ? 's' : ''}</span>
                    <span className="text-sm font-bold text-[#00AAFF]">Total: ${total.toLocaleString('es-CO')}</span>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs text-[#737373] mb-1.5">
                  Nombre a estampar
                  <span className="ml-2 text-[#737373] font-normal italic">— puede ser apodo o sobrenombre</span>
                </label>
                <input
                  type="text"
                  value={form.nombre_estampar}
                  onChange={e => setForm(f => ({ ...f, nombre_estampar: e.target.value.toUpperCase() }))}
                  placeholder="Ej: CAÑÓN, TOÑO, EL DIEZ..."
                  className="w-full bg-[#060C18] border border-[#1A3A5C] rounded-xl px-4 py-2.5 text-sm text-[#F5F5F5] placeholder-[#737373] focus:outline-none focus:border-[#00AAFF] transition-colors"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-[#737373] mb-1.5">Talla *</label>
                  <div className="grid grid-cols-2 gap-2">
                    {['S', 'M', 'L', 'XL'].map(t => (
                      <button
                        key={t}
                        onClick={() => setForm(f => ({ ...f, talla: t }))}
                        className={`py-2 rounded-xl text-sm font-medium border transition-colors ${
                          form.talla === t
                            ? 'bg-[rgba(0,170,255,0.12)] border-[#00AAFF]/50 text-[#00AAFF]'
                            : 'bg-[#060C18] border-[#1A3A5C] text-[#737373] hover:text-[#F5F5F5]'
                        }`}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-xs text-[#737373] mb-1.5">
                    Número * <span className="text-[#737373] font-normal">(3 dígitos)</span>
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={form.numero}
                    onChange={e => setForm(f => ({ ...f, numero: formatNumero(e.target.value) }))}
                    placeholder="001"
                    maxLength={3}
                    className={`w-full bg-[#060C18] border rounded-xl px-4 py-2.5 text-sm font-mono text-[#F5F5F5] placeholder-[#737373] focus:outline-none transition-colors ${
                      numeroRepetido
                        ? 'border-[#FF5E5E] focus:border-[#FF5E5E]'
                        : 'border-[#1A3A5C] focus:border-[#00AAFF]'
                    }`}
                  />
                  {form.numero && (
                    <p className={`text-xs mt-1 font-mono ${numeroValido ? 'text-[#00AAFF]' : 'text-[#FF5E5E]'}`}>
                      {numeroValido
                        ? `✓ #${numeroDisplay} disponible`
                        : `✗ #${numeroDisplay} ya asignado`}
                    </p>
                  )}
                </div>
              </div>

              <button
                onClick={handleSubmit}
                disabled={form.prendas.length === 0 || !form.talla || !form.numero || enviando || !numeroValido}
                className="w-full py-3 rounded-xl bg-[#00AAFF] text-[#060C18] text-sm font-bold hover:bg-[#00AAFF]/80 transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {enviando ? (
                  <><Loader className="w-4 h-4 animate-spin" /> Registrando...</>
                ) : (
                  'Registrar pedido'
                )}
              </button>
              <p className="text-xs text-[#737373] text-center">* Campos obligatorios</p>
            </div>
          )}
        </div>
      </div>

      {pedidos.length > 0 && (() => {
        const pendientes  = pedidos.filter(p => p.estado === 'PENDIENTE');
        const pagados     = pedidos.filter(p => p.estado === 'PAGADO');
        const entregados  = pedidos.filter(p => p.estado === 'ENTREGADO');
        const vistaActual = tabPedidos === 'PENDIENTE' ? pendientes
                          : tabPedidos === 'PAGADO'    ? pagados
                          : entregados;

        const TAB_CFG = [
          { key: 'PENDIENTE', label: 'Pendientes', count: pendientes.length,
            activeClass: 'bg-[rgba(245,166,35,0.12)] text-[#F5A623] border-[#F5A623]/30' },
          { key: 'PAGADO',    label: 'Pagados',    count: pagados.length,
            activeClass: 'bg-[rgba(34,197,94,0.12)] text-green-400 border-green-400/30' },
          { key: 'ENTREGADO', label: 'Entregados', count: entregados.length,
            activeClass: 'bg-[rgba(0,170,255,0.12)] text-[#00AAFF] border-[#00AAFF]/30' },
        ];

        return (
          <div className="bg-[#0A1628] rounded-2xl border border-[#1A3A5C] p-6">
            {/* Tabs + botón PDF */}
            <div className="flex items-center gap-2 mb-5 flex-wrap">
              {TAB_CFG.map(t => (
                <button
                  key={t.key}
                  onClick={() => setTabPedidos(t.key)}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-medium border transition-all ${
                    tabPedidos === t.key
                      ? t.activeClass
                      : 'border-[#1A3A5C] text-[#737373] hover:text-[#F5F5F5]'
                  }`}
                >
                  {t.label}
                  <span className={`px-1.5 py-0.5 rounded-md text-[10px] font-bold ${
                    tabPedidos === t.key ? 'bg-white/10' : 'bg-[#0F1F36]'
                  }`}>{t.count}</span>
                </button>
              ))}
              <div className="ml-auto flex items-center gap-3">
                <span className="text-xs text-[#737373]">{pedidos.length} total</span>
                <button
                  onClick={generarPDF}
                  disabled={generandoPDF || pedidos.length === 0}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[rgba(0,170,255,0.1)] border border-[#00AAFF]/30 text-[#00AAFF] text-xs font-medium hover:bg-[rgba(0,170,255,0.18)] transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {generandoPDF
                    ? <><Loader className="w-3.5 h-3.5 animate-spin" />Generando...</>
                    : <><Download className="w-3.5 h-3.5" />Descargar PDF</>
                  }
                </button>
              </div>
            </div>

            {vistaActual.length === 0 ? (
              <p className="text-center text-sm text-[#737373] py-8">
                No hay pedidos en este estado
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-[#1A3A5C]">
                      {['Cédula', 'Nombre', 'Prendas', 'Estampar', 'Talla', 'Número', 'Total', 'Fecha', 'Estado', ''].map(h => (
                        <th key={h} className="text-left py-2 px-3 text-xs text-[#737373] font-medium">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {vistaActual.map((p, i) => {
                      const pid = p.id ?? p._id;
                      const cargando = cambiandoEstado === pid;
                      return (
                        <tr key={i} className="border-b border-[#1A3A5C]/50 hover:bg-[#0F1F36] transition-colors">
                          <td className="py-2 px-3 text-[#737373]">{p.cedula}</td>
                          <td className="py-2 px-3 text-[#F5F5F5]">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              {p.nombre}
                              {p.tipo && p.tipo !== 'Jugador' && (
                                <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-[rgba(198,120,255,0.12)] text-[#C678FF] border border-[#C678FF]/20 whitespace-nowrap">
                                  {p.tipo}
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="py-2 px-3 text-[#F5F5F5] max-w-[180px]">
                            <span className="block truncate" title={p.prendas || p.prenda}>{p.prendas || p.prenda || '—'}</span>
                          </td>
                          <td className="py-2 px-3 text-[#F5F5F5]">{p.nombre_estampar || '—'}</td>
                          <td className="py-2 px-3 text-[#F5F5F5]">{p.talla}</td>
                          <td className="py-2 px-3 text-[#F5F5F5] font-mono font-bold">{p.numero_estampar}</td>
                          <td className="py-2 px-3 text-[#00AAFF] font-semibold">
                            {p.total ? `$${Number(p.total).toLocaleString('es-CO')}` : '—'}
                          </td>
                          <td className="py-2 px-3 text-[#737373] text-xs">{formatFecha(p.created_at)}</td>
                          <td className="py-2 px-3">
                            {/* Badge de estado — clicable si hay siguiente estado */}
                            {p.estado === 'PENDIENTE' && (
                              <button
                                onClick={() => handleCambiarEstado(p, 'PAGADO')}
                                disabled={cargando}
                                title="Marcar como Pagado"
                                className="px-2 py-1 rounded-lg text-xs bg-[rgba(245,166,35,0.12)] text-[#F5A623] border border-[#F5A623]/20 hover:bg-[rgba(34,197,94,0.12)] hover:text-green-400 hover:border-green-400/20 transition-all disabled:opacity-50 cursor-pointer"
                              >
                                {cargando ? '...' : 'PENDIENTE'}
                              </button>
                            )}
                            {p.estado === 'PAGADO' && (
                              <span className="px-2 py-1 rounded-lg text-xs bg-[rgba(34,197,94,0.12)] text-green-400 border border-green-400/20">
                                PAGADO
                              </span>
                            )}
                            {p.estado === 'ENTREGADO' && (
                              <span className="px-2 py-1 rounded-lg text-xs bg-[rgba(0,170,255,0.12)] text-[#00AAFF] border border-[#00AAFF]/20">
                                ENTREGADO
                              </span>
                            )}
                          </td>
                          <td className="py-2 px-3">
                            <div className="flex items-center gap-1.5">
                              {p.estado === 'PAGADO' && (
                                <button
                                  onClick={() => handleCambiarEstado(p, 'ENTREGADO')}
                                  disabled={cargando}
                                  title="Marcar como Entregado"
                                  className="flex items-center gap-1 px-2 py-1.5 rounded-lg border border-[#00AAFF]/30 text-[#00AAFF] hover:bg-[rgba(0,170,255,0.1)] transition-all text-xs disabled:opacity-50"
                                >
                                  {cargando ? <Loader className="w-3 h-3 animate-spin" /> : <CheckCircle className="w-3.5 h-3.5" />}
                                  Entregar
                                </button>
                              )}
                              {p.estado !== 'ENTREGADO' && (
                                <button
                                  onClick={() => abrirEditar(p)}
                                  title="Editar pedido"
                                  className="flex items-center gap-1 px-2 py-1.5 rounded-lg border border-[#1A3A5C] text-[#737373] hover:text-[#00AAFF] hover:border-[#00AAFF]/40 transition-all text-xs"
                                >
                                  <Pencil className="w-3.5 h-3.5" />
                                  Editar
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        );
      })()}

      {/* Modal de edición */}
      {pedidoEditando && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-[#0A1628] border border-[#1A3A5C] rounded-2xl w-full max-w-lg shadow-[0_8px_40px_rgba(0,50,150,0.4)] max-h-[90vh] overflow-y-auto">

            {/* Header del modal */}
            <div className="flex items-center justify-between p-5 border-b border-[#1A3A5C]">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-[rgba(0,170,255,0.12)] flex items-center justify-center">
                  <Pencil className="w-4 h-4 text-[#00AAFF]" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#F5F5F5]">Editar Pedido</h3>
                  <p className="text-xs text-[#737373]">{pedidoEditando.nombre} · #{pedidoEditando.numero_estampar}</p>
                </div>
              </div>
              <button onClick={cerrarEditar} className="p-2 rounded-lg text-[#737373] hover:text-[#F5F5F5] hover:bg-[#0F1F36] transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-5">

              {editError && (
                <div className="flex items-center gap-2 p-3 rounded-xl bg-[rgba(255,94,94,0.12)] border border-[#FF5E5E]/30">
                  <AlertCircle className="w-4 h-4 text-[#FF5E5E] flex-shrink-0" />
                  <p className="text-sm text-[#FF5E5E]">{editError}</p>
                </div>
              )}

              {/* Prendas */}
              <div>
                <label className="block text-xs text-[#737373] mb-2">
                  Prendas <span className="text-[#737373] font-normal">(podés agregar o quitar)</span>
                </label>
                <div className="grid grid-cols-1 gap-1.5">
                  {PRENDAS.map(p => {
                    const sel = editForm.prendas.find(x => x.valor === p.valor);
                    return (
                      <button
                        key={p.valor}
                        onClick={() => toggleEditPrenda(p)}
                        className={`flex items-center justify-between px-4 py-2.5 rounded-xl text-sm font-medium border transition-colors ${
                          sel
                            ? 'bg-[rgba(0,170,255,0.12)] border-[#00AAFF]/50 text-[#00AAFF]'
                            : 'bg-[#060C18] border-[#1A3A5C] text-[#737373] hover:text-[#F5F5F5]'
                        }`}
                      >
                        <span>{p.valor}</span>
                        <span className="font-mono text-xs">${p.precio.toLocaleString('es-CO')}</span>
                      </button>
                    );
                  })}
                </div>
                {editForm.prendas.length > 0 && (
                  <div className="mt-2 flex items-center justify-between px-4 py-2.5 rounded-xl bg-[#060C18] border border-[#00AAFF]/30">
                    <span className="text-xs text-[#737373]">
                      {editForm.prendas.length} prenda{editForm.prendas.length > 1 ? 's' : ''}
                    </span>
                    <span className="text-sm font-bold text-[#00AAFF]">
                      Total: ${editForm.prendas.reduce((s, p) => s + p.precio, 0).toLocaleString('es-CO')}
                    </span>
                  </div>
                )}
              </div>

              {/* Nombre a estampar */}
              <div>
                <label className="block text-xs text-[#737373] mb-1.5">Nombre a estampar</label>
                <input
                  type="text"
                  value={editForm.nombre_estampar}
                  onChange={e => setEditForm(f => ({ ...f, nombre_estampar: e.target.value.toUpperCase() }))}
                  placeholder="Ej: CAÑÓN, TOÑO..."
                  className="w-full bg-[#060C18] border border-[#1A3A5C] rounded-xl px-4 py-2.5 text-sm text-[#F5F5F5] placeholder-[#737373] focus:outline-none focus:border-[#00AAFF] transition-colors"
                />
              </div>

              {/* Talla y Número */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-[#737373] mb-1.5">Talla *</label>
                  <div className="grid grid-cols-2 gap-1.5">
                    {['S', 'M', 'L', 'XL'].map(t => (
                      <button
                        key={t}
                        onClick={() => setEditForm(f => ({ ...f, talla: t }))}
                        className={`py-2 rounded-xl text-sm font-medium border transition-colors ${
                          editForm.talla === t
                            ? 'bg-[rgba(0,170,255,0.12)] border-[#00AAFF]/50 text-[#00AAFF]'
                            : 'bg-[#060C18] border-[#1A3A5C] text-[#737373] hover:text-[#F5F5F5]'
                        }`}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-xs text-[#737373] mb-1.5">Número *</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={editForm.numero}
                    onChange={e => setEditForm(f => ({ ...f, numero: e.target.value.replace(/\D/g, '').slice(0, 3) }))}
                    placeholder="001"
                    maxLength={3}
                    className="w-full bg-[#060C18] border border-[#1A3A5C] rounded-xl px-4 py-2.5 text-sm font-mono text-[#F5F5F5] placeholder-[#737373] focus:outline-none focus:border-[#00AAFF] transition-colors"
                  />
                  {editForm.numero && (() => {
                    const norm = String(parseInt(editForm.numero, 10));
                    const origNorm = pedidoEditando.numero_estampar ? String(parseInt(pedidoEditando.numero_estampar, 10)) : '';
                    const ocupado = norm !== origNorm && numerosUsados.includes(norm);
                    return (
                      <p className={`text-xs mt-1 font-mono ${ocupado ? 'text-[#FF5E5E]' : 'text-[#00AAFF]'}`}>
                        {ocupado ? `✗ #${editForm.numero.padStart(3,'0')} ocupado` : `✓ #${editForm.numero.padStart(3,'0')}`}
                      </p>
                    );
                  })()}
                </div>
              </div>

              {/* Botones */}
              <div className="flex gap-3 pt-1">
                <button
                  onClick={cerrarEditar}
                  className="flex-1 py-2.5 rounded-xl border border-[#1A3A5C] text-[#737373] hover:text-[#F5F5F5] text-sm font-medium transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleGuardarEdit}
                  disabled={guardandoEdit || editForm.prendas.length === 0}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-[#00AAFF] text-[#060C18] text-sm font-bold hover:bg-[#0099EE] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {guardandoEdit
                    ? <><Loader className="w-4 h-4 animate-spin" /> Guardando...</>
                    : <><Save className="w-4 h-4" /> Guardar cambios</>
                  }
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
