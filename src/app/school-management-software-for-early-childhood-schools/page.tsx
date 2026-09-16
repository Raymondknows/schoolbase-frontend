import type { Metadata } from 'next'
import { Baby, CalendarCheck2, MessageSquareText, ShieldCheck, Sparkles, Users } from 'lucide-react'
import { PublicProductShell } from '@/components/public-product-shell'

export const metadata: Metadata = {
  title: 'School Management Software for Early Childhood Schools | SchoolBase',
  description: 'Simple school management software for early childhood schools with attendance, parent communication, and connected daily records.',
  keywords: ['school management software for early childhood schools', 'nursery school management system', 'preschool management software', 'early childhood school software'],
}

export default function EarlyChildhoodSchoolsPage() {
  return <PublicProductShell
    eyebrow="Early childhood schools"
    title="Give your early learning team a clearer way to run the day."
    description="SchoolBase brings attendance, parent updates, student records, and daily school operations into one practical platform for nurseries and preschool teams."
    proofTitle="Simple workflows for early learning"
    sectionTitle="Keep the daily work visible, connected, and easy to follow."
    ctaTitle="Build a calmer operating system for your school."
    highlights={['Daily attendance', 'Parent updates', 'Student records', 'Simple staff workflows', 'School notices', 'Connected operations']}
    features={[
      { title: 'Daily attendance', description: 'Record attendance clearly and give staff a simple way to keep daily presence and absence information up to date.', icon: CalendarCheck2 },
      { title: 'Parent communication', description: 'Share school notices, attendance updates, and important information with families through connected communication workflows.', icon: MessageSquareText },
      { title: 'Student records', description: 'Keep the student and guardian information your team relies on organised in one school account.', icon: Baby },
      { title: 'Easy for staff to adopt', description: 'Give teachers and administrators a focused workspace that supports everyday routines without unnecessary complexity.', icon: Users },
      { title: 'Permission-aware access', description: 'Help the right staff work with the information relevant to their role while keeping school records organised.', icon: ShieldCheck },
      { title: 'Ready to grow with you', description: 'As your school expands, keep administration, communication, and records connected in one place.', icon: Sparkles },
    ]}
  />
}
