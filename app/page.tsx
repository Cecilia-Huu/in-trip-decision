import { useEffect, useRef, useState, type ReactNode } from "react";
import { findLandmark, landmarks, selectInitialPlan, tripData, type Constraint, type LandmarkId, type LandmarkNarrative, type Locale, type PlanBlock, type PlanVariant } from "./mock-data";

type Screen = "live" | "context" | "plan";
type AppTab = "trip" | "nearby" | "lens";
type LensState = "idle" | "scanning" | "result" | "notFound";
type IconName = "arrow" | "camera" | "check" | "lock" | "map" | "plan" | "spark" | "walk";

const LANGUAGE_KEY = "in-trip-decision-locale";

const uiCopy = {
  zh: {
    appName: "In-trip Decision",
    back: "返回",
    tripName: "塞维利亚之旅",
    tripDate: "12月24日 周二 · 第2天",
    step: (current: number) => `第 ${current} 步，共 3 步`,
    language: "切换语言",
    navLabel: "行程导航",
    nav: [
      { id: "trip" as const, label: "行程" },
      { id: "nearby" as const, label: "附近" },
      { id: "lens" as const, label: "识景" },
    ],
    todayEyebrow: "今日行程",
    todayTitle: "今天 · 塞维利亚",
    todayMeta: "原计划 2.4 公里 · 18:30 晚餐已预订",
    fixed: "固定",
    firstWalk: "步行 8 分钟",
    openGap: "空出 135 分钟",
    triggerTitle: "计划有变？",
    triggerCopy: "王宫临时关闭，晚餐保持不变。",
    triggerAction: "调整这一段",
    gapClosed: "王宫临时关闭",
    gapDinner: "18:30 晚餐已预订",
    contextEyebrow: "CONTEXT CHECK",
    contextTitle: "调整这一段",
    contextCopy: "我知道这一段：",
    knownFacts: ["塞维利亚王宫 · 临时关闭", "Tapas 晚餐 · 18:30 已预订", "现在 16:05 · 还剩 2 小时 15 分"],
    profileLabel: "已有旅行偏好",
    profileValue: "Solo · 偏慢节奏",
    nowLabel: "现在呢？",
    optional: "可以不选。",
    noteLabel: "还想补充什么？",
    notePlaceholder: "比如：不想再去一个大景点。",
    constraintsLabel: "现在的状态（可选）",
    constraints: [
      { value: "tired" as const, label: "有点累" },
      { value: "less" as const, label: "不想走太远" },
      { value: "explore" as const, label: "还想继续逛" },
      { value: "decide" as const, label: "直接帮我安排" },
    ],
    fallback: "不选也可以，默认按少绕路、无需预约、不破坏后续安排来排。",
    submit: "看看接下来怎么走",
    skip: "不补充，直接继续",
    processingTitle: "正在保留 18:30 晚餐…",
    processingCopy: "只调整中间空出的这一段。",
    resultEyebrow: "调整后的行程",
    resultTitle: "接下来这样走",
    anchorLocked: "18:30 晚餐保留",
    why: "为什么这样改？",
    evidenceLabel: "这次优先考虑",
    moreActive: "还想多逛一点",
    lessWalking: "少走一点",
    keepThis: "就这样",
    accepted: "已保留这一版，继续旅行吧。",
    replay: "重新演示",
    viewOnMap: "在地图上看看",
    nearbyEyebrow: "顺路的下一步",
    nearbyTitle: "附近",
    nearbySubtitle: "看看什么刚好顺路",
    nearbyAnchor: "18:30 Tapas 晚餐 · 已预订",
    nearbyTime: "还有 2 小时 15 分",
    nearbyHint: "不是最近的，是最顺你接下来这一程的。",
    youAreHere: "你在这里",
    dinnerPin: "18:30 晚餐",
    bestFit: "最顺路",
    nearbyCandidates: [
      { id: "river", name: "河边慢走", route: "步行 8 分钟 · 正好顺路", detail: "低强度 · 几乎不绕路", fit: "不会影响 18:30 晚餐" },
      { id: "cafe", name: "庭院 Café", route: "步行 6 分钟 · 需要回走一点", detail: "可以坐 · 不用预约", fit: "休息后仍能按时到晚餐" },
      { id: "gallery", name: "小型展馆", route: "步行 12 分钟 · 稍微绕路", detail: "17:30 前可进入 · 多走一点", fit: "最晚 17:45 离开" },
    ],
    goodNow: "适合现在",
    goHere: "去这里",
    chosen: "已选",
    nearbyAccepted: "已放进下一步，18:30 晚餐不变。",
    lensEyebrow: "走到哪儿，懂到哪儿",
    lensTitle: "识景",
    lensQuestion: "眼前这个是什么？",
    lensIntro: "拍一下景点、建筑、雕塑或画作，我讲给你听。",
    lensPromise: "攻略可以不做，眼前的故事别错过。",
    capture: "拍一下",
    placeInputLabel: "输入景点名称",
    placeInputPlaceholder: "输入景点名称",
    placeInputExample: "例如：米兰大教堂",
    placeLookup: "查看",
    scanning: "正在辨认眼前的建筑…",
    scanningHint: "不用举着手机等。",
    lookingAt: "你正在看",
    oneThing: "先知道这一件事就够了",
    lookUp: "抬头找找 👀",
    lensModes: [
      { id: "short" as const, label: "30 秒讲完" },
      { id: "story" as const, label: "讲个有意思的故事" },
      { id: "detail" as const, label: "详细一点" },
    ],
    lensBack: "重新识景",
    notFoundEyebrow: "识景范围",
    notFoundTitle: "当前 Demo 暂未收录这个景点",
    notFoundCopy: "可以试试：",
    tryAnother: "换一个景点",
    pageTitle: "In-trip Decision · 旅途中，只决定下一步",
    pageDescription: "当旅行计划临时变化，只调整现在到下一个固定安排之间的空档。",
  },
  en: {
    appName: "In-trip Decision",
    back: "Go back",
    tripName: "Seville getaway",
    tripDate: "Tue, Dec 24 · Day 2",
    step: (current: number) => `${current} of 3`,
    language: "Switch language",
    navLabel: "Trip navigation",
    nav: [
      { id: "trip" as const, label: "Trip" },
      { id: "nearby" as const, label: "Nearby" },
      { id: "lens" as const, label: "Lens" },
    ],
    todayEyebrow: "Today’s plan",
    todayTitle: "Today in Seville",
    todayMeta: "2.4 km planned · dinner reserved at 18:30",
    fixed: "Fixed",
    firstWalk: "8 min walk",
    openGap: "135 min open gap",
    triggerTitle: "Plan changed?",
    triggerCopy: "The Alcázar is closed. Keep dinner as planned.",
    triggerAction: "Adjust this gap",
    gapClosed: "Royal Alcázar closed",
    gapDinner: "18:30 dinner reserved",
    contextEyebrow: "CONTEXT CHECK",
    contextTitle: "Adjust this gap",
    contextCopy: "Here’s what I already know:",
    knownFacts: ["Royal Alcázar · closed", "Tapas Dinner · reserved at 18:30", "Now 16:05 · 2 hr 15 min left"],
    profileLabel: "Saved trip preference",
    profileValue: "Solo · slow pace",
    nowLabel: "How are you now?",
    optional: "Optional.",
    noteLabel: "Anything else?",
    notePlaceholder: "For example: I don’t want another big sight.",
    constraintsLabel: "How you feel now (optional)",
    constraints: [
      { value: "tired" as const, label: "A little tired" },
      { value: "less" as const, label: "Not too far" },
      { value: "explore" as const, label: "Still want to explore" },
      { value: "decide" as const, label: "Decide for me" },
    ],
    fallback: "No answer needed. I’ll avoid detours and bookings, and keep dinner safe.",
    submit: "Adjust what’s next",
    skip: "Continue without input",
    processingTitle: "Keeping your 18:30 dinner…",
    processingCopy: "Only the open gap will change.",
    resultEyebrow: "Updated plan",
    resultTitle: "I adjusted what’s next.",
    anchorLocked: "18:30 dinner kept",
    why: "Why this change?",
    evidenceLabel: "Prioritised this time",
    moreActive: "More active",
    lessWalking: "Less walking",
    keepThis: "Keep this",
    accepted: "Plan kept. Back to the trip.",
    replay: "Replay",
    viewOnMap: "View on map",
    nearbyEyebrow: "On the way next",
    nearbyTitle: "Nearby",
    nearbySubtitle: "See what fits the way ahead",
    nearbyAnchor: "18:30 Tapas Dinner · reserved",
    nearbyTime: "2 hr 15 min to go",
    nearbyHint: "Not the nearest. The best fit for what comes next.",
    youAreHere: "You are here",
    dinnerPin: "18:30 dinner",
    bestFit: "Best fit",
    nearbyCandidates: [
      { id: "river", name: "Riverside walk", route: "8 min walk · right on the way", detail: "Low effort · almost no detour", fit: "Keeps the 18:30 dinner safe" },
      { id: "cafe", name: "Patio café", route: "6 min walk · slight backtrack", detail: "Seating · no booking", fit: "Enough time to rest before dinner" },
      { id: "gallery", name: "Small gallery", route: "12 min walk · small detour", detail: "Entry before 17:30 · more walking", fit: "Leave by 17:45" },
    ],
    goodNow: "Fits now",
    goHere: "Go here",
    chosen: "Chosen",
    nearbyAccepted: "Added to what’s next. Dinner stays at 18:30.",
    lensEyebrow: "Understand as you go",
    lensTitle: "Lens",
    lensQuestion: "What am I looking at?",
    lensIntro: "Take a photo of a place, building, sculpture, or artwork. I’ll explain what matters.",
    lensPromise: "Skip the homework. Don’t miss the story in front of you.",
    capture: "Take a photo",
    placeInputLabel: "Enter a place name",
    placeInputPlaceholder: "Enter a place name",
    placeInputExample: "For example: Milan Cathedral",
    placeLookup: "View",
    scanning: "Recognising what’s in front of you…",
    scanningHint: "You don’t need to keep holding the phone up.",
    lookingAt: "You’re looking at",
    oneThing: "One thing worth knowing",
    lookUp: "Look up 👀",
    lensModes: [
      { id: "short" as const, label: "30-second version" },
      { id: "story" as const, label: "Tell me a good story" },
      { id: "detail" as const, label: "A little more detail" },
    ],
    lensBack: "Scan again",
    notFoundEyebrow: "Demo coverage",
    notFoundTitle: "Not in this demo yet.",
    notFoundCopy: "Try:",
    tryAnother: "Try another place",
    pageTitle: "In-trip Decision · Decide what’s next",
    pageDescription: "When travel plans change, repair only the gap before the next fixed stop.",
  },
} as const;

