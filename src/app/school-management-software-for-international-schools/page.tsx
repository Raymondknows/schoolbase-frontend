import type { Metadata } from 'next'
import { Globe2, GraduationCap, Languages, ShieldCheck, Sparkles, Users } from 'lucide-react'
import { PublicProductShell } from '@/components/public-product-shell'

export const metadata: Metadata = {
  title: 'School Management Software for International Schools | SchoolBase',
  description: 'Flexible school management software for international schools with connected administration, academics, fees, results, and parent communication.',
  keywords: ['school management software for international schools', 'international school management system', 'school software for international schools', 'international school admin software'],
}

export default function InternationalSchoolsPage() {
  return <PublicProductShell
    eyebrow="International schools"
    title="Give a diverse school community one clearer way to work."
    description="SchoolBase connects administration, academics, fees, results, and parent communication for international schools that need practical flexibility across their daily operations."
    proofTitle="Flexible operations for modern schools"
    sectionTitle="Bring the work across your school into one connected view."
    ctaTitle="Build a clearer operating platform for your school community."
    highlights={['Flexible workflows', 'Academic reporting', 'Parent communication', 'Fee visibility', 'Secure access', 'Multi-campus readiness']}
    features={[
      { title: 'Flexible administration', description: 'Organise school records, staff work, classes, and daily administration around the way your school operates.', icon: Globe2 },
      { title: 'Academic reporting', description: 'Keep assessment and result workflows visible for teachers, school leadership, and families.', icon: GraduationCap },
      { title: 'Parent communication', description: 'Share reminders, school updates, and result notices through communication channels families already use.', icon: Users },
      { title: 'Support diverse communities', description: 'Work with the languages, roles, and communication expectations that make up an international school community.', icon: Languages },
      { title: 'Secure school records', description: 'Keep staff, student, parent, academic, and financial information organised with role-aware access.', icon: ShieldCheck },
      { title: 'Ready to grow', description: 'Keep operations connected as your school expands its programmes, teams, or campus footprint.', icon: Sparkles },
    ]}
  />
}
