import type { Daypart, DecisionModelContext, Energy, ContinueIntent } from "./decision-model.ts";

export type StrategyId = "REST_NEARBY" | "LIGHT_EXPLORE" | "MOVE_TO_ANCHOR" | "INDOOR_LOW_COMMITMENT" | "FOOD_DRINK_BREAK" | "END_DAY" | "SHORT_WAIT";
export type ScoreDimension = "TemporalFit" | "EnergyFit" | "AnchorFit" | "IntentFit" | "EffortFit" | "Reversibility";
export type ScoreBreakdown = Record<ScoreDimension, number>;
export type ScoredStrategy = { strategy: StrategyId; score: number; breakdown: ScoreBreakdown };

export const STRATEGY_POOL: StrategyId[] = [
  "REST_NEARBY",
  "LIGHT_EXPLORE",
  "MOVE_TO_ANCHOR",
  "INDOOR_LOW_COMMITMENT",
  "FOOD_DRINK_BREAK",
  "END_DAY",
  "SHORT_WAIT",
];

const temporalFit: Record<Daypart, Record<StrategyId, number>> = {
  MORNING: { REST_NEARBY: 1, LIGHT_EXPLORE: 2, MOVE_TO_ANCHOR: 1, INDOOR_LOW_COMMITMENT: 1, FOOD_DRINK_BREAK: 2, END_DAY: 0, SHORT_WAIT: 1 },
  DAY: { REST_NEARBY: 2, LIGHT_EXPLORE: 2, MOVE_TO_ANCHOR: 1, INDOOR_LOW_COMMITMENT: 2, FOOD_DRINK_BREAK: 2, END_DAY: 0, SHORT_WAIT: 1 },
  EVENING: { REST_NEARBY: 2, LIGHT_EXPLORE: 2, MOVE_TO_ANCHOR: 1, INDOOR_LOW_COMMITMENT: 2, FOOD_DRINK_BREAK: 2, END_DAY: 1, SHORT_WAIT: 1 },
  NIGHT: { REST_NEARBY: 1, LIGHT_EXPLORE: 1, MOVE_TO_ANCHOR: 1, INDOOR_LOW_COMMITMENT: 2, FOOD_DRINK_BREAK: 2, END_DAY: 2, SHORT_WAIT: 2 },
  LATE_NIGHT: { REST_NEARBY: 1, LIGHT_EXPLORE: 0, MOVE_TO_ANCHOR: 1, INDOOR_LOW_COMMITMENT: 1, FOOD_DRINK_BREAK: 1, END_DAY: 2, SHORT_WAIT: 1 },
};

const energyFit: Record<Energy, Record<StrategyId, number>> = {
  LOW: { REST_NEARBY: 2, LIGHT_EXPLORE: 1, MOVE_TO_ANCHOR: 1.5, INDOOR_LOW_COMMITMENT: 2, FOOD_DRINK_BREAK: 2, END_DAY: 2, SHORT_WAIT: 2 },
  MEDIUM: { REST_NEARBY: 1, LIGHT_EXPLORE: 2, MOVE_TO_ANCHOR: 2, INDOOR_LOW_COMMITMENT: 2, FOOD_DRINK_BREAK: 1, END_DAY: 1, SHORT_WAIT: 1 },
  HIGH: { REST_NEARBY: 0.5, LIGHT_EXPLORE: 2, MOVE_TO_ANCHOR: 2, INDOOR_LOW_COMMITMENT: 1, FOOD_DRINK_BREAK: 1, END_DAY: 0, SHORT_WAIT: 0.5 },
  UNKNOWN: { REST_NEARBY: 1.5, LIGHT_EXPLORE: 1.5, MOVE_TO_ANCHOR: 2, INDOOR_LOW_COMMITMENT: 1.5, FOOD_DRINK_BREAK: 1.5, END_DAY: 1, SHORT_WAIT: 2 },
};