type UiCopy = (typeof uiCopy)[Locale];

const caseCopy = {
  zh: {
    eyebrow: "AI PRODUCT CASE · IN-TRIP DECISION",
    title: "旅行计划最容易失效的，往往不是出发前，而是已经在路上以后。",
    scene: ["16:00 · 塞维利亚王宫临时关闭", "突然多出 2 小时 15 分", "18:30 · 晚餐已预订，不能动"],
    setup: "传统工具会让我重新搜索“附近还有什么”。但我真正需要解决的是：结合我现在的状态，接下来怎么走更合适？",
    proposition: "不是找最好的地点，而是决定此刻最合适的下一步。",
    tryLabel: "现在，直接试试这个产品",
    sections: {
      problem: {
        kicker: "01 / Problem",
        title: "计划被打乱不是问题，重新做决定才是。",
        body: "一个节点失效后，用户面对的不只是重新搜索。旅行时间有限，“明天再去”很多时候并不存在。",
        costs: ["搜索成本", "比较成本", "后悔成本"],
        flow: ["Original Plan", "Change", "2h15 Open Gap", "18:30 Next Anchor"],
        conclusion: "问题不是重新生成整份 itinerary，而是修复“现在 → 下一个固定安排”之间的 Gap。",
      },
      insight: {
        kicker: "02 / Insight",
        title: "信息很多，真正缺的是行动判断。",
        rows: [
          ["搜索 / 地图", "Facts", "告诉我客观世界是什么。"],
          ["UGC", "Experience", "告诉我相似的人曾经怎么经历它。"],
          ["AI", "Decision", "判断这些信息放到此刻的我身上，下一步应该怎么行动。"],
        ],
        conclusion: "机会不在于提供更多信息，而在于让信息真正变成行动。",
      },
      logic: {
        kicker: "03 / Decision Logic",
        title: "真正的推荐对象不是地点，而是地点 × 此刻的我。",
        formula: "Next Move = Place × Me × Now",
        dimensions: [
          ["Place", "营业、距离、方向、固定行程等现实约束。"],
          ["Me", "solo、节奏、兴趣与风险偏好等稳定倾向。"],
          ["Now", "时间、疲劳、情绪与临时变化。"],
        ],
        scenarios: [
          ["A · 有点累", "不想再去一个大景点", "Café + 低强度散步 + 保留晚餐"],
          ["B · 还很有精神", "想继续逛", "小型展馆 + 城市漫步 + 保留晚餐"],
        ],
        conclusion: "现实世界没变，但“现在的我”变了，下一步就不应该一样。",
      },
      interaction: {
        kicker: "04 / Interaction",
        title: "AI 的目标不是延长对话，而是让用户更快放下手机。",
        body: "旅行是强线下场景：用户可能正在走路、看路、拿行李、晒太阳，网络也不一定稳定。",
        principles: ["Low input", "Low interaction cost", "Low decision load"],
        fallbackTitle: "Graceful Degradation",
        fallback: "即使用户什么都不选，系统仍能根据时间、失效节点、下一个 Anchor 与候选活动给出保守方案。好的 AI 产品不要求完美 Context，而是在信息不完整时先工作，再让用户用最低成本纠偏。",
      },
      lens: {
        kicker: "05 / Another In-trip Moment",
        title: "不用提前做功课，走到哪儿，懂到哪儿。",
        body: "当旅行者已经站在一个景点前，真正的问题不是“给我更多百科”，而是“此刻刚好够用的信息是什么？”",
        rows: [["传统 Audio Guide", "Place → Fixed Content"], ["AI Guide", "Place × Me × Now → What is worth knowing here"]],
        depth: ["只有 30 秒 → 快速讲完", "愿意停留一会儿 → 听一个故事", "想深入理解 → 展开三个重点"],
      },
      scope: {
        kicker: "Prototype Scope",
        title: "验证交互假设，而不是模拟完整旅行平台。",
        items: ["Context-aware Replan 是否优于普通 POI replacement", "低输入 interaction 是否适合 In-trip 场景", "不同用户状态是否产生不同 Next Move", "不同注意力投入是否应该改变讲解深度"],
        note: "当前使用 Mock itinerary、Mock POI 与 Mock landmark data；Nearby 只作为“顺路 > 最近”的空间支撑层。",
      },
    },
  },
  en: {
    eyebrow: "AI PRODUCT CASE · IN-TRIP DECISION",
    title: "Travel plans often fail after the trip has already begun—not before it.",
    scene: ["16:00 · Royal Alcázar closes unexpectedly", "A 2 hr 15 min gap appears", "18:30 · Dinner is reserved and fixed"],
    setup: "Traditional tools send me back to search: “What else is nearby?” The real question is: given how I feel now, what is the right next move?",
    proposition: "Not the best place. The best next move.",
    tryLabel: "Try the product now",
    sections: {
      problem: {
        kicker: "01 / Problem",
        title: "The disruption is not the problem. Deciding again is.",
        body: "When one stop fails, the traveller is not merely searching again. Time is scarce, and “tomorrow” often does not exist on a trip.",
        costs: ["Search cost", "Comparison cost", "Regret risk"],
        flow: ["Original Plan", "Change", "2h15 Open Gap", "18:30 Next Anchor"],
        conclusion: "The job is not to regenerate the itinerary. It is to repair the gap between now and the next fixed anchor.",
      },
      insight: {
        kicker: "02 / Insight",
        title: "There is plenty of information. The missing layer is action.",
        rows: [["Search / Maps", "Facts", "Tell me what is objectively possible."], ["UGC", "Experience", "Shows how similar people experienced it."], ["AI", "Decision", "Judges what fits this person in this moment."]],
        conclusion: "The opportunity is not more information. It is better action.",
      },
      logic: {
        kicker: "03 / Decision Logic",
        title: "The recommendation is not a place. It is a place for this person, now.",
        formula: "Next Move = Place × Me × Now",
        dimensions: [["Place", "Opening hours, distance, direction, and fixed plans."], ["Me", "Solo travel, pace, interests, and risk preference."], ["Now", "Time, energy, emotion, and the disruption itself."]],
        scenarios: [["A · A little tired", "No more major sights", "Café + easy walk + keep dinner"], ["B · Still energised", "Wants to keep exploring", "Small gallery + city walk + keep dinner"]],
        conclusion: "The world did not change. Me + Now did, so the next move should change too.",
      },
      interaction: {
        kicker: "04 / Interaction",
        title: "The goal is not more conversation. It is helping travellers put the phone away.",
        body: "Travel is intensely physical: people are walking, navigating, carrying bags, talking, and often dealing with weak connectivity.",
        principles: ["Low input", "Low interaction cost", "Low decision load"],
        fallbackTitle: "Graceful Degradation",
        fallback: "Even with no user input, the product can use time, the failed stop, the next anchor, and candidate activities to offer a conservative plan. Good AI works with incomplete context, then makes correction cheap.",
      },
      lens: {
        kicker: "05 / Another In-trip Moment",
        title: "Skip the homework. Understand what is in front of you.",
        body: "When a traveller is already standing at a landmark, the question is not “give me more facts.” It is “what is just enough to know right now?”",
        rows: [["Traditional Audio Guide", "Place → Fixed Content"], ["AI Guide", "Place × Me × Now → What is worth knowing here"]],
        depth: ["Only 30 seconds → quick version", "A few minutes → one memorable story", "Ready to go deeper → three focused themes"],
      },
      scope: {
        kicker: "Prototype Scope",
        title: "Test the interaction hypothesis—not simulate a travel platform.",
        items: ["Whether context-aware replan beats POI replacement", "Whether low-input interaction fits in-trip use", "Whether different states produce different next moves", "Whether attention should change explanation depth"],
        note: "The prototype uses mocked itinerary, POI, and landmark data. Nearby remains a supporting spatial layer built around on-the-way > nearest.",
      },
    },
  },
} as const;

