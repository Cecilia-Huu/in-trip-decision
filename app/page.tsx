import { useEffect, useRef, useState, type ReactNode } from "react";
import { itinerary, plans, selectInitialPlan, type Constraint, type PlanBlock, type PlanVariant } from "./mock-data";

type Screen = "live" | "context" | "plan";
type IconName = "arrow" | "check" | "lock" | "map" | "plan" | "search" | "spark" | "walk";

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

function ProductHeader({ screen, onBack }: { screen: Screen; onBack: () => void }) {
  return <header className="product-header">
    {screen === "live" ? <div className="icon-button" aria-hidden="true"><span className="monogram">ID</span></div> : <button className="icon-button" type="button" onClick={onBack} aria-label="Go back"><span className="back-glyph">←</span></button>}
    <div className="trip-heading"><span>Seville getaway</span><strong>Tue, Dec 24 · Day 2</strong></div>
    <div className="step-indicator" aria-label={`${screen === "live" ? 1 : screen === "context" ? 2 : 3} of 3`}>
      {["live", "context", "plan"].map((step) => <i key={step} className={step === screen ? "current" : ""} />)}
    </div>
  </header>;
}

function BottomNavigation() {
  return <nav className="bottom-navigation" aria-label="Trip navigation">
    <span className="active"><Icon name="plan" /><b>Plan</b></span>
    <span><Icon name="map" /><b>Map</b></span>
    <span><Icon name="search" /><b>Explore</b></span>
  </nav>;
}

function LiveItinerary({ onRepair }: { onRepair: () => void }) {
  return <section className="app-screen live-screen" aria-labelledby="live-title">
    <div className="screen-intro"><p className="eyebrow">Today’s plan</p><h2 id="live-title">Three stops in Seville</h2><p>2.4 km planned · dinner reserved at 18:30</p></div>
    <ol className="itinerary-list">
      {itinerary.map((stop, index) => <li key={stop.id} className={`itinerary-stop ${stop.status}`}>
        <span className="stop-marker">{stop.status === "done" ? <Icon name="check" /> : index + 1}</span>
        <div className="stop-time">{stop.time}</div>
        <article><div><strong>{stop.title}</strong>{stop.status === "anchor" ? <span className="tiny-lock"><Icon name="lock" /> Fixed</span> : null}</div><p>{stop.meta}</p></article>
        {index === 0 ? <div className="travel-connector"><Icon name="walk" /> 8 min walk</div> : null}
        {index === 1 ? <div className="travel-connector gap"><span>135 min open gap</span></div> : null}
      </li>)}
    </ol>
    <aside className="recovery-prompt">
      <div className="prompt-icon"><Icon name="spark" /></div>
      <div><strong>Schedule issue detected</strong><p>Repair only this gap. Keep dinner untouched.</p></div>
      <button type="button" onClick={onRepair}>Repair this gap <Icon name="arrow" /></button>
    </aside>
  </section>;
}

