import { Link } from "@tanstack/react-router";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { ArrowUpRight, Check, CircleCheck, FileChartColumn, RotateCcw, Upload, Wrench } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useDataStatus, useEnergy, useInvestigations, useMachines, useQuality, useReports } from "@/lib/factory/queries";
import { DEFAULT_SETTINGS, LIMITS, saveSettings, useSettings, validateSettings, type SettingsErrors } from "@/lib/factory/settings";
import { MachineTable } from "./machine-table";
import { MetricsSkeleton, PanelSkeleton, QueryState, Skeleton } from "./states";
import { Metric, PageHeader, SectionHeader, StatusBadge } from "./ui";

const ListSkeleton = ({ rows = 4 }: { rows?: number }) => <section className="queue-list" aria-hidden="true">{Array.from({ length: rows }, (_, i) => <div className="queue-row" key={i}><Skeleton h={22} /></div>)}</section>;

export function InvestigationsPage() {
  const q = useInvestigations();
  return <><PageHeader eyebrow="PRIORITY QUEUE" title="Investigations" subtitle="Operational deviations ranked by impact, persistence and evidence strength."/>
    <QueryState query={q} label="investigation queue" loading={<ListSkeleton />}>{list => <section className="queue-list">{list.map((m, i) => <Link to="/investigate/$machineId" params={{ machineId: m.id }} className="queue-row" key={m.id}><span className="queue-number">0{i + 1}</span><div><strong>{m.machineId}</strong><small>{m.signals}</small></div><StatusBadge status={m.status}/><div className="priority-track"><span style={{ width: `${m.priority}%` }}/></div><b>{m.priority}</b><ArrowUpRight size={17}/></Link>)}</section>}</QueryState>
    <p className="section-note">Priority combines operational impact, deviation from baseline, evidence strength and persistence.</p></>;
}

export function MachinesPage() {
  const q = useMachines();
  return <><PageHeader eyebrow="ASSET MONITOR" title="Machines" subtitle="Performance and operating condition across the plant."/>
    <QueryState query={q} label="machines" loading={<PanelSkeleton rows={4} />}>{machines => <section className="panel"><MachineTable machines={machines}/></section>}</QueryState></>;
}

export function QualityPage() {
  const q = useQuality();
  return <><PageHeader eyebrow="QUALITY CONTROL" title="Quality" subtitle="Defect patterns and machine contribution for the current shift."/>
    <QueryState query={q} label="quality data" loading={<><MetricsSkeleton /><div className="split-grid"><PanelSkeleton /><PanelSkeleton height={260} /></div></>}>{d => {
      const top = d.categories.slice().sort((a, b) => b.units - a.units)[0];
      return <><div className="metrics-grid"><Metric label="Defect rate" value={`${d.defectRate}%`} delta={`↑ ${Math.round((d.defectRate - d.baselineRate) * 10) / 10} pp`} tone="investigate"/><Metric label="Defect units" value={String(d.defectUnits)} delta={`${d.topMachine.defects} from ${d.topMachine.id}`} tone="watch"/><Metric label="Baseline" value={`${d.baselineRate}%`} delta="7-day average"/><Metric label="Primary category" value={top?.name ?? "—"} delta={top ? `${top.share}% of defects` : "—"}/></div>
        <div className="split-grid"><section className="panel"><SectionHeader label="DEFECT DISTRIBUTION" title="Categories"/><div className="bar-list">{d.categories.map(c => <div className="bar-row" key={c.name}><span>{c.name}</span><div><i style={{ width: `${c.share}%` }}/></div><b>{c.share}%</b></div>)}</div></section><section className="panel"><SectionHeader label="CONTRIBUTION" title="Defect rate by machine (%)"/><ResponsiveContainer width="100%" height={260}><BarChart data={d.byMachine}><CartesianGrid vertical={false} stroke="var(--chart-grid)"/><XAxis dataKey="id"/><YAxis/><Tooltip/><Bar dataKey="quality" name="Defect rate %" fill="var(--investigate)" radius={[2, 2, 0, 0]}/></BarChart></ResponsiveContainer></section></div></>;
    }}</QueryState></>;
}

