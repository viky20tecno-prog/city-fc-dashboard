import { useState, useRef } from 'react';
import { X, Upload, FileSpreadsheet, AlertCircle, CheckCircle2, Download, Loader2, RefreshCw } from 'lucide-react';
import { API_BASE_URL } from '../config';
import { supabase } from '../lib/supabase';
import { getClubId } from '../services/api';

const MESES_ABREV = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];

async function getAuthHeaders() {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.access_token) return {};
  return { Authorization: `Bearer ${session.access_token}` };
}

function parseExcelRows(rawRows) {
  // rawRows viene del xlsx parseado en el cliente
  // Espera la fila de instrucciones (índice 0), headers (índice 1), datos desde índice 2
  const headers = rawRows[1];
  if (!headers) return [];

  const idx = {};
  headers.forEach((h, i) => { if (h) idx[String(h).trim()] = i; });

  const filas = [];
  for (let r = 2; r < rawRows.length; r++) {
    const row = rawRows[r];
    if (!row || !row[idx['Cedula']]) continue;
    const cedula = String(row[idx['Cedula']] || '').trim();
    if (!cedula) continue;

    const fila = { cedula };
    for (let mes = 1; mes <= 12; mes++) {
      const colName = `${MESES_ABREV[mes - 1]}_pagado`;
      const val = row[idx[colName]];
      fila[`mes_${mes}`] = parseFloat(val) || 0;
    }
    filas.push(fila);
  }
  return filas;
}