type CaseCopy = (typeof caseCopy)[Locale];

function getInitialLocale(): Locale {
  try {
    return window.localStorage.getItem(LANGUAGE_KEY) === "en" ? "en" : "zh";
  } catch {
    return "zh";
  }
}

function Icon({ name }: { name: IconName }) {
  const paths: Record<IconName, ReactNode> = {
    arrow: <><path d="m9 18 6-6-6-6" /><path d="M15 12H4" /></>,
    camera: <><path d="M14.5 5 13 3h-2L9.5 5H5a2 2 0 0 0-2 2v11a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2Z" /><circle cx="12" cy="12" r="4" /></>,
    check: <path d="m5 12 4 4L19 6" />,
    lock: <><rect width="16" height="12" x="4" y="10" rx="2" /><path d="M8 10V7a4 4 0 0 1 8 0v3" /></>,
    map: <><path d="m3 6 6-3 6 3 6-3v15l-6 3-6-3-6 3Z" /><path d="M9 3v15M15 6v15" /></>,
    plan: <><path d="M8 6h13M8 12h13M8 18h13" /><path d="M3 6h.01M3 12h.01M3 18h.01" /></>,
    spark: <><path d="m12 3-1.7 4.3L6 9l4.3 1.7L12 15l1.7-4.3L18 9l-4.3-1.7Z" /><path d="m5 15-.8 2.2L2 18l2.2.8L5 21l.8-2.2L8 18l-2.2-.8Z" /></>,
    walk: <><circle cx="13" cy="4" r="2" /><path d="m10 22 1-6-3-3 2-5 4 3 3 1M15 22l-2-5 2-4" /></>,
  };
  return <svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">{paths[name]}</svg>;
}

