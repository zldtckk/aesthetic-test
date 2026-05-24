const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const DB_PATH = path.join(__dirname, 'data', 'aesthetic.db');

let db;

function initDB() {
  const dir = path.dirname(DB_PATH);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

  db = new Database(DB_PATH);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');

  db.exec(`
    CREATE TABLE IF NOT EXISTS institutions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      org_id TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      phone TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      brand_color TEXT DEFAULT '#0071e3',
      address TEXT DEFAULT '',
      auth_token TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS reports (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      code TEXT UNIQUE NOT NULL,
      org_id TEXT NOT NULL DEFAULT '',
      tier TEXT NOT NULL,
      total INTEGER NOT NULL,
      answers TEXT DEFAULT '[]',
      scores TEXT DEFAULT '[]',
      timestamp TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_reports_org_id ON reports(org_id);
    CREATE INDEX IF NOT EXISTS idx_reports_code ON reports(code);
  `);

  return db;
}

function getDB() {
  if (!db) return initDB();
  return db;
}

module.exports = { initDB, getDB };
