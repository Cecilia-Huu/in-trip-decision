import type { Locale } from "./mock-data";

export type CurrentState = "tired" | "lessWalking" | "explore" | "spontaneous";
export type DecisionStrategy = "rest" | "explore" | "flexible" | "conservative";

export type DecisionContext = {
  change: string;
  currentPlace: string;
  currentTime: string;
  nextAnchor: { time: string; place: string } | null;
  currentState: CurrentState[];
  preferences: {
    travelMode?: "solo" | "withOthers";
    pace?: "slow" | "normal" | "active";
  };
};

export type DecisionStep = {
  label: string;
  title: string;
  detail: string;
  anchor?: boolean;
};

export type DecisionResult = {
  strategy: DecisionStrategy;
  title: string;
  summary: string;
  horizon: string;
  steps: DecisionStep[];
  why: string;
  evidence: string[];
  mapQuery: string;
};

export type DecisionEngine = (context: DecisionContext, locale: Locale, steering?: CurrentState) => DecisionResult;

function chooseStrategy(context: DecisionContext, steering?: CurrentState): DecisionStrategy {
  const states = steering ? [steering] : context.currentState;
  if (states.includes("tired") || states.includes("lessWalking")) return "rest";
  if (states.includes("explore")) return "explore";
  if (states.includes("spontaneous")) return "flexible";
  return "conservative";
}

