import type { Metadata } from 'next'
import { Building2, GraduationCap, MessageSquareText, Receipt, ShieldCheck, Users } from 'lucide-react'
import { PublicProductShell } from '@/components/public-product-shell'

export const metadata: Metadata = {
  title: 'School Management Software for Private Schools | SchoolBase',
  description: 'Modern school management software for private schools with connected admissions, fees, results, parent communication, and school records.',
  keywords: ['school management software for private schools', 'private school management system', 'school software for private schools', 'education management software', 'West African school software'],
}

export default function PrivateSchoolsPage() {
  return <PublicProductShell
    eyebrow="Private schools"
    title="Bring every part of your private school into one clearer system."
    description="SchoolBase connects admissions, fees, academics, results, parent communication, and school records so private-school teams can work with more visibility and less manual repetition."
    proofTitle="One connected view for school leaders"
    sectionTitle="Give every department a reliable workflow to work from."
    ctaTitle="Build a stronger operating foundation for your school."
    highlights={['Admissions workflow', 'Fee visibility', 'Parent updates', 'Digital results', 'Role-aware access', 'School records']}
    features={[
      { title: 'Admissions that stay organised', description: 'Keep new student intake, school records, and the information your team needs connected from the start.', icon: Building2 },
      { title: 'Fee collection without guesswork', description: 'Track invoices, payments, balances, reminders, and receipts in one clearer financial workflow.', icon: Receipt },
      { title: 'Results and reports in one place', description: 'Organise academic records and give teachers, parents, and school leadership a clearer view of progress.', icon: GraduationCap },
      { title: 'Parent communication that connects', description: 'Share announcements, reminders, and academic updates through communication workflows families already use.', icon: MessageSquareText },
      { title: 'Workspaces for every role', description: 'Give principals, bursars, teachers, and administrators access to the information relevant to their responsibilities.', icon: Users },
      { title: 'Ready for steady growth', description: 'Keep operations organised as your school grows, adds staff, and takes on more students and families.', icon: ShieldCheck },
    ]}
  />
}