export function EnergyPage() {
  const q = useEnergy();
  return <><PageHeader eyebrow="ENERGY PERFORMANCE" title="Energy" subtitle="Consumption relative to production output and baseline."/>
    <QueryState query={q} label="energy data" loading={<><MetricsSkeleton /><PanelSkeleton height={300} /></>}>{d => <><div className="metrics-grid"><Metric label="Plant intensity" value={`${d.intensity} kWh/unit`} delta="Calculated"/><Metric label="Baseline" value={`${d.baselineIntensity} kWh/unit`} delta="7-day average"/><Metric label="Deviation" value={`${d.deviationPercent > 0 ? "+" : ""}${d.deviationPercent}%`} delta={d.deviationPercent >= 0 ? "above baseline" : "below baseline"} tone="watch"/><Metric label="Current use" value={`${d.totalKwh} kWh`} delta="This shift"/></div><section className="panel"><SectionHeader label="MACHINE COMPARISON" title="Current consumption (kWh)"/><ResponsiveContainer width="100%" height={300}><BarChart data={d.byMachine}><CartesianGrid vertical={false} stroke="var(--chart-grid)"/><XAxis dataKey="name"/><YAxis/><Tooltip/><Bar dataKey="value" name="kWh" fill="var(--steel)" radius={[2, 2, 0, 0]}/></BarChart></ResponsiveContainer></section></>}</QueryState></>;
}

export function ReportsPage() {
  const q = useReports();
  return <><PageHeader eyebrow="INVESTIGATION RECORD" title="Investigation reports" subtitle="Review current and resolved operational findings."/>
    <QueryState query={q} label="reports" loading={<ListSkeleton />}>{reports => <section className="report-list">{reports.map(r => {
      const inner = <><FileChartColumn size={18}/><div><strong>{r.title}</strong><small>{r.date} · {r.summary}</small></div><span>{r.status}</span><ArrowUpRight size={17}/></>;
      return r.investigationId
        ? <Link className="report-row" to="/investigate/$machineId" params={{ machineId: r.investigationId }} key={r.id}>{inner}</Link>
        : <Link className="report-row" to="/machines/$machineId" params={{ machineId: r.machineId.toLowerCase() }} key={r.id}>{inner}</Link>;
    })}</section>}</QueryState></>;
}

export function DataPage() {
  const q = useDataStatus();
  const input = useRef<HTMLInputElement>(null);
  const [result, setResult] = useState<{ ok: boolean; text: string } | null>(null);
  async function validate(file?: File) {
    if (!file) return;
    const text = await file.text();
    const header = text.split(/\r?\n/)[0]?.split(",").map(s => s.trim()) ?? [];
    const required = ["timestamp", "machine_id", "production_output", "downtime_minutes", "defect_quantity", "energy_consumption"];
    const missing = required.filter(c => !header.includes(c));
    const rows = text.split(/\r?\n/).filter(Boolean).length - 1;
    setResult(missing.length ? { ok: false, text: `Missing required column${missing.length > 1 ? "s" : ""}: ${missing.join(", ")}` } : { ok: true, text: `${file.name} passed column validation (${rows} rows). Validation only — the demo continues to use the seeded dataset.` });
  }
  return <><PageHeader eyebrow="SOURCE HEALTH" title="Operational data" subtitle="Dataset coverage, validation and CSV checks."/>
    <QueryState query={q} label="data status" loading={<ListSkeleton rows={5} />}>{d => <section className="source-list">{d.sources.map(s => <div key={s.name}><span><i className={s.status === "Partial" ? "partial" : ""}/>{s.name}</span><b>{s.status}</b><small>{s.detail}</small></div>)}<div><span><i/>Dataset</span><b>{d.validation.status === "PASSED" ? "Validated" : "Warnings"}</b><small>{d.recordCount} records · {d.machinesCovered.join(", ")}</small></div></section>}</QueryState>
    <section className="upload-panel"><Upload size={24}/><h2>Validate an operational CSV</h2><p>Check a dataset's columns before it is added. The demo workspace keeps using the seeded dataset.</p><input ref={input} type="file" accept=".csv,text/csv" hidden onChange={e => void validate(e.target.files?.[0])}/><button className="button button-primary" onClick={() => input.current?.click()}>Choose CSV</button><div className="required-columns">Required: timestamp, machine_id, production_output, downtime_minutes, defect_quantity, energy_consumption</div>{result && <div className={`validation-result ${result.ok ? "valid" : "invalid"}`}>{result.ok ? <CircleCheck size={17}/> : <Wrench size={17}/>}<span>{result.text}</span></div>}</section></>;
}

