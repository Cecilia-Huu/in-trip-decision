import { useEffect, useRef, useState, type FormEvent, type ReactNode } from "react";
import { createMapLinks, localDecisionEngine, parseSteeringText, readCurrentClock, type Steering, type DecisionContext, type DecisionResult, type DecisionStep } from "./decision-engine";
import { Goose, GooseProcessing } from "./goose-state";
import { DecisionForm } from "./progressive-context";
import { findLandmark, landmarks, type LandmarkId, type LandmarkNarrative, type Locale } from "./mock-data";
import { VoiceInput } from "./voice-input";

type AppTab = "decision" | "lens";
type DecisionScreen = "form" | "result";
type LensState = "idle" | "result" | "notFound";
type IconName = "arrow" | "check" | "compass" | "lens" | "lock" | "spark";
type MapProvider = "apple" | "google" | "amap";

const LANGUAGE_KEY = "in-trip-decision-locale";
const MAP_KEY = "in-trip-decision-map";
const MAP_LABELS: Record<MapProvider, string> = { apple: "Apple Maps", google: "Google Maps", amap: "高德地图" };

const copy = {
  zh: {
    appName: "Goose On", language: "切换语言", back: "返回", navLabel: "主导航",
    nav: [{ id: "decision" as const, label: "下一步" }, { id: "lens" as const, label: "识景 Beta" }],
    headline: "旅途决策", intro: "说说现在的情况。",
    changeLabel: "发生什么了？", changePlaceholder: "比如：博物馆关了。",
    changeChips: ["原计划去不了了", "临时多出时间", "现在有点累", "不想继续原计划"],
    placeLabel: "你现在大概在哪？", placePlaceholder: "例如：米兰大教堂",
    anchorLabel: "接下来有固定安排吗？", anchorOptional: "可选", anchorNone: "没有固定安排", anchorAdd: "添加固定安排", anchorRemove: "移除固定安排", anchorTime: "时间", anchorTimePlaceholder: "19:00", anchorPlace: "地点 / 安排名称", anchorPlacePlaceholder: "例如：Navigli 晚餐",
    stateLabel: "现在呢？", stateOptional: "可以不选",
    states: [{ id: "tired" as const, label: "有点累" }, { id: "lessWalking" as const, label: "不想走太远" }, { id: "explore" as const, label: "还想继续逛" }, { id: "spontaneous" as const, label: "想随性一点" }],
    submit: "决定下一步", continue: "继续", requiredChange: "先告诉我发生了什么。", requiredPlace: "还需要一个大概位置。", incompleteAnchor: "固定安排的时间和名称需要一起填写。", clarify: "还差一个信息",
    suggestion: "为你建议", now: "现在", timeBasis: "基于你当前的时间", why: "为什么这样安排？", steer: "想改一下？", adjustLoading: "我再帮你想想。",
    steerOptions: [{ id: "lessWalking" as const, label: "少走一点" }, { id: "explore" as const, label: "我还想逛" }, { id: "spontaneous" as const, label: "换个感觉" }],
    steerPlaceholder: "比如：我其实还想逛，但不想走太远……", steerSubmit: "重新调整", mapTitle: "在地图中打开", mapCopy: "选择一次，下次会直接打开：", mapClose: "关闭", changeMap: "换地图", edit: "修改刚才的信息",
    lensTitle: "识景 Beta", lensIntro: "输入眼前的景点名称，先听刚好够用的那一段。", lensLimit: "Beta 当前支持有限地点", lensLabel: "景点名称", lensPlaceholder: "例如：米兰大教堂", lensSubmit: "讲给我听", lensTry: "当前支持",
    lookingAt: "你正在看", oneThing: "先知道这一件事就够了", lookUp: "抬头找找 👀",
    modes: [{ id: "short" as const, label: "30 秒讲完" }, { id: "story" as const, label: "讲个有意思的故事" }, { id: "detail" as const, label: "详细一点" }],
    another: "换一个景点", notFound: "这个地点目前还没有收录", notFoundCopy: "Beta 当前支持米兰大教堂、塞维利亚大教堂和圣家堂。",
    pageTitle: "Goose On · In-trip Decision", pageDescription: "旅行正在进行时，只决定接下来 1–3 小时怎么过。",
  },
  en: {
    appName: "Goose On", language: "Switch language", back: "Back", navLabel: "Main navigation",
    nav: [{ id: "decision" as const, label: "Next move" }, { id: "lens" as const, label: "Lens Beta" }],
    headline: "Trip decision", intro: "Tell me what is happening now.",
    changeLabel: "What changed?", changePlaceholder: "For example: The museum is closed.",
    changeChips: ["Original plan fell through", "Unexpected free time", "I feel tired", "I want a different plan"],
    placeLabel: "Roughly where are you?", placePlaceholder: "For example: Milan Cathedral",
    anchorLabel: "Any fixed plan next?", anchorOptional: "Optional", anchorNone: "No fixed plan", anchorAdd: "Add a fixed plan", anchorRemove: "Remove fixed plan", anchorTime: "Time", anchorTimePlaceholder: "19:00", anchorPlace: "Place / plan", anchorPlacePlaceholder: "For example: Dinner in Navigli",
    stateLabel: "How are you now?", stateOptional: "Optional",
    states: [{ id: "tired" as const, label: "A little tired" }, { id: "lessWalking" as const, label: "Less walking" }, { id: "explore" as const, label: "Still want to explore" }, { id: "spontaneous" as const, label: "Keep it spontaneous" }],
    submit: "Decide what’s next", continue: "Continue", requiredChange: "Tell me what changed first.", requiredPlace: "Add your rough location.", incompleteAnchor: "Add both the time and name of the fixed plan.", clarify: "One detail missing",
    suggestion: "For you", now: "Now", timeBasis: "Based on your current time", why: "Why this plan?", steer: "Want to adjust it?", adjustLoading: "Let me rethink that.",
    steerOptions: [{ id: "lessWalking" as const, label: "Less walking" }, { id: "explore" as const, label: "I want to explore" }, { id: "spontaneous" as const, label: "Change the feel" }],
    steerPlaceholder: "For example: I still want to explore, but not walk far…", steerSubmit: "Readjust", mapTitle: "Open in Maps", mapCopy: "Choose once; next time it opens directly:", mapClose: "Close", changeMap: "Change map", edit: "Edit context",
    lensTitle: "Lens Beta", lensIntro: "Enter the landmark in front of you for an explanation that is just long enough.", lensLimit: "Beta currently supports a limited set of places", lensLabel: "Landmark name", lensPlaceholder: "For example: Milan Cathedral", lensSubmit: "Tell me about it", lensTry: "Currently supported",
    lookingAt: "You’re looking at", oneThing: "One thing worth knowing", lookUp: "Look up 👀",
    modes: [{ id: "short" as const, label: "30-second version" }, { id: "story" as const, label: "Tell me a story" }, { id: "detail" as const, label: "A little more detail" }],
    another: "Try another place", notFound: "This place is not included yet", notFoundCopy: "The Beta currently supports Milan Cathedral, Seville Cathedral, and Sagrada Família.",
    pageTitle: "Goose On · In-trip Decision", pageDescription: "When travel changes, decide only how to spend the next one to three hours.",
  },
} as const;

