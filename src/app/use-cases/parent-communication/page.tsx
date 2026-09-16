import { Metadata } from 'next'
import { MessageCircle, Users, Zap, CheckCircle } from 'lucide-react'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Parent Communication Solution | SchoolBase',
  description:
    'Reach every parent instantly on WhatsApp. Send announcements, fee reminders, and results directly to their phone.',
  keywords: [
    'parent communication app',
    'WhatsApp school messaging',
    'school announcements',
    'parent notification system',
  ],
  openGraph: {
    title: 'Parent Communication Solution | SchoolBase',
    description: 'Connect with parents on the app they use most: WhatsApp',
    url: 'https://schoolbase.live/use-cases/parent-communication',
    type: 'website',
  },
  alternates: { canonical: 'https://schoolbase.live/use-cases/parent-communication' },
}

export default function ParentCommunicationPage() {
  return (
    <main className="min-h-screen bg-slate-50">
      {/* Hero */}
      <section className="text-white py-20 px-4 sm:px-6 lg:px-8" style={{ background: 'linear-gradient(90deg, #0A66C2 0%, #084a9a 100%)' }}>
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl sm:text-5xl font-bold mb-6">
            Reach Parents Where They Are
          </h1>
          <p className="text-xl text-[#bfdbfe] mb-8">
            Send fee reminders, announcements, and results directly on WhatsApp. Guaranteed delivery. Two-way conversations.
          </p>
          <div className="flex flex-col sm:flex-row gap-4">
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
              Ask About WhatsApp
            </Link>
          </div>
        </div>
      </section>

      {/* Why WhatsApp */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-slate-900 mb-8 text-center">
            Why Parents Love WhatsApp Communication
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                emoji: '📱',
                title: 'Familiar',
                description: 'Parents already use WhatsApp daily. No new apps to download.',
              },
              {
                emoji: '⚡',
                title: 'Instant',
                description: 'Messages delivered in seconds. Real-time conversations.',
              },
              {
                emoji: '✓',
                title: 'Reliable',
                description: 'Read receipts confirm parents saw the message.',
              },
            ].map((item, idx) => (
              <div key={idx} className="text-center p-6 bg-white rounded-lg border border-slate-200">
                <div className="text-5xl mb-4">{item.emoji}</div>
                <h3 className="font-bold text-slate-900 mb-2 text-lg">{item.title}</h3>
                <p className="text-slate-600">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Use Cases */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-slate-100">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-slate-900 mb-12 text-center">
            What Schools Send on WhatsApp
          </h2>
          <div className="grid md:grid-cols-2 gap-6">
            {[
              {
                title: 'Fee Reminders',
                description: 'Automatic reminders when fees are due. Parents never forget.',
              },
              {
                title: 'School Announcements',
                description: 'Important updates: holidays, events, policy changes.',
              },
              {
                title: 'Result Notifications',
                description: 'Notify parents when exam results are published.',
              },
              {
                title: 'Attendance Reports',
                description: 'Daily or weekly attendance summaries for each child.',
              },
              {
                title: 'Emergency Messages',
                description: 'Reach all parents instantly for urgent situations.',
              },
              {
                title: 'Event Invitations',
                description: 'Invite parents to school events and get RSVP responses.',
              },
            ].map((item, idx) => (
              <div key={idx} className="bg-white p-6 rounded-lg">
                <h3 className="font-bold text-slate-900 mb-2">{item.title}</h3>
                <p className="text-slate-600">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-slate-900 mb-12 text-center">
            Communication Features
          </h2>
          <div className="space-y-4">
            {[
              'Broadcast messages to multiple parents at once',
              'Automatic reminders on schedule',
              'Two-way conversations (parents can reply)',
              'Message templates for common messages',
              'Personalized messages (include child\'s name, amount due, etc.)',
              'Delivery & read status tracking',
              'Schedule messages for future sending',
              'Bulk upload recipient lists',
              'Media support (images, documents)',
              'Message history archive',
              'Response management (parents reply to your messages)',
              'Opt-in/opt-out management',
            ].map((feature, idx) => (
              <div key={idx} className="flex items-center gap-3 bg-[#eff6ff] p-4 rounded-lg">
                <CheckCircle className="w-5 h-5 text-[#0A66C2] flex-shrink-0" />
                <span className="text-slate-700">{feature}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Impact */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-slate-100">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-slate-900 mb-12 text-center">
            Impact on Your School
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { metric: 'Email', label: 'Configured school updates' },
              { metric: 'WhatsApp', label: 'Configured school messaging' },
              { metric: 'Portal', label: 'Parent visibility for linked records' },
            ].map((item, idx) => (
              <div key={idx} className="bg-white p-8 rounded-lg text-center border-l-4 border-[#0A66C2]">
                <div className="text-4xl font-bold text-[#0A66C2] mb-2">{item.metric}</div>
                <p className="text-slate-700">{item.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-[#0A66C2] text-white py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-4">
            Connect with Your Parents Today
          </h2>
          <p className="text-[#bfdbfe] mb-8 text-lg">
            See how SchoolBase supports school-managed communication with parents.
          </p>
          <Link
            href="/purchase"
            className="inline-block bg-white text-[#0A66C2] px-8 py-3 rounded-lg font-semibold hover:bg-[#eff6ff] transition-colors"
          >
            Start Free Trial
          </Link>
        </div>
      </section>
    </main>
  )
}
