import type { UseQueryResult } from "@tanstack/react-query";
import { AlertTriangle, RotateCw } from "lucide-react";
import { useEffect, type ReactNode } from "react";

export function Skeleton({ h = 16, w = "100%", className = "" }: { h?: number | string; w?: number | string; className?: string }) {
  return <span className={`fp-skeleton ${className}`} style={{ height: h, width: w }} aria-hidden="true" />;
}

export function MetricsSkeleton({ count = 4 }: { count?: number }) {
  return <div className="metrics-grid" aria-hidden="true">{Array.from({ length: count }, (_, i) => <div className="metric" key={i}><Skeleton h={11} w="45%" /><Skeleton h={30} w="70%" className="fp-gap" /><Skeleton h={11} w="55%" className="fp-gap" /></div>)}</div>;
}

export function PanelSkeleton({ rows = 4, height }: { rows?: number; height?: number }) {
  return <section className="panel" aria-hidden="true"><Skeleton h={11} w={110} /><Skeleton h={20} w={220} className="fp-gap" />{height ? <Skeleton h={height} className="fp-gap-lg" /> : Array.from({ length: rows }, (_, i) => <Skeleton key={i} h={38} className="fp-gap" />)}</section>;
}

export function LoadingNote({ children }: { children: ReactNode }) {
  return <div className="fp-loading-note" role="status" aria-live="polite"><span className="fp-loading-dot" />{children}</div>;
}

export function ErrorState({ onRetry, retrying }: { onRetry: () => void; retrying?: boolean }) {
  return <div className="fp-error" role="alert">
    <AlertTriangle size={20} />
    <div><strong>Unable to load operational data.</strong><p>Check your connection and try again.</p></div>
    <button className="button button-primary" onClick={onRetry} disabled={retrying}><RotateCw size={15} className={retrying ? "fp-spin" : ""} />{retrying ? "Retrying…" : "Retry"}</button>
  </div>;
}

/** Renders loading skeleton, error-with-retry, or the data. */
export function QueryState<T>({ query, loading, label, children }: { query: UseQueryResult<T>; loading: ReactNode; label: string; children: (data: T) => ReactNode }) {
  useEffect(() => { if (query.error) console.error(`[FactoryPulse] ${label} failed`, query.error); }, [query.error, label]);
  if (query.data !== undefined) return <>{children(query.data)}</>;
  if (query.isError) return <ErrorState onRetry={() => void query.refetch()} retrying={query.isFetching} />;
  return <><LoadingNote>Loading {label}…</LoadingNote>{loading}</>;
}
