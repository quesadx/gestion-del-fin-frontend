import type { ReactNode } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/features/auth/store/auth.store';

interface Props {
  children: ReactNode;
}

const NAV_ITEMS = [
  { path: '/dashboard', label: 'STAT' },
  { path: '/inventory', label: 'INV' },
  { path: '/people', label: 'DATA' },
  { path: '/explorations', label: 'MAP' },
  { path: '/transfers', label: 'RADIO' },
];

export function PipBoyScreenShell({ children }: Props) {
  const location = useLocation();
  const navigate = useNavigate();
  const { token, logout } = useAuthStore();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="pip-screen-well">
      <div className="pip-screen">
        <div className="pip-content">
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

          {token && (
            <>
              <div className="pip-h">
                &gt;{' '}
                {NAV_ITEMS.map((item, index) => {
                  const isActive = location.pathname.startsWith(item.path);
                  return (
                    <span key={item.path}>
                      <Link className={`pip-tab${isActive ? ' active' : ''}`} to={item.path}>
                        {item.label}
                      </Link>
                      {index < NAV_ITEMS.length - 1 ? '  /  ' : ''}
                    </span>
                  );
                })}
              </div>
              <div className="pip-divider" />
            </>
          )}

          <div className="pip-grid">{children}</div>

          <div className="pip-divider" />
          <div className="pip-footer">
            <span>
              &gt; SYSTEM NOMINAL
              <span className="pip-cursor" />
            </span>
            <span className="pip-label">
              UPLINK <span className="pip-spin" />
            </span>
          </div>
        </div>

        <div className="pip-scanlines" />
        <div className="pip-roll" />
        <div className="pip-flicker" />
        <div className="pip-vignette" />
        <div className="pip-boot" />
      </div>
    </div>
  );
}
