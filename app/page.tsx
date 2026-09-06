import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import { createMapLinks, localDecisionEngine, type CurrentState, type DecisionContext, type DecisionResult } from "./decision-engine";
import { findLandmark, landmarks, type LandmarkId, type LandmarkNarrative, type Locale } from "./mock-data";

type AppTab = "decision" | "lens";
type DecisionScreen = "form" | "result";
type LensState = "idle" | "result" | "notFound";
type IconName = "arrow" | "check" | "compass" | "lens" | "lock" | "map" | "spark";

const LANGUAGE_KEY = "in-trip-decision-locale";

const copy = {
  zh: {
    appName: "In-trip Decision", language: "切换语言", back: "返回", navLabel: "主导航",
    nav: [{ id: "decision" as const, label: "下一步" }, { id: "lens" as const, label: "识景 Beta" }],
    headline: "接下来呢？", intro: "计划变了，或者只是现在不想照原计划走，都可以从下一步开始。",
    changeLabel: "发生什么了？", changePlaceholder: "比如：博物馆关了。",
    changeChips: ["原计划去不了了", "临时多出时间", "现在有点累", "不想继续原计划"],
    placeLabel: "你现在大概在哪？", placePlaceholder: "例如：米兰大教堂",
    anchorLabel: "接下来有不能错过的安排吗？", anchorOptional: "可选", anchorNone: "没有固定安排", anchorTime: "时间", anchorTimePlaceholder: "19:00", anchorPlace: "地点 / 安排名称", anchorPlacePlaceholder: "例如：Navigli 晚餐",
    stateLabel: "现在呢？", stateOptional: "可以不选",
    states: [{ id: "tired" as const, label: "有点累" }, { id: "lessWalking" as const, label: "不想走太远" }, { id: "explore" as const, label: "还想继续逛" }, { id: "spontaneous" as const, label: "想随性一点" }],
    submit: "决定下一步", requiredChange: "先告诉我发生了什么。", requiredPlace: "还需要一个大概位置。", incompleteAnchor: "固定安排的时间和名称需要一起填写。",
    resultEyebrow: "最推荐", why: "为什么这样安排？", evidence: "这次优先考虑", steer: "想换个方向？",
    steerOptions: [{ id: "lessWalking" as const, label: "少走一点" }, { id: "explore" as const, label: "还想多逛" }, { id: "spontaneous" as const, label: "更随性一点" }],
    mapAction: "在地图里找", mapTitle: "用哪个地图打开？", mapCopy: "地图会搜索：", mapClose: "关闭", edit: "修改刚才的信息",
    lensTitle: "识景 Beta", lensIntro: "输入眼前的景点名称，先听刚好够用的那一段。", lensLimit: "Beta 当前支持有限地点", lensLabel: "景点名称", lensPlaceholder: "例如：米兰大教堂", lensSubmit: "讲给我听", lensTry: "当前支持",
    lookingAt: "你正在看", oneThing: "先知道这一件事就够了", lookUp: "抬头找找 👀",
    modes: [{ id: "short" as const, label: "30 秒讲完" }, { id: "story" as const, label: "讲个有意思的故事" }, { id: "detail" as const, label: "详细一点" }],
    another: "换一个景点", notFound: "这个地点目前还没有收录", notFoundCopy: "Beta 当前支持米兰大教堂、塞维利亚大教堂和圣家堂。",
    pageTitle: "In-trip Decision · 接下来呢？", pageDescription: "旅行正在进行时，只决定接下来 1–3 小时怎么过。",
  },
  en: {
    appName: "In-trip Decision", language: "Switch language", back: "Back", navLabel: "Main navigation",
    nav: [{ id: "decision" as const, label: "Next move" }, { id: "lens" as const, label: "Lens Beta" }],
    headline: "What’s next?", intro: "Plans changed—or you simply do not feel like following them. Start with the next move.",
    changeLabel: "What changed?", changePlaceholder: "For example: The museum is closed.",
    changeChips: ["Original plan fell through", "Unexpected free time", "I feel tired", "I want a different plan"],
    placeLabel: "Roughly where are you?", placePlaceholder: "For example: Milan Cathedral",
    anchorLabel: "Anything you cannot miss next?", anchorOptional: "Optional", anchorNone: "No fixed plan", anchorTime: "Time", anchorTimePlaceholder: "19:00", anchorPlace: "Place / plan", anchorPlacePlaceholder: "For example: Dinner in Navigli",
    stateLabel: "How are you now?", stateOptional: "Optional",
    states: [{ id: "tired" as const, label: "A little tired" }, { id: "lessWalking" as const, label: "Less walking" }, { id: "explore" as const, label: "Still want to explore" }, { id: "spontaneous" as const, label: "Keep it spontaneous" }],
    submit: "Decide what’s next", requiredChange: "Tell me what changed first.", requiredPlace: "Add your rough location.", incompleteAnchor: "Add both the time and name of the fixed plan.",
    resultEyebrow: "BEST NEXT MOVE", why: "Why this decision?", evidence: "Prioritised this time", steer: "Want a different direction?",
    steerOptions: [{ id: "lessWalking" as const, label: "Less walking" }, { id: "explore" as const, label: "More active" }, { id: "spontaneous" as const, label: "More spontaneous" }],
    mapAction: "Find it in Maps", mapTitle: "Open with", mapCopy: "Maps will search for:", mapClose: "Close", edit: "Edit context",
    lensTitle: "Lens Beta", lensIntro: "Enter the landmark in front of you for an explanation that is just long enough.", lensLimit: "Beta currently supports a limited set of places", lensLabel: "Landmark name", lensPlaceholder: "For example: Milan Cathedral", lensSubmit: "Tell me about it", lensTry: "Currently supported",
    lookingAt: "You’re looking at", oneThing: "One thing worth knowing", lookUp: "Look up 👀",
    modes: [{ id: "short" as const, label: "30-second version" }, { id: "story" as const, label: "Tell me a story" }, { id: "detail" as const, label: "A little more detail" }],
    another: "Try another place", notFound: "This place is not included yet", notFoundCopy: "The Beta currently supports Milan Cathedral, Seville Cathedral, and Sagrada Família.",
    pageTitle: "In-trip Decision · What’s next?", pageDescription: "When travel changes, decide only how to spend the next one to three hours.",
  },
} as const;

