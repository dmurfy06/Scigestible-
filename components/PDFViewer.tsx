'use client';

import { useState, useEffect, useRef } from 'react';
import { Loader, AlertCircle, ExternalLink, ChevronLeft, ChevronRight } from 'lucide-react';

interface PDFViewerProps {
  url: string | null;
  isLoading: boolean;
  filename: string;
}

export function PDFViewer({ url, isLoading, filename }: PDFViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const renderTaskRef = useRef<{ cancel: () => void } | null>(null);
  const [pdfDoc, setPdfDoc] = useState<{ numPages: number; getPage: (n: number) => Promise<any> } | null>(null);
  const [numPages, setNumPages] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageLoading, setPageLoading] = useState(false);
  const [loadError, setLoadError] = useState(false);

  // Load PDF document whenever url changes
  useEffect(() => {
    if (!url) return;
    let cancelled = false;
    setLoadError(false);
    setPdfDoc(null);
    setCurrentPage(1);

    (async () => {
      try {
        const pdfjsLib = await import('pdfjs-dist');
        pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
          'pdfjs-dist/build/pdf.worker.min.mjs',
          import.meta.url,
        ).toString();
        const doc = await pdfjsLib.getDocument(url).promise;
        if (!cancelled) {
          setPdfDoc(doc);
          setNumPages(doc.numPages);
        }
      } catch {
        if (!cancelled) setLoadError(true);
      }
    })();

    return () => { cancelled = true; };
  }, [url]);

  // Render the current page onto the canvas
  useEffect(() => {
    if (!pdfDoc || !canvasRef.current || !containerRef.current) return;
    let cancelled = false;
    setPageLoading(true);

    (async () => {
      try {
        renderTaskRef.current?.cancel();
        const page = await pdfDoc.getPage(currentPage);
        if (cancelled) return;

        const containerWidth = containerRef.current!.clientWidth || 600;
        const baseViewport = page.getViewport({ scale: 1 });
        const scale = containerWidth / baseViewport.width;
        const viewport = page.getViewport({ scale });

        const canvas = canvasRef.current!;
        canvas.width = viewport.width;
        canvas.height = viewport.height;

        const renderTask = page.render({ canvasContext: canvas.getContext('2d')!, viewport });
        renderTaskRef.current = renderTask;
        await renderTask.promise;
        if (!cancelled) setPageLoading(false);
      } catch (e: any) {
        if (e?.name !== 'RenderingCancelledException' && !cancelled) setLoadError(true);
      }
    })();

    return () => { cancelled = true; };
  }, [pdfDoc, currentPage]);

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-slate-900/50 rounded-xl border border-slate-700/50">
        <div className="text-center">
          <Loader className="animate-spin text-blue-400 mx-auto mb-2" size={20} />
          <p className="text-xs text-slate-500">Loading PDF…</p>
        </div>
      </div>
    );
  }

  if (!url) {
    return (
      <div className="flex-1 flex items-center justify-center bg-slate-900/50 rounded-xl border border-slate-700/40">
        <div className="text-center px-6">
          <AlertCircle className="text-slate-600 mx-auto mb-2" size={20} />
          <p className="text-xs text-slate-500 leading-relaxed">
            PDF not stored for this paper.
            <br />Re-upload to enable the viewer.
          </p>
        </div>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="flex-1 flex items-center justify-center bg-slate-900/50 rounded-xl border border-slate-700/40">
        <div className="text-center px-6">
          <p className="text-xs text-slate-400 mb-3">Could not render PDF.</p>
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-xs text-blue-400 hover:text-blue-300 underline underline-offset-2"
          >
            Open {filename} <ExternalLink size={11} />
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col rounded-xl overflow-hidden border border-slate-700/50 min-h-0">
      {/* Header bar */}
      <div className="flex items-center justify-between px-3 py-2 bg-slate-800/80 border-b border-slate-700/50 flex-shrink-0">
        <p className="text-xs text-slate-400 truncate">{filename}</p>
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-slate-500 hover:text-slate-300 transition-colors flex-shrink-0 ml-2"
          title="Open in new tab"
        >
          <ExternalLink size={12} />
        </a>
      </div>

      {/* Page navigation — only shown when document has multiple pages */}
      {numPages > 1 && (
        <div className="flex items-center justify-center gap-3 px-3 py-1.5 bg-slate-800/60 border-b border-slate-700/40 flex-shrink-0">
          <button
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={currentPage <= 1}
            className="p-0.5 text-slate-400 hover:text-white disabled:opacity-30 transition-colors"
          >
            <ChevronLeft size={14} />
          </button>
          <span className="text-xs text-slate-400 tabular-nums select-none">
            {pdfDoc ? `${currentPage} / ${numPages}` : '…'}
          </span>
          <button
            onClick={() => setCurrentPage(p => Math.min(numPages, p + 1))}
            disabled={currentPage >= numPages}
            className="p-0.5 text-slate-400 hover:text-white disabled:opacity-30 transition-colors"
          >
            <ChevronRight size={14} />
          </button>
        </div>
      )}

      {/* Canvas area */}
      <div ref={containerRef} className="flex-1 overflow-auto bg-slate-950 relative min-h-0">
        {!pdfDoc && (
          <div className="absolute inset-0 flex items-center justify-center">
            <Loader className="animate-spin text-blue-400" size={18} />
          </div>
        )}
        {pageLoading && pdfDoc && (
          <div className="absolute top-2 right-2 z-10">
            <Loader className="animate-spin text-blue-400/60" size={14} />
          </div>
        )}
        <canvas ref={canvasRef} className="w-full block" />
      </div>
    </div>
  );
}
