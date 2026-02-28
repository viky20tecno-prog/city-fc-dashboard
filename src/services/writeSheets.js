import { APPS_SCRIPT_URL } from '../config';

async function postToScript(payload) {
  const res = await fetch(APPS_SCRIPT_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain' },
    body: JSON.stringify(payload),
  });
  return res.json();
}

export async function inscribirJugador(datos) {
  return postToScript({
    action: 'inscribir',
    ...datos,
    estado: 'PRUEBA',
    cuota: 65000,
    fecha_inscripcion: new Date().toISOString().split('T')[0],
  });
}

export async function activarJugador(cedula) {
  return postToScript({
    action: 'activar',
    cedula,
  });
}

export async function desactivarJugador(cedula) {
  return postToScript({
    action: 'desactivar',
    cedula,
  });
}
