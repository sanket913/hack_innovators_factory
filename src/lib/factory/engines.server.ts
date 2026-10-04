// Transparent, deterministic calculation engines. Every screen uses these.
import type { BaselineComparison, CalcInput, CalcOptions, ImpactEstimate, MachineStatus, MetricKey, PriorityBreakdown } from "./types";
import { ASSUMPTIONS, MACHINE_SEEDS, SHIFT_SLOTS, type MachineSeed } from "./seed-data.server";

const round = (n: number, d = 1) => Math.round(n * 10 ** d) / 10 ** d;
const sum = (xs: number[]) => xs.reduce((a, b) => a + b, 0);
const mean = (xs: number[]) => (xs.length ? sum(xs) / xs.length : 0);

export class NotFoundError extends Error {}
export class ValidationError extends Error {}

export const DEFAULT_OPTIONS: CalcOptions = { contributionPerUnit: ASSUMPTIONS.contributionPerUnit, horizonHours: ASSUMPTIONS.simulationHorizonHours };

/** Validates user-supplied assumptions; invalid values fall back to defaults so they can never corrupt calculations. */
export function resolveOptions(opts: CalcInput = {}): CalcOptions {
  const ok = (v: unknown, min: number, max: number): v is number => typeof v === "number" && Number.isFinite(v) && v >= min && v <= max;
  return {
    contributionPerUnit: ok(opts.contributionPerUnit, 1, 100000) ? opts.contributionPerUnit : DEFAULT_OPTIONS.contributionPerUnit,
    horizonHours: ok(opts.horizonHours, 1, 48) ? opts.horizonHours : DEFAULT_OPTIONS.horizonHours,
  };
}

export function getSeed(machineId: string): MachineSeed {
  const seed = MACHINE_SEEDS.find(m => m.id.toLowerCase() === machineId.toLowerCase());
  if (!seed) throw new NotFoundError(`Unknown machine: ${machineId}`);
  return seed;
}

/** Baseline engine: current shift total vs mean of the previous N shift totals. */
export function computeBaseline(machineId: string, metric: MetricKey, windowDays: number = ASSUMPTIONS.baselineWindowDays): BaselineComparison {
  const seed = getSeed(machineId);
  const history = seed.baselineDays[metric].slice(-windowDays);
  const baseline = round(mean(history), 2);
  const current = round(sum(seed.current[metric]), 2);
  const deviation = round(current - baseline, 2);
  const deviationPercent = baseline === 0 ? 0 : round((deviation / baseline) * 100, 1);
  const direction = Math.abs(deviationPercent) < 0.5 ? "flat" : deviation > 0 ? "up" : "down";
  return { metric, baseline, current, deviation, deviationPercent, direction };
}

export function allBaselines(machineId: string): Record<MetricKey, BaselineComparison> {
  return {
    production: computeBaseline(machineId, "production"),
    downtime: computeBaseline(machineId, "downtime"),
    defects: computeBaseline(machineId, "defects"),
    energy: computeBaseline(machineId, "energy"),
  };
}

/** Index of shift slots where the machine is outside its operating range. */
export function deviatedSlots(machineId: string): number[] {
  const seed = getSeed(machineId);
  const b = allBaselines(machineId);
  const slots = SHIFT_SLOTS.length;
  return SHIFT_SLOTS.map((_, i) => i).filter(i => {
    const prod = seed.current.production[i]! / (b.production.baseline / slots);
    const downBase = b.downtime.baseline / slots;
    const down = seed.current.downtime[i]!;
    const energy = seed.current.energy[i]! / (b.energy.baseline / slots);
    return prod < 0.85 || (down > downBase * 1.6 && down - downBase >= 2) || energy > 1.15;
  });
}

/**
 * Priority engine (0–100). Only adverse movement counts.
 *   production drop     30%  (saturates at 20% below baseline)
 *   downtime increase   25%  (saturates at 50% above)
 *   defect increase     25%  (saturates at 80% above)
 *   energy increase     10%  (saturates at 25% above)
 *   persistence         10%  (share of shift slots outside operating range)
 */
export const PRIORITY_WEIGHTS = [
  { factor: "Production deviation", metric: "production", weight: 30, cap: 20, adverse: -1 },
  { factor: "Downtime deviation", metric: "downtime", weight: 25, cap: 50, adverse: 1 },
  { factor: "Quality deviation", metric: "defects", weight: 25, cap: 80, adverse: 1 },
  { factor: "Energy deviation", metric: "energy", weight: 10, cap: 25, adverse: 1 },
] as const;
export const PERSISTENCE_WEIGHT = 10;

export function computePriority(machineId: string): PriorityBreakdown {
  const b = allBaselines(machineId);
  const components: PriorityBreakdown["components"] = PRIORITY_WEIGHTS.map(w => {
    const adverse = Math.max(0, b[w.metric].deviationPercent * w.adverse);
    const normalized = Math.min(adverse / w.cap, 1);
    return { factor: w.factor, weight: w.weight, normalized: round(normalized, 3), points: round(normalized * w.weight, 2) };
  });
  const persistence = deviatedSlots(machineId).length / SHIFT_SLOTS.length;
  components.push({ factor: "Persistence", weight: PERSISTENCE_WEIGHT, normalized: round(persistence, 3), points: round(persistence * PERSISTENCE_WEIGHT, 2) });
  return { score: Math.round(sum(components.map(c => c.points))), components };
}

export function statusFromPriority(score: number): MachineStatus {
  if (score >= 70) return "INVESTIGATE";
  if (score >= 30) return "WATCH";
  return "NORMAL";
}

/** Impact engine — ESTIMATED, never measured financial loss. */
export function computeImpact(machineId: string, contributionPerUnit: number = ASSUMPTIONS.contributionPerUnit): ImpactEstimate {
  const b = allBaselines(machineId);
  const productionLossUnits = Math.max(0, Math.round(-b.production.deviation));
  const additionalDefects = Math.max(0, Math.round(b.defects.deviation));
  const excessDowntimeMin = Math.max(0, round(b.downtime.deviation, 1));
  const contributionImpact = (productionLossUnits + additionalDefects) * contributionPerUnit;
  return {
    label: "ESTIMATED",
    productionLossUnits,
    excessDowntimeMin,
    additionalDefects,
    contributionImpact,
    assumptions: [
      { label: "Production baseline", value: `${b.production.baseline} units/shift (${ASSUMPTIONS.baselineWindowDays}-day average)`, kind: "CALCULATED" },
      { label: "Contribution value", value: `₹${contributionPerUnit}/unit`, kind: "ASSUMED" },
    ],
    formula: "(lost units + additional defect units) × contribution value",
  };
}

export const engineUtils = { round, sum, mean };
