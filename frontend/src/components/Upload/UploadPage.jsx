import { useState, useEffect } from 'react';
import { Upload, Sparkles, FileText } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { useApi } from '../../api';
import { useApp } from '../../context/AppContext';
import { useToast } from '../common/Toast';
import DropZone from './DropZone';
import ProcessingQueue from './ProcessingQueue';
import CandidateTable from './CandidateTable';
import LoadingSpinner from '../common/LoadingSpinner';

export default function UploadPage() {
  const { theme } = useTheme();
  const { apiFetch } = useApi();
  const { addToast } = useToast();
  const {
    candidates, candidatesLoading, loadCandidates,
    removeCandidate, invalidateStats,
  } = useApp();
  const [uploading, setUploading] = useState(false);
  const [processingQueue, setProcessingQueue] = useState([]);

  useEffect(() => {
    loadCandidates();
  }, []);

  async function handleFilesSelected(files) {
    setUploading(true);
    setProcessingQueue(files.map(f => ({ filename: f.name, status: 'processing' })));

    const formData = new FormData();
    files.forEach(file => formData.append('files', file));

    try {
      const res = await apiFetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (res.success) {
        const { processed, errors } = res.data;

        setProcessingQueue(prev => prev.map(item => {
          const wasProcessed = processed.find(p => p.filename === item.filename);
          const hadError = errors.find(e => e.filename === item.filename);
          if (wasProcessed) return { ...item, status: 'done' };
          if (hadError) return { ...item, status: 'error', error: hadError.error };
          return { ...item, status: 'done' };
        }));

        if (processed.length > 0) {
          addToast(`${processed.length} resume${processed.length > 1 ? 's' : ''} uploaded successfully`, 'success');
        }
        if (errors.length > 0) {
          addToast(`${errors.length} file${errors.length > 1 ? 's' : ''} failed to process`, 'error');
        }

        await loadCandidates(true);
        invalidateStats();
      } else {
        addToast(res.error || 'Upload failed', 'error');
        setProcessingQueue(prev => prev.map(item => ({ ...item, status: 'error', error: res.error })));
      }
    } catch (err) {
      addToast('Upload failed: ' + err.message, 'error');
      setProcessingQueue(prev => prev.map(item => ({ ...item, status: 'error', error: err.message })));
    } finally {
      setUploading(false);
      setTimeout(() => setProcessingQueue([]), 5000);
    }
  }

  async function handleDelete(candidateId) {
    try {
      const res = await apiFetch(`/api/candidates/${candidateId}`, { method: 'DELETE' });
      if (res.success) {
        removeCandidate(candidateId);
        invalidateStats();
        addToast('Candidate removed', 'success');
      } else {
        addToast(res.error || 'Failed to delete', 'error');
      }
    } catch (err) {
      addToast('Failed to delete candidate', 'error');
    }
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Enhanced Page Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div
            className="w-11 h-11 rounded-xl flex items-center justify-center"
            style={{
              background: `linear-gradient(135deg, ${theme.colors.accent}, ${theme.colors.accentHover})`,
            }}
          >
            <Upload size={20} color="#FFFFFF" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold" style={{ color: theme.colors.textPrimary }}>
                Upload & Screen
              </h1>
              <span
                className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full"
                style={{
                  backgroundColor: theme.colors.accentLight,
                  color: theme.colors.accentText,
                }}
              >
                <Sparkles size={9} />
                Auto-Parse
              </span>
            </div>
            <p className="text-sm mt-0.5" style={{ color: theme.colors.textSecondary }}>
              Upload resumes and let AI extract structured candidate profiles
            </p>
          </div>
        </div>

        {/* Candidate count indicator */}
        {candidates.length > 0 && (
          <div
            className="hidden md:flex items-center gap-2 px-3 py-2 rounded-lg"
            style={{
              backgroundColor: theme.colors.bgTertiary,
              border: `1px solid ${theme.colors.border}`,
            }}
          >
            <FileText size={13} style={{ color: theme.colors.accent }} />
            <span className="text-sm font-medium" style={{ color: theme.colors.textPrimary }}>
              {candidates.length}
            </span>
            <span className="text-xs" style={{ color: theme.colors.textMuted }}>
              candidate{candidates.length !== 1 ? 's' : ''}
            </span>
          </div>
        )}
      </div>

      <DropZone onFilesSelected={handleFilesSelected} disabled={uploading} />

      <ProcessingQueue items={processingQueue} />

      {candidatesLoading && candidates.length === 0 ? (
        <div className="flex items-center justify-center py-12">
          <LoadingSpinner text="Loading candidates..." />
        </div>
      ) : (
        <CandidateTable
          candidates={candidates}
          onDelete={handleDelete}
        />
      )}
    </div>
  );
}
