import type { Locale } from "./mock-data";
import { buildDecisionContext, type DecisionModelContext } from "./decision-model.ts";
import { decisionHorizon, selectPrimaryStrategy, type ScoreBreakdown, type StrategyId } from "./decision-rules.ts";

export type CurrentState = "tired" | "lessWalking" | "explore" | "spontaneous" | "endDay";
export type DecisionStrategy = StrategyId;
export type MapMode = "search" | "navigate";
export type Coordinates = { latitude: number; longitude: number };

export type DecisionContext = {
  change: string;
  currentPlace: string;
  coordinates?: Coordinates;
  noAnchorKnown?: boolean;
  timeConstraint?: string;
  currentTime: string;
  currentLocalTime?: string;
  lessWalking?: boolean;
  indoors?: boolean;
  nextAnchor: { time: string; place: string; destination?: string } | null;
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
  category?: string;
  map?: { label: string; query: string; mode: MapMode; center?: Coordinates };
};

export type DecisionResult = {
  strategy: DecisionStrategy;
  title: string;
  summary: string;
  horizon: string;
  steps: DecisionStep[];
  why: string;
  evidence: string[];
  currentLocalTime: string;
  revisit?: string;
  debug: {
    selected: StrategyId;
    daypart: DecisionModelContext["daypart"];
    minutesToAnchor: number | null;
    scores: Array<{ strategy: StrategyId; score: number; breakdown: ScoreBreakdown }>;
    vetoed: Partial<Record<StrategyId, string>>;
  };
};

export type DecisionEngine = (context: DecisionContext, locale: Locale, steering?: CurrentState | Steering) => DecisionResult;
export type Steering = { intent: CurrentState; lessWalking: boolean; indoors: boolean; text: string };

export function readCurrentClock(now = new Date()) {
  return { currentTime: now.toISOString(), currentLocalTime: [now.getHours(), now.getMinutes()].map(value => String(value).padStart(2, "0")).join(":") };
}