const intentFit: Record<ContinueIntent, Record<StrategyId, number>> = {
  REST: { REST_NEARBY: 2, LIGHT_EXPLORE: 0, MOVE_TO_ANCHOR: 1, INDOOR_LOW_COMMITMENT: 1, FOOD_DRINK_BREAK: 2, END_DAY: 2, SHORT_WAIT: 1 },
  EXPLORE: { REST_NEARBY: 0.5, LIGHT_EXPLORE: 2, MOVE_TO_ANCHOR: 1, INDOOR_LOW_COMMITMENT: 1.5, FOOD_DRINK_BREAK: 1, END_DAY: 0, SHORT_WAIT: 0.5 },
  NEUTRAL: { REST_NEARBY: 1.5, LIGHT_EXPLORE: 1.5, MOVE_TO_ANCHOR: 1.5, INDOOR_LOW_COMMITMENT: 1.5, FOOD_DRINK_BREAK: 1.5, END_DAY: 1.5, SHORT_WAIT: 2 },
  UNKNOWN: { REST_NEARBY: 1.5, LIGHT_EXPLORE: 1.5, MOVE_TO_ANCHOR: 1.5, INDOOR_LOW_COMMITMENT: 1.5, FOOD_DRINK_BREAK: 1.5, END_DAY: 1.5, SHORT_WAIT: 2 },
};

function anchorFit(strategy: StrategyId, context: DecisionModelContext) {
  const gap = context.minutesToAnchor;
  if (gap === null) return strategy === "MOVE_TO_ANCHOR" ? 0 : 1;
  if (gap <= 0) return strategy === "MOVE_TO_ANCHOR" || strategy === "SHORT_WAIT" ? 2 : 0;
  if (gap <= 30) return strategy === "MOVE_TO_ANCHOR" || strategy === "SHORT_WAIT" ? 2 : 0;
  if (gap <= 60) return ["REST_NEARBY", "FOOD_DRINK_BREAK", "MOVE_TO_ANCHOR", "SHORT_WAIT"].includes(strategy) ? 2 : strategy === "INDOOR_LOW_COMMITMENT" ? 1 : 0;
  return strategy === "MOVE_TO_ANCHOR" ? 1 : strategy === "END_DAY" ? 0 : 2;
}

function effortFit(strategy: StrategyId, context: DecisionModelContext) {
  if (context.movementTolerance === "LOW") return strategy === "MOVE_TO_ANCHOR" ? 1 : strategy === "LIGHT_EXPLORE" ? 2 : 2;
  return ({ REST_NEARBY: 1.5, LIGHT_EXPLORE: 2, MOVE_TO_ANCHOR: 2, INDOOR_LOW_COMMITMENT: 1.5, FOOD_DRINK_BREAK: 1.5, END_DAY: 1, SHORT_WAIT: 2 } satisfies Record<StrategyId, number>)[strategy];
}

export function applyVetoRules(context: DecisionModelContext) {
  const vetoed = new Map<StrategyId, string>();
  const gap = context.minutesToAnchor;
  const explicitExplore = context.continueIntent === "EXPLORE" || Boolean(context.explicitPreference && /逛|玩|公园|夜生活|夜景|explore|keep going|park|nightlife/i.test(context.explicitPreference));
  const anchorDestination = context.fixedAnchor.destination ?? context.fixedAnchor.place ?? "";
  const hasAnchorDestination = Boolean(anchorDestination) && !/^(晚餐|晚饭|火车|车次|演出|预约|dinner|train|show|reservation)$/i.test(anchorDestination.trim());
  for (const strategy of STRATEGY_POOL) {
    if (!context.fixedAnchor.exists && strategy === "MOVE_TO_ANCHOR") vetoed.set(strategy, "no fixed anchor");
    if (context.fixedAnchor.exists && strategy === "MOVE_TO_ANCHOR" && !hasAnchorDestination) vetoed.set(strategy, "anchor destination unknown");
    if ((!context.fixedAnchor.exists || (gap !== null && gap > 60)) && strategy === "SHORT_WAIT") vetoed.set(strategy, "no imminent anchor to wait for");
    if (context.fixedAnchor.exists && gap !== null && gap <= 0 && strategy !== "SHORT_WAIT") vetoed.set(strategy, "anchor time has passed");
    else if (context.fixedAnchor.exists && gap !== null && gap <= 30 && strategy !== "MOVE_TO_ANCHOR" && strategy !== "SHORT_WAIT") vetoed.set(strategy, "anchor within 30 minutes");
    else if (context.fixedAnchor.exists && gap !== null && gap <= 60 && ["LIGHT_EXPLORE", "END_DAY"].includes(strategy)) vetoed.set(strategy, "anchor within 60 minutes");
    if (context.daypart === "LATE_NIGHT" && strategy === "LIGHT_EXPLORE" && !explicitExplore) vetoed.set(strategy, "late night without explicit explore intent");
    if (context.environmentConstraint === "RAIN" && strategy === "LIGHT_EXPLORE" && !context.explicitPreference) vetoed.set(strategy, "explicit rain constraint");
    if (context.needs.primary === "END_DAY" && strategy !== "END_DAY") vetoed.set(strategy, "explicit end-day intent");
  }
  return { candidates: STRATEGY_POOL.filter(strategy => !vetoed.has(strategy)), vetoed };
}

