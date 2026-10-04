import type { CalcInput, CalcOptions, DashboardData, DataStatus, EnergyData, Machine, QualityData, Trend, TrendPoint } from "./types";
import { allBaselines, computePriority, deviatedSlots, engineUtils, getSeed, statusFromPriority } from "./engines.server";
import { DATASET, MACHINE_SEEDS, PLANT, SHIFT_SLOTS } from "./seed-data.server";
import { listInvestigations, getInvestigation } from "./investigation-service.server";

const { round, sum } = engineUtils;
const slots = SHIFT_SLOTS.length;

function observation(machineId: string, i: number) {
  const s = getSeed(machineId);
  const production = s.current.production[i]!;
  const defects = s.current.defects[i]!;
  return {
    timestamp: `${PLANT.date}T${SHIFT_SLOTS[i]}:00+05:30`,
    time: SHIFT_SLOTS[i]!,
    machineId: s.id,
    productionOutput: production,
    productionTarget: s.targetPerHour,
    downtimeMinutes: s.current.downtime[i]!,
    defectQuantity: defects,
    defectRate: round((defects / production) * 100, 1),
    energyKwh: s.current.energy[i]!,
    maintenanceEvent: s.current.maintenance?.[i] ?? null,
    operatingShift: "A" as const,
  };
}

export function machineSummary(machineId: string): string {
  const b = allBaselines(machineId);
  const parts: string[] = [];
  if (b.production.deviationPercent <= -10) parts.push("Production");
  if (b.downtime.deviationPercent >= 20) parts.push("Downtime");
  if (b.defects.deviationPercent >= 20) parts.push("Quality");
  if (b.energy.deviationPercent >= 10) parts.push("Energy");
  if (!parts.length) return "Within operating range";
  if (parts.length === 1 || (parts.length === 2 && parts.includes("Energy"))) return `${parts.at(-1)} deviation`;
  return parts.filter(p => p !== "Energy").join(" + ");
}

export function getMachine(machineId: string): Machine {
  const s = getSeed(machineId);
  const b = allBaselines(s.id);
  const priority = computePriority(s.id).score;
  const production = b.production.current;
  const defects = b.defects.current;
  return {
    id: s.id,
    name: s.name,
    status: statusFromPriority(priority),
    output: round((production / b.production.baseline) * 100, 1),
    downtime: b.downtime.current,
    quality: round((defects / production) * 100, 1),
    energy: b.energy.current,
    production,
    defects,
    priority,
    summary: machineSummary(s.id),
    latestObservation: observation(s.id, slots - 1),
    baseline: b,
  };
}

export function listMachines(): Machine[] {
  return MACHINE_SEEDS.map(s => getMachine(s.id));
}

function trendPoint(ids: string[], i: number): TrendPoint {
  const seeds = ids.map(getSeed);
  const bases = ids.map(allBaselines);
  const prod = sum(seeds.map(s => s.current.production[i]!));
  const prodBase = sum(bases.map(b => b.production.baseline)) / slots;
  const def = sum(seeds.map(s => s.current.defects[i]!));
  const energy = sum(seeds.map(s => s.current.energy[i]!));
  const energyBase = sum(bases.map(b => b.energy.baseline)) / slots;
  return {
    time: SHIFT_SLOTS[i]!,
    production: round((prod / prodBase) * 100, 1),
    downtime: sum(seeds.map(s => s.current.downtime[i]!)),
    quality: round(((prod - def) / prod) * 100, 1),
    energy: round((energy / energyBase) * 100, 1),
  };
}

/** Trend for one machine, or the whole plant when machineId is omitted. */
export function getTrend(machineId?: string): Trend {
  const ids = machineId ? [getSeed(machineId).id] : MACHINE_SEEDS.map(s => s.id);
  const focus = machineId ? getSeed(machineId).id : "M-04";
  const dev = deviatedSlots(focus);
  return {
    points: SHIFT_SLOTS.map((_, i) => trendPoint(ids, i)),
    deviationStart: dev.length ? SHIFT_SLOTS[dev[0]!]! : null,
    deviationEnd: dev.length ? SHIFT_SLOTS[dev.at(-1)!]! : null,
    label: `${focus} deviation`,
  };
}

function plantTotals() {
  const ms = MACHINE_SEEDS.map(s => allBaselines(s.id));
  const t = (k: "production" | "downtime" | "defects" | "energy", f: "current" | "baseline") => round(sum(ms.map(b => b[k][f])), 2);
  return {
    production: t("production", "current"), productionBase: t("production", "baseline"),
    downtime: t("downtime", "current"), downtimeBase: t("downtime", "baseline"),
    defects: t("defects", "current"), defectsBase: t("defects", "baseline"),
    energy: t("energy", "current"), energyBase: t("energy", "baseline"),
  };
}

const pct = (cur: number, base: number) => round(((cur - base) / base) * 100, 1);

