'use client';

import React, { useState } from 'react';
import { Copy, Check } from 'lucide-react';
import { PaperAnalysis, CitationData } from '@/lib/types';

export function StudyObjectiveTab({ analysis }: { analysis: PaperAnalysis }) {
  return (
    <div className="card">
      <h2>Study Objective</h2>
      <ul className="space-y-3">
        {analysis.studyObjective.points.map((point, index) => (
          <li key={index} className="flex gap-3">
            <span className="text-blue-600 font-semibold flex-shrink-0">•</span>
            <span className="text-slate-700">{point}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function SummaryTab({ analysis }: { analysis: PaperAnalysis }) {
  return (
    <div className="card">
      <h2>Plain English Summary</h2>
      <p className="text-slate-700 leading-relaxed whitespace-pre-wrap">
        {analysis.plainEnglishSummary.text}
      </p>
    </div>
  );
}

export function FindingsTab({ analysis }: { analysis: PaperAnalysis }) {
  return (
    <div className="card">
      <h2>Key Findings</h2>
      <ul className="space-y-3">
        {analysis.keyFindings.map((finding, index) => (
          <li key={index} className="flex gap-3">
            <span className="text-blue-600 font-semibold flex-shrink-0">•</span>
            <span className="text-slate-700">{finding.text}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function MethodsTab({ analysis }: { analysis: PaperAnalysis }) {
  return (
    <div className="card">
      <h2>Methods Overview</h2>
      <p className="text-slate-700 leading-relaxed whitespace-pre-wrap">
        {analysis.methodsOverview.text}
      </p>
    </div>
  );
}

export function LimitationsTab({ analysis }: { analysis: PaperAnalysis }) {
  return (
    <div className="card">
      <h2>Limitations</h2>
      <ul className="space-y-3">
        {analysis.limitations.map((limitation, index) => (
          <li key={index} className="flex gap-3">
            <span className="text-amber-600 font-semibold flex-shrink-0">⚠</span>
            <span className="text-slate-700">{limitation.text}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

// ── Citation helpers ──────────────────────────────────────────────────────────

function parseAuthor(raw: string): { last: string; initials: string; firstFull: string } {
  let last = '', first = '';
  if (raw.includes(',')) {
    [last, first] = raw.split(',').map((s) => s.trim());
  } else {
    const parts = raw.trim().split(' ');
    last = parts.pop() ?? '';
    first = parts.join(' ');
  }
  // Build initials from first name (handles "John David" → "J. D." or "J. D." → "J. D.")
  const initials = first
    .split(' ')
    .filter(Boolean)
    .map((p) => p[0].toUpperCase() + '.')
    .join(' ');
  return { last, initials, firstFull: first };
}

function harvardAuthors(authors: string[]): string {
  const fmt = authors.map((a) => {
    const { last, initials } = parseAuthor(a);
    return initials ? `${last}, ${initials}` : last;
  });
  if (fmt.length === 1) return fmt[0];
  if (fmt.length <= 3) return fmt.slice(0, -1).join(', ') + ' and ' + fmt[fmt.length - 1];
  return fmt[0] + ' et al.';
}

function apaAuthors(authors: string[]): string {
  const fmt = authors.map((a) => {
    const { last, initials } = parseAuthor(a);
    return initials ? `${last}, ${initials}` : last;
  });
  if (fmt.length === 1) return fmt[0];
  if (fmt.length <= 20) return fmt.slice(0, -1).join(', ') + ', & ' + fmt[fmt.length - 1];
  return fmt.slice(0, 19).join(', ') + ', … ' + fmt[fmt.length - 1];
}

function vancouverAuthors(authors: string[]): string {
  const fmt = authors.map((a) => {
    const { last, initials } = parseAuthor(a);
    // Vancouver uses no periods: "Smith JD"
    const initNoPoints = initials.replace(/\.\s*/g, '');
    return `${last} ${initNoPoints}`.trim();
  });
  if (fmt.length <= 6) return fmt.join(', ');
  return fmt.slice(0, 6).join(', ') + ', et al.';
}

function buildHarvard(c: CitationData): string {
  const authors = harvardAuthors(c.authors);
  let ref = `${authors} (${c.year}) `;
  ref += `'${c.title}'`;
  if (c.journal) ref += `, ${c.journal}`;
  if (c.volume) ref += `, ${c.volume}`;
  if (c.issue) ref += `(${c.issue})`;
  if (c.pages) ref += `, pp. ${c.pages}`;
  ref += '.';
  if (c.doi) ref += ` doi: ${c.doi}.`;
  return ref;
}

function buildAPA(c: CitationData): string {
  const authors = apaAuthors(c.authors);
  let ref = `${authors} (${c.year}). `;
  ref += `${c.title}. `;
  if (c.journal) ref += `${c.journal}`;
  if (c.volume) ref += `, ${c.volume}`;
  if (c.issue) ref += `(${c.issue})`;
  if (c.pages) ref += `, ${c.pages}`;
  ref += '.';
  if (c.doi) ref += ` https://doi.org/${c.doi}`;
  return ref;
}

function buildVancouver(c: CitationData): string {
  const authors = vancouverAuthors(c.authors);
  let ref = `${authors}. `;
  ref += `${c.title}. `;
  if (c.journal) ref += `${c.journal}. `;
  ref += `${c.year}`;
  if (c.volume) ref += `;${c.volume}`;
  if (c.issue) ref += `(${c.issue})`;
  if (c.pages) ref += `:${c.pages}`;
  ref += '.';
  if (c.doi) ref += ` doi: ${c.doi}.`;
  return ref;
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button
      onClick={handleCopy}
      title="Copy to clipboard"
      className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-blue-600 transition-colors px-2 py-1 rounded hover:bg-blue-50"
    >
      {copied ? <Check size={13} className="text-green-600" /> : <Copy size={13} />}
      {copied ? 'Copied' : 'Copy'}
    </button>
  );
}

export function CitationTab({ analysis }: { analysis: PaperAnalysis }) {
  const c = analysis.citationData;

  if (!c || !c.authors?.length || !c.title) {
    return (
      <div className="card">
        <h2>References</h2>
        <p className="text-slate-500 text-sm">
          Citation data is not available for this paper. Re-upload it to generate references.
        </p>
      </div>
    );
  }

  const styles = [
    {
      name: 'Harvard',
      description: 'Author–date style, widely used in UK universities',
      text: buildHarvard(c),
      journalField: c.journal,
      volumeItalic: false,
    },
    {
      name: 'APA (7th edition)',
      description: 'American Psychological Association, common in social sciences',
      text: buildAPA(c),
      journalField: c.journal,
      volumeItalic: true,
    },
    {
      name: 'Vancouver',
      description: 'Numbered style, standard in medicine and health sciences',
      text: buildVancouver(c),
      journalField: c.journal,
      volumeItalic: false,
    },
  ];

  return (
    <div className="card">
      <h2>References</h2>
      <p className="text-sm text-slate-500 mb-6">
        Auto-generated from the paper&apos;s metadata. Always verify against the original before submitting work.
      </p>

      <div className="space-y-5">
        {styles.map(({ name, description, text }) => (
          <div key={name} className="border border-slate-200 rounded-xl overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 bg-slate-50 border-b border-slate-200">
              <div>
                <span className="font-semibold text-slate-800 text-sm">{name}</span>
                <span className="text-xs text-slate-400 ml-2">{description}</span>
              </div>
              <CopyButton text={text} />
            </div>
            <div className="px-4 py-3 bg-white">
              <p className="text-sm text-slate-700 leading-relaxed">{text}</p>
            </div>
          </div>
        ))}
      </div>

      {c.doi && (
        <div className="mt-5 pt-4 border-t border-slate-100">
          <p className="text-xs text-slate-500">
            DOI:{' '}
            <a
              href={`https://doi.org/${c.doi}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline font-mono"
            >
              {c.doi}
            </a>
          </p>
        </div>
      )}
    </div>
  );
}

export function GlossaryTab({ analysis }: { analysis: PaperAnalysis }) {
  const [searchTerm, setSearchTerm] = React.useState('');
  const filteredTerms = analysis.glossary.filter(
    (item) =>
      item.term.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.definition.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="card">
      <h2>Scientific Glossary</h2>
      <input
        type="text"
        placeholder="Search terms..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="w-full px-3 py-2 border border-slate-300 rounded-lg mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
      <div className="space-y-4">
        {filteredTerms.length > 0 ? (
          filteredTerms.map((term, index) => (
            <div key={index} className="border-l-4 border-blue-500 pl-4 py-2">
              <h4 className="font-semibold text-slate-900">{term.term}</h4>
              <p className="text-slate-700 text-sm mt-1">{term.definition}</p>
            </div>
          ))
        ) : (
          <p className="text-slate-500 text-center py-4">No terms found</p>
        )}
      </div>
    </div>
  );
}
