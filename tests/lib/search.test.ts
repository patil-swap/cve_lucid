import { describe, it, expect, beforeEach, vi } from 'vitest';
import { getDb } from '@/lib/search';

// For search tests, we'll verify the schema exists and basic query patterns
// Note: Since lib/search/index.ts is a singleton connecting to cves.sqlite,
// we are interacting with the project's local DB file.
describe('Search Library (SQLite)', () => {
  it('has the cves table initialized', async () => {
    const db = await getDb();
    const tableInfoRes = await db.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='cves'");
    const tableInfo = tableInfoRes.rows[0];
    expect(tableInfo).toBeDefined();
  });

  it('can perform a basic ID lookup', async () => {
    const db = await getDb();
    // We insert a dummy record for testing if it doesn't exist
    // In a real isolated env, we'd use a separate test DB
    await db.execute({
      sql: 'INSERT OR IGNORE INTO cves (id, description, cvssScore, severity) VALUES (?, ?, ?, ?)',
      args: ['TEST-UNIT-001', 'Test Unit Case', 5.0, 'MEDIUM']
    });

    const resultRes = await db.execute({
      sql: 'SELECT * FROM cves WHERE id = ?',
      args: ['TEST-UNIT-001']
    });
    const result = resultRes.rows[0] as any;
    expect(result).toBeDefined();
    expect(result.id).toBe('TEST-UNIT-001');
    expect(result.severity).toBe('MEDIUM');
  });

  it('handles non-existent CVEs gracefully', async () => {
    const db = await getDb();
    const resultRes = await db.execute({
      sql: 'SELECT * FROM cves WHERE id = ?',
      args: ['NON-EXISTENT-XYZ']
    });
    const result = resultRes.rows[0];
    expect(result).toBeUndefined();
  });
});
