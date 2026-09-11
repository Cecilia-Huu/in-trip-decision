import type { Locale } from "./mock-data";
import type { CurrentState } from "./decision-engine";

export type ParsedContext = {
  currentPlace?: string;
  nextAnchor?: { time: string; place: string; destination?: string };
  currentState?: CurrentState;
  noAnchor: boolean;
  timeConstraint?: string;
};

// A deliberately bounded parser, not a claim of general language understanding.
export function extractContextFromText(text: string, locale: Locale): ParsedContext {
  const zh = locale === "zh";
  const clauses = text.trim().split(/[，。！？,!?;；\n]/).map(s => s.trim()).filter(Boolean);
  const noAnchor = /没有(?:固定|后面|接下来|其他|后续|必须赶到)?(?:的)?安排|没有预约|无固定安排|no (?:fixed )?plans?|nothing (?:planned|booked)/i.test(text);
  let currentState: CurrentState | undefined;
  if (/(好累|有点累|累了|疲惫|腿.*走断|困了|睡懒觉|想睡|补觉|tired|exhausted|worn out|sleep in|nap)/i.test(text)) currentState = "tired";
  else if (/(不想.*(?:走|坐车)|少走|走不动|不想赶|less walking|not walk far|no more rushing)/i.test(text)) currentState = "lessWalking";
  else if (/(还想.*逛|继续逛|继续探索|回酒店.*(?:亏|可惜)|still want to explore|keep exploring)/i.test(text)) currentState = "explore";
  else if (/(随性|随便走走|spontaneous|play it by ear)/i.test(text)) currentState = "spontaneous";

  const numerals: Record<string, number> = { 一:1, 二:2, 两:2, 三:3, 四:4, 五:5, 六:6, 七:7, 八:8, 九:9, 十:10, 十一:11, 十二:12 };
  const timeOf = (clause: string) => {
    const digital = clause.match(/\b([01]?\d|2[0-3])[:：]([0-5]\d)\b/);
    if (digital) return `${digital[1].padStart(2,"0")}:${digital[2]}`;
    const hour = clause.match(/(早上|上午|下午|晚上|晚间|中午)?\s*(十二|十一|十|[一二两三四五六七八九]|1[0-2]|[1-9])\s*(?:点|\s*(am|pm)\b)/i);
    if (!hour) return undefined;
    // “六点” doesn't establish AM/PM. Keep the user's wording instead of inventing 06:00.
    if (!hour[1] && !hour[3] && !/晚餐|晚饭/.test(clause)) return hour[0].trim();
    let value = numerals[hour[2]] ?? Number(hour[2]);
    if ((/下午|晚上|晚间|pm/i.test(hour[0]) || /晚餐|晚饭/.test(clause)) && value < 12) value += 12;
    if (/am/i.test(hour[0]) && value === 12) value = 0;
    return `${String(value).padStart(2,"0")}:${/点半/.test(clause) ? "30" : "00"}`;
  };
  const anchorClause = clauses.find(c => timeOf(c) && /晚餐|吃饭|晚饭|用餐|演出|火车|车次|预约|dinner|show|train|reservation/i.test(c));
  let nextAnchor: ParsedContext["nextAnchor"];
  if (anchorClause && !noAnchor) {
    const time = timeOf(anchorClause)!;
    const dinner = /晚餐|吃饭|晚饭|用餐|dinner/i.test(anchorClause);
    const event = dinner ? (zh ? "晚餐" : "Dinner") : /火车|车次|train/i.test(anchorClause) ? (zh ? "火车" : "Train") : (zh ? "演出 / 预约" : "Show / booking");
    const destination = /navigli/i.test(anchorClause) ? "Navigli" : anchorClause.match(/在\s*(.+?)\s*(?:有|吃|看|赶|坐|用餐)/)?.[1]?.trim() ?? anchorClause.match(/(?:dinner|show|train)\s+(?:at|in|from)\s+(.+)$/i)?.[1]?.trim();
    nextAnchor = { time, place: destination ? `${destination} · ${event}` : event, destination };
  }
  // Only location-bearing clauses are considered. A future dinner venue isn't the current place.
  const placeClause = clauses.find(c => c !== anchorClause && /(?:我(?:现在|就)?(?:正)?在|当前位置|I'm (?:at|near|in)|I am (?:at|near|in)|^在|^near |^at )/i.test(c));
  let currentPlace = placeClause?.match(/(?:我(?:现在|就)?(?:正)?在|当前位置[：:]?|I'm (?:at|near|in)|I am (?:at|near|in)|^在|^near |^at )\s*(.+)/i)?.[1]?.replace(/(?:\s*(?:有点累|好累|累了|而且|但是|并且| and (?:feel|I'm|I am))).*$/i, "").trim();
  if (!currentPlace) {
    const place = clauses.filter(c => c !== anchorClause).join(" ").match(/米兰大教堂(?:附近(?:的酒店)?)?|塞维利亚大教堂(?:附近)?|圣家堂(?:附近)?|milan cathedral|duomo di milano|seville cathedral|sagrada fam[ií]lia/i);
    currentPlace = place?.[0];
  }
  const nowClause = clauses.find(c => /(?:现在|now)/i.test(c) && timeOf(c));
  return { currentPlace, currentState, nextAnchor, noAnchor, timeConstraint: nowClause ? timeOf(nowClause) : undefined };
}

export function needsAnchorQuestion(parsed: ParsedContext) {
  // A 30–45 minute rest or an extra activity can conflict with a booking.
  // Otherwise a conservative fallback is enough; don't turn this into a questionnaire.
  return !parsed.nextAnchor && !parsed.noAnchor && Boolean(parsed.currentState);
}
