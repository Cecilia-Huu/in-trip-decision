import type { Locale } from "./mock-data";

export type CurrentState = "tired" | "lessWalking" | "explore" | "spontaneous";
export type DecisionStrategy = "rest" | "explore" | "flexible" | "conservative";
export type MapMode = "search" | "navigate";
export type Coordinates = { latitude: number; longitude: number };

export type DecisionContext = {
  change: string;
  currentPlace: string;
  coordinates?: Coordinates;
  noAnchorKnown?: boolean;
  timeConstraint?: string;
  currentTime: string;
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
  const isLessWalking = state === "lessWalking";
  const currentArea = context.coordinates ? (isZh ? "当前位置附近" : "near your current location") : nearbyPhrase(context.currentPlace, locale);
  const anchorDestination = anchor ? anchor.destination || cleanAnchorPlace(anchor.place) : "";
  const navigationTarget = /^navigli$/i.test(anchorDestination) ? "Navigli, Milan" : anchorDestination;

  const title = isSleep
    ? isZh ? "先休息，醒来后再从附近开始。" : "Rest first, then restart nearby."
    : strategy === "rest"
      ? anchor
        ? isLessWalking
          ? isZh ? "不再跨区补景点，把活动收在附近。" : "Do not cross town for another sight. Keep things nearby."
          : isZh ? "今天不再补大型景点，先休息一下。" : "Skip another major sight today and rest first."
        : isLessWalking
          ? isZh ? "不再扩大活动范围，先在附近休息。" : "Do not widen the area. Rest nearby first."
          : isZh ? "先不追加新行程，休息一下。" : "Do not add another plan yet. Rest first."
      : strategy === "explore"
        ? anchor
          ? isZh ? "不补大型景点，只留一次轻量探索。" : "Skip a major sight and keep one light exploration."
          : isZh ? "不排满后面的时间，只轻逛一段。" : "Leave the rest open and explore lightly for now."
        : strategy === "flexible"
          ? isZh ? "今天不再赶景点，换成一次室内停留。" : "Stop chasing sights and switch to an indoor pause."
          : isZh ? "先不补原计划，只处理眼前一段。" : "Do not replace the failed plan yet. Handle this short window."

  const summary = isSleep
    ? isZh ? "睡一会儿，醒来后只安排附近的轻量活动。" : "Sleep for a while, then keep the next activity close by."
    : strategy === "rest"
      ? anchor
        ? isLessWalking
          ? isZh ? "只在当前位置附近休息；接着直接前往下一站。" : "Rest only near your current location, then head directly to the next stop."
          : isZh ? "休息约 30–45 分钟；恢复体力后，再把活动范围收向下一站。" : "Rest for 30–45 minutes, then keep any extra activity close to the next stop."
        : isZh ? "休息约 30–45 分钟；恢复后只在附近做轻量活动。" : "Rest for 30–45 minutes, then keep any activity nearby and light."
      : strategy === "explore"
        ? anchor
          ? isZh ? `在当前位置附近轻逛，随时可以结束；接着前往 ${anchorDestination}。` : `Explore close to where you are, then head to ${anchorDestination}.`
          : isZh ? "只选一个随时可以结束的小体验，90–120 分钟后再决定。" : "Choose one easy-to-end experience, then decide again in 90–120 minutes."
        : strategy === "flexible"
          ? anchor
            ? isZh ? `找一处无需预约的室内空间短暂停留，再前往 ${anchorDestination}。` : `Pause in an indoor place with no booking, then head to ${anchorDestination}.`
            : isZh ? "找一处无需预约的室内空间，之后再决定下一步。" : "Choose an indoor place with no booking, then decide what comes next."
          : isZh ? "不新增预约，也不跨区补一个替代景点。" : "Do not add a booking or cross town for a replacement sight."

  const localSearch = strategy === "rest"
    ? isZh ? `可以坐下休息的地方 ${context.currentPlace}` : `places to sit and rest near ${context.currentPlace}`
    : strategy === "explore"
      ? isZh ? `适合短暂停留的小型景点 ${context.currentPlace}` : `small sights near ${context.currentPlace}`
      : strategy === "flexible"
        ? isZh ? `无需预约的室内文化空间 ${context.currentPlace}` : `indoor cultural places with no booking near ${context.currentPlace}`
        : isZh ? `适合短暂停留的地方 ${context.currentPlace}` : `low commitment places near ${context.currentPlace}`;

  const category = strategy === "rest" ? "cafes" : strategy === "explore" ? "sights" : strategy === "flexible" ? "galleries" : "cafes";
  const actionSearch = context.coordinates ? category : `${category} near ${context.currentPlace}`;
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
          ? isZh ? "找一处无需预约的室内空间" : "Find an indoor place with no booking"
          : isZh ? "先找一个轻量落脚点" : "Find a light, low-risk place to pause";
    const stepDetail = strategy === "rest"
      ? isZh ? "30–45 分钟" : "30–45 minutes"
      : strategy === "explore"
        ? isZh ? "小范围 · 随时可结束" : "Small area · leave anytime"
        : isZh ? "无需预约 · 随时可离开" : "No booking · leave anytime";
    steps.push({ label: isZh ? "现在" : "Now", title: stepTitle, detail: stepDetail, map: { label: isZh ? "在地图里找附近的地方" : "Find a nearby place in Maps", query: localSearch, mode: "search" } });
    if (anchor) {
      steps.push({ label: isZh ? "接着" : "Then", title: isZh ? `前往 ${anchorDestination}` : `Head to ${anchorDestination}`, detail: isZh ? "具体路线和到达时间交给地图" : "Let Maps handle the route and arrival time", map: { label: isZh ? `导航到 ${anchorDestination}` : `Navigate to ${anchorDestination}`, query: navigationTarget, mode: "navigate" } });
      steps.push({ label: isZh ? "固定安排" : "Fixed plan", title: `${anchor.time} ${anchor.place}`, detail: isZh ? "已保留 · 无需操作" : "Kept · no action needed", anchor: true });
    } else {
      steps.push({ label: isZh ? "90–120 分钟后" : "In 90–120 min", title: isZh ? "再回来决定下一步" : "Come back and decide again", detail: isZh ? "这一轮只处理眼前，不规划整天" : "This decision only covers what is immediately ahead" });
    }
  }

  for (const step of steps) {
    if (step.map?.mode === "search") {
      step.map.query = actionSearch;
      step.map.center = context.coordinates;
    }
  }
  // An event name alone is not a navigable address. Preserve it without inventing a venue.
  if (anchor && !anchor.destination && /^(晚餐|火车|演出 \/ 预约|Dinner|Train|Show \/ booking)$/.test(anchor.place)) {
    steps[1] = { label:isZh ? "接着" : "Then", title:isZh ? "核对预约里的地址，留出出发时间" : "Check the booking address and leave time to get there", detail:isZh ? "地点尚未提供，先不猜导航终点" : "No venue was supplied, so no destination is assumed" };
  }
  if (isSleep && !/酒店|hotel/i.test(context.currentPlace)) steps[1].title = isZh ? "醒来后从附近开始" : "Restart nearby when you wake up";
  const stateEvidence = isSleep ? (isZh ? "想休息" : "Want to rest") : stateLabel(state, locale);
  const evidence = [stateEvidence, anchor ? `${anchor.time} ${anchor.place}` : null, context.currentPlace].filter((item): item is string => Boolean(item)).slice(0, 3);
  const why = isSleep
    ? isZh ? `你现在想休息，也没有固定安排，所以先睡一会儿；醒来后只从${currentArea}开始。` : `You want to rest and have no fixed plan, so sleep first and restart ${currentArea}.`
    : anchor
      ? strategy === "rest"
        ? isLessWalking
          ? isZh ? `你不想走太远，${anchor.time} 还有「${anchor.place}」，所以这次不跨区补景点。先在${currentArea}休息，再直接前往下一站。` : `You want less walking and have “${anchor.place}” at ${anchor.time}, so do not cross town for another sight. Rest ${currentArea}, then head directly to the fixed plan.`
          : isZh ? `你现在有点累，${anchor.time} 还有「${anchor.place}」，所以今天不再补大型景点。先在${currentArea}休息，再按原计划前往下一站。` : `You feel tired and have “${anchor.place}” at ${anchor.time}, so skip another major sight, rest ${currentArea}, and keep the fixed plan.`
        : strategy === "explore"
          ? isZh ? `你还想继续逛，${anchor.time} 还有「${anchor.place}」，所以放弃补大型景点，只在${currentArea}保留一次随时能结束的轻探索。` : `You still want to explore and have “${anchor.place}” at ${anchor.time}, so skip a major replacement and keep one light, easy-to-end activity ${currentArea}.`
          : strategy === "flexible"
            ? isZh ? `你想换个感觉，${anchor.time} 还有「${anchor.place}」，所以不再继续景点式行程，改成${currentArea}一次无需预约的室内停留。` : `You want a different feel and have “${anchor.place}” at ${anchor.time}, so switch from sightseeing to an unbooked indoor pause ${currentArea}.`
            : isZh ? `${anchor.time} 还有「${anchor.place}」，所以不跨区补一个替代景点，只在${currentArea}留一个低承诺空档。` : `You have “${anchor.place}” at ${anchor.time}, so do not cross town for a replacement sight; keep one low-commitment pause ${currentArea}.`
      : strategy === "rest"
        ? isZh ? `你现在${state === "tired" ? "有点累" : "不想走太远"}，也没有固定安排，所以不追加新行程，先在${currentArea}休息，只处理接下来约 90–120 分钟。` : `You want an easier pace and have no fixed plan, so add nothing new, rest ${currentArea}, and cover only the next 90–120 minutes.`
        : strategy === "explore"
          ? isZh ? `你还想继续逛，也没有固定安排，所以先在${currentArea}选一个轻量体验，90–120 分钟后再决定。` : `You still want to explore and have no fixed plan, so choose one light activity ${currentArea} and decide again later.`
          : strategy === "flexible"
            ? isZh ? `你想随性一点，也没有固定安排，所以先在${currentArea}做一个随时能停的选择。` : `You want to keep things spontaneous and have no fixed plan, so choose something easy to leave ${currentArea}.`
            : isZh ? `目前没有固定安排，也没有更多状态信息，所以先在${currentArea}做一个低承诺选择。` : `There is no fixed plan or added state, so start with one low-commitment choice ${currentArea}.`;

  const honestWhy = !anchor && !context.noAnchorKnown
    ? why.replaceAll("也没有固定安排", "暂未提供固定安排").replace("目前没有固定安排", "暂未提供固定安排").replaceAll("have no fixed plan", "have not supplied a fixed plan").replace("There is no fixed plan", "No fixed plan was supplied")
    : why;
  return { strategy, title, summary, horizon: anchor ? (isZh ? `到 ${anchor.time} 之前` : `Until ${anchor.time}`) : (isZh ? "接下来约 90–120 分钟" : "The next 90–120 minutes"), steps, why:honestWhy, evidence };
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
