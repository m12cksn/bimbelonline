import StudentHome from '@/components/student/StudentHome';
import { defaultGradeCards } from '@/lib/gradeCards';
export const metadata = { title: 'Contoh Dashboard Siswa', robots: { index: false, follow: false } };
export default function Page() { return <StudentHome preview name="Teman Belajar" grades={defaultGradeCards} lesson={null} answerCount={0} materialCount={0} recent={null} />; }
