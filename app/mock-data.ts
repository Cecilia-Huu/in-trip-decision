export type MoveVisual = "pause" | "wander" | "spark" | "food" | "view" | "shelter" | "play";

export type Move = {
  id: string;
  category: string;
  title: string;
  distance: string;
  effort: "Low" | "Low–medium" | "Medium";
  availability: string;
  whyNow: string;
  serendipity: 1 | 2 | 3;
  cta: string;
  visual: MoveVisual;
};

export type Scenario = {
  id: string;
  demo: string;
  city: string;
  time: string;
  weather: string;
  mode: string;
  occasion?: string;
  trigger: string;
  changeType: "world" | "me";
  teaser: string;
  prompt: string;
  summary: string[];
  tags: string[];
  answers: Record<string, string>;
  stateTags: string[];
  learning: string;
  moveSets: Move[][];
};

export const changeGroups = [
  {
    key: "world",
    letter: "A",
    english: "THE WORLD CHANGED",
    title: "计划变了",
    description: "原本安排好的事情不能继续了",
    options: ["景点关门", "突然下雨", "排队太久", "提前逛完", "临时多出时间"],
  },
  {
    key: "me",
    letter: "B",
    english: "I CHANGED",
    title: "我变了",
    description: "计划没问题，但我现在的状态不一样了",
    options: ["我累了", "不想继续原计划", "饿了", "不想走远", "天快黑了"],
  },
];

export const questions = [
  { key: "time", number: "01", title: "现在还剩多少时间？", options: ["30 分钟左右", "1 小时左右", "2 小时以上"] },
  { key: "pace", number: "02", title: "现在更想怎么过？", options: ["慢一点", "继续逛逛", "找地方坐坐", "想来点特别的"] },
  { key: "energy", number: "03", title: "现在更接近哪种状态？", options: ["还有精神", "有一点累", "只想轻松一点"] },
];

const sevilleMoves: Move[][] = [
  [
    { id: "sev-pause", category: "Pause & reset", title: "在附近找一家仍营业的 café，坐下来晒会儿太阳", distance: "7 min walk", effort: "Low", availability: "Open now", whyNow: "原计划刚刚中断，而你想把节奏慢下来。先坐一会儿，不必立刻用另一个景点填满空出来的时间。", serendipity: 1, cta: "就这样过", visual: "pause" },
    { id: "sev-wander", category: "Open-ended wander", title: "选一条舒服的街，慢慢走一段，不设终点", distance: "Starts here", effort: "Low–medium", availability: "Always available", whyNow: "天气很好，你也还不想结束今天。没有明确终点的散步，保留了城市感，也允许你随时停下来。", serendipity: 2, cta: "开始慢慢走", visual: "wander" },
    { id: "sev-spark", category: "Small local moment", title: "看看附近有没有无需预约、现在可加入的小体验", distance: "Within 12 min", effort: "Low", availability: "A few options", whyNow: "计划失效不一定需要被修回去。一个低承诺的小体验，能给今天留一点没有提前安排的空间。", serendipity: 3, cta: "看看有什么", visual: "spark" },
  ],
  [
    { id: "sev-garden", category: "Quiet reset", title: "去附近的花园找张长椅，让下午慢下来", distance: "9 min walk", effort: "Low", availability: "Open-air", whyNow: "现在最重要的不是继续完成清单，而是恢复对这座城市的感受。坐一会儿，也是一种旅行。", serendipity: 1, cta: "去坐一会儿", visual: "pause" },
    { id: "sev-food", category: "Refuel", title: "找一家还开着的小店，吃点轻松的东西", distance: "5–10 min", effort: "Low", availability: "Open now", whyNow: "先照顾身体，比补一个景点更重要。吃点东西之后，再决定今天要不要继续。", serendipity: 1, cta: "找点吃的", visual: "food" },
    { id: "sev-view", category: "Easy view", title: "往开阔处走，在日落前看看城市的光线", distance: "14 min walk", effort: "Medium", availability: "Before sunset", whyNow: "你还有时间和一点精神，这个选择有方向、没有任务感，也不会把下午重新排满。", serendipity: 2, cta: "去看看光", visual: "view" },
  ],
];

