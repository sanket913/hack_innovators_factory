import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowRight, Eye } from "lucide-react";
import { MachineTable } from "@/components/factory/machine-table";
import { TrendChart } from "@/components/factory/charts";
import { MetricsSkeleton, PanelSkeleton, QueryState } from "@/components/factory/states";
import { Eyebrow, Metric, PageHeader, PulseTrace, SectionHeader, StatusBadge, TextLink } from "@/components/factory/ui";
import { useDashboard } from "@/lib/factory/queries";
import { formatINR } from "@/lib/factory/settings";
import type { TrendMetric } from "@/lib/factory/types";

const t = "Operations — FactoryPulse";
const d = "Current production performance, operational deviations, and investigation priorities.";
export const Route = createFileRoute("/operations")({ head: () => ({ meta: [{ title: t }, { name: "description", content: d }, { property: "og:title", content: t }, { property: "og:description", content: d }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" }] }), component: Overview });

const sign = (n: number) => `${n > 0 ? "+" : n < 0 ? "−" : ""}${Math.abs(Math.round(n))}%`;

function Overview() {
  const [metric, setMetric] = useState<TrendMetric>("production");
  const q = useDashboard();
  return <><PageHeader eyebrow="OPERATIONS OVERVIEW" title="Plant A" subtitle="Shift performance · Today"><span className="context-note">Plant A · Demo Environment</span></PageHeader>
    <QueryState query={q} label="plant overview" loading={<><MetricsSkeleton /><PanelSkeleton height={280} /></>}>{db => {
      const top = db.topInvestigation;
      const dev = (k: "production" | "downtime" | "defects" | "energy") => top ? sign(db.machines.find(m => m.id === top.machineId)!.baseline[k].deviationPercent) : "—";
      return <>
        <div className="metrics-grid">{db.metrics.map(m => <Metric key={m.label} {...m}/>)}</div>
        {top && <section className="investigation-hero"><div className="investigation-copy"><div className="hero-kicker"><span>ACTIVE INVESTIGATION</span><StatusBadge status={top.status}/></div><h2>{top.title}</h2><p className="hero-subtitle">{top.signals}</p><div className="deviation-grid">{([["Production", "production"], ["Downtime", "downtime"], ["Defects", "defects"], ["Energy", "energy"]] as const).map(([a, k]) => <div key={a}><span>{a}</span><strong>{dev(k)}</strong></div>)}</div><div className="hero-actions"><Link to="/investigate/$machineId" params={{ machineId: top.id }} className="button button-primary">Investigate {top.machineId} <ArrowRight size={16}/></Link><Link to="/investigate/$machineId" params={{ machineId: top.id }} hash="evidence" className="button button-ghost"><Eye size={16}/>View evidence</Link></div></div><div className="impact-block"><Eyebrow>ESTIMATED IMPACT</Eyebrow><div><strong>{top.impact.productionLossUnits}</strong><span>units</span></div><div><strong>{formatINR(top.impact.contributionImpact)}</strong><span>contribution impact</span></div><small>*{top.impact.formula}.</small><PulseTrace/></div></section>}
        <div className="overview-grid"><section className="panel"><SectionHeader label="INVESTIGATION QUEUE" title="What to review first" action={<TextLink to="/investigations">View queue</TextLink>}/>{db.queue.slice(0, 3).map((m, i) => <Link to="/investigate/$machineId" params={{ machineId: m.id }} className="priority-row" key={m.id} style={{ color: "inherit", textDecoration: "none" }}><span>0{i + 1}</span><div><strong>{m.machineId}</strong><small>{m.signals}</small></div><StatusBadge status={m.status}/><div className="priority-track"><i style={{ width: `${m.priority}%` }}/></div><b>{m.priority}</b></Link>)}<p className="section-note">Priority combines operational impact, deviation, evidence strength and persistence.</p></section><section className="panel"><SectionHeader label="PLANT PERFORMANCE" title="Operational trend"/><div className="segmented">{(["production", "downtime", "quality", "energy"] as const).map(x => <button key={x} onClick={() => setMetric(x)} className={metric === x ? "selected" : ""}>{x}</button>)}</div><TrendChart trend={db.trend} metric={metric}/></section></div>
        <section className="panel"><SectionHeader label="MACHINE STATUS" title="Current operating condition" action={<TextLink to="/machines">View all machines</TextLink>}/><MachineTable machines={db.machines} limit={4}/></section></>;
    }}</QueryState></>;
}
