'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useState } from 'react';
import type { User } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase';
import { AuthPage } from '@/components/AuthPage';
import { Sidebar } from '@/components/Sidebar';
import { PDFUpload } from '@/components/PDFUpload';
import { PDFViewer } from '@/components/PDFViewer';
import { ExportMenu } from '@/components/ExportMenu';
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
import { Paper, Folder } from '@/lib/types';
import { AlertCircle, Loader, Upload, PanelLeft, Menu } from 'lucide-react';

export default function Home() {
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [papers, setPapers] = useState<Paper[]>([]);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [papersLoading, setPapersLoading] = useState(false);
  const [showUpload, setShowUpload] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analyzeError, setAnalyzeError] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [pdfPanelOpen, setPdfPanelOpen] = useState(false);
  const [pdfUrlLoading, setPdfUrlLoading] = useState(false);
  const [sidebarMobileOpen, setSidebarMobileOpen] = useState(false);

  const { currentPaper, setCurrentPaper, notes, addNote, updateNote, deleteNote, loadNotesForPaper } =
    useAppStore();

  const supabase = createClient();

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
      setAuthLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!user) {
      setPapers([]);
      setCurrentPaper(null);
      return;
    }

    setPapersLoading(true);
    Promise.all([
      supabase.from('papers').select('*').order('uploaded_at', { ascending: false }),
      supabase.from('folders').select('*').order('created_at', { ascending: true }),
    ]).then(([{ data: papersData }, { data: foldersData }]) => {
      if (foldersData) {
        setFolders(foldersData.map((row) => ({
          id: row.id,
          name: row.name,
          createdAt: new Date(row.created_at).getTime(),
        })));
      }
      if (papersData) {
        const mapped: Paper[] = papersData.map((row) => ({
          id: row.id,
          filename: row.filename,
          customName: row.custom_name ?? undefined,
          pdfPath: row.pdf_path ?? undefined,
          folderId: row.folder_id ?? undefined,
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
    setFolders([]);
    setShowUpload(false);
  };

  const handleSelectPaper = (paper: Paper) => {
    setCurrentPaper(paper);
    setShowUpload(false);
    setAnalyzeError(null);
    loadNotesForPaper(paper.id);
    setPdfPanelOpen(false);
    setSidebarMobileOpen(false);
  };

  const handleNewPaper = () => {
    setShowUpload(true);
    setCurrentPaper(null);
    setAnalyzeError(null);
    setSelectedFile(null);
    setPdfPanelOpen(false);
    setSidebarMobileOpen(false);
  };

  const handleRenamePaper = async (paperId: string, newName: string) => {
    await fetch(`/api/papers/${paperId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ customName: newName }),
    });
    setPapers((prev) =>
      prev.map((p) => (p.id === paperId ? { ...p, customName: newName } : p))
    );
    if (currentPaper?.id === paperId) {
      setCurrentPaper({ ...currentPaper, customName: newName });
    }
  };

  const handleDeletePaper = async (paperId: string) => {
    await fetch(`/api/papers/${paperId}`, { method: 'DELETE' });
    setPapers((prev) => prev.filter((p) => p.id !== paperId));
    if (currentPaper?.id === paperId) {
      const remaining = papers.filter((p) => p.id !== paperId);
      if (remaining.length > 0) {
        setCurrentPaper(remaining[0]);
        loadNotesForPaper(remaining[0].id);
      } else {
        setCurrentPaper(null);
        setShowUpload(true);
      }
      setPdfPanelOpen(false);
    }
  };

  const handleCreateFolder = async (name: string): Promise<Folder | null> => {
    const res = await fetch('/api/folders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name }),
    });
    if (!res.ok) return null;
    const row = await res.json();
    const folder: Folder = { id: row.id, name: row.name, createdAt: new Date(row.created_at).getTime() };
    setFolders((prev) => [...prev, folder]);
    return folder;
  };

  const handleRenameFolder = async (folderId: string, newName: string) => {
    await fetch(`/api/folders/${folderId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newName }),
    });
    setFolders((prev) => prev.map((f) => (f.id === folderId ? { ...f, name: newName } : f)));
  };

  const handleDeleteFolder = async (folderId: string) => {
    await fetch(`/api/folders/${folderId}`, { method: 'DELETE' });
    setFolders((prev) => prev.filter((f) => f.id !== folderId));
    // Papers in the folder become uncategorized in local state
    setPapers((prev) => prev.map((p) => (p.folderId === folderId ? { ...p, folderId: undefined } : p)));
    if (currentPaper?.folderId === folderId) {
      setCurrentPaper({ ...currentPaper, folderId: undefined });
    }
  };

  const handleMoveToFolder = async (paperId: string, folderId: string | null) => {
    await fetch(`/api/papers/${paperId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ folderId }),
    });
    const updated = folderId ?? undefined;
    setPapers((prev) => prev.map((p) => (p.id === paperId ? { ...p, folderId: updated } : p)));
    if (currentPaper?.id === paperId) {
      setCurrentPaper({ ...currentPaper, folderId: updated });
    }
  };

  const handleTogglePdfPanel = async () => {
    if (!currentPaper) return;

    if (pdfPanelOpen) {
      setPdfPanelOpen(false);
      return;
    }

    // Already have a URL cached
    if (currentPaper.pdfUrl) {
      setPdfPanelOpen(true);
      return;
    }

    // No PDF stored for this paper
    if (!currentPaper.pdfPath) {
      setPdfPanelOpen(true);
      return;
    }

    // Fetch signed URL
    setPdfUrlLoading(true);
    setPdfPanelOpen(true);
    const { data } = await supabase.storage
      .from('paper-pdfs')
      .createSignedUrl(currentPaper.pdfPath, 3600);

    if (data?.signedUrl) {
      const updated = { ...currentPaper, pdfUrl: data.signedUrl };
      setCurrentPaper(updated);
      setPapers((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
    }
    setPdfUrlLoading(false);
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

      // Upload PDF to Supabase Storage (best-effort; don't block analysis on failure)
      let pdfPath: string | undefined;
      if (user) {
        try {
          const path = `${user.id}/${crypto.randomUUID()}.pdf`;
          const { error: uploadError } = await supabase.storage
            .from('paper-pdfs')
            .upload(path, file, { contentType: 'application/pdf' });
          if (!uploadError) pdfPath = path;
        } catch {
          // Storage not set up or upload failed — proceed without PDF
        }
      }

      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paperText: extraction.text, filename: file.name, pdfPath }),
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

  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center">
        <Loader className="animate-spin text-blue-600" size={28} />
      </div>
    );
  }

  if (!user) {
    return <AuthPage />;
  }

  const showingUpload = showUpload || (!currentPaper && !papersLoading);

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-slate-950 overflow-hidden md:flex-row">
      <Sidebar
        user={user}
        papers={papers}
        folders={folders}
        currentPaperId={currentPaper?.id ?? null}
        loading={papersLoading}
        onSelectPaper={handleSelectPaper}
        onNewPaper={handleNewPaper}
        onSignOut={handleSignOut}
        onRenamePaper={handleRenamePaper}
        onDeletePaper={handleDeletePaper}
        onCreateFolder={handleCreateFolder}
        onRenameFolder={handleRenameFolder}
        onDeleteFolder={handleDeleteFolder}
        onMoveToFolder={handleMoveToFolder}
        mobileOpen={sidebarMobileOpen}
        onMobileClose={() => setSidebarMobileOpen(false)}
      />

      <main className="flex-1 overflow-hidden flex flex-col min-w-0">
        {showingUpload ? (
          <div className="flex-1 overflow-y-auto flex flex-col">
            {/* Mobile top-bar */}
            <div className="md:hidden flex items-center gap-3 px-4 py-3 border-b border-slate-200 dark:border-slate-800 flex-shrink-0">
              <button
                onClick={() => setSidebarMobileOpen(true)}
                className="p-2 rounded-lg text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <Menu size={18} />
              </button>
              <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">PaperPilot</span>
            </div>
            <div className="max-w-xl mx-auto px-6 py-10 md:py-16 w-full">
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
          </div>
        ) : currentPaper ? (
          <div className="flex-1 overflow-hidden flex flex-col min-h-0">
            {/* Header */}
            <div className="px-4 md:px-6 pt-4 md:pt-6 pb-4 flex-shrink-0">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-2 min-w-0">
                  {/* Mobile hamburger */}
                  <button
                    onClick={() => setSidebarMobileOpen(true)}
                    className="md:hidden mt-0.5 p-1.5 rounded-lg text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex-shrink-0"
                  >
                    <Menu size={16} />
                  </button>
                  <div className="min-w-0">
                    <h2 className="text-lg md:text-xl font-bold text-slate-900 dark:text-white truncate tracking-tight mb-0">
                      {currentPaper.customName || currentPaper.filename.replace(/\.pdf$/i, '')}
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
                </div>
                <div className="flex items-center gap-1.5 md:gap-2 flex-shrink-0">
                  <button
                    onClick={handleTogglePdfPanel}
                    title={pdfPanelOpen ? 'Close PDF' : 'View PDF'}
                    className={`flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg border transition-colors ${
                      pdfPanelOpen
                        ? 'bg-blue-600 border-blue-600 text-white hover:bg-blue-500'
                        : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-800 dark:hover:text-slate-200'
                    }`}
                  >
                    <PanelLeft size={12} />
                    PDF
                  </button>
                  <ExportMenu paper={currentPaper} />
                </div>
              </div>
            </div>

            {/* Content: optional split with PDF viewer */}
            <div className={`flex-1 overflow-hidden flex gap-3 md:gap-4 px-4 md:px-6 pb-4 md:pb-6 min-h-0 ${pdfPanelOpen ? 'flex-col md:flex-row' : ''}`}>
              {pdfPanelOpen && (
                <div className="h-[42vh] md:h-auto md:w-[42%] flex-shrink-0 flex flex-col min-h-0">
                  <PDFViewer
                    url={currentPaper.pdfUrl ?? null}
                    isLoading={pdfUrlLoading}
                    filename={currentPaper.customName || currentPaper.filename}
                  />
                </div>
              )}

              <div className="flex-1 overflow-y-auto min-w-0 min-h-0">
                <Tabs defaultValue="summary" className="w-full">
                  <TabsList className="w-full justify-start overflow-x-auto scrollbar-none mb-4">
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
            </div>
          </div>
        ) : null}
      </main>
    </div>
  );
}
