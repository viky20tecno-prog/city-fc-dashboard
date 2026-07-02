import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { esUrlWaha, fetchComprobanteBlobUrl } from '../lib/comprobanteUrl';

// Link "Ver comprobante" que funciona tanto para URLs públicas (Supabase Storage)
// como para las que vienen de WAHA (requieren pasar por el proxy autenticado).
export default function ComprobanteLink({ url, children, className }) {
  const [cargando, setCargando] = useState(false);

  if (!esUrlWaha(url)) {
    return (
      <a href={url} target="_blank" rel="noopener noreferrer" className={className}>
        {children}
      </a>
    );
  }

  const abrir = async (e) => {
    e.preventDefault();
    if (cargando) return;
    setCargando(true);
    // Abrir la pestaña de forma síncrona (antes del await) para que el navegador
    // no la bloquee como popup — se le cambia la URL cuando ya tengamos el blob.
    const ventana = window.open('', '_blank', 'noopener,noreferrer');
    try {
      const blobUrl = await fetchComprobanteBlobUrl(url);
      if (ventana) ventana.location.href = blobUrl;
    } catch (err) {
      if (ventana) ventana.close();
      alert(err.message || 'No se pudo cargar el comprobante');
    } finally {
      setCargando(false);
    }
  };

  return (
    <a href={url} onClick={abrir} className={className}>
      {cargando ? <Loader2 className="w-3 h-3 inline animate-spin" /> : children}
    </a>
  );
}