function getInitialLocale(): Locale {
  try { return window.localStorage.getItem(LANGUAGE_KEY) === "en" ? "en" : "zh"; } catch { return "zh"; }
}

function getInitialPreferredMap(): MapProvider | null {
  try {
    const saved = window.localStorage.getItem(MAP_KEY);
    return saved === "apple" || saved === "google" || saved === "amap" ? saved : null;
  } catch { return null; }
}

function Icon({ name }: { name: IconName }) {
  const paths: Record<IconName, ReactNode> = {
    arrow: <><path d="M5 12h14" /><path d="m14 7 5 5-5 5" /></>,
    check: <path d="m5 12 4 4L19 6" />,
    compass: <><circle cx="12" cy="12" r="9" /><path d="m15.5 8.5-2 5-5 2 2-5Z" /></>,
    lens: <><circle cx="10.5" cy="10.5" r="6.5" /><path d="m15.5 15.5 4 4" /></>,
    lock: <><rect width="16" height="12" x="4" y="10" rx="2" /><path d="M8 10V7a4 4 0 0 1 8 0v3" /></>,
    spark: <><path d="m12 3-1.7 4.3L6 9l4.3 1.7L12 15l1.7-4.3L18 9l-4.3-1.7Z" /><path d="m5 15-.8 2.2L2 18l2.2.8L5 21l.8-2.2L8 18l-2.2-.8Z" /></>,
  };
  return <svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">{paths[name]}</svg>;
}

