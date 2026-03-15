import { autoAssureExamSession, startExam, getGlobalTargetPic, getGlobalTargetHtml } from '@/lib/actions';
import { redirect } from 'next/navigation';
import ExamInterface from '@/components/ExamInterface';

export default async function ExamPage() {
  const session = await autoAssureExamSession();
  const globalTargetPic = await getGlobalTargetPic();
  const globalTargetHtml = await getGlobalTargetHtml();

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

  return <ExamInterface 
    initialRemainingTime={session.remaining_time} 
    initialWarnings={session.warnings} 
    targetPic={globalTargetPic || session.target_pic} 
    targetHtml={globalTargetHtml} 
  />;
}