export function scoreStrategy(strategy: StrategyId, context: DecisionModelContext): ScoredStrategy {
  const anchorWeight = context.minutesToAnchor !== null && context.minutesToAnchor <= 60 ? 2 : 1;
  const explicitIntent = context.continueIntent !== "UNKNOWN" || Boolean(context.explicitPreference);
  const intentWeight = explicitIntent ? 2 : 1;
  const energyWeight = context.energy === "LOW" ? 1.5 : 1;
  const effortWeight = context.movementTolerance === "LOW" ? 1.5 : 1;
  const breakdown: ScoreBreakdown = {
    TemporalFit: temporalFit[context.daypart][strategy],
    EnergyFit: energyFit[context.energy][strategy] * energyWeight,
    AnchorFit: anchorFit(strategy, context) * anchorWeight,
    IntentFit: intentFit[context.continueIntent][strategy] * intentWeight,
    EffortFit: effortFit(strategy, context) * effortWeight,
    Reversibility: 2,
  };
  let score = Object.values(breakdown).reduce((total, value) => total + value, 0);
  if (context.needs.primary === "RECOVER" && ["REST_NEARBY", "FOOD_DRINK_BREAK", "INDOOR_LOW_COMMITMENT"].includes(strategy)) score += 0.5;
  if (context.needs.primary === "EXPLORE" && strategy === "LIGHT_EXPLORE") score += 0.75;
  if (context.continueIntent === "EXPLORE" && strategy === "LIGHT_EXPLORE") score += 1;
  if (context.needs.primary === "FILL_GAP" && context.energy === "HIGH" && strategy === "LIGHT_EXPLORE") score += 0.75;
  if (context.needs.primary === "FILL_GAP" && context.daypart === "MORNING" && context.energy === "UNKNOWN" && strategy === "FOOD_DRINK_BREAK") score += 0.75;
  if (context.needs.primary === "SHELTER" && strategy === "INDOOR_LOW_COMMITMENT") score += 1;
  if ((context.steering?.intent === "spontaneous" || /换个感觉|换一种|change the feel|spontaneous/i.test(context.explicitPreference ?? "")) && strategy === "INDOOR_LOW_COMMITMENT") score += 1.5;
  if (context.daypart === "LATE_NIGHT" && strategy === "END_DAY") score += 1.5;
  if (context.daypart === "NIGHT" && context.energy === "LOW" && context.continueIntent !== "EXPLORE" && strategy === "FOOD_DRINK_BREAK") score += 0.75;
  if (context.fixedAnchor.exists && context.minutesToAnchor !== null && context.minutesToAnchor <= 30 && strategy === "MOVE_TO_ANCHOR") score += context.fixedAnchor.destination ? 1 : 0;
  return { strategy, score, breakdown };
}

export function selectPrimaryStrategy(context: DecisionModelContext) {
  const { candidates, vetoed } = applyVetoRules(context);
  const scored = candidates.map(strategy => scoreStrategy(strategy, context)).sort((a, b) => b.score - a.score || STRATEGY_POOL.indexOf(a.strategy) - STRATEGY_POOL.indexOf(b.strategy));
  return { selected: scored[0], scored, vetoed: Object.fromEntries(vetoed) as Partial<Record<StrategyId, string>> };
}

export function decisionHorizon(context: DecisionModelContext) {
  const gap = context.minutesToAnchor;
  if (gap !== null && gap > 0 && gap <= 60) return gap;
  if (context.daypart === "MORNING" || context.daypart === "DAY") return 100;
  if (context.daypart === "EVENING") return 75;
  if (context.daypart === "NIGHT") return 45;
  return 30;
}
