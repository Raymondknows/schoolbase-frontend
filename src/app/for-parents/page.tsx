import type { Metadata } from 'next'
import { Bell, BookOpen, CalendarDays, CreditCard, FileText, MessageCircle } from 'lucide-react'
import { PublicAudienceShell } from '@/components/public-audience-shell'

export const metadata: Metadata = {
	title: 'SchoolBase for Parents | Stay Connected to Your School',
	description: 'Give parents clear access to school fees, results, attendance, announcements, and important updates.',
	alternates: { canonical: 'https://schoolbase.live/for-parents' },
	openGraph: { title: 'SchoolBase for Parents | Stay Connected to Your School', description: 'Give parents clear access to school fees, results, attendance, announcements, and important updates.', url: 'https://schoolbase.live/for-parents', type: 'website' },
}

export default function ParentsPage() { return <PublicAudienceShell eyebrow="For parents" title="Keep families connected to the school, without the uncertainty." description="SchoolBase gives parents a clearer view of fees, results, attendance, announcements, and school updates through one dependable experience." proofLabel="Parent experience" proofTitle="The updates families need, in one place" sectionLabel="For every family" sectionTitle="More clarity around the moments that matter." ctaTitle="Build a parent experience that earns trust every term." highlights={['Fee balances and due dates', 'Payment reminders', 'Results in real time', 'Attendance visibility', 'School announcements', 'Direct updates']} features={[{ icon: CreditCard, title: 'Fees and payments', description: 'See what is due, what has been paid, and keep payment information easy to find.' }, { icon: FileText, title: 'Results access', description: 'Give families timely access to student results and reports when they are published.' }, { icon: CalendarDays, title: 'Attendance visibility', description: 'Help parents stay aware of attendance patterns and important school-day updates.' }, { icon: Bell, title: 'Announcements', description: 'Keep school notices and reminders from getting lost across disconnected channels.' }, { icon: MessageCircle, title: 'Direct communication', description: 'Make it easier for schools and families to stay aligned when questions arise.' }, { icon: BookOpen, title: 'Student progress', description: 'Bring academic information together so families can support learning with context.' }]} /> }
