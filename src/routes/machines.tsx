import { createFileRoute } from "@tanstack/react-router";
import { MachinesPage } from "@/components/factory/generic-page";
export const Route=createFileRoute("/machines")({head:()=>({meta:[{title:"Machines — FactoryPulse"},{name:"description",content:"Machine performance and operating status across Plant A."},{property:"og:title",content:"Machines — FactoryPulse"},{property:"og:description",content:"Machine performance and operating status across Plant A."},{property:"og:type",content:"website"},{name:"twitter:card",content:"summary_large_image"}]}),component:MachinesPage});
