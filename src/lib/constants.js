// Fallback suggestions when Supabase fetch fails
export const FALLBACK_SUGGESTIONS = [
  { text: "Jelaskan konsep AI Generatif dengan sederhana", icon: "fa-brain", color: "#EAB308" },
  { text: "Bagaimana cara belajar programming untuk pemula?", icon: "fa-code", color: "#3B82F6" },
  { text: "Buatkan rencana bisnis untuk startup tech", icon: "fa-chart-line", color: "#10B981" },
  { text: "Apa saja tren teknologi di tahun 2026?", icon: "fa-rocket", color: "#8B5CF6" },
];

// Language to file extension mapping for code download
export const EXT_MAP = {
  'javascript': 'js',
  'typescript': 'ts',
  'python': 'py',
  'html': 'html',
  'css': 'css',
  'json': 'json',
  'bash': 'sh',
  'shell': 'sh',
  'sql': 'sql',
  'php': 'php',
  'java': 'java',
  'cpp': 'cpp',
  'c': 'c',
  'csharp': 'cs',
  'go': 'go',
  'ruby': 'rb',
  'rust': 'rs',
  'yaml': 'yml',
  'xml': 'xml',
  'markdown': 'md',
  'text': 'txt',
  'code': 'txt',
  'doc': 'doc',
  'docx': 'doc',
  'word': 'doc',
  'excel': 'csv',
  'csv': 'csv',
  'pdf': 'doc',
};

// Icon palette for daily suggestions (icon class, color)
export const ICON_PALETTE = [
  { icon: 'fa-newspaper', color: '#EAB308' },
  { icon: 'fa-flask', color: '#10B981' },
  { icon: 'fa-code', color: '#3B82F6' },
  { icon: 'fa-globe', color: '#8B5CF6' },
];

export const IMAGE_EDIT_KEYWORDS = /\b(edit|ubah|ganti|hapus|tambah|modif|warna|background|bg|jadikan|change|remove|replace|transform|berikan|coba|lebih|oke|keren|bagus|lagi|bagaimana|gimana|menarik|malam|siang|kota|neon|bokeh|polos|studio|suasana|latar|belakang)\b/i;

// Backend URL:
// - Development: '' (kosong) → Vite proxy forward /api/* ke localhost:3000
// - Production: pakai VITE_BACKEND_URL env var
export const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || '';

