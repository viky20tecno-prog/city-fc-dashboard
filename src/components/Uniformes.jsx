import { useState, useEffect, useRef } from 'react';
import { Shirt, CheckCircle, AlertCircle, Search, Loader, X, Pencil, Save, Download, Plus, Trash2, Package } from 'lucide-react';
import { authFetch } from '../lib/authFetch';
import { getClubId } from '../services/api';
import jsPDF from 'jspdf';
import { hexToRgb, loadLogoDataUrl, drawPdfHeader, drawPdfFooter, drawPdfSectionLabel, drawPdfTableHead } from '../lib/pdfHelpers';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'https://api.zensports.zenpra.ai/api';

const normalizarCatalogo = (raw) =>
  (raw || []).map(p =>
    typeof p === 'string'
      ? { nombre: p, precio: 0, precio_proveedor: 0 }
      : { nombre: String(p.nombre || ''), precio: Number(p.precio) || 0, precio_proveedor: Number(p.precio_proveedor) || 0 }
  );

export default function Uniformes({ color = 'var(--cc)', clubNombre = 'Mi Club', clubConfig }) {
  const [tabPrincipal, setTabPrincipal] = useState('pedido');

  // — Pedido form —
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    cedula: '', nombre: '', prendas: [],
    nombre_estampar: '', talla: '', numero: '',
    es_familiar: false, genero: 'Hombre',
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

  // — Pedidos list —
  const [pedidos, setPedidos] = useState([]);
  const [tabPedidos, setTabPedidos] = useState('PENDIENTE');
  const [cambiandoEstado, setCambiandoEstado] = useState(null);
  const [generandoPDF, setGenerandoPDF] = useState(false);
  const [pedidoEditando, setPedidoEditando] = useState(null);
  const [editForm, setEditForm] = useState({ prendas: [], talla: '', numero: '', nombre_estampar: '' });
  const [editError, setEditError] = useState('');
  const [guardandoEdit, setGuardandoEdit] = useState(false);

  // — Catálogo —
  const [catalogo, setCatalogo] = useState([]);
  const [nuevaPrenda, setNuevaPrenda] = useState({ nombre: '', precio: '', precio_proveedor: '' });
  const [editandoIdx, setEditandoIdx] = useState(null);
  const [editandoPrenda, setEditandoPrenda] = useState({ nombre: '', precio: '', precio_proveedor: '' });
  const [guardandoCatalogo, setGuardandoCatalogo] = useState(false);
  const [catalogoMsg, setCatalogoMsg] = useState('');

  const searchRef = useRef(null);

  useEffect(() => { cargarDatos(); }, []);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target))
        setMostrarSugerencias(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const cargarDatos = async () => {
    try {
      const clubId = getClubId();
      const [playersRes, numRes, pedRes, configRes] = await Promise.all([
        authFetch(`${API_BASE}/players?club_id=${clubId}`),
        authFetch(`${API_BASE}/uniforms/numeros?club_id=${clubId}`),
        authFetch(`${API_BASE}/uniforms?club_id=${clubId}`),
        authFetch(`${API_BASE}/config?club_id=${clubId}`),
      ]);
      const [playersData, numData, pedData, configData] = await Promise.all([
        playersRes.json(), numRes.json(), pedRes.json(), configRes.json(),
      ]);
      if (playersData.success) setJugadores(playersData.data || []);
      if (numData.success) {
        const normalizados = (numData.numeros || []).map(n => String(parseInt(n, 10)));
        setNumerosUsados(normalizados);
      }
      if (pedData.success) setPedidos(pedData.data || []);
      if (configData.success) {
        setCatalogo(normalizarCatalogo(configData.prendas_uniforme));
      }
    } catch (e) {
      console.error('Error cargando datos:', e);
    }
  };

  const saveCatalogo = async (nuevoCatalogo) => {
    setGuardandoCatalogo(true);
    try {
      const res = await authFetch(`${API_BASE}/config?club_id=${getClubId()}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prendas_uniforme: nuevoCatalogo }),
      });
      const data = await res.json();
      if (data.success) {
        setCatalogo(nuevoCatalogo);
        setCatalogoMsg('Catálogo guardado ✓');
        setTimeout(() => setCatalogoMsg(''), 2500);
      } else {
        setCatalogoMsg(`Error: ${data.error || data.message || 'no se pudo guardar'}`);
        setTimeout(() => setCatalogoMsg(''), 4000);
      }
    } catch (err) {
      setCatalogoMsg(`Error de conexión: ${err.message}`);
      setTimeout(() => setCatalogoMsg(''), 4000);
    } finally {
      setGuardandoCatalogo(false);
    }
  };

  const MAX_PRENDAS = 15;

  const agregarPrenda = () => {
    const nombre           = nuevaPrenda.nombre.trim();
    const precio           = Number(String(nuevaPrenda.precio).replace(/\D/g, ''))           || 0;
    const precio_proveedor = Number(String(nuevaPrenda.precio_proveedor).replace(/\D/g, '')) || 0;
    if (!nombre) return;
    if (catalogo.length >= MAX_PRENDAS) {
      setCatalogoMsg(`Límite de ${MAX_PRENDAS} prendas alcanzado`);
      setTimeout(() => setCatalogoMsg(''), 2500);
      return;
    }
    if (guardandoCatalogo) return;
    const nuevo = [...catalogo, { nombre, precio, precio_proveedor }];
    setNuevaPrenda({ nombre: '', precio: '', precio_proveedor: '' });
    saveCatalogo(nuevo);
  };

  const eliminarPrenda = (idx) => {
    saveCatalogo(catalogo.filter((_, i) => i !== idx));
  };

  const iniciarEditarPrenda = (idx) => {
    setEditandoIdx(idx);
    setEditandoPrenda({ nombre: catalogo[idx].nombre, precio: String(catalogo[idx].precio), precio_proveedor: String(catalogo[idx].precio_proveedor || '') });
  };

  const guardarEditPrenda = () => {
    const nombre           = editandoPrenda.nombre.trim();
    const precio           = Number(String(editandoPrenda.precio).replace(/\D/g, ''))           || 0;
    const precio_proveedor = Number(String(editandoPrenda.precio_proveedor).replace(/\D/g, '')) || 0;
    if (!nombre) return;
    const nuevo = catalogo.map((p, i) => i === editandoIdx ? { nombre, precio, precio_proveedor } : p);
    setEditandoIdx(null);
    saveCatalogo(nuevo);
  };

  // — Pedido form logic —
  const handleBusquedaChange = (e) => {
    const val = e.target.value;
    setBusqueda(val);
    if (val.trim().length < 2) { setSugerencias([]); setMostrarSugerencias(false); return; }
    const lower = val.toLowerCase();
    const filtered = jugadores.filter(j => {
      const nombreCompleto = `${j.nombre || ''} ${j.apellidos || ''}`.toLowerCase();
      return nombreCompleto.includes(lower) || String(j.cedula || '').toLowerCase().includes(lower);
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
    setBusqueda(''); setSugerencias([]); setMostrarSugerencias(false);
    setJugadorEncontrado(null); setStep(1);
    setForm({ cedula: '', nombre: '', prendas: [], nombre_estampar: '', talla: '', numero: '', es_familiar: false, genero: 'Hombre' });
    setError('');
  };

  const togglePrenda = (prenda) => {
    setForm(f => {
      const existe = f.prendas.find(p => p.nombre === prenda.nombre);
      return {
        ...f,
        prendas: existe
          ? f.prendas.filter(p => p.nombre !== prenda.nombre)
          : [...f.prendas, prenda],
      };
    });
  };

  const total = form.prendas.reduce((sum, p) => sum + p.precio, 0);
  const formatNumero = (val) => val.replace(/\D/g, '').slice(0, 3);
  const numeroValido = !!form.numero;

  const handleSubmit = async () => {
    setError('');
    const faltantes = [];
    if (form.prendas.length === 0) faltantes.push('prenda');
    if (!form.talla) faltantes.push('talla');
    if (!form.numero) faltantes.push('número');
    if (faltantes.length > 0) { setError(`Faltá completar: ${faltantes.join(', ')}.`); return; }
    const clubId = getClubId();
    setEnviando(true);
    try {
      const res = await authFetch(`${API_BASE}/uniforms?club_id=${clubId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          tipo: form.es_familiar ? `Familiar - ${form.genero}` : 'Jugador',
          prendas: form.prendas.map(p => p.nombre).join(', '),
          total,
          numero: form.numero.padStart(3, '0'),
          club_id: clubId,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setExito(true);
        await cargarDatos();
        setTimeout(() => { setExito(false); limpiarBusqueda(); }, 3000);
      } else {
        setError(data.error || data.message || 'Error al registrar el pedido.');
      }
    } catch { setError('Error de conexión. Intentá de nuevo.'); }
    finally { setEnviando(false); }
  };

  // — PDF —
  const generarPDF = async () => {
    setGenerandoPDF(true);
    try {
      const doc      = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
      const W        = doc.internal.pageSize.getWidth();
      const H        = doc.internal.pageSize.getHeight();
      const M        = 12;
      const accentRgb = hexToRgb(color);
      const fecha    = new Date().toLocaleDateString('es-CO', { day: '2-digit', month: 'long', year: 'numeric' });
      const trunc    = (s, max) => (s.length > max ? s.slice(0, max - 2) + '..' : s);
      const fmtCOP   = (n) => `$${parseFloat(n || 0).toLocaleString('es-CO')}`;
      const logoData = await loadLogoDataUrl(clubConfig?.logo_url);

      const pendientes = pedidos.filter(p => p.estado === 'PENDIENTE');
      const pagados    = pedidos.filter(p => p.estado === 'PAGADO');
      const entregados = pedidos.filter(p => p.estado === 'ENTREGADO');
      const getPrendas = (p) => String(p.prendas || p.prenda || p.tipo_uniforme || p.tipo || '—');

      const C = {
        cedula: M, nombre: M + 22, prendas: M + 72,
        talla: M + 154, numero: M + 168, estampa: M + 186, total: M + 216,
      };

      const cols = [
        { label: 'Cédula',   x: C.cedula },
        { label: 'Nombre',   x: C.nombre },
        { label: 'Prendas',  x: C.prendas },
        { label: 'Talla',    x: C.talla },
        { label: 'Núm.',     x: C.numero },
        { label: 'Estampa',  x: C.estampa },
        { label: 'Total',    x: C.total },
      ];

      const drawPageHeader = () =>
        drawPdfHeader(doc, { W, M, clubName: clubNombre, title: 'Pedido de Uniformes', date: fecha, logoData, accentRgb });

      const drawSectionHead = (lista, titulo, y) => {
        const sectionColors = {
          PENDIENTES: [180, 100, 0],
          PAGADOS:    [22, 163, 74],
          ENTREGADOS: [37, 99, 235],
        };
        return drawPdfSectionLabel(doc, { W, M, y, label: titulo, count: lista.length, accentRgb: sectionColors[titulo] || accentRgb });
      };

      const drawTableHead = (y) => drawPdfTableHead(doc, { W, M, y, columns: cols, accentRgb });

      const drawRow = (p, y, odd) => {
        const rH = 8.5;
        if (odd) { doc.setFillColor(248, 249, 250); doc.rect(M, y, W - M * 2, rH, 'F'); }
        doc.setFont('helvetica', 'normal'); doc.setFontSize(7.8); doc.setTextColor(30, 40, 50);
        const mid = y + 5.8;
        doc.text(trunc(String(p.cedula || ''), 14), C.cedula, mid);
        const esFamiliar = p.tipo && p.tipo !== 'Jugador';
        const nombrePDF  = trunc(String(p.nombre || '—'), esFamiliar ? 19 : 26);
        doc.text(nombrePDF, C.nombre, mid);
        if (esFamiliar) {
          doc.setTextColor(147, 51, 234); doc.setFontSize(6.5);
          doc.text(trunc(p.tipo, 14), C.nombre + doc.getTextWidth(nombrePDF) + 1.5, mid);
          doc.setFontSize(7.8); doc.setTextColor(30, 40, 50);
        }
        doc.text(trunc(getPrendas(p), 44), C.prendas, mid);
        doc.text(String(p.talla || '—'), C.talla, mid);
        doc.text(String(p.numero_estampar || '—'), C.numero, mid);
        doc.text(trunc(String(p.nombre_estampar || '—'), 16), C.estampa, mid);
        doc.setTextColor(...accentRgb); doc.setFont('helvetica', 'bold');
        doc.text(fmtCOP(p.total), C.total, mid);
        return y + rH;
      };

      const drawSubtotal = (lista, y) => {
        const tot = lista.reduce((s, p) => s + parseFloat(p.total || 0), 0);
        doc.setFillColor(245, 246, 248); doc.rect(M, y, W - M * 2, 7, 'F');
        doc.setFont('helvetica', 'bold'); doc.setFontSize(8); doc.setTextColor(...accentRgb);
        doc.text(`Subtotal: ${fmtCOP(tot)}`, C.total, y + 5, { align: 'left' });
        return y + 10;
      };

      const drawBlock = (lista, titulo, yStart) => {
        if (!lista.length) return yStart;
        let y = yStart;
        if (y > H - 60) { doc.addPage(); y = drawPageHeader(); }
        y = drawSectionHead(lista, titulo, y);
        y = drawTableHead(y);
        lista.forEach((p, i) => {
          if (y > H - 20) { doc.addPage(); y = drawPageHeader(); y = drawTableHead(y); }
          y = drawRow(p, y, i % 2 === 0);
        });
        y = drawSubtotal(lista, y);
        return y + 4;
      };

      let y = drawPageHeader();
      y = drawBlock(pendientes,  'PENDIENTES',  y);
      y = drawBlock(pagados,     'PAGADOS',     y);
      y = drawBlock(entregados,  'ENTREGADOS',  y);

      const pages = doc.internal.getNumberOfPages();
      for (let i = 1; i <= pages; i++) {
        doc.setPage(i);
        drawPdfFooter(doc, { W, H, M, clubName: clubNombre, pageNum: i, totalPages: pages, note: `${pedidos.length} pedidos` });
      }

      doc.save(`${clubNombre.toLowerCase().replace(/\s+/g, '-')}-uniformes-${new Date().toISOString().slice(0, 10)}.pdf`);
    } finally {
      setGenerandoPDF(false);
    }
  };

  // — Pedidos edit —
  const handleCambiarEstado = async (pedido, nuevoEstado) => {
    const pedidoId = pedido.id ?? pedido._id ?? pedido.rowId ?? pedido.row_id;
    if (!pedidoId) return;
    const clubId = getClubId();
    setCambiandoEstado(pedidoId);
    try {
      const res = await authFetch(`${API_BASE}/uniforms/${pedidoId}?club_id=${clubId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ estado: nuevoEstado }),
      });
      const data = await res.json();
      if (res.ok || data.success) await cargarDatos();
    } catch (e) { console.error('[Uniformes] Error cambiando estado:', e); }
    finally { setCambiandoEstado(null); }
  };

  const handleEliminar = async (pedido) => {
    const pid = pedido.id ?? pedido._id;
    if (!pid) return;
    if (!window.confirm(`¿Eliminar pedido de ${pedido.nombre}? Esta acción no se puede deshacer.`)) return;
    const clubId = getClubId();
    try {
      const res = await authFetch(`${API_BASE}/uniforms/${pid}?club_id=${clubId}`, { method: 'DELETE' });
      const data = await res.json();
      if (res.ok || data.success) await cargarDatos();
    } catch (e) { console.error('[Uniformes] Error eliminando pedido:', e); }
  };

  const abrirEditar = (pedido) => {
    const prendasStr = pedido.prendas || pedido.prenda || '';
    const prendasArray = prendasStr
      ? prendasStr.split(',').map(s => s.trim()).reduce((acc, nombre) => {
          const encontrada = catalogo.find(p => p.nombre === nombre);
          if (encontrada) acc.push(encontrada);
          else if (nombre) acc.push({ nombre, precio: 0 });
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

  const cerrarEditar = () => { setPedidoEditando(null); setEditError(''); };

  const toggleEditPrenda = (prenda) => {
    setEditForm(f => {
      const existe = f.prendas.find(p => p.nombre === prenda.nombre);
      return {
        ...f,
        prendas: existe
          ? f.prendas.filter(p => p.nombre !== prenda.nombre)
          : [...f.prendas, prenda],
      };
    });
  };

  const handleGuardarEdit = async () => {
    setEditError('');
    if (editForm.prendas.length === 0) { setEditError('Seleccioná al menos una prenda.'); return; }
    if (!editForm.talla)               { setEditError('Seleccioná una talla.'); return; }
    if (!editForm.numero)              { setEditError('Ingresá el número de camiseta.'); return; }
    const totalEdit = editForm.prendas.reduce((s, p) => s + p.precio, 0);
    const pedidoId = pedidoEditando.id ?? pedidoEditando._id ?? pedidoEditando.rowId ?? pedidoEditando.row_id;
    if (!pedidoId) { setEditError('No se encontró el ID del pedido.'); return; }
    setGuardandoEdit(true);
    try {
      const res = await authFetch(`${API_BASE}/uniforms/${pedidoId}?club_id=${getClubId()}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prendas: editForm.prendas.map(p => p.nombre).join(', '),
          talla: editForm.talla,
          numero: editForm.numero.padStart(3, '0'),
          nombre_estampar: editForm.nombre_estampar,
          total: totalEdit,
        }),
      });
      let data = {};
      try { data = await res.json(); } catch (_) {}
      if (res.ok || data.success) { await cargarDatos(); cerrarEditar(); }
      else { setEditError(data.error || data.message || `Error ${res.status}`); }
    } catch (e) { setEditError(`Error: ${e.message}`); }
    finally { setGuardandoEdit(false); }
  };

  const formatFecha = (iso) => {
    if (!iso) return '—';
    try { return new Date(iso).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' }); }
    catch { return '—'; }
  };

  // — Shared styles —
  const tabBtn = (key) => `flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium border transition-all ${
    tabPrincipal === key
      ? 'bg-[var(--cc12)] border-[var(--cc)]/40 text-[var(--cc)]'
      : 'border-[var(--cc20)] text-[var(--text-sec)] hover:text-[var(--text-pri)]'
  }`;

  // — Render —
  return (
    <div className="space-y-5">

      {/* ── Tabs principales ── */}
      <div className="flex items-center gap-2 flex-wrap">
        <button className={tabBtn('pedido')} onClick={() => setTabPrincipal('pedido')}>
          <Shirt className="w-4 h-4" /> Nuevo Pedido
        </button>
        <button className={tabBtn('pedidos')} onClick={() => setTabPrincipal('pedidos')}>
          <CheckCircle className="w-4 h-4" />
          Pedidos
          {pedidos.length > 0 && (
            <span className="px-1.5 py-0.5 rounded-md text-[10px] font-bold bg-[var(--bg-surface)]">{pedidos.length}</span>
          )}
        </button>
        <button className={tabBtn('catalogo')} onClick={() => setTabPrincipal('catalogo')}>
          <Package className="w-4 h-4" />
          Catálogo
          {catalogo.length > 0 && (
            <span className="px-1.5 py-0.5 rounded-md text-[10px] font-bold bg-[var(--bg-surface)]">{catalogo.length}</span>
          )}
        </button>
      </div>

      {/* ══════════════════════════════════════════════
          TAB: NUEVO PEDIDO
      ══════════════════════════════════════════════ */}
      {tabPrincipal === 'pedido' && (
        <div className="max-w-xl mx-auto">
          <div className="bg-[var(--bg-card)] rounded-2xl border border-[var(--cc20)] p-6">

            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-[var(--cc12)] flex items-center justify-center">
                <Shirt className="w-5 h-5 text-[var(--cc)]" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-[var(--text-pri)]">Pedido de Uniforme</h2>
                <p className="text-xs text-[var(--text-sec)]">
                  {step === 1 ? 'Paso 1 — Buscá el jugador por nombre o cédula' : 'Paso 2 — Datos del uniforme'}
                </p>
              </div>
            </div>

            {exito && (
              <div className="flex items-center gap-3 p-4 rounded-xl bg-[var(--cc12)] border border-[var(--cc)]/30 mb-6">
                <CheckCircle className="w-5 h-5 text-[var(--cc)]" />
                <p className="text-sm text-[var(--cc)] font-medium">¡Pedido registrado exitosamente!</p>
              </div>
            )}
            {error && (
              <div className="flex items-center gap-3 p-4 rounded-xl bg-[rgba(255,94,94,0.12)] border border-[#FF5E5E]/30 mb-6">
                <AlertCircle className="w-5 h-5 text-[#FF5E5E]" />
                <p className="text-sm text-[#FF5E5E]">{error}</p>
              </div>
            )}

            {catalogo.length === 0 && (
              <div className="flex items-center gap-3 p-4 rounded-xl bg-[rgba(245,166,35,0.1)] border border-[#F5A623]/30 mb-6">
                <AlertCircle className="w-5 h-5 text-[#F5A623]" />
                <p className="text-sm text-[#F5A623]">
                  No hay prendas en el catálogo.{' '}
                  <button className="underline font-medium" onClick={() => setTabPrincipal('catalogo')}>
                    Agregalas primero
                  </button>
                </p>
              </div>
            )}

            {/* Paso 1: Buscador */}
            {step === 1 && (
              <div className="space-y-4">
                <div ref={searchRef} className="relative">
                  <label className="block text-xs text-[var(--text-sec)] mb-1.5">Buscar jugador *</label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-sec)]" />
                    <input
                      type="text"
                      value={busqueda}
                      onChange={handleBusquedaChange}
                      onFocus={() => busqueda.trim().length >= 2 && setMostrarSugerencias(true)}
                      placeholder="Nombre, apellido o cédula..."
                      className="w-full bg-[var(--bg-app)] border border-[var(--cc20)] rounded-xl pl-10 pr-10 py-2.5 text-sm text-[var(--text-pri)] placeholder-[var(--text-mut)] focus:outline-none focus:border-[var(--cc)] transition-colors"
                    />
                    {busqueda && (
                      <button onClick={limpiarBusqueda} className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-sec)] hover:text-[var(--text-pri)] transition-colors">
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                  {mostrarSugerencias && sugerencias.length > 0 && (
                    <div className="absolute z-20 w-full mt-1 bg-[var(--bg-surface)] border border-[var(--cc20)] rounded-xl shadow-xl overflow-hidden">
                      {sugerencias.map((j) => (
                        <button
                          key={j.cedula}
                          onClick={() => seleccionarJugador(j)}
                          className="w-full flex items-center gap-3 px-4 py-3 hover:bg-[var(--bg-surface)] transition-colors text-left border-b border-[var(--cc20)] last:border-0"
                        >
                          <div className="w-8 h-8 rounded-full bg-[var(--cc12)] flex items-center justify-center flex-shrink-0">
                            <span className="text-xs font-bold text-[var(--cc)]">{(j.nombre || '?')[0].toUpperCase()}</span>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-[var(--text-pri)]">{j.nombre} {j.apellidos}</p>
                            <p className="text-xs text-[var(--text-sec)]">CC {j.cedula}</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                  {mostrarSugerencias && sugerencias.length === 0 && busqueda.trim().length >= 2 && (
                    <div className="absolute z-20 w-full mt-1 bg-[var(--bg-surface)] border border-[var(--cc20)] rounded-xl px-4 py-3">
                      <p className="text-sm text-[var(--text-sec)]">No se encontró ningún jugador</p>
                    </div>
                  )}
                </div>
                <p className="text-xs text-[var(--text-sec)]">Escribe al menos 2 caracteres para ver sugerencias</p>
              </div>
            )}

            {/* Paso 2: Datos del uniforme */}
            {step === 2 && jugadorEncontrado && (
              <div className="space-y-4">

                {/* Jugador seleccionado */}
                <div className="p-3 rounded-xl bg-[var(--cc12)] border border-[var(--cc)]/20 flex items-center gap-3">
                  <CheckCircle className="w-4 h-4 text-[var(--cc)] flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-[var(--text-pri)]">{jugadorEncontrado.nombre} {jugadorEncontrado.apellidos}</p>
                    <p className="text-xs text-[var(--text-sec)]">CC {jugadorEncontrado.cedula}</p>
                  </div>
                  <button onClick={limpiarBusqueda} className="ml-auto text-xs text-[var(--text-sec)] hover:text-[var(--text-pri)] transition-colors">
                    Cambiar
                  </button>
                </div>

                {/* Toggle familiar */}
                <div className={`rounded-xl border transition-all ${form.es_familiar ? 'bg-[rgba(198,120,255,0.1)] border-[#C678FF]/30' : 'bg-[var(--bg-app)] border-[var(--cc20)]'}`}>
                  <button type="button" onClick={() => setForm(f => ({ ...f, es_familiar: !f.es_familiar }))}
                    className="w-full flex items-center justify-between px-4 py-3 text-left"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-base">👨‍👩‍👦</span>
                      <div>
                        <p className={`text-sm font-medium ${form.es_familiar ? 'text-[#C678FF]' : 'text-[var(--text-sec)]'}`}>Pedido para familiar</p>
                        <p className="text-xs text-[var(--text-sec)]">{form.es_familiar ? 'Uniforme para un familiar del jugador' : 'Activar si el uniforme es para un familiar'}</p>
                      </div>
                    </div>
                    <div className={`w-10 rounded-full flex items-center transition-all px-0.5 ${form.es_familiar ? 'bg-[#C678FF]' : 'bg-[#1A3A5C]'}`} style={{ height: '22px' }}>
                      <div className={`w-4 h-4 rounded-full bg-white transition-transform ${form.es_familiar ? 'translate-x-5' : 'translate-x-0'}`} />
                    </div>
                  </button>
                  {form.es_familiar && (
                    <div className="px-4 pb-4 pt-1 border-t border-[#C678FF]/20">
                      <p className="text-xs text-[var(--text-sec)] mb-2">Género del familiar *</p>
                      <div className="flex gap-3">
                        {['Hombre', 'Mujer'].map(g => (
                          <button key={g} type="button" onClick={() => setForm(f => ({ ...f, genero: g }))}
                            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium border transition-colors ${
                              form.genero === g
                                ? 'bg-[rgba(198,120,255,0.15)] border-[#C678FF]/50 text-[#C678FF]'
                                : 'bg-[var(--bg-app)] border-[var(--cc20)] text-[var(--text-sec)] hover:text-[var(--text-pri)]'
                            }`}
                          >
                            <span>{g === 'Hombre' ? '👨' : '👩'}</span>{g}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Prendas del catálogo */}
                <div>
                  <label className="block text-xs text-[var(--text-sec)] mb-1.5">Prendas * <span className="font-normal">(podés seleccionar varias)</span></label>
                  {catalogo.length === 0 ? (
                    <p className="text-sm text-[var(--text-mut)] text-center py-4">
                      Sin prendas. <button className="underline text-[var(--cc)]" onClick={() => setTabPrincipal('catalogo')}>Configurar catálogo</button>
                    </p>
                  ) : (
                    <div className="grid grid-cols-1 gap-2">
                      {catalogo.map(p => {
                        const seleccionada = form.prendas.find(x => x.nombre === p.nombre);
                        return (
                          <button
                            key={p.nombre}
                            onClick={() => togglePrenda(p)}
                            className={`flex items-center justify-between px-4 py-2.5 rounded-xl text-sm font-medium border transition-colors ${
                              seleccionada
                                ? 'bg-[var(--cc12)] border-[var(--cc)]/50 text-[var(--cc)]'
                                : 'bg-[var(--bg-app)] border-[var(--cc20)] text-[var(--text-sec)] hover:text-[var(--text-pri)]'
                            }`}
                          >
                            <span>{p.nombre}</span>
                            <span className="font-mono text-xs">${p.precio.toLocaleString('es-CO')}</span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                  {form.prendas.length > 0 && (
                    <div className="mt-3 flex items-center justify-between px-4 py-2.5 rounded-xl bg-[var(--bg-app)] border border-[var(--cc)]/30">
                      <span className="text-xs text-[var(--text-sec)]">{form.prendas.length} prenda{form.prendas.length > 1 ? 's' : ''} seleccionada{form.prendas.length > 1 ? 's' : ''}</span>
                      <span className="text-sm font-bold text-[var(--cc)]">Total: ${total.toLocaleString('es-CO')}</span>
                    </div>
                  )}
                </div>

                {/* Nombre a estampar */}
                <div>
                  <label className="block text-xs text-[var(--text-sec)] mb-1.5">
                    Nombre a estampar <span className="ml-1 font-normal italic">— puede ser apodo o sobrenombre</span>
                  </label>
                  <input
                    type="text"
                    value={form.nombre_estampar}
                    onChange={e => setForm(f => ({ ...f, nombre_estampar: e.target.value.toUpperCase() }))}
                    placeholder="Ej: CAÑÓN, TOÑO, EL DIEZ..."
                    className="w-full bg-[var(--bg-app)] border border-[var(--cc20)] rounded-xl px-4 py-2.5 text-sm text-[var(--text-pri)] placeholder-[var(--text-mut)] focus:outline-none focus:border-[var(--cc)] transition-colors"
                  />
                </div>

                {/* Talla y Número */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-[var(--text-sec)] mb-1.5">Talla *</label>
                    <div className="grid grid-cols-2 gap-2">
                      {['S', 'M', 'L', 'XL'].map(t => (
                        <button key={t} onClick={() => setForm(f => ({ ...f, talla: t }))}
                          className={`py-2 rounded-xl text-sm font-medium border transition-colors ${
                            form.talla === t
                              ? 'bg-[var(--cc12)] border-[var(--cc)]/50 text-[var(--cc)]'
                              : 'bg-[var(--bg-app)] border-[var(--cc20)] text-[var(--text-sec)] hover:text-[var(--text-pri)]'
                          }`}
                        >{t}</button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs text-[var(--text-sec)] mb-1.5">Número * <span className="font-normal">(3 dígitos)</span></label>
                    <input
                      type="text" inputMode="numeric" value={form.numero}
                      onChange={e => setForm(f => ({ ...f, numero: formatNumero(e.target.value) }))}
                      placeholder="001" maxLength={3}
                      className="w-full bg-[var(--bg-app)] border border-[var(--cc20)] rounded-xl px-4 py-2.5 text-sm font-mono text-[var(--text-pri)] placeholder-[var(--text-mut)] focus:outline-none focus:border-[var(--cc)] transition-colors"
                    />
                    {form.numero && (
                      <p className="text-xs mt-1 font-mono text-[var(--cc)]">
                        #{form.numero.padStart(3, '0')}
                      </p>
                    )}
                  </div>
                </div>

                <button
                  onClick={handleSubmit}
                  disabled={form.prendas.length === 0 || !form.talla || !form.numero || enviando || !numeroValido}
                  className="w-full py-3 rounded-xl bg-[var(--cc)] text-white text-sm font-bold hover:bg-[var(--cc)]/80 transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {enviando ? <><Loader className="w-4 h-4 animate-spin" /> Registrando...</> : 'Registrar pedido'}
                </button>
                <p className="text-xs text-[var(--text-sec)] text-center">* Campos obligatorios</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════
          TAB: PEDIDOS
      ══════════════════════════════════════════════ */}
      {tabPrincipal === 'pedidos' && (() => {
        const pendientes  = pedidos.filter(p => p.estado === 'PENDIENTE');
        const pagados     = pedidos.filter(p => p.estado === 'PAGADO');
        const entregados  = pedidos.filter(p => p.estado === 'ENTREGADO');
        const vistaActual = tabPedidos === 'PENDIENTE' ? pendientes : tabPedidos === 'PAGADO' ? pagados : entregados;
        const TAB_CFG = [
          { key: 'PENDIENTE', label: 'Pendientes', count: pendientes.length, activeClass: 'bg-[rgba(245,166,35,0.12)] text-[#F5A623] border-[#F5A623]/30' },
          { key: 'PAGADO',    label: 'Pagados',    count: pagados.length,    activeClass: 'bg-[rgba(34,197,94,0.12)] text-green-400 border-green-400/30' },
          { key: 'ENTREGADO', label: 'Entregados', count: entregados.length, activeClass: 'bg-[var(--cc12)] text-[var(--cc)] border-[var(--cc)]/30' },
        ];

        // Resumen por jugador agrupado por cédula y tipo
        const resumenMap = {};
        pedidos.forEach(p => {
          const key = p.cedula;
          if (!resumenMap[key]) resumenMap[key] = { nombre: p.nombre, cedula: p.cedula, tipos: {}, total: 0 };
          const tipo = p.tipo || 'Jugador';
          resumenMap[key].tipos[tipo] = (resumenMap[key].tipos[tipo] || 0) + Number(p.total || 0);
          resumenMap[key].total += Number(p.total || 0);
        });
        const resumenLista = Object.values(resumenMap).sort((a, b) => b.total - a.total);
        const TIPO_STYLE = {
          'Jugador':           { label: 'Jugador',    color: 'text-[var(--cc)]',  bg: 'bg-[var(--cc12)]' },
          'Familiar - Hombre': { label: 'Familiar ♂', color: 'text-blue-400',     bg: 'bg-blue-400/10'   },
          'Familiar - Mujer':  { label: 'Familiar ♀', color: 'text-pink-400',     bg: 'bg-pink-400/10'   },
        };

        return (
          <div className="bg-[var(--bg-card)] rounded-2xl border border-[var(--cc20)] p-6">
            <div className="flex items-center gap-2 mb-5 flex-wrap">
              {TAB_CFG.map(t => (
                <button key={t.key} onClick={() => setTabPedidos(t.key)}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-medium border transition-all ${
                    tabPedidos === t.key ? t.activeClass : 'border-[var(--cc20)] text-[var(--text-sec)] hover:text-[var(--text-pri)]'
                  }`}
                >
                  {t.label}
                  <span className={`px-1.5 py-0.5 rounded-md text-[10px] font-bold ${tabPedidos === t.key ? 'bg-white/10' : 'bg-[var(--bg-surface)]'}`}>{t.count}</span>
                </button>
              ))}
              <div className="ml-auto flex items-center gap-3">
                <span className="text-xs text-[var(--text-sec)]">{pedidos.length} total</span>
                <button onClick={generarPDF} disabled={generandoPDF || pedidos.length === 0}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[var(--cc12)] border border-[var(--cc)]/30 text-[var(--cc)] text-xs font-medium hover:bg-[var(--cc20)] transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {generandoPDF ? <><Loader className="w-3.5 h-3.5 animate-spin" />Generando...</> : <><Download className="w-3.5 h-3.5" />Descargar PDF</>}
                </button>
              </div>
            </div>

            {/* Resumen por jugador */}
            {resumenLista.length > 0 && (
              <details className="mb-5 group">
                <summary className="cursor-pointer flex items-center gap-2 text-xs text-[var(--text-sec)] hover:text-[var(--text-pri)] transition-colors select-none list-none mb-0">
                  <span className="w-4 h-4 flex items-center justify-center rounded border border-[var(--cc20)] text-[10px] group-open:rotate-90 transition-transform">▶</span>
                  <span className="font-medium">Resumen por jugador</span>
                  <span className="text-[10px] text-[var(--text-mut)]">({resumenLista.length} jugador{resumenLista.length !== 1 ? 'es' : ''})</span>
                  <span className="ml-auto text-[var(--cc)] font-semibold">
                    Total: ${pedidos.reduce((s, p) => s + Number(p.total || 0), 0).toLocaleString('es-CO')}
                  </span>
                </summary>
                <div className="mt-3 space-y-2">
                  {resumenLista.map(j => (
                    <div key={j.cedula} className="bg-[var(--bg-surface)] rounded-xl px-4 py-3 border border-[var(--cc20)]">
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <span className="text-sm font-semibold text-[var(--text-pri)]">{j.nombre}</span>
                          <span className="text-xs text-[var(--text-sec)] ml-2">CC {j.cedula}</span>
                        </div>
                        <span className="text-sm font-bold text-[var(--cc)]">${j.total.toLocaleString('es-CO')}</span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {Object.entries(j.tipos).map(([tipo, valor]) => {
                          const s = TIPO_STYLE[tipo] || { label: tipo, color: 'text-gray-400', bg: 'bg-gray-400/10' };
                          return (
                            <span key={tipo} className={`px-2.5 py-1 rounded-lg text-xs font-medium border border-white/5 ${s.bg} ${s.color}`}>
                              {s.label}: <span className="font-bold">${valor.toLocaleString('es-CO')}</span>
                            </span>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </details>
            )}

            {pedidos.length === 0 ? (
              <p className="text-center text-sm text-[var(--text-sec)] py-8">Aún no hay pedidos registrados</p>
            ) : vistaActual.length === 0 ? (
              <p className="text-center text-sm text-[var(--text-sec)] py-8">No hay pedidos en este estado</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-[var(--cc20)]">
                      {['Cédula','Nombre','Prendas','Estampar','Talla','Número','Total','Fecha','Estado',''].map(h => (
                        <th key={h} className="text-left py-2 px-3 text-xs text-[var(--text-sec)] font-medium">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {vistaActual.map((p, i) => {
                      const pid = p.id ?? p._id;
                      const cargando = cambiandoEstado === pid;
                      return (
                        <tr key={i} className="border-b border-[var(--cc20)] hover:bg-[var(--bg-surface)] transition-colors">
                          <td className="py-2 px-3 text-[var(--text-sec)]">{p.cedula}</td>
                          <td className="py-2 px-3 text-[var(--text-pri)]">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              {p.nombre}
                              {p.tipo && p.tipo !== 'Jugador' && (
                                <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-[rgba(198,120,255,0.12)] text-[#C678FF] border border-[#C678FF]/20 whitespace-nowrap">{p.tipo}</span>
                              )}
                            </div>
                          </td>
                          <td className="py-2 px-3 text-[var(--text-pri)] max-w-[180px]">
                            <span className="block truncate" title={p.prendas || p.prenda}>{p.prendas || p.prenda || '—'}</span>
                          </td>
                          <td className="py-2 px-3 text-[var(--text-pri)]">{p.nombre_estampar || '—'}</td>
                          <td className="py-2 px-3 text-[var(--text-pri)]">{p.talla}</td>
                          <td className="py-2 px-3 text-[var(--text-pri)] font-mono font-bold">{p.numero_estampar}</td>
                          <td className="py-2 px-3 text-[var(--cc)] font-semibold">
                            {p.total ? `$${Number(p.total).toLocaleString('es-CO')}` : '—'}
                          </td>
                          <td className="py-2 px-3 text-[var(--text-sec)] text-xs">{formatFecha(p.created_at)}</td>
                          <td className="py-2 px-3">
                            {p.estado === 'PENDIENTE' && (
                              <button onClick={() => handleCambiarEstado(p, 'PAGADO')} disabled={cargando}
                                className="px-2 py-1 rounded-lg text-xs bg-[rgba(245,166,35,0.12)] text-[#F5A623] border border-[#F5A623]/20 hover:bg-[rgba(34,197,94,0.12)] hover:text-green-400 hover:border-green-400/20 transition-all disabled:opacity-50 cursor-pointer"
                              >{cargando ? '...' : 'PENDIENTE'}</button>
                            )}
                            {p.estado === 'PAGADO' && (
                              <span className="px-2 py-1 rounded-lg text-xs bg-[rgba(34,197,94,0.12)] text-green-400 border border-green-400/20">PAGADO</span>
                            )}
                            {p.estado === 'ENTREGADO' && (
                              <span className="px-2 py-1 rounded-lg text-xs bg-[var(--cc12)] text-[var(--cc)] border border-[var(--cc)]/20">ENTREGADO</span>
                            )}
                          </td>
                          <td className="py-2 px-3">
                            <div className="flex items-center gap-1.5">
                              {p.estado === 'PAGADO' && (
                                <button onClick={() => handleCambiarEstado(p, 'ENTREGADO')} disabled={cargando}
                                  className="flex items-center gap-1 px-2 py-1.5 rounded-lg border border-[var(--cc)]/30 text-[var(--cc)] hover:bg-[var(--cc12)] transition-all text-xs disabled:opacity-50"
                                >
                                  {cargando ? <Loader className="w-3 h-3 animate-spin" /> : <CheckCircle className="w-3.5 h-3.5" />} Entregar
                                </button>
                              )}
                              {p.estado !== 'ENTREGADO' && (
                                <button onClick={() => abrirEditar(p)}
                                  className="flex items-center gap-1 px-2 py-1.5 rounded-lg border border-[var(--cc20)] text-[var(--text-sec)] hover:text-[var(--cc)] hover:border-[var(--cc)]/40 transition-all text-xs"
                                >
                                  <Pencil className="w-3.5 h-3.5" /> Editar
                                </button>
                              )}
                              <button onClick={() => handleEliminar(p)} disabled={cargando}
                                className="flex items-center gap-1 px-2 py-1.5 rounded-lg border border-red-500/20 text-red-400 hover:bg-red-500/10 hover:border-red-500/40 transition-all text-xs disabled:opacity-50"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
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

      {/* ══════════════════════════════════════════════
          TAB: CATÁLOGO
      ══════════════════════════════════════════════ */}
      {tabPrincipal === 'catalogo' && (
        <div className="max-w-xl mx-auto space-y-4">

          {/* Header catálogo */}
          <div className="bg-[var(--bg-card)] rounded-2xl border border-[var(--cc20)] p-6">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-xl bg-[var(--cc12)] flex items-center justify-center">
                <Package className="w-5 h-5 text-[var(--cc)]" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-[var(--text-pri)]">Catálogo de prendas</h2>
                <p className="text-xs text-[var(--text-sec)]">Agrega, edita o elimina los productos disponibles para pedidos</p>
              </div>
            </div>

            {/* Feedback */}
            {catalogoMsg && (
              <div className={`flex items-center gap-2 p-3 rounded-xl mb-4 text-sm font-medium ${
                catalogoMsg.includes('Error')
                  ? 'bg-[rgba(255,94,94,0.12)] border border-[#FF5E5E]/30 text-[#FF5E5E]'
                  : 'bg-[var(--cc12)] border border-[var(--cc)]/30 text-[var(--cc)]'
              }`}>
                {catalogoMsg}
              </div>
            )}

            {/* Formulario agregar */}
            <div className="flex gap-2 mb-4 flex-wrap">
              <input
                type="text"
                value={nuevaPrenda.nombre}
                onChange={e => setNuevaPrenda(f => ({ ...f, nombre: e.target.value }))}
                onKeyDown={e => e.key === 'Enter' && agregarPrenda()}
                placeholder="Nombre de la prenda"
                className="flex-1 min-w-[160px] bg-[var(--bg-app)] border border-[var(--cc20)] rounded-xl px-4 py-2.5 text-sm text-[var(--text-pri)] placeholder-[var(--text-mut)] focus:outline-none focus:border-[var(--cc)] transition-colors"
              />
              <input
                type="text"
                inputMode="numeric"
                value={nuevaPrenda.precio_proveedor}
                onChange={e => setNuevaPrenda(f => ({ ...f, precio_proveedor: e.target.value.replace(/\D/g, '') }))}
                onKeyDown={e => e.key === 'Enter' && agregarPrenda()}
                placeholder="P. proveedor"
                className="w-32 bg-[var(--bg-app)] border border-[var(--cc20)] rounded-xl px-4 py-2.5 text-sm text-[var(--text-pri)] placeholder-[var(--text-mut)] focus:outline-none focus:border-[var(--cc)] transition-colors"
              />
              <input
                type="text"
                inputMode="numeric"
                value={nuevaPrenda.precio}
                onChange={e => setNuevaPrenda(f => ({ ...f, precio: e.target.value.replace(/\D/g, '') }))}
                onKeyDown={e => e.key === 'Enter' && agregarPrenda()}
                placeholder="P. público"
                className="w-32 bg-[var(--bg-app)] border border-[var(--cc20)] rounded-xl px-4 py-2.5 text-sm text-[var(--text-pri)] placeholder-[var(--text-mut)] focus:outline-none focus:border-[var(--cc)] transition-colors"
              />
              <button
                onClick={agregarPrenda}
                disabled={!nuevaPrenda.nombre.trim() || catalogo.length >= MAX_PRENDAS}
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[var(--cc)] text-white text-sm font-bold disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[var(--cc)]/80 transition-colors"
              >
                {guardandoCatalogo ? <Loader className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                Agregar
              </button>
            </div>

            {/* Lista de prendas */}
            {catalogo.length === 0 ? (
              <div className="text-center py-10 text-[var(--text-mut)]">
                <Package className="w-10 h-10 mx-auto mb-3 opacity-30" />
                <p className="text-sm">Sin prendas. Agrega la primera arriba.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {catalogo.map((p, idx) => (
                  <div key={idx} className="flex items-center gap-2 px-4 py-3 rounded-xl bg-[var(--bg-app)] border border-[var(--cc20)]">
                    {editandoIdx === idx ? (
                      <>
                        <input
                          type="text"
                          value={editandoPrenda.nombre}
                          onChange={e => setEditandoPrenda(f => ({ ...f, nombre: e.target.value }))}
                          className="flex-1 min-w-0 bg-[var(--bg-surface)] border border-[var(--cc20)] rounded-lg px-3 py-1.5 text-sm text-[var(--text-pri)] focus:outline-none focus:border-[var(--cc)]"
                        />
                        <input
                          type="text"
                          inputMode="numeric"
                          value={editandoPrenda.precio_proveedor}
                          onChange={e => setEditandoPrenda(f => ({ ...f, precio_proveedor: e.target.value.replace(/\D/g, '') }))}
                          placeholder="Proveedor"
                          className="w-24 shrink-0 bg-[var(--bg-surface)] border border-[var(--cc20)] rounded-lg px-3 py-1.5 text-sm text-[var(--text-pri)] placeholder-[var(--text-mut)] focus:outline-none focus:border-[var(--cc)]"
                        />
                        <input
                          type="text"
                          inputMode="numeric"
                          value={editandoPrenda.precio}
                          onChange={e => setEditandoPrenda(f => ({ ...f, precio: e.target.value.replace(/\D/g, '') }))}
                          placeholder="Público"
                          className="w-24 shrink-0 bg-[var(--bg-surface)] border border-[var(--cc20)] rounded-lg px-3 py-1.5 text-sm text-[var(--text-pri)] placeholder-[var(--text-mut)] focus:outline-none focus:border-[var(--cc)]"
                        />
                        <div className="flex gap-1 shrink-0">
                          <button onClick={guardarEditPrenda} disabled={guardandoCatalogo}
                            className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[var(--cc)] text-white text-xs font-medium disabled:opacity-40"
                          >
                            {guardandoCatalogo ? <Loader className="w-3 h-3 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                            Guardar
                          </button>
                          <button onClick={() => setEditandoIdx(null)}
                            className="px-3 py-1.5 rounded-lg border border-[var(--cc20)] text-[var(--text-sec)] text-xs hover:text-[var(--text-pri)] transition-colors"
                          >
                            Cancelar
                          </button>
                        </div>
                      </>
                    ) : (
                      <>
                        <span className="flex-1 text-sm text-[var(--text-pri)]">{p.nombre}</span>
                        {p.precio_proveedor > 0 && (
                          <span className="text-xs text-[var(--text-sec)] font-mono">
                            Prov: ${p.precio_proveedor.toLocaleString('es-CO')}
                          </span>
                        )}
                        <span className="text-sm font-mono text-[var(--cc)] font-semibold">
                          ${p.precio.toLocaleString('es-CO')}
                        </span>
                        {p.precio_proveedor > 0 && p.precio > p.precio_proveedor && (
                          <span className="text-xs font-mono text-green-400 bg-green-400/10 px-2 py-0.5 rounded-lg">
                            +${(p.precio - p.precio_proveedor).toLocaleString('es-CO')}
                          </span>
                        )}
                        <button onClick={() => iniciarEditarPrenda(idx)}
                          className="p-1.5 rounded-lg text-[var(--text-sec)] hover:text-[var(--cc)] hover:bg-[var(--cc12)] transition-colors"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => eliminarPrenda(idx)}
                          className="p-1.5 rounded-lg text-[var(--text-sec)] hover:text-[#FF5E5E] hover:bg-[rgba(255,94,94,0.1)] transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </>
                    )}
                  </div>
                ))}
                <p className="text-xs text-[var(--text-sec)] text-right pt-1">
                  {catalogo.length} / {MAX_PRENDAS} prendas
                  {catalogo.length >= MAX_PRENDAS && <span className="text-[#F5A623] ml-1">— límite alcanzado</span>}
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════
          MODAL: EDITAR PEDIDO
      ══════════════════════════════════════════════ */}
      {pedidoEditando && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-[var(--bg-card)] border border-[var(--cc20)] rounded-2xl w-full max-w-lg shadow-[0_8px_40px_rgba(0,50,150,0.4)] max-h-[90vh] overflow-y-auto">

            <div className="flex items-center justify-between p-5 border-b border-[var(--cc20)]">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-[var(--cc12)] flex items-center justify-center">
                  <Pencil className="w-4 h-4 text-[var(--cc)]" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-[var(--text-pri)]">Editar Pedido</h3>
                  <p className="text-xs text-[var(--text-sec)]">{pedidoEditando.nombre} · #{pedidoEditando.numero_estampar}</p>
                </div>
              </div>
              <button onClick={cerrarEditar} className="p-2 rounded-lg text-[var(--text-sec)] hover:text-[var(--text-pri)] hover:bg-[var(--bg-surface)] transition-colors">
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
                <label className="block text-xs text-[var(--text-sec)] mb-2">Prendas <span className="font-normal">(podés agregar o quitar)</span></label>
                <div className="grid grid-cols-1 gap-1.5">
                  {catalogo.map(p => {
                    const sel = editForm.prendas.find(x => x.nombre === p.nombre);
                    return (
                      <button key={p.nombre} onClick={() => toggleEditPrenda(p)}
                        className={`flex items-center justify-between px-4 py-2.5 rounded-xl text-sm font-medium border transition-colors ${
                          sel
                            ? 'bg-[var(--cc12)] border-[var(--cc)]/50 text-[var(--cc)]'
                            : 'bg-[var(--bg-app)] border-[var(--cc20)] text-[var(--text-sec)] hover:text-[var(--text-pri)]'
                        }`}
                      >
                        <span>{p.nombre}</span>
                        <span className="font-mono text-xs">${p.precio.toLocaleString('es-CO')}</span>
                      </button>
                    );
                  })}
                </div>
                {editForm.prendas.length > 0 && (
                  <div className="mt-2 flex items-center justify-between px-4 py-2.5 rounded-xl bg-[var(--bg-app)] border border-[var(--cc)]/30">
                    <span className="text-xs text-[var(--text-sec)]">{editForm.prendas.length} prenda{editForm.prendas.length > 1 ? 's' : ''}</span>
                    <span className="text-sm font-bold text-[var(--cc)]">Total: ${editForm.prendas.reduce((s, p) => s + p.precio, 0).toLocaleString('es-CO')}</span>
                  </div>
                )}
              </div>

              {/* Nombre a estampar */}
              <div>
                <label className="block text-xs text-[var(--text-sec)] mb-1.5">Nombre a estampar</label>
                <input type="text" value={editForm.nombre_estampar}
                  onChange={e => setEditForm(f => ({ ...f, nombre_estampar: e.target.value.toUpperCase() }))}
                  placeholder="Ej: CAÑÓN, TOÑO..."
                  className="w-full bg-[var(--bg-app)] border border-[var(--cc20)] rounded-xl px-4 py-2.5 text-sm text-[var(--text-pri)] placeholder-[var(--text-mut)] focus:outline-none focus:border-[var(--cc)] transition-colors"
                />
              </div>

              {/* Talla y Número */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-[var(--text-sec)] mb-1.5">Talla *</label>
                  <div className="grid grid-cols-2 gap-1.5">
                    {['S', 'M', 'L', 'XL'].map(t => (
                      <button key={t} onClick={() => setEditForm(f => ({ ...f, talla: t }))}
                        className={`py-2 rounded-xl text-sm font-medium border transition-colors ${
                          editForm.talla === t
                            ? 'bg-[var(--cc12)] border-[var(--cc)]/50 text-[var(--cc)]'
                            : 'bg-[var(--bg-app)] border-[var(--cc20)] text-[var(--text-sec)] hover:text-[var(--text-pri)]'
                        }`}
                      >{t}</button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-xs text-[var(--text-sec)] mb-1.5">Número *</label>
                  <input type="text" inputMode="numeric" value={editForm.numero}
                    onChange={e => setEditForm(f => ({ ...f, numero: e.target.value.replace(/\D/g, '').slice(0, 3) }))}
                    placeholder="001" maxLength={3}
                    className="w-full bg-[var(--bg-app)] border border-[var(--cc20)] rounded-xl px-4 py-2.5 text-sm font-mono text-[var(--text-pri)] placeholder-[var(--text-mut)] focus:outline-none focus:border-[var(--cc)] transition-colors"
                  />
                  {editForm.numero && (
                    <p className="text-xs mt-1 font-mono text-[var(--cc)]">#{editForm.numero.padStart(3,'0')}</p>
                  )}
                </div>
              </div>

              <div className="flex gap-3 pt-1">
                <button onClick={cerrarEditar}
                  className="flex-1 py-2.5 rounded-xl border border-[var(--cc20)] text-[var(--text-sec)] hover:text-[var(--text-pri)] text-sm font-medium transition-colors"
                >Cancelar</button>
                <button onClick={handleGuardarEdit} disabled={guardandoEdit || editForm.prendas.length === 0}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-[var(--cc)] text-white text-sm font-bold hover:bg-[var(--cc)]/80 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {guardandoEdit ? <><Loader className="w-4 h-4 animate-spin" /> Guardando...</> : <><Save className="w-4 h-4" /> Guardar cambios</>}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
