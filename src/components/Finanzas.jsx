import { useState, useEffect, useCallback } from 'react';
import {
  TrendingUp, TrendingDown, Wallet, Plus, Trash2, Loader2,
  Users, ChevronDown, ChevronUp, Download, FileText, X,
  CheckCircle, AlertCircle, Pencil, CalendarDays,
} from 'lucide-react';
import {
  ComposedChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import { authFetch } from '../lib/authFetch';
import { getClubId } from '../services/api';
import { formatMoney, getCodigoPais } from '../lib/formatMoney';
import { supabase } from '../lib/supabase';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'https://api.zensports.zenpra.ai/api';

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

async function exportCSV(rows, filename) {
  const XLSX = await import('xlsx');
  const headers = ['Fecha', 'Tipo', 'Categoría', 'Descripción', 'Monto'];
  const data = rows.map(r => [r.fecha, r.tipo, r.categoria, r.descripcion, r.monto]);

  const ws = XLSX.utils.aoa_to_sheet([headers, ...data]);
  ws['!cols'] = [{ wch: 12 }, { wch: 10 }, { wch: 18 }, { wch: 35 }, { wch: 14 }];
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Finanzas');
  XLSX.writeFile(wb, filename.replace('.csv', '.xlsx'));
}

export default function Finanzas({ color = 'var(--cc)', clubNombre = 'Mi Club', clubConfig }) {
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

  // Modal preparar año siguiente
  const mesHoy        = new Date().getMonth(); // 0-based (10=Nov, 11=Dic)
  const anioSiguiente = new Date().getFullYear() + 1;
  const cuotaActual   = parseFloat(clubConfig?.valor_mensualidad) || 0;
  const [showAnioModal,  setShowAnioModal]  = useState(false);
  const [cuotaCambia,    setCuotaCambia]    = useState(false);
  const [nuevaCuota,     setNuevaCuota]     = useState('');
  const [generando,      setGenerando]      = useState(false);
  const [anioResultado,  setAnioResultado]  = useState(null);

  const prepararAnio = async () => {
    setGenerando(true);
    setAnioResultado(null);
    try {
      const body = { anio: anioSiguiente };
      if (cuotaCambia && nuevaCuota) body.nueva_cuota = parseFloat(nuevaCuota);
      const res  = await authFetch(`${API_BASE}/invoices/generar-anio?club_id=${clubId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      setAnioResultado(data);
    } catch {
      setAnioResultado({ success: false, error: 'Error de conexión' });
    } finally {
      setGenerando(false);
    }
  };

  const cerrarAnioModal = () => {
    setShowAnioModal(false);
    setCuotaCambia(false);
    setNuevaCuota('');
    setAnioResultado(null);
  };

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
      generarComprobantePago(empleado, monto, mesVista);
    } catch (e) { console.error(e); }
  };

  /* ── Comprobante PDF de nómina ──────────────────────── */
  const generarComprobantePago = async (empleado, monto, mes) => {
    const acHex = (typeof color === 'string' && color.startsWith('#')) ? color : '#E14924';
    const cr = parseInt(acHex.slice(1, 3), 16);
    const cg = parseInt(acHex.slice(3, 5), 16);
    const cb = parseInt(acHex.slice(5, 7), 16);

    const { default: jsPDF } = await import('jspdf');
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: [105, 148] }); // A6
    const W = 105;
    const M = 10;
    const ahora = new Date();
    const fechaStr = ahora.toLocaleDateString('es-CO', { day: '2-digit', month: 'long', year: 'numeric' });
    const horaStr  = ahora.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' });

    const drawHeader = () => {
      doc.setFillColor(cr, cg, cb);
      doc.rect(0, 0, W, 22, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.setTextColor(255, 255, 255);
      doc.text(clubNombre || 'Mi Club', M, 10);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7);
      doc.setTextColor(255, 255, 255, 0.8);
      doc.text('COMPROBANTE DE PAGO DE NÓMINA', M, 16);
      doc.setFillColor(255, 255, 255, 0.15);
      doc.rect(0, 22, W, 0.5, 'F');
    };

    const drawRow = (label, value, y, shade) => {
      if (shade) { doc.setFillColor(245, 247, 252); doc.rect(M - 2, y - 4, W - M * 2 + 4, 8, 'F'); }
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(100, 110, 130);
      doc.text(label, M, y);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(20, 30, 50);
      doc.text(String(value || '—'), W - M, y, { align: 'right' });
    };

    drawHeader();

    // Cargo logo si existe
    if (clubConfig?.logo_url) {
      try {
        await new Promise(resolve => {
          const img = new Image();
          img.crossOrigin = 'anonymous';
          img.onload = () => {
            const canvas = document.createElement('canvas');
            canvas.width = img.width; canvas.height = img.height;
            canvas.getContext('2d').drawImage(img, 0, 0);
            doc.addImage(canvas.toDataURL('image/png'), 'PNG', W - M - 12, 4, 12, 12);
            resolve();
          };
          img.onerror = resolve;
          img.src = clubConfig.logo_url;
        });
      } catch { /* logo opcional, no bloquea el PDF */ }
    }

    let y = 32;
    drawRow('Empleado',   empleado.nombre,             y, false); y += 10;
    drawRow('Cargo',      empleado.cargo || '—',       y, true);  y += 10;
    drawRow('Mes pagado', mesLabel(mes),                y, false); y += 10;
    drawRow('Monto',      fmt(monto),                  y, true);  y += 10;
    drawRow('Fecha',      fechaStr,                    y, false); y += 10;
    drawRow('Hora',       horaStr,                     y, true);  y += 10;
    drawRow('Método',     'Nómina',                    y, false); y += 14;

    doc.setDrawColor(cr, cg, cb);
    doc.setLineWidth(0.4);
    doc.line(M, y, W - M, y);
    y += 6;

    doc.setFont('helvetica', 'italic');
    doc.setFontSize(7);
    doc.setTextColor(150, 160, 180);
    doc.text('Generado por ZenSports · zensports.zenpra.ai', W / 2, y, { align: 'center' });

    const nombreArchivo = `comprobante-nomina-${(empleado.nombre || 'empleado').replace(/\s+/g, '-').toLowerCase()}-${mes}.pdf`;
    doc.save(nombreArchivo);
  };

  /* ── Exportar PDF ────────────────────────────────────── */
  const exportarPDF = async () => {
    const { default: jsPDF } = await import('jspdf');
    const doc   = new jsPDF();
    const W     = 210;
    const M     = 14;
    const acHex = (typeof color === 'string' && color.startsWith('#')) ? color : '#E14924';
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
      } catch { /* logo opcional, no bloquea el PDF */ }
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
    doc.text('FECHA',       M + 1,      y + 5);
    doc.text('TIPO',        M + 26,     y + 5);
    doc.text('CATEGORÍA',   M + 44,     y + 5);
    doc.text('DESCRIPCIÓN', M + 88,     y + 5);
    doc.text('MONTO',       W - M - 1,  y + 5, { align: 'right' });
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
      doc.text((r.tipo || '').toUpperCase(), M + 26, y);
      doc.setFont('helvetica', 'normal'); doc.setTextColor(80, 80, 80);
      doc.text((r.categoria || '').toUpperCase().slice(0, 20), M + 44, y);
      const desc = r.descripcion.length > 42 ? r.descripcion.slice(0, 41) + '…' : r.descripcion;
      doc.text(desc.toUpperCase(), M + 88, y);
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
          {mesHoy >= 10 && (
            <button onClick={() => setShowAnioModal(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl border border-[var(--cc)]/40 text-[var(--cc)] text-sm font-semibold hover:bg-[var(--cc12)] transition">
              <CalendarDays className="w-4 h-4" /> Preparar {anioSiguiente}
            </button>
          )}
          <button onClick={() => { setShowForm(true); setForm(FORM_EMPTY); }}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[var(--cc)] text-white text-sm font-semibold hover:opacity-90 transition">
            <Plus className="w-4 h-4" /> Nuevo movimiento
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 flex-wrap">
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
                <Download className="w-4 h-4" /> Excel
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
                <Download className="w-3.5 h-3.5" /> Excel
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
                <table className="w-full min-w-max text-sm">
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
                        <td className="py-2 px-3 text-[var(--text-sec)] text-xs">
                          {r.categoria}
                          {r.automatico && (
                            <span className="ml-1.5 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-[var(--cc12)] text-[var(--cc)]" title="Calculado automáticamente a partir de mensualidades/uniformes/torneos — no se carga a mano">auto</span>
                          )}
                        </td>
                        <td className="py-2 px-3 text-[var(--text-pri)] max-w-[200px]">
                          <span className="block truncate" title={r.descripcion}>{r.descripcion || '—'}</span>
                        </td>
                        <td className={`py-2 px-3 font-semibold whitespace-nowrap ${r.tipo === 'ingreso' ? 'text-[#22C55E]' : 'text-[#EF4444]'}`}>
                          {r.tipo === 'gasto' ? '-' : ''}{fmt(r.monto)}
                        </td>
                        <td className="py-2 px-3">
                          {!r.automatico && (
                            <button onClick={() => eliminarMovimiento(r.id)}
                              className="p-1.5 rounded-lg border border-red-500/20 text-red-400 hover:bg-red-500/10 transition">
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
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
                    className="flex flex-col sm:flex-row sm:items-center gap-3 p-3 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-sub)]">
                    {/* Avatar + Info — su propia fila en móvil, para que el nombre tenga ancho real */}
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="w-9 h-9 rounded-full bg-[var(--cc)]/15 border border-[var(--cc)]/25 flex items-center justify-center flex-shrink-0 text-[var(--cc)] font-bold text-sm">
                        {emp.nombre.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-[var(--text-pri)] leading-tight">{emp.nombre}</p>
                        <p className="text-xs text-[var(--text-sec)]">{emp.cargo || 'Sin cargo'} · {fmt(emp.salario_mensual)}/mes</p>
                      </div>
                    </div>
                    {/* Estado del mes + Editar — su propia fila en móvil */}
                    <div className="flex items-center gap-2 shrink-0 pl-12 sm:pl-0">
                      {emp.pago ? (
                        <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#22C55E]/12 text-[#22C55E] text-xs font-semibold whitespace-nowrap">
                          <CheckCircle className="w-3.5 h-3.5" /> Pagado {mesLabel(mesVista)}
                        </span>
                      ) : (
                        <button onClick={() => pagarNomina(emp)}
                          className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[var(--cc)]/12 text-[var(--cc)] border border-[var(--cc)]/25 text-xs font-semibold hover:bg-[var(--cc)]/20 transition whitespace-nowrap">
                          <Wallet className="w-3.5 h-3.5" /> Pagar {mesLabel(mesVista)}
                        </button>
                      )}
                      {/* Editar */}
                      <button onClick={() => { setEmpEditId(emp.id); setEmpForm({ nombre: emp.nombre, cargo: emp.cargo, salario_mensual: emp.salario_mensual }); setShowEmpForm(true); }}
                        className="p-1.5 rounded-lg border border-[var(--border-sub)] text-[var(--text-sec)] hover:text-[var(--cc)] hover:border-[var(--cc)]/40 transition shrink-0">
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                    </div>
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
        <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
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
      {/* ── Modal preparar año siguiente ── */}
      {showAnioModal && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          onClick={cerrarAnioModal}>
          <div className="bg-[var(--bg-card)] border border-[var(--border-sub)] rounded-2xl w-full max-w-sm shadow-2xl"
            onClick={e => e.stopPropagation()}>

            {/* Cabecera */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border-sub)]">
              <div className="flex items-center gap-2">
                <CalendarDays className="w-5 h-5 text-[var(--cc)]" />
                <p className="font-semibold text-[var(--text-pri)]">Preparar mensualidades {anioSiguiente}</p>
              </div>
              <button onClick={cerrarAnioModal} className="text-[var(--text-sec)] hover:text-[var(--text-pri)]">
                <X className="w-5 h-5" />
              </button>
            </div>

            {!anioResultado ? (
              <div className="p-6 space-y-5">
                {/* Cuota actual */}
                <div className="flex items-center justify-between p-3 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-sub)]">
                  <span className="text-sm text-[var(--text-sec)]">Cuota mensual {new Date().getFullYear()}</span>
                  <span className="text-sm font-bold text-[var(--text-pri)]">{fmt(cuotaActual)}</span>
                </div>

                {/* Toggle cuota cambia */}
                <div>
                  <p className="text-sm font-medium text-[var(--text-pri)] mb-3">
                    ¿La cuota cambia para {anioSiguiente}?
                  </p>
                  <div className="flex gap-2">
                    {[false, true].map(v => (
                      <button key={String(v)} onClick={() => { setCuotaCambia(v); if (!v) setNuevaCuota(''); }}
                        className={`flex-1 py-2 rounded-xl text-sm font-semibold border transition ${
                          cuotaCambia === v
                            ? 'bg-[var(--cc)] text-white border-[var(--cc)]'
                            : 'bg-[var(--bg-surface)] text-[var(--text-sec)] border-[var(--border-sub)] hover:border-[var(--cc)]/40'
                        }`}>
                        {v ? 'Sí, cambia' : 'No, igual'}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Input nueva cuota */}
                {cuotaCambia && (
                  <div>
                    <label className="block text-xs text-[var(--text-sec)] mb-1.5 font-medium">
                      Nueva cuota mensual para {anioSiguiente}
                    </label>
                    <input
                      type="number" min="0" autoFocus
                      placeholder={String(cuotaActual)}
                      value={nuevaCuota}
                      onChange={e => setNuevaCuota(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-sub)] text-[var(--text-pri)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--cc)]/30 focus:border-[var(--cc)]"
                    />
                  </div>
                )}

                {/* Preview */}
                <div className="p-3 rounded-xl bg-[var(--cc12)] border border-[var(--cc)]/20 text-sm text-[var(--text-sec)]">
                  Se crearán <span className="font-semibold text-[var(--text-pri)]">12 mensualidades</span> por jugador activo
                  para el año <span className="font-semibold text-[var(--text-pri)]">{anioSiguiente}</span> en
                  estado <span className="font-semibold text-[var(--text-pri)]">PENDIENTE</span> con cuota{' '}
                  <span className="font-semibold text-[var(--cc)]">
                    {cuotaCambia && nuevaCuota ? fmt(parseFloat(nuevaCuota)) : fmt(cuotaActual)}
                  </span>.
                  {' '}Los meses que ya existan no se tocan.
                </div>

                <button
                  onClick={prepararAnio}
                  disabled={generando || (cuotaCambia && !nuevaCuota)}
                  className="w-full py-2.5 rounded-xl bg-[var(--cc)] text-white font-semibold text-sm hover:opacity-90 transition disabled:opacity-40 flex items-center justify-center gap-2">
                  {generando
                    ? <><Loader2 className="w-4 h-4 animate-spin" /> Generando…</>
                    : <><CalendarDays className="w-4 h-4" /> Confirmar y generar {anioSiguiente}</>}
                </button>
              </div>
            ) : (
              <div className="p-6 space-y-4">
                {anioResultado.success ? (
                  <>
                    <div className="flex items-center gap-3 p-4 rounded-xl bg-green-500/10 border border-green-500/20">
                      <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0" />
                      <div>
                        <p className="text-sm font-semibold text-green-400">¡Listo!</p>
                        <p className="text-xs text-[var(--text-sec)] mt-0.5">{anioResultado.message}</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div className="p-3 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-sub)]">
                        <p className="text-xs text-[var(--text-sec)]">Mensualidades creadas</p>
                        <p className="font-bold text-[var(--text-pri)] text-lg">{anioResultado.creados}</p>
                      </div>
                      <div className="p-3 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-sub)]">
                        <p className="text-xs text-[var(--text-sec)]">Cuota {anioSiguiente}</p>
                        <p className="font-bold text-[var(--cc)] text-lg">{fmt(anioResultado.cuota_usada)}</p>
                      </div>
                    </div>
                    {anioResultado.cuota_actualizada && (
                      <p className="text-xs text-[var(--text-sec)] text-center">
                        La nueva cuota quedó guardada en la configuración del club.
                      </p>
                    )}
                    {anioResultado.creados === 0 && (
                      <p className="text-xs text-[var(--text-sec)] text-center">
                        Todos los jugadores ya tenían sus 12 meses — no se creó nada nuevo.
                      </p>
                    )}
                  </>
                ) : (
                  <div className="flex items-center gap-3 p-4 rounded-xl bg-red-500/10 border border-red-500/20">
                    <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
                    <p className="text-sm text-red-400">{anioResultado.error || 'Error al generar'}</p>
                  </div>
                )}
                <button onClick={cerrarAnioModal}
                  className="w-full py-2.5 rounded-xl border border-[var(--border-sub)] text-[var(--text-sec)] text-sm font-semibold hover:text-[var(--text-pri)] transition">
                  Cerrar
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {showEmpForm && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
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
