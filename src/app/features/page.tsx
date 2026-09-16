import { Metadata } from 'next'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import {
  Bell,
  Globe,
  GraduationCap,
  MessageCircle,
  Receipt,
  Sparkles,
  TrendingUp,
  Users,
  Lock,
  Zap,
} from 'lucide-react'

export const metadata: Metadata = {
  title: 'Features | SchoolBase School Management Platform',
  description:
    'Explore SchoolBase features: fee tracking, WhatsApp parent communication, result publishing, school website, attendance tracking, and more.',
  openGraph: {
    title: 'Features | SchoolBase',
    description:
      'Discover all the features SchoolBase offers for modern school management.',
    url: 'https://schoolbase.live/features',
    type: 'website',
  },
}

const coreFeatures = [
  {
    icon: Receipt,
    title: 'Track Every Fee',
    description:
      'Send bills, record cash and bank payments, print receipts, and show parents their balance.',
  },
  {
    icon: MessageCircle,
    title: 'Reach Parents Instantly',
    description:
      'Fee reminders and alerts on WhatsApp and SMS — the way parents actually read messages.',
  },
  {
    icon: GraduationCap,
    title: 'Publish Results in Minutes',
    description:
      'Enter marks, approve, and release to parents with one click. No more leaks or confusion.',
  },
  {
    icon: Globe,
    title: 'Your School Website Included',
    description:
      'News, admissions, and contact — modern and mobile-friendly. No separate Wix bill.',
  },
  {
    icon: Bell,
    title: 'Attendance Parents Notice',
    description: 'When a child is absent, parents know right away via WhatsApp.',
  },
  {
    icon: Sparkles,
    title: 'Live in 48 Hours',
    description: 'We help you set up fast. No six-month IT project. Go live in two days.',
  },
  {
    icon: Users,
    title: 'Parent & Student Portal',
    description:
      'Parents and students view fees, results, attendance in real-time. Download the mobile app.',
  },
  {
    icon: TrendingUp,
    title: 'Analytics & Reports',
    description: 'See which students are behind on fees, attendance trends, and performance reports.',
  },
  {
    icon: Lock,
    title: 'Secure & Reliable',
    description: 'Industry-standard encryption, daily backups, and 99.9% uptime guarantee.',
  },
  {
    icon: Zap,
    title: 'Multi-Platform Support',
    description:
      'Desktop, tablet, and mobile. Works on any device with a browser or our native app.',
  },
]

export default function FeaturesPage() {
  return (
    <div className="min-h-screen bg-background">
      <section className="border-b border-border bg-surface py-20">
        <div className="mx-auto max-w-4xl px-6">
          <Link href="/platform" className="text-sm font-semibold uppercase tracking-[0.2em] text-brand hover:text-brand-hover">
            Explore the complete platform →
          </Link>
          <h1 className="text-4xl font-bold text-foreground">
            Everything Your School Needs
          </h1>
          <p className="mt-4 max-w-2xl text-lg text-muted">
            One platform. All-in-one solution for fees, communication, results, and
            more. No extra charges for different modules.
          </p>
        </div>
      </section>

      <section className="py-20">
        <div className="mx-auto max-w-6xl px-6">
          <h2 className="text-3xl font-bold text-foreground">Core Features</h2>
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {coreFeatures.map((feature, idx) => {
              const Icon = feature.icon
              return (
                <div
                  key={idx}
                  className="rounded-xl border border-border bg-surface p-6 shadow-sm transition-shadow hover:shadow-md"
                >
                  <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-brand-light text-brand">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="mt-4 text-lg font-semibold text-foreground">
                    {feature.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted">
                    {feature.description}
                  </p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      <section className="border-t border-border bg-surface py-20">
        <div className="mx-auto max-w-6xl px-6">
          <h2 className="text-3xl font-bold text-foreground">Why Choose SchoolBase?</h2>
          <div className="mt-12 grid gap-8 md:grid-cols-2">
            <div>
              <h3 className="text-xl font-semibold text-foreground">For School Owners</h3>
              <ul className="mt-4 space-y-3 text-muted">
                <li className="flex gap-3">
                  <span className="text-brand">✓</span>
                  <span>Stop chasing parents for fees</span>
                </li>
                <li className="flex gap-3">
                  <span className="text-brand">✓</span>
                  <span>Automated receipt generation and tracking</span>
                </li>
                <li className="flex gap-3">
                  <span className="text-brand">✓</span>
                  <span>Publish results securely in minutes</span>
                </li>
                <li className="flex gap-3">
                  <span className="text-brand">✓</span>
                  <span>Professional school website included</span>
                </li>
                <li className="flex gap-3">
                  <span className="text-brand">✓</span>
                  <span>Reduce administrative work by 80%</span>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="text-xl font-semibold text-foreground">For Parents</h3>
              <ul className="mt-4 space-y-3 text-muted">
                <li className="flex gap-3">
                  <span className="text-brand">✓</span>
                  <span>Get fee reminders on WhatsApp</span>
                </li>
                <li className="flex gap-3">
                  <span className="text-brand">✓</span>
                  <span>View results instantly and securely</span>
                </li>
                <li className="flex gap-3">
                  <span className="text-brand">✓</span>
                  <span>Know immediately if child is absent</span>
                </li>
                <li className="flex gap-3">
                  <span className="text-brand">✓</span>
                  <span>Pay fees online or via bank transfer</span>
                </li>
                <li className="flex gap-3">
                  <span className="text-brand">✓</span>
                  <span>Download receipts anytime</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      <section className="py-20">
        <div className="mx-auto max-w-4xl px-6 text-center">
          <h2 className="text-3xl font-bold text-foreground">Ready to Get Started?</h2>
          <p className="mt-4 text-lg text-muted">
            Transform your school management today. See how SchoolBase can save you
            time and money.
          </p>
          <div className="mt-8 flex flex-wrap gap-4 justify-center">
            <Button href="/platform">Explore the Platform</Button>
            <Button href="/purchase">Get Started Today</Button>
            <Button variant="secondary" href="/contact">
              Schedule a Demo
            </Button>
          </div>
        </div>
      </section>
    </div>
  )
}
