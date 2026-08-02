import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

export default function LoginPage() {
  const navigate = useNavigate();
  const { user, isGuest, setGuestMode } = useAuth();

  const [mode, setMode] = useState('login'); // 'login' | 'register' | 'reset'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [msgBox, setMsgBox] = useState({ text: '', type: '' }); // type: 'err' | 'success'

  // Redirect if already logged in
  useEffect(() => {
    if (user && !isGuest) navigate('/');
  }, [user, isGuest, navigate]);

  // Check for recovery hash
  useEffect(() => {
    const hash = window.location.hash;
    if (hash.includes('type=recovery')) setMode('reset');
  }, []);

  const showMsg = (text, type) => setMsgBox({ text, type });
  const clearMsg = () => setMsgBox({ text: '', type: '' });

  const handleSubmit = async (e) => {
    e.preventDefault();
    clearMsg();

    if (!email.endsWith('@gmail.com')) {
      showMsg('Wajib menggunakan email @gmail.com', 'err');
      return;
    }
    if (mode !== 'reset' && password.length < 8) {
      showMsg('Password minimal 8 karakter', 'err');
      return;
    }

    setIsLoading(true);
    try {
      if (mode === 'login') {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) {
          let msg = error.message;
          if (msg.includes('Invalid login credentials')) msg = 'Email atau password salah.';
          if (msg.includes('rate limit')) msg = 'Terlalu banyak mencoba. Tunggu sebentar.';
          showMsg(msg, 'err');
          return;
        }
        showMsg('Berhasil masuk! Mengalihkan...', 'success');
        try { localStorage.removeItem('isGuest'); } catch { }
        setTimeout(() => navigate('/'), 800);

      } else if (mode === 'register') {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) { showMsg(error.message, 'err'); return; }
        showMsg('Akun dibuat! Silakan cek email/login.', 'success');
        setTimeout(() => setMode('login'), 2000);

      } else if (mode === 'reset') {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: window.location.origin + '/',
        });
        if (error) { showMsg(error.message, 'err'); return; }
        showMsg('Link reset dikirim! Cek email Anda.', 'success');
        setTimeout(() => setMode('login'), 3000);
      }
    } catch (err) {
      showMsg(err.message, 'err');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    try { localStorage.removeItem('isGuest'); } catch { }
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: window.location.origin + '/' },
      });
      if (error) showMsg(error.message, 'err');
    } catch (err) {
      showMsg(err.message, 'err');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGuest = () => {
    setGuestMode(true);
    navigate('/');
  };

  const toggleMode = () => {
    setMode(mode === 'login' ? 'register' : 'login');
    clearMsg();
  };

  const toggleResetMode = () => {
    setMode(mode === 'reset' ? 'login' : 'reset');
    clearMsg();
  };

  // Page title
  const getTitle = () => {
    if (mode === 'register') return 'Daftar Akun';
    if (mode === 'reset') return 'Reset Password';
    return 'Selamat Datang';
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-[#0F0F10] px-4 py-6">
      {/* Card */}
      <div className="w-full max-w-[380px] p-7 bg-gradient-to-b from-[#161618] to-[#121214] rounded-3xl border border-[#2A2A2E]/80 shadow-[0_20px_60px_rgba(0,0,0,0.8)] fade-in text-center relative overflow-hidden">

        {/* Glow effect */}
        <div className="absolute -top-10 left-1/2 -translate-x-1/2 w-40 h-40 bg-yellow-500/10 rounded-full blur-[60px] pointer-events-none" />

        {/* Logo and title */}
        <div id="logo-title" className="mb-6">
          <div className="w-14 h-14 bg-[#1F1F22] rounded-2xl mx-auto flex items-center justify-center mb-3 shadow-inner border border-[#2A2A2E]">
            <i className="fa-solid fa-robot text-2xl text-yellow-500" />
          </div>
          <h1 className="text-xl font-extrabold tracking-tight text-white">{getTitle()}</h1>
          <p className="text-xs text-gray-500 font-medium tracking-widest uppercase mt-0.5">KangaJie AI</p>
        </div>

        {/* Message box */}
        {msgBox.text && (
          <div
            id="msg-box"
            className={`mb-4 p-2.5 rounded-xl text-xs text-left font-bold border block ${
              msgBox.type === 'err'
                ? 'bg-red-900/20 text-red-300 border-red-500/50'
                : 'bg-green-900/20 text-green-300 border-green-500/50'
            }`}
          >
            {msgBox.type === 'err'
              ? <><i className="fa-solid fa-circle-exclamation mr-2" />{msgBox.text}</>
              : <><i className="fa-solid fa-circle-check mr-2" />{msgBox.text}</>
            }
          </div>
        )}

        {/* Google button */}
        <button
          type="button"
          id="btn-google"
          onClick={handleGoogleLogin}
          disabled={isLoading}
          className="w-full bg-white hover:bg-gray-100 text-gray-800 font-bold py-3 rounded-xl transition-all shadow-lg active:scale-95 flex items-center justify-center gap-2.5 cursor-pointer disabled:opacity-50 text-sm"
        >
          <svg width="18" height="18" viewBox="0 0 48 48">
            <path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24c0,11.045,8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z" />
            <path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z" />
            <path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z" />
            <path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571c0.001-0.001,0.002-0.001,0.003-0.002l6.19,5.238C36.971,39.205,44,34,44,24C44,22.659,43.862,21.35,43.611,20.083z" />
          </svg>
          <span>Lanjutkan dengan Google</span>
        </button>

        {/* Divider */}
        <div className="flex items-center gap-3 my-4">
          <div className="flex-1 h-px bg-[#2A2A2E]" />
          <span className="text-[10px] text-gray-500 uppercase tracking-wider">atau</span>
          <div className="flex-1 h-px bg-[#2A2A2E]" />
        </div>

        {/* Auth form */}
        <form id="auth-form" onSubmit={handleSubmit} className="space-y-3.5 text-left relative z-10">
          {/* Email field */}
          <div>
            <label className="text-xs font-bold text-gray-400 ml-3.5 uppercase tracking-wider">Email</label>
            <div className="relative group mt-1.5">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                <i className="fa-brands fa-google text-gray-500 group-focus-within:text-yellow-500 transition" />
              </div>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-3.5 py-3 bg-[#1A1A1C] rounded-xl border border-[#2A2A2E] text-white focus:border-yellow-500 focus:outline-none transition placeholder-gray-600 text-sm"
                placeholder="nama@gmail.com"
                required
                disabled={isLoading}
              />
            </div>
          </div>

          {/* Password field — hidden in reset mode */}
          {mode !== 'reset' && (
            <div id="password-container">
              <div className="flex justify-between items-center ml-3.5 mb-1.5">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Password</label>
                <button
                  type="button"
                  onClick={toggleResetMode}
                  className="text-xs text-yellow-600 hover:text-yellow-400 transition cursor-pointer font-semibold"
                >
                  Lupa Password?
                </button>
              </div>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <i className="fa-solid fa-key text-gray-500 group-focus-within:text-yellow-500 transition" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-10 py-3 bg-[#1A1A1C] rounded-xl border border-[#2A2A2E] text-white focus:border-yellow-500 focus:outline-none transition placeholder-gray-600 text-sm"
                  placeholder="••••••••"
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-3.5 text-gray-500 hover:text-white transition cursor-pointer flex items-center justify-center w-5 h-5"
                >
                  <i className={`fa-solid ${showPassword ? 'fa-eye-slash' : 'fa-eye'} text-xs`} />
                </button>
              </div>
            </div>
          )}

          {/* Submit button */}
          <button
            type="submit"
            id="btn-submit"
            disabled={isLoading}
            className="w-full bg-gradient-to-r from-yellow-600 to-yellow-500 hover:from-yellow-500 hover:to-yellow-400 text-black font-bold py-3 rounded-xl mt-3 transition-all shadow-lg shadow-yellow-500/20 active:scale-95 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 text-sm"
          >
            {isLoading ? (
              <><i className="fa-solid fa-circle-notch fa-spin" /> Memproses...</>
            ) : mode === 'reset' ? (
              <><span>Kirim Link Reset</span> <i className="fa-solid fa-paper-plane text-xs" /></>
            ) : mode === 'register' ? (
              <span>Daftar Sekarang</span>
            ) : (
              <><span>Masuk Sekarang</span> <i className="fa-solid fa-arrow-right text-xs" /></>
            )}
          </button>

          {/* Cancel reset button */}
          {mode === 'reset' && (
            <button
              type="button"
              id="btn-cancel-reset"
              onClick={() => setMode('login')}
              className="w-full text-gray-500 hover:text-white text-xs py-2 transition mt-1 cursor-pointer"
            >
              Batal
            </button>
          )}
        </form>

        {/* Footer links */}
        {mode !== 'reset' && (
          <div
            id="footer-links"
            className="mt-6 pt-4 pb-0.5 relative"
          >
            {/* Elegant gradient divider */}
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#2A2A2E] to-transparent" />

            <div className="flex items-center justify-between gap-2.5 text-xs font-medium">
              <button
                type="button"
                onClick={toggleMode}
                id="switch-btn"
                className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-[#1A1A1C]/80 hover:bg-[#252528] text-gray-300 hover:text-white transition-all border border-[#2A2A2E] hover:border-yellow-500/40 shadow-sm group cursor-pointer text-xs font-semibold"
              >
                {mode === 'login' ? (
                  <>
                    <i className="fa-solid fa-user-plus text-yellow-500 group-hover:scale-110 transition-transform text-xs" />
                    <span>Buat akun baru</span>
                  </>
                ) : (
                  <>
                    <i className="fa-solid fa-right-to-bracket text-yellow-500 group-hover:scale-110 transition-transform text-xs" />
                    <span>Sudah punya akun?</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={handleGuest}
                className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-[#1A1A1C]/80 hover:bg-[#252528] text-gray-400 hover:text-white transition-all border border-[#2A2A2E] hover:border-blue-500/40 shadow-sm group cursor-pointer text-xs font-semibold"
              >
                <i className="fa-solid fa-user-secret text-blue-400 group-hover:scale-110 transition-transform text-xs" />
                <span>Mode Tamu</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
