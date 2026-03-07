import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import api from '../services/api';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Upload as UploadIcon, X, ArrowLeft } from 'lucide-react';

interface Course {
  id: number;
  title: string;
}

const Upload: React.FC = () => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<string>('');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [files, setFiles] = useState<File[]>([]);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [dragActive, setDragActive] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();

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

      files.forEach(file => {
        formData.append('files', file);
      });

      await api.post('/api/notes', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (selectedCourse) {
        navigate(`/course/${selectedCourse}`);
      } else {
        navigate('/');
      }
    } catch (err: any) {
      console.log("API ERROR RESPONSE:", err.response);
      const detail = err.response?.data?.detail;
      if (typeof detail === 'string') {
        setError(detail);
      } else if (Array.isArray(detail)) {
        setError(detail.map(d => d.msg || 'Validation error').join(', '));
      } else if (typeof detail === 'object' && detail !== null) {
        setError(JSON.stringify(detail));
      } else {
        setError('Failed to upload note.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto">
      <div className="mb-8">
        <Link to="/" className="inline-flex items-center gap-2 text-retro-muted hover:text-retro-text hover:-translate-x-1 transition-transform font-mono text-sm mb-4">
          <ArrowLeft size={16} /> RETURN TO DASHBOARD
        </Link>
        <h1 className="text-4xl font-bold uppercase tracking-tighter">Upload Note<span className="text-retro-accent">_</span></h1>
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
              SELECT COURSE
            </label>
            <select
              className="bg-retro-bg text-retro-text border-2 border-retro-border py-3 px-4 font-mono outline-none focus:border-retro-accent focus:shadow-solid-accent appearance-none cursor-pointer"
              value={selectedCourse}
              onChange={(e) => setSelectedCourse(e.target.value)}
            >
              <option value="">-- ADD TO LIBRARY (no folder) --</option>
              {courses.map(course => (
                <option key={course.id} value={course.id}>📁 {course.title}</option>
              ))}
            </select>
          </div>

          <Input
            label="NOTE TITLE"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            placeholder="e.g. Chapter 4: Matrix Multiplication"
          />

          <div className="flex flex-col w-full">
            <label className="mb-2 text-sm font-bold text-retro-muted tracking-widest uppercase">
              CONTENT (Markdown supported)
            </label>
            <textarea
              className="bg-retro-bg text-retro-text border-2 border-retro-border py-3 px-4 font-mono outline-none focus:border-retro-accent focus:shadow-solid-accent min-h-[150px] resize-y"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Write your notes here..."
            />
          </div>

          <div className="flex flex-col w-full">
            <label className="mb-2 text-sm font-bold text-retro-muted tracking-widest uppercase">
              ATTACH IMAGES
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
                DRAG & DROP IMAGES HERE OR CLICK TO BROWSE
              </p>
            </div>
          </div>

          {files.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
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

          <div className="pt-6 border-t-2 border-retro-border">
            <Button
              type="submit"
              className="w-full"
              disabled={isLoading}
            >
              {isLoading ? 'UPLOADING...' : 'COMMIT. UPLOAD_'}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
};

export default Upload;
