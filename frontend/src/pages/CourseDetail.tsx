import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../services/api';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Loader2, ArrowLeft, Trash2, X, ChevronLeft, ChevronRight, ZoomIn, Pencil, Check } from 'lucide-react';
import { format } from 'date-fns';

interface Note {
  id: number;
  title: string;
  content: string;
  created_at: string;
  images: string[];
  original_author?: string;
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

  // Delete state
  const [deletingNoteId, setDeletingNoteId] = useState<number | null>(null);

  // Edit state
  const [editingNoteId, setEditingNoteId] = useState<number | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');

  // Lightbox state
  const [lightboxImages, setLightboxImages] = useState<string[]>([]);
  const [lightboxIndex, setLightboxIndex] = useState(0);

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

  // ─────────────────────────────────────────────────────────────────────────

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="animate-spin text-retro-accent" size={32} />
      </div>
    );
  }

  if (error) {
    return <div className="p-8 text-retro-danger font-mono border-2 border-retro-danger bg-retro-danger/10">ERROR: {error}</div>;
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
      <div className="p-4 md:p-8">
        <div className="mb-8">
          <Link to="/" className="inline-flex items-center gap-2 text-retro-muted hover:text-retro-text hover:-translate-x-1 transition-transform font-mono text-sm mb-4">
            <ArrowLeft size={16} /> RETURN TO DASHBOARD
          </Link>
          <div className="flex justify-between items-end border-b-2 border-retro-border pb-4">
            <div>
              <h1 className="text-4xl font-bold uppercase tracking-tighter">
                {course?.title || `COURSE ${id}`}<span className="text-retro-accent">_</span>
              </h1>
              {course?.description && (
                <p className="text-retro-muted font-mono text-sm mt-1">{course.description}</p>
              )}
            </div>
            <Link to={`/upload?courseId=${id}`}>
              <Button className="flex items-center gap-2">UPLOAD NOTE</Button>
            </Link>
          </div>
        </div>

        {notes.length === 0 ? (
          <div className="border-2 border-dashed border-retro-border p-12 text-center text-retro-muted font-mono">
            <p>NO NOTES ARCHIVED IN THIS DIRECTORY.</p>
          </div>
        ) : (
          <div className="space-y-8">
            {notes.map(note => (
              <Card key={note.id} className="relative overflow-hidden">
                <div className="flex flex-col md:flex-row gap-6">

                  {/* Images Section */}
                  {note.images && note.images.length > 0 && (
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
                          placeholder="Note content..."
                        />
                        <div className="flex gap-2 mt-auto pt-2">
                          <button
                            type="submit"
                            className="flex-1 flex items-center justify-center gap-1 bg-retro-accent text-retro-bg font-mono font-bold py-1.5 text-sm hover:opacity-80 transition-opacity"
                          >
                            <Check size={14} /> SAVE
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditingNoteId(null)}
                            className="flex-1 flex items-center justify-center gap-1 border-2 border-retro-border text-retro-muted font-mono text-sm hover:border-retro-text hover:text-retro-text transition-colors"
                          >
                            <X size={14} /> CANCEL
                          </button>
                        </div>
                      </form>
                    ) : (
                      /* ── View Mode ── */
                      <>
                        <div className="flex items-start justify-between gap-4 mb-2">
                          <h3 className="text-2xl font-bold uppercase truncate">{note.title}</h3>
                          <div className="flex gap-1 flex-shrink-0">
                            <button
                              onClick={() => startEditingNote(note)}
                              className="flex items-center gap-1 font-mono text-xs py-1 px-2 border border-transparent text-retro-muted hover:border-retro-accent hover:text-retro-accent transition-colors"
                              title="Edit note"
                            >
                              <Pencil size={13} />
                            </button>
                            <button
                              onClick={() => handleDeleteNote(note.id)}
                              className={`flex items-center gap-1 font-mono text-xs py-1 px-2 border transition-colors ${
                                deletingNoteId === note.id
                                  ? 'border-retro-danger text-retro-danger animate-pulse'
                                  : 'border-transparent text-retro-muted hover:border-retro-danger hover:text-retro-danger'
                              }`}
                              title={deletingNoteId === note.id ? 'Confirm delete?' : 'Delete note'}
                            >
                              <Trash2 size={13} />
                              {deletingNoteId === note.id ? 'CONFIRM?' : ''}
                            </button>
                          </div>
                        </div>

                        <div className="text-retro-muted font-mono text-xs mb-4 pb-4 border-b-2 border-dashed border-retro-border">
                          {format(new Date(note.created_at), 'MMMM dd, yyyy HH:mm')} | ID: {note.id.toString().padStart(4, '0')}
                          {note.original_author && (
                            <span className="ml-2 pl-2 border-l-2 border-retro-border inline-flex items-center">
                              Originally by <span className="text-retro-accent ml-1 underline decoration-dashed">@{note.original_author}</span>
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
    </>
  );
};

export default CourseDetail;
