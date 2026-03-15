'use client';

import { useState } from 'react';
import { useActionState } from 'react';
import { addStudent, editStudent, deleteStudent, type ActionState } from '@/lib/actions';
import Link from 'next/link';
import { ArrowLeft, UserPlus, FileEdit, Trash2, Users } from 'lucide-react';

const initialAddState: ActionState = {};
const initialEditState: ActionState = {};

interface Student {
  id: number;
  username: string;
  fullName: string;
}

export default function ClientStudents({ initialStudents }: { initialStudents: Student[] }) {
  const [addState, addFormAction] = useActionState(addStudent, initialAddState);
  const [editState, editFormAction] = useActionState(editStudent, initialEditState);
  
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);

  const handleDelete = async (id: number) => {
    if (confirm("Are you sure you want to delete this student and their exam records?")) {
       await deleteStudent(id);
       window.location.reload();
    }
  };

  return (
    <div className="min-h-screen text-[var(--text-primary)] pb-12">
      <div className="container">
        
        {/* Header */}
        <div className="dashboard-header mt-8">
          <div>
            <h1 className="text-3xl mb-1 flex items-center gap-3">
              <Users className="w-8 h-8 text-[var(--accent)] animate-float" /> Student Management
            </h1>
            <p className="text-secondary">Manage registered student accounts and passwords</p>
          </div>
          <Link href="/dashboard" className="btn bg-[var(--bg-input)] hover:bg-[var(--accent)] text-white flex items-center gap-2 border border-[var(--border)]">
              <ArrowLeft className="w-4 h-4"/> Back to Dashboard
          </Link>
        </div>

        <div className="flex gap-8 items-start flex-col lg:flex-row mt-6">
            {/* Left side: Add/Edit Form */}
            <div className="flex-1 card glass-panel w-full">
               <h2 className="text-xl mb-4 border-b border-[var(--border)] pb-4 flex items-center gap-2">
                   {editingStudent ? <><FileEdit className="w-5 h-5"/> Edit Student</> : <><UserPlus className="w-5 h-5"/> Register Student</>}
               </h2>
               
               <form action={editingStudent ? editFormAction : addFormAction} className="flex flex-col gap-4">
                  {/* Status msg */}
                  {editingStudent ? (
                      editState?.error && <div className="bg-red-500/10 text-red-500 p-3 rounded-md text-sm border border-red-500/20">{editState.error}</div>
                  ) : (
                      addState?.error && <div className="bg-red-500/10 text-red-500 p-3 rounded-md text-sm border border-red-500/20">{addState.error}</div>
                  )}
                  {editingStudent ? (
                      editState?.success && <div className="bg-[rgba(16,185,129,0.1)] text-[var(--success)] p-3 rounded-md text-sm border border-[var(--success)]">{editState.success}</div>
                  ) : (
                      addState?.success && <div className="bg-[rgba(16,185,129,0.1)] text-[var(--success)] p-3 rounded-md text-sm border border-[var(--success)]">{addState.success}</div>
                  )}

                  {editingStudent && <input type="hidden" name="id" value={editingStudent.id} />}

                  <div>
                     <label className="block text-sm font-medium mb-1 text-secondary">Student ID (Username)</label>
                     <input type="text" name="username" defaultValue={editingStudent?.username || ''} required className="input" placeholder="e.g. jdoe123" />
                  </div>
                  
                  <div>
                     <label className="block text-sm font-medium mb-1 text-secondary">Full Name</label>
                     <input type="text" name="fullName" defaultValue={editingStudent?.fullName || ''} required className="input" placeholder="e.g. John Doe" />
                  </div>

                  <div>
                     <label className="block text-sm font-medium mb-1 text-secondary">
                        {editingStudent ? 'New Password (Optional)' : 'Password'}
                     </label>
                     <input type="password" name="password" required={!editingStudent} className="input" placeholder={editingStudent ? 'Leave blank to keep current' : 'Enter password'} />
                  </div>

                  <div className="flex gap-4 mt-2">
                      <button type="submit" className="btn btn-primary flex-1">
                          {editingStudent ? 'Save Changes' : 'Register Student'}
                      </button>
                      {editingStudent && (
                          <button type="button" onClick={() => setEditingStudent(null)} className="btn bg-[#3f3f46] hover:bg-[#52525b] border border-[var(--border)] text-white">
                              Cancel
                          </button>
                      )}
                  </div>
               </form>
            </div>

            {/* Right side: List */}
            <div className="flex-[2] card glass-panel w-full">
               <h2 className="text-xl mb-4 border-b border-[var(--border)] pb-4 flex items-center gap-2">
                 <Users className="w-5 h-5" /> Registered Students ({initialStudents.length})
               </h2>

               <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-[var(--border)] text-[var(--text-secondary)] uppercase text-sm">
                                <th className="p-4 font-semibold">User ID</th>
                                <th className="p-4 font-semibold">Full Name</th>
                                <th className="p-4 font-semibold text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {initialStudents.map((stud) => (
                                <tr key={stud.id} className="border-b border-[var(--border-light)] hover:bg-[rgba(255,255,255,0.02)] transition-colors">
                                    <td className="p-4 font-mono text-[var(--accent)]">{stud.username}</td>
                                    <td className="p-4">{stud.fullName}</td>
                                    <td className="p-4">
                                       <div className="flex items-center justify-end gap-2">
                                        <button onClick={() => setEditingStudent(stud)} className="btn bg-[#27272a] hover:bg-[#3f3f46] border border-[#3f3f46] text-sm px-3 py-1 flex items-center gap-1">
                                            <FileEdit className="w-3 h-3"/> Edit
                                        </button>
                                        <button onClick={() => handleDelete(stud.id)} className="btn btn-danger text-sm px-3 py-1 flex items-center gap-1">
                                            <Trash2 className="w-3 h-3"/> Delete
                                        </button>
                                       </div>
                                    </td>
                                </tr>
                            ))}
                            {initialStudents.length === 0 && (
                                <tr>
                                    <td colSpan={3} className="text-center p-8 text-secondary">No students registered yet.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
               </div>
            </div>
        </div>
      </div>
    </div>
  );
}
