import Tesseract from 'tesseract.js';

export interface OCRData {
  amount?: number;
  fee?: number;
  date?: string;
  time?: string;
  fromAccount?: string;
  toAccount?: string;
  reference?: string;
  transactionNo?: string;
}

export async function performOCR(imageBase64: string): Promise<OCRData | null> {
  try {
    const result = await Tesseract.recognize(imageBase64, 'tha+eng', {
      logger: (m) => console.log('OCR Progress:', m),
    });

    const text = result.data.text;
    return extractSlipInfo(text);
  } catch (error) {
    console.error('OCR Error:', error);
    return null;
  }
}

function extractSlipInfo(text: string): OCRData {
  const data: OCRData = {};

  // Amount patterns
  const amountPatterns = [
    /(?:จำนวนเงิน|จ่าย|ยอดเงิน|โอน)[:\s]+([0-9]{1,3}(?:,?[0-9]{3})*\.?[0-9]{0,2})/i,
    /(?:Amount|Total|Pay)[:\s]+([0-9]{1,3}(?:,?[0-9]{3})*\.?[0-9]{0,2})/i,
    /THB[:\s]+([0-9]{1,3}(?:,?[0-9]{3})*\.?[0-9]{0,2})/i,
    /฿[:\s]*([0-9]{1,3}(?:,?[0-9]{3})*\.?[0-9]{0,2})/,
  ];

  for (const pattern of amountPatterns) {
    const match = text.match(pattern);
    if (match) {
      data.amount = parseFloat(match[1].replace(/,/g, ''));
      break;
    }
  }

  // Fee pattern
  const feeMatch = text.match(/(?:ค่าธรรมเนียม|Fee)[:\s]+([0-9]+\.?[0-9]{0,2})/i);
  if (feeMatch) {
    data.fee = parseFloat(feeMatch[1]);
  }

  // Date pattern (DD/MM/YYYY or DD-MM-YYYY)
  const datePattern = /(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/;
  const dateMatch = text.match(datePattern);
  if (dateMatch) {
    data.date = dateMatch[1];
  }

  // Time pattern (HH:MM or HH:MM:SS)
  const timePattern = /(\d{1,2}:\d{2}(?::\d{2})?(?:\s?[AP]M)?)/i;
  const timeMatch = text.match(timePattern);
  if (timeMatch) {
    data.time = timeMatch[1];
  }

  // Account numbers (Thai format: xxx-x-xxxxx-x)
  const accountPattern = /\b(\d{3}-?\d{1}-?\d{5}-?\d{1})\b/g;
  const accounts = text.match(accountPattern);
  if (accounts && accounts.length >= 2) {
    data.fromAccount = accounts[0];
    data.toAccount = accounts[1];
  } else if (accounts && accounts.length === 1) {
    data.toAccount = accounts[0];
  }

  // Reference
  const refMatch = text.match(/(?:Ref|อ้างอิง)[:\s]+([A-Z0-9]+)/i);
  if (refMatch) {
    data.reference = refMatch[1];
  }

  // Transaction number
  const transMatch = text.match(/(?:Transaction|รายการ)[:\s]+([A-Z0-9]+)/i);
  if (transMatch) {
    data.transactionNo = transMatch[1];
  }

  return data;
}
