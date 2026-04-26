import { mockData } from "../mockData";

export function TimePanel() {
  const { time } = mockData;
  return (
    <div className="pip-frame">
      <span className="pip-frame-title">CHRONO</span>
      <div className="pip-row">
        <div>
          <div className="pip-label">LOCAL TIME</div>
          <div className="pip-value lg">
            {time.clock}
            <span style={{ fontSize: "0.55em", opacity: 0.7, marginLeft: 4 }}>:{time.seconds}</span>
          </div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div className="pip-label">DATE</div>
          <div className="pip-value lg">{time.date}</div>
        </div>
      </div>
      <div style={{ height: 8 }} />
      <div className="pip-row">
        <div className="pip-label">DAYS SINCE ARRIVAL</div>
        <div className="pip-value">{String(time.daysSinceArrival).padStart(4, "0")}</div>
      </div>
    </div>
  );
}
