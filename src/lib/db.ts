import Database from 'better-sqlite3';
import path from 'path';
import bcrypt from 'bcryptjs';

// Get the path to the DB file
const dbPath = path.join(process.cwd(), 'exam.db');

// Check if dev environment
const isDev = process.env.NODE_ENV !== 'production';

declare global {
  var sqliteDb: Database.Database | undefined;
}

if (!global.sqliteDb) {
  const dbInstance = new Database(dbPath, { verbose: isDev ? console.log : undefined });
  dbInstance.pragma('journal_mode = WAL');
  global.sqliteDb = dbInstance;
}
const db = global.sqliteDb;

// Define schema
export const initDb = () => {
  // Create users table
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'student',
      fullName TEXT
    )
  `);

  // Create exams table (sessions)
  db.exec(`
    CREATE TABLE IF NOT EXISTS exam_sessions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      exam_name TEXT NOT NULL,
      start_time INTEGER,
      end_time INTEGER,
      remaining_time INTEGER NOT NULL,
      warnings INTEGER DEFAULT 0,
      status TEXT DEFAULT 'not_started',
      code TEXT,
      target_pic TEXT,
      FOREIGN KEY(user_id) REFERENCES users(id)
    )
  `);

  // Migration: Add target_pic if it doesn't exist
  try {
      db.exec('ALTER TABLE exam_sessions ADD COLUMN target_pic TEXT');
  } catch (e) {
      // Column might already exist
  }

  // Create settings table
  db.exec(`
    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT
    )
  `);

  // Insert default target_pic if not exists
  const checkSetting = db.prepare('SELECT * FROM settings WHERE key = ?');
  if (!checkSetting.get('global_target_pic')) {
      db.prepare('INSERT INTO settings (key, value) VALUES (?, ?)').run('global_target_pic', null);
  }
  if (!checkSetting.get('global_target_html')) {
    db.prepare('INSERT INTO settings (key, value) VALUES (?, ?)').run('global_target_html', null);
  }

  // Insert test users if not exist
  const countStmt = db.prepare(`SELECT COUNT(*) as count FROM users`);
  const { count } = countStmt.get() as { count: number };

  if (count === 0) {
    const insertUser = db.prepare(`
      INSERT INTO users (username, password, role, fullName)
      VALUES (?, ?, ?, ?)
    `);

    const adminHash = bcrypt.hashSync('admin123', 10);
    const studentHash = bcrypt.hashSync('student123', 10);

    insertUser.run('admin', adminHash, 'admin', 'System Administrator');
    insertUser.run('student', studentHash, 'student', 'Test Student');
  }
  
  return db;
};

export const getDb = () => {
    // Ensuring it's initialized
    initDb();
    return db;
};

// Types
export interface User {
  id: number;
  username: string;
  role: 'admin' | 'student';
  fullName: string;
}

export interface ExamSession {
  id: number;
  user_id: number;
  exam_name: string;
  start_time: number | null;
  end_time: number | null;
  remaining_time: number; // in seconds
  warnings: number;
  status: 'not_started' | 'ongoing' | 'completed' | 'auto_submitted';
  code: string | null;
  target_pic: string | null;
}
