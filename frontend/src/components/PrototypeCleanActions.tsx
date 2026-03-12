import React, { useEffect, useState } from 'react';
import { Download, FileText, Loader2, Pencil } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { useLanguage } from '../context/LanguageContext';
import {
  downloadMockCleanPdf,
  downloadMockRawNote,
  getMockCleanState,
  getMockNoteUpdatedAt,
  startMockClean,
  type MockCleanStatus,
} from '../services/mockCleanNotes';

interface PrototypeCleanActionsProps {
  noteId: number;
  noteTitle: string;
  noteContent?: string | null;
  noteImages?: string[];
  createdAt?: string;
  hasAssets: boolean;
  mode?: 'owner' | 'viewer';
  compact?: boolean;
  editPath?: string;
  editState?: unknown;
}

export const PrototypeCleanActions: React.FC<PrototypeCleanActionsProps> = ({
  noteId,
  noteTitle,
  noteContent = '',
  noteImages = [],
  createdAt,
  hasAssets,
  mode = 'owner',
  compact = false,
  editPath,
  editState,
}) => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [status, setStatus] = useState<MockCleanStatus>(() => getMockCleanState(noteId)?.status || 'idle');
  const [updatedAt, setUpdatedAt] = useState<number | null>(() => getMockNoteUpdatedAt(noteId));
  const [isDownloadingRaw, setIsDownloadingRaw] = useState(false);

  useEffect(() => {
    const sync = () => {
      setStatus(getMockCleanState(noteId)?.status || 'idle');
      setUpdatedAt(getMockNoteUpdatedAt(noteId));
    };
    sync();

    if (status !== 'processing') return undefined;

    const timer = window.setInterval(sync, 500);
    return () => window.clearInterval(timer);
  }, [noteId, status]);

  const handleStart = () => {
    setStatus(startMockClean(noteId).status);
  };

  const handleRawDownload = async () => {
    setIsDownloadingRaw(true);
    try {
      await downloadMockRawNote(
        noteTitle,
        noteContent || '',
        noteImages,
        format(updatedAt || new Date(createdAt || Date.now()), 'MMM dd, yyyy HH:mm'),
      );
    } finally {
      setIsDownloadingRaw(false);
    }
  };

  const updatedLabel = format(updatedAt || new Date(createdAt || Date.now()), 'MMM dd, yyyy HH:mm');
  const isViewerMode = mode === 'viewer';
  const showStartAction = !isViewerMode && hasAssets;
  const showEditAction = !isViewerMode;
  const showRawAction = !isViewerMode || status !== 'done' || !hasAssets;
  const showPdfAction = hasAssets && (!isViewerMode || status === 'done');
  const secondaryActionCount = [showEditAction, showRawAction, showPdfAction].filter(Boolean).length;
  const secondaryGridClass =
    secondaryActionCount <= 1
      ? 'grid-cols-1'
      : secondaryActionCount === 2
        ? 'grid-cols-1 sm:grid-cols-2'
        : 'grid-cols-1 sm:grid-cols-3';
  const primaryButtonClass = `inline-flex items-center justify-center gap-2 border-2 font-mono font-bold uppercase tracking-[0.18em] transition-all ${
    compact ? 'min-h-[46px] px-4 py-2 text-[11px]' : 'min-h-[50px] px-5 py-3 text-xs'
  } ${
    status === 'done'
      ? 'border-retro-accent/40 bg-retro-accent/10 text-retro-accent shadow-solid hover:-translate-y-[2px] hover:border-retro-accent hover:bg-retro-accent hover:text-retro-bg'
      : 'border-retro-accent bg-retro-accent text-retro-bg shadow-solid-accent hover:-translate-y-[2px] hover:shadow-solid-hover'
  } disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0 disabled:hover:shadow-none`;
  const secondaryButtonClass = `inline-flex items-center justify-center gap-2 border-2 border-retro-border bg-retro-panel/70 text-retro-text font-mono font-bold uppercase tracking-[0.18em] shadow-solid transition-all ${
    compact ? 'min-h-[46px] px-3 py-2 text-[11px]' : 'min-h-[50px] px-4 py-3 text-xs'
  } hover:-translate-y-[2px] hover:border-retro-text hover:bg-retro-text hover:text-retro-bg disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:translate-y-0 disabled:hover:border-retro-border disabled:hover:bg-retro-panel/70 disabled:hover:text-retro-text`;

  return (
    <div className={`mt-4 pt-4 border-t-2 border-dashed border-retro-border ${compact ? 'space-y-3' : 'space-y-4'}`}>
      <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
        <span className="text-[11px] font-mono text-retro-muted uppercase tracking-[0.22em]">
          {t('clean.updated')} {updatedLabel}
        </span>
        {status !== 'idle' && (
          <span className={`inline-flex w-fit items-center gap-2 px-3 py-1 border font-mono text-[10px] uppercase tracking-[0.22em] ${
            status === 'done'
              ? 'border-retro-accent/30 bg-retro-accent/10 text-retro-accent'
              : 'border-white/20 bg-white/5 text-retro-text'
          }`}>
            {status === 'processing' && <Loader2 size={12} className="animate-spin" />}
            {status === 'processing' && t('clean.processing')}
            {status === 'done' && t('clean.ready')}
          </span>
        )}
      </div>

      <div className="space-y-2">
        {showStartAction && (
          <button
            onClick={handleStart}
            disabled={status === 'processing'}
            className={`${primaryButtonClass} w-full sm:w-auto`}
          >
            {status === 'processing' ? <Loader2 size={14} className="animate-spin" /> : <FileText size={14} />}
            {status === 'done' ? t('clean.rerun') : t('clean.start')}
          </button>
        )}

        <div className={`grid gap-2 ${secondaryGridClass}`}>
          {showEditAction && (
            <button
              onClick={() => navigate(editPath || `/notes/${noteId}/edit`, { state: editState })}
              className={secondaryButtonClass}
            >
              <Pencil size={14} />
              {t('clean.edit')}
            </button>
          )}

          {showRawAction && (
            <button
              onClick={handleRawDownload}
              disabled={isDownloadingRaw}
              className={secondaryButtonClass}
            >
              {isDownloadingRaw ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
              {t('clean.download_raw')}
            </button>
          )}

          {showPdfAction && (
            <div className="group relative">
              <button
                onClick={() => downloadMockCleanPdf(noteTitle)}
                disabled={status !== 'done'}
                className={`${secondaryButtonClass} w-full`}
              >
                <Download size={14} />
                {t('clean.download')}
              </button>
              {status !== 'done' && (
                <div className="pointer-events-none absolute left-1/2 top-full z-10 hidden -translate-x-1/2 pt-2 group-hover:block">
                  <div className="whitespace-nowrap border border-retro-border bg-retro-panel px-3 py-2 text-[10px] font-mono uppercase tracking-widest text-retro-muted shadow-solid">
                    {t('clean.pdf_waiting')}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
