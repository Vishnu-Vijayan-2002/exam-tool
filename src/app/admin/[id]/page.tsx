import { getStudentSubmission } from '@/lib/actions';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, User, Clock, ShieldAlert, Code } from 'lucide-react';

export default async function AdminSubmissionView({ params }: { params: { id: string } }) {
  const { id } = await params;
  const submission = await getStudentSubmission(id);

  if (!submission) {
    redirect('/dashboard');
  }

  // Calculate remaining from the initial 1800 (30 mins)
  const timeUsedMins = Math.floor((1800 - submission.remaining_time) / 60);

  return (
    <div className="flex flex-col h-screen bg-[#1e1e1e] text-white overflow-hidden">
      {/* Admin Header */}
      <header className="exam-header bg-[#2d2d2d] border-[#444] px-6 h-16">
        <div className="flex items-center gap-6">
          <Link href="/dashboard" className="btn bg-transparent hover:bg-[rgba(255,255,255,0.1)] p-2">
            <ArrowLeft className="w-5 h-5 text-gray-300" />
          </Link>
          <div className="flex flex-col">
            <h2 className="font-semibold text-lg leading-tight flex items-center gap-2">
              <User className="w-4 h-4 text-[var(--accent)]" /> {submission.fullName}
            </h2>
            <span className="text-xs text-gray-400">{submission.username} • {submission.exam_name}</span>
          </div>
        </div>

        <div className="flex items-center gap-6 text-sm bg-black/20 px-4 py-2 rounded-lg border border-[#444]">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-gray-400" /> Time used: {timeUsedMins} mins
          </div>
          <div className="w-[1px] h-4 bg-[#444]"></div>
          <div className={`flex items-center gap-2 font-semibold ${submission.warnings >= 2 ? 'text-[var(--danger)]' : submission.warnings > 0 ? 'text-[var(--warning)]' : 'text-[var(--success)]'}`}>
            <ShieldAlert className="w-4 h-4" /> Warnings: {submission.warnings}
          </div>
          <div className="w-[1px] h-4 bg-[#444]"></div>
          <div className="uppercase font-bold text-[var(--accent)] text-xs tracking-wider">
            {submission.status.replace('_', ' ')}
          </div>
        </div>
      </header>
      
      {/* Code Review Layout */}
      <main className="flex-1 flex overflow-hidden">
         <div className="flex-1 flex flex-col border-r border-[#444]">
              {/* Code Editor (Read Only) */}
              <div className="editor-header bg-[#2d2d2d] border-[#444] text-gray-300 flex items-center gap-2 p-3">
                  <Code className="w-4 h-4 text-[var(--accent)]" /> 
                  <span className="font-mono text-sm">index.html (Submitted Code)</span>
              </div>
              <div className="flex-1 bg-[#0d0d0f] relative overflow-hidden">
                  <textarea
                      value={submission.code || '/* No code submitted */'}
                      readOnly
                      className="w-full h-full bg-transparent text-[#e2e8f0] font-mono text-sm p-6 outline-none resize-none cursor-default"
                  />
              </div>
         </div>
         
         {/* Live Output Preview */}
         <div className="flex-1 flex flex-col bg-white">
            <div className="editor-header bg-[#f0f0f0] border-b border-[#ddd] text-gray-700 flex items-center justify-between p-3">
                <span className="font-bold text-sm tracking-wide">Output Rendering (Execution)</span>
                <span className="text-xs bg-black text-white px-2 py-0.5 rounded uppercase">Live Output</span>
            </div>
            <div className="flex-1 relative">
                <iframe 
                    title="Student Preview"
                    className="w-full h-full border-none"
                    srcDoc={`
                        <html>
                          <head>
                             <style>
                                body { margin: 0; padding: 20px; display: flex; align-items: center; justify-content: center; min-height: 100vh; background: #f5f5f5; box-sizing: border-box; }
                             </style>
                          </head>
                          <body>${submission.code || ''}</body>
                        </html>
                    `}
                    sandbox="allow-scripts"
                />
            </div>
         </div>
      </main>
    </div>
  );
}
