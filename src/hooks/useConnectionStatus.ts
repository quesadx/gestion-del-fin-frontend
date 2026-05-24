import { useCallback, useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { apiClient } from "../lib/api";
import { useConnectionStore } from "../store/connection";

/** Ping interval when the connection is healthy. */
const CONNECTED_INTERVAL_MS = 30_000;
/** Faster ping interval after a connection failure so we recover quickly. */
const DISCONNECTED_INTERVAL_MS = 5_000;

/**
 * Manages a recurring health-check against `/system/time`.
 *
 * - Updates `useConnectionStore` on every ping so any component can read status.
 * - Switches to a 5-second retry cycle when disconnected.
 * - Invalidates all React Query caches the moment the server comes back online
 *   so stale/errored queries automatically refetch.
 * - Returns a `retry()` function for manual reconnect attempts (e.g. from the
 *   disconnected banner).
 *
 * Call this hook **once** in `DashboardLayout` so the interval is tied to the
 * authenticated shell's lifetime.
 */
export function useConnectionStatus(): { retry: () => void } {
  const { status, setConnected, setDisconnected, setChecking } =
    useConnectionStore();
  const queryClient = useQueryClient();

  const inFlight = useRef(false);
  // "initial" means we haven't completed a ping yet — don't invalidate on first success.
  const prevStatus = useRef<"initial" | "connected" | "disconnected">(
    "initial",
  );

  const ping = useCallback(async () => {
    if (inFlight.current) return;
    inFlight.current = true;

    const t0 = performance.now();
    try {
      await apiClient.get("/system/time");
      const latency = Math.round(performance.now() - t0);

      const wasDisconnected = prevStatus.current === "disconnected";
      prevStatus.current = "connected";
      setConnected(latency);

      if (wasDisconnected) {
        // Server came back — refresh every cached query so stale/errored
        // data is replaced with fresh results immediately.
        queryClient.invalidateQueries();
      }
    } catch {
      prevStatus.current = "disconnected";
      setDisconnected();
    } finally {
      inFlight.current = false;
    }
  }, [setConnected, setDisconnected, queryClient]);

  // Fire an immediate ping on mount.
  useEffect(() => {
    ping();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Restart the interval whenever the status changes so the polling rate
  // adapts: 5s when disconnected, 30s otherwise.
  useEffect(() => {
    const ms =
      status === "disconnected"
        ? DISCONNECTED_INTERVAL_MS
        : CONNECTED_INTERVAL_MS;
    const id = setInterval(ping, ms);
    return () => clearInterval(id);
  }, [status, ping]);

  // Exposed so callers can trigger an immediate retry (e.g. a "RETRY NOW" button).
  const retry = useCallback(() => {
    setChecking();
    ping();
  }, [setChecking, ping]);

  return { retry };
}
