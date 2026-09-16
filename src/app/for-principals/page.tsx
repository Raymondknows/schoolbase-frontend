import type { Metadata } from 'next'
import { AlertCircle, BarChart3, Lock, TrendingUp, Users, Zap } from 'lucide-react'
import { PublicAudienceShell } from '@/components/public-audience-shell'

export const metadata: Metadata = {
	title: 'SchoolBase for School Principals | Principal Dashboard',
	description: 'Review school finances, academics, attendance, enrollment, and communication through connected operational workflows.',
	alternates: { canonical: 'https://schoolbase.live/for-principals' },
	openGraph: { title: 'SchoolBase for School Principals | Principal Dashboard', description: 'Review school finances, academics, attendance, enrollment, and communication through connected operational workflows.', url: 'https://schoolbase.live/for-principals', type: 'website' },
}

export default function PrincipalsPage() { return <PublicAudienceShell eyebrow="For principals" title="Lead your school with a clearer view of what is happening." description="Bring financial health, academic performance, attendance, enrollment, and staff activity into one practical view for faster, more confident decisions." proofLabel="Principal view" proofTitle="The information leaders need, connected" sectionLabel="Your leadership workspace" sectionTitle="See the signals that help you act earlier." ctaTitle="Give your school leadership a clearer operating picture." highlights={['Financial overview', 'Academic performance', 'Enrollment tracking', 'Alerts and issues', 'Compliance-ready records', 'Board reports']} features={[{ icon: BarChart3, title: 'Financial overview', description: 'See fees due, collected, overdue, and reconciled without waiting for manual reports.' }, { icon: TrendingUp, title: 'Academic performance', description: 'Spot class and subject trends so support reaches the right students sooner.' }, { icon: Users, title: 'Enrollment tracking', description: 'Keep a live view of students, classes, growth, and capacity.' }, { icon: AlertCircle, title: 'Alerts and issues', description: 'Bring high absenteeism, collection gaps, and unusual results to your attention.' }, { icon: Lock, title: 'Compliance-ready records', description: 'Maintain a clear audit trail for grades, attendance, payments, and school operations.' }, { icon: Zap, title: 'Board reports', description: 'Turn connected school data into clear reports for meetings and planning.' }]} /> }
