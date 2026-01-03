import * as React from 'react';
import { QRCodeCanvas } from 'qrcode.react';
import { jsPDF } from 'jspdf';

interface QRShareProps {
  value: string;
  blader?: string;
  date?: string;
}

export default function QRShare({ value, blader, date }: QRShareProps) {
  const canvasId = 'bbx-qr-canvas';

  const generateFinalCanvas = (): HTMLCanvasElement | null => {
    const qrCanvas = document.getElementById(canvasId) as HTMLCanvasElement;
    if (!qrCanvas) return null;

    const qrSize = qrCanvas.width;
    const paddingTop = 60;
    const paddingBottom = 20;

    const finalCanvas = document.createElement('canvas');
    finalCanvas.width = qrSize;
    finalCanvas.height = qrSize + paddingTop + paddingBottom;

    const ctx = finalCanvas.getContext('2d');
    if (!ctx) return null;

    // Fondo blanco
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, finalCanvas.width, finalCanvas.height);

    // Texto arriba
    ctx.fillStyle = '#000000';
    ctx.textAlign = 'center';
    ctx.font = 'bold 18px Arial';
    if (blader) ctx.fillText(blader, finalCanvas.width / 2, 28);

    ctx.font = '14px Arial';
    if (date) ctx.fillText(date, finalCanvas.width / 2, 50);

    // Dibujar QR
    ctx.drawImage(qrCanvas, 0, paddingTop);

    // Texto centrado dentro del QR
    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.font = 'bold 24px Arial';
    ctx.fillText('FBA', finalCanvas.width / 2, paddingTop + qrSize / 2 + 8);

    return finalCanvas;
  };

  const downloadQR = () => {
    const finalCanvas = generateFinalCanvas();
    if (!finalCanvas) return;

    const pngUrl = finalCanvas.toDataURL('image/png');
    const link = document.createElement('a');
    link.href = pngUrl;
    link.download = 'bbx-deck-qr.png';
    link.click();
  };

  const printQR = () => {
    const finalCanvas = generateFinalCanvas();
    if (!finalCanvas) return;

    const imgData = finalCanvas.toDataURL('image/png');

    // Crear PDF con jsPDF
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'px',
      format: [finalCanvas.width, finalCanvas.height],
    });

    pdf.addImage(imgData, 'PNG', 0, 0, finalCanvas.width, finalCanvas.height);
    pdf.autoPrint({ variant: 'non-conform' });
    window.open(pdf.output('bloburl'), '_blank');
  };

  return (
    <div style={{ marginTop: 30, textAlign: 'center' }}>
      {blader && <h3>{blader}</h3>}
      {date && <small>{date}</small>}

      <div style={{ marginTop: 10 }}>
        <QRCodeCanvas id={canvasId} value={value} size={220} includeMargin />
      </div>

      <div
        style={{
          marginTop: 15,
          display: 'flex',
          justifyContent: 'center',
          gap: '10px',
        }}
      >
        <button onClick={downloadQR}>Descargar QR</button>
        <button onClick={printQR}>Imprimir QR</button>
      </div>
    </div>
  );
}
