"use client";
import { useCallback, useEffect, useRef, useState } from "react";
export function useFeed<T>(
  url: string | null,
  interval: number,
  enabled = true,
) {
  const [state, setState] = useState<{
    url: string | null;
    data: T | null;
    loading: boolean;
    error: string | null;
    receivedAt: number | null;
  }>({ url: null, data: null, loading: false, error: null, receivedAt: null });
  const controller = useRef<AbortController | null>(null);
  const generation = useRef(0);
  const refresh = useCallback(async () => {
    if (!url) return;
    controller.current?.abort();
    const control = new AbortController();
    controller.current = control;
    const id = ++generation.current;
    setState((s) => ({
      ...s,
      url,
      data: s.url === url ? s.data : null,
      loading: true,
      error: null,
    }));
    const timeout = setTimeout(() => control.abort(), 65000);
    try {
      const response = await fetch(url, { signal: control.signal });
      const result = await response.json();
      if (!response.ok)
        throw new Error(
          result.error ||
            result.errors?.[0]?.message ||
            "Data source is unavailable.",
        );
      if (id === generation.current)
        setState({
          url,
          data: result,
          loading: false,
          error: null,
          receivedAt: Date.now(),
        });
    } catch (e) {
      if (id === generation.current)
        setState((s) => ({
          ...s,
          loading: false,
          error: control.signal.aborted
            ? "The request timed out. Retry when ready."
            : e instanceof Error
              ? e.message
              : "Unable to update.",
        }));
    } finally {
      clearTimeout(timeout);
    }
  }, [url]);
  useEffect(() => {
    refresh();
    return () => {
      generation.current++;
      controller.current?.abort();
    };
  }, [refresh]);
  useEffect(() => {
    if (!url?.startsWith("/api/analytics")) return;
    const update = () => {
      refresh();
    };
    window.addEventListener("zentai-refresh", update);
    return () => window.removeEventListener("zentai-refresh", update);
  }, [url, refresh]);
  useEffect(() => {
    if (!enabled || !url || !interval) return;
    const timer = setInterval(() => {
      if (document.visibilityState === "visible") refresh();
    }, interval);
    const resume = () => {
      if (document.visibilityState === "visible") refresh();
    };
    document.addEventListener("visibilitychange", resume);
    return () => {
      clearInterval(timer);
      document.removeEventListener("visibilitychange", resume);
    };
  }, [enabled, url, interval, refresh]);
  return {
    ...state,
    data: state.url === url ? state.data : null,
    loading: !!url && (state.url !== url || state.loading),
    refresh,
  };
}
