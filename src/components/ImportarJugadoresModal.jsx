import { useState, useRef } from 'react';
import { X, Upload, FileSpreadsheet, AlertCircle, CheckCircle2, Download, Loader2 } from 'lucide-react';
import { importarJugadoresBulk } from '../services/api';

const PLANTILLA_HEADERS = 'cedula,nombre,apellidos,celular,correo_electronico,fecha_nacimiento,lugar_de_nacimiento,tipo_sangre,eps,familiar_emergencia,celular_contacto,municipio,direccion,barrio,estatura,peso,posicion,numero_camiseta,categoria,equipo,instagram';
const PLANTILLA_EJEMPLO = '12345678,Carlos,Mendoza Torres,3001234567,carlos@email.com,1998-06-15,Medellín,O+,Sura,María Torres,3009876543,Medellín,Cra 45 #67-89,El Poblado,1.75,68,Delantero,10,Sub-20,Equipo A,@carlos';

function normalizeKey(k) {
  return k
    .toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]/g, '_');
}

// Busca la primera clave que coincida exactamente o que empiece con `prefix_`/`prefix__`.
// Permite leer cabeceras tipo "NOMBRES (solo nombres)" → nombres__solo_nombres_ usando el prefijo "nombres".
function pget(n, prefix) {
  if (n[prefix] !== undefined && n[prefix] !== '') return n[prefix];
  const hit = Object.keys(n).find(k => k.startsWith(prefix + '_') || k.startsWith(prefix + '__'));
  return hit ? n[hit] : '';
}

function mapRow(rawObj) {
  const n = {};
  Object.entries(rawObj).forEach(([k, v]) => { n[normalizeKey(k)] = String(v ?? '').trim(); });

  return {
    // cedula: acepta "NUMERO DE IDENTIFICACION" (Google Forms City FC)
    cedula:               n.cedula || n.documento || n.cc || n.numero_de_identificacion || n.numero_identificacion || '',
    // nombre/apellidos: acepta "NOMBRES (solo nombres)" y "APELLIDOS (solo apellidos)"
    nombre:               n.nombre || pget(n, 'nombres'),
    apellidos:            n.apellidos || n.apellido || pget(n, 'apellidos'),
    // celular: acepta "NUMERO CELULAR PERSONAL"
    celular:              n.celular || n.telefono || n.movil || n.cel || n.numero_celular_personal || '',
    // correo: acepta "DIRECCION DE CORREO ELECTRONICO"
    correo_electronico:   n.correo_electronico || n.correo || n.email || n.direccion_de_correo_electronico || '',
    fecha_nacimiento:     n.fecha_nacimiento || n.fecha_nac || n.nacimiento || '',
    // lugar_nacimiento: acepta "MUNICIPIO DE NACIMIENTO"
    lugar_de_nacimiento:  n.lugar_de_nacimiento || n.lugar_nacimiento || n.ciudad_nacimiento || n.municipio_de_nacimiento || '',
    tipo_sangre:          n.tipo_sangre || n.sangre || n.grupo_sanguineo || '',
    eps:                  n.eps || n.seguro || n.eps_seguro || '',
    // familiar: acepta "FAMILIAR EN CASO DE EMERGENCIA"
    familiar_emergencia:  n.familiar_emergencia || n.contacto_emergencia || n.emergencia || n.familiar_en_caso_de_emergencia || '',
    // celular_contacto: acepta "NUMERO CELULAR DEL FAMILAR"
    celular_contacto:     n.celular_contacto || n.tel_emergencia || n.telefono_emergencia || n.numero_celular_del_familar || '',
    municipio:            n.municipio || n.ciudad || '',
    // direccion: acepta "DIRECCION DE RESIDENCIA" (explícito para no pisar correo)
    direccion:            n.direccion || n.direccion_de_residencia || '',
    // barrio: acepta "LUGAR DE RESIDENCIA (barrio)"
    barrio:               n.barrio || pget(n, 'lugar_de_residencia'),
    // estatura/peso: acepta "ESTATURA (1.XX)" y "PESO (KG)"
    estatura:             n.estatura || n.talla || pget(n, 'estatura'),
    peso:                 n.peso || pget(n, 'peso'),
    posicion:             n.posicion || '',
    numero_camiseta:      n.numero_camiseta || n.camiseta || n.numero || '',
    categoria:            n.categoria || n.categoria_ || '',
    equipo:               n.equipo || '',
    // instagram: acepta "USUARIO PERSONAL DE INSTAGRAM (con @)"
    instagram:            n.instagram || pget(n, 'usuario_personal_de_instagram'),
  };
}

