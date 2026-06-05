'use client';

import { useState, useRef, useEffect } from 'react';
import {
  Search, Plus, LogOut, FileText, Sun, Moon, Pencil, Trash2, Check, X,
  ChevronDown, ChevronRight, FolderOpen, FolderPlus, Folder,
} from 'lucide-react';
import { Logo } from '@/components/Logo';
import type { User } from '@supabase/supabase-js';
import { Paper, Folder as FolderType } from '@/lib/types';
import { useTheme } from '@/components/ThemeProvider';

interface SidebarProps {
  user: User;
  papers: Paper[];
  folders: FolderType[];
  currentPaperId: string | null;
  loading: boolean;
  onSelectPaper: (paper: Paper) => void;
  onNewPaper: () => void;
  onSignOut: () => void;
  onRenamePaper: (paperId: string, newName: string) => Promise<void>;
  onDeletePaper: (paperId: string) => Promise<void>;
  onCreateFolder: (name: string) => Promise<FolderType | null>;
  onRenameFolder: (folderId: string, newName: string) => Promise<void>;
  onDeleteFolder: (folderId: string) => Promise<void>;
  onMoveToFolder: (paperId: string, folderId: string | null) => Promise<void>;
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
      className={`bg-slate-700 text-white text-xs font-medium px-1.5 py-0.5 rounded outline-none ring-1 ring-blue-400 ${className}`}
    />
  );
}

