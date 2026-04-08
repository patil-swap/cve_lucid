import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

// Initialize embedded db
const dbPath = path.resolve(process.cwd(), 'cves.sqlite');
const db = new Database(dbPath);
db.pragma('journal_mode = WAL');

// Ensure schema is created seamlessly checking file bindings
const schemaPath = path.resolve(process.cwd(), 'lib/search/schema.sql');
const schema = fs.readFileSync(schemaPath, 'utf8');

// better-sqlite3 allows executing multiple statements safely
db.exec(schema);

export { db };
