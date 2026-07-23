import { useState, useEffect } from 'react';
import {
  Calendar, Shirt, Trophy, FileText, CheckCircle, Clock,
  AlertTriangle, XCircle, Eye, EyeOff, Loader2, PauseCircle, Package,
  MessageCircle, Wallet, Pencil, Check, X,
} from 'lucide-react';
import { API_BASE_URL } from '../config';
import { authFetch } from '../lib/authFetch';
import { getClubId } from '../services/api';
import SuspensionModal from './SuspensionModal';
import ComprobanteLink from './ComprobanteLink';

const formatCOP = (n) =>
  new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 })
    .format(parseFloat(n) || 0);

// Mismo criterio que `torneosYaIniciados` en api/routes/publico.js: un torneo
// futuro no debería aparecer como deuda/pendiente en el estado de cuenta. Si
// no se puede determinar la fecha (inscripción vieja sin torneo_id, o torneo
// sin fecha configurada), se muestra igual para no ocultar una deuda real.
function torneosYaIniciados(torneosConfig, torneosJugador) {
  const hoyStr = new Date(Date.now() - 5 * 3600000).toISOString().slice(0, 10);
  const fechaTorneo = (torneoId) => (torneosConfig || []).find(td => String(td.id) === String(torneoId))?.fecha || null;
  return (torneosJugador || []).filter(t => {
    const f = fechaTorneo(t.torneo_id);
    return !f || f <= hoyStr;
  });
}

const ESTADO_ICON = {
  AL_DIA:    { icon: CheckCircle,   color: 'text-green-400',  bg: 'bg-green-400/10 border border-green-400/20'   },
  PENDIENTE: { icon: Clock,         color: 'text-[#F59E0B]',  bg: 'bg-yellow-500/10 border border-yellow-500/20' },
  PARCIAL:   { icon: AlertTriangle, color: 'text-[var(--cc)]',  bg: 'bg-[var(--cc)]/10 border border-[var(--cc)]/20'   },
  MORA:      { icon: XCircle,       color: 'text-[#EF4444]',  bg: 'bg-red-500/10 border border-red-500/20'       },
  EXENTO:    { icon: CheckCircle,   color: 'text-sky-400',    bg: 'bg-sky-400/10 border border-sky-400/20'       },
};

const ESTADO_PEDIDO = {
  PENDIENTE: { color: 'text-[#F59E0B]', bg: 'bg-yellow-500/10 border border-yellow-500/20', label: 'Pendiente de pago' },
  PAGADO:    { color: 'text-green-400', bg: 'bg-green-400/10 border border-green-400/20',   label: 'Pagado'           },
  ENTREGADO: { color: 'text-[var(--cc)]', bg: 'bg-[var(--cc)]/10 border border-[var(--cc)]/20',  label: 'Entregado'        },
};

const MOTIVO_LABEL = {
  LESION: 'Lesión', VIAJE: 'Viaje',
  RETIRO_TEMPORAL: 'Retiro temporal', OTRO: 'Otro motivo',
};

const ORIGEN_CONFIG = {
  TRANSFERENCIA:           { label: 'WhatsApp',    icon: MessageCircle, color: 'text-green-400',  bg: 'bg-green-400/10 border border-green-400/20'   },
  TRANSFERENCIA_EXCEDENTE: { label: 'Saldo favor', icon: Wallet,        color: 'text-[#B68631]',  bg: 'bg-[#B68631]/10 border border-[#B68631]/20'   },
  MANUAL:                  { label: 'Manual',      icon: Pencil,        color: 'text-[var(--text-sec)]',  bg: 'bg-[var(--text-sec)]/10 border border-[var(--text-sec)]/20'   },
};

function OrigenBadge({ origen }) {
  const cfg = ORIGEN_CONFIG[origen];
  if (!cfg) return null;
  const Icon = cfg.icon;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${cfg.bg} ${cfg.color}`}>
      <Icon className="w-3 h-3" />{cfg.label}
    </span>
  );
}

function EmptySection({ texto }) {
  return <div className="text-center py-6 text-[var(--text-sec)] text-sm">{texto}</div>;
}

function EstadoBadge({ estado }) {
  const config = ESTADO_ICON[estado] || ESTADO_ICON.PENDIENTE;
  const Icon = config.icon;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${config.bg} ${config.color}`}>
      <Icon className="w-3 h-3" />{estado}
    </span>
  );
}

