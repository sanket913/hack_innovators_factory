import type { CalcInput, CalcOptions, Investigation, MachineInvestigationResult, InvestigationMetric, InvestigationSummary, Report, SimulationResult } from "./types";
import { resolveOptions, allBaselines, computeImpact, computePriority, deviatedSlots, engineUtils, getSeed, NotFoundError, statusFromPriority, ValidationError } from "./engines.server";
import { ASSUMPTIONS, HISTORICAL_REPORTS, MACHINE_SEEDS, SHIFT_SLOTS } from "./seed-data.server";
import { getMachine, getTrend, machineSummary } from "./factory-service.server";

const { round, mean } = engineUtils;
const fmtPct = (p: number) => `${Math.round(Math.abs(p))}% ${p < 0 ? "below" : "above"} baseline`;
const bar = (v: number, max: number) => Math.round((v / max) * 92);

/** Investigations exist for every machine that is not NORMAL. ID = lowercase machine id. */
export function listInvestigations(): InvestigationSummary[] {
  return MACHINE_SEEDS.map(s => {
    const priority = computePriority(s.id).score;
    const dev = deviatedSlots(s.id);
    return {
      id: s.id.toLowerCase(),
      machineId: s.id,
      title: `${s.id} ${machineSummary(s.id) === "Within operating range" ? "Operating review" : "Operational deviation"}`,
      status: statusFromPriority(priority),
      priority,
      signals: machineSummary(s.id),
      detectedAt: dev.length ? `Today, ${SHIFT_SLOTS[dev[0]!]}` : "—",
    };
  }).sort((a, b) => b.priority - a.priority);
}

export function getInvestigation(id: string, opts: CalcInput = {}): Investigation {
  const contribution = resolveOptions(opts).contributionPerUnit;
  const summary = listInvestigations().find(i => i.id === id.toLowerCase());
  if (!summary || summary.status === "NORMAL") throw new NotFoundError(`Unknown investigation: ${id}`);
  const seed = getSeed(summary.machineId);
  const b = allBaselines(seed.id);
  const pb = computePriority(seed.id);
  const impact = computeImpact(seed.id, contribution);
  const dev = deviatedSlots(seed.id);
  const rate = round((b.defects.current / b.production.current) * 100, 1);
  const baseRate = round((b.defects.baseline / b.production.baseline) * 100, 1);

  const metrics: InvestigationMetric[] = [
    { key: "production", label: "Production", value: `${b.production.current} units`, comparison: fmtPct(b.production.deviationPercent), current: b.production.current, baseline: b.production.baseline },
    { key: "downtime", label: "Downtime", value: `${b.downtime.current} min`, comparison: fmtPct(b.downtime.deviationPercent), current: b.downtime.current, baseline: b.downtime.baseline },
    { key: "defects", label: "Defects", value: `${b.defects.current} units`, comparison: fmtPct(b.defects.deviationPercent), current: b.defects.current, baseline: b.defects.baseline },
    { key: "energy", label: "Energy", value: `${b.energy.current} kWh`, comparison: fmtPct(b.energy.deviationPercent), current: b.energy.current, baseline: b.energy.baseline },
  ].map(m => { const max = Math.max(m.current, m.baseline); return { ...m, current: bar(m.current, max), baseline: bar(m.baseline, max) } as InvestigationMetric; });

  const observed: string[] = [];
  if (b.downtime.deviationPercent > 10) observed.push(`Downtime increased ${Math.round(b.downtime.deviationPercent)}% compared with baseline.`);
  if (b.production.deviationPercent < -5) observed.push(`Production decreased ${Math.round(-b.production.deviationPercent)}% during the same period.`);
  if (b.defects.deviationPercent > 10) observed.push(`Defect rate increased from ${baseRate}% to ${rate}%.`);
  if (b.energy.deviationPercent > 5) observed.push(`Energy use increased ${Math.round(b.energy.deviationPercent)}% compared with baseline.`);
  if (dev.length > 1) observed.push(`The deviations overlap from ${SHIFT_SLOTS[dev[0]!]} across ${dev.length} consecutive observations.`);

  const multi = summary.status === "INVESTIGATE";
  const inference = multi
    ? `The simultaneous movement of downtime, output and quality makes ${seed.id} process conditions a high-priority investigation candidate.`
    : `The ${summary.signals.toLowerCase()} on ${seed.id} is gradual and worth monitoring before it affects output.`;

  const reasons = [
    b.downtime.deviationPercent > 20 ? "Downtime is significantly above baseline." : `Downtime is ${Math.round(b.downtime.deviationPercent)}% above baseline.`,
    b.production.deviationPercent < -10 ? "Production dropped during the same period." : "Production is slightly below baseline.",
    b.defects.deviationPercent > 20 ? "Defect rate increased simultaneously." : "Defect rate is close to its normal range.",
    dev.length >= 3 ? "The pattern persists across multiple observations." : "The pattern is not yet persistent.",
  ];

  const onset = dev.length ? SHIFT_SLOTS[dev[0]!]! : SHIFT_SLOTS[0];
  const timeline = SHIFT_SLOTS.map((t, i) => {
    const event = seed.current.maintenance?.[i];
    if (i === dev[0]) return { time: t, event: event ? `${seed.id} anomaly detected — ${event}` : `${seed.id} anomaly detected`, active: true };
    if (dev.includes(i)) return { time: t, event: i === dev.at(-1) ? "Investigation candidate generated" : "Deviation persists", active: true };
    return { time: t, event: "Normal", active: false };
  }).filter((_, i) => dev.length === 0 || i >= Math.max(0, dev[0]! - 2));

  return {
    ...summary,
    title: `Machine ${seed.id}`,
    priorityBreakdown: pb,
    severity: pb.score >= 70 ? "HIGH" : pb.score >= 30 ? "MEDIUM" : "LOW",
    summary: `${summary.signals} detected on ${seed.id} from ${onset}.`,
    metrics,
    evidence: [
      ...observed.map(statement => ({ kind: "OBSERVED" as const, statement })),
      { kind: "INFERRED", statement: inference },
      { kind: "NOT_ESTABLISHED", statement: "The available data does not prove the exact root cause. Physical inspection or additional maintenance and process data may be required." },
      { kind: "ESTIMATED", statement: `Production loss of ${impact.productionLossUnits} units and contribution impact of ₹${impact.contributionImpact.toLocaleString("en-IN")}.` },
      { kind: "ASSUMED", statement: `Contribution value of ₹${contribution}/unit.` },
    ],
    impact,
    recommendation: { headline: `Investigate ${seed.id} process conditions first.`, reasons },
    suggestedChecks: [
      "Review recent maintenance events",
      `Inspect process conditions around ${onset}`,
      `Compare ${seed.id} with the previous normal shift`,
      "Check whether the defect increase began with the downtime event",
    ],
    timeline,
    trend: getTrend(seed.id),
  };
}

