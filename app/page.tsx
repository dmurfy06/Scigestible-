'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useState } from 'react';
import type { User } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase';
import { AuthPage } from '@/components/AuthPage';
import { Sidebar } from '@/components/Sidebar';
import { PDFUpload } from '@/components/PDFUpload';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  StudyObjectiveTab,
  SummaryTab,
  FindingsTab,
  MethodsTab,
  LimitationsTab,
  GlossaryTab,
  CitationTab,
} from '@/components/AnalysisTabs';
import { NotesTab } from '@/components/NotesTab';
import { AskTab } from '@/components/AskTab';
import { useAppStore } from '@/lib/store';
import { extractTextFromPDF } from '@/lib/pdf-extractor';
import { Paper } from '@/lib/types';
import { AlertCircle, Loader, Upload } from 'lucide-react';

export default function Home() {
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [papers, setPapers] = useState<Paper[]>([]);
  const [papersLoading, setPapersLoading] = useState(false);
  const [showUpload, setShowUpload] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analyzeError, setAnalyzeError] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const { currentPaper, setCurrentPaper, notes, addNote, updateNote, deleteNote, loadNotesForPaper } =
    useAppStore();

  const supabase = createClient();

  // Listen to auth state changes
  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
      setAuthLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Load papers from Supabase when user is set
  useEffect(() => {
    if (!user) {
      setPapers([]);
      setCurrentPaper(null);
      return;
    }

    setPapersLoading(true);
    supabase
      .from('papers')
      .select('*')
      .order('uploaded_at', { ascending: false })
      .then(({ data }) => {
        if (data) {
          const mapped: Paper[] = data.map((row) => ({
            id: row.id,
            filename: row.filename,
            analysis: row.analysis,
            uploadedAt: new Date(row.uploaded_at).getTime(),
          }));
          setPapers(mapped);
          if (mapped.length > 0) {
            setCurrentPaper(mapped[0]);
            loadNotesForPaper(mapped[0].id);
          } else {
            setShowUpload(true);
          }
        }
        setPapersLoading(false);
      });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setCurrentPaper(null);
    setPapers([]);
    setShowUpload(false);
  };

  const handleSelectPaper = (paper: Paper) => {
    setCurrentPaper(paper);
    setShowUpload(false);
    setAnalyzeError(null);
    loadNotesForPaper(paper.id);
  };

  const handleNewPaper = () => {
    setShowUpload(true);
    setCurrentPaper(null);
    setAnalyzeError(null);
    setSelectedFile(null);
  };

  const handleFileSelect = async (file: File) => {
    setSelectedFile(file);
    setAnalyzeError(null);
    setIsAnalyzing(true);

    try {
      const extraction = await extractTextFromPDF(file);

      if (!extraction.success) {
        setAnalyzeError(extraction.error || 'Failed to extract PDF text');
        return;
      }

      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paperText: extraction.text, filename: file.name }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Analysis failed');
      }

      const paper: Paper = await res.json();
      setPapers((prev) => [paper, ...prev]);
      setCurrentPaper(paper);
      setShowUpload(false);
      setSelectedFile(null);
      loadNotesForPaper(paper.id);
    } catch (err) {
      setAnalyzeError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Auth loading spinner
  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center">
        <Loader className="animate-spin text-blue-600" size={28} />
      </div>
    );
  }

  // Not logged in
  if (!user) {
    return <AuthPage />;
  }

  const showingUpload = showUpload || (!currentPaper && !papersLoading);

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-slate-950 overflow-hidden">
      <Sidebar
        user={user}
        papers={papers}
        currentPaperId={currentPaper?.id ?? null}
        loading={papersLoading}
        onSelectPaper={handleSelectPaper}
        onNewPaper={handleNewPaper}
        onSignOut={handleSignOut}
      />

      <main className="flex-1 overflow-y-auto">
        {showingUpload ? (
          <div className="max-w-xl mx-auto px-6 py-16">
            <div className="text-center mb-8">
              <div className="w-14 h-14 bg-blue-100 dark:bg-blue-900/40 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-sm">
                <Upload size={24} className="text-blue-600 dark:text-blue-400" />
              </div>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2 tracking-tight">
                Upload a Research Paper
              </h2>
              <p className="text-slate-500 dark:text-slate-400 text-sm">
                PDF must have selectable text — not a scanned image
              </p>
            </div>

            <div className="bg-white dark:bg-slate-800/60 rounded-2xl border border-slate-100 dark:border-slate-700/60 shadow-sm p-6">
              <PDFUpload
                onFileSelect={handleFileSelect}
                isLoading={isAnalyzing}
                currentFile={selectedFile}
              />
            </div>

            {analyzeError && (
              <div className="mt-4 p-4 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800/60 rounded-2xl flex gap-3">
                <AlertCircle className="text-red-500 flex-shrink-0 mt-0.5" size={16} />
                <p className="text-sm text-red-800 dark:text-red-400">{analyzeError}</p>
              </div>
            )}

            {isAnalyzing && (
              <div className="mt-4 p-5 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800/60 rounded-2xl text-center">
                <div className="flex items-center justify-center gap-2.5 mb-1">
                  <Loader className="animate-spin text-blue-600 dark:text-blue-400" size={16} />
                  <p className="font-semibold text-blue-900 dark:text-blue-300 text-sm">Analysing your paper…</p>
                </div>
                <p className="text-xs text-blue-600 dark:text-blue-500">Usually takes 15–30 seconds.</p>
              </div>
            )}
          </div>
        ) : currentPaper ? (
          <div className="max-w-4xl mx-auto px-6 py-6">
            <div className="mb-6">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white truncate tracking-tight mb-0">
                {currentPaper.filename.replace(/\.pdf$/i, '')}
              </h2>
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                Analysed{' '}
                {new Date(currentPaper.uploadedAt).toLocaleDateString('en-GB', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                })}
              </p>
            </div>

            <Tabs defaultValue="summary" className="w-full">
              <TabsList className="w-full justify-start overflow-x-auto mb-4">
                <TabsTrigger value="objective">Objective</TabsTrigger>
                <TabsTrigger value="summary">Summary</TabsTrigger>
                <TabsTrigger value="findings">Findings</TabsTrigger>
                <TabsTrigger value="methods">Methods</TabsTrigger>
                <TabsTrigger value="limitations">Limitations</TabsTrigger>
                <TabsTrigger value="glossary">Glossary</TabsTrigger>
                <TabsTrigger value="references">References</TabsTrigger>
                <TabsTrigger value="ask">Ask</TabsTrigger>
                <TabsTrigger value="notes">Notes</TabsTrigger>
              </TabsList>

              <TabsContent value="objective">
                <StudyObjectiveTab analysis={currentPaper.analysis} />
              </TabsContent>
              <TabsContent value="summary">
                <SummaryTab analysis={currentPaper.analysis} />
              </TabsContent>
              <TabsContent value="findings">
                <FindingsTab analysis={currentPaper.analysis} />
              </TabsContent>
              <TabsContent value="methods">
                <MethodsTab analysis={currentPaper.analysis} />
              </TabsContent>
              <TabsContent value="limitations">
                <LimitationsTab analysis={currentPaper.analysis} />
              </TabsContent>
              <TabsContent value="glossary">
                <GlossaryTab analysis={currentPaper.analysis} />
              </TabsContent>
              <TabsContent value="references">
                <CitationTab analysis={currentPaper.analysis} />
              </TabsContent>
              <TabsContent value="ask">
                <AskTab analysis={currentPaper.analysis} />
              </TabsContent>
              <TabsContent value="notes">
                <NotesTab
                  paperId={currentPaper.id}
                  notes={notes}
                  onAddNote={addNote}
                  onUpdateNote={updateNote}
                  onDeleteNote={deleteNote}
                />
              </TabsContent>
            </Tabs>
          </div>
        ) : null}
      </main>
    </div>
  );
}
