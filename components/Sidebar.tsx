'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import {
  Search, LogOut, FileText, Sun, Moon, Pencil, Trash2, Check, X,
  ChevronDown, ChevronRight, FolderOpen, FolderPlus, Folder, GripVertical, Sparkles, Settings, Info,
  Globe, Library, ShieldCheck,
} from 'lucide-react';
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  closestCenter,
  useDroppable,
  type DragStartEvent,
  type DragOverEvent,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
  arrayMove,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Logo } from '@/components/Logo';
import type { User } from '@supabase/supabase-js';
import { Paper, Folder as FolderType } from '@/lib/types';
import { useTheme } from '@/components/ThemeProvider';

export type SidebarView = 'digest' | 'search' | 'library';

interface SidebarProps {
  user: User;
  papers: Paper[];
  folders: FolderType[];
  currentPaperId: string | null;
  activeView: SidebarView;
  onChangeView: (view: SidebarView) => void;
  loading: boolean;
  isPro: boolean;
  paperCount: number;
  paperLimit: number | null;
  onSelectPaper: (paper: Paper) => void;
  onSignOut: () => void;
  onRenamePaper: (paperId: string, newName: string) => Promise<void>;
  onDeletePaper: (paperId: string) => Promise<void>;
  onCreateFolder: (name: string) => Promise<FolderType | null>;
  onRenameFolder: (folderId: string, newName: string) => Promise<void>;
  onDeleteFolder: (folderId: string) => Promise<void>;
  onMoveToFolder: (paperId: string, folderId: string | null) => Promise<void>;
  onUpgrade: () => void;
  onOpenSettings: () => void;
  onOpenAbout: () => void;
  mobileOpen?: boolean;
  onMobileClose?: () => void;
}