function LanguageToggle({ locale, label, onChange }: { locale: Locale; label: string; onChange: (locale: Locale) => void }) {
  return <div className="language-toggle" role="group" aria-label={label}>
    <button type="button" className={locale === "zh" ? "active" : ""} aria-pressed={locale === "zh"} onClick={() => onChange("zh")}>中</button>
    <span aria-hidden="true">|</span>
    <button type="button" className={locale === "en" ? "active" : ""} aria-pressed={locale === "en"} onClick={() => onChange("en")}>EN</button>
  </div>;
}

function ProductHeader({ showBack, locale, t, onBack, onLocaleChange }: { showBack: boolean; locale: Locale; t: UiCopy; onBack: () => void; onLocaleChange: (locale: Locale) => void }) {
  return <header className="product-header">
    {showBack ? <button className="icon-button" type="button" onClick={onBack} aria-label={t.back}><span className="back-glyph">←</span></button> : null}
    <strong className="app-name">{t.appName}</strong>
    <LanguageToggle locale={locale} label={t.language} onChange={onLocaleChange} />
  </header>;
}

function BottomNavigation({ activeTab, t, onChange }: { activeTab: AppTab; t: UiCopy; onChange: (tab: AppTab) => void }) {
  const icons: IconName[] = ["plan", "map", "camera"];
  return <nav className="bottom-navigation" aria-label={t.navLabel}>
    {t.nav.map((item, index) => <button type="button" key={item.id} className={activeTab === item.id ? "active" : ""} aria-current={activeTab === item.id ? "page" : undefined} onClick={() => onChange(item.id)}><Icon name={icons[index]} /><b>{item.label}</b></button>)}
  </nav>;
}

function LiveItinerary({ locale, t, onRepair }: { locale: Locale; t: UiCopy; onRepair: () => void }) {
  const itinerary = tripData[locale].itinerary;
  return <section className="app-screen live-screen" aria-labelledby="live-title">
    <div className="screen-intro"><p className="eyebrow">{t.todayEyebrow}</p><h2 id="live-title">{t.todayTitle}</h2><p>{t.todayMeta}</p></div>
    <ol className="itinerary-list">
      {itinerary.map((stop, index) => <li key={stop.id} className={`itinerary-stop ${stop.status}`}>
        <span className="stop-marker">{stop.status === "done" ? <Icon name="check" /> : index + 1}</span>
        <div className="stop-time">{stop.time}</div>
        <div className="stop-content"><article><div><strong>{stop.title}</strong>{stop.status === "anchor" ? <span className="tiny-lock"><Icon name="lock" /> {t.fixed}</span> : null}</div><p>{stop.meta}</p></article>{stop.status === "closed" ? <button className="inline-recovery-action" type="button" onClick={onRepair}>{t.triggerAction} <Icon name="arrow" /></button> : null}</div>
        {index === 0 ? <div className="travel-connector"><Icon name="walk" /> {t.firstWalk}</div> : null}
        {index === 1 ? <div className="travel-connector gap"><span>{t.openGap}</span></div> : null}
      </li>)}
    </ol>
  </section>;
}

