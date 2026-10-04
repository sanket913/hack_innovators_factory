import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { TrendChart } from "@/components/factory/charts";
import { MetricsSkeleton, PanelSkeleton, QueryState } from "@/components/factory/states";
import { Metric, PageHeader, SectionHeader, StatusBadge } from "@/components/factory/ui";
import { useMachineInvestigation } from "@/lib/factory/queries";

export const Route = createFileRoute("/machines/$machineId")({
  head: ({ params }) => {
    const id = params.machineId.toUpperCase();
    const t = `${id} — FactoryPulse`;
    const d = `Operating detail for machine ${id}.`;
    return { meta: [{ title: t }, { name: "description", content: d }, { property: "og:title", content: t }, { property: "og:description", content: d }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" }] };
  },
  component: MachineDetail,
});

function MachineDetail() {
  const { machineId } = Route.useParams();
  const q = useMachineInvestigation(machineId);
  return <><Link to="/machines" className="back-link"><ArrowLeft size={15}/>Back to machines</Link>
    <QueryState query={q} label="machine detail" loading={<><MetricsSkeleton /><PanelSkeleton height={310} /></>}>{r => {
      if (r.kind === "not_found") return <div className="fp-empty"><strong>Machine {machineId.toUpperCase()} was not found.</strong><p>Choose a machine from the list.</p><Link to="/machines" className="button button-primary">View machines</Link></div>;
      const m = r.machine;
      return <><PageHeader eyebrow="MACHINE DETAIL" title={`${m.id} · ${m.name}`} subtitle={m.summary}><StatusBadge status={m.status}/></PageHeader>
        <div className="metrics-grid"><Metric label="Output vs baseline" value={`${m.output}%`} tone={m.status === "INVESTIGATE" ? "investigate" : "normal"}/><Metric label="Downtime" value={`${m.downtime} min`}/><Metric label="Defect rate" value={`${m.quality}%`}/><Metric label="Energy" value={`${m.energy} kWh`}/></div>
        {r.investigation && <section className="panel"><SectionHeader label="SHIFT TREND" title="Production performance"/><TrendChart trend={r.investigation.trend} detailed/></section>}
        <Link to="/investigate/$machineId" params={{ machineId: m.id.toLowerCase() }} className="button button-primary">{r.investigation ? "Open investigation" : "View investigation status"}</Link></>;
    }}</QueryState></>;
}
