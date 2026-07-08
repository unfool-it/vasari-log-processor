import crypto from 'crypto';
import { promisify } from 'util';
import { config } from '../config/index.ts';

const scrypt = promisify(crypto.scrypt);

export class SecuritySuite {
  private static readonly PII_KEYS = new Set(['email', 'phone', 'address', 'ip', 'dob', 'name', 'token']);

  /**
   * Recursively traverses objects to mask PII.
   * Includes a WeakSet to prevent infinite loops from circular references.
   */
  static scrubPII(data: any, seen = new WeakSet()): any {
    if (Array.isArray(data)) {
      return data.map((item) => this.scrubPII(item, seen));
    }

    if (data !== null && typeof data === 'object') {
      if (seen.has(data)) return '[CIRCULAR_REF]';
      seen.add(data);

      const scrubbed: any = {};
      for (const [key, value] of Object.entries(data)) {
        if (this.PII_KEYS.has(key.toLowerCase())) {
          scrubbed[key] = '[MASKED_SOVEREIGN_DATA]';
        } else {
          scrubbed[key] = this.scrubPII(value, seen);
        }
      }
      return scrubbed;
    }
    return data;
  }

  /**
   * Anonymizes IP addresses with RFC-compliant masking.
   */
  static anonymizeIP(ip: string): string {
    if (!ip) return '0.0.0.0';
    if (ip.includes('.')) {
      // IPv4: Mask the last octet
      return ip.split('.').slice(0, 3).join('.') + '.0';
    }
    if (ip.includes(':')) {
      // IPv6: Truncate to /48 prefix
      const segments = ip.split(':');
      return segments.slice(0, 3).join(':') + ':0000:0000:0000:0000:0000';
    }
    return '0.0.0.0';
  }

  /**
   * Generates a deterministic hash using asynchronous scrypt to prevent event-loop blocking.
   */
  static async generatePseudoID(userAgent: string, ip: string): Promise<string> {
    const salt = config.ANONYMIZATION_SALT || 'default_salt';
    const derivedKey = (await scrypt(
      userAgent + this.anonymizeIP(ip),
      salt,
      32
    )) as Buffer;
    return derivedKey.toString('hex');
  }
}
