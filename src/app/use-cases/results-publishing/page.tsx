import { Metadata } from 'next'
import { CheckCircle, Clock, AlertCircle, BarChart3, Users } from 'lucide-react'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Result Publishing & Reporting Software | SchoolBase',
  description:
    'Publish school results through configured assessment, review, reporting, and parent-access workflows.',
  keywords: [
    'result publishing software',
    'school reporting software',
    'primary school reporting software',
    'grade publishing platform',
    'student result management',
    'digital report cards',
    'school grades software',
  ],
  openGraph: {
    title: 'Result Publishing & Reporting Software | SchoolBase',
    description: 'Publish grades instantly. Every student gets their results. Parents see it on WhatsApp.',
  },
}

export default function ResultsPublishingPage() {
  return (
    <main className="min-h-screen bg-slate-50">
      {/* Hero */}
      <section className="text-white py-20 px-4 sm:px-6 lg:px-8" style={{ background: 'linear-gradient(90deg, #0A66C2 0%, #084a9a 100%)' }}>
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl sm:text-5xl font-bold mb-6">
            Publish Grades in Minutes
          </h1>
          <p className="text-xl text-[#bfdbfe] mb-8">
            No more printing. No manual sorting. One click and every student, parent, and teacher sees the results.
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
          <h2 className="text-3xl font-bold text-slate-900 mb-12">The Result Publishing Nightmare</h2>
          <div className="grid md:grid-cols-2 gap-8">
            {[
              {
                icon: Clock,
                title: '3 Days of Work',
                description: 'Teachers hand-write or copy-paste grades. Admin collates everything manually. Errors appear halfway through.'
              },
              {
                icon: AlertCircle,
                title: 'Manual Errors',
                description: 'Grades get mixed up. Wrong students get wrong results. You have to reprint everything.'
              },
              {
                icon: BarChart3,
                title: 'No Real Reporting',
                description: 'Results are just printed papers. No data analysis. No way to track progress over time.'
              },
              {
                icon: Users,
                title: 'Parent Frustration',
                description: 'Parents wait weeks for results. Some never get them at all. Complaints pile up.'
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
            Result Publishing Made Easy
          </h2>
          <div className="space-y-8">
            {[
              {
                step: '1',
                title: 'Teachers Enter Grades',
                description: 'Teachers log in and enter grades for their classes. SchoolBase auto-calculates totals, percentages, and grades.'
              },
              {
                step: '2',
                title: 'Auto-Review & Approval',
                description: 'Admin sees a summary. Spot-check any suspicious grades. Approve with one click.'
              },
              {
                step: '3',
                title: 'Instant Publishing',
                description: 'Hit "Publish." Results go live. Every student sees their grades. Every parent gets a WhatsApp notification.'
              },
              {
                step: '4',
                title: 'Automatic Reports',
                description: 'School-wide reports auto-generate showing class performance, top/bottom performers, grade distribution.'
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
          <h2 className="text-3xl font-bold text-slate-900 mb-12">Result Publishing Features</h2>
          <div className="grid md:grid-cols-2 gap-8">
            {[
              {
                title: 'Grade Entry',
                items: ['Quick data entry', 'Auto-calculations', 'Bulk import', 'Grade templates', 'Weighted scoring']
              },
              {
                title: 'Quality Control',
                items: ['Error detection', 'Approval workflow', 'Change history', 'Duplicate checks', 'Data validation']
              },
              {
                title: 'Publishing',
                items: ['One-click release', 'Scheduled publishing', 'Parent notifications', 'Student portal', 'Print options']
              },
              {
                title: 'Reporting & Analytics',
                items: ['Class reports', 'Subject analysis', 'Trend tracking', 'Export to PDF', 'Comparative data']
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

      {/* Before & After */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-slate-900 mb-12 text-center">Before & After</h2>
          <div className="grid md:grid-cols-2 gap-8">
            <div className="p-8 bg-red-50 rounded-lg border-2 border-red-200">
              <h3 className="font-bold text-red-900 mb-6 text-lg">❌ Without SchoolBase</h3>
              <ul className="space-y-3 text-red-800">
                <li>• 2-3 days to publish results</li>
                <li>• Manual errors (wrong grades)</li>
                <li>• Parents wait weeks</li>
                <li>• Paper-based records</li>
                <li>• Hard to find trends</li>
                <li>• Reprinting required</li>
              </ul>
            </div>
            <div className="p-8 bg-green-50 rounded-lg border-2 border-green-200">
              <h3 className="font-bold text-green-900 mb-6 text-lg">✅ With SchoolBase</h3>
              <ul className="space-y-3 text-green-800">
                <li>• Results published in 5 minutes</li>
                <li>• Auto-calculations (no errors)</li>
                <li>• Parents notified instantly</li>
                <li>• Digital with backups</li>
                <li>• Analytics & reports</li>
                <li>• One-click access</li>
              </ul>
            </div>
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
                number: 'Connected',
                label: 'Faster Publishing'
              },
              {
                number: 'Clear',
                label: 'Error-Free Results'
              },
              {
                number: '1 Day',
                label: 'Instead of 3'
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
          <h2 className="text-3xl font-bold mb-4">Ready to Publish Results in Minutes?</h2>
          <p className="text-[#bfdbfe] mb-8 text-lg">
            Give your school a clearer result publishing workflow.
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
              Schedule Demo
            </Link>
          </div>
        </div>
      </section>
    </main>
  )
}
