import type { Metadata } from 'next'
import { BarChart3, BookMarked, ClipboardList, MessageSquareText, ShieldCheck, TrendingUp } from 'lucide-react'
import { PublicProductShell } from '@/components/public-product-shell'

export const metadata: Metadata = {
  title: 'School Management Software for Secondary Schools | SchoolBase',
  description: 'Connected school management software for secondary schools with assessments, results, broadsheets, subject tracking, fees, and parent communication.',
  keywords: ['school management software for secondary schools', 'secondary school management system', 'school software for secondary schools', 'exam management software'],
}

export default function SecondarySchoolsPage() {
  return <PublicProductShell
    eyebrow="Secondary schools"
    title="Bring academic oversight and school operations into one clearer system."
    description="SchoolBase connects classes, subjects, assessments, results, fees, and parent communication so secondary-school teams can report faster and work with better visibility."
    proofTitle="Clear academic workflows for school teams"
    sectionTitle="Make every term easier to manage, review, and communicate."
    ctaTitle="Give your secondary school a stronger operating foundation."
    highlights={['Exam results', 'Broadsheets', 'Subject tracking', 'Parent updates', 'Fee visibility', 'Academic reporting']}
    features={[
      { title: 'Results that are easier to release', description: 'Organise marks, calculate grades, and share published report cards with parents through a clearer workflow.', icon: BarChart3 },
      { title: 'Broadsheets and subject reports', description: 'Create academic summaries that help principals and heads of department review performance across the school.', icon: BookMarked },
      { title: 'Structured assessments', description: 'Keep classes, subjects, terms, and marks entry organised so teachers can work consistently.', icon: ClipboardList },
      { title: 'Parent communication at scale', description: 'Share result notices, event reminders, fee updates, and school messages through connected channels.', icon: MessageSquareText },
      { title: 'Insight into performance', description: 'Review trends and identify where students or subjects may need attention before challenges grow.', icon: TrendingUp },
      { title: 'Secure academic records', description: 'Keep student reports and school data organised with role-aware access and dependable operational controls.', icon: ShieldCheck },
    ]}
  />
}
