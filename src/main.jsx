import 'core-js/stable';
import 'regenerator-runtime/runtime';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom'
import App from './App.jsx'
import ErrorBoundary from './components/ErrorBoundary.jsx'
import './index.css'

const root = createRoot(document.getElementById('root'));

root.render(
  <ErrorBoundary>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </ErrorBoundary>
);

// Setelah React berhasil render → sembunyikan HTML fallback (spinner/error page)
if (typeof window.__hideFallback === 'function') {
  window.__hideFallback();
}
