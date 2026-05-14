// Shared utilities for all jsPDF-generated documents.
// Design: white background, full-width accent header, consistent footer.

export function hexToRgb(hex) {
  const h = (typeof hex === 'string' && hex.startsWith('#') ? hex : '#E14924').replace('#', '');
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
}

export async function loadLogoDataUrl(url) {
  if (!url) return null;
  return new Promise(resolve => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width; canvas.height = img.height;
      canvas.getContext('2d').drawImage(img, 0, 0);
      resolve(canvas.toDataURL('image/png'));
    };
    img.onerror = () => resolve(null);
    img.src = url;
  });
}

/**
 * Draws the standard header band.
 * Returns the Y coordinate where content should start.
 *
 * opts: { W, M, clubName, title, subtitle, date, logoData, accentRgb, height? }
 */
export function drawPdfHeader(doc, { W, M, clubName, title, subtitle, date, logoData, accentRgb, height = 28 }) {
  const [r, g, b] = accentRgb;
  doc.setFillColor(r, g, b);
  doc.rect(0, 0, W, height, 'F');

  let textX = M;
  if (logoData) {
    try {
      const logoH = height - 8;
      const logoY = (height - logoH) / 2;
      doc.addImage(logoData, 'PNG', M, logoY, logoH, logoH);
      textX = M + logoH + 4;
    } catch (_) {}
  }

  // Club name — left
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(255, 255, 255);
  doc.text(clubName || 'Mi Club', textX, height / 2 - 1);

  // Document title — right, top-ish
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(255, 255, 255);
  doc.text(title, W - M, height / 2 - 5, { align: 'right' });

  // Subtitle / date — right, below title
  const sub = date || subtitle || '';
  if (sub) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(230, 230, 230);
    doc.text(sub, W - M, height / 2 + 4, { align: 'right' });
  }

  return height + 8; // Y start for content
}

/**
 * Draws the standard footer on the current page.
 * opts: { W, H, M, clubName, pageNum?, totalPages?, note? }
 */
export function drawPdfFooter(doc, { W, H, M, clubName, pageNum, totalPages, note }) {
  const footerY = H - 10;
  doc.setDrawColor(210, 210, 210);
  doc.setLineWidth(0.3);
  doc.line(M, footerY, W - M, footerY);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.setTextColor(160, 160, 160);
  doc.text(`${clubName || 'ZenSports'} · zensports.vercel.app`, M, footerY + 5);

  if (note) {
    doc.text(note, W / 2, footerY + 5, { align: 'center' });
  }

  if (totalPages && totalPages > 1) {
    doc.text(`Pág. ${pageNum} / ${totalPages}`, W - M, footerY + 5, { align: 'right' });
  }
}

/**
 * Draws a section pill label (accent left border + light gray bg).
 * Returns the Y after the pill.
 */
export function drawPdfSectionLabel(doc, { W, M, y, label, count, accentRgb }) {
  const [r, g, b] = accentRgb;
  doc.setFillColor(245, 246, 248);
  doc.rect(M, y, W - M * 2, 9, 'F');
  doc.setFillColor(r, g, b);
  doc.rect(M, y, 3, 9, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(r, g, b);
  const text = count !== undefined ? `${label}  (${count})` : label;
  doc.text(text, M + 7, y + 6.2);
  return y + 13;
}

/**
 * Draws a standard table header row.
 * columns: [{ label, x }]
 * Returns Y after the header row.
 */
export function drawPdfTableHead(doc, { W, M, y, columns, accentRgb }) {
  const [r, g, b] = accentRgb;
  doc.setFillColor(243, 244, 246);
  doc.rect(M - 2, y - 4, W - M * 2 + 4, 8, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(r, g, b);
  columns.forEach(({ label, x }) => doc.text(label, x, y));
  return y + 7;
}
