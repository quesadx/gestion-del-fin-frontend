import { create } from "zustand";

export type ConnectionStatus = "checking" | "connected" | "disconnected";

interface ConnectionState {
  status: ConnectionStatus;
  /** Round-trip latency in ms from the last successful ping. */
  latencyMs: number | null;
  lastChecked: number | null;
}

interface ConnectionActions {
  /** Called by interceptors (no latency) or the ping hook (with latency). */
  setConnected: (latencyMs?: number) => void;
  setDisconnected: () => void;
  setChecking: () => void;
}

export const useConnectionStore = create<ConnectionState & ConnectionActions>()(
  (set) => ({
    status: "checking",
    latencyMs: null,
    lastChecked: null,

    setConnected: (latencyMs) =>
      set((prev) => ({
        status: "connected",
        // Only overwrite latency when the ping hook provides a measurement.
        latencyMs: latencyMs !== undefined ? latencyMs : prev.latencyMs,
        lastChecked: Date.now(),
      })),

    setDisconnected: () =>
      set({ status: "disconnected", latencyMs: null, lastChecked: Date.now() }),

    setChecking: () => set({ status: "checking" }),
  }),
);
