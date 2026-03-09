import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../services/api';
import { Card } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import {
  Lock, Unlock, Loader2, BookOpen, ChevronDown, ChevronUp,
  X, ChevronLeft, ChevronRight, ZoomIn, Bookmark, Settings, Download,
  FolderPlus, Plus, Pencil, Trash2, Check, ArrowRight, Star, FileText
} from 'lucide-react';
import { format } from 'date-fns';
import { useAuth } from '../context/AuthContext';
import { jwtDecode } from 'jwt-decode';
import { useLanguage } from '../context/LanguageContext';
import Onboarding from '../components/Onboarding';

interface ProfileProps {
  isPublic?: boolean;
}

interface UserProfile {
  id?: number;
  username: string;
  display_name: string | null;
  bio: string | null;
  university: string | null;
  department: string | null;
  note_count?: number;
  is_profile_public?: boolean;
  total_praise?: number;
}

interface Course {
  id: number;
  title: string;
  description: string;
  note_count: number;
  created_at: string;
}


interface Note {
  id: number;
  title: string;
  content: string | null;
  created_at: string;
  images: string[];
  praise_count: number;
  paps_price: number;
  is_locked: boolean;
}

const Profile: React.FC<ProfileProps> = () => {
  const { username } = useParams<{ username: string }>();
  const [profile, setProfile] = useState<UserProfile | null>(null);

  // Default we assume everything is open until they hit a locked note
  const [guestToken, setGuestToken] = useState('');

  // Note Unlocking state
  const [unlockModalOpen, setUnlockModalOpen] = useState(false);
  const [targetUnlockNote, setTargetUnlockNote] = useState<Note | null>(null);
  const [shareCode, setShareCode] = useState('');
  const [unlockError, setUnlockError] = useState('');
  const [isUnlocking, setIsUnlocking] = useState(false);

  // Content
  const [courses, setCourses] = useState<Course[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Expanded course notes
  const [expandedCourseId, setExpandedCourseId] = useState<number | null>(null);
  const [courseNotes, setCourseNotes] = useState<Record<number, Note[]>>({});
  const [loadingCourseId, setLoadingCourseId] = useState<number | null>(null);

  // Purchased notes
  const [purchasedNotes, setPurchasedNotes] = useState<Note[]>([]);

  // Dashboard CRUD state (own profile only)
  const [libraryNotes, setLibraryNotes] = useState<Note[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [movingNoteId, setMovingNoteId] = useState<number | null>(null);
  const [dragOverCourseId, setDragOverCourseId] = useState<number | null>(null);

  // Lightbox
  const [lightboxImages, setLightboxImages] = useState<string[]>([]);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  // Save Note Feature
  const { isAuthenticated, token } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [saveModalOpen, setSaveModalOpen] = useState(false);
  const [noteToSave, setNoteToSave] = useState<number | null>(null);
  const [userCourses, setUserCourses] = useState<Course[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState<number | string>('');
  const [isSaving, setIsSaving] = useState(false);
  const [downloadingNoteId, setDownloadingNoteId] = useState<number | null>(null);
  const [newFolderName, setNewFolderName] = useState('');
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);

  // Determine if the logged-in user is viewing their own profile
  let loggedInUsername = '';
  if (token) {
    try { loggedInUsername = (jwtDecode(token) as any).username || ''; } catch { }
  }
  const targetUsername = username || loggedInUsername;
  const isOwnProfile = isAuthenticated && loggedInUsername === targetUsername;

  useEffect(() => {
    if (targetUsername) {
      checkProfileExists(targetUsername);
    }
  }, [targetUsername]);

  const getAuthHeaders = (tokenOverride?: string) => {
    const headers: any = {};
    if (tokenOverride) headers.Authorization = `Bearer ${tokenOverride}`;
    else if (token) headers.Authorization = `Bearer ${token}`;
    else if (guestToken) headers.Authorization = `Bearer ${guestToken}`;
    return headers;
  };

  const fetchPublicCourses = async (targetUser: string, tokenOverride?: string) => {
    try {
      const res = await api.get(`/api/sharing/${targetUser}/courses`, { headers: getAuthHeaders(tokenOverride) });
      setCourses(res.data);
    } catch {
      setError('Failed to fetch public courses.');
    }
  };

  const fetchPurchasedNotes = async (targetUser: string, tokenOverride?: string) => {
    try {
      const res = await api.get(`/api/sharing/${targetUser}/purchases`, { headers: getAuthHeaders(tokenOverride) });
      setPurchasedNotes(res.data);
    } catch {
      console.error('Failed to fetch purchased notes.');
    }
  };

  const fetchOwnLibrary = async () => {
    try {
      const [coursesRes, notesRes] = await Promise.all([
        api.get('/api/courses'),
        api.get('/api/notes'),
      ]);
      setCourses(coursesRes.data);
      setLibraryNotes(notesRes.data);
    } catch {
      setError('Failed to load library.');
    }
  };

  const checkProfileExists = async (targetUser: string) => {
    setIsLoading(true);
    try {
      const res = await api.get(`/api/sharing/${targetUser}`);
      setProfile({
        username: res.data.username,
        display_name: res.data.display_name || null,
        bio: res.data.bio || null,
        university: res.data.university || null,
        department: res.data.department || null,
        note_count: res.data.note_count || 0,
        is_profile_public: res.data.is_profile_public ?? true,
        total_praise: res.data.total_praise || 0,
      });

      // Determine ownership after setting profile
      const ownerCheck = isAuthenticated && loggedInUsername === res.data.username;

      if (ownerCheck) {
        // Own profile: fetch from authenticated endpoints
        await fetchOwnLibrary();
      } else {
        // Visitor: fetch from public sharing endpoints
        await fetchPublicCourses(res.data.username);
      }
      // Always try to fetch purchased notes
      await fetchPurchasedNotes(res.data.username);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'User not found.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  // ── Dashboard CRUD Functions (own profile only) ──────────────────────────

  const handleCreateCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    try {
      const response = await api.post('/api/courses', {
        title: newTitle,
        description: newDescription,
      });
      setCourses(prev => [...prev, response.data]);
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

  const handleUpdateCourse = async (courseId: number, e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await api.put(`/api/courses/${courseId}`, {
        title: editTitle,
        description: editDescription,
      });
      setCourses(prev => prev.map(c => (c.id === courseId ? res.data : c)));
      setEditingId(null);
    } catch {
      setError('Failed to update folder.');
    }
  };

  const handleDeleteCourse = async (courseId: number, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (deletingId !== courseId) {
      setDeletingId(courseId);
      return;
    }
    try {
      await api.delete(`/api/courses/${courseId}`);
      setCourses(prev => prev.filter(c => c.id !== courseId));
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

  const handleUnlockNoteWidthPin = async (e: React.FormEvent) => {
    e.preventDefault();
    setUnlockError('');
    setIsUnlocking(true);
    try {
      const res = await api.post(`/api/sharing/${username}/verify`, { share_code: shareCode });
      const newToken = res.data.access_token;
      setGuestToken(newToken);
      // Reload the notes of the currently expanded course to un-mask them
      if (expandedCourseId) {
        await reloadCourseNotes(expandedCourseId, newToken);
      }
      if (isOwnProfile && profile?.username) {
        await fetchPurchasedNotes(profile.username, newToken);
      }
      setUnlockModalOpen(false);
      setTargetUnlockNote(null);
    } catch (err: any) {
      setUnlockError(err.response?.data?.detail || 'Invalid share code.');
    } finally {
      setIsUnlocking(false);
    }
  };

  const handleUnlockNoteWithPaps = async (note: Note) => {
    if (!isAuthenticated) {
      alert("Please login to pay with PAPS");
      return;
    }
    setUnlockError('');
    setIsUnlocking(true);
    try {
      await api.post(`/api/sharing/notes/${note.id}/unlock`, { method: 'paps' });
      alert("Not başarıyla satın alındı ve kilidi açıldı!");
      if (expandedCourseId) {
        await reloadCourseNotes(expandedCourseId);
      }
      if (isOwnProfile && profile?.username) {
        await fetchPurchasedNotes(profile.username);
      }
      setUnlockModalOpen(false);
      setTargetUnlockNote(null);
    } catch (err: any) {
      if (err.response?.status === 400 && err.response?.data?.detail === "Insufficient PAPS balance") {
        alert("You don't have enough PAPS!");
      } else {
        const detail = err.response?.data?.detail;
        setUnlockError(typeof detail === 'string' ? detail : JSON.stringify(detail) || 'Error paying with PAPS.');
      }
    } finally {
      setIsUnlocking(false);
    }
  };

  const reloadCourseNotes = async (courseId: number, tkn?: string) => {
    const res = await api.get(`/api/sharing/${username}/courses/${courseId}/notes`, { headers: getAuthHeaders(tkn) });
    setCourseNotes(prev => ({ ...prev, [courseId]: res.data }));
  };

  const toggleCourseNotes = async (courseId: number) => {
    if (expandedCourseId === courseId) {
      setExpandedCourseId(null);
      return;
    }
    setExpandedCourseId(courseId);
    if (courseNotes[courseId]) return; // already fetched

    setLoadingCourseId(courseId);
    try {
      const res = await api.get(`/api/sharing/${username}/courses/${courseId}/notes`, {
        headers: getAuthHeaders(),
      });
      setCourseNotes(prev => ({ ...prev, [courseId]: res.data }));
    } catch {
      setCourseNotes(prev => ({ ...prev, [courseId]: [] }));
    } finally {
      setLoadingCourseId(null);
    }
  };

  const handlePraise = async (courseId: number, noteId: number) => {
    try {
      await api.post(`/api/sharing/notes/${noteId}/praise`);
      setCourseNotes(prev => {
        const courseNotesList = prev[courseId] || [];
        const updatedNotes = courseNotesList.map(note =>
          note.id === noteId ? { ...note, praise_count: (note.praise_count || 0) + 1 } : note
        );
        return { ...prev, [courseId]: updatedNotes };
      });
      setProfile(prev => prev ? { ...prev, total_praise: (prev.total_praise || 0) + 1 } : prev);

    } catch (error) {
      console.error("Failed to praise note", error);
    }
  };

  const openSaveModal = async (noteId: number) => {
    setNoteToSave(noteId);
    setSaveModalOpen(true);
    if (userCourses.length === 0 && isAuthenticated) {
      try {
        const res = await api.get('/api/courses');
        setUserCourses(res.data);
        if (res.data.length > 0) setSelectedCourseId(res.data[0].id);
      } catch (err) {
        console.error("Failed to fetch user courses", err);
      }
    }
  };

  const handleSaveNote = async () => {
    if (!noteToSave) return;
    setIsSaving(true);
    try {
      const body: any = {};
      if (selectedCourseId && selectedCourseId !== 'root') {
        body.course_id = Number(selectedCourseId);
      }
      await api.post(`/api/sharing/notes/${noteToSave}/save`, body);
      setSaveModalOpen(false);
      setNoteToSave(null);
      alert("Not başarıyla kaydedildi!");
    } catch (err) {
      console.error("Failed to save note", err);
      alert("Not kaydedilemedi.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleCreateFolderAndSave = async () => {
    if (!noteToSave || !newFolderName.trim()) return;
    setIsCreatingFolder(true);
    try {
      const courseRes = await api.post('/api/courses', { title: newFolderName.trim(), description: '' });
      const newCourseId = courseRes.data.id;
      await api.post(`/api/sharing/notes/${noteToSave}/save`, { course_id: newCourseId });
      setSaveModalOpen(false);
      setNoteToSave(null);
      setNewFolderName('');
      alert("Yeni klasör oluşturuldu ve not kaydedildi!");
    } catch (err) {
      console.error("Failed to create folder and save", err);
      alert("Klasör oluşturulamadı.");
    } finally {
      setIsCreatingFolder(false);
    }
  };

  const handleDownloadNote = async (noteId: number) => {
    setDownloadingNoteId(noteId);
    try {
      const res = await api.get(`/api/sharing/notes/${noteId}/download`, {
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      const disposition = res.headers['content-disposition'];
      const filename = disposition?.match(/filename="(.+)"/)?.[1] || 'note.zip';
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Download failed', err);
      alert('İndirme başarısız oldu.');
    } finally {
      setDownloadingNoteId(null);
    }
  };

  // ── Lightbox ─────────────────────────────────────────────────────────────

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
    if (!lightboxImages.length) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeLightbox();
      if (e.key === 'ArrowLeft') prevImage();
      if (e.key === 'ArrowRight') nextImage();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [lightboxImages.length, closeLightbox, prevImage, nextImage]);

  // ─────────────────────────────────────────────────────────────────────────

  if (!isOwnProfile && profile?.is_profile_public === false) {
    return (
      <div className="p-8 text-center font-mono max-w-lg mx-auto min-h-[60vh] flex flex-col items-center justify-center">
        <Lock size={64} className="text-retro-muted mb-6" />
        <h1 className="text-3xl uppercase tracking-widest font-bold">Bu profil gizlidir</h1>
        <p className="text-retro-muted mt-4 text-sm">
          Bu kullanıcının okul bilgileri ve kütüphanesi gizli tutulmaktadır.
        </p>
      </div>
    );
  }

  if (isLoading && !profile) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="animate-spin text-retro-accent" size={32} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] p-4">
        <div className="border-2 border-dashed border-retro-danger p-12 text-center text-retro-danger font-mono w-full max-w-lg">
          <h2 className="text-2xl font-bold mb-4 uppercase">{t('prof.sys_error')}</h2>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  if (!profile) return null;

  // ── Unlocked Public View ──────────────────────────────────────────────────

  return (
    <>
      {/* Lightbox */}
      {lightboxImages.length > 0 && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center"
          onClick={closeLightbox}
        >
          <button className="absolute top-4 right-4 text-white/70 hover:text-white" onClick={closeLightbox}>
            <X size={32} />
          </button>
          {lightboxImages.length > 1 && (
            <button className="absolute left-4 text-white/70 hover:text-white p-2"
              onClick={(e) => { e.stopPropagation(); prevImage(); }}>
              <ChevronLeft size={40} />
            </button>
          )}
          <img
            src={lightboxImages[lightboxIndex]}
            alt="lightbox"
            className="max-h-[90vh] max-w-[90vw] object-contain border-2 border-retro-border shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          />
          {lightboxImages.length > 1 && (
            <button className="absolute right-4 text-white/70 hover:text-white p-2"
              onClick={(e) => { e.stopPropagation(); nextImage(); }}>
              <ChevronRight size={40} />
            </button>
          )}
          {lightboxImages.length > 1 && (
            <div className="absolute bottom-4 text-white/60 font-mono text-sm">
              {lightboxIndex + 1} / {lightboxImages.length}
            </div>
          )}
        </div>
      )}

      <div className="p-4 md:p-8 space-y-8 animate-in fade-in duration-500">
        {isOwnProfile && <Onboarding />}

        {/* Stats bar */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <div className="bg-retro-panel border-2 border-retro-border p-4 flex items-center gap-4 shadow-solid">
            <div className="bg-retro-accent/10 p-2 border border-retro-accent/30 text-retro-accent">
              <FileText size={22} />
            </div>
            <div>
              <div className="text-[10px] text-retro-muted uppercase font-bold tracking-tighter opacity-70">{t('dash.total_notes')}</div>
              <div className="text-2xl font-bold font-mono tracking-tighter">{(profile.note_count || 0) + libraryNotes.length}_</div>
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
                {profile.total_praise || 0}_
              </div>
            </div>
          </div>
        </div>

        {/* Profile Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end border-b-4 border-retro-border pb-6 gap-4">
          <div className="flex-1 min-w-0">
            {!isOwnProfile && (
              <div className="inline-flex items-center gap-2 bg-retro-accent/10 text-retro-accent font-bold font-mono px-3 py-1 mb-4 text-xs uppercase border border-retro-accent/30 tracking-widest">
                <Unlock size={12} />
                {t('prof.read_only')}
              </div>
            )}
            <h1 className="text-5xl md:text-6xl font-bold uppercase tracking-tighter leading-none">
              {profile.display_name || profile.username}<span className="text-retro-accent">_</span>
            </h1>
            {profile.display_name && (
              <p className="text-retro-muted font-mono text-sm mt-1">@{profile.username}</p>
            )}
            {(profile.university || profile.department) && (
              <p className="text-retro-muted font-mono text-xs mt-2 flex items-center gap-1">
                🎓 {[profile.university, profile.department].filter(Boolean).join(' · ')}
              </p>
            )}
            {profile.bio && (
              <p className="text-retro-muted font-mono text-sm mt-3 max-w-lg leading-relaxed italic border-l-2 border-retro-accent pl-3">
                {profile.bio}
              </p>
            )}
          </div>
          <div className="flex gap-4 flex-shrink-0 items-end">
            {isOwnProfile && (
              <>
                <Button
                  variant="secondary"
                  onClick={() => setIsCreating(!isCreating)}
                  className="flex items-center gap-2 px-4 py-2 border-2 border-retro-accent text-retro-accent hover:bg-retro-accent hover:text-retro-bg font-bold tracking-widest uppercase transition-colors"
                >
                  <FolderPlus size={16} />
                  {isCreating ? t('dash.cancel') : t('dash.new_folder')}
                </Button>
                <Button
                  onClick={() => navigate('/upload')}
                  className="flex items-center gap-2 px-4 py-2 bg-retro-accent text-retro-bg font-bold tracking-widest uppercase hover:opacity-90 shadow-solid-accent transition-all"
                >
                  <Plus size={16} />
                  {t('nav.upload')}
                </Button>
              </>
            )}
            {isOwnProfile && (
              <Button
                variant="ghost"
                onClick={() => navigate('/settings')}
                className="flex items-center gap-2 border-2 border-retro-border hover:border-retro-accent"
              >
                <Settings size={16} />
                <span className="font-mono text-sm">{t('profile.settings')}</span>
              </Button>
            )}
          </div>
        </div>

        {/* Create folder inline form (own profile only) */}
        {isOwnProfile && isCreating && (
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

        {/* ── INBOX: Uncategorized Notes (own profile only) ───── */}
        {isOwnProfile && libraryNotes.length > 0 && (
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

        {isLoading ? (
          <div className="flex justify-center p-12">
            <Loader2 className="animate-spin text-retro-accent" size={32} />
          </div>
        ) : (
          <>
            {/* ── FOLDERS / COURSES ────────────────────────────── */}
            <div>
              <h2 className="text-xl font-bold uppercase tracking-tighter font-mono mb-4">
                🗂️ {t('dash.folders')}
                {courses.length > 0 && (
                  <span className="ml-3 bg-retro-accent/10 text-retro-accent px-2 py-0.5 border border-retro-accent/30 font-mono text-xs font-bold">
                    {courses.length}
                  </span>
                )}
              </h2>

              {courses.length === 0 ? (
                isOwnProfile ? (
                  <div className="border-2 border-dashed border-retro-border p-8 text-center bg-retro-panel/20 font-mono text-sm text-retro-muted">
                    {t('dash.no_folders_yet')}{' '}
                    <button onClick={() => setIsCreating(true)} className="text-retro-accent hover:underline">
                      {t('dash.create_one')}
                    </button>{' '}
                    {t('dash.start_org')}
                  </div>
                ) : (
                  <div className="border-2 border-dashed border-retro-border p-12 text-center text-retro-muted font-mono">
                    <BookOpen className="mx-auto mb-4 opacity-50" size={48} />
                    <p>{t('prof.no_courses')}</p>
                  </div>
                )
              ) : isOwnProfile ? (
                /* Own profile: folder cards with edit/delete, click to go to course page */
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
                          handleMoveNote(parseInt(noteIdStr, 10), course.id);
                        }
                      }}
                      className={`group hover:-translate-y-2 transition-all duration-300 relative flex flex-col h-full border-2 shadow-solid hover:shadow-solid-accent cursor-pointer ${dragOverCourseId === course.id
                        ? 'border-retro-accent bg-retro-accent/10 scale-105'
                        : 'border-retro-border hover:border-retro-accent'
                        }`}
                    >
                      {editingId === course.id ? (
                        <form onSubmit={(e) => handleUpdateCourse(course.id, e)} className="flex flex-col gap-3 flex-grow">
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
                            <h3 className="text-2xl font-bold group-hover:text-retro-accent transition-colors line-clamp-2 uppercase tracking-tighter">
                              {course.title}
                            </h3>
                            {course.description && (
                              <p className="text-retro-muted font-mono text-sm mb-4 line-clamp-3 leading-relaxed mt-2">
                                {course.description}
                              </p>
                            )}
                          </div>
                          <div className="mt-4 pt-4 border-t-2 border-retro-border border-dashed font-mono text-[10px] text-retro-muted flex items-center justify-between">
                            <div className="flex gap-3 items-center">
                              {course.created_at && (
                                <span className="uppercase">{format(new Date(course.created_at), 'MMM dd, yyyy')}</span>
                              )}
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
                                onClick={(e) => handleDeleteCourse(course.id, e)}
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
              ) : (
                /* Visitor: expandable course cards */
                <div className="grid grid-cols-1 gap-6">
                  {courses.map(course => {
                    const isExpanded = expandedCourseId === course.id;
                    const notes = courseNotes[course.id];
                    const isLoadingNotes = loadingCourseId === course.id;

                    return (
                      <Card key={course.id} className={`border-2 transition-all duration-300 ${isExpanded ? 'border-retro-accent shadow-solid-accent' : 'border-retro-border hover:border-retro-accent shadow-solid overflow-hidden'}`}>
                        <button
                          className="w-full flex items-center justify-between gap-4 text-left group"
                          onClick={() => toggleCourseNotes(course.id)}
                        >
                          <div className="flex-grow min-w-0">
                            <div className="flex items-center gap-3">
                              <h3 className="text-xl font-bold uppercase group-hover:text-retro-accent transition-colors truncate">
                                {course.title}
                              </h3>
                              <span className="bg-retro-border/50 text-retro-text text-xs px-2 py-0.5 font-mono">
                                {course.note_count} {t('prof.notes')}
                              </span>
                            </div>
                            {course.description && (
                              <p className="text-retro-muted font-mono text-sm truncate">{course.description}</p>
                            )}
                          </div>
                          <div className="flex-shrink-0 text-retro-muted group-hover:text-retro-accent transition-colors">
                            {isLoadingNotes ? (
                              <Loader2 size={20} className="animate-spin" />
                            ) : isExpanded ? (
                              <ChevronUp size={20} />
                            ) : (
                              <ChevronDown size={20} />
                            )}
                          </div>
                        </button>

                        {isExpanded && (
                          <div className="mt-4 pt-4 border-t-2 border-dashed border-retro-border space-y-6">
                            {isLoadingNotes ? (
                              <div className="flex justify-center py-6">
                                <Loader2 className="animate-spin text-retro-accent" size={24} />
                              </div>
                            ) : !notes || notes.length === 0 ? (
                              <p className="text-retro-muted font-mono text-sm text-center py-4">
                                {t('prof.no_notes')}
                              </p>
                            ) : (
                              notes.map(note => (
                                <div key={note.id} className={`border-l-2 ${note.is_locked ? 'border-retro-danger/50' : 'border-retro-accent'} pl-4`}>
                                  {note.is_locked ? (
                                    <div
                                      className="cursor-pointer group"
                                      onClick={() => { setTargetUnlockNote(note); setUnlockModalOpen(true); setUnlockError(''); setShareCode(''); }}
                                    >
                                      <div className="flex items-start gap-4 flex-col md:flex-row">
                                        <div className="md:w-40 flex-shrink-0">
                                          <div className="w-16 h-16 bg-retro-border/30 border-2 border-retro-border flex items-center justify-center">
                                            <Lock size={20} className="text-retro-danger/60" />
                                          </div>
                                        </div>
                                        <div className="flex-1 min-w-0">
                                          <div className="flex items-center gap-2 mb-1">
                                            <Lock size={14} className="text-retro-danger" />
                                            <h4 className="font-bold uppercase text-base">{note.title}</h4>
                                          </div>
                                          <div className="text-retro-muted font-mono text-xs mb-2">
                                            {format(new Date(note.created_at), 'MMM dd, yyyy')}
                                          </div>
                                          <div className="mt-3 flex items-center gap-2">
                                            <span className="inline-flex items-center gap-1 px-3 py-1 bg-retro-accent/10 border border-retro-accent/30 text-retro-accent font-mono text-xs font-bold group-hover:bg-retro-accent group-hover:text-retro-bg transition-colors">
                                              <Unlock size={12} />
                                              {note.paps_price > 0 ? `${note.paps_price} PAPS ile Aç` : 'PIN ile Aç'}
                                            </span>
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                  ) : (
                                    <div className="flex items-start gap-4 flex-col md:flex-row">
                                      {note.images && note.images.length > 0 && (
                                        <div className="flex gap-2 flex-wrap md:w-40 flex-shrink-0">
                                          {note.images.map((img, idx) => (
                                            <div
                                              key={idx}
                                              className="w-16 h-16 bg-retro-bg border-2 border-retro-border overflow-hidden cursor-zoom-in group relative"
                                              onClick={() => openLightbox(note.images, idx)}
                                            >
                                              <img src={img} alt="" className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
                                              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 bg-black/30 transition-opacity">
                                                <ZoomIn size={14} className="text-white" />
                                              </div>
                                            </div>
                                          ))}
                                        </div>
                                      )}
                                      <div className="flex-1 min-w-0 flex flex-col justify-between">
                                        <div>
                                          <h4 className="font-bold uppercase text-base mb-1">{note.title}</h4>
                                          <div className="text-retro-muted font-mono text-xs mb-2">
                                            {format(new Date(note.created_at), 'MMM dd, yyyy')}
                                          </div>
                                          {note.content && (
                                            <p className="text-retro-text font-serif text-sm leading-relaxed whitespace-pre-wrap line-clamp-6">
                                              {note.content}
                                            </p>
                                          )}
                                        </div>
                                        <div className="mt-4 flex justify-end gap-2">
                                          {isAuthenticated && (
                                            <>
                                              <button
                                                onClick={(e) => { e.stopPropagation(); openSaveModal(note.id); }}
                                                className="flex items-center gap-2 text-xs font-bold font-mono px-3 py-1 border-2 border-retro-text text-retro-text hover:bg-retro-text hover:text-retro-bg transition-colors"
                                              >
                                                <Bookmark size={14} /> {t('prof.save')}
                                              </button>
                                              <button
                                                onClick={(e) => { e.stopPropagation(); handleDownloadNote(note.id); }}
                                                disabled={downloadingNoteId === note.id}
                                                className="flex items-center gap-2 text-xs font-bold font-mono px-3 py-1 border-2 border-retro-text text-retro-text hover:bg-retro-text hover:text-retro-bg transition-colors disabled:opacity-50"
                                              >
                                                {downloadingNoteId === note.id ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />} İndir
                                              </button>
                                            </>
                                          )}
                                          <button
                                            onClick={(e) => { e.stopPropagation(); handlePraise(course.id, note.id); }}
                                            className="flex items-center gap-2 text-xs font-bold font-mono px-3 py-1 border-2 border-retro-accent text-retro-accent hover:bg-retro-accent hover:text-retro-bg transition-colors"
                                          >
                                            <span>🙌</span> {t('prof.praise')} {note.praise_count > 0 && `(${note.praise_count})`}
                                          </button>
                                        </div>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              ))
                            )}
                          </div>
                        )}
                      </Card>
                    );
                  })}
                </div>
              )}
            </div>

            {/* ── SATIN ALDIKLARIM (Purchased Notes) ────────────── */}
            {purchasedNotes.length > 0 && (
              <div>
                <h2 className="text-xl font-bold uppercase tracking-tighter font-mono mb-4">
                  🛒 Satın Aldıklarım
                  <span className="ml-3 bg-retro-accent/10 text-retro-accent px-2 py-0.5 border border-retro-accent/30 font-mono text-xs font-bold">
                    {purchasedNotes.length}
                  </span>
                </h2>
                <div className="grid grid-cols-1 gap-6">
                  {purchasedNotes.map(note => (
                    <Card key={`purchased-${note.id}`} className="border-2 border-retro-accent shadow-solid-accent overflow-hidden p-6 space-y-6">
                      {note.is_locked ? (
                        <div
                          className="cursor-pointer group"
                          onClick={() => { setTargetUnlockNote(note); setUnlockModalOpen(true); setUnlockError(''); setShareCode(''); }}
                        >
                          <div className="flex items-start gap-4 flex-col md:flex-row">
                            <div className="md:w-40 flex-shrink-0">
                              <div className="w-16 h-16 bg-retro-border/30 border-2 border-retro-border flex items-center justify-center">
                                <Lock size={20} className="text-retro-danger/60" />
                              </div>
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex justify-between items-start gap-4">
                                <div className="flex items-center gap-2 mb-1">
                                  <Lock size={14} className="text-retro-danger" />
                                  <h4 className="font-bold uppercase text-base">{note.title}</h4>
                                </div>
                                <span className="hidden md:inline-block bg-retro-accent/20 text-retro-accent text-xs px-2 py-0.5 border border-retro-accent/50 font-mono">Satın Alınan</span>
                              </div>
                              <div className="text-retro-muted font-mono text-xs mb-2">
                                {format(new Date(note.created_at), 'MMM dd, yyyy')} • Not Sahibi:
                                {(note as any).owner_username ? (
                                  <a href={`/u/${(note as any).owner_username}`} onClick={(e) => e.stopPropagation()} className="hover:text-retro-accent underline text-retro-text ml-1">
                                    @{(note as any).owner_username}
                                  </a>
                                ) : (
                                  <span className="ml-1">Bilinmiyor</span>
                                )}
                              </div>
                              <div className="mt-3 flex items-center gap-2">
                                <span className="inline-flex items-center gap-1 px-3 py-1 bg-retro-accent/10 border border-retro-accent/30 text-retro-accent font-mono text-xs font-bold group-hover:bg-retro-accent group-hover:text-retro-bg transition-colors">
                                  <Unlock size={12} />
                                  {note.paps_price > 0 ? `${note.paps_price} PAPS ile Aç` : 'PIN ile Aç'}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-start gap-4 flex-col md:flex-row">
                          {note.images && note.images.length > 0 && (
                            <div className="flex gap-2 flex-wrap md:w-40 flex-shrink-0">
                              {note.images.map((img, idx) => (
                                <div
                                  key={idx}
                                  className="w-16 h-16 bg-retro-bg border-2 border-retro-border overflow-hidden cursor-zoom-in group relative"
                                  onClick={() => openLightbox(note.images, idx)}
                                >
                                  <img src={img} alt="" className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
                                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 bg-black/30 transition-opacity">
                                    <ZoomIn size={14} className="text-white" />
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                          <div className="flex-1 min-w-0 flex flex-col justify-between">
                            <div>
                              <div className="flex justify-between items-start gap-4">
                                <h4 className="font-bold uppercase text-xl mb-1">{note.title}</h4>
                                <span className="bg-retro-accent/20 text-retro-accent text-xs px-2 py-0.5 border border-retro-accent/50 font-mono">Satın Alınan</span>
                              </div>
                              <div className="text-retro-muted font-mono text-xs mb-4">
                                {format(new Date(note.created_at), 'MMM dd, yyyy')} • Not Sahibi:
                                {(note as any).owner_username ? (
                                  <a href={`/u/${(note as any).owner_username}`} onClick={(e) => e.stopPropagation()} className="hover:text-retro-accent underline text-retro-text ml-1">
                                    @{(note as any).owner_username}
                                  </a>
                                ) : (
                                  <span className="ml-1">Bilinmiyor</span>
                                )}
                              </div>
                              {note.content && (
                                <p className="text-retro-text font-serif text-sm leading-relaxed whitespace-pre-wrap">
                                  {note.content}
                                </p>
                              )}
                            </div>
                            <div className="mt-4 flex justify-end gap-2">
                              <button
                                onClick={(e) => { e.stopPropagation(); handleDownloadNote(note.id); }}
                                disabled={downloadingNoteId === note.id}
                                className="flex items-center gap-2 text-xs font-bold font-mono px-3 py-1 border-2 border-retro-text text-retro-text hover:bg-retro-text hover:text-retro-bg transition-colors disabled:opacity-50"
                              >
                                {downloadingNoteId === note.id ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />} İndir
                              </button>
                            </div>
                          </div>
                        </div>
                      )}
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </>
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
                <form onSubmit={handleUnlockNoteWidthPin} className="space-y-3">
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

      {/* Save Note Modal */}
      {saveModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <Card className="max-w-md w-full border-retro-accent shadow-solid-accent relative">
            <button
              onClick={() => { setSaveModalOpen(false); setNewFolderName(''); }}
              className="absolute top-4 right-4 text-retro-muted hover:text-retro-text"
            >
              <X size={24} />
            </button>
            <h2 className="text-2xl font-bold uppercase tracking-tight mb-6">Notu Kaydet</h2>

            <div className="space-y-4">
              {/* Option 1: Save to existing folder */}
              {userCourses.length > 0 && (
                <div className="flex flex-col w-full">
                  <label className="mb-2 text-sm font-bold text-retro-muted tracking-widest uppercase">
                    Mevcut Klasöre Kaydet
                  </label>
                  <div className="relative border-2 border-retro-border bg-retro-bg">
                    <select
                      className="w-full appearance-none bg-transparent py-3 px-4 font-mono text-retro-text outline-none focus:border-retro-accent transition-all cursor-pointer"
                      value={selectedCourseId}
                      onChange={(e) => setSelectedCourseId(e.target.value)}
                    >
                      {userCourses.map(c => (
                        <option key={c.id} value={c.id}>
                          {c.title}
                        </option>
                      ))}
                    </select>
                    <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none text-retro-muted">
                      <ChevronDown size={20} />
                    </div>
                  </div>
                  <Button
                    onClick={handleSaveNote}
                    disabled={isSaving || !selectedCourseId}
                    className="mt-2 w-full flex items-center justify-center gap-2"
                  >
                    {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Bookmark size={16} />}
                    Klasöre Kaydet
                  </Button>
                </div>
              )}

              {/* Divider */}
              <div className="flex items-center gap-3">
                <div className="flex-1 h-px bg-retro-border" />
                <span className="text-retro-muted text-xs font-mono">VEYA</span>
                <div className="flex-1 h-px bg-retro-border" />
              </div>

              {/* Option 2: Save to root (no folder) */}
              <Button
                variant="ghost"
                onClick={() => { setSelectedCourseId('root'); handleSaveNote(); }}
                disabled={isSaving}
                className="w-full border-2 border-retro-border flex items-center justify-center gap-2"
              >
                <Bookmark size={16} /> Klasörsüz Kaydet (Kütüphaneme)
              </Button>

              {/* Divider */}
              <div className="flex items-center gap-3">
                <div className="flex-1 h-px bg-retro-border" />
                <span className="text-retro-muted text-xs font-mono">VEYA</span>
                <div className="flex-1 h-px bg-retro-border" />
              </div>

              {/* Option 3: Create new folder and save */}
              <div className="flex flex-col w-full">
                <label className="mb-2 text-sm font-bold text-retro-muted tracking-widest uppercase">
                  Yeni Klasör Oluştur ve Kaydet
                </label>
                <input
                  type="text"
                  value={newFolderName}
                  onChange={(e) => setNewFolderName(e.target.value)}
                  placeholder="Klasör adı..."
                  className="w-full py-3 px-4 font-mono text-retro-text bg-retro-bg border-2 border-retro-border outline-none focus:border-retro-accent transition-all"
                />
                <Button
                  onClick={handleCreateFolderAndSave}
                  disabled={isCreatingFolder || !newFolderName.trim()}
                  className="mt-2 w-full flex items-center justify-center gap-2"
                >
                  {isCreatingFolder ? <Loader2 size={16} className="animate-spin" /> : <BookOpen size={16} />}
                  Oluştur ve Kaydet
                </Button>
              </div>

              {/* Cancel */}
              <div className="flex justify-end pt-2">
                <Button
                  variant="ghost"
                  onClick={() => { setSaveModalOpen(false); setNewFolderName(''); }}
                >
                  İptal
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}
    </>
  );
};

export default Profile;
