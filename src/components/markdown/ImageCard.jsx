import { useState, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { usePustaka } from '../../hooks/usePustaka';
import { extractDomain } from '../../lib/utils';

export default function ImageCard({ src, alt, ...props }) {
  const { requireAuthOrRedirect } = useAuth();
  const { uploadFile } = usePustaka();

  const [isSaved, setIsSaved] = useState(false);

  // Handle save
  const handleSave = useCallback(async () => {
    if (!requireAuthOrRedirect('Harap Login terlebih dahulu untuk menyimpan gambar. Login sekarang?')) {
      return;
    }

    try {
      // Fetch the image
      const response = await fetch(src);
      const blob = await response.blob();

      // Upload to pustaka
      const filename = `KangAjie-AI-${Date.now()}.png`;
      await uploadFile(blob, filename);

      // Also download locally
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.click();
      window.URL.revokeObjectURL(url);

      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 2000);
    } catch (error) {
      console.error('Error saving image:', error);
    }
  }, [src, requireAuthOrRedirect, uploadFile]);

  return (
    <div className="code-wrapper">
      <div className="code-header">
        <span className="flex items-center gap-2 text-gray-400">
          <i className="fa-solid fa-image text-[10px] text-gray-500" />
          <span className="font-medium">AI Generator</span>
        </span>
        <div className="flex items-center gap-3 text-gray-500">
          <button
            onClick={handleSave}
            className="flex items-center gap-1.5 hover:text-yellow-400 transition-colors"
          >
            <i className={`fa-solid ${isSaved ? 'fa-check text-green-500' : 'fa-save text-[10px]'}`} />
            <span className="text-xs">{isSaved ? 'Tersimpan' : 'Simpan'}</span>
          </button>
          <a
            href={src}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 hover:text-yellow-400 transition-colors"
            title="Buka gambar di tab baru"
          >
            <i className="fa-solid fa-external-link text-[10px]" />
            <span className="text-xs">Buka</span>
          </a>
        </div>
      </div>
      <img src={src} alt={alt || 'AI Generated Image'} {...props} />
    </div>
  );
}
