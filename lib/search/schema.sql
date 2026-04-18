CREATE TABLE IF NOT EXISTS cves (
    id TEXT PRIMARY KEY,
    description TEXT,
    cvssScore REAL,
    severity TEXT,
    affectedProducts TEXT,
    cwe TEXT,
    publishedDate TEXT,
    lastModifiedDate TEXT,
    epssScore REAL,
    exploitExists INTEGER DEFAULT 0,
    patchAvailable INTEGER DEFAULT 0,
    isZeroDay INTEGER DEFAULT 0,
    patchDate TEXT
);

-- FTS5 virtual table for full-text search
CREATE VIRTUAL TABLE IF NOT EXISTS cves_fts USING fts5(
    id,
    description,
    affectedProducts,
    cwe,
    content='cves',
    content_rowid='rowid'
);

-- Triggers to safely keep the FTS table synchronized with the master cves table
CREATE TRIGGER IF NOT EXISTS cves_ai AFTER INSERT ON cves BEGIN
  INSERT INTO cves_fts(rowid, id, description, affectedProducts, cwe) 
  VALUES (new.rowid, new.id, new.description, new.affectedProducts, new.cwe);
END;

CREATE TRIGGER IF NOT EXISTS cves_ad AFTER DELETE ON cves BEGIN
  INSERT INTO cves_fts(cves_fts, rowid, id, description, affectedProducts, cwe) 
  VALUES('delete', old.rowid, old.id, old.description, old.affectedProducts, old.cwe);
END;

CREATE TRIGGER IF NOT EXISTS cves_au AFTER UPDATE ON cves BEGIN
  INSERT INTO cves_fts(cves_fts, rowid, id, description, affectedProducts, cwe) 
  VALUES('delete', old.rowid, old.id, old.description, old.affectedProducts, old.cwe);
  INSERT INTO cves_fts(rowid, id, description, affectedProducts, cwe) 
  VALUES (new.rowid, new.id, new.description, new.affectedProducts, new.cwe);
END;

-- Part B: Email Alerts Infrastructure
CREATE TABLE IF NOT EXISTS alert_subscriptions (
    id TEXT PRIMARY KEY,
    email TEXT NOT NULL,
    product TEXT,
    severity_threshold TEXT NOT NULL DEFAULT 'HIGH',
    confirmed INTEGER NOT NULL DEFAULT 0,
    confirm_token TEXT NOT NULL,
    unsubscribe_token TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
