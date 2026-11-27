import React, { useRef, useState } from 'react';
import { motion } from 'motion/react';
import {
  Upload,
  FileText,
  CheckCircle2,
  X,
  AlertCircle,
  ArrowRight,
  ArrowLeft,
  Trash2,
} from 'lucide-react';
import { DEMO_SUBJECTS } from '../data/demoNotes';
import { DemoSubject, UploadedFileMeta } from '../types/viva';
import {
  countWords,
  extractTextFromFile,
  formatFileSize,
} from '../utils/pdfExtractor';

interface StudyMaterialStepProps {
  notes: string;
  uploadedFile: UploadedFileMeta | null;
  activeDemoId: string | null;
  onChangeNotes: (text: string) => void;
  onFileExtracted: (text: string, meta: UploadedFileMeta) => void;
  onRemoveFile: () => void;
  onSelectDemo: (subject: DemoSubject) => void;
  onBack: () => void;
  onContinue: () => void;
}

export function StudyMaterialStep({
  notes,
  uploadedFile,
  activeDemoId,
  onChangeNotes,
  onFileExtracted,
  onRemoveFile,
  onSelectDemo,
  onBack,
  onContinue,
}: StudyMaterialStepProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractProgress, setExtractProgress] = useState(0);
  const [extractStatus, setExtractStatus] = useState('');
  const [error, setError] = useState<string | null>(null);

  const wordCount = countWords(notes);
  const charCount = notes.trim().length;
  const isReady = charCount >= 40 && !isExtracting;

  const processFile = async (file: File) => {
    setError(null);
    setIsExtracting(true);
    setExtractProgress(5);
    setExtractStatus('Preparing file...');

    try {
      const result = await extractTextFromFile(file, (pct, msg) => {
        setExtractProgress(pct);
        setExtractStatus(msg);
      });

      const isPdf = file.name.toLowerCase().endsWith('.pdf') || file.type === 'application/pdf';
      const meta: UploadedFileMeta = {
        name: file.name,
        sizeBytes: file.size,
        type: isPdf ? 'pdf' : 'txt',
        pageCount: result.pageCount,
        wordCount: result.wordCount,
      };
      onFileExtracted(result.text, meta);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to extract text from file.');
    } finally {
      setIsExtracting(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
    e.target.value = '';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isDragging) setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  return (
    <motion.section
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
      className="mx-auto w-full max-w-4xl px-4 py-8 sm:px-6"
    >
      <div className="mb-8">
        <p className="text-xs font-medium text-[#14B8A6]">Step 1 of 5 · Study Material</p>
        <h1 className="mt-2 font-display text-2xl sm:text-3xl font-bold text-[#F8FAFC] text-balance">
          Upload your notes or choose a sample subject
        </h1>
        <p className="mt-2 text-sm sm:text-base text-slate-400">
          Your virtual examiner will craft five progressive questions strictly from the material below.
        </p>
      </div>

      <div className="glass-panel rounded-3xl p-6 sm:p-8 space-y-7">
        {/* Drag-and-drop File Upload */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <label className="text-sm font-semibold text-[#F8FAFC]">
              Upload PDF or TXT File
            </label>
            <span className="text-xs text-slate-400">
              Processed locally in your browser · Max 15 MB
            </span>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.txt,application/pdf,text/plain"
            onChange={handleFileChange}
            className="hidden"
            aria-label="Upload PDF or TXT study notes"
          />

          {!uploadedFile && !isExtracting ? (
            <div
              role="button"
              tabIndex={0}
              onClick={() => fileInputRef.current?.click()}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  fileInputRef.current?.click();
                }
              }}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`flex flex-col items-center justify-center rounded-2xl border-2 border-dashed px-6 py-9 text-center transition-all duration-200 cursor-pointer ${
                isDragging
                  ? 'border-[#14B8A6] bg-[#14B8A6]/10'
                  : 'border-white/15 bg-white/[0.02] hover:border-[#2563EB]/60 hover:bg-white/[0.04]'
              }`}
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#2563EB]/15 text-[#2563EB]">
                <Upload className="h-5 w-5" />
              </div>
              <p className="mt-4 text-sm sm:text-base font-medium text-[#F8FAFC]">
                Drag and drop your PDF or TXT notes here
              </p>
              <p className="mt-1 text-xs sm:text-sm text-slate-400">
                or <span className="text-[#2563EB] underline underline-offset-4">browse files</span>{' '}
                from your device
              </p>
            </div>
          ) : isExtracting ? (
            <div className="rounded-2xl border border-[#2563EB]/30 bg-[#2563EB]/[0.07] p-5">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium text-[#F8FAFC]">{extractStatus}</span>
                <span className="font-mono text-xs text-[#14B8A6] tabular-nums">
                  {extractProgress}%
                </span>
              </div>
              <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-white/10">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-[#2563EB] to-[#14B8A6] transition-all duration-200"
                  style={{ width: `${extractProgress}%` }}
                />
              </div>
            </div>
          ) : uploadedFile ? (
            <div className="rounded-2xl border border-[#14B8A6]/35 bg-[#14B8A6]/[0.08] p-4 sm:p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3.5 min-w-0">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#14B8A6]/20 text-[#14B8A6]">
                    <FileText className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="truncate text-sm font-semibold text-[#F8FAFC]">
                        {uploadedFile.name}
                      </p>
                      <CheckCircle2 className="h-4 w-4 shrink-0 text-[#14B8A6]" aria-label="Uploaded successfully" />
                    </div>
                    <p className="mt-1 text-xs text-slate-300 tabular-nums">
                      {formatFileSize(uploadedFile.sizeBytes)}
                      {uploadedFile.pageCount ? ` · ${uploadedFile.pageCount} page${uploadedFile.pageCount === 1 ? '' : 's'}` : ''}
                      {` · ${uploadedFile.wordCount.toLocaleString()} words extracted`}
                      {' · Ready'}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setError(null);
                    onRemoveFile();
                  }}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-white/15 bg-white/[0.05] px-3 py-2 text-xs font-medium text-slate-200 hover:bg-red-500/15 hover:border-red-400/40 hover:text-red-200 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                >
                  <X className="h-3.5 w-3.5" />
                  <span>Remove</span>
                </button>
              </div>
              <div className="mt-3.5 h-1.5 w-full overflow-hidden rounded-full bg-white/10">
                <div className="h-full w-full rounded-full bg-[#14B8A6]" />
              </div>
            </div>
          ) : null}

          {error && (
            <div
              role="alert"
              className="mt-3 flex items-start gap-2.5 rounded-xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-200"
            >
              <AlertCircle className="h-4 w-4 mt-0.5 shrink-0 text-red-400" />
              <span>{error}</span>
            </div>
          )}
        </div>

        {/* Demo Notes Buttons */}
        <div className="border-t border-white/[0.08] pt-6">
          <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between mb-3">
            <span className="text-sm font-semibold text-[#F8FAFC]">Or load demo college notes</span>
            <span className="text-xs text-slate-400">One click to populate structured syllabus notes</span>
          </div>
          <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
            {DEMO_SUBJECTS.map((subject) => {
              const isSelected = activeDemoId === subject.id;
              return (
                <button
                  key={subject.id}
                  type="button"
                  onClick={() => {
                    setError(null);
                    onSelectDemo(subject);
                  }}
                  className={`flex flex-col items-start rounded-xl border px-3.5 py-3 text-left transition-all duration-200 cursor-pointer min-h-[58px] ${
                    isSelected
                      ? 'border-[#2563EB] bg-[#2563EB]/20 text-white'
                      : 'border-white/10 bg-white/[0.03] text-slate-200 hover:border-white/25 hover:bg-white/[0.06]'
                  }`}
                >
                  <span className="text-sm font-semibold whitespace-nowrap">{subject.label}</span>
                  <span className="mt-0.5 text-[11px] text-slate-400 line-clamp-1">
                    {subject.subtitle}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Study Notes Text Area */}
        <div className="border-t border-white/[0.08] pt-6">
          <div className="flex items-center justify-between mb-2.5">
            <label htmlFor="study-notes-input" className="text-sm font-semibold text-[#F8FAFC]">
              Paste or review your study notes
            </label>
            <div className="flex items-center gap-3 text-xs text-slate-400 tabular-nums">
              <span>{wordCount.toLocaleString()} words</span>
              {notes.trim().length > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    setError(null);
                    onRemoveFile();
                  }}
                  className="inline-flex items-center gap-1 text-slate-400 hover:text-red-300 transition-colors cursor-pointer"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  <span>Clear</span>
                </button>
              )}
            </div>
          </div>

          <textarea
            id="study-notes-input"
            value={notes}
            onChange={(e) => onChangeNotes(e.target.value)}
            rows={9}
            placeholder="Paste lecture notes, definitions, formulas, lab theory, or textbook excerpts here..."
            className="w-full rounded-2xl border border-white/12 bg-[#101827]/80 px-4 py-3.5 text-sm leading-relaxed text-[#F8FAFC] placeholder:text-slate-500 focus:border-[#2563EB] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/30 resize-y"
          />
          <p className="mt-2 text-xs text-slate-400">
            {charCount < 40
              ? `Add at least ${40 - charCount} more characters so the examiner can generate five distinct questions.`
              : 'Notes look good. You can edit any line above before continuing.'}
          </p>
        </div>

        {/* Step Actions */}
        <div className="flex flex-col-reverse gap-3 border-t border-white/[0.08] pt-6 sm:flex-row sm:items-center sm:justify-between">
          <button
            type="button"
            onClick={onBack}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/[0.03] px-5 py-3 text-sm font-medium text-slate-300 transition-colors hover:bg-white/[0.08] hover:text-white whitespace-nowrap cursor-pointer min-h-[46px]"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Home</span>
          </button>

          <button
            type="button"
            disabled={!isReady}
            onClick={onContinue}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#2563EB] px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-[#2563EB]/20 transition-all duration-200 hover:bg-[#1D4ED8] disabled:cursor-not-allowed disabled:opacity-40 whitespace-nowrap cursor-pointer min-h-[46px]"
          >
            <span>Continue to Language</span>
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </motion.section>
  );
}
