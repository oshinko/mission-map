import crypto from 'node:crypto';

export function getEndpoint(suffix: string) {
  return process.env.ENDPOINT!.replace(/\/+$/, '') + suffix;
}

export function createMapId(): string {
  return encodeBase58(crypto.randomBytes(8));
}

// Base58
const BASE58_CHARS = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
const BASE58_MAP: Record<string, number> = {};
for (let i = 0; i < BASE58_CHARS.length; i++) {
  BASE58_MAP[BASE58_CHARS[i]] = i;
}
const BASE = BigInt(BASE58_CHARS.length);  // 58n

export function encodeBase58(buffer: Buffer): string {
  let num = BigInt('0x' + buffer.toString('hex'));

  // 先頭の 0x00 を '1' で表現する（接頭辞として）
  let prefix = '';
  for (const byte of buffer) {
    if (byte === 0) {
      prefix += BASE58_CHARS[0];  // '1'
    } else {
      break;
    }
  }

  let result = '';
  while (num > 0) {
    const rem = Number(num % BASE);
    result = BASE58_CHARS[rem] + result;
    num = num / BASE;
  }

  return prefix + result;
}

export function decodeBase58(str: string): Buffer {
  let num = BigInt('0');
  for (const char of str) {
    const val = BASE58_MAP[char];
    if (val === undefined) {
      throw new Error(`Invalid Base58 character: '${char}'`);
    }
    num = num * BASE + BigInt(val);
  }

  let hex = num.toString(16);
  if (hex.length % 2 !== 0) hex = '0' + hex;
  let buffer = Buffer.from(hex, 'hex');

  // 先頭の '1' は 0x00 に復元（接頭辞の数だけ）
  const zeroCount = str.match(/^1+/)?.[0].length ?? 0;
  if (zeroCount > 0) {
    const zeros = Buffer.alloc(zeroCount);  // zero padding
    buffer = Buffer.concat([zeros, buffer]);
  }

  return buffer;
}
