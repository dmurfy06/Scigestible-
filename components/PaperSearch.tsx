'use client';

import { useState, useRef } from 'react';
import {
  Search, Loader, ExternalLink, Sparkles, AlertCircle, Globe, Quote, Unlock, BookmarkPlus,
} from 'lucide-react';

interface SearchResult {
  id: string;
  title: string;
  authors: string[];
  year: number | null;
  venue: string | null;
  abstract: string | null;
  doi: string | null;
  url: string;
  pdfUrl: string | null;
  sources: string[];
  citationCount: number | null;
}

type SearchAction = 'digest' | 'save';

interface PaperSearchProps {
  // Download the PDF then digest (summarise) it immediately
  onDigest: (file: File) => Promise<void>;
  // Download the PDF and save it to the library without digesting
  onSave: (file: File) => Promise<void>;
  isBusy: boolean;
}

function formatAuthors(authors: string[]): string {
  if (authors.length === 0) return 'Unknown authors';
  if (authors.length <= 3) return authors.join(', ');
  return `${authors.slice(0, 3).join(', ')} +${authors.length - 3} more`;
}

function sanitizeFilename(title: string): string {
  return title.replace(/[^a-zA-Z0-9 \-_]/g, '').replace(/\s+/g, ' ').trim().slice(0, 80) || 'paper';
}

