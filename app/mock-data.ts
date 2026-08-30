export type Locale = "zh" | "en";
export type Constraint = "tired" | "less" | "explore" | "decide";
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
  evidence: string[];
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
        evidence: ["少绕路", "无需预约", "保留晚餐"],
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
        evidence: ["少走一点", "顺路", "保留晚餐"],
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
        evidence: ["还能逛一点", "顺路", "保留晚餐"],
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
        evidence: ["Low detour", "No booking", "Keep dinner"],
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
        evidence: ["Less walking", "On the way", "Keep dinner"],
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
        evidence: ["Keep exploring", "On the way", "Keep dinner"],
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
  narratives: Record<LandmarkNarrative, {
    title: string;
    paragraphs: string[];
    sections?: { title: string; body: string }[];
  }>;
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
          short: { title: "30 秒认识米兰大教堂", paragraphs: ["它前后建了将近六个世纪。你现在看到的密集尖塔，是它最有辨识度的部分。", "抬头找最高处那尊金色 Madonnina，它几乎就是米兰城市精神的象征。"] },
          story: { title: "一个关于米兰天际线的故事", paragraphs: ["很长一段时间，米兰人都不希望有建筑真正“压过”大教堂顶端的 Madonnina。", "后来城市里出现更高的建筑时，人们甚至会在新高楼顶部放一尊 Madonnina 的复制品。"] },
          detail: { title: "再多看一点", paragraphs: [], sections: [
            { title: "它怎么建起来的", body: "工程始于 1386 年，直到 20 世纪仍在完成最后细节。近六百年的接力，让不同年代的手艺留在同一座建筑上。" },
            { title: "现在抬头看什么", body: "先看屋顶密集的尖塔，再找最高处金色的 Madonnina。雕像与石塔让整座建筑像一座向上生长的城市。" },
            { title: "为什么值得记住", body: "它不是一个时代完成的作品，而是米兰把数百年时间叠进城市中心的方式。" },
          ] },
        },
        lookUp: "看看屋顶上密密麻麻的尖塔。最高处那尊金色雕像是 Madonnina，也是米兰最重要的城市象征之一。",
      },
      en: {
        name: "Milan Cathedral",
        location: "Milano · Duomo di Milano",
        narratives: {
          short: { title: "Milan Cathedral in 30 seconds", paragraphs: ["It took nearly six centuries to build. Its dense roofline of spires is the detail that makes it instantly recognisable.", "Look for the golden Madonnina at the highest point—she is almost a symbol of Milan itself."] },
          story: { title: "A story about Milan’s skyline", paragraphs: ["For a long time, Milan did not want any building to truly rise above the Madonnina on the cathedral.", "When taller towers eventually appeared, replicas of the Madonnina were placed on their rooftops so she could remain above the city."] },
          detail: { title: "Look a little closer", paragraphs: [], sections: [
            { title: "How it was built", body: "Work began in 1386, and final details were still being completed in the 20th century. Many generations left their craft on the same building." },
            { title: "What to look at now", body: "Follow the dense spires upward, then find the golden Madonnina at the highest point." },
            { title: "Why it stays with you", body: "It is not the work of one moment—it is centuries of Milan layered into the centre of the city." },
          ] },
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
          short: { title: "30 秒认识塞维利亚大教堂", paragraphs: ["它建在原清真寺所在地。今天留下来的吉拉达塔，是这座城市不同历史时期叠在一起最直观的痕迹之一。", "抬头找那座高塔：它最初是一座宣礼塔。"] },
          story: { title: "一座“让后人觉得疯狂”的教堂", paragraphs: ["大教堂的建造者曾说，要造一座让后人觉得他们“近乎疯狂”的教堂。", "原清真寺的庭院与高塔没有被抹去，反而被留进了新的城市地标里。"] },
          detail: { title: "再多看一点", paragraphs: [], sections: [
            { title: "它怎么建起来的", body: "教堂从 15 世纪开始修建，在原清真寺所在地升起了庞大的哥特式主体。" },
            { title: "现在抬头看什么", body: "找吉拉达塔和橘园庭院，它们都来自更早的清真寺。" },
            { title: "为什么值得记住", body: "这里没有抹掉前一段历史，而是把两段城市记忆放在了同一个空间里。" },
          ] },
        },
        lookUp: "看看吉拉达塔。它最初并不是钟塔，而是一座宣礼塔。",
      },
      en: {
        name: "Seville Cathedral",
        location: "",
        narratives: {
          short: { title: "Seville Cathedral in 30 seconds", paragraphs: ["It stands on the site of a former mosque. The Giralda is the clearest place to see different chapters of Seville’s history overlap.", "Look up at the tower: it began as a minaret."] },
          story: { title: "A cathedral meant to look impossible", paragraphs: ["Its builders reportedly wanted something so ambitious that later generations would think them mad.", "The former mosque’s courtyard and tower were not erased—they became part of the new landmark."] },
          detail: { title: "Look a little closer", paragraphs: [], sections: [
            { title: "How it was built", body: "Construction began in the 15th century, with a vast Gothic church rising over the former mosque." },
            { title: "What to look at now", body: "Find the Giralda and the orange-tree courtyard, both inherited from the earlier mosque." },
            { title: "Why it stays with you", body: "Two chapters of Seville remain visible in the same place instead of one erasing the other." },
          ] },
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
          short: { title: "30 秒认识圣家堂", paragraphs: ["高迪借用了树木、枝干和自然结构，所以进入内部时，会有一种站在森林里的感觉。", "抬头看分叉的柱子：它们真的在像树一样支撑顶部。"] },
          story: { title: "高迪把森林搬进了教堂", paragraphs: ["高迪相信自然界没有直线。柱子会分叉，光线也会像穿过树冠一样落下。", "于是，冰冷的石头建筑有了森林般向上生长的生命感。"] },
          detail: { title: "再多看一点", paragraphs: [], sections: [
            { title: "它怎么建起来的", body: "高迪用双曲面、螺旋和分叉柱，把自然结构变成真正的承重方式。" },
            { title: "现在抬头看什么", body: "看柱子如何向上分枝，再看彩色光线如何穿过空间，像树冠筛下的日光。" },
            { title: "为什么值得记住", body: "这些自然形态不是装饰，它们同时决定了建筑的结构与人在其中的感受。" },
          ] },
        },
        lookUp: "看看内部那些分叉的柱子。它们不是单纯装饰，而是在模拟树干向上生长、分枝的结构。",
      },
      en: {
        name: "Sagrada Família",
        location: "Barcelona · Sagrada Família",
        narratives: {
          short: { title: "Sagrada Família in 30 seconds", paragraphs: ["Gaudí borrowed from trees, branches, and natural structures, so the interior can feel like a forest.", "Look at the branching columns: they really do support the roof like trees."] },
          story: { title: "How Gaudí brought a forest indoors", paragraphs: ["Gaudí believed nature had no straight lines. Columns branch overhead and light falls through them like a canopy.", "That is how a stone church begins to feel as if it is still growing."] },
          detail: { title: "Look a little closer", paragraphs: [], sections: [
            { title: "How it was built", body: "Gaudí used hyperboloids, spirals, and branching columns to turn natural forms into real structure." },
            { title: "What to look at now", body: "Watch the columns divide overhead, then notice how coloured light falls through the space like sunlight through leaves." },
            { title: "Why it stays with you", body: "The natural forms are not decoration—they shape both the building’s structure and how it feels to stand inside." },
          ] },
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
  if (constraint === "tired" || constraint === "less" || lowEnergyPattern.test(note)) return "less";
  if (constraint === "explore" || activePattern.test(note)) return "active";
  return "default";
}