function Header({ locale, showBack, onBack, onLocale }: { locale: Locale; showBack: boolean; onBack: () => void; onLocale: (locale: Locale) => void }) {
  const t = copy[locale];
  return <header className="product-header">
    {showBack ? <button className="back-button" type="button" onClick={onBack} aria-label={t.back}>←</button> : <span className="header-spacer" />}
    <strong><img src={import.meta.env.BASE_URL + "assets/goose-logo.svg"} alt="" width="30" height="30" /><span>{t.appName}</span></strong>
    <div className="language-toggle" role="group" aria-label={t.language}><button type="button" className={locale === "zh" ? "active" : ""} onClick={() => onLocale("zh")} aria-pressed={locale === "zh"}>中</button><span>|</span><button type="button" className={locale === "en" ? "active" : ""} onClick={() => onLocale("en")} aria-pressed={locale === "en"}>EN</button></div>
  </header>;
}

function resultPresentation(result: DecisionResult, context: DecisionContext, locale: Locale) {
  const zh = locale === "zh";
  const timeNeedsChecking = /不超过一小时|已过|不能确定|At most an hour|clock is past|does not establish/i.test(result.summary);
  if (timeNeedsChecking) return {
    title: result.title,
    summary: result.summary,
    goose: zh ? "先核对一下时间和路线。" : "Check the time and route first.",
  };
  const sleeping = /睡|sleep/i.test(result.title);
  if (sleeping) return {
    title: zh ? "先睡一会儿，醒来再决定。" : "Rest first. Decide when you wake.",
    summary: zh ? "这一段先不塞进新安排，醒来再看状态。" : "Leave this part of the day open and check in after you wake.",
    goose: zh ? "先歇一下，一会儿再出发吧。" : "Rest first. You can head out later.",
  };
  if (result.strategy === "explore") return {
    title: context.lessWalking || /不想走远|少走|stay close/i.test(result.why) ? (zh ? "就在附近，轻轻逛一段。" : "Keep it close and explore lightly.") : (zh ? "先轻逛一段，再看下一步。" : "Explore lightly, then see what’s next."),
    summary: zh ? "不跨区，也不追加新的大型景点。" : "Stay in this area and skip another major sight.",
    goose: zh ? "不着急，我们就近走走。" : "No rush. Keep it nearby.",
  };
  if (result.strategy === "flexible") return {
    title: zh ? "换到室内，慢下来。" : "Move indoors and slow down.",
    summary: zh ? "先放下景点清单，给这一段换个节奏。" : "Put the sightseeing list aside and change the pace.",
    goose: zh ? "换个节奏，也很好。" : "A change of pace works too.",
  };
  return {
    title: context.nextAnchor ? (zh ? "先坐一会儿，再去下一站。" : "Sit for a while, then head to the next stop.") : (zh ? "先坐一会儿，再轻逛。" : "Sit for a while, then wander nearby."),
    summary: zh ? "今天不再补大型景点，把这一段过得轻一点。" : "Skip another major sight and keep this part of the day light.",
    goose: zh ? "先休息一下，一会儿再出发吧。" : "Take a breather. You can head out soon.",
  };
}

function stepIcon(step: DecisionStep) {
  if (step.anchor) return "🔒";
  const value = `${step.category ?? ""} ${step.map?.query ?? ""}`;
  if (/咖啡|面包|café|bak|cafe/i.test(value)) return "☕";
  if (/室内|商场|indoor|mall/i.test(value)) return "🏬";
  if (/公园|街区|小店|park|street|shop/i.test(value)) return "🌳";
  return "•";
}


