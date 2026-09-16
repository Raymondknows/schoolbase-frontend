import { Metadata } from 'next'
import { CheckCircle, AlertCircle, Lock, BarChart3, Clock } from 'lucide-react'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Data Management & Security for Schools | SchoolBase',
  description:
    'Organize school records in one place with role-aware access, school-scoped workflows, and operational visibility.',
  keywords: [
    'school data management',
    'student information system',
    'school database',
    'data security school',
    'school backup system',
    'data protection schools',
  ],
  openGraph: {
    title: 'Data Management & Security for Schools | SchoolBase',
    description: 'Secure, organized, backed up. All your school data in one place.',
  },
}

export default function DataManagementPage() {
  return (
    <main className="min-h-screen bg-slate-50">
      {/* Hero */}
      <section className="text-white py-20 px-4 sm:px-6 lg:px-8" style={{ background: 'linear-gradient(90deg, #0A66C2 0%, #084a9a 100%)' }}>
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl sm:text-5xl font-bold mb-6">
            Your School Data. Secure & Organized.
          </h1>
          <p className="text-xl text-[#bfdbfe] mb-8">
            One connected place for students, staff, finances, and academics with role-aware access and clearer school operations.
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
          <h2 className="text-3xl font-bold text-slate-900 mb-12">The Data Management Problem</h2>
          <div className="grid md:grid-cols-2 gap-8">
            {[
              {
                icon: AlertCircle,
                title: 'Data Scattered Everywhere',
                description: 'Student info in one spreadsheet, fees in another, results in a third. Impossible to maintain.'
              },
              {
                icon: Lock,
                title: 'Security Risk',
                description: 'Sensitive student data on USB drives, shared WhatsApp groups, laptops. One lost device = disaster.'
              },
              {
                icon: Clock,
                title: 'Scattered records',
                description: 'Important student, finance, and academic information can be difficult to keep consistent across separate files.'
              },
              {
                icon: BarChart3,
                title: 'Can\'t Analyze',
                description: 'Data sits in spreadsheets. You can\'t easily answer questions like "Which students are at risk?"'
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
            One Secure Database for Everything
          </h2>
          <div className="space-y-8">
            {[
              {
                step: '1',
                title: 'Centralized Database',
                description: 'All student, staff, financial, and academic data in one secure place. No more scattered spreadsheets.'
              },
              {
                step: '2',
                title: 'Role-Based Access',
                description: 'Teachers see only their class. Parents see only their child. Admin sees everything. Everyone secure.'
              },
              {
                step: '3',
                title: 'Organized records',
                description: 'Keep school information in connected workflows with role-aware access and clearer operational visibility.'
              },
              {
                step: '4',
                title: 'Access and accountability',
                description: 'Use role-aware access and available audit records to support responsible school administration.'
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
          <h2 className="text-3xl font-bold text-slate-900 mb-12">Data Management Features</h2>
          <div className="grid md:grid-cols-2 gap-8">
            {[
              {
                title: 'Secure Storage',
                items: ['Role-aware access', 'Secure connections', 'School-scoped records', 'Account controls']
              },
              {
                title: 'Backup & Recovery',
                items: ['Operational visibility', 'Record organization', 'Reports and exports', 'Support workflows']
              },
              {
                title: 'Access Control',
                items: ['Role-based permissions', 'Staff access levels', 'Parent portal limits', 'Student visibility', 'Admin override']
              },
              {
                title: 'Compliance',
                items: ['Access controls', 'Privacy-aware workflows', 'Audit history where available', 'School administration records']
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

      {/* What Gets Stored */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-slate-900 mb-8 text-center">Everything Your School Needs</h2>
          <div className="grid md:grid-cols-2 gap-6">
            {[
              'Student profiles & contact info',
              'Staff directory & roles',
              'Class assignments',
              'Academic records & grades',
              'Financial records & fee tracking',
              'Attendance history',
              'Communication logs',
              'Report cards & transcripts',
              'User activity logs',
              'Document archives',
              'Custom fields & data',
              'Integration data',
            ].map((item, idx) => (
              <div key={idx} className="flex items-center gap-3 p-3 bg-white rounded-lg border border-slate-200">
                <Lock className="w-5 h-5 text-[#0A66C2] flex-shrink-0" />
                <span className="text-slate-700">{item}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Results */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-[#0A66C2] text-white">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-12">Schools Trust SchoolBase</h2>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                number: 'Connected',
                label: 'School operations'
              },
              {
                number: 'Role-aware',
                label: 'Access controls'
              },
              {
                number: '0',
                label: 'Data Loss Incidents'
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
          <h2 className="text-3xl font-bold mb-4">Trust Your School Data to the Experts</h2>
          <p className="text-[#bfdbfe] mb-8 text-lg">
            Enterprise-grade security. School-friendly simplicity. 7 days free.
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
              Request Security Info
            </Link>
          </div>
        </div>
      </section>
    </main>
  )
}
