import { lazy, Suspense, useEffect } from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';

// ProtectedRoute arrastra `lib/supabase` (createClient) — 194 KB. Antes se
// importaba de forma estática acá y Vite lo metía en el grafo del entry,
// así que TODA visita (landing incluida) descargaba + modulepreload-eaba
// el chunk de Supabase sin usarlo. Ahora es lazy: solo entra en /app/*.
const ProtectedRoute = lazy(() => import('./components/ProtectedRoute'));

const Dashboard      = lazy(() => import('./pages/Dashboard'));
const Login          = lazy(() => import('./pages/Login'));
const AuthCallback   = lazy(() => import('./pages/AuthCallback'));
const LandingPage    = lazy(() => import('./pages/LandingPage'));
const RegistroClub   = lazy(() => import('./pages/RegistroClub'));
const FormInscripcion = lazy(() => import('./components/FormInscripcion'));
const VerificarMiembro = lazy(() => import('./pages/VerificarMiembro'));
const PortalAtleta       = lazy(() => import('./pages/PortalAtleta'));
const AsistenciaPublica  = lazy(() => import('./pages/AsistenciaPublica'));

function PageLoader() {
  // Fondo transparente a propósito: en `/` deja ver el #lcp-hero del index.html
  // (el fondo del hero pintado en HTML estático) mientras carga el chunk de la
  // ruta, en vez de taparlo con una pantalla negra. En el resto de rutas el
  // spinner queda sobre el fondo #060810 del <body>.
  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'transparent',
    }}>
      <div style={{ width: 32, height: 32, borderRadius: '50%', border: '3px solid #6366f133', borderTopColor: '#6366f1', animation: 'spin 0.7s linear infinite' }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}

// El #lcp-hero / #lcp-hero-scrim del index.html se quedan en el DOM en `/`
// (quitarlos rompe el LCP). Al navegar a otra ruta sin recargar hay que
// sacarlos o asoman por detrás. main.jsx cubre las cargas directas; esto
// cubre la navegación cliente.
function RouteHeroCleanup() {
  const { pathname } = useLocation();
  useEffect(() => {
    if (pathname !== '/') {
      document.getElementById('lcp-hero')?.remove();
      document.getElementById('lcp-hero-scrim')?.remove();
    }
  }, [pathname]);
  return null;
}

export default function App() {
  return (
    <BrowserRouter>
      <RouteHeroCleanup />
      <Suspense fallback={<PageLoader />}>
        <Routes>
          {/* Rutas públicas */}
          <Route path="/"                element={<LandingPage />} />
          <Route path="/registro"        element={<RegistroClub />} />
          <Route path="/login"           element={<Login />} />
          <Route path="/auth/callback"   element={<AuthCallback />} />
          <Route path="/inscripcion"     element={<FormInscripcion />} />
          <Route path="/verificar/:clubSlug/:cedula" element={<VerificarMiembro />} />
          <Route path="/p/:clubSlug"                         element={<PortalAtleta />} />
          <Route path="/p/:clubSlug/:token"                element={<PortalAtleta />} />
          <Route path="/asistencia/:clubSlug/:eventoId"    element={<AsistenciaPublica />} />

          {/* Rutas protegidas */}
          <Route path="/app/*" element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          } />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}