function cleanMapTarget(value: string) {
  return value
    .replace(/(已预订|预订|预约|晚餐)/g, " ")
    .replace(/\b(dinner|reservation|reserved)\b/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export const localDecisionEngine: DecisionEngine = (context, locale, steering) => {
  const strategy = chooseStrategy(context, steering);
  const anchor = context.nextAnchor;
  const target = cleanMapTarget(anchor?.place || context.currentPlace) || context.currentPlace;
  const isZh = locale === "zh";

  const restCameFromTired = !steering && context.currentState.includes("tired");
  const stateWhy = {
    rest: isZh ? restCameFromTired ? "你现在有点累" : "你现在想少走一点" : restCameFromTired ? "You feel a little tired" : "You want to take it easier",
    explore: isZh ? "你还想继续逛" : "You still want to explore",
    flexible: isZh ? "你想把接下来留得更随性" : "You want to keep the next part flexible",
    conservative: isZh ? "你没有补充当前状态" : "You did not add a current state",
  }[strategy];

  const strategyCopy = {
    rest: {
      title: isZh ? "先把节奏放慢" : "Slow the pace first",
      summary: isZh
        ? anchor ? `先休息一下，再把活动范围慢慢收向 ${anchor.place}。` : "先休息一下，接下来只做低体力、随时能结束的事。"
        : anchor ? `Take a short rest, then gradually move toward ${anchor.place}.` : "Take a short rest and keep the next move easy to end.",
      evidence: isZh ? ["少走一点", anchor ? "保留固定安排" : "低体力", "低承诺"] : ["Less walking", anchor ? "Keep fixed plan" : "Low effort", "Low commitment"],
      mapQuery: isZh ? `可以坐下休息的咖啡馆 ${target}` : `cafes to sit and rest near ${target}`,
    },
    explore: {
      title: isZh ? "再逛一小段" : "Explore a little longer",
      summary: isZh
        ? anchor ? `安排一个低承诺的小体验，再往 ${anchor.place} 方向移动。` : "安排一个低承诺的小体验，90–120 分钟后再决定下一步。"
        : anchor ? `Choose one low-commitment experience, then move toward ${anchor.place}.` : "Choose one low-commitment experience, then decide again in 90–120 minutes.",
      evidence: isZh ? ["还想继续逛", anchor ? "保留固定安排" : "控制在两小时内", "避免跨区"] : ["Keep exploring", anchor ? "Keep fixed plan" : "Under two hours", "Avoid crossing town"],
      mapQuery: isZh ? `适合短暂停留的小型景点 ${target}` : `small sights and things to do near ${target}`,
    },
    flexible: {
      title: isZh ? "给接下来留点弹性" : "Keep the next move flexible",
      summary: isZh
        ? anchor ? `先选一个随时能离开的安排，再视情况往 ${anchor.place} 靠近。` : "只选一个随时能结束的安排，之后再决定下一步。"
        : anchor ? `Pick something you can leave anytime, then drift toward ${anchor.place}.` : "Pick something you can leave anytime, then decide what is next.",
      evidence: isZh ? ["更随性", "随时可停", anchor ? "保留固定安排" : "不新增预约"] : ["More flexible", "Leave anytime", anchor ? "Keep fixed plan" : "No new booking"],
      mapQuery: isZh ? `适合随时停留的地方 ${target}` : `casual places to stop near ${target}`,
    },
    conservative: {
      title: isZh ? "先按稳妥的方式走" : "Take the low-risk next move",
      summary: isZh
        ? anchor ? `不新增预约，也不大范围移动，给 ${anchor.time} 的安排留出余量。` : "不新增预约，也不大范围移动，先处理接下来 90–120 分钟。"
        : anchor ? `Avoid new bookings and cross-town travel, leaving room for the ${anchor.time} plan.` : "Avoid new bookings and cross-town travel for the next 90–120 minutes.",
      evidence: isZh ? ["低承诺", anchor ? "保留固定安排" : "约两小时", "避免跨区"] : ["Low commitment", anchor ? "Keep fixed plan" : "About two hours", "Avoid crossing town"],
      mapQuery: isZh ? `适合短暂停留的地方 ${target}` : `low commitment places to visit near ${target}`,
    },
  }[strategy];

  const firstStep: Record<DecisionStrategy, DecisionStep> = {
    rest: { label: isZh ? "现在" : "Now", title: isZh ? "找一个能坐下来的地方" : "Find somewhere to sit", detail: isZh ? "休息 30–45 分钟，不新增需要赶时间的安排" : "Rest for 30–45 minutes without adding a timed booking" },
    explore: { label: isZh ? "接下来" : "Next", title: isZh ? "选一个低承诺的小体验" : "Choose one low-commitment experience", detail: isZh ? "优先小型展馆、街区或室内空间，随时可以结束" : "Prefer a small gallery, neighbourhood, or indoor stop you can leave anytime" },
    flexible: { label: isZh ? "接下来" : "Next", title: isZh ? "只决定一个随时能停的安排" : "Choose one stop you can leave anytime", detail: isZh ? "不预约，不把后面的时间排满" : "No booking and no need to fill the rest of the day" },
    conservative: { label: isZh ? "接下来" : "Next", title: isZh ? "先选一个低风险的落脚点" : "Choose a low-risk place to pause", detail: isZh ? "不新增预约，不做大范围移动" : "No new booking and no cross-town travel" },
  };

  const steps: DecisionStep[] = [firstStep[strategy]];
  if (anchor) {
    steps.push({
      label: isZh ? "之后" : "After that",
      title: isZh ? `开始往 ${anchor.place} 靠近` : `Start moving toward ${anchor.place}`,
      detail: isZh ? "让地图负责具体地点、路线和到达时间" : "Let your map handle the exact place, route, and ETA",
    });
    steps.push({ label: anchor.time, title: anchor.place, detail: isZh ? "固定安排保留" : "Fixed plan kept", anchor: true });
  } else {
    steps.push({ label: isZh ? "90–120 分钟后" : "In 90–120 min", title: isZh ? "再回来决定下一步" : "Come back and decide again", detail: isZh ? "这一轮只处理眼前，不规划整天" : "This decision only covers what is immediately ahead" });
  }

  const limit = isZh ? 28 : 48;
  const changeQuote = `“${context.change.slice(0, limit)}${context.change.length > limit ? "…" : ""}”`;
  const why = isZh
    ? anchor
      ? `你说${changeQuote}，${stateWhy}；${anchor.time} 还有「${anchor.place}」这个固定安排。所以这次不重新规划整天，只降低眼前的移动和承诺成本，再逐渐往下一站收拢。`
      : `你说${changeQuote}，${stateWhy}。因为没有下一个固定安排，这次只处理未来约 90–120 分钟，结束后再决定下一步。`
    : anchor
      ? `You said ${changeQuote}, and ${stateWhy.toLocaleLowerCase()}. You also have “${anchor.place}” fixed at ${anchor.time}. This keeps that plan while reducing commitment before it.`
      : `You said ${changeQuote}, and ${stateWhy.toLocaleLowerCase()}. With no fixed plan ahead, this only covers the next 90–120 minutes.`;

  return {
    strategy,
    title: strategyCopy.title,
    summary: strategyCopy.summary,
    horizon: anchor ? (isZh ? `到 ${anchor.time} 之前` : `Until ${anchor.time}`) : (isZh ? "未来约 90–120 分钟" : "The next 90–120 minutes"),
    steps,
    why,
    evidence: strategyCopy.evidence,
    mapQuery: strategyCopy.mapQuery,
  };
};

export function createMapLinks(query: string) {
  const encoded = encodeURIComponent(query);
  return [
    { id: "apple", label: "Apple Maps", href: `https://maps.apple.com/?q=${encoded}` },
    { id: "google", label: "Google Maps", href: `https://www.google.com/maps/search/?api=1&query=${encoded}` },
    { id: "amap", label: "高德地图", href: `https://uri.amap.com/search?keyword=${encoded}&callnative=1` },
  ] as const;
}