function ContextInput({ t, note, constraint, processing, onNoteChange, onConstraint, onSubmit, onSkip }: {
  t: UiCopy; note: string; constraint: Constraint | null; processing: boolean; onNoteChange: (value: string) => void; onConstraint: (value: Constraint) => void; onSubmit: () => void; onSkip: () => void;
}) {
  return <section className="app-screen context-screen" aria-labelledby="context-title">
    <div className="context-sheet">
      <p className="eyebrow">{t.contextEyebrow}</p><h2 id="context-title">{t.contextTitle}</h2>
      <section className="known-context" aria-label={t.contextCopy}><strong>{t.contextCopy}</strong><ul>{t.knownFacts.map((fact) => <li key={fact}><Icon name={fact.includes("18:30") ? "lock" : "check"} />{fact}</li>)}</ul><p><span>{t.profileLabel}</span>{t.profileValue}</p></section>
      <div className="now-heading"><strong>{t.nowLabel}</strong><span>{t.optional}</span></div>
      <div className="constraint-chips" aria-label={t.constraintsLabel}>{t.constraints.map((chip) => <button type="button" key={chip.value} className={constraint === chip.value ? "selected" : ""} aria-pressed={constraint === chip.value} onClick={() => onConstraint(chip.value)}>{chip.label}</button>)}</div>
      <label className="context-field"><span>{t.noteLabel}</span><textarea value={note} onChange={(event) => onNoteChange(event.target.value)} placeholder={t.notePlaceholder} /></label>
      <p className="fallback-note"><Icon name="spark" /> {t.fallback}</p>
      {processing ? <div className="processing-state" role="status"><span /><div><strong>{t.processingTitle}</strong><p>{t.processingCopy}</p></div></div> : <div className="context-actions"><button className="primary-action" type="button" onClick={onSubmit}>{t.submit} <Icon name="arrow" /></button><button className="quiet-action" type="button" onClick={onSkip}>{t.skip}</button></div>}
    </div>
  </section>;
}

function PlanItem({ block }: { block: PlanBlock }) {
  return <li className={`plan-item ${block.kind}`}>
    <span className="plan-dot">{block.kind === "anchor" ? <Icon name="lock" /> : null}</span>
    <time>{block.time}{block.endTime ? <small>– {block.endTime}</small> : null}</time>
    <article><div><strong>{block.title}</strong><span>{block.tag}</span></div><p>{block.meta}</p></article>
  </li>;
}

function RecoveryPlanView({ locale, t, variant, constraint, note, flowing, accepted, onLessWalking, onMoreActive, onAccept, onReplay, onOpenNearby }: {
  locale: Locale; t: UiCopy; variant: PlanVariant; constraint: Constraint | null; note: string; flowing: boolean; accepted: boolean; onLessWalking: () => void; onMoreActive: () => void; onAccept: () => void; onReplay: () => void; onOpenNearby: () => void;
}) {
  const plan = tripData[locale].plans[variant];
  const trimmedNote = note.trim();
  const stateReason = variant === "less" && constraint === "tired"
    ? locale === "zh"
      ? "你现在有点累，所以这次没有再补一个大型景点，而是把步行缩短到 380 米，多留 30 分钟休息。18:30 的晚餐不变。"
      : "You feel a little tired, so this avoids another major sight, cuts the walk to 380 metres, and adds 30 minutes of rest. Dinner stays at 18:30."
    : variant === "less" && constraint === "less"
      ? locale === "zh"
        ? "你不想走太远，所以这次优先选了近距离、可以坐下的安排。步行缩短到 380 米，18:30 的晚餐不变。"
        : "You do not want to go far, so this keeps the stop close and mostly seated. Walking drops to 380 metres and dinner stays at 18:30."
      : plan.reason;
  const contextualReason = trimmedNote
    ? locale === "zh"
      ? `你补充了“${trimmedNote.slice(0, 24)}${trimmedNote.length > 24 ? "…" : ""}”。${stateReason}`
      : `You added “${trimmedNote.slice(0, 42)}${trimmedNote.length > 42 ? "…" : ""}”. ${stateReason}`
    : stateReason;
  return <section className={`app-screen plan-screen variant-${variant} ${flowing ? "flowing" : ""}`} aria-labelledby="plan-title">
    <div className="plan-heading"><div><p className="eyebrow">{t.resultEyebrow}</p><h2 id="plan-title">{t.resultTitle}</h2></div><span className="anchor-lock"><Icon name="lock" /> {t.anchorLocked}</span></div>
    <p className="plan-summary">{plan.summary}</p>
    <div className="plan-context-row"><div className="plan-metric"><Icon name="walk" /><span>{plan.walking}</span><i>·</i><span>{plan.buffer}</span></div><button className="spatial-link" type="button" onClick={onOpenNearby}>{t.viewOnMap} <Icon name="arrow" /></button></div>
    <ol className="recovery-timeline" aria-live="polite">{plan.blocks.map((block) => <PlanItem key={`${variant}-${block.id}`} block={block} />)}</ol>
    <div className="why-card"><span><Icon name="spark" /></span><div><p><strong>{t.why}</strong>{contextualReason}</p><div className="decision-evidence"><b>{t.evidenceLabel}</b>{plan.evidence.map((item) => <i key={item}>{item}</i>)}</div></div></div>
    <div className="steer-actions"><button type="button" onClick={onMoreActive}>{t.moreActive}</button><button type="button" className={variant === "less" ? "selected" : ""} onClick={onLessWalking}>{t.lessWalking}</button><button type="button" className="accept-action" onClick={onAccept}>{t.keepThis}</button></div>
    {accepted ? <div className="accepted-toast" role="status"><Icon name="check" /><span>{t.accepted}</span><button type="button" onClick={onReplay}>{t.replay}</button></div> : null}
  </section>;
}

