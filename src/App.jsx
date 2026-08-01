import { useEffect } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { SessionsProvider } from './context/SessionsContext';
import { PustakaProvider } from './context/PustakaContext';
import { ShareProvider } from './context/ShareContext';
import ChatPage from './pages/ChatPage';
import LoginPage from './pages/LoginPage';
import SharePage from './pages/SharePage';
import PrivacyPage from './pages/PrivacyPage';
import TermsPage from './pages/TermsPage';

// AppRoutes: has access to navigate + auth, registers navigate into AuthContext
function AppRoutes() {
  const navigate = useNavigate();
  const { setNavigate } = useAuth();

  useEffect(() => {
    setNavigate(navigate);
    // ✅ FIX: Bersihkan tanda '#' atau hash sisa OAuth dari URL agar selalu bersih tanpa '#'
    const cleanUrlHash = () => {
      if (window.location.hash && !window.location.hash.includes('type=recovery')) {
        window.history.replaceState(null, '', window.location.pathname + window.location.search);
      }
    };
    cleanUrlHash();
    const timer = setTimeout(cleanUrlHash, 300);
    return () => clearTimeout(timer);
  }, [navigate, setNavigate]);

  return (
    <Routes>
      <Route path="/" element={<ChatPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/share" element={<SharePage />} />
      <Route path="/privacy" element={<PrivacyPage />} />
      <Route path="/terms" element={<TermsPage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <AuthProvider>
      <SessionsProvider>
        <PustakaProvider>
          <ShareProvider>
            <AppRoutes />
          </ShareProvider>
        </PustakaProvider>
      </SessionsProvider>
    </AuthProvider>
  );
}

export default App;
