import jsQR from 'jsqr';

export interface QRData {
  merchantId?: string;
  amount?: number;
  ref1?: string;
  ref2?: string;
}

export function scanQRCode(imageData: ImageData): QRData | null {
  try {
    const code = jsQR(imageData.data, imageData.width, imageData.height);

    if (!code) return null;

    return parsePromptPayData(code.data);
  } catch (error) {
    console.error('QR Scan Error:', error);
    return null;
  }
}

function parsePromptPayData(qrString: string): QRData | null {
  const data: QRData = {};

  // Parse PromptPay QR format (ISO 20022)
  // This is simplified - real implementation needs full EMV QR parsing

  // Merchant ID (Tag 30)
  const merchantMatch = qrString.match(/30\d{2}([0-9]+)/);
  if (merchantMatch) {
    data.merchantId = merchantMatch[1];
  }

  // Amount (Tag 54)
  const amountMatch = qrString.match(/54\d{2}([0-9.]+)/);
  if (amountMatch) {
    data.amount = parseFloat(amountMatch[1]);
  }

  // Reference 1 (Tag 62.01)
  const ref1Match = qrString.match(/6201([A-Z0-9]+)/);
  if (ref1Match) {
    data.ref1 = ref1Match[1];
  }

  // Reference 2 (Tag 62.02)
  const ref2Match = qrString.match(/6202([A-Z0-9]+)/);
  if (ref2Match) {
    data.ref2 = ref2Match[1];
  }

  return data;
}
