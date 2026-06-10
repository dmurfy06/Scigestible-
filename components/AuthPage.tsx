'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase';
import { LogoIcon } from '@/components/Logo';
import { Upload, Sparkles, BookOpen, MessageSquare, FileText, ChevronRight, Brain, Zap } from 'lucide-react';

export function AuthPage() {
  const [mode, setMode] = useState<'welcome' | 'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const supabase = createClient();

  useEffect(() => {
    if (!localStorage.getItem('scigestible-intro-seen')) {
      setMode('welcome');
    }
  }, []);

  const proceedToSignup = () => {
    localStorage.setItem('scigestible-intro-seen', '1');
    setMode('signup');
  };

  const proceedToLogin = () => {
    localStorage.setItem('scigestible-intro-seen', '1');
    setMode('login');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    if (mode === 'login') {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) setError(error.message);
    } else {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
      });
      if (error) {
        setError(error.message);
      } else {
        setMessage('Check your email for a confirmation link, then come back and sign in.');
      }
    }

    setLoading(false);
  };

  if (mode === 'welcome') {
    return (
      <div className="min-h-screen bg-slate-950 overflow-y-auto">
        <div className="fixed inset-0 pointer-events-none overflow-hidden">
          <div className="absolute -top-56 -right-56 w-[52rem] h-[52rem] bg-blue-600/5 rounded-full blur-3xl" />
          <div className="absolute -bottom-56 -left-56 w-[52rem] h-[52rem] bg-violet-600/6 rounded-full blur-3xl" />
          <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-indigo-500/3 rounded-full blur-3xl" />
        </div>

        <div className="relative flex flex-col items-center px-6 py-16 md:py-24">
          {/* Logo */}
          <div className="flex items-center gap-3 mb-10 select-none">
            <LogoIcon size={40} />
            <span className="text-2xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-violet-400">
              Scigestible
            </span>
          </div>

          {/* Headline */}
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white text-center leading-tight mb-5 max-w-3xl">
            Research papers, made{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-violet-400">
              actually readable
            </span>
          </h1>
          <p className="text-slate-400 text-lg md:text-xl text-center max-w-2xl mb-14 leading-relaxed">
            Upload any academic PDF and get an instant AI-powered breakdown — summary, key findings, methods, glossary, and a Q&amp;A chat. No more wading through dense jargon.
          </p>

          {/* What it can do */}
          <div className="w-full max-w-4xl mb-14">
            <h2 className="text-xs font-semibold uppercase tracking-widest text-slate-600 text-center mb-8">What Scigestible does</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <InfoCard
                icon={<Zap size={18} />}
                title="Instant analysis"
                description="Upload a PDF and get a full structured breakdown in 15–30 seconds."
              />
              <InfoCard
                icon={<Brain size={18} />}
                title="AI-generated summary"
                description="Objectives, key findings, methods, and limitations explained in plain English."
              />
              <InfoCard
                icon={<BookOpen size={18} />}
                title="Glossary & references"
                description="Technical terms defined automatically, citations formatted for you."
              />
              <InfoCard
                icon={<MessageSquare size={18} />}
                title="Ask anything"
                description="Chat directly with the paper to dig deeper into anything you don't understand."
              />
            </div>
          </div>

          {/* How it works */}
          <div className="w-full max-w-3xl mb-14">
            <h2 className="text-xs font-semibold uppercase tracking-widest text-slate-600 text-center mb-8">How it works</h2>
            <div className="flex flex-col md:flex-row gap-3">
              {[
                { step: 1, title: 'Find your paper', body: 'Search Google Scholar, PubMed, or arXiv. Download the PDF — it needs selectable text, not a scanned image.' },
                { step: 2, title: 'Upload it', body: 'Drag the PDF into Scigestible. Analysis starts immediately — no configuration required.' },
                { step: 3, title: 'Read & explore', body: 'Browse the structured breakdown, read the glossary, and ask follow-up questions in the chat.' },
              ].map(({ step, title, body }) => (
                <div key={step} className="flex-1 rounded-2xl border border-white/[0.07] bg-white/[0.03] p-5">
                  <div className="w-7 h-7 rounded-full bg-blue-500/20 text-blue-400 text-xs font-bold flex items-center justify-center mb-3">
                    {step}
                  </div>
                  <p className="text-sm font-semibold text-slate-200 mb-1">{title}</p>
                  <p className="text-xs text-slate-500 leading-relaxed">{body}</p>
                </div>
              ))}
            </div>
          </div>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row gap-3 mb-4">
            <button
              onClick={proceedToSignup}
              className="px-8 py-3 bg-gradient-to-r from-blue-500 to-violet-500 hover:from-blue-400 hover:to-violet-400 text-white rounded-xl font-semibold text-sm transition-all duration-200 shadow-lg shadow-violet-500/20 flex items-center gap-2"
            >
              Get Started Free
              <ChevronRight size={15} />
            </button>
            <button
              onClick={proceedToLogin}
              className="px-8 py-3 border border-white/[0.1] hover:border-white/[0.2] bg-white/[0.04] hover:bg-white/[0.07] text-slate-300 rounded-xl font-medium text-sm transition-all duration-200"
            >
              I already have an account
            </button>
          </div>
          <p className="text-xs text-slate-600">Free plan: 10 papers · 5 uploads/day · 3 questions/day</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 overflow-y-auto">
      {/* Ambient glows */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-56 -right-56 w-[52rem] h-[52rem] bg-blue-600/5 rounded-full blur-3xl" />
        <div className="absolute -bottom-56 -left-56 w-[52rem] h-[52rem] bg-violet-600/6 rounded-full blur-3xl" />
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-indigo-500/3 rounded-full blur-3xl" />
      </div>

      <div className="relative min-h-screen flex flex-col lg:flex-row">

        {/* Left: hero / feature panel */}
        <div className="flex-1 flex flex-col justify-center px-8 py-14 lg:px-16 lg:py-20 max-w-2xl mx-auto lg:mx-0 lg:max-w-none w-full">

          {/* Logo */}
          <div className="flex items-center gap-3 mb-12 select-none">
            <LogoIcon size={36} />
            <span className="text-xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-violet-400">
              Scigestible
            </span>
          </div>

          {/* Headline */}
          <h1 className="text-4xl lg:text-5xl font-bold text-white tracking-tight leading-tight mb-5">
            Understand research papers{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-violet-400">
              in minutes
            </span>
          </h1>
          <p className="text-slate-400 text-lg leading-relaxed mb-10 max-w-lg">
            Upload any academic PDF and get an instant AI-powered breakdown — summary, key findings, methods, limitations, glossary, and more. No more wading through dense jargon.
          </p>

          {/* Features */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-12">
            <Feature icon={<Upload size={16} />} title="Upload any research PDF" description="From Google Scholar, PubMed, arXiv, or your university library" />
            <Feature icon={<Sparkles size={16} />} title="Instant AI analysis" description="Summary, objectives, findings, and methods extracted automatically" />
            <Feature icon={<BookOpen size={16} />} title="Glossary & references" description="Key terms explained and citations formatted for you" />
            <Feature icon={<MessageSquare size={16} />} title="Ask questions" description="Chat with the paper to dig deeper into anything you don't understand" />
          </div>

          {/* How to get a PDF */}
          <div className="rounded-2xl border border-white/[0.07] bg-white/[0.03] p-5 max-w-lg">
            <div className="flex items-center gap-2 mb-3">
              <FileText size={15} className="text-blue-400 flex-shrink-0" />
              <span className="text-sm font-semibold text-slate-300">How to get a paper PDF</span>
            </div>
            <ol className="space-y-2">
              {[
                'Search for a paper on Google Scholar, PubMed, or arXiv',
                'Click the PDF link next to the result (or "Full text" → PDF)',
                'Save the PDF to your computer',
                'Upload it here — analysis takes about 15–30 seconds',
              ].map((step, i) => (
                <li key={i} className="flex items-start gap-2.5 text-sm text-slate-400">
                  <span className="flex-shrink-0 w-5 h-5 rounded-full bg-blue-500/20 text-blue-400 text-xs font-bold flex items-center justify-center mt-0.5">
                    {i + 1}
                  </span>
                  {step}
                </li>
              ))}
            </ol>
            <p className="text-xs text-slate-600 mt-3">
              Note: the PDF must have selectable text — scanned image PDFs won&apos;t work.
            </p>
          </div>
        </div>

        {/* Right: auth card */}
        <div className="flex items-center justify-center px-6 py-10 lg:py-20 lg:px-16 lg:min-w-[420px] lg:max-w-[420px]">
          <div className="w-full max-w-sm lg:max-w-none">
            <div className="bg-slate-900/80 backdrop-blur-xl rounded-2xl border border-white/[0.07] shadow-2xl shadow-black/60 p-7">
              <h2 className="text-base font-semibold text-white mb-0.5">
                {mode === 'login' ? 'Welcome back' : 'Create an account'}
              </h2>
              <p className="text-sm text-slate-500 mb-6">
                {mode === 'login'
                  ? 'Sign in to access your saved papers'
                  : 'Start analysing research papers for free'}
              </p>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1.5">
                    Email
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full px-3 py-2.5 bg-white/[0.06] border border-white/[0.09] rounded-xl text-sm text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500/50 transition-all duration-150"
                    placeholder="you@university.ac.uk"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1.5">
                    Password
                  </label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={6}
                    className="w-full px-3 py-2.5 bg-white/[0.06] border border-white/[0.09] rounded-xl text-sm text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500/50 transition-all duration-150"
                    placeholder="••••••••"
                  />
                  {mode === 'signup' && (
                    <p className="text-xs text-slate-600 mt-1.5">Minimum 6 characters</p>
                  )}
                </div>

                {error && (
                  <div className="px-3 py-2.5 bg-red-500/10 border border-red-500/20 rounded-xl">
                    <p className="text-sm text-red-400">{error}</p>
                  </div>
                )}
                {message && (
                  <div className="px-3 py-2.5 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
                    <p className="text-sm text-emerald-400">{message}</p>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2.5 px-4 bg-gradient-to-r from-blue-500 to-violet-500 hover:from-blue-400 hover:to-violet-400 active:from-blue-600 active:to-violet-600 text-white rounded-xl font-medium text-sm transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-violet-500/20 mt-1 flex items-center justify-center gap-2"
                >
                  {loading ? 'Please wait…' : (
                    <>
                      {mode === 'login' ? 'Sign in' : 'Get started free'}
                      {!loading && <ChevronRight size={14} />}
                    </>
                  )}
                </button>
              </form>

              <p className="text-sm text-center text-slate-500 mt-6">
                {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
                <button
                  onClick={() => {
                    setMode(mode === 'login' ? 'signup' : 'login');
                    setError(null);
                    setMessage(null);
                  }}
                  className="text-blue-400 font-medium hover:text-violet-400 transition-colors duration-150"
                >
                  {mode === 'login' ? 'Sign up free' : 'Sign in'}
                </button>
              </p>

              {mode === 'signup' && (
                <p className="text-xs text-center text-slate-600 mt-4">
                  Free plan: 10 papers · 5 uploads/day · 3 questions/day
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Feature({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <div className="flex items-start gap-3">
      <div className="flex-shrink-0 w-7 h-7 rounded-lg bg-blue-500/15 text-blue-400 flex items-center justify-center mt-0.5">
        {icon}
      </div>
      <div>
        <p className="text-sm font-medium text-slate-200">{title}</p>
        <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{description}</p>
      </div>
    </div>
  );
}

function InfoCard({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <div className="rounded-2xl border border-white/[0.07] bg-white/[0.03] p-5">
      <div className="w-8 h-8 rounded-xl bg-blue-500/15 text-blue-400 flex items-center justify-center mb-3">
        {icon}
      </div>
      <p className="text-sm font-semibold text-slate-200 mb-1">{title}</p>
      <p className="text-xs text-slate-500 leading-relaxed">{description}</p>
    </div>
  );
}
