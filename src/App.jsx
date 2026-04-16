import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import FormInscripcion from './components/FormInscripcion';
import PedidoUniforme from './pages/PedidoUniforme';
import ProtectedRoute from './components/ProtectedRoute';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Rutas públicas */}
        <Route path="/login"           element={<Login />} />
        <Route path="/inscripcion"     element={<FormInscripcion />} />
        <Route path="/pedido-uniforme" element={<PedidoUniforme />} />

        {/* Rutas protegidas */}
        <Route path="/*" element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        } />
      </Routes>
    </BrowserRouter>
  );
}
