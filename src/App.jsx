import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import FormInscripcion from './components/FormInscripcion';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/inscripcion" element={<FormInscripcion />} />
        <Route path="/*" element={<Dashboard />} />
      </Routes>
    </BrowserRouter>
  );
}
