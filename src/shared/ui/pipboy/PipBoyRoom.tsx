import { useEffect, useRef, useState, type ReactNode } from "react";
import { PipBoyDevice } from "./PipBoyDevice";

const MAX_ROT_Y = 22;
const MAX_ROT_X = 14;

interface Props {
  children: ReactNode;
}

export function PipBoyRoom({ children }: Props) {
  const roomRef = useRef<HTMLElement | null>(null);
  const [hint, setHint] = useState(true);

  useEffect(() => {
    const room = roomRef.current;
    if (!room) return;

    let dragging = false;
    let startX = 0;
    let startY = 0;
    let baseRotY = 0;
    let baseRotX = 0;
    let curRotY = 0;
    let curRotX = 0;

    const apply = (rx: number, ry: number) => {
      room.style.setProperty("--pip-rot-x", `${rx}deg`);
      room.style.setProperty("--pip-rot-y", `${ry}deg`);
    };

    const onPointerDown = (e: PointerEvent) => {
      dragging = true;
      startX = e.clientX;
      startY = e.clientY;
      baseRotY = curRotY;
      baseRotX = curRotX;
      room.classList.add("pip-dragging");
      room.setPointerCapture(e.pointerId);
      setHint(false);
    };

    const onPointerMove = (e: PointerEvent) => {
      if (!dragging) return;
      const dx = e.clientX - startX;
      const dy = e.clientY - startY;
      const ry = Math.max(-MAX_ROT_Y, Math.min(MAX_ROT_Y, baseRotY + dx * 0.08));
      const rx = Math.max(-MAX_ROT_X, Math.min(MAX_ROT_X, baseRotX - dy * 0.06));
      curRotY = ry;
      curRotX = rx;
      apply(rx, ry);
    };

    const onPointerUp = (e: PointerEvent) => {
      if (!dragging) return;
      dragging = false;
      room.classList.remove("pip-dragging");
      try {
        room.releasePointerCapture(e.pointerId);
      } catch {
        // no-op
      }
      room.classList.add("pip-easing");
      curRotX = 0;
      curRotY = 0;
      apply(0, 0);
      window.setTimeout(() => room.classList.remove("pip-easing"), 900);
    };

    apply(0, 0);
    room.addEventListener("pointerdown", onPointerDown);
    room.addEventListener("pointermove", onPointerMove);
    room.addEventListener("pointerup", onPointerUp);
    room.addEventListener("pointercancel", onPointerUp);

    return () => {
      room.removeEventListener("pointerdown", onPointerDown);
      room.removeEventListener("pointermove", onPointerMove);
      room.removeEventListener("pointerup", onPointerUp);
      room.removeEventListener("pointercancel", onPointerUp);
    };
  }, []);

  return (
    <main ref={roomRef} className="pip-room">
      <h1 className="sr-only">Pip-Boy 3000 Survival Terminal</h1>
      <PipBoyDevice>{children}</PipBoyDevice>
      {hint && (
        <div className="pip-drag-hint" aria-hidden>
          &lt; DRAG TO ROTATE &gt;
        </div>
      )}
    </main>
  );
}