function DecisionView({ locale, context, result, onSteer, onEdit }: { locale: Locale; context: DecisionContext; result: DecisionResult; onSteer: (state: Steering) => void; onEdit: () => void }) {
  const t = copy[locale];
  const [mapAction, setMapAction] = useState<NonNullable<DecisionStep["map"]> | null>(null);
  const [preferredMap, setPreferredMap] = useState<MapProvider | null>(getInitialPreferredMap);
  const [steerText, setSteerText] = useState("");
  const [pending, setPending] = useState<Steering | null>(null);
  const [steerError, setSteerError] = useState("");
  const screen = useRef<HTMLElement>(null);
  const mapLinks = mapAction ? createMapLinks(mapAction.query, mapAction.mode, mapAction.center) : [];
  const presentation = resultPresentation(result, context, locale);
  const visibleEvidence = result.evidence.filter((item) => item !== context.currentPlace && item !== "已获取当前位置" && item !== "Current location received").slice(0, 3);
  if (result.strategy === "conservative" && visibleEvidence.length < 3) visibleEvidence.push(locale === "zh" ? "降低移动成本 · 推测" : "Lower movement cost · inferred");
  const submitSteer = (event: FormEvent) => {
    event.preventDefault();
    const parsed = parseSteeringText(steerText);
    if (!parsed) { setSteerError(locale === "zh" ? "这句话暂时还没理解。可以说说想多逛、少走，或换成室内。" : "Try describing more exploring, less walking, or staying indoors."); return; }
    setSteerError(""); setPending(parsed);
  };
  const openMap = (action: NonNullable<DecisionStep["map"]>) => {
    if (!preferredMap) return setMapAction(action);
    const link = createMapLinks(action.query, action.mode, action.center).find((item) => item.id === preferredMap);
    if (!link) return setMapAction(action);
    if (link) window.open(link.href, "_blank", "noopener,noreferrer");
  };
  const rememberMap = (provider: MapProvider) => {
    setPreferredMap(provider);
    try { window.localStorage.setItem(MAP_KEY, provider); } catch { /* Preference persistence is optional. */ }
  };
  return <section ref={screen} className="decision-result app-screen" aria-live="polite" aria-busy={Boolean(pending)}>
    <div className="result-goose"><Goose resting /><p>{presentation.goose}</p></div>
    <section className="result-decision"><p>{t.suggestion}</p><div className="result-heading"><h1>{presentation.title}</h1>{context.nextAnchor ? <span className="anchor-badge"><Icon name="lock" />{context.nextAnchor.time}</span> : null}</div><p className="result-summary">{presentation.summary}</p></section>
    <p className="current-time"><span aria-hidden="true">◷</span><strong>{t.now} {result.currentLocalTime}</strong><small>{t.timeBasis}</small></p>
    <div className="time-blocks">{result.steps.map((step, index) => <article key={`${result.strategy}-${index}`} className={step.anchor ? "time-block fixed-anchor" : "time-block"}><small>{step.label}</small><div className="time-block-title"><span aria-hidden="true">{stepIcon(step)}</span><strong>{step.title}</strong></div><p>{step.detail}</p>{step.map ? <div className="step-map-row"><button className="step-map-action" type="button" onClick={() => openMap(step.map!)}><span aria-hidden="true">⌖</span>{step.map.label}<Icon name="arrow" /></button>{preferredMap ? <small className="map-preference">{MAP_LABELS[preferredMap]} · <button className="change-map-action" type="button" onClick={() => setMapAction(step.map!)}>{t.changeMap}</button></small> : null}</div> : null}</article>)}</div>{result.revisit ? <p className="revisit-note">{result.revisit}</p> : null}
    <section className="why-section"><h2><span aria-hidden="true">💡</span>{t.why}</h2><p>{result.why}</p>{visibleEvidence.length ? <div className="evidence">{visibleEvidence.map((item) => <b key={item}>{item}</b>)}</div> : null}</section>
    <section className="steer-section"><h2><span aria-hidden="true">✎</span>{t.steer}</h2><form className="steer-input" onSubmit={submitSteer}><VoiceInput compact locale={locale} value={steerText} onChange={(value) => { setSteerText(value); setSteerError(""); }} placeholder={t.steerPlaceholder} ariaLabel={t.steerPlaceholder} /><button className="steer-submit" type="submit" disabled={!steerText.trim()} aria-label={t.steerSubmit}><Icon name="arrow" /></button></form><div className="steer-actions">{t.steerOptions.map((option) => <button type="button" key={option.id} className={steerText === option.label ? "selected" : ""} onClick={() => { setSteerText(option.label); setSteerError(""); }}>{option.label}</button>)}</div>{steerError ? <p className="form-error" role="alert">{steerError}</p> : null}</section>
    <button className="text-action" type="button" onClick={onEdit}>{t.edit}</button>
    {pending ? <div className="adjust-processing"><GooseProcessing locale={locale} message={t.adjustLoading} onComplete={() => { onSteer(pending); setPending(null); screen.current?.scrollTo({top:0}); }} /></div> : null}
    {mapAction ? <div className="sheet-layer"><button className="sheet-backdrop" type="button" aria-label={t.mapClose} onClick={() => setMapAction(null)} /><section className="map-sheet" role="dialog" aria-modal="true" aria-labelledby="map-title"><div className="sheet-handle" /><h2 id="map-title">{t.mapTitle}</h2><p>{t.mapCopy}<strong>{mapAction.query}</strong></p><div className="map-links">{mapLinks.map((link) => <a key={link.id} href={link.href} target="_blank" rel="noreferrer" onClick={() => { rememberMap(link.id); setMapAction(null); }}><span>{link.label}</span><Icon name="arrow" /></a>)}</div><button className="text-action" type="button" onClick={() => setMapAction(null)}>{t.mapClose}</button></section></div> : null}
  </section>;
}

