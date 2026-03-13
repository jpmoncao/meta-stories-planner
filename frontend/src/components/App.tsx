import { useState, useCallback } from 'react';
import ImageUpload from './ImageUpload';
import ImageGallery from './ImageGallery';

export default function App() {
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleUploadSuccess = useCallback(() => {
    setRefreshTrigger((t) => t + 1);
  }, []);

  return (
    <div className="app">
      <header className="header">
        <div className="logo">
          <span className="logo-icon">✨</span>
          <h1>Meta Stories Planner</h1>
        </div>
        <p className="tagline">Gerencie suas imagens para stories</p>
      </header>

      <section className="upload-section">
        <ImageUpload onUploadSuccess={handleUploadSuccess} />
      </section>

      <section className="gallery-section">
        <h2 className="section-title">Suas imagens</h2>
        <ImageGallery refreshTrigger={refreshTrigger} />
      </section>
    </div>
  );
}