function getInitialLocale(): Locale {
  try { return window.localStorage.getItem(LANGUAGE_KEY) === "en" ? "en" : "zh"; } catch { return "zh"; }
}

function Icon({ name }: { name: IconName }) {
  const paths: Record<IconName, ReactNode> = {
    arrow: <><path d="M5 12h14" /><path d="m14 7 5 5-5 5" /></>,
    check: <path d="m5 12 4 4L19 6" />,
    compass: <><circle cx="12" cy="12" r="9" /><path d="m15.5 8.5-2 5-5 2 2-5Z" /></>,
    lens: <><circle cx="10.5" cy="10.5" r="6.5" /><path d="m15.5 15.5 4 4" /></>,
    lock: <><rect width="16" height="12" x="4" y="10" rx="2" /><path d="M8 10V7a4 4 0 0 1 8 0v3" /></>,
    map: <><path d="m3 6 6-3 6 3 6-3v15l-6 3-6-3-6 3Z" /><path d="M9 3v15M15 6v15" /></>,
    spark: <><path d="m12 3-1.7 4.3L6 9l4.3 1.7L12 15l1.7-4.3L18 9l-4.3-1.7Z" /><path d="m5 15-.8 2.2L2 18l2.2.8L5 21l.8-2.2L8 18l-2.2-.8Z" /></>,
  };
  return <svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">{paths[name]}</svg>;
}

function Header({ locale, showBack, onBack, onLocale }: { locale: Locale; showBack: boolean; onBack: () => void; onLocale: (locale: Locale) => void }) {
  const t = copy[locale];
  return <header className="product-header">
    {showBack ? <button className="back-button" type="button" onClick={onBack} aria-label={t.back}>←</button> : <span className="header-spacer" />}
    <strong>{t.appName}</strong>
    <div className="language-toggle" role="group" aria-label={t.language}><button type="button" className={locale === "zh" ? "active" : ""} onClick={() => onLocale("zh")} aria-pressed={locale === "zh"}>中</button><span>|</span><button type="button" className={locale === "en" ? "active" : ""} onClick={() => onLocale("en")} aria-pressed={locale === "en"}>EN</button></div>
  </header>;
}

