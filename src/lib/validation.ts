// Validation utilities for input sanitization and validation

/**
 * Sanitize string input by removing potentially dangerous characters
 */
export function sanitizeString(input: string): string {
  if (typeof input !== 'string') return '';
  
  return input
    .trim()
    .replace(/[<>]/g, '') // Remove potential HTML tags
    .replace(/javascript:/gi, '') // Remove potential JavaScript URLs
    .replace(/on\w+=/gi, ''); // Remove potential event handlers
}

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate Thai phone number format
 */
export function isValidThaiPhone(phone: string): boolean {
  // Remove any non-digit characters
  const cleanPhone = phone.replace(/\D/g, '');
  
  // Check if it's a valid Thai phone number (10 digits starting with 0)
  return /^0\d{9}$/.test(cleanPhone);
}

/**
 * Validate password strength
 */
export function isValidPassword(password: string): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];
  
  if (password.length < 8) {
    errors.push('รหัสผ่านต้องมีความยาวอย่างน้อย 8 ตัวอักษร');
  }
  
  if (!/[A-Z]/.test(password)) {
    errors.push('รหัสผ่านต้องมีตัวอักษรพิมพ์ใหญ่อย่างน้อย 1 ตัว');
  }
  
  if (!/[a-z]/.test(password)) {
    errors.push('รหัสผ่านต้องมีตัวอักษรพิมพ์เล็กอย่างน้อย 1 ตัว');
  }
  
  if (!/\d/.test(password)) {
    errors.push('รหัสผ่านต้องมีตัวเลขอย่างน้อย 1 ตัว');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Validate Thai ID format (13 digits)
 */
export function isValidThaiID(id: string): boolean {
  // Remove any non-digit characters
  const cleanID = id.replace(/\D/g, '');
  
  // Check if it's exactly 13 digits
  if (!/^\d{13}$/.test(cleanID)) {
    return false;
  }
  
  // Check the checksum digit (last digit)
  let sum = 0;
  for (let i = 0; i < 12; i++) {
    sum += parseInt(cleanID[i]) * (13 - i);
  }
  
  const checksum = (11 - (sum % 11)) % 10;
  
  return checksum === parseInt(cleanID[12]);
}

/**
 * Validate room number format
 */
export function isValidRoomNumber(roomNumber: string): boolean {
  // Allow alphanumeric room numbers with optional hyphens
  return /^[A-Za-z0-9\-]+$/.test(roomNumber) && roomNumber.length <= 10;
}

/**
 * Validate monetary amount
 */
export function isValidAmount(amount: number | string): boolean {
  const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
  
  return !isNaN(numAmount) && numAmount >= 0 && numAmount <= 999999.99;
}

/**
 * Validate date string
 */
export function isValidDateString(dateString: string): boolean {
  const date = new Date(dateString);
  return !isNaN(date.getTime()) && date.toISOString().startsWith(dateString.split('T')[0]);
}

/**
 * Sanitize and validate user input for profile updates
 */
export function validateProfileInput(data: {
  name?: string;
  email?: string;
  phone?: string;
}): {
  isValid: boolean;
  errors: string[];
  sanitizedData: any;
} {
  const errors: string[] = [];
  const sanitizedData: any = {};
  
  // Validate name
  if (data.name !== undefined) {
    const sanitizedName = sanitizeString(data.name);
    if (!sanitizedName || sanitizedName.length < 2) {
      errors.push('ชื่อต้องมีความยาวอย่างน้อย 2 ตัวอักษร');
    } else if (sanitizedName.length > 50) {
      errors.push('ชื่อต้องมีความยาวไม่เกิน 50 ตัวอักษร');
    } else {
      sanitizedData.name = sanitizedName;
    }
  }
  
  // Validate email
  if (data.email !== undefined) {
    const sanitizedEmail = sanitizeString(data.email.toLowerCase());
    if (!sanitizedEmail) {
      errors.push('อีเมลไม่สามารถเว้นว่างได้');
    } else if (!isValidEmail(sanitizedEmail)) {
      errors.push('รูปแบบอีเมลไม่ถูกต้อง');
    } else {
      sanitizedData.email = sanitizedEmail;
    }
  }
  
  // Validate phone
  if (data.phone !== undefined) {
    const sanitizedPhone = sanitizeString(data.phone);
    if (sanitizedPhone && !isValidThaiPhone(sanitizedPhone)) {
      errors.push('รูปแบบเบอร์โทรศัพท์ไม่ถูกต้อง (ต้องเป็น 10 หลักและเริ่มต้นด้วย 0)');
    } else {
      sanitizedData.phone = sanitizedPhone;
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    sanitizedData
  };
}

/**
 * Validate bill data
 */
export function validateBillData(data: {
  roomId: string;
  tenantId: string;
  type: string;
  amount: number;
  dueDate: string;
}): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];
  
  // Validate room ID
  if (!data.roomId || typeof data.roomId !== 'string') {
    errors.push('รหัสห้องพักไม่ถูกต้อง');
  }
  
  // Validate tenant ID
  if (!data.tenantId || typeof data.tenantId !== 'string') {
    errors.push('รหัสผู้เช่าไม่ถูกต้อง');
  }
  
  // Validate bill type
  const validTypes = ['rent', 'water', 'electricity', 'other'];
  if (!validTypes.includes(data.type)) {
    errors.push('ประเภทบิลไม่ถูกต้อง');
  }
  
  // Validate amount
  if (!isValidAmount(data.amount)) {
    errors.push('จำนวนเงินไม่ถูกต้อง');
  }
  
  // Validate due date
  if (!isValidDateString(data.dueDate)) {
    errors.push('วันที่ครบกำหนดไม่ถูกต้อง');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Validate payment data
 */
export function validatePaymentData(data: {
  billId: string;
  amount: number;
  paymentDate: string;
  slipUrl?: string;
}): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];
  
  // Validate bill ID
  if (!data.billId || typeof data.billId !== 'string') {
    errors.push('รหัสบิลไม่ถูกต้อง');
  }
  
  // Validate amount
  if (!isValidAmount(data.amount)) {
    errors.push('จำนวนเงินไม่ถูกต้อง');
  }
  
  // Validate payment date
  if (!isValidDateString(data.paymentDate)) {
    errors.push('วันที่ชำระเงินไม่ถูกต้อง');
  }
  
  // Validate slip URL if provided
  if (data.slipUrl && typeof data.slipUrl !== 'string') {
    errors.push('URL ของสลิปไม่ถูกต้อง');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Validate room data
 */
export function validateRoomData(data: {
  roomNumber: string;
  floor?: string;
  type: string;
  monthlyRent: number;
  size?: number;
  status?: string;
}): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];
  
  // Validate room number
  if (!data.roomNumber || !isValidRoomNumber(data.roomNumber)) {
    errors.push('หมายเลขห้องไม่ถูกต้อง');
  }
  
  // Validate room type
  const validTypes = ['single', 'double', 'studio', 'apartment'];
  if (!validTypes.includes(data.type)) {
    errors.push('ประเภทห้องไม่ถูกต้อง');
  }
  
  // Validate monthly rent
  if (!isValidAmount(data.monthlyRent)) {
    errors.push('ค่าเช่ารายเดือนไม่ถูกต้อง');
  }
  
  // Validate size if provided
  if (data.size !== undefined && (typeof data.size !== 'number' || data.size <= 0)) {
    errors.push('ขนาดห้องไม่ถูกต้อง');
  }
  
  // Validate status if provided
  if (data.status !== undefined) {
    const validStatuses = ['available', 'occupied', 'maintenance'];
    if (!validStatuses.includes(data.status)) {
      errors.push('สถานะห้องไม่ถูกต้อง');
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}