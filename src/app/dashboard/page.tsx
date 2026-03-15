import { getUser, autoAssureExamSession, getAdminData, logout, getGlobalTargetPic, getGlobalTargetHtml } from '@/lib/actions';
import { redirect } from 'next/navigation';
import { ExamSession } from '@/lib/db';
import { LogOut, Play, ShieldAlert, FileText, CheckCircle, Clock, Image as ImageIcon, Code } from 'lucide-react';
import Link from 'next/link';
import DeleteResultButton from '@/components/DeleteResultButton';
import TargetPicUpload from '@/components/TargetPicUpload';
import TargetHtmlEditor from '@/components/TargetHtmlEditor';

export default async function DashboardPage() {
  const user = await getUser();

  if (!user) {
    redirect('/');
  }

  if (user.role === 'admin') {
    return <AdminDashboard />;
  }

  // Assure session and calculate any time passed for students
  const session = await autoAssureExamSession();

  return (
    <div className="min-h-screen text-[var(--text-primary)] pb-12">
      <div className="container">
        <div className="dashboard-header mt-8">
          <div>
            <h1 className="text-3xl mb-1">Welcome, {user.fullName}</h1>
            <p className="text-secondary">Student ID: {user.username}</p>
          </div>
          <form action={logout}>
            <button className="btn btn-danger" type="submit">
              <LogOut className="w-4 h-4" /> Logout
            </button>
          </form>
        </div>

        {session ? (
          <div className="card glass-panel animate-fade-in mt-6 max-w-4xl mx-auto">
            <h2 className="text-2xl mb-6 pb-4 border-b border-[var(--border)]">{session.exam_name}</h2>
            
            <div className="stats-grid">
              <div className="stat-card">
                <Clock className="w-8 h-8 text-[var(--accent)] mx-auto mb-2" />
                <h3 className="text-secondary text-sm">Remaining Time</h3>
                <div className="stat-value">
                  {Math.floor(session.remaining_time / 60)}:
                  {String(session.remaining_time % 60).padStart(2, '0')}
                </div>
              </div>
              
              <div className="stat-card">
                <ShieldAlert className="w-8 h-8 text-[var(--warning)] mx-auto mb-2" />
                <h3 className="text-secondary text-sm">Warnings</h3>
                <div className={`stat-value ${session.warnings > 0 ? 'text-[var(--warning)]' : 'text-[var(--success)]'}`}>
                  {session.warnings} / 2
                </div>
              </div>
              
              <div className="stat-card">
                <CheckCircle className="w-8 h-8 text-[var(--success)] mx-auto mb-2" />
                <h3 className="text-secondary text-sm">Status</h3>
                <div className="font-semibold mt-3 capitalize text-lg text-[var(--text-primary)]">
                  {session.status.replace('_', ' ')}
                </div>
              </div>
            </div>

            <div className="bg-[var(--bg-input)] p-6 rounded-[var(--radius)] mb-6">
              <h3 className="text-xl mb-4 font-semibold text-[var(--warning)] flex items-center gap-2">
                <ShieldAlert className="w-5 h-5" /> Strict Exam Rules
              </h3>
              <ul className="list-disc pl-6 space-y-2 text-[var(--text-secondary)]">
                <li>Do not switch tabs or windows. Doing so will issue a warning.</li>
                <li>You must remain in fullscreen mode for the duration of the exam.</li>
                <li>2 Warnings will result in an immediate automatic submission of your exam.</li>
                <li>The timer cannot be paused or reset by refreshing the page.</li>
                <li>Ensure a stable internet connection before starting.</li>
              </ul>
            </div>

            {(session.status === 'not_started' || session.status === 'ongoing') ? (
              <div className="flex justify-end mt-8 border-t border-[var(--border)] pt-6">
                 <Link href="/exam" className="btn btn-primary text-lg px-8 py-4 shadow-lg shadow-blue-500/30">
                  <Play className="w-5 h-5 mr-2" />
                  {session.status === 'ongoing' ? 'Resume Exam' : 'Start Exam Now'}
                </Link>
              </div>
            ) : (
                <div className="text-center p-12 bg-[rgba(16,185,129,0.1)] border border-[var(--success)] rounded-[var(--radius)] mt-8 animate-fade-in shadow-lg">
                    <CheckCircle className="w-16 h-16 text-[var(--success)] mx-auto mb-6 animate-float" />
                    <h2 className="text-3xl text-[var(--success)] font-bold mb-3">Exam Completed securely</h2>
                    <p className="text-[var(--text-secondary)]">Your assessment has been recorded and will be evaluated by instructors soon.</p>
                </div>
            )}
          </div>
        ) : (
          <div className="card text-center py-12">
            <h2 className="text-xl mb-2">No active exams found</h2>
            <p className="text-secondary">Please contact your administrator if you believe this is an error.</p>
          </div>
        )}
      </div>
    </div>
  );
}