function validarFila(f) {
  if (!f.cedula) return 'Cédula requerida';
  if (!f.nombre) return 'Nombre requerido';
  return null;
}

export default function ImportarJugadoresModal({ onClose, onSuccess }) {
  const [fase,       setFase]       = useState('dropzone'); // dropzone | preview | importing | resultado
  const [filas,      setFilas]      = useState([]);
  const [resultado,  setResultado]  = useState(null);
  const [dragOver,   setDragOver]   = useState(false);
  const [parseError, setParseError] = useState(null);
  const inputRef = useRef(null);

  const parsearArchivo = async (file) => {
    setParseError(null);
    try {
      const XLSX = await import('xlsx');
      const data = await file.arrayBuffer();
      const wb   = XLSX.read(data, { type: 'array' });
      const ws   = wb.Sheets[wb.SheetNames[0]];
      const raw  = XLSX.utils.sheet_to_json(ws, { defval: '' });
      if (!raw.length) { setParseError('El archivo está vacío o no tiene filas de datos.'); return; }
      const rows = raw.map(mapRow).filter(r => r.cedula || r.nombre);
      if (!rows.length) { setParseError('No se encontraron filas válidas. Revisa los encabezados de columna.'); return; }
      setFilas(rows);
      setFase('preview');
    } catch {
      setParseError('No se pudo leer el archivo. Asegúrate de que sea .xlsx, .xls o .csv');
    }
  };

  const handleFile = (file) => {
    if (!file) return;
    parsearArchivo(file);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const handleImportar = async () => {
    const validas = filas.filter(f => !validarFila(f));
    setFase('importing');
    try {
      const res = await importarJugadoresBulk(validas);
      setResultado(res);
      setFase('resultado');
      if (res.insertados > 0) onSuccess();
    } catch (err) {
      setResultado({ error: err.message });
      setFase('resultado');
    }
  };

  const descargarPlantilla = () => {
    const csv  = `${PLANTILLA_HEADERS}\n${PLANTILLA_EJEMPLO}`;
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href = url; a.download = 'plantilla_jugadores.csv'; a.click();
    URL.revokeObjectURL(url);
  };

  const filasValidas   = filas.filter(f => !validarFila(f));
  const filasInvalidas = filas.filter(f =>  validarFila(f));

  return (
    <div
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.80)', zIndex: 100,
               display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}
      onClick={fase !== 'importing' ? onClose : undefined}
    >
      <div
        style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-sub)', borderRadius: '18px',
                 width: '100%', maxWidth: '660px', maxHeight: '90vh', display: 'flex', flexDirection: 'column',
                 overflow: 'hidden' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border-sub)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: 36, height: 36, borderRadius: '10px', background: 'rgba(34,197,94,0.10)', border: '1px solid rgba(34,197,94,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <FileSpreadsheet size={18} color="#22C55E" />
            </div>
            <div>
              <div style={{ color: 'var(--text-pri)', fontWeight: 600, fontSize: '15px' }}>Importar jugadores</div>
              <div style={{ color: 'var(--text-mut)', fontSize: '12px' }}>Desde Excel (.xlsx, .xls) o CSV</div>
            </div>
          </div>
          {fase !== 'importing' && (
            <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-sec)', padding: '4px' }}>
              <X size={18} />
            </button>
          )}
        </div>

        {/* Body */}
        <div style={{ padding: '24px', overflowY: 'auto', flex: 1 }}>

          {/* ── DROPZONE ── */}
          {fase === 'dropzone' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div
                onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
                onClick={() => inputRef.current?.click()}
                style={{
                  border: `2px dashed ${dragOver ? 'rgba(34,197,94,0.6)' : 'var(--border-sub)'}`,
                  borderRadius: '14px',
                  padding: '40px 24px',
                  textAlign: 'center',
                  cursor: 'pointer',
                  background: dragOver ? 'rgba(34,197,94,0.05)' : 'var(--bg-card)',
                  transition: 'background-color 0.2s, border-color 0.2s',
                }}
              >
                <Upload size={36} color="var(--text-sec)" style={{ margin: '0 auto 12px' }} />
                <div style={{ color: 'var(--text-pri)', fontWeight: 600, marginBottom: '6px' }}>
                  Arrastra tu archivo aquí
                </div>
                <div style={{ color: 'var(--text-mut)', fontSize: '13px' }}>
                  o haz clic para seleccionar — .xlsx, .xls, .csv
                </div>
                <input
                  ref={inputRef}
                  type="file"
                  accept=".xlsx,.xls,.csv"
                  style={{ display: 'none' }}
                  onChange={e => handleFile(e.target.files[0])}
                />
              </div>

              {parseError && (
                <div style={{ display: 'flex', gap: '10px', padding: '12px 14px', borderRadius: '10px', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)', color: '#EF4444', fontSize: '13px' }}>
                  <AlertCircle size={16} style={{ flexShrink: 0, marginTop: '1px' }} />
                  {parseError}
                </div>
              )}

              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ flex: 1, height: '1px', background: 'var(--border-sub)' }} />
                <span style={{ color: 'var(--text-mut)', fontSize: '12px' }}>plantilla</span>
                <div style={{ flex: 1, height: '1px', background: 'var(--border-sub)' }} />
              </div>

              <button
                onClick={descargarPlantilla}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '10px', borderRadius: '10px', border: '1px solid var(--border-sub)', background: 'var(--bg-card)', color: 'var(--text-sec)', fontSize: '13px', cursor: 'pointer' }}
              >
                <Download size={15} />
                Descargar plantilla CSV
              </button>

              <div style={{ background: 'var(--bg-card)', borderRadius: '10px', padding: '12px 14px', fontSize: '12px', color: 'var(--text-mut)', lineHeight: 1.6 }}>
                <strong style={{ color: 'var(--text-sec)' }}>Requeridas:</strong> cedula, nombre, apellidos
                <br />
                <strong style={{ color: 'var(--text-sec)' }}>Opcionales:</strong> celular, correo_electronico, fecha_nacimiento, lugar_de_nacimiento, tipo_sangre, eps, familiar_emergencia, celular_contacto, municipio, direccion, barrio, estatura, peso, posicion, numero_camiseta, categoria, equipo, instagram
              </div>
            </div>
          )}

          {/* ── PREVIEW ── */}
          {fase === 'preview' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                <span style={{ padding: '4px 12px', borderRadius: '20px', background: 'rgba(34,197,94,0.10)', border: '1px solid rgba(34,197,94,0.25)', color: '#22C55E', fontSize: '12px', fontWeight: 600 }}>
                  ✓ {filasValidas.length} válidos
                </span>
                {filasInvalidas.length > 0 && (
                  <span style={{ padding: '4px 12px', borderRadius: '20px', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)', color: '#EF4444', fontSize: '12px', fontWeight: 600 }}>
                    ✕ {filasInvalidas.length} con error
                  </span>
                )}
              </div>

              <div style={{ overflowX: 'auto', border: '1px solid var(--border-sub)', borderRadius: '10px' }}>
                <table style={{ width: '100%', fontSize: '12px', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--border-sub)' }}>
                      {['#', 'Cédula', 'Nombre', 'Apellidos', 'Celular', 'Estado'].map(h => (
                        <th key={h} style={{ padding: '8px 10px', textAlign: 'left', color: 'var(--text-mut)', fontWeight: 600, whiteSpace: 'nowrap' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filas.slice(0, 12).map((f, i) => {
                      const err = validarFila(f);
                      return (
                        <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)', background: err ? 'rgba(239,68,68,0.04)' : 'transparent' }}>
                          <td style={{ padding: '7px 10px', color: 'var(--text-mut)' }}>{i + 2}</td>
                          <td style={{ padding: '7px 10px', color: 'var(--text-pri)', fontFamily: 'monospace' }}>{f.cedula || <span style={{ color: '#EF4444' }}>—</span>}</td>
                          <td style={{ padding: '7px 10px', color: 'var(--text-pri)' }}>{f.nombre || <span style={{ color: '#EF4444' }}>—</span>}</td>
                          <td style={{ padding: '7px 10px', color: 'var(--text-sec)' }}>{f.apellidos}</td>
                          <td style={{ padding: '7px 10px', color: 'var(--text-mut)' }}>{f.celular}</td>
                          <td style={{ padding: '7px 10px' }}>
                            {err
                              ? <span style={{ color: '#EF4444', fontSize: '11px' }}>{err}</span>
                              : <span style={{ color: '#22C55E', fontSize: '11px' }}>OK</span>}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                {filas.length > 12 && (
                  <div style={{ padding: '8px 10px', textAlign: 'center', fontSize: '12px', color: 'var(--text-mut)', borderTop: '1px solid var(--border-sub)' }}>
                    ... y {filas.length - 12} filas más
                  </div>
                )}
              </div>

              {filasValidas.length === 0 && (
                <div style={{ display: 'flex', gap: '10px', padding: '12px 14px', borderRadius: '10px', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)', color: '#EF4444', fontSize: '13px' }}>
                  <AlertCircle size={16} style={{ flexShrink: 0 }} />
                  No hay filas válidas para importar. Verifica que el archivo tenga columnas "cedula" y "nombre".
                </div>
              )}
            </div>
          )}

          {/* ── IMPORTING ── */}
          {fase === 'importing' && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '16px', padding: '40px 0' }}>
              <Loader2 size={36} color="#22C55E" style={{ animation: 'spin 1s linear infinite' }} />
              <div style={{ color: 'var(--text-sec)', fontSize: '14px' }}>Importando {filasValidas.length} jugadores…</div>
            </div>
          )}

          {/* ── RESULTADO ── */}
          {fase === 'resultado' && resultado && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {resultado.error ? (
                <div style={{ display: 'flex', gap: '10px', padding: '14px', borderRadius: '10px', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)', color: '#EF4444', fontSize: '13px' }}>
                  <AlertCircle size={16} style={{ flexShrink: 0 }} />
                  Error: {resultado.error}
                </div>
              ) : (
                <>
                  <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                    <div style={{ flex: 1, minWidth: '130px', padding: '14px', borderRadius: '12px', background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.25)', textAlign: 'center' }}>
                      <CheckCircle2 size={24} color="#22C55E" style={{ margin: '0 auto 6px' }} />
                      <div style={{ fontSize: '28px', fontWeight: 700, color: '#22C55E', lineHeight: 1 }}>{resultado.insertados}</div>
                      <div style={{ fontSize: '11px', color: 'var(--text-sec)', marginTop: '4px' }}>Insertados</div>
                    </div>
                    {resultado.errores > 0 && (
                      <div style={{ flex: 1, minWidth: '130px', padding: '14px', borderRadius: '12px', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)', textAlign: 'center' }}>
                        <AlertCircle size={24} color="#EF4444" style={{ margin: '0 auto 6px' }} />
                        <div style={{ fontSize: '28px', fontWeight: 700, color: '#EF4444', lineHeight: 1 }}>{resultado.errores}</div>
                        <div style={{ fontSize: '11px', color: 'var(--text-sec)', marginTop: '4px' }}>Con error</div>
                      </div>
                    )}
                  </div>

                  {resultado.detalle_errores?.length > 0 && (
                    <div style={{ background: 'var(--bg-card)', borderRadius: '10px', padding: '12px 14px', maxHeight: '180px', overflowY: 'auto' }}>
                      <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-sec)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Filas con error</div>
                      {resultado.detalle_errores.map((e, i) => (
                        <div key={i} style={{ display: 'flex', gap: '8px', fontSize: '12px', color: 'var(--text-mut)', marginBottom: '4px' }}>
                          <span style={{ color: '#EF4444', fontWeight: 600 }}>Fila {e.fila}</span>
                          <span style={{ color: 'var(--text-sec)' }}>{e.cedula !== '—' && `CC ${e.cedula}`} {e.nombre}</span>
                          <span>— {e.error}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{ padding: '16px 24px', borderTop: '1px solid var(--border-sub)', display: 'flex', gap: '10px', justifyContent: 'flex-end', flexShrink: 0 }}>
          {fase === 'dropzone' && (
            <button onClick={onClose} style={{ padding: '9px 20px', borderRadius: '10px', border: '1px solid var(--border-sub)', background: 'var(--bg-card)', color: 'var(--text-sec)', fontSize: '13px', cursor: 'pointer' }}>
              Cancelar
            </button>
          )}
          {fase === 'preview' && (
            <>
              <button onClick={() => { setFase('dropzone'); setFilas([]); }} style={{ padding: '9px 20px', borderRadius: '10px', border: '1px solid var(--border-sub)', background: 'var(--bg-card)', color: 'var(--text-sec)', fontSize: '13px', cursor: 'pointer' }}>
                Cambiar archivo
              </button>
              <button
                onClick={handleImportar}
                disabled={filasValidas.length === 0}
                style={{ padding: '9px 22px', borderRadius: '10px', border: '1px solid rgba(34,197,94,0.35)', background: 'rgba(34,197,94,0.12)', color: '#22C55E', fontSize: '13px', fontWeight: 600, cursor: filasValidas.length === 0 ? 'not-allowed' : 'pointer', opacity: filasValidas.length === 0 ? 0.5 : 1 }}
              >
                Importar {filasValidas.length} jugadores
              </button>
            </>
          )}
          {fase === 'resultado' && (
            <button onClick={onClose} style={{ padding: '9px 22px', borderRadius: '10px', border: '1px solid rgba(34,197,94,0.35)', background: 'rgba(34,197,94,0.12)', color: '#22C55E', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}>
              Cerrar
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
