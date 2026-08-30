export type Locale = "zh" | "en";
export type Constraint = "less" | "explore" | "decide";
export type PlanVariant = "default" | "less" | "active";
export type LandmarkId = "milanCathedral" | "sevilleCathedral" | "sagradaFamilia";
export type LandmarkNarrative = "short" | "story" | "detail";

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

export type LandmarkContent = {
  name: string;
  location: string;
  narratives: Record<LandmarkNarrative, string>;
  lookUp: string;
};

export type Landmark = {
  id: LandmarkId;
  aliases: string[];
  content: Record<Locale, LandmarkContent>;
};

export const landmarks: Record<LandmarkId, Landmark> = {
  milanCathedral: {
    id: "milanCathedral",
    aliases: ["米兰大教堂", "milan cathedral", "duomo di milano", "milan duomo", "duomo milano"],
    content: {
      zh: {
        name: "米兰大教堂",
        location: "Milano · Duomo di Milano",
        narratives: {
          short: "它花了将近六个世纪才完成。这也是为什么你会在同一座建筑上看到不同时期留下来的风格和细节。",
          story: "修建期间，米兰换过许多统治者和建筑师。近六百年的接力，让它不像一张一次画完的图纸，更像一座不断生长的城市记忆。",
          detail: "工程始于 1386 年，直到 20 世纪仍在完成最后细节。漫长工期让哥特式结构、不同年代的雕刻与修复痕迹同时留在建筑上。",
        },
        lookUp: "看看屋顶上密密麻麻的尖塔。最高处那尊金色雕像是 Madonnina，也是米兰最重要的城市象征之一。",
      },
      en: {
        name: "Milan Cathedral",
        location: "Milano · Duomo di Milano",
        narratives: {
          short: "It took nearly six centuries to finish. That is why details from very different periods can sit together on the same building.",
          story: "Milan changed rulers and architects while the cathedral kept growing. Nearly six centuries of hand-offs turned it into a layered record of the city, not a building made from one finished plan.",
          detail: "Work began in 1386, with final details still being completed in the 20th century. Its long construction brought Gothic structure, later sculpture, and visible restoration into the same façade.",
        },
        lookUp: "Look for the forest of spires on the roof. The golden figure at the highest point is the Madonnina, one of Milan’s most important city symbols.",
      },
    },
  },
  sevilleCathedral: {
    id: "sevilleCathedral",
    aliases: ["塞维利亚大教堂", "seville cathedral", "catedral de sevilla", "sevilla cathedral", "giralda"],
    content: {
      zh: {
        name: "塞维利亚大教堂",
        location: "",
        narratives: {
          short: "它建在原清真寺所在地。今天留下来的吉拉达塔，是这座城市不同历史时期叠在一起最直观的痕迹之一。",
          story: "大教堂的建造者曾说，要造一座让后人觉得他们“近乎疯狂”的教堂。于是，原清真寺的庭院与高塔被留进了新的城市地标里。",
          detail: "这座教堂从 15 世纪开始修建，主体采用哥特式结构。橘园庭院和吉拉达塔没有被抹去，至今仍把两段历史并置在同一个空间里。",
        },
        lookUp: "看看吉拉达塔。它最初并不是钟塔，而是一座宣礼塔。",
      },
      en: {
        name: "Seville Cathedral",
        location: "",
        narratives: {
          short: "It stands on the site of a former mosque. The surviving Giralda tower is one of the clearest places to see different chapters of Seville’s history overlap.",
          story: "The cathedral’s builders reportedly wanted something so ambitious that later generations would think them mad. A mosque’s courtyard and tower were kept inside that new landmark.",
          detail: "Construction began in the 15th century, with a vast Gothic structure rising over the former mosque. The orange-tree courtyard and Giralda tower remain, placing both histories in the same space.",
        },
        lookUp: "Find the Giralda. It was not built as a bell tower—it began as a minaret.",
      },
    },
  },
  sagradaFamilia: {
    id: "sagradaFamilia",
    aliases: ["圣家堂", "sagrada família", "sagrada familia", "basilica de la sagrada familia", "la sagrada familia"],
    content: {
      zh: {
        name: "圣家堂",
        location: "Barcelona · Sagrada Família",
        narratives: {
          short: "高迪没有把它设计成一座普通的石头教堂。他大量借用了树木、枝干和自然结构，所以进入内部时，会有一种站在森林里的感觉。",
          story: "高迪相信自然界没有直线。圣家堂里的柱子会分叉，光线也会像穿过树冠一样落下，让石头建筑有了森林般的生命感。",
          detail: "高迪用双曲面、螺旋和分叉柱，把自然结构变成承重方式。内部柱子不仅像树，也真的把顶部重量沿不同方向传递下去。",
        },
        lookUp: "看看内部那些分叉的柱子。它们不是单纯装饰，而是在模拟树干向上生长、分枝的结构。",
      },
      en: {
        name: "Sagrada Família",
        location: "Barcelona · Sagrada Família",
        narratives: {
          short: "Gaudí did not design it as an ordinary stone church. He borrowed from trees, branches, and natural structures, so the interior can feel like standing in a forest.",
          story: "Gaudí believed nature had no straight lines. Columns branch overhead and light falls through them like a canopy, giving a stone building the feeling of a living forest.",
          detail: "Gaudí used hyperboloids, spirals, and branching columns to turn natural forms into structure. The columns do not only resemble trees—they distribute the roof’s weight in branching paths.",
        },
        lookUp: "Look at the columns branching overhead. They are not just decoration; they imitate the way a tree trunk grows and divides into limbs.",
      },
    },
  },
};

function normalizeLandmarkQuery(value: string) {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase()
    .replace(/[·'’.,，。()（）-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

const landmarkAliasIndex = new Map<string, LandmarkId>();
Object.values(landmarks).forEach((landmark) => {
  landmark.aliases.forEach((alias) => landmarkAliasIndex.set(normalizeLandmarkQuery(alias), landmark.id));
});

export function findLandmark(query: string): Landmark | null {
  const normalized = normalizeLandmarkQuery(query);
  if (!normalized) return null;
  const exactMatch = landmarkAliasIndex.get(normalized);
  if (exactMatch) return landmarks[exactMatch];

  for (const [alias, landmarkId] of landmarkAliasIndex) {
    if (alias.length >= 5 && normalized.includes(alias)) return landmarks[landmarkId];
  }
  return null;
}

const lowEnergyPattern = /(feet|foot|tired|exhausted|hurt|sore|less walk|脚|腿|累|走不动|少走)/i;
const activePattern = /(active|energy|explore|museum|keep going|继续|逛|有精神|博物馆)/i;

export function selectInitialPlan(constraint: Constraint | null, note: string): PlanVariant {
  if (constraint === "less" || lowEnergyPattern.test(note)) return "less";
  if (constraint === "explore" || activePattern.test(note)) return "active";
  return "default";
}
