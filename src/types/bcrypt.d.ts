declare module 'bcryptjs' {
  export function compare(data: string | Buffer, hash: string): Promise<boolean>;
  export function hash(data: string | Buffer, salt: number | string): Promise<string>;
  export function genSalt(rounds?: number): Promise<string>;
}