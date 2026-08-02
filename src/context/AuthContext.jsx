import { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { supabase } from '../lib/supabase';

// ─── Safe localStorage helper ──────────────────────────────────────────────
const safeStorage = {
  get:    (k)    => { try { return localStorage.getItem(k);    } catch { return null; } },
  set:    (k, v) => { try { localStorage.setItem(k, v);        } catch { /* ignored */ } },
  remove: (k)    => { try { localStorage.removeItem(k);        } catch { /* ignored */ } },
};

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser]                               = useState(null);
  const [isGuest, setIsGuest]                         = useState(false);
  const [isLoading, setIsLoading]                     = useState(true);
  const [showResetPasswordModal, setShowResetPasswordModal] = useState(false);
  const navigateRef = useRef(null);

  const setNavigate = useCallback((fn) => { navigateRef.current = fn; }, []);

  useEffect(() => {
    let cleanup = null;

    const init = async () => {
      try {
        setIsGuest(safeStorage.get('isGuest') === 'true');

        // Timeout 5 detik: jika Supabase hang (terjadi di Instagram karena storage diblokir),
        // langsung lanjutkan render tanpa session daripada stuck black screen selamanya.
        const result = await Promise.race([
          supabase.auth.getSession(),
          new Promise((res) => setTimeout(() => res({ data: { session: null } }), 5000)),
        ]);

        const session = result?.data?.session;
        if (session) {
          setUser(session.user);
          setIsGuest(false);
          safeStorage.remove('isGuest');
        }

        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
          if (event === 'PASSWORD_RECOVERY') setShowResetPasswordModal(true);
          setUser(session?.user || null);
          if (session) { setIsGuest(false); safeStorage.remove('isGuest'); }
        });

        cleanup = () => subscription.unsubscribe();
      } catch (err) {
        console.error('Auth init error:', err);
      } finally {
        // WAJIB: selalu selesaikan loading agar app tidak blank selamanya
        setIsLoading(false);
      }
    };

    init();
    return () => { if (cleanup) cleanup(); };
  }, []);

  const signOut = useCallback(async () => {
    try { await supabase.auth.signOut(); } catch { /* ignore */ }
    setUser(null);
    setIsGuest(false);
    safeStorage.remove('isGuest');
    if (navigateRef.current) navigateRef.current('/login');
    else window.location.href = '/login';
  }, []);

  const setGuestMode = useCallback((guest) => {
    setIsGuest(guest);
    if (guest) safeStorage.set('isGuest', 'true');
    else safeStorage.remove('isGuest');
  }, []);

  const requireAuth = useCallback(() => !!user && !isGuest, [user, isGuest]);

  const requireAuthOrRedirect = useCallback((msg = 'Harap Login terlebih dahulu. Login sekarang?') => {
    if (isGuest || !user) {
      if (window.confirm(msg)) {
        if (navigateRef.current) navigateRef.current('/login');
        else window.location.href = '/login';
      }
      return false;
    }
    return true;
  }, [user, isGuest]);

  return (
    <AuthContext.Provider value={{
      supabase, user, isGuest, isLoading,
      showResetPasswordModal, setShowResetPasswordModal,
      signOut, setGuestMode, requireAuth, requireAuthOrRedirect, setNavigate,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