export function SettingsPage() {
  const { settings, hydrated } = useSettings();
  const [form, setForm] = useState({ plantName: settings.plantName, contributionPerUnit: String(settings.contributionPerUnit), horizonHours: String(settings.horizonHours) });
  const [errors, setErrors] = useState<SettingsErrors>({});
  const [saved, setSaved] = useState(false);
  useEffect(() => { setForm({ plantName: settings.plantName, contributionPerUnit: String(settings.contributionPerUnit), horizonHours: String(settings.horizonHours) }); }, [settings]);
  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) => { setForm(f => ({ ...f, [k]: e.target.value })); setSaved(false); };
  function submit(e: React.FormEvent) {
    e.preventDefault();
    const r = validateSettings(form);
    if (!r.ok) { setErrors(r.errors); setSaved(false); return; }
    setErrors({});
    saveSettings(r.value);
    setSaved(true);
  }
  function reset() { saveSettings(DEFAULT_SETTINGS); setErrors({}); setSaved(true); }
  return <><PageHeader eyebrow="PLANT CONFIGURATION" title="Settings" subtitle="Plant label and economic assumptions used by impact and What-If estimates. Saved in this browser."/>
    <form className="settings-list" onSubmit={submit} noValidate aria-busy={!hydrated}>
      <label><span>Plant</span><input name="plantName" value={form.plantName} onChange={set("plantName")} aria-invalid={!!errors.plantName} maxLength={80}/>{errors.plantName && <small className="fp-field-error">{errors.plantName}</small>}</label>
      <label><span>Contribution value (₹/unit)</span><input name="contributionPerUnit" type="number" inputMode="decimal" min={LIMITS.contributionPerUnit.min} max={LIMITS.contributionPerUnit.max} value={form.contributionPerUnit} onChange={set("contributionPerUnit")} aria-invalid={!!errors.contributionPerUnit}/>{errors.contributionPerUnit ? <small className="fp-field-error">{errors.contributionPerUnit}</small> : <small className="fp-field-hint">Used for estimated impact and avoided loss.</small>}</label>
      <label><span>Deviation horizon (hours)</span><input name="horizonHours" type="number" inputMode="numeric" min={LIMITS.horizonHours.min} max={LIMITS.horizonHours.max} step={1} value={form.horizonHours} onChange={set("horizonHours")} aria-invalid={!!errors.horizonHours}/>{errors.horizonHours ? <small className="fp-field-error">{errors.horizonHours}</small> : <small className="fp-field-hint">How long an unaddressed deviation is assumed to persist in What-If.</small>}</label>
      <label><span>Baseline period</span><input value="7 days" disabled readOnly/><small className="fp-field-hint">Fixed by the seeded demo dataset.</small></label>
      <label><span>Currency · Units</span><input value="INR ₹ · Units · kWh" disabled readOnly/><small className="fp-field-hint">Fixed for this demo environment.</small></label>
      <div className="fp-settings-actions"><button type="submit" className="button button-primary">Save settings</button><button type="button" className="button button-secondary" onClick={reset}><RotateCcw size={14}/>Restore defaults</button>{saved && <span className="fp-saved" role="status"><Check size={16}/>Settings saved</span>}</div>
    </form></>;
}
