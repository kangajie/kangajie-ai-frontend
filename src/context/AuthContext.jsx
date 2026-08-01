import { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { supabase } from '../lib/supabase';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isGuest, setIsGuest] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showResetPasswordModal, setShowResetPasswordModal] = useState(false);

  // Navigation callback — set by App or ChatPage via useEffect
  const navigateRef = useRef(null);

  const setNavigate = useCallback((navigateFn) => {
    navigateRef.current = navigateFn;
  }, []);

  // Initialize auth state
  useEffect(() => {
    let cleanup = null;

    const initializeAuth = async () => {
      try {
        // Check localStorage for guest mode
        const storedGuest = localStorage.getItem('isGuest') === 'true';
        setIsGuest(storedGuest);

        // Get current session
        const { data: { session } } = await supabase.auth.getSession();

        if (session) {
          setUser(session.user);
          setIsGuest(false);
          localStorage.removeItem('isGuest');
        }

        // Set up auth state listener
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
          (event, session) => {
            if (event === 'PASSWORD_RECOVERY') {
              setShowResetPasswordModal(true);
            }
            setUser(session?.user || null);
            if (session) {
              setIsGuest(false);
              localStorage.removeItem('isGuest');
            }
          }
        );

        cleanup = () => subscription.unsubscribe();
      } catch (error) {
        console.error('Auth initialization error:', error);
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();

    return () => {
      if (cleanup) cleanup();
    };
  }, []);

  // Sign out
  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setUser(null);
    setIsGuest(false);
    localStorage.removeItem('isGuest');
    // Navigate to login using React Router if available, else fallback
    if (navigateRef.current) {
      navigateRef.current('/login');
    } else {
      window.location.href = '/login';
    }
  }, []);

  // Set guest mode
  const setGuestMode = useCallback((guest) => {
    setIsGuest(guest);
    if (guest) {
      localStorage.setItem('isGuest', 'true');
    } else {
      localStorage.removeItem('isGuest');
    }
  }, []);

  // Require auth helper - returns true if user is authenticated
  const requireAuth = useCallback(() => {
    return !!user && !isGuest;
  }, [user, isGuest]);

  // ✅ FIX: Guest guard — uses React Router navigate if available, fallback to location.href
  const requireAuthOrRedirect = useCallback((message = 'Harap Login terlebih dahulu untuk menggunakan fitur ini. Login sekarang?') => {
    if (isGuest || !user) {
      if (window.confirm(message)) {
        if (navigateRef.current) {
          navigateRef.current('/login');
        } else {
          window.location.href = '/login';
        }
      }
      return false;
    }
    return true;
  }, [user, isGuest]);

  const value = {
    supabase,
    user,
    isGuest,
    isLoading,
    showResetPasswordModal,
    setShowResetPasswordModal,
    signOut,
    setGuestMode,
    requireAuth,
    requireAuthOrRedirect,
    setNavigate,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
