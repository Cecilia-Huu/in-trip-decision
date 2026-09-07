import type { Locale } from "./mock-data";

export type CurrentState = "tired" | "lessWalking" | "explore" | "spontaneous";
export type DecisionStrategy = "rest" | "explore" | "flexible" | "conservative";
export type MapMode = "search" | "navigate";

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
  map?: { label: string; query: string; mode: MapMode };
};

export type DecisionResult = {
  strategy: DecisionStrategy;
  title: string;
  summary: string;
  horizon: string;
  steps: DecisionStep[];
  why: string;
  evidence: string[];
};

export type ParsedContext = {
  currentPlace?: string;
  nextAnchor?: { time: string; place: string };
  currentState?: CurrentState;
};

export type DecisionEngine = (context: DecisionContext, locale: Locale, steering?: CurrentState) => DecisionResult;

const sleepPattern = /(睡懒觉|睡一会|补觉|想睡|困了|nap|sleep in|go to sleep)/i;

function chooseStrategy(context: DecisionContext, steering?: CurrentState): DecisionStrategy {
  const states = steering ? [steering] : context.currentState;
  if (states.includes("tired") || states.includes("lessWalking")) return "rest";
  if (states.includes("explore")) return "explore";
  if (states.includes("spontaneous")) return "flexible";
  return "conservative";
}

function cleanAnchorPlace(value: string) {
  return value
    .replace(/(已预订|预订|预约|晚餐)/g, " ")
    .replace(/\b(dinner|reservation|reserved)\b/gi, " ")
    .replace(/\s+/g, " ")
    .trim() || value.trim();
}

function stateLabel(state: CurrentState | undefined, locale: Locale) {
  if (!state) return null;
  const labels: Record<Locale, Record<CurrentState, string>> = {
    zh: { tired: "有点累", lessWalking: "不想走太远", explore: "还想继续逛", spontaneous: "想随性一点" },
    en: { tired: "A little tired", lessWalking: "Less walking", explore: "Still want to explore", spontaneous: "Keep it spontaneous" },
  };
  return labels[locale][state];
}

function nearbyPhrase(place: string, locale: Locale) {
  if (locale === "en") return `near ${place}`;
  return place.includes("附近") ? place : `${place}附近`;
}

export function extractContextFromText(text: string, locale: Locale): ParsedContext {
  const normalized = text.trim();
  const lower = normalized.toLocaleLowerCase();
  let currentPlace: string | undefined;
  const knownPlaces = [
    { aliases: ["米兰大教堂", "milan cathedral", "duomo di milano"], zh: "米兰大教堂", en: "Milan Cathedral" },
    { aliases: ["塞维利亚大教堂", "seville cathedral", "catedral de sevilla"], zh: "塞维利亚大教堂", en: "Seville Cathedral" },
    { aliases: ["圣家堂", "sagrada família", "sagrada familia"], zh: "圣家堂", en: "Sagrada Família" },
  ];
  const knownPlace = knownPlaces.find((place) => place.aliases.some((alias) => lower.includes(alias)));
  if (knownPlace) currentPlace = knownPlace[locale];

  let currentState: CurrentState | undefined;
  if (/(有点累|累了|疲惫|困了|tired|exhausted)/i.test(normalized)) currentState = "tired";
  else if (/(不想走太远|少走|走不动|less walking|not walk far)/i.test(normalized)) currentState = "lessWalking";
  else if (/(还想.*逛|继续逛|继续探索|still want to explore|keep exploring)/i.test(normalized)) currentState = "explore";
  else if (/(随性|随便走走|spontaneous|play it by ear)/i.test(normalized)) currentState = "spontaneous";

  let time: string | undefined;
  const digitalTime = normalized.match(/(?:^|\D)([01]?\d|2[0-3])[:：]([0-5]\d)(?:\D|$)/);
  if (digitalTime) time = `${digitalTime[1].padStart(2, "0")}:${digitalTime[2]}`;
  else if (/(晚上|晚间)\s*(?:7|七)\s*点|(?:7|七)\s*点.*晚餐/i.test(normalized)) time = "19:00";

  let nextAnchor: ParsedContext["nextAnchor"];
  if (time && /(晚餐|dinner)/i.test(normalized)) {
    if (/navigli/i.test(normalized)) nextAnchor = { time, place: locale === "zh" ? "Navigli 晚餐" : "Dinner in Navigli" };
    else nextAnchor = { time, place: locale === "zh" ? "晚餐" : "Dinner" };
  }
  return { currentPlace, currentState, nextAnchor };
}

