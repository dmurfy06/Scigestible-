export interface StudyObjective {
  points: string[];
}

export interface PlainEnglishSummary {
  text: string;
}

export interface KeyFinding {
  text: string;
}

export interface MethodsOverview {
  text: string;
}

export interface Limitation {
  text: string;
}

export interface GlossaryTerm {
  term: string;
  definition: string;
}

export interface CitationData {
  authors: string[];
  year: string;
  title: string;
  journal: string;
  volume?: string;
  issue?: string;
  pages?: string;
  doi?: string;
  publisher?: string;
  placeOfPublication?: string;
}

export interface PaperAnalysis {
  studyObjective: StudyObjective;
  plainEnglishSummary: PlainEnglishSummary;
  keyFindings: KeyFinding[];
  methodsOverview: MethodsOverview;
  limitations: Limitation[];
  glossary: GlossaryTerm[];
  citationData?: CitationData;
}

export interface Note {
  id: string;
  paperId: string;
  title: string;
  content: string;
  createdAt: number;
  updatedAt: number;
}

export interface Folder {
  id: string;
  name: string;
  createdAt: number;
}

export interface Paper {
  id: string;
  filename: string;
  customName?: string;
  pdfPath?: string;
  pdfUrl?: string;
  folderId?: string;
  analysis: PaperAnalysis;
  uploadedAt: number;
}