function SuspendidoBadge({ motivo, detalle, cancelada }) {
  return (
    <div className="flex items-center gap-2 flex-wrap">
      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${
        cancelada ? 'bg-[var(--bg-surface)]/20 text-[var(--text-sec)] border-[var(--bg-surface)]/30'
                  : 'bg-yellow-400/10 text-yellow-400 border-yellow-400/20'
      }`}>
        <PauseCircle className="w-3 h-3" /> NO APLICA
      </span>
      <span className="text-xs text-[var(--text-sec)]">
        {MOTIVO_LABEL[motivo] || motivo}{detalle ? ` · ${detalle}` : ''}
        {cancelada && <span className="ml-1 italic">(anulada)</span>}
      </span>
    </div>
  );
}

const MESES_LABEL = ['','Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];

// AL_DIA implica pagado = oficial; PENDIENTE/MORA implican pagado = 0 (nada
// pagado). PARCIAL no tiene un monto único correcto — lo define el admin.
function valorPagadoSegunEstado(estado, valorOficial, valorPagadoActual) {
  if (estado === 'AL_DIA') return valorOficial;
  if (estado === 'PENDIENTE' || estado === 'MORA') return 0;
  return valorPagadoActual;
}

function FilaMensualidad({ m, susp, onUpdated, esExentoGlobal = false, cuotaClub = 0 }) {
  const [editando, setEditando] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [form, setForm] = useState({});

  const nombreMes        = m.mes || MESES_LABEL[parseInt(m.numero_mes)] || '';
  const penalidad        = parseFloat(m.penalidad) || 0;
  const totalDeuda       = (parseFloat(m.valor_oficial) || 0) + penalidad;
  const esExentoIndividual = !esExentoGlobal && m.estado === 'EXENTO';

  const abrirEdit = () => {
    // Si el mes tiene estado EXENTO heredado (no debe existir por mes),
    // restaurar valor_oficial a la cuota del club y calcular estado correcto.
    const esExentoLegacy  = m.estado === 'EXENTO';
    const oficialRestaurado = esExentoLegacy
      ? cuotaClub
      : (parseFloat(m.valor_oficial) || cuotaClub);
    const pagado   = parseFloat(m.valor_pagado) || 0;
    const totalRec = oficialRestaurado + (parseFloat(m.penalidad) || 0);
    const estadoRec = esExentoLegacy
      ? (pagado >= totalRec ? 'AL_DIA' : pagado > 0 ? 'PARCIAL' : 'PENDIENTE')
      : (m.estado || 'PENDIENTE');

    setForm({
      valor_oficial:   oficialRestaurado,
      valor_pagado:    pagado,
      estado:          estadoRec,
      anular_penalidad: false,
    });
    setEditando(true);
  };

  const guardar = async () => {
    setGuardando(true);
    try {
      if (form.estado === 'NO_APLICA') {
        // "No aplica" es un atajo del mismo mecanismo de suspensión — crea la
        // suspensión (motivo retiro temporal) y el backend sincroniza la
        // mensualidad a SUSPENDIDO, igual que "Gestionar suspensión".
        const res  = await authFetch(`${API_BASE_URL}/suspensiones?club_id=${getClubId()}`, {
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
          body:    JSON.stringify({
            cedula:     m.cedula,
            motivo:     'RETIRO_TEMPORAL',
            mes_inicio: m.numero_mes,
            mes_fin:    m.numero_mes,
            anio:       m.anio,
          }),
        });
        const data = await res.json();
        if (data.success) {
          setEditando(false);
          onUpdated({ id: m.id, estado: 'SUSPENDIDO', saldo_pendiente: 0, valor_oficial: 0 });
        }
        return;
      }
      const body = {
        valor_oficial: form.valor_oficial,
        // Se recalcula acá (no solo en el onChange del selector) porque si el
        // dropdown ya abría con este estado preseleccionado, onChange nunca dispara.
        valor_pagado:  valorPagadoSegunEstado(form.estado, form.valor_oficial, form.valor_pagado),
        estado:        form.estado,
        ...(form.anular_penalidad ? { penalidad: 0 } : {}),
      };
      const res  = await authFetch(`${API_BASE_URL}/invoices/mensualidad/${m.id}?club_id=${getClubId()}`, {
        method:  'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(body),
      });
      const data = await res.json();
      if (data.success) { setEditando(false); onUpdated(data.data); }
    } catch (e) { console.error(e); }
    finally { setGuardando(false); }
  };

  const INPUT_SM = 'w-full bg-[var(--bg-card)] border border-[var(--cc20)] text-[var(--text-pri)] rounded-lg px-2 py-1.5 text-xs outline-none focus:border-[var(--cc)]';

  const rowBg = esExentoGlobal
    ? 'bg-sky-400/5 border-sky-400/15'
    : (susp || esExentoIndividual)
      ? 'bg-yellow-400/5 border-yellow-400/20'
      : 'bg-[var(--bg-surface)] border-[var(--bg-surface)]';

  return (
    <div className={`p-3 rounded-xl border ${rowBg}`}>
      {!editando ? (
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <span className="text-sm font-medium text-[var(--text-pri)] w-16 flex-shrink-0">{nombreMes}</span>
            {esExentoGlobal
              ? <EstadoBadge estado="EXENTO" />
              : susp
                ? <SuspendidoBadge motivo={susp.motivo} detalle={susp.detalle} cancelada={!susp.activa} />
                : <EstadoBadge estado={esExentoIndividual ? 'EXENTO' : m.estado} />}
          </div>
          <div className="flex items-center gap-2 flex-shrink-0 ml-2">
            <p className="text-sm font-medium text-[var(--text-pri)]">
              {esExentoGlobal
                ? <><span>$0</span><span className="text-[var(--text-sec)]"> / {formatCOP(cuotaClub)}</span></>
                : susp
                  ? <><span>$0</span><span className="text-[var(--text-sec)]"> / $0</span></>
                  : <>{formatCOP(m.valor_pagado)}<span className="text-[var(--text-sec)]"> / {formatCOP(totalDeuda)}</span></>}
            </p>
            {!susp && (
              <button onClick={abrirEdit} className="p-1 rounded-lg text-[var(--text-mut)] hover:text-[var(--cc)] hover:bg-[var(--cc12)] transition-colors">
                <Pencil className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          <p className="text-xs font-semibold text-[var(--text-pri)]">{nombreMes} — Editar</p>
          {form.estado !== 'NO_APLICA' && (
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[10px] text-[var(--text-sec)] mb-1">Valor oficial</label>
                <input type="number" className={INPUT_SM} value={form.valor_oficial}
                  onFocus={e => e.target.select()}
                  onChange={e => setForm(f => ({ ...f, valor_oficial: parseFloat(e.target.value) || 0 }))} />
              </div>
              <div>
                <label className="block text-[10px] text-[var(--text-sec)] mb-1">
                  Valor pagado{form.estado !== 'PARCIAL' ? ' (según estado)' : ''}
                </label>
                <input type="number" className={`${INPUT_SM} ${form.estado !== 'PARCIAL' ? 'opacity-50 cursor-not-allowed' : ''}`}
                  value={form.valor_pagado}
                  disabled={form.estado !== 'PARCIAL'}
                  onFocus={e => e.target.select()}
                  onChange={e => setForm(f => ({ ...f, valor_pagado: parseFloat(e.target.value) || 0 }))} />
              </div>
            </div>
          )}
          <div>
            <label className="block text-[10px] text-[var(--text-sec)] mb-1">Estado</label>
            <select className={INPUT_SM} value={form.estado} onChange={e => {
              const estado = e.target.value;
              setForm(f => ({ ...f, estado, valor_pagado: valorPagadoSegunEstado(estado, f.valor_oficial, f.valor_pagado) }));
            }}>
              <option value="AL_DIA">AL_DIA</option>
              <option value="PENDIENTE">PENDIENTE</option>
              <option value="PARCIAL">PARCIAL</option>
              <option value="MORA">MORA</option>
              <option value="NO_APLICA">NO APLICA (retiro temporal)</option>
            </select>
          </div>
          {form.estado === 'NO_APLICA' ? (
            <p className="text-xs text-yellow-400/80">
              Se creará una suspensión por retiro temporal para {nombreMes} — la mensualidad queda en $0 y no cuenta como deuda. Para revertirlo, usá "Gestionar suspensión".
            </p>
          ) : penalidad > 0 && (
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={form.anular_penalidad || false}
                onChange={e => setForm(f => ({ ...f, anular_penalidad: e.target.checked }))}
                className="w-3.5 h-3.5 accent-[var(--cc)]"
              />
              <span className="text-xs text-[#EF4444]">Anular penalidad ({formatCOP(penalidad)})</span>
            </label>
          )}
          <div className="flex gap-2 pt-1">
            <button onClick={guardar} disabled={guardando}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-[var(--cc)] text-white text-xs font-semibold rounded-lg disabled:opacity-50">
              {guardando ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />} Guardar
            </button>
            <button onClick={() => setEditando(false)}
              className="flex items-center gap-1.5 px-3 py-1.5 border border-[var(--cc20)] text-[var(--text-sec)] text-xs rounded-lg">
              <X className="w-3 h-3" /> Cancelar
            </button>
          </div>
        </div>
      )}
      {penalidad > 0 && !editando && (
        <div className="flex items-center gap-1.5 mt-1.5 ml-[76px]">
          <AlertTriangle className="w-3 h-3 text-[#EF4444] flex-shrink-0" />
          <span className="text-xs text-[#EF4444]">Penalidad por mora: {formatCOP(penalidad)}</span>
        </div>
      )}
    </div>
  );
}

function ordenarMensualidades(datos) {
  return [...(datos || [])]
    .filter(m => parseInt(m.numero_mes) >= 1 && parseInt(m.numero_mes) <= 12)
    .sort((a, b) => parseInt(a.numero_mes) - parseInt(b.numero_mes));
}

function SeccionMensualidades({ datos, suspensiones = [], onMensualidadUpdated, esExentoGlobal = false, cuotaClub = 0, jugador }) {
  const [items, setItems] = useState(() => ordenarMensualidades(datos));
  const [gestionandoSuspension, setGestionandoSuspension] = useState(false);

  // Re-sincroniza items cuando datos cambia (nuevo fetch del padre), preservando
  // los parches optimistas locales de handleUpdated entre un cambio y otro.
  const [prevDatos, setPrevDatos] = useState(datos);
  if (datos !== prevDatos) {
    setPrevDatos(datos);
    setItems(ordenarMensualidades(datos));
  }

  if (!items.length) return <EmptySection texto="Sin datos de mensualidades" />;

  const anioActual = new Date().getFullYear();
  const mesActual  = new Date().getMonth() + 1;

  const isMesSuspendido = (numero_mes) => {
    const n = parseInt(numero_mes);
    return suspensiones.some(s => s.activa && s.anio === anioActual && s.mes_inicio <= n && n <= s.mes_fin);
  };

  // Solo cuenta como pendiente lo ya causado (mes actual o anterior) — los meses
  // futuros del año aún no se han facturado y no deben sumar al saldo pendiente.
  const yaCausado = (m) => {
    const anioM = parseInt(m.anio) || anioActual;
    const mesM  = parseInt(m.numero_mes);
    return anioM < anioActual || (anioM === anioActual && mesM <= mesActual);
  };

  const totalPagado    = items.reduce((s, m) => s + (parseFloat(m.valor_pagado) || 0), 0);
  const totalPendiente = items.reduce((s, m) =>
    s + (!yaCausado(m) || isMesSuspendido(m.numero_mes) ? 0 : (parseFloat(m.saldo_pendiente) || 0)), 0);
  const totalSusp = items.filter(m => isMesSuspendido(m.numero_mes)).length;

  const getSuspension = (numero_mes) => {
    const n = parseInt(numero_mes);
    return suspensiones.find(s => s.activa && s.anio === anioActual && s.mes_inicio <= n && n <= s.mes_fin) || null;
  };

  const handleUpdated = (updated) => {
    setItems(prev => prev.map(m => m.id === updated.id ? { ...m, ...updated } : m));
    onMensualidadUpdated?.();
  };

  return (
    <div>
      <div className="flex items-center gap-2 mb-3 flex-wrap">
        <Calendar className="w-5 h-5 text-[var(--cc)]" />
        <h3 className="text-base font-semibold text-[var(--text-pri)]">Mensualidades 2026</h3>
        {totalSusp > 0 && (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-400/10 text-yellow-400 border border-yellow-400/20">
            <PauseCircle className="w-3 h-3" /> {totalSusp} suspendido{totalSusp > 1 ? 's' : ''}
          </span>
        )}
        {jugador && (
          <button
            onClick={() => setGestionandoSuspension(true)}
            className="ml-auto flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition text-[var(--text-mut)] hover:text-yellow-400 hover:bg-yellow-400/10 border-transparent hover:border-yellow-400/20"
          >
            <PauseCircle className="w-3.5 h-3.5" /> Gestionar suspensión
          </button>
        )}
      </div>
      <div className="grid grid-cols-2 gap-2 mb-3">
        <div className="bg-[var(--cc12)] rounded-xl p-3 border border-[var(--cc)]/20">
          <p className="text-xs text-[var(--text-sec)]">Total pagado</p>
          <p className="text-lg font-bold text-[var(--cc)]">{formatCOP(totalPagado)}</p>
        </div>
        <div className="bg-[rgba(245,158,11,0.08)] rounded-xl p-3 border border-yellow-500/20">
          <p className="text-xs text-[var(--text-sec)]">Saldo pendiente</p>
          <p className="text-lg font-bold text-[#F59E0B]">{formatCOP(totalPendiente)}</p>
        </div>
      </div>
      <div className="space-y-2">
        {items.map((m, i) => (
          <FilaMensualidad key={m.id || i} m={m} susp={getSuspension(m.numero_mes)} onUpdated={handleUpdated} esExentoGlobal={esExentoGlobal} cuotaClub={cuotaClub} />
        ))}
      </div>
      {gestionandoSuspension && jugador && (
        <SuspensionModal
          jugador={jugador}
          onClose={() => setGestionandoSuspension(false)}
          onSuccess={onMensualidadUpdated}
        />
      )}
    </div>
  );
}

function SeccionPedidoUniforme({ cedula }) {
  const [pedidos, setPedidos]   = useState([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    authFetch(`${API_BASE_URL}/uniforms?club_id=${getClubId()}`)
      .then(r => r.json())
      .then(data => {
        if (data.success) {
          // Un jugador puede tener más de un pedido (el suyo propio + el de
          // cada familiar, que comparte su cédula) — antes solo se mostraba
          // el primero que encontraba y el resto quedaba invisible acá.
          const encontrados = (data.data || []).filter(p => String(p.cedula) === String(cedula));
          setPedidos(encontrados);
        }
      })
      .catch(console.error)
      .finally(() => setCargando(false));
  }, [cedula]);

  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <Shirt className="w-5 h-5 text-[var(--cc)]" />
        <h3 className="text-base font-semibold text-[var(--text-pri)]">Uniforme</h3>
      </div>
      {cargando ? (
        <div className="flex items-center gap-2 py-4 text-[var(--text-sec)]">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span className="text-sm">Cargando pedido...</span>
        </div>
      ) : pedidos.length === 0 ? (
        <EmptySection texto="Sin pedido de uniforme registrado" />
      ) : (
        <div className="space-y-3">
          {pedidos.map(pedido => {
            const cfg = ESTADO_PEDIDO[pedido.estado] || ESTADO_PEDIDO.PENDIENTE;
            const prendasDetalle = pedido.prendas_detalle || [];
            const prendasPlano = pedido.prendas
              ? pedido.prendas.split(',').map(s => s.trim()).filter(Boolean)
              : [];
            return (
              <div key={pedido.id} className="bg-[var(--bg-surface)] border border-[var(--bg-surface)] rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {pedido.tipo && pedido.tipo !== 'Jugador' && (
                      <span className="px-2 py-0.5 rounded-lg text-[10px] font-medium bg-[rgba(198,120,255,0.12)] text-[#C678FF] border border-[#C678FF]/20">{pedido.tipo}</span>
                    )}
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${cfg.bg} ${cfg.color}`}>
                      {pedido.estado === 'PENDIENTE' && <Clock className="w-3 h-3" />}
                      {pedido.estado === 'PAGADO'    && <CheckCircle className="w-3 h-3" />}
                      {pedido.estado === 'ENTREGADO' && <Package className="w-3 h-3" />}
                      {cfg.label}
                    </span>
                  </div>
                  <span className="text-sm font-bold text-[var(--cc)]">{formatCOP(pedido.total)}</span>
                </div>
                {prendasDetalle.length > 0 ? (
                  <div>
                    <p className="text-xs text-[var(--text-sec)] mb-1.5">Prendas</p>
                    <div className="space-y-1.5">
                      {prendasDetalle.map(pr => {
                        const totalItem = (Number(pr.precio_unitario) || 0) * (pr.cantidad || 1);
                        const saldoItem = totalItem - (Number(pr.valor_pagado) || 0);
                        return (
                          <div key={pr.id} className="flex items-center justify-between px-2.5 py-1.5 rounded-lg bg-[var(--bg-card)] border border-[var(--bg-surface)] text-xs">
                            <span className="text-[var(--text-pri)]">{pr.nombre}{pr.cantidad > 1 ? ` x${pr.cantidad}` : ''}</span>
                            <span className="text-[var(--text-sec)]">
                              {formatCOP(pr.valor_pagado)} / {formatCOP(totalItem)}
                              {saldoItem > 0 && <span className="text-[#F5A623] ml-1.5">· Saldo {formatCOP(saldoItem)}</span>}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ) : prendasPlano.length > 0 && (
                  <div>
                    <p className="text-xs text-[var(--text-sec)] mb-1.5">Prendas</p>
                    <div className="flex flex-wrap gap-1.5">
                      {prendasPlano.map((p, i) => (
                        <span key={i} className="px-2.5 py-1 rounded-lg bg-[var(--bg-card)] border border-[var(--bg-surface)] text-xs text-[var(--text-pri)]">{p}</span>
                      ))}
                    </div>
                  </div>
                )}
                <div className="grid grid-cols-3 gap-2 pt-1 border-t border-[var(--bg-surface)]">
                  <div>
                    <p className="text-xs text-[var(--text-sec)]">Talla</p>
                    <p className="text-sm font-semibold text-[var(--text-pri)]">{pedido.talla || '—'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-[var(--text-sec)]">Número</p>
                    <p className="text-sm font-semibold text-[var(--text-pri)] font-mono">#{pedido.numero_estampar || '—'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-[var(--text-sec)]">Estampa</p>
                    <p className="text-sm font-semibold text-[var(--text-pri)] truncate">{pedido.nombre_estampar || '—'}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function SeccionTorneos({ datos }) {
  if (!datos || datos.length === 0) return <EmptySection texto="Sin torneos registrados" />;
  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <Trophy className="w-5 h-5 text-[#B68631]" />
        <h3 className="text-base font-semibold text-[var(--text-pri)]">Torneos</h3>
      </div>
      <div className="space-y-2">
        {datos.map((t, i) => (
          <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-[var(--bg-surface)] border border-[var(--bg-surface)]">
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium text-[var(--text-pri)]">{t.nombre_torneo || 'Torneo'}</span>
              <EstadoBadge estado={t.estado} />
            </div>
            <p className="text-sm font-medium text-[var(--text-pri)]">
              {formatCOP(t.valor_pagado)} <span className="text-[var(--text-sec)]">/ {formatCOP(t.valor_inscrito ?? t.valor_oficial)}</span>
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

function SeccionHistorialLazy({ cedula }) {
  const [visible, setVisible]             = useState(false);
  const [cargando, setCargando]           = useState(false);
  const [transacciones, setTransacciones] = useState([]);
  const [cargado, setCargado]             = useState(false);
  const [error, setError]                 = useState('');

  const cargarHistorial = async () => {
    if (visible && cargado) { setVisible(false); return; }
    setVisible(true);
    if (cargado) return;
    setCargando(true);
    setError('');
    try {
      const res  = await authFetch(`${API_BASE_URL}/payments?club_id=${getClubId()}&cedula=${cedula}&limit=50`);
      const data = await res.json();
      if (data.success) {
        const sorted = (data.data || [])
          .filter(p => p.estado_revision === 'aprobado_manual')
          .sort((a, b) => (b.created_at || '').localeCompare(a.created_at || ''));
        setTransacciones(sorted);
        setCargado(true);
      } else {
        setError('No se pudo cargar el historial');
      }
    } catch {
      setError('Error de conexión al cargar historial');
    } finally {
      setCargando(false);
    }
  };

  const estadoColor = (e) => {
    if (e?.includes('manual'))     return 'text-[#F59E0B] bg-yellow-500/10';
    if (e?.includes('automatica')) return 'text-green-400 bg-green-400/10';
    return 'text-[var(--text-sec)] bg-[var(--bg-card)]';
  };
  const estadoLabel = (e) => {
    if (e === 'aprobado_manual')          return 'Manual';
    if (e === 'aprobado_automaticamente') return 'Automático';
    return e || '—';
  };
  const conceptoLabel = (c) => {
    if (!c) return '—';
    try {
      const p = JSON.parse(c);
      if (Array.isArray(p) && p.length > 0) return p.map(x => x.descripcion || x.tipo).join(', ');
    } catch { return c; }
    return c;
  };

  return (
    <div>
      <button
        onClick={cargarHistorial}
        className="w-full flex items-center justify-between p-4 rounded-xl bg-[var(--cc12)] border border-[var(--cc)]/20 hover:bg-[var(--cc12)] transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-[var(--cc12)] flex items-center justify-center">
            <FileText className="w-4 h-4 text-[var(--cc)]" />
          </div>
          <div className="text-left">
            <p className="text-sm font-semibold text-[var(--text-pri)]">Historial de transacciones</p>
            <p className="text-xs text-[var(--text-sec)]">
              {cargado ? `${transacciones.length} registro${transacciones.length !== 1 ? 's' : ''}` : 'Clic para cargar'}
            </p>
          </div>
        </div>
        {cargando  ? <Loader2 className="w-4 h-4 text-[var(--cc)] animate-spin" />
          : visible ? <EyeOff className="w-4 h-4 text-[var(--cc)]" />
          :           <Eye    className="w-4 h-4 text-[var(--cc)]" />}
      </button>

      {visible && (
        <div className="mt-3 space-y-2">
          {cargando && (
            <div className="flex items-center justify-center py-8 gap-2 text-[var(--text-sec)]">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span className="text-sm">Cargando historial...</span>
            </div>
          )}
          {error && (
            <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-sm text-[#EF4444]">{error}</div>
          )}
          {!cargando && !error && transacciones.length === 0 && (
            <div className="text-center py-6 text-[var(--text-sec)] text-sm">Sin transacciones registradas</div>
          )}
          {!cargando && transacciones.map((p, i) => (
            <div key={i} className="p-3 rounded-xl bg-[var(--bg-surface)] border border-[var(--bg-surface)]">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-bold text-[var(--text-pri)]">{formatCOP(p.suma_conceptos || p.monto)}</span>
                <span className="text-xs text-[var(--text-sec)]">
                  {p.fecha_comprobante || p.fecha_proceso || (p.created_at ? new Date(p.created_at).toLocaleDateString('es-CO') : '—')}
                </span>
              </div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-[var(--text-sec)]">{p.banco || '—'}</span>
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${estadoColor(p.estado_revision)}`}>
                  {estadoLabel(p.estado_revision)}
                </span>
              </div>
              <div className="flex items-center justify-between mt-1">
                {p.concepto ? <p className="text-xs text-[var(--text-sec)]">{conceptoLabel(p.concepto)}</p> : <span />}
                <OrigenBadge origen={p.tipo_origen} />
              </div>
              {p.referencia && <p className="text-xs text-[var(--text-sec)]">Ref: {p.referencia}</p>}
              {p.mensaje_alerta && <p className="text-xs text-[var(--cc)] mt-1 italic">📝 {p.mensaje_alerta}</p>}
              {p.url_comprobante && (
                <ComprobanteLink url={p.url_comprobante}
                  className="text-xs text-[var(--cc)] hover:underline mt-1 inline-block">
                  📎 Ver comprobante
                </ComprobanteLink>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const MOTIVOS_EXENTO = [
  { key: 'BECA',      label: 'Beca deportiva'  },
  { key: 'SOCIAL',    label: 'Caso social'      },
  { key: 'DIRECTIVO', label: 'Directivo/Staff'  },
  { key: 'OTRO',      label: 'Otro motivo'      },
];

// Extrae el texto del motivo desde el campo notas: "[Exento: texto]"
function extraerMotivoExento(notas) {
  if (!notas) return null;
  const match = notas.match(/^\[Exento:\s*(.+?)\]/);
  return match ? match[1].trim() : null;
}

export default function FinancieroContent({ cedula, jugador, mensualidades = [], torneos = [], suspensiones = [], onMensualidadUpdated, onJugadorUpdated, clubConfig }) {
  const misMensualidades = mensualidades.filter(m => String(m.cedula || m.player_id || '') === String(cedula));
  const misTorneos       = torneosYaIniciados(clubConfig?.torneos_iniciales, torneos.filter(t => String(t.cedula || t.player_id || '') === String(cedula)));
  const misSuspensiones  = suspensiones.filter(s => s.cedula === String(cedula));

  const descuento = Number(jugador?.descuento_pct ?? 0);
  const tipoLabel = { BECA_DEPORTIVA: 'Beca Deportiva', BECA_SOCIAL: 'Beca Social', CONDICION_ESPECIAL: 'Condición Especial' };
  const tipoTexto = tipoLabel[jugador?.tipo_descuento] ?? '';

  const calcEsExento = (j) => Number(j?.descuento_pct) >= 100;
  const [esExento,        setEsExento]        = useState(() => calcEsExento(jugador));
  const [motivoDisplay,   setMotivoDisplay]   = useState(() => extraerMotivoExento(jugador?.notas));
  const [cambiandoExento, setCambiandoExento] = useState(false);
  const [eligiendoMotivo, setEligiendoMotivo] = useState(false);
  const [motivoSel,       setMotivoSel]       = useState(null);
  const [motivoOtroTexto, setMotivoOtroTexto] = useState('');
  const [errorExento,     setErrorExento]     = useState('');

  useEffect(() => {
    setEsExento(Number(jugador?.descuento_pct) >= 100);
    setMotivoDisplay(extraerMotivoExento(jugador?.notas));
  }, [jugador?.descuento_pct, jugador?.notas]);

  const resetSelector = () => { setEligiendoMotivo(false); setMotivoSel(null); setMotivoOtroTexto(''); setErrorExento(''); };

  const confirmarExento = async () => {
    setCambiandoExento(true);
    setEligiendoMotivo(false);
    setErrorExento('');
    try {
      const body = {
        exento: true,
        ...(motivoSel ? { motivo: motivoSel } : {}),
        ...(motivoSel === 'OTRO' && motivoOtroTexto.trim() ? { motivoTexto: motivoOtroTexto.trim() } : {}),
      };
      const res  = await authFetch(`${API_BASE_URL}/players/${cedula}/exento?club_id=${getClubId()}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (data.success) {
        setEsExento(true);
        setMotivoDisplay(data.motivo_label || null);
        onJugadorUpdated?.({ descuento_pct: 100, tipo_descuento: null, notas: data.motivo_label ? `[Exento: ${data.motivo_label}]` : jugador?.notas });
        setMotivoOtroTexto('');
      } else {
        setErrorExento(data.error || 'No se pudo marcar como exento');
      }
    } catch (e) {
      console.error(e);
      setErrorExento('Error de conexión — intenta de nuevo');
    } finally { setCambiandoExento(false); setMotivoSel(null); }
  };

  const quitarExento = async () => {
    setCambiandoExento(true);
    setErrorExento('');
    try {
      const res  = await authFetch(`${API_BASE_URL}/players/${cedula}/exento?club_id=${getClubId()}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ exento: false }),
      });
      const data = await res.json();
      if (data.success) {
        setEsExento(false);
        setMotivoDisplay(null);
        onJugadorUpdated?.({ descuento_pct: 0, tipo_descuento: null });
      } else {
        setErrorExento(data.error || 'No se pudo quitar la exención');
      }
    } catch (e) {
      console.error(e);
      setErrorExento('Error de conexión — intenta de nuevo');
    } finally { setCambiandoExento(false); }
  };

  return (
    <div className="space-y-8">
      {/* Franja EXENTO */}
      <div className={`rounded-xl border transition-colors ${
        esExento ? 'bg-sky-400/10 border-sky-400/20' : 'bg-[var(--bg-surface)] border-[var(--bg-surface)]'
      }`}>
        <div className="flex items-center justify-between gap-3 px-4 py-3">
          <div className="flex items-center gap-2 min-w-0">
            {esExento ? (
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sky-400 text-sm font-bold">EXENTO</span>
                  {motivoDisplay && <span className="text-xs text-sky-300/80 font-medium">· {motivoDisplay}</span>}
                </div>
                <p className="text-xs text-[var(--text-sec)] mt-0.5">Sus mensualidades no generan cobro</p>
              </div>
            ) : (
              <span className="text-xs text-[var(--text-sec)]">¿Este jugador está exento de mensualidad?</span>
            )}
          </div>
          {esExento ? (
            <button
              onClick={quitarExento}
              disabled={cambiandoExento}
              className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border bg-[var(--bg-card)] border-[var(--cc20)] text-[var(--text-sec)] hover:text-red-400 hover:border-red-400/40 transition disabled:opacity-50"
            >
              {cambiandoExento ? <Loader2 className="w-3 h-3 animate-spin" /> : <><X className="w-3 h-3" /> Quitar exención</>}
            </button>
          ) : (
            <button
              onClick={() => { setEligiendoMotivo(v => !v); setMotivoSel(null); setErrorExento(''); }}
              disabled={cambiandoExento}
              className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border bg-sky-400/10 border-sky-400/20 text-sky-400 hover:bg-sky-400/20 transition disabled:opacity-50"
            >
              {cambiandoExento ? <Loader2 className="w-3 h-3 animate-spin" /> : <><Check className="w-3 h-3" /> Marcar exento</>}
            </button>
          )}
        </div>

        {/* Error visible */}
        {errorExento && (
          <div className="mx-4 mb-3 flex items-center gap-2 px-3 py-2 rounded-lg bg-red-500/10 border border-red-500/20 text-xs text-red-400">
            <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
            {errorExento}
          </div>
        )}

        {/* Selector de motivo inline */}
        {eligiendoMotivo && !esExento && (
          <div className="border-t border-sky-400/20 px-4 py-3 space-y-3">
            <p className="text-xs font-semibold text-[var(--text-sec)]">Razón de la exención <span className="font-normal">(opcional)</span></p>
            <div className="flex flex-wrap gap-2">
              {MOTIVOS_EXENTO.map(m => (
                <button
                  key={m.key}
                  onClick={() => setMotivoSel(prev => prev === m.key ? null : m.key)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition ${
                    motivoSel === m.key
                      ? 'bg-sky-400/20 border-sky-400/50 text-sky-300'
                      : 'bg-[var(--bg-card)] border-[var(--cc20)] text-[var(--text-sec)] hover:border-sky-400/30 hover:text-sky-400'
                  }`}
                >
                  {m.label}
                </button>
              ))}
            </div>
            {/* Campo libre solo cuando selecciona "Otro motivo" */}
            {motivoSel === 'OTRO' && (
              <input
                type="text"
                placeholder="Describe el motivo de la exención..."
                value={motivoOtroTexto}
                onChange={e => setMotivoOtroTexto(e.target.value)}
                maxLength={120}
                className="w-full bg-[var(--bg-card)] border border-sky-400/30 text-[var(--text-pri)] rounded-lg px-3 py-2 text-xs outline-none focus:border-sky-400 placeholder:text-[var(--text-mut)]"
              />
            )}
            <div className="flex gap-2">
              <button
                onClick={confirmarExento}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-sky-500 text-white text-xs font-semibold rounded-lg hover:bg-sky-400 transition"
              >
                <Check className="w-3 h-3" /> Confirmar exención
              </button>
              <button
                onClick={resetSelector}
                className="flex items-center gap-1.5 px-3 py-1.5 border border-[var(--cc20)] text-[var(--text-sec)] text-xs rounded-lg hover:text-[var(--text-pri)] transition"
              >
                <X className="w-3 h-3" /> Cancelar
              </button>
            </div>
          </div>
        )}
      </div>

      {descuento > 0 && tipoTexto && !esExento && (
        <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium"
          style={{ background: 'var(--cc)1a', border: '1px solid var(--cc)33', color: 'var(--cc)' }}>
          <span>🎓</span>
          <span>{tipoTexto} · {descuento}% de descuento aplicado</span>
        </div>
      )}
      <SeccionMensualidades
        datos={misMensualidades}
        suspensiones={misSuspensiones}
        onMensualidadUpdated={onMensualidadUpdated}
        esExentoGlobal={esExento}
        cuotaClub={parseFloat(clubConfig?.valor_mensualidad ?? 0)}
        jugador={jugador}
      />
      <SeccionPedidoUniforme cedula={cedula} />
      <SeccionTorneos datos={misTorneos} />
      <SeccionHistorialLazy cedula={cedula} />
    </div>
  );
}