export function parseSteeringText(text: string): CurrentState {
  if (/(少走|不想走|累|休息|tired|less walk|rest)/i.test(text)) return "lessWalking";
  if (/(想逛|继续.*(?:逛|看)|再.*(?:逛|看)|探索|active|explore|keep going)/i.test(text)) return "explore";
  return "spontaneous";
}

export const localDecisionEngine: DecisionEngine = (context, locale, steering) => {
  const strategy = chooseStrategy(context, steering);
  const state = steering ?? context.currentState[0];
  const anchor = context.nextAnchor;
  const isZh = locale === "zh";
  const isSleep = sleepPattern.test(context.change) && !anchor && !steering;
  const currentArea = nearbyPhrase(context.currentPlace, locale);
  const anchorDestination = anchor ? cleanAnchorPlace(anchor.place) : "";

  const title = isSleep
    ? isZh ? "先休息，醒来后再从附近开始。" : "Rest first, then restart nearby."
    : strategy === "rest"
      ? isZh ? "先找个附近的地方休息一下。" : "Find somewhere nearby to rest first."
      : strategy === "explore"
        ? isZh ? "先在附近轻松逛一会儿。" : "Explore nearby for a little longer."
        : strategy === "flexible"
          ? isZh ? "先随性走一小段。" : "Keep the next move loose and flexible."
          : isZh ? "先做一个轻量、随时能停的安排。" : "Choose one light, easy-to-end activity."

  const summary = isSleep
    ? isZh ? "睡一会儿，醒来后只安排附近的轻量活动。" : "Sleep for a while, then keep the next activity close by."
    : strategy === "rest"
      ? isZh ? "休息 30–45 分钟，再继续后面的安排。" : "Rest for 30–45 minutes, then continue with what comes next."
      : strategy === "explore"
        ? isZh ? "选一个低承诺的小体验，随时可以结束。" : "Pick one low-commitment experience you can leave anytime."
        : strategy === "flexible"
          ? isZh ? "不预约，也不把后面的时间排满。" : "No booking, and no need to fill the rest of the time."
          : isZh ? "不新增预约，也不做大范围移动。" : "Avoid new bookings and cross-town travel."

  const localSearch = strategy === "rest"
    ? isZh ? `可以坐下休息的咖啡馆 ${context.currentPlace}` : `cafes to sit and rest near ${context.currentPlace}`
    : strategy === "explore"
      ? isZh ? `适合短暂停留的小型景点 ${context.currentPlace}` : `small sights near ${context.currentPlace}`
      : isZh ? `适合短暂停留的地方 ${context.currentPlace}` : `low commitment places near ${context.currentPlace}`;

  const steps: DecisionStep[] = [];
  if (isSleep) {
    steps.push({ label: isZh ? "现在" : "Now", title: isZh ? "先休息 / 睡一会儿" : "Rest or sleep for a while", detail: isZh ? "不用急着为醒来后的时间做决定" : "No need to decide what happens after you wake up yet" });
    steps.push({ label: isZh ? "醒来后" : "When you wake up", title: isZh ? "从酒店附近开始" : "Start near your hotel", detail: isZh ? "只安排接下来约 90–120 分钟的轻量活动" : "Keep it light and cover only the next 90–120 minutes", map: { label: isZh ? "在附近看看" : "See what is nearby", query: isZh ? `适合短暂停留的地方 ${context.currentPlace}` : `low commitment places near ${context.currentPlace}`, mode: "search" } });
  } else {
    const stepTitle = strategy === "rest"
      ? isZh ? "找附近可以坐的地方休息" : "Find somewhere nearby to sit and rest"
      : strategy === "explore"
        ? isZh ? "在附近选一个轻量体验" : "Choose one light activity nearby"
        : strategy === "flexible"
          ? isZh ? "选一个随时能停的安排" : "Choose something you can leave anytime"
          : isZh ? "先找一个轻量落脚点" : "Find a light, low-risk place to pause";
    steps.push({ label: isZh ? "现在" : "Now", title: stepTitle, detail: strategy === "rest" ? (isZh ? "30–45 分钟" : "30–45 minutes") : (isZh ? "不新增预约" : "No new booking"), map: { label: isZh ? "在地图里找附近的地方" : "Find a nearby place in Maps", query: localSearch, mode: "search" } });
    if (anchor) {
      steps.push({ label: isZh ? "接着" : "Then", title: isZh ? `前往 ${anchorDestination}` : `Head to ${anchorDestination}`, detail: isZh ? "具体路线和到达时间交给地图" : "Let Maps handle the route and arrival time", map: { label: isZh ? `导航到 ${anchorDestination}` : `Navigate to ${anchorDestination}`, query: anchorDestination, mode: "navigate" } });
      steps.push({ label: isZh ? "固定安排" : "Fixed plan", title: `${anchor.time} ${anchor.place}`, detail: isZh ? "已保留 · 无需操作" : "Kept · no action needed", anchor: true });
    } else {
      steps.push({ label: isZh ? "90–120 分钟后" : "In 90–120 min", title: isZh ? "再回来决定下一步" : "Come back and decide again", detail: isZh ? "这一轮只处理眼前，不规划整天" : "This decision only covers what is immediately ahead" });
    }
  }

  const stateEvidence = stateLabel(state, locale);
  const evidence = [stateEvidence, anchor ? `${anchor.time} ${anchor.place}` : null, context.currentPlace].filter((item): item is string => Boolean(item)).slice(0, 3);
  const why = isSleep
    ? isZh ? `你现在想休息，也没有固定安排，所以先睡一会儿；醒来后只从${currentArea}开始。` : `You want to rest and have no fixed plan, so sleep first and restart ${currentArea}.`
    : anchor
      ? strategy === "rest"
        ? isZh ? `你现在${state === "tired" ? "有点累" : "不想走太远"}，${anchor.time} 还有「${anchor.place}」，所以先在${currentArea}休息，再前往下一站。` : `You want an easier pace and have “${anchor.place}” at ${anchor.time}, so rest ${currentArea} before heading there.`
        : strategy === "explore"
          ? isZh ? `你还想继续逛，${anchor.time} 还有「${anchor.place}」，所以只在${currentArea}安排一个轻量体验，再前往下一站。` : `You still want to explore and have “${anchor.place}” at ${anchor.time}, so keep the extra stop light and local.`
          : isZh ? `${anchor.time} 还有「${anchor.place}」，所以先在${currentArea}做一个随时能停的安排，再前往下一站。` : `You have “${anchor.place}” at ${anchor.time}, so choose something flexible ${currentArea} before heading there.`
      : strategy === "rest"
        ? isZh ? `你现在${state === "tired" ? "有点累" : "不想走太远"}，也没有固定安排，所以先在${currentArea}休息，只处理接下来约 90–120 分钟。` : `You want an easier pace and have no fixed plan, so rest ${currentArea} and cover only the next 90–120 minutes.`
        : strategy === "explore"
          ? isZh ? `你还想继续逛，也没有固定安排，所以先在${currentArea}选一个轻量体验，90–120 分钟后再决定。` : `You still want to explore and have no fixed plan, so choose one light activity ${currentArea} and decide again later.`
          : strategy === "flexible"
            ? isZh ? `你想随性一点，也没有固定安排，所以先在${currentArea}做一个随时能停的选择。` : `You want to keep things spontaneous and have no fixed plan, so choose something easy to leave ${currentArea}.`
            : isZh ? `目前没有固定安排，也没有更多状态信息，所以先在${currentArea}做一个低承诺选择。` : `There is no fixed plan or added state, so start with one low-commitment choice ${currentArea}.`;

  return { strategy, title, summary, horizon: anchor ? (isZh ? `到 ${anchor.time} 之前` : `Until ${anchor.time}`) : (isZh ? "接下来约 90–120 分钟" : "The next 90–120 minutes"), steps, why, evidence };
};

export function createMapLinks(query: string, mode: MapMode = "search") {
  const encoded = encodeURIComponent(query);
  if (mode === "navigate") {
    return [
      { id: "apple", label: "Apple Maps", href: `https://maps.apple.com/?daddr=${encoded}&dirflg=w` },
      { id: "google", label: "Google Maps", href: `https://www.google.com/maps/dir/?api=1&destination=${encoded}&travelmode=walking` },
      { id: "amap", label: "高德地图", href: `https://uri.amap.com/search?keyword=${encoded}&callnative=1` },
    ] as const;
  }
  return [
    { id: "apple", label: "Apple Maps", href: `https://maps.apple.com/?q=${encoded}` },
    { id: "google", label: "Google Maps", href: `https://www.google.com/maps/search/?api=1&query=${encoded}` },
    { id: "amap", label: "高德地图", href: `https://uri.amap.com/search?keyword=${encoded}&callnative=1` },
  ] as const;
}