function NearbyScreen({ t, selected, onSelect }: { t: UiCopy; selected: string | null; onSelect: (id: string) => void }) {
  return <section className="app-screen nearby-screen" aria-labelledby="nearby-title">
    <div className="screen-intro nearby-intro"><p className="eyebrow">{t.nearbyEyebrow}</p><h2 id="nearby-title">{t.nearbyTitle}</h2><p>{t.nearbySubtitle}</p></div>
    <div className="nearby-anchor"><span><Icon name="lock" /></span><div><strong>{t.nearbyAnchor}</strong><p>{t.nearbyTime}</p></div></div>
    <div className="mock-map" aria-label={t.nearbyHint}>
      <i className="street street-one" /><i className="street street-two" /><i className="street street-three" />
      <svg className="route-line" viewBox="0 0 340 160" preserveAspectRatio="none" aria-hidden="true"><path d="M54 121 C90 96 118 116 151 88 S218 68 291 30" /></svg>
      <div className="map-point current-point"><span /><b>{t.youAreHere}</b></div>
      <div className="map-point dinner-point"><Icon name="lock" /><b>{t.dinnerPin}</b></div>
      <div className="candidate-pin pin-one">1</div><div className="candidate-pin pin-two">2</div><div className="candidate-pin pin-three">3</div>
      <div className="map-fit-label"><Icon name="spark" /> {t.bestFit}</div>
    </div>
    <p className="nearby-hint"><Icon name="spark" /> {t.nearbyHint}</p>
    <div className="nearby-list">
      {t.nearbyCandidates.map((candidate, index) => <article key={candidate.id} className={`nearby-card ${index === 0 ? "recommended" : ""} ${selected === candidate.id ? "chosen" : ""}`}>
        <span className="candidate-number">{index + 1}</span>
        <div className="candidate-copy"><div><strong>{candidate.name}</strong>{index === 0 ? <span>{t.bestFit}</span> : null}</div><p>{candidate.route}</p><small>{candidate.detail}</small><em>{t.goodNow}：{candidate.fit}</em></div>
        <button type="button" onClick={() => onSelect(candidate.id)}>{selected === candidate.id ? t.chosen : t.goHere}</button>
      </article>)}
    </div>
    {selected ? <div className="nearby-toast" role="status"><Icon name="check" /> {t.nearbyAccepted}</div> : null}
  </section>;
}

function LandmarkPreview({ landmarkId, compact = false }: { landmarkId: LandmarkId; compact?: boolean }) {
  return <div className={`cathedral-preview landmark-${landmarkId} ${compact ? "compact" : ""}`} aria-hidden="true">
    <span className="sun-disc" /><span className="cathedral-body" /><span className="cathedral-tower" /><span className="cathedral-spire" /><span className="cathedral-arch arch-one" /><span className="cathedral-arch arch-two" /><span className="cathedral-arch arch-three" />
  </div>;
}

function LensResult({ locale, landmarkId, t, narrative, onNarrative }: { locale: Locale; landmarkId: LandmarkId; t: UiCopy; narrative: LandmarkNarrative; onNarrative: (narrative: LandmarkNarrative) => void }) {
  const landmark = landmarks[landmarkId].content[locale];
  const guide = landmark.narratives[narrative];
  const [speaking, setSpeaking] = useState(false);

  useEffect(() => () => window.speechSynthesis?.cancel(), []);

  const toggleSpeech = () => {
    if (!("speechSynthesis" in window)) return;
    if (speaking) {
      window.speechSynthesis.cancel();
      setSpeaking(false);
      return;
    }
    const utterance = new SpeechSynthesisUtterance([guide.title, ...guide.paragraphs].join("。"));
    utterance.lang = locale === "zh" ? "zh-CN" : "en-US";
    utterance.rate = 0.94;
    utterance.onend = () => setSpeaking(false);
    utterance.onerror = () => setSpeaking(false);
    window.speechSynthesis.speak(utterance);
    setSpeaking(true);
  };

  const switchNarrative = (next: LandmarkNarrative) => {
    window.speechSynthesis?.cancel();
    setSpeaking(false);
    onNarrative(next);
  };

  return <section className="app-screen lens-result" aria-labelledby="lens-result-title">
    <div className="lens-result-heading"><LandmarkPreview landmarkId={landmarkId} compact /><div><p className="eyebrow">{t.lookingAt}</p><h2 id="lens-result-title">{landmark.name}</h2>{landmark.location ? <p className="landmark-location">{landmark.location}</p> : null}</div></div>
    <div className={`lens-story guide-${narrative}`} aria-live="polite"><p className="eyebrow">{narrative === "short" ? t.oneThing : guide.title}</p>{narrative === "short" ? <h3>{guide.title}</h3> : null}{guide.paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}{guide.sections?.map((section) => <section key={section.title}><strong>{section.title}</strong><p>{section.body}</p></section>)}{narrative === "short" && "speechSynthesis" in window ? <button className="speech-control" type="button" aria-pressed={speaking} onClick={toggleSpeech}>{speaking ? "■" : "▶"} {speaking ? (locale === "zh" ? "正在讲 · 点此停止" : "Playing · tap to stop") : "00:00 / 00:30"}</button> : null}</div>
    {narrative !== "detail" ? <div className="look-up-card"><span>↗</span><p><strong>{t.lookUp}</strong>{landmark.lookUp}</p></div> : null}
    <div className="lens-modes" aria-label={t.oneThing}>{t.lensModes.map((mode) => <button type="button" key={mode.id} className={narrative === mode.id ? "active" : ""} aria-pressed={narrative === mode.id} onClick={() => switchNarrative(mode.id)}>{mode.label}</button>)}</div>
  </section>;
}