export function listReports(): Report[] {
  const live: Report[] = listInvestigations().filter(i => i.status !== "NORMAL").map(i => ({
    id: `r-${i.id}`,
    title: `${i.machineId} ${i.signals.includes("+") ? "Operational" : i.signals.replace(" deviation", "")} Deviation`,
    date: "Today",
    machineId: i.machineId,
    status: i.status === "INVESTIGATE" ? "High priority" : "Watch",
    priority: i.priority,
    summary: `${i.signals} detected from ${i.detectedAt.replace("Today, ", "")}. Priority ${i.priority}/100.`,
    investigationId: i.id,
  }));
  return [...live, ...HISTORICAL_REPORTS.map(r => ({ ...r, investigationId: null }))];
}

/** What-if: stopping M-04 for maintenance. All rates derived from the seeded deviation window. */
export function simulateMaintenance(hours: number, machineId = "M-04", opts: CalcInput = {}): SimulationResult {
  const o = resolveOptions(opts);
  if (!Number.isFinite(hours) || hours < ASSUMPTIONS.minSimulationHours || hours > ASSUMPTIONS.maxSimulationHours || (hours * 2) % 1 !== 0) {
    throw new ValidationError(`Maintenance duration must be between ${ASSUMPTIONS.minSimulationHours} and ${ASSUMPTIONS.maxSimulationHours} hours in 0.5 h steps.`);
  }
  const seed = getSeed(machineId);
  const b = allBaselines(seed.id);
  const dev = deviatedSlots(seed.id);
  const window = dev.length ? dev : SHIFT_SLOTS.map((_, i) => i);
  const productionPerHour = round(mean(window.map(i => seed.current.production[i]!)), 2);
  const energyPerHour = round(mean(window.map(i => seed.current.energy[i]!)), 2);
  const defectsPerHour = mean(window.map(i => seed.current.defects[i]!));
  const slots = SHIFT_SLOTS.length;
  const deviationLossPerHour = round(b.production.baseline / slots - productionPerHour + (defectsPerHour - b.defects.baseline / slots), 3);
  const c = o.contributionPerUnit;
  const horizon = o.horizonHours;
  const avoidedLoss = Math.round(deviationLossPerHour * horizon * c - productionPerHour * hours * c);
  return {
    label: "SIMULATION",
    hours,
    productionImpactUnits: -Math.round(productionPerHour * hours),
    energyImpactKwh: -Math.round(energyPerHour * hours),
    avoidedLoss,
    currentDowntimeMin: b.downtime.current,
    rates: { productionPerHour, energyPerHour, contributionPerUnit: c, deviationLossPerHour, horizonHours: horizon },
    assumptions: [
      { label: "Production rate", value: `${productionPerHour} units/hour`, kind: "CALCULATED" },
      { label: "Energy rate", value: `${energyPerHour} kWh/hour`, kind: "CALCULATED" },
      { label: "Deviation loss rate", value: `${deviationLossPerHour} units/hour`, kind: "CALCULATED" },
      { label: "Contribution value", value: `₹${c}/unit`, kind: "ASSUMED" },
      { label: "Deviation horizon", value: `${horizon} hours if not addressed`, kind: "ASSUMED" },
    ],
    disclaimer: "Results are estimates based on current production patterns and stated assumptions. They do not guarantee future production, energy or quality outcomes.",
  };
}

/** Resolves machineId → machine → investigation (null when the machine is within operating range). */
export function getMachineInvestigation(machineId: string, opts: CalcInput = {}): MachineInvestigationResult {
  const seed = MACHINE_SEEDS.find(m => m.id.toLowerCase() === machineId.toLowerCase());
  if (!seed) return { kind: "not_found", machineId };
  const machine = getMachine(seed.id);
  const investigation = machine.status === "NORMAL" ? null : getInvestigation(seed.id, opts);
  return { kind: "ok", machine, investigation };
}
