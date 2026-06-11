// lib/search/index.ts
import { createClient } from '@libsql/client';
import fs from 'fs';
import path from 'path';

const client = createClient({
    url: process.env.TURSO_DATABASE_URL || 'file:cves.sqlite',
    authToken: process.env.TURSO_AUTH_TOKEN,
});

// We'll export an async function that returns the client once the schema is applied
let initialized = false;
const schemaPath = path.resolve(process.cwd(), 'lib/search/schema.sql');

export async function getDb() {
    if (!initialized) {
        const schema = fs.readFileSync(schemaPath, 'utf8');
        await client.executeMultiple(schema);
        initialized = true;
    }
    return client;
}