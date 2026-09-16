import type { Metadata } from 'next'
import { BookOpen, ClipboardList, MessageCircle, PenLine, TrendingUp, Users } from 'lucide-react'
import { PublicAudienceShell } from '@/components/public-audience-shell'

export const metadata: Metadata = {
	title: 'SchoolBase for Teachers | Teacher School Management Tools',
	description: 'Help teachers manage classes, attendance, results, progress, and parent communication in one place.',
	alternates: { canonical: 'https://schoolbase.live/for-teachers' },
	openGraph: { title: 'SchoolBase for Teachers | Teacher School Management Tools', description: 'Help teachers manage classes, attendance, results, progress, and parent communication in one place.', url: 'https://schoolbase.live/for-teachers', type: 'website' },
}

export default function TeachersPage() { return <PublicAudienceShell eyebrow="For teachers" title="Give teachers more time for teaching, not paperwork." description="SchoolBase makes everyday class work lighter with quick attendance, connected student records, simple result entry, and clearer communication with parents." proofLabel="Teacher workspace" proofTitle="The class information you need, ready" sectionLabel="Your teaching workflow" sectionTitle="Move from classroom record to parent update without the paperwork pile." ctaTitle="Let teachers focus on students while SchoolBase handles the admin." highlights={['Class information', 'One-tap attendance', 'Result entry', 'Progress tracking', 'Parent communication', 'Grade reports']} features={[{ icon: Users, title: 'Class information', description: 'Keep student and class details available where teachers need them.' }, { icon: ClipboardList, title: 'One-tap attendance', description: 'Record attendance quickly and surface patterns that need follow-up.' }, { icon: PenLine, title: 'Result entry', description: 'Enter, validate, and publish academic results through a consistent workflow.' }, { icon: TrendingUp, title: 'Progress tracking', description: 'See how students and subjects are developing across the term.' }, { icon: MessageCircle, title: 'Parent communication', description: 'Share important updates through connected school communication channels.' }, { icon: BookOpen, title: 'Grade reports', description: 'Generate clear academic reports without rebuilding them in spreadsheets.' }]} /> }