function LensNotFound({ locale, t, onReset }: { locale: Locale; t: UiCopy; onReset: () => void }) {
  return <section className="app-screen lens-not-found" aria-labelledby="not-found-title">
    <div className="not-found-mark">?</div>
    <p className="eyebrow">{t.notFoundEyebrow}</p>
    <h2 id="not-found-title">{t.notFoundTitle}</h2>
    <p>{t.notFoundCopy}</p>
    <ul>{Object.values(landmarks).map((landmark) => <li key={landmark.id}>{landmark.content[locale].name}</li>)}</ul>
    <button type="button" onClick={onReset}>{t.tryAnother}</button>
  </section>;
}

function LensScreen({ locale, t, state, selectedLandmark, narrative, onCapture, onLookup, onNarrative, onReset }: { locale: Locale; t: UiCopy; state: LensState; selectedLandmark: LandmarkId | null; narrative: LandmarkNarrative; onCapture: () => void; onLookup: (query: string) => void; onNarrative: (narrative: LandmarkNarrative) => void; onReset: () => void }) {
  const [placeName, setPlaceName] = useState("");

  if (state === "result" && selectedLandmark) return <LensResult locale={locale} landmarkId={selectedLandmark} t={t} narrative={narrative} onNarrative={onNarrative} />;
  if (state === "notFound") return <LensNotFound locale={locale} t={t} onReset={onReset} />;

  return <section className="app-screen lens-screen" aria-labelledby="lens-title">
    <div className="screen-intro"><p className="eyebrow">{t.lensEyebrow}</p><h2 id="lens-title">{t.lensTitle}</h2><p>{t.lensQuestion}</p></div>
    <p className="lens-intro">{t.lensIntro}</p>
    <div className={`lens-capture ${state === "scanning" ? "scanning" : ""}`}>
      <LandmarkPreview landmarkId="sevilleCathedral" />
      <span className="focus-corner corner-one" /><span className="focus-corner corner-two" /><span className="focus-corner corner-three" /><span className="focus-corner corner-four" />
      {state === "scanning" ? <div className="recognition-state" role="status"><span /><strong>{t.scanning}</strong><p>{t.scanningHint}</p></div> : null}
    </div>
    <p className="lens-promise">{t.lensPromise}</p>
    <button className="capture-action" type="button" onClick={onCapture} disabled={state === "scanning"}><Icon name="camera" /> {t.capture}</button>
    <form className="place-lookup" onSubmit={(event) => { event.preventDefault(); onLookup(placeName); }}>
      <label><span className="sr-only">{t.placeInputLabel}</span><input value={placeName} onChange={(event) => setPlaceName(event.target.value)} placeholder={t.placeInputPlaceholder} /></label>
      <button type="submit" disabled={state === "scanning" || !placeName.trim()}>{t.placeLookup}</button>
    </form>
    <p className="place-example">{t.placeInputExample}</p>
  </section>;
}

function CaseIntro({ copy, locale, languageLabel, onLocaleChange }: { copy: CaseCopy; locale: Locale; languageLabel: string; onLocaleChange: (locale: Locale) => void }) {
  return <header className="case-intro">
    <div className="case-topline"><p>{copy.eyebrow}</p><LanguageToggle locale={locale} label={languageLabel} onChange={onLocaleChange} /></div>
    <h1>{copy.title}</h1>
    <ol className="case-scene">{copy.scene.map((item, index) => <li key={item}><span>{item}</span>{index < copy.scene.length - 1 ? <i>↓</i> : null}</li>)}</ol>
    <p className="case-setup">{copy.setup}</p>
    <p className="case-proposition">{copy.proposition}</p>
  </header>;
}

function SectionHeading({ kicker, title }: { kicker: string; title: string }) {
  return <><p className="case-kicker">{kicker}</p><h2>{title}</h2></>;
}

function CaseDetails({ copy }: { copy: CaseCopy }) {
  const { problem, insight, logic, interaction, lens, scope } = copy.sections;
  return <div className="case-details">
    <article className="case-section">
      <SectionHeading kicker={problem.kicker} title={problem.title} />
      <p>{problem.body}</p>
      <div className="cost-line">{problem.costs.map((cost, index) => <span key={cost}>{cost}{index < problem.costs.length - 1 ? <i>+</i> : null}</span>)}</div>
      <div className="gap-flow">{problem.flow.map((step, index) => <span key={step}>{step}{index < problem.flow.length - 1 ? <i>→</i> : null}</span>)}</div>
      <p className="case-conclusion">{problem.conclusion}</p>
    </article>

    <article className="case-section">
      <SectionHeading kicker={insight.kicker} title={insight.title} />
      <div className="insight-rows">{insight.rows.map(([source, layer, description]) => <div key={layer}><span>{source}</span><strong>{layer}</strong><p>{description}</p></div>)}</div>
      <p className="case-conclusion">{insight.conclusion}</p>
    </article>

    <article className="case-section">
      <SectionHeading kicker={logic.kicker} title={logic.title} />
      <p className="logic-formula">{logic.formula}</p>
      <dl className="logic-dimensions">{logic.dimensions.map(([term, definition]) => <div key={term}><dt>{term}</dt><dd>{definition}</dd></div>)}</dl>
      <div className="scenario-compare">{logic.scenarios.map(([name, state, move]) => <section key={name}><strong>{name}</strong><p>{state}</p><span>→</span><b>{move}</b></section>)}</div>
      <p className="case-conclusion">{logic.conclusion}</p>
    </article>

    <article className="case-section">
      <SectionHeading kicker={interaction.kicker} title={interaction.title} />
      <p>{interaction.body}</p>
      <div className="interaction-principles">{interaction.principles.map((principle) => <span key={principle}>{principle}</span>)}</div>
      <div className="fallback-note-case"><strong>{interaction.fallbackTitle}</strong><p>{interaction.fallback}</p></div>
    </article>

    <article className="case-section">
      <SectionHeading kicker={lens.kicker} title={lens.title} />
      <p>{lens.body}</p>
      <div className="guide-logic">{lens.rows.map(([label, value]) => <p key={label}><span>{label}</span><strong>{value}</strong></p>)}</div>
      <ul className="depth-list">{lens.depth.map((item) => <li key={item}>{item}</li>)}</ul>
    </article>

    <article className="case-section scope-section">
      <SectionHeading kicker={scope.kicker} title={scope.title} />
      <ol>{scope.items.map((item) => <li key={item}>{item}</li>)}</ol>
      <p>{scope.note}</p>
    </article>
  </div>;
}