function DecisionForm({ locale, initialContext, onDecide }: { locale: Locale; initialContext: DecisionContext | null; onDecide: (context: DecisionContext) => void }) {
  const t = copy[locale];
  const [change, setChange] = useState(initialContext?.change ?? "");
  const [currentPlace, setCurrentPlace] = useState(initialContext?.currentPlace ?? "");
  const [anchorTime, setAnchorTime] = useState(initialContext?.nextAnchor?.time ?? "");
  const [anchorPlace, setAnchorPlace] = useState(initialContext?.nextAnchor?.place ?? "");
  const [noAnchor, setNoAnchor] = useState(initialContext ? initialContext.nextAnchor === null : false);
  const [states, setStates] = useState<CurrentState[]>(initialContext?.currentState ?? []);
  const [error, setError] = useState("");

  const toggleState = (state: CurrentState) => setStates((current) => current.includes(state) ? [] : [state]);
  const submit = (event: FormEvent) => {
    event.preventDefault();
    const trimmedChange = change.trim();
    const trimmedPlace = currentPlace.trim();
    if (!trimmedChange) return setError(t.requiredChange);
    if (!trimmedPlace) return setError(t.requiredPlace);
    if (!noAnchor && Boolean(anchorTime.trim()) !== Boolean(anchorPlace.trim())) return setError(t.incompleteAnchor);
    setError("");
    onDecide({ change: trimmedChange, currentPlace: trimmedPlace, currentTime: new Date().toISOString(), nextAnchor: !noAnchor && anchorTime.trim() && anchorPlace.trim() ? { time: anchorTime.trim(), place: anchorPlace.trim() } : null, currentState: states, preferences: {} });
  };

  return <form className="decision-form app-screen" onSubmit={submit} noValidate>
    <section className="hero-copy"><p className="eyebrow">NEXT MOVE</p><h1>{t.headline}</h1><p>{t.intro}</p></section>
    <fieldset className="form-section"><legend>{t.changeLabel}</legend><textarea value={change} onChange={(event) => setChange(event.target.value)} placeholder={t.changePlaceholder} rows={3} /><div className="chip-row">{t.changeChips.map((chip) => <button type="button" key={chip} className={change === chip ? "selected" : ""} onClick={() => setChange(chip)}>{chip}</button>)}</div></fieldset>
    <label className="form-section"><strong>{t.placeLabel}</strong><input value={currentPlace} onChange={(event) => setCurrentPlace(event.target.value)} placeholder={t.placePlaceholder} /></label>
    <fieldset className="form-section anchor-section"><legend>{t.anchorLabel} <span>{t.anchorOptional}</span></legend><button type="button" className={`no-anchor-toggle ${noAnchor ? "selected" : ""}`} aria-pressed={noAnchor} onClick={() => setNoAnchor((current) => !current)}><span>{noAnchor ? <Icon name="check" /> : null}</span>{t.anchorNone}</button>{!noAnchor ? <div className="anchor-fields"><label><span>{t.anchorTime}</span><input inputMode="numeric" value={anchorTime} onChange={(event) => setAnchorTime(event.target.value)} placeholder={t.anchorTimePlaceholder} /></label><label><span>{t.anchorPlace}</span><input value={anchorPlace} onChange={(event) => setAnchorPlace(event.target.value)} placeholder={t.anchorPlacePlaceholder} /></label></div> : null}</fieldset>
    <fieldset className="form-section"><legend>{t.stateLabel} <span>{t.stateOptional}</span></legend><div className="chip-row state-chips">{t.states.map((state) => <button type="button" key={state.id} className={states.includes(state.id) ? "selected" : ""} aria-pressed={states.includes(state.id)} onClick={() => toggleState(state.id)}>{state.label}</button>)}</div></fieldset>
    {error ? <p className="form-error" role="alert">{error}</p> : null}<button className="primary-action" type="submit">{t.submit}<Icon name="arrow" /></button>
  </form>;
}

