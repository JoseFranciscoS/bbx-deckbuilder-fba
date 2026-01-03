import { QRCodeCanvas } from 'qrcode.react';

interface QRShareProps {
  value: string;
  blader?: string;
  date?: string;
}

export default function QRShare({ value, blader, date }: QRShareProps) {
  const downloadQR = () => {
    const qrCanvas = document.querySelector<HTMLCanvasElement>('canvas');
    if (!qrCanvas) return;

    const qrSize = qrCanvas.width;
    const paddingTop = 60;
    const paddingBottom = 20;

    const finalCanvas = document.createElement('canvas');
    finalCanvas.width = qrSize;
    finalCanvas.height = qrSize + paddingTop + paddingBottom;

    const ctx = finalCanvas.getContext('2d');
    if (!ctx) return;

    // Fondo blanco
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, finalCanvas.width, finalCanvas.height);

    // Texto
    ctx.fillStyle = '#000000';
    ctx.textAlign = 'center';

    ctx.font = 'bold 18px Arial';
    if (blader) {
      ctx.fillText(blader, finalCanvas.width / 2, 28);
    }

    ctx.font = '14px Arial';
    if (date) {
      ctx.fillText(date, finalCanvas.width / 2, 50);
    }

    // Dibujar QR
    ctx.drawImage(qrCanvas, 0, paddingTop);

    // Descargar
    const pngUrl = finalCanvas.toDataURL('image/png');
    const link = document.createElement('a');
    link.href = pngUrl;
    link.download = 'bbx-deck-qr.png';
    link.click();
  };

  return (
    <div style={{ marginTop: 30, textAlign: 'center' }}>
      {blader && <h3>{blader}</h3>}
      {date && <small>{date}</small>}

      <div style={{ marginTop: 10 }}>
        <QRCodeCanvas value={value} size={220} includeMargin />
      </div>

      <button onClick={downloadQR} style={{ marginTop: 15 }}>
        Descargar QR
      </button>
    </div>
  );
}
