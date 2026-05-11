import { useState, useEffect, useCallback } from 'react';
import {
  TrendingUp, TrendingDown, Wallet, Plus, Trash2, Loader2,
  Users, ChevronDown, ChevronUp, Download, FileText, X,
  CheckCircle, AlertCircle, Pencil, Trophy, ArrowLeft, UserPlus, Save,
} from 'lucide-react';
import {
  ComposedChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import jsPDF from 'jspdf';
import { authFetch } from '../lib/authFetch';
import { getClubId } from '../services/api';
import { formatMoney, getCodigoPais } from '../lib/formatMoney';
import { supabase } from '../lib/supabase';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'https://city-fc-api-v2.vercel.app/api';

const CATEGORIAS_INGRESO_DEFAULT = [
  'Patrocinio / Sponsor', 'Venta de uniformes', 'Evento / Rifa',
  'Donación', 'Inscripción torneo', 'Cuota extraordinaria', 'Otro ingreso',
];
const CATEGORIAS_GASTO_DEFAULT = [
  'Alquiler de cancha', 'Árbitros', 'Uniformes y equipamiento', 'Transporte',
  'Inscripción torneo', 'Mantenimiento', 'Servicios (agua, luz)', 'Nómina', 'Otro gasto',
];

const MESES_CORTOS = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];

function mesLabel(yyyy_mm) {
  const [y, m] = yyyy_mm.split('-');
  return `${MESES_CORTOS[parseInt(m, 10) - 1]} ${y}`;
}

function hoy() { return new Date().toISOString().slice(0, 10); }

function mesActual() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

function rangoMes(ym) {
  const [y, m] = ym.split('-').map(Number);
  const desde  = `${y}-${String(m).padStart(2, '0')}-01`;
  const ultimo = new Date(y, m, 0).getDate();
  const hasta  = `${y}-${String(m).padStart(2, '0')}-${String(ultimo).padStart(2, '0')}`;
  return { desde, hasta };
}

