import { useState, useEffect, useCallback } from 'react';
import { ref, listAll, getDownloadURL, deleteObject } from 'firebase/storage';
import { storage } from '../lib/firebase';

interface ImageItem {
  name: string;
  url: string;
}

interface ImageGalleryProps {
  refreshTrigger?: number;
}

export default function ImageGallery({ refreshTrigger = 0 }: ImageGalleryProps) {
  const [images, setImages] = useState<ImageItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [imageToDelete, setImageToDelete] = useState<ImageItem | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [exportSuccess, setExportSuccess] = useState(false);

  const fetchImages = useCallback(async () => {
    if (!storage) return;
    setLoading(true);
    setError(null);
    try {
      const listRef = ref(storage, 'images');
      const result = await listAll(listRef);
      const urls = await Promise.all(
        result.items.map(async (itemRef) => ({
          name: itemRef.name,
          url: await getDownloadURL(itemRef),
        }))
      );
      setImages(urls);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar imagens');
      setImages([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchImages();
  }, [fetchImages, refreshTrigger]);

  const handleDeleteClick = useCallback((e: React.MouseEvent, img: ImageItem) => {
    e.preventDefault();
    e.stopPropagation();
    setImageToDelete(img);
  }, []);

  const handleConfirmDelete = useCallback(async () => {
    if (!imageToDelete || !storage) return;
    setDeleting(true);
    setDeleteError(null);
    try {
      const storageRef = ref(storage, `images/${imageToDelete.name}`);
      await deleteObject(storageRef);
      setImageToDelete(null);
      await fetchImages();
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : 'Erro ao excluir imagem');
    } finally {
      setDeleting(false);
    }
  }, [imageToDelete, fetchImages]);

  const handleCancelDelete = useCallback(() => {
    if (!deleting) {
      setImageToDelete(null);
      setDeleteError(null);
    }
  }, [deleting]);

  const handleExportUrls = useCallback(async () => {
    if (images.length === 0) return;
    const urls = images.map((img) => img.url).join('\n');
    try {
      await navigator.clipboard.writeText(urls);
      setExportSuccess(true);
      setTimeout(() => setExportSuccess(false), 2000);
    } catch {
      setError('Não foi possível copiar as URLs');
    }
  }, [images]);

  useEffect(() => {
    if (!imageToDelete) return;
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleCancelDelete();
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [imageToDelete, handleCancelDelete]);

  if (loading) {
    return (
      <div className="gallery-loading">
        <div className="spinner" />
        <p>Carregando imagens...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="gallery-error">
        <span className="error-icon">⚠️</span>
        <p>{error}</p>
        <button onClick={fetchImages} className="retry-btn">
          Tentar novamente
        </button>
      </div>
    );
  }

  if (images.length === 0) {
    return (
      <div className="gallery-empty">
        <span className="empty-icon">🖼️</span>
        <p>Nenhuma imagem ainda</p>
        <span className="empty-hint">Faça upload para começar</span>
      </div>
    );
  }

  return (
    <>
      <div className="image-gallery">
        <div className="gallery-actions">
          <button
            type="button"
            className="export-urls-btn"
            onClick={handleExportUrls}
            title="Copiar URLs para publicar no Instagram"
          >
            {exportSuccess ? '✓ URLs copiadas!' : '📋 Exportar URLs'}
          </button>
        </div>
        <div className="gallery-grid">
          {images.map((img) => (
            <div key={img.name} className="image-card">
              <a
                href={img.url}
                target="_blank"
                rel="noopener noreferrer"
                className="card-image-link"
              >
                <div className="card-image">
                  <img src={img.url} alt={img.name} loading="lazy" />
                </div>
              </a>
              <div className="card-footer">
                <span className="card-name">{img.name}</span>
                <button
                  type="button"
                  className="card-delete-btn"
                  onClick={(e) => handleDeleteClick(e, img)}
                  title="Excluir imagem"
                >
                  🗑️
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {imageToDelete && (
        <div className="modal-overlay" onClick={handleCancelDelete}>
          <div
            className="modal"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="modal-title">Excluir imagem?</h3>
            <p className="modal-text">
              A imagem &quot;{imageToDelete.name}&quot; será removida permanentemente do
              storage. Esta ação não pode ser desfeita.
            </p>
            {deleteError && (
              <p className="modal-error">{deleteError}</p>
            )}
            <div className="modal-actions">
              <button
                type="button"
                className="modal-btn cancel"
                onClick={handleCancelDelete}
                disabled={deleting}
              >
                Cancelar
              </button>
              <button
                type="button"
                className="modal-btn delete"
                onClick={handleConfirmDelete}
                disabled={deleting}
              >
                {deleting ? 'Excluindo...' : 'Excluir'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