function LandmarkPreview({ landmarkId }: { landmarkId: LandmarkId }) {
  return <div className={`landmark-preview landmark-${landmarkId}`} aria-hidden="true"><span className="sun-disc" /><span className="cathedral-body" /><span className="cathedral-tower" /><span className="cathedral-spire" /></div>;
}

function Lens({ locale, state, landmarkId, narrative, onLookup, onNarrative, onReset }: { locale: Locale; state: LensState; landmarkId: LandmarkId | null; narrative: LandmarkNarrative; onLookup: (query: string) => void; onNarrative: (value: LandmarkNarrative) => void; onReset: () => void }) {
  const t = copy[locale];
  const [query, setQuery] = useState("");
  if (state === "notFound") return <section className="lens-not-found app-screen"><span className="not-found-mark">?</span><p className="eyebrow">LENS BETA</p><h1>{t.notFound}</h1><p>{t.notFoundCopy}</p><button className="primary-action" type="button" onClick={onReset}>{t.another}</button></section>;
  if (state === "result" && landmarkId) {
    const landmark = landmarks[landmarkId].content[locale];
    const guide = landmark.narratives[narrative];
    return <section className="lens-result app-screen"><div className="lens-heading"><LandmarkPreview landmarkId={landmarkId} /><div><p className="eyebrow">{t.lookingAt}</p><h1>{landmark.name}</h1>{landmark.location ? <p>{landmark.location}</p> : null}</div></div><article className="lens-story"><p className="eyebrow">{t.oneThing}</p><h2>{guide.title}</h2>{guide.paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}{guide.sections?.map((section) => <section key={section.title}><strong>{section.title}</strong><p>{section.body}</p></section>)}</article><aside className="look-up"><strong>{t.lookUp}</strong><p>{landmark.lookUp}</p></aside><div className="lens-modes">{t.modes.map((mode) => <button type="button" key={mode.id} className={narrative === mode.id ? "selected" : ""} onClick={() => onNarrative(mode.id)}>{mode.label}</button>)}</div><button className="text-action" type="button" onClick={onReset}>{t.another}</button></section>;
  }
  const submit = (event: FormEvent) => { event.preventDefault(); if (query.trim()) onLookup(query); };
  const examples = locale === "zh" ? ["米兰大教堂", "塞维利亚大教堂", "圣家堂"] : ["Milan Cathedral", "Seville Cathedral", "Sagrada Família"];
  return <section className="lens-home app-screen"><p className="eyebrow">LENS BETA</p><h1>{t.lensTitle}</h1><p className="lens-intro">{t.lensIntro}</p><div className="beta-note"><Icon name="spark" /><span>{t.lensLimit}</span></div><form onSubmit={submit}><label><strong>{t.lensLabel}</strong><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={t.lensPlaceholder} /></label><button className="primary-action" type="submit" disabled={!query.trim()}>{t.lensSubmit}<Icon name="arrow" /></button></form><div className="supported-places"><small>{t.lensTry}</small>{examples.map((example) => <button type="button" key={example} onClick={() => onLookup(example)}>{example}</button>)}</div></section>;
}

