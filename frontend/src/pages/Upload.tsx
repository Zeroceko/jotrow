import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import api from '../services/api';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Upload as UploadIcon, X, ArrowLeft, FileText } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

interface Course {
  id: number;
  title: string;
}

interface UploadSuccessState {
  noteId: number;
  destination: string;
}

const Upload: React.FC = () => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<string>('');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [papsPrice, setPapsPrice] = useState<number>(0);
  const [requiresPin, setRequiresPin] = useState<boolean>(false);
  const [files, setFiles] = useState<File[]>([]);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [dragActive, setDragActive] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState<UploadSuccessState | null>(null);

  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useLanguage();

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const response = await api.get('/api/courses');
        setCourses(response.data);

        // Auto-select course if passed in URL
        const params = new URLSearchParams(location.search);
        const courseId = params.get('courseId');
        if (courseId) {
          setSelectedCourse(courseId);
        }
        // Default is empty (library root) unless a courseId is in the URL
      } catch (err) {
        setError('Failed to load courses.');
      }
    };
    fetchCourses();
  }, [location]);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFiles = Array.from(e.dataTransfer.files);
      setFiles(prev => [...prev, ...droppedFiles]);
    }
  }, []);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selectedFiles = Array.from(e.target.files);
      setFiles(prev => [...prev, ...selectedFiles]);
    }
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title) return;

    setError('');
    setIsLoading(true);

    try {
      const formData = new FormData();
      if (selectedCourse) {
        formData.append('course_id', selectedCourse);
      }
      formData.append('title', title);
      formData.append('content', content);
      formData.append('paps_price', papsPrice.toString());
      formData.append('requires_pin', requiresPin.toString());

      files.forEach(file => {
        formData.append('files', file);
      });

      const response = await api.post('/api/notes', formData);
      setUploadSuccess({
        noteId: response.data.note_id,
        destination: selectedCourse ? `/course/${selectedCourse}` : '/profile',
      });
    } catch (err: any) {
      console.log("API ERROR RESPONSE:", err.response);
      const detail = err.response?.data?.detail;
      if (typeof detail === 'string') {
        setError(detail);
      } else if (Array.isArray(detail)) {
        setError(detail.map(d => `${d.loc?.[d.loc?.length - 1] || 'Field'}: ${d.msg || 'Validation error'}`).join(', '));
      } else if (typeof detail === 'object' && detail !== null) {
        setError(JSON.stringify(detail));
      } else {
        setError('Failed to upload note.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handlePostUploadChoice = (shouldRefineNow: boolean) => {
    if (!uploadSuccess) return;

    navigate(uploadSuccess.destination, {
      state: {
        focusNoteId: uploadSuccess.noteId,
        startPrototypeCleanNoteId: shouldRefineNow ? uploadSuccess.noteId : null,
      },
    });
  };

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto">
      <div className="mb-8">
        <Link to="/" className="inline-flex items-center gap-2 text-retro-muted hover:text-retro-text hover:-translate-x-1 transition-transform font-mono text-sm mb-4">
          <ArrowLeft size={16} /> {t('upload.return')}
        </Link>
        <h1 className="text-3xl font-bold uppercase tracking-tighter sm:text-4xl">{t('upload.page_title')}<span className="text-retro-accent">_</span></h1>
      </div>

      <Card>
        {error && (
          <div className="bg-retro-danger/20 border-2 border-retro-danger text-retro-danger p-3 mb-6 font-mono text-sm">
            ERROR: {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="flex flex-col w-full">
            <label className="mb-2 text-sm font-bold text-retro-muted tracking-widest uppercase">
              {t('upload.select_course')}
            </label>
            <select
              className="bg-retro-bg text-retro-text border-2 border-retro-border py-3 px-4 font-mono outline-none focus:border-retro-accent focus:shadow-solid-accent appearance-none cursor-pointer"
              value={selectedCourse}
              onChange={(e) => setSelectedCourse(e.target.value)}
            >
              <option value="">{t('upload.no_folder')}</option>
              {courses.map(course => (
                <option key={course.id} value={course.id}>📁 {course.title}</option>
              ))}
            </select>
          </div>

          <Input
            label={t('upload.note_title')}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            placeholder={t('upload.title_placeholder')}
          />

          <div className="flex flex-col w-full">
            <label className="mb-2 text-sm font-bold text-retro-muted tracking-widest uppercase">
              PAPS Price (0 = Free)
            </label>
            <input
              type="number"
              min="0"
              className="bg-retro-bg text-retro-text border-2 border-retro-border py-3 px-4 font-mono outline-none focus:border-retro-accent focus:shadow-solid-accent"
              value={papsPrice}
              onChange={(e) => setPapsPrice(Number(e.target.value))}
              placeholder="0"
            />
          </div>

          <div className="flex items-start gap-3">
            <input
              type="checkbox"
              id="requiresPin"
              className="w-5 h-5 appearance-none border-2 border-retro-border checked:bg-retro-accent checked:border-retro-accent outline-none cursor-pointer transition-colors relative 
              checked:after:content-[''] checked:after:absolute checked:after:left-[5px] checked:after:top-[1px] checked:after:w-2 checked:after:h-3 
              checked:after:border-r-2 checked:after:border-b-2 checked:after:border-retro-bg checked:after:rotate-45"
              checked={requiresPin}
              onChange={(e) => setRequiresPin(e.target.checked)}
            />
            <label htmlFor="requiresPin" className="text-sm font-bold text-retro-text cursor-pointer select-none leading-snug">
              Require PIN Code / Sadece PIN ile Açılsın
            </label>
          </div>

          <div className="flex flex-col w-full">
            <label className="mb-2 text-sm font-bold text-retro-muted tracking-widest uppercase">
              {t('upload.content')}
            </label>
            <textarea
              className="bg-retro-bg text-retro-text border-2 border-retro-border py-3 px-4 font-mono outline-none focus:border-retro-accent focus:shadow-solid-accent min-h-[150px] resize-y"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder={t('upload.content_placeholder')}
            />
          </div>

          <div className="flex flex-col w-full">
            <label className="mb-2 text-sm font-bold text-retro-muted tracking-widest uppercase">
              {t('upload.attach_images')}
            </label>
            <div
              className={`border-2 border-dashed p-8 text-center transition-colors relative
                ${dragActive ? 'border-retro-accent bg-retro-accent/10' : 'border-retro-border bg-retro-bg'}
              `}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              <input
                type="file"
                multiple
                accept="image/*,.heic,.heif"
                onChange={handleFileInput}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              <UploadIcon className="mx-auto mb-4 text-retro-muted" size={48} />
              <p className="font-mono text-sm text-retro-muted">
                {t('upload.drag_drop')}
              </p>
            </div>
          </div>

          {files.length > 0 && (
            <div className="grid grid-cols-2 gap-4 mt-4 sm:grid-cols-3 md:grid-cols-4">
              {files.map((file, idx) => {
                const isPreviewable = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'].includes(file.type);
                return (
                  <div key={idx} className="relative group aspect-square border-2 border-retro-border overflow-hidden p-1 bg-retro-bg flex flex-col items-center justify-center">
                    {isPreviewable ? (
                      <img
                        src={URL.createObjectURL(file)}
                        alt="preview"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="flex flex-col items-center justify-center h-full w-full bg-retro-panel p-2">
                        <UploadIcon size={24} className="text-retro-muted mb-2" />
                        <span className="text-[10px] font-mono text-retro-text break-all text-center leading-tight">
                          {file.name}
                        </span>
                      </div>
                    )}
                    <button
                      type="button"
                      onClick={() => removeFile(idx)}
                      className="absolute top-2 right-2 p-1 bg-retro-danger text-white hover:scale-110 transition-transform z-10"
                    >
                      <X size={16} />
                    </button>
                    {isPreviewable && (
                      <div className="absolute bottom-0 inset-x-0 bg-black/80 px-2 py-1 text-[10px] font-mono truncate text-white">
                        {file.name}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          <div className="border-2 border-dashed border-retro-accent/40 bg-retro-accent/5 p-4 sm:p-5">
            <div className="flex items-start gap-4">
              <div className="bg-retro-accent/10 border border-retro-accent/30 text-retro-accent p-2 shrink-0">
                <FileText size={18} />
              </div>
              <div className="min-w-0">
                <div className="text-[10px] font-bold text-retro-accent uppercase tracking-[0.2em] mb-2">
                  {t('upload.refine_step_label')}
                </div>
                <h3 className="text-lg font-bold uppercase tracking-tight mb-2">
                  {t('upload.refine_title')}
                </h3>
                <p className="text-retro-muted font-mono text-xs sm:text-sm leading-relaxed">
                  {t('upload.refine_desc')}
                </p>
              </div>
            </div>
          </div>

          <div className="pt-6 border-t-2 border-retro-border">
            <Button
              type="submit"
              className="w-full"
              disabled={isLoading}
            >
              {isLoading ? t('upload.uploading') : t('upload.submit')}
            </Button>
          </div>
        </form>
      </Card>

      {uploadSuccess && (
        <div className="fixed inset-0 z-[70] bg-black/80 flex items-center justify-center p-4">
          <Card className="w-full max-w-lg border-4 border-retro-accent shadow-[8px_8px_0px_0px_rgba(16,185,129,0.35)]">
            <div className="space-y-5">
              <div>
                <div className="text-[10px] font-bold text-retro-accent uppercase tracking-[0.2em] mb-2">
                  {t('upload.complete_step_label')}
                </div>
                <h2 className="text-2xl font-bold uppercase tracking-tight mb-2">
                  {t('upload.complete_title')}
                </h2>
                <p className="text-retro-muted font-mono text-sm leading-relaxed">
                  {t('upload.complete_desc')}
                </p>
              </div>

              <div className="border-2 border-dashed border-retro-border p-4 bg-retro-bg">
                <div className="text-sm font-bold uppercase tracking-wide mb-2">
                  {t('upload.refine_title')}
                </div>
                <p className="text-retro-muted font-mono text-xs leading-relaxed">
                  {t('upload.edit_hint')}
                </p>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
                <Button variant="secondary" onClick={() => handlePostUploadChoice(false)} className="w-full sm:w-auto">
                  {t('upload.refine_later')}
                </Button>
                <Button onClick={() => handlePostUploadChoice(true)} className="w-full sm:w-auto">
                  {t('upload.refine_now')}
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};

export default Upload;
