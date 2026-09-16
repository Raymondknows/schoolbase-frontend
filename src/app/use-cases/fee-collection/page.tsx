import { Metadata } from 'next'
import { TrendingDown, AlertCircle, CheckCircle, BarChart3 } from 'lucide-react'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Fee Collection Solution | SchoolBase',
  description:
    'Organize school fee collection with itemized schedules, payment tracking, reminders, receipts, and clear financial reports.',
  keywords: [
    'school fee collection software',
    'fee management system',
    'payment tracking school',
    'fee reminder system',
  ],
  openGraph: {
    title: 'Fee Collection Solution | SchoolBase',
    description: 'Transform how you collect school fees with automation',
  },
}

export default function FeeCollectionPage() {
  return (
    <main className="min-h-screen bg-slate-50">
      {/* Hero */}
      <section className="text-white py-20 px-4 sm:px-6 lg:px-8" style={{ background: 'linear-gradient(90deg, #0A66C2 0%, #084a9a 100%)' }}>
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl sm:text-5xl font-bold mb-6">
            Never Chase Fees Again
          </h1>
          <p className="text-xl text-[#bfdbfe] mb-8">
            Organize fee collection with payment tracking, configured reminders, receipts, and detailed reports.
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
          <h2 className="text-3xl font-bold text-slate-900 mb-8 text-center">
            The Fee Collection Problem
          </h2>
          <div className="space-y-6">
            {[
              {
                icon: TrendingDown,
                title: 'High Default Rates',
                description:
                  'Many parents forget fees or avoid payment. You\'re constantly chasing them for money.',
              },
              {
                icon: AlertCircle,
                title: 'Manual Tracking',
                description:
                  'Tracking who paid what in spreadsheets is error-prone and time-consuming.',
              },
              {
                icon: BarChart3,
                title: 'No Visibility',
                description:
                  'Hard to know your real cash position or forecast revenue.',
              },
            ].map((item, idx) => {
              const Icon = item.icon
              return (
                <div key={idx} className="flex gap-4 items-start bg-red-50 p-6 rounded-lg border-l-4 border-red-500">
                  <Icon className="w-6 h-6 text-red-500 flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="font-bold text-slate-900 mb-2">{item.title}</h3>
                    <p className="text-slate-600">{item.description}</p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* The Solution */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-slate-100">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-slate-900 mb-12 text-center">
            How SchoolBase Solves This
          </h2>
          <div className="space-y-8">
            {[
              {
                step: '1',
                title: 'Set Fees & Due Dates',
                description: 'Configure fees for each class/term. Set payment deadlines.',
              },
              {
                step: '2',
                title: 'Automated Reminders',
                description:
                  'Parents get WhatsApp reminders before the due date. No manual work needed.',
              },
              {
                step: '3',
                title: 'Track Payments',
                description:
                  'See who paid, who didn\'t, and payment amounts in real-time. No spreadsheets.',
              },
              {
                step: '4',
                title: 'Generate Reports',
                description:
                  'Get detailed financial reports: collection rate, defaults, revenue forecasts.',
              },
            ].map((item, idx) => (
              <div key={idx} className="flex gap-6 items-start">
                <div className="bg-[#0A66C2] text-white rounded-full w-12 h-12 flex items-center justify-center font-bold flex-shrink-0">
                  {item.step}
                </div>
                <div className="bg-white p-6 rounded-lg flex-1">
                  <h3 className="text-xl font-bold text-slate-900 mb-2">{item.title}</h3>
                  <p className="text-slate-600">{item.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Results */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-slate-900 mb-12 text-center">
            Results Schools See
          </h2>
          <div className="grid md:grid-cols-2 gap-8">
            {[
              { metric: 'Clear', label: 'Fee schedules and balances' },
              { metric: 'Connected', label: 'Payment and invoice records' },
              { metric: 'Digital', label: 'Receipts and reports' },
              { metric: 'Visible', label: 'Outstanding items and history' },
            ].map((item, idx) => (
              <div key={idx} className="bg-[#eff6ff] p-8 rounded-lg text-center border-l-4 border-[#0A66C2]">
                <div className="text-4xl font-bold text-[#0A66C2] mb-2">{item.metric}</div>
                <p className="text-slate-700">{item.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-slate-100">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-slate-900 mb-12 text-center">
            Fee Collection Features
          </h2>
          <div className="space-y-4">
            {[
              'Flexible fee structure (per class, per term, custom amounts)',
              'Batch fee management (set fees for 100+ students at once)',
              'Automated WhatsApp reminders (configurable timing)',
              'Multiple payment methods integration',
              'Payment tracking dashboard',
              'Exception handling (waivers, discounts, refunds)',
              'Complete payment history & receipts',
              'Financial reports (collection rate, defaults, revenue)',
              'Parent fee portal (parents see their balance)',
              'Email notifications for school staff',
            ].map((feature, idx) => (
              <div key={idx} className="flex items-center gap-3 bg-white p-4 rounded-lg">
                <CheckCircle className="w-5 h-5 text-emerald-500 flex-shrink-0" />
                <span className="text-slate-700">{feature}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-[#0A66C2] text-white py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-4">
            Transform Your Fee Collection Today
          </h2>
          <p className="text-[#bfdbfe] mb-8 text-lg">
            Give your finance team a clearer fee workflow with SchoolBase.
          </p>
          <Link
            href="/purchase"
            className="bg-white text-[#0A66C2] px-8 py-3 rounded-lg font-semibold hover:bg-[#eff6ff] transition-colors"
          >
            Start Free Trial
          </Link>
        </div>
      </section>
    </main>
  )
}
