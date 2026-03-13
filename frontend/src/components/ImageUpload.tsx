import { useState, useCallback } from 'react';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { storage } from '../lib/firebase';
import { formatImageAsStory } from '../lib/formatStory';

interface UploadState {
  status: 'idle' | 'formatting' | 'uploading' | 'success' | 'error';
  progress: number;
  downloadUrl?: string;
  error?: string;
}

interface ImageUploadProps {
  onUploadSuccess?: () => void;
}

const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const MAX_SIZE_MB = 5;
const MAX_SIZE_BYTES = MAX_SIZE_MB * 1024 * 1024;

export default function ImageUpload({ onUploadSuccess }: ImageUploadProps) {
  const [uploadState, setUploadState] = useState<UploadState>({
    status: 'idle',
    progress: 0,
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);

  const validateFile = useCallback((file: File): string | null => {
    if (!ACCEPTED_TYPES.includes(file.type)) {
      return `Formato inválido. Use: JPEG, PNG, WebP ou GIF`;
    }
    if (file.size > MAX_SIZE_BYTES) {
      return `Arquivo muito grande. Máximo: ${MAX_SIZE_MB}MB`;
    }
    return null;
  }, []);

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      const error = validateFile(file);
      if (error) {
        setUploadState({ status: 'error', progress: 0, error });
        setSelectedFile(null);
        return;
      }

      setSelectedFile(file);
      setUploadState({ status: 'idle', progress: 0 });
    },
    [validateFile]
  );

  const handleUpload = useCallback(async () => {
    if (!selectedFile) return;

    setUploadState({ status: 'formatting', progress: 0 });

    let blobToUpload: Blob;
    try {
      blobToUpload = await formatImageAsStory(selectedFile);
    } catch (err) {
      setUploadState({
        status: 'error',
        progress: 0,
        error: err instanceof Error ? err.message : 'Erro ao formatar imagem',
      });
      return;
    }

    const timestamp = Date.now();
    const baseName = selectedFile.name.replace(/\.[^.]+$/, '');
    const safeName = baseName.replace(/[^a-zA-Z0-9.-]/g, '_');
    const storagePath = `images/${timestamp}_${safeName}.jpg`;

    const storageRef = ref(storage, storagePath);

    setUploadState({ status: 'uploading', progress: 0 });
    const uploadTask = uploadBytesResumable(storageRef, blobToUpload);

    uploadTask.on(
      'state_changed',
      (snapshot) => {
        const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        setUploadState((prev) => ({ ...prev, progress }));
      },
      (error) => {
        setUploadState({
          status: 'error',
          progress: 0,
          error: error.message || 'Erro ao fazer upload',
        });
      },
      async () => {
        try {
          const downloadUrl = await getDownloadURL(uploadTask.snapshot.ref);
          setUploadState({
            status: 'success',
            progress: 100,
            downloadUrl,
          });
          setSelectedFile(null);
          onUploadSuccess?.();
        } catch (error) {
          setUploadState({
            status: 'error',
            progress: 0,
            error: 'Erro ao obter URL do arquivo',
          });
        }
      }
    );
  }, [selectedFile, onUploadSuccess]);

  const handleReset = useCallback(() => {
    setSelectedFile(null);
    setUploadState({ status: 'idle', progress: 0 });
  }, []);

  return (
    <div className={`image-upload ${isExpanded ? 'expanded' : ''}`}>
      <button
        type="button"
        className="upload-toggle"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <span className="upload-icon">📤</span>
        <span>Nova imagem</span>
        <span className="toggle-arrow">{isExpanded ? '▲' : '▼'}</span>
      </button>

      {isExpanded && (
        <div className="upload-content">
          <label className="file-input-label">
            <input
              type="file"
              accept={ACCEPTED_TYPES.join(',')}
              onChange={handleFileChange}
              disabled={
                uploadState.status === 'formatting' ||
                uploadState.status === 'uploading'
              }
            />
            <span className="file-input-text">
              {selectedFile ? '📷 ' + selectedFile.name : 'Escolher arquivo'}
            </span>
          </label>

          {selectedFile && (
            <div className="file-info">
              {(selectedFile.size / 1024).toFixed(1)} KB
            </div>
          )}

          {(uploadState.status === 'formatting' || uploadState.status === 'uploading') && (
            <div className="progress-bar">
              <div
                className="progress-fill"
                style={{
                  width: uploadState.status === 'formatting' ? '30%' : `${uploadState.progress}%`,
                }}
              />
            </div>
          )}

          <div className="buttons">
            <button
              className="primary"
              onClick={handleUpload}
            disabled={
              !selectedFile ||
              uploadState.status === 'formatting' ||
              uploadState.status === 'uploading'
            }
          >
            {uploadState.status === 'formatting'
              ? 'Formatando...'
              : uploadState.status === 'uploading'
                ? 'Enviando...'
                : 'Enviar'}
            </button>
            <button className="secondary" onClick={handleReset}>
              Limpar
            </button>
          </div>

          {uploadState.status === 'error' && uploadState.error && (
            <div className="message error">{uploadState.error}</div>
          )}

          {uploadState.status === 'success' && (
            <div className="message success">✅ Upload concluído!</div>
          )}
        </div>
      )}
    </div>
  );
}
