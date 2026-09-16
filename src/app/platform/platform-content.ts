export type PlatformModule = {
  slug: string;
  title: string;
  eyebrow: string;
  summary: string;
  capabilities: string[];
  connects: string;
};

export const platformModules: PlatformModule[] = [
  {
    slug: "admin",
    title: "School Administration",
    eyebrow: "Control the day-to-day",
    summary: "Set up the structures, records, people, and policies that keep your school moving.",
    capabilities: ["Dashboard and setup status", "Students, classes, staff, and subjects", "Admissions, promotions, attendance, and timetable", "Branding, announcements, support, and settings"],
    connects: "The admin workspace establishes the academic and operational context used by teachers, parents, fees, and results.",
  },
  {
    slug: "accounting",
    title: "Accounting & Bursary",
    eyebrow: "See the financial picture",
    summary: "Give your finance team a focused workspace for income, expenses, cashbook activity, and reporting.",
    capabilities: ["Income and expense categories", "Income and expense recording", "Draft expense approval and posting", "Cashbook, reports, reversals, and audit records"],
    connects: "Recorded fee payments can link back to financial transactions, while accounting remains separate from what each student owes.",
  },
  {
    slug: "teachers",
    title: "Teachers",
    eyebrow: "Make classroom work clearer",
    summary: "Help teachers work from their assigned classes and subjects, from attendance through assessment results.",
    capabilities: ["Assigned classes, students, and subjects", "Attendance and summaries", "Assessment score entry", "Results, analytics, timetable, comments, and announcements"],
    connects: "Teacher assignments define who can work with each class and subject. Their activity feeds attendance and the results process.",
  },
  {
    slug: "parents",
    title: "Parents",
    eyebrow: "Keep families informed",
    summary: "Give guardians a clear, authorized view of their children’s attendance, results, invoices, and school updates.",
    capabilities: ["Linked children and profiles", "Attendance and published results", "Report cards and invoices", "Payment history, publications, and school information"],
    connects: "Parents see the school information that belongs to their linked children after results are published and invoices are issued.",
  },
  {
    slug: "admissions",
    title: "Admissions",
    eyebrow: "Start with a complete record",
    summary: "Collect applications through a school-specific admissions page and move approved applicants into school operations.",
    capabilities: ["Configurable admissions availability", "Applicant, student, guardian, medical, and prior-school information", "Student photo upload and application status lookup", "Admin review, status management, and approved-application conversion"],
    connects: "Admissions can create the student and guardian records that later power classes, fees, attendance, results, and parent access.",
  },
  {
    slug: "academics",
    title: "Academics & Results",
    eyebrow: "Run the academic cycle",
    summary: "Bring academic structure, assessments, score entry, review, publication, and reporting into one workflow.",
    capabilities: ["Academic years, terms, phases, classes, and subjects", "Assessment components and score entry", "Grade and position calculation", "Validation, approval, publication, reports, and historical totals"],
    connects: "Teachers enter the work, administrators control review and publication, and parents receive the published result.",
  },
  {
    slug: "fees",
    title: "Fees & Payments",
    eyebrow: "Make every charge understandable",
    summary: "Create flexible, itemized fee schedules and give schools and parents a shared view of invoices and balances.",
    capabilities: ["Term and class fee schedules", "Separate fee lines and student adjustments", "Invoice generation and bulk issuance", "Payment recording, allocations, receipts, PDFs, and reminders"],
    connects: "Fee schedules become invoice items. Payments update balances and can connect to the accounting workspace.",
  },
  {
    slug: "communication",
    title: "Communication",
    eyebrow: "Keep the right people updated",
    summary: "Coordinate school announcements and event-based email and WhatsApp messages around the work already happening.",
    capabilities: ["Announcements and communication rules", "Admission and fee notifications", "Attendance and result notifications", "Payment receipts, PIN delivery, and school WhatsApp operations"],
    connects: "Communication can respond to admissions, invoices, payments, attendance, announcements, results, and promotions.",
  },
  {
    slug: "reports",
    title: "Reports & Analytics",
    eyebrow: "Turn records into visibility",
    summary: "Use school data to understand performance, produce reports, and give each audience the information they need.",
    capabilities: ["Class, subject, and overview analytics", "Top performers and struggling students", "Broadsheets, rankings, and statistics", "Report cards, transcripts, bulk PDFs, and accounting reports"],
    connects: "Reports bring together academic, attendance, fee, and accounting activity for school leadership, teachers, and parents.",
  },
];

export const platformModuleBySlug = Object.fromEntries(platformModules.map((module) => [module.slug, module])) as Record<string, PlatformModule>;

export const platformSteps = [
  { number: "01", title: "Set up the school", text: "Create the academic periods, classes, subjects, staff, students, guardians, and school settings your teams need." },
  { number: "02", title: "Run daily operations", text: "Teachers work with their assigned classes, mark attendance, enter assessment scores, and share school updates." },
  { number: "03", title: "Manage fees clearly", text: "Build itemized schedules, issue invoices, record payments, and keep balances and receipts visible." },
  { number: "04", title: "Review and connect", text: "Approve results, publish reports, keep parents informed, and use analytics to see what needs attention." },
];

export const roleCards = [
  { title: "School Administrator", href: "/docs/admin", text: "Own the structure, records, approvals, settings, and oversight that the school depends on." },
  { title: "Accountant / Bursar", href: "/docs/accounting", text: "Record and review wider school income, expenses, cashbook movements, and reports." },
  { title: "Teacher", href: "/docs/teachers", text: "Work from assigned classes and subjects to manage attendance, assessments, results, and communication." },
  { title: "Parent", href: "/docs/parents", text: "Follow linked children, published results, attendance, invoices, payments, and school information." },
];

export const docsOrder = platformModules.map((module) => module.slug);
