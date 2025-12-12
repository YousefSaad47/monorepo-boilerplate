import { Encryption } from './encryption.util';

describe('Encryption', () => {
  const testSecret = 'test-encryption-secret-key-123';
  const originalEnv = process.env.ENCRYPTION_KEY;

  beforeEach(() => {
    process.env.ENCRYPTION_KEY = testSecret;
  });

  afterEach(() => {
    process.env.ENCRYPTION_KEY = originalEnv;
  });

  describe('encrypt', () => {
    it('should encrypt a simple string', () => {
      const plaintext = 'Hello, World!';
      const encrypted = Encryption.encrypt(plaintext);

      expect(encrypted).toBeDefined();
      expect(encrypted).not.toBe(plaintext);
      expect(typeof encrypted).toBe('string');
    });

    it('should produce different ciphertext for different plaintexts', () => {
      const text1 = 'Message 1';
      const text2 = 'Message 2';

      const encrypted1 = Encryption.encrypt(text1);
      const encrypted2 = Encryption.encrypt(text2);

      expect(encrypted1).not.toBe(encrypted2);
    });

    it('should encrypt empty string', () => {
      const encrypted = Encryption.encrypt('');
      expect(encrypted).toBeDefined();
      expect(typeof encrypted).toBe('string');
    });

    it('should encrypt special characters', () => {
      const plaintext = '!@#$%^&*()_+-=[]{}|;:\'",.<>?/~`';
      const encrypted = Encryption.encrypt(plaintext);

      expect(encrypted).toBeDefined();
      expect(encrypted).not.toBe(plaintext);
    });

    it('should encrypt unicode characters', () => {
      const plaintext = '你好世界 مرحبا 🌍🚀';
      const encrypted = Encryption.encrypt(plaintext);

      expect(encrypted).toBeDefined();
      expect(encrypted).not.toBe(plaintext);
    });

    it('should use custom secret when provided', () => {
      const plaintext = 'Secret message';
      const customSecret = 'custom-secret-key';

      const encrypted = Encryption.encrypt(plaintext, customSecret);
      const decrypted = Encryption.decrypt(encrypted, customSecret);

      expect(decrypted).toBe(plaintext);
    });

    it('should produce different ciphertext with different secrets', () => {
      const plaintext = 'Same message';
      const secret1 = 'secret-1';
      const secret2 = 'secret-2';

      const encrypted1 = Encryption.encrypt(plaintext, secret1);
      const encrypted2 = Encryption.encrypt(plaintext, secret2);

      expect(encrypted1).not.toBe(encrypted2);
    });

    it('should encrypt long strings', () => {
      const plaintext = 'A'.repeat(10000);
      const encrypted = Encryption.encrypt(plaintext);

      expect(encrypted).toBeDefined();
      expect(encrypted.length).toBeGreaterThan(0);
    });

    it('should encrypt JSON strings', () => {
      const plaintext = JSON.stringify({ user: 'john', password: 'secret123' });
      const encrypted = Encryption.encrypt(plaintext);

      expect(encrypted).toBeDefined();
      expect(encrypted).not.toContain('john');
      expect(encrypted).not.toContain('secret123');
    });
  });

  describe('decrypt', () => {
    it('should decrypt encrypted string correctly', () => {
      const plaintext = 'Hello, World!';
      const encrypted = Encryption.encrypt(plaintext);
      const decrypted = Encryption.decrypt(encrypted);

      expect(decrypted).toBe(plaintext);
    });

    it('should decrypt empty string', () => {
      const plaintext = '';
      const encrypted = Encryption.encrypt(plaintext);
      const decrypted = Encryption.decrypt(encrypted);

      expect(decrypted).toBe(plaintext);
    });

    it('should decrypt special characters correctly', () => {
      const plaintext = '!@#$%^&*()_+-=[]{}|;:\'",.<>?/~`';
      const encrypted = Encryption.encrypt(plaintext);
      const decrypted = Encryption.decrypt(encrypted);

      expect(decrypted).toBe(plaintext);
    });

    it('should decrypt unicode characters correctly', () => {
      const plaintext = '你好世界 مرحبا 🌍🚀';
      const encrypted = Encryption.encrypt(plaintext);
      const decrypted = Encryption.decrypt(encrypted);

      expect(decrypted).toBe(plaintext);
    });

    it('should use custom secret when provided', () => {
      const plaintext = 'Secret message';
      const customSecret = 'custom-secret-key';

      const encrypted = Encryption.encrypt(plaintext, customSecret);
      const decrypted = Encryption.decrypt(encrypted, customSecret);

      expect(decrypted).toBe(plaintext);
    });

    it('should fail to decrypt with wrong secret', () => {
      const plaintext = 'Secret message';
      const secret1 = 'secret-1';
      const secret2 = 'secret-2';

      const encrypted = Encryption.encrypt(plaintext, secret1);
      const decrypted = Encryption.decrypt(encrypted, secret2);

      expect(decrypted).not.toBe(plaintext);
      expect(decrypted).toBe(''); // crypto-js returns empty string for invalid decryption
    });

    it('should decrypt long strings correctly', () => {
      const plaintext = 'A'.repeat(10000);
      const encrypted = Encryption.encrypt(plaintext);
      const decrypted = Encryption.decrypt(encrypted);

      expect(decrypted).toBe(plaintext);
    });

    it('should decrypt JSON strings correctly', () => {
      const obj = { user: 'john', password: 'secret123', roles: ['admin', 'user'] };
      const plaintext = JSON.stringify(obj);
      const encrypted = Encryption.encrypt(plaintext);
      const decrypted = Encryption.decrypt(encrypted);

      expect(decrypted).toBe(plaintext);
      expect(JSON.parse(decrypted)).toEqual(obj);
    });

    it('should handle multiple encrypt-decrypt cycles', () => {
      let text = 'Original message';

      for (let i = 0; i < 10; i++) {
        const encrypted = Encryption.encrypt(text);
        const decrypted = Encryption.decrypt(encrypted);
        expect(decrypted).toBe(text);
        text = `Modified: ${text}`;
      }
    });

    it('should return empty string for invalid ciphertext', () => {
      const invalidCiphertext = 'not-a-valid-encrypted-string';
      const decrypted = Encryption.decrypt(invalidCiphertext);

      expect(decrypted).toBe('');
    });
  });

  describe('encrypt-decrypt round trip', () => {
    it('should maintain data integrity through encryption and decryption', () => {
      const testCases = [
        'Simple text',
        '',
        '123456789',
        'Special chars: !@#$%',
        'Unicode: 你好 مرحبا',
        'Multiline\nText\nWith\nBreaks',
        'Tabs\tand\tspaces  ',
        JSON.stringify({ nested: { object: { with: 'values' } } }),
      ];

      testCases.forEach((plaintext) => {
        const encrypted = Encryption.encrypt(plaintext);
        const decrypted = Encryption.decrypt(encrypted);
        expect(decrypted).toBe(plaintext);
      });
    });
  });
});