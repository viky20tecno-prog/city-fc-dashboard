import { useState, useEffect, useCallback, Fragment } from 'react';
import {
  Trophy, Plus, ArrowLeft, UserPlus, Save,
  Loader2, Pencil, Trash2, X, Users, Download, AlertTriangle,
  ArrowUpAZ, ArrowDownAZ, Tag,
} from 'lucide-react';
import { hexToRgb, loadLogoDataUrl, drawPdfHeader, drawPdfFooter, drawPdfSectionLabel, drawPdfTableHead } from '../lib/pdfHelpers';
import { authFetch } from '../lib/authFetch';
import { getClubId } from '../services/api';
import { supabase } from '../lib/supabase';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'https://api.zensports.zenpra.ai/api';

const fmtCOP = (n) => `$${parseFloat(n || 0).toLocaleString('es-CO')}`;

const chipEstado = (estado) => {
  if (estado === 'AL_DIA') return 'px-2 py-0.5 rounded-lg text-[10px] font-bold bg-green-500/15 text-green-400 border border-green-500/20';
  if (estado === 'ABONO')  return 'px-2 py-0.5 rounded-lg text-[10px] font-bold bg-yellow-500/15 text-yellow-400 border border-yellow-500/20';
  return 'px-2 py-0.5 rounded-lg text-[10px] font-bold bg-red-500/15 text-red-400 border border-red-500/20';
};
const labelEstado = (e) => e.estado === 'AL_DIA' ? 'Al día' : e.estado === 'ABONO' ? 'Abono' : 'Pendiente';

