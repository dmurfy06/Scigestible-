'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Send, Loader, MessageCircle, AlertTriangle } from 'lucide-react';
import { PaperAnalysis } from '@/lib/types';

interface Message {
  role: 'user' | 'assistant';
  text: string;
}

const SESSION_LIMIT = 10;

export function AskTab({ analysis }: { analysis: PaperAnalysis }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const questionCount = messages.filter((m) => m.role === 'user').length;
  const limitReached = questionCount >= SESSION_LIMIT;

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const handleSend = async () => {
    const q = input.trim();
    if (!q || loading || limitReached) return;

    setInput('');
    setError(null);
    setMessages((prev) => [...prev, { role: 'user', text: q }]);
    setLoading(true);

    try {
      const res = await fetch('/api/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: q, analysis }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Request failed');

      setMessages((prev) => [...prev, { role: 'assistant', text: data.answer }]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
      setMessages((prev) => prev.slice(0, -1));
    } finally {
      setLoading(false);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="card flex flex-col" style={{ minHeight: '520px' }}>
      <div className="flex items-start justify-between mb-4">
        <div>
          <h2 className="mb-0">Ask the Paper</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Answers are based on this paper&apos;s analysis only — not general knowledge.
          </p>
        </div>
        <span className="text-xs text-slate-400 dark:text-slate-500 shrink-0 mt-1">
          {questionCount}/{SESSION_LIMIT} questions
        </span>
      </div>

      {/* Chat area */}
      <div className="flex-1 overflow-y-auto space-y-3 mb-4 pr-1" style={{ maxHeight: '360px' }}>
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-40 text-slate-400 dark:text-slate-600 select-none">
            <MessageCircle size={32} className="mb-2 opacity-40" />
            <p className="text-sm text-center">
              Ask anything about this paper — methods, findings, definitions…
            </p>
          </div>
        )}

        {messages.map((msg, i) =>
          msg.role === 'user' ? (
            <div key={i} className="flex justify-end">
              <div className="max-w-[78%] px-3.5 py-2.5 rounded-2xl rounded-tr-sm bg-blue-600 text-white text-sm leading-relaxed">
                {msg.text}
              </div>
            </div>
          ) : (
            <div key={i} className="flex justify-start">
              <div className="max-w-[78%] px-3.5 py-2.5 rounded-2xl rounded-tl-sm bg-slate-100 dark:bg-slate-700/60 text-slate-800 dark:text-slate-200 text-sm leading-relaxed whitespace-pre-wrap">
                {msg.text}
              </div>
            </div>
          )
        )}

        {loading && (
          <div className="flex justify-start">
            <div className="px-3.5 py-2.5 rounded-2xl rounded-tl-sm bg-slate-100 dark:bg-slate-700/60 flex items-center gap-2">
              <Loader size={13} className="animate-spin text-slate-400 dark:text-slate-500" />
              <span className="text-sm text-slate-400 dark:text-slate-500">Thinking…</span>
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {error && (
        <div className="mb-3 flex items-center gap-2 px-3 py-2 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800/60 rounded-xl text-xs text-red-700 dark:text-red-400">
          <AlertTriangle size={13} className="flex-shrink-0" />
          {error}
        </div>
      )}

      {limitReached ? (
        <div className="flex items-center gap-2 px-4 py-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/40 rounded-2xl text-sm text-amber-700 dark:text-amber-400">
          <AlertTriangle size={15} className="flex-shrink-0" />
          Session limit reached ({SESSION_LIMIT} questions). Reload the page to start a new session.
        </div>
      ) : (
        <div className="flex items-end gap-2">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask a question about this paper…"
            rows={2}
            disabled={loading}
            className="flex-1 px-3 py-2.5 bg-white dark:bg-slate-700/80 border border-slate-200 dark:border-slate-600 rounded-2xl text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors resize-none disabled:opacity-50"
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || loading}
            className="flex items-center justify-center w-10 h-10 rounded-2xl bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex-shrink-0"
            title="Send (Enter)"
          >
            <Send size={16} />
          </button>
        </div>
      )}

      <p className="text-xs text-slate-400 dark:text-slate-600 mt-2 text-center">
        Press Enter to send · Shift+Enter for new line
      </p>
    </div>
  );
}