export function getDashboard(opts: CalcInput = {}): DashboardData {
  const machines = listMachines();
  const t = plantTotals();
  const eff = round((t.production / t.productionBase) * 100, 1);
  const rate = round((t.defects / t.production) * 100, 1);
  const baseRate = round((t.defectsBase / t.productionBase) * 100, 1);
  const queue = listInvestigations();
  const statusSummary = { NORMAL: 0, WATCH: 0, INVESTIGATE: 0 };
  machines.forEach(m => statusSummary[m.status]++);
  const events = machines.flatMap(m => {
    const s = getSeed(m.id);
    return (s.current.maintenance ?? []).flatMap((e, i) => (e ? [{ time: SHIFT_SLOTS[i]!, machineId: m.id, event: e }] : []));
  });
  return {
    plantName: PLANT.name,
    shiftLabel: "Shift A · Today",
    metrics: [
      { label: "Production", value: `${eff}%`, delta: `↓ ${round(100 - eff, 1)}% vs baseline`, tone: "investigate" },
      { label: "Downtime", value: `${t.downtime} min`, delta: `↑ ${Math.round(pct(t.downtime, t.downtimeBase))}% vs baseline`, tone: "investigate" },
      { label: "Defect rate", value: `${rate}%`, delta: `↑ ${round(rate - baseRate, 1)} pp`, tone: "watch" },
      { label: "Energy", value: `${t.energy} kWh`, delta: `↑ ${Math.round(pct(t.energy, t.energyBase))}% vs baseline`, tone: "watch" },
    ],
    statusSummary,
    activeInvestigationCount: queue.filter(q => q.status !== "NORMAL").length,
    topInvestigation: queue[0] ? getInvestigation(queue[0].id, opts) : null,
    queue,
    machines,
    trend: getTrend(),
    events,
  };
}

export function getQuality(): QualityData {
  const t = plantTotals();
  const machines = listMachines();
  const cats = { Surface: 0, Dimension: 0, Assembly: 0, Other: 0 };
  MACHINE_SEEDS.forEach(s => (Object.keys(cats) as (keyof typeof cats)[]).forEach(k => (cats[k] += s.defectCategories[k])));
  const top = machines.slice().sort((a, b) => b.defects - a.defects)[0]!;
  return {
    defectRate: round((t.defects / t.production) * 100, 1),
    baselineRate: round((t.defectsBase / t.productionBase) * 100, 1),
    defectUnits: t.defects,
    topMachine: { id: top.id, defects: top.defects },
    categories: Object.entries(cats).map(([name, units]) => ({ name, units, share: Math.round((units / t.defects) * 100) })),
    byMachine: machines.map(m => ({ id: m.id, quality: m.quality })),
  };
}

export function getEnergy(): EnergyData {
  const t = plantTotals();
  const intensity = round(t.energy / t.production, 3);
  const baselineIntensity = round(t.energyBase / t.productionBase, 3);
  return {
    intensity,
    baselineIntensity,
    deviationPercent: pct(intensity, baselineIntensity),
    totalKwh: t.energy,
    byMachine: listMachines().map(m => ({ name: m.id, value: m.energy })),
  };
}

export function getDataStatus(): DataStatus {
  const hourly = MACHINE_SEEDS.length * slots;
  const daily = MACHINE_SEEDS.reduce((n, s) => n + s.baselineDays.production.length, 0);
  const lengthsOk = MACHINE_SEEDS.every(s => (["production", "downtime", "defects", "energy"] as const).every(k => s.current[k].length === slots));
  const nonNegative = MACHINE_SEEDS.every(s => (["production", "downtime", "defects", "energy"] as const).every(k => s.current[k].every(v => v >= 0)));
  const maintenanceOk = MACHINE_SEEDS.every(s => !s.current.maintenance || s.current.maintenance.length === slots);
  return {
    datasetName: DATASET.name,
    sourceType: DATASET.sourceType,
    recordCount: hourly + daily,
    machinesCovered: MACHINE_SEEDS.map(s => s.id),
    timeRange: { from: DATASET.baselineFrom, to: `${PLANT.date} ${SHIFT_SLOTS.at(-1)}` },
    lastRefreshed: DATASET.lastRefreshed,
    validation: {
      status: lengthsOk && nonNegative ? "PASSED" : "WARNING",
      checks: [
        { name: "Complete hourly series", passed: lengthsOk, detail: `${slots} observations per machine this shift` },
        { name: "No negative values", passed: nonNegative, detail: "Output, downtime, defects, energy" },
        { name: "Maintenance log coverage", passed: maintenanceOk, detail: "Event details are partial for this demo" },
      ],
    },
    sources: [
      { name: "Production", status: "Seeded", detail: `${hourly} hourly records` },
      { name: "Machine logs", status: "Seeded", detail: "Downtime per hour" },
      { name: "Quality", status: "Seeded", detail: "Defects by category" },
      { name: "Energy", status: "Seeded", detail: "kWh per hour" },
      { name: "Maintenance", status: "Partial", detail: "Event details limited" },
    ],
  };
}