function DecisionView({ locale, context, result, onSteer, onEdit }: { locale: Locale; context: DecisionContext; result: DecisionResult; onSteer: (state: CurrentState) => void; onEdit: () => void }) {
  const t = copy[locale];
  const [mapsOpen, setMapsOpen] = useState(false);
  const mapLinks = createMapLinks(result.mapQuery);
  return <section className="decision-result app-screen" aria-live="polite">
    <div className="result-heading"><div><p className="eyebrow">{t.resultEyebrow}</p><h1>{result.title}</h1></div>{context.nextAnchor ? <span className="anchor-badge"><Icon name="lock" />{context.nextAnchor.time}</span> : null}</div>
    <p className="result-summary">{result.summary}</p><p className="horizon">{result.horizon}</p>
    <ol className="strategy-timeline">{result.steps.map((step, index) => <li key={`${result.strategy}-${index}`} className={step.anchor ? "anchor" : ""}><span className="timeline-dot">{step.anchor ? <Icon name="lock" /> : null}</span><div><small>{step.label}</small><strong>{step.title}</strong><p>{step.detail}</p></div></li>)}</ol>
    <section className="why-card"><span><Icon name="spark" /></span><div><h2>{t.why}</h2><p>{result.why}</p><div className="evidence"><small>{t.evidence}</small>{result.evidence.map((item) => <b key={item}>{item}</b>)}</div></div></section>
    <section className="steer-section"><h2>{t.steer}</h2><div className="steer-actions">{t.steerOptions.map((option) => <button type="button" key={option.id} className={result.strategy === (option.id === "lessWalking" ? "rest" : option.id === "explore" ? "explore" : "flexible") ? "selected" : ""} onClick={() => onSteer(option.id)}>{option.label}</button>)}</div></section>
    <button className="primary-action map-action" type="button" onClick={() => setMapsOpen(true)}><Icon name="map" />{t.mapAction}<Icon name="arrow" /></button><button className="text-action" type="button" onClick={onEdit}>{t.edit}</button>
    {mapsOpen ? <div className="sheet-layer"><button className="sheet-backdrop" type="button" aria-label={t.mapClose} onClick={() => setMapsOpen(false)} /><section className="map-sheet" role="dialog" aria-modal="true" aria-labelledby="map-title"><div className="sheet-handle" /><h2 id="map-title">{t.mapTitle}</h2><p>{t.mapCopy}<strong>{result.mapQuery}</strong></p><div className="map-links">{mapLinks.map((link) => <a key={link.id} href={link.href} target="_blank" rel="noreferrer"><span>{link.label}</span><Icon name="arrow" /></a>)}</div><button className="text-action" type="button" onClick={() => setMapsOpen(false)}>{t.mapClose}</button></section></div> : null}
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
  const [steering, setSteering] = useState<CurrentState | null>(null);
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
  const steer = (state: CurrentState) => { if (context) setSteering(state); };
  const lookup = (query: string) => { const match = findLandmark(query); setNarrative("short"); setSelectedLandmark(match?.id ?? null); setLensState(match ? "result" : "notFound"); };
  const resetLens = () => { setSelectedLandmark(null); setNarrative("short"); setLensState("idle"); };
  const showBack = activeTab === "decision" ? decisionScreen === "result" : lensState !== "idle";
  const back = () => activeTab === "decision" ? setDecisionScreen("form") : resetLens();

  return <main className="app-shell"><Header locale={locale} showBack={showBack} onBack={back} onLocale={setLocale} />{activeTab === "decision" && decisionScreen === "form" ? <DecisionForm locale={locale} initialContext={context} onDecide={decide} /> : null}{activeTab === "decision" && decisionScreen === "result" && context && result ? <DecisionView locale={locale} context={context} result={result} onSteer={steer} onEdit={() => setDecisionScreen("form")} /> : null}{activeTab === "lens" ? <Lens locale={locale} state={lensState} landmarkId={selectedLandmark} narrative={narrative} onLookup={lookup} onNarrative={setNarrative} onReset={resetLens} /> : null}<BottomNav locale={locale} active={activeTab} onChange={setActiveTab} /></main>;
}
