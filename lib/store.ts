import { create } from 'zustand';
import { Paper, Note } from './types';

interface AppState {
  currentPaper: Paper | null;
  notes: Note[];
  isAnalyzing: boolean;
  error: string | null;

  setCurrentPaper: (paper: Paper | null) => void;
  setAnalyzing: (analyzing: boolean) => void;
  setError: (error: string | null) => void;
  setNotes: (notes: Note[]) => void;
  addNote: (note: Note) => void;
  updateNote: (id: string, updates: Partial<Note>) => void;
  deleteNote: (id: string) => void;
}

// Notes are persisted in Supabase (see app/api/notes). This store only holds
// the in-memory copy; the page wires each mutation to the matching API call.
export const useAppStore = create<AppState>((set) => ({
  currentPaper: null,
  notes: [],
  isAnalyzing: false,
  error: null,

  setCurrentPaper: (paper) => set({ currentPaper: paper }),
  setAnalyzing: (analyzing) => set({ isAnalyzing: analyzing }),
  setError: (error) => set({ error }),

  setNotes: (notes) => set({ notes }),

  addNote: (note) => set((state) => ({ notes: [...state.notes, note] })),

  updateNote: (id, updates) =>
    set((state) => ({
      notes: state.notes.map((note) =>
        note.id === id ? { ...note, ...updates, updatedAt: Date.now() } : note
      ),
    })),

  deleteNote: (id) =>
    set((state) => ({ notes: state.notes.filter((note) => note.id !== id) })),
}));
