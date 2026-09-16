import { Metadata } from 'next'
import { CheckCircle, BarChart3, AlertCircle, Clock, Users } from 'lucide-react'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Student Attendance Management System | SchoolBase',
  description:
    'Digital student attendance tracking with summaries, school reporting, and configured parent communication workflows.',
  keywords: [
    'student attendance management system',
    'attendance tracking app',
    'school attendance software',
    'digital attendance system',
    'automated attendance tracking',
    'attendance management school',
  ],
  openGraph: {
    title: 'Student Attendance Management System | SchoolBase',
    description: 'Automate student attendance tracking with real-time reports and parent alerts',
    url: 'https://schoolbase.live/use-cases/student-attendance',
    type: 'website',
  },
  alternates: { canonical: 'https://schoolbase.live/use-cases/student-attendance' },
}

export default function StudentAttendancePage() {
  return (
    <main className="min-h-screen bg-slate-50">
      {/* Hero */}
      <section className="text-white py-20 px-4 sm:px-6 lg:px-8" style={{ background: 'linear-gradient(90deg, #0A66C2 0%, #084a9a 100%)' }}>
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl sm:text-5xl font-bold mb-6">
            Attendance Made Simple
          </h1>
          <p className="text-xl text-[#bfdbfe] mb-8">
            Track student attendance, review summaries, spot patterns, and use configured workflows to keep relevant people informed.
          </p>
          <div className="flex flex-col sm:flex-row gap-4">
            <Link
              href="/purchase"
              className="bg-white text-[#0A66C2] px-8 py-3 rounded-lg font-semibold hover:bg-[#eff6ff] transition-colors"
            >
              Start Free Trial
            </Link>
            <Link
              href="/demo"
              className="border-2 border-white text-white px-8 py-3 rounded-lg font-semibold hover:bg-[#084a9a] transition-colors"
            >
              Watch Demo
            </Link>
          </div>
        </div>
      </section>

      {/* The Problem */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-slate-900 mb-12">The Manual Attendance Problem</h2>
          <div className="grid md:grid-cols-2 gap-8">
            {[
              {
                icon: AlertCircle,
                title: 'Time Wasted',
                description: 'Teachers spend 30+ minutes per class taking attendance, leaving no time for teaching.'
              },
              {
                icon: Users,
                title: 'No Parent Visibility',
                description: 'Parents don\'t know if their child is absent until a note comes home—often too late.'
              },
              {
                icon: BarChart3,
                title: 'Hidden Patterns',
                description: 'Absenteeism trends go unnoticed. You can\'t address problems you can\'t see.'
              },
              {
                icon: Clock,
                title: 'Manual Recording',
                description: 'Paper registers get lost. Data isn\'t accurate. Disputes over who was marked absent.'
              },
            ].map((problem, idx) => (
              <div key={idx} className="p-6 bg-white border-l-4 border-[#0A66C2] rounded-lg shadow-sm">
                <problem.icon className="w-8 h-8 text-[#0A66C2] mb-4" />
                <h3 className="font-bold text-slate-900 mb-2">{problem.title}</h3>
                <p className="text-slate-600">{problem.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* The Solution */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-slate-100">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-slate-900 mb-12 text-center">
            How SchoolBase Attendance Works
          </h2>
          <div className="space-y-8">
            {[
              {
                step: '1',
                title: 'Take Attendance in Seconds',
                description: 'Teachers check boxes in the app or mark attendance on a tablet. Done in under 2 minutes per class.'
              },
              {
                step: '2',
                title: 'Automatic Reports Generated',
                description: 'Daily summaries show who\'s absent. Weekly trend reports highlight students at risk.'
              },
              {
                step: '3',
                title: 'Parents Get Alerts',
                description: 'Automatic WhatsApp notifications: "Your child was absent today from 8am-10am." Parents respond immediately.'
              },
              {
                step: '4',
                title: 'Admin Sees Everything',
                description: 'Dashboard shows school-wide absenteeism rates, class-by-class breakdowns, seasonal patterns.'
              },
            ].map((item, idx) => (
              <div key={idx} className="flex gap-6">
                <div className="flex-shrink-0">
                  <div className="flex items-center justify-center h-12 w-12 rounded-md bg-[#0A66C2] text-white font-bold">
                    {item.step}
                  </div>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900 mb-2">{item.title}</h3>
                  <p className="text-slate-600">{item.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Key Features */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-slate-900 mb-12">Attendance Management Features</h2>
          <div className="grid md:grid-cols-2 gap-8">
            {[
              {
                title: 'Quick Check-In',
                items: ['One-tap marking', 'Bulk operations', 'Offline mode', 'Multi-class marking']
              },
              {
                title: 'Smart Reporting',
                items: ['Daily summaries', 'Trend analysis', 'Pattern detection', 'Predictive alerts']
              },
              {
                title: 'Parent Communication',
                items: ['WhatsApp alerts', 'Real-time updates', 'Custom messages', 'Two-way chat']
              },
              {
                title: 'Admin Dashboard',
                items: ['School-wide views', 'Class comparisons', 'Export reports', 'Attendance records']
              },
            ].map((section, idx) => (
              <div key={idx} className="p-6 bg-gradient-to-br from-blue-50 to-slate-50 rounded-lg border border-slate-200">
                <h3 className="font-bold text-slate-900 mb-4 text-lg">{section.title}</h3>
                <ul className="space-y-3">
                  {section.items.map((item, iidx) => (
                    <li key={iidx} className="flex items-center gap-3 text-slate-700">
                      <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Results */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-[#0A66C2] text-white">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-12">What Schools Achieve</h2>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                number: 'Records',
                label: 'Attendance captured by class'
              },
              {
                number: 'Summaries',
                label: 'Available for review'
              },
              {
                number: 'Digital',
                label: 'Parent Notification Rate'
              },
            ].map((stat, idx) => (
              <div key={idx}>
                <div className="text-4xl font-bold mb-2">{stat.number}</div>
                <p className="text-[#bfdbfe]">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto bg-gradient-to-r from-[#0A66C2] to-[#084a9a] text-white rounded-lg p-12 text-center">
          <h2 className="text-3xl font-bold mb-4">Stop Wasting Time on Attendance</h2>
          <p className="text-[#bfdbfe] mb-8 text-lg">
            See how SchoolBase can organize attendance for your school.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/purchase"
              className="bg-white text-[#0A66C2] px-8 py-3 rounded-lg font-semibold hover:bg-[#eff6ff] transition-colors"
            >
              Start Free Trial
            </Link>
            <Link
              href="/contact"
              className="border-2 border-white text-white px-8 py-3 rounded-lg font-semibold hover:bg-[#084a9a] transition-colors"
            >
              Talk to Our Team
            </Link>
          </div>
        </div>
      </section>
    </main>
  )
}
