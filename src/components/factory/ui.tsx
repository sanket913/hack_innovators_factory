import { Link } from "@tanstack/react-router";
import { ChevronRight } from "lucide-react";
import type { ReactNode } from "react";
import type { MachineStatus } from "@/lib/factory/types";

export function StatusBadge({ status }: { status: MachineStatus | "CRITICAL" | "RESOLVED" }) {
  return <span className={`status status-${status.toLowerCase()}`}><span aria-hidden="true" />{status}</span>;
}

export function Eyebrow({ children }: { children: ReactNode }) {
  return <div className="eyebrow">{children}</div>;
}

export function PageHeader({ eyebrow, title, subtitle, children }: { eyebrow?: string; title: string; subtitle?: string; children?: ReactNode }) {
  return <header className="page-header">
    <div>{eyebrow && <Eyebrow>{eyebrow}</Eyebrow>}<h1>{title}</h1>{subtitle && <p>{subtitle}</p>}</div>
    {children && <div className="header-actions">{children}</div>}
  </header>;
}

export function SectionHeader({ label, title, action }: { label?: string; title: string; action?: ReactNode }) {
  return <div className="section-header"><div>{label && <Eyebrow>{label}</Eyebrow>}<h2>{title}</h2></div>{action}</div>;
}

export function Metric({ label, value, delta, tone = "neutral", note }: { label: string; value: string; delta?: string; tone?: "neutral" | "normal" | "watch" | "investigate"; note?: string }) {
  return <div className="metric"><div className="metric-label">{label}</div><div className="metric-value">{value}</div>{delta && <div className={`metric-delta tone-${tone}`}>{delta}</div>}{note && <div className="metric-note">{note}</div>}</div>;
}

export function PulseTrace({ compact = false }: { compact?: boolean }) {
  return <svg className={`pulse-trace ${compact ? "compact" : ""}`} viewBox="0 0 420 28" aria-hidden="true" preserveAspectRatio="none"><path d="M0 16 H84 L94 16 L101 5 L110 24 L121 10 L129 16 H207 L216 16 L224 7 L233 22 L242 16 H310 L319 16 L326 10 L334 20 L343 16 H420" /></svg>;
}

export function TextLink({ to, children }: { to: "/machines" | "/investigations" | "/simulate" | "/reports"; children: ReactNode }) {
  return <Link to={to} className="text-link">{children}<ChevronRight size={15} /></Link>;
}
