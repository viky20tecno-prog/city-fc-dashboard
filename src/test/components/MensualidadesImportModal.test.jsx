import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import * as XLSX from 'xlsx';

vi.mock('../../lib/supabase', () => import('../mocks/supabase.js'));

import MensualidadesImportModal from '../../components/MensualidadesImportModal';

// Excel con el mismo formato de la plantilla: fila de instrucciones, encabezados, datos.
function archivoPlantilla() {
  const meses = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
  const filas = [
    ['Instrucciones: llena lo pagado por mes'],
    ['Cedula', 'Nombre', ...meses.map(m => `${m}_pagado`)],
    ['1026740247', 'Jacobo', 80000, 80000, ...Array(10).fill(0)],
    ['1034966779', 'Victoria', 80000, ...Array(11).fill(0)],
  ];
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(filas), 'Mensualidades');
  const bytes = XLSX.write(wb, { type: 'array', bookType: 'xlsx' });
  const file = new File([bytes], 'mensualidades.xlsx', { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  // jsdom no implementa File.arrayBuffer en todas las versiones
  file.arrayBuffer = async () => bytes;
  return file;
}

describe('MensualidadesImportModal', () => {
  it('lee el Excel de la plantilla y muestra la vista previa (antes fallaba con sheet_to_aoa)', async () => {
    const { container } = render(<MensualidadesImportModal onClose={() => {}} onSuccess={() => {}} />);
    const input = container.querySelector('input[type="file"]');
    fireEvent.change(input, { target: { files: [archivoPlantilla()] } });

    await waitFor(() => expect(screen.getByText('2 jugadores encontrados')).toBeInTheDocument());
    expect(screen.queryByText(/Error al leer el archivo/)).not.toBeInTheDocument();
    expect(screen.getByText('1026740247')).toBeInTheDocument();
  });
});
