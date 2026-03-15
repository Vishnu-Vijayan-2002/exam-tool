import { autoAssureExamSession, startExam } from '@/lib/actions';
import { redirect } from 'next/navigation';
import ExamInterface from '@/components/ExamInterface';

export default async function ExamPage() {
  const session = await autoAssureExamSession();

  if (!session) {
    redirect('/dashboard');
  }

  if (session.status === 'completed' || session.status === 'auto_submitted') {
    redirect('/dashboard');
  }

  // If not started, start it
  if (session.status === 'not_started') {
      await startExam();
  }

  return <ExamInterface initialRemainingTime={session.remaining_time} initialWarnings={session.warnings} />;
}
