import { useAuthStore } from '@/features/auth/store/auth.store';

export function IdentityPanel() {
  const user = useAuthStore((state) => state.user);
  const role = useAuthStore((state) => state.role);

  return (
    <div className="pip-frame">
      <span className="pip-frame-title">OPERATOR</span>
      <div className="pip-row">
        <div>
          <div className="pip-label">NAME</div>
          <div className="pip-value">{user?.username ?? 'UNKNOWN'}</div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div className="pip-label">ID</div>
          <div className="pip-value">{user?.id ?? 'UNKNOWN'}</div>
        </div>
      </div>
      <div style={{ height: 8 }} />
      <div className="pip-row">
        <div>
          <div className="pip-label">CAMP</div>
          <div className="pip-value lg">{user?.campId ?? 'NONE'}</div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div className="pip-label">ROLE</div>
          <div className="pip-value lg">{role ?? 'UNASSIGNED'}</div>
        </div>
      </div>
    </div>
  );
}
