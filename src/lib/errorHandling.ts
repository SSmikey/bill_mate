// Error handling utilities for consistent error responses

/**
 * Custom error class for application errors
 */
export class AppError extends Error {
  public statusCode: number;
  public isOperational: boolean;

  constructor(message: string, statusCode: number = 500, isOperational: boolean = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;

    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Validation error class
 */
export class ValidationError extends AppError {
  public details: any;

  constructor(message: string, details?: any) {
    super(message, 400);
    this.details = details;
  }
}

/**
 * Authentication error class
 */
export class AuthenticationError extends AppError {
  constructor(message: string = 'Authentication failed') {
    super(message, 401);
  }
}

/**
 * Authorization error class
 */
export class AuthorizationError extends AppError {
  constructor(message: string = 'Access denied') {
    super(message, 403);
  }
}

/**
 * Not found error class
 */
export class NotFoundError extends AppError {
  constructor(resource: string = 'Resource') {
    super(`${resource} not found`, 404);
  }
}

/**
 * Conflict error class
 */
export class ConflictError extends AppError {
  constructor(message: string = 'Resource conflict') {
    super(message, 409);
  }
}

/**
 * Rate limit error class
 */
export class RateLimitError extends AppError {
  constructor(message: string = 'Too many requests') {
    super(message, 429);
  }
}

/**
 * Handle API errors and return consistent response
 */
export function handleApiError(error: any): Response {
  console.error('API Error:', error);

  // If it's our custom AppError, use its properties
  if (error instanceof AppError) {
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
        ...((error as any).details && { details: (error as any).details }),
        ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
      }),
      {
        status: error.statusCode,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }

  // Handle Mongoose validation errors
  if (error.name === 'ValidationError') {
    const errors = Object.values(error.errors).map((err: any) => err.message);
    return new Response(
      JSON.stringify({
        success: false,
        error: 'Validation failed',
        details: errors
      }),
      {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }

  // Handle Mongoose duplicate key errors
  if (error.code === 11000) {
    const field = Object.keys(error.keyValue)[0];
    return new Response(
      JSON.stringify({
        success: false,
        error: `${field} already exists`
      }),
      {
        status: 409,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }

  // Handle Mongoose cast errors
  if (error.name === 'CastError') {
    return new Response(
      JSON.stringify({
        success: false,
        error: 'Invalid ID format'
      }),
      {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }

  // Handle JWT errors
  if (error.name === 'JsonWebTokenError') {
    return new Response(
      JSON.stringify({
        success: false,
        error: 'Invalid token'
      }),
      {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }

  if (error.name === 'TokenExpiredError') {
    return new Response(
      JSON.stringify({
        success: false,
        error: 'Token expired'
      }),
      {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }

  // Default server error
  return new Response(
    JSON.stringify({
      success: false,
      error: 'Internal server error',
      ...(process.env.NODE_ENV === 'development' && { 
        message: error.message,
        stack: error.stack 
      })
    }),
    {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    }
  );
}

/**
 * Async error handler wrapper for API routes
 */
export function asyncHandler(fn: (req: Request, ...args: any[]) => Promise<Response>) {
  return async (req: Request, ...args: any[]) => {
    try {
      return await fn(req, ...args);
    } catch (error) {
      return handleApiError(error);
    }
  };
}

/**
 * Log error with context information
 */
export function logError(error: Error, context?: any): void {
  const timestamp = new Date().toISOString();
  const errorInfo = {
    timestamp,
    message: error.message,
    stack: error.stack,
    ...(context && { context })
  };

  console.error('Application Error:', JSON.stringify(errorInfo, null, 2));
}

/**
 * Create standardized success response
 */
export function createSuccessResponse(data: any, message?: string, statusCode: number = 200): Response {
  return new Response(
    JSON.stringify({
      success: true,
      data,
      ...(message && { message })
    }),
    {
      status: statusCode,
      headers: { 'Content-Type': 'application/json' }
    }
  );
}

/**
 * Create standardized error response
 */
export function createErrorResponse(message: string, statusCode: number = 400, details?: any): Response {
  return new Response(
    JSON.stringify({
      success: false,
      error: message,
      ...(details && { details })
    }),
    {
      status: statusCode,
      headers: { 'Content-Type': 'application/json' }
    }
  );
}

/**
 * Error messages in Thai
 */
export const ErrorMessages = {
  // Authentication
  UNAUTHORIZED: 'ไม่ได้รับอนุญาตให้เข้าใช้งาน',
  INVALID_CREDENTIALS: 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง',
  TOKEN_EXPIRED: 'โทเคนหมดอายุ กรุณาเข้าสู่ระบบใหม่',
  INVALID_TOKEN: 'โทเคนไม่ถูกต้อง',
  
  // Authorization
  ACCESS_DENIED: 'ไม่มีสิทธิ์เข้าถึง',
  ADMIN_ONLY: 'เฉพาะผู้ดูแลระบบเท่านั้น',
  
  // Validation
  REQUIRED_FIELD: 'กรุณากรอกข้อมูลให้ครบถ้วน',
  INVALID_EMAIL: 'รูปแบบอีเมลไม่ถูกต้อง',
  INVALID_PHONE: 'รูปแบบเบอร์โทรศัพท์ไม่ถูกต้อง',
  INVALID_PASSWORD: 'รหัสผ่านไม่ตรงตามเงื่อนไข',
  PASSWORD_TOO_SHORT: 'รหัสผ่านต้องมีความยาวอย่างน้อย 8 ตัวอักษร',
  PASSWORD_MISMATCH: 'รหัสผ่านไม่ตรงกัน',
  
  // Resources
  USER_NOT_FOUND: 'ไม่พบผู้ใช้งาน',
  ROOM_NOT_FOUND: 'ไม่พบห้องพัก',
  BILL_NOT_FOUND: 'ไม่พบบิล',
  PAYMENT_NOT_FOUND: 'ไม่พบข้อมูลการชำระเงิน',
  
  // Conflict
  EMAIL_EXISTS: 'อีเมลนี้มีผู้ใช้งานแล้ว',
  ROOM_NUMBER_EXISTS: 'หมายเลขห้องนี้มีอยู่แล้ว',
  
  // General
  SERVER_ERROR: 'เกิดข้อผิดพลาดในระบบ กรุณาลองใหม่อีกครั้ง',
  INVALID_REQUEST: 'คำขอไม่ถูกต้อง',
  RATE_LIMIT_EXCEEDED: 'เกินจำนวนคำขอที่อนุญาต กรุณาลองใหม่ภายหลัง',
  FILE_TOO_LARGE: 'ขนาดไฟล์ใหญ่เกินไป',
  INVALID_FILE_TYPE: 'ประเภทไฟล์ไม่ถูกต้อง',
};

/**
 * Success messages in Thai
 */
export const SuccessMessages = {
  // Profile
  PROFILE_UPDATED: 'อัปเดตข้อมูลส่วนตัวเรียบร้อยแล้ว',
  PASSWORD_CHANGED: 'เปลี่ยนรหัสผ่านเรียบร้อยแล้ว',
  NOTIFICATION_PREFERENCES_UPDATED: 'อัปเดตการตั้งค่าการแจ้งเตือนเรียบร้อยแล้ว',
  
  // Room
  ROOM_CREATED: 'สร้างห้องพักเรียบร้อยแล้ว',
  ROOM_UPDATED: 'อัปเดตข้อมูลห้องพักเรียบร้อยแล้ว',
  ROOM_DELETED: 'ลบห้องพักเรียบร้อยแล้ว',
  
  // Bill
  BILL_CREATED: 'สร้างบิลเรียบร้อยแล้ว',
  BILL_UPDATED: 'อัปเดตบิลเรียบร้อยแล้ว',
  BILL_DELETED: 'ลบบิลเรียบร้อยแล้ว',
  
  // Payment
  PAYMENT_VERIFIED: 'ยืนยันการชำระเงินเรียบร้อยแล้ว',
  PAYMENT_REJECTED: 'ปฏิเสธการชำระเงินเรียบร้อยแล้ว',
  
  // User
  USER_CREATED: 'สร้างผู้ใช้งานเรียบร้อยแล้ว',
  USER_UPDATED: 'อัปเดตข้อมูลผู้ใช้งานเรียบร้อยแล้ว',
  USER_DELETED: 'ลบผู้ใช้งานเรียบร้อยแล้ว',
  
  // General
  OPERATION_SUCCESS: 'ดำเนินการเรียบร้อยแล้ว',
  DATA_SAVED: 'บันทึกข้อมูลเรียบร้อยแล้ว',
};