export default function TorneosPage({ color, clubNombre, clubConfig }) {
  const clubId = getClubId();

  const [enrollments,       setEnrollments]       = useState([]);
  const [jugadoresClub,     setJugadoresClub]      = useState([]);
  const [torneoSeleccionado, setTorneoSeleccionado] = useState(null);
  const [showForm,          setShowForm]           = useState(false);
  const [torneoForm,        setTorneoForm]         = useState({ nombre: '', fecha: '', valor_oficial: '', valor_inscrito: '', descripcion: '' });
  const [guardando,         setGuardando]          = useState(false);
  const [addSeleccionados,  setAddSeleccionados]   = useState([]); // [{ cedula, nombre }]
  const [addBusqueda,       setAddBusqueda]        = useState('');
  const [addLoading,        setAddLoading]         = useState(false);
  const [pagoEdit,          setPagoEdit]           = useState({});
  const [pagandoId,         setPagandoId]          = useState(null);
  const [editIdx,           setEditIdx]            = useState(null);
  const [editForm,          setEditForm]           = useState({ nombre: '', fecha: '', valor_oficial: '', valor_inscrito: '', descripcion: '' });
  const [sortAlpha,         setSortAlpha]          = useState(null); // null | 'asc' | 'desc'
  const [descOpen,          setDescOpen]           = useState(null);
  const [descEdit,          setDescEdit]           = useState({});
  const [guardandoDesc,     setGuardandoDesc]      = useState(null);
  const [montoOpen,         setMontoOpen]          = useState(null);
  const [montoEdit,         setMontoEdit]          = useState({});
  const [guardandoMonto,    setGuardandoMonto]     = useState(null);

  const [torneosDef, setTorneosDef] = useState(() =>
    Array.isArray(clubConfig?.torneos_iniciales) ? clubConfig.torneos_iniciales : []
  );

  const cargarEnrollments = useCallback(async () => {
    try {
      const res  = await authFetch(`${API_BASE}/torneos?club_id=${clubId}`);
      const data = await res.json();
      if (data.success) setEnrollments(data.data || []);
    } catch (e) { console.error(e); }
  }, [clubId]);

  const cargarJugadores = useCallback(async () => {
    try {
      const res  = await authFetch(`${API_BASE}/players?club_id=${clubId}`);
      const data = await res.json();
      if (data.success) setJugadoresClub(data.data || []);
    } catch (e) { console.error(e); }
  }, [clubId]);

  useEffect(() => { cargarEnrollments(); cargarJugadores(); }, [cargarEnrollments, cargarJugadores]);

  const patchConfig = useCallback(async (body) => {
    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token;
    await fetch(`${API_BASE}/config?club_id=${clubId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(body),
    });
  }, [clubId]);

  // Auto-reparación: torneos creados antes de esta versión no tienen `id`.
  // Sin id no se pueden vincular las inscripciones de forma estable, así que
  // se les asigna uno apenas se detectan y se persiste en la config del club.
  useEffect(() => {
    if (torneosDef.length === 0) return;
    if (torneosDef.every(t => t.id)) return;
    const conIds = torneosDef.map(t => t.id ? t : { ...t, id: crypto.randomUUID() });
    setTorneosDef(conIds);
    patchConfig({ torneos_iniciales: conIds });
  }, [torneosDef, patchConfig]);

  const guardarNuevo = async () => {
    if (!torneoForm.nombre.trim()) return;
    setGuardando(true);
    try {
      const nueva = { id: crypto.randomUUID(), nombre: torneoForm.nombre.trim(), fecha: torneoForm.fecha, valor_oficial: Number(torneoForm.valor_oficial) || 0, valor_inscrito: Number(torneoForm.valor_inscrito) || 0, descripcion: torneoForm.descripcion.trim() };
      const nuevaLista = [...torneosDef, nueva];
      await patchConfig({ torneos_iniciales: nuevaLista });
      setTorneosDef(nuevaLista);
      setShowForm(false);
      setTorneoForm({ nombre: '', fecha: '', valor_oficial: '', valor_inscrito: '', descripcion: '' });
    } catch (e) { console.error(e); }
    finally { setGuardando(false); }
  };

  const guardarEdicion = async () => {
    if (!editForm.nombre.trim()) return;
    setGuardando(true);
    try {
      const nuevaLista = torneosDef.map((t, i) =>
        i === editIdx
          ? { ...t, nombre: editForm.nombre.trim(), fecha: editForm.fecha, valor_oficial: Number(editForm.valor_oficial) || 0, valor_inscrito: Number(editForm.valor_inscrito) || 0, descripcion: editForm.descripcion.trim() }
          : t
      );
      await patchConfig({ torneos_iniciales: nuevaLista });
      setTorneosDef(nuevaLista);
      setEditIdx(null);
    } catch (e) { console.error(e); }
    finally { setGuardando(false); }
  };

  const eliminar = async (idx) => {
    const torneo    = torneosDef[idx];
    const inscritos = enrollments.filter(e => e.torneo_id === torneo?.id);
    const mensaje = inscritos.length > 0
      ? `¿Eliminar este torneo y las ${inscritos.length} inscripciones de jugadores que tiene? Esta acción no se puede deshacer.`
      : '¿Eliminar este torneo?';
    if (!confirm(mensaje)) return;
    try {
      const nuevaLista = torneosDef.filter((_, i) => i !== idx);
      if (torneoSeleccionado === torneo?.id) setTorneoSeleccionado(null);
      await patchConfig({ torneos_iniciales: nuevaLista });
      setTorneosDef(nuevaLista);
      if (inscritos.length > 0) {
        await Promise.all(
          inscritos.map(e => authFetch(`${API_BASE}/torneos/${e.id}?club_id=${clubId}`, { method: 'DELETE' }))
        );
        await cargarEnrollments();
      }
    } catch (e) { console.error(e); }
  };

  const inscribirSeleccionados = async () => {
    if (addSeleccionados.length === 0 || !torneoSeleccionado) return;
    const def = torneosDef.find(t => t.id === torneoSeleccionado);
    setAddLoading(true);
    try {
      const res = await authFetch(`${API_BASE}/torneos?club_id=${clubId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cedulas: addSeleccionados.map(j => j.cedula),
          nombre_torneo: def?.nombre,
          torneo_id: def?.id,
          valor_oficial: def?.valor_oficial ?? def?.valor ?? 0,
          valor_inscrito: def?.valor_inscrito ?? def?.valor ?? 0,
        }),
      });
      const data = await res.json();
      if (data.success) { setAddSeleccionados([]); setAddBusqueda(''); await cargarEnrollments(); }
    } catch (e) { console.error(e); }
    finally { setAddLoading(false); }
  };

  const guardarDescuento = async (id) => {
    const descuento = Number(descEdit[id]?.monto) || 0;
    const concepto  = (descEdit[id]?.concepto || '').trim();
    setGuardandoDesc(id);
    try {
      const res = await authFetch(`${API_BASE}/torneos/${id}?club_id=${clubId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ descuento, concepto_descuento: concepto }),
      });
      const data = await res.json();
      if (data.success) {
        setDescEdit(d => ({ ...d, [id]: { monto: '', concepto: '' } }));
        setDescOpen(null);
        await cargarEnrollments();
      }
    } catch (e) { console.error(e); }
    finally { setGuardandoDesc(null); }
  };

  const guardarMonto = async (id) => {
    const valor_oficial  = Number(montoEdit[id]?.oficial)  || 0;
    const valor_inscrito = Number(montoEdit[id]?.inscrito) || 0;
    setGuardandoMonto(id);
    try {
      const res = await authFetch(`${API_BASE}/torneos/${id}?club_id=${clubId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ valor_oficial, valor_inscrito }),
      });
      const data = await res.json();
      if (data.success) {
        setMontoEdit(m => ({ ...m, [id]: { oficial: '', inscrito: '' } }));
        setMontoOpen(null);
        await cargarEnrollments();
      }
    } catch (e) { console.error(e); }
    finally { setGuardandoMonto(null); }
  };

  const quitar = async (id) => {
    if (!confirm('¿Quitar este jugador del torneo?')) return;
    try {
      await authFetch(`${API_BASE}/torneos/${id}?club_id=${clubId}`, { method: 'DELETE' });
      await cargarEnrollments();
    } catch (e) { console.error(e); }
  };

  const registrarPago = async (id) => {
    const monto = Number(pagoEdit[id]);
    if (Number.isNaN(monto) || monto < 0) return;
    setPagandoId(id);
    try {
      const res = await authFetch(`${API_BASE}/torneos/${id}?club_id=${clubId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ valor_pagado: monto }),
      });
      const data = await res.json();
      if (data.success) { setPagoEdit(p => ({ ...p, [id]: '' })); await cargarEnrollments(); }
    } catch (e) { console.error(e); }
    finally { setPagandoId(null); }
  };

  const exportarPDF = async () => {
    if (!torneoSeleccionado) return;
    const def         = torneosDef.find(t => t.id === torneoSeleccionado);
    const nombreTorneo = def?.nombre || '';
    const inscritos = enrollments
      .filter(e => e.torneo_id === torneoSeleccionado)
      .sort((a, b) => {
        const jA = jugadoresClub.find(j => String(j.cedula) === String(a.cedula));
        const jB = jugadoresClub.find(j => String(j.cedula) === String(b.cedula));
        const nA = jA ? `${jA.nombre||''} ${jA.apellidos||''}`.trim() : String(a.cedula);
        const nB = jB ? `${jB.nombre||''} ${jB.apellidos||''}`.trim() : String(b.cedula);
        return nA.toUpperCase().localeCompare(nB.toUpperCase(), 'es');
      });
    const { default: jsPDF } = await import('jspdf');
    const doc       = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const W = 210; const H = 297; const M = 14;
    const accentRgb = hexToRgb(color);
    const fecha     = new Date().toLocaleDateString('es-CO', { day: '2-digit', month: 'long', year: 'numeric' });

    const logoData  = await loadLogoDataUrl(clubConfig?.logo_url);
    let y = drawPdfHeader(doc, {
      W, M, clubName: clubNombre, title: nombreTorneo,
      date: fecha + (def?.fecha ? `  ·  Fecha torneo: ${def.fecha}` : ''),
      logoData, accentRgb,
    });

    // Resumen en caja
    const pagados    = inscritos.filter(e => e.estado === 'AL_DIA').length;
    const abonos     = inscritos.filter(e => e.estado === 'ABONO').length;
    const pendientes = inscritos.filter(e => e.estado === 'PENDIENTE').length;
    const totalRec   = inscritos.reduce((s, e) => s + parseFloat(e.valor_pagado || 0), 0);

    const descripcion = def?.descripcion || '';
    const boxH = descripcion ? 25 : 18;
    doc.setFillColor(245, 246, 248); doc.rect(M, y, W - M * 2, boxH, 'F');
    const [r, g, b] = accentRgb;
    doc.setFillColor(r, g, b); doc.rect(M, y, 3, boxH, 'F');
    doc.setFont('helvetica', 'bold'); doc.setFontSize(8); doc.setTextColor(r, g, b);
    doc.text(`${inscritos.length} inscritos`, M + 6, y + 7);
    doc.setTextColor(34, 197, 94);  doc.text(`Al día: ${pagados}`,       M + 38, y + 7);
    doc.setTextColor(245, 166, 35); doc.text(`Abono: ${abonos}`,         M + 72, y + 7);
    doc.setTextColor(239, 68, 68);  doc.text(`Pendiente: ${pendientes}`, M + 106, y + 7);
    doc.setFont('helvetica', 'normal'); doc.setFontSize(7.5); doc.setTextColor(80, 80, 80);
    doc.text(`Recaudado: $${totalRec.toLocaleString('es-CO')}`, M + 6, y + 14);
    const vOficial  = def?.valor_oficial  ?? def?.valor ?? 0;
    const vInscrito = def?.valor_inscrito ?? def?.valor ?? 0;
    if (vInscrito > 0) doc.text(`Al inscrito: $${Number(vInscrito).toLocaleString('es-CO')}  ·  Oficial: $${Number(vOficial).toLocaleString('es-CO')}`, M + 70, y + 14);
    if (descripcion) {
      doc.setFont('helvetica', 'italic'); doc.setFontSize(7); doc.setTextColor(110, 110, 110);
      doc.text(descripcion.slice(0, 120), M + 6, y + 20.5);
    }
    y += boxH + 6;

    const cols = [
      { label: 'Cédula',  x: M + 2 },
      { label: 'Nombre',  x: M + 28 },
      { label: 'Pagado',  x: M + 108 },
      { label: 'Saldo',   x: M + 132 },
      { label: 'Estado',  x: M + 155 },
    ];

    const drawHead = () => drawPdfTableHead(doc, { W, M, y, columns: cols, accentRgb });
    y = drawHead();

    inscritos.forEach((e, i) => {
      if (y > H - 20) { doc.addPage(); y = 20; y = drawHead(); }
      if (i % 2 === 0) { doc.setFillColor(248, 249, 250); doc.rect(M, y - 4, W - M * 2, 8, 'F'); }
      doc.setFont('helvetica', 'normal'); doc.setFontSize(7.8); doc.setTextColor(30, 40, 50);
      doc.text(String(e.cedula || ''), cols[0].x, y + 1.5);
      const jugador = jugadoresClub.find(j => String(j.cedula) === String(e.cedula));
      const nombre  = jugador ? `${jugador.nombre || ''} ${jugador.apellidos || ''}`.trim().toUpperCase() : String(e.cedula);
      doc.text(nombre.slice(0, 32), cols[1].x, y + 1.5);
      doc.setTextColor(34, 197, 94);
      doc.text(`$${parseFloat(e.valor_pagado || 0).toLocaleString('es-CO')}`, cols[2].x, y + 1.5);
      doc.setTextColor(239, 68, 68);
      doc.text(`$${parseFloat(e.saldo_pendiente || 0).toLocaleString('es-CO')}`, cols[3].x, y + 1.5);
      const estadoColor = e.estado === 'AL_DIA' ? [34, 197, 94] : e.estado === 'ABONO' ? [245, 166, 35] : [239, 68, 68];
      doc.setTextColor(...estadoColor); doc.setFont('helvetica', 'bold');
      doc.text(e.estado === 'AL_DIA' ? 'AL DÍA' : e.estado === 'ABONO' ? 'ABONO' : 'PENDIENTE', cols[4].x, y + 1.5);
      y += 8;
    });

    if (!inscritos.length) {
      doc.setTextColor(150, 150, 150); doc.setFont('helvetica', 'normal'); doc.setFontSize(9);
      doc.text('No hay inscritos en este torneo.', M, y + 4);
    }

    const pages = doc.internal.getNumberOfPages();
    for (let p = 1; p <= pages; p++) {
      doc.setPage(p);
      drawPdfFooter(doc, { W, H, M, clubName: clubNombre, pageNum: p, totalPages: pages });
    }

    doc.save(`${nombreTorneo.toLowerCase().replace(/\s+/g, '-')}-inscritos.pdf`);
  };

  const torneoIdsActivos     = torneosDef.map(t => t.id);
  const enrollmentsHuerfanos = enrollments.filter(e => !e.torneo_id || !torneoIdsActivos.includes(e.torneo_id));
  const [eliminandoHuerfanos, setEliminandoHuerfanos] = useState(false);

  const eliminarHuerfanos = async () => {
    if (!confirm(`¿Eliminar ${enrollmentsHuerfanos.length} inscripciones huérfanas? Esta acción no se puede deshacer.`)) return;
    setEliminandoHuerfanos(true);
    try {
      await Promise.all(
        enrollmentsHuerfanos.map(e =>
          authFetch(`${API_BASE}/torneos/${e.id}?club_id=${clubId}`, { method: 'DELETE' })
        )
      );
      await cargarEnrollments();
    } catch (e) { console.error(e); }
    finally { setEliminandoHuerfanos(false); }
  };

  const inscritosDelTorneo    = torneoSeleccionado ? enrollments.filter(e => e.torneo_id === torneoSeleccionado) : [];
  const yaInscritos           = new Set(inscritosDelTorneo.map(e => String(e.cedula)));
  const yaSeleccionados       = new Set(addSeleccionados.map(j => String(j.cedula)));
  const jugadoresDisponibles  = jugadoresClub.filter(j => !yaInscritos.has(String(j.cedula)) && !yaSeleccionados.has(String(j.cedula)));
  const jugadoresVisibles = addBusqueda.length >= 1
    ? jugadoresDisponibles.filter(j => {
        const full = `${j.nombre || ''} ${j.apellidos || ''}`.toLowerCase();
        return full.includes(addBusqueda.toLowerCase()) || String(j.cedula).includes(addBusqueda);
      })
    : jugadoresDisponibles;

  return (
    <div className="space-y-5">

      {/* Vista lista */}
      {!torneoSeleccionado && (
        <div className="space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <h3 className="text-base font-bold text-[var(--text-pri)] flex items-center gap-2">
                <Trophy className="w-4 h-4 text-[var(--cc)]" /> Torneos
              </h3>
              <p className="text-xs text-[var(--text-sec)] mt-0.5">Gestiona torneos y la inscripción de jugadores</p>
            </div>
            <button onClick={() => setShowForm(v => !v)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[var(--cc)] text-white text-sm font-semibold hover:opacity-90 transition">
              <Plus className="w-4 h-4" /> Nuevo torneo
            </button>
          </div>

          {showForm && (
            <div className="bg-[var(--bg-card)] border border-[var(--cc20)] rounded-2xl p-5 space-y-4">
              <h4 className="text-sm font-bold text-[var(--text-pri)]">Nuevo torneo</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <input value={torneoForm.nombre} onChange={e => setTorneoForm(f => ({ ...f, nombre: e.target.value }))}
                  placeholder="Nombre del torneo *"
                  className="bg-[var(--bg-app)] border border-[var(--cc20)] rounded-xl px-4 py-2.5 text-sm text-[var(--text-pri)] focus:outline-none focus:border-[var(--cc)] transition" />
                <input type="date" value={torneoForm.fecha} onChange={e => setTorneoForm(f => ({ ...f, fecha: e.target.value }))}
                  className="bg-[var(--bg-app)] border border-[var(--cc20)] rounded-xl px-4 py-2.5 text-sm text-[var(--text-pri)] focus:outline-none focus:border-[var(--cc)] transition" style={{ colorScheme: 'dark' }} />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <p className="text-xs text-[var(--text-mut)] mb-1.5">Precio oficial <span className="text-[var(--text-mut)] font-normal">(solo admin)</span></p>
                  <input type="number" value={torneoForm.valor_oficial} onChange={e => setTorneoForm(f => ({ ...f, valor_oficial: e.target.value }))}
                    placeholder="$0" min={0}
                    className="w-full bg-[var(--bg-app)] border border-[var(--cc20)] rounded-xl px-4 py-2.5 text-sm text-[var(--text-pri)] focus:outline-none focus:border-[var(--cc)] transition" />
                </div>
                <div>
                  <p className="text-xs text-[var(--text-mut)] mb-1.5">Precio al inscrito <span className="text-[var(--text-mut)] font-normal">(lo que ve el jugador)</span></p>
                  <input type="number" value={torneoForm.valor_inscrito} onChange={e => setTorneoForm(f => ({ ...f, valor_inscrito: e.target.value }))}
                    placeholder="$0" min={0}
                    className="w-full bg-[var(--bg-app)] border border-[var(--cc20)] rounded-xl px-4 py-2.5 text-sm text-[var(--text-pri)] focus:outline-none focus:border-[var(--cc)] transition" />
                </div>
              </div>
              <div>
                <p className="text-xs text-[var(--text-mut)] mb-1.5">Descripción corta <span className="text-[var(--text-mut)] font-normal">(aparece en el PDF de inscritos)</span></p>
                <input value={torneoForm.descripcion} onChange={e => setTorneoForm(f => ({ ...f, descripcion: e.target.value }))}
                  placeholder="Ej: Torneo interno de fútbol 7, categoría sub-15" maxLength={140}
                  className="w-full bg-[var(--bg-app)] border border-[var(--cc20)] rounded-xl px-4 py-2.5 text-sm text-[var(--text-pri)] focus:outline-none focus:border-[var(--cc)] transition" />
              </div>
              <div className="flex gap-2 justify-end">
                <button onClick={() => { setShowForm(false); setTorneoForm({ nombre: '', fecha: '', valor_oficial: '', valor_inscrito: '', descripcion: '' }); }}
                  className="px-4 py-2 rounded-xl border border-[var(--cc20)] text-[var(--text-sec)] text-sm hover:text-[var(--text-pri)] transition">
                  Cancelar
                </button>
                <button onClick={guardarNuevo} disabled={!torneoForm.nombre.trim() || guardando}
                  className="px-4 py-2 rounded-xl bg-[var(--cc)] text-white text-sm font-semibold disabled:opacity-40 hover:opacity-90 transition">
                  {guardando ? 'Guardando…' : 'Crear torneo'}
                </button>
              </div>
            </div>
          )}

          {torneosDef.length === 0 ? (
            <div className="bg-[var(--bg-card)] border border-[var(--cc20)] rounded-2xl p-10 text-center">
              <Trophy className="w-10 h-10 text-[var(--text-mut)] mx-auto mb-3" />
              <p className="text-sm text-[var(--text-sec)]">No hay torneos creados aún.</p>
              <p className="text-xs text-[var(--text-mut)] mt-1">Crea tu primer torneo con el botón de arriba.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {torneosDef.map((t, idx) => {
                const ins  = enrollments.filter(e => e.torneo_id === t.id);
                const pag  = ins.filter(e => e.estado === 'AL_DIA').length;
                const abo  = ins.filter(e => e.estado === 'ABONO').length;
                const pen  = ins.filter(e => e.estado === 'PENDIENTE').length;
                const edt  = editIdx === idx;
                return (
                  <div key={idx} className="bg-[var(--bg-card)] border border-[var(--cc20)] rounded-2xl p-5 space-y-3">
                    {edt ? (
                      <div className="space-y-3">
                        <input value={editForm.nombre} onChange={e => setEditForm(f => ({ ...f, nombre: e.target.value }))}
                          className="w-full bg-[var(--bg-app)] border border-[var(--cc20)] rounded-xl px-3 py-2 text-sm text-[var(--text-pri)] focus:outline-none focus:border-[var(--cc)]" />
                        <div className="grid grid-cols-2 gap-2">
                          <input type="date" value={editForm.fecha} onChange={e => setEditForm(f => ({ ...f, fecha: e.target.value }))}
                            className="bg-[var(--bg-app)] border border-[var(--cc20)] rounded-xl px-3 py-2 text-sm text-[var(--text-pri)]" style={{ colorScheme: 'dark' }} />
                          <div />
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <p className="text-[10px] text-[var(--text-mut)] mb-1">Precio oficial</p>
                            <input type="number" value={editForm.valor_oficial} onChange={e => setEditForm(f => ({ ...f, valor_oficial: e.target.value }))}
                              placeholder="$0" className="w-full bg-[var(--bg-app)] border border-[var(--cc20)] rounded-xl px-3 py-2 text-sm text-[var(--text-pri)]" />
                          </div>
                          <div>
                            <p className="text-[10px] text-[var(--text-mut)] mb-1">Precio al inscrito</p>
                            <input type="number" value={editForm.valor_inscrito} onChange={e => setEditForm(f => ({ ...f, valor_inscrito: e.target.value }))}
                              placeholder="$0" className="w-full bg-[var(--bg-app)] border border-[var(--cc20)] rounded-xl px-3 py-2 text-sm text-[var(--text-pri)]" />
                          </div>
                        </div>
                        <div>
                          <p className="text-[10px] text-[var(--text-mut)] mb-1">Descripción corta</p>
                          <input value={editForm.descripcion} onChange={e => setEditForm(f => ({ ...f, descripcion: e.target.value }))}
                            placeholder="Ej: Torneo interno de fútbol 7, categoría sub-15" maxLength={140}
                            className="w-full bg-[var(--bg-app)] border border-[var(--cc20)] rounded-xl px-3 py-2 text-sm text-[var(--text-pri)]" />
                        </div>
                        <div className="flex gap-2">
                          <button onClick={() => setEditIdx(null)} className="flex-1 py-2 rounded-xl border border-[var(--cc20)] text-[var(--text-sec)] text-xs">Cancelar</button>
                          <button onClick={guardarEdicion} disabled={guardando} className="flex-1 py-2 rounded-xl bg-[var(--cc)] text-white text-xs font-bold disabled:opacity-40">
                            {guardando ? '…' : 'Guardar'}
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <p className="text-sm font-bold text-[var(--text-pri)]">{t.nombre}</p>
                            <p className="text-xs text-[var(--text-sec)] mt-0.5">
                              {t.fecha ? `📅 ${t.fecha}` : 'Sin fecha'}
                            </p>
                            {t.descripcion && (
                              <p className="text-xs text-[var(--text-mut)] mt-1">{t.descripcion}</p>
                            )}
                            {(t.valor_oficial > 0 || t.valor_inscrito > 0 || t.valor > 0) && (
                              <div className="flex gap-3 mt-1.5">
                                <span className="text-[10px] text-[var(--text-mut)]">Oficial: <span className="text-[var(--text-sec)] font-semibold">{fmtCOP(t.valor_oficial ?? t.valor)}</span></span>
                                <span className="text-[10px] text-[var(--text-mut)]">Inscrito: <span className="font-semibold" style={{ color: 'var(--cc)' }}>{fmtCOP(t.valor_inscrito ?? t.valor)}</span></span>
                              </div>
                            )}
                          </div>
                          <div className="flex gap-1.5 flex-shrink-0">
                            <button onClick={() => { setEditIdx(idx); setEditForm({ nombre: t.nombre, fecha: t.fecha || '', valor_oficial: String(t.valor_oficial ?? t.valor ?? ''), valor_inscrito: String(t.valor_inscrito ?? t.valor ?? ''), descripcion: t.descripcion || '' }); }}
                              className="p-1.5 rounded-lg text-[var(--text-sec)] hover:text-[var(--cc)] hover:bg-[var(--cc12)] transition">
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                            <button onClick={() => eliminar(idx)}
                              className="p-1.5 rounded-lg text-[var(--text-sec)] hover:text-red-400 hover:bg-red-500/10 transition">
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                        <div className="flex gap-2 flex-wrap">
                          <span className="px-2 py-1 rounded-lg text-[10px] font-bold bg-[var(--bg-surface)] text-[var(--text-sec)]">{ins.length} inscritos</span>
                          {pag > 0 && <span className="px-2 py-1 rounded-lg text-[10px] font-bold bg-green-500/12 text-green-400">{pag} al día</span>}
                          {abo > 0 && <span className="px-2 py-1 rounded-lg text-[10px] font-bold bg-yellow-500/12 text-yellow-400">{abo} abono</span>}
                          {pen > 0 && <span className="px-2 py-1 rounded-lg text-[10px] font-bold bg-red-500/12 text-red-400">{pen} pendiente</span>}
                        </div>
                        <button onClick={() => setTorneoSeleccionado(t.id)}
                          className="w-full py-2 rounded-xl bg-[var(--cc12)] border border-[var(--cc)]/30 text-[var(--cc)] text-xs font-semibold hover:bg-[var(--cc20)] transition">
                          Ver inscritos →
                        </button>
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* ── Inscripciones huérfanas ── */}
          {enrollmentsHuerfanos.length > 0 && (
            <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-2xl p-5">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-bold text-yellow-300 mb-1">
                    {enrollmentsHuerfanos.length} inscripción{enrollmentsHuerfanos.length !== 1 ? 'es' : ''} huérfana{enrollmentsHuerfanos.length !== 1 ? 's' : ''} detectada{enrollmentsHuerfanos.length !== 1 ? 's' : ''}
                  </p>
                  <p className="text-xs text-yellow-200/70 mb-3">
                    Estos jugadores tienen inscripción en torneos que ya no existen en la configuración del club:
                  </p>
                  <div className="flex flex-wrap gap-2 mb-4">
                    {[...new Set(enrollmentsHuerfanos.map(e => e.nombre_torneo))].map(nombre => (
                      <span key={nombre} className="px-2 py-1 rounded-lg text-xs bg-yellow-500/15 text-yellow-300 border border-yellow-500/20">
                        {nombre} ({enrollmentsHuerfanos.filter(e => e.nombre_torneo === nombre).length} jugador{enrollmentsHuerfanos.filter(e => e.nombre_torneo === nombre).length !== 1 ? 'es' : ''})
                      </span>
                    ))}
                  </div>
                  <button
                    onClick={eliminarHuerfanos}
                    disabled={eliminandoHuerfanos}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-yellow-500/20 border border-yellow-500/30 text-yellow-300 text-sm font-semibold hover:bg-yellow-500/30 transition disabled:opacity-50"
                  >
                    {eliminandoHuerfanos
                      ? <><Loader2 className="w-4 h-4 animate-spin" /> Eliminando…</>
                      : <><Trash2 className="w-4 h-4" /> Eliminar inscripciones huérfanas</>
                    }
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Vista detalle de torneo */}
      {torneoSeleccionado && (() => {
        const def         = torneosDef.find(t => t.id === torneoSeleccionado);
        const pagados     = inscritosDelTorneo.filter(e => e.estado === 'AL_DIA').length;
        const abonos      = inscritosDelTorneo.filter(e => e.estado === 'ABONO').length;
        const pendientes  = inscritosDelTorneo.filter(e => e.estado === 'PENDIENTE').length;
        const totalRec    = inscritosDelTorneo.reduce((s, e) => s + parseFloat(e.valor_pagado || 0), 0);
        return (
          <div className="space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-3">
                <button onClick={() => setTorneoSeleccionado(null)}
                  className="p-2 rounded-xl border border-[var(--cc20)] text-[var(--text-sec)] hover:text-[var(--cc)] transition">
                  <ArrowLeft className="w-4 h-4" />
                </button>
                <div>
                  <h3 className="text-base font-bold text-[var(--text-pri)] flex items-center gap-2">
                    <Trophy className="w-4 h-4 text-[var(--cc)]" /> {def?.nombre}
                  </h3>
                  <p className="text-xs text-[var(--text-sec)]">
                    {def?.fecha ? `📅 ${def.fecha}` : ''}
                    {def?.valor > 0 ? `  ·  Inscripción: ${fmtCOP(def.valor)}` : ''}
                  </p>
                  {def?.descripcion && (
                    <p className="text-xs text-[var(--text-mut)] mt-0.5">{def.descripcion}</p>
                  )}
                </div>
              </div>
              <button onClick={exportarPDF}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[var(--cc12)] border border-[var(--cc)]/30 text-[var(--cc)] text-sm font-semibold hover:bg-[var(--cc20)] transition">
                <Download className="w-4 h-4" /> PDF
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-[var(--bg-card)] border border-[var(--cc20)] rounded-xl p-4">
                <p className="text-xs text-[var(--text-sec)]">Inscritos</p>
                <p className="text-2xl font-bold text-[var(--text-pri)] mt-1">{inscritosDelTorneo.length}</p>
              </div>
              <div className="bg-[var(--bg-card)] border border-green-500/20 rounded-xl p-4">
                <p className="text-xs text-green-400">Al día</p>
                <p className="text-2xl font-bold text-green-400 mt-1">{pagados}</p>
              </div>
              <div className="bg-[var(--bg-card)] border border-yellow-500/20 rounded-xl p-4">
                <p className="text-xs text-yellow-400">Abono</p>
                <p className="text-2xl font-bold text-yellow-400 mt-1">{abonos}</p>
              </div>
              <div className="bg-[var(--bg-card)] border border-red-500/20 rounded-xl p-4">
                <p className="text-xs text-red-400">Pendiente</p>
                <p className="text-2xl font-bold text-red-400 mt-1">{pendientes}</p>
              </div>
            </div>

            <div className="bg-[var(--bg-card)] border border-[var(--cc20)] rounded-xl px-5 py-3 flex items-center gap-3">
              <p className="text-xs text-[var(--text-sec)] flex-1">Total recaudado</p>
              <p className="text-lg font-bold text-[var(--cc)]">{fmtCOP(totalRec)}</p>
            </div>

            <div className="bg-[var(--bg-card)] border border-[var(--cc20)] rounded-2xl p-4">
              <p className="text-xs font-semibold text-[var(--text-sec)] mb-3 flex items-center gap-2">
                <UserPlus className="w-3.5 h-3.5" /> Añadir jugadores al torneo
              </p>

              {addSeleccionados.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-3">
                  {addSeleccionados.map(j => (
                    <span key={j.cedula} className="flex items-center gap-1.5 bg-[var(--cc12)] border border-[var(--cc)]/30 rounded-lg px-2.5 py-1 text-xs text-[var(--text-pri)]">
                      {j.nombre}
                      <button
                        onClick={() => setAddSeleccionados(s => s.filter(x => x.cedula !== j.cedula))}
                        className="text-[var(--text-mut)] hover:text-red-400 transition">
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}

              <div className="flex gap-2 items-center mb-3">
                <input
                  type="search"
                  value={addBusqueda}
                  onChange={e => setAddBusqueda(e.target.value)}
                  placeholder="Buscar por nombre o cédula (o elige de la lista de abajo)..."
                  className="flex-1 bg-[var(--bg-app)] border border-[var(--cc20)] rounded-xl px-3 py-2 text-sm text-[var(--text-pri)] focus:outline-none focus:border-[var(--cc)] transition"
                />
                <button onClick={inscribirSeleccionados} disabled={addSeleccionados.length === 0 || addLoading}
                  className="px-4 py-2 rounded-xl bg-[var(--cc)] text-white text-sm font-bold disabled:opacity-40 hover:opacity-90 transition flex items-center gap-2 shrink-0">
                  {addLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                  Inscribir{addSeleccionados.length > 0 ? ` (${addSeleccionados.length})` : ''}
                </button>
              </div>

              {jugadoresVisibles.length === 0 ? (
                <p className="text-xs text-[var(--text-sec)] px-1">
                  {addBusqueda.length >= 1 ? 'Sin resultados' : 'No hay más jugadores disponibles para agregar.'}
                </p>
              ) : (
                <div className="border border-[var(--cc20)] rounded-xl p-3 max-h-56 overflow-y-auto">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-[10px] text-[var(--text-mut)]">
                      {jugadoresVisibles.length} jugador{jugadoresVisibles.length !== 1 ? 'es' : ''} {addBusqueda.length >= 1 ? 'encontrado' + (jugadoresVisibles.length !== 1 ? 's' : '') : 'disponible' + (jugadoresVisibles.length !== 1 ? 's' : '')}
                    </p>
                    {jugadoresVisibles.length > 1 && (
                      <button
                        type="button"
                        onClick={() => setAddSeleccionados(s => [
                          ...s,
                          ...jugadoresVisibles.map(j => ({ cedula: String(j.cedula), nombre: `${j.nombre || ''} ${j.apellidos || ''}`.trim().toUpperCase() })),
                        ])}
                        className="text-[10px] font-semibold text-[var(--cc)] hover:underline"
                      >
                        + Agregar todos
                      </button>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {jugadoresVisibles.map(j => (
                      <button key={j.cedula} type="button"
                        onClick={() => setAddSeleccionados(s => [...s, { cedula: String(j.cedula), nombre: `${j.nombre || ''} ${j.apellidos || ''}`.trim().toUpperCase() }])}
                        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs bg-[var(--bg-app)] border border-[var(--cc20)] text-[var(--text-pri)] hover:border-[var(--cc)] hover:bg-[var(--cc12)] transition"
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-[var(--cc)] flex-shrink-0" />
                        {`${j.nombre || ''} ${j.apellidos || ''}`.trim().toUpperCase()}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {inscritosDelTorneo.length === 0 ? (
              <div className="bg-[var(--bg-card)] border border-[var(--cc20)] rounded-2xl p-10 text-center">
                <Users className="w-8 h-8 text-[var(--text-mut)] mx-auto mb-2" />
                <p className="text-sm text-[var(--text-sec)]">Ningún jugador inscrito aún.</p>
              </div>
            ) : (
              <div className="bg-[var(--bg-card)] border border-[var(--cc20)] rounded-2xl overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-[var(--cc20)]">
                        <th className="text-left py-2.5 px-4 text-xs text-[var(--text-sec)] font-medium">
                          <button
                            onClick={() => setSortAlpha(s => s === 'asc' ? 'desc' : s === 'desc' ? null : 'asc')}
                            className="flex items-center gap-1 hover:text-[var(--cc)] transition group"
                            title={sortAlpha === 'asc' ? 'Orden Z→A' : sortAlpha === 'desc' ? 'Quitar orden' : 'Orden A→Z'}
                          >
                            Jugador
                            {sortAlpha === 'asc'
                              ? <ArrowUpAZ className="w-3.5 h-3.5 text-[var(--cc)]" />
                              : sortAlpha === 'desc'
                              ? <ArrowDownAZ className="w-3.5 h-3.5 text-[var(--cc)]" />
                              : <ArrowUpAZ className="w-3.5 h-3.5 opacity-0 group-hover:opacity-40 transition" />
                            }
                          </button>
                        </th>
                        {['Estado','Oficial','Inscrito','Desc.','Pagado','Saldo','Pago',''].map(h => (
                          <th key={h} className="text-left py-2.5 px-4 text-xs text-[var(--text-sec)] font-medium">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {[...inscritosDelTorneo]
                        .map(e => {
                          const jug = jugadoresClub.find(j => String(j.cedula) === String(e.cedula));
                          return { ...e, _nombre: jug ? `${jug.nombre} ${jug.apellidos || ''}`.trim().toUpperCase() : `CC ${e.cedula}` };
                        })
                        .sort((a, b) => {
                          if (!sortAlpha) return 0;
                          return sortAlpha === 'asc'
                            ? a._nombre.localeCompare(b._nombre, 'es', { sensitivity: 'base' })
                            : b._nombre.localeCompare(a._nombre, 'es', { sensitivity: 'base' });
                        })
                        .map(e => {
                          const nombre    = e._nombre;
                          const descuento = parseFloat(e.descuento) || 0;
                          const concepto  = e.concepto_descuento || '';
                          const isDescOpen  = descOpen === e.id;
                          const isMontoOpen = montoOpen === e.id;
                          return (
                          <Fragment key={e.id}>
                            <tr className="border-b border-[var(--cc20)] hover:bg-[var(--bg-surface)] transition">
                              <td className="py-2.5 px-4">
                                <p className="font-medium text-[var(--text-pri)] text-xs">{nombre}</p>
                                <p className="text-[var(--text-mut)] text-[10px]">CC {e.cedula}</p>
                              </td>
                              <td className="py-2.5 px-4"><span className={chipEstado(e.estado)}>{labelEstado(e)}</span></td>
                              <td className="py-2.5 px-4">
                                <button
                                  onClick={() => { setMontoOpen(isMontoOpen ? null : e.id); setMontoEdit(m => ({ ...m, [e.id]: { oficial: String(e.valor_oficial ?? ''), inscrito: String(e.valor_inscrito ?? e.valor_oficial ?? '') } })); }}
                                  className="flex items-center gap-1 text-[var(--text-sec)] hover:text-[var(--cc)] transition group"
                                  title="Corregir montos"
                                >
                                  {fmtCOP(e.valor_oficial)}
                                  <Pencil className="w-3 h-3 opacity-0 group-hover:opacity-70 transition" />
                                </button>
                              </td>
                              <td className="py-2.5 px-4 text-[var(--cc)] font-semibold text-xs">{fmtCOP(e.valor_inscrito ?? e.valor_oficial)}</td>
                              <td className="py-2.5 px-4">
                                {descuento > 0 ? (
                                  <button
                                    onClick={() => { setDescOpen(isDescOpen ? null : e.id); setDescEdit(d => ({ ...d, [e.id]: { monto: String(descuento), concepto } })); }}
                                    className="flex flex-col items-start gap-0.5 group"
                                    title="Editar descuento"
                                  >
                                    <span className="text-xs font-semibold text-amber-400">−{fmtCOP(descuento)}</span>
                                    {concepto && <span className="text-[10px] text-[var(--text-mut)] group-hover:text-amber-400 transition truncate max-w-[80px]">{concepto}</span>}
                                  </button>
                                ) : (
                                  <button
                                    onClick={() => { setDescOpen(isDescOpen ? null : e.id); setDescEdit(d => ({ ...d, [e.id]: { monto: '', concepto: '' } })); }}
                                    className="p-1 rounded-lg text-[var(--text-mut)] hover:text-amber-400 hover:bg-amber-500/10 transition"
                                    title="Agregar descuento"
                                  >
                                    <Tag className="w-3.5 h-3.5" />
                                  </button>
                                )}
                              </td>
                              <td className="py-2.5 px-4 text-green-400 font-semibold text-xs">{fmtCOP(e.valor_pagado)}</td>
                              <td className="py-2.5 px-4 text-red-400 text-xs">{fmtCOP(e.saldo_pendiente)}</td>
                              <td className="py-2.5 px-4">
                                <div className="flex items-center gap-1.5">
                                  <input type="number" min={0}
                                    value={pagoEdit[e.id] ?? ''}
                                    onChange={ev => setPagoEdit(p => ({ ...p, [e.id]: ev.target.value }))}
                                    placeholder={e.estado === 'AL_DIA' ? 'Corregir pagado' : 'Total pagado'}
                                    className="w-28 bg-[var(--bg-app)] border border-[var(--cc20)] rounded-lg px-2 py-1.5 text-xs text-[var(--text-pri)] focus:outline-none focus:border-[var(--cc)]"
                                  />
                                  <button onClick={() => registrarPago(e.id)} disabled={pagoEdit[e.id] === undefined || pagoEdit[e.id] === '' || pagandoId === e.id}
                                    className="p-1.5 rounded-lg bg-[var(--cc12)] border border-[var(--cc)]/30 text-[var(--cc)] hover:bg-[var(--cc20)] transition disabled:opacity-40">
                                    {pagandoId === e.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                                  </button>
                                </div>
                              </td>
                              <td className="py-2.5 px-4">
                                <button onClick={() => quitar(e.id)}
                                  className="p-1.5 rounded-lg text-[var(--text-sec)] hover:text-red-400 hover:bg-red-500/10 transition">
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              </td>
                            </tr>

                            {/* Editor de descuento */}
                            {isDescOpen && (
                              <tr className="border-b border-[var(--cc20)]">
                                <td colSpan={8} className="px-4 pb-3 pt-0">
                                  <div className="bg-amber-500/5 border border-amber-500/20 rounded-xl p-3 space-y-2.5">
                                    <p className="text-xs font-semibold text-amber-400 flex items-center gap-1.5">
                                      <Tag className="w-3 h-3" /> Descuento para {nombre}
                                    </p>
                                    {/* Chips de concepto rápido */}
                                    <div className="flex flex-wrap gap-1.5">
                                      {['Patrocinio','Campeón','Familiar','Directivo','Cortesía'].map(c => (
                                        <button key={c}
                                          onClick={() => setDescEdit(d => ({ ...d, [e.id]: { ...d[e.id], concepto: c } }))}
                                          className={`px-2.5 py-1 rounded-lg text-[10px] font-semibold border transition ${
                                            descEdit[e.id]?.concepto === c
                                              ? 'bg-amber-500/20 border-amber-500/50 text-amber-300'
                                              : 'bg-[var(--bg-app)] border-[var(--cc20)] text-[var(--text-sec)] hover:border-amber-500/40 hover:text-amber-400'
                                          }`}
                                        >{c}</button>
                                      ))}
                                    </div>
                                    <div className="flex gap-2 items-center flex-wrap">
                                      <input
                                        type="number" min={0}
                                        value={descEdit[e.id]?.monto || ''}
                                        onChange={ev => setDescEdit(d => ({ ...d, [e.id]: { ...d[e.id], monto: ev.target.value } }))}
                                        placeholder="Monto descuento"
                                        className="w-36 bg-[var(--bg-app)] border border-[var(--cc20)] rounded-lg px-2 py-1.5 text-xs text-[var(--text-pri)] focus:outline-none focus:border-amber-500/60"
                                      />
                                      <input
                                        type="text"
                                        value={descEdit[e.id]?.concepto || ''}
                                        onChange={ev => setDescEdit(d => ({ ...d, [e.id]: { ...d[e.id], concepto: ev.target.value } }))}
                                        placeholder="Concepto (ej: Patrocinio Nike)"
                                        className="flex-1 min-w-[140px] bg-[var(--bg-app)] border border-[var(--cc20)] rounded-lg px-2 py-1.5 text-xs text-[var(--text-pri)] focus:outline-none focus:border-amber-500/60"
                                      />
                                      <button
                                        onClick={() => guardarDescuento(e.id)}
                                        disabled={guardandoDesc === e.id}
                                        className="px-3 py-1.5 rounded-lg bg-amber-500/15 border border-amber-500/30 text-amber-400 text-xs font-semibold hover:bg-amber-500/25 transition disabled:opacity-40 flex items-center gap-1.5"
                                      >
                                        {guardandoDesc === e.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
                                        Guardar
                                      </button>
                                      <button
                                        onClick={() => setDescOpen(null)}
                                        className="px-3 py-1.5 rounded-lg text-[var(--text-sec)] text-xs hover:text-[var(--text-pri)] transition"
                                      >
                                        Cancelar
                                      </button>
                                    </div>
                                    {descuento > 0 && (
                                      <button
                                        onClick={() => { setDescEdit(d => ({ ...d, [e.id]: { monto: '0', concepto: '' } })); guardarDescuento(e.id); }}
                                        className="text-[10px] text-red-400/60 hover:text-red-400 transition"
                                      >
                                        Quitar descuento
                                      </button>
                                    )}
                                  </div>
                                </td>
                              </tr>
                            )}

                            {/* Editor de montos (corrección por error del admin) */}
                            {isMontoOpen && (
                              <tr className="border-b border-[var(--cc20)]">
                                <td colSpan={8} className="px-4 pb-3 pt-0">
                                  <div className="bg-[var(--cc12)] border border-[var(--cc)]/30 rounded-xl p-3 space-y-2.5">
                                    <p className="text-xs font-semibold text-[var(--cc)] flex items-center gap-1.5">
                                      <Pencil className="w-3 h-3" /> Corregir montos de {nombre}
                                    </p>
                                    <div className="flex gap-2 items-center flex-wrap">
                                      <div>
                                        <p className="text-[10px] text-[var(--text-mut)] mb-1">Precio oficial</p>
                                        <input
                                          type="number" min={0}
                                          value={montoEdit[e.id]?.oficial ?? ''}
                                          onChange={ev => setMontoEdit(m => ({ ...m, [e.id]: { ...m[e.id], oficial: ev.target.value } }))}
                                          placeholder="$0"
                                          className="w-32 bg-[var(--bg-app)] border border-[var(--cc20)] rounded-lg px-2 py-1.5 text-xs text-[var(--text-pri)] focus:outline-none focus:border-[var(--cc)]"
                                        />
                                      </div>
                                      <div>
                                        <p className="text-[10px] text-[var(--text-mut)] mb-1">Precio al inscrito</p>
                                        <input
                                          type="number" min={0}
                                          value={montoEdit[e.id]?.inscrito ?? ''}
                                          onChange={ev => setMontoEdit(m => ({ ...m, [e.id]: { ...m[e.id], inscrito: ev.target.value } }))}
                                          placeholder="$0"
                                          className="w-32 bg-[var(--bg-app)] border border-[var(--cc20)] rounded-lg px-2 py-1.5 text-xs text-[var(--text-pri)] focus:outline-none focus:border-[var(--cc)]"
                                        />
                                      </div>
                                      <button
                                        onClick={() => guardarMonto(e.id)}
                                        disabled={guardandoMonto === e.id}
                                        className="px-3 py-1.5 rounded-lg bg-[var(--cc)] text-white text-xs font-semibold hover:opacity-90 transition disabled:opacity-40 flex items-center gap-1.5 self-end"
                                      >
                                        {guardandoMonto === e.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
                                        Guardar
                                      </button>
                                      <button
                                        onClick={() => setMontoOpen(null)}
                                        className="px-3 py-1.5 rounded-lg text-[var(--text-sec)] text-xs hover:text-[var(--text-pri)] transition self-end"
                                      >
                                        Cancelar
                                      </button>
                                    </div>
                                    <p className="text-[10px] text-[var(--text-mut)]">El saldo pendiente se recalcula automáticamente con el nuevo monto.</p>
                                  </div>
                                </td>
                              </tr>
                            )}
                          </Fragment>
                          );
                        })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        );
      })()}
    </div>
  );
}
