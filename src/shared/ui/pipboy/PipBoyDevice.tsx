import type { ReactNode } from "react";
import { PipBoyScreenShell } from "./PipBoyScreenShell";

interface Props {
  children: ReactNode;
}

export function PipBoyDevice({ children }: Props) {
  return (
    <div className="pip-stage">
      <div className="pip-shadow" aria-hidden />
      <div className="pip-device" role="img" aria-label="Pip-Boy 3000 survival terminal">
        <span className="pip-face pip-face-top" aria-hidden />
        <span className="pip-face pip-face-bottom" aria-hidden />
        <span className="pip-face pip-face-left" aria-hidden />
        <span className="pip-face pip-face-right" aria-hidden />

        <div className="pip-front">
          <span className="pip-vent" aria-hidden />
          <span className="pip-dial" aria-hidden>
            <span className="pip-dial-tick" />
          </span>

          <span className="pip-antenna" aria-hidden>
            <span className="pip-antenna-base" />
            <span className="pip-antenna-mast" />
            <span className="pip-antenna-coil" />
            <span className="pip-antenna-tip" />
          </span>

          <span className="pip-stamp">VAULT-TEC INDUSTRIES - MODEL 3000</span>
          <span className="pip-screw tl" />
          <span className="pip-screw tr" />
          <span className="pip-screw bl" />
          <span className="pip-screw br" />

          <PipBoyScreenShell>{children}</PipBoyScreenShell>

          <span className="pip-led" />
          <span className="pip-switch s1" />
          <span className="pip-switch s2" />
          <span className="pip-knob left" />
          <span className="pip-knob right" />
        </div>
      </div>
    </div>
  );
}
