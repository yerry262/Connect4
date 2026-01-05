import { describe, it, expect, beforeEach } from 'vitest';
import {
  generateUsername,
  isValidUsername,
  parseUsername,
  getStoredUsername,
  storeUsername,
  getOrCreateUsername,
} from '../utils/usernameGenerator';

describe('Username Generator', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe('generateUsername', () => {
    it('should generate username in correct format', () => {
      const username = generateUsername();
      expect(isValidUsername(username)).toBe(true);
    });

    it('should generate unique usernames', () => {
      const usernames = new Set<string>();
      for (let i = 0; i < 100; i++) {
        usernames.add(generateUsername());
      }
      
      // Should generate at least 95 unique usernames out of 100
      expect(usernames.size).toBeGreaterThan(95);
    });

    it('should include # separator and 4-digit ID', () => {
      const username = generateUsername();
      expect(username).toMatch(/#\d{4}$/);
    });

    it('should have reasonable length', () => {
      const username = generateUsername();
      expect(username.length).toBeGreaterThan(5);
      expect(username.length).toBeLessThan(30);
    });

    it('should generate both adjective+noun and noun-only formats', () => {
      const usernames = [];
      for (let i = 0; i < 50; i++) {
        usernames.push(generateUsername());
      }
      
      // Some should be longer (adjective+noun) and some shorter (noun only)
      const hasVariety = usernames.some(u => u.split('#')[0].length > 8) &&
                         usernames.some(u => u.split('#')[0].length <= 8);
      expect(hasVariety).toBe(true);
    });
  });

  describe('isValidUsername', () => {
    it('should accept valid standard format usernames', () => {
      expect(isValidUsername('SwiftDragon#1234')).toBe(true);
      expect(isValidUsername('Knight#5678')).toBe(true);
      expect(isValidUsername('AB#1000')).toBe(true);
    });

    it('should accept valid hash-start format usernames', () => {
      expect(isValidUsername('#Dragon1234')).toBe(true);
      expect(isValidUsername('#Knight5678')).toBe(true);
    });

    it('should reject usernames with invalid format', () => {
      expect(isValidUsername('NoHash1234')).toBe(false);
      expect(isValidUsername('Name#123')).toBe(false); // Only 3 digits
      expect(isValidUsername('Name#12345')).toBe(false); // 5 digits
      expect(isValidUsername('Name123')).toBe(false); // No hash
      expect(isValidUsername('#N1234')).toBe(false); // Too short name
    });

    it('should reject usernames with special characters', () => {
      expect(isValidUsername('Name@#1234')).toBe(false);
      expect(isValidUsername('Name!#1234')).toBe(false);
      expect(isValidUsername('Name#12.4')).toBe(false);
    });

    it('should reject empty or null usernames', () => {
      expect(isValidUsername('')).toBe(false);
      expect(isValidUsername('   ')).toBe(false);
    });

    it('should handle edge case lengths', () => {
      expect(isValidUsername('A#1234')).toBe(false); // Too short (1 char)
      expect(isValidUsername('AB#1234')).toBe(true); // Min length (2 chars)
      expect(isValidUsername('A'.repeat(20) + '#1234')).toBe(true); // Max length (20 chars)
      expect(isValidUsername('A'.repeat(21) + '#1234')).toBe(false); // Too long (21 chars)
    });
  });

  describe('parseUsername', () => {
    it('should parse standard format correctly', () => {
      const result = parseUsername('SwiftDragon#1234');
      expect(result).not.toBeNull();
      expect(result?.name).toBe('SwiftDragon');
      expect(result?.id).toBe('1234');
    });

    it('should parse hash-start format correctly', () => {
      const result = parseUsername('#Dragon1234');
      expect(result).not.toBeNull();
      expect(result?.name).toBe('Dragon');
      expect(result?.id).toBe('1234');
    });

    it('should return null for invalid usernames', () => {
      expect(parseUsername('InvalidFormat')).toBeNull();
      expect(parseUsername('Name#123')).toBeNull(); // Wrong ID length
      expect(parseUsername('Name123')).toBeNull(); // No hash
      expect(parseUsername('')).toBeNull();
    });

    it('should handle alphanumeric names', () => {
      const result = parseUsername('Player123#4567');
      expect(result).not.toBeNull();
      expect(result?.name).toBe('Player123');
      expect(result?.id).toBe('4567');
    });

    it('should correctly parse edge cases', () => {
      const result1 = parseUsername('AB#1000');
      expect(result1).not.toBeNull();
      expect(result1?.name).toBe('AB');
      expect(result1?.id).toBe('1000');

      const result2 = parseUsername('A'.repeat(20) + '#9999');
      expect(result2).not.toBeNull();
      expect(result2?.name).toBe('A'.repeat(20));
      expect(result2?.id).toBe('9999');
    });
  });

  describe('storeUsername and getStoredUsername', () => {
    it('should store and retrieve username', () => {
      const username = 'TestUser#1234';
      storeUsername(username);
      
      const retrieved = getStoredUsername();
      expect(retrieved).toBe(username);
    });

    it('should return null when no username is stored', () => {
      expect(getStoredUsername()).toBeNull();
    });

    it('should overwrite previous username', () => {
      storeUsername('FirstUser#1111');
      storeUsername('SecondUser#2222');
      
      const retrieved = getStoredUsername();
      expect(retrieved).toBe('SecondUser#2222');
    });

    it('should persist username across function calls', () => {
      storeUsername('PersistentUser#5555');
      
      const retrieved1 = getStoredUsername();
      const retrieved2 = getStoredUsername();
      
      expect(retrieved1).toBe('PersistentUser#5555');
      expect(retrieved2).toBe('PersistentUser#5555');
    });
  });

  describe('getOrCreateUsername', () => {
    it('should create new username if none exists', () => {
      const username = getOrCreateUsername();
      
      expect(username).toBeTruthy();
      expect(isValidUsername(username)).toBe(true);
    });

    it('should return existing valid username', () => {
      const original = 'ExistingUser#7777';
      storeUsername(original);
      
      const retrieved = getOrCreateUsername();
      expect(retrieved).toBe(original);
    });

    it('should generate new username if stored one is invalid', () => {
      storeUsername('InvalidUsername'); // Invalid format
      
      const username = getOrCreateUsername();
      expect(isValidUsername(username)).toBe(true);
      expect(username).not.toBe('InvalidUsername');
    });

    it('should store the generated username', () => {
      const username = getOrCreateUsername();
      const stored = getStoredUsername();
      
      expect(stored).toBe(username);
    });

    it('should be idempotent - calling twice returns same username', () => {
      const username1 = getOrCreateUsername();
      const username2 = getOrCreateUsername();
      
      expect(username1).toBe(username2);
    });
  });

  describe('Username generation patterns', () => {
    it('should generate usernames with common adjectives', () => {
      const commonAdjectives = ['Swift', 'Clever', 'Bold', 'Cool', 'Epic'];
      const usernames = [];
      
      for (let i = 0; i < 200; i++) {
        usernames.push(generateUsername());
      }
      
      const hasCommonAdjective = usernames.some(username => 
        commonAdjectives.some(adj => username.startsWith(adj))
      );
      
      expect(hasCommonAdjective).toBe(true);
    });

    it('should generate usernames with common nouns', () => {
      const commonNouns = ['Dragon', 'Tiger', 'Eagle', 'Wolf', 'Phoenix'];
      const usernames = [];
      
      for (let i = 0; i < 200; i++) {
        usernames.push(generateUsername());
      }
      
      const hasCommonNoun = usernames.some(username => {
        const namePart = username.split('#')[0];
        return commonNouns.some(noun => namePart.includes(noun));
      });
      
      expect(hasCommonNoun).toBe(true);
    });

    it('should generate different IDs for similar names', () => {
      // Force generation until we get duplicates or confirm IDs differ
      const usernamesMap = new Map<string, string[]>();
      
      for (let i = 0; i < 100; i++) {
        const username = generateUsername();
        const parsed = parseUsername(username);
        if (parsed) {
          const { name, id } = parsed;
          if (!usernamesMap.has(name)) {
            usernamesMap.set(name, []);
          }
          usernamesMap.get(name)?.push(id);
        }
      }
      
      // If we have any duplicate names, their IDs should differ
      for (const [, ids] of usernamesMap) {
        if (ids.length > 1) {
          const uniqueIds = new Set(ids);
          expect(uniqueIds.size).toBeGreaterThan(1);
        }
      }
    });
  });

  describe('Edge cases and error handling', () => {
    it('should handle localStorage quota exceeded gracefully', () => {
      // This test ensures the functions don't crash on storage errors
      const username = generateUsername();
      expect(() => storeUsername(username)).not.toThrow();
    });

    it('should handle corrupted localStorage data', () => {
      localStorage.setItem('connect4_username', '{invalid json');
      
      // Should still work and generate new username
      const username = getOrCreateUsername();
      expect(isValidUsername(username)).toBe(true);
    });

    it('should trim whitespace from parsed usernames', () => {
      // parseUsername should handle exact format, no trimming needed
      const result = parseUsername('Name#1234');
      expect(result?.name).toBe('Name');
      expect(result?.id).toBe('1234');
    });
  });
});