function ContextInput({ note, constraint, processing, onNoteChange, onConstraint, onSubmit, onSkip }: {
  note: string; constraint: Constraint | null; processing: boolean; onNoteChange: (value: string) => void; onConstraint: (value: Constraint) => void; onSubmit: () => void; onSkip: () => void;
}) {
  const chips: Array<{ value: Constraint; label: string }> = [
    { value: "less", label: "Less walking" },
    { value: "explore", label: "Still want to explore" },
    { value: "decide", label: "You decide" },
  ];
  return <section className="app-screen context-screen" aria-labelledby="context-title">
    <div className="gap-summary"><span>16:05</span><div><b>Royal Alcázar closed</b><i>→</i><b>18:30 dinner locked</b></div></div>
    <div className="context-sheet">
      <p className="eyebrow">Optional context</p><h2 id="context-title">Anything I should know right now?</h2><p className="sheet-copy">Say one thing, tap one constraint—or say nothing.</p>
      <label className="context-field"><span className="sr-only">Describe how you feel right now</span><textarea value={note} onChange={(event) => onNoteChange(event.target.value)} placeholder="My feet hurt, but I don’t want to end the day…" /></label>
      <div className="constraint-chips" aria-label="Quick constraints">{chips.map((chip) => <button type="button" key={chip.value} className={constraint === chip.value ? "selected" : ""} aria-pressed={constraint === chip.value} onClick={() => onConstraint(chip.value)}>{chip.label}</button>)}</div>
      <p className="fallback-note"><Icon name="spark" /> No answer required. Missing context produces a conservative plan.</p>
      {processing ? <div className="processing-state" role="status"><span /><div><strong>Protecting your 18:30 anchor…</strong><p>Filtering infeasible stops and rebuilding the gap.</p></div></div> : <div className="context-actions"><button className="primary-action" type="button" onClick={onSubmit}>Replan the next 135 min <Icon name="arrow" /></button><button className="quiet-action" type="button" onClick={onSkip}>Skip · use what you know</button></div>}
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

function RecoveryPlanView({ variant, flowing, accepted, onLessWalking, onMoreActive, onAccept, onReplay }: {
  variant: PlanVariant; flowing: boolean; accepted: boolean; onLessWalking: () => void; onMoreActive: () => void; onAccept: () => void; onReplay: () => void;
}) {
  const plan = plans[variant];
  return <section className={`app-screen plan-screen variant-${variant} ${flowing ? "flowing" : ""}`} aria-labelledby="plan-title">
    <div className="plan-heading"><div><p className="eyebrow">Updated itinerary</p><h2 id="plan-title">Gap repaired.</h2></div><span className="anchor-lock"><Icon name="lock" /> 18:30 locked</span></div>
    <p className="plan-summary">{plan.summary}</p>
    <div className="plan-metric"><Icon name="walk" /><span>{plan.walking}</span><i>·</i><span>{plan.buffer}</span></div>
    <ol className="recovery-timeline" aria-live="polite">{plan.blocks.map((block) => <PlanItem key={`${variant}-${block.id}`} block={block} />)}</ol>
    <div className="why-card"><span><Icon name="spark" /></span><p><strong>Why this works now</strong>{plan.reason}</p></div>
    <div className="steer-actions"><button type="button" onClick={onMoreActive}>More active</button><button type="button" className={variant === "less" ? "selected" : ""} onClick={onLessWalking}>Less walking</button><button type="button" className="accept-action" onClick={onAccept}>Accept</button></div>
    {accepted ? <div className="accepted-toast" role="status"><Icon name="check" /><span>Plan accepted. Back to the trip.</span><button type="button" onClick={onReplay}>Replay</button></div> : null}
  </section>;
}

function ProductStory() {
  return <aside className="product-story">
    <div className="concept-label"><span /> Interactive concept demo</div>
    <p className="story-kicker">IN-TRIP DECISION · GAP RECOVERY</p>
    <h1>Not the best place.<br /><em>The best next move.</em></h1>
    <p className="story-lead">A low-friction AI interaction that repairs the next 120 minutes when a travel plan breaks.</p>
    <p className="story-cn">当旅途中一个节点失效，只重排现在到下一个固定安排之间的空档。</p>
    <ul className="principles" aria-label="Product principles">
      <li><span>01</span><div><strong>Less input</strong><p>Say one thing—or nothing.</p></div></li>
      <li><span>02</span><div><strong>One next move</strong><p>No recommendation grid.</p></div></li>
      <li><span>03</span><div><strong>Easy to steer</strong><p>Correct the plan in one tap.</p></div></li>
      <li><span>04</span><div><strong>Back to the trip</strong><p>Keep attention off the screen.</p></div></li>
    </ul>
    <p className="prototype-note">Mocked Seville context with client-side state orchestration to demonstrate the interaction model.</p>
  </aside>;
}

export default function Home() {
  const [screen, setScreen] = useState<Screen>("live");
  const [note, setNote] = useState("");
  const [constraint, setConstraint] = useState<Constraint | null>(null);
  const [variant, setVariant] = useState<PlanVariant>("default");
  const [processing, setProcessing] = useState(false);
  const [flowing, setFlowing] = useState(false);
  const [accepted, setAccepted] = useState(false);
  const timers = useRef<number[]>([]);

  useEffect(() => () => timers.current.forEach(window.clearTimeout), []);

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

  return <main className="release-page">
    <ProductStory />
    <section className="device-stage" aria-label="Interactive Gap Recovery prototype">
      <div className="device-frame">
        <div className="device-island" aria-hidden="true" />
        <div className="status-bar"><span>16:05</span><span>● ◒ ▰</span></div>
        <div className="product-surface">
          <ProductHeader screen={screen} onBack={goBack} />
          {screen === "live" ? <LiveItinerary onRepair={() => setScreen("context")} /> : null}
          {screen === "context" ? <ContextInput note={note} constraint={constraint} processing={processing} onNoteChange={setNote} onConstraint={(value) => setConstraint((current) => current === value ? null : value)} onSubmit={() => createPlan(true)} onSkip={() => createPlan(false)} /> : null}
          {screen === "plan" ? <RecoveryPlanView variant={variant} flowing={flowing} accepted={accepted} onLessWalking={() => steer("less")} onMoreActive={() => steer("active")} onAccept={() => setAccepted(true)} onReplay={replay} /> : null}
          <BottomNavigation />
        </div>
      </div>
      <p className="mobile-disclosure">Concept prototype · mocked context</p>
    </section>
  </main>;
}
