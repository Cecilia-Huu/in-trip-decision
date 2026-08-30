import { useEffect, useRef, useState, type ReactNode } from "react";
import { findLandmark, landmarks, selectInitialPlan, tripData, type Constraint, type LandmarkId, type LandmarkNarrative, type Locale, type PlanBlock, type PlanVariant } from "./mock-data";

type Screen = "live" | "context" | "plan";
type AppTab = "trip" | "nearby" | "lens";
type LensState = "idle" | "scanning" | "result" | "notFound";
type IconName = "arrow" | "camera" | "check" | "lock" | "map" | "plan" | "spark" | "walk";

const LANGUAGE_KEY = "in-trip-decision-locale";

const uiCopy = {
  zh: {
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
    contextEyebrow: "现在",
    contextTitle: "想怎么调整？",
    contextCopy: "说一句现在的情况，也可以直接继续。",
    noteLabel: "可以说一句现在的情况",
    notePlaceholder: "有点累，不想再走太远。",
    constraintsLabel: "当前状态",
    constraints: [
      { value: "less" as const, label: "少走一点" },
      { value: "explore" as const, label: "还想继续逛" },
      { value: "decide" as const, label: "随便帮我安排" },
    ],
    fallback: "不说也可以，我会先按少绕路、不赶场来安排。",
    submit: "看看接下来怎么走",
    skip: "不补充，直接继续",
    processingTitle: "正在保留 18:30 晚餐…",
    processingCopy: "只调整中间空出的这一段。",
    resultEyebrow: "调整后的行程",
    resultTitle: "接下来这样走",
    anchorLocked: "18:30 晚餐保留",
    why: "为什么这样改？",
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
      { id: "detail" as const, label: "我想听详细一点" },
    ],
    lensBack: "重新识景",
    notFoundEyebrow: "识景范围",
    notFoundTitle: "还没认出来",
    notFoundCopy: "当前 Demo 先支持：",
    tryAnother: "换一个景点",
    conceptLabel: "交互概念原型",
    storyKicker: "IN-TRIP DECISION",
    storyTitleTop: "计划变了，",
    storyTitleBottom: "就从下一步开始。",
    storyLead: "不用把整趟旅行想明白，先决定下一步。",
    storyDetail: "轻一点，松一点，走着看也没关系。",
    principlesLabel: "旅途中三个片刻",
    principles: [
      ["计划有变", "只调整眼前这一段。"],
      ["顺路就好", "不为最近的地方绕远。"],
      ["看到什么", "当下就能听懂。"],
      ["继续旅行", "少看屏幕，多看身边。"],
    ],
    prototypeNote: "使用模拟的塞维利亚行程与本地交互状态，用于展示产品交互逻辑。",
    prototypeDisclosure: "概念原型 · 模拟行程数据",
    prototypeAria: "In-trip Decision 交互原型",
    pageTitle: "In-trip Decision · 旅途中，只决定下一步",
    pageDescription: "当旅行计划临时变化，只调整现在到下一个固定安排之间的空档。",
  },
  en: {
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
    contextEyebrow: "Right now",
    contextTitle: "What changed?",
    contextCopy: "Tell me in one sentence—or continue without it.",
    noteLabel: "Tell me what matters right now",
    notePlaceholder: "My feet hurt, but I still want to explore.",
    constraintsLabel: "Quick constraints",
    constraints: [
      { value: "less" as const, label: "Less walking" },
      { value: "explore" as const, label: "Still want to explore" },
      { value: "decide" as const, label: "Decide for me" },
    ],
    fallback: "No answer needed. I’ll keep it easy and avoid rushing.",
    submit: "Adjust what’s next",
    skip: "Continue without input",
    processingTitle: "Keeping your 18:30 dinner…",
    processingCopy: "Only the open gap will change.",
    resultEyebrow: "Updated plan",
    resultTitle: "I adjusted what’s next.",
    anchorLocked: "18:30 dinner kept",
    why: "Why this change?",
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
    conceptLabel: "Interactive concept demo",
    storyKicker: "IN-TRIP DECISION",
    storyTitleTop: "Plans changed?",
    storyTitleBottom: "Start with what’s next.",
    storyLead: "You don’t need to figure out the whole trip. Just decide the next step.",
    storyDetail: "Keep it light. Keep moving. See what happens.",
    principlesLabel: "Three in-trip moments",
    principles: [
      ["Plans change", "Repair only this part."],
      ["On the way", "Choose the route, not the nearest."],
      ["What’s that?", "Understand what’s in front of you."],
      ["Keep travelling", "Less screen, more place."],
    ],
    prototypeNote: "Mocked Seville context with client-side state orchestration to demonstrate the interaction model.",
    prototypeDisclosure: "Concept prototype · mocked context",
    prototypeAria: "In-trip Decision interactive prototype",
    pageTitle: "In-trip Decision · Decide what’s next",
    pageDescription: "When travel plans change, repair only the gap before the next fixed stop.",
  },
} as const;

