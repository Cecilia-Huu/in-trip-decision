export type Constraint = "less" | "explore" | "decide";
export type PlanVariant = "default" | "less" | "active";

export type ItineraryStop = {
  id: string;
  time: string;
  title: string;
  meta: string;
  status: "done" | "closed" | "anchor";
};

export type PlanBlock = {
  id: string;
  time: string;
  endTime?: string;
  title: string;
  meta: string;
  tag: string;
  kind: "rest" | "move" | "anchor";
};

export type RecoveryPlan = {
  variant: PlanVariant;
  summary: string;
  walking: string;
  buffer: string;
  reason: string;
  blocks: PlanBlock[];
};

export const itinerary: ItineraryStop[] = [
  { id: "cathedral", time: "14:00", title: "Seville Cathedral", meta: "Completed", status: "done" },
  { id: "alcazar", time: "16:00", title: "Royal Alcázar of Seville", meta: "Closed today · confirmed", status: "closed" },
  { id: "dinner", time: "18:30", title: "Tapas at El Rinconcillo", meta: "Reserved · fixed anchor", status: "anchor" },
];

export const plans: Record<PlanVariant, RecoveryPlan> = {
  default: {
    variant: "default",
    summary: "A conservative reset, then a flexible route toward dinner.",
    walking: "1.1 km walking",
    buffer: "25 min buffer",
    reason: "I don’t know your energy yet, so this uses two low-commitment moves and protects a 25-minute dinner buffer.",
    blocks: [
      { id: "patio-cafe", time: "16:10", endTime: "16:50", title: "Patio café · reset", meta: "5 min away · stay about 40 min", tag: "Leave anytime", kind: "rest" },
      { id: "old-town-walk", time: "17:00", endTime: "18:05", title: "Shaded old-town walk", meta: "Flexible route · about 1.1 km", tag: "Low commitment", kind: "move" },
      { id: "dinner-anchor", time: "18:30", title: "Tapas at El Rinconcillo", meta: "Reserved · unchanged", tag: "Locked", kind: "anchor" },
    ],
  },
  less: {
    variant: "less",
    summary: "Less distance, more recovery. Dinner stays fixed.",
    walking: "380 m walking",
    buffer: "15 min buffer",
    reason: "Walking drops to 380 m and café time grows by 30 minutes. The 18:30 reservation does not move.",
    blocks: [
      { id: "patio-cafe-long", time: "16:10", endTime: "17:20", title: "Patio café · longer reset", meta: "5 min away · stay about 70 min", tag: "Leave anytime", kind: "rest" },
      { id: "quiet-plaza", time: "17:25", endTime: "18:15", title: "Quiet plaza near dinner", meta: "Short shaded stroll · about 380 m", tag: "Mostly seated", kind: "move" },
      { id: "dinner-anchor", time: "18:30", title: "Tapas at El Rinconcillo", meta: "Reserved · unchanged", tag: "Locked", kind: "anchor" },
    ],
  },
  active: {
    variant: "active",
    summary: "One meaningful stop, with a safe route to dinner.",
    walking: "1.2 km walking",
    buffer: "20 min buffer",
    reason: "More energy unlocks a medium-intensity indoor stop while preserving a 20-minute dinner buffer.",
    blocks: [
      { id: "flamenco-museum", time: "16:15", endTime: "17:20", title: "Flamenco Dance Museum", meta: "10 min away · indoor · walk-in", tag: "Medium energy", kind: "move" },
      { id: "old-town-route", time: "17:30", endTime: "18:10", title: "Old-town route to dinner", meta: "Flexible exit · about 1.2 km", tag: "Still exploring", kind: "move" },
      { id: "dinner-anchor", time: "18:30", title: "Tapas at El Rinconcillo", meta: "Reserved · unchanged", tag: "Locked", kind: "anchor" },
    ],
  },
};

const lowEnergyPattern = /(feet|foot|tired|exhausted|hurt|sore|less walk|脚|腿|累|走不动|少走)/i;
const activePattern = /(active|energy|explore|museum|keep going|继续|逛|有精神|博物馆)/i;

export function selectInitialPlan(constraint: Constraint | null, note: string): PlanVariant {
  if (constraint === "less" || lowEnergyPattern.test(note)) return "less";
  if (constraint === "explore" || activePattern.test(note)) return "active";
  return "default";
}
