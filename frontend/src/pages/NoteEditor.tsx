import React, { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Loader2, Save } from 'lucide-react';
import api from '../services/api';
import { Card } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { useLanguage } from '../context/LanguageContext';
import { markMockNoteUpdated } from '../services/mockCleanNotes';

interface EditableNote {
  id: number;
  title: string;
  content: string | null;
  course_id: number | null;
  images: string[];
  created_at?: string;
}

const NoteEditor: React.FC = () => {
  const { noteId } = useParams<{ noteId: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const initialNote = ((location.state as { initialNote?: EditableNote } | null)?.initialNote) || null;
  const [note, setNote] = useState<EditableNote | null>(null);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (initialNote) {
      setNote(initialNote);
      setTitle(initialNote.title || '');
      setContent(initialNote.content || '');
      setIsLoading(false);
      return;
    }

    const fetchNote = async () => {
      try {
        const response = await api.get(`/api/notes/${noteId}`);
        setNote(response.data);
        setTitle(response.data.title || '');
        setContent(response.data.content || '');
      } catch (err: any) {
        setError(err.response?.data?.detail || t('edit.load_error'));
      } finally {
        setIsLoading(false);
      }
    };

    if (noteId) {
      fetchNote();
    }
  }, [initialNote, noteId, t]);

  const getDestination = () => {
    if (!note) return '/profile';
    return note.course_id ? `/course/${note.course_id}` : '/profile';
  };

  const handleBack = () => {
    navigate(getDestination(), { state: { focusNoteId: note?.id } });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!note) return;

    setIsSaving(true);
    setError('');
    try {
      await api.put(`/api/notes/${note.id}`, { title, content });
      markMockNoteUpdated(note.id);
      navigate(getDestination(), { state: { focusNoteId: note.id } });
    } catch (err: any) {
      setError(err.response?.data?.detail || t('edit.save_error'));
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="animate-spin text-retro-accent" size={32} />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 max-w-3xl mx-auto">
      <div className="mb-8">
        <button
          onClick={handleBack}
          className="inline-flex items-center gap-2 text-retro-muted hover:text-retro-text hover:-translate-x-1 transition-transform font-mono text-sm mb-4"
        >
          <ArrowLeft size={16} /> {t('edit.back')}
        </button>
        <h1 className="text-3xl font-bold uppercase tracking-tighter sm:text-4xl">
          {t('edit.title')}<span className="text-retro-accent">_</span>
        </h1>
      </div>

      <Card className="space-y-6">
        {error && (
          <div className="bg-retro-danger/20 border-2 border-retro-danger text-retro-danger p-3 font-mono text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <Input
            label={t('edit.note_title')}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />

          <div className="flex flex-col w-full">
            <label className="mb-2 text-sm font-bold text-retro-muted tracking-widest uppercase">
              {t('edit.note_content')}
            </label>
            <textarea
              className="bg-retro-bg text-retro-text border-2 border-retro-border py-3 px-4 font-mono outline-none focus:border-retro-accent focus:shadow-solid-accent min-h-[260px] resize-y"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder={t('edit.placeholder')}
            />
          </div>

          {!!note?.images?.length && (
            <div className="space-y-3">
              <div className="text-sm font-bold text-retro-muted tracking-widest uppercase">
                {t('edit.images')}
              </div>
              <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
                {(note?.images || []).map((img, index) => (
                  <div key={`${img}-${index}`} className="border-2 border-retro-border bg-retro-bg overflow-hidden">
                    <img src={img} alt={`Note image ${index + 1}`} className="w-full aspect-square object-cover" />
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
            <Link to={getDestination()} state={{ focusNoteId: note?.id }}>
              <Button variant="secondary" type="button" className="w-full sm:w-auto">
                {t('edit.cancel')}
              </Button>
            </Link>
            <Button type="submit" className="w-full sm:w-auto" disabled={isSaving}>
              {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
              <span className="ml-2">{t('edit.save')}</span>
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
};

export default NoteEditor;
