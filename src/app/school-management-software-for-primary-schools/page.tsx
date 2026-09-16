import type { Metadata } from 'next'
import { BookOpen, ClipboardCheck, MessageSquareText, ShieldCheck, Sparkles, Users } from 'lucide-react'
import { PublicProductShell } from '@/components/public-product-shell'

export const metadata: Metadata = {
  title: 'School Management Software for Primary Schools | SchoolBase',
  description: 'Practical school management software for primary schools with attendance, parent communication, student records, and connected daily workflows.',
  keywords: ['school management software for primary schools', 'primary school management system', 'school software for primary schools', 'primary school admin software'],
}

export default function PrimarySchoolsPage() {
  return <PublicProductShell
    eyebrow="Primary schools"
    title="Give your primary school a simpler way to keep everyone in step."
    description="SchoolBase brings class records, attendance, fees, results, and parent updates into one practical platform that teachers and administrators can use every day."
    proofTitle="Practical workflows for primary teams"
    sectionTitle="Make the work around every classroom easier to follow."
    ctaTitle="Give your school one clearer place to work."
    highlights={['Easy teacher adoption', 'Attendance tracking', 'Parent updates', 'Student records', 'Shared staff access', 'Fast setup']}
    features={[
      { title: 'Simple for teachers', description: 'Record attendance, enter marks, and manage class information through a focused workspace that is easy to adopt.', icon: BookOpen },
      { title: 'Attendance families can trust', description: 'Keep daily attendance records organised and give school teams a clear view of absence and punctuality.', icon: ClipboardCheck },
      { title: 'Communication with families', description: 'Send reminders, school news, and academic updates through communication workflows families already use.', icon: MessageSquareText },
      { title: 'Practical school operations', description: 'Bring the core work of a primary school together without adding unnecessary complexity for staff.', icon: Sparkles },
      { title: 'Shared access across roles', description: 'Let principals, class teachers, and administrators work from the same school records instead of duplicate files.', icon: Users },
      { title: 'Secure record keeping', description: 'Keep student and school information organised with permission-aware access and dependable operational controls.', icon: ShieldCheck },
    ]}
  />
}
