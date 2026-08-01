import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';

export default function ResetPasswordModal({ isOpen, onClose }) {
  const { supabase } = useAuth();
  const [newPassword, setNewPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (newPassword.length < 8) {
      alert('Password minimal 8 karakter!');
      return;
    }

    setIsLoading(true);
    try {
      const { error: updateError } = await supabase.auth.updateUser({ password: newPassword });
      if (updateError) throw updateError;

      alert('Sukses! Password berhasil diperbarui.');
      onClose();
      window.history.replaceState({}, document.title, window.location.pathname);
    } catch (err) {
      alert('Gagal: ' + err.message);
    } finally {
      setIsLoading(false);
      setNewPassword('');
    }
  };

  if (!isOpen) return null;

  return (
    /* Matches HTML: hidden fixed inset-0 bg-black/80 z-[60] flex items-center justify-center backdrop-blur-sm px-4 */
    <div
      id="reset-password-modal"
      className="fixed inset-0 bg-black/80 z-[60] flex items-center justify-center backdrop-blur-sm px-4"
    >
      <div className="bg-[#141415] border border-[#2A2A2E] p-6 rounded-2xl w-full max-w-md shadow-2xl relative fade-in">
        <h3 className="text-xl font-bold text-white mb-2">Buat Password Baru</h3>
        <p className="text-gray-400 text-xs mb-4">Silakan masukkan password baru untuk akun Anda.</p>

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <input
              type="password"
              id="new-password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full px-4 py-3 bg-[#1A1A1C] border border-[#2A2A2E] rounded-xl text-white focus:border-yellow-500 focus:outline-none placeholder-gray-600 text-sm transition"
              placeholder="Password baru (min. 8 karakter)"
              required
              minLength={8}
              disabled={isLoading}
            />
          </div>
          <button
            type="submit"
            id="btn-update-pass"
            disabled={isLoading}
            className="w-full bg-gradient-to-r from-yellow-600 to-yellow-500 hover:from-yellow-500 hover:to-yellow-400 text-black font-bold py-3 rounded-xl transition text-sm shadow-lg disabled:opacity-50"
          >
            {isLoading ? (
              <><i className="fa-solid fa-circle-notch fa-spin" /> Menyimpan...</>
            ) : (
              'Simpan Password Baru'
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
