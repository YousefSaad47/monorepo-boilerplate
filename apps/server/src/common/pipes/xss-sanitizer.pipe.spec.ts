import { ArgumentMetadata } from '@nestjs/common';
import { XssSanitizerPipe } from './xss-sanitizer.pipe';

describe('XssSanitizerPipe', () => {
  let pipe: XssSanitizerPipe;
  const metadata: ArgumentMetadata = { type: 'body' };

  beforeEach(() => {
    pipe = new XssSanitizerPipe();
  });

  describe('string sanitization', () => {
    it('should sanitize basic XSS script tags', () => {
      const value = '<script>alert("XSS")</script>';
      const result = pipe.transform(value, metadata);

      expect(result).not.toContain('<script>');
      expect(result).not.toContain('alert');
    });

    it('should sanitize script with src attribute', () => {
      const value = '<script src="http://evil.com/xss.js"></script>';
      const result = pipe.transform(value, metadata);

      expect(result).not.toContain('<script');
      expect(result).not.toContain('evil.com');
    });

    it('should sanitize inline event handlers', () => {
      const value = '<img src="x" onerror="alert(1)">';
      const result = pipe.transform(value, metadata);

      expect(result).not.toContain('onerror');
      expect(result).not.toContain('alert');
    });

    it('should sanitize onclick events', () => {
      const value = '<div onclick="maliciousFunction()">Click me</div>';
      const result = pipe.transform(value, metadata);

      expect(result).not.toContain('onclick');
      expect(result).not.toContain('maliciousFunction');
    });

    it('should preserve safe HTML tags', () => {
      const value = '<p>Hello <strong>World</strong></p>';
      const result = pipe.transform(value, metadata);

      expect(result).toContain('<p>');
      expect(result).toContain('<strong>');
      expect(result).toContain('Hello');
      expect(result).toContain('World');
    });

    it('should sanitize javascript: protocol in links', () => {
      const value = '<a href="javascript:alert(1)">Click</a>';
      const result = pipe.transform(value, metadata);

      expect(result).not.toContain('javascript:');
      expect(result).not.toContain('alert');
    });

    it('should sanitize data URIs with scripts', () => {
      const value = '<img src="data:text/html,<script>alert(1)</script>">';
      const result = pipe.transform(value, metadata);

      expect(result).not.toContain('data:text/html');
    });

    it('should handle empty string', () => {
      const value = '';
      const result = pipe.transform(value, metadata);

      expect(result).toBe('');
    });

    it('should handle plain text without HTML', () => {
      const value = 'Just plain text';
      const result = pipe.transform(value, metadata);

      expect(result).toBe('Just plain text');
    });

    it('should sanitize multiple XSS attempts in one string', () => {
      const value = '<script>bad()</script><img onerror="alert(1)" src="x"><a href="javascript:void(0)">link</a>';
      const result = pipe.transform(value, metadata);

      expect(result).not.toContain('<script');
      expect(result).not.toContain('onerror');
      expect(result).not.toContain('javascript:');
    });

    it('should sanitize encoded XSS attempts', () => {
      const value = '&lt;script&gt;alert(1)&lt;/script&gt;';
      const result = pipe.transform(value, metadata);

      expect(result).toBeDefined();
    });
  });

  describe('array sanitization', () => {
    it('should sanitize all strings in array', () => {
      const value = [
        '<script>alert(1)</script>',
        'safe text',
        '<img onerror="alert(2)" src="x">',
      ];
      const result = pipe.transform(value, metadata);

      expect(result).toBeInstanceOf(Array);
      expect(result[0]).not.toContain('<script');
      expect(result[1]).toBe('safe text');
      expect(result[2]).not.toContain('onerror');
    });

    it('should handle empty array', () => {
      const value: string[] = [];
      const result = pipe.transform(value, metadata);

      expect(result).toEqual([]);
    });

    it('should handle array with mixed types', () => {
      const value = ['<script>bad</script>', 123, true, null];
      const result = pipe.transform(value, metadata);

      expect(result).toBeInstanceOf(Array);
      expect(result[0]).not.toContain('<script');
      expect(result[1]).toBe(123);
      expect(result[2]).toBe(true);
      expect(result[3]).toBeNull();
    });

    it('should handle nested arrays', () => {
      const value = [
        ['<script>alert(1)</script>', 'safe'],
        ['<img onerror="bad" src="x">'],
      ];
      const result = pipe.transform(value, metadata);

      expect(result[0][0]).not.toContain('<script');
      expect(result[0][1]).toBe('safe');
      expect(result[1][0]).not.toContain('onerror');
    });
  });

  describe('object sanitization', () => {
    it('should sanitize all string values in object', () => {
      const value = {
        name: '<script>alert("XSS")</script>',
        description: 'This is safe',
        code: '<img onerror="alert(1)" src="x">',
      };
      const result = pipe.transform(value, metadata);

      expect(result.name).not.toContain('<script');
      expect(result.description).toBe('This is safe');
      expect(result.code).not.toContain('onerror');
    });

    it('should handle empty object', () => {
      const value = {};
      const result = pipe.transform(value, metadata);

      expect(result).toEqual({});
    });

    it('should preserve non-string values in object', () => {
      const value = {
        name: '<script>bad</script>',
        age: 30,
        active: true,
        metadata: null,
        tags: undefined,
      };
      const result = pipe.transform(value, metadata);

      expect(result.name).not.toContain('<script');
      expect(result.age).toBe(30);
      expect(result.active).toBe(true);
      expect(result.metadata).toBeNull();
      expect(result.tags).toBeUndefined();
    });

    it('should handle nested objects', () => {
      const value = {
        user: {
          name: '<script>alert(1)</script>',
          bio: 'Safe bio',
        },
        post: {
          title: '<img onerror="bad" src="x">',
          content: 'Normal content',
        },
      };
      const result = pipe.transform(value, metadata);

      expect(result.user.name).not.toContain('<script');
      expect(result.user.bio).toBe('Safe bio');
      expect(result.post.title).not.toContain('onerror');
      expect(result.post.content).toBe('Normal content');
    });

    it('should handle arrays inside objects', () => {
      const value = {
        tags: ['<script>bad</script>', 'safe', '<img onerror="alert(1)">'],
        count: 5,
      };
      const result = pipe.transform(value, metadata);

      expect(result.tags[0]).not.toContain('<script');
      expect(result.tags[1]).toBe('safe');
      expect(result.tags[2]).not.toContain('onerror');
      expect(result.count).toBe(5);
    });

    it('should handle complex nested structures', () => {
      const value = {
        users: [
          {
            name: '<script>alert(1)</script>',
            posts: [
              { title: '<img onerror="bad">' },
              { title: 'Safe title' },
            ],
          },
        ],
      };
      const result = pipe.transform(value, metadata);

      expect(result.users[0].name).not.toContain('<script');
      expect(result.users[0].posts[0].title).not.toContain('onerror');
      expect(result.users[0].posts[1].title).toBe('Safe title');
    });
  });

  describe('edge cases', () => {
    it('should handle null input', () => {
      const value = null;
      const result = pipe.transform(value, metadata);

      expect(result).toBeNull();
    });

    it('should handle undefined input', () => {
      const value = undefined;
      const result = pipe.transform(value, metadata);

      expect(result).toBeUndefined();
    });

    it('should handle number input', () => {
      const value = 12345;
      const result = pipe.transform(value, metadata);

      expect(result).toBe(12345);
    });

    it('should handle boolean input', () => {
      const value = true;
      const result = pipe.transform(value, metadata);

      expect(result).toBe(true);
    });

    it('should handle Date objects', () => {
      const value = new Date('2024-01-01');
      const result = pipe.transform(value, metadata);

      expect(result).toEqual(value);
    });
  });

  describe('real-world XSS patterns', () => {
    it('should sanitize DOM-based XSS', () => {
      const value = '<iframe src="javascript:alert(document.cookie)"></iframe>';
      const result = pipe.transform(value, metadata);

      expect(result).not.toContain('javascript:');
      expect(result).not.toContain('document.cookie');
    });

    it('should sanitize stored XSS in user input', () => {
      const userInput = {
        username: 'john<script>steal()</script>',
        bio: 'Hello <img src=x onerror="stealData()">',
        website: 'javascript:malicious()',
      };
      const result = pipe.transform(userInput, metadata);

      expect(result.username).not.toContain('<script');
      expect(result.bio).not.toContain('onerror');
      expect(result.website).not.toContain('javascript:');
    });

    it('should sanitize reflected XSS patterns', () => {
      const value = '<svg onload=alert(1)>';
      const result = pipe.transform(value, metadata);

      expect(result).not.toContain('onload');
      expect(result).not.toContain('alert');
    });

    it('should sanitize mutation XSS', () => {
      const value = '<noscript><p title="</noscript><img src=x onerror=alert(1)>">';
      const result = pipe.transform(value, metadata);

      expect(result).not.toContain('onerror');
    });
  });
});