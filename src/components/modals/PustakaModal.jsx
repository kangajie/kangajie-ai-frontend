import { useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { usePustaka } from '../../hooks/usePustaka';
import { formatDate, formatFileSize, isImageFile } from '../../lib/utils';

const TABS = ['Semua', 'Gambar', 'File'];

export default function PustakaModal() {
  const { user, isGuest } = useAuth();
  const {
    pustakaFiles,
    currentFilter,
    isLoading,
    isModalOpen,
    closePustakaModal,
    fetchPustaka,
    filterPustaka,
    downloadFile,
    deleteFile,
  } = usePustaka();

  if (!isModalOpen) return null;

  return (
    /* Matches HTML: fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-0 md:p-8 backdrop-blur-md */
    <div
      id="pustaka-modal"
      className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-0 md:p-8 backdrop-blur-md"
    >
      <div className="bg-[#121214] border-0 md:border border-[#2A2A2E] rounded-none md:rounded-2xl shadow-2xl w-full max-w-4xl h-full md:h-[85vh] flex flex-col overflow-hidden fade-in">

        {/* Header */}
        <div className="px-6 py-4 border-b border-[#1F1F21] flex justify-between items-center bg-[#1A1A1C]">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <i className="fa-solid fa-book-open text-blue-500" /> Perpustakaan
          </h2>
          <button
            onClick={closePustakaModal}
            className="text-gray-500 hover:text-red-500 text-xl"
          >
            <i className="fa-solid fa-xmark" />
          </button>
        </div>

        {/* Tabs */}
        <div className="px-6 py-3 border-b border-[#1F1F21] flex gap-4 text-sm bg-[#1A1A1C]">
          {TABS.map((tab) => (
            <button
              key={tab}
              id={`tab-${tab}`}
              onClick={() => filterPustaka(tab)}
              className={`px-4 py-1.5 rounded-full font-semibold transition ${
                currentFilter === tab
                  ? 'bg-gray-200 text-black'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6" id="pustaka-content">
          {isLoading ? (
            <div className="w-full text-center text-gray-500 py-10">
              <i className="fa-solid fa-circle-notch fa-spin text-2xl" />
              <p className="mt-2">Memuat file...</p>
            </div>
          ) : pustakaFiles.length === 0 ? (
            <div className="w-full text-center text-gray-500 py-10">
              <i className="fa-regular fa-folder-open text-4xl mb-3 opacity-50" />
              <p>Pustaka masih kosong</p>
            </div>
          ) : (
            <div className="w-full flex flex-col space-y-1">
              {pustakaFiles.map((file) => {
                const isImage = isImageFile(file);
                const icon = isImage
                  ? <i className="fa-solid fa-image text-blue-400" />
                  : <i className="fa-solid fa-file-lines text-gray-400" />;
                const cleanName = file.name.substring(file.name.indexOf('_') + 1) || file.name;
                const date = new Date(file.created_at || file.last_modified).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
                const size = file.metadata?.size ? (file.metadata.size / 1024).toFixed(1) + ' KB' : '';

                return (
                  <div
                    key={file.name}
                    className="flex items-center justify-between p-3 rounded-xl border border-transparent hover:border-[#2A2A2E] hover:bg-[#1A1A1C] transition group"
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-[#252528] flex items-center justify-center shrink-0 shadow-sm">
                        {icon}
                      </div>
                      <div className="flex flex-col min-w-0">
                        <span className="text-sm text-gray-200 font-medium truncate" title={cleanName}>
                          {cleanName}
                        </span>
                        <span className="text-[11px] text-gray-500 mt-0.5 truncate">
                          {date}{size ? ` • ${size}` : ''}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0 ml-3">
                      <button
                        onClick={() => downloadFile(file.name)}
                        className="text-gray-500 hover:text-white w-8 h-8 rounded-lg flex items-center justify-center hover:bg-[#2A2A2E] transition"
                      >
                        <i className="fa-solid fa-download" />
                      </button>
                      <button
                        onClick={() => deleteFile(file.name)}
                        className="text-gray-500 hover:text-red-500 w-8 h-8 rounded-lg flex items-center justify-center hover:bg-red-500/10 transition"
                      >
                        <i className="fa-solid fa-trash" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
