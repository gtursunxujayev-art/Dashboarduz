// Encryption service for sensitive data (integration tokens, etc.)

import crypto from 'crypto';

export interface EncryptionConfig {
  algorithm: string;
  key: Buffer;
  ivLength: number;
}

export class EncryptionService {
  private config: EncryptionConfig;

  constructor() {
    // In production, use environment variables for encryption key
    // For development, generate a key if not provided
    const encryptionKey = process.env.ENCRYPTION_KEY;
    
    if (!encryptionKey) {
      console.warn('[Encryption] No ENCRYPTION_KEY provided, using development key');
      // Generate a random key for development
      this.config = {
        algorithm: 'aes-256-gcm',
        key: crypto.randomBytes(32),
        ivLength: 16,
      };
    } else {
      // Use provided key (should be base64 encoded)
      const keyBuffer = Buffer.from(encryptionKey, 'base64');
      
      if (keyBuffer.length !== 32) {
        throw new Error('ENCRYPTION_KEY must be 32 bytes (256 bits) when base64 decoded');
      }

      this.config = {
        algorithm: 'aes-256-gcm',
        key: keyBuffer,
        ivLength: 16,
      };
    }
  }

  // Encrypt data
  encrypt(plaintext: string): {
    encrypted: string;
    iv: string;
    authTag: string;
  } {
    try {
      const iv = crypto.randomBytes(this.config.ivLength);
      const cipher = crypto.createCipheriv(this.config.algorithm, this.config.key, iv);
      
      let encrypted = cipher.update(plaintext, 'utf8', 'hex');
      encrypted += cipher.final('hex');
      
      const authTag = cipher.getAuthTag();

      return {
        encrypted,
        iv: iv.toString('hex'),
        authTag: authTag.toString('hex'),
      };
    } catch (error: any) {
      console.error('[Encryption] Encryption error:', error);
      throw new Error(`Encryption failed: ${error.message}`);
    }
  }

  // Decrypt data
  decrypt(encryptedData: {
    encrypted: string;
    iv: string;
    authTag: string;
  }): string {
    try {
      const iv = Buffer.from(encryptedData.iv, 'hex');
      const authTag = Buffer.from(encryptedData.authTag, 'hex');
      
      const decipher = crypto.createDecipheriv(this.config.algorithm, this.config.key, iv);
      decipher.setAuthTag(authTag);
      
      let decrypted = decipher.update(encryptedData.encrypted, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      
      return decrypted;
    } catch (error: any) {
      console.error('[Encryption] Decryption error:', error);
      throw new Error(`Decryption failed: ${error.message}`);
    }
  }

  // Encrypt JSON data
  encryptJSON(data: any): string {
    const jsonString = JSON.stringify(data);
    const encrypted = this.encrypt(jsonString);
    
    // Combine all parts into a single string for storage
    return JSON.stringify(encrypted);
  }

  // Decrypt JSON data
  decryptJSON(encryptedString: string): any {
    const encryptedData = JSON.parse(encryptedString);
    const decrypted = this.decrypt(encryptedData);
    
    return JSON.parse(decrypted);
  }

  // Hash data (for signatures, not encryption)
  hash(data: string, algorithm: string = 'sha256'): string {
    return crypto.createHash(algorithm).update(data).digest('hex');
  }

  // Generate HMAC signature
  sign(data: string, secret: string): string {
    return crypto.createHmac('sha256', secret).update(data).digest('hex');
  }

  // Verify HMAC signature
  verifySignature(data: string, signature: string, secret: string): boolean {
    const expectedSignature = this.sign(data, secret);
    return crypto.timingSafeEqual(
      Buffer.from(signature, 'hex'),
      Buffer.from(expectedSignature, 'hex')
    );
  }

  // Generate secure random string
  generateRandomString(length: number = 32): string {
    return crypto.randomBytes(length).toString('hex');
  }

  // Generate secure token (for API keys, etc.)
  generateSecureToken(): string {
    return crypto.randomBytes(32).toString('base64url');
  }

  // Rotate encryption key (for key rotation strategies)
  rotateKey(newKey: Buffer): void {
    if (newKey.length !== 32) {
      throw new Error('New key must be 32 bytes (256 bits)');
    }
    
    this.config.key = newKey;
    console.log('[Encryption] Encryption key rotated');
  }

  // Get key fingerprint (for verification)
  getKeyFingerprint(): string {
    return crypto.createHash('sha256').update(this.config.key).digest('hex');
  }

  // Health check
  healthCheck(): { status: 'healthy' | 'unhealthy'; keyFingerprint?: string } {
    try {
      // Test encryption/decryption cycle
      const testData = 'test-' + Date.now();
      const encrypted = this.encrypt(testData);
      const decrypted = this.decrypt(encrypted);
      
      if (decrypted !== testData) {
        return { status: 'unhealthy' };
      }
      
      return {
        status: 'healthy',
        keyFingerprint: this.getKeyFingerprint(),
      };
    } catch (error) {
      return { status: 'unhealthy' };
    }
  }
}

// Singleton instance
export const encryptionService = new EncryptionService();

// Helper function to encrypt integration tokens before storage
export function encryptIntegrationTokens(tokens: any): string {
  return encryptionService.encryptJSON(tokens);
}

// Helper function to decrypt integration tokens
export function decryptIntegrationTokens(encryptedTokens: string): any {
  return encryptionService.decryptJSON(encryptedTokens);
}

// Helper function to create secure hash for webhook signatures
export function createWebhookSignature(payload: any, secret: string): string {
  const payloadString = typeof payload === 'string' ? payload : JSON.stringify(payload);
  return encryptionService.sign(payloadString, secret);
}

// Helper function to verify webhook signature
export function verifyWebhookSignature(payload: any, signature: string, secret: string): boolean {
  const payloadString = typeof payload === 'string' ? payload : JSON.stringify(payload);
  return encryptionService.verifySignature(payloadString, signature, secret);
}