function BottomNav({ locale, active, onChange }: { locale: Locale; active: AppTab; onChange: (tab: AppTab) => void }) {
  const t = copy[locale];
  return <nav className="bottom-navigation" aria-label={t.navLabel}>{t.nav.map((item) => <button type="button" key={item.id} className={active === item.id ? "active" : ""} aria-current={active === item.id ? "page" : undefined} onClick={() => onChange(item.id)}>{item.id === "decision" ? <Icon name="compass" /> : <Icon name="lens" />}<b>{item.label}</b></button>)}</nav>;
}

export default function Home() {
  const [locale, setLocale] = useState<Locale>(getInitialLocale);
  const [activeTab, setActiveTab] = useState<AppTab>("decision");
  const [decisionScreen, setDecisionScreen] = useState<DecisionScreen>("form");
  const [context, setContext] = useState<DecisionContext | null>(null);
  const [steering, setSteering] = useState<Steering | null>(null);
  const [lensState, setLensState] = useState<LensState>("idle");
  const [selectedLandmark, setSelectedLandmark] = useState<LandmarkId | null>(null);
  const [narrative, setNarrative] = useState<LandmarkNarrative>("short");
  const t = copy[locale];

  useEffect(() => {
    document.documentElement.lang = locale === "zh" ? "zh-CN" : "en";
    document.title = t.pageTitle;
    document.querySelector<HTMLMetaElement>('meta[name="description"]')?.setAttribute("content", t.pageDescription);
    try { window.localStorage.setItem(LANGUAGE_KEY, locale); } catch { /* Persistence is optional. */ }
  }, [locale, t.pageDescription, t.pageTitle]);

  const result = context ? localDecisionEngine(context, locale, steering ?? undefined) : null;
  const decide = (nextContext: DecisionContext) => { setContext(nextContext); setSteering(null); setDecisionScreen("result"); };
  const steer = (state: Steering) => {
    if (!context) return;
    const intent = state.intent === "spontaneous" && !state.indoors && result?.strategy === "flexible" ? "explore" : state.intent;
    setContext({ ...context, ...readCurrentClock() });
    setSteering({ ...state, intent });
  };
  const lookup = (query: string) => { const match = findLandmark(query); setNarrative("short"); setSelectedLandmark(match?.id ?? null); setLensState(match ? "result" : "notFound"); };
  const resetLens = () => { setSelectedLandmark(null); setNarrative("short"); setLensState("idle"); };
  const showBack = activeTab === "decision" ? decisionScreen === "result" : lensState !== "idle";
  const back = () => activeTab === "decision" ? setDecisionScreen("form") : resetLens();

  return <main className="app-shell"><Header locale={locale} showBack={showBack} onBack={back} onLocale={setLocale} />{activeTab === "decision" && decisionScreen === "form" ? <DecisionForm locale={locale} initialContext={context} onDecide={decide} /> : null}{activeTab === "decision" && decisionScreen === "result" && context && result ? <DecisionView locale={locale} context={context} result={result} onSteer={steer} onEdit={() => setDecisionScreen("form")} /> : null}{activeTab === "lens" ? <Lens locale={locale} state={lensState} landmarkId={selectedLandmark} narrative={narrative} onLookup={lookup} onNarrative={setNarrative} onReset={resetLens} /> : null}<BottomNav locale={locale} active={activeTab} onChange={setActiveTab} /></main>;
}
