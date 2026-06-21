import type { Metadata } from 'next';
import Link from 'next/link';
import { LogoIcon } from '@/components/Logo';
import {
  Upload, Sparkles, BookOpen, MessageSquare, Search, FileText,
  Zap, Brain, ListChecks, Quote, ChevronRight, GraduationCap,
} from 'lucide-react';

export const metadata: Metadata = {
  title: 'Scigestible — Understand Research Papers in Minutes',
  description:
    'Scigestible turns dense academic PDFs into clear, structured summaries. Get the objective, key findings, methods, limitations, a glossary, and a Q&A chat for any research paper — free to start.',
  alternates: { canonical: '/' },
  openGraph: {
    title: 'Scigestible — Understand Research Papers in Minutes',
    description:
      'Upload any academic PDF and get an instant AI-powered breakdown: summary, findings, methods, glossary, and a chat to ask the paper anything.',
    type: 'website',
  },
};

const FEATURES = [
  {
    icon: Zap,
    title: 'Instant structured breakdown',
    body: 'Upload a paper and, in about 15–30 seconds, get a clean breakdown of its objective, summary, key findings, methods, and limitations — no configuration, no waiting.',
  },
  {
    icon: Brain,
    title: 'Plain-English summaries',
    body: 'Dense academic writing is rewritten into language you can actually follow, so you grasp what a study did and why it matters without re-reading a paragraph five times.',
  },
  {
    icon: BookOpen,
    title: 'Automatic glossary',
    body: 'Unfamiliar technical terms are pulled out and defined in context, turning jargon you would normally have to look up into something you can read straight through.',
  },
  {
    icon: Quote,
    title: 'Formatted references',
    body: 'Citations and references are extracted and tidied up for you, making it easier to follow a paper’s sources and build your own reading list.',
  },
  {
    icon: MessageSquare,
    title: 'Ask the paper anything',
    body: 'Chat directly with the paper to dig into a confusing result, clarify a method, or check what the authors actually claimed — grounded in the text you uploaded.',
  },
  {
    icon: Search,
    title: 'Search millions of papers',
    body: 'Search across major open databases from inside the app, then digest a free PDF on the spot or save it to your library to read later.',
  },
];

const STEPS = [
  {
    title: 'Bring a paper',
    body: 'Upload a PDF you already have, or search millions of open-access papers and pick one with a free full-text PDF. The file just needs selectable text — not a scanned image.',
  },
  {
    title: 'Let Scigestible digest it',
    body: 'The paper is read and broken down into an objective, summary, findings, methods, limitations, glossary, and references — automatically, in seconds.',
  },
  {
    title: 'Read, ask, and keep',
    body: 'Move through the structured tabs, ask follow-up questions in the chat, take notes, and save the paper to your library so it is there when you come back.',
  },
];

const USE_CASES = [
  {
    icon: GraduationCap,
    title: 'Students',
    body: 'Get through a reading list faster, understand the papers behind a lecture, and walk into seminars knowing what each study actually found.',
  },
  {
    icon: ListChecks,
    title: 'Researchers',
    body: 'Triage new papers quickly to decide what deserves a close read, and refresh your memory on methods and limitations before you cite something.',
  },
  {
    icon: FileText,
    title: 'Curious readers',
    body: 'Follow the science behind the headlines by reading the original studies — without a graduate degree in the field to decode them.',
  },
];

