import { useAuth } from '../../context/AuthContext';

export default function ProfileButton() {
  const { user, isGuest, signOut } = useAuth();

  const handleClick = async () => {
    if (!isGuest && window.confirm('Keluar?')) {
      await signOut();
      localStorage.removeItem('isGuest');
      window.location.href = '/login';
    } else if (isGuest) {
      window.location.href = '/login';
    }
  };

  // Get display info
  let displayName = 'Loading...';
  let avatarText = '?';
  let statusText = '...';

  if (isGuest) {
    displayName = 'Sobat AI';
    avatarText = 'S';
    statusText = 'Login';
  } else if (user) {
    const namePart = user.email?.split('@')[0] || '';
    displayName = namePart.charAt(0).toUpperCase() + namePart.slice(1);
    avatarText = namePart.charAt(0).toUpperCase();
    statusText = 'Keluar';
  }

  return (
    <div
      onClick={handleClick}
      className="flex items-center gap-3 p-2 rounded-xl hover:bg-[#1A1A1C] cursor-pointer transition group w-full justify-center"
    >
      {/* Avatar: gradient yellow */}
      <div
        id="user-avatar"
        className="w-9 h-9 rounded-full bg-gradient-to-br from-yellow-600 to-yellow-400 flex items-center justify-center text-black font-bold shadow-lg flex-shrink-0"
      >
        {avatarText}
      </div>

      {/* Name + status */}
      <div className="flex-1 min-w-0 overflow-hidden hide-on-collapsed">
        <p
          id="user-display"
          className="text-sm font-bold truncate text-gray-200 group-hover:text-yellow-500 transition"
        >
          {displayName}
        </p>
        <p
          id="status-display"
          className="text-[10px] text-gray-500 truncate group-hover:text-yellow-500 transition"
        >
          {statusText}
        </p>
      </div>

      {/* Logout icon */}
      <i className="fa-solid fa-right-from-bracket text-gray-600 group-hover:text-red-500 transition text-xs hide-on-collapsed" />
    </div>
  );
}
