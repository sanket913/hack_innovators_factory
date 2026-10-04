import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowLeft, Check, ChevronRight, CircleHelp, Eye, Gauge, X } from "lucide-react";
import { TrendChart } from "@/components/factory/charts";
import { MetricsSkeleton, PanelSkeleton, QueryState } from "@/components/factory/states";
import { Eyebrow, PageHeader, PulseTrace, SectionHeader, StatusBadge } from "@/components/factory/ui";
import { useMachineInvestigation } from "@/lib/factory/queries";
import { formatINR } from "@/lib/factory/settings";
import type { Investigation as Inv, TrendMetric } from "@/lib/factory/types";

export const Route = createFileRoute("/investigate/$machineId")({
  head: ({ params }) => {
    const id = params.machineId.toUpperCase();
    const t = `${id} Investigation — FactoryPulse`;
    const d = `Evidence, impact, and recommended next checks for ${id}.`;
    return { meta: [{ title: t }, { name: "description", content: d }, { property: "og:title", content: t }, { property: "og:description", content: d }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" }] };
  },
  component: InvestigationPage,
});

function InvestigationPage() {
  const { machineId } = Route.useParams();
  const q = useMachineInvestigation(machineId);
  return <>
    <Link to="/investigations" className="back-link"><ArrowLeft size={15}/>Back to investigations</Link>
    <QueryState query={q} label="investigation" loading={<><MetricsSkeleton /><PanelSkeleton height={310} /></>}>{r => {
      if (r.kind === "not_found") return <div className="fp-empty"><strong>Machine {machineId.toUpperCase()} was not found.</strong><p>Choose a machine from the investigation queue.</p><Link to="/investigations" className="button button-primary">Open queue</Link></div>;
      if (!r.investigation) return <><PageHeader eyebrow="INVESTIGATION" title={`Machine ${r.machine.id}`} subtitle={r.machine.summary}><StatusBadge status={r.machine.status}/></PageHeader><div className="fp-empty"><strong>No active investigation for {r.machine.id}.</strong><p>{r.machine.id} is within its operating range (priority {r.machine.priority}/100). An investigation opens automatically when it deviates from baseline.</p><Link to="/machines/$machineId" params={{ machineId: r.machine.id.toLowerCase() }} className="button button-primary">View machine detail</Link></div></>;
      return <InvestigationView inv={r.investigation} />;
    }}</QueryState>
  </>;
}

function InvestigationView({ inv }: { inv: Inv }) {
  const [drawer, setDrawer] = useState(false);
  const [metric, setMetric] = useState<TrendMetric>("production");
  const observed = inv.evidence.filter(e => e.kind === "OBSERVED");
  const inferred = inv.evidence.find(e => e.kind === "INFERRED");
  const unknown = inv.evidence.find(e => e.kind === "NOT_ESTABLISHED");
  const contribution = inv.impact.productionLossUnits + inv.impact.additionalDefects > 0 ? inv.impact.contributionImpact / (inv.impact.productionLossUnits + inv.impact.additionalDefects) : 0;
  return <>
    <PageHeader eyebrow="INVESTIGATION" title={inv.title} subtitle={inv.summary}><div className="investigation-meta"><StatusBadge status={inv.status}/><span>Priority <b>{inv.priority} / 100</b></span><span>Detected <b>{inv.detectedAt}</b></span></div></PageHeader><PulseTrace/>
    <div className="investigation-layout"><div className="investigation-main">
      <section><SectionHeader label="WHAT CHANGED?" title="Deviation from operating baseline"/><div className="evidence-metrics">{inv.metrics.map(m => <div className="evidence-metric" key={m.key}><div><span>{m.label}</span><strong>{m.value}</strong><small>{m.comparison}</small></div><div className="comparison-bars"><label>Current<i style={{ width: `${m.current}%` }}/></label><label>Baseline<i className="baseline" style={{ width: `${m.baseline}%` }}/></label></div></div>)}</div></section>
      <section className="panel flush"><SectionHeader label="TREND VIEW" title="Deviation onset and persistence"/><div className="segmented">{(["production", "downtime", "quality", "energy"] as const).map(x => <button key={x} onClick={() => setMetric(x)} className={metric === x ? "selected" : ""}>{x}</button>)}</div><TrendChart trend={inv.trend} metric={metric} detailed/></section>
      <section id="evidence" className="evidence-section"><SectionHeader label="TRUST LAYER" title="Evidence"/><div className="evidence-columns"><article className="evidence-observed"><h3><Eye size={17}/>OBSERVED</h3><p>Directly calculated from available data.</p><ul>{observed.map(e => <li key={e.statement}>{e.statement}</li>)}</ul></article><article className="evidence-inferred"><h3><Gauge size={17}/>INFERENCE</h3><p>{inferred?.statement}</p></article><article className="evidence-unknown"><h3><CircleHelp size={17}/>NOT ESTABLISHED</h3><p>{unknown?.statement}</p></article></div></section>
      <section className="recommendation"><Eyebrow>RECOMMENDED INVESTIGATION</Eyebrow><h2>What should I check first?</h2><blockquote>{inv.recommendation.headline}</blockquote><ol>{inv.recommendation.reasons.map((x, i) => <li key={x}><span>0{i + 1}</span>{x}</li>)}</ol><h3>Suggested next checks</h3><ul>{inv.suggestedChecks.map(x => <li key={x}><Check size={15}/>{x}</li>)}</ul></section>
    </div>
    <aside className="investigation-side"><section className="impact-panel"><Eyebrow>ESTIMATED OPERATIONAL IMPACT</Eyebrow>{[["Production loss", `${inv.impact.productionLossUnits} units`], ["Excess downtime", `${inv.impact.excessDowntimeMin} min`], ["Additional defects", `${inv.impact.additionalDefects} units`], ["Contribution impact", formatINR(inv.impact.contributionImpact)]].map(([a, b]) => <div key={a}><span>{a}</span><strong>{b}</strong></div>)}<p><b>Estimate assumptions</b>{inv.impact.assumptions.map(a => <span key={a.label} style={{ display: "block" }}>{a.label}: {a.value}</span>)}</p><small>Decision-support estimates, not measured financial loss.</small><button className="button button-secondary" onClick={() => setDrawer(true)}>View calculation <ChevronRight size={15}/></button></section>
      <section className="timeline-panel"><Eyebrow>INVESTIGATION TIMELINE</Eyebrow>{inv.timeline.map(t => <div className={`timeline-item ${t.active ? "active" : ""}`} key={t.time}><time>{t.time}</time><span/><p>{t.event}</p></div>)}</section></aside></div>
    {drawer && <div className="modal-backdrop" role="presentation" onMouseDown={() => setDrawer(false)}><div className="drawer" role="dialog" aria-modal="true" aria-label="Impact calculation" onMouseDown={e => e.stopPropagation()}><button className="icon-button drawer-close" onClick={() => setDrawer(false)} aria-label="Close calculation"><X size={19}/></button><Eyebrow>CALCULATION DETAIL</Eyebrow><h2>Estimated contribution impact</h2><div className="formula"><span>Estimated lost units</span><strong>{inv.impact.productionLossUnits}</strong><i>+</i><span>Additional defect units</span><strong>{inv.impact.additionalDefects}</strong><i>×</i><span>Contribution value</span><strong>{formatINR(contribution)}</strong><i>=</i><b>{formatINR(inv.impact.contributionImpact)}</b></div><p>Formula: {inv.impact.formula}. Uses current shift deviation against the 7-day baseline; excludes labor, maintenance, scrap recovery and downstream effects.</p></div></div>}
  </>;
}
