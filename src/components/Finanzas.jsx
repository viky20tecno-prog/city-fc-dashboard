import { useState, useEffect, useCallback } from 'react';
import {
  TrendingUp, TrendingDown, Wallet, Plus, Trash2, Loader2,
  Users, ChevronDown, ChevronUp, Download, FileText, X,
  CheckCircle, AlertCircle, Pencil,
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
  const exportarPDF = () => {
    const doc    = new jsPDF();
    const { desde, hasta } = rangoMes(filtroMes);
    const rows   = movimientos.filter(m => m.fecha >= desde && m.fecha <= hasta);
    const ing    = rows.filter(r => r.tipo === 'ingreso').reduce((s, r) => s + Number(r.monto), 0);
    const gasto  = rows.filter(r => r.tipo === 'gasto').reduce((s, r) => s + Number(r.monto), 0);

    doc.setFontSize(16); doc.setFont('helvetica', 'bold');
    doc.text(`${clubNombre} — Estado Financiero`, 14, 20);
    doc.setFontSize(11); doc.setFont('helvetica', 'normal');
    doc.text(`Período: ${mesLabel(filtroMes)}`, 14, 30);
    doc.text(`Ingresos: ${fmt(ing)}   Gastos: ${fmt(gasto)}   Saldo: ${fmt(ing - gasto)}`, 14, 38);

    let y = 52;
    doc.setFont('helvetica', 'bold');
    doc.text('Fecha', 14, y); doc.text('Tipo', 38, y); doc.text('Categoría', 58, y);
    doc.text('Descripción', 108, y); doc.text('Monto', 178, y);
    y += 4; doc.line(14, y, 196, y); y += 6;

    doc.setFont('helvetica', 'normal'); doc.setFontSize(9);
    rows.forEach(r => {
      if (y > 275) { doc.addPage(); y = 20; }
      const desc = r.descripcion.length > 35 ? r.descripcion.slice(0, 34) + '…' : r.descripcion;
      doc.text(r.fecha, 14, y);
      doc.text(r.tipo, 38, y);
      doc.text(r.categoria.slice(0, 22), 58, y);
      doc.text(desc, 108, y);
      doc.text(fmt(r.monto), 178, y);
      y += 7;
    });

    doc.save(`finanzas-${filtroMes}.pdf`);
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
      <div className="flex gap-2">
        {[['balance','Balance'],['movimientos','Movimientos'],['nomina','Nómina']].map(([id,label]) => (
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
                  <button key={v} type="button" onClick={() => setForm(f => ({ ...f, tipo: v, categoria: v === 'ingreso' ? CATEGORIAS_INGRESO[0] : CATEGORIAS_GASTO[0] }))}
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