const barcelonaMoves: Move[][] = [
  [
    { id: "bcn-food", category: "Refuel without stopping", title: "找一家安静的小店坐下，吃点 tapas 再决定", distance: "5 min walk", effort: "Low", availability: "Open now", whyNow: "你已经走累了，但还不想回酒店。先补充体力，把下一次决定留到坐下来之后。", serendipity: 1, cta: "先去坐下", visual: "food" },
    { id: "bcn-view", category: "Easy city time", title: "往海边方向走一小段，找个能随时停下的位置", distance: "11 min walk", effort: "Low–medium", availability: "Open-air", whyNow: "天还亮着，你想继续留在城市里。一个没有必须完成终点的方向，比再塞进一个景点更合适。", serendipity: 2, cta: "往海边走", visual: "view" },
    { id: "bcn-spark", category: "One small discovery", title: "逛一家顺路的独立书店或设计小店", distance: "8 min walk", effort: "Low", availability: "Open until 20:00", whyNow: "它足够轻，不需要重新规划晚上；又比单纯休息多一点发现感，适合你现在还不想结束的状态。", serendipity: 3, cta: "去看看", visual: "spark" },
  ],
  [
    { id: "bcn-square", category: "People-watch", title: "在附近广场找个位置坐下，看城市进入夜晚", distance: "4 min walk", effort: "Low", availability: "Always available", whyNow: "你需要休息，但不需要离开城市。坐在人群边缘，也能继续感受旅行正在发生。", serendipity: 2, cta: "去广场坐坐", visual: "pause" },
    { id: "bcn-ride", category: "Low-effort change", title: "坐两站公交，换一个街区再慢慢走", distance: "3 min to stop", effort: "Low", availability: "Next bus 6 min", whyNow: "减少步行能量消耗，同时保留一点场景变化，不会让你觉得今天已经提前结束。", serendipity: 2, cta: "看看路线", visual: "wander" },
    { id: "bcn-dessert", category: "Tiny reward", title: "找一份只属于今晚的小甜点", distance: "7 min walk", effort: "Low", availability: "Open now", whyNow: "现在不需要宏大的安排。一个明确、轻松、很快能获得的愉快时刻，刚好接住疲惫。", serendipity: 2, cta: "找点甜的", visual: "food" },
  ],
];

const tokyoMoves: Move[][] = [
  [
    { id: "tyo-shelter", category: "Stay dry, keep moving", title: "去最近的有盖商店街，边躲雨边继续逛", distance: "6 min walk", effort: "Low–medium", availability: "Open now", whyNow: "雨改变了路线，但没有改变你们想继续探索的心情。有盖空间能保留行动感，也不用一直淋雨。", serendipity: 2, cta: "去商店街", visual: "shelter" },
    { id: "tyo-pause", category: "Warm reset", title: "找一家能坐下聊天的 kissaten，等雨势变小", distance: "4 min walk", effort: "Low", availability: "Seats likely", whyNow: "你们不需要马上决定整个下午。先暖和下来、聊一会儿，下一步会更容易判断。", serendipity: 1, cta: "先喝点东西", visual: "pause" },
    { id: "tyo-play", category: "Shared surprise", title: "选一个附近可随时加入的室内小体验", distance: "9 min walk", effort: "Medium", availability: "Walk-in", whyNow: "和朋友一起时，一点意外比完美备选路线更重要。低承诺的室内体验能把坏天气变成共同记忆。", serendipity: 3, cta: "来点意外", visual: "play" },
  ],
  [
    { id: "tyo-station", category: "Indoor wander", title: "把附近车站当成一座室内街区慢慢逛", distance: "5 min walk", effort: "Low–medium", availability: "Open now", whyNow: "不用为了避雨专门跨城。车站里的小店和通道足够让你们继续走走，也方便随时改变主意。", serendipity: 2, cta: "去车站看看", visual: "shelter" },
    { id: "tyo-food", category: "Group reset", title: "找一份大家都想吃的热食，把雨天变成一顿饭", distance: "Within 8 min", effort: "Low", availability: "Several options", whyNow: "天气打断了计划，饥饿或分歧很容易放大。一起吃点热的，是重新对齐状态的最短路径。", serendipity: 1, cta: "找热食", visual: "food" },
    { id: "tyo-arcade", category: "Playful detour", title: "去室内游戏厅只玩 30 分钟，不承诺整个下午", distance: "10 min walk", effort: "Medium", availability: "Open now", whyNow: "给这个雨天一个边界清晰的小插曲，不需要重新做攻略，也不会让所有人被一个新计划绑住。", serendipity: 3, cta: "玩半小时", visual: "play" },
  ],
];

