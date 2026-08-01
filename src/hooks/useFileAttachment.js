import { useState, useCallback, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { isTextLikeFile, getFileExtension } from '../lib/utils';

export function useFileAttachment() {
  const { requireAuthOrRedirect } = useAuth();

  const [currentFile, setCurrentFile] = useState(null);
  // currentFile shape: { dataUrl: string, mimeType: string, name: string }

  const [preview, setPreview] = useState(null);
  // preview shape: { type: 'image' | 'icon', src: string, icon?: string, fileName: string }

  const fileInputRef = useRef(null);

  const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
  const MAX_IMAGE_DIM = 2048;
  const MAX_COMPRESSED_SIZE = 3.5 * 1024 * 1024; // 3.5MB

  // Clear file
  const clearFile = useCallback(() => {
    setCurrentFile(null);
    setPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, []);

  // Process file (from input or paste)
  const processFile = useCallback(async (file) => {
    if (!file) return;

    // Check size
    if (file.size > MAX_FILE_SIZE) {
      alert('Ukuran file maksimal 10MB');
      return;
    }

    // Check if text-like and large
    if (isTextLikeFile(file.name, file.type) && file.size > 500 * 1024) {
      if (!window.confirm('File teks yang besar mungkin memakan waktu lama untuk diproses. Lanjutkan?')) {
        return;
      }
    }

    // Determine MIME type
    let mimeType = file.type;
    const ext = getFileExtension(file.name).toLowerCase();

    // Override MIME for specific extensions
    const mimeOverrides = {
      docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      txt: 'text/plain',
      csv: 'text/csv',
      json: 'application/json',
      yaml: 'text/yaml',
      yml: 'text/yaml',
      xml: 'application/xml',
    };

    if (mimeOverrides[ext]) {
      mimeType = mimeOverrides[ext];
    }

    // Read as data URL
    const dataUrl = await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

    // For images: check dimensions and compress if needed
    let processedDataUrl = dataUrl;

    if (mimeType.startsWith('image/')) {
      const img = new Image();
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
        img.src = dataUrl;
      });

      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      let width = img.width;
      let height = img.height;

      // Resize if needed
      if (width > MAX_IMAGE_DIM || height > MAX_IMAGE_DIM) {
        const scale = Math.min(1, MAX_IMAGE_DIM / Math.max(width, height));
        width = Math.round(width * scale);
        height = Math.round(height * scale);
        canvas.width = width;
        canvas.height = height;
        ctx.drawImage(img, 0, 0, width, height);

        let quality = 0.92;
        processedDataUrl = canvas.toDataURL('image/jpeg', quality);
        while (processedDataUrl.length * 0.75 > MAX_COMPRESSED_SIZE && quality > 0.5) {
          quality -= 0.1;
          processedDataUrl = canvas.toDataURL('image/jpeg', quality);
        }
      } else if (dataUrl.length * 0.75 > MAX_COMPRESSED_SIZE) {
        canvas.width = width;
        canvas.height = height;
        ctx.drawImage(img, 0, 0, width, height);
        let quality = 0.92;
        processedDataUrl = canvas.toDataURL('image/jpeg', quality);
        while (processedDataUrl.length * 0.75 > MAX_COMPRESSED_SIZE && quality > 0.5) {
          quality -= 0.1;
          processedDataUrl = canvas.toDataURL('image/jpeg', quality);
        }
      }
    }

    // Set file data
    const fileData = {
      dataUrl: processedDataUrl,
      mimeType,
      name: file.name,
    };

    setCurrentFile(fileData);

    // Create preview
    if (mimeType.startsWith('image/')) {
      setPreview({
        type: 'image',
        src: processedDataUrl,
        fileName: file.name,
      });
    } else if (mimeType.startsWith('video/')) {
      setPreview({
        type: 'icon',
        icon: 'fa-file-video',
        fileName: file.name,
      });
    } else if (mimeType.startsWith('audio/')) {
      setPreview({
        type: 'icon',
        icon: 'fa-file-audio',
        fileName: file.name,
      });
    } else {
      const iconMap = {
        pdf: 'fa-file-pdf',
        doc: 'fa-file-word',
        docx: 'fa-file-word',
        xls: 'fa-file-excel',
        xlsx: 'fa-file-excel',
        ppt: 'fa-file-powerpoint',
        pptx: 'fa-file-powerpoint',
        zip: 'fa-file-archive',
        rar: 'fa-file-archive',
        txt: 'fa-file-alt',
        md: 'fa-markdown',
        json: 'fa-file-code',
        csv: 'fa-file-csv',
        xml: 'fa-file-code',
        yaml: 'fa-file-code',
        yml: 'fa-file-code',
        mp4: 'fa-file-video',
        webm: 'fa-file-video',
        mov: 'fa-file-video',
        mp3: 'fa-file-audio',
        wav: 'fa-file-audio',
      };
      const icon = iconMap[ext] || 'fa-file';
      setPreview({ type: 'icon', icon, fileName: file.name });
    }

    return fileData;
  }, []);

  // Handle paste (for images)
  const handlePaste = useCallback((e) => {
    const imageItem = Array.from(e.clipboardData.items).find(item =>
      item.type.startsWith('image/')
    );

    if (imageItem) {
      // Check auth for non-guests
      if (!requireAuthOrRedirect('Login untuk paste gambar?')) {
        return;
      }
      e.preventDefault();
      const file = imageItem.getAsFile();
      if (file) {
        processFile(file);
      }
    }
  }, [requireAuthOrRedirect, processFile]);

  // Handle file select from input
  const handleFileSelect = useCallback((e) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
    // Reset input so same file can be re-selected
    e.target.value = '';
  }, [processFile]);

  // ✅ CRITICAL FIX: Trigger file upload by clicking the hidden input
  const triggerFileUpload = useCallback(() => {
    if (!requireAuthOrRedirect('Harap Login terlebih dahulu untuk upload file. Login sekarang?')) {
      return;
    }
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  }, [requireAuthOrRedirect]);

  return {
    currentFile,
    preview,
    fileInputRef,
    clearFile,
    processFile,
    handlePaste,
    handleFileSelect,
    triggerFileUpload,
  };
}
