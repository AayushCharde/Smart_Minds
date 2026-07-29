import { useState, useRef } from 'react';
import { Upload, FileText, File, X, CloudUpload, Sparkles, Loader2 } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

export default function DropZone({ onFilesSelected, disabled }) {
  const { theme } = useTheme();
  const [dragOver, setDragOver] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const fileInputRef = useRef(null);

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const files = Array.from(e.dataTransfer.files).filter(f =>
      /\.(pdf|docx|txt)$/i.test(f.name)
    );
    if (files.length > 0) {
      setSelectedFiles(prev => [...prev, ...files]);
    }
  };

  const handleFileInput = (e) => {
    const files = Array.from(e.target.files);
    if (files.length > 0) {
      setSelectedFiles(prev => [...prev, ...files]);
    }
    e.target.value = '';
  };

  const removeFile = (index) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleUpload = () => {
    if (selectedFiles.length > 0) {
      onFilesSelected(selectedFiles);
      setSelectedFiles([]);
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const getFileIcon = (name) => {
    if (name.endsWith('.pdf')) return <FileText size={16} style={{ color: '#EF4444' }} />;
    if (name.endsWith('.docx')) return <FileText size={16} style={{ color: '#2563EB' }} />;
    return <File size={16} style={{ color: theme.colors.textMuted }} />;
  };

  const getFileExt = (name) => {
    const ext = name.split('.').pop().toUpperCase();
    return ext;
  };

  const totalSize = selectedFiles.reduce((sum, f) => sum + f.size, 0);

  return (
    <div className="space-y-4">
      {/* Drop zone */}
      <div
        className="relative border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-all duration-200 group overflow-hidden"
        style={{
          borderColor: dragOver ? theme.colors.accent : theme.colors.border,
          backgroundColor: dragOver ? `${theme.colors.accentLight}60` : theme.colors.bgCard,
          boxShadow: dragOver ? `0 0 0 4px ${theme.colors.accent}15` : theme.colors.cardShadow,
        }}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        {/* Subtle background pattern on drag */}
        {dragOver && (
          <div
            className="absolute inset-0 pointer-events-none animate-fade-in"
            style={{
              background: `radial-gradient(circle at 50% 50%, ${theme.colors.accent}08 0%, transparent 70%)`,
            }}
          />
        )}

        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept=".pdf,.docx,.txt"
          onChange={handleFileInput}
          className="hidden"
        />

        <div
          className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 transition-all duration-300 group-hover:scale-110 group-hover:shadow-lg"
          style={{
            background: dragOver
              ? `linear-gradient(135deg, ${theme.colors.accent}, ${theme.colors.accentHover})`
              : `linear-gradient(135deg, ${theme.colors.accentLight}, ${theme.colors.accent}15)`,
          }}
        >
          <CloudUpload
            size={28}
            style={{ color: dragOver ? '#FFFFFF' : theme.colors.accent }}
            className={dragOver ? 'animate-bounce-subtle' : ''}
          />
        </div>

        <p className="text-base font-semibold" style={{ color: theme.colors.textPrimary }}>
          {dragOver ? 'Drop files here' : 'Drag & drop resumes here'}
        </p>
        <p className="text-sm mt-1" style={{ color: theme.colors.textSecondary }}>
          or <span style={{ color: theme.colors.accent }} className="font-medium">click to browse</span> your files
        </p>

        {/* File type badges */}
        <div className="flex items-center justify-center gap-3 mt-4">
          {[
            { ext: 'PDF', color: '#EF4444' },
            { ext: 'DOCX', color: '#2563EB' },
            { ext: 'TXT', color: theme.colors.textMuted },
          ].map(({ ext, color }) => (
            <span
              key={ext}
              className="text-[10px] font-bold px-2.5 py-1 rounded-md uppercase tracking-wide"
              style={{
                backgroundColor: `${color}10`,
                color: color,
                border: `1px solid ${color}20`,
              }}
            >
              {ext}
            </span>
          ))}
        </div>
        <p className="text-xs mt-3" style={{ color: theme.colors.textMuted }}>
          Max 10MB each, up to 50 files at once
        </p>
      </div>

      {/* Selected files list */}
      {selectedFiles.length > 0 && (
        <div
          className="rounded-xl overflow-hidden animate-scale-in"
          style={{
            backgroundColor: theme.colors.bgCard,
            border: `1px solid ${theme.colors.border}`,
            boxShadow: theme.colors.cardShadow,
          }}
        >
          {/* Header */}
          <div
            className="flex items-center justify-between px-4 py-3"
            style={{ borderBottom: `1px solid ${theme.colors.border}` }}
          >
            <div className="flex items-center gap-3">
              <span className="text-sm font-bold" style={{ color: theme.colors.textPrimary }}>
                {selectedFiles.length} file{selectedFiles.length > 1 ? 's' : ''} ready
              </span>
              <span
                className="text-[10px] font-medium px-2 py-0.5 rounded-full"
                style={{ backgroundColor: theme.colors.bgTertiary, color: theme.colors.textMuted }}
              >
                {formatFileSize(totalSize)}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setSelectedFiles([])}
                className="text-xs font-medium px-2 py-1 rounded-lg transition-colors"
                style={{ color: theme.colors.textMuted }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = theme.colors.danger;
                  e.currentTarget.style.backgroundColor = `${theme.colors.danger}10`;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = theme.colors.textMuted;
                  e.currentTarget.style.backgroundColor = 'transparent';
                }}
              >
                Clear All
              </button>
              <button
                onClick={handleUpload}
                disabled={disabled}
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 disabled:opacity-50 hover:shadow-md hover:-translate-y-0.5 disabled:hover:translate-y-0"
                style={{
                  background: disabled
                    ? theme.colors.accent
                    : `linear-gradient(135deg, ${theme.colors.accent}, ${theme.colors.accentHover})`,
                  color: theme.colors.textOnAccent,
                }}
              >
                {disabled ? (
                  <>
                    <Loader2 size={14} className="animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Sparkles size={14} />
                    Upload & Process
                  </>
                )}
              </button>
            </div>
          </div>

          {/* File list */}
          <div className="max-h-56 overflow-y-auto">
            {selectedFiles.map((file, i) => (
              <div
                key={i}
                className="flex items-center justify-between px-4 py-2.5 transition-colors"
                style={{
                  borderBottom: i < selectedFiles.length - 1 ? `1px solid ${theme.colors.border}30` : 'none',
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = theme.colors.bgHover}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
              >
                <div className="flex items-center gap-3 min-w-0">
                  {/* File icon with ext badge */}
                  <div className="relative flex-shrink-0">
                    {getFileIcon(file.name)}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate" style={{ color: theme.colors.textPrimary }}>
                      {file.name}
                    </p>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px]" style={{ color: theme.colors.textMuted }}>
                        {formatFileSize(file.size)}
                      </span>
                      <span
                        className="text-[9px] font-bold px-1.5 py-0.5 rounded"
                        style={{
                          backgroundColor: theme.colors.bgTertiary,
                          color: theme.colors.textMuted,
                        }}
                      >
                        {getFileExt(file.name)}
                      </span>
                    </div>
                  </div>
                </div>
                <button
                  onClick={(e) => { e.stopPropagation(); removeFile(i); }}
                  className="p-1.5 rounded-lg transition-all opacity-60 hover:opacity-100"
                  style={{ backgroundColor: `${theme.colors.danger}08` }}
                >
                  <X size={13} style={{ color: theme.colors.danger }} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
