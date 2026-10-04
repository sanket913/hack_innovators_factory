import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { fetchDashboard, fetchDataStatus, fetchEnergy, fetchInvestigations, fetchMachineInvestigation, fetchMachines, fetchQuality, fetchReports, fetchSimulation } from "./api.functions";
import { calcOptions, useSettings } from "./settings";

const base = { retry: 1, staleTime: 60_000 } as const;

export function useDashboard() {
  const { settings, hydrated } = useSettings();
  const fn = useServerFn(fetchDashboard);
  const opts = calcOptions(settings);
  return useQuery({ ...base, queryKey: ["dashboard", opts], queryFn: () => fn({ data: { opts } }), enabled: hydrated });
}

export function useMachines() {
  const fn = useServerFn(fetchMachines);
  return useQuery({ ...base, queryKey: ["machines"], queryFn: () => fn() });
}

export function useInvestigations() {
  const fn = useServerFn(fetchInvestigations);
  return useQuery({ ...base, queryKey: ["investigations"], queryFn: () => fn() });
}

export function useMachineInvestigation(machineId: string) {
  const { settings, hydrated } = useSettings();
  const fn = useServerFn(fetchMachineInvestigation);
  const opts = calcOptions(settings);
  return useQuery({ ...base, queryKey: ["machine-investigation", machineId.toLowerCase(), opts], queryFn: () => fn({ data: { machineId, opts } }), enabled: hydrated });
}

export function useReports() {
  const fn = useServerFn(fetchReports);
  return useQuery({ ...base, queryKey: ["reports"], queryFn: () => fn() });
}

export function useQuality() {
  const fn = useServerFn(fetchQuality);
  return useQuery({ ...base, queryKey: ["quality"], queryFn: () => fn() });
}

export function useEnergy() {
  const fn = useServerFn(fetchEnergy);
  return useQuery({ ...base, queryKey: ["energy"], queryFn: () => fn() });
}

export function useDataStatus() {
  const fn = useServerFn(fetchDataStatus);
  return useQuery({ ...base, queryKey: ["data-status"], queryFn: () => fn() });
}

export function useSimulation(hours: number) {
  const { settings, hydrated } = useSettings();
  const fn = useServerFn(fetchSimulation);
  const opts = calcOptions(settings);
  return useQuery({ ...base, queryKey: ["simulation", hours, opts], queryFn: () => fn({ data: { hours, opts } }), enabled: hydrated, placeholderData: keepPreviousData });
}
