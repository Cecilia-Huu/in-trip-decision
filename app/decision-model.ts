import type { Coordinates, CurrentState, DecisionContext, Steering } from "./decision-engine.ts";

export type Daypart = "MORNING" | "DAY" | "EVENING" | "NIGHT" | "LATE_NIGHT";
export type ChangeType = "PLAN_FAILED" | "EXTRA_TIME" | "CHANGE_OF_MIND" | "ENVIRONMENT_CHANGE" | "UNKNOWN";
export type Energy = "LOW" | "MEDIUM" | "HIGH" | "UNKNOWN";
export type ContinueIntent = "REST" | "EXPLORE" | "NEUTRAL" | "UNKNOWN";
export type MovementTolerance = "LOW" | "NORMAL" | "UNKNOWN";
export type EnvironmentConstraint = "RAIN" | "HEAT" | "COLD" | "NONE" | "UNKNOWN";
export type DecisionNeed = "RECOVER" | "EXPLORE" | "FILL_GAP" | "TRANSITION" | "SHELTER" | "END_DAY";
export type LocationSource = "geolocation" | "manual" | "text" | "unknown";

export type DecisionModelContext = {
  currentTime: Date;
  currentLocalTime: string;
  hour: number;
  minuteOfDay: number;
  daypart: Daypart;
  location: {
    source: LocationSource;
    lat?: number;
    lng?: number;
    label?: string;
  };
  changeType: ChangeType;
  energy: Energy;
  continueIntent: ContinueIntent;
  movementTolerance: MovementTolerance;
  fixedAnchor: {
    exists: boolean;
    time?: string;
    label?: string;
    place?: string;
    destination?: string;
  };
  minutesToAnchor: number | null;
  environmentConstraint: EnvironmentConstraint;
  explicitPreference: string | null;
  needs: { primary: DecisionNeed; secondary?: DecisionNeed };
  original: DecisionContext;
  steering?: Steering;
};

export const DAYPART_BOUNDARIES = {
  morning: 6 * 60,
  day: 11 * 60,
  evening: 17 * 60,
  night: 21 * 60 + 30,
  midnightNightEnd: 30,
} as const;

