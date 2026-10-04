// Single source of truth for the FactoryPulse demo dataset.
// Deterministic literal values only — never generated at runtime.

export const PLANT = { name: "Plant A", location: "Vadodara", shift: "A", date: "2026-10-04" } as const;

export const SHIFT_SLOTS = ["10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00", "17:00"] as const;

export const ASSUMPTIONS = {
  contributionPerUnit: 175, // ₹/unit — user-defined economic assumption
  baselineWindowDays: 7,
  simulationHorizonHours: 16, // two further shifts of unaddressed deviation
  minSimulationHours: 1,
  maxSimulationHours: 4,
} as const;

type HourlySeries = { production: number[]; downtime: number[]; defects: number[]; energy: number[]; maintenance?: (string | null)[] };
type DailyBaseline = { production: number[]; downtime: number[]; defects: number[]; energy: number[] };

export type MachineSeed = {
  id: string;
  name: string;
  targetPerHour: number;
  current: HourlySeries; // current shift, one value per SHIFT_SLOTS entry
  baselineDays: DailyBaseline; // shift totals for the previous 7 days
  defectCategories: { Surface: number; Dimension: number; Assembly: number; Other: number };
};

export const MACHINE_SEEDS: MachineSeed[] = [
  {
    id: "M-01", name: "Press line 1", targetPerHour: 60,
    current: { production: [59, 60, 59, 58, 59, 59, 58, 59], downtime: [0, 1, 0, 1, 0, 1, 0, 1], defects: [1, 1, 1, 1, 2, 1, 1, 1], energy: [19, 19, 19, 19, 19, 19, 19, 19] },
    baselineDays: { production: [478, 482, 480, 476, 484, 480, 480], downtime: [4, 5, 4, 3, 5, 4, 4.4], defects: [9, 10, 8, 9, 9, 10, 8.7], energy: [150, 151, 149, 150, 152, 148, 150] },
    defectCategories: { Surface: 3, Dimension: 3, Assembly: 2, Other: 1 },
  },
  {
    id: "M-02", name: "Press line 2", targetPerHour: 60,
    current: { production: [58, 59, 58, 58, 57, 58, 58, 58], downtime: [0, 0, 1, 0, 1, 0, 1, 0], defects: [1, 1, 1, 2, 1, 1, 2, 1], energy: [19, 18, 19, 18, 18, 19, 19, 18] },
    baselineDays: { production: [480, 478, 482, 480, 479, 481, 480], downtime: [3, 4, 3, 4, 3, 3, 3.8], defects: [8, 9, 9, 8, 9, 8, 9.2], energy: [149, 150, 148, 149, 150, 148, 149] },
    defectCategories: { Surface: 4, Dimension: 3, Assembly: 2, Other: 1 },
  },
  {
    id: "M-03", name: "Assembly cell 3", targetPerHour: 60,
    current: { production: [58, 57, 56, 55, 54, 54, 54, 53], downtime: [1, 1, 1, 1, 2, 2, 1, 2], defects: [1, 1, 1, 2, 2, 2, 1, 2], energy: [19, 20, 21, 21, 22, 22, 23, 23] },
    baselineDays: { production: [480, 481, 479, 480, 482, 478, 480], downtime: [10, 11, 9, 10, 10, 11, 9], defects: [11, 12, 10, 11, 11, 12, 10], energy: [144, 146, 145, 145, 144, 146, 145] },
    defectCategories: { Surface: 4, Dimension: 3, Assembly: 3, Other: 2 },
  },
  {
    id: "M-04", name: "CNC cell 4", targetPerHour: 60,
    current: {
      production: [60, 60, 60, 60, 36, 38, 40, 40],
      downtime: [3, 4, 3, 4, 7, 6, 6, 5],
      defects: [1, 1, 1, 1, 4, 3, 3, 3],
      energy: [21, 21, 20, 21, 26, 26, 25, 26],
      maintenance: [null, null, null, null, "Unplanned stop — spindle alarm reset", null, null, null],
    },
    baselineDays: { production: [478, 482, 480, 481, 479, 480, 480], downtime: [26, 27, 27, 26, 28, 27, 26.6], defects: [9, 10, 9, 10, 9, 9, 9.8], energy: [167, 168, 167, 168, 168, 167, 168.2] },
    defectCategories: { Surface: 8, Dimension: 5, Assembly: 3, Other: 1 },
  },
];

/** Closed historical investigations (no longer live in current data). */
export const HISTORICAL_REPORTS = [
  { id: "r-m02-0929", title: "M-02 Quality Deviation", date: "Sep 29", machineId: "M-02", status: "Resolved" as const, priority: 58, summary: "Defect rate rose to 3.4% on shift B. Die alignment corrected; quality returned to baseline within two shifts." },
  { id: "r-m01-0921", title: "M-01 Downtime Deviation", date: "Sep 21", machineId: "M-01", status: "Resolved" as const, priority: 47, summary: "Repeated short stops traced to a feeder sensor. Sensor replaced; downtime back within operating range." },
];

export const DATASET = {
  name: "Plant A — Shift A demo dataset",
  sourceType: "Deterministic seeded operational data",
  lastRefreshed: "2026-10-04T17:00:00+05:30",
  baselineFrom: "2026-09-27",
};
