import { useState, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { usePustaka } from '../../hooks/usePustaka';
import { getExtensionFromLanguage } from '../../lib/utils';

export default function CodeBlock({ className, children, node, inline, ...props }) {
  const { requireAuthOrRedirect } = useAuth();
  const { uploadFile } = usePustaka();

  const [isCopied, setIsCopied] = useState(false);
  const [isDownloaded, setIsDownloaded] = useState(false);

  // For inline code, render simple <code>
  if (inline) {
    return <code className={className} {...props}>{children}</code>;
  }

  // Extract language from className (e.g. "language-javascript")
  const language = (() => {
    if (!className) return 'text';
    const langMatch = className.match(/language-(\w+)/);
    return langMatch ? langMatch[1] : 'text';
  })();

  const langLabel = language.charAt(0).toUpperCase() + language.slice(1);

  // ✅ CRITICAL FIX: In react-markdown v10, children for code blocks is a string directly
  // Extract text from children (handle both string and array cases)
  const extractCodeText = (ch) => {
    if (typeof ch === 'string') return ch;
    if (Array.isArray(ch)) {
      return ch.map(c => {
        if (typeof c === 'string') return c;
        if (c && typeof c === 'object' && c.props) return extractCodeText(c.props.children);
        return '';
      }).join('');
    }
    if (ch && typeof ch === 'object' && ch.props) return extractCodeText(ch.props.children);
    return String(ch || '');
  };

  const codeText = extractCodeText(children);

  // Handle copy
  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(codeText).then(() => {
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    }).catch(console.error);
  }, [codeText]);

  // Handle download + save to Pustaka
  const handleDownload = useCallback(async () => {
    if (!requireAuthOrRedirect('Harap Login terlebih dahulu untuk menyimpan kode. Login sekarang?')) {
      return;
    }

    const ext = getExtensionFromLanguage(language);
    const prefix = ['doc', 'docx', 'word', 'pdf'].includes(language?.toLowerCase())
      ? 'KangAjie-Dokumen'
      : ['csv', 'excel'].includes(language?.toLowerCase())
        ? 'KangAjie-Data'
        : 'KangAjie-Code';
    const filename = `${prefix}-${Date.now().toString().slice(-4)}.${ext}`;
    const mimeMap = {
      doc: 'application/msword',
      docx: 'application/msword',
      csv: 'text/csv',
      md: 'text/markdown',
      txt: 'text/plain',
      html: 'text/html',
      json: 'application/json',
      js: 'application/javascript',
      py: 'text/x-python',
    };
    const mimeType = mimeMap[ext] || 'text/plain';
    const blob = new Blob([codeText], { type: mimeType });

    try {
      // Save to Pustaka
      await uploadFile(blob, filename);

      // Also trigger browser download
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.click();
      window.URL.revokeObjectURL(url);

      setIsDownloaded(true);
      setTimeout(() => setIsDownloaded(false), 2000);
    } catch (error) {
      console.error('Error downloading code:', error);
      // Fallback: just browser download without Pustaka
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.click();
      window.URL.revokeObjectURL(url);
    }
  }, [codeText, language, requireAuthOrRedirect, uploadFile]);

  return (
    <div className="code-wrapper">
      <div className="code-header">
        <span className="flex items-center gap-2 text-gray-400">
          <i className="fa-solid fa-code text-[10px] text-gray-500" />
          <span className="font-medium">{langLabel}</span>
        </span>
        <div className="flex items-center gap-3 text-gray-500">
          <button
            onClick={handleDownload}
            className="flex items-center gap-1.5 hover:text-yellow-400 transition-colors"
            title="Unduh kode"
          >
            <i className={`fa-solid ${isDownloaded ? 'fa-check text-green-500' : 'fa-download text-[10px]'}`} />
            <span className="text-xs">{isDownloaded ? 'Tersimpan' : 'Unduh'}</span>
          </button>
          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 hover:text-yellow-400 transition-colors"
            title="Salin kode"
          >
            <i className={`fa-regular ${isCopied ? 'fa-check text-green-500' : 'fa-copy text-[10px]'}`} />
            <span className="text-xs">{isCopied ? 'Tersalin' : 'Salin'}</span>
          </button>
        </div>
      </div>
      <pre {...props}>
        <code className={className}>
          {children}
        </code>
      </pre>
    </div>
  );
}
