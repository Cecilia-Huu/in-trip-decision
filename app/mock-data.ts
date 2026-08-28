export type Move = {
  id: number;
  label: string;
  title: string;
  meta: string[];
  reason: string;
  cta: string;
  visual: "cafe" | "walk" | "surprise" | "garden" | "river" | "tapas";
};

export const demoNote = "很多地方圣诞节不开，但今天天气很好，我还不想回去，想慢慢感受一下这座城市。";

export const changeGroups = [
  { key: "plan", letter: "A", title: "计划变了", description: "原本安排好的事情不能继续了", options: ["景点关门了", "突然下雨", "提前逛完了", "排队太久", "临时多出两小时"] },
  { key: "me", letter: "B", title: "我变了", description: "计划没问题，但我现在的状态不一样了", options: ["我累了", "不想继续原计划", "我有点饿", "我不想走远", "天快黑了"] },
];

export const questions = [
  { key: "time", number: "01", title: "现在还剩多少时间？", options: ["30 分钟左右", "1 小时左右", "2 小时以上"], initial: "2 小时以上" },
  { key: "pace", number: "02", title: "现在更想怎么过？", options: ["慢一点", "继续逛逛", "找地方坐坐", "想来点特别的"], initial: "慢一点" },
  { key: "energy", number: "03", title: "现在更接近哪种状态？", options: ["还有精神", "有一点累", "只想轻松一点"], initial: "只想轻松一点" },
];

export const moveSets: Move[][] = [
  [
    { id: 1, label: "现在最适合", title: "在大教堂附近找家 café 坐下来，晒会儿太阳", meta: ["步行 7 分钟", "低体力消耗", "仍营业"], reason: "你刚刚说想慢一点，而且今天的原计划已经被打断。不用急着再塞一个景点，先坐下来，让自己重新进入这座城市。", cta: "就这个", visual: "cafe" },
    { id: 2, label: "如果还想继续看看", title: "沿老城慢慢走一段，不设明确目的地", meta: ["可随时结束", "无需预约", "灵活"], reason: "塞维利亚的体验不只来自下一个“必去景点”。对现在的你来说，街道、阳光和慢慢走本身可能更值得。", cta: "这个也不错", visual: "walk" },
    { id: 3, label: "给今天一点意外", title: "看看附近有没有临时开放、无需计划的小型体验", meta: ["低承诺", "本地感", "保留惊喜"], reason: "今天原定计划已经失效，不一定非要把它修回去。可以给今天留一点没有提前计划的空间。", cta: "想试试这个", visual: "surprise" },
  ],
  [
    { id: 4, label: "轻一点的城市时间", title: "去 Murillo 花园找张长椅，让下午慢下来", meta: ["步行 9 分钟", "随时离开", "阳光很好"], reason: "你不需要用一个新景点填满空出来的时间。坐在树荫与阳光之间，看城市从身边经过，也是在旅行。", cta: "就这样过", visual: "garden" },
    { id: 5, label: "如果想边走边看", title: "往河边走，看到喜欢的街角就停一停", meta: ["路线平缓", "不用赶路", "可随时折返"], reason: "这条选择没有必须完成的终点，既保留了继续探索的感觉，也不会把今天重新变成一张任务清单。", cta: "去河边看看", visual: "river" },
    { id: 6, label: "顺便照顾一下自己", title: "找一家还开着的小店，吃点轻松的 tapas", meta: ["附近可选", "补充体力", "低承诺"], reason: "计划变化之后，先照顾身体往往比补一个景点更重要。吃点东西，再决定今天要不要继续。", cta: "看看附近", visual: "tapas" },
  ],
];

export const feedbackReasons = ["还是太累了", "想更特别一点", "不想坐下来", "太游客了", "想一个人安静一点", "还是想继续看点东西"];