const patterns = {
  planFailed: /(关(?:了|门|闭)|没开|去不了|取消|售罄|错过|closed|cancelled|canceled|sold out|fell through)/i,
  extraTime: /(多出时间|空出时间|提前结束|还有(?:几个小时|些时间)|unexpected free time|time opened up|finished early|free time)/i,
  changeMind: /(不想继续|不想照原计划|换个计划|改变主意|different plan|changed my mind|do not want the original plan)/i,
  lowEnergy: /(好累|很累|有点累|累了|疲惫|走不动|走麻了|腿.*走断|不想动|困了|想睡|睡一觉|补觉|tired|exhausted|worn out|cannot walk|can't walk|sleepy|nap)/i,
  mediumEnergy: /(状态还行|体力还行|还可以|精力一般|feel okay|energy is okay|not too tired)/i,
  highEnergy: /(精力很好|很有精神|状态很好|体力很好|一点也不累|full of energy|high energy|energetic|feel great)/i,
  explore: /(还想.*(?:逛|玩|看|继续)|继续.*(?:逛|玩|探索)|不想回(?:去|酒店)|没玩够|想看看|想继续|想.*(?:去)?公园|夜生活|夜景|still want to explore|keep exploring|keep going|want to keep playing|want.*park|nightlife|night view)/i,
  rest: /(只想.*(?:休息|坐|歇|睡)|想休息|想坐|想歇|想睡|回酒店|回住处|今天就这样|不想继续|rest|sit down|take a break|sleep|go back to (?:the )?(?:hotel|stay)|call it a day)/i,
  lessMovement: /(少走|不想走|不要走|别走|不走远|走不动|不想.*坐车|不要跨区|附近就好|less walk|not.*walk far|stay close|nearby only|no cross-town)/i,
  normalMovement: /(可以多走|走远一点也行|不介意走路|正常走|can walk more|do not mind walking|normal walking)/i,
  rain: /(?:^|[^没不])下雨|雨太大|raining|rainy/i,
  heat: /(太热|很晒|晒得|酷热|too hot|heat|scorching)/i,
  cold: /(太冷|冻得|寒冷|too cold|freezing)/i,
  indoors: /(想找室内|去室内|待在室内|indoor|indoors|inside)/i,
  endDay: /(太晚了|想回酒店|想回住处|想睡了|只想睡|今天就这样|不想继续|call it a day|go back to (?:the )?(?:hotel|stay)|want to sleep|too late)/i,
  explicitPreference: /(我就是想|我只想|一定要|明确想|就想去|I just want|I really want|must go|specifically want)/i,
} as const;

const timeToMinutes = (value?: string) => value && /^([01]\d|2[0-3]):[0-5]\d$/.test(value) ? Number(value.slice(0, 2)) * 60 + Number(value.slice(3)) : null;

export function getDaypart(minuteOfDay: number): Daypart {
  if (minuteOfDay >= DAYPART_BOUNDARIES.morning && minuteOfDay < DAYPART_BOUNDARIES.day) return "MORNING";
  if (minuteOfDay >= DAYPART_BOUNDARIES.day && minuteOfDay < DAYPART_BOUNDARIES.evening) return "DAY";
  if (minuteOfDay >= DAYPART_BOUNDARIES.evening && minuteOfDay < DAYPART_BOUNDARIES.night) return "EVENING";
  if (minuteOfDay >= DAYPART_BOUNDARIES.night || minuteOfDay < DAYPART_BOUNDARIES.midnightNightEnd) return "NIGHT";
  return "LATE_NIGHT";
}

function inferLocationSource(context: DecisionContext): LocationSource {
  if (context.coordinates) return "geolocation";
  if (!context.currentPlace) return "unknown";
  return context.change.toLocaleLowerCase().includes(context.currentPlace.toLocaleLowerCase()) ? "text" : "manual";
}

function inferEnergy(text: string, states: CurrentState[]): Energy {
  if (patterns.highEnergy.test(text)) return "HIGH";
  if (patterns.lowEnergy.test(text) || states.includes("tired")) return "LOW";
  if (patterns.mediumEnergy.test(text)) return "MEDIUM";
  return "UNKNOWN";
}

function inferIntent(text: string, states: CurrentState[], steering?: Steering): ContinueIntent {
  if (steering?.intent === "endDay") return "REST";
  if (steering?.intent === "explore") return "EXPLORE";
  if (steering?.intent === "lessWalking" && patterns.rest.test(steering.text)) return "REST";
  if (steering?.intent === "spontaneous") return "NEUTRAL";
  if (patterns.explore.test(text) || states.includes("explore")) return "EXPLORE";
  if (patterns.rest.test(text) || states.includes("endDay")) return "REST";
  if (patterns.extraTime.test(text) || states.includes("spontaneous")) return "NEUTRAL";
  return "UNKNOWN";
}

function detectNeeds(changeType: ChangeType, energy: Energy, intent: ContinueIntent, environment: EnvironmentConstraint, shelterRequested: boolean, anchor: boolean, endDay: boolean) {
  if (endDay) return { primary: "END_DAY" as const };
  if (anchor && intent !== "REST") return { primary: "TRANSITION" as const, secondary: intent === "EXPLORE" ? "EXPLORE" as const : undefined };
  if (shelterRequested || (environment !== "NONE" && environment !== "UNKNOWN")) return { primary: "SHELTER" as const, secondary: intent === "EXPLORE" ? "EXPLORE" as const : undefined };
  if (energy === "LOW") return { primary: "RECOVER" as const, secondary: intent === "EXPLORE" ? "EXPLORE" as const : undefined };
  if (intent === "EXPLORE") return { primary: "EXPLORE" as const };
  if (changeType === "EXTRA_TIME") return { primary: "FILL_GAP" as const };
  return { primary: "FILL_GAP" as const };
}

export function buildDecisionContext(context: DecisionContext, steering?: CurrentState | Steering): DecisionModelContext {
  const normalizedSteering = typeof steering === "string"
    ? { intent: steering, lessWalking: steering === "lessWalking", indoors: false, text: "" } satisfies Steering
    : steering;
  const combined = `${context.change} ${normalizedSteering?.text ?? ""}`.trim();
  const currentLocalTime = context.currentLocalTime ?? (() => {
    const parsed = new Date(context.currentTime);
    return [parsed.getHours(), parsed.getMinutes()].map(value => String(value).padStart(2, "0")).join(":");
  })();
  const minuteOfDay = timeToMinutes(currentLocalTime) ?? 0;
  const state = context.currentState;
  const energy = inferEnergy(combined, state);
  const continueIntent = inferIntent(combined, state, normalizedSteering);
  const movementTolerance = normalizedSteering?.lessWalking || context.lessWalking || state.includes("lessWalking") || patterns.lessMovement.test(combined) ? "LOW" : patterns.normalMovement.test(combined) ? "NORMAL" : "UNKNOWN";
  const shelterRequested = Boolean(context.indoors || normalizedSteering?.indoors || patterns.indoors.test(combined));
  const environmentConstraint: EnvironmentConstraint = patterns.rain.test(combined) && !/(没有下雨|没下雨|not raining)/i.test(combined)
    ? "RAIN"
    : patterns.heat.test(combined) ? "HEAT" : patterns.cold.test(combined) ? "COLD" : /(没有下雨|没下雨|不热|不冷|not raining|not hot|not cold)/i.test(combined) || patterns.indoors.test(combined) || context.indoors || normalizedSteering?.indoors ? "NONE" : "UNKNOWN";
  const namesPlaceCategory = /(公园|咖啡馆|面包店|书店|商场|夜生活|夜景|park|cafe|bakery|bookstore|mall|nightlife)/i.test(combined);
  const explicitPreference = normalizedSteering?.text || (patterns.explicitPreference.test(context.change) || shelterRequested || namesPlaceCategory ? context.change.trim() : null);
  const changeType: ChangeType = patterns.planFailed.test(context.change) ? "PLAN_FAILED" : patterns.extraTime.test(context.change) ? "EXTRA_TIME" : patterns.changeMind.test(context.change) ? "CHANGE_OF_MIND" : environmentConstraint !== "NONE" && environmentConstraint !== "UNKNOWN" ? "ENVIRONMENT_CHANGE" : "UNKNOWN";
  const anchorTime = context.nextAnchor?.time;
  const anchorMinute = timeToMinutes(anchorTime);
  const minutesToAnchor = anchorMinute === null ? null : anchorMinute - minuteOfDay;
  const sleepingAtStay = /(酒店|住处|hotel|stay)/i.test(context.currentPlace) && patterns.lowEnergy.test(combined) && /(睡|sleep|nap)/i.test(combined);
  const endDay = patterns.endDay.test(combined) || sleepingAtStay || state.includes("endDay");
  const coordinates: Coordinates | undefined = context.coordinates;
  return {
    currentTime: new Date(context.currentTime),
    currentLocalTime,
    hour: Math.floor(minuteOfDay / 60),
    minuteOfDay,
    daypart: getDaypart(minuteOfDay),
    location: { source: inferLocationSource(context), lat: coordinates?.latitude, lng: coordinates?.longitude, label: context.currentPlace || undefined },
    changeType,
    energy,
    continueIntent,
    movementTolerance,
    fixedAnchor: { exists: Boolean(context.nextAnchor), time: anchorTime, label: context.nextAnchor?.place, place: context.nextAnchor?.place, destination: context.nextAnchor?.destination },
    minutesToAnchor,
    environmentConstraint,
    explicitPreference,
    needs: detectNeeds(changeType, energy, continueIntent, environmentConstraint, shelterRequested, Boolean(context.nextAnchor), endDay),
    original: context,
    steering: normalizedSteering,
  };
}
