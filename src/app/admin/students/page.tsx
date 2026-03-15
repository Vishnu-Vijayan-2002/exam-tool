import { getStudentsList } from '@/lib/actions';
import { redirect } from 'next/navigation';
import ClientStudents from './ClientStudents';

export default async function AdminStudentsPage() {
  const students = await getStudentsList();

  if (!students) {
    redirect('/dashboard');
  }

  return <ClientStudents initialStudents={students as Student[]} />;
}

interface Student {
  id: number;
  username: string;
  fullName: string;
}