export function Sidebar({
  user,
  papers,
  folders,
  currentPaperId,
  loading,
  onSelectPaper,
  onNewPaper,
  onSignOut,
  onRenamePaper,
  onDeletePaper,
  onCreateFolder,
  onRenameFolder,
  onDeleteFolder,
  onMoveToFolder,
  mobileOpen = false,
  onMobileClose,
}: SidebarProps) {
  const [search, setSearch] = useState('');
  // Paper actions
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [moveMenuPaperId, setMoveMenuPaperId] = useState<string | null>(null);
  // Folder actions
  const [collapsedFolders, setCollapsedFolders] = useState<Set<string>>(new Set());
  const [renamingFolderId, setRenamingFolderId] = useState<string | null>(null);
  const [confirmDeleteFolderId, setConfirmDeleteFolderId] = useState<string | null>(null);
  const [deletingFolderId, setDeletingFolderId] = useState<string | null>(null);
  const [creatingFolder, setCreatingFolder] = useState(false);

  const { theme, toggle } = useTheme();

  const filtered = papers.filter((p) =>
    getPaperDisplayName(p).toLowerCase().includes(search.toLowerCase())
  );

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

  // Render a single paper row (used both inside folders and in uncategorized)
  const renderPaper = (paper: Paper) => {
    const active = paper.id === currentPaperId;
    const isRenaming = renamingId === paper.id;
    const isConfirmingDelete = confirmDeleteId === paper.id;
    const isDeleting = deletingId === paper.id;
    const isMoveOpen = moveMenuPaperId === paper.id;

    return (
      <div key={paper.id}>
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
          className={`w-full text-left rounded-xl px-3 py-2.5 transition-colors duration-100 group cursor-pointer ${
            active
              ? 'bg-blue-600 text-white'
              : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
          } ${isDeleting ? 'opacity-40 pointer-events-none' : ''}`}
        >
          <div className="flex items-start gap-2.5">
            <FileText
              size={12}
              className={`mt-0.5 flex-shrink-0 ${active ? 'text-blue-200' : 'text-slate-600 group-hover:text-slate-400'}`}
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
              <p className={`text-xs mt-0.5 ${active ? 'text-blue-200' : 'text-slate-600'}`}>
                {timeAgo(paper.uploadedAt)}
              </p>
            </div>
            {!isRenaming && (
              <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                <button
                  onClick={(e) => { e.stopPropagation(); setRenamingId(paper.id); setConfirmDeleteId(null); setMoveMenuPaperId(null); }}
                  title="Rename"
                  className={`p-1 rounded ${active ? 'text-blue-200 hover:bg-blue-500' : 'text-slate-500 hover:text-slate-300 hover:bg-slate-700'}`}
                >
                  <Pencil size={10} />
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); setMoveMenuPaperId(isMoveOpen ? null : paper.id); setConfirmDeleteId(null); setRenamingId(null); }}
                  title="Move to folder"
                  className={`p-1 rounded ${active ? 'text-blue-200 hover:bg-blue-500' : 'text-slate-500 hover:text-slate-300 hover:bg-slate-700'}`}
                >
                  <FolderOpen size={10} />
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); setConfirmDeleteId(paper.id); setRenamingId(null); setMoveMenuPaperId(null); }}
                  title="Delete"
                  className={`p-1 rounded ${active ? 'text-blue-200 hover:bg-blue-500' : 'text-slate-500 hover:text-red-400 hover:bg-slate-700'}`}
                >
                  <Trash2 size={10} />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Move to folder picker */}
        {isMoveOpen && (
          <div className="mx-1 mb-1 px-2 py-1.5 bg-slate-800 border border-slate-700/60 rounded-xl">
            <p className="text-xs text-slate-500 mb-1 px-1">Move to folder</p>
            {folders.map((f) => (
              <button
                key={f.id}
                onClick={() => { onMoveToFolder(paper.id, f.id); setMoveMenuPaperId(null); }}
                className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs transition-colors ${
                  paper.folderId === f.id
                    ? 'text-blue-400 bg-blue-950/40'
                    : 'text-slate-300 hover:bg-slate-700'
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
                className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs text-slate-400 hover:bg-slate-700 transition-colors mt-0.5"
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

        {/* Inline delete confirm */}
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

  // When searching, show a flat list with no folder grouping
  const showFlat = search.length > 0;

  return (
    <>
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-40 md:hidden"
          onClick={onMobileClose}
        />
      )}
      <div className={`w-64 flex-shrink-0 flex flex-col h-screen overflow-hidden bg-slate-900 dark:bg-slate-950 border-r border-slate-800 dark:border-slate-800/80 fixed inset-y-0 left-0 z-50 transition-transform duration-300 ease-in-out md:relative md:translate-x-0 ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}`}>

        {/* Logo */}
        <div className="px-4 pt-5 pb-4 flex items-center justify-between">
          <Logo wordmarkClass="text-white" />
          <button
            onClick={onMobileClose}
            className="md:hidden p-1.5 rounded-lg text-slate-500 hover:text-slate-300 hover:bg-slate-800 transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* New Paper button */}
        <div className="px-3 pb-3">
          <button
            onClick={onNewPaper}
            className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white text-sm font-medium py-2 px-3 rounded-xl transition-colors duration-150 shadow-sm shadow-blue-600/20"
          >
            <Plus size={14} strokeWidth={2.5} />
            New Paper
          </button>
        </div>

        {/* Search */}
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
              className="w-full bg-slate-800 dark:bg-slate-900 text-slate-200 text-sm pl-8 pr-3 py-2 rounded-lg placeholder-slate-600 border border-slate-700/60 focus:outline-none focus:border-blue-500/70 focus:ring-1 focus:ring-blue-500/30 transition-colors"
            />
          </div>
        </div>

        {/* Papers list */}
        <div className="flex-1 overflow-y-auto px-2 pb-2">
          {loading ? (
            <div className="space-y-1 px-1 pt-1">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-slate-800 rounded-xl p-3 animate-pulse">
                  <div className="h-2.5 bg-slate-700 rounded w-4/5 mb-2" />
                  <div className="h-2 bg-slate-700 rounded w-1/3" />
                </div>
              ))}
            </div>
          ) : showFlat ? (
            // Flat search results
            <div className="space-y-0.5">
              {filtered.length === 0 ? (
                <p className="text-center text-slate-600 text-xs py-10 px-4 leading-relaxed">
                  No results for &ldquo;{search}&rdquo;
                </p>
              ) : (
                filtered.map((paper) => renderPaper(paper))
              )}
            </div>
          ) : papers.length === 0 ? (
            <p className="text-center text-slate-600 text-xs py-10 px-4 leading-relaxed">
              No papers yet — upload your first!
            </p>
          ) : (
            // Grouped by folder
            <div className="space-y-1">
              {folders.map((folder) => {
                const folderPapers = papers.filter((p) => p.folderId === folder.id);
                const isCollapsed = collapsedFolders.has(folder.id);
                const isRenamingFolder = renamingFolderId === folder.id;
                const isConfirmingDeleteFolder = confirmDeleteFolderId === folder.id;
                const isDeletingFolder = deletingFolderId === folder.id;

                return (
                  <div key={folder.id} className={isDeletingFolder ? 'opacity-40 pointer-events-none' : ''}>
                    {/* Folder header */}
                    <div className="flex items-center gap-1 px-2 py-1 group/folder">
                      <button
                        onClick={() => toggleCollapse(folder.id)}
                        className="text-slate-500 hover:text-slate-300 transition-colors flex-shrink-0"
                      >
                        {isCollapsed
                          ? <ChevronRight size={12} />
                          : <ChevronDown size={12} />}
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
                              className="p-1 rounded text-slate-600 hover:text-slate-300 hover:bg-slate-700 transition-colors"
                            >
                              <Pencil size={10} />
                            </button>
                            <button
                              onClick={() => { setConfirmDeleteFolderId(folder.id); setRenamingFolderId(null); }}
                              title="Delete folder"
                              className="p-1 rounded text-slate-600 hover:text-red-400 hover:bg-slate-700 transition-colors"
                            >
                              <Trash2 size={10} />
                            </button>
                          </div>
                        </>
                      )}
                    </div>

                    {/* Folder delete confirm */}
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

                    {/* Papers inside folder */}
                    {!isCollapsed && (
                      <div className="ml-3 space-y-0.5 border-l border-slate-800 pl-1">
                        {folderPapers.length === 0 ? (
                          <p className="text-xs text-slate-700 px-3 py-2">Empty folder</p>
                        ) : (
                          folderPapers.map((paper) => renderPaper(paper))
                        )}
                      </div>
                    )}
                  </div>
                );
              })}

              {/* Uncategorized papers */}
              {(() => {
                const uncategorized = papers.filter((p) => !p.folderId);
                if (uncategorized.length === 0) return null;
                return (
                  <div>
                    {folders.length > 0 && (
                      <p className="px-3 pt-2 pb-1 text-xs font-medium text-slate-600 uppercase tracking-wider">
                        Uncategorized
                      </p>
                    )}
                    <div className="space-y-0.5">
                      {uncategorized.map((paper) => renderPaper(paper))}
                    </div>
                  </div>
                );
              })()}
            </div>
          )}
        </div>

        {/* New Folder row */}
        <div className="px-3 pb-2">
          {creatingFolder ? (
            <div className="flex items-center gap-2 px-3 py-2 bg-slate-800 rounded-xl border border-slate-700/60">
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
              className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-slate-600 hover:text-slate-300 hover:bg-slate-800 transition-colors text-xs"
            >
              <FolderPlus size={13} className="flex-shrink-0" />
              New folder
            </button>
          )}
        </div>

        {/* Footer: theme toggle + user + sign out */}
        <div className="px-3 py-3 border-t border-slate-800 space-y-2">
          <button
            onClick={toggle}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors duration-150 text-xs font-medium"
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

          <div className="flex items-center gap-2 px-1">
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center flex-shrink-0">
              <span className="text-xs font-semibold text-white">
                {user.email?.[0]?.toUpperCase() ?? '?'}
              </span>
            </div>
            <p className="text-xs text-slate-500 truncate flex-1 min-w-0">{user.email}</p>
            <button
              onClick={onSignOut}
              title="Sign out"
              className="flex-shrink-0 p-1.5 text-slate-600 hover:text-slate-300 hover:bg-slate-800 rounded-lg transition-colors"
            >
              <LogOut size={13} />
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
