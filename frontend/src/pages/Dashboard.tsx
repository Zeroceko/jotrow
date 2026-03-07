import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { BookOpen, Plus, Loader2, Trash2, Pencil, X, Check } from 'lucide-react';
import { format } from 'date-fns';
import Onboarding from '../components/Onboarding';
import { Flame, Star } from 'lucide-react';

interface Course {
  id: number;
  title: string;
  description: string;
  created_at: string;
  note_count: number;
}

const Dashboard: React.FC = () => {
  const [courses, setCourses] = useState<Course[]>([]);
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

  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    try {
      const response = await api.get('/api/courses');
      setCourses(response.data);
    } catch (err) {
      setError('Failed to load courses.');
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
      setError('Failed to create course.');
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
      setError('Failed to update course.');
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
      setError('Failed to delete course.');
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
    <div className="p-4 md:p-8 space-y-8">
      <Onboarding />

      {/* Gamification Stats */}
      {/* Gamification Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
        <div className="bg-retro-panel border-2 border-retro-border p-4 flex items-center gap-4 shadow-solid hover:shadow-solid-accent transition-all group">
          <div className="bg-retro-accent/10 p-2 border border-retro-accent/30 text-retro-accent group-hover:scale-110 transition-transform">
            <Flame size={24} />
          </div>
          <div>
            <div className="text-[10px] text-retro-muted uppercase font-bold tracking-tighter opacity-70">STUDY STREAK</div>
            <div className="text-2xl font-bold font-mono tracking-tighter">1 DAY_</div>
          </div>
        </div>
        <div className="bg-retro-panel border-2 border-retro-border p-4 flex items-center gap-4 shadow-solid hover:shadow-solid-accent transition-all group">
          <div className="bg-retro-accent/10 p-2 border border-retro-accent/30 text-retro-accent group-hover:scale-110 transition-transform">
            <Star size={24} />
          </div>
          <div>
            <div className="text-[10px] text-retro-muted uppercase font-bold tracking-tighter opacity-70">TOTAL PRAISE</div>
            <div className="text-2xl font-bold font-mono tracking-tighter">5 PTS</div>
          </div>
        </div>
      </div>

      <div className="flex justify-between items-end border-b-2 border-retro-border pb-4">
        <div>
          <h1 className="text-4xl font-bold uppercase tracking-tighter">Your Courses<span className="text-retro-accent">_</span></h1>
          <p className="text-retro-muted font-mono mt-2">Manage and view your study materials.</p>
        </div>
        <Button onClick={() => setIsCreating(!isCreating)} className="flex items-center gap-2">
          <Plus size={18} />
          {isCreating ? 'CANCEL' : 'NEW COURSE'}
        </Button>
      </div>

      {error && (
        <div className="bg-retro-danger/20 border-2 border-retro-danger text-retro-danger p-3 font-mono text-sm flex justify-between">
          <span>ERROR: {error}</span>
          <button onClick={() => setError('')}><X size={16} /></button>
        </div>
      )}

      {isCreating && (
        <Card className="border-retro-accent shadow-solid-accent mb-8">
          <h2 className="text-xl font-bold uppercase tracking-tight mb-4">Create New Course</h2>
          <form onSubmit={handleCreateCourse} className="space-y-4">
            <Input
              label="COURSE TITLE"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="e.g. CS101 Introduction to CS"
              required
            />
            <div className="flex flex-col w-full">
              <label className="mb-2 text-sm font-bold text-retro-muted tracking-widest uppercase">
                DESCRIPTION (Optional)
              </label>
              <textarea
                className="bg-retro-bg text-retro-text border-2 border-retro-border py-3 px-4 font-mono outline-none focus:border-retro-accent focus:shadow-solid-accent resize-none h-24"
                value={newDescription}
                onChange={(e) => setNewDescription(e.target.value)}
              />
            </div>
            <div className="flex justify-end pt-2">
              <Button type="submit">CREATE_</Button>
            </div>
          </form>
        </Card>
      )}

      {courses.length === 0 && !isCreating ? (
        <div className="border-4 border-dashed border-retro-border p-16 text-center bg-retro-panel/30">
          <BookOpen className="mx-auto mb-6 text-retro-muted opacity-20" size={64} />
          <h2 className="text-2xl font-bold uppercase tracking-tighter mb-2">Your library is a blank slate</h2>
          <p className="text-retro-muted font-mono mb-8 max-w-sm mx-auto">
            Every great resource starts with a single jot. Ready to organize your knowledge?
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button onClick={() => setIsCreating(true)} className="flex items-center gap-2">
              <Plus size={18} />
              CREATE YOUR FIRST COURSE_
            </Button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {courses.map(course => (
            <Card
              key={course.id}
              className="group hover:-translate-y-2 transition-all duration-300 cursor-pointer relative flex flex-col h-full border-2 hover:border-retro-accent shadow-solid hover:shadow-solid-accent"
            >
              {editingId === course.id ? (
                /* ── Inline Edit Form ── */
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
                      <Check size={14} /> SAVE
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditingId(null)}
                      className="flex-1 flex items-center justify-center gap-1 border-2 border-retro-border text-retro-muted font-mono text-sm hover:border-retro-text hover:text-retro-text transition-colors"
                    >
                      <X size={14} /> CANCEL
                    </button>
                  </div>
                </form>
              ) : (
                /* ── Normal View ── */
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
                      <span className="bg-retro-accent/10 text-retro-accent px-1.5 py-0.5 border border-retro-accent/30 font-bold">{course.note_count} NOTES</span>
                    </div>
                    {/* Action buttons — above the z-10 Link overlay via z-20 */}
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
                        title={deletingId === course.id ? 'Click again to confirm delete' : 'Delete'}
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
  );
};

export default Dashboard;