type UiCopy = (typeof uiCopy)[Locale];

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

function ProductHeader({ activeTab, screen, showBack, locale, t, onBack, onLocaleChange }: { activeTab: AppTab; screen: Screen; showBack: boolean; locale: Locale; t: UiCopy; onBack: () => void; onLocaleChange: (locale: Locale) => void }) {
  const currentStep = screen === "live" ? 1 : screen === "context" ? 2 : 3;
  return <header className="product-header">
    {showBack ? <button className="icon-button" type="button" onClick={onBack} aria-label={t.back}><span className="back-glyph">←</span></button> : <div className="icon-button" aria-hidden="true"><span className="monogram">ID</span></div>}
    <div className="trip-heading"><span>{t.tripName}</span><strong>{t.tripDate}</strong></div>
    <div className="header-tools">
      <LanguageToggle locale={locale} label={t.language} onChange={onLocaleChange} />
      {activeTab === "trip" ? <div className="step-indicator" aria-label={t.step(currentStep)}>
        {(["live", "context", "plan"] as Screen[]).map((step) => <i key={step} className={step === screen ? "current" : ""} />)}
      </div> : null}
    </div>
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
        <article><div><strong>{stop.title}</strong>{stop.status === "anchor" ? <span className="tiny-lock"><Icon name="lock" /> {t.fixed}</span> : null}</div><p>{stop.meta}</p></article>
        {index === 0 ? <div className="travel-connector"><Icon name="walk" /> {t.firstWalk}</div> : null}
        {index === 1 ? <div className="travel-connector gap"><span>{t.openGap}</span></div> : null}
      </li>)}
    </ol>
    <aside className="recovery-prompt">
      <div className="prompt-icon"><Icon name="spark" /></div>
      <div><strong>{t.triggerTitle}</strong><p>{t.triggerCopy}</p></div>
      <button type="button" onClick={onRepair}>{t.triggerAction} <Icon name="arrow" /></button>
    </aside>
  </section>;
}