function exportCSV(rows, filename) {
  const headers = ['Fecha','Tipo','Categoría','Descripción','Monto'];
  const lines = [
    headers.join(','),
    ...rows.map(r => [r.fecha, r.tipo, r.categoria, `"${r.descripcion}"`, r.monto].join(',')),
  ];
  const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

export default function Finanzas({ color = 'var(--cc)', clubNombre = 'Mi Club', clubConfig }) {
  const c        = color;
  const clubId   = getClubId();
  const codigoPais = clubConfig?.codigo_pais || getCodigoPais();
  const fmt      = (v) => formatMoney(v, codigoPais);

  // Categorías del club o defaults
  const catsIngreso = (clubConfig?.categorias_finanzas_ingreso?.length
    ? clubConfig.categorias_finanzas_ingreso
    : CATEGORIAS_INGRESO_DEFAULT);
  const catsGasto = (clubConfig?.categorias_finanzas_gasto?.length
    ? clubConfig.categorias_finanzas_gasto
    : CATEGORIAS_GASTO_DEFAULT);

  const guardarCategorias = async (tipo, nuevaLista) => {
    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token;
    const campo = tipo === 'ingreso' ? 'categorias_finanzas_ingreso' : 'categorias_finanzas_gasto';
    await fetch(`${API_BASE}/config?club_id=${clubId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ [campo]: nuevaLista }),
    });
  };

  const [tab, setTab]           = useState('balance');
  const [movimientos, setMovimientos] = useState([]);
  const [empleados,   setEmpleados]   = useState([]);
  const [pagosNomina, setPagosNomina] = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [mesVista,  setMesVista]  = useState(mesActual());

  // Formulario movimiento
  const FORM_EMPTY = { tipo: 'ingreso', categoria: catsIngreso[0] || '', descripcion: '', monto: '', fecha: hoy(), comprobante_url: '' };
  const [nuevaCat, setNuevaCat] = useState('');
  const [showForm,    setShowForm]    = useState(false);
  const [form,        setForm]        = useState(FORM_EMPTY);
  const [guardando,   setGuardando]   = useState(false);
  const [formError,   setFormError]   = useState('');

  // Formulario empleado
  const EMP_EMPTY = { nombre: '', cargo: '', salario_mensual: '' };
  const [showEmpForm,  setShowEmpForm]  = useState(false);
  const [empForm,      setEmpForm]      = useState(EMP_EMPTY);
  const [empEditId,    setEmpEditId]    = useState(null);
  const [guardandoEmp, setGuardandoEmp] = useState(false);

  // Filtro movimientos
  const [filtroTipo,   setFiltroTipo]   = useState('todos');
  const [filtroMes,    setFiltroMes]    = useState(mesActual());

  // — Torneos —
  const [torneosEnrollments, setTorneosEnrollments] = useState([]);
  const [torneoSeleccionado,  setTorneoSeleccionado]  = useState(null); // nombre del torneo
  const [showTorneoForm,      setShowTorneoForm]      = useState(false);
  const [torneoForm,          setTorneoForm]          = useState({ nombre: '', fecha: '', valor: '' });
  const [torneoGuardando,     setTorneoGuardando]     = useState(false);
  const [jugadoresClub,       setJugadoresClub]       = useState([]);
  const [addJugadorCedula,    setAddJugadorCedula]    = useState('');
  const [addJugandoLoading,   setAddJugandoLoading]   = useState(false);
  const [pagoEdit,            setPagoEdit]            = useState({}); // {id: valor}
  const [pagandoId,           setPagandoId]           = useState(null);
  const [torneoDefEditIdx,    setTorneoDefEditIdx]     = useState(null);
  const [torneoDefEditForm,   setTorneoDefEditForm]   = useState({ nombre: '', fecha: '', valor: '' });

  const torneosDef = Array.isArray(clubConfig?.torneos_iniciales) ? clubConfig.torneos_iniciales : [];

  const cargarTorneos = useCallback(async () => {
    try {
      const res = await authFetch(`${API_BASE}/torneos?club_id=${clubId}`);
      const data = await res.json();
      if (data.success) setTorneosEnrollments(data.data || []);
    } catch (e) { console.error(e); }
  }, [clubId]);

  const cargarJugadores = useCallback(async () => {
    try {
      const res = await authFetch(`${API_BASE}/players?club_id=${clubId}`);
      const data = await res.json();
      if (data.success) setJugadoresClub(data.data || []);
    } catch (e) { console.error(e); }
  }, [clubId]);

  const guardarTorneoDef = async () => {
    if (!torneoForm.nombre.trim()) return;
    setTorneoGuardando(true);
    const nueva = { nombre: torneoForm.nombre.trim(), fecha: torneoForm.fecha, valor: Number(torneoForm.valor) || 0 };
    const nuevaLista = [...torneosDef, nueva];
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      await fetch(`${API_BASE}/config?club_id=${clubId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ torneos_iniciales: nuevaLista }),
      });
      setTorneoForm({ nombre: '', fecha: '', valor: '' });
      setShowTorneoForm(false);
      window.location.reload(); // recarga config
    } catch (e) { console.error(e); }
    finally { setTorneoGuardando(false); }
  };

  const eliminarTorneoDef = async (idx) => {
    if (!confirm('¿Eliminar este torneo? Los jugadores inscritos seguirán en la base de datos.')) return;
    const nuevaLista = torneosDef.filter((_, i) => i !== idx);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      await fetch(`${API_BASE}/config?club_id=${clubId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ torneos_iniciales: nuevaLista }),
      });
      if (torneoSeleccionado === torneosDef[idx]?.nombre) setTorneoSeleccionado(null);
      window.location.reload();
    } catch (e) { console.error(e); }
  };

  const editarTorneoDef = async () => {
    if (!torneoDefEditForm.nombre.trim()) return;
    setTorneoGuardando(true);
    const nuevaLista = torneosDef.map((t, i) =>
      i === torneoDefEditIdx
        ? { nombre: torneoDefEditForm.nombre.trim(), fecha: torneoDefEditForm.fecha, valor: Number(torneoDefEditForm.valor) || 0 }
        : t
    );
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      await fetch(`${API_BASE}/config?club_id=${clubId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ torneos_iniciales: nuevaLista }),
      });
      setTorneoDefEditIdx(null);
      window.location.reload();
    } catch (e) { console.error(e); }
    finally { setTorneoGuardando(false); }
  };

  const inscribirJugador = async () => {
    if (!addJugadorCedula || !torneoSeleccionado) return;
    const def = torneosDef.find(t => t.nombre === torneoSeleccionado);
    setAddJugandoLoading(true);
    try {
      const res = await authFetch(`${API_BASE}/torneos?club_id=${clubId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cedulas: [addJugadorCedula], nombre_torneo: torneoSeleccionado, valor_oficial: def?.valor || 0 }),
      });
      const data = await res.json();
      if (data.success) { setAddJugadorCedula(''); await cargarTorneos(); }
    } catch (e) { console.error(e); }
    finally { setAddJugandoLoading(false); }
  };

  const quitarInscripcion = async (id) => {
    if (!confirm('¿Quitar este jugador del torneo?')) return;
    try {
      await authFetch(`${API_BASE}/torneos/${id}?club_id=${clubId}`, { method: 'DELETE' });
      await cargarTorneos();
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
      if (data.success) { setPagoEdit(p => ({ ...p, [id]: '' })); await cargarTorneos(); }
    } catch (e) { console.error(e); }
    finally { setPagandoId(null); }
  };

  const exportarPDFTorneo = () => {
    if (!torneoSeleccionado) return;
    const def = torneosDef.find(t => t.nombre === torneoSeleccionado);
    const inscritos = torneosEnrollments.filter(e => e.nombre_torneo === torneoSeleccionado);
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
    // Resumen
    const pagados = inscritos.filter(e => e.estado === 'AL_DIA').length;
    const abonos  = inscritos.filter(e => e.estado === 'ABONO').length;
    const pendientes = inscritos.filter(e => e.estado === 'PENDIENTE').length;
    const totalRecaudado = inscritos.reduce((s, e) => s + parseFloat(e.valor_pagado || 0), 0);
    doc.setFillColor(15, 31, 54); doc.rect(M, y, W - M * 2, 20, 'F');
    doc.setFont('helvetica', 'bold'); doc.setFontSize(8.5); doc.setTextColor(0, 170, 255);
    doc.text(`Total inscritos: ${inscritos.length}`, M + 4, y + 7);
    doc.setTextColor(34, 197, 94);  doc.text(`Al día: ${pagados}`, M + 52, y + 7);
    doc.setTextColor(245, 166, 35); doc.text(`Abono: ${abonos}`, M + 82, y + 7);
    doc.setTextColor(239, 68, 68);  doc.text(`Pendiente: ${pendientes}`, M + 110, y + 7);
    doc.setTextColor(255, 255, 255); doc.setFont('helvetica', 'normal');
    doc.text(`Recaudado: $${totalRecaudado.toLocaleString('es-CO')}`, M + 4, y + 15);
    if (def?.valor) doc.text(`Valor inscripción: $${Number(def.valor).toLocaleString('es-CO')}`, M + 60, y + 15);
    y += 26;
    // Cabecera tabla
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
      const nombre = jugador ? `${jugador.nombre || ''} ${jugador.apellidos || ''}`.trim() : String(e.cedula);
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

  const cargar = useCallback(async () => {
    setLoading(true);
    try {
      const [movRes, empRes, pagRes] = await Promise.all([
        authFetch(`${API_BASE}/finanzas?club_id=${clubId}`),
        authFetch(`${API_BASE}/nomina/empleados?club_id=${clubId}`),
        authFetch(`${API_BASE}/nomina/pagos?club_id=${clubId}&mes=${mesVista}`),
      ]);
      const [movData, empData, pagData] = await Promise.all([movRes.json(), empRes.json(), pagRes.json()]);
      if (movData.success) setMovimientos(movData.data || []);
      if (empData.success) setEmpleados(empData.data || []);
      if (pagData.success) setPagosNomina(pagData.data || []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, [clubId, mesVista]);

  useEffect(() => { cargar(); }, [cargar]);
  useEffect(() => { cargarTorneos(); cargarJugadores(); }, [cargarTorneos, cargarJugadores]);

  /* ── Guardar movimiento ───────────────────────────────── */
  const guardarMovimiento = async (e) => {
    e.preventDefault();
    if (!form.monto || Number(form.monto) <= 0) { setFormError('El monto debe ser mayor a 0'); return; }
    setGuardando(true); setFormError('');
    try {
      const res  = await authFetch(`${API_BASE}/finanzas?club_id=${clubId}`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, monto: Number(form.monto) }),
      });
      const data = await res.json();
      if (!res.ok) { setFormError(data.error || 'Error al guardar'); return; }
      setMovimientos(m => [data.data, ...m]);
      setForm(FORM_EMPTY); setShowForm(false);
    } catch { setFormError('Error de conexión'); }
    finally { setGuardando(false); }
  };

  /* ── Eliminar movimiento ─────────────────────────────── */
  const eliminarMovimiento = async (id) => {
    if (!confirm('¿Eliminar este movimiento?')) return;
    await authFetch(`${API_BASE}/finanzas/${id}?club_id=${clubId}`, { method: 'DELETE' });
    setMovimientos(m => m.filter(x => x.id !== id));
  };

  /* ── Guardar empleado ────────────────────────────────── */
  const guardarEmpleado = async (e) => {
    e.preventDefault();
    if (!empForm.nombre.trim()) return;
    setGuardandoEmp(true);
    try {
      const url    = empEditId
        ? `${API_BASE}/nomina/empleados/${empEditId}?club_id=${clubId}`
        : `${API_BASE}/nomina/empleados?club_id=${clubId}`;
      const method = empEditId ? 'PUT' : 'POST';
      const res    = await authFetch(url, {
        method, headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...empForm, salario_mensual: Number(empForm.salario_mensual) || 0 }),
      });
      const data = await res.json();
      if (data.success) {
        setEmpleados(prev => empEditId
          ? prev.map(e => e.id === empEditId ? data.data : e)
          : [data.data, ...prev]);
        setShowEmpForm(false); setEmpForm(EMP_EMPTY); setEmpEditId(null);
      }
    } catch (e) { console.error(e); }
    finally { setGuardandoEmp(false); }
  };

  /* ── Pagar nómina ────────────────────────────────────── */
  const pagarNomina = async (empleado) => {
    const monto = Number(empleado.salario_mensual);
    if (!monto) return alert('Este empleado no tiene salario configurado.');
    if (!confirm(`¿Registrar pago de ${fmt(monto)} a ${empleado.nombre} por ${mesLabel(mesVista)}?`)) return;
    try {
      const res  = await authFetch(`${API_BASE}/nomina/pagos?club_id=${clubId}`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ empleado_id: empleado.id, mes: mesVista, monto, fecha_pago: hoy() }),
      });
      const data = await res.json();
      if (!res.ok) { alert(data.error); return; }
      setPagosNomina(p => [data.data, ...p]);
      setMovimientos(m => [{
        id: data.data.id + '_nom', tipo: 'gasto', categoria: 'Nómina',
        descripcion: `Pago nómina ${mesVista} — ${empleado.nombre}`,
        monto, fecha: hoy(), created_at: new Date().toISOString(),
      }, ...m]);
    } catch (e) { console.error(e); }
  };

  /* ── Exportar PDF ────────────────────────────────────── */
  const exportarPDF = async () => {
    const doc   = new jsPDF();
    const W     = 210;
    const M     = 14;
    const acHex = color || '#E14924';
    const cr    = parseInt(acHex.slice(1,3), 16);
    const cg    = parseInt(acHex.slice(3,5), 16);
    const cb_   = parseInt(acHex.slice(5,7), 16);

    const { desde, hasta } = rangoMes(filtroMes);
    const rows  = movimientos.filter(m => m.fecha >= desde && m.fecha <= hasta);
    const ing   = rows.filter(r => r.tipo === 'ingreso').reduce((s, r) => s + Number(r.monto), 0);
    const gasto = rows.filter(r => r.tipo === 'gasto').reduce((s, r) => s + Number(r.monto), 0);
    const saldo = ing - gasto;
    const genDate = new Date().toLocaleDateString('es-CO', { day: '2-digit', month: 'long', year: 'numeric' });

    // ── Header band ──────────────────────────────────────
    doc.setFillColor(cr, cg, cb_);
    doc.rect(0, 0, W, 36, 'F');

    // Logo
    let textX = M;
    if (clubConfig?.logo_url) {
      try {
        const imgData = await new Promise((res, rej) => {
          const img = new Image();
          img.crossOrigin = 'anonymous';
          img.onload = () => {
            const cvs = document.createElement('canvas');
            cvs.width = img.width; cvs.height = img.height;
            cvs.getContext('2d').drawImage(img, 0, 0);
            res(cvs.toDataURL('image/png'));
          };
          img.onerror = rej;
          img.src = clubConfig.logo_url;
        });
        doc.addImage(imgData, 'PNG', M, 8, 20, 20);
        textX = M + 24;
      } catch (_) {}
    }

    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold'); doc.setFontSize(16);
    doc.text(clubNombre || 'Mi Club', textX, 18);
    doc.setFont('helvetica', 'normal'); doc.setFontSize(8);
    doc.setTextColor(225, 225, 225);
    doc.text('Estado Financiero', textX, 27);
    doc.setFont('helvetica', 'bold'); doc.setFontSize(10);
    doc.setTextColor(255, 255, 255);
    doc.text(mesLabel(filtroMes), W - M, 17, { align: 'right' });
    doc.setFont('helvetica', 'normal'); doc.setFontSize(7.5);
    doc.setTextColor(215, 215, 215);
    doc.text(`Generado: ${genDate}`, W - M, 27, { align: 'right' });

    // ── Summary boxes ─────────────────────────────────────
    const boxes = [
      { label: 'Total Ingresos', val: fmt(ing),   r: 34,  g: 197, b: 94  },
      { label: 'Total Gastos',   val: fmt(gasto), r: 239, g: 68,  b: 68  },
      { label: 'Saldo Neto',     val: fmt(saldo), r: saldo >= 0 ? 34 : 239, g: saldo >= 0 ? 197 : 68, b: saldo >= 0 ? 94 : 68 },
    ];
    const bW = 58; const bH = 22; const bY = 42;
    const bXs = [M, W / 2 - bW / 2, W - M - bW];
    boxes.forEach(({ label, val, r, g, b }, i) => {
      const bx = bXs[i];
      doc.setFillColor(245, 247, 250);
      doc.rect(bx, bY, bW, bH, 'F');
      doc.setFillColor(r, g, b);
      doc.rect(bx, bY, 3, bH, 'F');
      doc.setDrawColor(r, g, b); doc.setLineWidth(0.3);
      doc.rect(bx, bY, bW, bH, 'S');
      doc.setTextColor(100, 100, 100); doc.setFont('helvetica', 'normal'); doc.setFontSize(7);
      doc.text(label, bx + bW / 2, bY + 7, { align: 'center' });
      doc.setTextColor(r, g, b); doc.setFont('helvetica', 'bold'); doc.setFontSize(11);
      doc.text(val, bx + bW / 2, bY + 18, { align: 'center' });
    });

    // ── Table ─────────────────────────────────────────────
    let y = 74;
    doc.setTextColor(cr, cg, cb_); doc.setFont('helvetica', 'bold'); doc.setFontSize(9);
    doc.text('MOVIMIENTOS DEL PERÍODO', M, y);
    doc.setDrawColor(cr, cg, cb_); doc.setLineWidth(0.3);
    doc.line(M, y + 2, W - M, y + 2);
    y += 9;

    doc.setFillColor(cr, cg, cb_);
    doc.rect(M, y, W - M * 2, 7, 'F');
    doc.setTextColor(255, 255, 255); doc.setFont('helvetica', 'bold'); doc.setFontSize(7.5);
    doc.text('Fecha',       M + 1,      y + 5);
    doc.text('Tipo',        M + 26,     y + 5);
    doc.text('Categoría',   M + 44,     y + 5);
    doc.text('Descripción', M + 88,     y + 5);
    doc.text('Monto',       W - M - 1,  y + 5, { align: 'right' });
    y += 10;

    doc.setFont('helvetica', 'normal'); doc.setFontSize(8);
    rows.forEach((r, idx) => {
      if (y > 278) { doc.addPage(); y = 20; }
      if (idx % 2 === 0) { doc.setFillColor(248, 250, 253); doc.rect(M, y - 4, W - M * 2, 7, 'F'); }
      const isIng = r.tipo === 'ingreso';
      const [tr, tg, tb] = isIng ? [22, 163, 74] : [220, 38, 38];
      doc.setTextColor(80, 80, 80); doc.setFont('helvetica', 'normal');
      doc.text(r.fecha, M + 1, y);
      doc.setTextColor(tr, tg, tb); doc.setFont('helvetica', 'bold');
      doc.text(r.tipo, M + 26, y);
      doc.setFont('helvetica', 'normal'); doc.setTextColor(80, 80, 80);
      doc.text(r.categoria.slice(0, 20), M + 44, y);
      const desc = r.descripcion.length > 42 ? r.descripcion.slice(0, 41) + '…' : r.descripcion;
      doc.text(desc, M + 88, y);
      doc.setTextColor(tr, tg, tb); doc.setFont('helvetica', 'bold');
      doc.text(fmt(r.monto), W - M - 1, y, { align: 'right' });
      y += 7;
    });

    if (!rows.length) { doc.setTextColor(150,150,150); doc.setFont('helvetica','normal'); doc.setFontSize(9); doc.text('No hay movimientos en este período.', M, y + 4); }

    // ── Footer ────────────────────────────────────────────
    doc.setDrawColor(200, 200, 200); doc.setLineWidth(0.3);
    doc.line(M, 287, W - M, 287);
    doc.setTextColor(160, 160, 160); doc.setFont('helvetica', 'normal'); doc.setFontSize(6.5);
    doc.text('Generado con ZenSports.app — Software de gestión para clubes deportivos', M, 292);
    doc.text(`${rows.length} movimiento(s)`, W - M, 292, { align: 'right' });

    doc.save(`finanzas-${(clubNombre || 'club').replace(/\s+/g, '-')}-${filtroMes}.pdf`);
  };

  /* ── Derivados ───────────────────────────────────────── */
  const { desde: desdeFiltro, hasta: hastaFiltro } = rangoMes(filtroMes);
  const movFiltrados = movimientos.filter(m => {
    const enMes   = m.fecha >= desdeFiltro && m.fecha <= hastaFiltro;
    const enTipo  = filtroTipo === 'todos' || m.tipo === filtroTipo;
    return enMes && enTipo;
  });

  const totalIngresos = movimientos.reduce((s, m) => m.tipo === 'ingreso' ? s + Number(m.monto) : s, 0);
  const totalGastos   = movimientos.reduce((s, m) => m.tipo === 'gasto'   ? s + Number(m.monto) : s, 0);
  const saldo         = totalIngresos - totalGastos;

  // Datos del gráfico — últimos 6 meses
  const chartData = (() => {
    const meses = [];
    const now   = new Date();
    for (let i = 5; i >= 0; i--) {
      const d   = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const ym  = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const { desde, hasta } = rangoMes(ym);
      const rows = movimientos.filter(m => m.fecha >= desde && m.fecha <= hasta);
      meses.push({
        mes:      MESES_CORTOS[d.getMonth()],
        ingresos: rows.filter(r => r.tipo === 'ingreso').reduce((s, r) => s + Number(r.monto), 0),
        gastos:   rows.filter(r => r.tipo === 'gasto').reduce((s, r)   => s + Number(r.monto), 0),
      });
    }
    return meses;
  })();

  // Empleados con estado de pago en el mes vista
  const empleadosConEstado = empleados
    .filter(e => e.activo)
    .map(e => ({
      ...e,
      pago: pagosNomina.find(p => p.empleado_id === e.id),
    }));

  const totalNominaMes = empleadosConEstado.reduce((s, e) => s + Number(e.salario_mensual || 0), 0);
  const totalPagadoMes = empleadosConEstado.reduce((s, e) => e.pago ? s + Number(e.pago.monto) : s, 0);

  /* ── Estilos compartidos ─────────────────────────────── */
  const cardCls    = 'bg-[var(--bg-card)] border border-[var(--border-sub)] rounded-2xl p-5';
  const inputCls   = 'w-full px-3 py-2.5 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-sub)] text-[var(--text-pri)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--cc)]/30 focus:border-[var(--cc)]';
  const selectCls  = inputCls;
  const tabBtn     = (active) => `px-4 py-2 rounded-xl text-sm font-semibold transition ${active ? 'bg-[var(--cc)] text-white' : 'text-[var(--text-sec)] hover:text-[var(--text-pri)]'}`;

  if (loading) return (
    <div className="flex items-center justify-center py-20">
      <Loader2 className="w-6 h-6 animate-spin text-[var(--cc)]" />
    </div>
  );

  return (
    <div className="space-y-5 max-w-6xl mx-auto">

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-xl font-bold text-[var(--text-pri)]">Finanzas</h2>
          <p className="text-sm text-[var(--text-sec)]">Ingresos, gastos y nómina del club</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => { setShowForm(true); setForm(FORM_EMPTY); }}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[var(--cc)] text-white text-sm font-semibold hover:opacity-90 transition">
            <Plus className="w-4 h-4" /> Nuevo movimiento
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 flex-wrap">
        {[['balance','Balance'],['movimientos','Movimientos'],['nomina','Nómina'],['torneos','Torneos']].map(([id,label]) => (
          <button key={id} onClick={() => setTab(id)} className={tabBtn(tab === id)}>{label}</button>
        ))}
      </div>

      {/* ══════════════════════════════════════════
          TAB BALANCE
      ══════════════════════════════════════════ */}
      {tab === 'balance' && (
        <div className="space-y-5">

          {/* KPIs */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <KpiCard icon={TrendingUp} label="Total Ingresos" value={fmt(totalIngresos)} color="#22C55E" sub="Todos los tiempos" />
            <KpiCard icon={TrendingDown} label="Total Gastos"  value={fmt(totalGastos)}  color="#EF4444" sub="Todos los tiempos" />
            <KpiCard icon={Wallet} label="Saldo neto" value={fmt(saldo)} color={saldo >= 0 ? '#22C55E' : '#EF4444'} sub={saldo >= 0 ? 'Superávit' : 'Déficit'} />
          </div>

          {/* Gráfica */}
          <div className={cardCls}>
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm font-semibold text-[var(--text-pri)]">Últimos 6 meses</p>
              <div className="flex gap-3 text-xs">
                <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-[#22C55E] inline-block" />Ingresos</span>
                <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-[#EF4444] inline-block" />Gastos</span>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={220}>
              <ComposedChart data={chartData} barCategoryGap="30%">
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-sub)" vertical={false} />
                <XAxis dataKey="mes" tick={{ fill: 'var(--text-sec)', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: 'var(--text-sec)', fontSize: 10 }} axisLine={false} tickLine={false}
                  tickFormatter={v => v >= 1000000 ? `${(v/1000000).toFixed(1)}M` : v >= 1000 ? `${(v/1000).toFixed(0)}k` : v} />
                <Tooltip
                  contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border-sub)', borderRadius: 10, fontSize: 12 }}
                  formatter={(val, name) => [fmt(val), name === 'ingresos' ? 'Ingresos' : 'Gastos']}
                />
                <Bar dataKey="ingresos" fill="#22C55E" radius={[6,6,0,0]} maxBarSize={40} />
                <Bar dataKey="gastos"   fill="#EF4444" radius={[6,6,0,0]} maxBarSize={40} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>

          {/* Exportar */}
          <div className={`${cardCls} flex items-center justify-between flex-wrap gap-3`}>
            <div>
              <p className="text-sm font-semibold text-[var(--text-pri)] mb-1">Exportar estado financiero</p>
              <select value={filtroMes} onChange={e => setFiltroMes(e.target.value)} className={`${selectCls} w-auto`}>
                {Array.from({ length: 12 }, (_, i) => {
                  const d  = new Date(); d.setMonth(d.getMonth() - i);
                  const ym = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;
                  return <option key={ym} value={ym}>{mesLabel(ym)}</option>;
                })}
              </select>
            </div>
            <div className="flex gap-2">
              <button onClick={exportarPDF}
                className="flex items-center gap-2 px-4 py-2 rounded-xl border border-[var(--border-sub)] text-sm font-semibold text-[var(--text-sec)] hover:text-[var(--cc)] hover:border-[var(--cc)]/40 transition">
                <FileText className="w-4 h-4" /> PDF
              </button>
              <button onClick={() => exportCSV(movFiltrados, `finanzas-${filtroMes}.csv`)}
                className="flex items-center gap-2 px-4 py-2 rounded-xl border border-[var(--border-sub)] text-sm font-semibold text-[var(--text-sec)] hover:text-[var(--cc)] hover:border-[var(--cc)]/40 transition">
                <Download className="w-4 h-4" /> CSV
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════
          TAB MOVIMIENTOS
      ══════════════════════════════════════════ */}
      {tab === 'movimientos' && (
        <div className="space-y-4">

          {/* Filtros */}
          <div className="flex flex-wrap gap-3 items-center">
            <select value={filtroMes} onChange={e => setFiltroMes(e.target.value)} className={`${selectCls} w-auto`}>
              {Array.from({ length: 12 }, (_, i) => {
                const d  = new Date(); d.setMonth(d.getMonth() - i);
                const ym = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;
                return <option key={ym} value={ym}>{mesLabel(ym)}</option>;
              })}
            </select>
            <div className="flex gap-1.5">
              {[['todos','Todos'],['ingreso','Ingresos'],['gasto','Gastos']].map(([v,l]) => (
                <button key={v} onClick={() => setFiltroTipo(v)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${filtroTipo === v ? 'bg-[var(--cc)] text-white' : 'bg-[var(--bg-surface)] text-[var(--text-sec)] hover:text-[var(--text-pri)]'}`}>
                  {l}
                </button>
              ))}
            </div>
            <div className="ml-auto flex gap-2">
              <button onClick={() => exportarPDF()}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[var(--border-sub)] text-xs font-semibold text-[var(--text-sec)] hover:text-[var(--cc)] hover:border-[var(--cc)]/40 transition">
                <FileText className="w-3.5 h-3.5" /> PDF
              </button>
              <button onClick={() => exportCSV(movFiltrados, `finanzas-${filtroMes}.csv`)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[var(--border-sub)] text-xs font-semibold text-[var(--text-sec)] hover:text-[var(--cc)] hover:border-[var(--cc)]/40 transition">
                <Download className="w-3.5 h-3.5" /> CSV
              </button>
            </div>
          </div>

          {/* Resumen del mes */}
          {(() => {
            const ing   = movFiltrados.filter(r => r.tipo === 'ingreso').reduce((s, r) => s + Number(r.monto), 0);
            const gas   = movFiltrados.filter(r => r.tipo === 'gasto').reduce((s, r)   => s + Number(r.monto), 0);
            const sal   = ing - gas;
            return (
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-[#22C55E]/10 border border-[#22C55E]/20 rounded-xl p-3 text-center">
                  <p className="text-xs text-[var(--text-sec)] mb-1">Ingresos</p>
                  <p className="text-base font-bold text-[#22C55E]">{fmt(ing)}</p>
                </div>
                <div className="bg-[#EF4444]/10 border border-[#EF4444]/20 rounded-xl p-3 text-center">
                  <p className="text-xs text-[var(--text-sec)] mb-1">Gastos</p>
                  <p className="text-base font-bold text-[#EF4444]">{fmt(gas)}</p>
                </div>
                <div className={`${sal >= 0 ? 'bg-[#22C55E]/10 border-[#22C55E]/20' : 'bg-[#EF4444]/10 border-[#EF4444]/20'} border rounded-xl p-3 text-center`}>
                  <p className="text-xs text-[var(--text-sec)] mb-1">Saldo</p>
                  <p className={`text-base font-bold ${sal >= 0 ? 'text-[#22C55E]' : 'text-[#EF4444]'}`}>{fmt(sal)}</p>
                </div>
              </div>
            );
          })()}

          {/* Tabla */}
          <div className={cardCls}>
            {movFiltrados.length === 0 ? (
              <p className="text-center text-sm text-[var(--text-sec)] py-8">No hay movimientos en este período</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-[var(--border-sub)]">
                      {['Fecha','Tipo','Categoría','Descripción','Monto',''].map(h => (
                        <th key={h} className="text-left py-2 px-3 text-xs text-[var(--text-sec)] font-medium">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {movFiltrados.map(r => (
                      <tr key={r.id} className="border-b border-[var(--border-sub)] hover:bg-[var(--bg-surface)] transition-colors">
                        <td className="py-2 px-3 text-[var(--text-sec)] text-xs whitespace-nowrap">{r.fecha}</td>
                        <td className="py-2 px-3">
                          <span className={`px-2 py-0.5 rounded-lg text-xs font-semibold ${r.tipo === 'ingreso' ? 'bg-[#22C55E]/12 text-[#22C55E]' : 'bg-[#EF4444]/12 text-[#EF4444]'}`}>
                            {r.tipo === 'ingreso' ? '↑ Ingreso' : '↓ Gasto'}
                          </span>
                        </td>
                        <td className="py-2 px-3 text-[var(--text-sec)] text-xs">{r.categoria}</td>
                        <td className="py-2 px-3 text-[var(--text-pri)] max-w-[200px]">
                          <span className="block truncate" title={r.descripcion}>{r.descripcion || '—'}</span>
                        </td>
                        <td className={`py-2 px-3 font-semibold whitespace-nowrap ${r.tipo === 'ingreso' ? 'text-[#22C55E]' : 'text-[#EF4444]'}`}>
                          {r.tipo === 'gasto' ? '-' : ''}{fmt(r.monto)}
                        </td>
                        <td className="py-2 px-3">
                          <button onClick={() => eliminarMovimiento(r.id)}
                            className="p-1.5 rounded-lg border border-red-500/20 text-red-400 hover:bg-red-500/10 transition">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════
          TAB NÓMINA
      ══════════════════════════════════════════ */}
      {tab === 'nomina' && (
        <div className="space-y-5">

          {/* Selector de mes + resumen */}
          <div className="flex flex-wrap gap-3 items-center justify-between">
            <div className="flex items-center gap-3">
              <select value={mesVista} onChange={e => setMesVista(e.target.value)} className={`${selectCls} w-auto`}>
                {Array.from({ length: 12 }, (_, i) => {
                  const d  = new Date(); d.setMonth(d.getMonth() - i);
                  const ym = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;
                  return <option key={ym} value={ym}>{mesLabel(ym)}</option>;
                })}
              </select>
              <span className="text-sm text-[var(--text-sec)]">
                {totalPagadoMes > 0 && `Pagado: ${fmt(totalPagadoMes)} / ${fmt(totalNominaMes)}`}
              </span>
            </div>
            <button onClick={() => { setShowEmpForm(true); setEmpForm(EMP_EMPTY); setEmpEditId(null); }}
              className="flex items-center gap-2 px-4 py-2 rounded-xl border border-[var(--cc)]/40 text-[var(--cc)] text-sm font-semibold hover:bg-[var(--cc)]/10 transition">
              <Plus className="w-4 h-4" /> Agregar empleado
            </button>
          </div>

          {/* Lista de empleados */}
          <div className={cardCls}>
            {empleadosConEstado.length === 0 ? (
              <div className="text-center py-10">
                <Users className="w-10 h-10 text-[var(--text-mut)] mx-auto mb-3" />
                <p className="text-sm text-[var(--text-sec)]">No hay empleados registrados</p>
                <button onClick={() => setShowEmpForm(true)}
                  className="mt-3 text-sm text-[var(--cc)] hover:underline">+ Agregar el primero</button>
              </div>
            ) : (
              <div className="space-y-2">
                {empleadosConEstado.map(emp => (
                  <div key={emp.id}
                    className="flex items-center gap-3 p-3 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-sub)] flex-wrap">
                    {/* Avatar */}
                    <div className="w-9 h-9 rounded-full bg-[var(--cc)]/15 border border-[var(--cc)]/25 flex items-center justify-center flex-shrink-0 text-[var(--cc)] font-bold text-sm">
                      {emp.nombre.charAt(0).toUpperCase()}
                    </div>
                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-[var(--text-pri)] leading-tight">{emp.nombre}</p>
                      <p className="text-xs text-[var(--text-sec)]">{emp.cargo || 'Sin cargo'} · {fmt(emp.salario_mensual)}/mes</p>
                    </div>
                    {/* Estado del mes */}
                    {emp.pago ? (
                      <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#22C55E]/12 text-[#22C55E] text-xs font-semibold">
                        <CheckCircle className="w-3.5 h-3.5" /> Pagado {mesLabel(mesVista)}
                      </span>
                    ) : (
                      <button onClick={() => pagarNomina(emp)}
                        className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[var(--cc)]/12 text-[var(--cc)] border border-[var(--cc)]/25 text-xs font-semibold hover:bg-[var(--cc)]/20 transition">
                        <Wallet className="w-3.5 h-3.5" /> Pagar {mesLabel(mesVista)}
                      </button>
                    )}
                    {/* Editar */}
                    <button onClick={() => { setEmpEditId(emp.id); setEmpForm({ nombre: emp.nombre, cargo: emp.cargo, salario_mensual: emp.salario_mensual }); setShowEmpForm(true); }}
                      className="p-1.5 rounded-lg border border-[var(--border-sub)] text-[var(--text-sec)] hover:text-[var(--cc)] hover:border-[var(--cc)]/40 transition">
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Historial de pagos del mes */}
          {pagosNomina.length > 0 && (
            <div className={cardCls}>
              <p className="text-sm font-semibold text-[var(--text-pri)] mb-3">Historial — {mesLabel(mesVista)}</p>
              <div className="space-y-2">
                {pagosNomina.map(p => (
                  <div key={p.id} className="flex items-center justify-between text-sm py-1.5 border-b border-[var(--border-sub)] last:border-0">
                    <span className="text-[var(--text-pri)]">{p.nomina_empleados?.nombre || '—'}</span>
                    <span className="text-xs text-[var(--text-sec)]">{p.nomina_empleados?.cargo}</span>
                    <span className="text-xs text-[var(--text-sec)]">{p.fecha_pago}</span>
                    <span className="font-semibold text-[#22C55E]">{fmt(p.monto)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ═══════════════════════════════════════════════
          MODAL — Nuevo movimiento
      ═══════════════════════════════════════════════ */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          onClick={() => setShowForm(false)}>
          <div className="bg-[var(--bg-card)] border border-[var(--border-sub)] rounded-2xl w-full max-w-md shadow-2xl"
            onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border-sub)]">
              <p className="font-semibold text-[var(--text-pri)]">Nuevo movimiento</p>
              <button onClick={() => setShowForm(false)} className="text-[var(--text-sec)] hover:text-[var(--text-pri)]"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={guardarMovimiento} className="p-6 space-y-4">
              {formError && (
                <div className="flex items-center gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />{formError}
                </div>
              )}
              {/* Tipo */}
              <div className="grid grid-cols-2 gap-2">
                {[['ingreso','↑ Ingreso','#22C55E'],['gasto','↓ Gasto','#EF4444']].map(([v,l,col]) => (
                  <button key={v} type="button" onClick={() => setForm(f => ({ ...f, tipo: v, categoria: v === 'ingreso' ? catsIngreso[0] : catsGasto[0] }))}
                    style={form.tipo === v ? { background: col + '20', borderColor: col + '60', color: col } : {}}
                    className={`py-2.5 rounded-xl border text-sm font-semibold transition ${form.tipo === v ? 'border-current' : 'border-[var(--border-sub)] text-[var(--text-sec)] hover:text-[var(--text-pri)]'}`}>
                    {l}
                  </button>
                ))}
              </div>
              {/* Categoría */}
              <div>
                <label className="block text-xs text-[var(--text-sec)] mb-1.5 font-medium">Categoría</label>
                <div className="flex gap-2">
                  <select value={form.categoria} onChange={e => setForm(f => ({ ...f, categoria: e.target.value }))} className={`${selectCls} flex-1`}>
                    {(form.tipo === 'ingreso' ? catsIngreso : catsGasto).map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                    <option value="__nueva__">+ Nueva categoría…</option>
                  </select>
                </div>
                {form.categoria === '__nueva__' && (
                  <div className="flex gap-2 mt-2">
                    <input value={nuevaCat} onChange={e => setNuevaCat(e.target.value)}
                      placeholder="Nombre de la categoría"
                      className={`${inputCls} flex-1`} />
                    <button type="button"
                      onClick={async () => {
                        if (!nuevaCat.trim()) return;
                        const lista = form.tipo === 'ingreso'
                          ? [...catsIngreso, nuevaCat.trim()]
                          : [...catsGasto, nuevaCat.trim()];
                        await guardarCategorias(form.tipo, lista);
                        setForm(f => ({ ...f, categoria: nuevaCat.trim() }));
                        setNuevaCat('');
                      }}
                      className="px-3 py-2 rounded-xl bg-[var(--cc)] text-white text-sm font-semibold hover:opacity-90 transition whitespace-nowrap">
                      Guardar
                    </button>
                  </div>
                )}
              </div>
              {/* Descripción */}
              <div>
                <label className="block text-xs text-[var(--text-sec)] mb-1.5 font-medium">Descripción</label>
                <input value={form.descripcion} onChange={e => setForm(f => ({ ...f, descripcion: e.target.value }))}
                  placeholder="Detalle opcional…" className={inputCls} />
              </div>
              {/* Monto + Fecha */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-[var(--text-sec)] mb-1.5 font-medium">Monto *</label>
                  <input type="number" min="1" required value={form.monto}
                    onChange={e => setForm(f => ({ ...f, monto: e.target.value }))} className={inputCls} />
                </div>
                <div>
                  <label className="block text-xs text-[var(--text-sec)] mb-1.5 font-medium">Fecha *</label>
                  <input type="date" required value={form.fecha}
                    onChange={e => setForm(f => ({ ...f, fecha: e.target.value }))} className={inputCls} />
                </div>
              </div>
              <button type="submit" disabled={guardando}
                className="w-full py-2.5 rounded-xl bg-[var(--cc)] text-white font-semibold text-sm hover:opacity-90 transition disabled:opacity-50 flex items-center justify-center gap-2">
                {guardando ? <><Loader2 className="w-4 h-4 animate-spin" /> Guardando…</> : 'Guardar movimiento'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════
          MODAL — Empleado
      ═══════════════════════════════════════════════ */}
      {showEmpForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          onClick={() => setShowEmpForm(false)}>
          <div className="bg-[var(--bg-card)] border border-[var(--border-sub)] rounded-2xl w-full max-w-sm shadow-2xl"
            onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border-sub)]">
              <p className="font-semibold text-[var(--text-pri)]">{empEditId ? 'Editar empleado' : 'Nuevo empleado'}</p>
              <button onClick={() => setShowEmpForm(false)} className="text-[var(--text-sec)] hover:text-[var(--text-pri)]"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={guardarEmpleado} className="p-6 space-y-4">
              <div>
                <label className="block text-xs text-[var(--text-sec)] mb-1.5 font-medium">Nombre *</label>
                <input required value={empForm.nombre} onChange={e => setEmpForm(f => ({ ...f, nombre: e.target.value }))}
                  placeholder="Ej: Carlos Pérez" className={inputCls} />
              </div>
              <div>
                <label className="block text-xs text-[var(--text-sec)] mb-1.5 font-medium">Cargo</label>
                <input value={empForm.cargo} onChange={e => setEmpForm(f => ({ ...f, cargo: e.target.value }))}
                  placeholder="Ej: Entrenador, Asistente…" className={inputCls} />
              </div>
              <div>
                <label className="block text-xs text-[var(--text-sec)] mb-1.5 font-medium">Salario mensual</label>
                <input type="number" min="0" value={empForm.salario_mensual}
                  onChange={e => setEmpForm(f => ({ ...f, salario_mensual: e.target.value }))} className={inputCls} />
              </div>
              <button type="submit" disabled={guardandoEmp}
                className="w-full py-2.5 rounded-xl bg-[var(--cc)] text-white font-semibold text-sm hover:opacity-90 transition disabled:opacity-50 flex items-center justify-center gap-2">
                {guardandoEmp ? <><Loader2 className="w-4 h-4 animate-spin" /> Guardando…</> : empEditId ? 'Actualizar' : 'Agregar empleado'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════
          TAB TORNEOS
      ══════════════════════════════════════════ */}
      {tab === 'torneos' && (() => {
        const fmtCOP = (n) => `$${parseFloat(n || 0).toLocaleString('es-CO')}`;
        const inscritosDelTorneo = torneoSeleccionado
          ? torneosEnrollments.filter(e => e.nombre_torneo === torneoSeleccionado)
          : [];
        const yaInscritos = new Set(inscritosDelTorneo.map(e => String(e.cedula)));
        const jugadoresDisponibles = jugadoresClub.filter(j => !yaInscritos.has(String(j.cedula)));
        const chipEstado = (estado) => {
          if (estado === 'AL_DIA')   return 'px-2 py-0.5 rounded-lg text-[10px] font-bold bg-green-500/15 text-green-400 border border-green-500/20';
          if (estado === 'ABONO')    return 'px-2 py-0.5 rounded-lg text-[10px] font-bold bg-yellow-500/15 text-yellow-400 border border-yellow-500/20';
          return 'px-2 py-0.5 rounded-lg text-[10px] font-bold bg-red-500/15 text-red-400 border border-red-500/20';
        };
        const labelEstado = (e) => e.estado === 'AL_DIA' ? 'Al día' : e.estado === 'ABONO' ? 'Abono' : 'Pendiente';

        return (
          <div className="space-y-5">

            {/* Vista: lista de torneos */}
            {!torneoSeleccionado && (
              <div className="space-y-4">

                {/* Header + botón crear */}
                <div className="flex items-center justify-between flex-wrap gap-3">
                  <div>
                    <h3 className="text-base font-bold text-[var(--text-pri)] flex items-center gap-2">
                      <Trophy className="w-4 h-4 text-[var(--cc)]" /> Torneos
                    </h3>
                    <p className="text-xs text-[var(--text-sec)] mt-0.5">Gestiona torneos y la inscripción de jugadores</p>
                  </div>
                  <button onClick={() => setShowTorneoForm(v => !v)}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[var(--cc)] text-white text-sm font-semibold hover:opacity-90 transition">
                    <Plus className="w-4 h-4" /> Nuevo torneo
                  </button>
                </div>

                {/* Formulario crear torneo */}
                {showTorneoForm && (
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
                      <button onClick={() => { setShowTorneoForm(false); setTorneoForm({ nombre: '', fecha: '', valor: '' }); }}
                        className="px-4 py-2 rounded-xl border border-[var(--cc20)] text-[var(--text-sec)] text-sm hover:text-[var(--text-pri)] transition">
                        Cancelar
                      </button>
                      <button onClick={guardarTorneoDef} disabled={!torneoForm.nombre.trim() || torneoGuardando}
                        className="px-4 py-2 rounded-xl bg-[var(--cc)] text-white text-sm font-semibold disabled:opacity-40 hover:opacity-90 transition">
                        {torneoGuardando ? 'Guardando…' : 'Crear torneo'}
                      </button>
                    </div>
                  </div>
                )}

                {/* Lista de torneos definidos */}
                {torneosDef.length === 0 ? (
                  <div className="bg-[var(--bg-card)] border border-[var(--cc20)] rounded-2xl p-10 text-center">
                    <Trophy className="w-10 h-10 text-[var(--text-mut)] mx-auto mb-3" />
                    <p className="text-sm text-[var(--text-sec)]">No hay torneos creados aún.</p>
                    <p className="text-xs text-[var(--text-mut)] mt-1">Crea tu primer torneo con el botón de arriba.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {torneosDef.map((t, idx) => {
                      const inscritos = torneosEnrollments.filter(e => e.nombre_torneo === t.nombre);
                      const pagados   = inscritos.filter(e => e.estado === 'AL_DIA').length;
                      const abonos    = inscritos.filter(e => e.estado === 'ABONO').length;
                      const pendientes = inscritos.filter(e => e.estado === 'PENDIENTE').length;
                      const editando  = torneoDefEditIdx === idx;
                      return (
                        <div key={idx} className="bg-[var(--bg-card)] border border-[var(--cc20)] rounded-2xl p-5 space-y-3">
                          {editando ? (
                            <div className="space-y-3">
                              <input value={torneoDefEditForm.nombre} onChange={e => setTorneoDefEditForm(f => ({ ...f, nombre: e.target.value }))}
                                className="w-full bg-[var(--bg-app)] border border-[var(--cc20)] rounded-xl px-3 py-2 text-sm text-[var(--text-pri)] focus:outline-none focus:border-[var(--cc)]" />
                              <div className="grid grid-cols-2 gap-2">
                                <input type="date" value={torneoDefEditForm.fecha} onChange={e => setTorneoDefEditForm(f => ({ ...f, fecha: e.target.value }))}
                                  className="bg-[var(--bg-app)] border border-[var(--cc20)] rounded-xl px-3 py-2 text-sm text-[var(--text-pri)]" style={{ colorScheme: 'dark' }} />
                                <input type="number" value={torneoDefEditForm.valor} onChange={e => setTorneoDefEditForm(f => ({ ...f, valor: e.target.value }))}
                                  placeholder="Valor" className="bg-[var(--bg-app)] border border-[var(--cc20)] rounded-xl px-3 py-2 text-sm text-[var(--text-pri)]" />
                              </div>
                              <div className="flex gap-2">
                                <button onClick={() => setTorneoDefEditIdx(null)} className="flex-1 py-2 rounded-xl border border-[var(--cc20)] text-[var(--text-sec)] text-xs">Cancelar</button>
                                <button onClick={editarTorneoDef} disabled={torneoGuardando} className="flex-1 py-2 rounded-xl bg-[var(--cc)] text-white text-xs font-bold disabled:opacity-40">
                                  {torneoGuardando ? '…' : 'Guardar'}
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
                                  <button onClick={() => { setTorneoDefEditIdx(idx); setTorneoDefEditForm({ nombre: t.nombre, fecha: t.fecha || '', valor: String(t.valor || '') }); }}
                                    className="p-1.5 rounded-lg text-[var(--text-sec)] hover:text-[var(--cc)] hover:bg-[var(--cc12)] transition">
                                    <Pencil className="w-3.5 h-3.5" />
                                  </button>
                                  <button onClick={() => eliminarTorneoDef(idx)}
                                    className="p-1.5 rounded-lg text-[var(--text-sec)] hover:text-red-400 hover:bg-red-500/10 transition">
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>
                              {/* Resumen pagos */}
                              <div className="flex gap-2 flex-wrap">
                                <span className="px-2 py-1 rounded-lg text-[10px] font-bold bg-[var(--bg-surface)] text-[var(--text-sec)]">{inscritos.length} inscritos</span>
                                {pagados > 0   && <span className="px-2 py-1 rounded-lg text-[10px] font-bold bg-green-500/12 text-green-400">{pagados} al día</span>}
                                {abonos > 0    && <span className="px-2 py-1 rounded-lg text-[10px] font-bold bg-yellow-500/12 text-yellow-400">{abonos} abono</span>}
                                {pendientes > 0 && <span className="px-2 py-1 rounded-lg text-[10px] font-bold bg-red-500/12 text-red-400">{pendientes} pendiente</span>}
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
              </div>
            )}

            {/* Vista: detalle de torneo seleccionado */}
            {torneoSeleccionado && (() => {
              const def = torneosDef.find(t => t.nombre === torneoSeleccionado);
              const pagados    = inscritosDelTorneo.filter(e => e.estado === 'AL_DIA').length;
              const abonos     = inscritosDelTorneo.filter(e => e.estado === 'ABONO').length;
              const pendientes = inscritosDelTorneo.filter(e => e.estado === 'PENDIENTE').length;
              const totalRecaudado = inscritosDelTorneo.reduce((s, e) => s + parseFloat(e.valor_pagado || 0), 0);

              return (
                <div className="space-y-4">
                  {/* Cabecera detalle */}
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
                    <button onClick={exportarPDFTorneo}
                      className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[var(--cc12)] border border-[var(--cc)]/30 text-[var(--cc)] text-sm font-semibold hover:bg-[var(--cc20)] transition">
                      <Download className="w-4 h-4" /> PDF
                    </button>
                  </div>

                  {/* KPIs */}
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
                    <p className="text-lg font-bold text-[var(--cc)]">{fmtCOP(totalRecaudado)}</p>
                  </div>

                  {/* Añadir jugador */}
                  <div className="bg-[var(--bg-card)] border border-[var(--cc20)] rounded-2xl p-4">
                    <p className="text-xs font-semibold text-[var(--text-sec)] mb-3 flex items-center gap-2">
                      <UserPlus className="w-3.5 h-3.5" /> Añadir jugador al torneo
                    </p>
                    <div className="flex gap-2">
                      <select value={addJugadorCedula} onChange={e => setAddJugadorCedula(e.target.value)}
                        className="flex-1 bg-[var(--bg-app)] border border-[var(--cc20)] rounded-xl px-3 py-2 text-sm text-[var(--text-pri)] focus:outline-none focus:border-[var(--cc)]">
                        <option value="">— Seleccionar jugador —</option>
                        {jugadoresDisponibles.map(j => (
                          <option key={j.cedula} value={j.cedula}>
                            {j.nombre} {j.apellidos} — CC {j.cedula}
                          </option>
                        ))}
                      </select>
                      <button onClick={inscribirJugador} disabled={!addJugadorCedula || addJugandoLoading}
                        className="px-4 py-2 rounded-xl bg-[var(--cc)] text-white text-sm font-bold disabled:opacity-40 hover:opacity-90 transition flex items-center gap-2">
                        {addJugandoLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                        Inscribir
                      </button>
                    </div>
                  </div>

                  {/* Lista de inscritos */}
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
                              const jugador = jugadoresClub.find(j => String(j.cedula) === String(e.cedula));
                              const nombre  = jugador ? `${jugador.nombre} ${jugador.apellidos || ''}`.trim() : `CC ${e.cedula}`;
                              return (
                                <tr key={e.id} className="border-b border-[var(--cc20)] hover:bg-[var(--bg-surface)] transition">
                                  <td className="py-2.5 px-4">
                                    <p className="font-medium text-[var(--text-pri)] text-xs">{nombre}</p>
                                    <p className="text-[var(--text-mut)] text-[10px]">CC {e.cedula}</p>
                                  </td>
                                  <td className="py-2.5 px-4">
                                    <span className={chipEstado(e.estado)}>{labelEstado(e)}</span>
                                  </td>
                                  <td className="py-2.5 px-4 text-[var(--text-sec)] text-xs">{fmtCOP(e.valor_oficial)}</td>
                                  <td className="py-2.5 px-4 text-green-400 font-semibold text-xs">{fmtCOP(e.valor_pagado)}</td>
                                  <td className="py-2.5 px-4 text-red-400 text-xs">{fmtCOP(e.saldo_pendiente)}</td>
                                  <td className="py-2.5 px-4">
                                    {e.estado !== 'AL_DIA' && (
                                      <div className="flex items-center gap-1.5">
                                        <input
                                          type="number" min={0}
                                          value={pagoEdit[e.id] || ''}
                                          onChange={ev => setPagoEdit(p => ({ ...p, [e.id]: ev.target.value }))}
                                          placeholder={`Total pagado`}
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
                                    <button onClick={() => quitarInscripcion(e.id)}
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
      })()}

    </div>
  );
}

/* ── Componente auxiliar KPI ──────────────────────────────── */
function KpiCard({ icon: Icon, label, value, color, sub }) {
  return (
    <div className="bg-[var(--bg-card)] border border-[var(--border-sub)] rounded-2xl p-5">
      <div className="flex items-center gap-3 mb-3">
        <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: color + '20' }}>
          <Icon className="w-5 h-5" style={{ color }} />
        </div>
        <p className="text-xs text-[var(--text-sec)] font-medium">{label}</p>
      </div>
      <p className="text-2xl font-bold text-[var(--text-pri)]" style={{ color }}>{value}</p>
      {sub && <p className="text-xs text-[var(--text-sec)] mt-1">{sub}</p>}
    </div>
  );
}
