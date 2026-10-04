import { Link } from "@tanstack/react-router";
import type { Machine } from "@/lib/factory/types";
import { StatusBadge } from "./ui";

export function MachineTable({ machines, limit }: { machines: Machine[]; limit?: number }) {
  return <div className="table-wrap"><table><thead><tr><th>Machine</th><th>Status</th><th>Output</th><th>Downtime</th><th>Quality</th><th>Energy</th></tr></thead><tbody>{machines.slice(0, limit).map(machine => <tr key={machine.id} className={machine.status === "INVESTIGATE" ? "attention-row" : ""}><td><Link to="/machines/$machineId" params={{ machineId: machine.id.toLowerCase() }} className="machine-link">{machine.id}</Link></td><td><StatusBadge status={machine.status} /></td><td>{machine.output}%</td><td>{machine.downtime} min</td><td>{machine.quality}%</td><td>{machine.energy} kWh</td></tr>)}</tbody></table></div>;
}
