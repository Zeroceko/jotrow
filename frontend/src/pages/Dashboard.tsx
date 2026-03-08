import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { BookOpen, Plus, Loader2, Trash2, Pencil, X, Check, FileText, FolderPlus, Star, ArrowRight } from 'lucide-react';
import { format } from 'date-fns';
import Onboarding from '../components/Onboarding';
import { useLanguage } from '../context/LanguageContext';

interface Course {
  id: number;
  title: string;
  description: string;
  created_at: string;
  note_count: number;
}

interface Note {
  id: number;
  title: string;
  content: string | null;
  created_at: string;
  praise_count: number;
}

const Dashboard: React.FC = () => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [libraryNotes, setLibraryNotes] = useState<Note[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const [isCreating, setIsCreating] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');

  // Edit state
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');

  // Delete confirm state
  const [deletingId, setDeletingId] = useState<number | null>(null);

  // Move note to course
  const [movingNoteId, setMovingNoteId] = useState<number | null>(null);

  // Drag and drop state
  const [dragOverCourseId, setDragOverCourseId] = useState<number | null>(null);

  const navigate = useNavigate();
  const { t } = useLanguage();

  useEffect(() => {
    fetchAll();
  }, []);

  const fetchAll = async () => {
    setIsLoading(true);
    try {
      const [coursesRes, notesRes] = await Promise.all([
        api.get('/api/courses'),
        api.get('/api/notes'),
      ]);
      setCourses(coursesRes.data);
      setLibraryNotes(notesRes.data);
    } catch (err) {
      setError('Failed to load library.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    try {
      const response = await api.post('/api/courses', {
        title: newTitle,
        description: newDescription,
      });
      setCourses([...courses, response.data]);
      setNewTitle('');
      setNewDescription('');
      setIsCreating(false);
    } catch {
      setError('Failed to create folder.');
    }
  };

  const startEditing = (course: Course, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setEditingId(course.id);
    setEditTitle(course.title);
    setEditDescription(course.description || '');
  };

  const handleUpdate = async (courseId: number, e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await api.put(`/api/courses/${courseId}`, {
        title: editTitle,
        description: editDescription,
      });
      setCourses(courses.map(c => (c.id === courseId ? res.data : c)));
      setEditingId(null);
    } catch {
      setError('Failed to update folder.');
    }
  };

  const handleDelete = async (courseId: number, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (deletingId !== courseId) {
      setDeletingId(courseId);
      return;
    }
    try {
      await api.delete(`/api/courses/${courseId}`);
      setCourses(courses.filter(c => c.id !== courseId));
      setDeletingId(null);
    } catch {
      setError('Failed to delete folder.');
    }
  };

  const handleMoveNote = async (noteId: number, courseId: number) => {
    try {
      await api.put(`/api/notes/${noteId}/move`, { course_id: courseId });
      setLibraryNotes(prev => prev.filter(n => n.id !== noteId));
      setCourses(prev => prev.map(c => c.id === courseId ? { ...c, note_count: c.note_count + 1 } : c));
      setMovingNoteId(null);
    } catch {
      setError('Failed to move note.');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="animate-spin text-retro-accent" size={32} />
      </div>
    );
  }

  const totalNotes = courses.reduce((sum, c) => sum + c.note_count, 0) + libraryNotes.length;

  return (
    <div className="p-4 md:p-8 space-y-8">
      <Onboarding />

      {/* Stats bar */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <div className="bg-retro-panel border-2 border-retro-border p-4 flex items-center gap-4 shadow-solid">
          <div className="bg-retro-accent/10 p-2 border border-retro-accent/30 text-retro-accent">
            <FileText size={22} />
          </div>
          <div>
            <div className="text-[10px] text-retro-muted uppercase font-bold tracking-tighter opacity-70">{t('dash.total_notes')}</div>
            <div className="text-2xl font-bold font-mono tracking-tighter">{totalNotes}_</div>
          </div>
        </div>
        <div className="bg-retro-panel border-2 border-retro-border p-4 flex items-center gap-4 shadow-solid">
          <div className="bg-retro-accent/10 p-2 border border-retro-accent/30 text-retro-accent">
            <BookOpen size={22} />
          </div>
          <div>
            <div className="text-[10px] text-retro-muted uppercase font-bold tracking-tighter opacity-70">{t('dash.folders')}</div>
            <div className="text-2xl font-bold font-mono tracking-tighter">{courses.length}_</div>
          </div>
        </div>
        <div className="bg-retro-panel border-2 border-retro-border p-4 flex items-center gap-4 shadow-solid">
          <div className="bg-retro-accent/10 p-2 border border-retro-accent/30 text-retro-accent">
            <Star size={22} />
          </div>
          <div>
            <div className="text-[10px] text-retro-muted uppercase font-bold tracking-tighter opacity-70">{t('dash.total_praise')}</div>
            <div className="text-2xl font-bold font-mono tracking-tighter">
              {courses.reduce((s, _) => s, 0) + libraryNotes.reduce((s, n) => s + (n.praise_count || 0), 0)} PTS
            </div>
          </div>
        </div>
      </div>

      {/* Header actions */}
      <div className="flex flex-wrap gap-3 justify-between items-end border-b-2 border-retro-border pb-4">
        <div>
          <h1 className="text-4xl font-bold uppercase tracking-tighter">{t('dash.title')}<span className="text-retro-accent">_</span></h1>
          <p className="text-retro-muted font-mono mt-2 text-sm">{t('dash.subtitle')}</p>
        </div>
        <div className="flex gap-4">
          <Button
            variant="secondary"
            onClick={() => setIsCreating(!isCreating)}
            className="flex items-center gap-2 px-6 py-3 border-2 border-retro-accent text-retro-accent hover:bg-retro-accent hover:text-retro-bg font-bold tracking-widest uppercase transition-colors"
          >
            <FolderPlus size={18} />
            {isCreating ? t('dash.cancel') : t('dash.new_folder')}
          </Button>
          <Button
            onClick={() => navigate('/upload')}
            className="flex items-center gap-2 px-6 py-3 bg-retro-accent text-retro-bg font-bold tracking-widest uppercase hover:opacity-90 shadow-solid-accent transition-all"
          >
            <Plus size={18} />
            {t('nav.upload')}
          </Button>
        </div>
      </div>

      {error && (
        <div className="bg-retro-danger/20 border-2 border-retro-danger text-retro-danger p-3 font-mono text-sm flex justify-between">
          <span>ERROR: {error}</span>
          <button onClick={() => setError('')}><X size={16} /></button>
        </div>
      )}

      {/* Create folder inline form */}
      {isCreating && (
        <Card className="border-retro-accent shadow-solid-accent">
          <h2 className="text-xl font-bold uppercase tracking-tight mb-4">{t('dash.create_folder')}</h2>
          <form onSubmit={handleCreateCourse} className="space-y-4">
            <Input
              label={t('dash.folder_name')}
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="e.g. CS101..."
              required
            />
            <div className="flex flex-col w-full">
              <label className="mb-2 text-sm font-bold text-retro-muted tracking-widest uppercase">
                {t('dash.desc_optional')}
              </label>
              <textarea
                className="bg-retro-bg text-retro-text border-2 border-retro-border py-3 px-4 font-mono outline-none focus:border-retro-accent focus:shadow-solid-accent resize-none h-20"
                value={newDescription}
                onChange={(e) => setNewDescription(e.target.value)}
              />
            </div>
            <div className="flex justify-end">
              <Button type="submit">{t('dash.create')}</Button>
            </div>
          </form>
        </Card>
      )}

      {/* ── INBOX: Uncategorized Notes ───────────────────────── */}
      {libraryNotes.length > 0 && (
        <div>
          <div className="flex items-center gap-3 mb-4">
            <h2 className="text-xl font-bold uppercase tracking-tighter font-mono">
              📥 {t('dash.inbox')} <span className="text-retro-muted text-base">— {t('dash.not_in_folder')}</span>
            </h2>
            <span className="bg-retro-accent/10 text-retro-accent px-2 py-0.5 border border-retro-accent/30 font-mono text-xs font-bold">
              {libraryNotes.length}
            </span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {libraryNotes.map(note => (
              <Card
                key={note.id}
                className="relative group hover:border-retro-accent transition-all shadow-solid hover:shadow-solid-accent cursor-pointer"
                draggable
                onDragStart={(e: React.DragEvent) => {
                  e.dataTransfer.setData('noteId', note.id.toString());
                  e.dataTransfer.effectAllowed = 'move';
                }}
              >
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-bold uppercase tracking-tighter text-lg line-clamp-2 group-hover:text-retro-accent transition-colors flex-1">
                    {note.title}
                  </h3>
                </div>
                {note.content && (
                  <p className="text-retro-muted font-mono text-xs line-clamp-3 mb-3 leading-relaxed">
                    {note.content}
                  </p>
                )}

                {/* Move to folder */}
                {movingNoteId === note.id ? (
                  <div className="mt-3 pt-3 border-t-2 border-dashed border-retro-border space-y-2">
                    <p className="text-[10px] font-mono text-retro-muted uppercase tracking-widest">{t('dash.move_to')}</p>
                    {courses.length === 0 ? (
                      <p className="text-[10px] font-mono text-retro-muted italic">{t('dash.no_folders')}</p>
                    ) : (
                      courses.map(c => (
                        <button
                          key={c.id}
                          onClick={() => handleMoveNote(note.id, c.id)}
                          className="w-full text-left px-3 py-2 border border-retro-border font-mono text-sm hover:border-retro-accent hover:text-retro-accent transition-colors flex items-center gap-2"
                        >
                          <ArrowRight size={12} /> {c.title}
                        </button>
                      ))
                    )}
                    <button
                      onClick={() => setMovingNoteId(null)}
                      className="text-[10px] font-mono text-retro-muted hover:text-retro-text mt-1"
                    >
                      {t('dash.cancel')}
                    </button>
                  </div>
                ) : (
                  <div className="mt-3 pt-3 border-t-2 border-dashed border-retro-border flex justify-between items-center font-mono text-[10px] text-retro-muted">
                    <span>{format(new Date(note.created_at), 'MMM dd, yyyy')}</span>
                    <button
                      onClick={() => setMovingNoteId(note.id)}
                      className="hover:text-retro-accent transition-colors flex items-center gap-1 uppercase tracking-widest"
                    >
                      <FolderPlus size={12} /> Move
                    </button>
                  </div>
                )}
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* ── FOLDERS (Courses) ─────────────────────────────────── */}
      <div>
        <h2 className="text-xl font-bold uppercase tracking-tighter font-mono mb-4">
          🗂️ {t('dash.folders')}
          {courses.length > 0 && (
            <span className="ml-3 bg-retro-accent/10 text-retro-accent px-2 py-0.5 border border-retro-accent/30 font-mono text-xs font-bold">
              {courses.length}
            </span>
          )}
        </h2>

        {courses.length === 0 && libraryNotes.length === 0 ? (
          <div className="border-4 border-dashed border-retro-border p-16 text-center bg-retro-panel/30">
            <BookOpen className="mx-auto mb-6 text-retro-muted opacity-20" size={64} />
            <h2 className="text-2xl font-bold uppercase tracking-tighter mb-2">{t('dash.empty_title')}</h2>
            <p className="text-retro-muted font-mono mb-8 max-w-sm mx-auto">
              {t('dash.empty_desc')}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button onClick={() => navigate('/upload')} className="flex items-center gap-2">
                <Plus size={18} /> {t('dash.quick_add_note')}
              </Button>
              <Button variant="secondary" onClick={() => setIsCreating(true)} className="flex items-center gap-2">
                <FolderPlus size={18} /> {t('dash.create_a_folder')}
              </Button>
            </div>
          </div>
        ) : courses.length === 0 ? (
          <div className="border-2 border-dashed border-retro-border p-8 text-center bg-retro-panel/20 font-mono text-sm text-retro-muted">
            {t('dash.no_folders_yet')} <button onClick={() => setIsCreating(true)} className="text-retro-accent hover:underline">
              {t('dash.create_one')}
            </button>{' '}
            {t('dash.start_org')}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {courses.map(course => (
              <Card
                key={course.id}
                onDragOver={(e: React.DragEvent) => {
                  e.preventDefault();
                  e.dataTransfer.dropEffect = 'move';
                  setDragOverCourseId(course.id);
                }}
                onDragLeave={() => setDragOverCourseId(null)}
                onDrop={(e: React.DragEvent) => {
                  e.preventDefault();
                  setDragOverCourseId(null);
                  const noteIdStr = e.dataTransfer.getData('noteId');
                  if (noteIdStr) {
                    const noteId = parseInt(noteIdStr, 10);
                    handleMoveNote(noteId, course.id);
                  }
                }}
                className={`group hover:-translate-y-2 transition-all duration-300 relative flex flex-col h-full border-2 shadow-solid hover:shadow-solid-accent cursor-pointer ${dragOverCourseId === course.id
                  ? 'border-retro-accent bg-retro-accent/10 scale-105'
                  : 'border-retro-border hover:border-retro-accent'
                  }`}
              >
                {editingId === course.id ? (
                  <form onSubmit={(e) => handleUpdate(course.id, e)} className="flex flex-col gap-3 flex-grow">
                    <input
                      className="bg-retro-bg text-retro-text border-2 border-retro-accent py-2 px-3 font-mono outline-none text-lg font-bold uppercase w-full"
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      required
                      autoFocus
                    />
                    <textarea
                      className="bg-retro-bg text-retro-text border-2 border-retro-border py-2 px-3 font-mono outline-none resize-none h-16 text-sm"
                      value={editDescription}
                      onChange={(e) => setEditDescription(e.target.value)}
                      placeholder="Description..."
                    />
                    <div className="flex gap-2 mt-auto pt-2">
                      <button
                        type="submit"
                        className="flex-1 flex items-center justify-center gap-1 bg-retro-accent text-retro-bg font-mono font-bold py-1.5 text-sm hover:opacity-80 transition-opacity"
                      >
                        <Check size={14} /> {t('dash.save')}
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditingId(null)}
                        className="flex-1 flex items-center justify-center gap-1 border-2 border-retro-border text-retro-muted font-mono text-sm hover:border-retro-text hover:text-retro-text transition-colors"
                      >
                        <X size={14} /> {t('dash.cancel')}
                      </button>
                    </div>
                  </form>
                ) : (
                  <>
                    <Link to={`/course/${course.id}`} className="absolute inset-0 z-10" />
                    <div className="flex-grow">
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="text-2xl font-bold group-hover:text-retro-accent transition-colors line-clamp-2 uppercase tracking-tighter">
                          {course.title}
                        </h3>
                      </div>
                      {course.description && (
                        <p className="text-retro-muted font-mono text-sm mb-4 line-clamp-3 leading-relaxed">
                          {course.description}
                        </p>
                      )}
                    </div>
                    <div className="mt-4 pt-4 border-t-2 border-retro-border border-dashed font-mono text-[10px] text-retro-muted flex items-center justify-between">
                      <div className="flex gap-3 items-center">
                        <span className="uppercase">{format(new Date(course.created_at), 'MMM dd, yyyy')}</span>
                        <span className="bg-retro-accent/10 text-retro-accent px-1.5 py-0.5 border border-retro-accent/30 font-bold">{course.note_count} {t('dash.notes_count')}</span>
                      </div>
                      <div className="flex gap-1 relative z-20">
                        <button
                          onClick={(e) => startEditing(course, e)}
                          className="p-1.5 hover:text-retro-accent transition-colors"
                          title="Edit"
                        >
                          <Pencil size={14} />
                        </button>
                        <button
                          onClick={(e) => handleDelete(course.id, e)}
                          className={`p-1.5 transition-colors ${deletingId === course.id ? 'text-retro-danger animate-pulse' : 'hover:text-retro-danger'}`}
                          title={deletingId === course.id ? 'Click again to confirm' : 'Delete'}
                        >
                          <Trash2 size={14} />
                        </button>
                        {deletingId === course.id && (
                          <button
                            onClick={() => setDeletingId(null)}
                            className="p-1.5 hover:text-retro-muted transition-colors"
                            title="Cancel"
                          >
                            <X size={14} />
                          </button>
                        )}
                      </div>
                    </div>
                  </>
                )}
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
