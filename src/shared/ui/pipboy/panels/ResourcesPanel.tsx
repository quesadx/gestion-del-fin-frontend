import { mockData } from "../mockData";
import { SegmentBar } from "../SegmentBar";

export function ResourcesPanel() {
  return (
    <div className="pip-frame">
      <span className="pip-frame-title">RESOURCES</span>
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {mockData.resources.map((r) => (
          <div key={r.label}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
              <span className="pip-label">{r.label}</span>
              <span className={`pip-value ${r.tone === "warn" ? "amber" : ""}`} style={{ fontSize: 16 }}>
                {r.value} / {r.capacity}
              </span>
            </div>
            <SegmentBar fill={r.fill} tone={r.tone} segments={20} />
          </div>
        ))}
      </div>
    </div>
  );
}
