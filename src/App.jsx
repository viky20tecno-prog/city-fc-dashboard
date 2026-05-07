import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import AuthCallback from './pages/AuthCallback';
import LandingPage from './pages/LandingPage';
import RegistroClub from './pages/RegistroClub';
import FormInscripcion from './components/FormInscripcion';
import PedidoUniforme from './pages/PedidoUniforme';
import ProtectedRoute from './components/ProtectedRoute';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Rutas públicas */}
        <Route path="/"                element={<LandingPage />} />
        <Route path="/registro"        element={<RegistroClub />} />
        <Route path="/login"           element={<Login />} />
        <Route path="/auth/callback"   element={<AuthCallback />} />
        <Route path="/inscripcion"     element={<FormInscripcion />} />
        <Route path="/pedido-uniforme" element={<PedidoUniforme />} />

        {/* Rutas protegidas */}
        <Route path="/app/*" element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        } />
      </Routes>
    </BrowserRouter>
  );
}
