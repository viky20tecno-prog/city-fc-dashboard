import { useState, useEffect, useCallback } from 'react';
import {
  Trophy, Plus, ArrowLeft, UserPlus, Save,
  Loader2, Pencil, Trash2, X, Users, Download, AlertTriangle,
} from 'lucide-react';
import jsPDF from 'jspdf';
import { authFetch } from '../lib/authFetch';
import { getClubId } from '../services/api';
import { supabase } from '../lib/supabase';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'https://city-fc-api-v2.vercel.app/api';

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
  const [torneoForm,        setTorneoForm]         = useState({ nombre: '', fecha: '', valor: '' });
  const [guardando,         setGuardando]          = useState(false);
  const [addCedula,         setAddCedula]          = useState('');
  const [addNombre,         setAddNombre]          = useState('');
  const [addBusqueda,       setAddBusqueda]        = useState('');
  const [addLoading,        setAddLoading]         = useState(false);
  const [pagoEdit,          setPagoEdit]           = useState({});
  const [pagandoId,         setPagandoId]          = useState(null);
  const [editIdx,           setEditIdx]            = useState(null);
  const [editForm,          setEditForm]           = useState({ nombre: '', fecha: '', valor: '' });

  const torneosDef = Array.isArray(clubConfig?.torneos_iniciales) ? clubConfig.torneos_iniciales : [];

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

  const patchConfig = async (body) => {
    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token;
    await fetch(`${API_BASE}/config?club_id=${clubId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(body),
    });
    window.location.reload();
  };

  const guardarNuevo = async () => {
    if (!torneoForm.nombre.trim()) return;
    setGuardando(true);
    try {
      const nueva = { nombre: torneoForm.nombre.trim(), fecha: torneoForm.fecha, valor: Number(torneoForm.valor) || 0 };
      await patchConfig({ torneos_iniciales: [...torneosDef, nueva] });
    } catch (e) { console.error(e); }
    finally { setGuardando(false); }
  };

  const guardarEdicion = async () => {
    if (!editForm.nombre.trim()) return;
    setGuardando(true);
    try {
      const nuevaLista = torneosDef.map((t, i) =>
        i === editIdx
          ? { nombre: editForm.nombre.trim(), fecha: editForm.fecha, valor: Number(editForm.valor) || 0 }
          : t
      );
      await patchConfig({ torneos_iniciales: nuevaLista });
    } catch (e) { console.error(e); }
    finally { setGuardando(false); }
  };

  const eliminar = async (idx) => {
    if (!confirm('¿Eliminar este torneo? Los jugadores inscritos seguirán en la base de datos.')) return;
    try {
      const nuevaLista = torneosDef.filter((_, i) => i !== idx);
      if (torneoSeleccionado === torneosDef[idx]?.nombre) setTorneoSeleccionado(null);
      await patchConfig({ torneos_iniciales: nuevaLista });
    } catch (e) { console.error(e); }
  };

  const inscribir = async () => {
    if (!addCedula || !torneoSeleccionado) return;
    const def = torneosDef.find(t => t.nombre === torneoSeleccionado);
    setAddLoading(true);
    try {
      const res = await authFetch(`${API_BASE}/torneos?club_id=${clubId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cedulas: [addCedula], nombre_torneo: torneoSeleccionado, valor_oficial: def?.valor || 0 }),
      });
      const data = await res.json();
      if (data.success) { setAddCedula(''); setAddNombre(''); setAddBusqueda(''); await cargarEnrollments(); }
    } catch (e) { console.error(e); }
    finally { setAddLoading(false); }
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
    if (!monto || monto <= 0) return;
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

  const exportarPDF = () => {
    if (!torneoSeleccionado) return;
    const def      = torneosDef.find(t => t.nombre === torneoSeleccionado);
    const inscritos = enrollments.filter(e => e.nombre_torneo === torneoSeleccionado);
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const W = doc.internal.pageSize.getWidth();
    const M = 14;
    const fecha = new Date().toLocaleDateString('es-CO', { day: '2-digit', month: 'long', year: 'numeric' });
    doc.setFillColor(6, 12, 24); doc.rect(0, 0, W, 22, 'F');
    doc.setFillColor(0, 170, 255); doc.rect(0, 22, W, 1, 'F');
    doc.setFont('helvetica', 'bold'); doc.setFontSize(13); doc.setTextColor(255, 255, 255);
    doc.text(`${clubNombre}  —  ${torneoSeleccionado}`, M, 14);
    doc.setFont('helvetica', 'normal'); doc.setFontSize(8); doc.setTextColor(130, 160, 200);
    doc.text(`Generado: ${fecha}`, W - M, 14, { align: 'right' });
    if (def?.fecha) doc.text(`Fecha torneo: ${def.fecha}`, M, 20);
    let y = 32;
    const pagados    = inscritos.filter(e => e.estado === 'AL_DIA').length;
    const abonos     = inscritos.filter(e => e.estado === 'ABONO').length;
    const pendientes = inscritos.filter(e => e.estado === 'PENDIENTE').length;
    const totalRec   = inscritos.reduce((s, e) => s + parseFloat(e.valor_pagado || 0), 0);
    doc.setFillColor(15, 31, 54); doc.rect(M, y, W - M * 2, 20, 'F');
    doc.setFont('helvetica', 'bold'); doc.setFontSize(8.5); doc.setTextColor(0, 170, 255);
    doc.text(`Total inscritos: ${inscritos.length}`, M + 4, y + 7);
    doc.setTextColor(34, 197, 94);  doc.text(`Al día: ${pagados}`, M + 52, y + 7);
    doc.setTextColor(245, 166, 35); doc.text(`Abono: ${abonos}`, M + 82, y + 7);
    doc.setTextColor(239, 68, 68);  doc.text(`Pendiente: ${pendientes}`, M + 110, y + 7);
    doc.setTextColor(255, 255, 255); doc.setFont('helvetica', 'normal');
    doc.text(`Recaudado: $${totalRec.toLocaleString('es-CO')}`, M + 4, y + 15);
    if (def?.valor) doc.text(`Valor inscripción: $${Number(def.valor).toLocaleString('es-CO')}`, M + 60, y + 15);
    y += 26;
    doc.setFillColor(10, 22, 40); doc.rect(M, y, W - M * 2, 7, 'F');
    doc.setFont('helvetica', 'bold'); doc.setFontSize(7.5); doc.setTextColor(100, 130, 160);
    doc.text('CÉDULA', M + 2, y + 5); doc.text('NOMBRE', M + 28, y + 5);
    doc.text('PAGADO', M + 108, y + 5); doc.text('SALDO', M + 130, y + 5); doc.text('ESTADO', M + 150, y + 5);
    y += 7;
    inscritos.forEach((e, i) => {
      if (y > 270) { doc.addPage(); y = 20; }
      doc.setFillColor(i % 2 === 0 ? 8 : 14, i % 2 === 0 ? 18 : 26, i % 2 === 0 ? 34 : 46);
      doc.rect(M, y, W - M * 2, 8, 'F');
      doc.setFont('helvetica', 'normal'); doc.setFontSize(7.8); doc.setTextColor(190, 210, 230);
      doc.text(String(e.cedula || ''), M + 2, y + 5.5);
      const jugador = jugadoresClub.find(j => String(j.cedula) === String(e.cedula));
      const nombre  = jugador ? `${jugador.nombre || ''} ${jugador.apellidos || ''}`.trim() : String(e.cedula);
      doc.text(nombre.slice(0, 32), M + 28, y + 5.5);
      doc.text(`$${parseFloat(e.valor_pagado || 0).toLocaleString('es-CO')}`, M + 108, y + 5.5);
      doc.text(`$${parseFloat(e.saldo_pendiente || 0).toLocaleString('es-CO')}`, M + 130, y + 5.5);
      const estadoColor = e.estado === 'AL_DIA' ? [34, 197, 94] : e.estado === 'ABONO' ? [245, 166, 35] : [239, 68, 68];
      doc.setTextColor(...estadoColor); doc.setFont('helvetica', 'bold');
      doc.text(e.estado === 'AL_DIA' ? 'AL DÍA' : e.estado || 'PENDIENTE', M + 150, y + 5.5);
      doc.setFont('helvetica', 'normal'); doc.setTextColor(190, 210, 230);
      y += 8;
    });
    doc.save(`${torneoSeleccionado.toLowerCase().replace(/\s+/g, '-')}-inscritos.pdf`);
  };

  const torneoNombresActivos   = torneosDef.map(t => t.nombre);
  const enrollmentsHuerfanos  = enrollments.filter(e => !torneoNombresActivos.includes(e.nombre_torneo));
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

  const inscritosDelTorneo    = torneoSeleccionado ? enrollments.filter(e => e.nombre_torneo === torneoSeleccionado) : [];
  const yaInscritos           = new Set(inscritosDelTorneo.map(e => String(e.cedula)));
  const jugadoresDisponibles  = jugadoresClub.filter(j => !yaInscritos.has(String(j.cedula)));
  const sugeridos = addBusqueda.length >= 1
    ? jugadoresDisponibles.filter(j => {
        const full = `${j.nombre || ''} ${j.apellidos || ''}`.toLowerCase();
        return full.includes(addBusqueda.toLowerCase()) || String(j.cedula).includes(addBusqueda);
      }).slice(0, 6)
    : [];

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
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <input value={torneoForm.nombre} onChange={e => setTorneoForm(f => ({ ...f, nombre: e.target.value }))}
                  placeholder="Nombre del torneo *"
                  className="bg-[var(--bg-app)] border border-[var(--cc20)] rounded-xl px-4 py-2.5 text-sm text-[var(--text-pri)] focus:outline-none focus:border-[var(--cc)] transition" />
                <input type="date" value={torneoForm.fecha} onChange={e => setTorneoForm(f => ({ ...f, fecha: e.target.value }))}
                  className="bg-[var(--bg-app)] border border-[var(--cc20)] rounded-xl px-4 py-2.5 text-sm text-[var(--text-pri)] focus:outline-none focus:border-[var(--cc)] transition" style={{ colorScheme: 'dark' }} />
                <input type="number" value={torneoForm.valor} onChange={e => setTorneoForm(f => ({ ...f, valor: e.target.value }))}
                  placeholder="Valor inscripción" min={0}
                  className="bg-[var(--bg-app)] border border-[var(--cc20)] rounded-xl px-4 py-2.5 text-sm text-[var(--text-pri)] focus:outline-none focus:border-[var(--cc)] transition" />
              </div>
              <div className="flex gap-2 justify-end">
                <button onClick={() => { setShowForm(false); setTorneoForm({ nombre: '', fecha: '', valor: '' }); }}
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
                const ins  = enrollments.filter(e => e.nombre_torneo === t.nombre);
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
                          <input type="number" value={editForm.valor} onChange={e => setEditForm(f => ({ ...f, valor: e.target.value }))}
                            placeholder="Valor" className="bg-[var(--bg-app)] border border-[var(--cc20)] rounded-xl px-3 py-2 text-sm text-[var(--text-pri)]" />
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
                              {t.valor > 0 ? `  ·  ${fmtCOP(t.valor)}` : ''}
                            </p>
                          </div>
                          <div className="flex gap-1.5 flex-shrink-0">
                            <button onClick={() => { setEditIdx(idx); setEditForm({ nombre: t.nombre, fecha: t.fecha || '', valor: String(t.valor || '') }); }}
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
                        <button onClick={() => setTorneoSeleccionado(t.nombre)}
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
        const def         = torneosDef.find(t => t.nombre === torneoSeleccionado);
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
                    <Trophy className="w-4 h-4 text-[var(--cc)]" /> {torneoSeleccionado}
                  </h3>
                  <p className="text-xs text-[var(--text-sec)]">
                    {def?.fecha ? `📅 ${def.fecha}` : ''}
                    {def?.valor > 0 ? `  ·  Inscripción: ${fmtCOP(def.valor)}` : ''}
                  </p>
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
                <UserPlus className="w-3.5 h-3.5" /> Añadir jugador al torneo
              </p>
              <div className="flex gap-2 items-start">
                <div className="relative flex-1">
                  {addCedula ? (
                    <div className="flex items-center gap-2 bg-[var(--bg-app)] border border-[var(--cc)] rounded-xl px-3 py-2">
                      <span className="text-sm text-[var(--text-pri)] flex-1">
                        {addNombre} <span className="text-[var(--text-mut)] text-xs">CC {addCedula}</span>
                      </span>
                      <button
                        onClick={() => { setAddCedula(''); setAddNombre(''); setAddBusqueda(''); }}
                        className="text-[var(--text-mut)] hover:text-red-400 transition">
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <>
                      <input
                        type="search"
                        value={addBusqueda}
                        onChange={e => setAddBusqueda(e.target.value)}
                        placeholder="Buscar por nombre o cédula..."
                        className="w-full bg-[var(--bg-app)] border border-[var(--cc20)] rounded-xl px-3 py-2 text-sm text-[var(--text-pri)] focus:outline-none focus:border-[var(--cc)] transition"
                      />
                      {addBusqueda.length >= 1 && (
                        <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-[var(--bg-card)] border border-[var(--cc20)] rounded-xl overflow-hidden shadow-xl">
                          {sugeridos.length === 0 ? (
                            <p className="px-4 py-3 text-xs text-[var(--text-sec)]">Sin resultados</p>
                          ) : (
                            sugeridos.map(j => (
                              <button key={j.cedula} type="button"
                                onClick={() => { setAddCedula(String(j.cedula)); setAddNombre(`${j.nombre || ''} ${j.apellidos || ''}`.trim()); setAddBusqueda(''); }}
                                className="w-full text-left px-4 py-2.5 hover:bg-[var(--bg-surface)] transition border-b border-[var(--cc20)] last:border-0">
                                <p className="text-sm text-[var(--text-pri)]">{j.nombre} {j.apellidos}</p>
                                <p className="text-xs text-[var(--text-sec)]">CC {j.cedula}</p>
                              </button>
                            ))
                          )}
                        </div>
                      )}
                    </>
                  )}
                </div>
                <button onClick={inscribir} disabled={!addCedula || addLoading}
                  className="px-4 py-2 rounded-xl bg-[var(--cc)] text-white text-sm font-bold disabled:opacity-40 hover:opacity-90 transition flex items-center gap-2 shrink-0">
                  {addLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                  Inscribir
                </button>
              </div>
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
                        {['Jugador','Estado','Oficial','Pagado','Saldo','Pago',''].map(h => (
                          <th key={h} className="text-left py-2.5 px-4 text-xs text-[var(--text-sec)] font-medium">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {inscritosDelTorneo.map(e => {
                        const jug    = jugadoresClub.find(j => String(j.cedula) === String(e.cedula));
                        const nombre = jug ? `${jug.nombre} ${jug.apellidos || ''}`.trim() : `CC ${e.cedula}`;
                        return (
                          <tr key={e.id} className="border-b border-[var(--cc20)] hover:bg-[var(--bg-surface)] transition">
                            <td className="py-2.5 px-4">
                              <p className="font-medium text-[var(--text-pri)] text-xs">{nombre}</p>
                              <p className="text-[var(--text-mut)] text-[10px]">CC {e.cedula}</p>
                            </td>
                            <td className="py-2.5 px-4"><span className={chipEstado(e.estado)}>{labelEstado(e)}</span></td>
                            <td className="py-2.5 px-4 text-[var(--text-sec)] text-xs">{fmtCOP(e.valor_oficial)}</td>
                            <td className="py-2.5 px-4 text-green-400 font-semibold text-xs">{fmtCOP(e.valor_pagado)}</td>
                            <td className="py-2.5 px-4 text-red-400 text-xs">{fmtCOP(e.saldo_pendiente)}</td>
                            <td className="py-2.5 px-4">
                              {e.estado !== 'AL_DIA' && (
                                <div className="flex items-center gap-1.5">
                                  <input type="number" min={0}
                                    value={pagoEdit[e.id] || ''}
                                    onChange={ev => setPagoEdit(p => ({ ...p, [e.id]: ev.target.value }))}
                                    placeholder="Total pagado"
                                    className="w-28 bg-[var(--bg-app)] border border-[var(--cc20)] rounded-lg px-2 py-1.5 text-xs text-[var(--text-pri)] focus:outline-none focus:border-[var(--cc)]"
                                  />
                                  <button onClick={() => registrarPago(e.id)} disabled={!pagoEdit[e.id] || pagandoId === e.id}
                                    className="p-1.5 rounded-lg bg-[var(--cc12)] border border-[var(--cc)]/30 text-[var(--cc)] hover:bg-[var(--cc20)] transition disabled:opacity-40">
                                    {pagandoId === e.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                                  </button>
                                </div>
                              )}
                            </td>
                            <td className="py-2.5 px-4">
                              <button onClick={() => quitar(e.id)}
                                className="p-1.5 rounded-lg text-[var(--text-sec)] hover:text-red-400 hover:bg-red-500/10 transition">
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </td>
                          </tr>
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
