import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { Card } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import {
  Lock, Unlock, Loader2, BookOpen, ChevronDown, ChevronUp,
  X, ChevronLeft, ChevronRight, ZoomIn, Bookmark, Settings
} from 'lucide-react';
import { format } from 'date-fns';
import { useAuth } from '../context/AuthContext';
import { jwtDecode } from 'jwt-decode';
import { useLanguage } from '../context/LanguageContext';

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
}

interface Course {
  id: number;
  title: string;
  description: string;
  note_count: number;
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

const Profile: React.FC<ProfileProps> = ({ isPublic = false }) => {
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

  // Determine if the logged-in user is viewing their own profile
  let loggedInUsername = '';
  if (token) {
    try { loggedInUsername = (jwtDecode(token) as any).username || ''; } catch { }
  }
  const isOwnProfile = isAuthenticated && loggedInUsername === username;

  useEffect(() => {
    if (isPublic && username) {
      checkProfileExists();
    }
  }, [isPublic, username]);

  const getAuthHeaders = (tokenOverride?: string) => {
    const headers: any = {};
    if (tokenOverride) headers.Authorization = `Bearer ${tokenOverride}`;
    else if (token) headers.Authorization = `Bearer ${token}`;
    else if (guestToken) headers.Authorization = `Bearer ${guestToken}`;
    return headers;
  };

  const fetchPublicCourses = async (tokenOverride?: string) => {
    try {
      const res = await api.get(`/api/sharing/${username}/courses`, { headers: getAuthHeaders(tokenOverride) });
      setCourses(res.data);
    } catch {
      setError('Failed to fetch public courses.');
    }
  };

  const checkProfileExists = async () => {
    setIsLoading(true);
    try {
      const res = await api.get(`/api/sharing/${username}`);
      setProfile({
        username: res.data.username,
        display_name: res.data.display_name || null,
        bio: res.data.bio || null,
        university: res.data.university || null,
        department: res.data.department || null,
        note_count: res.data.note_count || 0,
      });
      // Try fetching public courses
      await fetchPublicCourses();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'User not found.');
    } finally {
      setIsLoading(false);
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
      alert("Note unlocked successfully!");
      if (expandedCourseId) {
        await reloadCourseNotes(expandedCourseId);
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
    if (!noteToSave || !selectedCourseId) return;
    setIsSaving(true);
    try {
      await api.post(`/api/sharing/notes/${noteToSave}/save`, { course_id: Number(selectedCourseId) });
      setSaveModalOpen(false);
      setNoteToSave(null);
      alert("Note saved successfully!");
    } catch (err) {
      console.error("Failed to save note", err);
      alert("Failed to save note.");
    } finally {
      setIsSaving(false);
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

  if (!isPublic) {
    return (
      <div className="p-8 text-center font-mono">
        <h1>{t('prof.private_title')}</h1>
        <p className="text-retro-muted mt-4">{t('prof.private_desc')}</p>
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
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end border-b-4 border-retro-border pb-6 gap-4">
          <div className="flex-1 min-w-0">
            <div className="inline-flex items-center gap-2 bg-retro-accent/10 text-retro-accent font-bold font-mono px-3 py-1 mb-4 text-xs uppercase border border-retro-accent/30 tracking-widest">
              <Unlock size={12} />
              {t('prof.read_only')}
            </div>
            <h1 className="text-5xl md:text-6xl font-bold uppercase tracking-tighter leading-none">
              {profile.display_name || profile.username}<span className="text-retro-accent">{t('prof.library')}</span>
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
          <div className="flex gap-6 flex-shrink-0 items-end">
            <div className="text-right font-mono">
              <div className="text-xs text-retro-muted uppercase tracking-tighter">{t('prof.courses')}</div>
              <div className="text-2xl font-bold text-retro-accent">{courses.length}</div>
            </div>
            {profile.note_count !== undefined && (
              <div className="text-right font-mono">
                <div className="text-xs text-retro-muted uppercase tracking-tighter">{t('prof.notes')}</div>
                <div className="text-2xl font-bold text-retro-accent">{profile.note_count}</div>
              </div>
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

        {isLoading ? (
          <div className="flex justify-center p-12">
            <Loader2 className="animate-spin text-retro-accent" size={32} />
          </div>
        ) : courses.length === 0 ? (
          <div className="border-2 border-dashed border-retro-border p-12 text-center text-retro-muted font-mono">
            <BookOpen className="mx-auto mb-4 opacity-50" size={48} />
            <p>{t('prof.no_courses')}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6">
            {courses.map(course => {
              const isExpanded = expandedCourseId === course.id;
              const notes = courseNotes[course.id];
              const isLoadingNotes = loadingCourseId === course.id;

              return (
                <Card key={course.id} className={`border-2 transition-all duration-300 ${isExpanded ? 'border-retro-accent shadow-solid-accent' : 'border-retro-border hover:border-retro-accent shadow-solid overflow-hidden'}`}>
                  {/* Course header — clickable */}
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

                  {/* Expanded notes panel */}
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
                              /* ── Locked Note: Preview + Click to Unlock ── */
                              <div
                                className="cursor-pointer group"
                                onClick={() => { setTargetUnlockNote(note); setUnlockModalOpen(true); setUnlockError(''); setShareCode(''); }}
                              >
                                <div className="flex items-start gap-4 flex-col md:flex-row">
                                  {/* Blurred placeholder image */}
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
                                    {/* Preview: first sentence only */}
                                    {note.content && (
                                      <p className="text-retro-muted font-serif text-sm leading-relaxed italic">
                                        {note.content.split('.')[0]}...
                                      </p>
                                    )}
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
                              /* ── Unlocked Note: Full content ── */
                              <div className="flex items-start gap-4 flex-col md:flex-row">
                                {/* Images */}
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
                                {/* Content */}
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
                                      <button
                                        onClick={(e) => { e.stopPropagation(); openSaveModal(note.id); }}
                                        className="flex items-center gap-2 text-xs font-bold font-mono px-3 py-1 border-2 border-retro-text text-retro-text hover:bg-retro-text hover:text-retro-bg transition-colors"
                                      >
                                        <Bookmark size={14} /> {t('prof.save')}
                                      </button>
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
              onClick={() => setSaveModalOpen(false)}
              className="absolute top-4 right-4 text-retro-muted hover:text-retro-text"
            >
              <X size={24} />
            </button>
            <h2 className="text-2xl font-bold uppercase tracking-tight mb-6">{t('prof.save_note_title')}</h2>

            {userCourses.length === 0 ? (
              <div className="text-retro-muted font-mono text-center py-4">
                {t('prof.no_save_course')}
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex flex-col w-full">
                  <label className="mb-2 text-sm font-bold text-retro-muted tracking-widest uppercase">
                    {t('prof.select_course')}
                  </label>
                  <div className="relative border-2 border-retro-border bg-retro-bg">
                    <select
                      className="w-full appearance-none bg-transparent py-3 px-4 font-mono text-retro-text outline-none focus:border-retro-accent focus:shadow-[4px_4px_0px_#FFD700] transition-all cursor-pointer"
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
                </div>

                <div className="flex justify-end gap-3 pt-4">
                  <Button
                    variant="ghost"
                    onClick={() => setSaveModalOpen(false)}
                    disabled={isSaving}
                  >
                    {t('prof.cancel')}
                  </Button>
                  <Button
                    onClick={handleSaveNote}
                    disabled={isSaving || !selectedCourseId}
                    className="flex items-center gap-2"
                  >
                    {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Bookmark size={16} />}
                    {isSaving ? t('prof.saving') : t('prof.save_to')}
                  </Button>
                </div>
              </div>
            )}
          </Card>
        </div>
      )}
    </>
  );
};

export default Profile;
