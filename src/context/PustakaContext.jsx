import { createContext, useContext, useState, useCallback, useRef } from 'react';
import { useAuth } from './AuthContext';
import { listPustakaFiles, uploadToPustaka, downloadPustakaFile, deletePustakaFile, isImageFile } from '../services/pustakaApi';
import { sanitizeFilename } from '../lib/utils';

const PustakaContext = createContext(null);

export function PustakaProvider({ children }) {
  const { user, requireAuthOrRedirect } = useAuth();
  const userRef = useRef(user);
  userRef.current = user;

  const [pustakaFiles, setPustakaFiles] = useState([]);
  const [currentFilter, setCurrentFilter] = useState('Semua');
  const [isLoading, setIsLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Fetch pustaka files
  const fetchPustaka = useCallback(async () => {
    const currentUser = userRef.current;
    if (!currentUser) return;

    setIsLoading(true);
    try {
      const files = await listPustakaFiles(currentUser.id);
      setPustakaFiles(files);
    } catch (error) {
      console.error('Error fetching pustaka:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const openPustakaModal = useCallback(() => {
    setIsModalOpen(true);
    fetchPustaka();
  }, [fetchPustaka]);

  const closePustakaModal = useCallback(() => {
    setIsModalOpen(false);
  }, []);

  const filterPustaka = useCallback((type) => {
    setCurrentFilter(type);
  }, []);

  const getFilteredFiles = useCallback(() => {
    if (currentFilter === 'Semua') return pustakaFiles;
    if (currentFilter === 'Gambar') {
      return pustakaFiles.filter(f => isImageFile(f));
    }
    return pustakaFiles.filter(f => !isImageFile(f));
  }, [pustakaFiles, currentFilter]);

  const uploadFile = useCallback(async (blob, filename) => {
    const currentUser = userRef.current;
    if (!currentUser) return null;

    if (!requireAuthOrRedirect('Harap Login terlebih dahulu untuk menyimpan ke Pustaka. Login sekarang?')) {
      return null;
    }

    try {
      const sanitized = sanitizeFilename(filename);
      await uploadToPustaka(currentUser.id, blob, sanitized);
      await fetchPustaka();
      return true;
    } catch (error) {
      console.error('Error uploading to pustaka:', error);
      return false;
    }
  }, [requireAuthOrRedirect, fetchPustaka]);

  const downloadFile = useCallback(async (filename) => {
    const currentUser = userRef.current;
    if (!currentUser) return;

    try {
      const blob = await downloadPustakaFile(currentUser.id, filename);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename.replace(/^\d+_/, ''); // Remove timestamp prefix
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading from pustaka:', error);
    }
  }, []);

  const deleteFile = useCallback(async (filename) => {
    const currentUser = userRef.current;
    if (!currentUser) return;
    if (!window.confirm('Hapus file ini?')) return;

    try {
      await deletePustakaFile(currentUser.id, filename);
      await fetchPustaka();
    } catch (error) {
      console.error('Error deleting from pustaka:', error);
    }
  }, [fetchPustaka]);

  const value = {
    pustakaFiles: getFilteredFiles(),
    currentFilter,
    isLoading,
    isModalOpen,
    openPustakaModal,
    closePustakaModal,
    fetchPustaka,
    filterPustaka,
    uploadFile,
    downloadFile,
    deleteFile,
  };

  return (
    <PustakaContext.Provider value={value}>
      {children}
    </PustakaContext.Provider>
  );
}

export function usePustaka() {
  const ctx = useContext(PustakaContext);
  if (!ctx) throw new Error('usePustaka must be used within PustakaProvider');
  return ctx;
}