function timeAgo(ts: number): string {
  const diff = Date.now() - ts;
  const days = Math.floor(diff / 86_400_000);
  if (days === 0) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days}d ago`;
  return new Date(ts).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
}

function getPaperDisplayName(paper: Paper): string {
  return paper.customName || paper.filename.replace(/\.pdf$/i, '');
}

function InlineInput({
  initialValue,
  placeholder,
  onSave,
  onCancel,
  className = '',
}: {
  initialValue: string;
  placeholder?: string;
  onSave: (val: string) => void;
  onCancel: () => void;
  className?: string;
}) {
  const [value, setValue] = useState(initialValue);
  const ref = useRef<HTMLInputElement>(null);
  const committed = useRef(false);

  useEffect(() => {
    ref.current?.focus();
    if (initialValue) ref.current?.select();
  }, [initialValue]);

  const commit = () => {
    if (committed.current) return;
    committed.current = true;
    const trimmed = value.trim();
    if (trimmed) onSave(trimmed);
    else onCancel();
  };

  return (
    <input
      ref={ref}
      value={value}
      placeholder={placeholder}
      onChange={(e) => setValue(e.target.value)}
      onKeyDown={(e) => {
        if (e.key === 'Enter') { e.preventDefault(); commit(); }
        if (e.key === 'Escape') { e.preventDefault(); onCancel(); }
      }}
      onBlur={commit}
      onClick={(e) => e.stopPropagation()}
      className={`bg-white/10 text-white text-xs font-medium px-1.5 py-0.5 rounded outline-none ring-1 ring-blue-400/60 ${className}`}
    />
  );
}

function DroppableFolderHeader({ folderId, isOver, children }: { folderId: string; isOver: boolean; children: React.ReactNode }) {
  const { setNodeRef } = useDroppable({ id: `folder-drop-${folderId}` });
  return (
    <div
      ref={setNodeRef}
      className={`rounded-xl transition-all duration-150 ${isOver ? 'bg-blue-500/10 ring-1 ring-inset ring-blue-500/30' : ''}`}
    >
      {children}
    </div>
  );
}

function DroppableUncategorized({ isOver, children }: { isOver: boolean; children: React.ReactNode }) {
  const { setNodeRef } = useDroppable({ id: 'uncategorized' });
  return (
    <div
      ref={setNodeRef}
      className={`rounded-xl transition-all duration-150 ${isOver ? 'bg-slate-800/40 ring-1 ring-inset ring-white/10' : ''}`}
    >
      {children}
    </div>
  );
}

function SortablePaperWrapper({
  paperId,
  children,
}: {
  paperId: string;
  children: (props: { isDragging: boolean; handleProps: React.HTMLAttributes<HTMLElement> }) => React.ReactNode;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: paperId });
  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.35 : 1 }}
    >
      {children({ isDragging, handleProps: { ...attributes, ...listeners } })}
    </div>
  );
}

export function Sidebar({
  user,
  papers,
  folders,
  currentPaperId,
  activeView,
  onChangeView,
  loading,
  isPro,
  paperCount,
  paperLimit,
  onSelectPaper,
  onSignOut,
  onRenamePaper,
  onDeletePaper,
  onCreateFolder,
  onRenameFolder,
  onDeleteFolder,
  onMoveToFolder,
  onUpgrade,
  onOpenSettings,
  onOpenAbout,
  mobileOpen = false,
  onMobileClose,
}: SidebarProps) {
  const [search, setSearch] = useState('');
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [moveMenuPaperId, setMoveMenuPaperId] = useState<string | null>(null);
  const [collapsedFolders, setCollapsedFolders] = useState<Set<string>>(new Set());
  const [renamingFolderId, setRenamingFolderId] = useState<string | null>(null);
  const [confirmDeleteFolderId, setConfirmDeleteFolderId] = useState<string | null>(null);
  const [deletingFolderId, setDeletingFolderId] = useState<string | null>(null);
  const [creatingFolder, setCreatingFolder] = useState(false);

  const [paperOrder, setPaperOrder] = useState<string[]>(() => {
    if (typeof window === 'undefined') return [];
    try {
      const saved = localStorage.getItem(`scigestible_paper_order_${user.id}`);
      return saved ? JSON.parse(saved) : [];
    } catch { return []; }
  });
  const [activeDragId, setActiveDragId] = useState<string | null>(null);
  const [dragOverFolderId, setDragOverFolderId] = useState<string | null>(null);

  const { theme, toggle } = useTheme();

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 5 } })
  );

  const filtered = papers.filter((p) =>
    getPaperDisplayName(p).toLowerCase().includes(search.toLowerCase())
  );

  const updateOrder = useCallback((newOrder: string[]) => {
    setPaperOrder(newOrder);
    try {
      localStorage.setItem(`scigestible_paper_order_${user.id}`, JSON.stringify(newOrder));
    } catch {}
  }, [user.id]);

  const getSortedPapers = useCallback((papersToSort: Paper[]) => {
    if (paperOrder.length === 0) return papersToSort;
    const orderMap = new Map(paperOrder.map((id, idx) => [id, idx]));
    const ordered = papersToSort
      .filter((p) => orderMap.has(p.id))
      .sort((a, b) => orderMap.get(a.id)! - orderMap.get(b.id)!);
    const unordered = papersToSort
      .filter((p) => !orderMap.has(p.id))
      .sort((a, b) => b.uploadedAt - a.uploadedAt);
    return [...unordered, ...ordered];
  }, [paperOrder]);

  const handleDragStart = (event: DragStartEvent) => {
    setActiveDragId(String(event.active.id));
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { over } = event;
    if (!over) { setDragOverFolderId(null); return; }
    const overId = String(over.id);
    if (overId.startsWith('folder-drop-')) {
      setDragOverFolderId(overId.slice('folder-drop-'.length));
    } else if (overId === 'uncategorized') {
      setDragOverFolderId('uncategorized');
    } else {
      const overPaper = papers.find((p) => p.id === overId);
      setDragOverFolderId(overPaper ? (overPaper.folderId ?? 'uncategorized') : null);
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveDragId(null);
    setDragOverFolderId(null);
    if (!over) return;

    const activeId = String(active.id);
    const overId = String(over.id);
    const activePaper = papers.find((p) => p.id === activeId);
    if (!activePaper) return;

    if (overId.startsWith('folder-drop-')) {
      const targetFolderId = overId.slice('folder-drop-'.length);
      if (activePaper.folderId !== targetFolderId) {
        onMoveToFolder(activeId, targetFolderId);
      }
      return;
    }

    if (overId === 'uncategorized') {
      if (activePaper.folderId) onMoveToFolder(activeId, null);
      return;
    }

    if (activeId === overId) return;
    const overPaper = papers.find((p) => p.id === overId);
    if (!overPaper) return;

    if (activePaper.folderId !== overPaper.folderId) {
      onMoveToFolder(activeId, overPaper.folderId ?? null);
    }

    const baseOrder = paperOrder.length > 0 ? paperOrder : papers.map((p) => p.id);
    const oldIdx = baseOrder.indexOf(activeId);
    const newIdx = baseOrder.indexOf(overId);
    if (oldIdx !== -1 && newIdx !== -1 && oldIdx !== newIdx) {
      updateOrder(arrayMove(baseOrder, oldIdx, newIdx));
    }
  };

  const activePaper = activeDragId ? papers.find((p) => p.id === activeDragId) : null;

  const handleRename = async (paperId: string, newName: string) => {
    setRenamingId(null);
    await onRenamePaper(paperId, newName);
  };

  const handleDelete = async (paperId: string) => {
    setDeletingId(paperId);
    setConfirmDeleteId(null);
    await onDeletePaper(paperId);
    setDeletingId(null);
  };

  const handleDeleteFolder = async (folderId: string) => {
    setDeletingFolderId(folderId);
    setConfirmDeleteFolderId(null);
    await onDeleteFolder(folderId);
    setDeletingFolderId(null);
  };

  const toggleCollapse = (folderId: string) => {
    setCollapsedFolders((prev) => {
      const next = new Set(prev);
      if (next.has(folderId)) next.delete(folderId);
      else next.add(folderId);
      return next;
    });
  };

  const renderPaperContent = (paper: Paper, handleProps?: React.HTMLAttributes<HTMLElement>) => {
    const active = paper.id === currentPaperId;
    const isRenaming = renamingId === paper.id;
    const isConfirmingDelete = confirmDeleteId === paper.id;
    const isDeleting = deletingId === paper.id;
    const isMoveOpen = moveMenuPaperId === paper.id;

    return (
      <div>
        <div
          role="button"
          tabIndex={0}
          onClick={() => {
            if (isRenaming || isConfirmingDelete || isMoveOpen) return;
            onSelectPaper(paper);
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !isRenaming && !isConfirmingDelete) onSelectPaper(paper);
          }}
          className={`w-full text-left rounded-xl px-3 py-2.5 transition-all duration-150 group cursor-pointer ${
            active
              ? 'bg-white/[0.08] text-slate-100'
              : 'text-slate-500 hover:bg-white/[0.05] hover:text-slate-300'
          } ${isDeleting ? 'opacity-40 pointer-events-none' : ''}`}
        >
          <div className="flex items-start gap-2">
            {handleProps && (
              <span
                {...handleProps}
                onClick={(e) => e.stopPropagation()}
                className="opacity-0 group-hover:opacity-100 cursor-grab active:cursor-grabbing self-center flex-shrink-0 text-slate-600 hover:text-slate-400 touch-none -ml-0.5"
              >
                <GripVertical size={12} />
              </span>
            )}
            <FileText
              size={12}
              className={`mt-0.5 flex-shrink-0 ${active ? 'text-slate-500' : 'text-slate-600 group-hover:text-slate-500'}`}
            />
            <div className="min-w-0 flex-1">
              {isRenaming ? (
                <InlineInput
                  initialValue={getPaperDisplayName(paper)}
                  onSave={(name) => handleRename(paper.id, name)}
                  onCancel={() => setRenamingId(null)}
                  className="w-full min-w-0"
                />
              ) : (
                <p className="text-xs font-medium truncate leading-snug">
                  {getPaperDisplayName(paper)}
                </p>
              )}
              <p className={`text-xs mt-0.5 flex items-center gap-1.5 ${active ? 'text-slate-500' : 'text-slate-600'}`}>
                {timeAgo(paper.uploadedAt)}
                {!paper.analysis && (
                  <span className="inline-flex items-center gap-0.5 text-amber-500/90">
                    <span className="w-1 h-1 rounded-full bg-amber-500/90" />
                    Not digested
                  </span>
                )}
              </p>
            </div>
            {!isRenaming && (
              <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                <button
                  onClick={(e) => { e.stopPropagation(); setRenamingId(paper.id); setConfirmDeleteId(null); setMoveMenuPaperId(null); }}
                  title="Rename"
                  className={`p-1 rounded ${active ? 'text-slate-400 hover:text-white hover:bg-white/10' : 'text-slate-600 hover:text-slate-300 hover:bg-white/5'}`}
                >
                  <Pencil size={10} />
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); setMoveMenuPaperId(isMoveOpen ? null : paper.id); setConfirmDeleteId(null); setRenamingId(null); }}
                  title="Move to folder"
                  className={`p-1 rounded ${active ? 'text-slate-400 hover:text-white hover:bg-white/10' : 'text-slate-600 hover:text-slate-300 hover:bg-white/5'}`}
                >
                  <FolderOpen size={10} />
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); setConfirmDeleteId(paper.id); setRenamingId(null); setMoveMenuPaperId(null); }}
                  title="Delete"
                  className={`p-1 rounded ${active ? 'text-slate-400 hover:text-red-300 hover:bg-red-500/10' : 'text-slate-600 hover:text-red-400 hover:bg-red-500/10'}`}
                >
                  <Trash2 size={10} />
                </button>
              </div>
            )}
          </div>
        </div>

        {isMoveOpen && (
          <div className="mx-1 mb-1 px-2 py-1.5 bg-[#13131f] border border-white/[0.07] rounded-xl">
            <p className="text-xs text-slate-500 mb-1 px-1">Move to folder</p>
            {folders.map((f) => (
              <button
                key={f.id}
                onClick={() => { onMoveToFolder(paper.id, f.id); setMoveMenuPaperId(null); }}
                className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs transition-colors ${
                  paper.folderId === f.id
                    ? 'text-blue-400 bg-blue-500/10'
                    : 'text-slate-400 hover:bg-white/[0.06]'
                }`}
              >
                <Folder size={10} className="flex-shrink-0" />
                <span className="truncate">{f.name}</span>
                {paper.folderId === f.id && <Check size={10} className="ml-auto flex-shrink-0" />}
              </button>
            ))}
            {paper.folderId && (
              <button
                onClick={() => { onMoveToFolder(paper.id, null); setMoveMenuPaperId(null); }}
                className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs text-slate-500 hover:bg-white/[0.06] transition-all duration-150 mt-0.5"
              >
                <X size={10} className="flex-shrink-0" />
                Remove from folder
              </button>
            )}
            {folders.length === 0 && (
              <p className="text-xs text-slate-600 px-1 py-1">No folders yet — create one below.</p>
            )}
          </div>
        )}

        {isConfirmingDelete && (
          <div className="mx-1 mb-1 px-3 py-2 bg-red-950/60 border border-red-800/50 rounded-xl flex items-center justify-between gap-2">
            <p className="text-xs text-red-300">Delete this paper?</p>
            <div className="flex items-center gap-1 flex-shrink-0">
              <button
                onClick={() => handleDelete(paper.id)}
                className="p-1 rounded text-red-300 hover:text-white hover:bg-red-700 transition-colors"
                title="Confirm delete"
              >
                <Check size={12} />
              </button>
              <button
                onClick={() => setConfirmDeleteId(null)}
                className="p-1 rounded text-slate-400 hover:text-slate-200 hover:bg-slate-700 transition-colors"
                title="Cancel"
              >
                <X size={12} />
              </button>
            </div>
          </div>
        )}
      </div>
    );
  };

  const showFlat = search.length > 0;

  return (
    <>
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/70 backdrop-blur-sm z-40 md:hidden"
          onClick={onMobileClose}
        />
      )}
      <div className={`w-64 flex-shrink-0 flex flex-col h-screen overflow-hidden bg-slate-950 border-r border-white/[0.06] fixed inset-y-0 left-0 z-50 transition-transform duration-300 ease-in-out md:relative md:translate-x-0 ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}`}>

        <div className="px-4 pt-5 pb-4 flex items-center justify-between">
          <Logo wordmarkClass="text-white" />
          <button
            onClick={onMobileClose}
            className="md:hidden p-1.5 rounded-lg text-slate-500 hover:text-slate-300 hover:bg-white/5 transition-all duration-150"
          >
            <X size={16} />
          </button>
        </div>

        {/* View tabs */}
        <div className="px-3 pb-3">
          <div className="grid grid-cols-3 gap-1 p-1 bg-white/[0.04] border border-white/[0.06] rounded-xl">
            {([
              { view: 'digest' as const, label: 'Digest', icon: <Sparkles size={13} /> },
              { view: 'search' as const, label: 'Search', icon: <Globe size={13} /> },
              { view: 'library' as const, label: 'Library', icon: <Library size={13} /> },
            ]).map(({ view, label, icon }) => (
              <button
                key={view}
                onClick={() => onChangeView(view)}
                className={`flex flex-col items-center justify-center gap-1 py-2 rounded-lg text-[11px] font-medium transition-all duration-150 ${
                  activeView === view
                    ? 'bg-gradient-to-r from-blue-500 to-violet-500 text-white shadow-sm shadow-violet-500/20'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.05]'
                }`}
              >
                {icon}
                {label}
              </button>
            ))}
          </div>
        </div>

        {activeView === 'library' ? (
        <>
        <div className="px-3 pb-3">
          <div className="relative">
            <Search
              size={13}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none"
            />
            <input
              type="text"
              placeholder="Search papers..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-white/[0.05] text-slate-200 text-sm pl-8 pr-3 py-2 rounded-xl placeholder-slate-600 border border-white/[0.07] focus:outline-none focus:border-blue-500/40 focus:ring-1 focus:ring-blue-500/20 transition-all duration-150"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-2 pb-2">
          {loading ? (
            <div className="space-y-1 px-1 pt-1">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-white/[0.05] rounded-xl p-3 animate-pulse">
                  <div className="h-2.5 bg-white/[0.07] rounded w-4/5 mb-2" />
                  <div className="h-2 bg-white/[0.07] rounded w-1/3" />
                </div>
              ))}
            </div>
          ) : showFlat ? (
            <div className="space-y-0.5">
              {filtered.length === 0 ? (
                <p className="text-center text-slate-600 text-xs py-10 px-4 leading-relaxed">
                  No results for &ldquo;{search}&rdquo;
                </p>
              ) : (
                filtered.map((paper) => <div key={paper.id}>{renderPaperContent(paper)}</div>)
              )}
            </div>
          ) : papers.length === 0 ? (
            <p className="text-center text-slate-600 text-xs py-10 px-4 leading-relaxed">
              No papers yet — upload your first!
            </p>
          ) : (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragStart={handleDragStart}
              onDragOver={handleDragOver}
              onDragEnd={handleDragEnd}
            >
              <div className="space-y-1">
                {folders.map((folder) => {
                  const folderPapers = getSortedPapers(papers.filter((p) => p.folderId === folder.id));
                  const isCollapsed = collapsedFolders.has(folder.id);
                  const isRenamingFolder = renamingFolderId === folder.id;
                  const isConfirmingDeleteFolder = confirmDeleteFolderId === folder.id;
                  const isDeletingFolder = deletingFolderId === folder.id;

                  return (
                    <div key={folder.id} className={isDeletingFolder ? 'opacity-40 pointer-events-none' : ''}>
                      <DroppableFolderHeader folderId={folder.id} isOver={dragOverFolderId === folder.id}>
                        <div className="flex items-center gap-1 px-2 py-1 group/folder">
                          <button
                            onClick={() => toggleCollapse(folder.id)}
                            className="text-slate-600 hover:text-slate-400 transition-colors flex-shrink-0"
                          >
                            {isCollapsed ? <ChevronRight size={12} /> : <ChevronDown size={12} />}
                          </button>
                          {isRenamingFolder ? (
                            <InlineInput
                              initialValue={folder.name}
                              onSave={(name) => { setRenamingFolderId(null); onRenameFolder(folder.id, name); }}
                              onCancel={() => setRenamingFolderId(null)}
                              className="flex-1 min-w-0"
                            />
                          ) : (
                            <>
                              <span className="text-xs font-medium text-slate-400 truncate flex-1 min-w-0">
                                {folder.name}
                              </span>
                              <span className="text-xs text-slate-600 flex-shrink-0">{folderPapers.length}</span>
                              <div className="flex items-center gap-0.5 opacity-0 group-hover/folder:opacity-100 transition-opacity flex-shrink-0 ml-0.5">
                                <button
                                  onClick={() => { setRenamingFolderId(folder.id); setConfirmDeleteFolderId(null); }}
                                  title="Rename folder"
                                  className="p-1 rounded text-slate-600 hover:text-slate-300 hover:bg-white/5 transition-all duration-150"
                                >
                                  <Pencil size={10} />
                                </button>
                                <button
                                  onClick={() => { setConfirmDeleteFolderId(folder.id); setRenamingFolderId(null); }}
                                  title="Delete folder"
                                  className="p-1 rounded text-slate-600 hover:text-red-400 hover:bg-red-500/10 transition-all duration-150"
                                >
                                  <Trash2 size={10} />
                                </button>
                              </div>
                            </>
                          )}
                        </div>
                      </DroppableFolderHeader>

                      {isConfirmingDeleteFolder && (
                        <div className="mx-1 mb-1 px-3 py-2 bg-red-950/60 border border-red-800/50 rounded-xl flex items-center justify-between gap-2">
                          <p className="text-xs text-red-300 leading-tight">Delete folder? Papers stay.</p>
                          <div className="flex items-center gap-1 flex-shrink-0">
                            <button
                              onClick={() => handleDeleteFolder(folder.id)}
                              className="p-1 rounded text-red-300 hover:text-white hover:bg-red-700 transition-colors"
                              title="Confirm"
                            >
                              <Check size={12} />
                            </button>
                            <button
                              onClick={() => setConfirmDeleteFolderId(null)}
                              className="p-1 rounded text-slate-400 hover:text-slate-200 hover:bg-slate-700 transition-colors"
                              title="Cancel"
                            >
                              <X size={12} />
                            </button>
                          </div>
                        </div>
                      )}

                      {!isCollapsed && (
                        <div className="ml-3 space-y-0.5 border-l border-white/[0.06] pl-1">
                          {folderPapers.length === 0 ? (
                            <p className="text-xs text-slate-700 px-3 py-2">Empty folder</p>
                          ) : (
                            <SortableContext items={folderPapers.map((p) => p.id)} strategy={verticalListSortingStrategy}>
                              {folderPapers.map((paper) => (
                                <SortablePaperWrapper key={paper.id} paperId={paper.id}>
                                  {({ handleProps }) => renderPaperContent(paper, handleProps)}
                                </SortablePaperWrapper>
                              ))}
                            </SortableContext>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}

                {(() => {
                  const uncategorized = getSortedPapers(papers.filter((p) => !p.folderId));
                  if (uncategorized.length === 0) return null;
                  return (
                    <DroppableUncategorized isOver={dragOverFolderId === 'uncategorized'}>
                      <div>
                        {folders.length > 0 && (
                          <p className="px-3 pt-2 pb-1 text-xs font-medium text-slate-600 uppercase tracking-wider">
                            Uncategorized
                          </p>
                        )}
                        <SortableContext items={uncategorized.map((p) => p.id)} strategy={verticalListSortingStrategy}>
                          <div className="space-y-0.5">
                            {uncategorized.map((paper) => (
                              <SortablePaperWrapper key={paper.id} paperId={paper.id}>
                                {({ handleProps }) => renderPaperContent(paper, handleProps)}
                              </SortablePaperWrapper>
                            ))}
                          </div>
                        </SortableContext>
                      </div>
                    </DroppableUncategorized>
                  );
                })()}
              </div>

              <DragOverlay dropAnimation={null}>
                {activePaper && (
                  <div className="w-56 bg-slate-900 border border-white/20 rounded-xl px-3 py-2.5 shadow-2xl cursor-grabbing">
                    <div className="flex items-start gap-2.5">
                      <GripVertical size={12} className="mt-0.5 flex-shrink-0 text-slate-600" />
                      <FileText size={12} className="mt-0.5 flex-shrink-0 text-slate-500" />
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-medium truncate leading-snug text-slate-200">
                          {getPaperDisplayName(activePaper)}
                        </p>
                        <p className="text-xs mt-0.5 text-slate-500">{timeAgo(activePaper.uploadedAt)}</p>
                      </div>
                    </div>
                  </div>
                )}
              </DragOverlay>
            </DndContext>
          )}
        </div>

        <div className="px-3 pb-2">
          {creatingFolder ? (
            <div className="flex items-center gap-2 px-3 py-2 bg-white/[0.05] rounded-xl border border-white/[0.07]">
              <FolderPlus size={12} className="text-slate-500 flex-shrink-0" />
              <InlineInput
                initialValue=""
                placeholder="Folder name…"
                onSave={async (name) => { setCreatingFolder(false); await onCreateFolder(name); }}
                onCancel={() => setCreatingFolder(false)}
                className="flex-1 min-w-0"
              />
            </div>
          ) : (
            <button
              onClick={() => setCreatingFolder(true)}
              className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-slate-600 hover:text-slate-400 hover:bg-white/5 transition-all duration-150 text-xs"
            >
              <FolderPlus size={13} className="flex-shrink-0" />
              New folder
            </button>
          )}
        </div>
        </>
        ) : (
          <div className="flex-1 overflow-y-auto px-5 py-8 flex flex-col items-center text-center">
            <div className="w-12 h-12 rounded-2xl bg-white/[0.05] flex items-center justify-center mb-4">
              {activeView === 'digest' ? <Sparkles size={20} className="text-blue-400" /> : <Globe size={20} className="text-blue-400" />}
            </div>
            <p className="text-sm font-medium text-slate-300 mb-1.5">
              {activeView === 'digest' ? 'Digest a paper' : 'Find papers online'}
            </p>
            <p className="text-xs text-slate-500 leading-relaxed mb-5">
              {activeView === 'digest'
                ? 'Upload a PDF in the main panel to instantly digest (summarise) it into key findings, methods, and a glossary.'
                : 'Search millions of research papers across 10 free databases in the main panel. Save the ones you want, then digest them whenever you like.'}
            </p>
            <button
              onClick={() => onChangeView('library')}
              className="flex items-center gap-2 text-xs font-medium text-slate-400 hover:text-slate-200 hover:bg-white/[0.05] px-3 py-2 rounded-xl transition-all duration-150"
            >
              <Library size={13} />
              View your library ({papers.length})
            </button>
          </div>
        )}

        <div className="px-3 py-3 border-t border-white/[0.06] space-y-2">
          {/* Paper count indicator */}
          {paperLimit !== null && (
            <div className="px-3 py-2 rounded-xl bg-white/[0.04] space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-500">Papers</span>
                <span className={`text-xs font-medium tabular-nums ${
                  paperCount >= paperLimit ? 'text-red-400' : 'text-slate-400'
                }`}>
                  {paperCount}/{paperLimit}
                </span>
              </div>
              <div className="h-1 rounded-full bg-white/[0.07] overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-300 ${
                    paperCount >= paperLimit
                      ? 'bg-red-500'
                      : paperCount >= paperLimit * 0.8
                      ? 'bg-amber-500'
                      : 'bg-blue-500'
                  }`}
                  style={{ width: `${Math.min((paperCount / paperLimit) * 100, 100)}%` }}
                />
              </div>
            </div>
          )}

          {/* Upgrade to Pro button for free users */}
          {!isPro && (
            <button
              onClick={onUpgrade}
              className="w-full flex items-center gap-2 px-3 py-2 rounded-xl bg-gradient-to-r from-blue-500/10 to-violet-500/10 border border-blue-500/20 text-blue-400 hover:text-blue-300 hover:border-blue-400/30 transition-all duration-150 text-xs font-medium"
            >
              <Sparkles size={13} className="flex-shrink-0" />
              <span className="flex-1 text-left">Upgrade to Pro</span>
              <span className="text-blue-500/70">£5/mo</span>
            </button>
          )}

          {isPro && (
            <div className="flex items-center gap-2 px-3 py-1.5">
              <Sparkles size={12} className="text-violet-400 flex-shrink-0" />
              <span className="text-xs text-violet-400 font-medium">Pro plan</span>
            </div>
          )}

          <button
            onClick={toggle}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-slate-500 hover:text-slate-300 hover:bg-white/5 transition-all duration-150 text-xs font-medium"
          >
            {theme === 'dark' ? (
              <>
                <Sun size={14} className="flex-shrink-0" />
                <span>Light mode</span>
              </>
            ) : (
              <>
                <Moon size={14} className="flex-shrink-0" />
                <span>Dark mode</span>
              </>
            )}
          </button>

          <button
            onClick={onOpenAbout}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-slate-500 hover:text-slate-300 hover:bg-white/5 transition-all duration-150 text-xs font-medium"
          >
            <Info size={14} className="flex-shrink-0" />
            <span>About Scigestible</span>
          </button>

          <a
            href="/privacy"
            target="_blank"
            rel="noopener noreferrer"
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-slate-500 hover:text-slate-300 hover:bg-white/5 transition-all duration-150 text-xs font-medium"
          >
            <ShieldCheck size={14} className="flex-shrink-0" />
            <span>Privacy Policy</span>
          </a>

          <a
            href="/terms"
            target="_blank"
            rel="noopener noreferrer"
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-slate-500 hover:text-slate-300 hover:bg-white/5 transition-all duration-150 text-xs font-medium"
          >
            <ShieldCheck size={14} className="flex-shrink-0" />
            <span>Terms of Service</span>
          </a>

          <div className="flex items-center gap-2 px-1">
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center flex-shrink-0">
              <span className="text-xs font-semibold text-white">
                {user.email?.[0]?.toUpperCase() ?? '?'}
              </span>
            </div>
            <p className="text-xs text-slate-500 truncate flex-1 min-w-0">{user.email}</p>
            <button
              onClick={onOpenSettings}
              title="Settings"
              className="flex-shrink-0 p-1.5 text-slate-600 hover:text-slate-300 hover:bg-white/5 rounded-lg transition-all duration-150"
            >
              <Settings size={13} />
            </button>
            <button
              onClick={onSignOut}
              title="Sign out"
              className="flex-shrink-0 p-1.5 text-slate-600 hover:text-slate-300 hover:bg-white/5 rounded-lg transition-all duration-150"
            >
              <LogOut size={13} />
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
