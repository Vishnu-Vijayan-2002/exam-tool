'use server';

import { cookies } from 'next/headers';
import bcrypt from 'bcryptjs';
import * as jwt from 'jsonwebtoken';
import { getDb, User, ExamSession } from './db';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';

const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-key-123';

export type ActionState = {
  error?: string;
  success?: string;
};

export async function login(prevState: ActionState | null, formData: FormData) {
  const username = formData.get('username') as string;
  const password = formData.get('password') as string;

  if (!username || !password) {
    return { error: 'Username and password are required' };
  }

  try {
    const db = getDb();
    const userStmt = db.prepare('SELECT * FROM users WHERE username = ?');
    const user = userStmt.get(username) as (User & { password: string }) | undefined;

    if (!user) {
      return { error: 'Invalid username or password' };
    }

    const isValid = await bcrypt.compare(password, user.password);

    if (!isValid) {
      return { error: 'Invalid username or password' };
    }

    // Create session token
    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role, fullName: user.fullName },
      JWT_SECRET,
      { expiresIn: '12h' }
    );

    // Set cookie
    const cookieStore = await cookies();
    cookieStore.set('auth_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
    });
    
    // Assign student an exam session if they don't have one and login role is student
    if (user.role === 'student') {
        const checkExamStmt = db.prepare('SELECT * FROM exam_sessions WHERE user_id = ?');
        const session = checkExamStmt.get(user.id) as ExamSession | undefined;
        
        if (!session) {
            const insertSession = db.prepare(`
                INSERT INTO exam_sessions (user_id, exam_name, remaining_time, status)
                VALUES (?, ?, ?, ?)
            `);
            // Set for 30 minutes = 1800 seconds
            insertSession.run(user.id, 'Frontend Development Assessment', 1800, 'not_started');
        }
    }

  } catch (err) {
    console.error(err);
    return { error: 'An unexpected error occurred' };
  }

  redirect('/dashboard');
}

export async function getUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get('auth_token')?.value;

  if (!token) return null;

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as User;
    return decoded;
  } catch {
    return null;
  }
}

export async function logout() {
  const cookieStore = await cookies();
  cookieStore.delete('auth_token');
  redirect('/');
}

// Exam actions
export async function autoAssureExamSession() {
    const user = await getUser();
    if (!user) return null;
    
    const db = getDb();
    const checkExamStmt = db.prepare('SELECT * FROM exam_sessions WHERE user_id = ?');
    const session = checkExamStmt.get(user.id) as ExamSession | undefined;
    
    // Check if time expired for ongoing session
    if (session && session.status === 'ongoing') {
        const now = Math.floor(Date.now() / 1000);
        const elapsed = now - (session.start_time || now);
        const newRemaining = Math.max(0, session.remaining_time - elapsed);
        
        if (newRemaining <= 0) {
            const updateStmt = db.prepare('UPDATE exam_sessions SET remaining_time = 0, status = "auto_submitted", end_time = ? WHERE id = ?');
            updateStmt.run(now, session.id);
            session.remaining_time = 0;
            session.status = 'auto_submitted';
        } else {
             // Just update start time to now and remaining time so we have a fresh anchor
             const updateStmt = db.prepare('UPDATE exam_sessions SET remaining_time = ?, start_time = ? WHERE id = ?');
             updateStmt.run(newRemaining, now, session.id);
             session.remaining_time = newRemaining;
             session.start_time = now;
        }
    }
    
    return session;
}

export async function startExam() {
    const user = await getUser();
    if (!user) return { error: 'Not authenticated' };
    
    const db = getDb();
    const getSession = db.prepare('SELECT * FROM exam_sessions WHERE user_id = ?');
    const session = getSession.get(user.id) as ExamSession | undefined;
    
    if (!session) return { error: 'No exam assigned' };
    if (session.status === 'completed' || session.status === 'auto_submitted') {
        return { error: 'Exam already completed' };
    }
    
    if (session.status === 'not_started') {
        const now = Math.floor(Date.now() / 1000);
        const updateSession = db.prepare(`
            UPDATE exam_sessions 
            SET status = 'ongoing', start_time = ? 
            WHERE id = ?
        `);
        updateSession.run(now, session.id);
    }
    
    redirect('/exam');
}

export async function submitExam(code: string, isAuto: boolean = false) {
    const user = await getUser();
    if (!user) return { error: 'Not authenticated' };
    
    const db = getDb();
    const getSession = db.prepare('SELECT * FROM exam_sessions WHERE user_id = ?');
    const session = getSession.get(user.id) as ExamSession | undefined;
    
    if (!session) return { error: 'No exam session' };
    
    const now = Math.floor(Date.now() / 1000);
    const newStatus = isAuto ? 'auto_submitted' : 'completed';
    
    let remTime = session.remaining_time;
    if (session.start_time) {
        const elapsed = now - session.start_time;
        remTime = Math.max(0, session.remaining_time - elapsed);
    }
    
    const updateSession = db.prepare(`
        UPDATE exam_sessions 
        SET status = ?, end_time = ?, code = ?, remaining_time = ?
        WHERE id = ?
    `);
    
    updateSession.run(newStatus, now, code, remTime, session.id);
    
    redirect('/dashboard');
}