export function PaperSearch({ onDigest, onSave, isBusy }: PaperSearchProps) {
  const [query, setQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [results, setResults] = useState<SearchResult[] | null>(null);
  const [sourcesFailed, setSourcesFailed] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<{ id: string; action: SearchAction } | null>(null);
  const [importError, setImportError] = useState<{ id: string; message: string } | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    const q = query.trim();
    if (!q || searching) return;

    setSearching(true);
    setError(null);
    setResults(null);
    setImportError(null);

    try {
      const res = await fetch(`/api/search-papers?q=${encodeURIComponent(q)}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Search failed');
      setResults(data.results);
      setSourcesFailed(data.sourcesFailed ?? 0);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Search failed — please try again.');
    } finally {
      setSearching(false);
    }
  };

  const handleAction = async (result: SearchResult, action: SearchAction) => {
    if (!result.pdfUrl || busy || isBusy) return;

    setBusy({ id: result.id, action });
    setImportError(null);

    try {
      const res = await fetch('/api/fetch-pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: result.pdfUrl }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Could not download the PDF');
      }

      const blob = await res.blob();
      const file = new File([blob], `${sanitizeFilename(result.title)}.pdf`, { type: 'application/pdf' });
      if (action === 'digest') {
        await onDigest(file);
      } else {
        await onSave(file);
      }
    } catch (err) {
      setImportError({
        id: result.id,
        message: err instanceof Error ? err.message : `${action === 'digest' ? 'Digest' : 'Save'} failed`,
      });
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-6 py-10 md:py-16 w-full">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2 tracking-tight">
          Find Research Papers
        </h2>
        <p className="text-slate-500 dark:text-slate-400 text-sm">
          Searches OpenAlex, arXiv, Crossref, Europe PMC & Semantic Scholar — all free databases
        </p>
      </div>

      {/* Search bar */}
      <form onSubmit={handleSearch} className="flex gap-2 mb-8">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 pointer-events-none" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by topic, title, author, or DOI…"
            className="w-full pl-10 pr-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500/50 transition-all duration-150 shadow-sm"
          />
        </div>
        <button
          type="submit"
          disabled={searching || !query.trim()}
          className="px-5 py-3 bg-gradient-to-r from-blue-500 to-violet-500 hover:from-blue-400 hover:to-violet-400 text-white rounded-xl font-medium text-sm transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-violet-500/20 flex items-center gap-2"
        >
          {searching ? <Loader size={14} className="animate-spin" /> : <Search size={14} />}
          Search
        </button>
      </form>

      {/* States */}
      {searching && (
        <div className="text-center py-12">
          <Loader size={22} className="animate-spin text-blue-500 mx-auto mb-3" />
          <p className="text-sm text-slate-500 dark:text-slate-400">Searching 5 databases…</p>
        </div>
      )}

      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800/60 rounded-2xl flex gap-3">
          <AlertCircle className="text-red-500 flex-shrink-0 mt-0.5" size={16} />
          <p className="text-sm text-red-800 dark:text-red-400">{error}</p>
        </div>
      )}

      {results !== null && !searching && (
        <>
          <div className="flex items-center justify-between mb-4">
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {results.length === 0
                ? 'No papers found — try different keywords'
                : `${results.length} paper${results.length === 1 ? '' : 's'} found`}
            </p>
            {sourcesFailed > 0 && (
              <p className="text-xs text-amber-600 dark:text-amber-400">
                {sourcesFailed} database{sourcesFailed === 1 ? '' : 's'} unavailable
              </p>
            )}
          </div>

          <div className="space-y-3">
            {results.map((result) => (
              <div
                key={result.id}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm hover:border-slate-300 dark:hover:border-slate-700 transition-colors"
              >
                <h3 className="text-sm font-semibold text-slate-900 dark:text-white leading-snug mb-1.5">
                  {result.title}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">
                  {formatAuthors(result.authors)}
                  {result.year && <> · {result.year}</>}
                  {result.venue && <> · <span className="italic">{result.venue}</span></>}
                </p>

                {result.abstract && (
                  <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed mb-3 line-clamp-3">
                    {result.abstract}
                  </p>
                )}

                <div className="flex items-center flex-wrap gap-1.5 mb-3">
                  {result.pdfUrl && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 text-[10px] font-semibold">
                      <Unlock size={9} /> Free PDF
                    </span>
                  )}
                  {result.citationCount !== null && result.citationCount > 0 && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 text-[10px] font-medium">
                      <Quote size={9} /> {result.citationCount.toLocaleString()} citations
                    </span>
                  )}
                  {result.sources.map((source) => (
                    <span
                      key={source}
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-blue-50 dark:bg-blue-950/40 text-blue-500 dark:text-blue-400 text-[10px] font-medium"
                    >
                      <Globe size={9} /> {source}
                    </span>
                  ))}
                </div>

                {importError?.id === result.id && (
                  <div className="mb-3 px-3 py-2 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800/60 rounded-xl">
                    <p className="text-xs text-red-700 dark:text-red-400">{importError.message}</p>
                  </div>
                )}

                <div className="flex items-center flex-wrap gap-2">
                  {result.pdfUrl && (
                    <>
                      <button
                        onClick={() => handleAction(result, 'digest')}
                        disabled={busy !== null || isBusy}
                        title="Save and summarise this paper now"
                        className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-gradient-to-r from-blue-500 to-violet-500 hover:from-blue-400 hover:to-violet-400 text-white rounded-lg text-xs font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm shadow-violet-500/20"
                      >
                        {busy?.id === result.id && busy.action === 'digest' ? (
                          <><Loader size={11} className="animate-spin" /> Digesting…</>
                        ) : (
                          <><Sparkles size={11} /> Digest</>
                        )}
                      </button>
                      <button
                        onClick={() => handleAction(result, 'save')}
                        disabled={busy !== null || isBusy}
                        title="Save the PDF to your library without summarising it yet"
                        className="inline-flex items-center gap-1.5 px-3.5 py-1.5 border border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg text-xs font-medium transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {busy?.id === result.id && busy.action === 'save' ? (
                          <><Loader size={11} className="animate-spin" /> Saving…</>
                        ) : (
                          <><BookmarkPlus size={11} /> Save to Library</>
                        )}
                      </button>
                    </>
                  )}
                  {result.url && (
                    <a
                      href={result.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3.5 py-1.5 border border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg text-xs font-medium transition-all duration-150"
                    >
                      <ExternalLink size={11} />
                      View online
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {results === null && !searching && !error && (
        <div className="text-center py-12 select-none">
          <div className="w-14 h-14 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto mb-4">
            <Search size={22} className="text-slate-400 dark:text-slate-500" />
          </div>
          <p className="text-sm font-medium text-slate-600 dark:text-slate-300 mb-1">
            Search millions of research papers
          </p>
          <p className="text-xs text-slate-400 dark:text-slate-500 max-w-md mx-auto leading-relaxed">
            Papers with a <span className="text-emerald-500 font-medium">Free PDF</span> badge can be
            <span className="text-slate-600 dark:text-slate-300 font-medium"> digested</span> (summarised) right away,
            or <span className="text-slate-600 dark:text-slate-300 font-medium">saved to your library</span> to digest later.
            Others link to the publisher&apos;s site.
          </p>
        </div>
      )}
    </div>
  );
}
