// Shared, client-safe domain types for FactoryPulse API responses.

export type MachineStatus = "NORMAL" | "WATCH" | "INVESTIGATE";
export type MetricKey = "production" | "downtime" | "defects" | "energy";
export type TrendMetric = "production" | "downtime" | "quality" | "energy";

/** One hourly observation for a machine during the current shift. */
export type Observation = {
  timestamp: string; // ISO
  time: string; // HH:MM label
  machineId: string;
  productionOutput: number;
  productionTarget: number;
  downtimeMinutes: number;
  defectQuantity: number;
  defectRate: number; // %
  energyKwh: number;
  maintenanceEvent: string | null;
  operatingShift: "A";
};

export type BaselineComparison = {
  metric: MetricKey;
  baseline: number;
  current: number;
  deviation: number;
  deviationPercent: number;
  direction: "up" | "down" | "flat";
};

export type PriorityBreakdown = {
  score: number;
  components: { factor: string; weight: number; normalized: number; points: number }[];
};

export type Machine = {
  id: string;
  name: string;
  status: MachineStatus;
  output: number; // % of baseline output
  downtime: number; // min this shift
  quality: number; // defect rate %
  energy: number; // kWh this shift
  production: number; // units this shift
  defects: number; // units this shift
  priority: number;
  summary: string;
  latestObservation: Observation;
  baseline: Record<MetricKey, BaselineComparison>;
};

export type TrendPoint = { time: string; production: number; downtime: number; quality: number; energy: number };
export type Trend = { points: TrendPoint[]; deviationStart: string | null; deviationEnd: string | null; label: string };

export type EvidenceKind = "OBSERVED" | "INFERRED" | "ESTIMATED" | "ASSUMED" | "NOT_ESTABLISHED";
export type EvidenceItem = { kind: EvidenceKind; statement: string };

export type ImpactEstimate = {
  label: "ESTIMATED";
  productionLossUnits: number;
  excessDowntimeMin: number;
  additionalDefects: number;
  contributionImpact: number;
  assumptions: { label: string; value: string; kind: "ASSUMED" | "CALCULATED" }[];
  formula: string;
};

export type InvestigationMetric = { key: MetricKey; label: string; value: string; comparison: string; current: number; baseline: number };

export type Investigation = {
  id: string;
  machineId: string;
  title: string;
  status: MachineStatus;
  priority: number;
  priorityBreakdown: PriorityBreakdown;
  detectedAt: string;
  severity: "HIGH" | "MEDIUM" | "LOW";
  summary: string;
  signals: string;
  metrics: InvestigationMetric[];
  evidence: EvidenceItem[];
  impact: ImpactEstimate;
  recommendation: { headline: string; reasons: string[] };
  suggestedChecks: string[];
  timeline: { time: string; event: string; active: boolean }[];
  trend: Trend;
};

export type InvestigationSummary = Pick<Investigation, "id" | "machineId" | "title" | "status" | "priority" | "signals" | "detectedAt">;

export type DashboardMetric = { label: string; value: string; delta: string; tone: "neutral" | "normal" | "watch" | "investigate" };

export type DashboardData = {
  plantName: string;
  shiftLabel: string;
  metrics: DashboardMetric[];
  statusSummary: Record<MachineStatus, number>;
  activeInvestigationCount: number;
  topInvestigation: Investigation | null;
  queue: InvestigationSummary[];
  machines: Machine[];
  trend: Trend;
  events: { time: string; machineId: string; event: string }[];
};

export type Report = {
  id: string;
  title: string;
  date: string;
  machineId: string;
  status: "High priority" | "Watch" | "Resolved";
  priority: number;
  summary: string;
  investigationId: string | null;
};

export type SimulationResult = {
  label: "SIMULATION";
  hours: number;
  productionImpactUnits: number;
  energyImpactKwh: number;
  avoidedLoss: number;
  currentDowntimeMin: number;
  rates: { productionPerHour: number; energyPerHour: number; contributionPerUnit: number; deviationLossPerHour: number; horizonHours: number };
  assumptions: { label: string; value: string; kind: "CALCULATED" | "ASSUMED" }[];
  disclaimer: string;
};

export type QualityData = {
  defectRate: number;
  baselineRate: number;
  defectUnits: number;
  topMachine: { id: string; defects: number };
  categories: { name: string; units: number; share: number }[];
  byMachine: { id: string; quality: number }[];
};

export type EnergyData = {
  intensity: number;
  baselineIntensity: number;
  deviationPercent: number;
  totalKwh: number;
  byMachine: { name: string; value: number }[];
};

export type DataStatus = {
  datasetName: string;
  sourceType: string;
  recordCount: number;
  machinesCovered: string[];
  timeRange: { from: string; to: string };
  lastRefreshed: string;
  validation: { status: "PASSED" | "WARNING"; checks: { name: string; passed: boolean; detail: string }[] };
  sources: { name: string; status: "Seeded" | "Partial"; detail: string }[];
};

/** User-adjustable economic assumptions (persisted client-side in Settings). */
export type CalcOptions = { contributionPerUnit: number; horizonHours: number };

export type MachineInvestigationResult =
  | { kind: "not_found"; machineId: string }
  | { kind: "ok"; machine: Machine; investigation: Investigation | null };
export type CalcInput = { [K in keyof CalcOptions]?: CalcOptions[K] | undefined };