export const scenarios: Scenario[] = [
  {
    id: "seville", demo: "DEMO 01", city: "Seville", time: "13:40", weather: "Sunny", mode: "Solo", occasion: "Christmas Day", trigger: "景点关门", changeType: "world", teaser: "Christmas Day · 景点关闭",
    prompt: "很多地方圣诞节不开，但今天天气很好，我还不想回去，想慢慢感受一下这座城市。",
    summary: ["很多地方今天没有开放", "天气很好，你还不想结束今天", "你更想慢慢感受这座城市"],
    tags: ["Solo", "Sunny", "Plan changed", "Want to slow down"], answers: { time: "2 小时以上", pace: "慢一点", energy: "只想轻松一点" }, stateTags: ["2h+", "想慢一点", "低体力"], learning: "下次你说“今天想慢一点”时，我会更偏向这种轻一点的节奏。", moveSets: sevilleMoves,
  },
  {
    id: "barcelona", demo: "DEMO 02", city: "Barcelona", time: "19:10", weather: "Clear", mode: "Solo", trigger: "我累了", changeType: "me", teaser: "走累了 · 还不想回酒店",
    prompt: "走了一下午，我有点累了，但天色很好，也还不想这么早回酒店。",
    summary: ["你已经走了一下午，有点累", "天气和时间都还允许继续", "你不想马上回酒店结束今天"],
    tags: ["Solo", "Clear", "Energy changed", "Stay out a little"], answers: { time: "1 小时左右", pace: "找地方坐坐", energy: "有一点累" }, stateTags: ["1h", "想坐坐", "有点累"], learning: "下次你在傍晚说“累了但不想回去”时，我会先帮你降低体力成本。", moveSets: barcelonaMoves,
  },
  {
    id: "tokyo", demo: "DEMO 03", city: "Tokyo", time: "15:30", weather: "Rainy", mode: "Friends", trigger: "突然下雨", changeType: "world", teaser: "突然下雨 · 和朋友一起",
    prompt: "突然下雨了，我们不想一直淋雨，但也不想现在就结束今天。",
    summary: ["雨打断了原来的户外安排", "你们还想继续一起探索", "现在需要一个能灵活加入的室内选择"],
    tags: ["Friends", "Rainy", "Plan changed", "Keep exploring"], answers: { time: "2 小时以上", pace: "想来点特别的", energy: "还有精神" }, stateTags: ["2h+", "想继续", "多人同行"], learning: "下次和朋友遇到突然下雨时，我会优先找可随时加入、不会绑住所有人的室内选择。", moveSets: tokyoMoves,
  },
];

export const feedbackReasons = ["还是太累了", "想更特别一点", "不想坐下来", "太游客了", "想安静一点", "还是想继续看点东西"];

const genericMoveSets: Move[][] = [
  [
    { id: "custom-pause", category: "Pause & reset", title: "找一个附近能坐下来的地方，先让自己停一会儿", distance: "Within 8 min", effort: "Low", availability: "Open now", whyNow: "计划变化之后，不必马上补上另一个安排。先把节奏放慢，下一步会更容易判断。", serendipity: 1, cta: "先去坐下", visual: "pause" },
    { id: "custom-wander", category: "Open-ended wander", title: "往一个舒服的方向走一小段，不设明确终点", distance: "Starts here", effort: "Low–medium", availability: "Always available", whyNow: "它保留了继续旅行的感觉，也允许你随时停下、折返或改变主意。", serendipity: 2, cta: "开始走走", visual: "wander" },
    { id: "custom-spark", category: "Small discovery", title: "看看附近有没有无需预约、可以随时加入的小体验", distance: "Within 12 min", effort: "Low", availability: "A few options", whyNow: "一个低承诺的小发现，不需要重新规划整天，也能让意外变成今天的一部分。", serendipity: 3, cta: "看看有什么", visual: "spark" },
  ],
  [
    { id: "custom-food", category: "Refuel", title: "找点容易吃到的东西，再决定要不要继续", distance: "Within 10 min", effort: "Low", availability: "Open now", whyNow: "先照顾身体通常比急着寻找替代景点更重要。吃点东西后，你可以重新判断自己的状态。", serendipity: 1, cta: "找点吃的", visual: "food" },
    { id: "custom-view", category: "Easy city time", title: "找一处开阔但不远的位置，看看城市此刻的样子", distance: "10–15 min", effort: "Low–medium", availability: "Open-air", whyNow: "它有一个轻方向，但没有必须完成的任务，适合计划刚刚被打断的时候。", serendipity: 2, cta: "去看看", visual: "view" },
    { id: "custom-play", category: "Playful detour", title: "给接下来半小时安排一个低承诺的小插曲", distance: "Nearby", effort: "Medium", availability: "Walk-in", whyNow: "明确的短时长让你不会被新计划绑住，同时又能给这段意外留下一个积极记忆。", serendipity: 3, cta: "来点意外", visual: "play" },
  ],
];

export function createCustomScenario(city: string): Scenario {
  const now = new Date();
  const time = new Intl.DateTimeFormat("zh-CN", { hour: "2-digit", minute: "2-digit", hour12: false }).format(now);
  return {
    id: `custom-${city}`,
    demo: "LIVE",
    city,
    time,
    weather: "",
    mode: "Solo",
    trigger: "",
    changeType: "world",
    teaser: "当前旅程",
    prompt: "",
    summary: ["计划或状态刚刚发生了变化"],
    tags: [],
    answers: { time: "1 小时左右", pace: "慢一点" },
    stateTags: [],
    learning: "下次遇到类似变化时，我会更快找到适合你当下节奏的选择。",
    moveSets: genericMoveSets,
  };
}