export default function MensualidadesImportModal({ onClose, onSuccess, color = 'var(--cc)' }) {
  const [step, setStep] = useState('idle'); // idle | parsing | preview | uploading | done | error
  const [filas, setFilas]       = useState([]);
  const [resultado, setResultado] = useState(null);
  const [errMsg, setErrMsg]     = useState('');
  const [dragOver, setDragOver] = useState(false);
  const [fileName, setFileName] = useState('');
  const inputRef = useRef(null);

  const anio = new Date().getFullYear();
  const clubId = getClubId();

  /* ── Descargar plantilla ───────────────────────────────────────────── */
  const descargarPlantilla = async () => {
    const headers = await getAuthHeaders();
    const res = await fetch(`${API_BASE_URL}/invoices/plantilla-excel?club_id=${clubId}&anio=${anio}`, { headers });
    if (!res.ok) { alert('Error al descargar la plantilla'); return; }
    const blob = await res.blob();
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href = url;
    a.download = `mensualidades-${anio}.xlsx`;
    a.click();
    URL.revokeObjectURL(url);
  };

  /* ── Parsear archivo ────────────────────────────────────────────────── */
  const parsearArchivo = async (file) => {
    setErrMsg('');
    setStep('parsing');
    setFileName(file.name);
    try {
      const XLSX = await import('xlsx');
      const data = await file.arrayBuffer();
      const wb   = XLSX.read(data, { type: 'array' });
      const ws   = wb.Sheets[wb.SheetNames[0]];
      const raw  = XLSX.utils.sheet_to_aoa(ws, { defval: '' });
      const parsed = parseExcelRows(raw);
      if (!parsed.length) { setErrMsg('No se encontraron filas válidas. Verifica que usaste la plantilla correcta.'); setStep('error'); return; }
      setFilas(parsed);
      setStep('preview');
    } catch (e) {
      setErrMsg('Error al leer el archivo: ' + e.message);
      setStep('error');
    }
  };

  const onFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) parsearArchivo(file);
  };

  const onDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) parsearArchivo(file);
  };

  /* ── Confirmar importación ─────────────────────────────────────────── */
  const confirmarImportar = async () => {
    setStep('uploading');
    try {
      const headers = await getAuthHeaders();
      const res = await fetch(`${API_BASE_URL}/invoices/importar-estados?club_id=${clubId}`, {
        method: 'POST',
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({ anio, filas }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error || 'Error en la importación');
      setResultado(json);
      setStep('done');
    } catch (e) {
      setErrMsg(e.message);
      setStep('error');
    }
  };

  /* ── Preview table ─────────────────────────────────────────────────── */
  const mesActual = new Date().getMonth() + 1;
  const mesesVisibles = Array.from({ length: mesActual }, (_, i) => i + 1);

  const colorHex = color.startsWith('#') ? color : '#6366f1';

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1000,
      background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 16,
    }}>
      <div style={{
        background: 'var(--bg-card)', border: '1px solid var(--border)',
        borderRadius: 16, width: '100%', maxWidth: 760,
        maxHeight: '90vh', display: 'flex', flexDirection: 'column',
        overflow: 'hidden',
      }}>
        {/* Header */}
        <div style={{ padding: '20px 24px 16px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
          <div>
            <div style={{ fontWeight: 700, fontSize: 16, color: 'var(--text-pri)' }}>Importar estados de mensualidades</div>
            <div style={{ fontSize: 12, color: 'var(--text-mut)', marginTop: 2 }}>Año {anio}</div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-mut)', padding: 4 }}>
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: 24, overflowY: 'auto', flex: 1 }}>

          {/* ── Paso 1: instrucciones + descarga ─── */}
          <div style={{
            background: 'var(--bg-base)', border: '1px solid var(--border)', borderRadius: 10,
            padding: 16, marginBottom: 20,
          }}>
            <div style={{ fontWeight: 600, fontSize: 13, color: 'var(--text-pri)', marginBottom: 8 }}>
              Paso 1 — Descarga la plantilla actualizada
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-sec)', lineHeight: 1.6, marginBottom: 12 }}>
              La plantilla incluye todos los jugadores activos con sus valores actuales.<br />
              Llena las columnas <strong style={{ color: colorHex }}>Ene_pagado, Feb_pagado…</strong> con el monto que cada jugador pagó en ese mes.<br />
              Deja <strong>0</strong> si no pagó. El sistema calcula el estado automáticamente.
            </div>
            <button onClick={descargarPlantilla} style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              background: `${colorHex}22`, color: colorHex,
              border: `1px solid ${colorHex}44`,
              borderRadius: 8, padding: '8px 14px', cursor: 'pointer', fontSize: 13, fontWeight: 600,
            }}>
              <Download size={14} /> Descargar plantilla Excel
            </button>
          </div>

          {/* ── Paso 2: subir archivo ─── */}
          {(step === 'idle' || step === 'error') && (
            <div style={{
              background: 'var(--bg-base)', border: '1px solid var(--border)', borderRadius: 10, padding: 16, marginBottom: 20,
            }}>
              <div style={{ fontWeight: 600, fontSize: 13, color: 'var(--text-pri)', marginBottom: 12 }}>
                Paso 2 — Sube el archivo completado
              </div>
              <div
                onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={onDrop}
                onClick={() => inputRef.current?.click()}
                style={{
                  border: `2px dashed ${dragOver ? colorHex : 'var(--border)'}`,
                  borderRadius: 10, padding: '32px 24px', textAlign: 'center', cursor: 'pointer',
                  background: dragOver ? `${colorHex}0A` : 'transparent',
                  transition: 'all 0.2s',
                }}
              >
                <FileSpreadsheet size={32} style={{ color: 'var(--text-mut)', marginBottom: 8 }} />
                <div style={{ fontSize: 13, color: 'var(--text-sec)', fontWeight: 500 }}>
                  Arrastra el archivo aquí o haz clic para seleccionarlo
                </div>
                <div style={{ fontSize: 11, color: 'var(--text-mut)', marginTop: 4 }}>.xlsx · .xls</div>
              </div>
              <input ref={inputRef} type="file" accept=".xlsx,.xls" style={{ display: 'none' }} onChange={onFileChange} />
              {errMsg && (
                <div style={{ marginTop: 12, display: 'flex', alignItems: 'flex-start', gap: 8, color: '#f87171', fontSize: 12 }}>
                  <AlertCircle size={14} style={{ flexShrink: 0, marginTop: 1 }} />
                  {errMsg}
                </div>
              )}
            </div>
          )}

          {/* ── Parsing ─── */}
          {step === 'parsing' && (
            <div style={{ textAlign: 'center', padding: '32px 0', color: 'var(--text-mut)' }}>
              <Loader2 size={28} style={{ animation: 'spin 0.8s linear infinite', marginBottom: 8 }} />
              <div style={{ fontSize: 13 }}>Leyendo archivo…</div>
            </div>
          )}

          {/* ── Preview ─── */}
          {step === 'preview' && (
            <div style={{ background: 'var(--bg-base)', border: '1px solid var(--border)', borderRadius: 10, padding: 16, marginBottom: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                <div>
                  <span style={{ fontWeight: 600, fontSize: 13, color: 'var(--text-pri)' }}>
                    {filas.length} jugadores encontrados
                  </span>
                  <span style={{ fontSize: 12, color: 'var(--text-mut)', marginLeft: 8 }}>{fileName}</span>
                </div>
                <button onClick={() => { setStep('idle'); setFilas([]); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-mut)', fontSize: 12 }}>
                  Cambiar archivo
                </button>
              </div>

              {/* Tabla preview */}
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--border)' }}>
                      <th style={{ textAlign: 'left', padding: '4px 8px', color: 'var(--text-mut)', fontWeight: 600 }}>Cédula</th>
                      {mesesVisibles.map(m => (
                        <th key={m} style={{ textAlign: 'right', padding: '4px 8px', color: 'var(--text-mut)', fontWeight: 600, minWidth: 64 }}>
                          {MESES_ABREV[m - 1]}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filas.slice(0, 8).map((f, i) => (
                      <tr key={i} style={{ borderBottom: '1px solid var(--border)' }}>
                        <td style={{ padding: '4px 8px', color: 'var(--text-sec)', fontFamily: 'monospace' }}>{f.cedula}</td>
                        {mesesVisibles.map(m => {
                          const val = f[`mes_${m}`] || 0;
                          return (
                            <td key={m} style={{ padding: '4px 8px', textAlign: 'right', color: val > 0 ? '#4ade80' : 'var(--text-mut)' }}>
                              {val > 0 ? `$${val.toLocaleString('es-CO')}` : '—'}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
                {filas.length > 8 && (
                  <div style={{ fontSize: 11, color: 'var(--text-mut)', textAlign: 'center', paddingTop: 8 }}>
                    + {filas.length - 8} jugadores más
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── Uploading ─── */}
          {step === 'uploading' && (
            <div style={{ textAlign: 'center', padding: '32px 0', color: 'var(--text-mut)' }}>
              <Loader2 size={28} style={{ animation: 'spin 0.8s linear infinite', marginBottom: 8 }} />
              <div style={{ fontSize: 13 }}>Importando {filas.length} jugadores × 12 meses…</div>
            </div>
          )}

          {/* ── Done ─── */}
          {step === 'done' && resultado && (
            <div style={{ background: '#14532d22', border: '1px solid #16a34a44', borderRadius: 10, padding: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                <CheckCircle2 size={20} color="#4ade80" />
                <span style={{ fontWeight: 700, fontSize: 14, color: '#4ade80' }}>Importación completada</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
                {[
                  { label: 'Actualizados', value: resultado.actualizados, color: '#4ade80' },
                  { label: 'Creados',      value: resultado.creados,      color: '#60a5fa' },
                  { label: 'Errores',      value: resultado.errores?.length || 0, color: resultado.errores?.length ? '#f87171' : 'var(--text-mut)' },
                ].map(s => (
                  <div key={s.label} style={{ background: 'var(--bg-base)', borderRadius: 8, padding: 12, textAlign: 'center' }}>
                    <div style={{ fontSize: 24, fontWeight: 800, color: s.color }}>{s.value}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-mut)' }}>{s.label}</div>
                  </div>
                ))}
              </div>
              {resultado.errores?.length > 0 && (
                <div style={{ marginTop: 12, fontSize: 11, color: '#f87171' }}>
                  {resultado.errores.slice(0, 5).map((e, i) => (
                    <div key={i}>⚠ {e.cedula}: {e.error}</div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{ padding: '16px 24px', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'flex-end', gap: 10, flexShrink: 0 }}>
          {step === 'done' ? (
            <button onClick={() => { onSuccess?.(); onClose(); }} style={{
              background: colorHex, color: '#fff', border: 'none',
              borderRadius: 8, padding: '9px 20px', cursor: 'pointer', fontWeight: 600, fontSize: 13,
            }}>
              Listo — Actualizar vista
            </button>
          ) : (
            <>
              <button onClick={onClose} style={{
                background: 'none', border: '1px solid var(--border)', color: 'var(--text-sec)',
                borderRadius: 8, padding: '9px 18px', cursor: 'pointer', fontSize: 13,
              }}>
                Cancelar
              </button>
              {step === 'preview' && (
                <button onClick={confirmarImportar} style={{
                  background: colorHex, color: '#fff', border: 'none',
                  borderRadius: 8, padding: '9px 20px', cursor: 'pointer', fontWeight: 600, fontSize: 13,
                  display: 'flex', alignItems: 'center', gap: 6,
                }}>
                  <Upload size={14} /> Importar {filas.length} jugadores
                </button>
              )}
            </>
          )}
        </div>
      </div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}
