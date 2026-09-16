import type { Metadata } from 'next'
import { BedDouble, CalendarClock, MessageSquareText, Receipt, ShieldCheck, Users } from 'lucide-react'
import { SeoPageShell } from '@/components/seo-page-shell'

export const metadata: Metadata = {
  title: 'School Management Software for Boarding Schools | SchoolBase',
  description:
    'School management software for boarding schools with hostel tracking, fee automation, parent communication, and secure school administration.',
  keywords: [
    'school management software for boarding schools',
    'boarding school management system',
    'boarding school software',
    'hostel school management software',
  ],
}

export default function BoardingSchoolsPage() {
  return (
    <SeoPageShell
      eyebrow="BOARDING SCHOOLS"
      title="School Management Software for Boarding Schools"
      description="SchoolBase supports boarding schools with calm, reliable operations for hostels, fees, communication, and daily routines so school teams can focus on care and academics."
      highlights={['Hostel records', 'Parent updates', 'Fee tracking', 'Operational clarity']}
      features={[
        {
          title: 'Manage Boarding Daily Operations',
          description: 'Coordinate routines, staff responsibilities, and student movement with a record system that makes administration easier.',
          icon: BedDouble,
        },
        {
          title: 'Keep Parents Informed',
          description: 'Send updates on fees, academic progress, and school events without relying on scattered messages or paper notices.',
          icon: MessageSquareText,
        },
        {
          title: 'Track Fees and Accounts Clearly',
          description: 'Monitor balances, issue invoices, and keep school finances organized with simple, transparent records.',
          icon: Receipt,
        },
        {
          title: 'Plan Schedules with Confidence',
          description: 'Coordinate academic calendars, hostels, and school events from a central platform that supports daily planning.',
          icon: CalendarClock,
        },
        {
          title: 'Support Staff Across Departments',
          description: 'Give admins, bursars, teachers, and boarding staff aligned access to the information they need.',
          icon: Users,
        },
        {
          title: 'Secure and Dependable',
          description: 'Keep boarding records and school data safe with permission-based access and dependable backup processes.',
          icon: ShieldCheck,
        },
      ]}
      proofItems={[
        {
          title: 'More organized daily operations',
          detail: 'Reduce manual coordination between departments and keep records consistent from one place.',
        },
        {
          title: 'Better communication with families',
          detail: 'Parents receive timely updates, reminders, and fee notifications through channels they use daily.',
        },
        {
          title: 'A calmer admin experience',
          detail: 'School leaders spend less time chasing paper or duplicated records and more time supporting students.',
        },
        {
          title: 'Designed for real school environments',
          detail: 'SchoolBase fits the practical needs of boarding schools in West Africa with flexible workflows and strong support.',
        },
      ]}
      primaryCtaLabel="Get Started"
      primaryHref="/signup"
      secondaryCtaLabel="Explore the Platform"
      secondaryHref="/platform"
    />
  )
}
