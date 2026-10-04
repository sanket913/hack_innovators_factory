import { Link, useRouterState } from "@tanstack/react-router";
import { Activity, Bell, Boxes, ChartNoAxesCombined, ClipboardList, Database, Factory, Gauge, Menu, Settings, SlidersHorizontal, X, Zap } from "lucide-react";
import { useState, type ReactNode } from "react";
import { PulseTrace } from "./ui";
import { useSettings } from "@/lib/factory/settings";

const groups = [
  { label: "OVERVIEW", items: [{ to: "/operations", label: "Overview", icon: Gauge }, { to: "/investigations", label: "Investigations", icon: ClipboardList }, { to: "/machines", label: "Machines", icon: Boxes }, { to: "/quality", label: "Quality", icon: Activity }, { to: "/energy", label: "Energy", icon: Zap }] },
  { label: "ANALYSIS", items: [{ to: "/simulate", label: "What-If", icon: SlidersHorizontal }, { to: "/reports", label: "Reports", icon: ChartNoAxesCombined }] },
  { label: "SYSTEM", items: [{ to: "/data", label: "Data", icon: Database }, { to: "/settings", label: "Settings", icon: Settings }] },
] as const;

const titles: Record<string, string> = { "/operations": "Operations overview", "/investigations": "Investigations", "/machines": "Machines", "/quality": "Quality", "/energy": "Energy", "/simulate": "What-If simulator", "/reports": "Reports", "/data": "Data", "/settings": "Settings" };

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = useRouterState({ select: state => state.location.pathname });
  const [open, setOpen] = useState(false);
  const { settings } = useSettings();
  const title = pathname.startsWith("/investigate/") ? "Investigation workspace" : pathname.startsWith("/machines/") ? "Machine detail" : titles[pathname] ?? "FactoryPulse";
  return <div className="app-shell">
    <aside className={`sidebar ${open ? "sidebar-open" : ""}`}>
      <div className="brand"><Link to="/" className="brand-home" aria-label="FactoryPulse landing page"><div className="brand-mark"><Factory size={18}/><span /></div><div><strong>FactoryPulse</strong><small>OPERATIONS INTELLIGENCE</small></div></Link><button className="icon-button mobile-close" onClick={() => setOpen(false)} aria-label="Close navigation"><X size={18}/></button></div>
      <PulseTrace compact />
      <nav aria-label="Primary navigation">{groups.map(group => <div className="nav-group" key={group.label}><div className="nav-label">{group.label}</div>{group.items.map(item => { const active = pathname.startsWith(item.to); const Icon = item.icon; return <Link key={item.to} to={item.to} className={`nav-item ${active ? "nav-active" : ""}`} onClick={() => setOpen(false)}><Icon size={16}/><span>{item.label}</span></Link>; })}</div>)}</nav>
      <div className="plant-block"><div className="plant-label">PLANT</div><strong>{settings.plantName}</strong><div className="connected"><span />Operational · Connected</div><small>Demo environment</small></div>
    </aside>
    {open && <button className="sidebar-scrim" onClick={() => setOpen(false)} aria-label="Close navigation" />}
    <div className="main-column"><header className="topbar"><button className="icon-button menu-button" onClick={() => setOpen(true)} aria-label="Open navigation"><Menu size={19}/></button><div className="topbar-title">{title}</div><div className="topbar-status"><span className="demo-label">DEMO DATA</span><span className="topbar-plant">{settings.plantName.split(" — ")[0]}</span><span className="sync">Seeded shift data</span><span className="operational"><i />Operational</span><Link to="/investigations" className="icon-button" aria-label="Open investigation queue" title="Open investigation queue"><Bell size={17}/><b /></Link><Link to="/settings" className="avatar" aria-label="Open settings" title="Settings">SP</Link></div></header><main className={`workspace page-${pathname.split("/")[1] || "home"}${pathname === "/" ? " home-workspace" : ""}`}>{children}</main></div>
  </div>;
}
