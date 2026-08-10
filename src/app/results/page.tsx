'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  FileText,
  Download,
  Trash2,
  BarChart3,
  ArrowLeft,
  Loader2,
  FolderOpen,
  RefreshCw,
} from 'lucide-react';

interface ReportMeta {
  id: string;
  filename: string;
  participantName: string;
  submittedAt: string;
  size: number;
}

export default function ResultsPage() {
  const [reports, setReports] = useState<ReportMeta[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [content, setContent] = useState<string>('');
  const [loadingFile, setLoadingFile] = useState(false);
  const [analysis, setAnalysis] = useState<string>('');
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisError, setAnalysisError] = useState('');
  const [loadingList, setLoadingList] = useState(true);

  // Load report list
  const loadReports = useCallback(async () => {
    setLoadingList(true);
    try {
      const res = await fetch('/api/reports');
      const data: ReportMeta[] = await res.json();
      setReports(data);
      // Auto-select first if nothing selected
      if (data.length > 0 && !selectedId) {
        setSelectedId(data[0].id);
      }
    } catch {
      setReports([]);
    } finally {
      setLoadingList(false);
    }
  }, [selectedId]);

  useEffect(() => {
    loadReports();
  }, []);

  // Load selected report content
  useEffect(() => {
    if (!selectedId) {
      setContent('');
      return;
    }
    setLoadingFile(true);
    fetch(`/api/reports/${selectedId}`)
      .then((res) => res.json())
      .then((data) => {
        setContent(data.content || 'Пустой файл');
      })
      .catch(() => setContent('Ошибка загрузки файла'))
      .finally(() => setLoadingFile(false));
  }, [selectedId]);

  // Download file
  const handleDownload = useCallback(async (report: ReportMeta) => {
    try {
      const res = await fetch(`/api/reports/${report.id}`);
      const data = await res.json();
      const blob = new Blob([data.content], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = report.filename;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      // silent
    }
  }, []);

  // Delete file
  const handleDelete = useCallback(async (id: string) => {
    try {
      await fetch(`/api/reports/${id}`, { method: 'DELETE' });
      if (selectedId === id) {
        setSelectedId(null);
        setContent('');
      }
      loadReports();
    } catch {
      // silent
    }
  }, [selectedId, loadReports]);

  // Analyze all reports
  const handleAnalyze = useCallback(async () => {
    setAnalyzing(true);
    setAnalysisError('');
    setAnalysis('');
    try {
      const res = await fetch('/api/analyze', { method: 'POST' });
      const data = await res.json();
      if (data.error) {
        setAnalysisError(data.error);
      } else {
        setAnalysis(data.analysis);
      }
    } catch (err) {
      setAnalysisError(err instanceof Error ? err.message : 'Ошибка анализа');
    } finally {
      setAnalyzing(false);
    }
  }, []);

  const selectedReport = reports.find((r) => r.id === selectedId);

  function formatSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} Б`;
    return `${(bytes / 1024).toFixed(1)} КБ`;
  }

  // Simple markdown-ish rendering for analysis
  function renderAnalysis(text: string) {
    const lines = text.split('\n');
    const elements: React.ReactNode[] = [];
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (line.startsWith('## ')) {
        elements.push(
          <h2 key={i} className="text-base font-bold mt-4 mb-2 text-stone-800">{line.slice(3)}</h2>,
        );
      } else if (line.startsWith('--- ')) {
        elements.push(
          <p key={i} className="text-xs font-mono text-stone-400 mt-1">{line}</p>,
        );
      } else if (line.startsWith('- ') || line.match(/^\d+\.\s/)) {
        elements.push(
          <li key={i} className="text-sm text-stone-700 ml-4 list-disc">{line.replace(/^[-\d.]+\s/, '')}</li>,
        );
      } else if (line.trim() === '') {
        elements.push(<div key={i} className="h-2" />);
      } else {
        elements.push(
          <p key={i} className="text-sm text-stone-700 leading-relaxed">{line}</p>,
        );
      }
    }
    return elements;
  }

  return (
    <div className="min-h-screen bg-stone-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-stone-200 px-4 md:px-6 py-3 shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <a
              href="/"
              className="flex items-center gap-1.5 text-sm text-stone-500 hover:text-stone-700 transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              Прототип
            </a>
            <div className="h-4 w-px bg-stone-300" />
            <div className="flex items-center gap-2">
              <FolderOpen className="h-5 w-5 text-amber-600" />
              <h1 className="text-lg font-bold text-stone-800">Результаты тестирования</h1>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={loadReports}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-stone-300 text-xs font-medium text-stone-600 hover:bg-stone-100 transition-colors"
              disabled={loadingList}
            >
              <RefreshCw className={`h-3.5 w-3.5 ${loadingList ? 'animate-spin' : ''}`} />
              Обновить
            </button>
            <button
              onClick={handleAnalyze}
              disabled={analyzing || reports.length === 0}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                analyzing || reports.length === 0
                  ? 'bg-stone-200 text-stone-400 cursor-not-allowed'
                  : 'bg-amber-500 text-white hover:bg-amber-600'
              }`}
            >
              {analyzing ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <BarChart3 className="h-3.5 w-3.5" />
              )}
              {analyzing ? 'Анализ...' : 'Сформировать отчёт'}
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 flex flex-col md:flex-row overflow-hidden">
        {/* Left panel — file list */}
        <aside className="w-full md:w-80 lg:w-96 border-r border-stone-200 bg-white flex flex-col shrink-0 max-h-[40vh] md:max-h-full overflow-hidden">
          <div className="px-4 py-3 border-b border-stone-100">
            <p className="text-xs text-stone-500 font-medium">
              Сохранённые отчёты ({reports.length})
            </p>
          </div>

          {loadingList ? (
            <div className="flex-1 flex items-center justify-center">
              <Loader2 className="h-5 w-5 text-stone-400 animate-spin" />
            </div>
          ) : reports.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center gap-2 p-6 text-center">
              <FileText className="h-8 w-8 text-stone-300" />
              <p className="text-sm text-stone-400">Нет сохранённых отчётов</p>
              <p className="text-xs text-stone-300">Отчёты появятся после прохождения тестирования на главной странице</p>
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto">
              {reports.map((report) => (
                <button
                  key={report.id}
                  onClick={() => setSelectedId(report.id)}
                  className={`w-full flex items-start gap-3 px-4 py-3 text-left border-b border-stone-100 transition-colors ${
                    selectedId === report.id
                      ? 'bg-amber-50 border-l-2 border-l-amber-400'
                      : 'hover:bg-stone-50 border-l-2 border-l-transparent'
                  }`}
                >
                  <FileText className={`h-4 w-4 mt-0.5 shrink-0 ${
                    selectedId === report.id ? 'text-amber-600' : 'text-stone-400'
                  }`} />
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium truncate ${
                      selectedId === report.id ? 'text-amber-800' : 'text-stone-700'
                    }`}>
                      {report.participantName}
                    </p>
                    <p className="text-[11px] text-stone-400 mt-0.5">{report.submittedAt}</p>
                    <p className="text-[10px] text-stone-300 mt-0.5">{formatSize(report.size)}</p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0 mt-0.5">
                    <button
                      onClick={(e) => { e.stopPropagation(); handleDownload(report); }}
                      className="p-1 rounded hover:bg-stone-200 transition-colors text-stone-400 hover:text-stone-600"
                      title="Скачать"
                    >
                      <Download className="h-3 w-3" />
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleDelete(report.id); }}
                      className="p-1 rounded hover:bg-red-100 transition-colors text-stone-400 hover:text-red-600"
                      title="Удалить"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                </button>
              ))}
            </div>
          )}
        </aside>

        {/* Right panel — content / analysis */}
        <section className="flex-1 overflow-y-auto">
          {analysis ? (
            /* Analysis view */
            <div className="p-6 max-w-3xl">
              <div className="flex items-center gap-2 mb-4">
                <BarChart3 className="h-5 w-5 text-amber-600" />
                <h2 className="text-lg font-bold text-stone-800">Аналитическое резюме</h2>
              </div>
              <div className="prose prose-sm max-w-none bg-white rounded-lg border border-stone-200 p-6">
                {renderAnalysis(analysis)}
              </div>
              <button
                onClick={() => setAnalysis('')}
                className="mt-4 text-xs text-stone-500 hover:text-stone-700 underline"
              >
                Вернуться к просмотру файлов
              </button>
            </div>
          ) : selectedId && content ? (
            /* File content view */
            <div className="p-6">
              {selectedReport && (
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="text-base font-bold text-stone-800">{selectedReport.participantName}</h2>
                    <p className="text-xs text-stone-400 mt-0.5">{selectedReport.submittedAt}</p>
                  </div>
                  <button
                    onClick={() => selectedReport && handleDownload(selectedReport)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-stone-300 text-xs font-medium text-stone-600 hover:bg-stone-100 transition-colors"
                  >
                    <Download className="h-3.5 w-3.5" />
                    Скачать
                  </button>
                </div>
              )}
              <div className="bg-white rounded-lg border border-stone-200 p-4">
                <pre className="text-sm text-stone-700 whitespace-pre-wrap font-mono leading-relaxed">
                  {loadingFile ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="h-5 w-5 text-stone-400 animate-spin" />
                    </div>
                  ) : (
                    content
                  )}
                </pre>
              </div>
            </div>
          ) : (
            /* Empty state */
            <div className="flex-1 flex flex-col items-center justify-center gap-3 p-8 text-center">
              {analysisError ? (
                <>
                  <p className="text-sm text-red-500">{analysisError}</p>
                  <button
                    onClick={handleAnalyze}
                    className="text-xs text-amber-600 hover:underline"
                  >
                    Попробовать снова
                  </button>
                </>
              ) : reports.length === 0 ? (
                <>
                  <BarChart3 className="h-10 w-10 text-stone-300" />
                  <p className="text-sm text-stone-400">Сначала соберите данные тестирования</p>
                  <a href="/" className="text-xs text-amber-600 hover:underline">
                    Перейти к прототипу
                  </a>
                </>
              ) : (
                <>
                  <FileText className="h-10 w-10 text-stone-300" />
                  <p className="text-sm text-stone-400">Выберите отчёт слева для просмотра</p>
                </>
              )}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
