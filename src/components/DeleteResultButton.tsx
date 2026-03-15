'use client';

import { Trash2 } from 'lucide-react';
import { deleteExamSession } from '@/lib/actions';

export default function DeleteResultButton({ id }: { id: number }) {
  const handleDelete = async () => {
    if (confirm("Are you sure you want to delete this assessment result? This cannot be undone.")) {
      await deleteExamSession(id);
    }
  };

  return (
    <button 
      onClick={handleDelete}
      className="btn bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/20 text-sm p-2"
      title="Delete Result"
    >
      <Trash2 className="w-4 h-4" />
    </button>
  );
}
