import { describe, it, expect, beforeEach, vi } from 'vitest';
import { db } from '@/lib/search';

// For search tests, we'll verify the schema exists and basic query patterns
// Note: Since lib/search/index.ts is a singleton connecting to cves.sqlite,
// we are interacting with the project's local DB file.
describe('Search Library (SQLite)', () => {
  it('has the cves table initialized', () => {
    const tableInfo = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='cves'").get();
    expect(tableInfo).toBeDefined();
  });

  it('can perform a basic ID lookup', () => {
    // We insert a dummy record for testing if it doesn't exist
    // In a real isolated env, we'd use a separate test DB
    db.prepare('INSERT OR IGNORE INTO cves (id, description, cvssScore, severity) VALUES (?, ?, ?, ?)').run(
      'TEST-UNIT-001',
      'Test Unit Case',
      5.0,
      'MEDIUM'
    );

    const result = db.prepare('SELECT * FROM cves WHERE id = ?').get('TEST-UNIT-001') as any;
    expect(result).toBeDefined();
    expect(result.id).toBe('TEST-UNIT-001');
    expect(result.severity).toBe('MEDIUM');
  });

  it('handles non-existent CVEs gracefully', () => {
    const result = db.prepare('SELECT * FROM cves WHERE id = ?').get('NON-EXISTENT-XYZ');
    expect(result).toBeUndefined();
  });
});