export default function Home() {
  const [locale, setLocale] = useState<Locale>(getInitialLocale);
  const [activeTab, setActiveTab] = useState<AppTab>("trip");
  const [screen, setScreen] = useState<Screen>("live");
  const [note, setNote] = useState("");
  const [constraint, setConstraint] = useState<Constraint | null>(null);
  const [variant, setVariant] = useState<PlanVariant>("default");
  const [processing, setProcessing] = useState(false);
  const [flowing, setFlowing] = useState(false);
  const [accepted, setAccepted] = useState(false);
  const [nearbyChoice, setNearbyChoice] = useState<string | null>(null);
  const [lensState, setLensState] = useState<LensState>("idle");
  const [selectedLandmark, setSelectedLandmark] = useState<LandmarkId | null>(null);
  const [lensNarrative, setLensNarrative] = useState<LandmarkNarrative>("short");
  const timers = useRef<number[]>([]);
  const t = uiCopy[locale];
  const c = caseCopy[locale];

  useEffect(() => () => timers.current.forEach(window.clearTimeout), []);

  useEffect(() => {
    document.documentElement.lang = locale === "zh" ? "zh-CN" : "en";
    document.title = t.pageTitle;
    document.querySelector<HTMLMetaElement>('meta[name="description"]')?.setAttribute("content", t.pageDescription);
    try {
      window.localStorage.setItem(LANGUAGE_KEY, locale);
    } catch {
      // Language persistence is optional when storage is unavailable.
    }
  }, [locale, t.pageDescription, t.pageTitle]);

  const schedule = (callback: () => void, delay: number) => {
    const timer = window.setTimeout(callback, delay);
    timers.current.push(timer);
  };

  const replay = () => {
    timers.current.forEach(window.clearTimeout);
    timers.current = [];
    setScreen("live"); setNote(""); setConstraint(null); setVariant("default"); setProcessing(false); setFlowing(false); setAccepted(false);
  };

  const createPlan = (useContext: boolean) => {
    setProcessing(true); setAccepted(false);
    const nextVariant = useContext ? selectInitialPlan(constraint, note) : "default";
    schedule(() => { setVariant(nextVariant); setProcessing(false); setScreen("plan"); }, 720);
  };

  const steer = (nextVariant: PlanVariant) => {
    if (flowing || variant === nextVariant) return;
    setAccepted(false); setFlowing(true);
    schedule(() => setVariant(nextVariant), 210);
    schedule(() => setFlowing(false), 760);
  };

  const startLensRecognition = () => {
    if (lensState === "scanning") return;
    setSelectedLandmark("sevilleCathedral");
    setLensState("scanning");
    setLensNarrative("short");
    schedule(() => setLensState("result"), 820);
  };

  const lookUpLandmark = (query: string) => {
    const match = findLandmark(query);
    setLensNarrative("short");
    setSelectedLandmark(match?.id ?? null);
    setLensState(match ? "result" : "notFound");
  };

  const resetLens = () => {
    timers.current.forEach(window.clearTimeout);
    timers.current = [];
    setSelectedLandmark(null);
    setLensState("idle");
    setLensNarrative("short");
  };

  const goBack = () => {
    timers.current.forEach(window.clearTimeout);
    timers.current = [];
    if (activeTab === "lens") {
      setSelectedLandmark(null);
      setLensState("idle"); setLensNarrative("short");
      return;
    }
    setScreen(screen === "plan" ? "context" : "live");
    setProcessing(false); setFlowing(false); setAccepted(false);
  };

  const showBack = activeTab === "trip" ? screen !== "live" : activeTab === "lens" && lensState !== "idle";

  return <main className="case-page" data-locale={locale}>
    <CaseIntro copy={c} locale={locale} languageLabel={t.language} onLocaleChange={setLocale} />
    <section className="prototype-stage" aria-label={c.tryLabel}>
      <p className="prototype-label">{c.tryLabel} <span>↓</span></p>
      <div className="app-shell" aria-label={t.appName}>
        <div className="product-surface">
          <ProductHeader showBack={showBack} locale={locale} t={t} onBack={goBack} onLocaleChange={setLocale} />
          {activeTab === "trip" && screen === "live" ? <LiveItinerary locale={locale} t={t} onRepair={() => setScreen("context")} /> : null}
          {activeTab === "trip" && screen === "context" ? <ContextInput t={t} note={note} constraint={constraint} processing={processing} onNoteChange={setNote} onConstraint={(value) => setConstraint((current) => current === value ? null : value)} onSubmit={() => createPlan(true)} onSkip={() => createPlan(false)} /> : null}
          {activeTab === "trip" && screen === "plan" ? <RecoveryPlanView locale={locale} t={t} variant={variant} constraint={constraint} note={note} flowing={flowing} accepted={accepted} onLessWalking={() => steer("less")} onMoreActive={() => steer("active")} onAccept={() => setAccepted(true)} onReplay={replay} onOpenNearby={() => setActiveTab("nearby")} /> : null}
          {activeTab === "nearby" ? <NearbyScreen t={t} selected={nearbyChoice} onSelect={setNearbyChoice} /> : null}
          {activeTab === "lens" ? <LensScreen locale={locale} t={t} state={lensState} selectedLandmark={selectedLandmark} narrative={lensNarrative} onCapture={startLensRecognition} onLookup={lookUpLandmark} onNarrative={setLensNarrative} onReset={resetLens} /> : null}
          <BottomNavigation activeTab={activeTab} t={t} onChange={setActiveTab} />
        </div>
      </div>
    </section>
    <CaseDetails copy={c} />
  </main>;
}
