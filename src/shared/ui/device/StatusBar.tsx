import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/features/auth/store/auth.store';

export function StatusBar() {
  const navigate = useNavigate();
  const { token, logout } = useAuthStore();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="pip-topbar">
      <span>VAULT-TEC - PIP-BOY 3000 - SURVIVAL TERMINAL v2.4</span>
      <span style={{ display: 'inline-flex', gap: 14, alignItems: 'center' }}>
        <span>SIG</span>
        <span className="pip-signal">
          <i style={{ height: 3 }} />
          <i style={{ height: 5 }} />
          <i style={{ height: 7 }} />
          <i style={{ height: 9 }} />
          <i style={{ height: 5, opacity: 0.3 }} />
        </span>
        <span>BAT 87%</span>
        {token && (
          <button type="button" onClick={handleLogout} className="pip-topbar-action">
            REBOOT
          </button>
        )}
      </span>
    </div>
  );
}
