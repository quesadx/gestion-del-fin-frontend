import { mockData } from "../mockData";

const compass = `   N
 NW | NE
W---+---E
 SW | SE
   S`;

export function LocationPanel() {
  const { location } = mockData;
  return (
    <div className="pip-frame">
      <span className="pip-frame-title">LOCATION</span>
      <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 12, alignItems: "start" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", rowGap: 4, columnGap: 10 }}>
          <div>
            <div className="pip-label">COORDS</div>
            <div className="pip-value">{location.coords}</div>
          </div>
          <div>
            <div className="pip-label">SECTOR</div>
            <div className="pip-value">{location.sector}</div>
          </div>
          <div>
            <div className="pip-label">SHELTER</div>
            <div className="pip-value">{location.shelterDistance}</div>
          </div>
          <div>
            <div className="pip-label">THREATS</div>
            <div className={`pip-value ${location.threats > 0 ? "amber" : ""}`}>
              {String(location.threats).padStart(2, "0")}
            </div>
          </div>
        </div>
        <div style={{ textAlign: "center" }}>
          <div className="pip-label">HEADING</div>
          <div className="pip-compass">{compass}</div>
          <div className="pip-value" style={{ marginTop: 2 }}>
            {location.heading}
          </div>
        </div>
      </div>
    </div>
  );
}
