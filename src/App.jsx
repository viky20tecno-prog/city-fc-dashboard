import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import FormInscripcion from './components/FormInscripcion';
import PedidoUniforme from './pages/PedidoUniforme';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/inscripcion" element={<FormInscripcion />} />
        <Route path="/pedido-uniforme" element={<PedidoUniforme />} />
        <Route path="/*" element={<Dashboard />} />
      </Routes>
    </BrowserRouter>
  );
}
