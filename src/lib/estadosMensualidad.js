// Estados de mensualidad tal como los devuelve el Portal (GET /publico/atleta y
// GET /players/:cedula/estado-cuenta): etiqueta y colores compartidos entre el Portal del
// Atleta y el estado de cuenta del admin, para que ambos se vean exactamente igual.
export const ESTADO_CFG = {
  pagado:      { bg: 'rgba(0,208,132,0.12)',   border: 'rgba(0,208,132,0.28)',   color: '#00D084', label: 'Al día'      },
  pendiente:   { bg: 'rgba(245,158,11,0.12)',  border: 'rgba(245,158,11,0.28)',  color: '#F59E0B', label: 'Pendiente'   },
  vencido:     { bg: 'rgba(239,68,68,0.12)',   border: 'rgba(239,68,68,0.28)',   color: '#EF4444', label: 'Vencido'     },
  parcial:     { bg: 'rgba(74,158,255,0.12)',  border: 'rgba(74,158,255,0.28)',  color: '#4A9EFF', label: 'Parcial'     },
  por_validar: { bg: 'rgba(192,120,255,0.12)', border: 'rgba(192,120,255,0.28)', color: '#C678FF', label: 'Por validar' },
  exento:      { bg: 'rgba(56,189,248,0.10)',  border: 'rgba(56,189,248,0.28)',  color: '#38bdf8', label: 'Exento'      },
  suspendido:  { bg: 'rgba(156,163,175,0.10)', border: 'rgba(156,163,175,0.25)', color: '#9CA3AF', label: 'Suspendido'  },
  no_aplica:   { bg: 'rgba(156,163,175,0.06)', border: 'rgba(156,163,175,0.18)', color: '#6B7280', label: 'No aplica'   },
};
