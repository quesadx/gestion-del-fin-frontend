import { mockData } from '../mockData';

export function IdentityPanel() {
  const { operator } = mockData;
  return (
    <div className="pip-frame">
      <span className="pip-frame-title">OPERATOR</span>
      <div className="pip-row">
        <div>
          <div className="pip-label">NAME</div>
          <div className="pip-value">{operator.name}</div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div className="pip-label">ID</div>
          <div className="pip-value">{operator.id}</div>
        </div>
      </div>
      <div style={{ height: 8 }} />
      <div className="pip-row">
        <div>
          <div className="pip-label">CAMP</div>
          <div className="pip-value lg">{operator.camp}</div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div className="pip-label">ROLE</div>
          <div className="pip-value lg">{operator.role}</div>
        </div>
      </div>
    </div>
  );
}