const FAQS = [
  {
    q: 'What is Scigestible?',
    a: 'Scigestible is a tool that reads academic research papers and turns them into clear, structured summaries. For any paper you upload it produces the study objective, a plain-English summary, the key findings, the methods, the limitations, a glossary of technical terms, and the references — plus a chat so you can ask the paper questions.',
  },
  {
    q: 'What kind of files can I upload?',
    a: 'PDF files of research papers that contain selectable text. Most papers downloaded from journals, Google Scholar, PubMed, or arXiv work fine. Scanned image-only PDFs (where the text is a picture) cannot be read, because there is no text to extract.',
  },
  {
    q: 'How do I get a paper PDF?',
    a: 'Search for the paper on Google Scholar, PubMed, or arXiv and click the PDF or full-text link, then save the file. You can also use the built-in search inside Scigestible to find open-access papers and digest them directly, without leaving the app.',
  },
  {
    q: 'Is it free?',
    a: 'Yes — you can start for free. The free plan covers a library of up to 10 papers, 5 uploads per day, and 3 questions per day. A Pro plan removes those limits and the ads for people who use it heavily.',
  },
  {
    q: 'Is the analysis always accurate?',
    a: 'The breakdown is AI-generated, so it is a strong starting point rather than a substitute for reading the original. Always verify important details — especially numbers, claims, and methods — against the source paper before relying on or citing them.',
  },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-300 overflow-x-hidden">
      {/* Ambient glows */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-56 -right-56 w-[52rem] h-[52rem] bg-blue-600/5 rounded-full blur-3xl" />
        <div className="absolute -bottom-56 -left-56 w-[52rem] h-[52rem] bg-violet-600/6 rounded-full blur-3xl" />
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-indigo-500/3 rounded-full blur-3xl" />
      </div>

      <div className="relative">
        {/* Header */}
        <header className="max-w-6xl mx-auto px-6 py-5 flex items-center justify-between">
          <div className="flex items-center gap-2.5 select-none">
            <LogoIcon size={30} />
            <span className="text-lg font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-violet-400">
              Scigestible
            </span>
          </div>
          <nav className="flex items-center gap-2">
            <Link
              href="/app"
              className="hidden sm:inline-block px-4 py-2 text-sm font-medium text-slate-300 hover:text-white transition-colors"
            >
              Sign in
            </Link>
            <Link
              href="/app"
              className="px-4 py-2 bg-gradient-to-r from-blue-500 to-violet-500 hover:from-blue-400 hover:to-violet-400 text-white rounded-xl text-sm font-semibold transition-all duration-200 shadow-lg shadow-violet-500/20 flex items-center gap-1.5"
            >
              Get started <ChevronRight size={14} />
            </Link>
          </nav>
        </header>

        {/* Hero */}
        <section className="max-w-4xl mx-auto px-6 pt-12 pb-16 md:pt-20 md:pb-24 text-center">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white leading-tight tracking-tight mb-6">
            Research papers, made{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-violet-400">
              actually readable
            </span>
          </h1>
          <p className="text-lg md:text-xl text-slate-400 max-w-2xl mx-auto leading-relaxed mb-10">
            Scigestible turns dense academic PDFs into clear, structured summaries.
            Upload any paper and get the objective, key findings, methods, limitations,
            a glossary, and a chat to ask it anything — in seconds.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/app"
              className="px-8 py-3 bg-gradient-to-r from-blue-500 to-violet-500 hover:from-blue-400 hover:to-violet-400 text-white rounded-xl font-semibold text-sm transition-all duration-200 shadow-lg shadow-violet-500/20 flex items-center gap-2"
            >
              Get started free <ChevronRight size={15} />
            </Link>
            <Link
              href="/app"
              className="px-8 py-3 border border-white/[0.1] hover:border-white/[0.2] bg-white/[0.04] hover:bg-white/[0.07] text-slate-300 rounded-xl font-medium text-sm transition-all duration-200"
            >
              I already have an account
            </Link>
          </div>
          <p className="text-xs text-slate-600 mt-5">
            Free plan: 10 papers · 5 uploads/day · 3 questions/day. No credit card required.
          </p>
        </section>

        {/* Features */}
        <section className="max-w-6xl mx-auto px-6 py-12 md:py-16">
          <div className="text-center mb-12">
            <h2 className="text-2xl md:text-3xl font-bold text-white tracking-tight mb-3">
              Everything you need to understand a paper
            </h2>
            <p className="text-slate-400 max-w-2xl mx-auto leading-relaxed">
              Instead of one long wall of text, Scigestible breaks each paper into the parts
              that matter — so you can read what you need and skip what you don’t.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {FEATURES.map(({ icon: Icon, title, body }) => (
              <div
                key={title}
                className="rounded-2xl border border-white/[0.07] bg-white/[0.03] p-6 hover:border-white/[0.12] transition-colors"
              >
                <div className="w-10 h-10 rounded-xl bg-blue-500/15 text-blue-400 flex items-center justify-center mb-4">
                  <Icon size={18} />
                </div>
                <h3 className="text-base font-semibold text-slate-100 mb-2">{title}</h3>
                <p className="text-sm text-slate-400 leading-relaxed">{body}</p>
              </div>
            ))}
          </div>
        </section>

        {/* How it works */}
        <section className="max-w-5xl mx-auto px-6 py-12 md:py-16">
          <div className="text-center mb-12">
            <h2 className="text-2xl md:text-3xl font-bold text-white tracking-tight mb-3">
              How it works
            </h2>
            <p className="text-slate-400 max-w-2xl mx-auto leading-relaxed">
              From a PDF to a clear understanding in three steps.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {STEPS.map(({ title, body }, i) => (
              <div key={title} className="rounded-2xl border border-white/[0.07] bg-white/[0.03] p-6">
                <div className="w-9 h-9 rounded-full bg-gradient-to-r from-blue-500 to-violet-500 text-white text-sm font-bold flex items-center justify-center mb-4 shadow-lg shadow-violet-500/20">
                  {i + 1}
                </div>
                <h3 className="text-base font-semibold text-slate-100 mb-2">{title}</h3>
                <p className="text-sm text-slate-400 leading-relaxed">{body}</p>
              </div>
            ))}
          </div>
          <div className="flex items-center justify-center gap-2.5 mt-8 text-sm text-slate-500">
            <Upload size={15} className="text-blue-400" />
            <span>Tip: the PDF must have selectable text — scanned image-only papers won’t work.</span>
          </div>
        </section>

        {/* Use cases */}
        <section className="max-w-5xl mx-auto px-6 py-12 md:py-16">
          <div className="text-center mb-12">
            <h2 className="text-2xl md:text-3xl font-bold text-white tracking-tight mb-3">
              Built for anyone who reads research
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {USE_CASES.map(({ icon: Icon, title, body }) => (
              <div key={title} className="rounded-2xl border border-white/[0.07] bg-white/[0.03] p-6">
                <div className="w-10 h-10 rounded-xl bg-violet-500/15 text-violet-400 flex items-center justify-center mb-4">
                  <Icon size={18} />
                </div>
                <h3 className="text-base font-semibold text-slate-100 mb-2">{title}</h3>
                <p className="text-sm text-slate-400 leading-relaxed">{body}</p>
              </div>
            ))}
          </div>
        </section>

        {/* FAQ */}
        <section className="max-w-3xl mx-auto px-6 py-12 md:py-16">
          <div className="text-center mb-12">
            <h2 className="text-2xl md:text-3xl font-bold text-white tracking-tight mb-3">
              Frequently asked questions
            </h2>
          </div>
          <div className="space-y-4">
            {FAQS.map(({ q, a }) => (
              <div key={q} className="rounded-2xl border border-white/[0.07] bg-white/[0.03] p-6">
                <h3 className="text-base font-semibold text-slate-100 mb-2">{q}</h3>
                <p className="text-sm text-slate-400 leading-relaxed">{a}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Final CTA */}
        <section className="max-w-3xl mx-auto px-6 py-16 md:py-20 text-center">
          <div className="flex justify-center mb-6">
            <Sparkles className="text-violet-400" size={28} />
          </div>
          <h2 className="text-2xl md:text-4xl font-bold text-white tracking-tight mb-4">
            Start understanding papers today
          </h2>
          <p className="text-slate-400 max-w-xl mx-auto leading-relaxed mb-8">
            Digest your first paper in under a minute. No credit card, no setup —
            just upload a PDF and read.
          </p>
          <Link
            href="/app"
            className="inline-flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-blue-500 to-violet-500 hover:from-blue-400 hover:to-violet-400 text-white rounded-xl font-semibold text-sm transition-all duration-200 shadow-lg shadow-violet-500/20"
          >
            Get started free <ChevronRight size={15} />
          </Link>
        </section>

        {/* Footer */}
        <footer className="border-t border-white/[0.06] mt-8">
          <div className="max-w-6xl mx-auto px-6 py-10 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2.5 select-none">
              <LogoIcon size={22} />
              <span className="text-sm font-semibold text-slate-300">Scigestible</span>
            </div>
            <nav className="flex items-center gap-6 text-sm text-slate-500">
              <Link href="/app" className="hover:text-slate-300 transition-colors">
                Open app
              </Link>
              <Link href="/privacy" className="hover:text-slate-300 transition-colors">
                Privacy
              </Link>
              <Link href="/terms" className="hover:text-slate-300 transition-colors">
                Terms
              </Link>
            </nav>
            <p className="text-xs text-slate-600">
              © {new Date().getFullYear()} Scigestible
            </p>
          </div>
        </footer>
      </div>
    </div>
  );
}
