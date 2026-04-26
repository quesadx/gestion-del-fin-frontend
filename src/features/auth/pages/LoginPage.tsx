import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../store/auth.store";

export function LoginPage() {
  const navigate = useNavigate();
  const login = useAuthStore((state) => state.login);

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const fullTitle = "RESTRICTED ACCESS";
  const [displayedTitle, setDisplayedTitle] = useState("");

  const playTickSound = () => {
    try {
      const AudioContext =
        window.AudioContext ||
        (
          window as unknown as {
            webkitAudioContext: typeof window.AudioContext;
          }
        ).webkitAudioContext;
      if (!AudioContext) return;
      const ctx = new AudioContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = "square";
      osc.frequency.setValueAtTime(150, ctx.currentTime);
      gain.gain.setValueAtTime(0.05, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.05);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.05);
    } catch {
      // Autoplay restrictions can block this until user interacts.
    }
  };

  useEffect(() => {
    let currentIdx = 0;
    const interval = setInterval(() => {
      currentIdx += 1;
      setDisplayedTitle(fullTitle.substring(0, currentIdx));
      playTickSound();

      if (currentIdx >= fullTitle.length) {
        clearInterval(interval);
      }
    }, 120);

    return () => clearInterval(interval);
  }, []);

  const handleBypass = (e?: React.MouseEvent) => {
    if (e) e.preventDefault();

    login("fake-jwt-token-777", {
      id: "u-001",
      username: username || "ADMIN_DEV",
      role: "system_admin",
      campId: "camp-alpha",
    });

    navigate("/dashboard");
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    handleBypass();
  };

  return (
    <>
      <div className="pip-frame">
        <span className="pip-frame-title">ACCESS</span>
        <div className="pip-row" style={{ marginBottom: 6 }}>
          <span className="pip-label">STATUS</span>
          <span className="pip-value">LOCKED</span>
        </div>
        <form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <div>
            <div className="pip-label" style={{ marginBottom: 4 }}>
              LOGIN
            </div>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoComplete="off"
              spellCheck={false}
              className="pip-input"
            />
          </div>
          <div>
            <div className="pip-label" style={{ marginBottom: 4 }}>
              KEY
            </div>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="pip-input"
            />
          </div>
          <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
            <button type="submit" className="pip-button">
              EXECUTE
            </button>
            <button type="button" onClick={handleBypass} className="pip-button">
              BYPASS
            </button>
          </div>
        </form>
      </div>

      <div className="pip-frame">
        <span className="pip-frame-title">NOTICE</span>
        <div className="pip-value lg">{displayedTitle}</div>
        <div style={{ height: 6 }} />
        <div className="pip-label">PROPRIETARY OF ELORG CORP</div>
        <div className="pip-label">DIVISION 7 CLEARANCE REQUIRED</div>
      </div>

      <div className="pip-frame">
        <span className="pip-frame-title">SESSION LOG</span>
        <div className="pip-row">
          <span className="pip-label">KERNEL</span>
          <span className="pip-value">4.1.0-RED</span>
        </div>
        <div style={{ height: 6 }} />
        <div className="pip-row">
          <span className="pip-label">UPTIME</span>
          <span className="pip-value">334:12:09</span>
        </div>
        <div style={{ height: 6 }} />
        <div className="pip-row">
          <span className="pip-label">LOC</span>
          <span className="pip-value">55.7558 N / 37.6173 E</span>
        </div>
      </div>

      <div className="pip-frame">
        <span className="pip-frame-title">SECURITY</span>
        <div className="pip-row">
          <span className="pip-label">ENCRYPTION</span>
          <span className="pip-value">1024-BIT</span>
        </div>
        <div style={{ height: 6 }} />
        <div className="pip-row">
          <span className="pip-label">HARDWARE</span>
          <span className="pip-value">WRIST-UNIT M-V</span>
        </div>
        <div style={{ height: 6 }} />
        <div className="pip-row">
          <span className="pip-label">SERIAL</span>
          <span className="pip-value">#E-99-001</span>
        </div>
      </div>
    </>
  );
}
