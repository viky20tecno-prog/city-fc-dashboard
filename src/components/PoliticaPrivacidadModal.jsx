import { X } from 'lucide-react';

const POLITICA_TEXTO = [
  {
    titulo: 'Responsable del tratamiento',
    contenido: 'ZenSports, plataforma de gestión deportiva, actúa como responsable del tratamiento de los datos personales recolectados a través de este formulario.',
  },
  {
    titulo: 'Finalidad del tratamiento',
    contenido: 'Los datos personales suministrados serán utilizados exclusivamente para: (1) gestión administrativa del club deportivo, (2) comunicación de actividades, pagos y eventos, (3) generación de carnets y documentos de identidad deportiva, (4) cumplimiento de obligaciones legales.',
  },
  {
    titulo: 'Datos recolectados',
    contenido: 'Se recolectan datos de identificación (nombre, documento, fecha de nacimiento), datos de contacto (celular, correo electrónico), datos de salud relevantes (tipo de sangre, EPS) y datos de residencia. Estos datos son considerados datos sensibles y serán tratados con las medidas de seguridad correspondientes.',
  },
  {
    titulo: 'Derechos del titular',
    contenido: 'De conformidad con la Ley 1581 de 2012 y el Decreto 1377 de 2013, el titular tiene derecho a: conocer, actualizar y rectificar sus datos; solicitar prueba de la autorización otorgada; ser informado sobre el uso de sus datos; presentar quejas ante la Superintendencia de Industria y Comercio; revocar la autorización y solicitar la supresión de los datos.',
  },
  {
    titulo: 'Conservación y seguridad',
    contenido: 'Los datos serán conservados durante el tiempo que el titular sea miembro activo del club y por el período adicional que exija la ley. Se implementan medidas técnicas y administrativas para proteger la información contra acceso no autorizado, alteración o divulgación.',
  },
  {
    titulo: 'Transferencia de datos',
    contenido: 'Los datos no serán transferidos a terceros sin el consentimiento previo del titular, salvo obligación legal. El acceso está restringido al personal autorizado del club.',
  },
  {
    titulo: 'Contacto',
    contenido: 'Para ejercer sus derechos o presentar consultas sobre el tratamiento de sus datos personales, comuníquese a través de los canales oficiales del club deportivo.',
  },
];

export default function PoliticaPrivacidadModal({ onClose }) {
  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        background: 'rgba(0,0,0,0.75)',
        backdropFilter: 'blur(6px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '24px 16px',
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          width: '100%', maxWidth: 640,
          maxHeight: '85vh',
          background: '#0C1524',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: 20,
          display: 'flex', flexDirection: 'column',
          overflow: 'hidden',
          boxShadow: '0 24px 80px rgba(0,0,0,0.6)',
        }}
      >
        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '20px 24px 16px',
          borderBottom: '1px solid rgba(255,255,255,0.07)',
          flexShrink: 0,
        }}>
          <div>
            <h2 style={{ color: '#fff', fontSize: 17, fontWeight: 800, margin: 0 }}>
              Política de Tratamiento de Datos Personales
            </h2>
            <p style={{ color: 'var(--text-mut)', fontSize: 12, margin: '3px 0 0' }}>
              Ley 1581 de 2012 · Decreto 1377 de 2013 · Colombia
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'rgba(255,255,255,0.07)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 8, padding: 8,
              cursor: 'pointer', color: 'var(--text-sec)',
              display: 'flex', alignItems: 'center',
            }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div style={{ overflowY: 'auto', padding: '20px 24px', flex: 1 }}>
          {POLITICA_TEXTO.map(({ titulo, contenido }) => (
            <div key={titulo} style={{ marginBottom: 18 }}>
              <h3 style={{ color: '#fff', fontSize: 13, fontWeight: 700, margin: '0 0 6px' }}>
                {titulo}
              </h3>
              <p style={{ color: 'var(--text-sec)', fontSize: 13, margin: 0, lineHeight: 1.65 }}>
                {contenido}
              </p>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div style={{
          padding: '16px 24px',
          borderTop: '1px solid rgba(255,255,255,0.07)',
          flexShrink: 0,
        }}>
          <button
            onClick={onClose}
            style={{
              width: '100%', padding: '11px',
              background: 'rgba(255,255,255,0.08)',
              border: '1px solid rgba(255,255,255,0.12)',
              borderRadius: 10, color: '#fff',
              fontSize: 14, fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}