function ContextInput({ t, note, constraint, processing, onNoteChange, onConstraint, onSubmit, onSkip }: {
  t: UiCopy; note: string; constraint: Constraint | null; processing: boolean; onNoteChange: (value: string) => void; onConstraint: (value: Constraint) => void; onSubmit: () => void; onSkip: () => void;
}) {
  return <section className="app-screen context-screen" aria-labelledby="context-title">
    <div className="gap-summary"><span>16:05</span><div><b>{t.gapClosed}</b><i>→</i><b>{t.gapDinner}</b></div></div>
    <div className="context-sheet">
      <p className="eyebrow">{t.contextEyebrow}</p><h2 id="context-title">{t.contextTitle}</h2><p className="sheet-copy">{t.contextCopy}</p>
      <label className="context-field"><span className="sr-only">{t.noteLabel}</span><textarea value={note} onChange={(event) => onNoteChange(event.target.value)} placeholder={t.notePlaceholder} /></label>
      <div className="constraint-chips" aria-label={t.constraintsLabel}>{t.constraints.map((chip) => <button type="button" key={chip.value} className={constraint === chip.value ? "selected" : ""} aria-pressed={constraint === chip.value} onClick={() => onConstraint(chip.value)}>{chip.label}</button>)}</div>
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

function RecoveryPlanView({ locale, t, variant, flowing, accepted, onLessWalking, onMoreActive, onAccept, onReplay, onOpenNearby }: {
  locale: Locale; t: UiCopy; variant: PlanVariant; flowing: boolean; accepted: boolean; onLessWalking: () => void; onMoreActive: () => void; onAccept: () => void; onReplay: () => void; onOpenNearby: () => void;
}) {
  const plan = tripData[locale].plans[variant];
  return <section className={`app-screen plan-screen variant-${variant} ${flowing ? "flowing" : ""}`} aria-labelledby="plan-title">
    <div className="plan-heading"><div><p className="eyebrow">{t.resultEyebrow}</p><h2 id="plan-title">{t.resultTitle}</h2></div><span className="anchor-lock"><Icon name="lock" /> {t.anchorLocked}</span></div>
    <p className="plan-summary">{plan.summary}</p>
    <div className="plan-context-row"><div className="plan-metric"><Icon name="walk" /><span>{plan.walking}</span><i>·</i><span>{plan.buffer}</span></div><button className="spatial-link" type="button" onClick={onOpenNearby}>{t.viewOnMap} <Icon name="arrow" /></button></div>
    <ol className="recovery-timeline" aria-live="polite">{plan.blocks.map((block) => <PlanItem key={`${variant}-${block.id}`} block={block} />)}</ol>
    <div className="why-card"><span><Icon name="spark" /></span><p><strong>{t.why}</strong>{plan.reason}</p></div>
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
  return <section className="app-screen lens-result" aria-labelledby="lens-result-title">
    <div className="lens-result-heading"><LandmarkPreview landmarkId={landmarkId} compact /><div><p className="eyebrow">{t.lookingAt}</p><h2 id="lens-result-title">{landmark.name}</h2>{landmark.location ? <p className="landmark-location">{landmark.location}</p> : null}</div></div>
    <div className="lens-story primary-story"><p className="eyebrow">{t.oneThing}</p><p>{landmark.narratives[narrative]}</p></div>
    <div className="look-up-card"><span>↗</span><p><strong>{t.lookUp}</strong>{landmark.lookUp}</p></div>
    <div className="lens-modes" aria-label={t.oneThing}>{t.lensModes.map((mode) => <button type="button" key={mode.id} className={narrative === mode.id ? "active" : ""} aria-pressed={narrative === mode.id} onClick={() => onNarrative(mode.id)}>{mode.label}</button>)}</div>
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

function ProductStory({ t }: { t: UiCopy }) {
  return <aside className="product-story">
    <div className="concept-label"><span /> {t.conceptLabel}</div>
    <p className="story-kicker">{t.storyKicker}</p>
    <h1>{t.storyTitleTop}<br /><em>{t.storyTitleBottom}</em></h1>
    <p className="story-lead">{t.storyLead}</p>
    <p className="story-cn">{t.storyDetail}</p>
    <ul className="principles" aria-label={t.principlesLabel}>
      {t.principles.map((principle, index) => <li key={principle[0]}><span>{String(index + 1).padStart(2, "0")}</span><div><strong>{principle[0]}</strong><p>{principle[1]}</p></div></li>)}
    </ul>
    <p className="prototype-note">{t.prototypeNote}</p>
  </aside>;
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

  return <main className="release-page" data-locale={locale}>
    <ProductStory t={t} />
    <section className="device-stage" aria-label={t.prototypeAria}>
      <div className="device-frame">
        <div className="device-island" aria-hidden="true" />
        <div className="status-bar"><span>16:05</span><span>● ◒ ▰</span></div>
        <div className="product-surface">
          <ProductHeader activeTab={activeTab} screen={screen} showBack={showBack} locale={locale} t={t} onBack={goBack} onLocaleChange={setLocale} />
          {activeTab === "trip" && screen === "live" ? <LiveItinerary locale={locale} t={t} onRepair={() => setScreen("context")} /> : null}
          {activeTab === "trip" && screen === "context" ? <ContextInput t={t} note={note} constraint={constraint} processing={processing} onNoteChange={setNote} onConstraint={(value) => setConstraint((current) => current === value ? null : value)} onSubmit={() => createPlan(true)} onSkip={() => createPlan(false)} /> : null}
          {activeTab === "trip" && screen === "plan" ? <RecoveryPlanView locale={locale} t={t} variant={variant} flowing={flowing} accepted={accepted} onLessWalking={() => steer("less")} onMoreActive={() => steer("active")} onAccept={() => setAccepted(true)} onReplay={replay} onOpenNearby={() => setActiveTab("nearby")} /> : null}
          {activeTab === "nearby" ? <NearbyScreen t={t} selected={nearbyChoice} onSelect={setNearbyChoice} /> : null}
          {activeTab === "lens" ? <LensScreen locale={locale} t={t} state={lensState} selectedLandmark={selectedLandmark} narrative={lensNarrative} onCapture={startLensRecognition} onLookup={lookUpLandmark} onNarrative={setLensNarrative} onReset={resetLens} /> : null}
          <BottomNavigation activeTab={activeTab} t={t} onChange={setActiveTab} />
        </div>
      </div>
      <p className="mobile-disclosure">{t.prototypeDisclosure}</p>
    </section>
  </main>;
}