async function AdminDashboard() {
  const data = await getAdminData();
  const globalTargetPic = await getGlobalTargetPic();
  const globalTargetHtml = await getGlobalTargetHtml();
  
  return (
    <div className="min-h-screen text-[var(--text-primary)] pb-12">
      <div className="container">
        <div className="dashboard-header mt-8">
          <div>
            <h1 className="text-3xl mb-1 flex items-center gap-3">
              <ShieldAlert className="w-8 h-8 text-[var(--accent)] animate-float" /> Admin Center
            </h1>
            <div className="flex items-center gap-4 mt-2">
                <p className="text-secondary">Manage and review all student assessments</p>
                <Link href="/admin/students" className="text-sm bg-[var(--bg-input)] hover:bg-[var(--accent)] text-white px-3 py-1 rounded-full transition-colors">
                    Manage Students
                </Link>
            </div>
          </div>
          <form action={logout}>
            <button className="btn btn-danger" type="submit">
              <LogOut className="w-4 h-4" /> Logout
            </button>
          </form>
        </div>

        {/* Global Settings Section */}
        <div className="card glass-panel animate-fade-in mt-6 border-l-4 border-[var(--accent)]">
            <h2 className="text-xl mb-6 flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-[var(--accent)]" /> 
                Exam Strategy & Assets
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="p-6 bg-black/20 rounded-2xl border border-white/5 shadow-xl">
                    <div className="flex items-center gap-2 mb-4">
                        <ImageIcon className="w-5 h-5 text-[var(--accent)]" />
                        <h3 className="text-sm font-bold uppercase tracking-widest text-zinc-300">Target Design Asset</h3>
                    </div>
                    <TargetPicUpload isGlobal initialPic={globalTargetPic} />
                    <p className="text-[10px] text-zinc-500 mt-4 leading-relaxed">
                        Upload the reference UI design. This visual target will be pinned to the student's sidebar for replication.
                    </p>
                </div>
                
                <div className="flex flex-col">
                    <TargetHtmlEditor initialHtml={globalTargetHtml} />
                </div>
            </div>
        </div>
        
        <div className="card glass-panel animate-fade-in mt-6">
            <h2 className="text-2xl mb-6 pb-4 border-b border-[var(--border)] flex items-center gap-2">
                <FileText className="w-6 h-6" /> Assessment Results
            </h2>
            
            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="border-b border-[var(--border)] text-[var(--text-secondary)] uppercase text-sm">
                            <th className="p-4 font-semibold">Candidate</th>
                            <th className="p-4 font-semibold">Exam Name</th>
                            <th className="p-4 font-semibold">Status</th>
                            <th className="p-4 font-semibold">Warnings</th>
                            <th className="p-4 font-semibold">Time Used</th>
                            <th className="p-4 font-semibold text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {data && data.length > 0 ? (data as (ExamSession & { username: string; fullName: string })[]).map((session) => {
                            return (
                                <tr key={session.id} className="border-b border-[var(--border)] hover:bg-[var(--bg-input)] transition-colors">
                                    <td className="p-4 font-medium flex-col flex">
                                        {session.fullName}
                                        <span className="text-xs text-[var(--text-secondary)] font-normal">{session.username}</span>
                                    </td>
                                    <td className="p-4">{session.exam_name}</td>
                                    <td className="p-4">
                                        <span className={`px-3 py-1 text-xs font-semibold rounded-full uppercase
                                            ${session.status === 'completed' ? 'bg-[rgba(16,185,129,0.2)] text-[var(--success)]' : 
                                              session.status === 'auto_submitted' ? 'bg-[rgba(239,68,68,0.2)] text-[var(--danger)]' : 
                                              session.status === 'ongoing' ? 'bg-[rgba(59,130,246,0.2)] text-[var(--accent)]' : 
                                              'bg-[var(--bg)] text-[var(--text-secondary)]'}`}>
                                            {session.status.replace('_', ' ')}
                                        </span>
                                    </td>
                                    <td className="p-4">
                                        <div className={`font-semibold ${session.warnings >= 2 ? 'text-[var(--danger)]' : session.warnings > 0 ? 'text-[var(--warning)]' : ''}`}>
                                            {session.warnings} / 2
                                        </div>
                                    </td>
                                    <td className="p-4 text-[var(--text-secondary)]">
                                        {Math.floor((1800 - session.remaining_time) / 60)} min
                                    </td>
                                    <td className="p-4 text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            <Link href={`/admin/${session.id}`} className="btn bg-[var(--bg)] hover:bg-[var(--bg-input)] border border-[var(--border)] text-sm">
                                                View Code
                                            </Link>
                                            <DeleteResultButton id={session.id} />
                                        </div>
                                    </td>
                                </tr>
                            );
                        }) : (
                            <tr>
                                <td colSpan={6} className="text-center p-8 text-[var(--text-secondary)]">
                                    No assessment data available.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
      </div>
    </div>
  );
}
