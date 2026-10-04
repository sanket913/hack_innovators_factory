import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Info, Wrench } from "lucide-react";
import { useSimulation } from "@/lib/factory/queries";
import { formatINR } from "@/lib/factory/settings";
import { ErrorState, Skeleton } from "@/components/factory/states";
import { Eyebrow, Metric, PageHeader, PulseTrace, SectionHeader } from "@/components/factory/ui";
export const Route=createFileRoute("/simulate")({head:()=>({meta:[{title:"What-If Simulator — FactoryPulse"},{name:"description",content:"Explore estimated operational effects of maintenance decisions before acting."},{property:"og:title",content:"What-If Simulator — FactoryPulse"},{property:"og:description",content:"Explore estimated operational effects of maintenance decisions before acting."},{property:"og:type",content:"website"},{name:"twitter:card",content:"summary_large_image"}]}),component:Simulation});
function Simulation(){const [hours,setHours]=useState(2);const q=useSimulation(hours);const r=q.data;const v=(f:()=>string)=>r?f():"…";
return <><PageHeader eyebrow="DECISION SUPPORT" title="What-If Simulator" subtitle="Explore the operational effect of a potential decision before acting."/>
{q.isError&&!r&&<ErrorState onRetry={()=>void q.refetch()} retrying={q.isFetching}/>}
<section className="simulator" aria-busy={q.isFetching}><div className="simulator-control"><Eyebrow>SCENARIO 01</Eyebrow><h2>What if M-04 is stopped for maintenance?</h2><div className="current-state"><Wrench size={18}/><span>Current shift downtime</span><strong>{r?`${r.currentDowntimeMin} min`:<Skeleton h={18} w={60}/>}</strong></div><label htmlFor="duration">Additional maintenance duration <output>{hours} {hours===1?"hour":"hours"}</output></label><input id="duration" type="range" min="1" max="4" step="0.5" value={hours} onChange={e=>setHours(Number(e.target.value))}/><div className="range-labels"><span>1h</span><span>2h</span><span>3h</span><span>4h</span></div><PulseTrace/></div>
<div className="simulation-results"><Eyebrow>{q.isFetching?"RECALCULATING…":"ESTIMATED OUTCOME"}</Eyebrow><Metric label="Expected production impact" value={v(()=>`${r!.productionImpactUnits} units`)} note="Estimated"/><Metric label="Expected energy impact" value={v(()=>`${r!.energyImpactKwh} kWh`)} note="Estimated"/><Metric label="Potential avoided loss" value={v(()=>formatINR(r!.avoidedLoss))} note="Estimated"/></div></section>
<section className="simulation-note"><Info size={19}/><div><strong>Simulation</strong><p>{r?.disclaimer??"Results are estimates based on current production patterns and stated assumptions."}</p></div></section>
<section className="panel"><SectionHeader label="ASSUMPTIONS" title="Calculation basis"/><div className="assumption-grid">{r?r.assumptions.map(a=><Metric key={a.label} label={a.label} value={a.value} note={a.kind==="CALCULATED"?"Calculated":"Assumed"}/>):<Skeleton h={60}/>}</div></section></>}
