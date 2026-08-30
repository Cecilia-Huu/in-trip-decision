export type Locale = "zh" | "en";
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

type LocalizedTripData = {
  itinerary: ItineraryStop[];
  plans: Record<PlanVariant, RecoveryPlan>;
};

export const tripData: Record<Locale, LocalizedTripData> = {
  zh: {
    itinerary: [
      { id: "cathedral", time: "14:00", title: "塞维利亚大教堂", meta: "已完成", status: "done" },
      { id: "alcazar", time: "16:00", title: "塞维利亚王宫", meta: "临时关闭 · 已确认", status: "closed" },
      { id: "dinner", time: "18:30", title: "Tapas 晚餐", meta: "已预订 · 固定安排", status: "anchor" },
    ],
    plans: {
      default: {
        variant: "default",
        summary: "先歇一会儿，再慢慢往晚餐方向走。",
        walking: "步行约 1.1 公里",
        buffer: "预留 25 分钟",
        reason: "你没有补充现在的状态，所以先按少绕路、不赶场来安排，并给晚餐留出 25 分钟余量。",
        blocks: [
          { id: "patio-cafe", time: "16:10", endTime: "16:50", title: "庭院里坐一会儿", meta: "步行 5 分钟 · 大约停留 40 分钟", tag: "随时可走", kind: "rest" },
          { id: "old-town-walk", time: "17:00", endTime: "18:05", title: "慢慢往晚餐方向走", meta: "路线灵活 · 约 1.1 公里", tag: "低强度", kind: "move" },
          { id: "dinner-anchor", time: "18:30", title: "Tapas 晚餐", meta: "已预订 · 原计划保留", tag: "已保留", kind: "anchor" },
        ],
      },
      less: {
        variant: "less",
        summary: "少走一点，多歇一会儿。晚餐保持不变。",
        walking: "步行约 380 米",
        buffer: "预留 15 分钟",
        reason: "你想少走一点，所以把步行缩短到 380 米，也多留了 30 分钟休息。18:30 的晚餐不变。",
        blocks: [
          { id: "patio-cafe-long", time: "16:10", endTime: "17:20", title: "庭院里多坐一会儿", meta: "步行 5 分钟 · 大约停留 70 分钟", tag: "随时可走", kind: "rest" },
          { id: "quiet-plaza", time: "17:25", endTime: "18:15", title: "餐厅附近的小广场", meta: "树荫下走一小段 · 约 380 米", tag: "可以坐下", kind: "move" },
          { id: "dinner-anchor", time: "18:30", title: "Tapas 晚餐", meta: "已预订 · 原计划保留", tag: "已保留", kind: "anchor" },
        ],
      },
      active: {
        variant: "active",
        summary: "再逛一站，然后顺路去吃晚餐。",
        walking: "步行约 1.2 公里",
        buffer: "预留 20 分钟",
        reason: "你还想继续逛，所以保留一个室内体验，再顺路去吃晚餐。18:30 的预订不变。",
        blocks: [
          { id: "flamenco-museum", time: "16:15", endTime: "17:20", title: "弗拉门戈舞蹈博物馆", meta: "步行 10 分钟 · 室内 · 可直接入场", tag: "中等体力", kind: "move" },
          { id: "old-town-route", time: "17:30", endTime: "18:10", title: "穿过老城去吃晚餐", meta: "随时可结束 · 约 1.2 公里", tag: "继续逛", kind: "move" },
          { id: "dinner-anchor", time: "18:30", title: "Tapas 晚餐", meta: "已预订 · 原计划保留", tag: "已保留", kind: "anchor" },
        ],
      },
    },
  },
  en: {
    itinerary: [
      { id: "cathedral", time: "14:00", title: "Seville Cathedral", meta: "Done", status: "done" },
      { id: "alcazar", time: "16:00", title: "Royal Alcázar", meta: "Closed · confirmed", status: "closed" },
      { id: "dinner", time: "18:30", title: "Tapas Dinner", meta: "Reserved · fixed", status: "anchor" },
    ],
    plans: {
      default: {
        variant: "default",
        summary: "A short reset, then an easy route toward dinner.",
        walking: "About 1.1 km walking",
        buffer: "25 min buffer",
        reason: "You did not add any context, so this keeps the route easy, avoids rushing, and leaves a 25-minute dinner buffer.",
        blocks: [
          { id: "patio-cafe", time: "16:10", endTime: "16:50", title: "Sit in a patio for a while", meta: "5 min walk · stay about 40 min", tag: "Leave anytime", kind: "rest" },
          { id: "old-town-walk", time: "17:00", endTime: "18:05", title: "Drift toward dinner", meta: "Flexible route · about 1.1 km", tag: "Low effort", kind: "move" },
          { id: "dinner-anchor", time: "18:30", title: "Tapas Dinner", meta: "Reserved · unchanged", tag: "Kept", kind: "anchor" },
        ],
      },
      less: {
        variant: "less",
        summary: "Less walking, more rest. Dinner stays fixed.",
        walking: "About 380 m walking",
        buffer: "15 min buffer",
        reason: "You asked to walk less, so the route drops to 380 metres and adds 30 minutes of rest. Dinner stays at 18:30.",
        blocks: [
          { id: "patio-cafe-long", time: "16:10", endTime: "17:20", title: "Stay longer in the patio", meta: "5 min walk · stay about 70 min", tag: "Leave anytime", kind: "rest" },
          { id: "quiet-plaza", time: "17:25", endTime: "18:15", title: "Quiet plaza near dinner", meta: "Short shaded walk · about 380 m", tag: "Mostly seated", kind: "move" },
          { id: "dinner-anchor", time: "18:30", title: "Tapas Dinner", meta: "Reserved · unchanged", tag: "Kept", kind: "anchor" },
        ],
      },
      active: {
        variant: "active",
        summary: "One more stop, then an easy route to dinner.",
        walking: "About 1.2 km walking",
        buffer: "20 min buffer",
        reason: "You still want to explore, so this keeps one indoor stop and a direct route to dinner. The 18:30 reservation stays fixed.",
        blocks: [
          { id: "flamenco-museum", time: "16:15", endTime: "17:20", title: "Flamenco Dance Museum", meta: "10 min walk · indoors · walk-in", tag: "Medium effort", kind: "move" },
          { id: "old-town-route", time: "17:30", endTime: "18:10", title: "Old-town route to dinner", meta: "Leave anytime · about 1.2 km", tag: "Keep exploring", kind: "move" },
          { id: "dinner-anchor", time: "18:30", title: "Tapas Dinner", meta: "Reserved · unchanged", tag: "Kept", kind: "anchor" },
        ],
      },
    },
  },
};

const lowEnergyPattern = /(feet|foot|tired|exhausted|hurt|sore|less walk|脚|腿|累|走不动|少走)/i;
const activePattern = /(active|energy|explore|museum|keep going|继续|逛|有精神|博物馆)/i;

export function selectInitialPlan(constraint: Constraint | null, note: string): PlanVariant {
  if (constraint === "less" || lowEnergyPattern.test(note)) return "less";
  if (constraint === "explore" || activePattern.test(note)) return "active";
  return "default";
}
