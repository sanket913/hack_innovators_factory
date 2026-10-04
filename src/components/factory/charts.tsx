import { Area, CartesianGrid, ComposedChart, Line, ReferenceArea, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { Trend, TrendMetric } from "@/lib/factory/types";

const tooltipStyle = { background: "var(--popover)", border: "1px solid var(--border)", borderRadius: 4, color: "var(--popover-foreground)", fontSize: 12 };

export function TrendChart({ trend, metric = "production", detailed = false }: { trend: Trend; metric?: TrendMetric; detailed?: boolean }) {
  const color = metric === "downtime" ? "var(--investigate)" : metric === "quality" ? "var(--normal)" : metric === "energy" ? "var(--watch)" : "var(--steel)";
  return <div className={detailed ? "chart chart-large" : "chart"} aria-label={`${metric} trend chart`}>
    <ResponsiveContainer width="100%" height="100%">
      <ComposedChart data={trend.points} margin={{ top: 18, right: 16, left: -20, bottom: 0 }}>
        <defs><linearGradient id={`fill-${metric}`} x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={color} stopOpacity={0.18}/><stop offset="100%" stopColor={color} stopOpacity={0}/></linearGradient></defs>
        <CartesianGrid stroke="var(--chart-grid)" vertical={false} />
        <XAxis dataKey="time" tick={{ fill: "var(--muted-foreground)", fontSize: 11 }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fill: "var(--muted-foreground)", fontSize: 11 }} axisLine={false} tickLine={false} />
        <Tooltip contentStyle={tooltipStyle} cursor={{ stroke: "var(--muted-foreground)", strokeDasharray: "3 3" }} />
        {trend.deviationStart && trend.deviationEnd && <ReferenceArea x1={trend.deviationStart} x2={trend.deviationEnd} fill="var(--investigate)" fillOpacity={0.08} />}
        {trend.deviationStart && <ReferenceLine x={trend.deviationStart} stroke="var(--investigate)" strokeDasharray="4 4" label={{ value: trend.label, fill: "var(--investigate)", fontSize: 11, position: "insideTopRight" }} />}
        <Area type="monotone" dataKey={metric} fill={`url(#fill-${metric})`} stroke="none" />
        <Line type="monotone" dataKey={metric} stroke={color} strokeWidth={2} dot={false} activeDot={{ r: 4, fill: color }} />
      </ComposedChart>
    </ResponsiveContainer>
  </div>;
}