export function parseSteeringText(text: string): Steering | null {
  const lessWalking = /(少走|不想走|不要走|别走|不走远|不想.*坐车|不要跨区|less walk|not.*walk far|stay close)/i.test(text);
  const explore = /(想.*(?:逛|玩|继续)|继续.*(?:逛|看|玩)|探索|夜生活|夜景|explore|keep going|nightlife)/i.test(text) && !/(不想.*(?:逛|玩)|don't want to explore)/i.test(text);
  const indoors = /(下雨|室内|太热|太冷|rain|indoors|too hot|too cold)/i.test(text);
  const endDay = /(回酒店|回住处|想睡|今天就这样|不想继续|go back to (?:the )?(?:hotel|stay)|want to sleep|call it a day)/i.test(text);
  const rest = /(累|休息|想坐|想歇|tired|rest|sit down|worn out)/i.test(text);
  const different = /(换个感觉|换一种|随性|随便走走|不想赶|different|change the feel|spontaneous)/i.test(text);
  const intent: CurrentState | null = endDay ? "endDay" : explore ? "explore" : rest || lessWalking ? "lessWalking" : indoors || different ? "spontaneous" : null;
  return intent ? { intent, lessWalking, indoors, text: text.trim() } : null;
}

type Category = {
  id: string;
  label: string;
  action: string;
  detail: string;
  query?: string;
  cta?: string;
};

const cleanDestination = (anchor: NonNullable<DecisionContext["nextAnchor"]>) => anchor.destination || anchor.place
  .replace(/(已预订|预订|预约|晚餐|晚饭|\s*·\s*)/g, " ")
  .replace(/\b(dinner|reservation|reserved|in)\b/gi, " ")
  .replace(/\s+/g, " ")
  .trim();

function formatClock(total: number, locale: Locale) {
  const nextDay = total >= 1440;
  const time = `${String(Math.floor(total / 60) % 24).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`;
  return nextDay ? (locale === "zh" ? `次日 ${time}` : `Tomorrow ${time}`) : time;
}

export function selectPlaceCategory(strategy: StrategyId, context: DecisionModelContext, locale: Locale): Category {
  const zh = locale === "zh";
  const t = (cn: string, en: string) => zh ? cn : en;
  const explicitPark = Boolean(context.explicitPreference && /公园|park/i.test(context.explicitPreference));
  if (strategy === "REST_NEARBY") return {
    id: "cafe_bakery",
    label: t("咖啡馆 / 面包店 / 安静室内空间", "Café / bakery / quiet indoor space"),
    action: t("找一家能坐下的咖啡馆、面包店或安静室内空间", "Find a café, bakery, or quiet indoor place with seating"),
    detail: t("先恢复体力，不需要现在决定之后整晚。", "Recover first; you do not need to decide the rest of the evening yet."),
    query: "cafes and bakeries",
    cta: t("在地图里找附近能坐的地方", "Find somewhere to sit in Maps"),
  };
  if (strategy === "FOOD_DRINK_BREAK") {
    const late = context.daypart === "NIGHT" || context.daypart === "LATE_NIGHT";
    return {
      id: late ? "food_open_now" : "food_drink",
      label: t("简餐 / 甜点 / 咖啡", "Casual food / dessert / coffee"),
      action: late ? t("找一个现在仍可进入的室内吃喝选择", "Find an indoor food or drink option that is open now") : t("找个地方简单吃喝、补充体力", "Stop for a casual bite or drink"),
      detail: t("让地图筛选当前营业的选择；这里不预设具体店。", "Let Maps filter what is currently open; no specific venue is assumed here."),
      query: late ? "food open now" : "casual food cafes",
      cta: late ? t("在地图里找仍营业的吃喝选择", "Find food or drink open now in Maps") : t("在地图里找附近的简餐或咖啡", "Find casual food or coffee in Maps"),
    };
  }
  if (strategy === "LIGHT_EXPLORE") {
    if (context.environmentConstraint === "RAIN" || context.environmentConstraint === "HEAT" || context.environmentConstraint === "COLD") return selectPlaceCategory("INDOOR_LOW_COMMITMENT", context, locale);
    if (explicitPark) return {
      id: "park",
      label: t("附近公园", "Nearby park"),
      action: t("按你的意愿，就近看看公园", "Follow your preference and look for a nearby park"),
      detail: t("只提供地点方向；请在地图里确认开放情况和实际环境。", "This is only a place direction; check access and conditions in Maps."),
      query: "parks",
      cta: t("在地图里看看附近公园", "Find nearby parks in Maps"),
    };
    const night = context.daypart === "NIGHT" || context.daypart === "LATE_NIGHT";
    return {
      id: night ? "night_area" : "nearby_explore",
      label: night ? t("附近街区 / 小店区域", "Nearby streets / small-shop area") : t("附近街区 / 公园 / 小店区域", "Nearby streets / park / small-shop area"),
      action: night ? t("只在附近找一段随时能结束的小探索", "Keep to a nearby, easy-to-end exploration") : t("在附近街区、公园或小店区域轻逛", "Explore nearby streets, a park, or a small-shop area"),
      detail: t("保持低承诺，不跨区，也不增加大型景点。", "Keep it low-commitment, stay local, and skip another major sight."),
      query: night ? "things to do open now" : "parks and shopping streets",
      cta: t("在地图里看看附近可逛的地方", "See nearby places to explore in Maps"),
    };
  }
  if (strategy === "INDOOR_LOW_COMMITMENT") return {
    id: "indoor_low_commitment",
    label: t("室内公共空间 / 商场 / 咖啡馆", "Indoor public space / mall / café"),
    action: t("找一个不用预约、随时能离开的室内空间", "Find an indoor place that needs no booking and is easy to leave"),
    detail: t("把环境影响和行动成本降下来。", "Reduce exposure to the conditions and keep effort low."),
    query: "indoor places open now",
    cta: t("在地图里找附近室内空间", "Find nearby indoor places in Maps"),
  };
  if (strategy === "END_DAY") return {
    id: "return_to_stay",
    label: t("住处 / 酒店", "Accommodation / hotel"),
    action: t("结束今天的活动，回住处休息", "End today’s activities and return to your stay"),
    detail: t("如果已经在住处，就直接休息；不再硬塞第二个安排。", "If you are already there, rest; do not force in a second activity."),
  };
  if (strategy === "SHORT_WAIT") return {
    id: "short_wait",
    label: t("短暂停留", "Short wait"),
    action: t("留在附近短暂等待", "Wait nearby for a short while"),
    detail: t("不再加入新活动，先确认固定安排和路线。", "Add no activity; confirm the fixed plan and route."),
  };
  const anchor = context.original.nextAnchor;
  const destination = anchor ? cleanDestination(anchor) : "";
  return {
    id: "anchor_area",
    label: t("固定安排所在区域", "Fixed-plan area"),
    action: destination ? t(`开始前往 ${destination}`, `Start toward ${destination}`) : t("先核对固定安排的地址和路线", "Check the fixed plan’s address and route"),
    detail: t("地图负责具体路线和时间；这里不估算 ETA。", "Maps handles the route and timing; no ETA is estimated here."),
    query: destination || undefined,
    cta: destination ? t(`导航到 ${destination}`, `Navigate to ${destination}`) : undefined,
  };
}

function mapAction(category: Category, context: DecisionModelContext): DecisionStep["map"] {
  if (!category.query || !category.cta) return undefined;
  if (category.id === "anchor_area") {
    const query = /^navigli$/i.test(category.query) ? "Navigli, Milan" : category.query;
    return { label: category.cta, query, mode: "navigate" };
  }
  const place = context.location.label;
  return {
    label: category.cta,
    query: category.query + (context.location.lat !== undefined || !place ? "" : ` near ${place}`),
    mode: "search",
    center: context.location.lat !== undefined && context.location.lng !== undefined ? { latitude: context.location.lat, longitude: context.location.lng } : undefined,
  };
}

function resultCopy(strategy: StrategyId, context: DecisionModelContext, locale: Locale) {
  const zh = locale === "zh";
  const t = (cn: string, en: string) => zh ? cn : en;
  const nearAnchor = context.minutesToAnchor !== null && context.minutesToAnchor <= 60;
  if (strategy === "MOVE_TO_ANCHOR") return { title: t("不再加活动，现在去固定安排。", "Add nothing else; head to the fixed plan now."), summary: t("先在地图里确认路线，把剩余时间留给移动。", "Check the route in Maps and leave the remaining time for the move.") };
  if (strategy === "SHORT_WAIT") return { title: t("不再塞新活动，就近等一会儿。", "Add no activity; wait nearby."), summary: t("先核对时间和路线，避免为了填空档增加风险。", "Confirm the time and route instead of filling the gap.") };
  if (strategy === "END_DAY") return { title: t("今天就到这里，回住处休息。", "Call it a day and return to your stay."), summary: t("不再硬塞第二个安排，明天再继续。", "Do not force in another activity; continue tomorrow.") };
  if (strategy === "FOOD_DRINK_BREAK" && (context.daypart === "NIGHT" || context.daypart === "LATE_NIGHT")) return { title: t("今晚不用再补行程了。", "You do not need to add another plan tonight."), summary: t("想再待一会儿，就只留一个附近、随时能结束的选择。", "If you want to stay out, keep just one nearby option that is easy to end.") };
  if (strategy === "REST_NEARBY") return { title: nearAnchor ? t("先短暂坐一会儿，再去下一站。", "Sit briefly, then head to the next stop.") : t("先恢复体力，再决定要不要继续。", "Recover first, then decide whether to continue."), summary: t("今天不再补大型景点，先降低体力和移动负担。", "Skip another major sight and reduce effort and movement first.") };
  if (strategy === "LIGHT_EXPLORE") return {
    title: context.movementTolerance === "LOW"
      ? t("不跨区，就在附近轻轻逛。", "Stay local and explore lightly.")
      : context.energy === "LOW"
        ? t("保留一点探索，但把范围留在附近。", "Keep some exploration, but keep it nearby.")
        : t("趁状态还好，就近轻逛一段。", "Use the energy you have for a light nearby exploration."),
    summary: t("只选低承诺、随时可以结束的体验。", "Choose only a low-commitment experience that is easy to end."),
  };
  return { title: t("先转到室内，保留随时结束的余量。", "Move indoors and keep an easy exit."), summary: t("不增加预约，也不为了补景点跨区移动。", "Add no booking and do not cross town to replace a sight.") };
}

function buildReason(strategy: StrategyId, context: DecisionModelContext, locale: Locale) {
  const zh = locale === "zh";
  const t = (cn: string, en: string) => zh ? cn : en;
  const gap = context.minutesToAnchor;
  if (gap !== null && gap <= 0) return t(`设备时间已经超过 ${context.fixedAnchor.time}；这次不再插入活动，先核对日期、时区和安排是否仍有效。`, `Your device clock is past ${context.fixedAnchor.time}; add nothing and check the date, timezone, and whether the plan is still valid.`);
  if (gap !== null && gap <= 30) return t(`距离 ${context.fixedAnchor.time} 只剩约 ${gap} 分钟，任何新活动都会提高错过安排的风险，所以现在只处理移动或短暂等待。`, `Only about ${gap} minutes remain before ${context.fixedAnchor.time}; any activity would raise the risk of missing it, so only move or wait briefly.`);
  if (gap !== null && gap <= 60) return t(`距离 ${context.fixedAnchor.time} 只剩约 ${gap} 分钟${context.energy === "LOW" ? "，而且你已经有点累" : ""}；因此不再补景点，只留一个短暂停留并尽快转向固定安排。`, `About ${gap} minutes remain before ${context.fixedAnchor.time}${context.energy === "LOW" ? ", and your energy is low" : ""}; skip another sight, keep any pause short, and transition to the fixed plan.`);
  if (context.daypart === "LATE_NIGHT" && strategy === "END_DAY") return t("现在已经很晚，而且你没有必须赶到的安排；继续增加活动的收益不高，所以这次直接结束今天。", "It is very late and there is no fixed plan to reach; another activity adds little value, so end the day here.");
  if (context.daypart === "NIGHT" && context.energy === "LOW" && strategy === "FOOD_DRINK_BREAK") return t("现在已经比较晚，而且你也有点累；没有必须赶到的安排时，继续增加长时间活动的收益不高，所以只保留一个附近、随时能结束的室内选择。", "It is late and your energy is low; without a fixed plan, a long activity adds little value, so keep only one nearby indoor option that is easy to end.");
  if (context.continueIntent === "EXPLORE" && context.energy === "LOW") return t(`你还想继续，但体力已经偏低${context.movementTolerance === "LOW" ? "，也不想走远" : ""}；因此保留探索感，同时放弃跨区和大型景点。`, `You want to continue, but your energy is low${context.movementTolerance === "LOW" ? " and you do not want to go far" : ""}; keep some exploration while dropping cross-town movement and major sights.`);
  if ((context.daypart === "NIGHT" || context.daypart === "LATE_NIGHT") && context.continueIntent === "EXPLORE") return t("现在虽然已是夜间，但你明确还想继续；因此不强行结束今天，只把选择收缩为附近、低承诺且随时能结束的活动。", "Although it is night, you explicitly want to continue; do not force an end, but narrow the choice to something nearby, low-commitment, and easy to stop.");
  if (gap !== null && gap > 60 && gap <= 180 && context.energy === "LOW") return t(`你当前体力偏低，之后还有 ${context.fixedAnchor.time} 的固定安排；与其补一个高投入景点，不如先恢复体力，并把移动留给下一站。`, `Your energy is low and you have a fixed plan at ${context.fixedAnchor.time}; instead of adding a demanding sight, recover first and reserve the move for the next stop.`);
  if (context.environmentConstraint !== "UNKNOWN" && context.environmentConstraint !== "NONE") return t("你明确提到了环境不适，所以户外和长时间移动被排除；这次优先选择无需预约、随时能离开的室内安排。", "You explicitly mentioned uncomfortable conditions, so outdoor and long-movement options were removed; use an indoor, no-booking option that is easy to leave.");
  if (context.movementTolerance === "LOW" && strategy === "LIGHT_EXPLORE") return t("你还想继续体验，但不想走太远；因此活动范围只留在当前区域，并放弃跨区和大型景点。", "You still want an experience but do not want to walk far; stay in the current area and drop cross-town movement and major sights.");
  if (context.energy === "HIGH" && strategy === "LIGHT_EXPLORE") return t("你现在仍有精力，又没有必须赶到的安排；与其提前结束，不如用一段可随时停止的附近探索填补空档。", "You still have energy and no fixed plan to reach; a nearby exploration that can end at any time fits better than stopping early.");
  if (context.energy === "LOW") return t("你当前体力偏低；与其重新补一个高投入景点，不如先降低行动成本，把之后的选择保留下来。", "Your energy is low; instead of replacing the plan with another demanding sight, reduce effort now and preserve your options for later.");
  return t("当前信息还不完整，所以这次优先选择低承诺、可随时结束的安排，而不是重新规划一整段行程。", "The context is incomplete, so prefer a low-commitment option that is easy to end instead of rebuilding the itinerary.");
}

function buildEvidence(context: DecisionModelContext, locale: Locale) {
  const zh = locale === "zh";
  const evidence: string[] = [];
  if (context.daypart === "NIGHT") evidence.push(zh ? `${context.currentLocalTime} · 夜间` : `${context.currentLocalTime} · night`);
  if (context.daypart === "LATE_NIGHT") evidence.push(zh ? `${context.currentLocalTime} · 深夜` : `${context.currentLocalTime} · late night`);
  if (context.energy === "LOW") evidence.push(zh ? "体力偏低" : "Low energy");
  else if (context.energy === "HIGH") evidence.push(zh ? "还有精力" : "Energy available");
  if (context.continueIntent === "EXPLORE") evidence.push(zh ? "明确还想继续" : "Explicit intent to continue");
  if (context.movementTolerance === "LOW") evidence.push(zh ? "不想走太远" : "Stay close");
  if (context.fixedAnchor.exists) evidence.push(`${context.fixedAnchor.time} ${context.fixedAnchor.label}`);
  else if (context.original.noAnchorKnown) evidence.push(zh ? "没有固定安排" : "No fixed plan");
  return evidence.slice(0, 3);
}

function buildSteps(strategy: StrategyId, context: DecisionModelContext, locale: Locale): { steps: DecisionStep[]; revisit?: string } {
  const zh = locale === "zh";
  const t = (cn: string, en: string) => zh ? cn : en;
  const now = context.minuteOfDay;
  const gap = context.minutesToAnchor;
  const horizon = decisionHorizon(context);
  const category = selectPlaceCategory(strategy, context, locale);
  const steps: DecisionStep[] = [];
  const primaryMap = mapAction(category, context);
  const anchor = context.original.nextAnchor;
  const anchorCategory = anchor ? selectPlaceCategory("MOVE_TO_ANCHOR", context, locale) : null;
  const anchorStep = anchor ? { label: t("固定安排", "Fixed plan"), title: `${anchor.time} ${anchor.place}`, detail: gap !== null && gap <= 0 ? t("时间待核对 · 不自动改到明天", "Time needs checking · not moved to tomorrow") : t("原安排保留", "Original plan kept"), anchor: true } satisfies DecisionStep : null;
  let activeEnd = now;

  if (strategy === "END_DAY") {
    steps.push({ label: t(`${formatClock(now, locale)} 起`, `From ${formatClock(now, locale)}`), title: category.action, detail: category.detail, category: category.label });
  } else if (strategy === "MOVE_TO_ANCHOR" || strategy === "SHORT_WAIT") {
    steps.push({ label: t(`${formatClock(now, locale)} 起`, `From ${formatClock(now, locale)}`), title: category.action, detail: category.detail, category: category.label, ...(primaryMap ? { map: primaryMap } : {}) });
  } else if (gap !== null && gap > 30 && gap <= 60) {
    const pause = Math.max(15, Math.min(30, gap - 20));
    activeEnd = now + pause;
    steps.push({ label: `${formatClock(now, locale)}–${formatClock(now + pause, locale)}`, title: category.action, detail: category.detail, category: category.label, ...(primaryMap ? { map: primaryMap } : {}) });
    if (anchorCategory) {
      const nextMap = mapAction(anchorCategory, context);
      steps.push({ label: t(`${formatClock(now + pause, locale)} 后`, `After ${formatClock(now + pause, locale)}`), title: anchorCategory.action, detail: anchorCategory.detail, category: anchorCategory.label, ...(nextMap ? { map: nextMap } : {}) });
    }
  } else {
    const duration = strategy === "REST_NEARBY" ? Math.min(40, horizon) : strategy === "FOOD_DRINK_BREAK" ? Math.min(context.daypart === "NIGHT" ? 38 : 45, horizon) : Math.min(context.energy === "LOW" ? 45 : 60, horizon);
    activeEnd = now + duration;
    steps.push({ label: `${formatClock(now, locale)}–${formatClock(now + duration, locale)}`, title: category.action, detail: category.detail, category: category.label, ...(primaryMap ? { map: primaryMap } : {}) });
    if (anchor && gap !== null && gap > 60 && gap <= 180 && anchorCategory) {
      const nextMap = mapAction(anchorCategory, context);
      steps.push({ label: t(`${formatClock(now + duration, locale)} 后`, `After ${formatClock(now + duration, locale)}`), title: anchorCategory.action, detail: anchorCategory.detail, category: anchorCategory.label, ...(nextMap ? { map: nextMap } : {}) });
    }
  }
  if (anchorStep) steps.push(anchorStep);
  const revisit = !anchor && strategy !== "END_DAY" ? (context.daypart === "NIGHT" || context.daypart === "LATE_NIGHT" ? t(`${formatClock(activeEnd, locale)} 后，根据状态决定直接结束今天。`, `After ${formatClock(activeEnd, locale)}, decide whether to end the day.`) : t(`${formatClock(activeEnd, locale)} 后，再按当时状态决定下一段。`, `After ${formatClock(activeEnd, locale)}, decide the next part based on how you feel.`)) : undefined;
  return { steps, revisit };
}

export const localDecisionEngine: DecisionEngine = (context, locale, steering) => {
  const model = buildDecisionContext(context, steering);
  const selection = selectPrimaryStrategy(model);
  const strategy = selection.selected?.strategy ?? "SHORT_WAIT";
  const copy = resultCopy(strategy, model, locale);
  const plan = buildSteps(strategy, model, locale);
  return {
    strategy,
    title: copy.title,
    summary: copy.summary,
    currentLocalTime: model.currentLocalTime,
    horizon: locale === "zh" ? `本次只处理约 ${decisionHorizon(model)} 分钟` : `This decision covers about ${decisionHorizon(model)} minutes`,
    steps: plan.steps,
    why: buildReason(strategy, model, locale),
    evidence: buildEvidence(model, locale),
    revisit: plan.revisit,
    debug: {
      selected: strategy,
      daypart: model.daypart,
      minutesToAnchor: model.minutesToAnchor,
      scores: selection.scored.map(item => ({ ...item, score: Math.round(item.score * 100) / 100 })),
      vetoed: selection.vetoed,
    },
  };
};

export function createMapLinks(query: string, mode: MapMode = "search", center?: Coordinates) {
  const encoded = encodeURIComponent(query);
  if (center && mode === "search") {
    const coordinate = `${center.latitude},${center.longitude}`;
    return [
      { id: "apple", label: "Apple Maps", href: `https://maps.apple.com/?q=${encoded}&sll=${encodeURIComponent(coordinate)}` },
      { id: "google", label: "Google Maps", href: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${query} near ${coordinate}`)}` },
    ] as const;
  }
  if (mode === "navigate") {
    return [
      { id: "apple", label: "Apple Maps", href: `https://maps.apple.com/?daddr=${encoded}` },
      { id: "google", label: "Google Maps", href: `https://www.google.com/maps/dir/?api=1&destination=${encoded}` },
      { id: "amap", label: "高德地图", href: `https://uri.amap.com/search?keyword=${encoded}&callnative=1` },
    ] as const;
  }
  return [
    { id: "apple", label: "Apple Maps", href: `https://maps.apple.com/?q=${encoded}` },
    { id: "google", label: "Google Maps", href: `https://www.google.com/maps/search/?api=1&query=${encoded}` },
    { id: "amap", label: "高德地图", href: `https://uri.amap.com/search?keyword=${encoded}&callnative=1` },
  ] as const;
}
