import { useEffect, useRef, useState, type ReactNode } from "react";
import { selectInitialPlan, tripData, type Constraint, type Locale, type PlanBlock, type PlanVariant } from "./mock-data";

type Screen = "live" | "context" | "plan";
type IconName = "arrow" | "check" | "lock" | "map" | "plan" | "search" | "spark" | "walk";

const LANGUAGE_KEY = "in-trip-decision-locale";

const uiCopy = {
  zh: {
    back: "返回",
    tripName: "塞维利亚之旅",
    tripDate: "12月24日 周二 · 第2天",
    step: (current: number) => `第 ${current} 步，共 3 步`,
    language: "切换语言",
    navLabel: "行程导航",
    nav: ["行程", "地图", "发现"],
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
    conceptLabel: "交互概念原型",
    storyKicker: "IN-TRIP DECISION",
    storyTitleTop: "旅途中，",
    storyTitleBottom: "只决定下一步。",
    storyLead: "计划有变时，只调整现在到下一个固定安排之间的空档。",
    storyDetail: "少输入。少解释。少选择。更快回到旅行本身。",
    principlesLabel: "产品原则",
    principles: [
      ["少输入", "说一句，也可以不说。"],
      ["少解释", "只说明为什么现在更合适。"],
      ["少选择", "先给一个可以走的下一步。"],
      ["回到旅途", "调整完，就继续出发。"],
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
    nav: ["Plan", "Map", "Explore"],
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
    conceptLabel: "Interactive concept demo",
    storyKicker: "IN-TRIP DECISION",
    storyTitleTop: "Decide what’s next,",
    storyTitleBottom: "not the whole trip.",
    storyLead: "When a plan breaks, repair only the gap before the next fixed stop.",
    storyDetail: "Less input. Less explanation. Fewer choices. Back to the trip.",
    principlesLabel: "Product principles",
    principles: [
      ["Less input", "Say one thing—or nothing."],
      ["Less explanation", "Explain only why it fits now."],
      ["Fewer choices", "Start with one workable next move."],
      ["Back to the trip", "Adjust, then keep moving."],
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
    check: <path d="m5 12 4 4L19 6" />,
    lock: <><rect width="16" height="12" x="4" y="10" rx="2" /><path d="M8 10V7a4 4 0 0 1 8 0v3" /></>,
    map: <><path d="m3 6 6-3 6 3 6-3v15l-6 3-6-3-6 3Z" /><path d="M9 3v15M15 6v15" /></>,
    plan: <><path d="M8 6h13M8 12h13M8 18h13" /><path d="M3 6h.01M3 12h.01M3 18h.01" /></>,
    search: <><circle cx="11" cy="11" r="7" /><path d="m20 20-4-4" /></>,
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

function ProductHeader({ screen, locale, t, onBack, onLocaleChange }: { screen: Screen; locale: Locale; t: UiCopy; onBack: () => void; onLocaleChange: (locale: Locale) => void }) {
  const currentStep = screen === "live" ? 1 : screen === "context" ? 2 : 3;
  return <header className="product-header">
    {screen === "live" ? <div className="icon-button" aria-hidden="true"><span className="monogram">ID</span></div> : <button className="icon-button" type="button" onClick={onBack} aria-label={t.back}><span className="back-glyph">←</span></button>}
    <div className="trip-heading"><span>{t.tripName}</span><strong>{t.tripDate}</strong></div>
    <div className="header-tools">
      <LanguageToggle locale={locale} label={t.language} onChange={onLocaleChange} />
      <div className="step-indicator" aria-label={t.step(currentStep)}>
        {(["live", "context", "plan"] as Screen[]).map((step) => <i key={step} className={step === screen ? "current" : ""} />)}
      </div>
    </div>
  </header>;
}

function BottomNavigation({ t }: { t: UiCopy }) {
  const icons: IconName[] = ["plan", "map", "search"];
  return <nav className="bottom-navigation" aria-label={t.navLabel}>
    {t.nav.map((item, index) => <span key={item} className={index === 0 ? "active" : ""}><Icon name={icons[index]} /><b>{item}</b></span>)}
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

function RecoveryPlanView({ locale, t, variant, flowing, accepted, onLessWalking, onMoreActive, onAccept, onReplay }: {
  locale: Locale; t: UiCopy; variant: PlanVariant; flowing: boolean; accepted: boolean; onLessWalking: () => void; onMoreActive: () => void; onAccept: () => void; onReplay: () => void;
}) {
  const plan = tripData[locale].plans[variant];
  return <section className={`app-screen plan-screen variant-${variant} ${flowing ? "flowing" : ""}`} aria-labelledby="plan-title">
    <div className="plan-heading"><div><p className="eyebrow">{t.resultEyebrow}</p><h2 id="plan-title">{t.resultTitle}</h2></div><span className="anchor-lock"><Icon name="lock" /> {t.anchorLocked}</span></div>
    <p className="plan-summary">{plan.summary}</p>
    <div className="plan-metric"><Icon name="walk" /><span>{plan.walking}</span><i>·</i><span>{plan.buffer}</span></div>
    <ol className="recovery-timeline" aria-live="polite">{plan.blocks.map((block) => <PlanItem key={`${variant}-${block.id}`} block={block} />)}</ol>
    <div className="why-card"><span><Icon name="spark" /></span><p><strong>{t.why}</strong>{plan.reason}</p></div>
    <div className="steer-actions"><button type="button" onClick={onMoreActive}>{t.moreActive}</button><button type="button" className={variant === "less" ? "selected" : ""} onClick={onLessWalking}>{t.lessWalking}</button><button type="button" className="accept-action" onClick={onAccept}>{t.keepThis}</button></div>
    {accepted ? <div className="accepted-toast" role="status"><Icon name="check" /><span>{t.accepted}</span><button type="button" onClick={onReplay}>{t.replay}</button></div> : null}
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
  const [screen, setScreen] = useState<Screen>("live");
  const [note, setNote] = useState("");
  const [constraint, setConstraint] = useState<Constraint | null>(null);
  const [variant, setVariant] = useState<PlanVariant>("default");
  const [processing, setProcessing] = useState(false);
  const [flowing, setFlowing] = useState(false);
  const [accepted, setAccepted] = useState(false);
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

  const goBack = () => {
    timers.current.forEach(window.clearTimeout);
    timers.current = [];
    setScreen(screen === "plan" ? "context" : "live");
    setProcessing(false); setFlowing(false); setAccepted(false);
  };

  return <main className="release-page" data-locale={locale}>
    <ProductStory t={t} />
    <section className="device-stage" aria-label={t.prototypeAria}>
      <div className="device-frame">
        <div className="device-island" aria-hidden="true" />
        <div className="status-bar"><span>16:05</span><span>● ◒ ▰</span></div>
        <div className="product-surface">
          <ProductHeader screen={screen} locale={locale} t={t} onBack={goBack} onLocaleChange={setLocale} />
          {screen === "live" ? <LiveItinerary locale={locale} t={t} onRepair={() => setScreen("context")} /> : null}
          {screen === "context" ? <ContextInput t={t} note={note} constraint={constraint} processing={processing} onNoteChange={setNote} onConstraint={(value) => setConstraint((current) => current === value ? null : value)} onSubmit={() => createPlan(true)} onSkip={() => createPlan(false)} /> : null}
          {screen === "plan" ? <RecoveryPlanView locale={locale} t={t} variant={variant} flowing={flowing} accepted={accepted} onLessWalking={() => steer("less")} onMoreActive={() => steer("active")} onAccept={() => setAccepted(true)} onReplay={replay} /> : null}
          <BottomNavigation t={t} />
        </div>
      </div>
      <p className="mobile-disclosure">{t.prototypeDisclosure}</p>
    </section>
  </main>;
}