export async function logWarning() {
    const user = await getUser();
    if (!user) return;
    
    const db = getDb();
    const getSession = db.prepare('SELECT id, warnings FROM exam_sessions WHERE user_id = ?');
    const session = getSession.get(user.id) as { id: number; warnings: number } | undefined;
    
    if (!session) return;
    
    const newWarnings = session.warnings + 1;
    
    const updateSession = db.prepare(`
        UPDATE exam_sessions 
        SET warnings = ?
        WHERE id = ?
    `);
    
    updateSession.run(newWarnings, session.id);
    
    return newWarnings;
}

export async function getAdminData() {
    const user = await getUser();
    if (!user || user.role !== 'admin') return null;
    
    const db = getDb();
    const stmt = db.prepare(`
        SELECT e.*, u.username, u.fullName 
        FROM exam_sessions e 
        JOIN users u ON e.user_id = u.id
    `);
    
    return stmt.all();
}
export async function getStudentSubmission(id: string) {
    const user = await getUser();
    if (!user || user.role !== 'admin') return null;

    const db = getDb();
    const stmt = db.prepare(`
        SELECT e.*, u.username, u.fullName 
        FROM exam_sessions e 
        JOIN users u ON e.user_id = u.id
        WHERE e.id = ?
    `);
    
    return stmt.get(id) as (ExamSession & { username: string; fullName: string }) | undefined;
}

export async function getStudentsList() {
    const user = await getUser();
    if (!user || user.role !== 'admin') return null;
    const db = getDb();
    const listStmt = db.prepare(`SELECT id, username, fullName FROM users WHERE role = 'student'`);
    return listStmt.all();
}

export async function addStudent(prevState: ActionState | null, formData: FormData) {
    const user = await getUser();
    if (!user || user.role !== 'admin') return { error: 'Unauthorized' };
    
    const username = formData.get('username') as string;
    const password = formData.get('password') as string;
    const fullName = formData.get('fullName') as string;
    
    if (!username || !password || !fullName) return { error: 'All fields are required' };
    
    const db = getDb();
    try {
        const hash = await bcrypt.hash(password, 10);
        const stmt = db.prepare("INSERT INTO users (username, password, fullName, role) VALUES (?, ?, ?, 'student')");
        stmt.run(username, hash, fullName);
        revalidatePath('/admin/students');
        return { success: 'Student added successfully' };
    } catch (e: unknown) {
        console.error("Add Student Error:", e);
        const error = e as { code?: string; message?: string };
        if (error.code === 'SQLITE_CONSTRAINT_UNIQUE' || (error.message && error.message.includes('UNIQUE'))) {
            return { error: 'Username already exists' };
        }
        return { error: 'Database error: ' + (error.message || 'Unknown error') };
    }
}

export async function editStudent(prevState: ActionState | null, formData: FormData) {
    const user = await getUser();
    if (!user || user.role !== 'admin') return { error: 'Unauthorized' };
    
    const id = formData.get('id') as string;
    const username = formData.get('username') as string;
    const fullName = formData.get('fullName') as string;
    const password = formData.get('password') as string; // Optional
    
    if (!id || !username || !fullName) return { error: 'Key fields are required' };
    
    const db = getDb();
    try {
        if (password) {
            const hash = await bcrypt.hash(password, 10);
            const stmt = db.prepare('UPDATE users SET username = ?, fullName = ?, password = ? WHERE id = ?');
            stmt.run(username, fullName, hash, parseInt(id));
        } else {
            const stmt = db.prepare('UPDATE users SET username = ?, fullName = ? WHERE id = ?');
            stmt.run(username, fullName, parseInt(id));
        }
        revalidatePath('/admin/students');
        return { success: 'Student updated successfully' };
    } catch (e: unknown) {
        console.error("Edit Student Error:", e);
        const error = e as { code?: string; message?: string };
        if (error.code === 'SQLITE_CONSTRAINT_UNIQUE' || (error.message && error.message.includes('UNIQUE'))) {
            return { error: 'Username already exists' };
        }
        return { error: 'Database error' };
    }
}

export async function deleteStudent(id: number) {
    const user = await getUser();
    if (!user || user.role !== 'admin') return;
    const db = getDb();
    
    // Use transaction to ensure both sessions and user are deleted safely
    const transaction = db.transaction(() => {
        db.prepare('DELETE FROM exam_sessions WHERE user_id = ?').run(id);
        db.prepare('DELETE FROM users WHERE id = ?').run(id);
    });
    
    transaction();
    
    revalidatePath('/admin/students');
}

export async function deleteExamSession(id: number) {
    const user = await getUser();
    if (!user || user.role !== 'admin') return { error: 'Unauthorized' };
    
    const db = getDb();
    db.prepare('DELETE FROM exam_sessions WHERE id = ?').run(id);
    
    revalidatePath('/dashboard');
    return { success: 'Result deleted' };
}
