import { ArgumentMetadata } from '@nestjs/common';
import { HppPipe } from './hpp.pipe';

describe('HppPipe', () => {
  let pipe: HppPipe;

  describe('with empty allowList', () => {
    beforeEach(() => {
      pipe = new HppPipe({ allowList: [] });
    });

    it('should keep single values unchanged', () => {
      const value = { name: 'John', age: '30' };
      const metadata: ArgumentMetadata = { type: 'body' };

      const result = pipe.transform(value, metadata);

      expect(result).toEqual({ name: 'John', age: '30' });
    });

    it('should take first element from array parameters', () => {
      const value = { name: ['John', 'Jane', 'Bob'], age: '30' };
      const metadata: ArgumentMetadata = { type: 'body' };

      const result = pipe.transform(value, metadata);

      expect(result).toEqual({ name: 'John', age: '30' });
    });

    it('should handle empty arrays', () => {
      const value = { name: [], age: '30' };
      const metadata: ArgumentMetadata = { type: 'body' };

      const result = pipe.transform(value, metadata);

      expect(result).toEqual({ name: [], age: '30' });
    });

    it('should handle multiple array parameters', () => {
      const value = {
        names: ['Alice', 'Bob'],
        ids: ['1', '2', '3'],
        city: 'NYC',
      };
      const metadata: ArgumentMetadata = { type: 'body' };

      const result = pipe.transform(value, metadata);

      expect(result).toEqual({
        names: 'Alice',
        ids: '1',
        city: 'NYC',
      });
    });

    it('should preserve non-string array values', () => {
      const value = { ids: [1, 2, 3], active: true };
      const metadata: ArgumentMetadata = { type: 'body' };

      const result = pipe.transform(value, metadata);

      expect(result).toEqual({ ids: 1, active: true });
    });

    it('should handle nested objects by not processing them', () => {
      const value = {
        user: { names: ['John', 'Jane'] },
        age: '30',
      };
      const metadata: ArgumentMetadata = { type: 'body' };

      const result = pipe.transform(value, metadata);

      // Nested objects are not processed by the pipe
      expect(result).toEqual({
        user: { names: ['John', 'Jane'] },
        age: '30',
      });
    });
  });

  describe('with allowList', () => {
    beforeEach(() => {
      pipe = new HppPipe({ allowList: ['tags', 'categories'] });
    });

    it('should preserve arrays for allowlisted parameters', () => {
      const value = {
        tags: ['javascript', 'typescript', 'nodejs'],
        name: ['John', 'Jane'],
      };
      const metadata: ArgumentMetadata = { type: 'body' };

      const result = pipe.transform(value, metadata);

      expect(result).toEqual({
        tags: ['javascript', 'typescript', 'nodejs'],
        name: 'John',
      });
    });

    it('should handle multiple allowlisted parameters', () => {
      const value = {
        tags: ['tag1', 'tag2'],
        categories: ['cat1', 'cat2', 'cat3'],
        name: ['John', 'Jane'],
      };
      const metadata: ArgumentMetadata = { type: 'body' };

      const result = pipe.transform(value, metadata);

      expect(result).toEqual({
        tags: ['tag1', 'tag2'],
        categories: ['cat1', 'cat2', 'cat3'],
        name: 'John',
      });
    });

    it('should only affect array values in allowList', () => {
      const value = {
        tags: 'single-tag',
        categories: ['cat1', 'cat2'],
        name: 'John',
      };
      const metadata: ArgumentMetadata = { type: 'body' };

      const result = pipe.transform(value, metadata);

      expect(result).toEqual({
        tags: 'single-tag',
        categories: ['cat1', 'cat2'],
        name: 'John',
      });
    });

    it('should handle empty arrays in allowList', () => {
      const value = {
        tags: [],
        name: ['John', 'Jane'],
      };
      const metadata: ArgumentMetadata = { type: 'body' };

      const result = pipe.transform(value, metadata);

      expect(result).toEqual({
        tags: [],
        name: 'John',
      });
    });
  });

  describe('edge cases', () => {
    beforeEach(() => {
      pipe = new HppPipe({ allowList: ['permitted'] });
    });

    it('should return primitive values unchanged', () => {
      const metadata: ArgumentMetadata = { type: 'body' };

      expect(pipe.transform('string', metadata)).toBe('string');
      expect(pipe.transform(123, metadata)).toBe(123);
      expect(pipe.transform(true, metadata)).toBe(true);
    });

    it('should return null unchanged', () => {
      const metadata: ArgumentMetadata = { type: 'body' };
      expect(pipe.transform(null, metadata)).toBeNull();
    });

    it('should return undefined unchanged', () => {
      const metadata: ArgumentMetadata = { type: 'body' };
      expect(pipe.transform(undefined, metadata)).toBeUndefined();
    });

    it('should handle empty objects', () => {
      const value = {};
      const metadata: ArgumentMetadata = { type: 'body' };

      const result = pipe.transform(value, metadata);

      expect(result).toEqual({});
    });

    it('should handle objects with null values', () => {
      const value = { name: null, age: '30' };
      const metadata: ArgumentMetadata = { type: 'body' };

      const result = pipe.transform(value, metadata);

      expect(result).toEqual({ name: null, age: '30' });
    });

    it('should handle objects with undefined values', () => {
      const value = { name: undefined, age: '30' };
      const metadata: ArgumentMetadata = { type: 'body' };

      const result = pipe.transform(value, metadata);

      expect(result).toEqual({ name: undefined, age: '30' });
    });

    it('should handle mixed array types', () => {
      const value = {
        mixed: [null, undefined, '', 0, false, 'value'],
        normal: 'test',
      };
      const metadata: ArgumentMetadata = { type: 'body' };

      const result = pipe.transform(value, metadata);

      expect(result).toEqual({
        mixed: null,
        normal: 'test',
      });
    });
  });

  describe('HPP attack prevention', () => {
    beforeEach(() => {
      pipe = new HppPipe({ allowList: [] });
    });

    it('should prevent HTTP Parameter Pollution by taking first value', () => {
      // Simulates: ?id=1&id=2&id=3 (malicious duplicate parameters)
      const value = { id: ['1', '2', '3'] };
      const metadata: ArgumentMetadata = { type: 'query' };

      const result = pipe.transform(value, metadata);

      expect(result).toEqual({ id: '1' });
      expect(result.id).not.toBeInstanceOf(Array);
    });

    it('should handle realistic HPP attack scenario', () => {
      const value = {
        email: ['user@example.com', 'attacker@evil.com'],
        password: 'correctPassword',
        role: ['user', 'admin'], // Privilege escalation attempt
      };
      const metadata: ArgumentMetadata = { type: 'body' };

      const result = pipe.transform(value, metadata);

      expect(result).toEqual({
        email: 'user@example.com',
        password: 'correctPassword',
        role: 'user',
      });
    });
  });
});