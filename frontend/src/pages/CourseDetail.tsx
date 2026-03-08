import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../services/api';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Loader2, ArrowLeft, Trash2, X, ChevronLeft, ChevronRight, ZoomIn, Pencil, Check, BookOpen, Lock, Unlock } from 'lucide-react';
import { format } from 'date-fns';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';

interface Note {
  id: number;
  title: string;
  content: string;
  created_at: string;
  images: string[];
  original_author?: string;
  paps_price?: number;
  is_locked?: boolean;
}

interface Course {
  id: number;
  title: string;
  description: string;
}

const CourseDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [course, setCourse] = useState<Course | null>(null);
  const [notes, setNotes] = useState<Note[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const { t } = useLanguage();
  const { isAuthenticated } = useAuth();

  // Delete state
  const [deletingNoteId, setDeletingNoteId] = useState<number | null>(null);

  // Edit state
  const [editingNoteId, setEditingNoteId] = useState<number | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');

  // Lightbox state
  const [lightboxImages, setLightboxImages] = useState<string[]>([]);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  // Unlock state
  const [unlockModalOpen, setUnlockModalOpen] = useState(false);
  const [targetUnlockNote, setTargetUnlockNote] = useState<Note | null>(null);
  const [shareCode, setShareCode] = useState('');
  const [unlockError, setUnlockError] = useState('');
  const [isUnlocking, setIsUnlocking] = useState(false);

  useEffect(() => {
    const fetchCourseData = async () => {
      try {
        const [courseResponse, notesResponse] = await Promise.all([
          api.get(`/api/courses/${id}`),
          api.get(`/api/courses/${id}/notes`),
        ]);
        setCourse(courseResponse.data);
        setNotes(notesResponse.data);
      } catch {
        setError('Failed to fetch course data.');
      } finally {
        setIsLoading(false);
      }
    };
    fetchCourseData();
  }, [id]);

  // ── Note deletion ──────────────────────────────────────────────────────────

  const handleDeleteNote = async (noteId: number) => {
    if (deletingNoteId !== noteId) {
      setDeletingNoteId(noteId);
      return;
    }
    try {
      await api.delete(`/api/notes/${noteId}`);
      setNotes(notes.filter(n => n.id !== noteId));
      setDeletingNoteId(null);
    } catch {
      setError('Failed to delete note.');
    }
  };

  // ── Note Edition ───────────────────────────────────────────────────────────

  const startEditingNote = (note: Note) => {
    setEditingNoteId(note.id);
    setEditTitle(note.title);
    setEditContent(note.content || '');
  };

  const handleUpdateNote = async (noteId: number, e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await api.put(`/api/notes/${noteId}`, {
        title: editTitle,
        content: editContent,
      });
      setNotes(notes.map(n => (n.id === noteId ? res.data : n)));
      setEditingNoteId(null);
    } catch {
      setError('Failed to update note.');
    }
  };

  // ── Lightbox ───────────────────────────────────────────────────────────────

  const openLightbox = (images: string[], index: number) => {
    setLightboxImages(images);
    setLightboxIndex(index);
  };

  const closeLightbox = useCallback(() => {
    setLightboxImages([]);
    setLightboxIndex(0);
  }, []);

  const prevImage = useCallback(() => {
    setLightboxIndex(i => (i - 1 + lightboxImages.length) % lightboxImages.length);
  }, [lightboxImages.length]);

  const nextImage = useCallback(() => {
    setLightboxIndex(i => (i + 1) % lightboxImages.length);
  }, [lightboxImages.length]);

  useEffect(() => {
    if (lightboxImages.length === 0) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeLightbox();
      if (e.key === 'ArrowLeft') prevImage();
      if (e.key === 'ArrowRight') nextImage();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [lightboxImages.length, closeLightbox, prevImage, nextImage]);

  // ── Unlock Logic ─────────────────────────────────────────────────────────

  const handleUnlockNoteWithPin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetUnlockNote || shareCode.length < 4) return;

    setUnlockError('');
    setIsUnlocking(true);
    try {
      const res = await api.post('/api/sharing/verify', { share_code: shareCode });
      const newToken = res.data.access_token;

      // We can reload the course notes with the new token
      const headers = { Authorization: `Bearer ${newToken}` };
      const notesRes = await api.get(`/api/courses/${id}/notes`, { headers });
      setNotes(notesRes.data);

      setUnlockModalOpen(false);
      setTargetUnlockNote(null);
      setShareCode('');
    } catch (err: any) {
      setUnlockError(err.response?.data?.detail || 'Invalid share code.');
    } finally {
      setIsUnlocking(false);
    }
  };

  const handleUnlockNoteWithPaps = async (note: Note) => {
    setUnlockError('');
    setIsUnlocking(true);
    try {
      await api.post(`/api/sharing/notes/${note.id}/unlock`);
      alert("Note unlocked successfully!");

      const notesRes = await api.get(`/api/courses/${id}/notes`);
      setNotes(notesRes.data);

      setUnlockModalOpen(false);
      setTargetUnlockNote(null);
    } catch (err: any) {
      if (err.response?.status === 400 && err.response?.data?.detail === "Insufficient PAPS balance") {
        alert("You don't have enough PAPS!");
      } else {
        setUnlockError(err.response?.data?.detail || 'Error paying with PAPS.');
      }
    } finally {
      setIsUnlocking(false);
    }
  };

  // ─────────────────────────────────────────────────────────────────────────

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="animate-spin text-retro-accent" size={32} />
      </div>
    );
  }

  if (error) {
    return <div className="p-8 text-retro-danger font-mono border-2 border-retro-danger bg-retro-danger/10">{t('cd.error')} {error}</div>;
  }

  return (
    <>
      {/* ── Lightbox Overlay ── */}
      {lightboxImages.length > 0 && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center"
          onClick={closeLightbox}
        >
          {/* Close */}
          <button
            className="absolute top-4 right-4 text-white/70 hover:text-white transition-colors"
            onClick={closeLightbox}
          >
            <X size={32} />
          </button>

          {/* Prev */}
          {lightboxImages.length > 1 && (
            <button
              className="absolute left-4 text-white/70 hover:text-white transition-colors p-2"
              onClick={(e) => { e.stopPropagation(); prevImage(); }}
            >
              <ChevronLeft size={40} />
            </button>
          )}

          {/* Image */}
          <img
            src={lightboxImages[lightboxIndex]}
            alt={`img ${lightboxIndex + 1}`}
            className="max-h-[90vh] max-w-[90vw] object-contain border-2 border-retro-border shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          />

          {/* Next */}
          {lightboxImages.length > 1 && (
            <button
              className="absolute right-4 text-white/70 hover:text-white transition-colors p-2"
              onClick={(e) => { e.stopPropagation(); nextImage(); }}
            >
              <ChevronRight size={40} />
            </button>
          )}

          {/* Counter */}
          {lightboxImages.length > 1 && (
            <div className="absolute bottom-4 text-white/60 font-mono text-sm">
              {lightboxIndex + 1} / {lightboxImages.length}
            </div>
          )}
        </div>
      )}

      {/* ── Main Content ── */}
      <div className="p-4 md:p-8 animate-in fade-in duration-500">
        <div className="mb-10">
          <Link to="/" className="inline-flex items-center gap-2 text-retro-muted hover:text-retro-accent hover:-translate-x-1 transition-all font-mono text-xs mb-6 group">
            <ArrowLeft size={14} className="group-hover:animate-pulse" /> {t('cd.back')}
          </Link>
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end border-b-4 border-retro-border pb-6 gap-6">
            <div className="flex-1">
              <div className="inline-block bg-retro-accent/10 border border-retro-accent/30 text-retro-accent font-bold text-[10px] px-2 py-0.5 mb-3 tracking-widest uppercase">
                {t('cd.dir')} {course?.title ? course.title.split(' ')[0] : t('cd.course_info')}
              </div>
              <h1 className="text-5xl md:text-6xl font-bold uppercase tracking-tighter leading-none">
                {course?.title || `COURSE ${id}`}<span className="text-retro-accent">.</span>
              </h1>
              {course?.description && (
                <p className="text-retro-muted font-mono text-sm mt-4 max-w-2xl leading-relaxed italic">{course.description}</p>
              )}
            </div>
            <Link to={`/upload?courseId=${id}`}>
              <Button className="h-16 px-8 text-xl group shadow-solid hover:shadow-solid-accent transition-all">
                <span className="flex items-center gap-2">
                  {t('cd.upload')}
                </span>
              </Button>
            </Link>
          </div>
        </div>

        {notes.length === 0 ? (
          <div className="border-4 border-dashed border-retro-border p-20 text-center bg-retro-panel/30">
            <BookOpen className="mx-auto mb-6 text-retro-muted opacity-20" size={64} />
            <p className="text-retro-muted font-mono uppercase tracking-widest">{t('cd.empty')}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-12">
            {notes.map(note => (
              <Card key={note.id} className="relative overflow-hidden border-2 border-retro-border hover:border-retro-accent transition-colors shadow-solid hover:shadow-solid-accent group/note duration-300">
                <div className="flex flex-col md:flex-row gap-6">

                  {/* Images Section */}
                  {note.images && note.images.length > 0 && !note.is_locked && (
                    <div className="md:w-1/3 flex-shrink-0 grid grid-cols-2 gap-2">
                      {note.images.map((img, idx) => (
                        <div
                          key={idx}
                          className="aspect-square bg-retro-bg border-2 border-retro-border relative group overflow-hidden cursor-zoom-in"
                          onClick={() => openLightbox(note.images, idx)}
                        >
                          <img
                            src={img}
                            alt={`Note img ${idx + 1}`}
                            className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity group-hover:scale-105 duration-300"
                          />
                          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/30">
                            <ZoomIn size={20} className="text-white drop-shadow" />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Content Section */}
                  <div className="flex-1 flex flex-col min-w-0">
                    {editingNoteId === note.id ? (
                      /* ── Inline Edit Form ── */
                      <form onSubmit={(e) => handleUpdateNote(note.id, e)} className="flex flex-col gap-3 flex-grow">
                        <input
                          className="bg-retro-bg text-retro-text border-2 border-retro-accent py-2 px-3 font-mono outline-none text-lg font-bold uppercase w-full"
                          value={editTitle}
                          onChange={(e) => setEditTitle(e.target.value)}
                          required
                          autoFocus
                        />
                        <textarea
                          className="bg-retro-bg text-retro-text border-2 border-retro-border py-2 px-3 font-mono outline-none resize-none h-40 text-sm whitespace-pre-wrap flex-grow"
                          value={editContent}
                          onChange={(e) => setEditContent(e.target.value)}
                          placeholder={t('cd.note_placeholder')}
                        />
                        <div className="flex gap-2 mt-auto pt-2">
                          <button
                            type="submit"
                            className="flex-1 flex items-center justify-center gap-1 bg-retro-accent text-retro-bg font-mono font-bold py-1.5 text-sm hover:opacity-80 transition-opacity"
                          >
                            <Check size={14} /> {t('cd.save')}
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditingNoteId(null)}
                            className="flex-1 flex items-center justify-center gap-1 border-2 border-retro-border text-retro-muted font-mono text-sm hover:border-retro-text hover:text-retro-text transition-colors"
                          >
                            <X size={14} /> {t('cd.cancel')}
                          </button>
                        </div>
                      </form>
                    ) : note.is_locked ? (
                      <div className="flex flex-col items-center justify-center p-8 bg-black border-2 border-retro-accent shadow-solid bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMiIgY3k9IjIiIHI9IjEiIGZpbGw9IiMzMzMiLz48L3N2Zz4=')]">
                        <Lock className="text-retro-accent mb-4 transform -rotate-12" size={48} />
                        <h4 className="text-xl font-bold uppercase text-white mb-2 tracking-widest">{note.title}</h4>
                        <div className="text-retro-muted font-mono text-xs mb-6 bg-retro-bg px-3 py-1 border border-retro-border">
                          {t('prof.encrypted')} • {note.paps_price} PAPS
                        </div>
                        <Button
                          onClick={() => { setTargetUnlockNote(note); setUnlockModalOpen(true); }}
                          className="font-mono gap-2 hover:scale-105 transition-transform"
                        >
                          <Unlock size={16} /> Unlock Note
                        </Button>
                      </div>
                    ) : (
                      /* ── View Mode ── */
                      <>
                        <div className="flex items-start justify-between gap-4 mb-2">
                          <h3 className="text-2xl font-bold uppercase truncate">{note.title}</h3>
                          <div className="flex gap-1 flex-shrink-0">
                            {!note.is_locked && (
                              <button
                                onClick={() => startEditingNote(note)}
                                className="flex items-center gap-1 font-mono text-xs py-1 px-2 border border-transparent text-retro-muted hover:border-retro-accent hover:text-retro-accent transition-colors"
                                title={t('cd.edit')}
                              >
                                <Pencil size={13} />
                              </button>
                            )}
                            <button
                              onClick={() => handleDeleteNote(note.id)}
                              className={`flex items-center gap-1 font-mono text-xs py-1 px-2 border transition-colors ${deletingNoteId === note.id
                                ? 'border-retro-danger text-retro-danger animate-pulse'
                                : 'border-transparent text-retro-muted hover:border-retro-danger hover:text-retro-danger'
                                }`}
                              title={deletingNoteId === note.id ? t('cd.confirm_del') : t('cd.delete')}
                            >
                              <Trash2 size={13} />
                              {deletingNoteId === note.id ? t('cd.confirm_btn') : ''}
                            </button>
                          </div>
                        </div>

                        <div className="text-retro-muted font-mono text-xs mb-4 pb-4 border-b-2 border-dashed border-retro-border">
                          {format(new Date(note.created_at), 'MMMM dd, yyyy HH:mm')} | ID: {note.id.toString().padStart(4, '0')}
                          {note.original_author && (
                            <span className="ml-2 pl-2 border-l-2 border-retro-border inline-flex items-center">
                              {t('cd.originally_by')} <span className="text-retro-accent ml-1 underline decoration-dashed">@{note.original_author}</span>
                            </span>
                          )}
                        </div>
                        <div className="prose prose-invert prose-p:text-retro-text font-serif leading-relaxed flex-grow whitespace-pre-wrap break-words">
                          {note.content}
                        </div>
                      </>
                    )}
                  </div>

                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Unlock Modal */}
      {unlockModalOpen && targetUnlockNote && (
        <div className="fixed inset-0 z-[60] bg-black/90 flex items-center justify-center p-4">
          <Card className="max-w-md w-full border-4 border-retro-accent shadow-[8px_8px_0px_#FFD700] relative bg-retro-panel overflow-hidden">
            <button
              onClick={() => { setUnlockModalOpen(false); setTargetUnlockNote(null); }}
              className="absolute top-4 right-4 text-retro-muted hover:text-white z-10"
            >
              <X size={24} />
            </button>
            <div className="text-center mb-6 mt-4">
              <Lock className="mx-auto text-retro-accent mb-2" size={32} />
              <h2 className="text-2xl font-bold uppercase tracking-widest text-white">Unlock Note</h2>
              <p className="text-retro-accent font-mono text-sm mt-1 truncate px-8">{targetUnlockNote.title}</p>
            </div>

            {unlockError && (
              <div className="text-retro-danger font-mono text-center text-xs border-2 border-retro-danger p-2 bg-retro-danger/10 mb-4">
                {unlockError}
              </div>
            )}

            <div className="space-y-6">
              {/* Option 1: PAPS */}
              <div className="border-2 border-dashed border-retro-border p-4 bg-retro-bg">
                <h3 className="font-bold text-sm text-retro-muted uppercase tracking-wider mb-3">Option 1: Pay with PAPS</h3>
                <Button
                  onClick={() => handleUnlockNoteWithPaps(targetUnlockNote)}
                  className="w-full flex items-center justify-center gap-2"
                  disabled={isUnlocking}
                >
                  <Unlock size={16} /> Pay {targetUnlockNote.paps_price} PAPS
                </Button>
                {!isAuthenticated && (
                  <p className="text-[10px] text-center mt-2 text-retro-danger font-mono uppercase">Requires Login</p>
                )}
              </div>

              <div className="text-center font-mono text-xs text-retro-muted uppercase">— OR —</div>

              {/* Option 2: PIN */}
              <div className="border-2 border-dashed border-retro-border p-4 bg-retro-bg">
                <h3 className="font-bold text-sm text-retro-muted uppercase tracking-wider mb-3">Option 2: Enter Author's PIN</h3>
                <form onSubmit={handleUnlockNoteWithPin} className="space-y-3">
                  <Input
                    type="text"
                    placeholder="0000"
                    value={shareCode}
                    onChange={(e) => setShareCode(e.target.value.slice(0, 4).toUpperCase())}
                    maxLength={4}
                    required
                    className="text-center text-xl tracking-[0.5em] font-bold py-3"
                  />
                  <Button
                    type="submit"
                    className="w-full"
                    variant="ghost"
                    disabled={isUnlocking || shareCode.length < 4}
                  >
                    {isUnlocking ? <Loader2 size={16} className="animate-spin relative left-auto" /> : "Verify PIN"}
                  </Button>
                </form>
              </div>
            </div>
          </Card>
        </div>
      )}
    </>
  );
};

export default CourseDetail;
