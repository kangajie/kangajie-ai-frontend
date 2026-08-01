export default function FilePreview({ preview, onClear }) {
  if (!preview) return null;

  const iconMap = {
    pdf: 'fa-file-pdf text-red-400',
    doc: 'fa-file-word text-blue-400', docx: 'fa-file-word text-blue-400',
    xls: 'fa-file-excel text-green-400', xlsx: 'fa-file-excel text-green-400',
    csv: 'fa-file-csv text-green-400', ods: 'fa-file-excel text-green-400',
    pptx: 'fa-file-powerpoint text-orange-400', ppt: 'fa-file-powerpoint text-orange-400',
    zip: 'fa-file-zipper text-yellow-400', rar: 'fa-file-zipper text-yellow-400',
    '7z': 'fa-file-zipper text-yellow-400',
    json: 'fa-file-code text-yellow-300', xml: 'fa-file-code text-yellow-300',
    py: 'fa-file-code text-blue-300', js: 'fa-file-code text-yellow-300',
    ts: 'fa-file-code text-blue-400', html: 'fa-file-code text-orange-300',
    css: 'fa-file-code text-purple-300', sql: 'fa-database text-cyan-400',
  };

  const ext = preview.fileName?.split('.').pop()?.toLowerCase() || '';
  const iconClass = iconMap[ext] || 'fa-file text-gray-400';

  return (
    /* Matches HTML: absolute bottom-full mb-3 bg-[#1A1A1C] p-2 rounded-xl border border-[#333] */
    <div
      id="file-preview-container"
      className="absolute bottom-full mb-3 left-0 bg-[#1A1A1C] p-2 rounded-xl border border-[#333] flex items-center gap-3 fade-in shadow-xl w-full md:w-auto max-w-full overflow-hidden"
    >
      <div id="preview-content" className="shrink-0">
        {preview.type === 'image' ? (
          <img
            src={preview.src}
            alt="Preview"
            className="w-8 h-8 object-cover rounded border border-gray-600"
          />
        ) : (
          <i className={`fa-solid ${iconClass} text-xl`} />
        )}
      </div>
      <span id="file-name" className="text-xs text-gray-300 truncate max-w-[150px]">
        {preview.fileName}
      </span>
      <button
        onClick={onClear}
        className="text-gray-500 hover:text-red-500 ml-auto p-2"
      >
        <i className="fa-solid fa-xmark" />
      </button>
    </div>
  );
}
