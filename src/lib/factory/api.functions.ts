// Typed RPC surface for FactoryPulse. Every screen reads through these, and
// these only call the deterministic engines — one source of truth.
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { getDashboard, getDataStatus, getEnergy, getQuality, listMachines } from "./factory-service.server";
import { getMachineInvestigation, listInvestigations, listReports, simulateMaintenance } from "./investigation-service.server";

const opts = z.object({ contributionPerUnit: z.number().optional(), horizonHours: z.number().optional() }).partial().default({});

export const fetchDashboard = createServerFn({ method: "GET" })
  .inputValidator((d: unknown) => z.object({ opts }).parse(d ?? {}))
  .handler(async ({ data }) => getDashboard(data.opts));

export const fetchMachines = createServerFn({ method: "GET" }).handler(async () => listMachines());

export const fetchInvestigations = createServerFn({ method: "GET" }).handler(async () => listInvestigations());

export const fetchMachineInvestigation = createServerFn({ method: "GET" })
  .inputValidator((d: unknown) => z.object({ machineId: z.string().min(1).max(20), opts }).parse(d))
  .handler(async ({ data }) => getMachineInvestigation(data.machineId, data.opts));

export const fetchReports = createServerFn({ method: "GET" }).handler(async () => listReports());

export const fetchQuality = createServerFn({ method: "GET" }).handler(async () => getQuality());

export const fetchEnergy = createServerFn({ method: "GET" }).handler(async () => getEnergy());

export const fetchDataStatus = createServerFn({ method: "GET" }).handler(async () => getDataStatus());

export const fetchSimulation = createServerFn({ method: "GET" })
  .inputValidator((d: unknown) => z.object({ hours: z.number(), opts }).parse(d))
  .handler(async ({ data }) => simulateMaintenance(data.hours, "M-04", data.opts));
